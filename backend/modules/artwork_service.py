"""
modules/artwork_service.py
High-definition track artwork and metadata resolver using Spotify and Apple Music APIs.
"""
import os
import base64
import time
import requests
from typing import Optional, List, Dict
from dotenv import load_dotenv

load_dotenv()

class ArtworkService:
    def __init__(self):
        self.spotify_client_id = os.getenv("SPOTIFY_CLIENT_ID", "")
        self.spotify_client_secret = os.getenv("SPOTIFY_CLIENT_SECRET", "")
        self.spotify_token = None
        self.spotify_token_expires = 0
        self.cache: Dict[str, str] = {}
        
        # Prepopulate popular Indian & Global hits with verified official album art
        self.cache.update({
            "kesariya:arijit singh": "https://is1-ssl.mzstatic.com/image/thumb/Music112/v4/9f/13/ca/9f13ca3b-e533-03e0-f19a-f0aaa774581d/196589311191.jpg/600x600bb.jpg",
            "raataan lambiyan:jubin nautiyal": "https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/61/65/ae/6165aee9-8bb9-0bd4-02b0-5d0f1e6257a3/886449510238.jpg/600x600bb.jpg",
            "ilahi:arijit singh": "https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/62/d6/74/62d67432-0670-631f-db6a-d4bac3adae4b/8902894353328_cover.jpg/600x600bb.jpg",
            "apna bana le:arijit singh": "https://is1-ssl.mzstatic.com/image/thumb/Music122/v4/21/cf/34/21cf34f4-cb28-863a-bbdb-8ef839250b7d/8902894362177_cover.jpg/600x600bb.jpg",
            "channa mereya:arijit singh": "https://is1-ssl.mzstatic.com/image/thumb/Music122/v4/85/3e/26/853e263d-4c3e-f1cb-1ea9-c56eb0b3684a/8902894356879_cover.jpg/600x600bb.jpg",
            "tum hi ho:arijit singh": "https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/7e/8e/31/7e8e31be-ea1e-fc36-dc4c-70e676575127/8902894354905_cover.jpg/600x600bb.jpg",
            "shayad:arijit singh": "https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/95/9b/ec/959bec98-a15b-9d22-1d58-cfb2a6f238d2/886448268482.jpg/600x600bb.jpg",
            "agar tum saath ho:alka yagnik": "https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/05/9a/c0/059ac0c3-fe80-6060-da82-706f9d2d8819/8902894355520_cover.jpg/600x600bb.jpg",
            "holocene:bon iver": "https://is1-ssl.mzstatic.com/image/thumb/Music114/v4/37/10/86/371086df-ef86-1215-6804-06c8861e7a4f/656605130061.jpg/600x600bb.jpg",
        })

    def _get_spotify_token(self) -> Optional[str]:
        if self.spotify_token and time.time() < self.spotify_token_expires:
            return self.spotify_token
        
        if not self.spotify_client_id or not self.spotify_client_secret:
            return None
        
        try:
            auth_str = f"{self.spotify_client_id}:{self.spotify_client_secret}"
            auth_b64 = base64.b64encode(auth_str.encode()).decode()
            resp = requests.post(
                "https://accounts.spotify.com/api/token",
                data={"grant_type": "client_credentials"},
                headers={"Authorization": f"Basic {auth_b64}"},
                timeout=4
            )
            if resp.status_code == 200:
                data = resp.json()
                self.spotify_token = data.get("access_token")
                self.spotify_token_expires = time.time() + data.get("expires_in", 3600) - 60
                return self.spotify_token
        except Exception as e:
            pass
        return None

    def get_track_artwork(self, track_name: str, artist: str = "") -> Optional[str]:
        """Fetch high-res album cover URL using Spotify or Apple Music."""
        if not track_name:
            return None
        
        cache_key = f"{track_name.strip().lower()}:{artist.strip().lower()}"
        if cache_key in self.cache:
            return self.cache[cache_key]
        
        # 1. Try Spotify
        token = self._get_spotify_token()
        if token:
            try:
                q = f"{track_name} {artist}".strip()
                resp = requests.get(
                    "https://api.spotify.com/v1/search",
                    params={"q": q, "type": "track", "limit": 1},
                    headers={"Authorization": f"Bearer {token}"},
                    timeout=3
                )
                if resp.status_code == 200:
                    items = resp.json().get("tracks", {}).get("items", [])
                    if items:
                        images = items[0].get("album", {}).get("images", [])
                        if images:
                            img_url = images[0].get("url")
                            self.cache[cache_key] = img_url
                            return img_url
            except Exception:
                pass

        # 2. Try iTunes / Apple Music (Fast, high-res, zero-auth fallback)
        try:
            term = f"{track_name} {artist}".strip()
            resp = requests.get(
                "https://itunes.apple.com/search",
                params={"term": term, "entity": "song", "limit": 1},
                timeout=4
            )
            if resp.status_code == 200:
                results = resp.json().get("results", [])
                if results:
                    raw_art = results[0].get("artworkUrl100", "")
                    if raw_art:
                        high_res_art = raw_art.replace("100x100bb", "600x600bb")
                        self.cache[cache_key] = high_res_art
                        return high_res_art
        except Exception:
            pass

        return None

    def search_tracks(self, query: str, limit: int = 5) -> List[Dict]:
        """Search tracks with artwork and details for user customization."""
        if not query:
            return []
        
        tracks = []
        try:
            resp = requests.get(
                "https://itunes.apple.com/search",
                params={"term": query, "entity": "song", "limit": limit},
                timeout=4
            )
            if resp.status_code == 200:
                for item in resp.json().get("results", []):
                    raw_art = item.get("artworkUrl100", "")
                    high_res = raw_art.replace("100x100bb", "600x600bb") if raw_art else None
                    duration_ms = item.get("trackTimeMillis", 210000)
                    
                    tracks.append({
                        "id": f"itunes-{item.get('trackId')}",
                        "name": item.get("trackName"),
                        "artist": item.get("artistName"),
                        "image": high_res or "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&auto=format&fit=crop&q=80",
                        "duration": int(duration_ms / 1000),
                        "preview_url": item.get("previewUrl"),
                        "mood_match": "Favorite",
                    })
        except Exception as e:
            pass
        return tracks

artwork_service = ArtworkService()
