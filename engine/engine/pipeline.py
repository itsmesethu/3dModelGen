"""The one and only reconstruction pipeline.

Both the FastAPI development wrapper and the native Android bridge call
`generate_model` — there is exactly one implementation of the business
logic, and it lives here.

    generate_model(image_paths, output_directory, progress_callback)

Progress is delivered through the callback (percent 0..100 + stage key),
never through polling. Callers adapt the callback to their transport
(HTTP status object, native event emitter, ...).
"""
import logging
import time
from pathlib import Path
from typing import List, Optional, Sequence

from engine.models.types import (
    ModelMetadata,
    ProgressCallback,
    ReconstructionResult,
    STAGES,
    stage_by_key,
)
from engine.registry import create_engine, registered_backends, registered_engines
from engine.utils.session import reconstruction_session

logger = logging.getLogger(__name__)


class ReconstructionError(RuntimeError):
    """Raised for any user-actionable pipeline failure."""


def generate_model(
    image_paths: Sequence[str | Path],
    output_directory: str | Path,
    progress_callback: Optional[ProgressCallback] = None,
) -> ReconstructionResult:
    """Run the full pipeline: photos in, GLB (+ preview + metadata) out."""
    started = time.time()
    paths: List[Path] = [Path(p) for p in image_paths]
    output_dir = Path(output_directory)
    output_dir.mkdir(parents=True, exist_ok=True)

    def report(stage_key: str, fraction: float = 0.0) -> None:
        if progress_callback is None:
            return
        stage = stage_by_key(stage_key)
        overall = stage.start + (stage.end - stage.start) * min(max(fraction, 0.0), 1.0)
        progress_callback(round(overall * 100.0, 1), stage_key)

    with reconstruction_session() as session_dir:
        # -- Preparing -------------------------------------------------
        report("preparing", 0.0)
        engine = create_engine()
        missing = [p for p in paths if not p.exists()]
        if missing:
            raise ReconstructionError(
                f"Missing input images: {', '.join(p.name for p in missing)}"
            )
        report("preparing", 1.0)

        # -- Validating ------------------------------------------------
        report("validating", 0.0)
        problems = engine.validate_images(paths)
        if problems:
            raise ReconstructionError(
                "Image validation failed:\n" + "\n".join(problems)
            )
        report("validating", 1.0)

        # -- Background removal / preprocessing -------------------------
        frames = engine.preprocess(
            paths, progress=lambda f: report("background_removal", f)
        )
        report("background_removal", 1.0)

        # -- Camera estimation -------------------------------------------
        report("camera_estimation", 0.0)
        frames = engine.estimate_cameras(frames)
        report("camera_estimation", 1.0)

        # -- Geometry reconstruction ---------------------------------------
        mesh = engine.reconstruct(
            frames, session_dir, progress=lambda f: report("reconstruction", f)
        )
        if mesh is None or len(mesh.faces) == 0:
            raise ReconstructionError(
                "Reconstruction produced an empty mesh. Please retry with "
                "clearer, well-lit photos."
            )
        report("reconstruction", 1.0)

        # -- Mesh repair ------------------------------------------------------
        report("mesh_repair", 0.0)
        mesh = engine.repair_mesh(mesh)
        report("mesh_repair", 1.0)

        # -- Texturing -----------------------------------------------------------
        report("texturing", 0.0)
        mesh = engine.generate_texture(mesh, frames)
        report("texturing", 1.0)

        # -- Optimization -----------------------------------------------------------
        report("optimization", 0.0)
        mesh = engine.optimize(mesh)
        report("optimization", 1.0)

        # -- Export --------------------------------------------------------------------
        report("export", 0.0)
        model_path = engine.export(mesh, output_dir / "model.glb")
        preview_path = engine.render_preview(mesh, frames, output_dir / "preview.png")
        report("export", 1.0)

    metadata = ModelMetadata(
        vertices=len(mesh.vertices),
        faces=len(mesh.faces),
        file_size_bytes=model_path.stat().st_size,
        processing_seconds=round(time.time() - started, 1),
        engine=engine.name,
        image_count=len(paths),
    )
    logger.info("Pipeline complete: %s", metadata.to_dict())
    return ReconstructionResult(
        model_path=model_path,
        preview_path=preview_path,
        metadata=metadata,
    )


def engine_info() -> dict:
    """Environment report for diagnostics (health endpoints, bridge info)."""
    from engine.registry import module_available

    try:
        engine = create_engine()
        active = engine.name
        capabilities = engine.capabilities()
    except RuntimeError:
        active, capabilities = "none", {}
    return {
        "active_engine": active,
        "engines_registered": registered_engines(),
        "geometry_backends": registered_backends(),
        "capabilities": capabilities,
        "optional_modules": {
            "open3d": module_available("open3d"),
            "torch": module_available("torch"),
            "rembg": module_available("rembg"),
        },
        "stages": [
            {"key": stage.key, "label": stage.label} for stage in STAGES
        ],
    }
