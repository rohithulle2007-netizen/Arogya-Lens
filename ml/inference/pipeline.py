"""Unified inference pipeline for Arogya Lens screening prototype."""
from dataclasses import dataclass, asdict
from typing import Any, Dict, Optional, Union
import cv2
import numpy as np

from .image_quality import check_image_quality, ImageQualityResult
from .eye_detector import detect_eye_region
from .conjunctiva import extract_conjunctiva_roi, ConjunctivaROIResult
from .features import extract_color_features
from .confidence import calculate_reliability
from .hb_model import HbModelWrapper, get_default_model


@dataclass
class ScreeningResult:
    success: bool
    estimated_hb: Optional[float]
    prediction_reliability: float
    status: str
    image_quality: str
    message: str
    metrics: Dict[str, Any]


class ArogyaLensPipeline:
    """
    End-to-end inference pipeline:
    Image -> Quality Check -> Eye Detection -> Conjunctiva ROI -> Feature Extraction -> Hb Model -> Reliability -> Screening Result
    """

    def __init__(self, model: Optional[HbModelWrapper] = None):
        self.model = model or get_default_model()

    def analyze_image_bytes(
        self,
        image_bytes: bytes,
        age: Optional[float] = None,
        sex: Optional[str] = None
    ) -> ScreeningResult:
        """Processes raw image bytes (e.g. from multipart HTTP upload)."""
        np_arr = np.frombuffer(image_bytes, np.uint8)
        # Try decoding with alpha channel first, then standard BGR
        img = cv2.imdecode(np_arr, cv2.IMREAD_UNCHANGED)
        if img is None:
            return ScreeningResult(
                success=False,
                estimated_hb=None,
                prediction_reliability=0.0,
                status="invalid_image",
                image_quality="poor",
                message="Failed to decode image file. Please provide a valid JPG or PNG.",
                metrics={}
            )
        return self.analyze_image_array(img, age=age, sex=sex)

    def analyze_image_array(
        self,
        image: np.ndarray,
        age: Optional[float] = None,
        sex: Optional[str] = None
    ) -> ScreeningResult:
        """Processes an in-memory numpy image array."""
        # 1. Quality Check
        quality: ImageQualityResult = check_image_quality(image)
        if not quality.is_valid and quality.score < 0.15:
            warning_text = "; ".join(quality.warnings) if quality.warnings else "Image quality too low."
            return ScreeningResult(
                success=False,
                estimated_hb=None,
                prediction_reliability=quality.score,
                status="poor_quality",
                image_quality=quality.quality_label,
                message=f"Image rejected: {warning_text}",
                metrics={"quality": quality.metrics}
            )

        # 2. Eye & Conjunctiva ROI Detection
        # If image does not have alpha channel, crop eye focus
        if len(image.shape) == 3 and image.shape[2] == 4:
            cropped_eye = image
        else:
            cropped_eye, _ = detect_eye_region(image)

        # 3. Conjunctiva extraction
        roi_result: ConjunctivaROIResult = extract_conjunctiva_roi(cropped_eye)

        if roi_result.roi_pixel_count < 30:
            return ScreeningResult(
                success=False,
                estimated_hb=None,
                prediction_reliability=0.1,
                status="roi_detection_failed",
                image_quality=quality.quality_label,
                message="Could not clearly isolate conjunctiva region. Please retake photo focusing on inner lower eyelid.",
                metrics={"quality": quality.metrics}
            )

        # 4. Feature Extraction (identical to training pipeline)
        features = extract_color_features(roi_result.roi_pixels, age=age, sex=sex)

        # 5. Hb Regression
        estimated_hb = self.model.predict(features)

        # 6. Reliability Assessment
        reliability = calculate_reliability(
            image_quality_score=quality.score,
            roi_quality_score=roi_result.roi_quality_score,
            roi_pixel_count=roi_result.roi_pixel_count,
            extracted_features=features
        )

        # 7. Screening Status
        status, msg = self.model.get_screening_status(estimated_hb, sex=sex)

        return ScreeningResult(
            success=True,
            estimated_hb=estimated_hb,
            prediction_reliability=reliability,
            status=status,
            image_quality=quality.quality_label,
            message=msg,
            metrics={
                "quality": quality.metrics,
                "roi_pixel_count": roi_result.roi_pixel_count,
                "roi_quality": roi_result.roi_quality_score,
                "features_summary": {
                    "erythema_index": features.get("erythema_index", 0.0),
                    "ratio_redness": features.get("ratio_redness", 0.0),
                    "lab_a_mean": features.get("lab_a_mean", 0.0),
                }
            }
        )


_default_pipeline: Optional[ArogyaLensPipeline] = None


def get_pipeline() -> ArogyaLensPipeline:
    global _default_pipeline
    if _default_pipeline is None:
        _default_pipeline = ArogyaLensPipeline()
    return _default_pipeline
