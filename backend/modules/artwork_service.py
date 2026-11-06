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


CURATED_SEARCH_HITS = [
    {
        "id": "curated-boom-shack",
        "name": "Boom Shack-A-Lak",
        "artist": "Apache Indian",
        "image": "https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/4a/6a/c8/4a6ac842-1e7a-3602-0e31-8c43093202eb/00602537554900.rgb.jpg/600x600bb.jpg",
        "duration": 272,
        "youtube_id": "kZzBd41NuZw",
        "mood_match": "Favorite"
    },
    {
        "id": "curated-love-dose",
        "name": "Love Dose",
        "artist": "Yo Yo Honey Singh",
        "image": "https://is1-ssl.mzstatic.com/image/thumb/Music114/v4/35/6b/c4/356bc4b5-fc6e-d09f-4315-05566cf2c208/886444857444.jpg/600x600bb.jpg",
        "duration": 228,
        "youtube_id": "TvngY4unyL4",
        "mood_match": "Favorite"
    },
    {
        "id": "curated-desi-kalakaar",
        "name": "Desi Kalakaar",
        "artist": "Yo Yo Honey Singh",
        "image": "https://is1-ssl.mzstatic.com/image/thumb/Music114/v4/35/6b/c4/356bc4b5-fc6e-d09f-4315-05566cf2c208/886444857444.jpg/600x600bb.jpg",
        "duration": 259,
        "youtube_id": "KhnvxXffwio",
        "mood_match": "Favorite"
    },
    {
        "id": "curated-blue-eyes",
        "name": "Blue Eyes",
        "artist": "Yo Yo Honey Singh",
        "image": "https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/bc/ef/bd/bcefbd60-4ddf-68e1-55ec-ee5188f6236b/886444315722.jpg/600x600bb.jpg",
        "duration": 220,
        "youtube_id": "NbyHNASFi6U",
        "mood_match": "Favorite"
    },
    {
        "id": "curated-kesariya",
        "name": "Kesariya",
        "artist": "Arijit Singh",
        "image": "https://is1-ssl.mzstatic.com/image/thumb/Music112/v4/9f/13/ca/9f13ca3b-e533-03e0-f19a-f0aaa774581d/196589311191.jpg/600x600bb.jpg",
        "duration": 268,
        "youtube_id": "BddP6PYo2gs",
        "mood_match": "Favorite"
    },
    {
        "id": "curated-raataan",
        "name": "Raataan Lambiyan",
        "artist": "Jubin Nautiyal",
        "image": "https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/61/65/ae/6165aee9-8bb9-0bd4-02b0-5d0f1e6257a3/886449510238.jpg/600x600bb.jpg",
        "duration": 230,
        "youtube_id": "gvyUuxdRdR4",
        "mood_match": "Favorite"
    },
    {
        "id": "curated-ilahi",
        "name": "Ilahi",
        "artist": "Arijit Singh",
        "image": "https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/62/d6/74/62d67432-0670-631f-db6a-d4bac3adae4b/8902894353328_cover.jpg/600x600bb.jpg",
        "duration": 228,
        "youtube_id": "fdubeMFwuGs",
        "mood_match": "Favorite"
    },
    {
        "id": "curated-apna-bana-le",
        "name": "Apna Bana Le",
        "artist": "Arijit Singh",
        "image": "https://is1-ssl.mzstatic.com/image/thumb/Music112/v4/83/87/49/838749a1-cb90-7cb5-eb68-45da026da689/190296417242.jpg/600x600bb.jpg",
        "duration": 261,
        "youtube_id": "ElZfdU54Cp8",
        "mood_match": "Favorite"
    }
]

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

    def search_tracks(self, query: str, limit: int = 8, filter_artist: str = "") -> List[Dict]:
        """Search tracks with artwork and details for user customization with artist filtering."""
        if not query and not filter_artist:
            return []
        
        tracks = []
        try:
            # Build search term from query and artist
            term_parts = []
            if query:
                term_parts.append(query.strip())
            if filter_artist:
                term_parts.append(filter_artist.strip())
            term = " ".join(term_parts)

            resp = requests.get(
                "https://itunes.apple.com/search",
                params={"term": term, "entity": "song", "limit": max(limit * 2, 12)},
                timeout=3.5
            )
            if resp.status_code == 200:
                from .music_player import music_player
                results = resp.json().get("results", [])

                # If filter_artist is provided, prioritize results where artist name matches
                if filter_artist:
                    fa_lower = filter_artist.lower().strip()
                    results.sort(
                        key=lambda x: (
                            0 if fa_lower in x.get("artistName", "").lower() else 1
                        )
                    )

                for item in results[:limit]:
                    raw_art = item.get("artworkUrl100", "")
                    high_res = raw_art.replace("100x100bb", "600x600bb") if raw_art else None
                    duration_ms = item.get("trackTimeMillis", 210000)
                    t_name = item.get("trackName", "")
                    t_artist = item.get("artistName", "")
                    
                    # Instant zero-blocking check from popular song map or cache
                    yt_id = None
                    full_title = f"{t_artist} {t_name}".lower()
                    for song_k, vid in music_player.POPULAR_SONG_MAP.items():
                        if song_k in full_title or song_k in t_name.lower():
                            yt_id = vid
                            break
                    if not yt_id:
                        with music_player._lock:
                            yt_id = music_player.cache.get(f"{t_artist} {t_name}") or music_player.cache.get(full_title)

                    tracks.append({
                        "id": f"itunes-{item.get('trackId')}",
                        "name": t_name,
                        "artist": t_artist,
                        "image": high_res or "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&auto=format&fit=crop&q=80",
                        "duration": int(duration_ms / 1000),
                        "preview_url": item.get("previewUrl"),
                        "youtube_id": yt_id,
                        "mood_match": "Favorite",
                    })
        except Exception:
            pass

        # Resilient fallback or supplement if tracks is empty
        if not tracks:
            combined_q = f"{query} {filter_artist}".lower().strip()
            q_clean = query.lower().strip()
            a_clean = filter_artist.lower().strip()
            for hit in CURATED_SEARCH_HITS:
                h_name = hit["name"].lower()
                h_artist = hit["artist"].lower()
                match = False
                if q_clean and (q_clean in h_name or h_name in q_clean or q_clean in f"{h_name} {h_artist}"):
                    match = True
                if a_clean and (a_clean in h_artist or h_artist in a_clean):
                    match = True
                if match and hit not in tracks:
                    tracks.append(hit)

        return tracks[:limit]


artwork_service = ArtworkService()
