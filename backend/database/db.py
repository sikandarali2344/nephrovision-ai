"""
Database engine/session setup.

Defaults to a local SQLite file so the project runs with zero external
services. Set DATABASE_URL to a Postgres DSN (as the spec calls for) to
switch, e.g.:

    DATABASE_URL=postgresql://nephro:nephro@localhost:5432/nephrovision
"""
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./nephrovision.db")

connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
engine = create_engine(DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    from database import models  # noqa: F401 ensures models are registered
    Base.metadata.create_all(bind=engine)
