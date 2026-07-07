"""Texturing baseline: project photos onto the mesh as vertex colors.

Each vertex is colored from the camera that faces it most directly (highest
normal·view agreement) and sees it inside the frame. A full UV texture
baking step (e.g. via Blender headless or xatlas) can replace this module
without touching the rest of the pipeline.
"""
import logging
from typing import List

import numpy as np
import trimesh

from engine.models.types import Frame

logger = logging.getLogger(__name__)

FALLBACK_COLOR = np.array([170, 170, 175, 255], dtype=np.uint8)


def apply_vertex_colors(mesh: trimesh.Trimesh, frames: List[Frame]) -> trimesh.Trimesh:
    vertices = mesh.vertices.view(np.ndarray)
    normals = mesh.vertex_normals.view(np.ndarray)

    colors = np.tile(FALLBACK_COLOR, (len(vertices), 1))
    best_score = np.full(len(vertices), -np.inf, dtype=np.float64)

    for frame in frames:
        height, width = frame.image.shape[:2]
        camera_points = vertices @ frame.rotation.T + frame.translation
        z = camera_points[:, 2]
        in_front = z > 1e-6

        u = np.zeros_like(z)
        v = np.zeros_like(z)
        u[in_front] = frame.focal * camera_points[in_front, 0] / z[in_front] + width / 2.0
        v[in_front] = frame.focal * camera_points[in_front, 1] / z[in_front] + height / 2.0
        visible = in_front & (u >= 0) & (u < width) & (v >= 0) & (v < height)

        # Facing score: vertex normal vs direction to camera.
        camera_center = -frame.rotation.T @ frame.translation
        to_camera = camera_center - vertices
        to_camera /= np.linalg.norm(to_camera, axis=1, keepdims=True) + 1e-9
        score = (normals * to_camera).sum(axis=1)

        update = visible & (score > best_score) & (score > 0.0)
        if not update.any():
            continue

        ui = np.clip(u[update].astype(np.int32), 0, width - 1)
        vi = np.clip(v[update].astype(np.int32), 0, height - 1)
        bgr = frame.image[vi, ui]
        colors[update, 0] = bgr[:, 2]
        colors[update, 1] = bgr[:, 1]
        colors[update, 2] = bgr[:, 0]
        colors[update, 3] = 255
        best_score[update] = score[update]

    mesh.visual = trimesh.visual.ColorVisuals(mesh=mesh, vertex_colors=colors)
    logger.info("Vertex colors applied from %d views", len(frames))
    return mesh
