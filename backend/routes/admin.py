from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database.db import get_db
from database import models, schemas
from utils.security import require_admin, hash_password
from ml.inference import predictor

router = APIRouter(prefix="/admin", tags=["admin"], dependencies=[Depends(require_admin)])


@router.get("/overview", response_model=schemas.AdminOverviewOut)
def overview(db: Session = Depends(get_db)):
    users = db.query(models.User).all()
    return schemas.AdminOverviewOut(
        total_users=len(users),
        total_patients=sum(1 for u in users if u.role == models.Role.patient),
        total_doctors=sum(1 for u in users if u.role == models.Role.doctor),
        total_admins=sum(1 for u in users if u.role == models.Role.admin),
        total_assessments=db.query(models.Prediction).count(),
        active_users=sum(1 for u in users if u.is_active),
    )


@router.get("/users", response_model=List[schemas.UserOut])
def list_users(db: Session = Depends(get_db)):
    return db.query(models.User).order_by(models.User.created_at.desc()).all()


@router.post("/users", response_model=schemas.UserOut, status_code=201)
def create_user(payload: schemas.AdminUserCreate, db: Session = Depends(get_db)):
    """The only way to create an admin account through the API - public
    /auth/signup is restricted to patient/doctor. (seed_admin.py is the
    other option, for bootstrapping the very first admin without a running
    admin session at all.)"""
    if db.query(models.User).filter(models.User.email == payload.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    user = models.User(
        email=payload.email,
        full_name=payload.full_name,
        hashed_password=hash_password(payload.password),
        role=models.Role(payload.role),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    db.add(models.AuditLog(user_id=user.id, action="admin_create_user", detail=f"role={user.role.value}"))
    db.commit()
    return user


@router.patch("/users/{user_id}/deactivate")
def deactivate_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.is_active = False
    db.commit()
    return {"status": "deactivated", "user_id": user_id}


@router.delete("/users/{user_id}")
def delete_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    db.delete(user)
    db.commit()
    return {"status": "deleted", "user_id": user_id}


@router.get("/model-performance")
def model_performance():
    if not predictor.loaded:
        raise HTTPException(status_code=503, detail="No model trained yet")
    return predictor.metadata


@router.get("/audit-logs")
def audit_logs(db: Session = Depends(get_db), limit: int = 100):
    logs = (
        db.query(models.AuditLog)
        .order_by(models.AuditLog.created_at.desc())
        .limit(limit)
        .all()
    )
    return [
        {
            "id": l.id, "user_id": l.user_id, "action": l.action,
            "detail": l.detail, "created_at": l.created_at,
        }
        for l in logs
    ]


@router.post("/retrain")
def retrain(db: Session = Depends(get_db)):
    """Kicks off a synchronous retrain. In production this would be a background
    job (Celery/RQ) so the request doesn't block; kept simple here for the FYP scope."""
    import subprocess, sys
    result = subprocess.run(
        [sys.executable, "ml/train_model.py"], capture_output=True, text=True
    )
    predictor.load()
    db.add(models.AuditLog(action="model_retrain", detail=f"returncode={result.returncode}"))
    db.commit()
    return {
        "returncode": result.returncode,
        "stdout": result.stdout[-2000:],
        "stderr": result.stderr[-2000:],
        "trained_at": predictor.metadata.get("trained_at") if predictor.loaded else None,
    }
