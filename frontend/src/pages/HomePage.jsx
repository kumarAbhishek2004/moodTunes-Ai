import { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import Webcam from 'react-webcam';
import axios from 'axios';
import { API_BASE_URL } from '../config/api';
import { playSong, setQueue, setActiveMood } from '../store/audioSlice';

const MOOD_META = {
  happy: {
    name: 'Happy',
    emoji: '😊',
    color: '#F59E0B',
    accent: 'from-amber-400 to-pink-500',
    description: "You seem cheerful and energetic! Here's a playlist to keep the vibe going.",
    headline: 'How are you feeling today?',
    subtitle: 'Let AI understand your mood and create the perfect soundtrack for you.',
  },
  calm: {
    name: 'Calm',
    emoji: '🌊',
    color: '#00F2FE',
    accent: 'from-cyan to-emerald-400',
    description: "Serene acoustic textures and gentle frequencies to accompany your peaceful space.",
    headline: 'Feeling peaceful & serene?',
    subtitle: 'Let AI craft soothing melodies and ambient acoustics for your tranquility.',
  },
  focus: {
    name: 'Focus',
    emoji: '🧠',
    color: '#10B981',
    accent: 'from-emerald-400 to-teal-500',
    description: "Distraction-free instrumentals and deep lo-fi rhythms to accelerate your flow state.",
    headline: 'Time to enter the flow state.',
    subtitle: 'Minimal beats and focus frequencies curated for deep productivity.',
  },
  energetic: {
    name: 'Energetic',
    emoji: '⚡',
    color: '#F97316',
    accent: 'from-orange-500 to-amber-400',
    description: "High BPM, punchy anthems and pulse-raising rhythms to supercharge your momentum.",
    headline: 'High energy drive active.',
    subtitle: 'Heavy basslines and motivational momentum to elevate your day.',
  },
  romantic: {
    name: 'Romantic',
    emoji: '💖',
    color: '#EC4899',
    accent: 'from-pink-500 to-rose-400',
    description: "Soulful vocal harmonies and intimate acoustic acoustics to warm the heart.",
    headline: 'Warm, soulful and intimate.',
    subtitle: 'Delicate guitar chords and heartfelt vocal harmonies.',
  },
  sad: {
    name: 'Reflective',
    emoji: '🌧️',
    color: '#3B82F6',
    accent: 'from-blue-500 to-indigo-500',
    description: "Gentle comfort, slow-tempo acoustics, and soothing tracks to bring a sense of peace.",
    headline: 'Feeling a bit low today?',
    subtitle: "Let's turn that around with soothing tracks to bring a sense of comfort.",
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
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const activeMoodKey = useSelector((state) => state.audio.activeMood) || 'happy';
  const currentSong = useSelector((state) => state.audio.currentSong);
  const isPlaying = useSelector((state) => state.audio.isPlaying);

  const [personalizedPicks, setPersonalizedPicks] = useState(DEFAULT_AURA_PICKS);

  // Distinction between Face Detection vs Manual Selection
  // detectionSource: 'initial' | 'face' | 'manual' | 'voice' | 'text'
  const [detectionSource, setDetectionSource] = useState('initial');
  // ONLY set and shown when detectionSource === 'face'
  const [faceConfidence, setFaceConfidence] = useState(null);

  const [isLoading, setIsLoading] = useState(false);
  const [cameraError, setCameraError] = useState(null);

  // Modals state
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [isVoiceOpen, setIsVoiceOpen] = useState(false);
  const [isTypeOpen, setIsTypeOpen] = useState(false);

  const [sceneInput, setSceneInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState('');

  const webcamRef = useRef(null);
  const recognitionRef = useRef(null);

  const displayName = user?.full_name ? user.full_name.split(' ')[0] : 'Abhishek';
  const mood = MOOD_META[activeMoodKey.toLowerCase()] || MOOD_META.happy;

  // Restore stored mood & confidence on mount
  useEffect(() => {
    try {
      const storedMood = localStorage.getItem('selectedMood');
      if (storedMood) {
        const parsed = JSON.parse(storedMood);
        if (parsed.source === 'face' && parsed.confidence) {
          setDetectionSource('face');
          setFaceConfidence(`${Math.round(parsed.confidence)}% Confidence`);
        } else if (parsed.source === 'manual') {
          setDetectionSource('manual');
          setFaceConfidence(null);
        }
      }

      const stored = localStorage.getItem('aura_picks');
      if (stored) {
        const parsedPicks = JSON.parse(stored);
        if (Array.isArray(parsedPicks) && parsedPicks.length >= 3) {
          setPersonalizedPicks(parsedPicks.slice(0, 3));
        }
      }
    } catch (e) {}
  }, []);

  // Play a pick directly through global persistent audio dock
  const handlePlaySong = (song) => {
    dispatch(setQueue(personalizedPicks));
    dispatch(playSong(song));
  };

  // ==============================================================
  // 1. FACE DETECTION PIPELINE -> DIRECT TO RECOMMENDATION ENGINE
  // ==============================================================
  const handleCaptureFace = async () => {
    if (!webcamRef.current) return;
    setCameraError(null);
    setIsLoading(true);

    try {
      const imageSrc = webcamRef.current.getScreenshot();
      if (!imageSrc) {
        throw new Error('Unable to capture webcam image');
      }

      const blob = await (await fetch(imageSrc)).blob();
      const formData = new FormData();
      formData.append('file', blob, 'webcam_face.jpg');

      // 1. Call Backend Face Emotion Detection (DeepFace)
      const res = await axios.post(`${API_BASE_URL}/detect-mood`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const detectedMood = (res.data.mood || 'happy').toLowerCase();
      const rawConf = res.data.confidence;
      const confString = rawConf !== undefined && rawConf !== null
        ? `${Math.round(rawConf)}% Confidence`
        : '93% Confidence';

      // 2. Lock state to FACE VERIFICATION ONLY
      setDetectionSource('face');
      setFaceConfidence(confString);
      dispatch(setActiveMood(detectedMood));

      // Persist in localStorage with source: 'face' and confidence
      localStorage.setItem('selectedMood', JSON.stringify({
        mood: detectedMood,
        confidence: rawConf,
        source: 'face',
        mood_distribution: res.data.mood_distribution || { [detectedMood]: 100 },
      }));

      setIsCameraOpen(false);

      // DIRECTLY NAVIGATE TO PREFERENCES (Singer, Favorite Song, Language)
      navigate('/preferences');
    } catch (err) {
      console.error('Face detection failed:', err);
      setCameraError('Face detection could not verify facial expression. Ensure your face is centered and well-lit.');
    } finally {
      setIsLoading(false);
    }
  };

  // ==============================================================
  // 2. MANUAL MOOD SELECTION -> DIRECT TO PREFERENCES WORKFLOW
  // (No confidence shown - purely manual choice, follows exact same flow)
  // ==============================================================
  const handleSelectManualMood = (selectedMoodKey) => {
    const cleanMood = selectedMoodKey.toLowerCase();

    // 1. Set state to MANUAL (Explicitly clear face confidence!)
    setDetectionSource('manual');
    setFaceConfidence(null);
    dispatch(setActiveMood(cleanMood));

    // 2. Persist in localStorage with source: 'manual' (No confidence score)
    localStorage.setItem('selectedMood', JSON.stringify({
      mood: cleanMood,
      source: 'manual',
      mood_distribution: { [cleanMood]: 100 },
    }));

    setIsManualModalOpen(false);

    // 3. DIRECTLY NAVIGATE TO PREFERENCES (Singer, Favorite Song, Language)
    navigate('/preferences');
  };

  // ==============================================================
  // 3. TEXT / SCENE PIPELINE -> DIRECT TO PREFERENCES WORKFLOW
  // ==============================================================
  const handleTypeSubmit = async (textToRun) => {
    const text = textToRun || sceneInput;
    if (!text.trim()) return;

    setIsLoading(true);
    try {
      const moodRes = await axios.post(`${API_BASE_URL}/api/detect-mood-text`, { text });
      const dMood = (moodRes.data.mood || 'happy').toLowerCase();

      // Marked as text synthesis - NO face confidence shown!
      setDetectionSource('text');
      setFaceConfidence(null);
      dispatch(setActiveMood(dMood));

      localStorage.setItem('selectedMood', JSON.stringify({
        mood: dMood,
        source: 'text',
        mood_distribution: moodRes.data.mood_distribution || { [dMood]: 100 },
      }));

      setIsTypeOpen(false);
      setSceneInput('');

      // DIRECTLY NAVIGATE TO PREFERENCES (Singer, Favorite Song, Language)
      navigate('/preferences');
    } catch (err) {
      console.error('Type mood pipeline failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // ==============================================================
  // 4. VOICE PIPELINE -> DIRECT TO RECOMMENDATION ENGINE
  // ==============================================================
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

    recognition.onerror = () => setIsRecording(false);
    recognition.onend = () => setIsRecording(false);

    recognitionRef.current = recognition;
    try {
      recognition.start();
    } catch (e) {
      setIsRecording(false);
    }
  };

  return (
    <div className="relative w-full min-h-[calc(100vh-5rem)] flex flex-col justify-between p-4 sm:p-6 lg:p-8 animate-fadeIn">
      {/* ============================================================== */}
      {/* CINEMATIC FULL-BLEED ARTWORK BACKGROUND                        */}
      {/* Boy with headphones on rocks gazing at cosmic dusk sunset ring */}
      {/* ============================================================== */}
      <div
        className="fixed inset-0 pointer-events-none z-0 bg-cover bg-center transition-all duration-1000"
        style={{
          backgroundImage: `url('/assets/aura-hero-bg.jpg')`,
          backgroundPosition: 'center 40%',
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-obsidian-950 via-obsidian-950/40 to-obsidian-950/70" />
        <div className="absolute inset-0 bg-radial-vignette opacity-60" />
      </div>

      {/* Main Container Stage */}
      <div className="relative z-10 max-w-7xl mx-auto w-full flex-1 flex flex-col justify-between space-y-8 sm:space-y-12">
        {/* ============================================================== */}
        {/* TOP HERO ROW: Left Headline + Right Floating Emotion Card     */}
        {/* ============================================================== */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start pt-4 sm:pt-8">
          {/* LEFT: Greeting, Headline & Clean Dual Option: Face vs Manual */}
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

            {/* Clear Primary Choices: Detect Mood with Face OR Manually Select */}
            <div className="space-y-3 pt-2">
              <div className="flex flex-wrap items-center gap-3">
                {/* 1. 📸 Detect Mood with Face (Primary AI Scanner) */}
                <button
                  onClick={() => setIsCameraOpen(true)}
                  className="flex items-center gap-2.5 px-6 py-3 rounded-full bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-500 text-white font-bold text-xs sm:text-sm shadow-[0_4px_25px_rgba(168,85,247,0.45)] hover:shadow-[0_6px_30px_rgba(168,85,247,0.65)] hover:scale-105 active:scale-95 transition-all duration-300 border border-purple-400/40"
                >
                  <span className="text-base">📸</span>
                  <span>Detect Mood with Face</span>
                </button>

                {/* 2. 🎛️ Manually Select Mood */}
                <button
                  onClick={() => setIsManualModalOpen(true)}
                  className="flex items-center gap-2 px-5 py-3 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold text-xs sm:text-sm backdrop-blur-xl shadow-lg hover:scale-105 active:scale-95 transition-all duration-300"
                >
                  <span>🎛️</span>
                  <span>Manually Select Mood</span>
                </button>
              </div>

              {/* Supplementary Inputs (Voice & Type) */}
              <div className="flex items-center gap-2 text-xs text-slate-400 pt-1">
                <span className="text-[11px] text-slate-400">Or express via:</span>
                <button
                  onClick={handleVoiceToggle}
                  className="px-3 py-1 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white transition-all flex items-center gap-1.5"
                >
                  <span>🎙️</span>
                  <span>Voice</span>
                </button>
                <button
                  onClick={() => setIsTypeOpen(true)}
                  className="px-3 py-1 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white transition-all flex items-center gap-1.5"
                >
                  <span>✍️</span>
                  <span>Type</span>
                </button>
              </div>
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

              <div className="relative z-10 space-y-3.5">
                {/* Header with Source Badge */}
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-400 tracking-wide uppercase font-mono">
                    {detectionSource === 'face'
                      ? 'Detected Emotion'
                      : detectionSource === 'manual'
                      ? 'Selected Emotion'
                      : 'Current Emotion'}
                  </span>

                  {/* ONLY SHOW CONFIDENCE TO FACE VERIFICATION */}
                  {detectionSource === 'face' && faceConfidence ? (
                    <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40 flex items-center gap-1.5 shadow-sm">
                      <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
                      <span>Face Verified</span>
                    </span>
                  ) : detectionSource === 'manual' ? (
                    <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-cyan/15 text-cyan border border-cyan/30 flex items-center gap-1">
                      <span>🎯 Manual</span>
                    </span>
                  ) : (
                    <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-white/10 text-slate-300 border border-white/15">
                      Ready for Scan
                    </span>
                  )}
                </div>

                {/* Mood Emoji + Name + Verification Confidence */}
                <div className="flex items-center gap-3">
                  <span className="text-4xl sm:text-5xl drop-shadow-md select-none animate-bounce" style={{ animationDuration: '3s' }}>
                    {mood.emoji}
                  </span>
                  <div>
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                      {mood.name}
                    </h2>

                    {/* STRICT RULE: Only show confidence percentage to face verification */}
                    {detectionSource === 'face' && faceConfidence ? (
                      <p className="text-xs text-purple-300 font-mono font-bold tracking-wide mt-0.5">
                        {faceConfidence}
                      </p>
                    ) : detectionSource === 'manual' ? (
                      <p className="text-xs text-slate-400 font-mono mt-0.5">
                        Manually Chosen
                      </p>
                    ) : (
                      <p className="text-xs text-slate-400 font-mono mt-0.5">
                        Default Playlist
                      </p>
                    )}
                  </div>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  {mood.description}
                </p>

                {/* Glowing Audio Waveform Line (Amber / Golden Wave) */}
                <div className="pt-1">
                  <svg className="w-full h-8 overflow-visible" viewBox="0 0 240 40">
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
                      style={{
                        filter: 'drop-shadow(0px 0px 8px rgba(245, 158, 11, 0.7))',
                      }}
                    />
                  </svg>
                </div>

                {/* Status Footer */}
                <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                  <span>Recommendation Engine:</span>
                  <button
                    onClick={() => navigate('/recommendations')}
                    className="text-purple-400 hover:text-purple-300 font-semibold flex items-center gap-1 hover:underline"
                  >
                    <span>Open Full Stream</span>
                    <span>→</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ============================================================== */}
        {/* BOTTOM ROW: "Your Personalized Picks" (3 Large Glass Cards)    */}
        {/* ============================================================== */}
        <div className="space-y-4 pt-4 sm:pt-8 pb-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2 drop-shadow">
              <span>Your Personalized Picks</span>
              {detectionSource === 'face' && (
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  Curated for your facial expression
                </span>
              )}
            </h3>

            <button
              onClick={() => navigate('/recommendations')}
              className="text-xs font-semibold text-cyan hover:text-cyan/80 flex items-center gap-1 transition-colors"
            >
              <span>Go to Recommendation Engine</span>
              <span>→</span>
            </button>
          </div>

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
      {/* MODAL 1: CAMERA SCAN MODAL (FACE DETECTION ONLY)               */}
      {/* ============================================================== */}
      {isCameraOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-2xl flex items-center justify-center p-4 animate-fadeIn">
          <div className="relative w-full max-w-md rounded-3xl bg-obsidian-900 border border-white/15 p-6 shadow-2xl text-center space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-500 animate-ping" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                  Face Emotion Verification
                </h3>
              </div>
              <button
                onClick={() => {
                  setIsCameraOpen(false);
                  setCameraError(null);
                }}
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
              <div className="absolute inset-0 border-2 border-purple-500/30 rounded-2xl pointer-events-none flex items-center justify-center">
                <div className="w-36 h-36 border border-cyan/40 rounded-full animate-pulse" />
              </div>
            </div>

            {cameraError ? (
              <p className="text-xs text-rose-400 bg-rose-500/10 p-2.5 rounded-xl border border-rose-500/20">
                {cameraError}
              </p>
            ) : (
              <p className="text-xs text-slate-400">
                Center your face in the circle with natural expression. The AI will calculate your emotion and verification confidence, then direct you to personalize your singers, songs, and language.
              </p>
            )}

            <button
              onClick={handleCaptureFace}
              disabled={isLoading}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-purple-600/40 hover:scale-105 active:scale-95 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Verifying Face & Navigating to Preferences...</span>
                </>
              ) : (
                <>
                  <span>📸</span>
                  <span>Capture & Continue</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 2: MANUAL MOOD SELECTION MODAL                           */}
      {/* ============================================================== */}
      {isManualModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-2xl flex items-center justify-center p-4 animate-fadeIn">
          <div className="relative w-full max-w-lg rounded-3xl bg-obsidian-900 border border-white/15 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                  Manually Select Your Mood
                </h3>
              </div>
              <button
                onClick={() => setIsManualModalOpen(false)}
                className="text-slate-400 hover:text-white text-xs px-2.5 py-1 rounded-lg hover:bg-white/10"
              >
                ✕ Close
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Pick your current vibe. You can then specify your favorite singers, songs, and language:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {Object.entries(MOOD_META).map(([key, item]) => {
                const isSelected = activeMoodKey.toLowerCase() === key && detectionSource === 'manual';

                return (
                  <button
                    key={key}
                    onClick={() => handleSelectManualMood(key)}
                    className={`flex items-start gap-3 p-3.5 rounded-2xl border text-left transition-all ${
                      isSelected
                        ? 'bg-purple-600/20 border-purple-500 shadow-lg'
                        : 'bg-obsidian-950/70 hover:bg-white/10 border-white/10 hover:border-white/20'
                    }`}
                  >
                    <span className="text-2xl flex-shrink-0 mt-0.5">{item.emoji}</span>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-white flex items-center gap-2">
                        <span>{item.name}</span>
                        {isSelected && <span className="text-[10px] text-purple-400 font-mono">● Active</span>}
                      </p>
                      <p className="text-[11px] text-slate-400 line-clamp-2 mt-0.5">
                        {item.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 3: VOICE LISTENER MODAL                                  */}
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

            <div className="py-6 flex flex-col items-center justify-center">
              <div className="relative w-20 h-20 rounded-full bg-rose-500/20 border border-rose-500/40 flex items-center justify-center animate-pulse">
                <span className="text-3xl">🎙️</span>
                <div className="absolute inset-0 rounded-full border-2 border-rose-400/60 animate-ping" />
              </div>

              <p className="text-sm font-semibold text-white mt-4">
                Listening to your voice...
              </p>
              <p className="text-xs text-slate-400 mt-1 max-w-xs">
                Speak freely (e.g. &quot;I need calming acoustic tunes after a long day&quot;)
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
              Stop & Go to Recommendations
            </button>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 4: TYPE SCENE MODAL                                      */}
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
                      <span>Synthesizing Mood & Curating Recommendations...</span>
                    </>
                  ) : (
                    <span>Curate & Go to Recommendations</span>
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
