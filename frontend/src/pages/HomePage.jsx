import { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import Webcam from 'react-webcam';
import axios from 'axios';
import { API_BASE_URL } from '../config/api';
import { playSong, setQueue, setActiveMood } from '../store/audioSlice';

const MOOD_META = {
  happy: {
    name: 'Happy',
    emoji: '😊',
    confidence: '93% Confidence',
    color: '#F59E0B',
    accent: 'from-amber-400 to-pink-500',
    description: "You seem cheerful and energetic! Here's a playlist to keep the vibe going.",
    headline: 'How are you feeling today?',
    subtitle: 'Let AI understand your mood and create the perfect soundtrack for you.',
  },
  calm: {
    name: 'Calm',
    emoji: '🌊',
    confidence: '95% Confidence',
    color: '#00F2FE',
    accent: 'from-cyan to-emerald-400',
    description: "Serene acoustic textures and gentle frequencies to accompany your peaceful space.",
    headline: 'Feeling peaceful & serene?',
    subtitle: 'Let AI craft soothing melodies and ambient acoustics for your tranquility.',
  },
  focus: {
    name: 'Focus',
    emoji: '🧠',
    confidence: '91% Confidence',
    color: '#10B981',
    accent: 'from-emerald-400 to-teal-500',
    description: "Distraction-free instrumentals and deep lo-fi rhythms to accelerate your flow state.",
    headline: 'Time to enter the flow state.',
    subtitle: 'Minimal beats and focus frequencies curated for deep productivity.',
  },
  energetic: {
    name: 'Energetic',
    emoji: '⚡',
    confidence: '96% Confidence',
    color: '#F97316',
    accent: 'from-orange-500 to-amber-400',
    description: "High BPM, punchy anthems and pulse-raising rhythms to supercharge your momentum.",
    headline: 'High energy drive active.',
    subtitle: 'Heavy basslines and motivational momentum to elevate your day.',
  },
  romantic: {
    name: 'Romantic',
    emoji: '💖',
    confidence: '94% Confidence',
    color: '#EC4899',
    accent: 'from-pink-500 to-rose-400',
    description: "Soulful vocal harmonies and intimate acoustic acoustics to warm the heart.",
    headline: 'Warm, soulful and intimate.',
    subtitle: 'Delicate guitar chords and heartfelt vocal harmonies.',
  },
  sad: {
    name: 'Reflective',
    emoji: '🌧️',
    confidence: '89% Confidence',
    color: '#3B82F6',
    accent: 'from-blue-500 to-indigo-500',
    description: "Gentle comfort, slow-tempo acoustics, and soothing tracks to bring a sense of calm.",
    headline: 'Feeling a bit low today?',
    subtitle: "Let's turn that around with soothing tracks to bring a sense of peace.",
  },
};

const DEFAULT_AURA_PICKS = [
  {
    id: 'aura-1',
    name: 'Kesariya',
    artist: 'Arijit Singh',
    youtube_id: 'BddP6PYo2gs',
    mood_match: 'Happy',
    duration: 268,
    image: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=300&auto=format&fit=crop&q=80',
  },
  {
    id: 'aura-2',
    name: 'Raataan Lambiyan',
    artist: 'Jubin Nautiyal',
    youtube_id: 'gvyUuxdRdR4',
    mood_match: 'Romantic',
    duration: 230,
    image: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=300&auto=format&fit=crop&q=80',
  },
  {
    id: 'aura-3',
    name: 'Ilahi',
    artist: 'Arijit Singh',
    youtube_id: 'fdubeMFwuGs',
    mood_match: 'Energetic',
    duration: 228,
    image: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=300&auto=format&fit=crop&q=80',
  },
];

const PROMPT_CHIPS = [
  { label: '🌧️ 3am Rainy Study', text: '3am rainy study session, gentle lo-fi beats, peaceful and reflective' },
  { label: '⚡ Post-Gym Energy', text: 'High energy gym workout, heavy bass, intense motivational tracks' },
  { label: '☕ Sunday Coffee', text: 'Sunny Sunday morning coffee, sweet acoustic guitar and uplifting melodies' },
  { label: '🌃 Night City Drive', text: 'Late night highway drive under neon lights, synthwave and deep vibes' },
];

const HomePage = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const activeMoodKey = useSelector((state) => state.audio.activeMood) || 'happy';
  const currentSong = useSelector((state) => state.audio.currentSong);
  const isPlaying = useSelector((state) => state.audio.isPlaying);

  const [personalizedPicks, setPersonalizedPicks] = useState(DEFAULT_AURA_PICKS);
  const [detectedConfidence, setDetectedConfidence] = useState('93% Confidence');
  const [isLoading, setIsLoading] = useState(false);

  // Modals state
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isVoiceOpen, setIsVoiceOpen] = useState(false);
  const [isTypeOpen, setIsTypeOpen] = useState(false);
  const [sceneInput, setSceneInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState('');

  const webcamRef = useRef(null);
  const recognitionRef = useRef(null);

  const displayName = user?.full_name ? user.full_name.split(' ')[0] : 'Abhishek';
  const mood = MOOD_META[activeMoodKey.toLowerCase()] || MOOD_META.happy;

  // Fetch initial personalized recommendations based on current mood
  useEffect(() => {
    try {
      const stored = localStorage.getItem('aura_picks');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length >= 3) {
          setPersonalizedPicks(parsed.slice(0, 3));
          return;
        }
      }
    } catch (e) {}

    // Load from backend recommendations
    axios
      .post(`${API_BASE_URL}/api/recommendations`, {
        mood: activeMoodKey,
        limit: 6,
        user_id: 'default',
      })
      .then((res) => {
        if (res.data.recommendations?.length >= 3) {
          setPersonalizedPicks(res.data.recommendations.slice(0, 3));
          localStorage.setItem('aura_picks', JSON.stringify(res.data.recommendations));
        }
      })
      .catch(() => {
        // Retain DEFAULT_AURA_PICKS on error
      });
  }, [activeMoodKey]);

  // Play a pick directly through global persistent audio dock
  const handlePlaySong = (song) => {
    dispatch(setQueue(personalizedPicks));
    dispatch(playSong(song));
  };

  // Text Pipeline (NLP synthesis)
  const handleTypeSubmit = async (textToRun) => {
    const text = textToRun || sceneInput;
    if (!text.trim()) return;

    setIsLoading(true);
    try {
      const moodRes = await axios.post(`${API_BASE_URL}/api/detect-mood-text`, { text });
      const dMood = moodRes.data.mood || 'happy';
      const conf = moodRes.data.confidence ? `${Math.round(moodRes.data.confidence)}% Confidence` : '94% Confidence';

      dispatch(setActiveMood(dMood));
      setDetectedConfidence(conf);

      // Fetch fresh picks for this detected mood
      const recRes = await axios.post(`${API_BASE_URL}/api/recommendations`, {
        mood: dMood,
        mood_distribution: moodRes.data.mood_distribution || { [dMood]: 100 },
        limit: 6,
        user_id: 'default',
      });

      if (recRes.data.recommendations?.length >= 3) {
        setPersonalizedPicks(recRes.data.recommendations.slice(0, 3));
        localStorage.setItem('aura_picks', JSON.stringify(recRes.data.recommendations));
      }
      setIsTypeOpen(false);
      setSceneInput('');
    } catch (err) {
      console.error('Type mood pipeline failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Voice Pipeline (Web Speech API)
  const handleVoiceToggle = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser. Please use Chrome or Edge.');
      return;
    }

    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
      return;
    }

    setIsVoiceOpen(true);
    setVoiceTranscript('');
    setIsRecording(true);

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = true;

    recognition.onresult = (e) => {
      const transcript = Array.from(e.results)
        .map((result) => result[0].transcript)
        .join('');
      setVoiceTranscript(transcript);
      if (e.results[0].isFinal) {
        setIsRecording(false);
        setIsVoiceOpen(false);
        handleTypeSubmit(transcript);
      }
    };

    recognition.onerror = () => {
      setIsRecording(false);
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
    } catch (e) {
      setIsRecording(false);
    }
  };

  // Camera Capture & Facial Analysis Pipeline
  const handleCaptureFace = async () => {
    if (!webcamRef.current) return;
    try {
      const imageSrc = webcamRef.current.getScreenshot();
      if (!imageSrc) return;

      setIsLoading(true);
      const blob = await (await fetch(imageSrc)).blob();
      const formData = new FormData();
      formData.append('file', blob, 'webcam_face.jpg');

      const res = await axios.post(`${API_BASE_URL}/detect-mood`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const detectedMood = res.data.mood || 'happy';
      const conf = res.data.confidence ? `${Math.round(res.data.confidence)}% Confidence` : '93% Confidence';

      dispatch(setActiveMood(detectedMood));
      setDetectedConfidence(conf);

      // Fetch picks
      const recRes = await axios.post(`${API_BASE_URL}/api/recommendations`, {
        mood: detectedMood,
        limit: 6,
        user_id: 'default',
      });

      if (recRes.data.recommendations?.length >= 3) {
        setPersonalizedPicks(recRes.data.recommendations.slice(0, 3));
        localStorage.setItem('aura_picks', JSON.stringify(recRes.data.recommendations));
      }

      setIsCameraOpen(false);
    } catch (err) {
      console.error('Face detection failed:', err);
      alert('Camera mood detection failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative w-full min-h-[calc(100vh-5rem)] flex flex-col justify-between p-4 sm:p-6 lg:p-8 animate-fadeIn">
      {/* ============================================================== */}
      {/* 1. CINEMATIC FULL-BLEED ARTWORK BACKGROUND                     */}
      {/* Boy with headphones on rocks gazing at cosmic dusk sunset ring */}
      {/* ============================================================== */}
      <div
        className="fixed inset-0 pointer-events-none z-0 bg-cover bg-center transition-all duration-1000"
        style={{
          backgroundImage: `url('/assets/aura-hero-bg.jpg')`,
          backgroundPosition: 'center 40%',
        }}
      >
        {/* Soft Vignette and Cinematic Atmospheric Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-obsidian-950 via-obsidian-950/40 to-obsidian-950/70" />
        <div className="absolute inset-0 bg-radial-vignette opacity-60" />
      </div>

      {/* Main Container Stage */}
      <div className="relative z-10 max-w-7xl mx-auto w-full flex-1 flex flex-col justify-between space-y-8 sm:space-y-12">
        {/* ============================================================== */}
        {/* 2. TOP HERO ROW: Left Headline + Right Floating Emotion Card  */}
        {/* ============================================================== */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start pt-4 sm:pt-8">
          {/* LEFT: Greeting, Headline & Tri-Modal Action Buttons */}
          <div className="lg:col-span-7 space-y-4 sm:space-y-6">
            <div>
              <p className="text-sm sm:text-base font-semibold text-slate-200 tracking-wide drop-shadow-md">
                Hi {displayName} 👋
              </p>
              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-tight mt-1 drop-shadow-lg">
                {mood.headline}
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 max-w-lg mt-2 leading-relaxed drop-shadow">
                {mood.subtitle}
              </p>
            </div>

            {/* Tri-Modal Action Buttons: Camera (Glowing Pill) + Voice + Type */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              {/* 📸 Detect Mood with Camera (Active Glowing Pill) */}
              <button
                onClick={() => setIsCameraOpen(true)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-500 text-white font-semibold text-xs sm:text-sm shadow-[0_4px_25px_rgba(168,85,247,0.45)] hover:shadow-[0_6px_30px_rgba(168,85,247,0.65)] hover:scale-105 active:scale-95 transition-all duration-300 border border-purple-400/30"
              >
                <span>📸</span>
                <span>Detect Mood with Camera</span>
              </button>

              {/* 🎙️ Voice Pill */}
              <button
                onClick={handleVoiceToggle}
                className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-white font-medium text-xs sm:text-sm backdrop-blur-xl shadow-lg hover:scale-105 active:scale-95 transition-all duration-300"
              >
                <span>🎙️</span>
                <span>Voice</span>
              </button>

              {/* ✍️ Type Pill */}
              <button
                onClick={() => setIsTypeOpen(true)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-white font-medium text-xs sm:text-sm backdrop-blur-xl shadow-lg hover:scale-105 active:scale-95 transition-all duration-300"
              >
                <span>✍️</span>
                <span>Type</span>
              </button>
            </div>
          </div>

          {/* RIGHT: Floating Detected Emotion Glass Card */}
          <div className="lg:col-span-5 flex justify-start lg:justify-end">
            <div className="relative w-full max-w-sm rounded-3xl bg-slate-900/60 backdrop-blur-2xl border border-white/15 p-6 shadow-2xl transition-all duration-500 hover:border-purple-500/40 group overflow-hidden">
              {/* Ambient Inner Halo */}
              <div
                className="absolute -top-12 -right-12 w-36 h-36 rounded-full blur-2xl opacity-30 pointer-events-none transition-all duration-700"
                style={{ backgroundColor: mood.color }}
              />

              <div className="relative z-10 space-y-3">
                <span className="text-xs font-medium text-slate-400 tracking-wide uppercase font-mono">
                  Detected Emotion
                </span>

                <div className="flex items-center gap-3">
                  <span className="text-4xl sm:text-5xl drop-shadow-md select-none animate-bounce" style={{ animationDuration: '3s' }}>
                    {mood.emoji}
                  </span>
                  <div>
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                      {mood.name}
                    </h2>
                    <p className="text-xs text-slate-400 font-mono">
                      {detectedConfidence}
                    </p>
                  </div>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  {mood.description}
                </p>

                {/* Glowing Audio Waveform Line (Golden / Amber Wave) */}
                <div className="pt-2">
                  <svg className="w-full h-9 overflow-visible" viewBox="0 0 240 40">
                    <defs>
                      <linearGradient id="amberWaveGlow" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.3" />
                        <stop offset="35%" stopColor="#F59E0B" stopOpacity="1" />
                        <stop offset="70%" stopColor="#EC4899" stopOpacity="0.9" />
                        <stop offset="100%" stopColor="#A855F7" stopOpacity="0.4" />
                      </linearGradient>
                    </defs>
                    <path
                      d="M 0,20 Q 20,20 35,20 T 65,20 T 85,7 T 105,33 T 125,12 T 145,28 T 165,16 T 185,24 T 205,20 T 240,20"
                      fill="none"
                      stroke="url(#amberWaveGlow)"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      className="transition-all duration-700"
                      style={{
                        filter: 'drop-shadow(0px 0px 8px rgba(245, 158, 11, 0.7))',
                      }}
                    />
                  </svg>
                </div>

                {/* Quick Mood Switcher (Subtle Dots to Switch Moods) */}
                <div className="pt-2 border-t border-white/10 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 font-mono">Switch Vibe:</span>
                  <div className="flex items-center gap-1.5">
                    {Object.entries(MOOD_META).map(([key, item]) => {
                      const isSelected = activeMoodKey.toLowerCase() === key;
                      return (
                        <button
                          key={key}
                          onClick={() => dispatch(setActiveMood(key))}
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-xs transition-all ${
                            isSelected
                              ? 'bg-white/20 border border-white/40 scale-110 shadow-sm'
                              : 'opacity-50 hover:opacity-100 hover:scale-105'
                          }`}
                          title={item.name}
                        >
                          {item.emoji}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ============================================================== */}
        {/* 3. BOTTOM ROW: "Your Personalized Picks" (3 Large Glass Cards) */}
        {/* ============================================================== */}
        <div className="space-y-4 pt-4 sm:pt-8 pb-4">
          <h3 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2 drop-shadow">
            <span>Your Personalized Picks</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            {personalizedPicks.slice(0, 3).map((song) => {
              const isCurrentPlaying = currentSong?.youtube_id === song.youtube_id && isPlaying;

              return (
                <div
                  key={song.id || song.youtube_id || song.name}
                  onClick={() => handlePlaySong(song)}
                  className="group relative flex items-center justify-between p-3.5 sm:p-4 rounded-2xl bg-slate-900/50 hover:bg-slate-900/70 border border-white/10 hover:border-purple-500/50 backdrop-blur-2xl shadow-xl hover:shadow-2xl transition-all duration-300 cursor-pointer overflow-hidden"
                >
                  {/* Left Side: Artwork Thumbnail + Metadata */}
                  <div className="flex items-center gap-3.5 min-w-0 pr-3">
                    <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden flex-shrink-0 bg-obsidian-800 shadow-md">
                      <img
                        src={song.image || 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=300&auto=format&fit=crop&q=80'}
                        alt={song.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                      {/* Playing Indicator Overlay */}
                      {isCurrentPlaying && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                          <div className="flex items-end gap-0.5 h-4">
                            <span className="w-1 bg-cyan rounded-full animate-pulse h-full" />
                            <span className="w-1 bg-purple-400 rounded-full animate-pulse h-2/3" />
                            <span className="w-1 bg-amber-400 rounded-full animate-pulse h-4/5" />
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="min-w-0">
                      <h4 className="text-sm sm:text-base font-bold text-white group-hover:text-purple-300 transition-colors truncate">
                        {song.name}
                      </h4>
                      <p className="text-xs text-slate-400 truncate mt-0.5">
                        {song.artist}
                      </p>
                    </div>
                  </div>

                  {/* Right Side: Red YouTube Play Pill */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePlaySong(song);
                    }}
                    className="flex-shrink-0 w-11 h-7 sm:w-12 sm:h-8 rounded-lg bg-[#FF0000] hover:bg-[#D90000] text-white flex items-center justify-center shadow-md hover:scale-110 active:scale-95 transition-all duration-200"
                    title={`Play ${song.name} on YouTube`}
                  >
                    <svg className="w-4 h-4 fill-current ml-0.5" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* MODAL 1: CAMERA SCAN MODAL                                     */}
      {/* ============================================================== */}
      {isCameraOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-2xl flex items-center justify-center p-4 animate-fadeIn">
          <div className="relative w-full max-w-md rounded-3xl bg-obsidian-900 border border-white/15 p-6 shadow-2xl text-center space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-500 animate-ping" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                  Face Emotion Scanner
                </h3>
              </div>
              <button
                onClick={() => setIsCameraOpen(false)}
                className="text-slate-400 hover:text-white text-xs px-2.5 py-1 rounded-lg hover:bg-white/10"
              >
                ✕ Close
              </button>
            </div>

            <div className="relative rounded-2xl overflow-hidden aspect-video bg-black border border-white/10 shadow-inner">
              <Webcam
                ref={webcamRef}
                audio={false}
                screenshotFormat="image/jpeg"
                videoConstraints={{ facingMode: 'user', width: 640, height: 480 }}
                className="w-full h-full object-cover"
              />
              {/* Sci-Fi Target Reticle */}
              <div className="absolute inset-0 border-2 border-purple-500/30 rounded-2xl pointer-events-none flex items-center justify-center">
                <div className="w-36 h-36 border border-cyan/40 rounded-full animate-pulse" />
              </div>
            </div>

            <p className="text-xs text-slate-400">
              Look directly at the camera with your natural expression.
            </p>

            <button
              onClick={handleCaptureFace}
              disabled={isLoading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-purple-600/40 hover:scale-105 active:scale-95 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Analyzing Facial Expression...</span>
                </>
              ) : (
                <>
                  <span>📸</span>
                  <span>Capture & Detect Mood</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 2: VOICE LISTENER MODAL                                  */}
      {/* ============================================================== */}
      {isVoiceOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-2xl flex items-center justify-center p-4 animate-fadeIn">
          <div className="relative w-full max-w-md rounded-3xl bg-obsidian-900 border border-white/15 p-6 shadow-2xl text-center space-y-5">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                  Voice Mood Listener
                </h3>
              </div>
              <button
                onClick={() => {
                  recognitionRef.current?.stop();
                  setIsVoiceOpen(false);
                  setIsRecording(false);
                }}
                className="text-slate-400 hover:text-white text-xs px-2.5 py-1 rounded-lg hover:bg-white/10"
              >
                ✕ Close
              </button>
            </div>

            {/* Glowing Microphone Visualizer */}
            <div className="py-6 flex flex-col items-center justify-center">
              <div className="relative w-20 h-20 rounded-full bg-rose-500/20 border border-rose-500/40 flex items-center justify-center animate-pulse">
                <span className="text-3xl">🎙️</span>
                <div className="absolute inset-0 rounded-full border-2 border-rose-400/60 animate-ping" />
              </div>

              <p className="text-sm font-semibold text-white mt-4">
                Listening to your tone and words...
              </p>
              <p className="text-xs text-slate-400 mt-1 max-w-xs">
                Speak freely (e.g. &quot;I had a hectic work day, I want peaceful acoustic tunes&quot;)
              </p>
            </div>

            {voiceTranscript && (
              <div className="p-3 rounded-xl bg-obsidian-950/80 border border-white/10 text-xs text-purple-300 font-mono italic">
                &ldquo;{voiceTranscript}&rdquo;
              </div>
            )}

            <button
              onClick={() => {
                recognitionRef.current?.stop();
                setIsRecording(false);
                setIsVoiceOpen(false);
                if (voiceTranscript) {
                  handleTypeSubmit(voiceTranscript);
                }
              }}
              className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium text-xs transition-colors"
            >
              Stop & Curate
            </button>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 3: TYPE SCENE MODAL                                      */}
      {/* ============================================================== */}
      {isTypeOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-2xl flex items-center justify-center p-4 animate-fadeIn">
          <div className="relative w-full max-w-lg rounded-3xl bg-obsidian-900 border border-white/15 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan animate-pulse" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                  Type The Scene • Narrative Vibe
                </h3>
              </div>
              <button
                onClick={() => setIsTypeOpen(false)}
                className="text-slate-400 hover:text-white text-xs px-2.5 py-1 rounded-lg hover:bg-white/10"
              >
                ✕ Close
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Describe how you feel, your current setting, or what kind of music you crave:
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleTypeSubmit();
              }}
              className="space-y-3"
            >
              <textarea
                rows={3}
                value={sceneInput}
                onChange={(e) => setSceneInput(e.target.value)}
                placeholder="e.g. 3am rainy study session, gentle lo-fi beats, peaceful and reflective..."
                className="w-full bg-obsidian-950/90 text-white text-xs sm:text-sm p-3.5 rounded-xl border border-white/15 focus:outline-none focus:border-purple-500 transition-all placeholder:text-slate-500 resize-none shadow-inner"
              />

              {/* Preset Chips */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {PROMPT_CHIPS.map((chip) => (
                  <button
                    key={chip.label}
                    type="button"
                    onClick={() => {
                      setSceneInput(chip.text);
                      handleTypeSubmit(chip.text);
                    }}
                    className="text-[11px] px-3 py-1 rounded-full bg-white/5 hover:bg-white/15 text-slate-300 hover:text-white border border-white/10 hover:border-purple-500/40 transition-all"
                  >
                    {chip.label}
                  </button>
                ))}
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={!sceneInput.trim() || isLoading}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-purple-600/40 hover:scale-[1.02] active:scale-95 disabled:opacity-40 disabled:pointer-events-none transition-all flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Synthesizing Mood & Recommendations...</span>
                    </>
                  ) : (
                    <span>Curate My Soundtrack</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default HomePage;
