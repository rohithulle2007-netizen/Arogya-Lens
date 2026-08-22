"""Model evaluation and metrics calculation module."""
from typing import Dict, Optional, Tuple
import numpy as np
from scipy import stats
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score


def calculate_regression_metrics(
    y_true: np.ndarray,
    y_pred: np.ndarray
) -> Dict[str, float]:
    """
    Computes standard regression evaluation metrics:
    - MAE: Mean Absolute Error (g/dL)
    - RMSE: Root Mean Squared Error (g/dL)
    - R2: Coefficient of Determination
    - Pearson r: Linear correlation
    - Spearman rho: Rank correlation
    """
    y_true = np.asarray(y_true, dtype=np.float64)
    y_pred = np.asarray(y_pred, dtype=np.float64)

    mae = float(mean_absolute_error(y_true, y_pred))
    rmse = float(np.sqrt(mean_squared_error(y_true, y_pred)))
    r2 = float(r2_score(y_true, y_pred))

    if len(y_true) > 2 and np.std(y_true) > 1e-6 and np.std(y_pred) > 1e-6:
        pearson_r, _ = stats.pearsonr(y_true, y_pred)
        spearman_rho, _ = stats.spearmanr(y_true, y_pred)
    else:
        pearson_r, spearman_rho = 0.0, 0.0

    return {
        "mae": round(mae, 4),
        "rmse": round(rmse, 4),
        "r2": round(r2, 4),
        "pearson_r": round(float(pearson_r), 4),
        "spearman_rho": round(float(spearman_rho), 4),
    }


def print_evaluation_summary(metrics: Dict[str, float], title: str = "Evaluation Metrics"):
    """Prints a clean summary of model metrics."""
    print("\n" + "=" * 16 + " " + title + " " + "=" * 16)
    print(f"  MAE          : {metrics.get('mae', 0.0):.3f} g/dL")
    print(f"  RMSE         : {metrics.get('rmse', 0.0):.3f} g/dL")
    print(f"  R2 Score     : {metrics.get('r2', 0.0):.3f}")
    print(f"  Pearson r    : {metrics.get('pearson_r', 0.0):.3f}")
    print(f"  Spearman rho : {metrics.get('spearman_rho', 0.0):.3f}")
    print("=" * 50)
