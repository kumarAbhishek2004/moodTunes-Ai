import sys

# Ensure UTF-8 output on Windows to prevent UnicodeEncodeError with emojis

if sys.platform == "win32":

    try:

        if hasattr(sys.stdout, "reconfigure"):

            sys.stdout.reconfigure(encoding="utf-8", errors="replace")

        if hasattr(sys.stderr, "reconfigure"):

            sys.stderr.reconfigure(encoding="utf-8", errors="replace")

    except Exception:

        pass



import asyncio
import time

from fastapi import FastAPI, UploadFile, File, HTTPException, Depends

from fastapi.middleware.cors import CORSMiddleware

from typing import Dict, Optional, Any, List

from datetime import datetime

from collections import defaultdict



# Config

from modules.config import Config



# Models

from modules.models import (

    MoodDetectionResponse,

    EmotionScore,

    Song,

    RecommendationRequest,

    PersonalizedRecommendationRequest,

    ChatMessage,

    PlaylistCreate,

    PlaylistCreateAuth,

    PlaylistUpdateAuth,

    AddSongToPlaylist

)



# Feature modules

from modules.mood_detection import MoodDetector

from modules.recommendation_engine import recommendation_engine

from modules.music_player import music_player

from modules.chatbot import chatbot

from modules.voice_to_text import voice_to_text



# Auth

from modules.auth import (

    UserSignup,

    UserLogin,

    UserResponse,

    TokenResponse,

    create_access_token,

    get_current_user,

    get_optional_user

)

from modules.artwork_service import artwork_service



# Services

from modules.user_service import user_service

from modules.playlist_service import playlist_service
from modules.website_knowledge_base import knowledge_base



# Database

from modules.database import connect_to_mongodb, close_mongodb_connection, get_database





# -----------------------------------------------------------

# FASTAPI APP

# -----------------------------------------------------------

app = FastAPI(

    title="MoodTunes AI - Modular Music Recommender API",

    description="AI-powered music recommendation system with mood detection and voice control",

    version="3.3-enhanced"

)



# CORS

app.add_middleware(

    CORSMiddleware,

    allow_origin_regex=r".*",

    allow_credentials=True,

    allow_methods=["*"],

    allow_headers=["*"]

)





# -----------------------------------------------------------
# LOCAL PERSISTENT STORAGE (FILE-BACKED ENGINE)
# -----------------------------------------------------------
import os
import json
import uuid

DATA_DIR = os.path.join(os.path.dirname(__file__), "data")
os.makedirs(DATA_DIR, exist_ok=True)

