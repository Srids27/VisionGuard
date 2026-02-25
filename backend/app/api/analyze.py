import base64
import json
import logging
from datetime import datetime, timezone
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.models.scan import Scan
from app.schemas.scan import AnalysisResponse, MetadataResult, ELAResult, AIDetectionResult
from app.services.image_storage import compute_hash, save_image
from app.services.metadata_extractor import extract_metadata
from app.services.ela_analyzer import perform_ela
from app.services.ai_detector import AIDetector

logger = logging.getLogger(__name__)

router = APIRouter()

# Initialize AI detector once
_detector: AIDetector | None = None


def get_detector() -> AIDetector | None:
    global _detector
    if _detector is None:
        try:
            logger.info("Loading AI model...")
            _detector = AIDetector(model_path=settings.model_path)
            logger.info("AI model loaded successfully")
        except Exception as e:
            logger.error(f"Model loading failed: {e}")
            _detector = None   # prevent crash
    return _detector

ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/png"}
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png"}


def _compute_verdict(score: float, metadata: dict, ai_result: dict) -> str:
    has_exif = metadata.get("has_exif", False)
    ai_prob = ai_result.get("deepfake_probability", 0)

    # Secondary check: no metadata AND low AI score -> Potential Synthetic Media
    # A truly authentic camera image almost always has EXIF.
    # Missing EXIF + low AI detection = the AI didn't flag it, but the lack of
    # provenance is itself a red flag for synthetic/processed media.
    if not has_exif and ai_prob < 0.35:
        return "Potential Synthetic Media"

    if score < 35:
        return "Likely Authentic"
    elif score < 65:
        return "Suspicious"
    return "Likely Manipulated"


def _compute_metadata_risk(metadata: dict) -> float:
    risk = 0.0
    if not metadata.get("has_exif"):
        risk = 60.0
    if metadata.get("software"):
        from app.services.metadata_extractor import SUSPICIOUS_SOFTWARE
        sw = metadata["software"].lower()
        if any(s in sw for s in SUSPICIOUS_SOFTWARE):
            risk = max(risk, 80.0)
    if metadata.get("warnings"):
        risk = max(risk, 40.0)
    return risk


@router.post("/analyze", response_model=AnalysisResponse)
async def analyze_image(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    # Validate content type
    if file.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type '{file.content_type}'. Only JPEG and PNG are allowed.",
        )

    # Validate extension
    ext = Path(file.filename or "").suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file extension '{ext}'. Only .jpg, .jpeg, .png are allowed.",
        )

    # Read file
    file_bytes = await file.read()

    if len(file_bytes) > settings.max_file_size:
        raise HTTPException(
            status_code=400,
            detail=f"File too large. Maximum size is {settings.max_file_size // (1024*1024)}MB.",
        )

    if len(file_bytes) == 0:
        raise HTTPException(status_code=400, detail="Empty file.")

    # Reduce memory usage: resize + compress image
    from PIL import Image
    import io

    try:
        image = Image.open(io.BytesIO(file_bytes))

        # Resize to max 512px (huge memory saving)
        image.thumbnail((512, 512))

        # Convert to RGB to avoid mode issues
        if image.mode != "RGB":
            image = image.convert("RGB")

        # Save compressed JPEG to memory
        buffer = io.BytesIO()
        image.save(buffer, format="JPEG", quality=85)

        # Replace original bytes with smaller version
        file_bytes = buffer.getvalue()

    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid image file: {e}")

    # Compute hash and save
    sha256 = compute_hash(file_bytes)
    save_image(file_bytes, sha256, ext)

    # Run analysis pipeline
    metadata = extract_metadata(file_bytes)
    ela_result = perform_ela(file_bytes)

    ai_result = {
            "deepfake_probability": 0.0,
            "confidence": 0.0,
            "model_available": False
        }
    
    # Compute final scores
    metadata_risk = _compute_metadata_risk(metadata)
    ela_normalized = min((ela_result.get("mean_diff", 0) / 30.0) * 100, 100)
    ai_pct = ai_result["deepfake_probability"] * 100

    manipulation_score = (
        metadata_risk * 0.25 + ela_normalized * 0.35 + ai_pct * 0.40
    )

    # Apply 30% floor boost when metadata is missing, regardless of ELA results.
    # Missing metadata is inherently suspicious -- authentic camera photos carry EXIF.
    if not metadata.get("has_exif"):
        manipulation_score = max(manipulation_score, 30.0)
        manipulation_score = min(manipulation_score * 1.3, 100.0)
        logger.info(
            "Missing EXIF: manipulation score boosted by 30%% -> %.1f",
            manipulation_score,
        )

    manipulation_score = round(min(manipulation_score, 100.0), 1)
    verdict = _compute_verdict(manipulation_score, metadata, ai_result)

    # Encode original image as base64
    #original_b64 = f"data:{file.content_type};base64,{base64.b64encode(file_bytes).decode()}"

    # Persist to database
    now = datetime.now(timezone.utc)
    scan = Scan(
        image_name=file.filename or "unknown",
        sha256_hash=sha256,
        file_size=len(file_bytes),
        timestamp=now,
        verdict=verdict,
        manipulation_score=manipulation_score,
        metadata_json=json.dumps(metadata),
        software_detected=metadata.get("software"),
        ela_mean=ela_result.get("mean_diff"),
        ai_score=ai_result["deepfake_probability"],
    )
    db.add(scan)
    db.commit()
    db.refresh(scan)

    return AnalysisResponse(
        scan_id=scan.id,
        image_name=scan.image_name,
        sha256_hash=sha256,
        timestamp=now.isoformat(),
        verdict=verdict,
        manipulation_score=manipulation_score,
        metadata=MetadataResult(**metadata),
        ela=ELAResult(**ela_result),
        ai_detection=AIDetectionResult(**ai_result),
    )
