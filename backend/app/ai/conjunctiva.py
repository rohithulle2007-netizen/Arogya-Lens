"""Conjunctiva ROI segmentation and extraction."""
from dataclasses import dataclass
from typing import Optional, Tuple
import cv2
import numpy as np


@dataclass
class ConjunctivaROIResult:
    roi_pixels: np.ndarray        # N x 3 RGB pixel array
    roi_mask: np.ndarray          # 2D boolean mask
    roi_overlay: np.ndarray       # Visualization image
    roi_pixel_count: int
    roi_quality_score: float      # 0.0 to 1.0


def extract_conjunctiva_roi(
    image: np.ndarray,
    mask: Optional[np.ndarray] = None
) -> ConjunctivaROIResult:
    """
    Extracts conjunctiva region of interest (ROI) pixels from an image.
    Handles both pre-segmented RGBA images (with alpha mask) and raw photographs.
    """
    if image is None or image.size == 0:
        raise ValueError("Invalid image provided for conjunctiva ROI extraction.")

    # 1. If mask is provided directly or image has alpha channel:
    if mask is not None:
        binary_mask = (mask > 0)
        rgb_img = image[:, :, :3] if len(image.shape) == 3 and image.shape[2] >= 3 else image
    elif len(image.shape) == 3 and image.shape[2] == 4:
        # RGBA image where alpha channel encodes segmented conjunctiva
        alpha = image[:, :, 3]
        binary_mask = (alpha > 0)
        rgb_img = cv2.cvtColor(image[:, :, :3], cv2.COLOR_BGR2RGB)
    else:
        # Segment conjunctiva from raw photographic image
        rgb_img = cv2.cvtColor(image, cv2.COLOR_BGR2RGB) if len(image.shape) == 3 else cv2.cvtColor(image, cv2.COLOR_GRAY2RGB)
        binary_mask = _segment_conjunctiva_color(rgb_img)

    roi_pixel_count = int(np.count_nonzero(binary_mask))

    if roi_pixel_count < 50:
        # Fallback: if segmentation yielded too few pixels, select central reddish region
        fallback_mask = _fallback_reddish_roi(rgb_img)
        binary_mask = fallback_mask
        roi_pixel_count = int(np.count_nonzero(binary_mask))

    if roi_pixel_count > 0:
        roi_pixels = rgb_img[binary_mask]
        # Quality score based on pixel count adequacy and color consistency
        count_score = min(1.0, roi_pixel_count / 5000.0)
        # Check standard deviation of red vs blue
        r_vals = roi_pixels[:, 0]
        color_uniformity = 1.0 - min(1.0, float(np.std(r_vals)) / 75.0)
        roi_quality_score = round(float(0.6 * count_score + 0.4 * color_uniformity), 3)
    else:
        roi_pixels = np.zeros((0, 3), dtype=np.uint8)
        roi_quality_score = 0.0

    # Create visualization overlay
    overlay = rgb_img.copy()
    overlay[binary_mask, 0] = np.clip(overlay[binary_mask, 0].astype(int) + 30, 0, 255)

    return ConjunctivaROIResult(
        roi_pixels=roi_pixels,
        roi_mask=binary_mask,
        roi_overlay=overlay,
        roi_pixel_count=roi_pixel_count,
        roi_quality_score=roi_quality_score
    )


def _segment_conjunctiva_color(rgb_img: np.ndarray) -> np.ndarray:
    """Adaptive colorimetry and morphology-based palpebral conjunctiva segmentation."""
    h, w = rgb_img.shape[:2]

    # Convert to float for normalized metrics
    r = rgb_img[:, :, 0].astype(float)
    g = rgb_img[:, :, 1].astype(float)
    b = rgb_img[:, :, 2].astype(float)

    hsv = cv2.cvtColor(rgb_img, cv2.COLOR_RGB2HSV)
    lab = cv2.cvtColor(rgb_img, cv2.COLOR_RGB2LAB)

    h_chan = hsv[:, :, 0]
    s_chan = hsv[:, :, 1]
    v_chan = hsv[:, :, 2]
    a_chan = lab[:, :, 1]

    # Normalized erythema contrast
    erythema_contrast = (r - g) / (r + g + 1e-5)

    # 1. Broad chromatic filters for palpebral conjunctiva:
    # - Redness: R > G and R > B * 0.90
    # - Hue in pink/red spectrum (H < 28 or H > 150) or elevated Lab a* (a* > 128)
    # - Non-specular, non-shadow illumination (V > 25, V < 252, S > 15)
    red_dominant = (r > g) & (r > b * 0.90)
    pink_hue = (h_chan < 28) | (h_chan > 150) | (a_chan > 128)
    valid_range = (v_chan > 25) & (v_chan < 252) & (s_chan > 15)

    # 2. Lower palpebral anatomical prior (lower 65% of eye image)
    y_coords, _ = np.indices((h, w))
    spatial_prior = (y_coords >= int(h * 0.20))

    candidate = red_dominant & pink_hue & valid_range & spatial_prior & (erythema_contrast > 0.06)

    # Morphological opening and closing to connect vascular networks
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
    cleaned = cv2.morphologyEx(candidate.astype(np.uint8), cv2.MORPH_OPEN, kernel)
    cleaned = cv2.morphologyEx(cleaned, cv2.MORPH_CLOSE, kernel)

    # Select the largest connected region
    num_labels, labels, stats, _ = cv2.connectedComponentsWithStats(cleaned)
    if num_labels > 1:
        largest_label = 1 + np.argmax(stats[1:, cv2.CC_STAT_AREA])
        return labels == largest_label

    return cleaned.astype(bool)


def _fallback_reddish_roi(rgb_img: np.ndarray) -> np.ndarray:
    """
    Robust fallback targeting the lower palpebral conjunctiva region.
    Avoids pupil/iris center by selecting the lower-middle anatomical quadrant.
    """
    h, w = rgb_img.shape[:2]
    # Lower eyelid region: y in [0.45h, 0.85h], x in [0.20w, 0.80w]
    y_start, y_end = int(h * 0.45), int(h * 0.85)
    x_start, x_end = int(w * 0.20), int(w * 0.80)

    sub_r = rgb_img[y_start:y_end, x_start:x_end, 0].astype(float)
    sub_g = rgb_img[y_start:y_end, x_start:x_end, 1].astype(float)
    erythema = (sub_r - sub_g) / (sub_r + sub_g + 1e-5)

    # Pick the top 40% most reddish pixels within the lower eyelid box
    threshold = np.percentile(erythema, 60) if erythema.size > 0 else 0.0

    mask = np.zeros((h, w), dtype=bool)
    sub_mask = erythema >= threshold
    mask[y_start:y_end, x_start:x_end] = sub_mask

    # If still empty, use default rectangular lower eyelid box
    if np.count_nonzero(mask) < 30:
        mask[y_start:y_end, x_start:x_end] = True

    return mask
