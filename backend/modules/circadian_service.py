"""
Circadian & Context-Aware Smart Moods Engine
Blends the listener's local time of day with their emotional state
to deliver circadian-optimized listening recommendations.
"""
from datetime import datetime
from typing import Dict, List

CIRCADIAN_SEGMENTS = [
    {
        "id": "morning",
        "start_hour": 5,
        "end_hour": 11,
        "title": "Sunlit Awakening",
        "suggested_mood": "happy",
        "secondary_mood": "calm",
        "bpm_range": "95 - 118 BPM",
        "description": "Gentle acoustic indie, refreshing melodies, and uplifting morning vitality.",
        "icon": "🌅",
        "theme_accent": "#F59E0B",
        "genres": ["Acoustic", "Indie Folk", "Morning Acoustic", "Upbeat Pop"]
    },
    {
        "id": "afternoon",
        "start_hour": 11,
        "end_hour": 17,
        "title": "Deep Focus Flow",
        "suggested_mood": "focus",
        "secondary_mood": "calm",
        "bpm_range": "75 - 90 BPM",
        "description": "Lo-Fi productivity beats, instrumental chillhop, and smooth ambient flow.",
        "icon": "⚡",
        "theme_accent": "#10B981",
        "genres": ["Lo-Fi Beats", "Chillhop", "Ambient Instrumental", "Modern Classical"]
    },
    {
        "id": "evening",
        "start_hour": 17,
        "end_hour": 22,
        "title": "Sunset Golden Hour",
        "suggested_mood": "romantic",
        "secondary_mood": "energetic",
        "bpm_range": "100 - 124 BPM",
        "description": "Warm R&B harmonies, soulful melodic grooves, and twilight indie vibes.",
        "icon": "🌆",
        "theme_accent": "#EC4899",
        "genres": ["R&B", "Soulful Grooves", "Melodic Indie", "Chillwave"]
    },
    {
        "id": "night",
        "start_hour": 22,
        "end_hour": 5,
        "title": "Midnight Dreamscape",
        "suggested_mood": "calm",
        "secondary_mood": "sad",
        "bpm_range": "60 - 75 BPM",
        "description": "Nocturnal ambient, dreamy downtempo, and serene sleep-prep frequencies.",
        "icon": "🌙",
        "theme_accent": "#00F2FE",
        "genres": ["Midnight Ambient", "Downtempo", "Dream Pop", "Acoustic Ballads"]
    }
]

def get_circadian_recommendation(user_hour: int = None, detected_face_mood: str = None) -> Dict:
    """
    Computes the circadian segment based on user's current hour (0-23)
    and blends with their detected emotional valence.
    """
    if user_hour is None:
        user_hour = datetime.now().hour

    user_hour = max(0, min(23, user_hour))

    active_segment = CIRCADIAN_SEGMENTS[3] # default night
    for seg in CIRCADIAN_SEGMENTS:
        s_start = seg["start_hour"]
        s_end = seg["end_hour"]
        if s_start < s_end:
            if s_start <= user_hour < s_end:
                active_segment = seg
                break
        else: # wraps around midnight (e.g. 22 to 5)
            if user_hour >= s_start or user_hour < s_end:
                active_segment = seg
                break

    # Blend with face emotion if provided
    final_mood = active_segment["suggested_mood"]
    blend_note = ""
    if detected_face_mood:
        detected = detected_face_mood.lower().strip()
        if detected in ["sad", "tired", "stressed"]:
            final_mood = "calm"
            blend_note = f"Detected {detected.capitalize()} mood blended with {active_segment['title']} to offer soothing equilibrium."
        elif detected in ["energetic", "excited"]:
            final_mood = "energetic"
            blend_note = f"High enthusiasm detected; elevated tempo harmonized with {active_segment['title']}."

    return {
        "current_hour": user_hour,
        "segment_id": active_segment["id"],
        "title": active_segment["title"],
        "icon": active_segment["icon"],
        "suggested_mood": final_mood,
        "base_mood": active_segment["suggested_mood"],
        "secondary_mood": active_segment["secondary_mood"],
        "bpm_range": active_segment["bpm_range"],
        "description": active_segment["description"],
        "theme_accent": active_segment["theme_accent"],
        "genres": active_segment["genres"],
        "blend_note": blend_note
    }
