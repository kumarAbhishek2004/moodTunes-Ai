"""
modules/mood_detection.py
Safe, lazy DeepFace wrapper + mood utilities.

- DeepFace is imported lazily (on first request) to avoid TensorFlow import-time blocking.
- DeepFace.analyze is executed in a background thread to avoid blocking the event loop.
- Provides helper methods: get_mood_tags, get_mood_description, validate_mood, get_all_moods.
"""

import cv2
import numpy as np
import asyncio
from fastapi import HTTPException, UploadFile
from typing import Dict, List

from .models import MoodDetectionResponse

# Do NOT import DeepFace at module import time (lazy load)
DeepFace = None


class MoodDetector:
    """Handles mood detection and mood <-> tag mapping."""

    EMOTION_TO_MOOD = {
        'happy': 'happy',
        'sad': 'sad',
        'angry': 'intense',
        'surprise': 'energetic',
        'fear': 'calm',
        'disgust': 'intense',
        'neutral': 'calm'
    }

    MOOD_TO_TAGS = {
        'happy': {
            'tags': ['pop', 'dance', 'happy'],
            'description': 'upbeat, positive music'
        },
        'sad': {
            'tags': ['acoustic', 'sad', 'singer-songwriter'],
            'description': 'slow, emotional music'
        },
        'energetic': {
            'tags': ['electronic', 'edm', 'party'],
            'description': 'high energy music'
        },
        'calm': {
            'tags': ['ambient', 'chill', 'lo-fi'],
            'description': 'relaxing music'
        },
        'intense': {
            'tags': ['rock', 'metal', 'punk'],
            'description': 'powerful music'
        }
    }

    # ------------------------
    # Core detection
    # ------------------------
    @staticmethod
    async def detect_from_image(file: UploadFile) -> MoodDetectionResponse:
        """
        Accepts an UploadFile, returns MoodDetectionResponse.
        DeepFace is imported lazily and analyze runs in a background thread.
        """
        global DeepFace

        # Lazy import DeepFace when needed
        if DeepFace is None:
            from deepface import DeepFace as _DF
            DeepFace = _DF

        # Read image bytes
        contents = await file.read()
        if not contents:
            raise HTTPException(status_code=400, detail="Empty image file")

        img_arr = np.frombuffer(contents, np.uint8)
        img = cv2.imdecode(img_arr, cv2.IMREAD_COLOR)
        if img is None:
            raise HTTPException(status_code=400, detail="Invalid image file")

        try:
            # Run analyze in a background thread to avoid blocking the event loop
            result = await asyncio.to_thread(
                DeepFace.analyze,
                img,
                actions=['emotion'],
                enforce_detection=False
            )

            # DeepFace may return a list or dict
            if isinstance(result, list):
                result = result[0]

            emotion = result.get("dominant_emotion", "neutral")
            emotion_scores = result.get("emotion", {}) or {}
            confidence = float(emotion_scores.get(emotion, 0.0))
            mood = MoodDetector.EMOTION_TO_MOOD.get(emotion, "calm")

            return MoodDetectionResponse(
                emotion=emotion,
                mood=mood,
                confidence=confidence
            )

        except Exception as e:
            # keep error message short for API; log full exception on stdout
            print("❌ Mood detection error:", repr(e))
            raise HTTPException(status_code=500, detail="Mood detection failed")

    # ------------------------
    # Helper methods expected by other modules
    # ------------------------
    @staticmethod
    def validate_mood(mood: str) -> bool:
        """Return True if mood is a supported mood key."""
        if not mood:
            return False
        return mood.lower() in MoodDetector.MOOD_TO_TAGS

    @staticmethod
    def get_mood_tags(mood: str) -> List[str]:
        """
        Return list of tags for a given mood.
        This is the method the recommendation_engine expects.
        """
        if not mood:
            return []
        key = mood.lower()
        data = MoodDetector.MOOD_TO_TAGS.get(key)
        if not data:
            return []
        return data.get('tags', [])

    @staticmethod
    def get_mood_description(mood: str) -> str:
        """Return a short description for the mood, if available."""
        if not mood:
            return "Unknown mood"
        key = mood.lower()
        data = MoodDetector.MOOD_TO_TAGS.get(key)
        if not data:
            return "Unknown mood"
        return data.get('description', "Unknown mood")

    @staticmethod
    def get_all_moods() -> Dict[str, Dict]:
        """Return the full mood -> data mapping."""
        return MoodDetector.MOOD_TO_TAGS
