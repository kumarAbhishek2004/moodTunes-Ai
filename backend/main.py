"""
Main Application File - Modular Backend
MoodTunes AI - Music Recommendation System
"""

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import Dict, Optional
from modules.config import Config
from modules.models import (MoodDetectionResponse, Song, RecommendationRequest, PersonalizedRecommendationRequest, ChatMessage, PlaylistCreate, Playlist)
from modules.mood_detection import MoodDetector
from modules.music_player import music_player
from modules.recommendation_engine import recommendation_engine
from modules.chatbot import chatbot
from modules.voice_to_text import voice_to_text
from datetime import datetime
from collections import defaultdict

app = FastAPI(title="MoodTunes AI - Modular Music Recommender API", description="AI-powered music recommendation system with mood detection and voice control", version="3.1-voice")

app.add_middleware(CORSMiddleware, allow_origins=Config.CORS_ORIGINS, allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

user_playlists = defaultdict(list)
user_preferences = defaultdict(lambda: {'favorite_artists': [], 'favorite_genres': [], 'listening_patterns': {}, 'mood_history': []})

@app.post("/detect-mood", response_model=MoodDetectionResponse)
async def detect_mood_from_image(file: UploadFile = File(...)):
    return await MoodDetector.detect_from_image(file)

@app.post("/detect-mood-manual")
async def detect_mood_manual(mood: str):
    if not MoodDetector.validate_mood(mood):
        raise HTTPException(status_code=400, detail=f"Invalid mood. Valid moods: {list(MoodDetector.get_all_moods().keys())}")
    return {"mood": mood.lower(), "message": f"Mood set to {mood.lower()}", "timestamp": datetime.now().isoformat()}

@app.get("/moods")
async def get_available_moods():
    return {"moods": MoodDetector.get_all_moods(), "total": len(MoodDetector.get_all_moods())}

@app.post("/api/personalized-recommendations")
async def get_personalized_recommendations(request: PersonalizedRecommendationRequest):
    return recommendation_engine.get_personalized_recommendations(request)

@app.post("/api/recommendations", response_model=Dict)
async def get_basic_recommendations(request: RecommendationRequest):
    return recommendation_engine.get_basic_recommendations(request)

@app.get("/search-music")
async def search_music(query: str, limit: int = 10):
    return recommendation_engine.search_music(query, limit)

@app.get("/search-song")
async def search_specific_song(name: str, artist: str):
    track = recommendation_engine.search_track(name, artist)
    if not track:
        raise HTTPException(status_code=404, detail="Song not found")
    return recommendation_engine.track_to_song(track)

@app.get("/similar-songs")
async def get_similar_songs(song_name: str, artist: Optional[str] = None, limit: int = 10):
    track = recommendation_engine.search_track(song_name, artist)
    if not track:
        raise HTTPException(status_code=404, detail="Song not found")
    similars = recommendation_engine.get_similar_tracks(track, limit=limit)
    return {"original_song": {"title": track.title, "artist": track.artist.name}, "similar_songs": similars, "total": len(similars)}

@app.get("/youtube/search")
async def search_youtube(song_name: str, artist: str):
    result = music_player.search_and_get_url(song_name, artist)
    if not result:
        raise HTTPException(status_code=404, detail="YouTube video not found for this song")
    return result

@app.get("/youtube/cache-stats")
async def get_cache_stats():
    return music_player.get_cache_stats()

@app.post("/youtube/clear-cache")
async def clear_youtube_cache():
    music_player.clear_cache()
    return {"message": "YouTube cache cleared successfully", "timestamp": datetime.now().isoformat()}

@app.post("/chat")
async def chat_with_bot(message: ChatMessage):
    return await chatbot.chat(message)

@app.get("/chat/history/{user_id}")
async def get_chat_history(user_id: str, limit: int = 10):
    history = chatbot.get_conversation_context(user_id, limit)
    return {"user_id": user_id, "history": history, "total": len(history)}

@app.delete("/chat/history/{user_id}")
async def clear_chat_history(user_id: str):
    chatbot.clear_conversation_context(user_id)
    return {"message": f"Chat history cleared for user {user_id}", "timestamp": datetime.now().isoformat()}

# Voice to Text Endpoints
@app.post("/voice/transcribe")
async def transcribe_voice(file: UploadFile = File(...)):
    """
    Transcribe audio to text (English only)
    Accepts: audio/wav, audio/mp3, audio/webm, audio/ogg
    """
    transcript = await voice_to_text.transcribe_audio(file)
    return {
        "transcript": transcript,
        "language": "en",
        "timestamp": datetime.now().isoformat()
    }

@app.post("/voice/transcribe-multilang")
async def transcribe_voice_multilang(file: UploadFile = File(...), language: str = "en"):
    """
    Transcribe audio to text with language selection
    language: 'en' (English) or 'hi' (Hindi)
    """
    transcript = await voice_to_text.transcribe_audio_hindi_english(file, language)
    return {
        "transcript": transcript,
        "language": language,
        "timestamp": datetime.now().isoformat()
    }

@app.post("/playlists", response_model=Playlist)
async def create_playlist(playlist: PlaylistCreate):
    playlist_id = f"pl_{int(datetime.now().timestamp())}"
    new_playlist = Playlist(id=playlist_id, name=playlist.name, description=playlist.description, mood=playlist.mood, songs=playlist.songs, created_at=datetime.now().isoformat(), user_id=playlist.user_id)
    user_playlists[playlist.user_id].append(new_playlist.dict())
    return new_playlist

@app.get("/playlists")
async def get_user_playlists(user_id: str = "default"):
    playlists = user_playlists[user_id]
    return {"user_id": user_id, "playlists": playlists, "total": len(playlists)}

@app.get("/playlists/{playlist_id}")
async def get_playlist(playlist_id: str, user_id: str = "default"):
    playlists = user_playlists[user_id]
    for playlist in playlists:
        if playlist['id'] == playlist_id:
            return playlist
    raise HTTPException(status_code=404, detail="Playlist not found")

@app.delete("/playlists/{playlist_id}")
async def delete_playlist(playlist_id: str, user_id: str = "default"):
    playlists = user_playlists[user_id]
    for i, playlist in enumerate(playlists):
        if playlist['id'] == playlist_id:
            del playlists[i]
            return {"message": "Playlist deleted successfully", "playlist_id": playlist_id, "timestamp": datetime.now().isoformat()}
    raise HTTPException(status_code=404, detail="Playlist not found")

@app.get("/history/{user_id}")
async def get_user_history(user_id: str, limit: int = 50):
    return recommendation_engine.get_user_history(user_id, limit)

@app.get("/preferences/{user_id}")
async def get_user_preferences(user_id: str):
    return {"user_id": user_id, "preferences": user_preferences[user_id]}

@app.put("/preferences/{user_id}")
async def update_user_preferences(user_id: str, preferences: Dict):
    user_preferences[user_id].update(preferences)
    return {"user_id": user_id, "preferences": user_preferences[user_id], "message": "Preferences updated successfully", "timestamp": datetime.now().isoformat()}

@app.get("/health")
async def health_check():
    return {
        "status": "healthy", 
        "version": "3.1-voice", 
        "timestamp": datetime.now().isoformat(), 
        "services": {
            "lastfm": Config.get_lastfm() is not None, 
            "youtube": Config.get_youtube() is not None, 
            "gemini": Config.get_gemini() is not None,
            "deepgram": Config.get_deepgram() is not None
        }
    }

@app.get("/")
async def root():
    return {
        "app": "MoodTunes AI", 
        "version": "3.1-voice", 
        "description": "AI-powered music recommendation system with voice control", 
        "status": "running", 
        "docs": "/docs",
        "features": ["Mood Detection", "Personalized Recommendations", "Voice Control", "AI Chatbot", "YouTube Playback"]
    }

if __name__ == "__main__":
    import uvicorn
    print("\n" + "="*70)
    print("🎵 MoodTunes AI - Music Recommendation System with Voice Control")
    print("="*70)
    print(f"\n🚀 Starting server on http://{Config.HOST}:{Config.PORT}")
    print(f"📚 API Documentation: http://{Config.HOST}:{Config.PORT}/docs")
    print(f"🎤 Voice Control: Enabled (Deepgram)")
    print("="*70 + "\n")
    uvicorn.run(app, host=Config.HOST, port=Config.PORT, reload=Config.RELOAD)
