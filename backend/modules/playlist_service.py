"""
Playlist Service - MongoDB CRUD operations
"""
from typing import List, Optional
from datetime import datetime
from bson import ObjectId
from bson.errors import InvalidId
from fastapi import HTTPException

from modules.database import get_database
from modules.models import Song


class PlaylistService:
    """Service for playlist operations"""

    @staticmethod
    async def create_playlist(
        user_id: str,
        name: str,
        description: str = "",
        mood: Optional[str] = None,
        songs: Optional[List[Song]] = None,
        is_public: bool = False
    ) -> dict:

        database = get_database()
        if database is None:
            raise HTTPException(status_code=503, detail="Database not available")

        songs = songs or []

        playlist_data = {
            "user_id": user_id,
            "name": name,
            "description": description,
            "mood": mood,
            "songs": [song.dict() for song in songs],
            "is_public": is_public,
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat(),
        }

        result = await database.playlists.insert_one(playlist_data)
        
        # Return without _id field
        return {
            "id": str(result.inserted_id),
            "user_id": user_id,
            "name": name,
            "description": description,
            "mood": mood,
            "songs": [song.dict() for song in songs],
            "is_public": is_public,
            "created_at": playlist_data["created_at"],
            "updated_at": playlist_data["updated_at"],
        }

    @staticmethod
    async def get_user_playlists(user_id: str) -> List[dict]:
        database = get_database()
        if database is None:
            raise HTTPException(status_code=503, detail="Database not available")

        playlists = []
        cursor = database.playlists.find({"user_id": user_id})
        async for playlist in cursor:
            playlist["id"] = str(playlist["_id"])
            del playlist["_id"]
            playlists.append(playlist)

        return playlists

    @staticmethod
    async def get_playlist(playlist_id: str, user_id: str) -> dict:
        database = get_database()
        if database is None:
            raise HTTPException(status_code=503, detail="Database not available")

        try:
            obj_id = ObjectId(playlist_id)
        except InvalidId:
            raise HTTPException(status_code=400, detail="Invalid playlist ID format")

        playlist = await database.playlists.find_one({"_id": obj_id, "user_id": user_id})
        if not playlist:
            raise HTTPException(status_code=404, detail="Playlist not found")

        playlist["id"] = str(playlist["_id"])
        del playlist["_id"]

        return playlist

    @staticmethod
    async def update_playlist(playlist_id: str, user_id: str, update_data: dict) -> dict:
        database = get_database()
        if database is None:
            raise HTTPException(status_code=503, detail="Database not available")

        try:
            obj_id = ObjectId(playlist_id)
        except InvalidId:
            raise HTTPException(status_code=400, detail="Invalid playlist ID format")

        update_data["updated_at"] = datetime.utcnow().isoformat()

        result = await database.playlists.update_one(
            {"_id": obj_id, "user_id": user_id},
            {"$set": update_data}
        )

        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Playlist not found")

        return await PlaylistService.get_playlist(playlist_id, user_id)

    @staticmethod
    async def delete_playlist(playlist_id: str, user_id: str) -> dict:
        database = get_database()
        if database is None:
            raise HTTPException(status_code=503, detail="Database not available")

        try:
            obj_id = ObjectId(playlist_id)
        except InvalidId:
            raise HTTPException(status_code=400, detail="Invalid playlist ID format")

        result = await database.playlists.delete_one({"_id": obj_id, "user_id": user_id})

        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Playlist not found")

        return {"message": "Playlist deleted successfully", "playlist_id": playlist_id}

    @staticmethod
    async def add_song_to_playlist(playlist_id: str, user_id: str, song: Song) -> dict:
        database = get_database()
        if database is None:
            raise HTTPException(status_code=503, detail="Database not available")

        try:
            obj_id = ObjectId(playlist_id)
        except InvalidId:
            raise HTTPException(status_code=400, detail="Invalid playlist ID format")

        result = await database.playlists.update_one(
            {"_id": obj_id, "user_id": user_id},
            {
                "$push": {"songs": song.dict()},
                "$set": {"updated_at": datetime.utcnow().isoformat()}
            }
        )

        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Playlist not found")

        return await PlaylistService.get_playlist(playlist_id, user_id)

    @staticmethod
    async def remove_song_from_playlist(playlist_id: str, user_id: str, song_id: str) -> dict:
        database = get_database()
        if database is None:
            raise HTTPException(status_code=503, detail="Database not available")

        try:
            obj_id = ObjectId(playlist_id)
        except InvalidId:
            raise HTTPException(status_code=400, detail="Invalid playlist ID format")

        result = await database.playlists.update_one(
            {"_id": obj_id, "user_id": user_id},
            {
                "$pull": {"songs": {"id": song_id}},
                "$set": {"updated_at": datetime.utcnow().isoformat()}
            }
        )

        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Playlist not found")

        return await PlaylistService.get_playlist(playlist_id, user_id)


playlist_service = PlaylistService()
