"""
Models Module
Contains all Pydantic models and data structures
"""
from pydantic import BaseModel, Field
from typing import List, Optional, Dict

class MoodDetectionResponse(BaseModel):
    """Response model for mood detection"""
    emotion: str
    mood: str
    confidence: float

class Song(BaseModel):
    """Song data model"""
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

class RecommendationRequest(BaseModel):
    """Basic recommendation request"""
    mood: str
    user_id: str = "default"
    limit: int = 20

class PersonalizedRecommendationRequest(BaseModel):
    """Personalized recommendation request with preferences"""
    mood: str
    user_id: str = "default"
    limit: int = 20
    preferences: Dict = Field(default_factory=dict)

class AdvancedRecommendationRequest(BaseModel):
    """Advanced recommendation with seeds and history"""
    user_id: str = "default"
    mood: Optional[str] = None
    seed_songs: List[str] = Field(default_factory=list)
    seed_artists: List[str] = Field(default_factory=list)
    use_history: bool = True
    limit: int = 20

class ChatMessage(BaseModel):
    """Chat message model"""
    message: str
    user_id: str = "default"
    current_mood: Optional[str] = None
    conversation_history: List[dict] = Field(default_factory=list)

class PlaylistCreate(BaseModel):
    """Playlist creation request"""
    name: str
    description: str = ""
    mood: Optional[str] = None
    songs: List[Song]
    user_id: str = "default"

class Playlist(BaseModel):
    """Playlist model"""
    id: str
    name: str
    description: str
    mood: Optional[str]
    songs: List[Song]
    created_at: str
    user_id: str
