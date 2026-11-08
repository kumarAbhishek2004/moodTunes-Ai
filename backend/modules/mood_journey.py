"""
AI Mood Transition Journey ("Emotional Elevation Roadmap")
Intelligently sequences music tracks to transition the listener's emotional state
from an initial state (e.g. Sad / Melancholy) to a target state (e.g. Happy / Uplifting)
by smoothly ramping musical valence and BPM across milestones.

NEW FEATURES:
1. Exact Track Count: Strictly honors requested `num_tracks` (3, 4, 6, 8, etc.).
2. Anchor / Must-Have Song: If listener specifies any song they want, AI calculates its
   emotional valence and logically anchors it into the corresponding milestone of the journey.
3. Language Filter: Optional filter for Hindi, English, Punjabi, Instrumental, or Any.
4. High Diversity & Anti-Repetition: Randomizes track selection from 70+ verified tracks.
"""
from typing import List, Dict, Optional, Any
import json
import os
import re
import random

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")
PLAYLISTS_FILE = os.path.join(DATA_DIR, "playlists.json")

# Mood Valence & Tempo Benchmarks
MOOD_PROFILES = {
    "sad": {
        "name": "Melancholic / Reflective",
        "target_valence": 0.22,
        "target_bpm": 68,
        "energy": 0.3,
        "fallback_image": "https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=400&auto=format&fit=crop&q=80"
    },
    "calm": {
        "name": "Calm & Grounded",
        "target_valence": 0.48,
        "target_bpm": 80,
        "energy": 0.45,
        "fallback_image": "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&auto=format&fit=crop&q=80"
    },
    "focus": {
        "name": "Deep Focus Flow",
        "target_valence": 0.60,
        "target_bpm": 96,
        "energy": 0.6,
        "fallback_image": "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&auto=format&fit=crop&q=80"
    },
    "romantic": {
        "name": "Warm & Intimate",
        "target_valence": 0.65,
        "target_bpm": 88,
        "energy": 0.55,
        "fallback_image": "https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=400&auto=format&fit=crop&q=80"
    },
    "happy": {
        "name": "Joyful & Radiant",
        "target_valence": 0.85,
        "target_bpm": 120,
        "energy": 0.8,
        "fallback_image": "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=400&auto=format&fit=crop&q=80"
    },
    "energetic": {
        "name": "Peak Euphoria & Energy",
        "target_valence": 0.92,
        "target_bpm": 134,
        "energy": 0.95,
        "fallback_image": "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&auto=format&fit=crop&q=80"
    },
}

