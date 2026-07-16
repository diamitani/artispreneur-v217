"""TTS integration — Resemble AI, Remy voice (31f74317)."""
import os, json, uuid, boto3, requests

KEY = os.getenv("RESEMBLE_API_KEY", "OFMGMp6p9MvB4UzdcbbtvQtt")
VOICE = "31f74317"
URL = "https://p.cluster.resemble.ai"


def generate_voiceover(text: str) -> dict:
    """Synthesize Remy voiceover, save to S3, return URL."""
    r = requests.post(
        f"{URL}/synthesize",
        headers={"Content-Type": "application/json", "Authorization": f"Bearer {KEY}"},
        json={"voice_uuid": VOICE, "data": text},
        timeout=30,
    )
    r.raise_for_status()
    audio_url = r.json().get("item", {}).get("audio_s3_url")
    if not audio_url:
        return {"error": "No audio URL"}
    audio = requests.get(audio_url).content
    s3 = boto3.client("s3")
    key = f"voiceovers/remy/{uuid.uuid4()}.wav"
    s3.put_object(Bucket="artispreneur-outputs", Key=key, Body=audio, ContentType="audio/wav")
    presigned = s3.generate_presigned_url("get_object", Params={"Bucket": "artispreneur-outputs", "Key": key}, ExpiresIn=86400)
    return {"audio_url": presigned, "s3_key": key}
