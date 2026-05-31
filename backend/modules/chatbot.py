""" Enhanced Chatbot - Better Song Detection, Recommendations, and Playlist Support """
import os
from dotenv import load_dotenv
import google.generativeai as genai
from groq import Groq
from typing import List, Dict, Optional
import json
import re

load_dotenv()

class MusicChatbot:
    def __init__(self):
        # Initialize Gemini
        gemini_api_key = os.getenv('GEMINI_API_KEY')
        if gemini_api_key:
            genai.configure(api_key=gemini_api_key)
            self.gemini_model = genai.GenerativeModel('gemini-2.0-flash')
        else:
            self.gemini_model = None
            
        # Initialize Groq
        groq_api_key = os.getenv('GROQ_API_KEY')
        if groq_api_key:
            self.groq_client = Groq(api_key=groq_api_key)
        else:
            self.groq_client = None
            
        if not gemini_api_key and not groq_api_key:
            raise ValueError("Either GEMINI_API_KEY or GROQ_API_KEY must be found in environment variables")
        
        self.current_provider = 'gemini' if self.gemini_model else 'groq'
        self.model = self.gemini_model
        self.chat = None
        self.conversation_history: List[Dict] = []
        self.system_prompt = """You are MelodyMind, an AI music assistant that helps users find and play music.

CORE CAPABILITIES:
1. Direct Playback: When user wants to play a specific song
2. Playlist Playback: When user wants to play an entire playlist
3. Recommendations: Suggest songs based on mood, genre, or artist
4. Song Search: Find songs by lyrics, artist name, or description
5. Conversational: Engage naturally about music

RESPONSE FORMATS:

1. DIRECT PLAYBACK (user says "play X"):
   Format: [PLAY: Song Name - Artist Name]
   Example: "Sure! [PLAY: Shape of You - Ed Sheeran]"

2. PLAYLIST PLAYBACK (user says "play playlist X" or "start playlist X"):
   Format: [PLAYLIST: Playlist Name]
   Example: "Starting your [PLAYLIST: Workout Mix] playlist!"
   
   Detect phrases like:
   - "play playlist [name]"
   - "start [name] playlist"
   - "play my [name] playlist"
   - "queue [name] playlist"
   - "play [name] playlist"

3. RECOMMENDATIONS (user asks for suggestions):
   Format: [RECOMMEND: Song Name - Artist Name]
   Use multiple [RECOMMEND] tags
   Example: "Here are some upbeat songs:
   [RECOMMEND: Happy - Pharrell Williams]
   [RECOMMEND: Can't Stop the Feeling - Justin Timberlake]
   [RECOMMEND: Uptown Funk - Mark Ronson]"

4. SEARCH BY LYRICS/DESCRIPTION:
   When user provides lyrics or description, identify the song and use [PLAY] format
   Example:
   User: "Play that song about letting it go"
   You: "I think you mean [PLAY: Let It Go - Idina Menzel]"

IMPORTANT RULES:
- NEVER provide actual song lyrics (copyright)
- Always use [PLAY] for single song playback
- Always use [PLAYLIST] for playlist playback
- Always use [RECOMMEND] for multiple suggestions
- Be conversational and friendly
- If unsure about a song, ask for clarification

EXAMPLES:

User: "Play Bohemian Rhapsody"
You: "Great choice! [PLAY: Bohemian Rhapsody - Queen]"

User: "Play my Workout playlist"
You: "Starting your [PLAYLIST: Workout] playlist!"

User: "Start the Chill Vibes playlist"
You: "Loading [PLAYLIST: Chill Vibes] for you!"

User: "Play playlist Morning Energy"
You: "Sure thing! [PLAYLIST: Morning Energy]"

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
        if self.current_provider == 'gemini' and self.gemini_model:
            self.chat = self.model.start_chat(history=[])
            try:
                self.chat.send_message(self.system_prompt)
            except Exception as e:
                print(f"Warning: Could not set system prompt: {e}")
        elif self.current_provider == 'groq':
            pass  # Groq doesn't need pre-initialization

    def _switch_to_groq(self):
        """Switch to Groq when Gemini fails"""
        if not self.groq_client:
            raise Exception("Groq API not configured")
        self.current_provider = 'groq'
        print("Switched to Groq API")

    def _get_groq_response(self, user_message: str) -> str:
        """Get response from Groq"""
        messages = [{"role": "system", "content": self.system_prompt}]
        
        for msg in self.conversation_history[-10:]:
            messages.append({
                "role": msg["role"] if msg["role"] == "user" else "assistant",
                "content": msg["content"]
            })
        
        messages.append({"role": "user", "content": user_message})
        
        response = self.groq_client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=messages,
            temperature=0.7,
            max_tokens=1024
        )
        
        return response.choices[0].message.content

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

    def extract_playlist_command(self, response: str) -> Optional[str]:
        """
        Extract PLAYLIST command from response
        Format: [PLAYLIST: Playlist Name]
        Returns: playlist name or None
        """
        pattern = r'\[PLAYLIST:\s*([^\]]+?)\s*\]'
        match = re.search(pattern, response)
        if match:
            return match.group(1).strip()
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
        Enhanced chat with better song detection and playlist support
        """
        try:
            # Try Gemini first
            if self.current_provider == 'gemini' and self.chat:
                try:
                    response = self.chat.send_message(user_message)
                    bot_response = response.text
                except Exception as e:
                    error_msg = str(e).lower()
                    if any(keyword in error_msg for keyword in ['quota', 'limit', 'rate', '429', 'resource_exhausted']):
                        if self.groq_client:
                            self._switch_to_groq()
                            bot_response = self._get_groq_response(user_message)
                        else:
                            raise Exception("Gemini limit reached and Groq not configured")
                    else:
                        raise e
            # Use Groq
            elif self.current_provider == 'groq' and self.groq_client:
                bot_response = self._get_groq_response(user_message)
            else:
                raise Exception("No API provider available")

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

            # Check for PLAYLIST command
            playlist_name = self.extract_playlist_command(bot_response)

            # Extract recommendations
            recommendations = self.extract_recommendations(bot_response)

            # Clean display text
            display_text = bot_response
            display_text = re.sub(r'\[PLAY:[^\]]+\]', '', display_text)
            display_text = re.sub(r'\[PLAYLIST:[^\]]+\]', '', display_text)
            display_text = re.sub(r'\[RECOMMEND:[^\]]+\]', '', display_text)
            display_text = re.sub(r'\n\s*\n+', '\n\n', display_text).strip()

            return {
                "response": display_text,
                "play_command": play_command,  # For direct playback
                "playlist_name": playlist_name,  # For playlist playback
                "recommended_songs": recommendations,  # For song buttons
                "has_play_command": play_command is not None,
                "has_playlist_command": playlist_name is not None,
                "has_recommendations": len(recommendations) > 0
            }

        except Exception as e:
            print(f"Chatbot error: {e}")
            return {
                "response": "I apologize, but I'm having trouble right now. Please try again.",
                "play_command": None,
                "playlist_name": None,
                "recommended_songs": [],
                "has_play_command": False,
                "has_playlist_command": False,
                "has_recommendations": False,
                "error": str(e)
            }

    def detect_intent(self, message: str) -> str:
        """
        Detect user intent from message
        Returns: 'play', 'playlist', 'recommend', 'search', or 'chat'
        """
        message_lower = message.lower()
        
        # Playlist intent (check first as it's more specific)
        if any(word in message_lower for word in ['playlist', 'play my', 'start my', 'queue my']):
            if any(word in message_lower for word in ['playlist', 'play list']):
                return 'playlist'
        
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