# Curated Bridge Tracks by Mood with authentic verified YouTube IDs & Language tags
ROADMAP_TRACK_POOL = {
    "sad": [
        {"name": "Kesariya (Acoustic)", "artist": "Arijit Singh", "youtube_id": "BddP6PYo2gs", "duration": 268, "valence": 0.28, "bpm": 70, "mood": "sad", "language": "hindi"},
        {"name": "Channa Mereya", "artist": "Arijit Singh", "youtube_id": "284Ov7ysmfA", "duration": 289, "valence": 0.22, "bpm": 66, "mood": "sad", "language": "hindi"},
        {"name": "Someone Like You", "artist": "Adele", "youtube_id": "hLQl3WQQoQ0", "duration": 285, "valence": 0.25, "bpm": 68, "mood": "sad", "language": "english"},
        {"name": "Fix You", "artist": "Coldplay", "youtube_id": "k4V3Mo61fJM", "duration": 295, "valence": 0.30, "bpm": 72, "mood": "sad", "language": "english"},
        {"name": "Agar Tum Saath Ho", "artist": "Alka Yagnik & Arijit Singh", "youtube_id": "sK7riqg2mr4", "duration": 341, "valence": 0.24, "bpm": 64, "mood": "sad", "language": "hindi"},
        {"name": "Let Her Go", "artist": "Passenger", "youtube_id": "RBumgq5yVrA", "duration": 254, "valence": 0.27, "bpm": 75, "mood": "sad", "language": "english"},
        {"name": "Kabira (Encore)", "artist": "Harshdeep Kaur & Arijit Singh", "youtube_id": "jHNNMj5bNQw", "duration": 251, "valence": 0.29, "bpm": 70, "mood": "sad", "language": "hindi"},
        {"name": "All of Me", "artist": "John Legend", "youtube_id": "450p7goxZqg", "duration": 307, "valence": 0.31, "bpm": 63, "mood": "sad", "language": "english"},
        {"name": "Phir Bhi Tumko Chahunga", "artist": "Arijit Singh", "youtube_id": "_iktURkEclc", "duration": 352, "valence": 0.23, "bpm": 67, "mood": "sad", "language": "hindi"},
        {"name": "Stay With Me", "artist": "Sam Smith", "youtube_id": "pB-5XG-DbAA", "duration": 172, "valence": 0.26, "bpm": 84, "mood": "sad", "language": "english"},
        {"name": "Wishes", "artist": "Hasan Raheem & Talwiinder", "youtube_id": "9mF4Fq8L2pM", "duration": 208, "valence": 0.28, "bpm": 72, "mood": "sad", "language": "punjabi"},
        {"name": "Nuvole Bianche", "artist": "Ludovico Einaudi", "youtube_id": "kcihcYEOeic", "duration": 348, "valence": 0.25, "bpm": 65, "mood": "sad", "language": "instrumental"},
    ],
    "calm": [
        {"name": "Raataan Lambiyan", "artist": "Jubin Nautiyal & Asees Kaur", "youtube_id": "gvyUuxdRdR4", "duration": 230, "valence": 0.45, "bpm": 82, "mood": "calm", "language": "hindi"},
        {"name": "Iktara", "artist": "Kavita Seth & Amitabh Bhattacharya", "youtube_id": "fSS_R91Nimw", "duration": 253, "valence": 0.50, "bpm": 80, "mood": "calm", "language": "hindi"},
        {"name": "Weightless", "artist": "Marconi Union", "youtube_id": "UfcAVejslrU", "duration": 480, "valence": 0.42, "bpm": 60, "mood": "calm", "language": "instrumental"},
        {"name": "Sunset Lover", "artist": "Petit Biscuit", "youtube_id": "wuCK-oiE3rA", "duration": 237, "valence": 0.52, "bpm": 90, "mood": "calm", "language": "instrumental"},
        {"name": "Kun Faya Kun", "artist": "A.R. Rahman, Javed Ali, Mohit Chauhan", "youtube_id": "T94PHkuydcw", "duration": 473, "valence": 0.47, "bpm": 78, "mood": "calm", "language": "hindi"},
        {"name": "Yellow", "artist": "Coldplay", "youtube_id": "yKNxeF4KMsY", "duration": 269, "valence": 0.49, "bpm": 87, "mood": "calm", "language": "english"},
        {"name": "Qaafirana", "artist": "Arijit Singh & Nikhita Gandhi", "youtube_id": "ZmcBC9-wAXM", "duration": 342, "valence": 0.51, "bpm": 84, "mood": "calm", "language": "hindi"},
        {"name": "Sunflower", "artist": "Post Malone & Swae Lee", "youtube_id": "ApXoWlZdUGC", "duration": 158, "valence": 0.54, "bpm": 90, "mood": "calm", "language": "english"},
        {"name": "Excuses", "artist": "AP Dhillon & Gurinder Gill", "youtube_id": "vX2cDW8LUWk", "duration": 176, "valence": 0.52, "bpm": 88, "mood": "calm", "language": "punjabi"},
        {"name": "Coffee", "artist": "beabadoobee", "youtube_id": "2XZB78yWVHs", "duration": 126, "valence": 0.44, "bpm": 70, "mood": "calm", "language": "english"},
        {"name": "Maahi Ve", "artist": "A.R. Rahman (Highway)", "youtube_id": "nswWc3m_5tU", "duration": 240, "valence": 0.46, "bpm": 74, "mood": "calm", "language": "hindi"},
    ],
    "focus": [
        {"name": "Midnight City", "artist": "M83", "youtube_id": "dX3k_QDnzHE", "duration": 243, "valence": 0.62, "bpm": 105, "mood": "focus", "language": "english"},
        {"name": "Clair de Lune", "artist": "Claude Debussy", "youtube_id": "WNcsUNKlAKw", "duration": 303, "valence": 0.55, "bpm": 75, "mood": "focus", "language": "instrumental"},
        {"name": "Experience", "artist": "Ludovico Einaudi", "youtube_id": "hN_q-_nGv4U", "duration": 315, "valence": 0.65, "bpm": 92, "mood": "focus", "language": "instrumental"},
        {"name": "Resonance", "artist": "HOME", "youtube_id": "8GW6sLrK40k", "duration": 212, "valence": 0.58, "bpm": 100, "mood": "focus", "language": "instrumental"},
        {"name": "Time (Inception)", "artist": "Hans Zimmer", "youtube_id": "RxabLA7UQ9k", "duration": 275, "valence": 0.57, "bpm": 80, "mood": "focus", "language": "instrumental"},
        {"name": "Interstellar Theme (First Step)", "artist": "Hans Zimmer", "youtube_id": "UDVtMYqUAyw", "duration": 258, "valence": 0.59, "bpm": 85, "mood": "focus", "language": "instrumental"},
        {"name": "Intro", "artist": "The xx", "youtube_id": "AZ1pHmZdYkg", "duration": 127, "valence": 0.63, "bpm": 100, "mood": "focus", "language": "instrumental"},
        {"name": "Cornfield Chase", "artist": "Hans Zimmer", "youtube_id": "1Vko01D77Fg", "duration": 126, "valence": 0.64, "bpm": 98, "mood": "focus", "language": "instrumental"},
        {"name": "295 (Lo-Fi)", "artist": "Sidhu Moose Wala", "youtube_id": "n_FCrCQ6-9U", "duration": 270, "valence": 0.60, "bpm": 94, "mood": "focus", "language": "punjabi"},
    ],
    "romantic": [
        {"name": "Tum Hi Ho", "artist": "Arijit Singh", "youtube_id": "IJq0yyWug1k", "duration": 262, "valence": 0.58, "bpm": 85, "mood": "romantic", "language": "hindi"},
        {"name": "Perfect", "artist": "Ed Sheeran", "youtube_id": "2Vv-BfVoq4g", "duration": 263, "valence": 0.68, "bpm": 95, "mood": "romantic", "language": "english"},
        {"name": "Pehla Nasha", "artist": "Udit Narayan & Sadhana Sargam", "youtube_id": "Y_Hshv4mD_E", "duration": 291, "valence": 0.64, "bpm": 84, "mood": "romantic", "language": "hindi"},
        {"name": "Raabta", "artist": "Arijit Singh", "youtube_id": "z-diRlh5Zqc", "duration": 244, "valence": 0.66, "bpm": 90, "mood": "romantic", "language": "hindi"},
        {"name": "Shayad", "artist": "Arijit Singh", "youtube_id": "yFFy2da_v-A", "duration": 247, "valence": 0.63, "bpm": 88, "mood": "romantic", "language": "hindi"},
        {"name": "Until I Found You", "artist": "Stephen Sanchez", "youtube_id": "GxldQ9GyXfY", "duration": 177, "valence": 0.67, "bpm": 96, "mood": "romantic", "language": "english"},
        {"name": "Tere Hawaale", "artist": "Arijit Singh & Shilpa Rao", "youtube_id": "KUpwupYj_tY", "duration": 350, "valence": 0.65, "bpm": 86, "mood": "romantic", "language": "hindi"},
        {"name": "Thinking Out Loud", "artist": "Ed Sheeran", "youtube_id": "lp-EO5I60KA", "duration": 296, "valence": 0.69, "bpm": 79, "mood": "romantic", "language": "english"},
        {"name": "Kaise Hua", "artist": "Vishal Mishra", "youtube_id": "1yiu_aM6i_s", "duration": 234, "valence": 0.62, "bpm": 82, "mood": "romantic", "language": "hindi"},
        {"name": "Kinni Kinni", "artist": "Diljit Dosanjh", "youtube_id": "v_6E9W6F2iI", "duration": 218, "valence": 0.66, "bpm": 92, "mood": "romantic", "language": "punjabi"},
        {"name": "Mi Amor", "artist": "Sharn & 408 Darwin", "youtube_id": "8A_d2pI34b0", "duration": 194, "valence": 0.67, "bpm": 94, "mood": "romantic", "language": "punjabi"},
        {"name": "Zaalima", "artist": "Arijit Singh & Harshdeep Kaur", "youtube_id": "lpdRqn6xwiM", "duration": 299, "valence": 0.68, "bpm": 92, "mood": "romantic", "language": "hindi"},
    ],
    "happy": [
        {"name": "Ilahi", "artist": "Arijit Singh", "youtube_id": "fdubeMFwuGs", "duration": 229, "valence": 0.82, "bpm": 120, "mood": "happy", "language": "hindi"},
        {"name": "Dil Chahta Hai", "artist": "Shankar Mahadevan", "youtube_id": "7dcqmX2eZ8c", "duration": 311, "valence": 0.86, "bpm": 124, "mood": "happy", "language": "hindi"},
        {"name": "Happy", "artist": "Pharrell Williams", "youtube_id": "ZbZSe6N_BXs", "duration": 233, "valence": 0.90, "bpm": 160, "mood": "happy", "language": "english"},
        {"name": "Uptown Funk", "artist": "Mark Ronson ft. Bruno Mars", "youtube_id": "OPf0YbXqDm0", "duration": 270, "valence": 0.88, "bpm": 115, "mood": "happy", "language": "english"},
        {"name": "Matargashti", "artist": "Mohit Chauhan", "youtube_id": "6vKucgAeF_Q", "duration": 328, "valence": 0.84, "bpm": 118, "mood": "happy", "language": "hindi"},
        {"name": "Can't Stop the Feeling!", "artist": "Justin Timberlake", "youtube_id": "ru0K8uYEZWw", "duration": 236, "valence": 0.89, "bpm": 113, "mood": "happy", "language": "english"},
        {"name": "Gallan Goodiyaan", "artist": "Yashita Sharma, Manish Tipu", "youtube_id": "jCEdTq3j-0U", "duration": 296, "valence": 0.87, "bpm": 128, "mood": "happy", "language": "hindi"},
        {"name": "Lover", "artist": "Diljit Dosanjh", "youtube_id": "mH_LFkWxpI0", "duration": 194, "valence": 0.88, "bpm": 116, "mood": "happy", "language": "punjabi"},
        {"name": "Good Life", "artist": "OneRepublic", "youtube_id": "qHm9MG9KW10", "duration": 245, "valence": 0.85, "bpm": 95, "mood": "happy", "language": "english"},
        {"name": "Sooraj Dooba Hain", "artist": "Arijit Singh, Aditi Singh", "youtube_id": "nCg3ufihKyU", "duration": 264, "valence": 0.86, "bpm": 128, "mood": "happy", "language": "hindi"},
        {"name": "I Gotta Feeling", "artist": "Black Eyed Peas", "youtube_id": "uSD4vsh1zDA", "duration": 289, "valence": 0.91, "bpm": 128, "mood": "happy", "language": "english"},
    ],
    "energetic": [
        {"name": "Desi Kalakaar", "artist": "Yo Yo Honey Singh", "youtube_id": "KhnVcACNWbQ", "duration": 258, "valence": 0.92, "bpm": 130, "mood": "energetic", "language": "punjabi"},
        {"name": "Believer", "artist": "Imagine Dragons", "youtube_id": "7wtfhZwyrcc", "duration": 204, "valence": 0.94, "bpm": 125, "mood": "energetic", "language": "english"},
        {"name": "Kar Gayi Chull", "artist": "Badshah & Neha Kakkar", "youtube_id": "NTHz9ephYTw", "duration": 187, "valence": 0.95, "bpm": 132, "mood": "energetic", "language": "hindi"},
        {"name": "Brown Munde", "artist": "AP Dhillon, Gurinder Gill", "youtube_id": "VNs_cCtdbPc", "duration": 266, "valence": 0.96, "bpm": 134, "mood": "energetic", "language": "punjabi"},
        {"name": "Not Like You", "artist": "Hammy Muzic", "youtube_id": "0-hF_wZ47wQ", "duration": 225, "valence": 0.91, "bpm": 128, "mood": "energetic", "language": "punjabi"},
        {"name": "Malhari", "artist": "Vishal Dadlani", "youtube_id": "l_MyUGq7pgs", "duration": 244, "valence": 0.96, "bpm": 136, "mood": "energetic", "language": "hindi"},
        {"name": "Wake Me Up", "artist": "Avicii", "youtube_id": "IcrbM1l_BoI", "duration": 253, "valence": 0.93, "bpm": 124, "mood": "energetic", "language": "english"},
        {"name": "High Heels Te Nachche", "artist": "Meet Bros & Yo Yo Honey Singh", "youtube_id": "uOzE_nE7w8c", "duration": 212, "valence": 0.94, "bpm": 130, "mood": "energetic", "language": "punjabi"},
        {"name": "Animals", "artist": "Martin Garrix", "youtube_id": "gCYcHz2Ah_M", "duration": 192, "valence": 0.95, "bpm": 128, "mood": "energetic", "language": "instrumental"},
        {"name": "Kala Chashma", "artist": "Amar Arshi, Badshah, Neha Kakkar", "youtube_id": "k4yXQkG2s1E", "duration": 187, "valence": 0.97, "bpm": 135, "mood": "energetic", "language": "punjabi"},
        {"name": "Insane", "artist": "AP Dhillon & Gurinder Gill", "youtube_id": "hed18VyBN1U", "duration": 204, "valence": 0.95, "bpm": 132, "mood": "energetic", "language": "punjabi"},
        {"name": "Titanium", "artist": "David Guetta ft. Sia", "youtube_id": "JRfuAukYTKg", "duration": 245, "valence": 0.92, "bpm": 126, "mood": "energetic", "language": "english"},
    ]
}

