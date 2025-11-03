# Backend Modular - Music Recommendation System

## Structure

```
backend_modular/
├── modules/
│   ├── __init__.py
│   ├── config.py              # API configuration
│   ├── models.py              # Data models
│   ├── mood_detection.py      # Mood detection logic
│   ├── music_player.py        # YouTube integration
│   ├── recommendation_engine.py # Recommendation logic
│   └── chatbot.py             # AI chatbot
├── main.py                    # Main application
├── requirements.txt           # Dependencies
├── .env.example               # Environment variables template
└── start_backend.bat          # Windows start script
```

## Setup

1. **Copy your .env file**
   ```bash
   # Copy .env from old backend or create new one
   cp ../backend/.env .env
   ```

2. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

3. **Run the backend**
   ```bash
   # Option 1: Using batch file (Windows)
   start_backend.bat

   # Option 2: Using Python
   python main.py

   # Option 3: Using uvicorn
   uvicorn main:app --reload
   ```

## API Documentation

Once running, visit:
- **Swagger UI**: http://localhost:8000/docs
- **Health Check**: http://localhost:8000/health

## Modules

### 1. Config (`modules/config.py`)
- Initializes all API services
- Manages environment variables

### 2. Models (`modules/models.py`)
- All Pydantic data models
- Request/Response schemas

### 3. Mood Detection (`modules/mood_detection.py`)
- Facial emotion recognition
- Mood mapping and validation

### 4. Music Player (`modules/music_player.py`)
- YouTube video search
- Caching system

### 5. Recommendation Engine (`modules/recommendation_engine.py`)
- Last.fm integration
- Music recommendations with filters

### 6. Chatbot (`modules/chatbot.py`)
- Gemini AI integration
- Conversational recommendations

## Advantages

✅ **Modular**: Each feature in separate file
✅ **Easy Debugging**: Find issues quickly
✅ **Maintainable**: Update one module at a time
✅ **Testable**: Test modules independently
✅ **Same Endpoints**: Frontend requires no changes

## Switching from Old Backend

The modular backend has the **exact same API endpoints** as the old backend.

Your frontend will work without any changes!

Just point your frontend to:
- Old: `http://localhost:8000` (backend folder)
- New: `http://localhost:8000` (backend_modular folder)

## Port Configuration

Both backends run on port **8000** by default.

**Only run ONE backend at a time:**
- Stop old backend before starting modular backend
- Or change port in `modules/config.py`
