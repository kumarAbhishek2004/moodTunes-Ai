"""
modules/models.py
Pydantic models used across the app.
"""
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict

# Mood
class EmotionScore(BaseModel):
    emotion: str
    score: float
    mood: str

class MoodDetectionResponse(BaseModel):
    emotion: str
    mood: str
    confidence: float
    all_emotions: Dict[str, float] = Field(default_factory=dict)
    mood_distribution: Dict[str, float] = Field(default_factory=dict)
    breakdown: List[EmotionScore] = Field(default_factory=list)

# Song
class Song(BaseModel):
    id: str
    name: str
    artist: str
    lastfm_url: Optional[str] = None
    youtube_id: Optional[str] = None
    preview_url: Optional[str] = None
    album: Optional[str] = None
    duration_ms: Optional[int] = None
    listeners: Optional[int] = None
    playcount: Optional[int] = None
    tags: List[str] = Field(default_factory=list)
    audio_features: Dict = Field(default_factory=dict)
    ai_explanation: Optional[str] = None
    mood_match: Optional[str] = None

# Recommendation requests
class RecommendationRequest(BaseModel):
    mood: str
    mood_distribution: Optional[Dict[str, float]] = None
    user_id: str = "default"
    limit: int = 20

class PersonalizedRecommendationRequest(BaseModel):
    mood: str
    mood_distribution: Optional[Dict[str, float]] = None
    user_id: str = "default"
    limit: int = 20
    preferences: Dict = Field(default_factory=dict)

class AdvancedRecommendationRequest(BaseModel):
    user_id: str = "default"
    mood: Optional[str] = None
    seed_songs: List[str] = Field(default_factory=list)
    seed_artists: List[str] = Field(default_factory=list)
    use_history: bool = True
    limit: int = 20

# Chat
class ChatMessage(BaseModel):
    message: str
    user_id: str = "default"
    current_mood: Optional[str] = None
    conversation_history: List[dict] = Field(default_factory=list)

# Public playlists (in-memory)
class PlaylistCreate(BaseModel):
    name: str
    description: str = ""
    mood: Optional[str] = None
    songs: List[Song]
    user_id: str = "default"

class Playlist(BaseModel):
    id: str
    name: str
    description: str
    mood: Optional[str]
    songs: List[Song]
    created_at: str
    user_id: str

# Auth user models (used by auth.py)
class UserSignup(BaseModel):
    email: EmailStr
    password: str
    full_name: str

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

# Authenticated playlists
class PlaylistCreateAuth(BaseModel):
    name: str
    description: str = ""
    mood: Optional[str] = None
    songs: List[Song] = Field(default_factory=list)
    is_public: bool = False

class PlaylistUpdateAuth(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    mood: Optional[str] = None
    songs: Optional[List[Song]] = None
    is_public: Optional[bool] = None

class AddSongToPlaylist(BaseModel):
    song: Song
