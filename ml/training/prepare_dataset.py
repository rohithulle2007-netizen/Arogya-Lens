"""Configurable dataset loader and manifest builder."""
import argparse
import os
import re
from typing import Dict, List, Optional
import pandas as pd


def prepare_dataset(
    data_dir: str = ".",
    excel_path: Optional[str] = None,
    output_csv: str = "training/artifacts/dataset_manifest.csv"
) -> pd.DataFrame:
    """
    Scans participant directories, matches demographic and ground-truth Hb data,
    and creates a clean manifest with participant_id, images, masks, and targets.
    """
    data_dir = os.path.abspath(data_dir)
    os.makedirs(os.path.dirname(os.path.abspath(output_csv)), exist_ok=True)

    # 1. Load Excel / Demographic Table
    if excel_path is None:
        excel_path = os.path.join(data_dir, "India.xlsx")

    if not os.path.exists(excel_path):
        raise FileNotFoundError(f"Dataset excel/metadata file not found at: {excel_path}")

    df_meta = pd.read_excel(excel_path)
    # Standardize column names
    col_map = {}
    for col in df_meta.columns:
        c_lower = col.strip().lower()
        if "number" in c_lower or "id" in c_lower or "patient" in c_lower:
            col_map[col] = "participant_id"
        elif "hgb" in c_lower or "hb" in c_lower or "hemoglobin" in c_lower:
            col_map[col] = "hb"
        elif "gender" in c_lower or "sex" in c_lower:
            col_map[col] = "sex"
        elif "age" in c_lower:
            col_map[col] = "age"

    df_meta = df_meta.rename(columns=col_map)
    df_meta["participant_id"] = df_meta["participant_id"].astype(str)

    manifest_rows = []

    for _, row in df_meta.iterrows():
        p_id = str(row["participant_id"])
        # Support folder named "1", "01", "P001", etc.
        folder_candidates = [p_id, p_id.zfill(2), p_id.zfill(3), f"P{p_id.zfill(3)}"]
        p_folder = None
        for cand in folder_candidates:
            cand_path = os.path.join(data_dir, cand)
            if os.path.isdir(cand_path):
                p_folder = cand_path
                break

        if p_folder is None:
            continue

        files = os.listdir(p_folder)
        # Find raw images
        raw_images = [
            f for f in files
            if f.lower().endswith((".jpg", ".jpeg")) and not any(k in f.lower() for k in ["forniceal", "palpebral", "papebral", "mask"])
        ]
        if not raw_images:
            # Fallback to any jpg
            raw_images = [f for f in files if f.lower().endswith((".jpg", ".jpeg"))]

        # Find masks
        both_masks = [f for f in files if ("forn" in f.lower() and ("palp" in f.lower() or "pape" in f.lower())) and not "(1)" in f]
        if not both_masks:
            both_masks = [f for f in files if "forn" in f.lower() and ("palp" in f.lower() or "pape" in f.lower())]

        palp_masks = [f for f in files if ("palpebral" in f.lower() or "papebral" in f.lower()) and not "forn" in f.lower() and not "(1)" in f]
        forn_masks = [f for f in files if "forniceal" in f.lower() and not ("palp" in f.lower() or "pape" in f.lower()) and not "(1)" in f]

        for raw_img in raw_images:
            raw_path = os.path.join(p_folder, raw_img)
            both_mask_path = os.path.join(p_folder, both_masks[0]) if both_masks else ""
            palp_mask_path = os.path.join(p_folder, palp_masks[0]) if palp_masks else ""
            forn_mask_path = os.path.join(p_folder, forn_masks[0]) if forn_masks else ""

            # Primary ROI image is the segmented conjunctiva mask if available, or raw image
            primary_roi_path = both_mask_path if both_mask_path else (palp_mask_path if palp_mask_path else raw_path)

            manifest_rows.append({
                "participant_id": p_id,
                "raw_image_path": raw_path,
                "primary_roi_path": primary_roi_path,
                "mask_both_path": both_mask_path,
                "mask_palpebral_path": palp_mask_path,
                "mask_forniceal_path": forn_mask_path,
                "hb": float(row["hb"]),
                "age": float(row["age"]) if pd.notnull(row.get("age")) else None,
                "sex": str(row["sex"]).strip().upper() if pd.notnull(row.get("sex")) else None
            })

    manifest_df = pd.DataFrame(manifest_rows)
    manifest_df.to_csv(output_csv, index=False)
    print(f"[Dataset Preparation Complete]")
    print(f"Total Participants: {manifest_df['participant_id'].nunique()}")
    print(f"Total Image Records: {len(manifest_df)}")
    print(f"Saved manifest to: {output_csv}")
    return manifest_df


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Prepare Arogya Lens dataset manifest.")
    parser.add_argument("--data_dir", type=str, default=".", help="Root directory of dataset.")
    parser.add_argument("--excel_path", type=str, default="India.xlsx", help="Path to Excel file.")
    parser.add_argument("--output_csv", type=str, default="training/artifacts/dataset_manifest.csv", help="Output path.")
    args = parser.parse_args()
    prepare_dataset(args.data_dir, args.excel_path, args.output_csv)
