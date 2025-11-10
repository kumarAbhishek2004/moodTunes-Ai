"""
Main Application File - Modular Backend
MoodTunes AI - Music Recommendation System
"""

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import Dict, Optional, Any
from modules.config import Config
from modules.models import (
    MoodDetectionResponse, Song, RecommendationRequest, PersonalizedRecommendationRequest,
    ChatMessage, PlaylistCreate, Playlist
)
from modules.mood_detection import MoodDetector
from modules.music_player import music_player
from modules.recommendation_engine import recommendation_engine
from modules.chatbot import chatbot
from modules.voice_to_text import voice_to_text
from datetime import datetime
from collections import defaultdict

app = FastAPI(
    title="MoodTunes AI - Modular Music Recommender API",
    description="AI-powered music recommendation system with mood detection and voice control",
    version="3.3-enhanced"
)

# Middleware setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=Config.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

# In-memory storage
user_playlists = defaultdict(list)
user_preferences = defaultdict(lambda: {
    'favorite_artists': [],
    'favorite_genres': [],
    'listening_patterns': {},
    'mood_history': []
})


# ---------------------- Mood Detection ----------------------
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


# ---------------------- Recommendation Engine ----------------------
@app.post("/api/personalized-recommendations")
async def get_personalized_recommendations(request: PersonalizedRecommendationRequest):
    return recommendation_engine.get_personalized_recommendations(request)

@app.post("/api/recommendations", response_model=Dict)
async def get_basic_recommendations(request: RecommendationRequest):
    return recommendation_engine.get_basic_recommendations(request)

@app.get("/search-music")
async def search_music(query: str, limit: int = 10):
    return recommendation_engine.search_music(query, limit)

@app.get("/similar-songs")
async def get_similar_songs(song_name: str, artist: Optional[str] = None, limit: int = 10):
    track = recommendation_engine.search_track(song_name, artist)
    if not track:
        raise HTTPException(status_code=404, detail="Song not found")
    similars = recommendation_engine.get_similar_tracks(track, limit=limit)
    return {
        "original_song": {"title": track.title, "artist": track.artist.name},
        "similar_songs": similars,
        "total": len(similars)
    }


# ---------------------- YouTube Player ----------------------
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


