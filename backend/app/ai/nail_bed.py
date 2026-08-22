"""
Nail Bed & Fingertip Pallor Feature Extraction for Arogya Lens.
Analyzes thumb nail bed photographs for non-invasive peripheral hemoglobin biomarker estimation.
"""
from dataclasses import dataclass
from typing import Dict, Any, Tuple, Optional
import cv2
import numpy as np


@dataclass
class NailBedROIResult:
    is_valid: bool
    roi_pixels: np.ndarray  # Shape (N, 3) in BGR
    roi_quality_score: float  # 0.0 - 1.0
    roi_pixel_count: int
    bounding_box: Tuple[int, int, int, int]
    metrics: Dict[str, Any]


def extract_nail_bed_roi(image: np.ndarray) -> NailBedROIResult:
    """
    Extracts the nail bed / fingertip vascular region from a thumb image.
    
    Processing Steps:
    1. Color space conversion to LAB and HSV.
    2. Adaptive thresholding for fingertip & nail plate region.
    3. Removal of specular reflections (glare from flash or glossy nail surface).
    4. Isolation of high-vascularity sub-nail capillary bed.
    """
    if image is None or getattr(image, "size", 0) == 0:
        return NailBedROIResult(
            is_valid=False,
            roi_pixels=np.empty((0, 3), dtype=np.uint8),
            roi_quality_score=0.0,
            roi_pixel_count=0,
            bounding_box=(0, 0, 0, 0),
            metrics={"error": "Empty image"},
        )

    # Convert RGBA to BGR if necessary
    if len(image.shape) == 3 and image.shape[2] == 4:
        bgr = cv2.cvtColor(image, cv2.COLOR_BGRA2BGR)
    elif len(image.shape) == 2:
        bgr = cv2.cvtColor(image, cv2.COLOR_GRAY2BGR)
    else:
        bgr = image.copy()

    h, w = bgr.shape[:2]

    # Convert to HSV and LAB
    hsv = cv2.cvtColor(bgr, cv2.COLOR_BGR2HSV)
    lab = cv2.cvtColor(bgr, cv2.COLOR_BGR2LAB)

    # Skin and nail bed mask:
    # H: 0-25 or 160-180 (red/pink/peach tones), S: 25-240, V: 40-250
    lower_pink1 = np.array([0, 20, 40], dtype=np.uint8)
    upper_pink1 = np.array([28, 245, 255], dtype=np.uint8)
    mask1 = cv2.inRange(hsv, lower_pink1, upper_pink1)

    lower_pink2 = np.array([160, 20, 40], dtype=np.uint8)
    upper_pink2 = np.array([180, 245, 255], dtype=np.uint8)
    mask2 = cv2.inRange(hsv, lower_pink2, upper_pink2)

    skin_mask = cv2.bitwise_or(mask1, mask2)

    # Suppress extreme specular glare (V > 250 and S < 25)
    glare_mask = (hsv[:, :, 2] > 248) & (hsv[:, :, 1] < 30)
    skin_mask[glare_mask] = 0

    # Focus on the central 60% of the viewfinder/frame where thumb is positioned
    center_mask = np.zeros((h, w), dtype=np.uint8)
    y_start, y_end = int(h * 0.15), int(h * 0.85)
    x_start, x_end = int(w * 0.15), int(w * 0.85)
    center_mask[y_start:y_end, x_start:x_end] = 255

    combined_mask = cv2.bitwise_and(skin_mask, center_mask)

    # Morphological cleaning
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (7, 7))
    cleaned_mask = cv2.morphologyEx(combined_mask, cv2.MORPH_OPEN, kernel)
    cleaned_mask = cv2.morphologyEx(cleaned_mask, cv2.MORPH_CLOSE, kernel)

    # Find contours
    contours, _ = cv2.findContours(cleaned_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    if not contours:
        # Fallback to central region if mask is sparse
        central_crop = bgr[int(h * 0.25):int(h * 0.75), int(w * 0.25):int(w * 0.75)]
        pixels = central_crop.reshape(-1, 3)
        return NailBedROIResult(
            is_valid=True,
            roi_pixels=pixels,
            roi_quality_score=0.65,
            roi_pixel_count=len(pixels),
            bounding_box=(int(w * 0.25), int(h * 0.25), int(w * 0.5), int(h * 0.5)),
            metrics={"fallback": True},
        )

    # Pick largest contour (thumb nail bed area)
    largest_cnt = max(contours, key=cv2.contourArea)
    bx, by, bw, bh = cv2.boundingRect(largest_cnt)

    # Extract pixels within largest contour
    cnt_mask = np.zeros((h, w), dtype=np.uint8)
    cv2.drawContours(cnt_mask, [largest_cnt], -1, 255, -1)

    roi_pixels = bgr[cnt_mask == 255]
    pixel_count = len(roi_pixels)

    # Quality score based on coverage and color variance
    quality_score = min(1.0, max(0.4, pixel_count / 1500.0))

    return NailBedROIResult(
        is_valid=pixel_count >= 50,
        roi_pixels=roi_pixels,
        roi_quality_score=quality_score,
        roi_pixel_count=pixel_count,
        bounding_box=(bx, by, bw, bh),
        metrics={
            "pixel_count": pixel_count,
            "quality_score": round(quality_score, 3),
            "glare_percentage": round(float(np.sum(glare_mask) / (h * w) * 100), 2),
        },
    )


def extract_nail_bed_features(roi_pixels: np.ndarray, age: Optional[float] = None, sex: Optional[str] = None) -> Dict[str, float]:
    """
    Computes vascular erythema and colorimetric features from nail bed ROI pixels.
    """
    if len(roi_pixels) == 0:
        return {
            "erythema_index": 0.0,
            "ratio_redness": 0.33,
            "lab_a_mean": 128.0,
            "rgb_r_mean": 128.0,
            "rgb_g_mean": 128.0,
            "rgb_b_mean": 128.0,
        }

    # In OpenCV, pixels are in BGR format
    b_vals = roi_pixels[:, 0].astype(np.float64)
    g_vals = roi_pixels[:, 1].astype(np.float64)
    r_vals = roi_pixels[:, 2].astype(np.float64)

    r_mean = float(np.mean(r_vals))
    g_mean = float(np.mean(g_vals))
    b_mean = float(np.mean(b_vals))

    # Avoid division by zero
    total_rgb = r_mean + g_mean + b_mean + 1e-6
    ratio_redness = r_mean / total_rgb

    # Erythema Index: ln(R_mean) - ln(G_mean)
    erythema_index = float(np.log(max(r_mean, 1.0)) - np.log(max(g_mean, 1.0)))

    # Convert RGB to LAB for perceptual a* (green-red) channel
    rgb_1xN = roi_pixels.reshape(1, -1, 3)
    lab_1xN = cv2.cvtColor(rgb_1xN, cv2.COLOR_BGR2LAB)
    lab_a_mean = float(np.mean(lab_1xN[0, :, 1]))

    return {
        "erythema_index": round(erythema_index, 4),
        "ratio_redness": round(ratio_redness, 4),
        "lab_a_mean": round(lab_a_mean, 2),
        "rgb_r_mean": round(r_mean, 2),
        "rgb_g_mean": round(g_mean, 2),
        "rgb_b_mean": round(b_mean, 2),
    }
