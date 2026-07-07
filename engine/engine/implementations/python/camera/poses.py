"""Camera pose estimation.

If COLMAP is installed its poses can be used (see the photogrammetry
backend). The baseline estimator assigns canonical guided-capture poses:
cameras on a ring around the object plus an optional top view — matching
the capture order enforced by the mobile app (Front, Front-Left, Left,
Back, Right, Front-Right, Top).
"""
import math
import shutil
from typing import List, Tuple

import numpy as np

# Azimuth (deg), elevation (deg) for each guided capture slot.
GUIDED_VIEWS: List[Tuple[str, float, float]] = [
    ("front", 0.0, 10.0),
    ("front_left", 45.0, 10.0),
    ("left", 90.0, 10.0),
    ("back", 180.0, 10.0),
    ("right", 270.0, 10.0),
    ("front_right", 315.0, 10.0),
    ("top", 0.0, 70.0),
]

CAMERA_DISTANCE = 2.5  # object assumed centered in unit-ish sphere


def colmap_available() -> bool:
    return shutil.which("colmap") is not None


def look_at_pose(azimuth_deg: float, elevation_deg: float, distance: float = CAMERA_DISTANCE):
    """Return (R, t) world->camera for a camera orbiting the origin."""
    azimuth = math.radians(azimuth_deg)
    elevation = math.radians(elevation_deg)

    center = np.array(
        [
            distance * math.cos(elevation) * math.sin(azimuth),
            distance * math.sin(elevation),
            distance * math.cos(elevation) * math.cos(azimuth),
        ]
    )
    forward = -center / np.linalg.norm(center)          # camera looks at origin
    world_up = np.array([0.0, 1.0, 0.0])
    right = np.cross(forward, world_up)
    if np.linalg.norm(right) < 1e-6:                    # looking straight down
        right = np.array([1.0, 0.0, 0.0])
    right = right / np.linalg.norm(right)
    up = np.cross(right, forward)

    rotation = np.stack([right, up, -forward])          # rows: x, y, z axes
    translation = -rotation @ center
    return rotation, translation


def assign_guided_poses(count: int) -> List[Tuple[str, np.ndarray, np.ndarray]]:
    """Poses for `count` images following the guided capture order.

    Extra images beyond the 7 guided slots are spread evenly on the ring.
    """
    poses: List[Tuple[str, np.ndarray, np.ndarray]] = []
    for index in range(count):
        if index < len(GUIDED_VIEWS):
            label, azimuth, elevation = GUIDED_VIEWS[index]
        else:
            label = f"extra_{index}"
            azimuth = (index * 360.0 / max(count, 1)) % 360.0
            elevation = 10.0
        rotation, translation = look_at_pose(azimuth, elevation)
        poses.append((label, rotation, translation))
    return poses


def estimate_focal(image_width: int, fov_deg: float = 60.0) -> float:
    return image_width / (2.0 * math.tan(math.radians(fov_deg) / 2.0))
