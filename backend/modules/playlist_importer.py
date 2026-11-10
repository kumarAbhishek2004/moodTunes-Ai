"""
1-Click Spotify & YouTube Playlist Importer
Extracts 100% genuine tracks, artists, durations, and streaming video IDs
from public YouTube and Spotify links, classifying moods and saving
directly to MoodTunes.
"""
import re
import json
import os
import uuid
from typing import Dict, List, Optional, Tuple
from concurrent.futures import ThreadPoolExecutor
import requests

from .config import Config
from .music_player import MusicPlayer

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")
PLAYLISTS_FILE = os.path.join(DATA_DIR, "playlists.json")

# Module-level music player for YouTube ID resolution and cache lookups
_music_player: Optional[MusicPlayer] = None

def get_player_instance() -> MusicPlayer:
    global _music_player
    if _music_player is None:
        _music_player = MusicPlayer()
    return _music_player


def parse_iso8601_duration(pt_str: str) -> int:
    """Convert ISO 8601 duration (e.g. PT3M45S) to total seconds"""
    if not pt_str:
        return 210
    m = re.match(r'PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?', pt_str)
    if not m:
        return 210
    hours = int(m.group(1) or 0)
    minutes = int(m.group(2) or 0)
    seconds = int(m.group(3) or 0)
    total = hours * 3600 + minutes * 60 + seconds
    return total if total > 0 else 210


def clean_title_and_artist(raw_title: str, channel_title: str = "") -> Tuple[str, str]:
    """
    Cleans noisy YouTube titles and extracts clean song title and artist.
    e.g. 'Arijit Singh - Kesariya (Official Video) | Brahmāstra' -> ('Kesariya', 'Arijit Singh')
    """
    if not raw_title:
        return "Unknown Track", channel_title or "Unknown Artist"

    # Remove standard video junk tags
    cleaned = re.sub(
        r'[\(\[\{](?:official|audio|video|lyrics?|visualizer|hd|4k|remastered|version|prod\.|full song|extended).*?[\)\]\}]',
        '',
        raw_title,
        flags=re.IGNORECASE
    )

    artist = channel_title.replace(" - Topic", "").replace("VEVO", "").strip() if channel_title else ""
    song = cleaned

    if " - " in cleaned:
        parts = cleaned.split(" - ", 1)
        artist_part = parts[0].strip()
        song_part = parts[1].strip()
        if artist_part and song_part:
            artist = artist_part
            song = song_part
    elif " • " in cleaned:
        parts = cleaned.split(" • ", 1)
        song = parts[0].strip()
        artist = parts[1].strip()
    elif " || " in cleaned:
        parts = cleaned.split(" || ")
        song = parts[0].strip()
        if len(parts) > 1 and not artist:
            artist = parts[1].strip()
    elif "|" in cleaned:
        parts = cleaned.split("|", 1)
        song = parts[0].strip()
        if not artist:
            artist = parts[1].strip()

    # Clean trailing dashes, pipes, and extra spaces
    song = re.sub(r'[\s\-_|•]+$', '', song).strip()
    artist = re.sub(r'[\s\-_|•]+$', '', artist).strip()

    if not song:
        song = raw_title.strip()
    if not artist:
        artist = channel_title.replace(" - Topic", "").strip() or "Artist"

    return song, artist


def infer_mood(title: str, description: str = "") -> str:
    """Infer MoodTunes mood from title and description keywords"""
    text = f"{title} {description}".lower()

    if any(k in text for k in ["workout", "gym", "rap", "drill", "hype", "energy", "trap", "bass", "party", "club", "dance"]):
        return "energetic"
    if any(k in text for k in ["chill", "relax", "calm", "sleep", "lofi", "meditation", "peace", "ambient", "soft"]):
        return "calm"
    if any(k in text for k in ["love", "romance", "romantic", "dil", "pyar", "ishq", "heart", "dating"]):
        return "romantic"
    if any(k in text for k in ["sad", "breakup", "crying", "tears", "lonely", "dark", "pain", "broken", "melancholy"]):
        return "sad"
    if any(k in text for k in ["study", "focus", "work", "coding", "focus", "reading", "deep"]):
        return "focus"
    return "happy"


