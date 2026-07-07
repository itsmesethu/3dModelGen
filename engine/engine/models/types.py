"""Shared engine data models.

These mirror the language-neutral contract in `shared/contracts/` — keep the
two in sync when changing anything here.
"""
from dataclasses import dataclass, field
from pathlib import Path
from typing import Callable, List, Optional

import numpy as np

# progress_callback(percent: float 0..100, current_stage: str stage key)
ProgressCallback = Callable[[float, str], None]


@dataclass(frozen=True)
class Stage:
    key: str
    label: str
    # Fraction of total progress budget [start, end], 0..1
    start: float
    end: float


# Canonical pipeline stages (single source of truth, mirrored in
# shared/contracts/stages.json for the mobile app and native bridge).
STAGES: List[Stage] = [
    Stage("preparing", "Preparing", 0.00, 0.03),
    Stage("validating", "Validating Images", 0.03, 0.10),
    Stage("background_removal", "Removing Backgrounds", 0.10, 0.28),
    Stage("camera_estimation", "Estimating Camera Positions", 0.28, 0.33),
    Stage("reconstruction", "Reconstructing Geometry", 0.33, 0.72),
    Stage("mesh_repair", "Repairing Mesh", 0.72, 0.78),
    Stage("texturing", "Applying Texture", 0.78, 0.88),
    Stage("optimization", "Optimizing Model", 0.88, 0.95),
    Stage("export", "Exporting Model", 0.95, 1.00),
]


def stage_by_key(key: str) -> Stage:
    for stage in STAGES:
        if stage.key == key:
            return stage
    raise KeyError(f"Unknown stage: {key}")


@dataclass
class ValidationResult:
    ok: bool
    reasons: List[str] = field(default_factory=list)
    blur_score: float = 0.0
    brightness: float = 0.0

    def to_dict(self) -> dict:
        return {
            "ok": self.ok,
            "reasons": self.reasons,
            "blur_score": self.blur_score,
            "brightness": self.brightness,
        }


@dataclass
class Frame:
    """One preprocessed input view."""
    index: int
    image: np.ndarray            # BGR, normalized working size
    mask: np.ndarray             # uint8 silhouette (255 = object)
    rotation: np.ndarray         # 3x3 world->camera rotation
    translation: np.ndarray      # 3 vector, world->camera
    focal: float                 # pixels
    label: Optional[str] = None  # e.g. "front", "top"


@dataclass
class ModelMetadata:
    vertices: int
    faces: int
    file_size_bytes: int
    processing_seconds: float
    engine: str
    image_count: int

    def to_dict(self) -> dict:
        return {
            "vertices": self.vertices,
            "faces": self.faces,
            "file_size_bytes": self.file_size_bytes,
            "processing_seconds": self.processing_seconds,
            "engine": self.engine,
            "image_count": self.image_count,
        }


@dataclass
class ReconstructionResult:
    model_path: Path             # exported GLB
    preview_path: Optional[Path]  # PNG preview (may be None)
    metadata: ModelMetadata

    def to_dict(self) -> dict:
        return {
            "model_path": str(self.model_path),
            "preview_path": str(self.preview_path) if self.preview_path else None,
            "metadata": self.metadata.to_dict(),
        }
