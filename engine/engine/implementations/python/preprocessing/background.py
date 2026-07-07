"""Background removal / object segmentation.

Prefers `rembg` (AI matting) when installed; falls back to GrabCut which
works well for centered objects on reasonably plain backgrounds.
"""
import logging
from typing import Optional

import cv2
import numpy as np

logger = logging.getLogger(__name__)

try:  # optional AI segmentation
    from rembg import remove as _rembg_remove  # type: ignore

    HAS_REMBG = True
except Exception:  # pragma: no cover - optional dependency
    _rembg_remove = None
    HAS_REMBG = False


def segment_object(image: np.ndarray) -> np.ndarray:
    """Return a uint8 mask (0 background, 255 object)."""
    if HAS_REMBG:
        mask = _segment_rembg(image)
        if mask is not None:
            return mask
    return _segment_grabcut(image)


def _segment_rembg(image: np.ndarray) -> Optional[np.ndarray]:
    try:
        rgba = _rembg_remove(
            cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        )
        alpha = np.asarray(rgba)[:, :, 3]
        return (alpha > 127).astype(np.uint8) * 255
    except Exception:  # pragma: no cover
        logger.warning("rembg segmentation failed, using GrabCut", exc_info=True)
        return None


def _segment_grabcut(image: np.ndarray) -> np.ndarray:
    height, width = image.shape[:2]
    mask = np.zeros((height, width), np.uint8)
    # Assume the object occupies the central region (guided capture enforces it)
    margin_x, margin_y = int(width * 0.08), int(height * 0.08)
    rect = (margin_x, margin_y, width - 2 * margin_x, height - 2 * margin_y)

    bgd_model = np.zeros((1, 65), np.float64)
    fgd_model = np.zeros((1, 65), np.float64)
    try:
        cv2.grabCut(image, mask, rect, bgd_model, fgd_model, 4, cv2.GC_INIT_WITH_RECT)
    except cv2.error:  # degenerate images
        mask[:] = cv2.GC_PR_FGD
    binary = np.where(
        (mask == cv2.GC_FGD) | (mask == cv2.GC_PR_FGD), 255, 0
    ).astype(np.uint8)

    # Keep only the largest connected component and smooth it
    contours, _ = cv2.findContours(binary, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    if contours:
        largest = max(contours, key=cv2.contourArea)
        binary = np.zeros_like(binary)
        cv2.drawContours(binary, [largest], -1, 255, cv2.FILLED)
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (7, 7))
    binary = cv2.morphologyEx(binary, cv2.MORPH_CLOSE, kernel)
    return binary
