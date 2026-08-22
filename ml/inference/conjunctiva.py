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
    """Color and morphology-based lower palpebral/forniceal conjunctiva segmentation."""
    h, w = rgb_img.shape[:2]
    
    # Convert to HSV and Lab color spaces
    hsv = cv2.cvtColor(rgb_img, cv2.COLOR_RGB2HSV)
    lab = cv2.cvtColor(rgb_img, cv2.COLOR_RGB2LAB)
    
    r = rgb_img[:, :, 0].astype(float)
    g = rgb_img[:, :, 1].astype(float)
    b = rgb_img[:, :, 2].astype(float)
    
    h_chan = hsv[:, :, 0]
    s_chan = hsv[:, :, 1]
    v_chan = hsv[:, :, 2]
    
    l_chan = lab[:, :, 0]
    a_chan = lab[:, :, 1]
    
    # Conjunctiva characteristics:
    # 1. Redness dominance: R > G and R > B
    # 2. Hue in reddish/pink range: Hue < 25 or Hue > 160
    # 3. Lab a* channel (red-green axis) elevated: a* > 132 in OpenCV 0-255 scale
    # 4. Adequate saturation and brightness (exclude dark shadows or specular reflections)
    red_dominant = (r > g * 1.05) & (r > b * 1.05)
    hue_pink = (h_chan < 22) | (h_chan > 160)
    lab_red = (a_chan > 132)
    valid_range = (v_chan > 35) & (v_chan < 245) & (s_chan > 30)
    
    # Focus on lower half if photograph captures whole eye
    y_coords, _ = np.indices((h, w))
    spatial_prior = (y_coords >= int(h * 0.25))
    
    candidate = red_dominant & hue_pink & lab_red & valid_range & spatial_prior
    
    # Morphological cleaning
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
    cleaned = cv2.morphologyEx(candidate.astype(np.uint8), cv2.MORPH_OPEN, kernel)
    cleaned = cv2.morphologyEx(cleaned, cv2.MORPH_CLOSE, kernel)
    
    # Select the largest contiguous pink/red region
    num_labels, labels, stats, _ = cv2.connectedComponentsWithStats(cleaned)
    if num_labels > 1:
        # Find largest component excluding background (label 0)
        largest_label = 1 + np.argmax(stats[1:, cv2.CC_STAT_AREA])
        return labels == largest_label
    
    return cleaned.astype(bool)


def _fallback_reddish_roi(rgb_img: np.ndarray) -> np.ndarray:
    """Fallback central region segmentation."""
    h, w = rgb_img.shape[:2]
    cy, cx = h // 2, w // 2
    r_h, r_w = max(10, h // 4), max(10, w // 4)
    mask = np.zeros((h, w), dtype=bool)
    mask[max(0, cy - r_h):min(h, cy + r_h), max(0, cx - r_w):min(w, cx + r_w)] = True
    return mask
