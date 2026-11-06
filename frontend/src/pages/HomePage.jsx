import { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import Webcam from 'react-webcam';
import axios from 'axios';
import { API_BASE_URL } from '../config/api';
import { playSong, setQueue, setActiveMood } from '../store/audioSlice';
import FavoriteTracksSection from '../components/FavoriteTracksSection';
import RotaryMoodDial from '../components/RotaryMoodDial';
import Chatbot from '../components/Chatbot';

const MOOD_WALLPAPERS = {
  happy: '/assets/aura-hero-bg.jpg',
  romantic: '/assets/aura-romantic-bg.jpg',
  calm: '/assets/aura-calm-bg.jpg',
  focus: '/assets/aura-focus-bg.jpg',
  energetic: '/assets/aura-energetic-bg.jpg',
  sad: '/assets/aura-sad-bg.jpg',
};

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
    image: 'https://is1-ssl.mzstatic.com/image/thumb/Music112/v4/9f/13/ca/9f13ca3b-e533-03e0-f19a-f0aaa774581d/196589311191.jpg/600x600bb.jpg',
  },
  {
    id: 'aura-2',
    name: 'Raataan Lambiyan',
    artist: 'Jubin Nautiyal',
    youtube_id: 'gvyUuxdRdR4',
    mood_match: 'Romantic',
    duration: 230,
    image: 'https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/61/65/ae/6165aee9-8bb9-0bd4-02b0-5d0f1e6257a3/886449510238.jpg/600x600bb.jpg',
  },
  {
    id: 'aura-3',
    name: 'Ilahi',
    artist: 'Arijit Singh',
    youtube_id: 'fdubeMFwuGs',
    mood_match: 'Energetic',
    duration: 228,
    image: 'https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/62/d6/74/62d67432-0670-631f-db6a-d4bac3adae4b/8902894353328_cover.jpg/600x600bb.jpg',
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
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);

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

      const storedRecs = localStorage.getItem('recommendations');
      if (storedRecs) {
        const parsedRecs = JSON.parse(storedRecs);
        if (Array.isArray(parsedRecs) && parsedRecs.length > 0) {
          setAllRecommendations(parsedRecs);
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

  // Turn Rotary Mood Dial on front page to morph atmosphere dynamically
  const handleDialSelectMood = (node) => {
    const cleanMood = (node.mappedMood || node.id).toLowerCase();
    setDetectionSource('manual');
    setFaceConfidence(null);
    dispatch(setActiveMood(node.id));

    try {
      localStorage.setItem('selectedMood', JSON.stringify({
        mood: cleanMood,
        source: 'manual',
        confidence: 1.0,
        mood_distribution: { [cleanMood]: 100 },
      }));
    } catch (e) {}
  };

  // Launch Recommendation Engine personalization flow
  const handleCurateWithPreferences = (nodeOrMood) => {
    const targetKey = (nodeOrMood?.mappedMood || nodeOrMood?.id || nodeOrMood?.name || activeMoodKey).toLowerCase();
    handleSelectManualMood(targetKey);
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
      {/* CINEMATIC FULL-BLEED MOOD-ADAPTIVE ARTWORK WALLPAPERS          */}
      {/* Tailored anime backgrounds crossfading smoothly per mood       */}
      {/* ============================================================== */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-obsidian-950">
        {Object.entries(MOOD_WALLPAPERS).map(([moodKey, bgUrl]) => {
          const isActive = activeMoodKey.toLowerCase() === moodKey;
          return (
            <div
              key={moodKey}
              className={`absolute inset-0 bg-cover transition-opacity duration-1000 ease-in-out ${
                isActive ? 'opacity-100' : 'opacity-0'
              }`}
              style={{
                backgroundImage: `url('${bgUrl}')`,
                backgroundPosition: moodKey === 'romantic' ? 'center 35%' : 'center 20%',
              }}
            />
          );
        })}

        {/* Soft atmospheric bottom fade gradient into deep obsidian */}
        <div className="absolute inset-0 bg-gradient-to-t from-obsidian-950 via-obsidian-950/25 to-obsidian-950/45" />

        {/* Subtle cinematic vignette */}
        <div className="absolute inset-0 bg-radial-vignette opacity-35" />
      </div>

      {/* Main Container Stage */}
      <div className="relative z-10 max-w-7xl mx-auto w-full flex-1 flex flex-col justify-between space-y-8 sm:space-y-12">
        {/* ============================================================== */}
        {/* TOP HERO ROW: Left Headline + Right Low-Profile Tactile Dial   */}
        {/* ============================================================== */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-end pt-2 sm:pt-4">
          {/* LEFT: Greeting, Headline & Primary Choices */}
          <div className="lg:col-span-7 xl:col-span-7 space-y-3 sm:space-y-4 pb-1">
            <div>
              <p className="text-sm font-semibold text-slate-200 tracking-wide drop-shadow-md">
                Hi {displayName} 👋
              </p>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight mt-1 drop-shadow-lg">
                {mood.headline}
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 max-w-md mt-1.5 leading-relaxed drop-shadow">
                {mood.subtitle}
              </p>
            </div>

            {/* Clear Primary Choices: Detect Mood with Face OR Manually Select */}
            <div className="space-y-2.5 pt-1">
              <div className="flex flex-wrap items-center gap-2.5">
                {/* 1. 📸 Detect Mood with Face (Primary AI Scanner) */}
                <button
                  type="button"
                  onClick={() => setIsCameraOpen(true)}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-500 text-white font-bold text-xs sm:text-sm shadow-[0_4px_25px_rgba(168,85,247,0.45)] hover:shadow-[0_6px_30px_rgba(168,85,247,0.65)] hover:scale-105 active:scale-95 transition-all duration-300 border border-purple-400/40 cursor-pointer"
                >
                  <span className="text-base">📸</span>
                  <span>Detect Mood with Face</span>
                </button>

                {/* 2. 🎛️ Manually Select Mood */}
                <button
                  type="button"
                  onClick={() => setIsManualModalOpen(true)}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold text-xs sm:text-sm backdrop-blur-xl shadow-lg hover:scale-105 active:scale-95 transition-all duration-300 cursor-pointer"
                >
                  <span>🎛️</span>
                  <span>Select from Grid</span>
                </button>

                {/* 3. 💬 AI Music Chatbot */}
                <button
                  type="button"
                  onClick={() => setIsChatbotOpen(true)}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-gradient-to-r from-purple-600/30 via-pink-600/30 to-purple-600/30 hover:from-purple-600/50 hover:to-pink-600/50 border border-purple-400/40 text-purple-200 hover:text-white font-semibold text-xs sm:text-sm backdrop-blur-xl shadow-lg hover:scale-105 active:scale-95 transition-all duration-300 cursor-pointer"
                >
                  <span className="text-base">💬</span>
                  <span>AI Music Chatbot</span>
                </button>
              </div>

              {/* Supplementary Inputs (Voice & Type) */}
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span className="text-[11px] text-slate-400">Or express via:</span>
                <button
                  type="button"
                  onClick={handleVoiceToggle}
                  className="px-2.5 py-1 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white transition-all flex items-center gap-1 cursor-pointer"
                >
                  <span>🎙️</span>
                  <span>Voice</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsTypeOpen(true)}
                  className="px-2.5 py-1 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white transition-all flex items-center gap-1 cursor-pointer"
                >
                  <span>✍️</span>
                  <span>Type</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsChatbotOpen(true)}
                  className="px-2.5 py-1 rounded-full bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-purple-300 hover:text-white transition-all flex items-center gap-1 cursor-pointer"
                >
                  <span>💬</span>
                  <span>AI Chatbot</span>
                </button>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Micro Tactile Emotion Tuner + Adjusted Chatbot Hub */}
          <div className="lg:col-span-5 xl:col-span-5 flex flex-col items-center lg:items-end justify-end space-y-2 mt-2 lg:mt-0">
            {/* 1. Micro-Profile Tactile Tuner Dial Card */}
            <div className="relative w-full max-w-[240px] sm:max-w-[250px] rounded-2xl bg-slate-950/60 backdrop-blur-xl border border-white/12 p-2 sm:p-2.5 shadow-2xl transition-all duration-500 hover:border-purple-500/35 group overflow-hidden flex flex-col items-center">
              {/* Dynamic Bloom Halo matching active mood */}
              <div
                className="absolute -top-8 -right-8 w-24 h-24 rounded-full blur-2xl opacity-20 pointer-events-none transition-all duration-700"
                style={{ backgroundColor: mood.color }}
              />

              {/* Header: Ultra-Compact Minimal Row */}
              <div className="text-center relative z-10 w-full mb-0">
                <div className="flex items-center justify-between mb-0.5">
                  <span
                    className="text-[8px] font-mono uppercase tracking-widest font-bold px-1.5 py-0.2 rounded-full border transition-all shadow-sm"
                    style={{
                      color: mood.color,
                      backgroundColor: `${mood.color}15`,
                      borderColor: `${mood.color}35`,
                    }}
                  >
                    Tuner
                  </span>

                  {/* Verification / Source Status Pill */}
                  {detectionSource === 'face' && faceConfidence ? (
                    <span className="text-[7.5px] font-mono px-1 py-0.2 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40 flex items-center gap-1 shadow-sm">
                      <span className="w-1 h-1 rounded-full bg-purple-400 animate-pulse" />
                      <span>{faceConfidence}</span>
                    </span>
                  ) : (
                    <span className="text-[7.5px] font-mono px-1 py-0.2 rounded-full bg-cyan/10 text-cyan border border-cyan/25 flex items-center gap-0.5">
                      <span>🎛️ Live Dial</span>
                    </span>
                  )}
                </div>

                <h3 className="text-xs font-bold text-white tracking-tight">
                  Dial Atmosphere
                </h3>
              </div>

              {/* Interactive Rotary Dial (Micro Scaled) */}
              <div className="relative z-10 w-full flex justify-center -my-3.5">
                <RotaryMoodDial
                  compact={true}
                  showPills={false}
                  onSelectMood={handleDialSelectMood}
                  onCurateStream={handleCurateWithPreferences}
                  showCurateButton={false}
                />
              </div>

              {/* Action Footer */}
              <div className="w-full relative z-10 pt-1.5 border-t border-white/10 mt-0 space-y-1">
                <button
                  type="button"
                  onClick={() => handleCurateWithPreferences(mood)}
                  className="w-full flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg font-bold text-[10px] text-obsidian-950 shadow-md transition-all hover:scale-102 active:scale-98 cursor-pointer"
                  style={{
                    background: `linear-gradient(135deg, ${mood.color} 0%, #ffffff 100%)`,
                    boxShadow: `0 3px 12px -3px ${mood.color}66`,
                  }}
                >
                  <span>🚀 Curate Stream</span>
                  <span>→</span>
                </button>

                <div className="flex items-center justify-between text-[8.5px] text-slate-400 font-mono px-0.5">
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: mood.color }} />
                    <strong className="text-white uppercase">{mood.name}</strong>
                  </span>
                  <button
                    type="button"
                    onClick={() => navigate('/recommendations')}
                    className="hover:underline flex items-center font-semibold transition-colors cursor-pointer"
                    style={{ color: mood.color }}
                  >
                    <span>Stream →</span>
                  </button>
                </div>
              </div>
            </div>

            {/* 2. Embedded AI Chatbot Assistant Hub Card (Adjusted right below the dial) */}
            <div className="relative w-full max-w-[240px] sm:max-w-[250px] rounded-xl bg-slate-950/65 backdrop-blur-xl border border-purple-500/30 p-2 shadow-xl transition-all duration-300 hover:border-purple-500/50">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                  <span className="text-[9.5px] font-bold text-white font-mono uppercase tracking-wider">
                    💬 AI Music Chatbot
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsChatbotOpen(true)}
                  className="text-[8.5px] text-purple-300 hover:text-white px-1.5 py-0.5 rounded bg-purple-500/20 border border-purple-500/35 transition-all hover:bg-purple-500/40 cursor-pointer font-medium"
                >
                  Chat ↗
                </button>
              </div>

              <p className="text-[8.5px] text-slate-400 truncate mb-1.5">
                Play songs, request artists, or get vibe picks
              </p>

              <button
                type="button"
                onClick={() => setIsChatbotOpen(true)}
                className="w-full flex items-center justify-between px-2 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white text-[9.5px] transition-all cursor-pointer group"
              >
                <span className="truncate text-slate-400 group-hover:text-slate-200">
                  Ask: "Play romantic songs" or voice...
                </span>
                <span className="text-purple-400 text-xs ml-1">🎙️</span>
              </button>
            </div>
          </div>
        </div>

        {/* ============================================================== */}
        {/* FAVORITE TRACKS SECTION (UP TO 5, CUSTOMIZABLE, DB-SYNCED)     */}
        {/* ============================================================== */}
        <FavoriteTracksSection />
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

      {/* ============================================================== */}
      {/* FLOATING AI CHATBOT ASSISTANT ON HOME PAGE                     */}
      {/* ============================================================== */}
      <Chatbot
        isOpen={isChatbotOpen}
        onToggle={() => setIsChatbotOpen(!isChatbotOpen)}
        currentMood={activeMoodKey}
        onPlaySong={(song) => {
          dispatch(setQueue([song]));
          dispatch(playSong(song));
        }}
        onPlayPlaylist={(playlist) => {
          if (playlist?.songs?.length > 0) {
            dispatch(setQueue(playlist.songs));
            dispatch(playSong(playlist.songs[0]));
          }
        }}
      />
    </div>
  );
};

export default HomePage;
