from datetime import datetime

from pydantic import BaseModel


class MetadataResult(BaseModel):
    has_exif: bool = False
    metadata_status: str = "Unknown"
    camera_model: str | None = None
    camera_make: str | None = None
    software: str | None = None
    date_taken: str | None = None
    gps: dict | None = None
    warnings: list[str] = []
    all_tags: dict = {}


class ELAResult(BaseModel):
    heatmap_base64: str
    mean_diff: float
    max_diff: float


class AIDetectionResult(BaseModel):
    deepfake_probability: float
    confidence: float
    model_used: str


class AnalysisResponse(BaseModel):
    scan_id: int
    image_name: str
    sha256_hash: str
    timestamp: str
    verdict: str
    manipulation_score: float
    metadata: MetadataResult
    ela: ELAResult
    ai_detection: AIDetectionResult
    original_image_base64: str


class ScanSummary(BaseModel):
    scan_id: int
    image_name: str
    sha256_hash: str
    timestamp: str
    verdict: str
    manipulation_score: float
    software_detected: str | None = None
    ela_mean: float | None = None
    ai_score: float | None = None

    model_config = {"from_attributes": True}


class ScanListResponse(BaseModel):
    total: int
    limit: int
    offset: int
    scans: list[ScanSummary]
