"""
Loads the trained pipeline + SHAP explainer once at startup and exposes a
single predict_patient() call used by routes/predict.py.
"""
import json
from pathlib import Path
import joblib
import numpy as np
import pandas as pd

from ml.train_model import engineer_features, NUMERIC_FEATURES, CATEGORICAL_FEATURES

MODEL_DIR = Path(__file__).parent.parent / "models"


class CKDPredictor:
    def __init__(self):
        self.pipeline = None
        self.explainer = None
        self.metadata = None
        self.loaded = False

    def load(self):
        model_path = MODEL_DIR / "ckd_model.pkl"
        meta_path = MODEL_DIR / "model_metadata.json"
        if not model_path.exists():
            self.loaded = False
            return
        self.pipeline = joblib.load(model_path)
        self.metadata = json.loads(meta_path.read_text())
        shap_path = MODEL_DIR / "shap_explainer.pkl"
        if shap_path.exists():
            self.explainer = joblib.load(shap_path)
        self.loaded = True

    def _stage_from_probability(self, prob: float, egfr: float) -> str:
        if prob < 0.5:
            return "No CKD"
        if egfr >= 90: return "Stage 1"
        if egfr >= 60: return "Stage 2"
        if egfr >= 30: return "Stage 3"
        if egfr >= 15: return "Stage 4"
        return "Stage 5"

    def predict(self, patient: dict) -> dict:
        if not self.loaded:
            raise RuntimeError("Model not loaded. Run ml/train_model.py first.")

        raw_df = pd.DataFrame([patient])
        engineered = engineer_features(raw_df)
        feature_cols = NUMERIC_FEATURES + CATEGORICAL_FEATURES
        for col in feature_cols:
            if col not in engineered.columns:
                engineered[col] = 0
        X = engineered[feature_cols]

        proba = float(self.pipeline.predict_proba(X)[0, 1])
        prediction = int(proba >= 0.5)
        egfr = float(patient.get("eGFR", 90))

        stage = self._stage_from_probability(proba, egfr)
        failure_risk = "Low" if egfr >= 60 else ("Moderate" if egfr >= 30 else "High")
        dialysis_required = bool(egfr < 15 and prediction == 1)

        shap_top_features = self._explain(X)

        return {
            "ckd_probability": round(proba, 4),
            "ckd_prediction": prediction,
            "ckd_stage": stage,
            "kidney_failure_risk": failure_risk,
            "dialysis_required": dialysis_required,
            "shap_top_features": shap_top_features,
            "model_version": self.metadata.get("best_model", "unknown"),
        }

    def _explain(self, X: pd.DataFrame, top_n: int = 8) -> list:
        preprocess = self.pipeline.named_steps["preprocess"]
        X_transformed = preprocess.transform(X)
        if hasattr(X_transformed, "toarray"):
            X_transformed = X_transformed.toarray()
        feature_names = list(preprocess.get_feature_names_out())
        model = self.pipeline.named_steps["model"]

        def fallback_importance():
            importances = getattr(model, "feature_importances_", None)
            if importances is None:
                coef = getattr(model, "coef_", None)
                importances = np.abs(coef[0]) if coef is not None else np.zeros(len(feature_names))
            importances = np.asarray(importances).reshape(-1)
            if importances.size != len(feature_names):
                importances = np.zeros(len(feature_names))
            order = np.argsort(importances)[::-1][:top_n]
            return [
                {"feature": feature_names[i], "impact": round(float(importances[i]), 4)}
                for i in order
            ]

        if self.explainer is None:
            return fallback_importance()

        try:
            shap_values = self.explainer.shap_values(X_transformed)
            if isinstance(shap_values, list):
                shap_values = shap_values[1]  # positive class (CKD)
            values = np.asarray(shap_values)
            if values.ndim == 3:
                row = values[0, :, 1] if values.shape[-1] > 1 else values[0, :, 0]
            elif values.ndim == 2:
                row = values[0]
            elif values.ndim == 1:
                row = values
            else:
                return fallback_importance()
            row = np.asarray(row, dtype=float).reshape(-1)
            if row.size != len(feature_names):
                return fallback_importance()
            row = np.nan_to_num(row)
        except Exception:
            return fallback_importance()

        order = np.argsort(np.abs(row))[::-1][:top_n]
        return [
            {"feature": feature_names[i], "impact": round(float(row[i]), 4)}
            for i in order
        ]


predictor = CKDPredictor()
