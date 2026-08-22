"""Eye and palpebral region detector/localizer."""
from typing import Optional, Tuple
import cv2
import numpy as np


def detect_eye_region(
    image: np.ndarray,
    target_size: Optional[Tuple[int, int]] = (800, 600)
) -> Tuple[np.ndarray, Tuple[int, int, int, int]]:
    """
    Localizes the primary eye and eyelid region from an input photograph.
    Returns the cropped/focused region and bounding coordinates (x, y, w, h).
    """
    if image is None or image.size == 0:
        raise ValueError("Cannot detect eye region on empty image.")

    h, w = image.shape[:2]

    # If image is already an eye crop or small, return normalized image
    if w <= 1000 and h <= 1000:
        return image.copy(), (0, 0, w, h)

    # For high resolution smartphone photos, isolate high-contrast eye region
    # Convert to grayscale
    if len(image.shape) == 3:
        gray = cv2.cvtColor(image[:, :, :3], cv2.COLOR_BGR2GRAY)
    else:
        gray = image

    # Downscale for fast detection
    scale = 600.0 / max(h, w)
    small_w, small_h = int(w * scale), int(h * scale)
    small_gray = cv2.resize(gray, (small_w, small_h))

    # Apply adaptive thresholding to find high-contrast structures (sclera, eyelid margins)
    blurred = cv2.GaussianBlur(small_gray, (7, 7), 0)
    thresh = cv2.adaptiveThreshold(
        blurred, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY_INV, 21, 4
    )

    # Find contours
    contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    best_box = (0, 0, w, h)
    max_area = 0

    for cnt in contours:
        area = cv2.contourArea(cnt)
        if area > max_area and area > (small_w * small_h * 0.05):
            bx, by, bw, bh = cv2.boundingRect(cnt)
            # Check aspect ratio typical of eye/conjunctiva
            aspect = bw / float(bh + 1e-5)
            if 0.5 <= aspect <= 3.0:
                max_area = area
                # Rescale back to original coords with padding
                orig_x = max(0, int(bx / scale) - int(0.1 * bw / scale))
                orig_y = max(0, int(by / scale) - int(0.1 * bh / scale))
                orig_w = min(w - orig_x, int(bw / scale * 1.2))
                orig_h = min(h - orig_y, int(bh / scale * 1.2))
                best_box = (orig_x, orig_y, orig_w, orig_h)

    x, y, bw, bh = best_box
    crop = image[y:y+bh, x:x+bw]

    if target_size is not None and crop.shape[0] > 0 and crop.shape[1] > 0:
        return crop, best_box

    return image, (0, 0, w, h)
