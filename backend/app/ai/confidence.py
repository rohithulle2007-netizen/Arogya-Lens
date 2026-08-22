"""Prediction reliability calculation module."""
from typing import Dict, Optional


def calculate_reliability(
    image_quality_score: float,
    roi_quality_score: float,
    roi_pixel_count: int,
    extracted_features: Optional[Dict[str, float]] = None
) -> float:
    """
    Computes a transparent, measurable prediction reliability score (0.0 to 1.0).
    Based strictly on:
    1. Image quality (sharpness, lighting, glare)
    2. Conjunctiva ROI extraction quality and sample size
    3. Physiological color domain boundaries (erythema/redness bounds)
    """
    # 1. Base weights from image & ROI metrics
    w_image = 0.40
    w_roi = 0.40
    w_domain = 0.20

    # Image factor
    img_factor = max(0.0, min(1.0, image_quality_score))

    # ROI factor
    count_factor = min(1.0, roi_pixel_count / 1500.0)
    roi_factor = (roi_quality_score * 0.7) + (count_factor * 0.3)
    roi_factor = max(0.0, min(1.0, roi_factor))

    # Domain check factor: check if color features reside within plausible conjunctiva range
    domain_factor = 1.0
    if extracted_features:
        r_mean = extracted_features.get("rgb_r_mean", 0.0)
        g_mean = extracted_features.get("rgb_g_mean", 0.0)
        b_mean = extracted_features.get("rgb_b_mean", 0.0)
        a_mean = extracted_features.get("lab_a_mean", 0.0)

        # Conjunctiva should be reddish (R > G, R > B, a* > 128)
        if r_mean < g_mean or r_mean < b_mean:
            domain_factor *= 0.6
        if a_mean < 125.0:
            domain_factor *= 0.7
        if r_mean < 40.0 or r_mean > 245.0:
            domain_factor *= 0.8

    reliability = (w_image * img_factor) + (w_roi * roi_factor) + (w_domain * domain_factor)
    # Clip between 0.15 and 0.95 (never claim 100% certainty)
    return round(float(max(0.15, min(0.95, reliability))), 2)
