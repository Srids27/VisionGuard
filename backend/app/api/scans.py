from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.scan import Scan
from app.schemas.scan import ScanListResponse, ScanSummary

router = APIRouter()


@router.get("/scans", response_model=ScanListResponse)
def list_scans(
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
):
    total = db.query(Scan).count()
    scans = (
        db.query(Scan)
        .order_by(Scan.timestamp.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )

    return ScanListResponse(
        total=total,
        limit=limit,
        offset=offset,
        scans=[
            ScanSummary(
                scan_id=s.id,
                image_name=s.image_name,
                sha256_hash=s.sha256_hash,
                timestamp=s.timestamp.isoformat() if s.timestamp else "",
                verdict=s.verdict,
                manipulation_score=s.manipulation_score,
                software_detected=s.software_detected,
                ela_mean=s.ela_mean,
                ai_score=s.ai_score,
            )
            for s in scans
        ],
    )
