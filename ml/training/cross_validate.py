"""Participant-aware GroupKFold cross-validation suite."""
import argparse
import json
import os
import sys
from typing import Any, Dict, List
import numpy as np
import pandas as pd
from sklearn.ensemble import GradientBoostingRegressor, RandomForestRegressor
from sklearn.feature_selection import SelectKBest, f_regression
from sklearn.linear_model import ElasticNet, HuberRegressor, Ridge
from sklearn.model_selection import GroupKFold
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.svm import SVR

# Ensure workspace root is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
from app.ai.features import FEATURE_NAMES_COLOR, FEATURE_NAMES_DEMO
from training.evaluate_model import calculate_regression_metrics


def run_cross_validation(
    features_csv: str = "training/artifacts/features_extracted.csv",
    n_splits: int = 5,
    random_state: int = 42,
    output_json: str = "training/artifacts/cv_results.json"
) -> Dict[str, Any]:
    """
    Performs participant/group-aware GroupKFold cross validation comparing:
    - Feature sets: MODEL A (Color only) vs MODEL B (Color + Demographics)
    - Algorithms: Ridge, Huber, Random Forest, Gradient Boosting, SVR
    """
    if not os.path.exists(features_csv):
        raise FileNotFoundError(f"Features file not found at {features_csv}. Run extract_features.py first.")

    df = pd.read_csv(features_csv)
    groups = df["participant_id"].values
    y = df["hb"].values

    feature_configs = {
        "MODEL A (Color Only)": FEATURE_NAMES_COLOR,
        "MODEL B (Color + Demographics)": FEATURE_NAMES_COLOR + [f for f in FEATURE_NAMES_DEMO if f in df.columns]
    }

    model_factories = {
        "Ridge": lambda: Pipeline([
            ("scaler", StandardScaler()),
            ("select", SelectKBest(score_func=f_regression, k=min(12, len(FEATURE_NAMES_COLOR)))),
            ("regressor", Ridge(alpha=10.0, random_state=random_state))
        ]),
        "Huber": lambda: Pipeline([
            ("scaler", StandardScaler()),
            ("select", SelectKBest(score_func=f_regression, k=min(12, len(FEATURE_NAMES_COLOR)))),
            ("regressor", HuberRegressor(epsilon=1.35, max_iter=1000))
        ]),
        "Random Forest": lambda: Pipeline([
            ("scaler", StandardScaler()),
            ("regressor", RandomForestRegressor(n_estimators=100, max_depth=4, min_samples_split=4, random_state=random_state))
        ]),
        "Gradient Boosting": lambda: Pipeline([
            ("scaler", StandardScaler()),
            ("regressor", GradientBoostingRegressor(n_estimators=50, max_depth=3, learning_rate=0.05, random_state=random_state))
        ]),
        "SVR (RBF)": lambda: Pipeline([
            ("scaler", StandardScaler()),
            ("select", SelectKBest(score_func=f_regression, k=min(10, len(FEATURE_NAMES_COLOR)))),
            ("regressor", SVR(C=1.5, epsilon=0.2, kernel="rbf"))
        ]),
    }

    gkf = GroupKFold(n_splits=n_splits)
    results = []

    print(f"Starting {n_splits}-fold GroupKFold Cross-Validation across {len(np.unique(groups))} unique participants...")

    for config_name, feat_cols in feature_configs.items():
        X = df[feat_cols].values

        for model_name, factory in model_factories.items():
            oof_preds = np.zeros(len(df))
            fold_metrics = []

            for fold_idx, (train_idx, val_idx) in enumerate(gkf.split(X, y, groups=groups)):
                X_train, y_train = X[train_idx], y[train_idx]
                X_val, y_val = X[val_idx], y[val_idx]

                pipe = factory()
                if "select" in pipe.named_steps:
                    k_val = min(pipe.named_steps["select"].k, X_train.shape[1])
                    pipe.set_params(select__k=k_val)

                pipe.fit(X_train, y_train)
                val_pred = pipe.predict(X_val)
                oof_preds[val_idx] = val_pred

                f_metric = calculate_regression_metrics(y_val, val_pred)
                fold_metrics.append(f_metric)

            overall_metrics = calculate_regression_metrics(y, oof_preds)
            mean_mae = float(np.mean([m["mae"] for m in fold_metrics]))
            std_mae = float(np.std([m["mae"] for m in fold_metrics]))
            mean_rmse = float(np.mean([m["rmse"] for m in fold_metrics]))
            std_rmse = float(np.std([m["rmse"] for m in fold_metrics]))
            mean_r2 = float(np.mean([m["r2"] for m in fold_metrics]))

            results.append({
                "model_name": model_name,
                "feature_config": config_name,
                "features_count": len(feat_cols),
                "oof_mae": overall_metrics["mae"],
                "oof_rmse": overall_metrics["rmse"],
                "oof_r2": overall_metrics["r2"],
                "oof_pearson_r": overall_metrics["pearson_r"],
                "oof_spearman_rho": overall_metrics["spearman_rho"],
                "mean_cv_mae": round(mean_mae, 4),
                "std_cv_mae": round(std_mae, 4),
                "mean_cv_rmse": round(mean_rmse, 4),
                "std_cv_rmse": round(std_rmse, 4),
                "mean_cv_r2": round(mean_r2, 4),
                "fold_metrics": fold_metrics
            })

    results_df = pd.DataFrame(results)
    results_df = results_df.sort_values(by="oof_mae", ascending=True)

    print("\n" + "=" * 94)
    print(f"{'Model':<18} | {'Feature Set':<30} | {'CV MAE':<14} | {'CV RMSE':<10} | {'CV R2':<8} | {'Pearson r':<9}")
    print("=" * 94)
    for _, r in results_df.iterrows():
        print(f"{r['model_name']:<18} | {r['feature_config']:<30} | {r['oof_mae']:.3f} +/- {r['std_cv_mae']:.2f}  | {r['oof_rmse']:.3f}    | {r['oof_r2']:.3f}   | {r['oof_pearson_r']:.3f}")
    print("=" * 94)

    os.makedirs(os.path.dirname(os.path.abspath(output_json)), exist_ok=True)
    with open(output_json, "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2)
    print(f"\nSaved cross-validation results to: {output_json}")

    return {
        "best_model": results_df.iloc[0].to_dict(),
        "all_results": results
    }


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="GroupKFold Cross-Validation.")
    parser.add_argument("--features_csv", type=str, default="training/artifacts/features_extracted.csv")
    parser.add_argument("--splits", type=int, default=5)
    parser.add_argument("--output_json", type=str, default="training/artifacts/cv_results.json")
    args = parser.parse_args()
    run_cross_validation(args.features_csv, args.splits, output_json=args.output_json)