# ---------------------- Enhanced Chatbot ----------------------
@app.post("/chat")
async def chat_with_bot(message: ChatMessage):
    """
    Enhanced AI Chatbot with:
    - Direct playback: "play [song]" instantly plays
    - Smart recommendations: Returns clickable song buttons
    - Intelligent search: Find by lyrics, artist, or description
    """
    try:
        # Use enhanced chatbot method
        result = chatbot.chat_with_user(message.message)
        
        return {
            "response": result["response"],
            "play_command": result.get("play_command"),
            "recommended_songs": result.get("recommended_songs", []),
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Chat failed: {str(e)}")

@app.get("/chat/history/{user_id}")
async def get_chat_history(user_id: str, limit: int = 10):
    return {"user_id": user_id, "history": chatbot.conversation_history[-limit:], "total": len(chatbot.conversation_history)}

@app.delete("/chat/history/{user_id}")
async def clear_chat_history(user_id: str):
    chatbot.reset_conversation()
    return {"message": f"Chat history cleared for user {user_id}", "timestamp": datetime.now().isoformat()}


# ---------------------- Voice to Text (Enhanced) ----------------------
@app.post("/voice/transcribe")
async def transcribe_voice(file: UploadFile = File(...), language: str = "auto"):
    """Enhanced transcription with auto language detection"""
    transcript = await voice_to_text.transcribe_audio(file, language)
    return {
        "transcript": transcript,
        "language": language,
        "timestamp": datetime.now().isoformat(),
        "status": "success"
    }

@app.post("/voice/transcribe-multilang")
async def transcribe_voice_multilang(file: UploadFile = File(...), language: str = "en"):
    """Transcribe with specific language (Hindi or English)"""
    transcript = await voice_to_text.transcribe_audio_hindi_english(file, language)
    return {
        "transcript": transcript,
        "language": language,
        "timestamp": datetime.now().isoformat(),
        "status": "success"
    }

@app.post("/voice/transcribe-detailed")
async def transcribe_voice_detailed(file: UploadFile = File(...)):
    """Get detailed transcription with language detection and confidence"""
    result = await voice_to_text.transcribe_audio_multilang(file)
    return {
        **result,
        "timestamp": datetime.now().isoformat(),
        "status": "success"
    }

@app.post("/voice/transcribe-timestamps")
async def transcribe_with_timestamps(file: UploadFile = File(...)):
    """Transcribe with word-level timestamps"""
    result = await voice_to_text.transcribe_with_timestamps(file)
    return {
        **result,
        "timestamp": datetime.now().isoformat(),
        "status": "success"
    }

@app.get("/voice/supported-languages")
async def get_supported_languages():
    """Get list of supported languages for transcription"""
    return {
        "languages": voice_to_text.get_supported_languages(),
        "default": "auto",
        "timestamp": datetime.now().isoformat()
    }


# ---------------------- Playlists ----------------------
@app.post("/playlists", response_model=Playlist)
async def create_playlist(playlist: PlaylistCreate):
    playlist_id = f"pl_{int(datetime.now().timestamp())}"
    new_playlist = Playlist(
        id=playlist_id,
        name=playlist.name,
        description=playlist.description,
        mood=playlist.mood,
        songs=playlist.songs,
        created_at=datetime.now().isoformat(),
        user_id=playlist.user_id
    )
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


# ---------------------- User History & Preferences ----------------------
@app.get("/history/{user_id}")
async def get_user_history(user_id: str, limit: int = 50):
    return recommendation_engine.get_user_history(user_id, limit)

@app.get("/preferences/{user_id}")
async def get_user_preferences(user_id: str):
    return {"user_id": user_id, "preferences": user_preferences[user_id]}

@app.put("/preferences/{user_id}")
async def update_user_preferences(user_id: str, preferences: Dict):
    user_preferences[user_id].update(preferences)
    return {
        "user_id": user_id,
        "preferences": user_preferences[user_id],
        "message": "Preferences updated successfully",
        "timestamp": datetime.now().isoformat()
    }


# ---------------------- Chatbot Song Search (Enhanced) ----------------------
@app.get("/search-song")
async def search_specific_song(name: str, artist: Optional[str] = None):
    try:
        print(f"\n🔍 Chatbot Song Search: '{name}' by {artist}")
        song = recommendation_engine.search_track(name, artist)

        if not song:
            raise HTTPException(status_code=404, detail=f"Song '{name}' not found")

        if not song.youtube_id:
            print(f"  Song found but no YouTube ID, fetching now...")
            search_query = f"{artist} {name}" if artist else name
            youtube_id = music_player.get_youtube_id(search_query)

            if youtube_id:
                song.youtube_id = youtube_id
                song.preview_url = f"https://www.youtube.com/watch?v={youtube_id}"
                print(f"✅ YouTube ID added: {youtube_id}")
            else:
                alt_query = f"{name} {artist}" if artist else f"{name} official audio"
                youtube_id = music_player.get_youtube_id(alt_query)
                if youtube_id:
                    song.youtube_id = youtube_id
                    song.preview_url = f"https://www.youtube.com/watch?v={youtube_id}"
                    print(f"✅ YouTube ID added (alt): {youtube_id}")
                else:
                    print(f"❌ Could not find YouTube video for: {name}")
                    raise HTTPException(status_code=404, detail=f"Song found but no video available for '{name}'")

        if song.youtube_id:
            print(f"✅ Returning song: {song.name} by {song.artist}")
            print(f"   YouTube ID: {song.youtube_id}")
            print(f"   Preview URL: {song.preview_url}\n")

        return song

    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error searching song: {e}")
        raise HTTPException(status_code=500, detail=f"Search failed: {str(e)}")


# ---------------------- Health Check ----------------------
@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "version": "3.3-enhanced",
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
        "version": "3.3-enhanced",
        "description": "AI-powered music recommendation system with enhanced chatbot",
        "status": "running",
        "docs": "/docs",
        "features": [
            "Mood Detection", "Personalized Recommendations",
            "Voice Control", "Enhanced AI Chatbot", "YouTube Playback",
            "Direct Song Playback", "Smart Recommendations"
        ]
    }


# ---------------------- Run Server ----------------------
if __name__ == "__main__":
    import uvicorn
    print("\n" + "=" * 70)
    print("🎵 MoodTunes AI - Music Recommendation System (Enhanced)")
    print("=" * 70)
    print(f"\n🚀 Starting server on http://{Config.HOST}:{Config.PORT}")
    print(f"API Documentation: http://{Config.HOST}:{Config.PORT}/docs")
    print(f"🎤 Voice Control: Enabled")
    print(f"🤖 Enhanced Chatbot: Direct Playback + Smart Recommendations")
    print("=" * 70 + "\n")
    uvicorn.run(app, host=Config.HOST, port=Config.PORT, reload=Config.RELOAD)