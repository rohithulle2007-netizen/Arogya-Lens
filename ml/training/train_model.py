"""
Arogya Lens — Optimized Model Training & Artifact Export Script
Trains an ensemble regression pipeline on the clean multi-sample clinical dataset
and exports calibrated weights to ml/models/ and backend/app/ai/models/.
"""
import argparse
import datetime
import json
import os
import sys
from typing import Any, Dict, List, Optional
import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import ExtraTreesRegressor, RandomForestRegressor, VotingRegressor
from sklearn.feature_selection import SelectKBest, f_regression
from sklearn.model_selection import GroupKFold
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import RobustScaler
from sklearn.svm import SVR
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

# Ensure ml and backend directories are in sys.path
base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
sys.path.insert(0, os.path.join(base_dir, "backend"))
sys.path.insert(0, os.path.join(base_dir, "ml"))


def train_and_export_model(
    dataset_csv: Optional[str] = None,
    ml_model_output: Optional[str] = None,
    backend_model_output: Optional[str] = None,
    metadata_output: Optional[str] = None
) -> Dict[str, Any]:
    """
    Trains the calibrated ensemble model on the full clinical dataset and saves artifacts.
    """
    dataset_path = dataset_csv or os.path.join(base_dir, "ml", "training", "artifacts", "features_advanced_all_samples.csv")
    if not os.path.exists(dataset_path):
        dataset_path = os.path.join(base_dir, "ml", "training", "artifacts", "features_extracted.csv")

    print(f"Loading training dataset from: {dataset_path}")
    df = pd.read_csv(dataset_path)

    # Clean 16-bit RGB scale anomalies if present
    rgb_cols = [
        'rgb_r_mean', 'rgb_g_mean', 'rgb_b_mean',
        'rgb_r_median', 'rgb_g_median', 'rgb_b_median',
        'rgb_r_std', 'rgb_g_std', 'rgb_b_std',
        'rgb_r_p25', 'rgb_r_p75'
    ]
    for col in rgb_cols:
        if col in df.columns:
            mask = df[col] > 255
            if mask.any():
                df.loc[mask, col] = df.loc[mask, col] / 256.0

    # Feature columns
    feat_cols = [c for c in df.columns if c not in ['participant_id', 'sample_type', 'hb']]
    groups = df['participant_id'].values
    X = df[feat_cols].values
    y = df['hb'].values

    print(f"Dataset summary: {df['participant_id'].nunique()} unique participants, {len(df)} total samples, {len(feat_cols)} features")

    # Build optimized, scale-invariant ensemble pipeline
    k_features = min(22, len(feat_cols))
    pipeline = Pipeline([
        ('scaler', RobustScaler()),
        ('select', SelectKBest(score_func=f_regression, k=k_features)),
        ('regressor', VotingRegressor([
            ('et', ExtraTreesRegressor(n_estimators=150, max_depth=6, min_samples_split=3, random_state=42)),
            ('rf', RandomForestRegressor(n_estimators=150, max_depth=5, min_samples_split=3, random_state=42)),
            ('svr', SVR(C=2.5, epsilon=0.15, kernel='rbf', gamma='scale'))
        ]))
    ])

    # 5-Fold GroupKFold Cross-Validation evaluation
    gkf = GroupKFold(n_splits=5)
    oof_preds = np.zeros(len(df))

    print("\nRunning 5-Fold Participant GroupKFold Validation...")
    for fold, (train_idx, val_idx) in enumerate(gkf.split(X, y, groups=groups)):
        pipeline.fit(X[train_idx], y[train_idx])
        oof_preds[val_idx] = pipeline.predict(X[val_idx])

    cv_mae = float(mean_absolute_error(y, oof_preds))
    cv_rmse = float(np.sqrt(mean_squared_error(y, oof_preds)))
    cv_r2 = float(r2_score(y, oof_preds))
    cv_corr = float(np.corrcoef(y, oof_preds)[0, 1])

    print(f"✓ Cross-Validation Results across {df['participant_id'].nunique()} participants:")
    print(f"  • Validation MAE: {cv_mae:.3f} g/dL")
    print(f"  • Validation RMSE: {cv_rmse:.3f} g/dL")
    print(f"  • Validation R²: {cv_r2:.3f}")
    print(f"  • Pearson Correlation r: {cv_corr:.3f}")

    # Train final model on entire dataset
    pipeline.fit(df[feat_cols], y)

    # Save model weights to destination paths
    ml_out = ml_model_output or os.path.join(base_dir, "ml", "models", "hb_model.joblib")
    backend_out = backend_model_output or os.path.join(base_dir, "backend", "app", "ai", "models", "hb_model.joblib")

    os.makedirs(os.path.dirname(ml_out), exist_ok=True)
    os.makedirs(os.path.dirname(backend_out), exist_ok=True)

    joblib.dump(pipeline, ml_out)
    joblib.dump(pipeline, backend_out)
    print(f"\n✓ Exported trained model artifact to:\n  1. {ml_out}\n  2. {backend_out}")

    # Metadata dictionary
    meta_dict = {
        "dataset_version": "India_Conjunctiva_Clinical_v2.5",
        "num_participants": int(df["participant_id"].nunique()),
        "num_records": int(len(df)),
        "hb_target_summary": {
            "min": float(round(df["hb"].min(), 2)),
            "max": float(round(df["hb"].max(), 2)),
            "mean": float(round(df["hb"].mean(), 3)),
            "std": float(round(df["hb"].std(), 3))
        },
        "model_type": "Calibrated VotingRegressor (ExtraTrees + RandomForest + SVR RBF with RobustScaler)",
        "feature_names": feat_cols,
        "selected_k_features": k_features,
        "validation_method": "5-Fold GroupKFold (grouped by participant_id)",
        "cv_metrics": {
            "participant_mae": round(cv_mae, 3),
            "participant_rmse": round(cv_rmse, 3),
            "participant_r2": round(cv_r2, 3),
            "participant_pearson_r": round(cv_corr, 3)
        },
        "training_timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "software_versions": {
            "python": sys.version.split()[0],
            "scikit-learn": "1.9.0",
            "joblib": "1.5.3"
        }
    }

    meta_ml = metadata_output or os.path.join(base_dir, "ml", "models", "hb_model_metadata.json")
    meta_backend = os.path.join(base_dir, "backend", "app", "ai", "models", "hb_model_metadata.json")

    with open(meta_ml, "w", encoding="utf-8") as f:
        json.dump(meta_dict, f, indent=2)
    with open(meta_backend, "w", encoding="utf-8") as f:
        json.dump(meta_dict, f, indent=2)

    print(f"✓ Saved updated metadata to:\n  1. {meta_ml}\n  2. {meta_backend}")
    return meta_dict


if __name__ == "__main__":
    train_and_export_model()
