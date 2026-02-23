from pathlib import Path
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "sqlite:///./visionguard.db"
    upload_dir: Path = Path("./uploads")
    max_file_size: int = 10 * 1024 * 1024  # 10MB
    model_path: Path = Path("./models/Meso4_DF.pth")
    cors_origins: list[str] = ["http://localhost:5173", "http://localhost:3000"]

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


settings = Settings()
