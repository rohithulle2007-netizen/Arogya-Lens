"""Feature extraction script for all dataset entries."""
import argparse
import os
import sys
import cv2
import pandas as pd
from tqdm import tqdm

# Ensure workspace root is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
from app.ai.conjunctiva import extract_conjunctiva_roi
from app.ai.features import extract_color_features, FEATURE_NAMES_COLOR


def extract_all_features(
    manifest_csv: str = "training/artifacts/dataset_manifest.csv",
    output_features_csv: str = "training/artifacts/features_extracted.csv"
) -> pd.DataFrame:
    """
    Extracts features for all images in manifest using exact app.ai modules.
    """
    if not os.path.exists(manifest_csv):
        raise FileNotFoundError(f"Manifest not found at {manifest_csv}. Run prepare_dataset.py first.")

    manifest_df = pd.read_csv(manifest_csv)
    records = []

    print(f"Extracting features for {len(manifest_df)} records...")
    for idx, row in tqdm(manifest_df.iterrows(), total=len(manifest_df)):
        p_id = str(row["participant_id"])
        roi_path = row["primary_roi_path"]
        hb = float(row["hb"])
        age = row.get("age")
        sex = row.get("sex")

        # Load image (with alpha channel if available)
        img = cv2.imread(roi_path, cv2.IMREAD_UNCHANGED)
        if img is None:
            # Try raw image
            img = cv2.imread(row["raw_image_path"], cv2.IMREAD_UNCHANGED)

        if img is None:
            print(f"Warning: Could not read image for participant {p_id} at {roi_path}")
            continue

        # Extract conjunctiva ROI
        roi_res = extract_conjunctiva_roi(img)

        # Extract features
        feats = extract_color_features(roi_res.roi_pixels, age=age, sex=sex)

        record = {
            "participant_id": p_id,
            "hb": hb,
            "roi_pixel_count": roi_res.roi_pixel_count,
            "roi_quality_score": roi_res.roi_quality_score,
            **feats
        }
        records.append(record)

    df_feats = pd.DataFrame(records)
    os.makedirs(os.path.dirname(os.path.abspath(output_features_csv)), exist_ok=True)
    df_feats.to_csv(output_features_csv, index=False)
    print(f"Feature extraction complete! Saved {len(df_feats)} records to: {output_features_csv}")
    return df_feats


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Extract features from dataset.")
    parser.add_argument("--manifest_csv", type=str, default="training/artifacts/dataset_manifest.csv")
    parser.add_argument("--output_features_csv", type=str, default="training/artifacts/features_extracted.csv")
    args = parser.parse_args()
    extract_all_features(args.manifest_csv, args.output_features_csv)
