from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database.db import get_db
from database import models, schemas
from utils.security import require_doctor
from ml.inference import predictor

router = APIRouter(prefix="/doctor/patients/{patient_id}/predict", tags=["prediction"])


@router.post("", response_model=schemas.PredictionResult)
def predict(
    patient_id: int,
    payload: schemas.PatientInput,
    db: Session = Depends(get_db),
    clinician: models.User = Depends(require_doctor),
):
    patient = db.query(models.User).filter(
        models.User.id == patient_id,
        models.User.role == models.Role.patient,
    ).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    if not predictor.loaded:
        raise HTTPException(
            status_code=503,
            detail="Model not trained yet. Run `python ml/train_model.py` in the backend first.",
        )

    result = predictor.predict(payload.model_dump())

    record = models.Prediction(
        user_id=patient.id,
        input_features=payload.model_dump(),
        ckd_probability=result["ckd_probability"],
        ckd_stage=result["ckd_stage"],
        kidney_failure_risk=result["kidney_failure_risk"],
        dialysis_required=result["dialysis_required"],
        shap_explanation=result["shap_top_features"],
        model_version=result["model_version"],
    )
    db.add(record)
    db.add(models.AuditLog(
        user_id=clinician.id,
        action="doctor_assessment",
        detail=f"patient_id={patient.id}; stage={result['ckd_stage']}",
    ))
    db.commit()

    return result
