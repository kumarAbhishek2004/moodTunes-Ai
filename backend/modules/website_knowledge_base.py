"""
Website Knowledge Base & Vector Retrieval Engine (RAG)
Provides complete knowledge of MoodTunes AI features, how-tos, pages,
sleep timer, voice assistant, rotary dial, vinyl player, playlists, and FAQs.
Uses high-dimensional TF-IDF vector embeddings and cosine similarity search
for instant, reliable semantic knowledge retrieval.
"""
import os
import json
import re
from typing import List, Dict, Optional, Tuple
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")
KNOWLEDGE_STORE_FILE = os.path.join(DATA_DIR, "website_knowledge.json")

# Master Knowledge Chunks covering EVERY aspect of the website
DEFAULT_KNOWLEDGE_CHUNKS = [
    {
        "id": "sleep_timer",
        "title": "Sleep Timer (Fade-Out Mode)",
        "category": "player",
        "keywords": [
            "sleep mode", "sleep timer", "timer", "bedtime", "fade out", "turn off automatically",
            "auto stop", "night mode", "falling asleep", "how to use sleep mode", "sllep mode", "sleep"
        ],
        "content": (
            "How to use Sleep Timer (Fade-Out Mode) on MoodTunes AI:\n"
            "1. Where to find it: Open the music player or vinyl turntable, and click the Moon icon (🌙) "
            "labeled 'Timer' / 'Sleep Timer' in the top header. You can also trigger it hands-free by saying "
            "'Hey Abhi, set sleep timer for 30 minutes'.\n"
            "2. Timer Options: You can select preset durations of 15 minutes, 30 minutes, 45 minutes, 60 minutes, "
            "or 'End of Current Track' (which automatically stops playback as soon as the active song completes).\n"
            "3. Gentle Fade-Out Mode: Unlike standard apps that abruptly cut audio, MoodTunes AI enters Fade-Out Mode "
            "during the final 15 seconds. The volume smoothly and linearly scales down to 0% so you drift off to sleep peacefully.\n"
            "4. Management: The active remaining time (e.g. '18m') displays in the header. To cancel or adjust, click the moon icon "
            "and choose 'Cancel Timer'."
        )
    },
    {
        "id": "voice_dj",
        "title": "Hands-Free Voice DJ ('Hey Abhi')",
        "category": "voice_control",
        "keywords": [
            "hey abhi", "voice dj", "voice assistant", "voice command", "voice control", "hands free",
            "mic", "microphone", "speech", "abhi", "voice search", "assistant", "voice"
        ],
        "content": (
            "How to use the Hands-Free Voice DJ ('Hey Abhi') on MoodTunes AI:\n"
            "1. Activation: The Voice DJ runs continuous listening in the background. Simply speak 'Hey Abhi' or 'Abhi' near your microphone.\n"
            "2. Audio Feedback: You will hear a pleasant Siri-style rising major chord chime (C5-E5-G5), and a glowing voice aura card appears.\n"
            "3. Spoken Commands:\n"
            "   - Play a Song: Say 'Hey Abhi, play Not Like You' or 'play Kesariya'. It searches your saved playlists and database.\n"
            "   - Play from Playlist: Say 'Hey Abhi, play Not Like You from my playlist' or 'play my rap playlist'.\n"
            "   - Playback Controls: Say 'pause', 'resume', 'skip song', 'play next', 'previous', 'mute', 'unmute', or 'shuffle'.\n"
            "   - Volume Control: Say 'set volume to 80', 'volume up', or 'louder'.\n"
            "   - Sleep Timer: Say 'set sleep timer for 25 minutes'.\n"
            "   - Vibe Card: Say 'share vibe card' to pop open your shareable canvas graphic.\n"
            "4. Concise Spoken Responses: Voice DJ answers with ultra-concise voice synthesis (e.g., 'Playing.', 'Paused.', 'Muted.')."
        )
    },
    {
        "id": "rotary_mood_dial",
        "title": "360° Rotary Mood Dial & Stream Curation",
        "category": "navigation",
        "keywords": [
            "rotary dial", "mood dial", "dial", "wheel", "tuner", "mood selector", "curate stream",
            "knob", "mood wheel", "change mood", "analog tuner", "moods"
        ],
        "content": (
            "How to use the 360° Rotary Mood Dial:\n"
            "1. What it is: A physical-inspired analog rotary tuner located on the Home Page and Stream Page.\n"
            "2. How to operate: Click and drag the circular dial with your mouse or touch, or tap any of the 6 mood markers around the wheel.\n"
            "3. The 6 Atmospheric Moods:\n"
            "   - Romantic (Neon Pink): Warm soulful harmonies, tender acoustic strings, and intimate melodies.\n"
            "   - Calm (Cyan): Spiritual acoustic harmonics, delta-theta frequencies, and soothing parasympathetic relaxation.\n"
            "   - Focus (Emerald Green): Lo-fi beats, binaural ambient textures, and distraction-free study rhythms.\n"
            "   - Energetic (Fiery Orange): 140+ BPM trap, rock, and punchy 808 sub-bass calibrated for workouts and adrenaline.\n"
            "   - Happy (Golden Amber): Bright major progressions, joyful brass, and upbeat pop radiating optimism.\n"
            "   - Sad / Reflective (Sapphire Blue): Minor-key piano arpeggios, poignant cello lines, and cathartic midnight melodies.\n"
            "4. Curate Stream: Clicking 'Curate Stream' navigates directly to the AI Recommendations engine to build your personalized stream."
        )
    },
    {
        "id": "face_detection",
        "title": "Facial Emotion Recognition (Webcam AI)",
        "category": "detection",
        "keywords": [
            "face detection", "camera", "webcam", "facial emotion", "detect mood with face", "facial scan",
            "expression", "smile", "privacy", "camera security", "deepface", "emotion scan"
        ],
        "content": (
            "How Face Emotion Detection works on MoodTunes AI:\n"
            "1. How to use: Go to 'Detect Mood' in navigation or click 'Detect Mood with Face'. Allow camera permissions.\n"
            "2. Real-Time Scan: The neural model analyzes facial action units (smile curvature, eyebrow tension, eye openness) "
            "to classify your expression into Happy, Calm, Sad, Romantic, Focus, or Energetic.\n"
            "3. Strict Privacy: Camera frames are processed strictly in-memory and immediately destroyed. No pictures, videos, "
            "or facial biometric data are ever saved to disk or transmitted to third parties."
        )
    },
    {
        "id": "voice_tone_analysis",
        "title": "Acoustic Voice Tone Analysis",
        "category": "detection",
        "keywords": [
            "voice tone", "acoustic analysis", "mic tone", "speech analysis", "detect mood with voice",
            "voice pitch", "cadence", "tone analysis"
        ],
        "content": (
            "How Acoustic Voice Tone Analysis works:\n"
            "1. How to use: On the Home Page or Detect Mood page, click 'Analyze Voice Tone' and speak naturally for 5 seconds about your day.\n"
            "2. Neural Extraction: Web Audio API extracts your Root Mean Square (RMS) volume energy, zero-crossing pitch frequency, and speech tempo.\n"
            "3. Emotion Mapping: Rapid tempo with high energy indicates Energetic; steady pitch and relaxed cadence indicates Calm; gentle acoustic warmth indicates Romantic."
        )
    },
    {
        "id": "text_scene_synthesis",
        "title": "Text & Scene Narrative Mood Synthesis",
        "category": "detection",
        "keywords": [
            "text mood", "type mood", "scene input", "describe mood", "narrative", "type scene",
            "write mood", "text detection"
        ],
        "content": (
            "How to Type Any Scene or Narrative on MoodTunes AI:\n"
            "1. How to use: Click 'Type your mood / scene' on the Home Page.\n"
            "2. Free-Form Language: Type any sentence describing what you are doing (e.g., 'Late night coding with coffee in the rain', 'Heavy deadlifts at the gym', 'Lazy Sunday morning acoustic relaxation').\n"
            "3. Multi-Class Emotion: Natural Language Processing translates the semantic feeling and energy into an emotional vibe and curates your queue."
        )
    },
    {
        "id": "vinyl_turntable",
        "title": "12\" Studio Vinyl Turntable vs 1080p Video Mode",
        "category": "player",
        "keywords": [
            "vinyl", "turntable", "vinyl wheel", "record player", "vinyl disc", "tonearm",
            "video mode", "watch video", "music video", "1080p", "player", "music player"
        ],
        "content": (
            "The Vinyl Turntable Studio and Video Mode:\n"
            "1. 12\" Spinning Vinyl Record: Clicking any track launches the Fullscreen Vinyl Turntable. Features an authentic rotating 33⅓ RPM vinyl disc with realistic concentric grooves and a mechanical tonearm that smoothly drops onto the record when music plays.\n"
            "2. Dynamic Halo Glow: The turntable's ambient glow morphs dynamically to match the color temperature and genre of the playing song.\n"
            "3. 1080p HD Music Video Mode: Click '🎬 Watch Video' in the player to toggle instantly to the official high-definition music video without interrupting audio.\n"
            "4. Quick Toggle: Switch between '🎵 Vinyl Disc' and '🎬 Video' with a single click."
        )
    },
    {
        "id": "playlists_and_queue",
        "title": "Custom Mood Playlists & Drag-and-Drop Queue",
        "category": "playlists",
        "keywords": [
            "playlist", "playlists", "queue", "drag and drop", "reorder songs", "add song",
            "create playlist", "play next", "shuffle queue", "manage playlist", "delete playlist"
        ],
        "content": (
            "How to manage Playlists and Queue on MoodTunes AI:\n"
            "1. Playlists Page (/playlists): Create custom playlists with custom names and mood tags (e.g. 'Chill Beats', 'Workout Rap').\n"
            "2. Adding Songs: Click the '+' / 'Add to Playlist' button on any track across Home, Discover, Recommendations, or Search.\n"
            "3. Spotify-Style Drag & Drop: Grab the 6-dot handle (⠿) on any song row in your playlist or recommendations and drag it up or down to reorder tracks.\n"
            "4. '⚡ Next' Instant Scheduling: Click '⚡ Next' on any track to immediately prioritize it as the very next song to play.\n"
            "5. Sliding Queue Drawer: Click 'View Queue' in the player dock to view, shuffle upcoming tracks, or clear upcoming songs.\n"
            "6. Cloud & Local Sync: Playlists sync with MongoDB Atlas and are dual-mirrored to local storage so they are never lost."
        )
    },
    {
        "id": "recommendations_and_explainable_ai",
        "title": "Personalized Recommendations & Explainable AI",
        "category": "recommendations",
        "keywords": [
            "recommendations", "curate stream", "explainable ai", "why recommended", "ai reasoning",
            "recommendation engine", "history", "playback history", "badges"
        ],
        "content": (
            "How Recommendations & Explainable AI work on MoodTunes AI:\n"
            "1. Recommendations Page (/recommendations): Automatically lands on the AI Recommendations Stream with balanced track quotas matching your active mood and preferences.\n"
            "2. Explainable AI Badges: Every recommended track includes a distinct green badge explaining exactly why it was chosen (e.g., '140+ BPM cadence and punchy 808 sub-bass engineered for peak motivational momentum').\n"
            "3. Playback History Tab: Click the '🎧 Playback History (20/20)' tab to inspect your past 20 actively played songs, complete with timestamps and reasoning.\n"
            "4. Instant Play: Clicking any song spins the vinyl wheel and starts playing audio immediately."
        )
    },
    {
        "id": "vibe_card",
        "title": "Shareable Vibe Card (Social Export)",
        "category": "social",
        "keywords": [
            "vibe card", "share vibe", "export card", "share song", "social card", "download card", "share"
        ],
        "content": (
            "How to create and share a Vibe Card on MoodTunes AI:\n"
            "1. What it is: A beautiful, high-resolution aesthetic poster generated via HTML5 Canvas showcasing the song you are currently listening to.\n"
            "2. How to open: In the player, click 'Share Vibe' or use voice command 'Hey Abhi, share vibe card'.\n"
            "3. Contents: Displays album artwork, song title, artist, mood frequency badge (e.g., 'ROMANTIC 240°'), Explainable AI reasoning, and a MoodTunes AI brand stamp.\n"
            "4. Exporting: Click 'Download Image' to save a crystal-clear PNG ready for Instagram Stories, WhatsApp, or Twitter."
        )
    },
    {
        "id": "keyboard_shortcuts",
        "title": "Global Keyboard Shortcuts",
        "category": "navigation",
        "keywords": [
            "keyboard shortcuts", "shortcuts", "hotkeys", "keybinds", "space play", "mute shortcut", "keys"
        ],
        "content": (
            "Global Keyboard Shortcuts on MoodTunes AI:\n"
            "- Space: Play / Pause audio playback\n"
            "- M: Toggle Mute / Unmute\n"
            "- N: Skip to Next song in queue\n"
            "- P: Go back to Previous song\n"
            "- S: Toggle Shuffle mode\n"
            "- R: Cycle Repeat mode (Off -> Repeat All -> Repeat One)\n"
            "- ↑ (Up Arrow): Increase volume by 5%\n"
            "- ↓ (Down Arrow): Decrease volume by 5%\n"
            "- ?: Open the Keyboard Shortcuts Help dialog"
        )
    },
    {
        "id": "accounts_and_guest_mode",
        "title": "Guest Mode vs Free Member Account",
        "category": "accounts",
        "keywords": [
            "guest mode", "guest", "account", "login", "signup", "register", "features difference",
            "free account", "benefits of login"
        ],
        "content": (
            "Guest Mode vs Logged-In Account on MoodTunes AI:\n"
            "1. Guest Mode: Anyone can freely use MoodTunes AI as a Guest without logging in! Guests have complete access to webcam emotion detection, voice analysis, rotary mood dial, streaming all songs, vinyl turntable player, queue drag-and-drop, and the AI chatbot.\n"
            "2. Free Member Account: Logging in with a free account unlocks saving custom mood playlists, synchronizing your saved playlists across multiple devices, and maintaining your personal 20-track listening history."
        )
    },
    {
        "id": "smart_mood_elevation",
        "title": "Smart Mood Elevation (AI DJ Mode)",
        "category": "ai_features",
        "keywords": [
            "mood elevation", "smart elevation", "ai dj", "elevate mood", "mood transition", "feel better"
        ],
        "content": (
            "Smart Mood Elevation (AI DJ Mode):\n"
            "When enabled in the player, MoodTunes AI monitors your listening trajectory. If you start in a low-energy or sad state, the AI DJ subtly elevates song tempos and positive harmonic scales over the course of 3 to 4 songs to gently lift your emotional state towards calm relaxation and upbeat happiness."
        )
    }
]

