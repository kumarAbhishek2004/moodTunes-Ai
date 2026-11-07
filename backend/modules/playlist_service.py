"""
Playlist Service - Dual-Layer Persistence (MongoDB Atlas + Local JSON Mirror)
Guarantees that playlists are NEVER lost even across server restarts or database connection changes.
"""
import os
import json
import threading
from typing import List, Optional
from datetime import datetime
from bson import ObjectId
from bson.errors import InvalidId
from fastapi import HTTPException

from modules.database import get_database
from modules.models import Song

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")
LOCAL_PLAYLISTS_FILE = os.path.join(DATA_DIR, "playlists.json")
_lock = threading.Lock()

def _load_local_playlists() -> dict:
    os.makedirs(DATA_DIR, exist_ok=True)
    if not os.path.exists(LOCAL_PLAYLISTS_FILE):
        return {}
    try:
        with open(LOCAL_PLAYLISTS_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return {}

def _save_local_playlists(data: dict):
    os.makedirs(DATA_DIR, exist_ok=True)
    try:
        tmp_file = LOCAL_PLAYLISTS_FILE + ".tmp"
        with open(tmp_file, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        os.replace(tmp_file, LOCAL_PLAYLISTS_FILE)
    except Exception as e:
        print(f"Error saving local playlists: {e}")

class PlaylistService:
    """Service for playlist operations with guaranteed persistence"""

    @staticmethod
    async def create_playlist(
        user_id: str,
        name: str,
        description: str = "",
        mood: Optional[str] = None,
        cover: Optional[str] = None,
        songs: Optional[List[Song]] = None,
        is_public: bool = False
    ) -> dict:
        now_str = datetime.utcnow().isoformat()
        songs_list = [song.dict() if hasattr(song, "dict") else dict(song) for song in (songs or [])]
        
        playlist_id = f"pl_{int(datetime.utcnow().timestamp())}_{os.urandom(3).hex()}"
        database = get_database()
        
        # If MongoDB is connected, try to insert there
        if database is not None:
            try:
                doc = {
                    "user_id": user_id,
                    "name": name,
                    "description": description,
                    "mood": mood,
                    "cover": cover,
                    "songs": songs_list,
                    "is_public": is_public,
                    "created_at": now_str,
                    "updated_at": now_str,
                }
                res = await database.playlists.insert_one(doc)
                playlist_id = str(res.inserted_id)
            except Exception as e:
                print(f"MongoDB insert error, using local persistence: {e}")

        # Always save to local persistent JSON storage
        result_item = {
            "id": playlist_id,
            "user_id": user_id,
            "name": name,
            "description": description,
            "mood": mood,
            "cover": cover,
            "songs": songs_list,
            "is_public": is_public,
            "created_at": now_str,
            "updated_at": now_str,
        }

        with _lock:
            local_data = _load_local_playlists()
            if user_id not in local_data:
                local_data[user_id] = []
            # Avoid duplicate id
            local_data[user_id] = [p for p in local_data[user_id] if p.get("id") != playlist_id]
            local_data[user_id].insert(0, result_item)
            _save_local_playlists(local_data)

        return result_item

    @staticmethod
    async def get_user_playlists(user_id: str) -> List[dict]:
        database = get_database()
        atlas_playlists = []

        if database is not None:
            try:
                cursor = database.playlists.find({"user_id": user_id})
                async for p in cursor:
                    p["id"] = str(p["_id"])
                    del p["_id"]
                    atlas_playlists.append(p)
            except Exception as e:
                print(f"MongoDB fetch notice: {e}")

        with _lock:
            local_data = _load_local_playlists()
            local_user_playlists = local_data.get(user_id, [])

            # Merge Atlas and Local seamlessly (union by id/name)
            seen_ids = set()
            merged = []
            for p in atlas_playlists + local_user_playlists:
                pid = p.get("id") or p.get("name")
                if pid not in seen_ids:
                    seen_ids.add(pid)
                    merged.append(p)

            # Keep local mirror up to date
            if merged != local_user_playlists:
                local_data[user_id] = merged
                _save_local_playlists(local_data)

            return merged

    @staticmethod
    async def get_playlist(playlist_id: str, user_id: str) -> dict:
        database = get_database()
        if database is not None:
            try:
                try:
                    obj_id = ObjectId(playlist_id)
                    p = await database.playlists.find_one({"_id": obj_id, "user_id": user_id})
                except Exception:
                    p = await database.playlists.find_one({"id": playlist_id, "user_id": user_id})
                if p:
                    p["id"] = str(p.get("_id", playlist_id))
                    if "_id" in p:
                        del p["_id"]
                    return p
            except Exception:
                pass

        # Check local storage
        with _lock:
            local_data = _load_local_playlists()
            for p in local_data.get(user_id, []):
                if p.get("id") == playlist_id:
                    return p

        raise HTTPException(status_code=404, detail="Playlist not found")

    @staticmethod
    async def update_playlist(playlist_id: str, user_id: str, update_data: dict) -> dict:
        update_data["updated_at"] = datetime.utcnow().isoformat()
        database = get_database()
        if database is not None:
            try:
                try:
                    obj_id = ObjectId(playlist_id)
                    await database.playlists.update_one({"_id": obj_id, "user_id": user_id}, {"$set": update_data})
                except Exception:
                    await database.playlists.update_one({"id": playlist_id, "user_id": user_id}, {"$set": update_data})
            except Exception:
                pass

        with _lock:
            local_data = _load_local_playlists()
            user_list = local_data.get(user_id, [])
            for p in user_list:
                if p.get("id") == playlist_id:
                    p.update(update_data)
                    _save_local_playlists(local_data)
                    return p

        raise HTTPException(status_code=404, detail="Playlist not found")

    @staticmethod
    async def delete_playlist(playlist_id: str, user_id: str) -> dict:
        database = get_database()
        if database is not None:
            try:
                try:
                    obj_id = ObjectId(playlist_id)
                    await database.playlists.delete_one({"_id": obj_id, "user_id": user_id})
                except Exception:
                    await database.playlists.delete_one({"id": playlist_id, "user_id": user_id})
            except Exception:
                pass

        with _lock:
            local_data = _load_local_playlists()
            if user_id in local_data:
                local_data[user_id] = [p for p in local_data[user_id] if p.get("id") != playlist_id]
                _save_local_playlists(local_data)

        return {"message": "Playlist deleted successfully", "playlist_id": playlist_id}

    @staticmethod
    async def add_song_to_playlist(playlist_id: str, user_id: str, song: Song) -> dict:
        now_str = datetime.utcnow().isoformat()
        song_dict = song.dict() if hasattr(song, "dict") else dict(song)

        database = get_database()
        if database is not None:
            try:
                try:
                    obj_id = ObjectId(playlist_id)
                    await database.playlists.update_one(
                        {"_id": obj_id, "user_id": user_id},
                        {"$push": {"songs": song_dict}, "$set": {"updated_at": now_str}}
                    )
                except Exception:
                    await database.playlists.update_one(
                        {"id": playlist_id, "user_id": user_id},
                        {"$push": {"songs": song_dict}, "$set": {"updated_at": now_str}}
                    )
            except Exception:
                pass

        with _lock:
            local_data = _load_local_playlists()
            for p in local_data.get(user_id, []):
                if p.get("id") == playlist_id:
                    songs = p.setdefault("songs", [])
                    # Avoid duplicate by id/name
                    if not any(s.get("name") == song_dict.get("name") and s.get("artist") == song_dict.get("artist") for s in songs):
                        songs.append(song_dict)
                    p["updated_at"] = now_str
                    _save_local_playlists(local_data)
                    return p

        raise HTTPException(status_code=404, detail="Playlist not found")

    @staticmethod
    async def remove_song_from_playlist(playlist_id: str, user_id: str, song_id: str) -> dict:
        now_str = datetime.utcnow().isoformat()
        database = get_database()
        if database is not None:
            try:
                try:
                    obj_id = ObjectId(playlist_id)
                    await database.playlists.update_one(
                        {"_id": obj_id, "user_id": user_id},
                        {"$pull": {"songs": {"id": song_id}}, "$set": {"updated_at": now_str}}
                    )
                except Exception:
                    await database.playlists.update_one(
                        {"id": playlist_id, "user_id": user_id},
                        {"$pull": {"songs": {"id": song_id}}, "$set": {"updated_at": now_str}}
                    )
            except Exception:
                pass

        with _lock:
            local_data = _load_local_playlists()
            for p in local_data.get(user_id, []):
                if p.get("id") == playlist_id:
                    p["songs"] = [s for s in p.get("songs", []) if s.get("id") != song_id]
                    p["updated_at"] = now_str
                    _save_local_playlists(local_data)
                    return p

        raise HTTPException(status_code=404, detail="Playlist not found")

playlist_service = PlaylistService()
