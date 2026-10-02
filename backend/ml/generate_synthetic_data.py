"""
Generates a synthetic patient dataset that mirrors the schema and clinical
relationships described in CKD_Risk_Progression_Dataset_2026.csv (the
notebook you uploaded references this file but the raw CSV wasn't included
in the results zip - only the EDA outputs were).

This script builds a smaller but statistically plausible stand-in (default
20,000 rows) so the full pipeline - preprocessing, training, evaluation,
SHAP - runs end-to-end right now. When you have the real 200k-row /
82-feature CSV, drop it at backend/ml/data/CKD_Risk_Progression_Dataset_2026.csv
and train_model.py will use it automatically instead.
"""
import numpy as np
import pandas as pd
from pathlib import Path

RNG = np.random.default_rng(42)
DATA_DIR = Path(__file__).parent / "data"
DATA_DIR.mkdir(exist_ok=True)
OUT_PATH = DATA_DIR / "synthetic_ckd_dataset.csv"


def generate(n_rows: int = 20000) -> pd.DataFrame:
    age = RNG.normal(52, 16, n_rows).clip(18, 95)
    sex = RNG.choice(["Male", "Female"], n_rows)
    diabetes = RNG.choice(["Yes", "No"], n_rows, p=[0.28, 0.72])
    hypertension = RNG.choice(["Yes", "No"], n_rows, p=[0.35, 0.65])
    family_history = RNG.choice(["Yes", "No"], n_rows, p=[0.2, 0.8])
    smoking = RNG.choice(["Never", "Former", "Current"], n_rows, p=[0.55, 0.25, 0.2])
    cardiovascular = RNG.choice(["Yes", "No"], n_rows, p=[0.18, 0.82])

    # Latent risk score drives eGFR decline and downstream labels
    risk = (
        0.02 * (age - 40)
        + 1.4 * (diabetes == "Yes")
        + 1.1 * (hypertension == "Yes")
        + 0.7 * (family_history == "Yes")
        + 0.5 * (cardiovascular == "Yes")
        + 0.4 * (smoking == "Current")
        + RNG.normal(0, 1.0, n_rows)
    )

    bmi = (24 + 0.05 * (age - 40) + 3 * (diabetes == "Yes") + RNG.normal(0, 4, n_rows)).clip(15, 55)
    systolic_bp = (118 + 10 * (hypertension == "Yes") + 0.3 * risk * 5 + RNG.normal(0, 12, n_rows)).clip(90, 210)
    diastolic_bp = (systolic_bp * 0.62 + RNG.normal(0, 6, n_rows)).clip(50, 130)
    fasting_glucose = (95 + 35 * (diabetes == "Yes") + RNG.normal(0, 15, n_rows)).clip(60, 350)
    hba1c = (5.2 + 2.2 * (diabetes == "Yes") + RNG.normal(0, 0.6, n_rows)).clip(4.0, 14.0)

    egfr = (100 - 4.5 * risk - 0.15 * (age - 30) + RNG.normal(0, 8, n_rows)).clip(3, 130)
    serum_creatinine = (0.9 + (100 - egfr) * 0.03 + RNG.normal(0, 0.15, n_rows)).clip(0.4, 12)
    bun = (14 + (100 - egfr) * 0.25 + RNG.normal(0, 4, n_rows)).clip(5, 150)
    urine_acr = np.exp(RNG.normal(2.5 + 0.03 * (100 - egfr), 1.0, n_rows)).clip(1, 4000)
    albumin = (4.2 - 0.01 * (100 - egfr) + RNG.normal(0, 0.3, n_rows)).clip(1.5, 5.5)
    heart_rate = (72 + 0.1 * risk * 5 + RNG.normal(0, 9, n_rows)).clip(45, 130)
    sleep_hours = (7 - 0.05 * risk + RNG.normal(0, 1.1, n_rows)).clip(2, 11)
    exercise_hours = (3.5 - 0.15 * risk + RNG.normal(0, 1.5, n_rows)).clip(0, 14)
    annual_cost = (1500 + (100 - egfr) * 60 + RNG.normal(0, 800, n_rows)).clip(200, 60000)

    # Centered so overall CKD prevalence lands near real-world clinical rates (~20-30%)
    ckd_prob = 1 / (1 + np.exp((egfr - 72) / 11))
    ckd = (RNG.uniform(0, 1, n_rows) < ckd_prob).astype(int)

    def stage_from_egfr(e):
        if e >= 90: return "Stage 1"
        if e >= 60: return "Stage 2"
        if e >= 30: return "Stage 3"
        if e >= 15: return "Stage 4"
        return "Stage 5"

    ckd_stage = np.array([stage_from_egfr(e) if c else "No CKD" for e, c in zip(egfr, ckd)])
    failure_risk = np.select(
        [egfr >= 60, (egfr >= 30) & (egfr < 60), egfr < 30],
        ["Low", "Moderate", "High"],
        default="Low",
    )
    dialysis_required = ((egfr < 15) & (ckd == 1)).astype(int)

    df = pd.DataFrame({
        "Age": age.round(1), "Sex": sex, "BMI": bmi.round(1),
        "Systolic_BP": systolic_bp.round(0), "Diastolic_BP": diastolic_bp.round(0),
        "eGFR": egfr.round(1), "Serum_Creatinine": serum_creatinine.round(2),
        "Blood_Urea_Nitrogen": bun.round(1), "Urine_ACR": urine_acr.round(1),
        "HbA1c": hba1c.round(2), "Fasting_Glucose": fasting_glucose.round(1),
        "Diabetes": diabetes, "Hypertension": hypertension,
        "Cardiovascular_Disease": cardiovascular, "Family_History": family_history,
        "Smoking_Status": smoking, "Exercise_Hours_Per_Week": exercise_hours.round(1),
        "Sleep_Duration_Hours": sleep_hours.round(1), "Heart_Rate": heart_rate.round(0),
        "Albumin": albumin.round(2), "Annual_Medical_Cost_USD": annual_cost.round(0),
        "CKD": ckd, "CKD_Stage": ckd_stage, "Kidney_Failure_Risk": failure_risk,
        "Dialysis_Required": dialysis_required,
    })
    return df


if __name__ == "__main__":
    df = generate()
    df.to_csv(OUT_PATH, index=False)
    print(f"Wrote {len(df)} rows to {OUT_PATH}")
    print(df["CKD"].value_counts(normalize=True))