class WebsiteKnowledgeBase:
    """
    Vector Knowledge Base (RAG) for MoodTunes AI.
    Scrapes website knowledge, indexes into a TF-IDF vector database,
    and returns top-k semantic matches for any user question.
    """
    def __init__(self):
        self.chunks: List[Dict] = []
        self.vectorizer: Optional[TfidfVectorizer] = None
        self.vector_matrix = None
        self._initialize()

    def _initialize(self):
        """Loads chunks from local store or seeds default chunks and fits vector index"""
        self.chunks = self._load_chunks()
        self._build_vector_index()

    def _load_chunks(self) -> List[Dict]:
        os.makedirs(DATA_DIR, exist_ok=True)
        if os.path.exists(KNOWLEDGE_STORE_FILE):
            try:
                with open(KNOWLEDGE_STORE_FILE, "r", encoding="utf-8") as f:
                    stored = json.load(f)
                    if isinstance(stored, list) and len(stored) > 0:
                        return stored
            except Exception:
                pass
        
        # Save default seed
        self._save_chunks(DEFAULT_KNOWLEDGE_CHUNKS)
        return DEFAULT_KNOWLEDGE_CHUNKS

    def _save_chunks(self, chunks: List[Dict]):
        try:
            with open(KNOWLEDGE_STORE_FILE, "w", encoding="utf-8") as f:
                json.dump(chunks, f, indent=2, ensure_ascii=False)
        except Exception as e:
            print(f"Error saving knowledge store: {e}")

    def _build_vector_index(self):
        """Builds high-dimensional n-gram TF-IDF vector matrix for cosine similarity"""
        if not self.chunks:
            return

        corpus = []
        for c in self.chunks:
            text = (
                f"{c.get('title', '')} "
                f"{' '.join(c.get('keywords', []))} "
                f"{c.get('content', '')}"
            )
            corpus.append(text)

        self.vectorizer = TfidfVectorizer(
            ngram_range=(1, 3),
            sublinear_tf=True,
            stop_words='english'
        )
        self.vector_matrix = self.vectorizer.fit_transform(corpus)
        print(f"🧠 Website Vector Knowledge Base indexed ({len(self.chunks)} topics)")

    def retrieve(self, query: str, top_k: int = 2, min_similarity: float = 0.08) -> List[Tuple[Dict, float]]:
        """
        Retrieves the top-k most semantically relevant knowledge chunks for a query.
        Returns list of (chunk_dict, similarity_score).
        """
        if not query or not query.strip() or self.vectorizer is None or self.vector_matrix is None:
            return []

        # Clean query
        clean_q = re.sub(r'[^\w\s]', ' ', query.lower()).strip()
        if not clean_q:
            return []

        q_vec = self.vectorizer.transform([clean_q])
        similarities = cosine_similarity(q_vec, self.vector_matrix)[0]

        top_indices = np.argsort(similarities)[::-1][:top_k]
        results = []

        for idx in top_indices:
            score = float(similarities[idx])
            if score >= min_similarity:
                results.append((self.chunks[idx], score))

        return results

    def format_rag_context(self, query: str) -> Optional[str]:
        """
        Formats top knowledge chunks into a clean prompt context block for the LLM.
        Returns None if query is purely musical (e.g. 'play kesariya') without website questions.
        """
        # Exclude pure play commands
        q_lower = query.lower().strip()
        if re.match(r'^(?:play|start|stream)\s+[\w\s\-]+$', q_lower) and not any(
            k in q_lower for k in ["sleep", "how", "what", "where", "mode", "dial", "vibe", "queue", "playlist", "guest", "shortcut", "face", "voice", "camera", "timer"]
        ):
            return None

        results = self.retrieve(query, top_k=2, min_similarity=0.08)
        if not results:
            return None

        context_lines = [
            "PLATFORM & WEBSITE KNOWLEDGE (MOODTUNES AI):",
            "--------------------------------------------------"
        ]
        for chunk, score in results:
            context_lines.append(f"Topic: {chunk['title']}")
            context_lines.append(chunk['content'])
            context_lines.append("--------------------------------------------------")

        context_lines.append(
            "CRITICAL RESPONSE GUIDELINES:\n"
            "- Give a concise, summarized answer in 2 to 4 crisp bullet points.\n"
            "- Do NOT write long essays, giant multi-step manuals, or markdown tables.\n"
            "- Keep it manageable, punchy, and immediately readable at a glance.\n"
            "- Be direct and friendly."
        )

        return "\n".join(context_lines)

# Global singleton
knowledge_base = WebsiteKnowledgeBase()