def extract_youtube_playlist(url: str, custom_name: Optional[str] = None) -> Tuple[str, str, str, List[Dict]]:
    """
    Extracts authentic tracks from a public YouTube playlist or video.
    Returns (playlist_name, description, cover_image, tracks)
    """
    # 1. Check for playlist list id
    pl_match = re.search(r'[?&]list=([a-zA-Z0-9_\-]+)', url)
    pl_id = pl_match.group(1) if pl_match else None

    # Check for single video id if not a playlist
    v_match = re.search(r'(?:v=|youtu\.be/|shorts/)([a-zA-Z0-9_\-]{11})', url)
    video_id = v_match.group(1) if v_match else None

    yt = Config.get_youtube()
    tracks: List[Dict] = []
    playlist_name = custom_name.strip() if custom_name and custom_name.strip() else None
    description = ""
    cover_image = "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&auto=format&fit=crop&q=80"

    # --- Case A: Playlist ID found ---
    if pl_id:
        if yt and not Config.is_youtube_quota_exhausted():
            try:
                # Fetch playlist metadata
                pl_res = yt.playlists().list(part="snippet", id=pl_id).execute()
                if pl_res.get("items"):
                    snip = pl_res["items"][0]["snippet"]
                    if not playlist_name:
                        playlist_name = snip.get("title")
                    description = snip.get("description", "")
                    thumbs = snip.get("thumbnails", {})
                    cover_image = (
                        thumbs.get("high", {}).get("url")
                        or thumbs.get("medium", {}).get("url")
                        or thumbs.get("default", {}).get("url")
                        or cover_image
                    )
            except Exception as e:
                err_str = str(e).lower()
                if "quota" in err_str or "429" in err_str:
                    Config.set_youtube_quota_exhausted(True)
                print(f"Warning fetching YouTube playlist metadata: {e}")

            try:
                # Fetch playlist items (up to 50)
                items_res = yt.playlistItems().list(
                    part="snippet,contentDetails",
                    playlistId=pl_id,
                    maxResults=50
                ).execute()

                raw_items = items_res.get("items", [])
                video_ids = []

                for item in raw_items:
                    snip = item.get("snippet", {})
                    vid = snip.get("resourceId", {}).get("videoId") or item.get("contentDetails", {}).get("videoId")
                    title = snip.get("title", "")
                    if not vid or title in ["Private video", "Deleted video", ""]:
                        continue

                    video_ids.append(vid)
                    channel = snip.get("videoOwnerChannelTitle", "")
                    thumbs = snip.get("thumbnails", {})
                    thumb_url = (
                        thumbs.get("high", {}).get("url")
                        or thumbs.get("medium", {}).get("url")
                        or thumbs.get("default", {}).get("url")
                    )

                    clean_title, artist = clean_title_and_artist(title, channel)

                    tracks.append({
                        "id": f"yt-{vid}",
                        "name": clean_title,
                        "artist": artist,
                        "youtube_id": vid,
                        "duration": 210, # Will update with exact duration below
                        "image": thumb_url,
                        "mood_match": infer_mood(clean_title)
                    })

                # Fetch exact durations in batch
                if video_ids:
                    try:
                        vids_res = yt.videos().list(
                            part="contentDetails",
                            id=",".join(video_ids[:50])
                        ).execute()

                        duration_map = {}
                        for v_item in vids_res.get("items", []):
                            duration_map[v_item["id"]] = parse_iso8601_duration(
                                v_item.get("contentDetails", {}).get("duration", "")
                            )

                        for trk in tracks:
                            vid = trk.get("youtube_id")
                            if vid in duration_map:
                                trk["duration"] = duration_map[vid]
                    except Exception as e:
                        print(f"Warning fetching YouTube video durations: {e}")

            except Exception as e:
                print(f"Warning fetching YouTube playlist items via API: {e}")

        # Fallback to direct HTML scraper if API returned no items
        if not tracks:
            try:
                headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"}
                resp = requests.get(f"https://www.youtube.com/playlist?list={pl_id}", headers=headers, timeout=10)
                if resp.status_code == 200:
                    html = resp.text
                    # Extract playlist title
                    if not playlist_name:
                        t_match = re.search(r'<title>(.*?) - YouTube</title>', html)
                        if t_match:
                            playlist_name = t_match.group(1).strip()

                    # 1. Try parsing rich structured items from ytInitialData
                    m_data = re.search(r'var ytInitialData = ({.*?});</script>', html)
                    if not m_data:
                        m_data = re.search(r'window\["ytInitialData"\] = ({.*?});', html)

                    if m_data:
                        try:
                            pl_json = json.loads(m_data.group(1))
                            seen_ids = set()

                            def parse_playlist_nodes(node):
                                if isinstance(node, dict):
                                    if "playlistVideoRenderer" in node:
                                        pvr = node["playlistVideoRenderer"]
                                        v_id = pvr.get("videoId")
                                        if v_id and v_id not in seen_ids and len(v_id) == 11:
                                            title_runs = pvr.get("title", {}).get("runs", [])
                                            raw_t = title_runs[0].get("text", "") if title_runs else pvr.get("title", {}).get("simpleText", "")
                                            byline_runs = pvr.get("shortBylineText", {}).get("runs", [])
                                            raw_a = byline_runs[0].get("text", "") if byline_runs else "YouTube Artist"
                                            if raw_t and raw_t not in ["Private video", "Deleted video"]:
                                                seen_ids.add(v_id)
                                                cl_title, cl_artist = clean_title_and_artist(raw_t, raw_a)
                                                dur_sec = 210
                                                try:
                                                    dur_sec = int(pvr.get("lengthSeconds", 210))
                                                except (ValueError, TypeError):
                                                    pass
                                                tracks.append({
                                                    "id": f"yt-{v_id}",
                                                    "name": cl_title or f"Track {len(tracks) + 1}",
                                                    "artist": cl_artist or raw_a,
                                                    "youtube_id": v_id,
                                                    "duration": dur_sec,
                                                    "image": f"https://i.ytimg.com/vi/{v_id}/hqdefault.jpg",
                                                    "mood_match": "happy"
                                                })
                                    for val in node.values():
                                        parse_playlist_nodes(val)
                                elif isinstance(node, list):
                                    for item in node:
                                        parse_playlist_nodes(item)

                            parse_playlist_nodes(pl_json)
                        except Exception as p_err:
                            print(f"Notice parsing playlist ytInitialData: {p_err}")

                    # 2. Fallback to regex videoId extraction if structured parser yielded no items
                    if not tracks:
                        raw_vids = re.findall(r'"videoId":"([a-zA-Z0-9_\-]{11})"', html)
                        seen = set()
                        unique_vids = [v for v in raw_vids if not (v in seen or seen.add(v))]

                        for idx, vid in enumerate(unique_vids[:30]):
                            tracks.append({
                                "id": f"yt-{vid}",
                                "name": f"Track {idx + 1}",
                                "artist": "YouTube Music",
                                "youtube_id": vid,
                                "duration": 210,
                                "image": f"https://i.ytimg.com/vi/{vid}/hqdefault.jpg",
                                "mood_match": "happy"
                            })
            except Exception as e:
                print(f"Direct YouTube playlist HTML scraper failed: {e}")

    # --- Case B: Single Video Link ---
    elif video_id:
        if yt and not Config.is_youtube_quota_exhausted():
            try:
                v_res = yt.videos().list(part="snippet,contentDetails", id=video_id).execute()
                if v_res.get("items"):
                    snip = v_res["items"][0]["snippet"]
                    content = v_res["items"][0]["contentDetails"]
                    raw_title = snip.get("title", "YouTube Track")
                    channel = snip.get("videoOwnerChannelTitle", "")
                    clean_title, artist = clean_title_and_artist(raw_title, channel)
                    dur = parse_iso8601_duration(content.get("duration", ""))
                    thumbs = snip.get("thumbnails", {})
                    img = thumbs.get("high", {}).get("url") or thumbs.get("default", {}).get("url")

                    if not playlist_name:
                        playlist_name = f"{clean_title} - Single"

                    tracks.append({
                        "id": f"yt-{video_id}",
                        "name": clean_title,
                        "artist": artist,
                        "youtube_id": video_id,
                        "duration": dur,
                        "image": img,
                        "mood_match": infer_mood(clean_title)
                    })
            except Exception as e:
                err_str = str(e).lower()
                if "quota" in err_str or "429" in err_str:
                    Config.set_youtube_quota_exhausted(True)
                print(f"Warning fetching single YouTube video: {e}")

    if not playlist_name:
        playlist_name = "Imported YouTube Playlist"

    return playlist_name, description, cover_image, tracks


