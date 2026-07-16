"""
Hermes Agent Provisioner — AWS Lambda
Creates per-user EC2 instance with Hermes Agent + ROSTR framework pre-installed.
"""
import json, os, boto3, time

ec2 = boto3.client("ec2")
s3 = boto3.client("s3")

AMI_ID = os.getenv("HERMES_AMI", "ami-0c55b159cbfafe1f0")  # Ubuntu 24.04 LTS
INSTANCE_TYPE = os.getenv("HERMES_INSTANCE_TYPE", "t3.micro")
KEY_NAME = os.getenv("HERMES_KEY_NAME", "artispreneur-hermes")
SG_ID = os.getenv("HERMES_SG_ID", "")  # Security group with SSH + 8080 open
SUBNET_ID = os.getenv("HERMES_SUBNET_ID", "")

USER_DATA_SCRIPT = """#!/bin/bash
# Hermes Agent auto-install on boot
set -e
exec > /var/log/hermes-install.log 2>&1

echo "=== Hermes Agent Provisioning ==="
echo "User: {username}"
echo "Started: $(date)"

# System deps
apt-get update -qq
apt-get install -y -qq python3 python3-pip python3-venv git curl unzip

# Install Hermes Agent
cd /opt
git clone https://github.com/nousresearch/hermes-agent.git
cd hermes-agent
python3 -m venv venv
. venv/bin/activate
pip install -e . -q

# Create user workspace
mkdir -p /home/hermes/workspace/.rostr/state
mkdir -p /home/hermes/workspace/knowledge-base
mkdir -p /home/hermes/workspace/outputs

# Download user's soul.md from S3
aws s3 cp s3://artispreneur-outputs/users/{username}/.rostr/soul.md /home/hermes/workspace/.rostr/soul.md

# Start Hermes Agent as a service
cat > /etc/systemd/system/hermes-agent.service << 'UNIT'
[Unit]
Description=Hermes Agent for {username}
After=network.target

[Service]
Type=simple
User=hermes
WorkingDirectory=/home/hermes/workspace
Environment="PATH=/opt/hermes-agent/venv/bin:/usr/local/bin:/usr/bin:/bin"
Environment="HERMES_PROFILE={username}"
Environment="AWS_REGION=us-east-1"
ExecStart=/opt/hermes-agent/venv/bin/hermes agent start --profile {username}
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
UNIT

systemctl daemon-reload
systemctl enable hermes-agent
systemctl start hermes-agent

echo "=== Provisioning complete: $(date) ==="
"""


def provision_user(username: str, user_data: dict) -> dict:
    """Launch EC2 instance with Hermes Agent for a user."""
    
    user_script = USER_DATA_SCRIPT.replace("{username}", username)
    
    # Upload user data script to S3
    s3.put_object(
        Bucket="artispreneur-outputs",
        Key=f"users/{username}/provision/user-data.sh",
        Body=user_script,
    )
    
    # Launch EC2
    resp = ec2.run_instances(
        ImageId=AMI_ID,
        InstanceType=INSTANCE_TYPE,
        KeyName=KEY_NAME,
        SecurityGroupIds=[SG_ID],
        SubnetId=SUBNET_ID,
        MinCount=1,
        MaxCount=1,
        UserData=user_script,
        TagSpecifications=[{
            "ResourceType": "instance",
            "Tags": [
                {"Key": "Name", "Value": f"hermes-{username}"},
                {"Key": "Product", "Value": "Artispreneur"},
                {"Key": "User", "Value": username},
            ],
        }],
    )
    
    instance_id = resp["Instances"][0]["InstanceId"]
    
    # Wait for instance to be running
    waiter = ec2.get_waiter("instance_running")
    waiter.wait(InstanceIds=[instance_id])
    
    # Get public IP
    desc = ec2.describe_instances(InstanceIds=[instance_id])
    public_ip = desc["Reservations"][0]["Instances"][0].get("PublicIpAddress", "")
    
    return {
        "instance_id": instance_id,
        "public_ip": public_ip,
        "hermes_endpoint": f"http://{public_ip}:8080",
        "status": "provisioning",  # Hermes starts in ~2 min via user-data
        "estimated_ready": "2 minutes",
    }


def handler(event, context):
    """Lambda handler — POST /provision-user"""
    body = json.loads(event.get("body", "{}"))
    username = body.get("username", "").lower().replace(" ", "-")
    
    if not username:
        return {"statusCode": 400, "body": json.dumps({"error": "username required"})}
    
    result = provision_user(username, body.get("user_data", {}))
    
    return {
        "statusCode": 200,
        "body": json.dumps(result),
    }
