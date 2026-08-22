# Arogya Lens AI: Hemoglobin Estimation & Screening Pipeline

Experimental non-invasive Hemoglobin (Hb) estimation prototype for the **Arogya Lens** screening system based on conjunctiva photography.

---

## 1. Dataset Analysis & Characteristics

| Parameter | Value / Distribution |
| :--- | :--- |
| **Participants** | **95 individuals** (Folders `1` to `95`) |
| **Ground-Truth Target (Hgb)** | Range: **7.6 – 17.1 g/dL** (Mean: **11.47 g/dL**, Std: **2.08 g/dL**) |
| **Gender Distribution** | 49 Male (51.6%), 46 Female (48.4%) |
| **Age Range** | 19 – 75 years (Mean: 35.8 years) |
| **Images & Masks** | High-resolution eye photographs (`.jpg`) and segmented conjunctiva masks (`forniceal.png`, `palpebral.png`, `forniceal_palpebral.png` RGBA PNGs) |

---

## 2. Leakage Prevention & Data Splitting

- **Independence Unit**: The individual person (`participant_id`), **not** the image.
- **Participant-Aware Cross-Validation**: All images/masks belonging to a participant remain in the exact same fold. 5-Fold `GroupKFold` grouped strictly by `participant_id` was implemented.
- **Pipeline-Enclosed Transformers**: All standard scaling (`StandardScaler`) and feature selection (`SelectKBest`) are fitted strictly within the training portion of each fold via `sklearn.pipeline.Pipeline`, preventing any lookahead leakage.

---

## 3. Empirical Model Comparison & Selection

The following empirical results were obtained across 5-Fold GroupKFold cross-validation on the 95 participant dataset:

| Model | Feature Configuration | CV MAE (g/dL) | CV RMSE (g/dL) | CV R² | Pearson r |
| :--- | :--- | :---: | :---: | :---: | :---: |
| **SVR (RBF)** | **MODEL B (Color + Demographics)** | **1.213 ± 0.25** | **1.573** | **0.419** | **0.649** |
| **Random Forest** | **MODEL B (Color + Demographics)** | 1.250 ± 0.20 | 1.573 | 0.420 | 0.649 |
| **Gradient Boosting** | **MODEL B (Color + Demographics)** | 1.263 ± 0.25 | 1.598 | 0.401 | 0.634 |
| **SVR (RBF)** | **MODEL A (Color Only)** | 1.325 ± 0.31 | 1.758 | 0.275 | 0.526 |
| **Random Forest** | **MODEL A (Color Only)** | 1.331 ± 0.15 | 1.699 | 0.323 | 0.570 |
| **Gradient Boosting** | **MODEL A (Color Only)** | 1.395 ± 0.11 | 1.746 | 0.284 | 0.542 |
| **Ridge** | **MODEL B (Color + Demographics)** | 1.536 ± 0.75 | 3.775 | -2.343 | 0.380 |
| **Ridge** | **MODEL A (Color Only)** | 4.123 ± 5.48 | 26.950 | -169.373 | -0.151 |
| **Huber** | **MODEL A (Color Only)** | 16.829 ± 30.75 | 150.044 | -5279.931 | -0.169 |
| **Huber** | **MODEL B (Color + Demographics)** | 22.086 ± 41.61 | 202.757 | -9642.343 | -0.169 |

### Key Findings:
1. **Model Selection**: **SVR with RBF Kernel** (and Random Forest) generalized most robustly on this small sample size, achieving a cross-validated **MAE of 1.21 g/dL** and correlation **r = 0.65**.
2. **Demographics Impact**: Adding demographic variables (Age, Sex) consistently reduced MAE across all non-linear models (improving MAE from 1.33 to 1.21 g/dL).
3. **Linear Baselines**: Unconstrained or simple linear regressions struggled due to multicollinearity across color space ratios, while regularized non-linear kernels handled the feature distributions smoothly.

The final model artifact was trained and saved to [`models/hb_model.joblib`](models/hb_model.joblib) alongside its complete specification in [`models/hb_model_metadata.json`](models/hb_model_metadata.json).

---

## 4. Reusable Project Structure