def _load_json_store(filename, default_val):
    filepath = os.path.join(DATA_DIR, filename)
    if os.path.exists(filepath):
        try:
            with open(filepath, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return default_val
    return default_val

def _save_json_store(filename, data):
    os.makedirs(DATA_DIR, exist_ok=True)
    filepath = os.path.join(DATA_DIR, filename)
    tmp = f"{filepath}.{os.getpid()}_{uuid.uuid4().hex}.tmp"
    try:
        from fastapi.encoders import jsonable_encoder
        with open(tmp, "w", encoding="utf-8") as f:
            json.dump(jsonable_encoder(data), f, indent=2, ensure_ascii=False)
        os.replace(tmp, filepath)
    except Exception as e:
        print(f"Error persisting {filename}: {e}")
        if os.path.exists(tmp):
            try:
                os.remove(tmp)
            except Exception:
                pass

# Initial load from disk
_saved_playlists = _load_json_store("public_playlists.json", {})
_saved_favs = _load_json_store("favorites.json", {})
_saved_mood_favs = _load_json_store("favorites_by_mood.json", {})
_saved_prefs = _load_json_store("preferences.json", {})

user_playlists = defaultdict(list, _saved_playlists)
user_favorites_db = defaultdict(list, _saved_favs)
user_favorites_by_mood_db = defaultdict(dict, _saved_mood_favs)

user_preferences = defaultdict(lambda: {
    'favorite_artists': [],
    'favorite_genres': [],
    'listening_patterns': {},
    'mood_history': []
}, _saved_prefs)





# -----------------------------------------------------------

# STARTUP EVENT (UPDATED WITH FIX)

# -----------------------------------------------------------

@app.on_event("startup")

async def startup_event():

    """Connect to DB and initialize heavy models safely"""

    print("🚀 Starting MoodTunes…")



    # 1. Connect MongoDB

    try:

        await connect_to_mongodb()

    except Exception as e:

        print(f"⚠️  MongoDB startup error: {e}. Continuing without database.")



    # 2. Load DeepFace / TensorFlow IN THREAD (non-blocking)

    



    print(" Startup completed successfully")





# Shutdown event

@app.on_event("shutdown")

async def shutdown_event():

    await close_mongodb_connection()

    print("🛑 Shutdown complete")





# ===========================================================

#  MOOD DETECTION

# ===========================================================

@app.post("/detect-mood", response_model=MoodDetectionResponse)

async def detect_mood(file: UploadFile = File(...)):

    return await MoodDetector.detect_from_image(file)





@app.post("/detect-mood-manual", response_model=MoodDetectionResponse)

async def detect_mood_manual(mood: str):

    clean_mood = mood.lower()

    if not MoodDetector.validate_mood(clean_mood):

        raise HTTPException(status_code=400, detail="Invalid mood")

    return MoodDetectionResponse(

        emotion=clean_mood,

        mood=clean_mood,

        confidence=100.0,

        all_emotions={clean_mood: 100.0},

        mood_distribution={clean_mood: 100.0},

        breakdown=[

            EmotionScore(emotion=clean_mood, score=100.0, mood=clean_mood)

        ]

    )





@app.post("/api/detect-mood-text", response_model=MoodDetectionResponse)

async def detect_mood_from_text(payload: Dict[str, str]):

    text = payload.get("text", "")

    if not text:

        raise HTTPException(status_code=400, detail="Text cannot be empty")

    return await asyncio.to_thread(chatbot.analyze_text_mood, text)


@app.post("/api/detect-voice-mood", response_model=MoodDetectionResponse)

async def detect_mood_from_voice(payload: Dict[str, Any]):

    text = payload.get("text", "")

    tone_features = payload.get("tone_features", {})

    return await asyncio.to_thread(chatbot.analyze_voice_mood, text, tone_features)





@app.get("/moods")

async def get_available_moods():

    return {"moods": MoodDetector.get_all_moods()}





# ===========================================================

#  RECOMMENDATIONS

# ===========================================================

@app.post("/api/personalized-recommendations")

async def get_personalized_recommendations(request: PersonalizedRecommendationRequest):

    return await asyncio.to_thread(recommendation_engine.get_personalized_recommendations, request)





@app.post("/api/recommendations", response_model=Dict)

async def get_basic_recommendations(request: RecommendationRequest):

    return await asyncio.to_thread(recommendation_engine.get_basic_recommendations, request)





@app.get("/search-music")

async def search_music(query: str, limit: int = 5):

    results = await asyncio.to_thread(recommendation_engine.search_music, query, limit)

    return {"results": results, "total": len(results), "query": query}





@app.get("/search-song")

async def search_specific_song(name: str, artist: Optional[str] = None):

    """

    Fast song search for chatbot - uses direct YouTube search

    """

    try:

        print(f"\n🔍 Chatbot Song Search: '{name}' by {artist}")

        

        # Use direct YouTube search (fast)

        query = f"{artist} {name}" if artist else name

        results = await asyncio.to_thread(recommendation_engine.search_music, query, limit=1)

        

        if not results or len(results) == 0:

            raise HTTPException(status_code=404, detail=f"Song '{name}' not found")

        

        song = results[0]

        print(f"✅ Found: {song.name} by {song.artist}")

        print(f"   YouTube ID: {song.youtube_id}\n")

        

        return song

        

    except HTTPException:

        raise

    except Exception as e:

        print(f"❌ Error searching song: {e}")

        raise HTTPException(status_code=500, detail=f"Search failed: {str(e)}")





@app.get("/similar-songs")

async def get_similar_songs(song_name: str, artist: Optional[str] = None, limit: int = 10):

    track = await asyncio.to_thread(recommendation_engine.search_track, song_name, artist)

    if not track:

        raise HTTPException(status_code=404, detail="Song not found")



    similars = await asyncio.to_thread(

        recommendation_engine.get_similar_tracks,

        track.name,

        track.artist,

        limit=limit

    )

    return {"original_song": track, "similar_songs": similars}





# ===========================================================

#  YOUTUBE PLAYER

# ===========================================================

@app.get("/youtube/search")

async def search_youtube(song_name: str, artist: str):

    result = await asyncio.to_thread(music_player.search_and_get_url, song_name, artist)

    if not result:

        raise HTTPException(status_code=404, detail="YouTube video not found")

    return result





@app.get("/youtube/cache-stats")

async def get_cache_stats():

    return music_player.get_cache_stats()





# In-memory hourly cache for Last.fm Trending Global Charts
_trending_cache = {
    "timestamp": 0,
    "tracks": []
}

@app.get("/api/trending-tracks")
async def get_live_trending_tracks(limit: int = 15):
    """
    Real-time trending chart from Last.fm & global stream indicators.
    Updates hourly with parallel YouTube ID resolution.
    """
    global _trending_cache
    now = time.time()
    
    # Return hourly cached chart if fresh (< 3600 seconds)
    if _trending_cache["tracks"] and (now - _trending_cache["timestamp"] < 3600):
        return {
            "source": "lastfm-hourly-cache",
            "updated_at": datetime.fromtimestamp(_trending_cache["timestamp"]).strftime("%I:%M %p"),
            "tracks": _trending_cache["tracks"][:limit]
        }

    try:
        network = Config.get_lastfm()
        raw_tracks = []
        if network:
            top = await asyncio.to_thread(network.get_top_tracks, limit=limit)
            for rank, item in enumerate(top, 1):
                try:
                    track_obj = item.item
                    title = track_obj.title
                    artist_name = track_obj.artist.name
                    plays_count = item.weight
                    plays_str = f"{plays_count / 1_000_000:.1f}M" if plays_count and plays_count > 1_000_000 else f"{plays_count // 1_000}K" if plays_count else "240.5M"
                    mood = artwork_service.infer_mood(title, artist_name)
                    
                    raw_tracks.append({
                        "rank": rank,
                        "id": f"lastfm-trend-{rank}",
                        "name": title,
                        "artist": artist_name,
                        "plays": plays_str,
                        "mood_match": mood,
                        "duration": 220,
                        "youtube_id": None,
                        "image": None
                    })
                except Exception:
                    continue

        if raw_tracks:
            # Parallel resolve YouTube IDs and images
            for t in raw_tracks:
                vid = music_player.get_youtube_id(f"{t['artist']} {t['name']}")
                if vid:
                    t["youtube_id"] = vid
                    t["image"] = f"https://i.ytimg.com/vi/{vid}/hqdefault.jpg"

            _trending_cache = {
                "timestamp": now,
                "tracks": raw_tracks
            }
            return {
                "source": "lastfm-live-sync",
                "updated_at": datetime.fromtimestamp(now).strftime("%I:%M %p"),
                "tracks": raw_tracks
            }
    except Exception as e:
        print(f"Error fetching Last.fm trending tracks: {e}")

    # Fallback to empty tracks so frontend uses curated seeds
    return {
        "source": "curated-verified",
        "updated_at": datetime.now().strftime("%I:%M %p"),
        "tracks": []
    }

@app.post("/youtube/clear-cache")
async def clear_youtube_cache():
    music_player.clear_cache()
    return {"message": "YouTube cache cleared"}

@app.post("/youtube/clear-cache")

async def clear_youtube_cache():

    music_player.clear_cache()

    return {"message": "YouTube cache cleared"}





# ===========================================================

#  CHATBOT

# ===========================================================

@app.post("/chat")

async def chat_with_bot(message: ChatMessage):

    result = await asyncio.to_thread(chatbot.chat_with_user, message.message)

    return {

        "response": result["response"],

        "play_command": result.get("play_command"),

        "playlist_name": result.get("playlist_name"),

        "recommended_songs": result.get("recommended_songs", [])

    }





@app.get("/chat/history/{user_id}")

async def get_chat_history(user_id: str):

    return chatbot.conversation_history[-50:]





@app.delete("/chat/history/{user_id}")

async def clear_chat_history(user_id: str):

    chatbot.reset_conversation()

    return {"message": "Chat history cleared"}





# ===========================================================

#  VOICE TO TEXT

# ===========================================================

@app.post("/voice/transcribe")
@app.post("/voice/transcribe-detailed")

async def transcribe_voice(file: UploadFile = File(...), language: str = "auto"):

    if hasattr(voice_to_text, 'transcribe_audio_multilang'):
        return await voice_to_text.transcribe_audio_multilang(file)
    transcript = await voice_to_text.transcribe_audio(file, language)

    return {"transcript": transcript, "language": language, "detected_language": language, "language_name": language, "confidence": 0.95}





# ===========================================================

#  PUBLIC PLAYLISTS (IN-MEMORY)

# ===========================================================

@app.post("/playlists", response_model=dict)

async def create_playlist(playlist: PlaylistCreate):

    playlist_id = f"pl_{int(datetime.now().timestamp())}"



    new_playlist = {

        "id": playlist_id,

        "name": playlist.name,

        "description": playlist.description,

        "mood": playlist.mood,

        "songs": playlist.songs,

        "created_at": datetime.now().isoformat(),

        "user_id": playlist.user_id

    }



    user_playlists[playlist.user_id].append(new_playlist)
    _save_json_store('public_playlists.json', dict(user_playlists))

    return new_playlist





@app.get("/playlists")

async def get_user_playlists(user_id: str = "default"):

    return user_playlists[user_id]





@app.delete("/playlists/{playlist_id}")

async def delete_playlist(playlist_id: str, user_id: str = "default"):

    user_playlists[user_id] = [

        p for p in user_playlists[user_id] if p["id"] != playlist_id

    ]

    _save_json_store('public_playlists.json', dict(user_playlists))
    return {"message": "Playlist deleted"}





# ===========================================================

#  AUTHENTICATION

# ===========================================================

@app.post("/auth/signup", response_model=TokenResponse)
async def signup(user_data: UserSignup):
    email_clean = (user_data.email or "").strip().lower()
    if not email_clean or "@" not in email_clean:
        raise HTTPException(status_code=400, detail="Please enter a valid email address")

    if not user_data.password or len(user_data.password) < 4:
        raise HTTPException(status_code=400, detail="Password must be at least 4 characters long")

    resolved_name = (user_data.full_name or user_data.name or "").strip()
    if not resolved_name:
        resolved_name = email_clean.split("@")[0].capitalize()

    user = await user_service.create_user(
        email=email_clean,
        password=user_data.password,
        full_name=resolved_name
    )

    access_token = create_access_token({"user_id": user["id"], "email": user["email"]})
    return TokenResponse(access_token=access_token, user=UserResponse(**user))


@app.post("/auth/login", response_model=TokenResponse)
async def login(user_data: UserLogin):
    email_clean = (user_data.email or "").strip().lower()
    user = await user_service.authenticate_user(email_clean, user_data.password)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    access_token = create_access_token({"user_id": user["id"], "email": user["email"]})
    return TokenResponse(access_token=access_token, user=UserResponse(**user))





@app.get("/auth/me", response_model=UserResponse)

async def get_me(current_user: dict = Depends(get_current_user)):

    user = await user_service.get_user_by_id(current_user["user_id"])

    return UserResponse(**user)





@app.post("/auth/logout")

async def logout():

    return {"message": "Logged out successfully"}





# ===========================================================

#  AUTH PLAYLISTS (MONGODB)

# ===========================================================



# Create new playlist

@app.post("/api/playlists")

async def create_user_playlist(

    playlist_data: PlaylistCreateAuth,

    current_user: dict = Depends(get_current_user)

):

    return await playlist_service.create_playlist(

        user_id=current_user["user_id"],

        name=playlist_data.name,

        description=playlist_data.description,

        mood=playlist_data.mood,

        cover=playlist_data.cover,

        songs=playlist_data.songs,

        is_public=playlist_data.is_public

    )





# Get all user playlists

@app.get("/api/playlists")

async def get_my_playlists(current_user: dict = Depends(get_current_user)):

    return await playlist_service.get_user_playlists(current_user["user_id"])


# ==============================================================
# Website Knowledge Base & Vector Search (RAG) Endpoints
# ==============================================================
@app.get("/api/knowledge/search")
async def search_website_knowledge(query: str, top_k: int = 3):
    """
    Search the website's vector knowledge base using semantic cosine similarity.
    Returns the top-k most relevant platform knowledge chunks.
    """
    if not query or not query.strip():
        return {"query": query, "results": []}

    matches = knowledge_base.retrieve(query, top_k=top_k, min_similarity=0.05)
    formatted = [
        {
            "id": chunk["id"],
            "title": chunk["title"],
            "category": chunk.get("category", "general"),
            "content": chunk["content"],
            "score": round(score, 4),
        }
        for chunk, score in matches
    ]
    return {
        "query": query,
        "total_matches": len(formatted),
        "results": formatted
    }

@app.post("/api/knowledge/reindex")
async def reindex_website_knowledge():
    """Rebuilds the vector index from website knowledge documents"""
    knowledge_base._initialize()
    return {"status": "success", "total_chunks": len(knowledge_base.chunks)}


# Direct Voice Database Search (Matches songs inside all user/database playlists)
@app.get("/api/voice/search-database")
async def voice_search_database(
    query: str,
    current_user: Optional[dict] = Depends(get_optional_user)
):
    if not query or not query.strip():
        return {"found": False, "song": None}

    import re

    def _normalize(text: str) -> str:
        if not text:
            return ""
        t = text.lower()
        t = re.sub(r'[|()\[\]{}\-_/\:;"\'.,!@#$%^&*~`]', ' ', t)
        t = re.sub(r'\b(official video|official audio|lyrics|lyric video|music video|remix|hd|4k|feat|ft)\b', ' ', t, flags=re.I)
        t = re.sub(r'\b(song|track|music|audio|tune)\b', ' ', t, flags=re.I)
        return re.sub(r'\s+', ' ', t).strip()

    def _match_song(s_name: str, s_artist: str, q: str) -> bool:
        norm_s = _normalize(s_name)
        norm_q = _normalize(q)
        norm_artist = _normalize(s_artist)
        if not norm_s or not norm_q:
            return False
        if norm_s == norm_q or norm_q in norm_s or norm_s in norm_q:
            return True
        s_words = set(norm_s.split())
        q_words = set(norm_q.split())
        if q_words and q_words.issubset(s_words):
            return True
        if norm_artist and (norm_artist in norm_q or norm_q in norm_artist):
            return True
        return False

    # 1. Search in local JSON playlists store
    local_playlists = _load_json_store('playlists.json', {})
    if isinstance(local_playlists, dict):
        user_id = current_user.get("user_id") if current_user else None
        if user_id and user_id in local_playlists:
            for pl in local_playlists[user_id]:
                if isinstance(pl, dict):
                    for s in pl.get("songs", []):
                        if _match_song(s.get("name", ""), s.get("artist", ""), query):
                            return {"found": True, "song": s, "playlist": pl.get("name", "My Playlist")}

        for uid, pl_list in local_playlists.items():
            if isinstance(pl_list, list):
                for pl in pl_list:
                    if isinstance(pl, dict):
                        for s in pl.get("songs", []):
                            if _match_song(s.get("name", ""), s.get("artist", ""), query):
                                return {"found": True, "song": s, "playlist": pl.get("name", "Playlist")}

    # 2. Search in MongoDB if available
    try:
        database = get_database()
        if database is not None:
            cursor = database.playlists.find({"songs": {"$exists": True, "$ne": []}})
            async for pl in cursor:
                for s in pl.get("songs", []):
                    if _match_song(s.get("name", ""), s.get("artist", ""), query):
                        return {"found": True, "song": s, "playlist": pl.get("name", "Playlist")}
    except Exception:
        pass

    return {"found": False, "song": None}





# Get playlist by name for chatbot

@app.get("/api/playlists/by-name/{playlist_name}")

async def get_playlist_by_name(

    playlist_name: str,

    current_user: dict = Depends(get_current_user)

):

    """Get playlist by name (case-insensitive) for chatbot use"""

    database = get_database()

    if database is None:

        raise HTTPException(status_code=503, detail="Database not available")

    

    # Case-insensitive search

    playlist = await database.playlists.find_one({

        "user_id": current_user["user_id"],

        "name": {"$regex": f"^{playlist_name}$", "$options": "i"}

    })

    

    if not playlist:

        raise HTTPException(status_code=404, detail=f"Playlist '{playlist_name}' not found")

    

    playlist["id"] = str(playlist["_id"])

    del playlist["_id"]

    

    return playlist





# Get specific playlist

@app.get("/api/playlists/{playlist_id}")

async def get_playlist(

    playlist_id: str,

    current_user: dict = Depends(get_current_user)

):

    return await playlist_service.get_playlist(playlist_id, current_user["user_id"])





# Update playlist

@app.put("/api/playlists/{playlist_id}")

async def update_playlist(

    playlist_id: str,

    playlist_data: PlaylistUpdateAuth,

    current_user: dict = Depends(get_current_user)

):

    update_data = {k: v for k, v in playlist_data.dict().items() if v is not None}

    if "songs" in update_data:

        update_data["songs"] = [song.dict() for song in update_data["songs"]]

    return await playlist_service.update_playlist(playlist_id, current_user["user_id"], update_data)





# Delete playlist

@app.delete("/api/playlists/{playlist_id}")

async def delete_playlist(

    playlist_id: str,

    current_user: dict = Depends(get_current_user)

):

    return await playlist_service.delete_playlist(playlist_id, current_user["user_id"])





# Add song to playlist

@app.post("/api/playlists/{playlist_id}/songs")

async def add_song_to_playlist(

    playlist_id: str,

    song_data: AddSongToPlaylist,

    current_user: dict = Depends(get_current_user)

):

    return await playlist_service.add_song_to_playlist(playlist_id, current_user["user_id"], song_data.song)





# Remove song from playlist

@app.delete("/api/playlists/{playlist_id}/songs/{song_id}")

async def remove_song_from_playlist(

    playlist_id: str,

    song_id: str,

    current_user: dict = Depends(get_current_user)

):

    return await playlist_service.remove_song_from_playlist(playlist_id, current_user["user_id"], song_id)







# ===========================================================

#  USER FAVORITE TRACKS (UP TO 5, DATABASE-BACKED)

# ===========================================================

from pydantic import BaseModel



class FavoriteTrack(BaseModel):

    id: str

    name: str

    artist: str

    image: Optional[str] = None

    youtube_id: Optional[str] = None

    duration: Optional[int] = None

    mood_match: Optional[str] = "Favorite"



class FavoriteTracksPayload(BaseModel):

    favorites: list[FavoriteTrack]

    mood: Optional[str] = None



@app.get("/api/user/favorites")

async def get_user_favorites(mood: Optional[str] = None, current_user: Optional[dict] = Depends(get_optional_user)):

    user_id = current_user["user_id"] if current_user else "default"

    clean_mood = mood.lower().strip() if mood else None

    database = get_database()

    if database is not None:

        try:

            doc = await database.user_favorites.find_one({"user_id": user_id})

            if doc:

                by_mood = doc.get("favorites_by_mood", {})

                if clean_mood and clean_mood in by_mood:

                    return {"favorites": by_mood[clean_mood], "favorites_by_mood": by_mood, "mood": clean_mood, "source": "database"}

                if "favorites" in doc:

                    return {"favorites": doc["favorites"], "favorites_by_mood": by_mood, "source": "database"}

        except Exception as e:

            print(f"DB load favorites error: {e}")

    user_moods = user_favorites_by_mood_db.get(user_id, {})

    if clean_mood and clean_mood in user_moods:

        return {"favorites": user_moods[clean_mood], "favorites_by_mood": user_moods, "mood": clean_mood, "source": "memory"}

    return {"favorites": user_favorites_db.get(user_id, []), "favorites_by_mood": user_moods, "source": "memory"}



@app.post("/api/user/favorites")

async def save_user_favorites(

    payload: FavoriteTracksPayload,

    current_user: Optional[dict] = Depends(get_optional_user)

):

    user_id = current_user["user_id"] if current_user else "default"

    favs = payload.favorites[:5]

    clean_mood = payload.mood.lower().strip() if payload.mood else None

    resolved_favs = []

    for f in favs:

        d = f.dict()

        if not d.get("image") or "unsplash" in d.get("image", ""):

            art = artwork_service.get_track_artwork(d["name"], d["artist"])

            if art:

                d["image"] = art

        if not d.get("mood_match"):

            d["mood_match"] = artwork_service.infer_mood(d["name"], d["artist"])

        resolved_favs.append(d)



    user_favorites_db[user_id] = resolved_favs
    _save_json_store('favorites.json', dict(user_favorites_db))

    if clean_mood:

        if user_id not in user_favorites_by_mood_db:

            user_favorites_by_mood_db[user_id] = {}

        user_favorites_by_mood_db[user_id][clean_mood] = resolved_favs



    database = get_database()

    saved_to_db = False

    if database is not None:

        try:

            update_dict = {

                "user_id": user_id,

                "favorites": resolved_favs,

                "updated_at": datetime.utcnow().isoformat()

            }

            if clean_mood:

                update_dict[f"favorites_by_mood.{clean_mood}"] = resolved_favs

            await database.user_favorites.update_one(

                {"user_id": user_id},

                {"$set": update_dict},

                upsert=True

            )

            saved_to_db = True

        except Exception as e:

            print(f"DB save favorites error: {e}")



    return {

        "message": "Favorites saved successfully",

        "favorites": resolved_favs,

        "mood": clean_mood,

        "saved_to_db": saved_to_db

    }



@app.delete("/api/user/favorites/{song_id}")

async def delete_user_favorite(

    song_id: str,

    current_user: Optional[dict] = Depends(get_optional_user)

):

    user_id = current_user["user_id"] if current_user else "default"

    user_favorites_db[user_id] = [

        s for s in user_favorites_db[user_id] if s.get("id") != song_id

    ]

    database = get_database()

    if database is not None:

        try:

            await database.user_favorites.update_one(

                {"user_id": user_id},

                {"$set": {"favorites": user_favorites_db[user_id]}}

            )

        except Exception as e:

            print(f"DB delete favorite error: {e}")

    return {"message": "Track removed from favorites", "favorites": user_favorites_db[user_id]}



@app.get("/api/search-tracks")

async def search_tracks_endpoint(q: str = "", title: Optional[str] = None, artist: Optional[str] = None, limit: int = 8):

    search_query = q or ""

    if title:

        search_query = title

    filter_artist = artist or ""

    tracks = await asyncio.to_thread(artwork_service.search_tracks, search_query, limit=limit, filter_artist=filter_artist)

    return {"tracks": tracks}



@app.get("/api/track-artwork")

async def get_track_artwork_endpoint(name: str, artist: str = ""):

    img = await asyncio.to_thread(artwork_service.get_track_artwork, name, artist)

    return {"image": img}



# ===========================================================

#  HEALTH & ROOT

# ===========================================================

@app.get("/health")

async def health():

    return {"status": "healthy", "version": "3.3-enhanced"}





@app.get("/")

async def root():

    return {

        "app": "MoodTunes AI",

        "version": "3.3-enhanced",

        "message": "Running successfully!"

    }





# ===========================================================

#  RUN SERVER

# ===========================================================

if __name__ == "__main__":
    import multiprocessing
    multiprocessing.freeze_support()
    import uvicorn
    import argparse

    parser = argparse.ArgumentParser(description="MoodTunes AI Multi-Worker Server")
    parser.add_argument("--workers", "-w", type=int, default=None, help="Number of worker processes for multiprocessing")
    parser.add_argument("--dev", action="store_true", help="Run in single-worker auto-reload development mode")
    parser.add_argument("--port", "-p", type=int, default=Config.PORT, help="Server port (default: 8000)")
    parser.add_argument("--host", type=str, default=Config.HOST, help="Server host (default: 0.0.0.0)")
    args = parser.parse_args()

    num_workers = args.workers if args.workers is not None else (1 if args.dev else Config.WORKERS)
    is_reload = args.dev or (Config.RELOAD and num_workers == 1)

    print("\n" + "=" * 72)
    print("🎵 MoodTunes AI - High-Concurrency Music Recommendation System")
    print(f"⚡ Mode: {'Development (Single-Worker with Hot-Reload)' if is_reload else f'Multi-User Multiprocessing ({num_workers} Workers)'}")
    print(f"💻 CPU Cores: {Config.CPU_CORES} | Active Workers: {num_workers}")
    print(f"🌐 Server Address: http://{'127.0.0.1' if args.host == '0.0.0.0' else args.host}:{args.port}")
    print("=" * 72 + "\n")

    if is_reload:
        uvicorn.run("main:app", host=args.host, port=args.port, reload=True)
    else:
        uvicorn.run("main:app", host=args.host, port=args.port, workers=num_workers)

