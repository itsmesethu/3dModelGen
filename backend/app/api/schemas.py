"""Pydantic response models for the API."""
from typing import List, Optional

from pydantic import BaseModel


class StageStatus(BaseModel):
    key: str
    label: str
    state: str  # "waiting" | "running" | "done" | "failed"


class ModelMetadata(BaseModel):
    vertices: int
    faces: int
    file_size_bytes: int
    processing_seconds: float
    engine: str
    image_count: int


class JobStatus(BaseModel):
    job_id: str
    state: str  # "queued" | "processing" | "done" | "failed"
    progress: float  # 0..1
    stage: Optional[str] = None
    stages: List[StageStatus] = []
    error: Optional[str] = None
    elapsed_seconds: float = 0.0
    metadata: Optional[ModelMetadata] = None


class JobCreated(BaseModel):
    job_id: str
    image_count: int


class ImageValidation(BaseModel):
    ok: bool
    reasons: List[str] = []
    blur_score: float = 0.0
    brightness: float = 0.0


class HealthInfo(BaseModel):
    status: str
    engine: dict  # engine_info() report from the reconstruction engine
