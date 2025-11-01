# 🎵 MoodTunes AI - Intelligent Music Recommendation System

<div align="center">

![MoodTunes AI](https://img.shields.io/badge/MoodTunes-AI-purple?style=for-the-badge)
![Python](https://img.shields.io/badge/Python-3.8+-blue?style=for-the-badge&logo=python)
![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react)
![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-009688?style=for-the-badge&logo=fastapi)


**An AI-powered music recommendation system that analyzes your mood through facial recognition and delivers personalized playlists**

[Demo](#-how-to-use) • [Features](#-key-features) • [Installation](#-quick-start) • [Architecture](#-system-architecture) • [API Docs](#-api-endpoints)

</div>

---

## 🎯 About The Project

MoodTunes AI is a full-stack web application that combines artificial intelligence, facial emotion recognition, and intelligent music recommendation algorithms to create personalized playlists based on your current emotional state. Using advanced APIs from Last.fm, YouTube, Google Gemini, and DeepGram, it delivers a seamless music discovery experience.

### 🎤 Intelligent Voice-Controlled Chatbot

The heart of MoodTunes AI is its **conversational AI chatbot** powered by Google Gemini, featuring:

- **🎵 Voice-Activated Music Control**: Simply say "Play Kesariya" and watch it play instantly
- **🎙️ Natural Language Commands**: 
  - "Recommend songs by Arijit Singh for a romantic mood"
  - "Play some happy Bollywood music"
  - "Find songs similar to Tum Hi Ho"
- **🔍 Smart Song Search**: Built-in search feature to discover and add songs to your favorites
- **💬 Conversational Recommendations**: Chat naturally to get personalized music suggestions
- **🎭 Mood-Based Discovery**: Ask for songs matching any emotion and get instant results

### Why MoodTunes AI?

- 🎭 **Real-time Mood Detection**: Advanced facial recognition understands your emotions
- 🎼 **Smart Recommendations**: Intelligent 4-category distribution algorithm
- 🌍 **Bilingual Support**: Enjoy both Hindi Bollywood and English Pop music
- 🤖 **Voice-Controlled Chatbot**: Play and discover music through natural conversation
- 🔍 **Integrated Search**: Find any song instantly with the search feature
- 🎨 **Beautiful Interface**: Modern, responsive design with stunning animations

---

## 🛠️ Tech Stack

### Backend Technologies

<div align="center">

| Technology | Purpose | Version |
|------------|---------|---------|
| ![Python](https://img.shields.io/badge/Python-3776AB?style=flat&logo=python&logoColor=white) | Core Language | 3.8+ |
| ![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=flat&logo=fastapi&logoColor=white) | Web Framework | 0.100+ |
| ![Uvicorn](https://img.shields.io/badge/Uvicorn-499848?style=flat&logo=gunicorn&logoColor=white) | ASGI Server | Latest |
| ![Last.fm](https://img.shields.io/badge/Last.fm-D51007?style=flat&logo=last.fm&logoColor=white) | Music Metadata | API v2 |
| ![YouTube](https://img.shields.io/badge/YouTube-FF0000?style=flat&logo=youtube&logoColor=white) | Video Playback | Data API v3 |
| ![Google Gemini](https://img.shields.io/badge/Gemini-4285F4?style=flat&logo=google&logoColor=white) | AI Chatbot | Pro Model |
| ![DeepFace](https://img.shields.io/badge/DeepFace-FF6B6B?style=flat&logo=tensorflow&logoColor=white) | Mood Detection | Latest |
| ![DeepGram](https://img.shields.io/badge/DeepGram-13EF93?style=flat&logo=deepgram&logoColor=white) | Voice Transcription | Latest |

</div>

### Frontend Technologies

<div align="center">

| Technology | Purpose | Version |
|------------|---------|---------|
| ![React](https://img.shields.io/badge/React-61DAFB?style=flat&logo=react&logoColor=black) | UI Framework | 18.x |
| ![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat&logo=vite&logoColor=white) | Build Tool | 4.x |
| ![Tailwind](https://img.shields.io/badge/Tailwind-38B2AC?style=flat&logo=tailwind-css&logoColor=white) | CSS Framework | 3.x |
| ![Axios](https://img.shields.io/badge/Axios-5A29E4?style=flat&logo=axios&logoColor=white) | HTTP Client | Latest |
| ![Particles](https://img.shields.io/badge/tsParticles-000000?style=flat&logo=typescript&logoColor=white) | Animations | Latest |

</div>

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         MOODTUNES AI                            │
│                     System Architecture                          │
└─────────────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────────────┐
│                         FRONTEND LAYER                             │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │  React 18 + Vite + Tailwind CSS                          │    │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐         │    │
│  │  │ Mood       │  │ Preference │  │ Music      │         │    │
│  │  │ Detection  │→ │ Selection  │→ │ Player     │         │    │
│  │  └────────────┘  └────────────┘  └────────────┘         │    │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐         │    │
│  │  │ Webcam     │  │ Search     │  │ Voice      │         │    │
│  │  │ Integration│  │ Component  │  │ Chatbot    │         │    │
│  │  └────────────┘  └────────────┘  └────────────┘         │    │
│  └──────────────────────────────────────────────────────────┘    │
└────────────────────────┬──────────────────────────────────────────┘
                         │ HTTP/REST API (Port 5173 → 8000)
                         ↓
┌───────────────────────────────────────────────────────────────────┐
│                      BACKEND API LAYER                             │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │  FastAPI + Uvicorn (Port 8000)                           │    │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐         │    │
│  │  │ Mood       │  │ Music      │  │ Voice      │         │    │
│  │  │ Detection  │  │ Search     │  │ Chatbot    │         │    │
│  │  │ Endpoint   │  │ Endpoint   │  │ (Play/Rec) │         │    │
│  │  └────────────┘  └────────────┘  └────────────┘         │    │
│  └──────────────────────────────────────────────────────────┘    │
└────────────────────────┬──────────────────────────────────────────┘
                         │
                         ↓
┌───────────────────────────────────────────────────────────────────┐
│                    BUSINESS LOGIC LAYER                            │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │  Modular Components (modules/)                           │    │
│  │                                                           │    │
│  │  ┌─────────────────────────────────────────────────┐    │    │
│  │  │  recommendation_engine.py                       │    │    │
│  │  │  ┌──────────┐  ┌──────────┐  ┌──────────┐      │    │    │
│  │  │  │Category 1│  │Category 2│  │Category 3│      │    │    │
│  │  │  │Artist+   │→ │Language+ │→ │Similar+  │      │    │    │
│  │  │  │Mood+Lang │  │Mood (4)  │  │Mood (4)  │      │    │    │
│  │  │  │(8 songs) │  │          │  │          │      │    │    │
│  │  │  └──────────┘  └──────────┘  └──────────┘      │    │    │
│  │  │           ↓                                      │    │    │
│  │  │  ┌──────────────────────────────────┐          │    │    │
│  │  │  │ Category 4: Fallback (4 songs)   │          │    │    │
│  │  │  └──────────────────────────────────┘          │    │    │
│  │  └─────────────────────────────────────────────────┘    │    │
│  │                                                           │    │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐         │    │
│  │  │ mood_      │  │ music_     │  │ voice_to_  │         │    │
│  │  │ detection  │  │ player.py  │  │ text.py    │         │    │
│  │  │ (DeepFace) │  │ (YouTube)  │  │ (DeepGram) │         │    │
│  │  └────────────┘  └────────────┘  └────────────┘         │    │
│  └──────────────────────────────────────────────────────────┘    │
└────────────────────────┬──────────────────────────────────────────┘
                         │
                         ↓
┌───────────────────────────────────────────────────────────────────┐
│                    EXTERNAL SERVICES                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐           │
│  │  Last.fm API │  │ YouTube API  │  │ Gemini AI    │           │
│  │  (Music Data)│  │ (Playback)   │  │ (Chatbot)    │           │
│  └──────────────┘  └──────────────┘  └──────────────┘           │
│  ┌──────────────┐  ┌──────────────┐                             │
│  │ DeepFace Lib │  │ DeepGram API │                             │
│  │ (Mood Detect)│  │ (Voice->Text)│                             │
│  └──────────────┘  └──────────────┘                             │
└───────────────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────────────┐
│                    DATA FLOW DIAGRAM                               │
│                                                                    │
│  User → Camera → DeepFace → Mood Detection                        │
│          ↓                                                         │
│  User Voice → DeepGram → Text Transcription                       │
│          ↓                                                         │
│  Chatbot Processing:                                               │
│    • "Play [song]" → Direct playback                              │
│    • "Recommend [mood/artist]" → Smart suggestions                │
│    • Natural conversation → Personalized responses                │
│          ↓                                                         │
│  User Preferences (Language, Artists, Songs)                      │
│          ↓                                                         │
│  Music Search → Last.fm API → Add to Favorites                    │
│          ↓                                                         │
│  Recommendation Engine (4 Categories)                             │
│          ↓                                                         │
│  Last.fm API → Song Metadata                                      │
│          ↓                                                         │
│  YouTube API → Video IDs                                          │
│          ↓                                                         │
│  Frontend → Music Player → User                                   │
│          ↑                                                         │
│  Voice Commands → Chatbot → Play/Recommend Actions                │
│                                                                    │
└───────────────────────────────────────────────────────────────────┘
```

---

## 🌟 Key Features

### 🎭 AI-Powered Mood Detection
Real-time facial emotion recognition using DeepFace library that identifies 6 emotional states:
- 😊 **Happy** - Upbeat, energetic music
- 😢 **Sad** - Melancholic, emotional songs  
- 😌 **Calm** - Peaceful, relaxing tracks
- 😠 **Angry** - Intense, powerful music
- ❤️ **Romantic** - Love songs and ballads
- ⚡ **Energetic** - High-energy workout music

### 🎵 Smart Recommendation Algorithm

Our sophisticated 4-category distribution system creates perfect 20-song playlists:

| Category | Count | Description |
|----------|-------|-------------|
| **Category 1** | 8 songs (40%) | Artist + Mood + Language matching |
| **Category 2** | 4 songs (20%) | Language + Mood combinations |
| **Category 3** | 4 songs (20%) | Similar to favorite songs + Mood |
| **Category 4** | 4 songs (20%) | Intelligent fallback (language-based) |

### 🌍 Bilingual Music Library
- **Hindi**: Bollywood hits and classics
- **English**: Pop, Rock, and International tracks

### 🤖 AI Chatbot Assistant
Powered by Google Gemini AI for conversational music recommendations and queries.

**Natural Language Commands:**
- 🎵 **Direct Play**: "Play Kesariya", "Play Shape of You"
- 🎤 **Artist Requests**: "Play songs by Arijit Singh", "Recommend AR Rahman tracks"
- 😊 **Mood-Based**: "Play happy songs", "I want romantic music"
- 🔍 **Combined Requests**: "Recommend sad Bollywood songs by Shreya Ghoshal"
- 💬 **Conversational**: Chat naturally to get personalized suggestions

### 🔍 Integrated Search Feature
Real-time music search powered by Last.fm:
- Search any song or artist instantly
- Preview song details before adding
- One-click add to favorites
- Visual search results with artist info
- Seamless integration with recommendation engine

### 🎨 Modern User Interface
- Responsive design with Tailwind CSS
- Particle animations for immersive experience
- Embedded YouTube player with queue management
- Real-time webcam integration

---

## 📁 Project Structure

```
MUSIC-REC/
├── backend_modular/              # Backend API Service
│   ├── modules/                  # Core modules
│   │   ├── __init__.py          # Module initialization
│   │   ├── config.py            # API keys & service setup
│   │   ├── models.py            # Pydantic data models
│   │   ├── mood_detection.py   # Emotion recognition
│   │   ├── music_player.py     # YouTube integration
│   │   ├── recommendation_engine.py  # Smart algorithm
│   │   ├── voice_to_text.py    # Speech recognition
│   │   └── chatbot.py          # Gemini AI integration
│   ├── cache/                   # API response cache
│   ├── main.py                  # FastAPI application
│   ├── requirements.txt         # Python dependencies
│   ├── .env                     # Environment variables
│   ├── .env.example            # Template for .env
│   └── start_backend.bat       # Quick start script
│
└── frontend/                     # React Frontend
    ├── src/
    │   ├── components/          # React components
    │   │   ├── Chatbot.jsx     # AI chat interface
    │   │   ├── Header.jsx      # Navigation bar
    │   │   ├── Hero.jsx        # Landing section
    │   │   ├── MoodDetection.jsx      # Camera + mood selector
    │   │   ├── MusicPlayer.jsx        # YouTube player
    │   │   ├── Particles.jsx          # Background animation
    │   │   ├── PreferenceSelection.jsx # User preferences
    │   │   ├── Recommendations.jsx    # Song grid display
    │   │   └── StepCards.jsx          # Navigation steps
    │   ├── App.jsx              # Main application
    │   ├── main.jsx             # Entry point
    │   └── index.css            # Global styles
    ├── package.json             # Node dependencies
    ├── vite.config.js          # Vite configuration
    ├── tailwind.config.js      # Tailwind setup
    └── start_frontend.bat      # Quick start script
```

---

## 🚀 Quick Start

### Prerequisites

- **Python 3.8+** for backend
- **Node.js 16+** for frontend
- API Keys (free tiers available):
  - [Last.fm API](https://www.last.fm/api)
  - [YouTube Data API](https://developers.google.com/youtube/v3)
  - [Google Gemini AI](https://ai.google.dev/)
  - [DeepGram API](https://deepgram.com/)

### Backend Setup

1. **Navigate to backend:**
```bash
cd backend_modular
```

2. **Create virtual environment:**
```bash
python -m venv .venv
# Windows
.venv\Scripts\activate
# Linux/Mac
source .venv/bin/activate
```

3. **Install dependencies:**
```bash
pip install -r requirements.txt
```

4. **Configure environment:**
```bash
# Copy .env.example to .env
cp .env.example .env
# Edit .env and add your API keys
```

Example `.env`:
```env
LASTFM_API_KEY=your_lastfm_key_here
LASTFM_API_SECRET=your_lastfm_secret_here
YOUTUBE_API_KEY=your_youtube_key_here
GEMINI_API_KEY=your_gemini_key_here
DEEPGRAM_API_KEY=your_deepgram_key_here
```

**Note**: DeepFace is automatically installed via requirements.txt (no API key needed)

5. **Start backend:**
```bash
# Quick start
start_backend.bat
# Or manually
python main.py
```

✅ Backend running at: **http://localhost:8000**

### Frontend Setup

1. **Navigate to frontend:**
```bash
cd frontend
```

2. **Install dependencies:**
```bash
npm install
```

3. **Start development server:**
```bash
# Quick start
start_frontend.bat
# Or manually
npm run dev
```

✅ Frontend running at: **http://localhost:5173**

---

## 🎯 How to Use

### Step 1: Detect Your Mood 🎭
1. Allow camera access for automatic mood detection
2. Or manually select your current mood
3. Click "Next" to proceed

### Step 2: Set Preferences 🎼
1. **Select Language** (Required): Hindi or English
2. **Add Favorite Artists** (Optional): e.g., "Arijit Singh, AR Rahman"
3. **Add Favorite Songs** (Optional): e.g., "Tum Hi Ho, Kesariya"
4. **Use Search Feature**: 
   - Click search icon
   - Type song or artist name
   - Browse results and click to add to favorites
5. Click "Get Personalized Recommendations"

### Step 3: Enjoy Your Playlist 🎵
1. Browse 20 personalized song recommendations
2. Click any song to play via YouTube player
3. Use queue controls (Next/Previous)
4. **Use Voice Chatbot**:
   - Click chatbot icon (bottom right)
   - Say: "Play Kesariya" → Instantly plays the song
   - Say: "Recommend romantic songs by Shreya Ghoshal" → Get instant suggestions
   - Say: "Search for happy Bollywood songs" → Get curated list
5. Search for additional songs anytime using the search bar

---

## 🔧 API Endpoints

### Core Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | Health check |
| `POST` | `/detect-mood` | Facial emotion detection |
| `POST` | `/recommendations` | Basic mood recommendations |
| `POST` | `/recommendations/personalized` | Smart personalized playlist |
| `GET` | `/search-music` | Search songs by name/artist |
| `POST` | `/chat` | Voice chatbot (play/recommend) |
| `GET` | `/user/{user_id}/history` | User listening history |

### Interactive Documentation
Visit **http://localhost:8000/docs** for Swagger UI

---

## 🐛 Troubleshooting

### Common Issues

**Backend won't start:**
- Verify all API keys in `.env` file
- Check Python version (3.8+)
- Ensure port 8000 is available
- Install DeepFace dependencies: `pip install deepface tf-keras`

**DeepFace model download issues:**
- First run downloads face detection models (~100MB)
- Ensure stable internet connection
- Models cached in `~/.deepface/weights/`

**Frontend CORS errors:**
- Confirm backend is running on port 8000
- Check `vite.config.js` proxy settings

**Camera not working:**
- Grant browser camera permissions
- Use HTTPS or localhost
- Try manual mood selection as fallback
- Ensure good lighting for DeepFace detection

**DeepGram transcription errors:**
- Verify API key is valid
- Check microphone permissions
- Ensure clear audio input

**YouTube quota exceeded:**
- Daily limit: 10,000 units
- Each search costs 100 units
- Monitor usage in Google Cloud Console

**Last.fm rate limits:**
- Free tier: 60 requests/minute
- Consider implementing caching

**DeepFace performance:**
- First emotion detection may be slow (model loading)
- Subsequent detections are faster
- Use GPU for better performance (optional)

---

## 👨‍💻 Author

<div align="center">

<img src="./github_photo (1).png" alt="Kumar Abhishek" width="150" height="150" style="border-radius: 50%; border: 4px solid #6366f1;" />

### **Kumar Abhishek**

[![GitHub](https://img.shields.io/badge/GitHub-100000?style=for-the-badge&logo=github&logoColor=white)](https://github.com/kumarAbhishek2004)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-0077B5?style=for-the-badge&logo=linkedin&logoColor=white)](https://linkedin.com/in/kumar-abhishek-6b5828288)
[![Email](https://img.shields.io/badge/Email-D14836?style=for-the-badge&logo=gmail&logoColor=white)](mailto:abhishek.kr0418@gmail.com)

**ML Engineer | AI/ML Enthusiast | Full Stack Developer**

🎓 BTech ECE @ **IIIT Una**

💡 Passionate about AI/ML, GenAI, and Web Development

*"Building intelligent applications that merge technology with creativity"*

</div>

---

### 🚀 About Me

- 🔭 Currently working on AI-powered applications
- 🌱 Exploring Generative AI and Deep Learning
- 💻 Full Stack Developer with expertise in React & FastAPI
- 🎵 Music enthusiast combining tech with entertainment
- 📫 Reach me: **abhishek.kr0418@gmail.com**

### 🛠️ Tech Stack

```
AI/ML: TensorFlow, PyTorch, scikit-learn, DeepFace
Backend: Python, FastAPI, Uvicorn
Frontend: React, Tailwind CSS, JavaScript
APIs: Last.fm, YouTube, Gemini AI, DeepGram
Tools: Git, Docker, Vite
```

---


## 🙏 Acknowledgments

- [DeepFace](https://github.com/serengil/deepface) for facial emotion recognition
- [DeepGram](https://deepgram.com/) for voice transcription
- [Last.fm](https://www.last.fm/) for comprehensive music metadata
- [Google Gemini AI](https://ai.google.dev/) for conversational AI
- [YouTube](https://developers.google.com/youtube) for video playback
- [FastAPI](https://fastapi.tiangolo.com/) for excellent documentation
- [React](https://react.dev/) community for amazing resources

---

<div align="center">

**⭐ Star this repo if you found it helpful!**

Made with ❤️ and 🎵 by [Kumar Abhishek](https://github.com/kumarAbhishek2004)

**IIIT Una | BTech ECE**

</div>