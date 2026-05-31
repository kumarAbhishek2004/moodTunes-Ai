"""
Authentication Endpoints - Add these to main.py
"""

# Add these imports at the top
from modules.auth import (
    UserSignup, UserLogin, TokenResponse, UserResponse,
    hash_password, verify_password, create_access_token, get_current_user
)
from modules.database import (
    connect_to_mongodb, close_mongodb_connection,
    create_user, get_user_by_email, get_user_by_id
)

# Add these to main.py after other imports
@app.on_event("startup")
async def startup_db():
    """Connect to MongoDB on startup"""
    await connect_to_mongodb()

@app.on_event("shutdown")
async def shutdown_db():
    """Close MongoDB connection on shutdown"""
    await close_mongodb_connection()


# ---------------------- Authentication Routes ----------------------
@app.post("/auth/signup", response_model=TokenResponse)
async def signup(user_data: UserSignup):
    """Register a new user"""
    # Check if user exists
    existing_user = await get_user_by_email(user_data.email)
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Hash password
    hashed_password = hash_password(user_data.password)
    
    # Create user
    user = await create_user(user_data.email, hashed_password, user_data.full_name)
    
    # Create token
    access_token = create_access_token(data={"user_id": user["_id"], "email": user["email"]})
    
    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse(
            id=user["_id"],
            email=user["email"],
            full_name=user["full_name"],
            created_at=user["created_at"]
        )
    )


@app.post("/auth/login", response_model=TokenResponse)
async def login(user_data: UserLogin):
    """Login user"""
    # Get user
    user = await get_user_by_email(user_data.email)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    # Verify password
    if not verify_password(user_data.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    # Create token
    access_token = create_access_token(data={"user_id": user["_id"], "email": user["email"]})
    
    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse(
            id=user["_id"],
            email=user["email"],
            full_name=user["full_name"],
            created_at=user["created_at"]
        )
    )


@app.get("/auth/me", response_model=UserResponse)
async def get_me(current_user: dict = Depends(get_current_user)):
    """Get current user info"""
    user = await get_user_by_id(current_user["user_id"])
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return UserResponse(
        id=user["_id"],
        email=user["email"],
        full_name=user["full_name"],
        created_at=user["created_at"]
    )


@app.post("/auth/logout")
async def logout():
    """Logout user (client should delete token)"""
    return {"message": "Logged out successfully"}
