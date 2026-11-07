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
# Also explicitly load from backend/.env if present
env_backend = os.path.join(os.path.dirname(__file__), "..", ".env")
if os.path.exists(env_backend):
    load_dotenv(env_backend)


CURATED_SEARCH_HITS = [
{
        "id": "curated-boom-shack",
        "name": "Boom Shack-A-Lak",
        "artist": "Apache Indian",
        "image": "https://i.ytimg.com/vi/kZzBd41NuZw/hqdefault.jpg",
        "duration": 272,
        "youtube_id": "kZzBd41NuZw",
        "mood_match": "Favorite"
    },
    {
        "id": "curated-love-dose",
        "name": "Love Dose",
        "artist": "Yo Yo Honey Singh",
        "image": "https://i.ytimg.com/vi/TvngY4unyL4/hqdefault.jpg",
        "duration": 228,
        "youtube_id": "TvngY4unyL4",
        "mood_match": "Favorite"
    },
    {
        "id": "curated-desi-kalakaar",
        "name": "Desi Kalakaar",
        "artist": "Yo Yo Honey Singh",
        "image": "https://i.ytimg.com/vi/KhnvxXffwio/hqdefault.jpg",
        "duration": 259,
        "youtube_id": "KhnvxXffwio",
        "mood_match": "Favorite"
    },
    {
        "id": "curated-blue-eyes",
        "name": "Blue Eyes",
        "artist": "Yo Yo Honey Singh",
        "image": "https://i.ytimg.com/vi/NbyHNASFi6U/hqdefault.jpg",
        "duration": 220,
        "youtube_id": "NbyHNASFi6U",
        "mood_match": "Favorite"
    },
    {
        "id": "curated-kesariya",
        "name": "Kesariya",
        "artist": "Arijit Singh",
        "image": "https://i.ytimg.com/vi/BddP6PYo2gs/hqdefault.jpg",
        "duration": 268,
        "youtube_id": "BddP6PYo2gs",
        "mood_match": "Favorite"
    },
    {
        "id": "curated-raataan",
        "name": "Raataan Lambiyan",
        "artist": "Jubin Nautiyal",
        "image": "https://i.ytimg.com/vi/gvyUuxdRdR4/hqdefault.jpg",
        "duration": 230,
        "youtube_id": "gvyUuxdRdR4",
        "mood_match": "Favorite"
    },
    {
        "id": "curated-ilahi",
        "name": "Ilahi",
        "artist": "Arijit Singh",
        "image": "https://i.ytimg.com/vi/fdubeMFwuGs/hqdefault.jpg",
        "duration": 228,
        "youtube_id": "fdubeMFwuGs",
        "mood_match": "Favorite"
    },
    {
        "id": "curated-apna-bana-le",
        "name": "Apna Bana Le",
        "artist": "Arijit Singh",
        "image": "https://i.ytimg.com/vi/ElZfdU54Cp8/hqdefault.jpg",
        "duration": 261,
        "youtube_id": "ElZfdU54Cp8",
        "mood_match": "Favorite"
    },
    {
        "id": "curated-weightless",
        "name": "Weightless",
        "artist": "Marconi Union",
        "image": "https://i.ytimg.com/vi/UfcAVejslrU/hqdefault.jpg",
        "duration": 485,
        "youtube_id": "UfcAVejslrU",
        "detected_mood": "Calm",
        "mood_match": "Calm",
    },
    {
        "id": "curated-clair-de-lune",
        "name": "Clair de Lune",
        "artist": "Claude Debussy",
        "image": "https://i.ytimg.com/vi/WNcsUNKlAKw/hqdefault.jpg",
        "duration": 302,
        "youtube_id": "WNcsUNKlAKw",
        "detected_mood": "Calm",
        "mood_match": "Calm",
    },
    {
        "id": "curated-sunset-lover",
        "name": "Sunset Lover",
        "artist": "Petit Biscuit",
        "image": "https://i.ytimg.com/vi/wuCK-oiE3rA/hqdefault.jpg",
        "duration": 237,
        "youtube_id": "wuCK-oiE3rA",
        "detected_mood": "Calm",
        "mood_match": "Calm",
    },
    {
        "id": "curated-kun-faya-kun",
        "name": "Kun Faya Kun",
        "artist": "A.R. Rahman",
        "image": "https://i.ytimg.com/vi/T94PHkuydcw/hqdefault.jpg",
        "duration": 473,
        "youtube_id": "T94PHkuydcw",
        "detected_mood": "Calm",
        "mood_match": "Calm",
    },
    {
        "id": "curated-tujhe-kitna-chahein",
        "name": "Tujhe Kitna Chahein Aur",
        "artist": "Jubin Nautiyal",
        "image": "https://i.ytimg.com/vi/b_Kz60o0Yjc/hqdefault.jpg",
        "duration": 276,
        "youtube_id": "b_Kz60o0Yjc",
        "detected_mood": "Romantic",
        "mood_match": "Romantic",
    },
    {
        "id": "curated-tum-hi-ho",
        "name": "Tum Hi Ho",
        "artist": "Arijit Singh",
        "image": "https://i.ytimg.com/vi/Umqb9KENgmk/hqdefault.jpg",
        "duration": 262,
        "youtube_id": "Umqb9KENgmk",
        "detected_mood": "Romantic",
        "mood_match": "Romantic",
    },
    {
        "id": "curated-pehle-bhi-main",
        "name": "Pehle Bhi Main",
        "artist": "Vishal Mishra",
        "image": "https://i.ytimg.com/vi/iAIBF2ngbWY/hqdefault.jpg",
        "duration": 250,
        "youtube_id": "iAIBF2ngbWY",
        "detected_mood": "Romantic",
        "mood_match": "Romantic",
    },
    {
        "id": "curated-machayenge-3",
        "name": "Machayenge 3",
        "artist": "Emiway Bantai",
        "image": "https://i.ytimg.com/vi/Dlz_XHeUUcw/hqdefault.jpg",
        "duration": 238,
        "youtube_id": "Dlz_XHeUUcw",
        "detected_mood": "Energetic",
        "mood_match": "Energetic",
    },
    {
        "id": "curated-believer",
        "name": "Believer",
        "artist": "Imagine Dragons",
        "image": "https://i.ytimg.com/vi/7wtfhZwyrcc/hqdefault.jpg",
        "duration": 204,
        "youtube_id": "7wtfhZwyrcc",
        "detected_mood": "Energetic",
        "mood_match": "Energetic",
    },
    {
        "id": "curated-deep-focus",
        "name": "Deep Focus",
        "artist": "Brain Food",
        "image": "https://i.ytimg.com/vi/WPni755-Krg/hqdefault.jpg",
        "duration": 195,
        "youtube_id": "WPni755-Krg",
        "detected_mood": "Focus",
        "mood_match": "Focus",
    },
    {
        "id": "curated-channa-mereya",
        "name": "Channa Mereya",
        "artist": "Arijit Singh",
        "image": "https://i.ytimg.com/vi/284Ov7ysmfA/hqdefault.jpg",
        "duration": 289,
        "youtube_id": "284Ov7ysmfA",
        "detected_mood": "Sad",
        "mood_match": "Sad",
    },
    {
        "id": "curated-kabira",
        "name": "Kabira",
        "artist": "Arijit Singh & Harshdeep Kaur",
        "image": "https://i.ytimg.com/vi/jHNNMj5bNQw/hqdefault.jpg",
        "duration": 223,
        "youtube_id": "jHNNMj5bNQw",
        "detected_mood": "Sad",
        "mood_match": "Sad",
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

    def infer_mood(self, name: str, artist: str, genre: str = "") -> str:
        """Heuristically infer song mood based on title keywords, artist, and genre."""
        combined = f"{name} {artist} {genre}".lower()

        # 1. Energetic
        energetic_keywords = [
            "dance", "workout", "party", "boom", "machayenge", "energy", "bhangra",
            "remix", "bass", "dhol", "badshah", "honey singh", "emiway", "mc stan",
            "raftaar", "punjabi", "electronic", "club", "dj", "hip-hop", "rap", "rock", "fast"
        ]
        if any(k in combined for k in energetic_keywords):
            return "Energetic"

        # 2. Romantic
        romantic_keywords = [
            "love", "ishq", "dil", "pyar", "romantic", "tum", "teriyaan", "raataan",
            "kesariya", "humsafar", "sanware", "pehla nasha", "zaalima", "soniye",
            "shiddat", "saibo", "tujh mein rab", "mohabbat", "nazar", "aashiqui"
        ]
        if any(k in combined for k in romantic_keywords):
            return "Romantic"

        # 3. Sad / Reflective
        sad_keywords = [
            "sad", "dard", "judai", "judaai", "alvida", "broken", "tears", "channa mereya",
            "agar tum saath ho", "bekhayali", "phir bhi tumko", "tujhe bhula diya",
            "alone", "heartbreak", "ronde", "tanha", "gham", "roya", "dooriyan"
        ]
        if any(k in combined for k in sad_keywords):
            return "Sad"

        # 4. Focus
        focus_keywords = [
            "focus", "lo-fi", "lofi", "study", "instrumental", "classical", "piano",
            "ambient", "flow", "meditation", "breeze", "concentration", "deep work", "acoustic guitar"
        ]
        if any(k in combined for k in focus_keywords):
            return "Focus"

        # 5. Calm
        calm_keywords = [
            "calm", "peace", "acoustic", "shanti", "soothing", "ocean", "sukoon",
            "khamoshiyan", "kun faya", "hawaa", "baarish", "iktara", "safarnama",
            "sham", "peaceful", "serene", "tranquil", "sleep", "relax"
        ]
        if any(k in combined for k in calm_keywords):
            return "Calm"

        # 6. Happy
        happy_keywords = [
            "happy", "smile", "sunshine", "cheerful", "celebration", "ilahi",
            "matargashti", "subhanallah", "gallan goodiyan", "joy", "fun", "uplifting",
            "good vibe", "festive"
        ]
        if any(k in combined for k in happy_keywords):
            return "Happy"

        # Fallback genre heuristics
        genre_l = genre.lower()
        if any(g in genre_l for g in ["dance", "hip-hop", "electronic", "fitness"]):
            return "Energetic"
        if any(g in genre_l for g in ["ambient", "acoustic", "classical"]):
            return "Calm"
        if "pop" in genre_l:
            return "Happy"

        return "Calm"

    def search_tracks(self, query: str, limit: int = 8, filter_artist: str = "") -> List[Dict]:
        """Search tracks with artwork and details for user customization with artist filtering."""
        if not query and not filter_artist:
            return []
        
        tracks = []
        
        # 1. Try Spotify Web API first (Authentic Spotify cover art)
        token = self._get_spotify_token()
        if token:
            try:
                term_parts = []
                if query:
                    term_parts.append(query.strip())
                if filter_artist:
                    term_parts.append(filter_artist.strip())
                term = " ".join(term_parts)
                
                s_resp = requests.get(
                    "https://api.spotify.com/v1/search",
                    params={"q": term, "type": "track", "limit": max(limit * 2, 10)},
                    headers={"Authorization": f"Bearer {token}"},
                    timeout=3.5
                )
                if s_resp.status_code == 200:
                    from .music_player import music_player
                    s_items = s_resp.json().get("tracks", {}).get("items", [])
                    if filter_artist:
                        fa_lower = filter_artist.lower().strip()
                        s_items.sort(
                            key=lambda x: (
                                0 if any(fa_lower in a.get("name", "").lower() for a in x.get("artists", [])) else 1
                            )
                        )
                    for s_item in s_items[:limit]:
                        s_name = s_item.get("name", "")
                        s_artists = [a.get("name", "") for a in s_item.get("artists", [])]
                        s_artist = ", ".join(s_artists)
                        s_images = s_item.get("album", {}).get("images", [])
                        s_img = s_images[0].get("url") if s_images else None
                        s_dur = int(s_item.get("duration_ms", 210000) / 1000)
                        
                        yt_id = None
                        full_title = f"{s_artist} {s_name}".lower()
                        for song_k, vid in music_player.POPULAR_SONG_MAP.items():
                            if song_k in full_title or song_k in s_name.lower():
                                yt_id = vid
                                break
                        if not yt_id:
                            with music_player._lock:
                                yt_id = music_player.cache.get(f"{s_artist} {s_name}") or music_player.cache.get(full_title)
                        
                        detected = self.infer_mood(s_name, s_artist)
                        if not s_img and yt_id:
                            s_img = f"https://i.ytimg.com/vi/{yt_id}/hqdefault.jpg"
                        
                        tracks.append({
                            "id": f"spotify-{s_item.get('id')}",
                            "name": s_name,
                            "artist": s_artist,
                            "image": s_img or (f"https://i.ytimg.com/vi/{yt_id}/hqdefault.jpg" if yt_id else f"https://ui-avatars.com/api/?name={s_name}&background=0f172a&color=38bdf8&size=500&font-size=0.35&bold=true"),
                            "duration": s_dur,
                            "preview_url": s_item.get("preview_url"),
                            "youtube_id": yt_id,
                            "mood_match": detected,
                            "detected_mood": detected,
                            "source": "spotify"
                        })
            except Exception:
                pass
        
        # 2. Fallback to iTunes / Apple Music if Spotify produced no results
        if not tracks:
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
    
                        detected = self.infer_mood(t_name, t_artist, item.get("primaryGenreName", ""))
                        tracks.append({
                            "id": f"itunes-{item.get('trackId')}",
                            "name": t_name,
                            "artist": t_artist,
                            "image": high_res or (f"https://i.ytimg.com/vi/{yt_id}/hqdefault.jpg" if yt_id else f"https://ui-avatars.com/api/?name={t_name}&background=0f172a&color=38bdf8&size=500&font-size=0.35&bold=true"),
                            "duration": int(duration_ms / 1000),
                            "preview_url": item.get("previewUrl"),
                            "youtube_id": yt_id,
                            "mood_match": detected,
                            "detected_mood": detected,
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
                    hit_copy = dict(hit)
                    hit_copy["detected_mood"] = self.infer_mood(hit["name"], hit["artist"])
                    hit_copy["mood_match"] = hit_copy["detected_mood"]
                    tracks.append(hit_copy)

        for tr in tracks:
            if not tr.get("detected_mood") or tr.get("detected_mood") == "Favorite":
                tr["detected_mood"] = self.infer_mood(tr.get("name", ""), tr.get("artist", ""))
                tr["mood_match"] = tr["detected_mood"]

        return tracks[:limit]


artwork_service = ArtworkService()
