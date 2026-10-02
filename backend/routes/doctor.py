from typing import List
import datetime as dt
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database.db import get_db
from database import models, schemas
from utils.security import require_doctor_or_admin

router = APIRouter(prefix="/doctor", tags=["doctor"], dependencies=[Depends(require_doctor_or_admin)])


def _patient_summary(db: Session, patient: models.User) -> schemas.PatientSummaryOut:
    predictions = (
        db.query(models.Prediction)
        .filter(models.Prediction.user_id == patient.id)
        .order_by(models.Prediction.created_at.desc())
        .all()
    )
    latest = predictions[0] if predictions else None
    return schemas.PatientSummaryOut(
        id=patient.id,
        full_name=patient.full_name,
        email=patient.email,
        assessment_count=len(predictions),
        latest_probability=latest.ckd_probability if latest else None,
        latest_stage=latest.ckd_stage if latest else None,
        last_assessment_at=latest.created_at if latest else None,
    )


@router.get("/patients", response_model=List[schemas.PatientSummaryOut])
def list_patients(search: str = "", db: Session = Depends(get_db)):
    """All registered patients. There is no doctor-patient assignment model
    yet, so every doctor currently sees every patient - this is the natural
    place to add a doctor_id foreign key on User later if per-doctor patient
    panels are needed."""
    query = db.query(models.User).filter(models.User.role == models.Role.patient)
    if search:
        like = f"%{search.lower()}%"
        query = query.filter(
            (models.User.full_name.ilike(like)) | (models.User.email.ilike(like))
        )
    patients = query.order_by(models.User.created_at.desc()).all()
    return [_patient_summary(db, p) for p in patients]


@router.get("/patients/{patient_id}")
def patient_detail(patient_id: int, db: Session = Depends(get_db)):
    patient = db.query(models.User).filter(
        models.User.id == patient_id, models.User.role == models.Role.patient
    ).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    predictions = (
        db.query(models.Prediction)
        .filter(models.Prediction.user_id == patient_id)
        .order_by(models.Prediction.created_at.desc())
        .all()
    )
    return {
        "patient": schemas.UserOut.model_validate(patient),
        "predictions": [
            {
                "id": p.id,
                "ckd_probability": p.ckd_probability,
                "ckd_stage": p.ckd_stage,
                "kidney_failure_risk": p.kidney_failure_risk,
                "dialysis_required": p.dialysis_required,
                "shap_explanation": p.shap_explanation,
                "model_version": p.model_version,
                "created_at": p.created_at,
            }
            for p in predictions
        ],
    }


@router.get("/patients/{patient_id}/predictions", response_model=List[schemas.PredictionHistoryOut])
def patient_predictions(patient_id: int, db: Session = Depends(get_db)):
    patient = db.query(models.User).filter(
        models.User.id == patient_id, models.User.role == models.Role.patient
    ).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    return (
        db.query(models.Prediction)
        .filter(models.Prediction.user_id == patient_id)
        .order_by(models.Prediction.created_at.desc())
        .all()
    )


@router.get("/dashboard", response_model=schemas.DoctorDashboardOut)
def doctor_dashboard(db: Session = Depends(get_db)):
    patients = db.query(models.User).filter(models.User.role == models.Role.patient).all()
    all_predictions = db.query(models.Prediction).order_by(models.Prediction.created_at.desc()).all()

    high_risk = [p for p in all_predictions if p.ckd_probability >= 0.6]

    risk_distribution = {"Low": 0, "Moderate": 0, "High": 0}
    for p in all_predictions:
        bucket = "Low" if p.ckd_probability < 0.3 else "Moderate" if p.ckd_probability < 0.6 else "High"
        risk_distribution[bucket] += 1

    recent_patients = sorted(
        [_patient_summary(db, p) for p in patients],
        key=lambda s: s.last_assessment_at or dt.datetime.min,
        reverse=True,
    )[:5]

    return schemas.DoctorDashboardOut(
        total_patients=len(patients),
        total_assessments=len(all_predictions),
        high_risk_assessments=len(high_risk),
        recent_patients=recent_patients,
        recent_assessments=all_predictions[:5],
        risk_distribution=risk_distribution,
    )
