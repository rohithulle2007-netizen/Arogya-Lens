"""Unit tests for feature extraction module."""
import numpy as np
import pytest
import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
from app.ai.features import (
    extract_color_features,
    FEATURE_NAMES_COLOR,
    FEATURE_NAMES_DEMO,
    features_dict_to_dataframe,
    _encode_sex
)


def test_extract_color_features_keys():
    """Verify all expected color features are extracted."""
    # Synthetic conjunctiva-like reddish pixels
    np.random.seed(42)
    dummy_pixels = np.random.randint(120, 220, size=(500, 3), dtype=np.uint8)
    dummy_pixels[:, 0] = np.clip(dummy_pixels[:, 0] + 30, 0, 255)  # Higher red

    feats = extract_color_features(dummy_pixels, age=35, sex="M")

    for key in FEATURE_NAMES_COLOR:
        assert key in feats, f"Missing expected color feature: {key}"
        assert isinstance(feats[key], float)
        assert not np.isnan(feats[key])

    assert feats["age"] == 35.0
    assert feats["sex"] == 1.0


def test_empty_pixels_graceful_handling():
    """Test feature extractor on empty pixel array."""
    empty_pixels = np.zeros((0, 3), dtype=np.uint8)
    feats = extract_color_features(empty_pixels)

    for key in FEATURE_NAMES_COLOR:
        assert key in feats
        assert feats[key] == 0.0


def test_encode_sex():
    """Test sex encoding variations."""
    assert _encode_sex("M") == 1.0
    assert _encode_sex("Male") == 1.0
    assert _encode_sex("m") == 1.0
    assert _encode_sex("F") == 0.0
    assert _encode_sex("Female") == 0.0
    assert _encode_sex("f") == 0.0
    assert _encode_sex(1) == 1.0
    assert _encode_sex(0) == 0.0


def test_features_dict_to_dataframe():
    """Test DataFrame conversion with standard column alignment."""
    dummy_feats = {col: 1.0 for col in FEATURE_NAMES_COLOR}
    df = features_dict_to_dataframe(dummy_feats, FEATURE_NAMES_COLOR)

    assert df.shape == (1, len(FEATURE_NAMES_COLOR))
    assert list(df.columns) == FEATURE_NAMES_COLOR
