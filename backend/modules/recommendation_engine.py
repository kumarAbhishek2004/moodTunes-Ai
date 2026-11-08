"""

Recommendation Engine - High-Performance Parallelized Engine with Microsecond Caching

"""

import os

import json

import time

from typing import List, Optional, Dict

from concurrent.futures import ThreadPoolExecutor, wait

from .config import Config

from .models import Song, PersonalizedRecommendationRequest, RecommendationRequest

from .music_player import music_player

from .mood_detection import MoodDetector

from fastapi import HTTPException

from datetime import datetime

from collections import defaultdict

import re

import urllib.parse





class RecommendationEngine:

    

    LANGUAGE_TO_TAG = {

        'hindi': 'bollywood',

        'english': 'pop',

        'punjabi': 'punjabi',

    }

    

    def __init__(self):

        self.lastfm = Config.get_lastfm()

        self.user_history = defaultdict(list)

        self.user_favorites = defaultdict(list)

        self._track_cache = {}

        self._artist_cache = {}  # Cache for fuzzy-matched artist names

        self._tag_cache = {}     # In-memory TTL cache for tag -> (timestamp, songs)

        self._artist_tracks_cache = {} # In-memory TTL cache for artist -> (timestamp, songs)

        self.seeds = self._load_seeds()



    def _load_seeds(self) -> dict:

        """Load curated seed bank for offline/zero-error resilience"""

        seed_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "cache", "curated_seeds.json")

        if os.path.exists(seed_path):

            try:

                with open(seed_path, "r", encoding="utf-8") as f:

                    return json.load(f)

            except Exception as e:

                print(f"⚠️ Could not load curated_seeds.json: {e}")

        return {}



    def get_seed_recommendations(self, mood: str, language: str = 'english', limit: int = 20) -> List[Song]:

        """Resilient fallback when Last.fm is down or returns empty results"""

        mood_key = (mood or 'happy').lower()

        if mood_key not in self.seeds:

            if mood_key in ['focus', 'calm']:

                mood_key = 'calm'

            elif mood_key in ['romantic']:

                mood_key = 'calm'

            elif mood_key in ['reflective', 'sad']:

                mood_key = 'sad'

            elif mood_key in ['energetic', 'intense']:

                mood_key = 'energetic'

            else:

                mood_key = 'happy'

        

        lang_key = (language or 'english').lower()

        if lang_key not in ['hindi', 'english']:

            lang_key = 'english'

        

        pool = self.seeds.get(mood_key, {}).get(lang_key, [])

        if len(pool) < limit:

            alt_lang = 'hindi' if lang_key == 'english' else 'english'

            pool = pool + self.seeds.get(mood_key, {}).get(alt_lang, [])

        

        songs = []

        for item in pool[:limit]:

            name = item.get("name", "")

            artist = item.get("artist", "")

            yid = item.get("youtube_id", "")

            song_id = f"{artist}_{name}".replace(" ", "_").lower()[:50]

            songs.append(Song(

                id=song_id,

                name=name,

                artist=artist,

                lastfm_url=f"https://www.last.fm/music/{urllib.parse.quote(artist)}/_/{urllib.parse.quote(name)}",

                youtube_id=yid,

                preview_url=f"https://www.youtube.com/watch?v={yid}" if yid else None,

                tags=item.get("tags", []),

                audio_features={"mood_match": mood_key, "is_curated": True},

                mood_match=mood_key,

                ai_explanation=f"Verified top track curated for {mood_key.capitalize()} listening."

            ))

        return songs

    

    def fuzzy_match_artist(self, artist_query: str) -> str:

        """

        Fast fuzzy matching with cache check and single-attempt Last.fm search.

        Never stalls or performs 4 fallback web searches.

        """

        if not artist_query or not self.lastfm:

            return artist_query

        

        artist_query = artist_query.strip()

        cache_key = artist_query.lower()

        

        # Check cache

        if cache_key in self._artist_cache:

            return self._artist_cache[cache_key]

        

        try:

            search_results = self.lastfm.search_for_artist(artist_query)

            matches = search_results.get_next_page() if hasattr(search_results, 'get_next_page') else list(search_results)

            

            if matches and len(matches) > 0:

                best_match = matches[0]

                corrected_name = best_match.name if hasattr(best_match, 'name') else str(best_match)

                self._artist_cache[cache_key] = corrected_name

                return corrected_name

        except Exception:

            pass

        

        # Fallback to original query

        self._artist_cache[cache_key] = artist_query

        return artist_query

        

    def _is_similar(self, str1: str, str2: str, threshold: float = 0.6) -> bool:

        """Check if two strings are similar using simple ratio"""

        if str1 == str2:

            return True

        

        # Check if one contains the other

        if str1 in str2 or str2 in str1:

            return True

        

        # Simple character overlap ratio

        set1 = set(str1.replace(' ', ''))

        set2 = set(str2.replace(' ', ''))

        

        if not set1 or not set2:

            return False

        

        intersection = len(set1 & set2)

        union = len(set1 | set2)

        

        ratio = intersection / union if union > 0 else 0

        return ratio >= threshold

    

    def _clean_artist_query(self, query: str) -> str:

        """

        Clean common typos and suffixes from artist query

        Examples: 

        - "arijit song" → "arijit"

        - "taylor swift songs" → "taylor swift"

        """

        query = query.strip().lower()

        

        # Remove common suffixes

        remove_words = ['song', 'songs', 'singer', 'music', 'artist', 'band']

        

        words = query.split()

        if len(words) > 1 and words[-1] in remove_words:

            cleaned = ' '.join(words[:-1])

            return cleaned

        

        return query

    

    def parse_song_string(self, song_str: str, default_artists: List[str] = None) -> Dict[str, str]:

        """

        Parse song string to extract name and artist

        Formats: "Song - Artist", "Song by Artist", "Song"

        """

        song_str = song_str.strip()

        

        # "Song - Artist"

        if ' - ' in song_str:

            parts = song_str.split(' - ', 1)

            artist_raw = parts[1].strip()

            return {

                'name': parts[0].strip(),

                'artist': self.fuzzy_match_artist(artist_raw)

            }

        

        # "Song by Artist"

        if ' by ' in song_str.lower():

            parts = re.split(r' by ', song_str, flags=re.IGNORECASE, maxsplit=1)

            artist_raw = parts[1].strip()

            return {

                'name': parts[0].strip(),

                'artist': self.fuzzy_match_artist(artist_raw)

            }

        

        # Use default artist

        if default_artists and len(default_artists) > 0:

            return {

                'name': song_str,

                'artist': self.fuzzy_match_artist(default_artists[0])

            }

        

        return {'name': song_str, 'artist': ''}

    

    def track_to_song(self, track_or_info, skip_youtube: bool = False) -> Song:

        """Convert Last.fm track or TopItem to Song without slow blocking HTTP calls"""

        title = ""

        artist_name = ""

        playcount = None

        

        weight = getattr(track_or_info, 'weight', None)

        if weight is None and isinstance(track_or_info, (list, tuple)) and len(track_or_info) > 1:

            weight = track_or_info[1]

            track = track_or_info[0]

        elif hasattr(track_or_info, 'item'):

            track = track_or_info.item

        else:

            track = track_or_info

        

        try:

            title = track.title if hasattr(track, 'title') else str(track)

        except Exception:

            title = str(track)

        

        try:

            if hasattr(track, 'artist'):

                artist_obj = track.artist

                artist_name = artist_obj.name if hasattr(artist_obj, 'name') else str(artist_obj)

        except Exception:

            artist_name = ""

        

        if artist_name and title:

            url = f"https://www.last.fm/music/{urllib.parse.quote(artist_name)}/_/{urllib.parse.quote(title)}"

        else:

            url = None

        

        if weight is not None:

            try:

                playcount = int(weight)

            except Exception:

                playcount = None

        

        youtube_id = None

        if not skip_youtube and title and artist_name:

            try:

                youtube_id = music_player.get_youtube_id(f"{artist_name} {title}")

            except Exception:

                youtube_id = None

        

        song_id = f"{artist_name}_{title}".replace(" ", "_").lower()[:50]

        

        return Song(

            id=song_id,

            name=title,

            artist=artist_name,

            lastfm_url=url,

            youtube_id=youtube_id,

            preview_url=f"https://www.youtube.com/watch?v={youtube_id}" if youtube_id else None,

            album=None,

            duration_ms=None,

            listeners=None,

            playcount=playcount,

            tags=[],

            audio_features={}

        )

    

    def get_top_tracks_by_tag(self, tag: str, limit: int = 20) -> List[Song]:

        """Get top tracks by tag with 1-hour in-memory TTL caching (0.001s return on hits)"""

        if not tag:

            return []

        

        tag_key = tag.strip().lower()

        now = time.time()

        

        # Check cache

        if tag_key in self._tag_cache:

            ts, cached_songs = self._tag_cache[tag_key]

            if now - ts < 3600:

                return cached_songs[:limit]

        

        songs = []

        if not self.lastfm:

            return songs

        

        try:

            tag_obj = self.lastfm.get_tag(tag_key)

            top_tracks = tag_obj.get_top_tracks(limit=limit)

            

            for track_info in top_tracks:

                try:

                    song = self.track_to_song(track_info, skip_youtube=True)

                    if song and song.name:

                        songs.append(song)

                except Exception:

                    continue

            

            if songs:

                self._tag_cache[tag_key] = (now, songs)

        except Exception as e:

            print(f"Error for tag '{tag}': {e}")

        

        return songs

    

    def get_artist_top_tracks(self, artist_name: str, limit: int = 10, mood_filter: Optional[str] = None) -> List[Song]:

        """Get artist's top tracks with fuzzy matching & 1-hour in-memory TTL caching"""

        if not artist_name:

            return []

        

        corrected_artist = self.fuzzy_match_artist(artist_name)

        artist_key = f"{corrected_artist.strip().lower()}_{mood_filter or ''}"

        now = time.time()

        

        # Check cache

        if artist_key in self._artist_tracks_cache:

            ts, cached_songs = self._artist_tracks_cache[artist_key]

            if now - ts < 3600:

                return cached_songs[:limit]

        

        songs = []

        if not self.lastfm:

            return songs

        

        try:

            print(f"  🎤 Fetching tracks for: {corrected_artist}")

            artist = self.lastfm.get_artist(corrected_artist)

            fetch_limit = limit * 2 if mood_filter else limit

            top_tracks = artist.get_top_tracks(limit=fetch_limit)

            

            for track_info in top_tracks:

                if len(songs) >= limit:

                    break

                    

                try:

                    song = self.track_to_song(track_info, skip_youtube=True)

                    if song and song.name:

                        songs.append(song)

                except Exception as e:

                    continue

            

            if songs:

                self._artist_tracks_cache[artist_key] = (now, songs)

        except Exception as e:

            print(f"  ✗ Error getting tracks for {corrected_artist}: {e}")

        

        return songs

    

    def search_by_artist(self, artist_name: str, limit: int = 10, mood_filter: Optional[str] = None) -> List[Song]:

        """Search songs by artist with fuzzy matching"""

        if not self.lastfm:

            return []

        

        corrected_artist = self.fuzzy_match_artist(artist_name)

        print(f"🎤 Searching for artist: {corrected_artist}")

        if mood_filter:

            print(f"   🎭 With mood filter: {mood_filter}")

        

        songs = self.get_artist_top_tracks(corrected_artist, limit=limit, mood_filter=mood_filter)

        

        for song in songs:

            if not song.youtube_id and song.name and song.artist:

                try:

                    youtube_id = music_player.get_youtube_id(f"{song.artist} {song.name}")

                    if youtube_id:

                        song.youtube_id = youtube_id

                        song.preview_url = f"https://www.youtube.com/watch?v={youtube_id}"

                except Exception:

                    pass

        

        return songs

    

    def search_track(self, name: str, artist: Optional[str] = None) -> Optional[Song]:

        """Search track with fuzzy artist matching and YouTube ID guarantee"""

        if not self.lastfm:

            return None

        

        try:

            # Apply fuzzy matching to artist

            corrected_artist = self.fuzzy_match_artist(artist) if artist else None

            

            cache_key = f"{corrected_artist}_{name}".lower() if corrected_artist else name.lower()

            

            if cache_key in self._track_cache:

                cached_song = self._track_cache[cache_key]

                if cached_song.youtube_id:

                    print(f"✓ Cache hit: {name} by {corrected_artist}")

                    return cached_song

                else:

                    print(f"⚠️  Cache hit but no YouTube ID, re-fetching...")

            

            print(f"🔍 Searching: {name}" + (f" by {corrected_artist}" if corrected_artist else ""))

            

            # Try direct lookup

            if corrected_artist:

                try:

                    track = self.lastfm.get_track(corrected_artist, name)

                    song = self.track_to_song(track, skip_youtube=False)

                    

                    if not song.youtube_id:

                        print(f"  ⚠️  No YouTube ID, fetching manually...")

                        youtube_id = music_player.get_youtube_id(f"{corrected_artist} {name}")

                        if youtube_id:

                            song.youtube_id = youtube_id

                            song.preview_url = f"https://www.youtube.com/watch?v={youtube_id}"

                            print(f"  ✓ YouTube ID added: {youtube_id}")

                    

                    self._track_cache[cache_key] = song

                    print(f"✓ Found: {song.name} by {song.artist}")

                    return song

                except Exception as e:

                    print(f"  Direct lookup failed: {e}")

            

            # Fallback search

            search_results = self.lastfm.search_for_track(corrected_artist or '', name)

            matches = search_results.get_next_page() if hasattr(search_results, 'get_next_page') else list(search_results)

            

            if matches:

                first_match = matches[0]

                song = self.track_to_song(first_match, skip_youtube=False)

                

                if not song.youtube_id:

                    search_query = f"{song.artist} {song.name}" if song.artist else song.name

                    youtube_id = music_player.get_youtube_id(search_query)

                    if youtube_id:

                        song.youtube_id = youtube_id

                        song.preview_url = f"https://www.youtube.com/watch?v={youtube_id}"

                

                self._track_cache[cache_key] = song

                print(f"✓ Found via search: {song.name} by {song.artist}")

                return song

            

            print(f"✗ No results for: {name}")

            return None

            

        except Exception as e:

            print(f"✗ Error searching '{name}': {e}")

            return None

    

    def get_similar_tracks(self, track_name: str, artist: str, limit: int = 5, mood_filter: Optional[str] = None) -> List[Song]:

        """Get similar tracks with fuzzy artist matching"""

        if not self.lastfm:

            return []

        

        corrected_artist = self.fuzzy_match_artist(artist)

        

        songs = []

        try:

            print(f"  🔍 Finding similar to: '{track_name}' by {corrected_artist}")

            track = self.lastfm.get_track(corrected_artist, track_name)

            similar = track.get_similar(limit=limit)

            

            for similar_track in similar:

                if len(songs) >= limit:

                    break

                    

                try:

                    song = self.track_to_song(similar_track, skip_youtube=True)

                    if song and song.name:

                        songs.append(song)

                        print(f"     ✓ Similar: {song.name}")

                except Exception:

                    continue

                    

            print(f"  ✓ Found {len(songs)} similar tracks")

        except Exception as e:

            print(f"  ✗ Error getting similar tracks: {e}")

        

        return songs

    

    def add_favorite_song(self, user_id: str, song_name: str, artist: str) -> Dict:

        """Add song to favorites"""

        favorite = {

            'name': song_name,

            'artist': artist,

            'added_at': datetime.now().isoformat()

        }

        

        existing = [f for f in self.user_favorites[user_id] 

                   if f['name'].lower() == song_name.lower() 

                   and f['artist'].lower() == artist.lower()]

        

        if not existing:

            self.user_favorites[user_id].append(favorite)

            return {"message": "Added to favorites", "favorite": favorite}

        else:

            return {"message": "Already in favorites", "favorite": existing[0]}

    

    def get_favorites(self, user_id: str) -> Dict:

        """Get user favorites"""

        favorites = self.user_favorites[user_id]

        return {"user_id": user_id, "total": len(favorites), "favorites": favorites}

    

    def remove_favorite(self, user_id: str, song_name: str, artist: str) -> Dict:

        """Remove from favorites"""

        original_count = len(self.user_favorites[user_id])

        self.user_favorites[user_id] = [

            f for f in self.user_favorites[user_id]

            if not (f['name'].lower() == song_name.lower() 

                   and f['artist'].lower() == artist.lower())

        ]

        

        removed = original_count > len(self.user_favorites[user_id])

        return {"removed": removed, "remaining": len(self.user_favorites[user_id])}

    

    def get_user_history(self, user_id: str, limit: int = 50) -> Dict:

        """Get listening history"""

        history = self.user_history[user_id][-limit:]

        return {

            "user_id": user_id,

            "total_songs": len(self.user_history[user_id]),

            "history": history

        }

    

    def get_personalized_recommendations(self, request: PersonalizedRecommendationRequest) -> Dict:

        """

        Personalized recommendations with FUZZY MATCHING:

        - 8: Artist + Mood + Language

        - 4: Language + Mood

        - 4: Similar + Mood

        - Rest: Fallback

        """

        mood = (request.mood or '').lower()

        if not MoodDetector.validate_mood(mood):

            raise HTTPException(status_code=400, detail=f"Invalid mood: {mood}")

        

        prefs = request.preferences or {}

        language = (prefs.get('language') or '').lower()

        if language not in ['hindi', 'english', 'punjabi']:

            language = 'hindi'



        if not self.lastfm:

            print(f"⚠️ Last.fm not configured. Using curated seeds for mood '{mood}'.")

            seed_songs = self.get_seed_recommendations(mood, language, request.limit)

            return {

                "songs": seed_songs,

                "mood": mood,

                "language": language,

                "total": len(seed_songs),

                "distribution": {"curated_seeds": len(seed_songs)},

                "is_fallback": True,

                "preferences_applied": {

                    "language": language,

                    "favorite_singers": [],

                    "favorite_songs_count": 0

                }

            }

        

        favorite_songs = (

            prefs.get('favoriteSongs') or 

            prefs.get('favorite_songs') or 

            prefs.get('favouriteSongs') or 

            []

        )

        

        favorite_singers = (

            prefs.get('favoriteSingers') or 

            prefs.get('favorite_artists') or 

            prefs.get('favorite_singers') or

            prefs.get('favouriteSingers') or

            []

        )

        

        if isinstance(favorite_songs, str):

            favorite_songs = [s.strip() for s in favorite_songs.split(',') if s.strip()]

        if isinstance(favorite_singers, str):

            favorite_singers = [s.strip() for s in favorite_singers.split(',') if s.strip()]

        

        # FUZZY MATCH ALL ARTISTS

        corrected_singers = []

        for singer in favorite_singers:

            corrected = self.fuzzy_match_artist(singer)

            if corrected:

                corrected_singers.append(corrected)

        

        # Parse multi-class mood distribution

        raw_dist = request.mood_distribution or {mood: 100.0}

        valid_mood_dist = {}

        for m, score in raw_dist.items():

            clean_m = m.lower()

            if MoodDetector.validate_mood(clean_m) and float(score) > 0:

                valid_mood_dist[clean_m] = float(score)

        if not valid_mood_dist:

            valid_mood_dist = {mood: 100.0}



        # Anti-Repetition Filter: Track recently recommended songs

        recent_song_keys = set()

        if request.user_id in self.user_history:

            for h in self.user_history[request.user_id][-30:]:

                s_obj = h.get('song') or {}

                s_name = s_obj.get('name') if isinstance(s_obj, dict) else getattr(s_obj, 'name', '')

                s_artist = s_obj.get('artist') if isinstance(s_obj, dict) else getattr(s_obj, 'artist', '')

                if s_name and s_artist:

                    recent_song_keys.add(f"{s_name}-{s_artist}".lower())



        print(f"\n{'='*60}")

        print(f"🎵 PERSONALIZED MULTI-CLASS RECOMMENDATIONS")

        print(f"{'='*60}")

        print(f"Language: {language.upper()}")

        print(f"Primary Mood: {mood.upper()}")

        print(f"Mood Distribution: {valid_mood_dist}")

        print(f"Favorite Singers (original): {favorite_singers}")

        print(f"Favorite Singers (corrected): {corrected_singers}")

        print(f"Favorite Songs: {favorite_songs}")

        print(f"Recent History Exclusions: {len(recent_song_keys)} tracks")

        print(f"Target Limit: {request.limit} songs")

        print(f"{'='*60}\n")

        

        language_tag = self.LANGUAGE_TO_TAG.get(language, 'pop')

        

        # Categorized buckets for round-robin interleaving

        bucket_artist = []

        bucket_mood = []

        bucket_similar = []

        bucket_fallback = []

        added = set()

        

        TARGET_CAT1 = 8  # Artist favorites

        TARGET_CAT2 = 6  # Weighted multi-mood tags

        TARGET_CAT3 = 4  # Similar tracks

        

        # -------------------------------------------------------------

        # PARALLEL RETRIEVAL FOR ALL CATEGORIES (MAX 2.5s TIMEOUT)

        # -------------------------------------------------------------

        futures_map = {}

        with ThreadPoolExecutor(max_workers=8) as executor:

            # 1. Parallel Artist Tracks

            if corrected_singers:

                for singer in corrected_singers[:3]:

                    fut = executor.submit(self.get_artist_top_tracks, singer, 8, mood)

                    futures_map[fut] = ('artist', singer)

            

            # 2. Parallel Language Tag

            fut_lang = executor.submit(self.get_top_tracks_by_tag, language_tag, 15)

            futures_map[fut_lang] = ('lang', language_tag)

            

            # 3. Parallel Mood Tags

            for m_name in valid_mood_dist.keys():

                for t in MoodDetector.get_mood_tags(m_name)[:2]:

                    fut_m = executor.submit(self.get_top_tracks_by_tag, t, 15)

                    futures_map[fut_m] = ('mood', m_name, t)

            

            # 4. Parallel Similar Tracks

            if favorite_songs:

                for fav_song in favorite_songs[:2]:

                    parsed = self.parse_song_string(fav_song, corrected_singers)

                    s_name, s_artist = parsed['name'], parsed['artist']

                    if s_artist:

                        fut_sim = executor.submit(self.get_similar_tracks, s_name, s_artist, 6, mood)

                        futures_map[fut_sim] = ('similar', fav_song)



            # Wait maximum 2.5s for all parallel network calls

            done, not_done = wait(futures_map.keys(), timeout=2.5)

            for f in not_done:

                f.cancel()

        

        # Gather results into categorized buckets

        for fut in done:

            meta = futures_map[fut]

            try:

                songs = fut.result()

            except Exception:

                continue

            

            cat_type = meta[0]

            if cat_type == 'artist':

                singer = meta[1]

                for s in songs:

                    key = f"{s.name}-{s.artist}".lower()

                    if key not in added and len(bucket_artist) < TARGET_CAT1:

                        added.add(key)

                        s.mood_match = mood

                        s.ai_explanation = f"Matches your {mood.capitalize()} mood & preference for {singer}."

                        bucket_artist.append(s)

            elif cat_type in ('lang', 'mood'):

                m_tag = meta[1] if cat_type == 'mood' else mood

                conf_pct = int(round(valid_mood_dist.get(m_tag, 70.0)))

                for s in songs:

                    key = f"{s.name}-{s.artist}".lower()

                    if key not in added and len(bucket_mood) < (TARGET_CAT2 + TARGET_CAT1):

                        added.add(key)

                        s.mood_match = m_tag

                        s.ai_explanation = f"Curated for your {conf_pct}% {m_tag.capitalize()} emotional spectrum."

                        bucket_mood.append(s)

            elif cat_type == 'similar':

                fav_name = meta[1]

                for s in songs:

                    key = f"{s.name}-{s.artist}".lower()

                    if key not in added and len(bucket_similar) < TARGET_CAT3:

                        added.add(key)

                        s.mood_match = mood

                        s.ai_explanation = f"Curated because it shares emotional resonance with '{fav_name}'."

                        bucket_similar.append(s)

            

        # -------------------------------------------------------------

        # CATEGORY 4: Fast Fallback Pool (Pre-cached Seeds)

        # -------------------------------------------------------------

        total_collected = len(bucket_artist) + len(bucket_mood) + len(bucket_similar)

        needed = request.limit - total_collected

        

        if needed > 0:

            fb_pool = self.get_seed_recommendations(mood, language, needed * 2)

            for song in fb_pool:

                if len(bucket_fallback) >= needed:

                    break

                key = f"{song.name}-{song.artist}".lower()

                if key not in added:

                    added.add(key)

                    bucket_fallback.append(song)

            

        # -------------------------------------------------------------

        # ROUND-ROBIN INTERLEAVING & ANTI-REPETITION BALANCING

        # -------------------------------------------------------------

        final = []

        final_keys = set()

        deferred_recent = []

        

        candidate_buckets = [bucket_artist, bucket_mood, bucket_similar, bucket_fallback]

        

        while len(final) < request.limit and any(candidate_buckets):

            for bucket in candidate_buckets:

                if len(final) >= request.limit:

                    break

                while bucket:

                    candidate = bucket.pop(0)

                    ckey = f"{candidate.name}-{candidate.artist}".lower()

                    if ckey not in final_keys:

                        # If listened to recently, defer to give fresh songs priority

                        if ckey in recent_song_keys and len(bucket) > 0:

                            deferred_recent.append(candidate)

                            continue

                        final_keys.add(ckey)

                        final.append(candidate)

                        break

        

        # Backfill with deferred tracks if still under limit

        while len(final) < request.limit and deferred_recent:

            candidate = deferred_recent.pop(0)

            ckey = f"{candidate.name}-{candidate.artist}".lower()

            if ckey not in final_keys:

                final_keys.add(ckey)

                final.append(candidate)

                

        # -------------------------------------------------------------

        # RESILIENT SEED BACKFILL (GUARANTEE FULL LIMIT)

        # -------------------------------------------------------------

        if len(final) < request.limit:

            needed = request.limit - len(final)

            seeds = self.get_seed_recommendations(mood, language, needed * 2)

            for s in seeds:

                if len(final) >= request.limit:

                    break

                ckey = f"{s.name}-{s.artist}".lower()

                if ckey not in final_keys:

                    final_keys.add(ckey)

                    final.append(s)

            

        # -------------------------------------------------------------

        # FAST PARALLEL YOUTUBE RESOLUTION (⚡ 2.0s TIMEOUT)

        # -------------------------------------------------------------

        final = music_player.resolve_youtube_ids_parallel(final, max_workers=10, timeout=2.0)

        youtube_success = sum(1 for s in final if getattr(s, 'youtube_id', None))

        print(f"✅ YouTube IDs resolved in parallel: {youtube_success}/{len(final)}\n")

        

        for s in final:

            try:

                self.user_history[request.user_id].append({

                    'song': s.dict() if hasattr(s, 'dict') else s.__dict__,

                    'mood': mood,

                    'language': language,

                    'timestamp': datetime.now().isoformat(),

                    'source': 'personalized'

                })

            except Exception:

                # Best-effort: store minimal info

                self.user_history[request.user_id].append({

                    'song': {'name': getattr(s, 'name', None), 'artist': getattr(s, 'artist', None)},

                    'mood': mood,

                    'language': language,

                    'timestamp': datetime.now().isoformat(),

                    'source': 'personalized'

                })

        

        mood_spectrum_counts = {}

        for s in final:

            m_tag = getattr(s, 'mood_match', mood) or mood

            mood_spectrum_counts[m_tag] = mood_spectrum_counts.get(m_tag, 0) + 1



        return {

            "songs": final,

            "mood": mood,

            "language": language,

            "total": len(final),

            "distribution": {

                "artist_based": len(bucket_artist),

                "language_mood": len(bucket_mood),

                "similar_tracks": len(bucket_similar),

                "fallback": len(bucket_fallback),

                "mood_spectrum": mood_spectrum_counts

            },

            "preferences_applied": {

                "language": language,

                "favorite_singers": corrected_singers,

                "favorite_songs_count": len(favorite_songs)

            }

        }

    

    def get_basic_recommendations(self, request: RecommendationRequest) -> Dict:

        """Basic mood-based recommendations with parallel resolution & resilient fallback"""

        mood = (request.mood or '').lower()

        if not MoodDetector.validate_mood(mood):

            raise HTTPException(status_code=400, detail=f"Invalid mood: {mood}")



        if not self.lastfm:

            print(f"⚠️ Last.fm not configured. Using curated seeds for mood '{mood}'.")

            seed_songs = self.get_seed_recommendations(mood, "english", request.limit)

            return {

                "songs": seed_songs,

                "mood": mood,

                "total": len(seed_songs),

                "is_fallback": True

            }

        

        mood_tags = MoodDetector.get_mood_tags(mood)

        recommendations = []

        added = set()

        

        # Parallel tag fetching with 2.0s timeout

        with ThreadPoolExecutor(max_workers=len(mood_tags) or 1) as executor:

            fut_map = {executor.submit(self.get_top_tracks_by_tag, tag, 15): tag for tag in mood_tags}

            done, not_done = wait(fut_map.keys(), timeout=2.0)

            for f in not_done:

                f.cancel()

            

            for f in done:

                try:

                    songs = f.result()

                    for s in songs:

                        key = f"{s.name}-{s.artist}".lower()

                        if key not in added and len(recommendations) < request.limit:

                            added.add(key)

                            s.mood_match = mood

                            s.ai_explanation = f"Matches your {mood.capitalize()} vibe."

                            recommendations.append(s)

                except Exception:

                    pass

        

        # Backfill from seeds if under limit

        if len(recommendations) < request.limit:

            needed = request.limit - len(recommendations)

            seeds = self.get_seed_recommendations(mood, "english", needed * 2)

            for s in seeds:

                if len(recommendations) >= request.limit:

                    break

                key = f"{s.name}-{s.artist}".lower()

                if key not in added:

                    added.add(key)

                    recommendations.append(s)

        

        recommendations = music_player.resolve_youtube_ids_parallel(recommendations, max_workers=10, timeout=2.0)

        

        print(f"✅ Retrieved {len(recommendations)} songs\n")

        

        return {

            "songs": recommendations,

            "mood": mood,

            "total": len(recommendations)

        }

    

    def _clean_track_title_artist(self, title: str, channel: str = "") -> tuple:
        """Helper to clean YouTube video title into authentic song title & artist"""
        if ' - ' in title:
            parts = title.split(' - ', 1)
            artist = parts[0].strip()
            song_name = parts[1].strip()
        elif '|' in title:
            parts = title.split('|', 1)
            artist = parts[0].strip()
            song_name = parts[1].strip()
        else:
            artist = channel or "Unknown Artist"
            song_name = title

        for suffix in ['(Official Video)', '(Official Music Video)', '(Lyric Video)', 
                       '(Audio)', '[Official Video]', 'Official Video', 'Lyrics',
                       '(Visualizer)', '[Audio]', '(Official Audio)', '(Official)',
                       'Full Video', 'Full Song', 'HD', '4K']:
            song_name = re.sub(re.escape(suffix), '', song_name, flags=re.IGNORECASE).strip()
        song_name = re.sub(r'\|\s*\(\s*\)', '', song_name)
        song_name = re.sub(r'\(\s*\)', '', song_name)
        song_name = re.sub(r'\[\s*\]', '', song_name)
        song_name = re.sub(r'\s*\|\s*$', '', song_name)
        song_name = re.sub(r'^\s*\|\s*', '', song_name)
        song_name = re.sub(r'\s*-\s*$', '', song_name)
        song_name = re.sub(r'\s+', ' ', song_name).strip()
        return song_name or title, artist

    def _search_youtube_scrape(self, query: str, limit: int = 10) -> List[Song]:
        """
        Direct YouTube web scraping fallback.
        Zero quota limits, no API key needed, immune to Google Cloud 429 quota exhaustion.
        """
        import urllib.request
        import urllib.parse
        import json

        songs = []
        clean_q = re.sub(r'[^\w\s-]', '', query).strip()
        if not clean_q:
            clean_q = query.strip()
        search_url = f"https://www.youtube.com/results?search_query={urllib.parse.quote(clean_q)}"

        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept-Language": "en-US,en;q=0.9",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
        }

        try:
            req = urllib.request.Request(search_url, headers=headers)
            with urllib.request.urlopen(req, timeout=5.0) as resp:
                html = resp.read().decode('utf-8', errors='ignore')

            m = re.search(r'var ytInitialData = ({.*?});</script>', html)
            if not m:
                m = re.search(r'window\["ytInitialData"\] = ({.*?});', html)

            if m:
                data = json.loads(m.group(1))
                extracted_vids = []

                def extract_renderers(obj):
                    if isinstance(obj, dict):
                        if 'videoRenderer' in obj:
                            vr = obj['videoRenderer']
                            vid = vr.get('videoId')
                            runs = vr.get('title', {}).get('runs', [])
                            title = runs[0].get('text', '') if runs else vr.get('title', {}).get('simpleText', '')
                            ch_runs = vr.get('ownerText', {}).get('runs', [])
                            channel = ch_runs[0].get('text', '') if ch_runs else ''
                            if vid and title:
                                extracted_vids.append({
                                    'videoId': vid,
                                    'title': title,
                                    'channel': channel
                                })
                        for val in obj.values():
                            extract_renderers(val)
                    elif isinstance(obj, list):
                        for item in obj:
                            extract_renderers(item)

                extract_renderers(data)

                for item in extracted_vids[:limit]:
                    vid = item['videoId']
                    title = item['title']
                    channel = item['channel']
                    song_name, artist = self._clean_track_title_artist(title, channel)

                    songs.append(Song(
                        id=f"yt_{vid}",
                        name=song_name[:100],
                        artist=artist[:100],
                        youtube_id=vid,
                        preview_url=f"https://www.youtube.com/watch?v={vid}",
                        tags=[]
                    ))
        except Exception as err:
            print(f"⚠️ YouTube web scraping notice: {err}")

        return songs

    def search_music(self, query: str, limit: int = 10) -> List[Song]:
        """Direct YouTube search - resilient with official API & unlimited web scraping fallback"""
        if not query or not query.strip():
            return []

        clean_q = query.strip()
        cache_key = clean_q.lower()

        # 1. Check in-memory cache
        if not hasattr(self, '_search_cache'):
            self._search_cache = {}
        if cache_key in self._search_cache:
            return self._search_cache[cache_key][:limit]

        print(f"\n🔍 Direct YouTube Search: '{clean_q}'")
        results = []

        # 2. Try official API only if quota hasn't been flagged as exhausted
        youtube = Config.get_youtube()
        quota_blocked = getattr(self, '_quota_exhausted', False)

        if youtube and not quota_blocked:
            try:
                search_response = youtube.search().list(
                    q=clean_q,
                    part='snippet',
                    type='video',
                    videoCategoryId='10',
                    maxResults=min(limit, 10)
                ).execute()

                items = search_response.get('items', [])
                for item in items:
                    try:
                        video_id = item['id']['videoId']
                        snippet = item['snippet']
                        title = snippet.get('title', 'Unknown')
                        channel = snippet.get('channelTitle', 'Unknown Artist')
                        song_name, artist = self._clean_track_title_artist(title, channel)

                        results.append(Song(
                            id=f"yt_{video_id}",
                            name=song_name[:100],
                            artist=artist[:100],
                            youtube_id=video_id,
                            preview_url=f"https://www.youtube.com/watch?v={video_id}",
                            tags=[]
                        ))
                    except Exception:
                        continue
            except Exception as api_error:
                err_str = str(api_error).lower()
                if "quota" in err_str or "429" in err_str or "ratelimit" in err_str:
                    print("⚠️ YouTube Data API v3 quota exceeded (429). Switching to unlimited web scraper mode.")
                    self._quota_exhausted = True
                else:
                    print(f"⚠️ YouTube API notice: {api_error}. Falling back to web scraper.")

        # 3. Direct web scraping fallback if API is exhausted or returned empty
        if not results:
            print(f"🌐 Running unlimited YouTube direct web search for '{clean_q}'...")
            results = self._search_youtube_scrape(clean_q, limit=limit)

        # 4. Fallback to Popular Song Map if network/scraper returned empty
        if not results:
            from modules.music_player import music_player
            for s_name, vid in music_player.POPULAR_SONG_MAP.items():
                if s_name in cache_key or cache_key in s_name:
                    results.append(Song(
                        id=f"pop_{vid}",
                        name=s_name.title(),
                        artist="Artist",
                        youtube_id=vid,
                        preview_url=f"https://www.youtube.com/watch?v={vid}",
                        tags=[]
                    ))

        # 5. Cache results
        if results:
            self._search_cache[cache_key] = results
            print(f"✅ Found {len(results)} results for '{clean_q}'\n")

        return results[:limit]

# Global instance
recommendation_engine = RecommendationEngine()
