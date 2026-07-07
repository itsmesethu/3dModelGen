"""Image quality validation: blur, brightness, resolution, duplicates."""
from pathlib import Path
from typing import List

import cv2
import numpy as np

from engine.config import settings
from engine.models.types import ValidationResult


def _decode(data: bytes) -> np.ndarray:
    array = np.frombuffer(data, dtype=np.uint8)
    image = cv2.imdecode(array, cv2.IMREAD_COLOR)
    if image is None:
        raise ValueError("Could not decode image data.")
    return image


def blur_score(gray: np.ndarray) -> float:
    """Variance of Laplacian — low values indicate blur."""
    return float(cv2.Laplacian(gray, cv2.CV_64F).var())


def validate_image_bytes(data: bytes) -> ValidationResult:
    try:
        image = _decode(data)
    except ValueError:
        return ValidationResult(
            ok=False,
            reasons=["Image is corrupted or in an unsupported format."],
        )
    return validate_image(image)


def validate_image(image: np.ndarray) -> ValidationResult:
    reasons: List[str] = []
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

    height, width = gray.shape[:2]
    if min(height, width) < settings.min_resolution:
        reasons.append(
            f"Resolution too low ({width}x{height}). "
            f"Shortest side must be at least {settings.min_resolution}px."
        )

    sharpness = blur_score(gray)
    if sharpness < settings.blur_threshold:
        reasons.append("Image is too blurry. Hold the device steady and retake.")

    brightness = float(gray.mean())
    if brightness < settings.min_brightness:
        reasons.append("Image is too dark. Add more light.")
    elif brightness > settings.max_brightness:
        reasons.append("Image is overexposed. Reduce lighting or exposure.")

    return ValidationResult(
        ok=len(reasons) == 0,
        reasons=reasons,
        blur_score=round(sharpness, 2),
        brightness=round(brightness, 2),
    )


def validate_image_set(paths: List[Path]) -> List[str]:
    """Validate the whole set. Returns a list of problems (empty = OK).

    Also rejects near-duplicate viewpoints using tiny-thumbnail similarity.
    """
    problems: List[str] = []
    thumbs: List[np.ndarray] = []

    for path in paths:
        image = cv2.imread(str(path))
        if image is None:
            problems.append(f"{path.name}: unreadable or corrupted file.")
            continue
        result = validate_image(image)
        if not result.ok:
            problems.extend(f"{path.name}: {reason}" for reason in result.reasons)
        thumb = cv2.resize(
            cv2.cvtColor(image, cv2.COLOR_BGR2GRAY), (32, 32)
        ).astype(np.float32)
        thumbs.append(thumb)

    # Near-duplicate detection (normalized cross-correlation on thumbnails)
    for i in range(len(thumbs)):
        for j in range(i + 1, len(thumbs)):
            a = thumbs[i] - thumbs[i].mean()
            b = thumbs[j] - thumbs[j].mean()
            denom = float(np.linalg.norm(a) * np.linalg.norm(b))
            if denom < 1e-6:
                continue
            similarity = float((a * b).sum() / denom)
            if similarity > settings.duplicate_similarity:
                problems.append(
                    f"Images {i + 1} and {j + 1} look like duplicate viewpoints. "
                    "Capture the object from distinct angles."
                )
    return problems
