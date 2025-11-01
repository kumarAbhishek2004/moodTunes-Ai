# MoodTunes AI - Frontend

React-based frontend for the MoodTunes AI music recommender system.

## Setup

1. **Install dependencies:**
```bash
npm install
```

2. **Run development server:**
```bash
npm run dev
```

3. **Build for production:**
```bash
npm run build
```

4. **Preview production build:**
```bash
npm run preview
```

## Features

- 🎨 Modern UI with Tailwind CSS
- ✨ Particle animations with tsParticles  
- 📱 Fully responsive design
- 🎵 YouTube embedded player
- 💬 Floating chatbot interface
- 📸 Webcam integration for mood detection

## Components

- `Header` - Top navigation bar
- `Hero` - Landing section with title
- `StepCards` - Three-step navigation
- `MoodDetection` - Camera + manual mood selection
- `Recommendations` - Song grid display
- `MusicPlayer` - YouTube player + queue
- `Chatbot` - AI assistant interface
- `Particles` - Background animation

## Configuration

Backend API URL is configured in `vite.config.js`:
```javascript
proxy: {
  '/api': {
    target: 'http://localhost:8000',
    changeOrigin: true
  }
}
```

## Technologies

- React 18
- Vite
- Tailwind CSS
- Axios
- tsParticles
- React Webcam
