"""
"Listen Together" Sync Room (Party Mode) WebSocket Hub
Maintains synchronized audio playback, host controls, real-time participant presence,
and live floating emoji reaction cascades over WebSockets.
"""
from typing import Dict, List, Optional
import json
import asyncio
from fastapi import WebSocket

class SyncRoomManager:
    def __init__(self):
        # room_id -> {"host_id": str, "state": dict, "participants": dict, "connections": list}
        self.rooms: Dict[str, Dict] = {}

    def get_or_create_room(self, room_id: str, host_id: str = None) -> Dict:
        if room_id not in self.rooms:
            self.rooms[room_id] = {
                "room_id": room_id,
                "host_id": host_id,
                "state": {
                    "currentSong": None,
                    "isPlaying": False,
                    "currentTime": 0,
                    "activeMood": "happy",
                    "updatedAt": 0,
                },
                "participants": {}, # client_id -> {"id": str, "name": str, "avatar": str, "is_host": bool}
                "connections": []   # list of WebSocket objects
            }
        return self.rooms[room_id]

    async def connect_client(self, room_id: str, client_id: str, websocket: WebSocket, name: str = "Guest", avatar: str = "🎵"):
        await websocket.accept()
        room = self.get_or_create_room(room_id, host_id=client_id)

        # First connected user is host if none assigned
        is_host = room["host_id"] is None or room["host_id"] == client_id
        if is_host:
            room["host_id"] = client_id

        room["connections"].append(websocket)
        room["participants"][client_id] = {
            "id": client_id,
            "name": name,
            "avatar": avatar,
            "is_host": is_host
        }

        # Send current room state & participant list to the newly connected user
        init_payload = {
            "type": "ROOM_STATE_INIT",
            "room_id": room_id,
            "is_host": is_host,
            "host_id": room["host_id"],
            "state": room["state"],
            "participants": list(room["participants"].values())
        }
        await websocket.send_text(json.dumps(init_payload))

        # Broadcast participant join to everyone in room
        join_broadcast = {
            "type": "USER_JOINED",
            "user": room["participants"][client_id],
            "participants": list(room["participants"].values())
        }
        await self.broadcast(room_id, join_broadcast, exclude=websocket)

    async def disconnect_client(self, room_id: str, client_id: str, websocket: WebSocket):
        if room_id in self.rooms:
            room = self.rooms[room_id]
            if websocket in room["connections"]:
                room["connections"].remove(websocket)

            leaving_user = room["participants"].pop(client_id, None)

            # Reassign host if host left
            if room["host_id"] == client_id:
                if room["participants"]:
                    next_host_id = list(room["participants"].keys())[0]
                    room["host_id"] = next_host_id
                    room["participants"][next_host_id]["is_host"] = True
                else:
                    room["host_id"] = None

            # Broadcast departure
            if leaving_user:
                leave_broadcast = {
                    "type": "USER_LEFT",
                    "user_id": client_id,
                    "host_id": room["host_id"],
                    "participants": list(room["participants"].values())
                }
                await self.broadcast(room_id, leave_broadcast)

            # Clean up empty room
            if not room["connections"]:
                del self.rooms[room_id]

    async def broadcast(self, room_id: str, message: dict, exclude: Optional[WebSocket] = None):
        if room_id not in self.rooms:
            return

        room = self.rooms[room_id]
        data_str = json.dumps(message)
        dead_connections = []

        for ws in room["connections"]:
            if ws != exclude:
                try:
                    await ws.send_text(data_str)
                except Exception:
                    dead_connections.append(ws)

        for ws in dead_connections:
            if ws in room["connections"]:
                room["connections"].remove(ws)

    async def handle_message(self, room_id: str, client_id: str, message: dict, websocket: WebSocket):
        if room_id not in self.rooms:
            return

        room = self.rooms[room_id]
        msg_type = message.get("type")

        if msg_type == "SYNC_PLAYBACK":
            # Play / Pause / Seek / Track change broadcast by host or peer
            payload = message.get("payload", {})
            room["state"]["currentSong"] = payload.get("currentSong", room["state"]["currentSong"])
            room["state"]["isPlaying"] = payload.get("isPlaying", room["state"]["isPlaying"])
            room["state"]["currentTime"] = payload.get("currentTime", room["state"]["currentTime"])
            room["state"]["activeMood"] = payload.get("activeMood", room["state"]["activeMood"])

            sync_broadcast = {
                "type": "SYNC_PLAYBACK",
                "payload": room["state"],
                "sender_id": client_id
            }
            await self.broadcast(room_id, sync_broadcast, exclude=websocket)

        elif msg_type == "FLOAT_REACTION":
            # Floating live reaction emoji (❤️, 🔥, 💃, 🎵, 🚀, ✨)
            reaction_broadcast = {
                "type": "FLOAT_REACTION",
                "emoji": message.get("emoji", "❤️"),
                "sender_id": client_id,
                "sender_name": room["participants"].get(client_id, {}).get("name", "Friend"),
            }
            await self.broadcast(room_id, reaction_broadcast)

sync_room_hub = SyncRoomManager()
