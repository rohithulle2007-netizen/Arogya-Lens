"""Hemoglobin estimation model wrapper and loader."""
from typing import Any, Dict, List, Optional, Tuple, Union
import json
import os
import joblib
import numpy as np
import pandas as pd
from .features import FEATURE_NAMES_COLOR, features_dict_to_dataframe

def _find_file(filename: str, subfolder: str = "models") -> str:
    candidates = [
        os.path.join(os.path.dirname(__file__), subfolder, filename),
        os.path.join(os.path.dirname(__file__), "..", "..", subfolder, filename),
        os.path.join(os.path.dirname(__file__), "..", "..", "ml", subfolder, filename),
        os.path.join(os.getcwd(), subfolder, filename),
        os.path.join(os.getcwd(), "ml", subfolder, filename),
        os.path.join(os.getcwd(), "backend", "app", "ai", subfolder, filename),
    ]
    for c in candidates:
        if os.path.exists(c):
            return os.path.abspath(c)
    return os.path.abspath(candidates[0])

DEFAULT_MODEL_PATH = _find_file("hb_model.joblib")
DEFAULT_METADATA_PATH = _find_file("hb_model_metadata.json")


class HbModelWrapper:
    """Wrapper around trained scikit-learn Hb regression pipeline."""

    def __init__(
        self,
        model_path: Optional[str] = None,
        metadata_path: Optional[str] = None,
        mock_mode: bool = False
    ):
        self.model_path = os.path.abspath(model_path or _find_file("hb_model.joblib"))
        self.metadata_path = os.path.abspath(metadata_path or _find_file("hb_model_metadata.json"))
        self.mock_mode = mock_mode
        self.model: Optional[Any] = None
        self.metadata: Dict[str, Any] = {}
        self.feature_names: List[str] = FEATURE_NAMES_COLOR

        if not self.mock_mode:
            self._load_model()

    def _load_model(self) -> None:
        """Loads trained model pipeline and metadata from disk."""
        if os.path.exists(self.metadata_path):
            try:
                with open(self.metadata_path, "r", encoding="utf-8") as f:
                    self.metadata = json.load(f)
                self.feature_names = self.metadata.get("feature_names", FEATURE_NAMES_COLOR)
            except Exception as e:
                print(f"[Warning] Failed loading metadata from {self.metadata_path}: {e}")

        if os.path.exists(self.model_path):
            try:
                self.model = joblib.load(self.model_path)
            except Exception as e:
                print(f"[Warning] Failed loading model from {self.model_path}: {e}. Switching to fallback mode.")
                self.model = None
        else:
            print(f"[Info] Model file {self.model_path} not found. Running in mock/baseline mode.")

    def is_loaded(self) -> bool:
        return self.model is not None

    def predict(
        self,
        features: Union[Dict[str, float], pd.DataFrame]
    ) -> float:
        """
        Predicts continuous hemoglobin level (estimated_hb in g/dL).
        """
        if self.mock_mode or self.model is None:
            # Deterministic mock/baseline based on erythema ratio
            if isinstance(features, dict):
                r_ratio = features.get("ratio_redness", 0.5)
                ei = features.get("erythema_index", 0.3)
                estimated_hb = 8.5 + (r_ratio * 4.0) + (ei * 2.5)
            else:
                estimated_hb = 11.5
            return round(float(np.clip(estimated_hb, 6.0, 18.0)), 2)

        # Convert dict to DataFrame with expected columns
        if isinstance(features, dict):
            df_features = features_dict_to_dataframe(features, self.feature_names)
        else:
            df_features = features[self.feature_names]

        pred = self.model.predict(df_features)
        hb_val = float(pred[0]) if hasattr(pred, "__len__") else float(pred)
        # Clip to physiologically plausible range [5.0, 20.0]
        return round(float(np.clip(hb_val, 5.0, 20.0)), 2)

    @staticmethod
    def get_screening_status(estimated_hb: float, sex: Optional[str] = None) -> Tuple[str, str]:
        """
        Returns screening classification and descriptive status message.
        Follows standard WHO screening thresholds:
        - Normal: >= 12.0 g/dL (or >= 11.5 g/dL adult female baseline)
        - Mild / Borderline Anemia: 11.0 - 11.9 g/dL (or 11.0 - 12.4 g/dL male)
        - Moderate Anemia: 8.0 - 10.9 g/dL
        - Severe Anemia / High Risk: < 8.0 g/dL
        """
        is_male = str(sex).strip().upper().startswith("M") if sex else False

        if estimated_hb < 8.0:
            status = "severe_anemia"
            msg = f"Estimated Hb is {estimated_hb:.1f} g/dL, indicating significantly low hemoglobin. Prompt clinical consultation recommended."
        elif estimated_hb < 10.5:
            status = "moderate_anemia"
            msg = f"Estimated Hb is {estimated_hb:.1f} g/dL, indicating moderate hemoglobin deficiency. Clinical evaluation recommended."
        elif (is_male and estimated_hb < 12.5) or (not is_male and estimated_hb < 11.5):
            status = "mild_anemia"
            msg = f"Estimated Hb is {estimated_hb:.1f} g/dL, suggesting borderline/mild anemia. Routine follow-up recommended."
        else:
            status = "likely_normal"
            msg = f"Estimated Hb is {estimated_hb:.1f} g/dL, within normal healthy range."

        return status, msg


_cached_model: Optional[HbModelWrapper] = None


def get_default_model(mock_mode: Optional[bool] = None) -> HbModelWrapper:
    global _cached_model
    is_mock = os.getenv("AI_MOCK_MODE", "false").lower() in ("1", "true", "yes") if mock_mode is None else mock_mode
    if _cached_model is None or _cached_model.mock_mode != is_mock:
        _cached_model = HbModelWrapper(mock_mode=is_mock)
    return _cached_model