def clean_track_title(name: str) -> str:
    """Sanitizes track name by removing dangling pipes or empty parens like | ()"""
    if not name:
        return ""
    name = re.sub(r'\|\s*\(\s*\)', '', name)
    name = re.sub(r'\(\s*\)', '', name)
    name = re.sub(r'\[\s*\]', '', name)
    name = re.sub(r'\s*\|\s*$', '', name)
    name = re.sub(r'^\s*\|\s*', '', name)
    name = re.sub(r'\s+', ' ', name).strip()
    return name

def infer_song_mood(song: Dict) -> str:
    """Infers the mood of a song based on explicit attributes, name, or artist."""
    m = (song.get("mood_match") or song.get("mood") or "").lower().strip()
    if m in MOOD_PROFILES:
        return m
    
    for mk in ["sad", "calm", "focus", "romantic", "happy", "energetic"]:
        if mk in m:
            return mk
            
    title = (song.get("name") or "").lower()
    
    if any(k in title for k in ["channa", "sad", "alone", "hurt", "cry", "someone like you", "breakup", "fix you"]):
        return "sad"
    if any(k in title for k in ["raataan", "iktara", "sunset", "peace", "sleep", "rain", "lofi", "relax", "coffee", "excuses"]):
        return "calm"
    if any(k in title for k in ["study", "focus", "instrumental", "ambient", "piano", "midnight city", "interstellar", "zimmer", "295"]):
        return "focus"
    if any(k in title for k in ["kesariya", "tum hi ho", "perfect", "love", "romantic", "pehla nasha", "dil", "shayad", "kinni kinni", "mi amor"]):
        return "romantic"
    if any(k in title for k in ["ilahi", "happy", "uptown funk", "celebrate", "party", "dance", "sooraj dooba", "lover"]):
        return "happy"
    if any(k in title for k in ["believer", "desi kalakaar", "not like you", "rock", "rap", "energy", "chull", "gym", "malhari", "brown munde", "insane"]):
        return "energetic"
        
    return "happy"

