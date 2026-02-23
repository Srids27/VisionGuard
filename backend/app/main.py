import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import init_db
from app.api.analyze import router as analyze_router
from app.api.scans import router as scans_router

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="VisionGuard API", version="1.0.0")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(analyze_router, prefix="/api")
app.include_router(scans_router, prefix="/api")


@app.on_event("startup")
def on_startup():
    init_db()
    settings.upload_dir.mkdir(parents=True, exist_ok=True)
    logger.info("VisionGuard API started. Database initialized.")


@app.get("/health")
def health():
    return {"status": "ok", "service": "VisionGuard"}
