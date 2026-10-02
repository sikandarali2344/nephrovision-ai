"""
Seeds a single admin user directly into the database.

Usage:
    cd backend
    python seed_admin.py

Safe to re-run: if the email already exists, it just prints a message and
exits instead of erroring or creating a duplicate.
"""
from database.db import SessionLocal, init_db
from database import models
from utils.security import hash_password

ADMIN_EMAIL = "sikandarali@quest.edu.pk"
ADMIN_NAME = "Sikandar Ali"
ADMIN_PASSWORD = "Sikandar1"  # meets the 8-character minimum; change after first login


def seed():
    init_db()
    db = SessionLocal()
    try:
        existing = db.query(models.User).filter(models.User.email == ADMIN_EMAIL).first()
        if existing:
            print(f"User {ADMIN_EMAIL} already exists (role={existing.role.value}). Nothing to do.")
            return

        user = models.User(
            email=ADMIN_EMAIL,
            full_name=ADMIN_NAME,
            hashed_password=hash_password(ADMIN_PASSWORD),
            role=models.Role.admin,
        )
        db.add(user)
        db.commit()
        print(f"Created admin user:\n  email:    {ADMIN_EMAIL}\n  password: {ADMIN_PASSWORD}")
        print("Log in at /login with these credentials, then change the password.")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
