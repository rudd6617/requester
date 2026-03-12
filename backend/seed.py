"""Seed script — run with: python seed.py"""

from app.auth import hash_password
from app.database import SessionLocal, engine
from app.models import Base, User

Base.metadata.create_all(bind=engine)

db = SessionLocal()

admin = db.query(User).filter(User.username == "admin").first()
if not admin:
    db.add(User(
        username="admin",
        display_name="Admin",
        password_hash=hash_password("admin"),
        is_admin=True,
    ))

db.commit()
db.close()

print("Seed data inserted successfully.")
