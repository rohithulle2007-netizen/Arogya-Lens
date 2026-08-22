"""Interpretable color, erythema, and statistical feature extraction module."""
from typing import Dict, List, Optional, Union
import cv2
import numpy as np
import pandas as pd

FEATURE_NAMES_COLOR = [
    "rgb_r_mean", "rgb_g_mean", "rgb_b_mean",
    "rgb_r_median", "rgb_g_median", "rgb_b_median",
    "rgb_r_std", "rgb_g_std", "rgb_b_std",
    "rgb_r_p25", "rgb_r_p75",
    "r_norm", "g_norm", "b_norm",
    "norm_erythema",
    "hsv_h_mean", "hsv_s_mean", "hsv_v_mean",
    "hsv_s_std", "hsv_v_std", "hsv_s_med", "hsv_v_med",
    "lab_l_mean", "lab_a_mean", "lab_b_mean",
    "lab_l_med", "lab_a_med", "lab_b_med",
    "lab_a_std", "lab_b_std", "lab_a_p75",
    "cr_mean", "cb_mean", "cr_std", "y_lum_mean",
    "ratio_rg", "ratio_rb", "ratio_redness",
    "relative_redness", "relative_red_blue",
    "erythema_log", "erythema_a_l", "erythema_cr_y"
]

FEATURE_NAMES_DEMO = ["age", "sex"]
FEATURE_NAMES_ALL = FEATURE_NAMES_COLOR + FEATURE_NAMES_DEMO