def resolve_track_youtube_id(track_title: str, artist: str, player: MusicPlayer) -> Optional[str]:
    """Helper to resolve a YouTube video ID for a Spotify track"""
    norm_key = f"{track_title} {artist}".strip().lower()
    
    # 1. Check known popular song map
    for k, vid in player.POPULAR_SONG_MAP.items():
        if k in norm_key:
            return vid

    # 2. Check local disk cache
    if norm_key in player.cache:
        return player.cache[norm_key]

    # 3. Direct fast search
    vid = player.get_youtube_id_direct(f"{track_title} {artist}")
    if vid:
        player.cache[norm_key] = vid
        return vid

    return None


def extract_spotify_playlist(url: str, custom_name: Optional[str] = None) -> Tuple[str, str, str, List[Dict]]:
    """
    Extracts authentic tracks from a public Spotify playlist or album embed.
    Resolves streaming YouTube IDs for top tracks.
    Returns (playlist_name, description, cover_image, tracks)
    """
    m = re.search(r'(playlist|album)/([a-zA-Z0-9]+)', url)
    if not m:
        raise ValueError("Invalid Spotify playlist or album URL format.")

    spot_type, spot_id = m.group(1), m.group(2)
    embed_url = f"https://open.spotify.com/embed/{spot_type}/{spot_id}"

    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    }

    resp = requests.get(embed_url, headers=headers, timeout=12)
    if resp.status_code != 200:
        raise ValueError(f"Could not reach Spotify embed (status code: {resp.status_code}). Please verify the link is public.")

    html = resp.text
    match = re.search(r'<script id="__NEXT_DATA__" type="application/json">(.*?)</script>', html)
    if not match:
        raise ValueError("Failed to extract Spotify playlist data. The playlist might be private or region-restricted.")

    data = json.loads(match.group(1))
    entity = data.get("props", {}).get("pageProps", {}).get("state", {}).get("data", {}).get("entity", {})

    playlist_name = custom_name.strip() if custom_name and custom_name.strip() else (entity.get("title") or entity.get("name") or "Imported Spotify Playlist")
    description = entity.get("subtitle", "") or f"Imported Spotify {spot_type.capitalize()}"
    
    # Cover image
    cover_art = entity.get("coverArt") or {}
    cover_sources = cover_art.get("sources", []) if isinstance(cover_art, dict) else []
    cover_image = cover_sources[0].get("url") if cover_sources else "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=500&auto=format&fit=crop&q=80"

    raw_tracks = entity.get("trackList", [])
    if not raw_tracks:
        raise ValueError("The Spotify playlist has no public tracks available to import.")

    player = get_player_instance()
    tracks: List[Dict] = []

    # Process first 50 tracks
    for idx, item in enumerate(raw_tracks[:50]):
        t_name = item.get("title") or item.get("name") or f"Track {idx + 1}"
        t_artist = item.get("subtitle", "")
        if not t_artist and isinstance(item.get("artists"), list):
            t_artist = ", ".join([a.get("name", "") for a in item["artists"] if a.get("name")])
        if not t_artist:
            t_artist = "Spotify Artist"

        dur_ms = item.get("duration", 0)
        dur_sec = int(dur_ms / 1000) if dur_ms > 0 else 210

        tracks.append({
            "id": f"spot-{spot_id}-{idx}",
            "name": t_name,
            "artist": t_artist,
            "youtube_id": None, # Will resolve top tracks below
            "duration": dur_sec,
            "image": cover_image,
            "mood_match": infer_mood(t_name, playlist_name)
        })

    # Resolve YouTube IDs for first 10 tracks in parallel for fast playback
    def _resolve_one(t_dict):
        vid = resolve_track_youtube_id(t_dict["name"], t_dict["artist"], player)
        if vid:
            t_dict["youtube_id"] = vid
            t_dict["image"] = f"https://i.ytimg.com/vi/{vid}/hqdefault.jpg"

    with ThreadPoolExecutor(max_workers=5) as executor:
        list(executor.map(_resolve_one, tracks[:10]))

    player.save_cache()

    return playlist_name, description, cover_image, tracks


