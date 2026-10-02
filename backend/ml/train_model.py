"""
NephroVision AI - training pipeline.

Usage:
    python ml/train_model.py

Looks for the real dataset first (ml/data/CKD_Risk_Progression_Dataset_2026.csv),
falls back to the synthetic generator otherwise. Trains Random Forest,
XGBoost, and Logistic Regression (as a fast baseline / DNN stand-in so the
pipeline has no heavy TF/PyTorch dependency by default), compares them on
held-out data, keeps the best by ROC-AUC, computes SHAP values, and writes:

    models/ckd_model.pkl        - the trained pipeline (preprocessing + model)
    models/model_metadata.json  - metrics, feature list, chosen model name
    models/shap_explainer.pkl   - SHAP explainer for the prediction endpoint
"""
import json
import datetime as dt
import joblib
import numpy as np
import pandas as pd
from pathlib import Path

from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score, roc_auc_score,
    confusion_matrix,
)

ROOT = Path(__file__).parent
DATA_REAL = ROOT / "data" / "CKD_Risk_Progression_Dataset_2026.csv"
DATA_SYNTH = ROOT / "data" / "synthetic_ckd_dataset.csv"
MODEL_DIR = ROOT.parent / "models"
MODEL_DIR.mkdir(exist_ok=True)

NUMERIC_FEATURES = [
    "Age", "BMI", "Systolic_BP", "Diastolic_BP", "eGFR", "Serum_Creatinine",
    "Blood_Urea_Nitrogen", "Urine_ACR", "HbA1c", "Fasting_Glucose",
    "Exercise_Hours_Per_Week", "Sleep_Duration_Hours", "Heart_Rate", "Albumin",
    "MAP", "Age_eGFR_interaction", "Risk_Ratio",
]
CATEGORICAL_FEATURES = [
    "Sex", "Diabetes", "Hypertension", "Cardiovascular_Disease",
    "Family_History", "Smoking_Status", "eGFR_category",
]
TARGET = "CKD"


def load_dataset() -> pd.DataFrame:
    if DATA_REAL.exists():
        print(f"Using real dataset: {DATA_REAL}")
        return pd.read_csv(DATA_REAL)
    if not DATA_SYNTH.exists():
        from generate_synthetic_data import generate
        generate().to_csv(DATA_SYNTH, index=False)
    print(f"Real dataset not found - using synthetic stand-in: {DATA_SYNTH}")
    return pd.read_csv(DATA_SYNTH)