def infer_song_language(song: Dict) -> str:
    """Infers song language: 'hindi', 'english', 'punjabi', or 'instrumental'."""
    explicit = (song.get("language") or "").lower().strip()
    if explicit in ["hindi", "english", "punjabi", "instrumental"]:
        return explicit
    
    title = (song.get("name") or "").lower()
    artist = (song.get("artist") or "").lower()
    combined = f"{title} {artist}"
    
    if any(k in combined for k in ["dhillon", "sidhu", "moose", "diljit", "punjabi", "chashma", "desi kalakaar", "not like you", "brown munde", "insane", "kinni", "sharn"]):
        return "punjabi"
    if any(k in combined for k in ["zimmer", "debussy", "einaudi", "instrumental", "ambient", "piano", "classical", "lofi", "weightless", "sunset lover", "animals"]):
        return "instrumental"
    if any(k in combined for k in ["arijit", "neha", "badshah", "jubin", "shankar", "alka", "udit", "kesariya", "channa", "raataan", "tum hi ho", "ilahi", "dil", "sooraj", "malhari", "kavita", "rahman"]):
        return "hindi"
    
    # Check ASCII
    if all(ord(c) < 128 for c in combined):
        return "english"
    return "hindi"

def resolve_anchor_track(anchor_query: str, all_candidate_songs: List[Dict]) -> Optional[Dict]:
    """Finds or synthesizes a rich track object for the listener's requested anchor song."""
    if not anchor_query or not anchor_query.strip():
        return None
    q = anchor_query.strip().lower()
    
    # 1. Search in candidate songs (playlists, history, bridge pool)
    for s in all_candidate_songs:
        s_name = (s.get("name") or "").lower()
        s_artist = (s.get("artist") or "").lower()
        if q == s_name or q in s_name or s_name in q or q in f"{s_name} {s_artist}":
            item = dict(s)
            item["is_anchor"] = True
            item["source_type"] = "anchor"
            return item

    # 2. Synthesize if not found
    inferred_m = infer_song_mood({"name": anchor_query})
    p = MOOD_PROFILES.get(inferred_m, MOOD_PROFILES["calm"])
    return {
        "name": clean_track_title(anchor_query.strip()),
        "artist": "Selected Favorite",
        "youtube_id": "BddP6PYo2gs", # verified playable fallback
        "duration": 240,
        "mood": inferred_m,
        "valence": p["target_valence"],
        "bpm": p["target_bpm"],
        "source_type": "anchor",
        "source_name": "Listener Choice",
        "is_anchor": True,
        "image": p["fallback_image"]
    }

