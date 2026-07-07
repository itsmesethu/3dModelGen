"""COLMAP (+ optional OpenMVS) photogrammetry geometry backend.

Used automatically when the `colmap` binary is on PATH. Runs SfM + dense
reconstruction in the session directory, then meshes the fused point
cloud with Open3D Poisson reconstruction (or falls back to the point-cloud
convex hull when Open3D is missing).
"""
import logging
import shutil
import subprocess
from pathlib import Path
from typing import List

import cv2
import numpy as np
import trimesh

from engine.interfaces.engine import GeometryBackend, StageProgressFn
from engine.models.types import Frame

logger = logging.getLogger(__name__)


class PhotogrammetryBackend(GeometryBackend):
    name = "photogrammetry"

    def is_available(self) -> bool:
        return shutil.which("colmap") is not None

    def reconstruct(
        self,
        frames: List[Frame],
        workdir: Path,
        progress: StageProgressFn,
    ) -> trimesh.Trimesh:
        scratch = workdir / "colmap"
        image_dir = scratch / "images"
        sparse_dir = scratch / "sparse"
        dense_dir = scratch / "dense"
        for directory in (image_dir, sparse_dir, dense_dir):
            directory.mkdir(parents=True, exist_ok=True)

        for frame in frames:
            # White-out background so features concentrate on the object.
            masked = frame.image.copy()
            masked[frame.mask <= 127] = 255
            cv2.imwrite(str(image_dir / f"{frame.index:03d}.jpg"), masked)

        database = scratch / "database.db"
        self._run(["colmap", "feature_extractor",
                   "--database_path", str(database),
                   "--image_path", str(image_dir),
                   "--ImageReader.single_camera", "1"])
        progress(0.2)
        self._run(["colmap", "exhaustive_matcher",
                   "--database_path", str(database)])
        progress(0.35)
        self._run(["colmap", "mapper",
                   "--database_path", str(database),
                   "--image_path", str(image_dir),
                   "--output_path", str(sparse_dir)])
        progress(0.55)

        model_dir = next(sparse_dir.iterdir(), None)
        if model_dir is None:
            raise RuntimeError(
                "COLMAP could not register the images. "
                "Capture more overlapping viewpoints and retry."
            )

        self._run(["colmap", "image_undistorter",
                   "--image_path", str(image_dir),
                   "--input_path", str(model_dir),
                   "--output_path", str(dense_dir)])
        self._run(["colmap", "patch_match_stereo",
                   "--workspace_path", str(dense_dir)])
        progress(0.8)
        fused = dense_dir / "fused.ply"
        self._run(["colmap", "stereo_fusion",
                   "--workspace_path", str(dense_dir),
                   "--output_path", str(fused)])
        progress(0.9)

        mesh = self._mesh_point_cloud(fused)
        progress(1.0)
        return mesh

    @staticmethod
    def _run(command: List[str]) -> None:
        logger.info("Running: %s", " ".join(command))
        result = subprocess.run(command, capture_output=True, text=True)
        if result.returncode != 0:
            raise RuntimeError(
                f"{command[1]} failed: {result.stderr[-500:] or 'unknown error'}"
            )

    @staticmethod
    def _mesh_point_cloud(ply_path: Path) -> trimesh.Trimesh:
        try:
            import open3d as o3d  # type: ignore

            pcd = o3d.io.read_point_cloud(str(ply_path))
            pcd.estimate_normals()
            mesh_o3d, _ = o3d.geometry.TriangleMesh.create_from_point_cloud_poisson(
                pcd, depth=9
            )
            return trimesh.Trimesh(
                vertices=np.asarray(mesh_o3d.vertices),
                faces=np.asarray(mesh_o3d.triangles),
                process=True,
            )
        except ImportError:
            logger.warning("Open3D missing — falling back to convex hull meshing")
            cloud = trimesh.load(str(ply_path))
            return cloud.convex_hull
