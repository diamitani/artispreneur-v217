"""
Hermes Agent Provisioner — AWS Lambda
Multi-tenant shared Hermes runtime. Each user gets an isolated workspace namespace.
Enterprise/high-usage plans get dedicated instances. Everyone else shares.
"""
import json, os, boto3, uuid

s3 = boto3.client("s3")
ec2 = boto3.client("ec2")
BUCKET = "artispreneur-outputs"

# Shared Hermes runtime (all free/artist/pro users share this)
SHARED_HERMES_HOST = os.getenv("HERMES_SHARED_HOST", "hermes.artispreneur.internal")


def provision_workspace(username: str, user_data: dict, plan: str = "free") -> dict:
    """Provision an isolated workspace on the shared multi-tenant Hermes runtime.
    
    Architecture:
    - Free/Artist/Pro plans → shared Hermes instance, isolated namespace
    - Label/Enterprise → dedicated EC2 instance
    """
    
    workspace_id = f"ws-{uuid.uuid4().hex[:12]}"
    namespace = f"users/{username}"
    
    # Create S3 workspace structure
    folders = [
        f"{namespace}/.rostr/state/",
        f"{namespace}/.rostr/context/",
        f"{namespace}/knowledge-base/",
        f"{namespace}/outputs/contracts/",
        f"{namespace}/outputs/epks/",
        f"{namespace}/outputs/voiceovers/",
        f"{namespace}/catalog/",
        f"{namespace}/profile/",
        f"{namespace}/skills/",
    ]
    for folder in folders:
        s3.put_object(Bucket=BUCKET, Key=folder)
    
    # Save soul.md
    soul = user_data.get("soul_md", f"# {username}\n# Created: {user_data.get('created_at','')}")
    s3.put_object(Bucket=BUCKET, Key=f"{namespace}/.rostr/soul.md", Body=soul)
    
    # Save profile
    s3.put_object(Bucket=BUCKET, Key=f"{namespace}/knowledge-base/profile.json",
                  Body=json.dumps(user_data))
    
    result = {
        "workspace_id": workspace_id,
        "username": username,
        "plan": plan,
        "namespace": namespace,
        "hermes_host": SHARED_HERMES_HOST,
        "s3_path": f"s3://{BUCKET}/{namespace}/",
        "status": "active",
    }
    
    # Enterprise gets dedicated EC2
    if plan in ("label", "enterprise"):
        result.update(_provision_dedicated(username, user_data))
    
    return result


def _provision_dedicated(username: str, user_data: dict) -> dict:
    """Provision dedicated EC2 for Label/Enterprise plans."""
    resp = ec2.run_instances(
        ImageId=os.getenv("HERMES_AMI", "ami-0c55b159cbfafe1f0"),
        InstanceType="t3.medium",
        KeyName=os.getenv("HERMES_KEY_NAME", "artispreneur-hermes"),
        MinCount=1, MaxCount=1,
        TagSpecifications=[{
            "ResourceType": "instance",
            "Tags": [{"Key": "Name", "Value": f"hermes-{username}"},
                     {"Key": "Product", "Value": "Artispreneur"},
                     {"Key": "Plan", "Value": "enterprise"}],
        }],
    )
    instance_id = resp["Instances"][0]["InstanceId"]
    return {
        "dedicated_instance": instance_id,
        "instance_type": "t3.medium",
        "endpoint": f"http://{instance_id}:8080",
        "estimated_ready": "5 minutes",
    }


def handler(event, context):
    body = json.loads(event.get("body", "{}"))
    username = body.get("username", "").lower().replace(" ", "-")
    plan = body.get("plan", "free")
    if not username:
        return {"statusCode": 400, "body": json.dumps({"error": "username required"})}
    result = provision_workspace(username, body.get("user_data", {}), plan)
    return {"statusCode": 200, "body": json.dumps(result)}
