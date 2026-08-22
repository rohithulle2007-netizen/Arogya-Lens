"""
Feature extraction script for the full Kaggle 'eyes-defy-anemia' dataset (India & Italy cohorts).
Extracts colorimetry, vascular erythema, and clinical demographic features.
"""
import argparse
import os
import sys
import cv2
import pandas as pd
from tqdm import tqdm

base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
sys.path.insert(0, os.path.join(base_dir, "backend"))
sys.path.insert(0, os.path.join(base_dir, "ml"))

from app.ai.conjunctiva import extract_conjunctiva_roi
from app.ai.features import extract_color_features
from dataset.kaggle_loader import load_cohort_manifest


def extract_features_from_kaggle_dataset(
    output_csv: str = os.path.join(base_dir, "ml", "training", "artifacts", "features_eyes_defy_anemia.csv")
) -> pd.DataFrame:
    """
    Extracts features for all participants in India & Italy cohorts.
    """
    manifest_df = load_cohort_manifest()
    records = []

    print(f"Extracting optical features for {len(manifest_df)} participants...")
    for _, row in tqdm(manifest_df.iterrows(), total=len(manifest_df)):
        p_id = str(row["participant_id"])
        hb = row["hb"]
        if pd.isna(hb):
            continue

        hb = float(hb)
        age = float(row["age"]) if pd.notna(row.get("age")) else 30.0
        gender = str(row["gender"]).strip().upper() if pd.notna(row.get("gender")) else "M"
        sex_str = "M" if gender.startswith("M") else "F"

        # Check all available image paths for this participant
        candidates = [
            row.get("palpebral_path"),
            row.get("forniceal_path"),
            row.get("original_path")
        ]
        img_paths = [str(p) for p in candidates if p is not None and pd.notna(p) and isinstance(p, str) and os.path.exists(p)]

        for p_path in img_paths:
            img = cv2.imread(p_path, cv2.IMREAD_UNCHANGED)
            if img is None or getattr(img, "size", 0) == 0:
                continue

            roi_res = extract_conjunctiva_roi(img)
            if roi_res.roi_pixel_count < 20:
                continue

            feats = extract_color_features(roi_res.roi_pixels, age=age, sex=sex_str)

            sample_type = "palpebral" if "palpebral" in p_path.lower() else ("forniceal" if "forniceal" in p_path.lower() else "general")

            record = {
                "participant_id": p_id,
                "cohort": row["cohort"],
                "sample_type": sample_type,
                "hb": hb,
                "age": age,
                "sex": sex_str,
                "roi_pixel_count": roi_res.roi_pixel_count,
                "roi_quality_score": roi_res.roi_quality_score,
                **feats
            }
            records.append(record)

    df_feats = pd.DataFrame(records)
    os.makedirs(os.path.dirname(os.path.abspath(output_csv)), exist_ok=True)
    df_feats.to_csv(output_csv, index=False)
    print(f"Extraction complete! Extracted {len(df_feats)} valid feature samples across {df_feats['participant_id'].nunique()} unique participants.")
    print(f"Saved to: {output_csv}")
    return df_feats


if __name__ == "__main__":
    extract_features_from_kaggle_dataset()
