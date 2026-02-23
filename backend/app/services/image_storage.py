import hashlib
from pathlib import Path

from app.config import settings


def compute_hash(file_bytes: bytes) -> str:
    return hashlib.sha256(file_bytes).hexdigest()


def save_image(file_bytes: bytes, sha256_hash: str, extension: str) -> Path:
    upload_dir = settings.upload_dir / "originals"
    upload_dir.mkdir(parents=True, exist_ok=True)
    filepath = upload_dir / f"{sha256_hash}{extension}"
    filepath.write_bytes(file_bytes)
    return filepath
