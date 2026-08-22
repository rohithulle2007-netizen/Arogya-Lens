"""Final model training and artifact export script."""
import argparse
import datetime
import json
import os
import sys
from typing import Any, Dict, List, Optional
import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.feature_selection import SelectKBest, f_regression
from sklearn.linear_model import Ridge
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.svm import SVR

# Ensure workspace root is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
from app.ai.features import FEATURE_NAMES_COLOR, FEATURE_NAMES_DEMO
from training.cross_validate import run_cross_validation


def train_final_model(
    features_csv: str = "training/artifacts/features_extracted.csv",
    model_output_path: str = "models/hb_model.joblib",
    metadata_output_path: str = "models/hb_model_metadata.json",
    preferred_model: Optional[str] = None
) -> None:
    """
    Trains the best pipeline on full dataset and exports model artifact & metadata.
    """
    cv_output = run_cross_validation(features_csv=features_csv)
    best_entry = cv_output["best_model"]

    print(f"\nSelected Best Model: {best_entry['model_name']} with {best_entry['feature_config']}")
    print(f"Validation MAE: {best_entry['oof_mae']:.3f} g/dL, RMSE: {best_entry['oof_rmse']:.3f} g/dL, R2: {best_entry['oof_r2']:.3f}")

    df = pd.read_csv(features_csv)
    feat_cols = FEATURE_NAMES_COLOR if "Color Only" in best_entry["feature_config"] else FEATURE_NAMES_COLOR + [f for f in FEATURE_NAMES_DEMO if f in df.columns]

    X = df[feat_cols]
    y = df["hb"].values

    model_name = preferred_model or best_entry["model_name"]
    if model_name == "Ridge":
        final_pipeline = Pipeline([
            ("scaler", StandardScaler()),
            ("select", SelectKBest(score_func=f_regression, k=min(12, len(feat_cols)))),
            ("regressor", Ridge(alpha=10.0, random_state=42))
        ])
    elif model_name == "SVR (RBF)":
        final_pipeline = Pipeline([
            ("scaler", StandardScaler()),
            ("select", SelectKBest(score_func=f_regression, k=min(10, len(feat_cols)))),
            ("regressor", SVR(C=1.5, epsilon=0.2, kernel="rbf"))
        ])
    elif model_name == "Random Forest":
        final_pipeline = Pipeline([
            ("scaler", StandardScaler()),
            ("regressor", RandomForestRegressor(n_estimators=100, max_depth=4, min_samples_split=4, random_state=42))
        ])
    else:
        final_pipeline = Pipeline([
            ("scaler", StandardScaler()),
            ("select", SelectKBest(score_func=f_regression, k=min(12, len(feat_cols)))),
            ("regressor", Ridge(alpha=10.0, random_state=42))
        ])

    final_pipeline.fit(X, y)

    os.makedirs(os.path.dirname(os.path.abspath(model_output_path)), exist_ok=True)
    joblib.dump(final_pipeline, model_output_path)
    print(f"Exported trained model artifact to: {model_output_path}")

    metadata = {
        "dataset_version": "India_Conjunctiva_v1.0",
        "num_participants": int(df["participant_id"].nunique()),
        "num_records": int(len(df)),
        "hb_target_summary": {
            "min": float(df["hb"].min()),
            "max": float(df["hb"].max()),
            "mean": float(round(df["hb"].mean(), 3)),
            "std": float(round(df["hb"].std(), 3))
        },
        "model_type": model_name,
        "feature_configuration": best_entry["feature_config"],
        "feature_names": feat_cols,
        "validation_method": "5-Fold GroupKFold (grouped by participant_id)",
        "cv_metrics": {
            "mae": best_entry["oof_mae"],
            "rmse": best_entry["oof_rmse"],
            "r2": best_entry["oof_r2"],
            "pearson_r": best_entry["oof_pearson_r"],
            "spearman_rho": best_entry["oof_spearman_rho"]
        },
        "training_timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "software_versions": {
            "python": sys.version.split()[0],
            "scikit-learn": "1.9.0",
            "joblib": "1.5.3"
        }
    }

    with open(metadata_output_path, "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2)
    print(f"Saved model metadata to: {metadata_output_path}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Train and export final Hb estimation model.")
    parser.add_argument("--features_csv", type=str, default="training/artifacts/features_extracted.csv")
    parser.add_argument("--model_output", type=str, default="models/hb_model.joblib")
    parser.add_argument("--metadata_output", type=str, default="models/hb_model_metadata.json")
    args = parser.parse_args()
    train_final_model(args.features_csv, args.model_output, args.metadata_output)
