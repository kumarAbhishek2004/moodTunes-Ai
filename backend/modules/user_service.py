"""
User Service - MongoDB CRUD operations for users
"""
from typing import Optional
from datetime import datetime
from bson import ObjectId
from bson.errors import InvalidId
from fastapi import HTTPException

from modules.database import get_database
from modules.auth import hash_password, verify_password


class UserService:
    """Service for user operations such as creating a user, login, and lookup."""

    @staticmethod
    async def create_user(email: str, password: str, full_name: str) -> dict:
        database = get_database()
        if database is None:
            raise HTTPException(status_code=503, detail="Database not available")

        # Check if user exists
        existing_user = await database.users.find_one({"email": email})
        if existing_user:
            raise HTTPException(status_code=400, detail="Email already registered")

        hashed_password = hash_password(password)

        user_data = {
            "email": email,
            "password": hashed_password,
            "full_name": full_name,
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat(),
        }

        result = await database.users.insert_one(user_data)
        user_id = str(result.inserted_id)

        return {
            "id": user_id,
            "email": email,
            "full_name": full_name,
            "created_at": user_data["created_at"],
        }

    @staticmethod
    async def authenticate_user(email: str, password: str) -> Optional[dict]:
        database = get_database()
        if database is None:
            raise HTTPException(status_code=503, detail="Database not available")

        user = await database.users.find_one({"email": email})
        if not user:
            return None

        if not verify_password(password, user["password"]):
            return None

        return {
            "id": str(user["_id"]),
            "email": user["email"],
            "full_name": user.get("full_name", ""),
            "created_at": user.get("created_at", ""),
        }

    @staticmethod
    async def get_user_by_id(user_id: str) -> Optional[dict]:
        database = get_database()
        if database is None:
            raise HTTPException(status_code=503, detail="Database not available")

        try:
            obj_id = ObjectId(user_id)
        except InvalidId:
            return None

        user = await database.users.find_one({"_id": obj_id})
        if not user:
            return None

        return {
            "id": str(user["_id"]),
            "email": user["email"],
            "full_name": user.get("full_name", ""),
            "created_at": user.get("created_at", ""),
        }


user_service = UserService()
