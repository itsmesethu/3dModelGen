"""Brightness / color normalization and working-size resize."""
import cv2
import numpy as np

from engine.config import settings


def normalize_image(image: np.ndarray) -> np.ndarray:
    """Resize to working size and equalize luminance via CLAHE on LAB."""
    image = _resize_to_working(image)
    lab = cv2.cvtColor(image, cv2.COLOR_BGR2LAB)
    l_channel, a_channel, b_channel = cv2.split(lab)
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    l_channel = clahe.apply(l_channel)
    lab = cv2.merge((l_channel, a_channel, b_channel))
    return cv2.cvtColor(lab, cv2.COLOR_LAB2BGR)


def _resize_to_working(image: np.ndarray) -> np.ndarray:
    height, width = image.shape[:2]
    longest = max(height, width)
    if longest <= settings.working_image_size:
        return image
    scale = settings.working_image_size / longest
    return cv2.resize(
        image,
        (int(width * scale), int(height * scale)),
        interpolation=cv2.INTER_AREA,
    )
