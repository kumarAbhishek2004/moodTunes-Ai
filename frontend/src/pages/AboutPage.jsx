import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { resolveMusicTheme } from '../utils/themeMap';
import { openQueue, setMoodJourneyModalOpen } from '../store/audioSlice';

const FEATURE_PILLARS = [
  {
    pillar: '01',
    title: 'Multi-Modal Mood Detection',
    tag: 'Input & Sensing',
    badgeColor: 'border-pink-500/30 text-pink-400 bg-pink-500/10',
    icon: '🎭',
    headline: '5 Ways to Tell MoodTunes AI How You Feel',
    description:
      'Eliminate endless searching. MoodTunes AI captures your emotional pulse through multiple sensing dimensions:',
    features: [
      {
        icon: '📸',
        name: 'Face Emotion Computer Vision',
        detail: 'DeepFace AI neural analysis evaluates subtle facial action units (smile curvature, eyebrow angles, eye openness) in real-time. Processed purely in memory without saving images.',
      },
      {
        icon: '🎙️',
        name: 'Voice Tone & Pitch Evaluation',
        detail: 'Acoustic pitch and cadence analysis determines vocal fatigue, calmness, or high-energy excitement from a few spoken words.',
      },
      {
        icon: '✍️',
        name: 'Natural Language Scene Narrative',
        detail: 'Type any natural description (e.g., "rainy midnight study session", "heavy gym deadlift pump") and the semantic engine matches the mood.',
      },
      {
        icon: '🎛️',
        name: '360° Tactile Rotary Mood Dial',
        detail: 'Turn the physical tactile dial to smoothly morph between Happy, Romantic, Calm, Focus, Reflective, and Energetic with synchronized screen-wide color transitions.',
      },
      {
        icon: '⏰',
        name: 'Circadian & Context-Aware Intelligence',
        detail: 'Blends your emotional state with your local time: gentle acoustic energy for mornings (7–10 AM), deep focus lo-fi for afternoons, and dreamy ambient R&B for late nights.',
      },
    ],
  },
  {
    pillar: '02',
    title: 'AI Mood Transition & Elevation Roadmap',
    tag: 'Elevation Engine',
    badgeColor: 'border-cyan/30 text-cyan bg-cyan/10',
    icon: '🚀',
    headline: 'Psychological Elevation: Uplift Your Mood Step-by-Step',
    description:
      'Instead of being trapped in sadness or lethargy, design an intentional emotional elevation roadmap to guide your mental state upward:',
    features: [
      {
        icon: '🗺️',
        name: 'Emotional Elevation Roadmap',
        detail: 'Set your starting mood (e.g. Melancholic / Sad) and your target destination (e.g. Joyful & Happy). The engine calculates the ideal psychological ascent.',
      },
      {
        icon: '📈',
        name: 'Ascending BPM & Valence Progression',
        detail: 'Sequences tracks along rising musical energy curves — progressing from ~70 BPM contemplative acoustics through intermediate calming waypoints to 125+ BPM euphoric momentum.',
      },
      {
        icon: '🎵',
        name: 'Personalized Library & Playlist Sourcing',
        detail: 'Prioritizes your own custom playlists and listening history, weaving in harmonic AI bridge tracks to guarantee acoustic and key continuity.',
      },
      {
        icon: '⚡',
        name: '1-Click Full Elevation Playback',
        detail: 'Preview your roadmap milestones, review the BPM trajectory of each stage, and launch continuous playback with a single tap.',
      },
    ],
  },
  {
    pillar: '03',
    title: 'One-Click "Hey Abhi" Voice Assistant & Aura AI Copilot',
    tag: 'Voice & AI Assistant',
    badgeColor: 'border-purple-500/30 text-purple-400 bg-purple-500/10',
    icon: '🎙️',
    headline: 'Natural Voice Control & Conversational Music Intelligence',
    description:
      'Control your entire music ecosystem completely hands-free using voice recognition or chat with your intelligent music companion:',
    features: [
      {
        icon: '🗣️',
        name: 'One-Click "Hey Abhi" Voice Activation',
        detail: 'Click "Hey Abhi" in the top navbar to instantly activate voice listening. The assistant chimes with a rising chord, displays a live audio ripple, and executes your command immediately.',
      },
      {
        icon: '🛡️',
        name: 'Hardware Acoustic Echo Cancellation',
        detail: 'Built-in echo cancellation and noise suppression ensure your speaker playback does not drown out your microphone or trigger false commands.',
      },
      {
        icon: '▶️',
        name: 'Instant Natural Voice Commands',
        detail: 'Speak naturally: "Play Brown Rang", "Pause it", "Next track", "Open playlist", "Volume 80", or "Show roadmap" for instantaneous execution.',
      },
      {
        icon: '🤖',
        name: 'Aura AI Conversational Companion',
        detail: 'Ask questions about song trivia, lyrics meanings, or request mood recommendations. Aura AI uses vector-indexed knowledge to deliver intelligent answers.',
      },
    ],
  },
  {
    pillar: '04',
    title: 'Audiophile Studio & Vinyl Acoustics',
    tag: 'Playback & DSP',
    badgeColor: 'border-amber-500/30 text-amber-400 bg-amber-500/10',
    icon: '💿',
    headline: 'Analog Turntable Meets High-Definition Sound Processing',
    description:
      'A physical vinyl listening environment combined with studio-grade digital audio processing:',
    features: [
      {
        icon: '🎛️',
        name: '5-Band Studio Parametric Equalizer',
        detail: 'Fine-tune 60 Hz sub-bass, 250 Hz punch, 1 kHz midrange, 4 kHz presence, and 16 kHz treble. Includes 1-click sound presets: Bass Heavy, Clear Vocals, Warm Vinyl, Lo-Fi, Night Mode, and Acoustic.',
      },
      {
        icon: '🌊',
        name: 'Smooth Crossfade & Seamless DJ Fades',
        detail: 'Configurable 2–5s audio crossfade blends outgoing and incoming tracks gradually, creating continuous club/DJ transitions without abrupt silences.',
      },
      {
        icon: '📊',
        name: 'Real-time Web Audio API Frequency Visualizer',
        detail: 'Live 64-band FFT frequency analyzer reacts dynamically to the real bass, mid, and treble amplitudes of the playing music.',
      },
      {
        icon: '📜',
        name: 'Spotify-Style Real-time Synced Lyrics',
        detail: 'Live synchronized lyric teleprompter highlights each active lyric line with a smooth, glowing karaoke interface inside the Turntable player.',
      },
      {
        icon: '🌙',
        name: 'Sleep Timer with Gradual Volume Fade-Out',
        detail: 'Set a 15, 30, or 60-minute sleep timer. Audio gently fades out in volume rather than cutting off abruptly so you can sleep peacefully.',
      },
    ],
  },
  {
    pillar: '05',
    title: 'Social Rooms & Universal Playlist Importer',
    tag: 'Social & Ecosystem',
    badgeColor: 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10',
    icon: '🌐',
    headline: 'Party Mode Synchronization & Seamless Import Tools',
    description:
      'Listen together with friends across the globe and bring your existing music collections with you:',
    features: [
      {
        icon: '👥',
        name: 'Listen Together (Party Mode Rooms)',
        detail: 'Generate a shareable live room link (e.g., moodtunes.ai/room/xyz123). When the host plays, pauses, or seeks, all connected browsers stay synchronized with live emoji reactions floating over the vinyl record.',
      },
      {
        icon: '🔗',
        name: '1-Click Spotify & YouTube Playlist Importer',
        detail: 'Paste any public Spotify or YouTube playlist link. The backend parses track titles, analyzes each song\'s emotional valence, and builds a native MoodTunes playlist in seconds.',
      },
      {
        icon: '📸',
        name: 'Cinematic Shareable Vibe Cards',
        detail: 'Export custom high-resolution vinyl vibe cards with mood tags and album aesthetics formatted perfectly for Instagram Stories and social sharing.',
      },
      {
        icon: '🥞',
        name: 'Tactile Drag-and-Drop Queue Priority',
        detail: 'Grab any track by its 6-dot handle (⠿) to reorder your playback sequence, or tap "⚡ Next" to immediately queue any song next.',
      },
    ],
  },
];

