"""
Mood Detection Module
Handles facial emotion detection and mood mapping
"""
import cv2
import numpy as np
from deepface import DeepFace
from fastapi import HTTPException, UploadFile, File
from typing import Optional
from .models import MoodDetectionResponse

class MoodDetector:
    """Handles mood detection from images"""
    
    # Emotion to mood mapping
    EMOTION_TO_MOOD = {
        'happy': 'happy',
        'sad': 'sad',
        'angry': 'intense',
        'surprise': 'energetic',
        'fear': 'calm',
        'disgust': 'intense',
        'neutral': 'calm'
    }
    
    # Mood definitions
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
    
    @staticmethod
    async def detect_from_image(file: UploadFile) -> MoodDetectionResponse:
        try:
            contents = await file.read()
            nparr = np.frombuffer(contents, np.uint8)
            img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            
            if img is None:
                raise HTTPException(status_code=400, detail="Invalid image file")
            
            result = DeepFace.analyze(img, actions=['emotion'], enforce_detection=False)
            
            if isinstance(result, list):
                result = result[0]
            
            emotion = result.get('dominant_emotion', 'neutral')
            emotion_scores = result.get('emotion', {})
            confidence = float(emotion_scores.get(emotion, 0.0))
            mood = MoodDetector.EMOTION_TO_MOOD.get(emotion, 'calm')
            
            return MoodDetectionResponse(emotion=emotion, mood=mood, confidence=confidence)
            
        except HTTPException:
            raise
        except Exception as e:
            print(f"❌ Mood detection error: {e}")
            raise HTTPException(status_code=500, detail=f"Mood detection failed: {str(e)}")
    
    @staticmethod
    def validate_mood(mood: str) -> bool:
        return mood.lower() in MoodDetector.MOOD_TO_TAGS
    
    @staticmethod
    def get_mood_tags(mood: str) -> list:
        mood_lower = mood.lower()
        if mood_lower in MoodDetector.MOOD_TO_TAGS:
            return MoodDetector.MOOD_TO_TAGS[mood_lower]['tags']
        return []
    
    @staticmethod
    def get_mood_description(mood: str) -> str:
        mood_lower = mood.lower()
        if mood_lower in MoodDetector.MOOD_TO_TAGS:
            return MoodDetector.MOOD_TO_TAGS[mood_lower]['description']
        return "Unknown mood"
    
    @staticmethod
    def get_all_moods() -> dict:
        return MoodDetector.MOOD_TO_TAGS
