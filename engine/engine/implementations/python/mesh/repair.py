"""Mesh repair: remove degenerate geometry, fill holes, fix normals."""
import logging

import numpy as np
import trimesh

logger = logging.getLogger(__name__)


def repair_mesh(mesh: trimesh.Trimesh) -> trimesh.Trimesh:
    mesh.remove_unreferenced_vertices()
    mesh.update_faces(mesh.nondegenerate_faces())
    mesh.update_faces(mesh.unique_faces())
    mesh.remove_infinite_values()

    # Keep the largest connected component (drop floating debris)
    components = mesh.split(only_watertight=False)
    if len(components) > 1:
        mesh = max(components, key=lambda m: len(m.faces))
        logger.info("Kept largest of %d components", len(components))

    trimesh.repair.fill_holes(mesh)
    trimesh.repair.fix_inversion(mesh)
    trimesh.repair.fix_normals(mesh)
    return mesh


def center_and_scale(mesh: trimesh.Trimesh, target_size: float = 1.0) -> trimesh.Trimesh:
    """Center at the origin and scale the longest side to `target_size`."""
    mesh.apply_translation(-mesh.bounding_box.centroid)
    extent = float(np.max(mesh.bounding_box.extents))
    if extent > 1e-9:
        mesh.apply_scale(target_size / extent)
    return mesh
