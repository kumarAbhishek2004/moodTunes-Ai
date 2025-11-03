"""
Enhanced Chatbot - Better Song Detection and Recommendations
"""
import os
from dotenv import load_dotenv
import google.generativeai as genai
from typing import List, Dict, Optional
import json
import re

load_dotenv()

class MusicChatbot:
    def __init__(self):
        api_key = os.getenv('GEMINI_API_KEY')
        if not api_key:
            raise ValueError("GEMINI_API_KEY not found in environment variables")
        
        genai.configure(api_key=api_key)
        self.model = genai.GenerativeModel('gemini-2.0-flash-exp')
        self.chat = None
        self.conversation_history: List[Dict] = []
        
        self.system_prompt = """You are MelodyMind, an AI music assistant that helps users find and play music.

CORE CAPABILITIES:
1. Direct Playback: When user wants to play a specific song
2. Recommendations: Suggest songs based on mood, genre, or artist
3. Song Search: Find songs by lyrics, artist name, or description
4. Conversational: Engage naturally about music

RESPONSE FORMATS:

1. DIRECT PLAYBACK (user says "play X"):
   Format: [PLAY: Song Name - Artist Name]
   Example: "Sure! [PLAY: Shape of You - Ed Sheeran]"

2. RECOMMENDATIONS (user asks for suggestions):
   Format: [RECOMMEND: Song Name - Artist Name]
   Use multiple [RECOMMEND] tags
   Example: 
   "Here are some upbeat songs:
   [RECOMMEND: Happy - Pharrell Williams]
   [RECOMMEND: Can't Stop the Feeling - Justin Timberlake]
   [RECOMMEND: Uptown Funk - Mark Ronson]"

3. SEARCH BY LYRICS/DESCRIPTION:
   When user provides lyrics or description, identify the song and use [PLAY] format
   Example: User: "Play that song about letting it go"
   You: "I think you mean [PLAY: Let It Go - Idina Menzel]"

IMPORTANT RULES:
- NEVER provide actual song lyrics (copyright)
- Always use [PLAY] for single song playback
- Always use [RECOMMEND] for multiple suggestions
- Be conversational and friendly
- If unsure about a song, ask for clarification

EXAMPLES:

User: "Play Bohemian Rhapsody"
You: "Great choice! [PLAY: Bohemian Rhapsody - Queen]"

User: "I want something energetic for workout"
You: "Here are some high-energy workout songs:
[RECOMMEND: Eye of the Tiger - Survivor]
[RECOMMEND: Lose Yourself - Eminem]
[RECOMMEND: Thunder - Imagine Dragons]"

User: "Play that song that goes I'm walking on sunshine"
You: "I think you're looking for [PLAY: Walking on Sunshine - Katrina and the Waves]"

User: "Recommend some Coldplay songs"
You: "Here are some great Coldplay tracks:
[RECOMMEND: Yellow - Coldplay]
[RECOMMEND: Viva la Vida - Coldplay]
[RECOMMEND: Fix You - Coldplay]"

User: "Songs by Taylor Swift"
You: "Here are popular Taylor Swift songs:
[RECOMMEND: Shake It Off - Taylor Swift]
[RECOMMEND: Blank Space - Taylor Swift]
[RECOMMEND: Anti-Hero - Taylor Swift]"

Remember: Be helpful, friendly, and music-focused!"""
        
        self._initialize_chat()
    
    def _initialize_chat(self):
        """Initialize Gemini chat with system prompt"""
        self.chat = self.model.start_chat(history=[])
        try:
            self.chat.send_message(self.system_prompt)
        except Exception as e:
            print(f"Warning: Could not set system prompt: {e}")
    
    def extract_play_command(self, response: str) -> Optional[Dict[str, str]]:
        """
        Extract PLAY command from response
        Format: [PLAY: Song Name - Artist Name]
        Returns: {"name": str, "artist": str, "autoplay": True} or None
        """
        pattern = r'\[PLAY:\s*([^\-]+?)\s*-\s*([^\]]+?)\s*\]'
        match = re.search(pattern, response)
        
        if match:
            return {
                "name": match.group(1).strip(),
                "artist": match.group(2).strip(),
                "autoplay": True
            }
        return None
    
    def extract_recommendations(self, response: str) -> List[Dict[str, str]]:
        """
        Extract RECOMMEND commands from response
        Format: [RECOMMEND: Song Name - Artist Name]
        """
        songs = []
        pattern = r'\[RECOMMEND:\s*([^\-]+?)\s*-\s*([^\]]+?)\s*\]'
        matches = re.findall(pattern, response)
        
        for match in matches:
            songs.append({
                "name": match[0].strip(),
                "artist": match[1].strip()
            })
        
        return songs
    
    def chat_with_user(self, user_message: str) -> Dict:
        """
        Enhanced chat with better song detection
        """
        try:
            # Send to Gemini
            response = self.chat.send_message(user_message)
            bot_response = response.text
            
            # Add to history
            self.conversation_history.append({
                "role": "user",
                "content": user_message
            })
            self.conversation_history.append({
                "role": "assistant",
                "content": bot_response
            })
            
            # Check for PLAY command (direct playback)
            play_command = self.extract_play_command(bot_response)
            
            # Extract recommendations
            recommendations = self.extract_recommendations(bot_response)
            
            # Clean display text
            display_text = bot_response
            display_text = re.sub(r'\[PLAY:[^\]]+\]', '', display_text)
            display_text = re.sub(r'\[RECOMMEND:[^\]]+\]', '', display_text)
            display_text = re.sub(r'\n\s*\n+', '\n\n', display_text).strip()
            
            return {
                "response": display_text,
                "play_command": play_command,  # For direct playback
                "recommended_songs": recommendations,  # For song buttons
                "has_play_command": play_command is not None,
                "has_recommendations": len(recommendations) > 0
            }
        
        except Exception as e:
            print(f"Chatbot error: {e}")
            return {
                "response": "I apologize, but I'm having trouble right now. Please try again.",
                "play_command": None,
                "recommended_songs": [],
                "has_play_command": False,
                "has_recommendations": False,
                "error": str(e)
            }
    
    def detect_intent(self, message: str) -> str:
        """
        Detect user intent from message
        Returns: 'play', 'recommend', 'search', or 'chat'
        """
        message_lower = message.lower()
        
        # Play intent
        if any(word in message_lower for word in ['play ', 'listen to', 'put on']):
            return 'play'
        
        # Recommend intent
        if any(word in message_lower for word in ['recommend', 'suggest', 'songs by', 'similar to']):
            return 'recommend'
        
        # Search by lyrics/description
        if any(word in message_lower for word in ['that song', 'goes like', 'lyrics']):
            return 'search'
        
        return 'chat'
    
    def reset_conversation(self):
        """Reset conversation history"""
        self.conversation_history = []
        self._initialize_chat()
        return {"message": "Conversation reset successfully"}

# Global instance
chatbot = MusicChatbot()