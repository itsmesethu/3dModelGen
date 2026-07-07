"""Engine configuration. Pure processing parameters — no transport concerns."""
import tempfile
from dataclasses import dataclass
from pathlib import Path


@dataclass(frozen=True)
class EngineSettings:
    # Temp sessions (temp/session_<uuid>/, always cleaned up)
    temp_root: Path = Path(tempfile.gettempdir()) / "reconstruction_engine"

    # Image validation thresholds
    blur_threshold: float = 45.0            # variance of Laplacian
    min_brightness: float = 35.0            # mean pixel value (0-255)
    max_brightness: float = 225.0
    min_resolution: int = 480               # shortest side, pixels
    duplicate_similarity: float = 0.985     # thumbnail NCC threshold

    # Preprocessing
    working_image_size: int = 1024          # longest side before processing
    min_object_coverage: float = 0.02       # min mask fraction per image

    # Reconstruction
    voxel_resolution: int = 96              # visual-hull grid size
    target_faces: int = 30000               # decimation target

    # Preview
    preview_size: int = 512                 # preview image longest side


settings = EngineSettings()
