"""Baseline geometry backend: silhouette-based visual hull.

Pure CPU (NumPy + scikit-image marching cubes). Works fully offline with the
guided-capture canonical poses. Quality is approximate but reliably produces
a watertight, printable mesh from a handful of photos.
"""
import logging
from pathlib import Path
from typing import List

import numpy as np
import trimesh

from engine.config import settings
from engine.interfaces.engine import GeometryBackend, StageProgressFn
from engine.models.types import Frame

logger = logging.getLogger(__name__)


class VisualHullBackend(GeometryBackend):
    name = "visual_hull"

    def is_available(self) -> bool:
        try:
            from skimage import measure  # noqa: F401
            return True
        except ImportError:
            return False

    def reconstruct(
        self,
        frames: List[Frame],
        workdir: Path,
        progress: StageProgressFn,
    ) -> trimesh.Trimesh:
        from skimage import measure

        resolution = settings.voxel_resolution
        # Voxel grid spanning [-1, 1]^3 around the object.
        axis = np.linspace(-1.0, 1.0, resolution, dtype=np.float32)
        grid_x, grid_y, grid_z = np.meshgrid(axis, axis, axis, indexing="ij")
        points = np.stack(
            [grid_x.ravel(), grid_y.ravel(), grid_z.ravel()], axis=1
        )  # (N, 3)
        occupancy = np.ones(points.shape[0], dtype=bool)

        for step, frame in enumerate(frames):
            occupancy &= self._inside_silhouette(points, frame)
            progress((step + 1) / (len(frames) + 1))

        if not occupancy.any():
            raise RuntimeError(
                "Object could not be detected across the images. "
                "Make sure the object is centered and well lit in every photo."
            )

        volume = occupancy.reshape((resolution, resolution, resolution))
        volume = self._pad(volume)
        vertices, faces, _, _ = measure.marching_cubes(
            volume.astype(np.float32), level=0.5
        )
        # Map voxel indices back to world coordinates in [-1, 1].
        vertices = (vertices - 1.0) / (resolution - 1) * 2.0 - 1.0

        mesh = trimesh.Trimesh(vertices=vertices, faces=faces, process=True)
        logger.info(
            "Visual hull: %d vertices, %d faces", len(mesh.vertices), len(mesh.faces)
        )
        progress(1.0)
        return mesh

    @staticmethod
    def _inside_silhouette(points: np.ndarray, frame: Frame) -> np.ndarray:
        height, width = frame.mask.shape[:2]
        camera_points = points @ frame.rotation.T + frame.translation
        z = camera_points[:, 2]
        valid = z > 1e-6

        u = np.zeros_like(z)
        v = np.zeros_like(z)
        u[valid] = frame.focal * camera_points[valid, 0] / z[valid] + width / 2.0
        v[valid] = frame.focal * camera_points[valid, 1] / z[valid] + height / 2.0

        ui = np.clip(u.astype(np.int32), 0, width - 1)
        vi = np.clip(v.astype(np.int32), 0, height - 1)
        inside_frame = (u >= 0) & (u < width) & (v >= 0) & (v < height) & valid

        result = np.zeros(points.shape[0], dtype=bool)
        # Voxels projecting outside the frame are kept (unknown region)
        result[~inside_frame] = True
        result[inside_frame] = frame.mask[vi[inside_frame], ui[inside_frame]] > 127
        return result

    @staticmethod
    def _pad(volume: np.ndarray) -> np.ndarray:
        """Pad with empty space so marching cubes produces a closed surface."""
        return np.pad(volume, 1, mode="constant", constant_values=False)
