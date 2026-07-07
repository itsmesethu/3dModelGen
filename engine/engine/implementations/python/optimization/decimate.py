"""Mesh optimization: smoothing + decimation to a mobile-friendly budget."""
import logging

import trimesh

from engine.config import settings

logger = logging.getLogger(__name__)


def optimize_mesh(mesh: trimesh.Trimesh) -> trimesh.Trimesh:
    # Light Laplacian smoothing to soften voxel/scan artifacts.
    try:
        trimesh.smoothing.filter_taubin(mesh, lamb=0.5, nu=-0.53, iterations=8)
    except Exception:  # pragma: no cover - smoothing is best-effort
        logger.warning("Smoothing skipped", exc_info=True)

    if len(mesh.faces) > settings.target_faces:
        try:
            simplified = mesh.simplify_quadric_decimation(
                face_count=settings.target_faces
            )
            if len(simplified.faces) > 0:
                logger.info(
                    "Decimated %d -> %d faces", len(mesh.faces), len(simplified.faces)
                )
                mesh = simplified
        except Exception:  # pragma: no cover - fast-simplification optional
            logger.warning("Decimation unavailable, keeping full mesh", exc_info=True)
    return mesh
