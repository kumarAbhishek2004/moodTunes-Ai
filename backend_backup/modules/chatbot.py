"""
Advanced Chatbot Module - With song recognition and auto-play (No lyrics search)
"""
import re
from typing import List, Dict, Optional
from .config import Config
from .models import ChatMessage
from .recommendation_engine import recommendation_engine
from fastapi import HTTPException
from datetime import datetime

class Chatbot:
    
    def __init__(self):
        self.gemini = Config.get_gemini()
        self.conversation_contexts = {}
    
    def create_context(self, current_mood: Optional[str], user_id: str) -> str:
        mood_text = f"Current mood: {current_mood}" if current_mood else "Mood: Not set"
        
        context = f"""You are MoodTunes AI, an advanced music recommendation assistant.

User: {user_id}, {mood_text}

SPECIAL ABILITIES:
1. Song Recognition: Identify songs by name or artist
2. Direct Play: When user says "play [song]", respond: PLAY: "Song Name" by Artist Name
3. Music Recommendations: Suggest songs based on mood, genre, or artist

FORMATS:
- Recommendations: "Song Name" by Artist Name
- Auto-play: PLAY: "Song Name" by Artist Name

Examples:
User: "play shape of you"
You: PLAY: "Shape of You" by Ed Sheeran

User: "recommend some Arijit Singh songs"
You: Here are some great Arijit Singh songs: "Tum Hi Ho" by Arijit Singh, "Channa Mereya" by Arijit Singh

User: "play some happy songs"
You: Here are upbeat songs: "Happy" by Pharrell Williams, "Can't Stop the Feeling" by Justin Timberlake

Be helpful and music-focused!"""
        
        return context
    
    def extract_song_recommendations(self, text: str) -> List[Dict[str, str]]:
        """Extract song recommendations from chatbot response"""
        songs = []
        pattern = r'"([^"]+)"\s+by\s+([^,\.\n]+)'
        matches = re.findall(pattern, text, re.IGNORECASE)
        
        for match in matches:
            songs.append({"name": match[0].strip(), "artist": match[1].strip()})
        
        return songs
    
    def extract_play_command(self, text: str) -> Optional[Dict[str, str]]:
        """Extract PLAY command for auto-play"""
        pattern = r'PLAY:\s*"([^"]+)"\s+by\s+([^,\.\n]+)'
        match = re.search(pattern, text, re.IGNORECASE)
        
        if match:
            return {"name": match.group(1).strip(), "artist": match.group(2).strip(), "autoplay": True}
        
        return None
    
    def build_conversation_history(self, conversation_history: List[dict], current_message: str) -> str:
        """Build conversation history"""
        history_text = ""
        
        for msg in conversation_history[-5:]:
            role = msg.get('role', 'user')
            content = msg.get('content', '')
            
            if role == 'user':
                history_text += f"\nUser: {content}"
            elif role == 'assistant':
                history_text += f"\nAssistant: {content}"
        
        history_text += f"\nUser: {current_message}"
        history_text += "\nAssistant:"
        
        return history_text
    
    async def chat(self, message: ChatMessage) -> Dict:
        """Advanced chat with song recognition and auto-play"""
        if not self.gemini:
            raise HTTPException(status_code=503, detail="Gemini AI not configured")
        
        try:
            context = self.create_context(message.current_mood, message.user_id)
            conversation = self.build_conversation_history(message.conversation_history, message.message)
            full_prompt = f"{context}\n\n{conversation}"
            
            response = self.gemini.generate_content(full_prompt)
            response_text = response.text if hasattr(response, 'text') else str(response)
            
            # Extract play command for auto-play
            play_command = self.extract_play_command(response_text)
            
            # Extract regular recommendations
            recommended_songs = self.extract_song_recommendations(response_text)
            
            # Store conversation
            if message.user_id not in self.conversation_contexts:
                self.conversation_contexts[message.user_id] = []
            
            self.conversation_contexts[message.user_id].append({
                'user': message.message,
                'assistant': response_text,
                'timestamp': datetime.now().isoformat()
            })
            
            return {
                "response": response_text,
                "timestamp": datetime.now().isoformat(),
                "mood": message.current_mood,
                "recommended_songs": recommended_songs,
                "play_command": play_command,
                "songs_count": len(recommended_songs)
            }
        
        except Exception as e:
            print(f"❌ Chatbot error: {e}")
            raise HTTPException(status_code=500, detail=f"Chatbot failed: {str(e)}")
    
    def get_conversation_context(self, user_id: str, limit: int = 10) -> List[dict]:
        """Get conversation context"""
        if user_id in self.conversation_contexts:
            return self.conversation_contexts[user_id][-limit:]
        return []
    
    def clear_conversation_context(self, user_id: str):
        """Clear conversation context"""
        if user_id in self.conversation_contexts:
            del self.conversation_contexts[user_id]

chatbot = Chatbot()