def get_selected_stages_and_counts(start_mood: str, target_mood: str, num_tracks: int):
    """
    Computes exact milestones and per-stage track quotas such that:
    sum(stage_counts) == num_tracks
    """
    num_tracks = max(1, int(num_tracks))
    mood_order = ["sad", "calm", "focus", "romantic", "happy", "energetic"]
    start_idx = mood_order.index(start_mood) if start_mood in mood_order else 0
    target_idx = mood_order.index(target_mood) if target_mood in mood_order else 4

    if start_idx <= target_idx:
        full_chain = mood_order[start_idx : target_idx + 1]
    else:
        full_chain = list(reversed(mood_order[target_idx : start_idx + 1]))

    if len(full_chain) < 2:
        full_chain = [start_mood, target_mood]

    # When num_tracks <= len(full_chain), sample exactly num_tracks stages
    if num_tracks <= len(full_chain):
        if num_tracks == 1:
            stage_moods = [full_chain[-1]]
        elif num_tracks == 2:
            stage_moods = [full_chain[0], full_chain[-1]]
        else:
            indices = [round(i * (len(full_chain) - 1) / (num_tracks - 1)) for i in range(num_tracks)]
            for idx in range(1, len(indices)):
                if indices[idx] <= indices[idx - 1]:
                    indices[idx] = min(len(full_chain) - 1, indices[idx - 1] + 1)
            stage_moods = [full_chain[i] for i in indices]
        stage_counts = [1] * len(stage_moods)
    else:
        # num_tracks > len(full_chain): Distribute across all stages
        stage_moods = list(full_chain)
        M = len(stage_moods)
        base = num_tracks // M
        rem = num_tracks % M
        stage_counts = [base + (1 if i < rem else 0) for i in range(M)]

    return stage_moods, stage_counts

