"""Stage interfaces — the seams along which the engine can be re-implemented.

`ReconstructionEngine` is the full stage-level contract. The initial
implementation is `PythonReconstructionEngine`; future implementations
(C++/Rust bindings, ONNX Runtime, TensorFlow Lite, hybrid mixes of the
above) implement the same interface and register themselves in
`engine.registry`. Callers (the pipeline) never know which one is active.

`GeometryBackend` is the plugin interface for the reconstruction stage
alone (visual hull, COLMAP, InstantMesh, Wonder3D, TRELLIS, Hunyuan3D, ...),
so new geometry algorithms can be added without writing a whole engine.
"""
from abc import ABC, abstractmethod
from pathlib import Path
from typing import Callable, List

import numpy as np
import trimesh

from engine.models.types import Frame, ValidationResult

# Per-stage progress reporter: fraction 0..1 within the current stage.
StageProgressFn = Callable[[float], None]


class GeometryBackend(ABC):
    """Pluggable geometry reconstruction algorithm (one pipeline stage)."""

    name: str = "base"

    @abstractmethod
    def is_available(self) -> bool:
        """Whether this backend can run in the current environment."""

    @abstractmethod
    def reconstruct(
        self,
        frames: List[Frame],
        workdir: Path,
        progress: StageProgressFn,
    ) -> trimesh.Trimesh:
        """Build a mesh from the frames. May use `workdir` for scratch files."""


class ReconstructionEngine(ABC):
    """Full stage-level engine contract.

    Every method is independent so individual stages can be swapped for
    native/AI implementations without touching the others.
    """

    name: str = "base"

    @abstractmethod
    def validate_images(self, image_paths: List[Path]) -> List[str]:
        """Validate the image set. Returns a list of problems (empty = OK)."""

    @abstractmethod
    def validate_single(self, data: bytes) -> ValidationResult:
        """Quality-check one image (used by guided capture)."""

    @abstractmethod
    def preprocess(
        self, image_paths: List[Path], progress: StageProgressFn
    ) -> List[Frame]:
        """Normalize images and segment the object. Poses not yet assigned."""

    @abstractmethod
    def estimate_cameras(self, frames: List[Frame]) -> List[Frame]:
        """Assign camera poses (rotation/translation/focal) to each frame."""

    @abstractmethod
    def reconstruct(
        self, frames: List[Frame], workdir: Path, progress: StageProgressFn
    ) -> trimesh.Trimesh:
        """Build raw geometry from posed frames."""

    @abstractmethod
    def repair_mesh(self, mesh: trimesh.Trimesh) -> trimesh.Trimesh:
        """Fix holes, degenerate faces, inverted normals, floating debris."""

    @abstractmethod
    def generate_texture(
        self, mesh: trimesh.Trimesh, frames: List[Frame]
    ) -> trimesh.Trimesh:
        """Color/texture the mesh from the source photos."""

    @abstractmethod
    def optimize(self, mesh: trimesh.Trimesh) -> trimesh.Trimesh:
        """Smooth/decimate to a mobile-friendly budget; center and scale."""

    @abstractmethod
    def export(self, mesh: trimesh.Trimesh, output_path: Path) -> Path:
        """Write the final GLB. Returns the written path."""

    @abstractmethod
    def render_preview(
        self, mesh: trimesh.Trimesh, frames: List[Frame], output_path: Path
    ) -> Path | None:
        """Best-effort preview image for the result screen. May return None."""

    def capabilities(self) -> dict:
        """Optional environment report (which plugins/modules are usable)."""
        return {}
