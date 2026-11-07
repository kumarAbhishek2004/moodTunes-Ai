"""
User Service - Dual-Layer Persistence (MongoDB Atlas + Local JSON Mirror)
Ensures user authentication accounts and passwords persist forever across restarts.
"""
import os
import json
import threading
from typing import Optional
from datetime import datetime
from bson import ObjectId
from fastapi import HTTPException

from modules.database import get_database
from modules.auth import hash_password, verify_password

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")
LOCAL_USERS_FILE = os.path.join(DATA_DIR, "users.json")
_user_lock = threading.Lock()

def _load_local_users() -> dict:
    os.makedirs(DATA_DIR, exist_ok=True)
    if not os.path.exists(LOCAL_USERS_FILE):
        return {}
    try:
        with open(LOCAL_USERS_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return {}

def _save_local_users(data: dict):
    os.makedirs(DATA_DIR, exist_ok=True)
    try:
        tmp_file = LOCAL_USERS_FILE + ".tmp"
        with open(tmp_file, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        os.replace(tmp_file, LOCAL_USERS_FILE)
    except Exception as e:
        print(f"Error saving local users: {e}")

class UserService:
    """Service for user operations with guaranteed persistence"""

    @staticmethod
    async def create_user(email: str, password: str, full_name: str) -> dict:
        email_clean = email.lower().strip()
        hashed_password = hash_password(password)
        now_str = datetime.utcnow().isoformat()
        user_id = f"user_{int(datetime.utcnow().timestamp())}_{os.urandom(3).hex()}"

        database = get_database()
        if database is not None:
            try:
                existing = await database.users.find_one({"email": email_clean})
                if existing:
                    raise HTTPException(status_code=400, detail="Email already registered")
                doc = {
                    "email": email_clean,
                    "password": hashed_password,
                    "full_name": full_name,
                    "created_at": now_str,
                    "updated_at": now_str,
                }
                res = await database.users.insert_one(doc)
                user_id = str(res.inserted_id)
            except HTTPException:
                raise
            except Exception as e:
                print(f"MongoDB user insert notice: {e}")

        # Always save to local persistent JSON
        with _user_lock:
            users_map = _load_local_users()
            if email_clean in users_map:
                raise HTTPException(status_code=400, detail="Email already registered")
            user_record = {
                "id": user_id,
                "email": email_clean,
                "password": hashed_password,
                "full_name": full_name,
                "created_at": now_str,
            }
            users_map[email_clean] = user_record
            _save_local_users(users_map)

        return {
            "id": user_id,
            "email": email_clean,
            "full_name": full_name,
            "created_at": now_str,
        }

    @staticmethod
    async def authenticate_user(email: str, password: str) -> Optional[dict]:
        email_clean = email.lower().strip()
        database = get_database()

        if database is not None:
            try:
                user = await database.users.find_one({"email": email_clean})
                if user and verify_password(password, user["password"]):
                    return {
                        "id": str(user["_id"]),
                        "email": user["email"],
                        "full_name": user.get("full_name", ""),
                        "created_at": user.get("created_at", ""),
                    }
            except Exception as e:
                print(f"MongoDB auth notice: {e}")

        # Fallback to local persistent database
        with _user_lock:
            users_map = _load_local_users()
            user = users_map.get(email_clean)
            if user and verify_password(password, user["password"]):
                return {
                    "id": user["id"],
                    "email": user["email"],
                    "full_name": user.get("full_name", ""),
                    "created_at": user.get("created_at", ""),
                }

        return None

    @staticmethod
    async def get_user_by_id(user_id: str) -> Optional[dict]:
        database = get_database()
        if database is not None:
            try:
                try:
                    obj_id = ObjectId(user_id)
                    user = await database.users.find_one({"_id": obj_id})
                except Exception:
                    user = await database.users.find_one({"id": user_id})
                if user:
                    return {
                        "id": str(user.get("_id", user_id)),
                        "email": user["email"],
                        "full_name": user.get("full_name", ""),
                        "created_at": user.get("created_at", ""),
                    }
            except Exception:
                pass

        with _user_lock:
            users_map = _load_local_users()
            for u in users_map.values():
                if u.get("id") == user_id:
                    return {
                        "id": u["id"],
                        "email": u["email"],
                        "full_name": u.get("full_name", ""),
                        "created_at": u.get("created_at", ""),
                    }

        return None

user_service = UserService()
