from typing import Optional, Dict, Any, List
from pydantic import BaseModel, EmailStr, Field
import datetime as dt


# ---------- Auth ----------
class UserCreate(BaseModel):
    email: EmailStr
    full_name: str
    password: str = Field(min_length=8)
    # Public self-registration is patient or doctor only. Admin accounts are
    # never created through this endpoint - see seed_admin.py or the
    # admin-only POST /admin/users route.
    role: str = Field(default="patient", pattern="^(patient|doctor)$")


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: int
    email: EmailStr
    full_name: str
    role: str
    is_active: bool = True
    created_at: Optional[dt.datetime] = None
    class Config:
        from_attributes = True


class AdminUserCreate(BaseModel):
    """Only reachable via POST /admin/users (admin-only) - unlike UserCreate,
    this allows creating any role, including admin."""
    email: EmailStr
    full_name: str
    password: str = Field(min_length=8)
    role: str = Field(default="patient", pattern="^(admin|doctor|patient)$")


class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: UserOut


# ---------- Prediction ----------
class PatientInput(BaseModel):
    Age: float
    Sex: str
    BMI: float
    Systolic_BP: float
    Diastolic_BP: float
    eGFR: float
    Serum_Creatinine: float
    Blood_Urea_Nitrogen: float
    Urine_ACR: float
    HbA1c: float
    Fasting_Glucose: float
    Diabetes: str
    Hypertension: str
    Cardiovascular_Disease: str
    Family_History: str
    Smoking_Status: str
    Exercise_Hours_Per_Week: float
    Sleep_Duration_Hours: float
    Heart_Rate: float
    Albumin: float

    class Config:
        extra = "allow"  # allow the remaining ~60 auxiliary dataset columns


class PredictionResult(BaseModel):
    ckd_probability: float
    ckd_prediction: int
    ckd_stage: str
    kidney_failure_risk: str
    dialysis_required: bool
    shap_top_features: List[Dict[str, Any]]
    model_version: str


class PredictionHistoryOut(BaseModel):
    id: int
    ckd_probability: float
    ckd_stage: Optional[str]
    kidney_failure_risk: Optional[str]
    dialysis_required: bool
    model_version: Optional[str] = None
    created_at: dt.datetime
    class Config:
        from_attributes = True


# ---------- Doctor ----------
class PatientSummaryOut(BaseModel):
    id: int
    full_name: str
    email: EmailStr
    assessment_count: int
    latest_probability: Optional[float] = None
    latest_stage: Optional[str] = None
    last_assessment_at: Optional[dt.datetime] = None


class DoctorDashboardOut(BaseModel):
    total_patients: int
    total_assessments: int
    high_risk_assessments: int
    recent_patients: List[PatientSummaryOut]
    recent_assessments: List[PredictionHistoryOut]
    risk_distribution: Dict[str, int]


# ---------- Admin ----------
class AdminOverviewOut(BaseModel):
    total_users: int
    total_patients: int
    total_doctors: int
    total_admins: int
    total_assessments: int
    active_users: int
