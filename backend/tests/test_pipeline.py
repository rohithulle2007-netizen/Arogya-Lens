"""Unit and integration tests for AI inference pipeline."""
import os
import sys
import numpy as np
import pytest

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
from app.ai.image_quality import check_image_quality
from app.ai.conjunctiva import extract_conjunctiva_roi
from app.ai.confidence import calculate_reliability
from app.ai.hb_model import HbModelWrapper, get_default_model
from app.ai.pipeline import ArogyaLensPipeline, ScreeningResult


def test_image_quality_sharp_vs_blurry():
    """Test image quality assessment on sharp vs artificially blurred image."""
    # Sharp image
    np.random.seed(42)
    sharp_img = np.random.randint(50, 200, size=(400, 400, 3), dtype=np.uint8)
    res_sharp = check_image_quality(sharp_img)
    assert res_sharp.metrics["sharpness"] > 0

    # Flat/blurry image
    flat_img = np.ones((400, 400, 3), dtype=np.uint8) * 128
    res_flat = check_image_quality(flat_img)
    assert res_flat.metrics["sharpness"] < 5.0
    assert any("blurry" in w.lower() for w in res_flat.warnings)


def test_conjunctiva_roi_extraction_rgba():
    """Test extraction on synthetic RGBA image with alpha mask."""
    img_rgba = np.zeros((200, 200, 4), dtype=np.uint8)
    img_rgba[50:150, 50:150, 0] = 180  # R
    img_rgba[50:150, 50:150, 1] = 90   # G
    img_rgba[50:150, 50:150, 2] = 100  # B
    img_rgba[50:150, 50:150, 3] = 255  # Alpha

    roi_res = extract_conjunctiva_roi(img_rgba)
    assert roi_res.roi_pixel_count == 10000
    assert roi_res.roi_pixels.shape == (10000, 3)
    assert roi_res.roi_quality_score > 0.5


def test_reliability_scoring():
    """Verify calculated reliability reflects quality inputs."""
    rel_high = calculate_reliability(
        image_quality_score=0.9,
        roi_quality_score=0.9,
        roi_pixel_count=2000,
        extracted_features={"rgb_r_mean": 180, "rgb_g_mean": 100, "rgb_b_mean": 90, "lab_a_mean": 140}
    )
    rel_low = calculate_reliability(
        image_quality_score=0.2,
        roi_quality_score=0.2,
        roi_pixel_count=50,
        extracted_features={"rgb_r_mean": 80, "rgb_g_mean": 120, "rgb_b_mean": 140, "lab_a_mean": 110}
    )
    assert 0.15 <= rel_high <= 0.95
    assert 0.15 <= rel_low <= 0.95
    assert rel_high > rel_low


def test_pipeline_on_dataset_sample():
    """Test complete pipeline on actual dataset image if present."""
    pipeline = ArogyaLensPipeline()
    sample_path = "1/20200118_164733_forniceal_palpebral.png"
    if os.path.exists(sample_path):
        with open(sample_path, "rb") as f:
            img_bytes = f.read()

        result: ScreeningResult = pipeline.analyze_image_bytes(img_bytes, age=29, sex="M")
        assert result.success is True
        assert result.estimated_hb is not None
        assert 5.0 <= result.estimated_hb <= 20.0
        assert 0.0 <= result.prediction_reliability <= 1.0
        assert result.status in ["normal", "mild_anemia", "moderate_anemia", "severe_anemia"]
