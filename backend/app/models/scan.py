from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, Float, Integer, String, Text

from app.database import Base


class Scan(Base):
    __tablename__ = "scans"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    image_name = Column(String(255), nullable=False)
    sha256_hash = Column(String(64), nullable=False, index=True)
    file_size = Column(Integer, nullable=False)
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    verdict = Column(String(50), nullable=False)
    manipulation_score = Column(Float, nullable=False)
    metadata_json = Column(Text, nullable=True)
    software_detected = Column(String(255), nullable=True)
    ela_mean = Column(Float, nullable=True)
    ai_score = Column(Float, nullable=True)
