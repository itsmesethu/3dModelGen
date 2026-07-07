"""Wrapper-only configuration (transport concerns).

Processing parameters live in the engine (`engine/engine/config.py`) — this
file must never contain reconstruction settings.
"""
from dataclasses import dataclass
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent


@dataclass(frozen=True)
class Settings:
    temp_dir: Path = BASE_DIR / "temp"

    # Job lifecycle
    job_ttl_seconds: int = 30 * 60          # jobs auto-purged after 30 min
    reaper_interval_seconds: int = 60

    # Upload constraints
    min_images: int = 3
    max_images: int = 24
    max_image_bytes: int = 25 * 1024 * 1024
    allowed_extensions: tuple = (".jpg", ".jpeg", ".png", ".webp")


settings = Settings()
