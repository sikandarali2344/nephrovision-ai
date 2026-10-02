from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database.db import get_db
from database import models, schemas
from utils.security import get_current_user

router = APIRouter(prefix="/history", tags=["history"])


@router.get("", response_model=List[schemas.PredictionHistoryOut])
def my_history(
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    records = (
        db.query(models.Prediction)
        .filter(models.Prediction.user_id == user.id)
        .order_by(models.Prediction.created_at.desc())
        .all()
    )
    return records


@router.get("/{prediction_id}")
def prediction_detail(
    prediction_id: int,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    record = db.query(models.Prediction).filter(models.Prediction.id == prediction_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Prediction not found")
    if record.user_id != user.id and user.role.value not in ("doctor", "admin"):
        raise HTTPException(status_code=403, detail="Not authorized to view this record")
    return {
        "id": record.id,
        "input_features": record.input_features,
        "ckd_probability": record.ckd_probability,
        "ckd_stage": record.ckd_stage,
        "kidney_failure_risk": record.kidney_failure_risk,
        "dialysis_required": record.dialysis_required,
        "shap_explanation": record.shap_explanation,
        "model_version": record.model_version,
        "created_at": record.created_at,
    }
