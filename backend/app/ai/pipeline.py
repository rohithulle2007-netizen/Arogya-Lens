"""Unified inference pipeline for Arogya Lens multi-site screening prototype."""
from dataclasses import dataclass, asdict
from typing import Any, Dict, Optional, Union, List
import cv2
import numpy as np

from .image_quality import check_image_quality, ImageQualityResult
from .eye_detector import detect_eye_region
from .conjunctiva import extract_conjunctiva_roi, ConjunctivaROIResult
from .nail_bed import extract_nail_bed_roi, extract_nail_bed_features, NailBedROIResult
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
    End-to-end inference pipeline supporting single eye and 4-site multi-modal screening:
    (Left Eye + Right Eye + Left Thumb + Right Thumb) -> ROI Extraction -> Feature Fusion -> Ensemble Hb Regression.
    """

    def __init__(self, model: Optional[HbModelWrapper] = None):
        self.model = model or get_default_model()

    def analyze_image_bytes(
        self,
        image_bytes: bytes,
        age: Optional[float] = None,
        sex: Optional[str] = None
    ) -> ScreeningResult:
        """Processes raw image bytes (e.g. from single-file multipart upload)."""
        np_arr = np.frombuffer(image_bytes, np.uint8)
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
        """Processes an in-memory numpy image array for single eye conjunctiva."""
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

        # 4. Feature Extraction
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

    def analyze_multisite(
        self,
        left_eye: Optional[np.ndarray] = None,
        right_eye: Optional[np.ndarray] = None,
        left_thumb: Optional[np.ndarray] = None,
        right_thumb: Optional[np.ndarray] = None,
        age: Optional[float] = None,
        sex: Optional[str] = None
    ) -> ScreeningResult:
        """
        Executes multi-site optical analysis across bilateral eyes and bilateral thumbs.
        Combines conjunctival pallor and peripheral nail bed vascularity for high-precision screening.
        """
        site_features: List[Dict[str, float]] = []
        site_qualities: List[float] = []
        site_metrics: Dict[str, Any] = {}

        # 1. Process Left Eye
        if left_eye is not None and getattr(left_eye, "size", 0) > 0:
            q_le = check_image_quality(left_eye)
            cropped_le, _ = detect_eye_region(left_eye)
            roi_le = extract_conjunctiva_roi(cropped_le)
            if roi_le.roi_pixel_count >= 20:
                feat_le = extract_color_features(roi_le.roi_pixels, age=age, sex=sex)
                site_features.append(feat_le)
                site_qualities.append(q_le.score)
                site_metrics["left_eye"] = {
                    "status": "detected",
                    "quality": q_le.quality_label,
                    "erythema_index": feat_le.get("erythema_index", 0.0),
                    "redness": feat_le.get("ratio_redness", 0.0),
                }

        # 2. Process Right Eye
        if right_eye is not None and getattr(right_eye, "size", 0) > 0:
            q_re = check_image_quality(right_eye)
            cropped_re, _ = detect_eye_region(right_eye)
            roi_re = extract_conjunctiva_roi(cropped_re)
            if roi_re.roi_pixel_count >= 20:
                feat_re = extract_color_features(roi_re.roi_pixels, age=age, sex=sex)
                site_features.append(feat_re)
                site_qualities.append(q_re.score)
                site_metrics["right_eye"] = {
                    "status": "detected",
                    "quality": q_re.quality_label,
                    "erythema_index": feat_re.get("erythema_index", 0.0),
                    "redness": feat_re.get("ratio_redness", 0.0),
                }

        # 3. Process Left Thumb (Nail Bed)
        if left_thumb is not None and getattr(left_thumb, "size", 0) > 0:
            q_lt = check_image_quality(left_thumb)
            roi_lt = extract_nail_bed_roi(left_thumb)
            if roi_lt.roi_pixel_count >= 20:
                feat_lt = extract_color_features(roi_lt.roi_pixels, age=age, sex=sex)
                site_features.append(feat_lt)
                site_qualities.append(q_lt.score)
                site_metrics["left_thumb"] = {
                    "status": "detected",
                    "quality": q_lt.quality_label,
                    "erythema_index": feat_lt.get("erythema_index", 0.0),
                    "redness": feat_lt.get("ratio_redness", 0.0),
                }

        # 4. Process Right Thumb (Nail Bed)
        if right_thumb is not None and getattr(right_thumb, "size", 0) > 0:
            q_rt = check_image_quality(right_thumb)
            roi_rt = extract_nail_bed_roi(right_thumb)
            if roi_rt.roi_pixel_count >= 20:
                feat_rt = extract_color_features(roi_rt.roi_pixels, age=age, sex=sex)
                site_features.append(feat_rt)
                site_qualities.append(q_rt.score)
                site_metrics["right_thumb"] = {
                    "status": "detected",
                    "quality": q_rt.quality_label,
                    "erythema_index": feat_rt.get("erythema_index", 0.0),
                    "redness": feat_rt.get("ratio_redness", 0.0),
                }

        # If no sites yielded features, fallback to single image or default
        if not site_features:
            for cand in [left_eye, right_eye, left_thumb, right_thumb]:
                if cand is not None and getattr(cand, "size", 0) > 0:
                    return self.analyze_image_array(cand, age=age, sex=sex)
            return ScreeningResult(
                success=False,
                estimated_hb=None,
                prediction_reliability=0.0,
                status="low_confidence",
                image_quality="poor",
                message="No clear optical regions could be detected from the 4 scans.",
                metrics={"sites": site_metrics}
            )

        # Multi-Site Optical Biomarker Fusion
        merged_features: Dict[str, float] = {}
        all_keys = list(site_features[0].keys())
        for k in all_keys:
            vals = [sf[k] for sf in site_features if k in sf and sf[k] is not None]
            merged_features[k] = float(np.mean(vals)) if vals else 0.0

        estimated_hb = self.model.predict(merged_features)

        # Higher multi-site reliability boost
        base_quality = float(np.mean(site_qualities)) if site_qualities else 0.8
        site_count_factor = min(1.0, 0.70 + (len(site_features) * 0.075))
        multi_reliability = round(min(0.98, max(0.60, base_quality * site_count_factor)), 2)

        status, msg = self.model.get_screening_status(estimated_hb, sex=sex)

        return ScreeningResult(
            success=True,
            estimated_hb=estimated_hb,
            prediction_reliability=multi_reliability,
            status=status,
            image_quality="good" if base_quality >= 0.65 else "poor",
            message=f"4-site assessment complete ({len(site_features)} sites verified): {msg}",
            metrics={
                "sites_analyzed": len(site_features),
                "sites": site_metrics,
                "fused_features": {
                    "erythema_index": round(merged_features.get("erythema_index", 0.0), 4),
                    "ratio_redness": round(merged_features.get("ratio_redness", 0.0), 4),
                    "lab_a_mean": round(merged_features.get("lab_a_mean", 0.0), 2),
                }
            }
        )


_default_pipeline: Optional[ArogyaLensPipeline] = None


def get_pipeline() -> ArogyaLensPipeline:
    global _default_pipeline
    if _default_pipeline is None:
        _default_pipeline = ArogyaLensPipeline()
    return _default_pipeline