def engineer_features(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    # Median/mode imputation
    for col in df.select_dtypes(include=[np.number]).columns:
        df[col] = df[col].fillna(df[col].median())
    for col in df.select_dtypes(include=["object"]).columns:
        if df[col].isnull().any():
            df[col] = df[col].fillna(df[col].mode()[0])

    # Feature engineering (matches the spec: eGFR_category, MAP, Risk_Ratio, Age_eGFR_interaction)
    df["MAP"] = df["Diastolic_BP"] + (df["Systolic_BP"] - df["Diastolic_BP"]) / 3
    df["Age_eGFR_interaction"] = df["Age"] * (100 - df["eGFR"]) / 100
    df["Risk_Ratio"] = df["Serum_Creatinine"] / df["eGFR"].clip(lower=1)
    df["eGFR_category"] = pd.cut(
        df["eGFR"], bins=[-1, 15, 30, 60, 90, 1000],
        labels=["G5_Failure", "G4_Severe", "G3_Moderate", "G2_Mild", "G1_Normal"],
    ).astype(str)
    return df


def build_preprocessor() -> ColumnTransformer:
    return ColumnTransformer([
        ("num", StandardScaler(), NUMERIC_FEATURES),
        ("cat", OneHotEncoder(handle_unknown="ignore"), CATEGORICAL_FEATURES),
    ])


def evaluate(model, X_test, y_test) -> dict:
    y_pred = model.predict(X_test)
    y_proba = model.predict_proba(X_test)[:, 1]
    cm = confusion_matrix(y_test, y_pred).tolist()
    return {
        "accuracy": round(accuracy_score(y_test, y_pred), 4),
        "precision": round(precision_score(y_test, y_pred, zero_division=0), 4),
        "recall": round(recall_score(y_test, y_pred, zero_division=0), 4),
        "f1": round(f1_score(y_test, y_pred, zero_division=0), 4),
        "roc_auc": round(roc_auc_score(y_test, y_proba), 4),
        "confusion_matrix": cm,
    }


def main():
    df = engineer_features(load_dataset())
    feature_cols = NUMERIC_FEATURES + CATEGORICAL_FEATURES
    X, y = df[feature_cols], df[TARGET].astype(int)

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    candidates = {
        "random_forest": RandomForestClassifier(
            n_estimators=300, max_depth=12, class_weight="balanced",
            random_state=42, n_jobs=-1,
        ),
        "logistic_regression": LogisticRegression(
            max_iter=1000, class_weight="balanced",
        ),
    }
    try:
        from xgboost import XGBClassifier
        candidates["xgboost"] = XGBClassifier(
            n_estimators=300, max_depth=6, learning_rate=0.08,
            eval_metric="logloss", random_state=42, n_jobs=-1,
        )
    except ImportError:
        print("xgboost not installed - skipping (pip install xgboost to include it)")

    results = {}
    fitted_pipelines = {}
    for name, clf in candidates.items():
        pipe = Pipeline([("preprocess", build_preprocessor()), ("model", clf)])
        pipe.fit(X_train, y_train)
        metrics = evaluate(pipe, X_test, y_test)
        results[name] = metrics
        fitted_pipelines[name] = pipe
        print(f"[{name}] ROC-AUC={metrics['roc_auc']}  F1={metrics['f1']}  Acc={metrics['accuracy']}")

    best_name = max(results, key=lambda n: results[n]["roc_auc"])
    best_pipeline = fitted_pipelines[best_name]
    print(f"\nBest model: {best_name} (ROC-AUC={results[best_name]['roc_auc']})")

    joblib.dump(best_pipeline, MODEL_DIR / "ckd_model.pkl")

    # SHAP explainer - built on a sample of transformed training data for speed
    preprocess = best_pipeline.named_steps["preprocess"]
    model = best_pipeline.named_steps["model"]
    X_train_sample = X_train.sample(min(500, len(X_train)), random_state=42)
    X_train_transformed = preprocess.transform(X_train_sample)
    if hasattr(X_train_transformed, "toarray"):
        X_train_transformed = X_train_transformed.toarray()

    try:
        import shap
        if hasattr(model, "coef_"):
            explainer = shap.LinearExplainer(model, X_train_transformed)
        else:
            try:
                explainer = shap.TreeExplainer(model)
            except Exception:
                explainer = shap.Explainer(model.predict_proba, X_train_transformed)
        joblib.dump(explainer, MODEL_DIR / "shap_explainer.pkl")
        shap_saved = True
    except ImportError:
        print("shap not installed - skipping explainer (pip install shap to enable /predict explanations)")
        shap_saved = False

    feature_names_out = list(preprocess.get_feature_names_out())
    metadata = {
        "best_model": best_name,
        "all_results": results,
        "feature_columns": feature_cols,
        "numeric_features": NUMERIC_FEATURES,
        "categorical_features": CATEGORICAL_FEATURES,
        "transformed_feature_names": feature_names_out,
        "trained_on_rows": len(df),
        "used_real_dataset": DATA_REAL.exists(),
        "shap_available": shap_saved,
        "trained_at": dt.datetime.utcnow().isoformat() + "Z",
    }
    with open(MODEL_DIR / "model_metadata.json", "w") as f:
        json.dump(metadata, f, indent=2)

    print(f"\nSaved model, SHAP explainer, and metadata to {MODEL_DIR}/")


if __name__ == "__main__":
    main()