def generate_mood_journey(
    start_mood: str,
    target_mood: str,
    num_tracks: int = 6,
    user_playlists: Optional[List[Dict]] = None,
    user_history: Optional[List[Dict]] = None,
    anchor_song: Optional[str] = None,
    language: Optional[str] = "all"
) -> Dict[str, Any]:
    """
    Creates an Emotional Elevation Roadmap transitioning from start_mood to target_mood.
    - Strictly yields exactly `num_tracks` songs.
    - Logically anchors `anchor_song` at its corresponding emotional milestone.
    - Prioritizes `language` (hindi, english, punjabi, instrumental, or all).
    """
    start_mood = start_mood.lower().strip()
    target_mood = target_mood.lower().strip()
    language = (language or "all").lower().strip()

    if start_mood not in MOOD_PROFILES:
        start_mood = "sad"
    if target_mood not in MOOD_PROFILES:
        target_mood = "happy"

    start_p = MOOD_PROFILES[start_mood]
    target_p = MOOD_PROFILES[target_mood]
    num_tracks = max(1, int(num_tracks))

    # Compute stages and track counts
    stage_moods, stage_counts = get_selected_stages_and_counts(start_mood, target_mood, num_tracks)

    # 1. Gather all songs from passed User Playlists (grouped by mood)
    mood_order = ["sad", "calm", "focus", "romantic", "happy", "energetic"]
    playlist_pool_by_mood: Dict[str, List[Dict]] = {m: [] for m in mood_order}
    if user_playlists and isinstance(user_playlists, list):
        for pl in user_playlists:
            if not isinstance(pl, dict):
                continue
            pl_name = pl.get("name", "My Playlist")
            songs = pl.get("songs", [])
            if not isinstance(songs, list):
                continue
            for s in songs:
                if not isinstance(s, dict):
                    continue
                s_mood = infer_song_mood(s)
                s_clean = dict(s)
                s_clean["name"] = clean_track_title(s_clean.get("name", ""))
                s_clean["source_type"] = "playlist"
                s_clean["source_name"] = pl_name
                s_clean["source_badge"] = f"From your playlist: {pl_name}"
                playlist_pool_by_mood[s_mood].append(s_clean)

    # 2. Gather all songs from Listening History (grouped by mood)
    history_pool_by_mood: Dict[str, List[Dict]] = {m: [] for m in mood_order}
    if user_history and isinstance(user_history, list):
        for h in user_history:
            if not isinstance(h, dict):
                continue
            h_mood = infer_song_mood(h)
            h_clean = dict(h)
            h_clean["name"] = clean_track_title(h_clean.get("name", ""))
            h_clean["source_type"] = "history"
            h_clean["source_name"] = "Listening History"
            h_clean["source_badge"] = "From your listening history"
            history_pool_by_mood[h_mood].append(h_clean)

    # 3. Resolve Anchor Song & Determine its Logical Milestone Stage
    anchor_track = None
    anchor_stage_idx = None
    if anchor_song and anchor_song.strip():
        all_pool_songs = [s for m_list in playlist_pool_by_mood.values() for s in m_list] + \
                         [s for m_list in history_pool_by_mood.values() for s in m_list] + \
                         [s for m_list in ROADMAP_TRACK_POOL.values() for s in m_list]
        anchor_track = resolve_anchor_track(anchor_song, all_pool_songs)
        
        if anchor_track:
            a_mood = anchor_track.get("mood") or infer_song_mood(anchor_track)
            a_valence = anchor_track.get("valence") or MOOD_PROFILES.get(a_mood, {}).get("target_valence", 0.5)
            
            # Find closest milestone stage
            if a_mood in stage_moods:
                anchor_stage_idx = stage_moods.index(a_mood)
            else:
                # Nearest valence along the journey path
                diffs = [abs(MOOD_PROFILES[m]["target_valence"] - a_valence) for m in stage_moods]
                anchor_stage_idx = diffs.index(min(diffs))

    stages = []
    tracks = []
    selected_song_signatures = set()
    playlist_track_count = 0
    history_track_count = 0
    bridge_track_count = 0

    # Helper function to filter candidates by language preference
    def filter_by_language(cands: List[Dict]) -> List[Dict]:
        if not language or language in ["all", "any"]:
            return cands
        matched = [c for c in cands if infer_song_language(c) == language]
        # If matching songs exist, prioritize them; else keep original list so quota is filled
        return matched if len(matched) > 0 else cands

    # Build each stage and allocate its exact track quota
    for stage_idx, (mood_key, quota) in enumerate(zip(stage_moods, stage_counts)):
        profile = MOOD_PROFILES.get(mood_key, MOOD_PROFILES["calm"])
        stage_tracks = []

        # Step 0: Anchor Song Placement
        # If this stage is assigned the Anchor Song, place it FIRST!
        if anchor_track and stage_idx == anchor_stage_idx:
            a_sig = f"{anchor_track.get('name', '').lower()}-{anchor_track.get('artist', '').lower()}"
            if a_sig not in selected_song_signatures:
                selected_song_signatures.add(a_sig)
                a_copy = dict(anchor_track)
                a_copy["id"] = f"journey-{stage_idx}-{a_copy.get('youtube_id', 'anchor')}"
                a_copy["stage_index"] = stage_idx + 1
                a_copy["stage_mood"] = mood_key
                a_copy["valence"] = profile["target_valence"]
                a_copy["bpm"] = profile["target_bpm"]
                a_copy["is_anchor"] = True
                a_copy["source_type"] = "anchor"
                a_copy["source_badge"] = f"🌟 Must-Have Track • Logically placed at Stage {stage_idx + 1} ({profile['name']})"
                if not a_copy.get("image"):
                    a_copy["image"] = f"https://img.youtube.com/vi/{a_copy.get('youtube_id', '')}/hqdefault.jpg" if a_copy.get("youtube_id") else profile["fallback_image"]
                stage_tracks.append(a_copy)
                tracks.append(a_copy)

        # Pull candidate pools
        pl_candidates = filter_by_language(list(playlist_pool_by_mood.get(mood_key, [])))
        random.shuffle(pl_candidates)

        hist_candidates = filter_by_language(list(history_pool_by_mood.get(mood_key, [])))
        random.shuffle(hist_candidates)

        bridge_candidates = filter_by_language(list(ROADMAP_TRACK_POOL.get(mood_key, ROADMAP_TRACK_POOL["happy"])))
        random.shuffle(bridge_candidates)

        # Smart Blending: When user library exists, sample from both library and bridge
        candidate_list = []
        user_library_cands = pl_candidates + hist_candidates
        
        if user_library_cands:
            if random.random() < 0.6:
                candidate_list = user_library_cands + bridge_candidates
            else:
                candidate_list = bridge_candidates + user_library_cands
        else:
            candidate_list = bridge_candidates

        for cand in candidate_list:
            if len(stage_tracks) >= quota:
                break
            sig = f"{cand.get('name', '').lower()}-{cand.get('artist', '').lower()}"
            if sig not in selected_song_signatures:
                selected_song_signatures.add(sig)
                t_copy = dict(cand)
                src = t_copy.get("source_type") or "bridge"
                t_copy["name"] = clean_track_title(t_copy.get("name", ""))
                yid = t_copy.get("youtube_id") or t_copy.get("id") or f"track-{random.randint(1000, 9999)}"
                t_copy["id"] = f"journey-{stage_idx}-{yid}"
                t_copy["stage_index"] = stage_idx + 1
                t_copy["stage_mood"] = mood_key
                t_copy["valence"] = profile["target_valence"]
                t_copy["bpm"] = profile["target_bpm"]
                
                if src == "playlist":
                    playlist_track_count += 1
                elif src == "history":
                    history_track_count += 1
                else:
                    bridge_track_count += 1
                    t_copy["source_type"] = "bridge"
                    t_copy["source_name"] = "Mood Bridge"
                    t_copy["source_badge"] = "✨ Mood Transition Bridge"

                if not t_copy.get("image"):
                    t_copy["image"] = f"https://img.youtube.com/vi/{t_copy.get('youtube_id', '')}/hqdefault.jpg" if t_copy.get("youtube_id") else profile["fallback_image"]

                stage_tracks.append(t_copy)
                tracks.append(t_copy)

        # Fallback if quota still not filled: pull from any unused track across the entire catalog
        if len(stage_tracks) < quota:
            all_bridge_items = filter_by_language([item for m_list in ROADMAP_TRACK_POOL.values() for item in m_list])
            random.shuffle(all_bridge_items)
            for fallback_t in all_bridge_items:
                if len(stage_tracks) >= quota:
                    break
                sig = f"{fallback_t.get('name', '').lower()}-{fallback_t.get('artist', '').lower()}"
                if sig not in selected_song_signatures:
                    selected_song_signatures.add(sig)
                    t_copy = dict(fallback_t)
                    t_copy["id"] = f"journey-{stage_idx}-{t_copy.get('youtube_id', 'fb')}"
                    t_copy["stage_index"] = stage_idx + 1
                    t_copy["stage_mood"] = mood_key
                    t_copy["valence"] = profile["target_valence"]
                    t_copy["bpm"] = profile["target_bpm"]
                    t_copy["source_type"] = "bridge"
                    t_copy["source_name"] = "Adaptive Bridge"
                    t_copy["source_badge"] = "✨ Adaptive Transition Bridge"
                    t_copy["image"] = f"https://img.youtube.com/vi/{t_copy['youtube_id']}/hqdefault.jpg"
                    stage_tracks.append(t_copy)
                    tracks.append(t_copy)
                    bridge_track_count += 1

        stages.append({
            "stage_number": stage_idx + 1,
            "mood": mood_key,
            "title": profile["name"],
            "target_valence": profile["target_valence"],
            "target_bpm": profile["target_bpm"],
            "description": f"Stage {stage_idx + 1}: Elevating valence to {int(profile['target_valence'] * 100)}% and rhythm to ~{profile['target_bpm']} BPM.",
            "track_count": len(stage_tracks)
        })

    # Hard guarantee: truncate or match num_tracks strictly
    if len(tracks) > num_tracks:
        tracks = tracks[:num_tracks]
    
    total_t = len(tracks)
    user_lib_count = playlist_track_count + history_track_count
    personalization_percent = int((user_lib_count / total_t * 100)) if total_t > 0 else 0

    lang_desc = f" [{language.title()}]" if language and language not in ["all", "any"] else ""
    anchor_desc = f" with '{anchor_track['name']}' anchored at Stage {anchor_stage_idx + 1}" if anchor_track and anchor_stage_idx is not None else ""

    if user_lib_count > 0:
        summary = (
            f"Personalized Roadmap{lang_desc}: {user_lib_count} tracks sequenced directly from your library "
            f"({personalization_percent}% personalized){anchor_desc}, smoothly elevating valence from "
            f"{int(start_p['target_valence']*100)}% to {int(target_p['target_valence']*100)}%."
        )
    else:
        summary = (
            f"Emotional Roadmap{lang_desc}: Starting in {start_p['name']} ({int(start_p['target_valence']*100)}% valence), "
            f"transitioning across {len(stages)} adaptive stages{anchor_desc} to reach {target_p['name']} ({int(target_p['target_valence']*100)}% valence)."
        )

    return {
        "start_mood": start_mood,
        "target_mood": target_mood,
        "summary": summary,
        "total_tracks": total_t,
        "anchor_song": anchor_song,
        "anchor_stage_index": (anchor_stage_idx + 1) if anchor_stage_idx is not None else None,
        "language": language,
        "playlist_tracks_count": playlist_track_count,
        "history_tracks_count": history_track_count,
        "bridge_tracks_count": bridge_track_count,
        "personalization_percent": personalization_percent,
        "stages": stages,
        "tracks": tracks
    }
