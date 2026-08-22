"""Image quality validation module for eye photographs."""
from dataclasses import dataclass, field
from typing import Dict, List, Tuple
import cv2
import numpy as np


@dataclass
class ImageQualityResult:
    is_valid: bool
    quality_label: str  # "good", "acceptable", "poor"
    score: float        # 0.0 to 1.0
    metrics: Dict[str, float] = field(default_factory=dict)
    warnings: List[str] = field(default_factory=list)


def check_image_quality(
    image: np.ndarray,
    min_width: int = 150,
    min_height: int = 150,
    blur_threshold: float = 30.0,
    low_brightness_threshold: float = 40.0,
    high_brightness_threshold: float = 225.0,
    min_contrast_threshold: float = 18.0
) -> ImageQualityResult:
    """
    Evaluates photograph quality for conjunctiva analysis.
    Checks resolution, blur/sharpness, lighting/brightness, and contrast.
    """
    if image is None or not isinstance(image, np.ndarray) or image.size == 0:
        return ImageQualityResult(
            is_valid=False,
            quality_label="poor",
            score=0.0,
            warnings=["Image data is empty or invalid."]
        )

    h, w = image.shape[:2]
    warnings = []

    # 1. Dimension check
    if h < min_height or w < min_width:
        warnings.append(f"Image resolution too low ({w}x{h}). Minimum required is {min_width}x{min_height}.")

    # Convert to grayscale for sharpness and brightness metrics
    if len(image.shape) == 3:
        if image.shape[2] == 4:
            # Handle RGBA
            bgr = image[:, :, :3]
            gray = cv2.cvtColor(bgr, cv2.COLOR_BGR2GRAY)
        elif image.shape[2] == 3:
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        else:
            gray = image[:, :, 0]
    else:
        gray = image

    # 2. Sharpness (Laplacian variance)
    laplacian = cv2.Laplacian(gray, cv2.CV_64F)
    sharpness = float(laplacian.var())

    # 3. Brightness
    mean_brightness = float(np.mean(gray))

    # 4. Contrast (standard deviation of grayscale values)
    contrast = float(np.std(gray))

    # 5. Overexposure / Glare check
    overexposed_pct = float(np.count_nonzero(gray > 250) / gray.size * 100.0)
    underexposed_pct = float(np.count_nonzero(gray < 15) / gray.size * 100.0)

    # Assess warnings
    if sharpness < blur_threshold:
        warnings.append(f"Image is blurry (sharpness score {sharpness:.1f}, threshold {blur_threshold}).")

    if mean_brightness < low_brightness_threshold:
        warnings.append(f"Image is underexposed/too dark (brightness {mean_brightness:.1f}).")
    elif mean_brightness > high_brightness_threshold:
        warnings.append(f"Image is overexposed/too bright (brightness {mean_brightness:.1f}).")

    if contrast < min_contrast_threshold:
        warnings.append(f"Low contrast detected ({contrast:.1f}).")

    if overexposed_pct > 15.0:
        warnings.append(f"Significant glare/reflection detected ({overexposed_pct:.1f}% saturated pixels).")

    # Compute overall quality score (0.0 - 1.0)
    # Sharpness score normalized (0 to 200 mapped to 0 to 1)
    sharpness_score = min(1.0, sharpness / 150.0)
    # Brightness score (bell curve around 128)
    brightness_score = max(0.0, 1.0 - abs(mean_brightness - 128.0) / 128.0)
    # Contrast score
    contrast_score = min(1.0, contrast / 50.0)

    overall_score = float(0.4 * sharpness_score + 0.35 * brightness_score + 0.25 * contrast_score)
    overall_score = max(0.05, min(1.0, overall_score))

    if len(warnings) == 0 and overall_score >= 0.70:
        quality_label = "good"
        is_valid = True
    elif len(warnings) <= 2 and overall_score >= 0.35:
        quality_label = "acceptable"
        is_valid = True
    else:
        quality_label = "poor"
        is_valid = (overall_score >= 0.20)

    metrics = {
        "width": float(w),
        "height": float(h),
        "sharpness": round(sharpness, 2),
        "brightness": round(mean_brightness, 2),
        "contrast": round(contrast, 2),
        "overexposed_pct": round(overexposed_pct, 2),
        "underexposed_pct": round(underexposed_pct, 2),
        "quality_score": round(overall_score, 3)
    }

    return ImageQualityResult(
        is_valid=is_valid,
        quality_label=quality_label,
        score=round(overall_score, 3),
        metrics=metrics,
        warnings=warnings
    )