const FAQS = [
  {
    question: 'What is the AI Mood Transition Journey ("Emotional Elevation Roadmap")?',
    answer:
      'Instead of staying trapped in a single mood forever, the Emotional Elevation Roadmap allows you to design an intentional musical trajectory — for example, transitioning from "Melancholy/Sad" through "Calm Reflection" to "Joyful & Energetic". The recommendation engine calculates intermediate waypoints, steadily elevating musical tempo (BPM) and valence. It searches your own custom playlists and listening history first, weaving in harmonic AI bridge tracks for continuous musical flow.',
  },
  {
    question: 'How does the "Hey Abhi" Voice Assistant work?',
    answer:
      'Whenever you want to control playback or ask a question, simply click the "Hey Abhi" button in the top navigation bar. It plays a pleasant rising chime and begins listening immediately. You can say commands like "Play Kesariya", "Pause", "Volume 80", "Open roadmap", or ask questions like "Recommend a relaxing song". The assistant executes your action instantly, displays real-time confirmation, and automatically stops listening without keeping your microphone open in the background.',
  },
  {
    question: 'How does "Listen Together" (Party Mode) keep playback in sync?',
    answer:
      'Party Mode creates a dedicated WebSocket channel for your listening room. When the room host plays, pauses, or seeks through a song, timestamped synchronization packets are broadcast to all connected peer listeners in milliseconds. Connected friends can also send live emoji reactions (🔥, ❤️, ⚡, 🎉) that float in real time across the spinning vinyl record.',
  },
  {
    question: 'What are the Equalizer sound presets and smooth crossfade?',
    answer:
      'Inside the player, you have a 5-band studio parametric equalizer allowing you to adjust sub-bass (60 Hz), punch bass (250 Hz), midrange (1 kHz), vocal presence (4 kHz), and treble brilliance (16 kHz). 1-click presets like "Bass Heavy", "Clear Vocals", "Warm Vinyl", and "Night Mode" calibrate the sound instantly. The Smooth Crossfade feature blends the outgoing track into the incoming track over 2–5 seconds so the music never abruptly stops.',
  },
  {
    question: 'How does 1-Click Spotify & YouTube Playlist Import work?',
    answer:
      'In the Playlists section, you can paste any public Spotify or YouTube playlist URL. MoodTunes AI extracts the track titles and artists, queries our acoustic DNA database to analyze the mood valence of each song, and generates a native, fully playable MoodTunes playlist complete with album art and explainable AI mood tags.',
  },
  {
    question: 'How does MoodTunes AI detect my mood using the camera?',
    answer:
      'When you click "Detect Mood with Face", your browser captures a snapshot from your webcam and sends it to our DeepFace emotion recognition backend. The neural model evaluates facial action units (smile curvature, eyebrow position, eye openness) to identify whether you feel Happy, Romantic, Calm, Sad, Energetic, or Focused. No images or videos are ever saved to disk — the snapshot is processed in memory and immediately discarded.',
  },
  {
    question: 'What is the difference between Guest mode and logging in?',
    answer:
      'Anyone can use MoodTunes AI as a Guest without signing up! Guests have access to face detection, voice analysis, text synthesis, the rotary mood dial, streaming all songs, the Emotional Elevation Roadmap, drag-and-drop queue adjustment, the 5-band equalizer, and the AI chatbot. Logging in with a free account unlocks saving custom mood playlists, synchronizing your taste profile across devices, and maintaining your personal listening history.',
  },
  {
    question: 'What makes Explainable AI Reasoning different from Spotify algorithms?',
    answer:
      'Standard streaming platforms hide why songs appear on your feed. MoodTunes AI provides an explicit Explainable AI tag for every single track (e.g. "140+ BPM cadence and punchy 808 sub-bass engineered for peak motivational momentum" or "Delicate acoustic guitar fingerpicking tuned for intimate nostalgia"). This connects the musical characteristics directly to your emotional state.',
  },
];

const AboutPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { currentSong, activeMood } = useSelector((state) => state.audio);
  const theme = resolveMusicTheme(currentSong, activeMood);

  const [openFaqIndex, setOpenFaqIndex] = useState(0);

  const toggleFaq = (idx) => {
    setOpenFaqIndex(openFaqIndex === idx ? null : idx);
  };

  return (
    <div
      className="min-h-screen text-slate-100 transition-colors duration-1000 relative pb-32 font-sans selection:bg-cyan/30"
      style={{
        background: `radial-gradient(ellipse at 50% -5%, rgba(${theme.accentRgb || '0, 242, 254'}, 0.22) 0%, transparent 70%), #060B10`,
      }}
    >
      {/* Dynamic Background Glow */}
      <div
        aria-hidden="true"
        className="fixed inset-0 pointer-events-none transition-all duration-1000 ease-out z-0 opacity-40"
        style={{
          background: `radial-gradient(circle at 85% 20%, rgba(${theme.accentRgb || '0, 242, 254'}, 0.18), transparent 50%), radial-gradient(circle at 15% 75%, rgba(${theme.accentRgb || '0, 242, 254'}, 0.12), transparent 50%)`,
        }}
      />

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-14 space-y-16 sm:space-y-24">
        
        {/* ============================================================== */}
        {/* 1. HERO SECTION: CINEMATIC ARCHITECTURE OVERVIEW                */}
        {/* ============================================================== */}
        <div className="text-center max-w-3xl mx-auto space-y-4 sm:space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-mono font-bold tracking-wide backdrop-blur-md">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: theme.accent, boxShadow: `0 0 10px ${theme.glow}` }} />
            <span style={{ color: theme.accent }}>MOODTUNES AI COMPLETE ARCHITECTURE</span>
            <span className="text-slate-400">•</span>
            <span className="text-slate-300">Feature Guide</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-tight">
            Music engineered for{' '}
            <span
              className="bg-clip-text text-transparent bg-gradient-to-r"
              style={{
                backgroundImage: `linear-gradient(135deg, ${theme.accent} 0%, #FFFFFF 100%)`,
              }}
            >
              how you feel & where you want to be.
            </span>
          </h1>

          <p className="text-sm sm:text-lg text-slate-300 leading-relaxed font-normal max-w-2xl mx-auto">
            MoodTunes AI replaces passive listening with dynamic emotion intelligence.
            From multi-modal mood sensing and hands-free voice control to intentional emotional elevation roadmaps, studio equalizers, and synchronized social rooms.
          </p>

          {/* Quick Action Navigation CTAs */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={() => navigate('/roadmap')}
              className="px-6 py-3 rounded-full font-bold text-xs sm:text-sm text-obsidian-950 shadow-xl transition-all hover:scale-105 active:scale-95 cursor-pointer flex items-center gap-2"
              style={{
                background: `linear-gradient(135deg, ${theme.accent} 0%, #ffffff 100%)`,
                boxShadow: `0 8px 24px -4px ${theme.glow}`,
              }}
            >
              <span>🚀 Try Elevation Roadmap</span>
              <span>→</span>
            </button>

            <button
              onClick={() => navigate('/playlists')}
              className="px-5 py-3 rounded-full font-semibold text-xs sm:text-sm text-white bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all cursor-pointer flex items-center gap-2"
            >
              <span>🥞 View Playlists & Importer</span>
            </button>

            <button
              onClick={() => dispatch(openQueue())}
              className="px-5 py-3 rounded-full font-semibold text-xs sm:text-sm text-cyan bg-cyan/10 hover:bg-cyan/15 border border-cyan/20 transition-all cursor-pointer flex items-center gap-2"
            >
              <span>🎛️ Open Queue Drawer</span>
            </button>
          </div>
        </div>

        {/* ============================================================== */}
        {/* 2. THE 5 CORE FEATURE PILLARS                                  */}
        {/* ============================================================== */}
        <div className="space-y-10 sm:space-y-14">
          <div className="text-center space-y-2">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400">
              Complete Feature Suite
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              Built on 5 Intelligent Pillars
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto">
              Explore the acoustic technology, DSP audio engine, and real-time AI companions powering MoodTunes.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
            {FEATURE_PILLARS.map((pillar) => (
              <div
                key={pillar.pillar}
                className="group relative rounded-3xl bg-slate-900/60 border border-white/10 p-6 sm:p-8 backdrop-blur-2xl shadow-xl hover:border-white/20 transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  {/* Pillar Header */}
                  <div className="flex items-center justify-between gap-3 mb-4">
                    <span className="text-3xl sm:text-4xl font-black font-mono text-slate-600 group-hover:text-slate-400 transition-colors">
                      {pillar.pillar}
                    </span>
                    <span
                      className={`text-[10.5px] font-mono font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${pillar.badgeColor}`}
                    >
                      {pillar.tag}
                    </span>
                  </div>

                  <div className="flex items-center gap-2.5 mb-2">
                    <span className="text-2xl select-none">{pillar.icon}</span>
                    <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                      {pillar.title}
                    </h3>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-300 mb-6 leading-relaxed">
                    {pillar.description}
                  </p>

                  {/* Feature Bullets */}
                  <div className="space-y-3 mb-4">
                    {pillar.features.map((feat) => (
                      <div
                        key={feat.name}
                        className="p-3.5 rounded-2xl bg-white/5 border border-white/5 hover:border-white/10 transition-all space-y-1"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-sm select-none">{feat.icon}</span>
                          <span className="text-xs font-bold text-white tracking-tight">
                            {feat.name}
                          </span>
                        </div>
                        <p className="text-[11.5px] text-slate-400 leading-normal pl-6">
                          {feat.detail}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-white/5 flex items-center justify-between text-xs text-slate-400 font-mono">
                  <span>Pillar {pillar.pillar} Active</span>
                  <span className="text-cyan group-hover:translate-x-1 transition-transform inline-flex items-center gap-1 font-semibold">
                    <span>Explore live</span>
                    <span>→</span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ============================================================== */}
        {/* 3. AT A GLANCE: ELEVATION ROADMAP SHOWCASE                     */}
        {/* ============================================================== */}
        <div
          className="relative rounded-3xl p-6 sm:p-10 border backdrop-blur-2xl shadow-2xl overflow-hidden"
          style={{
            background: `linear-gradient(135deg, rgba(${theme.accentRgb || '0, 242, 254'}, 0.12) 0%, rgba(15, 23, 42, 0.9) 100%)`,
            borderColor: `rgba(${theme.accentRgb || '0, 242, 254'}, 0.3)`,
          }}
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-4">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan/15 text-cyan border border-cyan/30 text-xs font-mono font-bold uppercase tracking-wider">
                <span>🚀 Flagship Intelligence</span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                How the Emotional Elevation Roadmap Works
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Most music apps reinforce sad moods by playing endless sad songs in an echo chamber. MoodTunes AI is designed to help you ascend toward mental clarity and happiness:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="p-3.5 rounded-2xl bg-black/40 border border-white/10 space-y-1">
                  <div className="flex items-center gap-2 text-blue-400 font-bold text-xs">
                    <span>🌧️</span>
                    <span>1. Starting State</span>
                  </div>
                  <p className="text-[11.5px] text-slate-400 leading-normal">
                    Begins with contemplative, low-valence songs that validate your current emotions (~70 BPM, gentle acoustics).
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-black/40 border border-white/10 space-y-1">
                  <div className="flex items-center gap-2 text-cyan font-bold text-xs">
                    <span>🌊</span>
                    <span>2. Calming Waypoints</span>
                  </div>
                  <p className="text-[11.5px] text-slate-400 leading-normal">
                    Transitions through serene, harmonic bridge tracks to relieve stress and establish mental stability (~90 BPM).
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-black/40 border border-white/10 space-y-1">
                  <div className="flex items-center gap-2 text-amber-300 font-bold text-xs">
                    <span>✨</span>
                    <span>3. Uplifting Momentum</span>
                  </div>
                  <p className="text-[11.5px] text-slate-400 leading-normal">
                    Ascends musical valence with uplifting harmonies, energetic drum cadences, and vibrant major keys (~115 BPM).
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-black/40 border border-white/10 space-y-1">
                  <div className="flex items-center gap-2 text-orange-400 font-bold text-xs">
                    <span>⚡</span>
                    <span>4. Peak Euphoria</span>
                  </div>
                  <p className="text-[11.5px] text-slate-400 leading-normal">
                    Arrives at high-energy, euphoric peak tracks (128+ BPM) from your favorite playlists and artists.
                  </p>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => navigate('/roadmap')}
                  className="px-6 py-2.5 rounded-full bg-cyan text-obsidian-950 font-bold text-xs shadow-lg hover:scale-105 active:scale-95 transition-all cursor-pointer flex items-center gap-2"
                >
                  <span>Build Your Personal Roadmap Now</span>
                  <span>→</span>
                </button>
              </div>
            </div>

            {/* Visual Roadmap Simulation Card */}
            <div className="lg:col-span-5 bg-obsidian-950/80 rounded-3xl border border-white/15 p-5 shadow-2xl space-y-3 font-mono text-xs">
              <div className="flex items-center justify-between border-b border-white/10 pb-2 text-slate-400">
                <span className="text-cyan font-bold">● ELEVATION TRAJECTORY</span>
                <span>Sad ➔ Happy Ascent</span>
              </div>

              {/* Stage 1 */}
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/25 text-blue-200">
                <div className="flex items-center gap-2">
                  <span className="w-6 text-center font-bold text-blue-400">01</span>
                  <div>
                    <p className="font-bold text-white">Raataan Lambiyan</p>
                    <p className="text-[10px] text-slate-400">Asees Kaur • 74 BPM</p>
                  </div>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-bold">SAD / CALM</span>
              </div>

              {/* Stage 2 */}
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-cyan/10 border border-cyan/25 text-cyan-200">
                <div className="flex items-center gap-2">
                  <span className="w-6 text-center font-bold text-cyan">02</span>
                  <div>
                    <p className="font-bold text-white">Tum Hi Ho</p>
                    <p className="text-[10px] text-slate-400">Arijit Singh • 92 BPM</p>
                  </div>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-cyan/20 text-cyan font-bold">REFLECTIVE</span>
              </div>

              {/* Stage 3 */}
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-200">
                <div className="flex items-center gap-2">
                  <span className="w-6 text-center font-bold text-amber-400">03</span>
                  <div>
                    <p className="font-bold text-white">Kesariya</p>
                    <p className="text-[10px] text-slate-400">Pritam, Arijit • 115 BPM</p>
                  </div>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold">UPLIFTING</span>
              </div>

              {/* Stage 4 */}
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-orange-500/10 border border-orange-500/25 text-orange-200">
                <div className="flex items-center gap-2">
                  <span className="w-6 text-center font-bold text-orange-400">04</span>
                  <div>
                    <p className="font-bold text-white">Brown Rang</p>
                    <p className="text-[10px] text-slate-400">Yo Yo Honey Singh • 128 BPM</p>
                  </div>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-orange-500/20 text-orange-300 font-bold">HAPPY / PEAK</span>
              </div>

              <div className="pt-2 text-center text-[11px] text-slate-400">
                Sequenced dynamically from your custom playlists & history
              </div>
            </div>
          </div>
        </div>

        {/* ============================================================== */}
        {/* 4. FREQUENTLY ASKED QUESTIONS (ACCORDION)                      */}
        {/* ============================================================== */}
        <div className="space-y-6 max-w-4xl mx-auto">
          <div className="text-center space-y-2">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400">
              Got Questions?
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Frequently Asked Questions
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              Clear, transparent answers to how MoodTunes AI operates behind the scenes.
            </p>
          </div>

          <div className="space-y-3">
            {FAQS.map((faq, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div
                  key={faq.question}
                  className="rounded-2xl bg-slate-900/60 border border-white/10 overflow-hidden transition-all backdrop-blur-xl"
                >
                  <button
                    onClick={() => toggleFaq(idx)}
                    className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 hover:bg-white/5 transition-colors cursor-pointer"
                  >
                    <span className="text-xs sm:text-sm font-bold text-white tracking-tight">
                      {faq.question}
                    </span>
                    <span className="text-slate-400 text-lg transition-transform duration-200">
                      {isOpen ? '−' : '+'}
                    </span>
                  </button>

                  {isOpen && (
                    <div className="px-4 sm:px-5 pb-5 text-xs sm:text-sm text-slate-300 leading-relaxed border-t border-white/5 pt-3 animate-fadeIn">
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ============================================================== */}
        {/* 5. BOTTOM CALL TO ACTION                                      */}
        {/* ============================================================== */}
        <div className="text-center py-10 px-6 rounded-3xl bg-slate-950/70 border border-white/10 backdrop-blur-2xl space-y-4">
          <h3 className="text-xl sm:text-2xl font-extrabold text-white">
            Ready to experience music made for your soul?
          </h3>
          <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto">
            Choose your mood, elevate your mental roadmap, or control your music hands-free with "Hey Abhi".
          </p>
          <div className="flex flex-wrap justify-center gap-3 pt-2">
            <button
              onClick={() => navigate('/roadmap')}
              className="px-6 py-2.5 rounded-full font-bold text-xs sm:text-sm text-obsidian-950 shadow-lg hover:scale-105 active:scale-95 transition-all cursor-pointer"
              style={{
                background: `linear-gradient(135deg, ${theme.accent} 0%, #ffffff 100%)`,
              }}
            >
              🚀 Launch Mood Roadmap →
            </button>
            <button
              onClick={() => navigate('/')}
              className="px-6 py-2.5 rounded-full font-semibold text-xs sm:text-sm text-white bg-white/10 hover:bg-white/15 border border-white/10 hover:border-white/20 transition-all cursor-pointer"
            >
              Go to Home Player
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AboutPage;
