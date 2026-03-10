"""Create a user interactively — run with: python create_user.py"""

import getpass

from app.auth import hash_password
from app.database import SessionLocal
from app.models import User

db = SessionLocal()

username = input("Username: ").strip()
if not username:
    print("Username cannot be empty.")
    raise SystemExit(1)

if db.query(User).filter(User.username == username).first():
    print(f"Username '{username}' already exists.")
    raise SystemExit(1)

display_name = input("Display name: ").strip()
if not display_name:
    display_name = username

password = getpass.getpass("Password: ")
if not password:
    print("Password cannot be empty.")
    raise SystemExit(1)

confirm = getpass.getpass("Confirm password: ")
if password != confirm:
    print("Passwords do not match.")
    raise SystemExit(1)

user = User(
    username=username,
    display_name=display_name,
    password_hash=hash_password(password),
)
db.add(user)
db.commit()
db.close()

print(f"User '{username}' created successfully.")