def extract_color_features(
    roi_pixels_rgb: np.ndarray,
    age: Optional[Union[int, float]] = None,
    sex: Optional[Union[str, int, float]] = None
) -> Dict[str, float]:
    """
    Extracts standardized statistical and physiological erythema features from conjunctiva RGB pixels.
    """
    if roi_pixels_rgb is None or len(roi_pixels_rgb) == 0:
        feats = {f: 0.0 for f in FEATURE_NAMES_COLOR}
        if age is not None and not np.isnan(float(age)):
            feats["age"] = float(age)
        if sex is not None:
            feats["sex"] = _encode_sex(sex)
        return feats

    r = roi_pixels_rgb[:, 0].astype(np.float64)
    g = roi_pixels_rgb[:, 1].astype(np.float64)
    b = roi_pixels_rgb[:, 2].astype(np.float64)

    eps = 1e-6

    # 1. RGB statistics
    r_mean, g_mean, b_mean = float(np.mean(r)), float(np.mean(g)), float(np.mean(b))
    r_med, g_med, b_med = float(np.median(r)), float(np.median(g)), float(np.median(b))
    r_std, g_std, b_std = float(np.std(r)), float(np.std(g)), float(np.std(b))
    r_p25, r_p75 = float(np.percentile(r, 25)), float(np.percentile(r, 75))

    # White-balanced normalized R (gray-world normalization)
    mean_gray = (r_mean + g_mean + b_mean) / 3.0 + eps
    r_norm = r_mean / mean_gray
    g_norm = g_mean / mean_gray
    b_norm = b_mean / mean_gray
    norm_erythema = r_norm / (g_norm + eps)

    reshaped_rgb = roi_pixels_rgb.reshape(1, -1, 3).astype(np.uint8)

    # 2. HSV statistics
    hsv = cv2.cvtColor(reshaped_rgb, cv2.COLOR_RGB2HSV).reshape(-1, 3).astype(np.float64)
    h_mean, s_mean, v_mean = float(np.mean(hsv[:, 0])), float(np.mean(hsv[:, 1])), float(np.mean(hsv[:, 2]))
    s_std, v_std = float(np.std(hsv[:, 1])), float(np.std(hsv[:, 2]))
    s_med, v_med = float(np.median(hsv[:, 1])), float(np.median(hsv[:, 2]))

    # 3. CIELAB statistics (Erythema & Pallor)
    lab = cv2.cvtColor(reshaped_rgb, cv2.COLOR_RGB2LAB).reshape(-1, 3).astype(np.float64)
    l_mean, a_mean, b_lab_mean = float(np.mean(lab[:, 0])), float(np.mean(lab[:, 1])), float(np.mean(lab[:, 2]))
    l_med, a_med, b_lab_med = float(np.median(lab[:, 0])), float(np.median(lab[:, 1])), float(np.median(lab[:, 2]))
    a_std, b_lab_std = float(np.std(lab[:, 1])), float(np.std(lab[:, 2]))
    a_p75 = float(np.percentile(lab[:, 1], 75))

    # 4. YCrCb statistics
    ycrcb = cv2.cvtColor(reshaped_rgb, cv2.COLOR_RGB2YCrCb).reshape(-1, 3).astype(np.float64)
    y_lum_mean = float(np.mean(ycrcb[:, 0]))
    cr_mean = float(np.mean(ycrcb[:, 1]))
    cb_mean = float(np.mean(ycrcb[:, 2]))
    cr_std = float(np.std(ycrcb[:, 1]))

    # 5. Physiological Ratios & Erythema Indices
    ratio_rg = r_mean / (g_mean + eps)
    ratio_rb = r_mean / (b_mean + eps)
    ratio_redness = r_mean / (g_mean + b_mean + eps)
    relative_redness = (r_mean - g_mean) / (r_mean + g_mean + eps)
    relative_red_blue = (r_mean - b_mean) / (r_mean + b_mean + eps)
    erythema_log = float(np.log(r_mean + 1.0) - np.log(g_mean + 1.0))
    erythema_a_l = a_mean / (l_mean + eps)
    erythema_cr_y = cr_mean / (y_lum_mean + eps)

    features: Dict[str, float] = {
        "rgb_r_mean": round(r_mean, 4), "rgb_g_mean": round(g_mean, 4), "rgb_b_mean": round(b_mean, 4),
        "rgb_r_median": round(r_med, 4), "rgb_g_median": round(g_med, 4), "rgb_b_median": round(b_med, 4),
        "rgb_r_std": round(r_std, 4), "rgb_g_std": round(g_std, 4), "rgb_b_std": round(b_std, 4),
        "rgb_r_p25": round(r_p25, 4), "rgb_r_p75": round(r_p75, 4),
        "r_norm": round(r_norm, 4), "g_norm": round(g_norm, 4), "b_norm": round(b_norm, 4),
        "norm_erythema": round(norm_erythema, 4),
        "hsv_h_mean": round(h_mean, 4), "hsv_s_mean": round(s_mean, 4), "hsv_v_mean": round(v_mean, 4),
        "hsv_s_std": round(s_std, 4), "hsv_v_std": round(v_std, 4), "hsv_s_med": round(s_med, 4), "hsv_v_med": round(v_med, 4),
        "lab_l_mean": round(l_mean, 4), "lab_a_mean": round(a_mean, 4), "lab_b_mean": round(b_lab_mean, 4),
        "lab_l_med": round(l_med, 4), "lab_a_med": round(a_med, 4), "lab_b_med": round(b_lab_med, 4),
        "lab_a_std": round(a_std, 4), "lab_b_std": round(b_lab_std, 4), "lab_a_p75": round(a_p75, 4),
        "cr_mean": round(cr_mean, 4), "cb_mean": round(cb_mean, 4), "cr_std": round(cr_std, 4), "y_lum_mean": round(y_lum_mean, 4),
        "ratio_rg": round(ratio_rg, 4), "ratio_rb": round(ratio_rb, 4), "ratio_redness": round(ratio_redness, 4),
        "relative_redness": round(relative_redness, 4), "relative_red_blue": round(relative_red_blue, 4),
        "erythema_log": round(erythema_log, 4), "erythema_a_l": round(erythema_a_l, 4), "erythema_cr_y": round(erythema_cr_y, 4)
    }

    if age is not None and not np.isnan(float(age)):
        features["age"] = float(age)
    if sex is not None:
        features["sex"] = _encode_sex(sex)

    return features


def _encode_sex(sex: Union[str, int, float]) -> float:
    if isinstance(sex, (int, float)):
        return float(sex)
    s = str(sex).strip().upper()
    if s.startswith("M") or s == "1":
        return 1.0
    return 0.0


def features_dict_to_dataframe(
    features: Union[Dict[str, float], List[Dict[str, float]]],
    feature_names: Optional[List[str]] = None
) -> pd.DataFrame:
    if isinstance(features, dict):
        df = pd.DataFrame([features])
    else:
        df = pd.DataFrame(features)

    if feature_names is not None:
        for col in feature_names:
            if col not in df.columns:
                df[col] = np.nan if col in ["age", "sex"] else 0.0
        df = df[feature_names]

    return df