```
India/
├── app/
│   ├── main.py                     # FastAPI application
│   └── ai/
│       ├── image_quality.py        # Sharpness, blur, lighting, contrast check
│       ├── eye_detector.py         # Sclera/eyelid region localization
│       ├── conjunctiva.py          # Conjunctiva ROI segmentation
│       ├── features.py             # Reusable color features (RGB, HSV, LAB, ratios)
│       ├── hb_model.py             # Model loader & predictor
│       ├── confidence.py           # Prediction reliability metric
│       └── pipeline.py             # Unified inference pipeline
├── training/
│   ├── prepare_dataset.py          # Configurable dataset manifest generator
│   ├── extract_features.py         # Offline feature extraction
│   ├── evaluate_model.py           # Metrics calculation (MAE, RMSE, R², r, rho)
│   ├── cross_validate.py           # GroupKFold cross-validation suite
│   ├── train_model.py              # Production model training & export
│   └── artifacts/                  # Manifests, extracted features & CV logs
├── models/
│   ├── hb_model.joblib             # Production trained pipeline artifact
│   └── hb_model_metadata.json      # Metadata, metrics, timestamp
├── tests/
│   ├── test_features.py            # Unit tests for feature extraction
│   ├── test_pipeline.py            # Integration tests for AI pipeline
│   └── test_screening_api.py       # FastAPI endpoint tests
└── README_AI.md                    # Technical documentation
```

---

## 5. FastAPI Inference Endpoint

### Request Contract
- **Endpoint**: `POST /api/screenings/analyze`
- **Content-Type**: `multipart/form-data`
- **Parameters**:
  - `image` (file, required): Eye/conjunctiva photograph
  - `age` (float, optional): Age in years
  - `sex` (string, optional): `"M"` or `"F"`

### Response JSON Contract
```json
{
  "success": true,
  "screening_id": 4820194,
  "estimated_hb": 11.45,
  "prediction_reliability": 0.84,
  "status": "normal",
  "image_quality": "good",
  "message": "Estimated Hb is 11.5 g/dL, within normal physiological range."
}
```

---

## 6. Frontend Integration (Vanilla JavaScript)

```javascript
async function analyzeEyeImage(imageFile, age = null, sex = null) {
  const formData = new FormData();
  formData.append("image", imageFile);
  if (age) formData.append("age", age);
  if (sex) formData.append("sex", sex);

  try {
    const response = await fetch("http://localhost:8000/api/screenings/analyze", {
      method: "POST",
      body: formData,
      credentials: "include"
    });

    if (!response.ok) {
      throw new Error(`Server returned error: ${response.statusText}`);
    }

    const result = await response.json();
    console.log("Arogya Lens Result:", result);

    if (result.success) {
      document.getElementById("hb-display").innerText = `${result.estimated_hb} g/dL`;
      document.getElementById("reliability-display").innerText = `${Math.round(result.prediction_reliability * 100)}%`;
      document.getElementById("status-display").innerText = result.message;
    } else {
      alert(`Screening failed: ${result.message}`);
    }
  } catch (error) {
    console.error("Network or inference error:", error);
  }
}
```

---

## 7. How to Run the Server and Tests

### Start FastAPI Server
```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### Run Test Suite
```bash
pytest tests/
```

### Enable Mock Mode (For UI Testing)
```bash
# In PowerShell:
$env:AI_MOCK_MODE="true"
uvicorn app.main:app --reload
```

---

## 8. How to Retrain the Model with New Data

When new participants are recruited:
1. Update `India.xlsx` or place a new CSV file with columns (`participant_id`, `hb`, `age`, `sex`).
2. Add the corresponding participant image folders.
3. Run the offline training pipeline:
   ```bash
   # Step 1: Re-prepare dataset manifest
   python training/prepare_dataset.py

   # Step 2: Extract color and statistical features
   python training/extract_features.py

   # Step 3: Run GroupKFold cross-validation
   python training/cross_validate.py

   # Step 4: Train and export the updated model artifact
   python training/train_model.py
   ```
4. The newly generated `models/hb_model.joblib` and `models/hb_model_metadata.json` will automatically be loaded by the FastAPI service.

---

## 9. Disclaimer & Intended Use

> [!WARNING]
> **Arogya Lens is an experimental screening prototype and is NOT a certified medical diagnostic device.**
> The Hb estimates generated by this model are intended solely for triaging and non-invasive experimental risk screening. These predictions do not replace formal laboratory hematology testing (e.g. Complete Blood Count / Hemoglobin photometer assays). Any individual with suspected anemia should undergo clinical evaluation by a qualified healthcare professional.
