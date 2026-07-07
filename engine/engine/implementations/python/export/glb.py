"""GLB export. Additional exporters (OBJ, USDZ, ...) can live beside this."""
import logging
from pathlib import Path

import trimesh

logger = logging.getLogger(__name__)


def export_glb(mesh: trimesh.Trimesh, output_path: Path) -> Path:
    output_path.parent.mkdir(parents=True, exist_ok=True)
    scene = trimesh.Scene(geometry={"model": mesh})
    data = scene.export(file_type="glb")
    output_path.write_bytes(data)
    logger.info("Exported GLB: %s (%.1f KB)", output_path, len(data) / 1024)
    return output_path
