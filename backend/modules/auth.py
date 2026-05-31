"""
modules/auth.py
FINAL FIX – bcrypt removed (Windows-safe)
Using pbkdf2_sha256 (same as Django)
"""
from typing import Optional, Dict
from datetime import datetime, timedelta
import os

from pydantic import BaseModel, EmailStr, Field
from fastapi import HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from passlib.context import CryptContext
import jwt
from dotenv import load_dotenv

load_dotenv()

# ---------------------------------------------------------
# PASSWORD HASHING (FINAL – NO BCRYPT)
# ---------------------------------------------------------
pwd_context = CryptContext(
    schemes=["pbkdf2_sha256"],
    deprecated="auto"
)

# JWT Config
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "change-this-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 60 * 24 * 7))

security = HTTPBearer()

# ---------------------------------------------------------
# MODELS
# ---------------------------------------------------------
class UserSignup(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6)
    full_name: str = Field(..., min_length=2)

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    email: EmailStr
    full_name: str
    created_at: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


# ---------------------------------------------------------
# PASSWORD HELPERS (NO LIMITS ANYMORE)
# ---------------------------------------------------------
def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


# ---------------------------------------------------------
# JWT HELPERS
# ---------------------------------------------------------
def create_access_token(data: Dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()

    if "sub" in to_encode and "user_id" not in to_encode:
        to_encode["user_id"] = to_encode["sub"]

    expire = datetime.utcnow() + (
        expires_delta if expires_delta else timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )

    to_encode.update({"exp": expire})

    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def decode_access_token(token: str) -> dict:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        if "user_id" not in payload and "sub" in payload:
            payload["user_id"] = payload["sub"]
        return payload

    except jwt.ExpiredSignatureError:
        raise HTTPException(401, "Token expired")

    except jwt.InvalidTokenError:
        raise HTTPException(401, "Invalid token")


# ---------------------------------------------------------
# CURRENT USER DEPENDENCY
# ---------------------------------------------------------
async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    token = credentials.credentials
    payload = decode_access_token(token)

    user_id = payload.get("user_id") or payload.get("sub")
    if not user_id:
        raise HTTPException(401, "Invalid authentication credentials")

    return {"user_id": user_id, "email": payload.get("email")}
