from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import settings
from database.db import init_db
from ml.inference import predictor
from routes import auth, predict, history, admin, doctor

app = FastAPI(
    title="NephroVision AI",
    description="CKD Risk Intelligence Platform - prediction, explainability, and patient history API",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(predict.router)
app.include_router(history.router)
app.include_router(admin.router)
app.include_router(doctor.router)


@app.on_event("startup")
def on_startup():
    init_db()
    predictor.load()


@app.get("/")
def root():
    return {
        "service": "NephroVision AI",
        "status": "running",
        "model_loaded": predictor.loaded,
    }


@app.get("/health")
def health():
    return {"status": "ok", "model_loaded": predictor.loaded}
