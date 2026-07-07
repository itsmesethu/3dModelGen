"""PythonReconstructionEngine — the initial `ReconstructionEngine`.

A thin composition layer: each stage delegates to a focused module so any
single stage can later be replaced (C++/ONNX/TFLite) by subclassing or by
providing a new `ReconstructionEngine` that mixes implementations.
"""
import logging
from pathlib import Path
from typing import List, Optional

import cv2
import numpy as np
import trimesh

from engine.config import settings
from engine.interfaces.engine import ReconstructionEngine, StageProgressFn
from engine.models.types import Frame, ValidationResult

from engine.implementations.python.camera.poses import (
    assign_guided_poses,
    colmap_available,
    estimate_focal,
)
from engine.implementations.python.export.glb import export_glb
from engine.implementations.python.mesh.repair import center_and_scale, repair_mesh
from engine.implementations.python.optimization.decimate import optimize_mesh
from engine.implementations.python.preprocessing.background import (
    HAS_REMBG,
    segment_object,
)
from engine.implementations.python.preprocessing.normalize import normalize_image
from engine.implementations.python.texturing.vertex_colors import apply_vertex_colors
from engine.implementations.python.validation.quality import (
    validate_image_bytes,
    validate_image_set,
)

logger = logging.getLogger(__name__)


class PythonReconstructionEngine(ReconstructionEngine):
    name = "python"

    # -- validation ------------------------------------------------------
    def validate_images(self, image_paths: List[Path]) -> List[str]:
        return validate_image_set(image_paths)

    def validate_single(self, data: bytes) -> ValidationResult:
        return validate_image_bytes(data)

    # -- preprocessing ------------------------------------------------------
    def preprocess(
        self, image_paths: List[Path], progress: StageProgressFn
    ) -> List[Frame]:
        frames: List[Frame] = []
        identity = np.eye(3)
        zero = np.zeros(3)
        for index, path in enumerate(image_paths):
            image = cv2.imread(str(path))
            if image is None:
                raise RuntimeError(f"Could not read image {path.name}.")
            image = normalize_image(image)
            mask = segment_object(image)
            if (mask > 127).mean() < settings.min_object_coverage:
                raise RuntimeError(
                    f"Object not detected in image {index + 1}. "
                    "Retake it with the object filling the frame."
                )
            frames.append(
                Frame(
                    index=index,
                    image=image,
                    mask=mask,
                    rotation=identity,  # assigned in estimate_cameras
                    translation=zero,
                    focal=estimate_focal(image.shape[1]),
                )
            )
            progress((index + 1) / len(image_paths))
        return frames

    # -- cameras ------------------------------------------------------------
    def estimate_cameras(self, frames: List[Frame]) -> List[Frame]:
        poses = assign_guided_poses(len(frames))
        for frame, (label, rotation, translation) in zip(frames, poses):
            frame.label = label
            frame.rotation = rotation
            frame.translation = translation
        return frames

    # -- geometry -------------------------------------------------------------
    def reconstruct(
        self, frames: List[Frame], workdir: Path, progress: StageProgressFn
    ) -> trimesh.Trimesh:
        from engine.registry import create_best_backend

        backend = create_best_backend()
        return backend.reconstruct(frames, workdir, progress)

    # -- mesh -------------------------------------------------------------------
    def repair_mesh(self, mesh: trimesh.Trimesh) -> trimesh.Trimesh:
        return repair_mesh(mesh)

    def generate_texture(
        self, mesh: trimesh.Trimesh, frames: List[Frame]
    ) -> trimesh.Trimesh:
        return apply_vertex_colors(mesh, frames)

    def optimize(self, mesh: trimesh.Trimesh) -> trimesh.Trimesh:
        mesh = optimize_mesh(mesh)
        return center_and_scale(mesh)

    # -- output ----------------------------------------------------------------------
    def export(self, mesh: trimesh.Trimesh, output_path: Path) -> Path:
        return export_glb(mesh, output_path)

    def render_preview(
        self, mesh: trimesh.Trimesh, frames: List[Frame], output_path: Path
    ) -> Optional[Path]:
        """Best-effort preview: the first frame with its background removed."""
        try:
            frame = frames[0]
            preview = frame.image.copy()
            preview[frame.mask <= 127] = 245
            longest = max(preview.shape[:2])
            if longest > settings.preview_size:
                scale = settings.preview_size / longest
                preview = cv2.resize(
                    preview,
                    (int(preview.shape[1] * scale), int(preview.shape[0] * scale)),
                    interpolation=cv2.INTER_AREA,
                )
            output_path.parent.mkdir(parents=True, exist_ok=True)
            cv2.imwrite(str(output_path), preview)
            return output_path
        except Exception:  # pragma: no cover - preview is never fatal
            logger.warning("Preview rendering failed", exc_info=True)
            return None

    # -- diagnostics -----------------------------------------------------------------
    def capabilities(self) -> dict:
        return {
            "colmap": colmap_available(),
            "rembg": HAS_REMBG,
        }
