"""
Kaggle Dataset Loader for Arogya Lens
Loads and standardizes the 'harshwardhanfartale/eyes-defy-anemia' dataset across India and Italy cohorts.
"""
import os
import glob
import logging
from typing import Dict, Any, List, Optional
import pandas as pd

logger = logging.getLogger("arogya_lens.dataset")


def clean_float(val: Any) -> Optional[float]:
    if pd.isna(val):
        return None
    if isinstance(val, (int, float)):
        return float(val)
    try:
        s = str(val).strip().replace(",", ".")
        return float(s)
    except (ValueError, TypeError):
        return None


def get_dataset_root() -> str:
    """
    Finds the root directory of the downloaded Kaggle dataset.
    """
    cache_path = os.path.expanduser("~/.cache/kagglehub/datasets/harshwardhanfartale/eyes-defy-anemia/versions/1/dataset anemia")
    if os.path.exists(cache_path):
        return cache_path

    try:
        import kagglehub
        path = kagglehub.dataset_download("harshwardhanfartale/eyes-defy-anemia")
        candidate = os.path.join(path, "dataset anemia")
        if os.path.exists(candidate):
            return candidate
        return path
    except Exception as e:
        logger.warning(f"kagglehub lookup failed: {e}")
        return ""


def load_cohort_manifest(dataset_root: Optional[str] = None) -> pd.DataFrame:
    """
    Loads and standardizes participant clinical records and image paths from India & Italy cohorts.
    """
    root = dataset_root or get_dataset_root()
    if not root or not os.path.exists(root):
        raise FileNotFoundError(f"Dataset root directory not found: {root}")

    records: List[Dict[str, Any]] = []

    # 1. Process India Cohort
    india_dir = os.path.join(root, "India")
    india_excel = os.path.join(india_dir, "India.xlsx")
    if os.path.exists(india_excel):
        df_india = pd.read_excel(india_excel)
        for _, row in df_india.iterrows():
            if pd.isna(row.get("Number")):
                continue
            try:
                p_num = str(int(float(str(row["Number"]).strip().replace(",", "."))))
            except Exception:
                continue

            patient_dir = os.path.join(india_dir, p_num)
            if not os.path.exists(patient_dir):
                continue

            hb = clean_float(row.get("Hgb"))
            gender = str(row["Gender"]).strip().upper() if pd.notna(row.get("Gender")) else "M"
            age = clean_float(row.get("Age")) or 30.0

            images = glob.glob(os.path.join(patient_dir, "*.*"))
            palpebral_img = next((img for img in images if "palpebral" in img.lower() and "forniceal" not in img.lower()), None)
            forniceal_img = next((img for img in images if "forniceal" in img.lower() and "palpebral" not in img.lower()), None)
            combined_img = next((img for img in images if "forniceal_palpebral" in img.lower()), None)
            original_jpg = next((img for img in images if img.endswith(".jpg") or img.endswith(".jpeg")), None)

            records.append({
                "cohort": "India",
                "participant_id": f"IN_{p_num}",
                "patient_number": p_num,
                "hb": hb,
                "gender": gender,
                "age": age,
                "palpebral_path": palpebral_img or combined_img or original_jpg,
                "forniceal_path": forniceal_img,
                "original_path": original_jpg,
                "folder_path": patient_dir
            })

    # 2. Process Italy Cohort
    italy_dir = os.path.join(root, "Italy")
    italy_excel = os.path.join(italy_dir, "Italy.xlsx")
    if os.path.exists(italy_excel):
        df_italy = pd.read_excel(italy_excel)
        for _, row in df_italy.iterrows():
            if pd.isna(row.get("Number")):
                continue
            try:
                p_num = str(int(float(str(row["Number"]).strip().replace(",", "."))))
            except Exception:
                continue

            patient_dir = os.path.join(italy_dir, p_num)
            if not os.path.exists(patient_dir):
                continue

            hb = clean_float(row.get("Hgb"))
            gender = str(row["Gender"]).strip().upper() if pd.notna(row.get("Gender")) else "F"
            age = clean_float(row.get("Age")) or 45.0

            images = glob.glob(os.path.join(patient_dir, "*.*"))
            palpebral_img = next((img for img in images if "palpebral" in img.lower()), None)
            original_jpg = next((img for img in images if img.endswith(".jpg") or img.endswith(".jpeg")), None)

            records.append({
                "cohort": "Italy",
                "participant_id": f"IT_{p_num}",
                "patient_number": p_num,
                "hb": hb,
                "gender": gender,
                "age": age,
                "palpebral_path": palpebral_img or original_jpg,
                "forniceal_path": None,
                "original_path": original_jpg,
                "folder_path": patient_dir
            })

    manifest_df = pd.DataFrame(records)
    print(f"Loaded {len(manifest_df)} total participant records ({manifest_df['cohort'].value_counts().to_dict()})")
    return manifest_df
