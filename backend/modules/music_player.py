"""
Music Player Module - High Performance with Parallel Resolution, Thread-Safety & Query Sanitization
"""
import json
import os
import requests
import threading
from typing import Optional, List
from concurrent.futures import ThreadPoolExecutor, as_completed
from .config import Config

import re
import urllib.parse
import urllib.request


class MusicPlayer:
    
    BAD_TITLE_KEYWORDS = [
        "1 hour", "10 hour", "10 hours", "loop", "karaoke", "reaction",
        "fan cover", "guitar cover", "bass cover", "drum cover", "parody",
        "live stream", "podcast"
    ]
    
    def __init__(self):
        self.cache_file = Config.CACHE_FILE
        self._lock = threading.Lock()
        self.cache = self.load_cache()
        self.youtube = Config.get_youtube()
    
    def load_cache(self) -> dict:
        if os.path.exists(self.cache_file):
            try:
                with open(self.cache_file, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    # Support both exact case and lowercase lookups
                    cache_map = {}
                    for k, v in data.items():
                        cache_map[k] = v
                        cache_map[k.strip().lower()] = v
                    return cache_map
            except Exception:
                return {}
        return {}
    
    def save_cache(self):
        try:
            with open(self.cache_file, 'w', encoding='utf-8') as f:
                json.dump(self.cache, f, indent=2)
        except Exception:
            pass

    def clean_query(self, query: str) -> str:
        """Sanitize and format query for YouTube search"""
        if not query:
            return ""
        # Remove noisy characters
        cleaned = re.sub(r'[\(\)\[\]\{\}_]', ' ', query)
        cleaned = re.sub(r'\s+', ' ', cleaned).strip()
        # Avoid double-appending 'official'
        if "official" not in cleaned.lower():
            cleaned = f"{cleaned} official audio"
        return cleaned

    def is_quality_title(self, title: str) -> bool:
        """Check if video title passes quality filter (reject loops, fan covers, reactions)"""
        if not title:
            return True
        lower_title = title.lower()
        return not any(bad in lower_title for bad in self.BAD_TITLE_KEYWORDS)

    def get_youtube_id_direct(self, query: str) -> Optional[str]:
        """Direct YouTube search fallback if API quota is reached"""
        try:
            search_query = self.clean_query(query)
            url = f"https://www.youtube.com/results?search_query={urllib.parse.quote(search_query)}"
            req = urllib.request.Request(
                url,
                headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"}
            )
            with urllib.request.urlopen(req, timeout=3) as resp:
                html = resp.read().decode('utf-8', errors='ignore')
                video_ids = re.findall(r'"videoId":"([a-zA-Z0-9_-]{11})"', html)
                if video_ids:
                    return video_ids[0]
        except Exception:
            pass
        return None
    
    def get_youtube_id_invidious(self, query: str) -> Optional[str]:
        """Try Invidious instances with short timeout"""
        instances = [
            "https://inv.tux.pizza",
            "https://invidious.fdn.fr"
        ]
        search_query = self.clean_query(query)
        
        for instance in instances:
            try:
                response = requests.get(
                    f"{instance}/api/v1/search",
                    params={"q": search_query, "type": "video"},
                    timeout=1.2
                )
                
                if response.status_code == 200:
                    data = response.json()
                    if data and len(data) > 0:
                        for video_data in data[:3]:
                            title = video_data.get('title', '')
                            if self.is_quality_title(title):
                                video_id = video_data.get('videoId') or video_data.get('id')
                                if isinstance(video_id, dict):
                                    video_id = video_id.get('videoId')
                                if video_id:
                                    return video_id
            except Exception:
                continue
        
        return None
    
    def get_youtube_id_official(self, query: str) -> Optional[str]:
        """Official YouTube Data API v3 search with quality filter"""
        if not self.youtube:
            return None
        
        try:
            search_query = self.clean_query(query)
            request = self.youtube.search().list(
                q=search_query,
                part='snippet',
                maxResults=3,
                type='video'
            )
            response = request.execute()
            
            items = response.get('items', [])
            if items:
                # Prefer items that pass quality filter
                for item in items:
                    title = item.get('snippet', {}).get('title', '')
                    if self.is_quality_title(title):
                        return item['id'].get('videoId')
                # Fallback to first item if all filtered
                return items[0]['id'].get('videoId')
        except Exception:
            pass
        
        return None
    
    def get_youtube_id(self, query: str) -> Optional[str]:
        """Get YouTube ID with thread-safe caching"""
        raw_key = query.strip()
        lower_key = raw_key.lower()
        with self._lock:
            if raw_key in self.cache:
                return self.cache[raw_key]
            if lower_key in self.cache:
                return self.cache[lower_key]
        
        # 1. Try official API (most accurate)
        video_id = self.get_youtube_id_official(query)
        
        # 2. Fallback to direct web search
        if not video_id:
            video_id = self.get_youtube_id_direct(query)

        # 3. Fallback to Invidious
        if not video_id:
            video_id = self.get_youtube_id_invidious(query)
        
        if video_id:
            with self._lock:
                self.cache[raw_key] = video_id
                self.cache[lower_key] = video_id
                self.save_cache()
        
        return video_id
    
    def resolve_single_song(self, song) -> any:
        """Resolve YouTube ID for a single song object (thread worker target)"""
        if getattr(song, 'youtube_id', None):
            return song
        
        artist = getattr(song, 'artist', '') or ''
        name = getattr(song, 'name', '') or ''
        
        if name and artist:
            query = f"{artist} {name}"
            try:
                vid = self.get_youtube_id(query)
                if vid:
                    song.youtube_id = vid
                    song.preview_url = f"https://www.youtube.com/watch?v={vid}"
            except Exception:
                pass
        return song

    def resolve_youtube_ids_parallel(self, songs: List[any], max_workers: int = 10) -> List[any]:
        """
        Parallel resolution for a list of songs.
        Drops sequential 12s latency down to ~1.2s.
        """
        if not songs:
            return []
        
        # Identify songs that actually need resolution
        to_resolve = [s for s in songs if not getattr(s, 'youtube_id', None)]
        if not to_resolve:
            return songs
        
        with ThreadPoolExecutor(max_workers=max_workers) as executor:
            future_to_song = {executor.submit(self.resolve_single_song, s): s for s in to_resolve}
            for future in as_completed(future_to_song):
                try:
                    future.result()
                except Exception:
                    pass
        
        # Save cache once after batch resolution
        with self._lock:
            self.save_cache()
            
        return songs

    def get_embed_url(self, video_id: str, autoplay: bool = True) -> str:
        autoplay_param = "1" if autoplay else "0"
        return f"https://www.youtube.com/embed/{video_id}?autoplay={autoplay_param}"
    
    def get_watch_url(self, video_id: str) -> str:
        return f"https://www.youtube.com/watch?v={video_id}"
    
    def search_and_get_url(self, song_name: str, artist: str) -> Optional[dict]:
        query = f"{artist} {song_name}"
        video_id = self.get_youtube_id(query)
        
        if video_id:
            return {
                'video_id': video_id,
                'embed_url': self.get_embed_url(video_id),
                'watch_url': self.get_watch_url(video_id),
                'query': query
            }
        
        return None
    
    def clear_cache(self):
        with self._lock:
            self.cache = {}
            self.save_cache()
        print("Cache cleared")
    
    def get_cache_stats(self) -> dict:
        with self._lock:
            return {
                'total_entries': len(self.cache),
                'cache_file': self.cache_file,
                'cache_size_kb': os.path.getsize(self.cache_file) / 1024 if os.path.exists(self.cache_file) else 0
            }


music_player = MusicPlayer()
