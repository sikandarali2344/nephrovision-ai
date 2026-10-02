import datetime as dt
import enum
from sqlalchemy import (
    Column, Integer, String, Float, Boolean, DateTime, ForeignKey, JSON, Enum
)
from sqlalchemy.orm import relationship
from database.db import Base


class Role(str, enum.Enum):
    admin = "admin"
    doctor = "doctor"
    patient = "patient"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    full_name = Column(String, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(Enum(Role), default=Role.patient, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=dt.datetime.utcnow)

    predictions = relationship("Prediction", back_populates="user")


class Prediction(Base):
    __tablename__ = "predictions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    input_features = Column(JSON, nullable=False)
    ckd_probability = Column(Float, nullable=False)
    ckd_stage = Column(String, nullable=True)
    kidney_failure_risk = Column(String, nullable=True)
    dialysis_required = Column(Boolean, default=False)
    shap_explanation = Column(JSON, nullable=True)
    model_version = Column(String, default="v1")
    created_at = Column(DateTime, default=dt.datetime.utcnow)

    user = relationship("User", back_populates="predictions")


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    action = Column(String, nullable=False)
    detail = Column(String, nullable=True)
    created_at = Column(DateTime, default=dt.datetime.utcnow)