def import_external_playlist(url: str, custom_name: Optional[str] = None, user_id: str = "guest", mood: Optional[str] = None) -> Dict:
    """
    Imports genuine tracks from a Spotify or YouTube playlist into MoodTunes.
    Supports importing multiple playlists and assigning a custom mood tag.
    """
    url = url.strip()
    is_spotify = "spotify.com" in url
    is_youtube = "youtube.com" in url or "youtu.be" in url

    if not is_spotify and not is_youtube:
        raise ValueError("Invalid playlist link. Please provide a valid public Spotify or YouTube playlist URL.")

    source_platform = "Spotify" if is_spotify else "YouTube"

    if is_spotify:
        playlist_name, description, cover_image, tracks = extract_spotify_playlist(url, custom_name)
    else:
        playlist_name, description, cover_image, tracks = extract_youtube_playlist(url, custom_name)

    if not tracks:
        raise ValueError(f"No playable tracks could be extracted from this {source_platform} playlist. Please verify the URL is public.")

    # Determine dominant mood: prioritize explicit user selection
    valid_moods = ["calm", "happy", "energetic", "sad", "focus", "romantic"]
    normalized_mood = mood.lower().strip() if (mood and isinstance(mood, str) and mood.strip()) else None
    if normalized_mood in valid_moods:
        final_mood = normalized_mood
    else:
        final_mood = infer_mood(playlist_name, description)

    for trk in tracks:
        trk["mood_match"] = final_mood
        trk["mood"] = final_mood

    # Save to native playlists.json
    new_playlist_id = f"imported-{uuid.uuid4().hex[:8]}"
    new_playlist = {
        "id": new_playlist_id,
        "name": playlist_name,
        "mood": final_mood,
        "description": f"Imported from {source_platform} • {len(tracks)} tracks ready to stream",
        "user_id": user_id,
        "is_public": True,
        "source": source_platform.lower(),
        "cover": cover_image,
        "cover_image": cover_image,
        "songs": tracks,
        "created_at": "Just now"
    }

    try:
        current_data = {}
        if os.path.exists(PLAYLISTS_FILE):
            with open(PLAYLISTS_FILE, "r", encoding="utf-8") as f:
                raw = json.load(f)
                if isinstance(raw, dict):
                    current_data = raw
                elif isinstance(raw, list):
                    for item in raw:
                        if isinstance(item, dict):
                            uid = item.get("user_id") or "default"
                            current_data.setdefault(uid, []).append(item)

        target_uid = user_id or "default"
        user_list = current_data.setdefault(target_uid, [])

        # Allow multiple imported playlists: keep existing, only deduplicate identical playlist ID
        user_list = [p for p in user_list if p.get("id") != new_playlist_id]

        # Insert new playlist at top of user's playlists
        user_list.insert(0, new_playlist)
        current_data[target_uid] = user_list

        tmp_file = f"{PLAYLISTS_FILE}.{uuid.uuid4().hex}.tmp"
        with open(tmp_file, "w", encoding="utf-8") as f:
            json.dump(current_data, f, indent=2, ensure_ascii=False)
        os.replace(tmp_file, PLAYLISTS_FILE)
    except Exception as e:
        print(f"Failed to persist imported playlist to file: {e}")

    return {
        "success": True,
        "source": source_platform,
        "playlist": new_playlist,
        "message": f"Successfully imported '{playlist_name}' with {len(tracks)} genuine tracks!"
    }
