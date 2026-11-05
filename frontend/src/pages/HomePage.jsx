import { useState, useEffect, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../config/api';
import { playSong, setQueue, togglePlayPause } from '../store/audioSlice';

import MultiModalBar from '../components/MultiModalBar';
import RotaryMoodDial, { MOOD_NODES } from '../components/RotaryMoodDial';
import MoodInsightsDonut from '../components/MoodInsightsDonut';
import DenseTracklist from '../components/DenseTracklist';
import Chatbot from '../components/Chatbot';

const MOOD_HEADLINES = {
  calm: {
    badge: 'Aura: Serene & Reflective',
    title: 'Find your stillness. Flow into serenity.',
    subtitle: 'Gentle acoustic soundscapes and lo-fi textures curated for calm evenings.',
    color: 'from-cyan to-emerald',
  },
  focus: {
    badge: 'Aura: Deep Productivity',
    title: 'Distraction-free clarity. Enter the zone.',
    subtitle: 'Instrumental rhythms, binaural flows, and minimal frequencies for deep work.',
    color: 'from-emerald to-teal-400',
  },
  energetic: {
    badge: 'Aura: High BPM Momentum',
    title: 'Ignite your drive. Peak energy starts here.',
    subtitle: 'Punchy basslines, uplifting drops, and pulse-raising tempos to fuel your day.',
    color: 'from-orange-400 to-amber-500',
  },
  happy: {
    badge: 'Aura: Bright Euphoria',
    title: 'Pure euphoria. Uplifting golden harmonies.',
    subtitle: 'Bright brass, sweet melodies, and joyful chords crafted to elevate your spirit.',
    color: 'from-amber-400 to-pink-500',
  },
  romantic: {
    badge: 'Aura: Soulful & Intimate',
    title: 'Warm soulful melodies. Intimate vibrations.',
    subtitle: 'Sensual R&B, acoustic strings, and emotional vocals for quiet moments.',
    color: 'from-pink-400 to-rose-500',
  },
  sad: {
    badge: 'Aura: Gentle Melancholy',
    title: 'Gentle comfort for thoughtful moments.',
    subtitle: 'Slow tempo ballads and warm rain acoustics to accompany your reflections.',
    color: 'from-blue-400 to-indigo-400',
  },
};

const DEFAULT_SEEDS = [
  {
    id: 'seed-1',
    name: 'Kesariya',
    artist: 'Arijit Singh',
    youtube_id: 'BddP6PYo2gs',
    mood_match: 'Happy',
    ai_explanation: 'Matches your warm emotional aura & uplifting vocal preference',
    duration: 268,
    image: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=120&auto=format&fit=crop&q=80',
  },
  {
    id: 'seed-2',
    name: 'Apna Bana Le',
    artist: 'Arijit Singh',
    youtube_id: 'ElZfdU54Cp8',
    mood_match: 'Calm',
    ai_explanation: 'Selected for acoustic softness & serene melodic flow',
    duration: 261,
    image: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=120&auto=format&fit=crop&q=80',
  },
  {
    id: 'seed-3',
    name: 'Raataan Lambiyan',
    artist: 'Jubin Nautiyal',
    youtube_id: 'gvyUuxdRdR4',
    mood_match: 'Romantic',
    ai_explanation: 'Intimate vocal harmony with gentle tempo progression',
    duration: 230,
    image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=120&auto=format&fit=crop&q=80',
  },
  {
    id: 'seed-4',
    name: 'Tum Hi Ho',
    artist: 'Arijit Singh',
    youtube_id: 'IJq0yyWug1k',
    mood_match: 'Reflective',
    ai_explanation: 'Deep emotional resonance & soulful piano progression',
    duration: 262,
    image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=120&auto=format&fit=crop&q=80',
  },
  {
    id: 'seed-5',
    name: 'Chaleya',
    artist: 'Arijit Singh, Shilpa Rao',
    youtube_id: 'VAdGW7QDJUI',
    mood_match: 'Energetic',
    ai_explanation: 'High rhythmic bounce with punchy drum arrangement',
    duration: 200,
    image: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=120&auto=format&fit=crop&q=80',
  },
];

const HomePage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { activeMood, isPlaying, currentSong } = useSelector((state) => state.audio);
  const [streamSongs, setStreamSongs] = useState([]);
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);

  const headline = MOOD_HEADLINES[activeMood?.toLowerCase()] || MOOD_HEADLINES.calm;

  // Load cached recommendations from storage, fallback to default seeds
  useEffect(() => {
    try {
      const stored = localStorage.getItem('recommendations');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setStreamSongs(parsed);
          return;
        }
      }
    } catch (e) {}

    // Initial load from backend for active mood
    const fetchInitialStream = async () => {
      try {
        const res = await axios.post(`${API_BASE_URL}/api/recommendations`, {
          mood: activeMood || 'calm',
          limit: 12,
          user_id: 'default',
        });
        if (res.data.recommendations?.length > 0) {
          setStreamSongs(res.data.recommendations);
          return;
        }
      } catch (err) {
        // Fallback to static verified seeds
      }
      setStreamSongs(DEFAULT_SEEDS);
    };

    fetchInitialStream();
  }, [activeMood]);

  const handleResumePlay = () => {
    if (currentSong) {
      dispatch(togglePlayPause());
    } else if (streamSongs.length > 0) {
      dispatch(setQueue(streamSongs));
      dispatch(playSong(streamSongs[0]));
    }
  };

  const handleDialMoodSelect = async (node) => {
    try {
      const res = await axios.post(`${API_BASE_URL}/api/recommendations`, {
        mood: node.mappedMood || node.id,
        limit: 15,
        user_id: 'default',
      });
      if (res.data.recommendations?.length > 0) {
        setStreamSongs(res.data.recommendations);
        localStorage.setItem('recommendations', JSON.stringify(res.data.recommendations));
      }
    } catch (e) {
      console.error('Failed to fetch recommendations for dialed mood:', e);
    }
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 py-6 max-w-7xl">
      {/* 1. Atmospheric Hero Banner (Aura Studio 01 & Cinematic 02) */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-obsidian-900/90 via-obsidian-900/50 to-obsidian-950/90 border border-obsidian-800/80 p-6 sm:p-10 shadow-2xl mb-8">
        {/* Dynamic Glowing Aura Orbs */}
        <div className="absolute -top-16 -right-16 w-80 h-80 rounded-full bg-cyan/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-80 h-80 rounded-full bg-emerald/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl">
          {/* Active Aura Capsule */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-obsidian-800/80 border border-obsidian-700/80 text-xs text-slate-300 mb-4 backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-cyan animate-ping" />
            <span className="font-semibold">{headline.badge}</span>
          </div>

          {/* Dynamic Empathetic Headline */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-tight mb-4">
            {headline.title}
          </h1>

          <p className="text-sm sm:text-base text-slate-400 mb-8 max-w-2xl leading-relaxed">
            {headline.subtitle}
          </p>

          {/* Action Button Row */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleResumePlay}
              className="flex items-center gap-2.5 px-6 py-3 rounded-2xl bg-gradient-to-r from-cyan via-emerald to-amber-analog text-obsidian-950 font-bold text-sm shadow-xl shadow-cyan/20 hover:scale-[1.03] active:scale-[0.98] transition-all"
            >
              {isPlaying ? (
                <>
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                  </svg>
                  <span>Pause Stream</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                  <span>{currentSong ? 'Resume Stream' : 'Start AI Stream'}</span>
                </>
              )}
            </button>

            <button
              onClick={() => navigate('/mood-detection')}
              className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-obsidian-800/90 hover:bg-obsidian-750 text-white font-semibold text-sm border border-obsidian-700/80 hover:border-cyan/40 transition-all"
            >
              <span>📸</span>
              <span>Live Facial Scan</span>
            </button>

            <button
              onClick={() => setIsChatbotOpen(true)}
              className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-obsidian-800/90 hover:bg-obsidian-750 text-slate-300 hover:text-white font-semibold text-sm border border-obsidian-700/80 transition-all"
            >
              <span>💬</span>
              <span>AI Music Assistant</span>
            </button>
          </div>
        </div>
      </section>

      {/* 2. Flagship Tri-Modal Studio Bar (Voice, Narrative Scene, Face) */}
      <MultiModalBar />

      {/* 3. Tactile Emotion Dial & Analytics Grid (Concept 04 & Rotary Dial) */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 my-8 items-stretch">
        {/* Left / Center: Interactive Rotary Mood Dial */}
        <div className="lg:col-span-7 bg-obsidian-900/70 backdrop-blur-2xl border border-obsidian-800/80 rounded-3xl p-4 sm:p-6 shadow-2xl flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-obsidian-800/60 mb-2 px-2">
            <div>
              <h3 className="text-sm font-bold text-white tracking-wide flex items-center gap-2">
                <span>🎛️</span>
                <span>Tactile Rotary Emotion Dial</span>
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Drag knob or tap notches to morph acoustic atmosphere in real time
              </p>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan/10 text-cyan border border-cyan/20">
              Live Morphing
            </span>
          </div>

          <RotaryMoodDial
            onSelectMood={handleDialMoodSelect}
            showCurateButton={false}
          />
        </div>

        {/* Right: Weekly Mood Insights Donut Analytics */}
        <div className="lg:col-span-5 flex flex-col">
          <MoodInsightsDonut />
        </div>
      </section>

      {/* 4. Dense Curated Stream Tracklist with Explainable AI Badges */}
      <section>
        <DenseTracklist
          songs={streamSongs}
          title={`Curated ${activeMood?.toUpperCase() || 'CALM'} Stream`}
          subtitle="Ranked with transparent Explainable AI badges & multi-class balancing"
        />
      </section>

      {/* Floating Chatbot Assistant Component */}
      <Chatbot
        isOpen={isChatbotOpen}
        onToggle={() => setIsChatbotOpen(!isChatbotOpen)}
        currentMood={activeMood}
        onPlaySong={(song) => dispatch(playSong(song))}
        onPlayPlaylist={(pl) => {
          if (pl?.songs?.length > 0) {
            dispatch(setQueue(pl.songs));
            dispatch(playSong(pl.songs[0]));
          }
        }}
      />
    </div>
  );
};

export default HomePage;
