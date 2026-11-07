import { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import Webcam from 'react-webcam';
import axios from 'axios';
import { API_BASE_URL } from '../config/api';
import { playSong, setQueue, setActiveMood } from '../store/audioSlice';
import { resolveMusicTheme } from '../utils/themeMap';
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
  const rawActiveMood = useSelector((state) => state.audio.activeMood);
  const activeMoodKey = typeof rawActiveMood === 'object' && rawActiveMood !== null
    ? String(rawActiveMood.mood || rawActiveMood.id || 'happy').toLowerCase()
    : String(rawActiveMood || 'happy').toLowerCase();
  const currentSong = useSelector((state) => state.audio.currentSong);
  const isPlaying = useSelector((state) => state.audio.isPlaying);

  // Unified Theme based on active mood & playing track
  const theme = resolveMusicTheme(currentSong, activeMoodKey);

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
  const [toneMetrics, setToneMetrics] = useState({
    energy: 0.2,
    pitch: 160,
    tempo: 0.5,
    energyLabel: 'Calibrating acoustics...',
    pitchLabel: 'Listening for vocal cadence...',
  });
  const [audioWaveform, setAudioWaveform] = useState([18, 28, 42, 22, 54, 34, 68, 46, 26, 18, 30, 20]);
  const [isAnalyzingVoice, setIsAnalyzingVoice] = useState(false);
  const [voiceResultFeedback, setVoiceResultFeedback] = useState(null);

  const webcamRef = useRef(null);
  const recognitionRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const animationFrameRef = useRef(null);
  const isRecordingRef = useRef(false);

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
  // 4. REAL-TIME ACOUSTIC TONE ANALYSIS (Web Audio API)
  // Extracts volume energy (RMS), zero-crossing pitch, & speech tempo
  // ==============================================================
  const startToneAnalysis = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      const audioCtx = new AudioCtx();
      audioContextRef.current = audioCtx;

      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 512;
      analyser.smoothingTimeConstant = 0.8;
      analyserRef.current = analyser;

      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);

      const freqData = new Uint8Array(analyser.frequencyBinCount);
      const timeDomain = new Uint8Array(analyser.fftSize);

      const energyHistory = [];
      const pitchHistory = [];
      let activeFrames = 0;
      let totalFrames = 0;

      const analyzeFrame = () => {
        if (!analyserRef.current || !isRecordingRef.current) return;
        analyser.getByteFrequencyData(freqData);
        analyser.getByteTimeDomainData(timeDomain);

        // 1. RMS Energy
        let sumSquares = 0;
        for (let i = 0; i < timeDomain.length; i++) {
          const norm = (timeDomain[i] - 128) / 128;
          sumSquares += norm * norm;
        }
        const rms = Math.sqrt(sumSquares / timeDomain.length);
        energyHistory.push(rms);
        if (energyHistory.length > 70) energyHistory.shift();

        totalFrames++;
        if (rms > 0.04) activeFrames++;

        // 2. Fundamental pitch via Zero-Crossing Rate
        let crossings = 0;
        for (let i = 1; i < timeDomain.length; i++) {
          if ((timeDomain[i - 1] < 128 && timeDomain[i] >= 128) || (timeDomain[i - 1] >= 128 && timeDomain[i] < 128)) {
            crossings++;
          }
        }
        const approxHz = (crossings / 2) * (audioCtx.sampleRate / timeDomain.length);
        if (approxHz >= 70 && approxHz <= 550 && rms > 0.035) {
          pitchHistory.push(approxHz);
          if (pitchHistory.length > 40) pitchHistory.shift();
        }

        // Live visual waveform (12 bands)
        const step = Math.max(1, Math.floor(freqData.length / 12));
        const bars = [];
        for (let i = 0; i < 12; i++) {
          const val = freqData[i * step] || 0;
          bars.push(Math.max(14, Math.min(100, Math.round((val / 255) * 100))));
        }
        setAudioWaveform(bars);

        const avgEnergy = energyHistory.reduce((a, b) => a + b, 0) / (energyHistory.length || 1);
        const avgPitch = pitchHistory.length > 0
          ? pitchHistory.reduce((a, b) => a + b, 0) / pitchHistory.length
          : 160;
        const speechRatio = totalFrames > 0 ? activeFrames / totalFrames : 0.5;

        let energyLabel = 'Moderate Natural Energy';
        if (avgEnergy > 0.26) energyLabel = 'High Energy & Vibrant';
        else if (avgEnergy < 0.11) energyLabel = 'Soft & Gentle Acoustic';

        let pitchLabel = 'Warm & Balanced Tone';
        if (avgPitch > 200) pitchLabel = 'Bright & Expressive Pitch';
        else if (avgPitch < 130) pitchLabel = 'Deep & Steady Resonant Pitch';

        setToneMetrics({
          energy: avgEnergy,
          pitch: avgPitch,
          tempo: speechRatio,
          energyLabel,
          pitchLabel,
        });

        animationFrameRef.current = requestAnimationFrame(analyzeFrame);
      };

      animationFrameRef.current = requestAnimationFrame(analyzeFrame);
    } catch (err) {
      console.warn('Microphone tone analysis access notice:', err);
    }
  };

  const stopToneAnalysis = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    if (audioContextRef.current) {
      try {
        audioContextRef.current.close();
      } catch (e) {}
      audioContextRef.current = null;
    }
  };

  // ==============================================================
  // 5. CONTINUOUS VOICE + ACOUSTIC TONE AGENT (Only detects on STOP!)
  // ==============================================================
  const handleVoiceToggle = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser. Please use Google Chrome or Microsoft Edge.');
      return;
    }

    if (isRecording) {
      handleStopAndDetectVoice();
      return;
    }

    setIsVoiceOpen(true);
    setVoiceTranscript('');
    setIsRecording(true);
    isRecordingRef.current = true;
    setIsAnalyzingVoice(false);
    setVoiceResultFeedback(null);

    // Start Real-Time Web Audio Tone Analysis
    startToneAnalysis();

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = (e) => {
      const transcript = Array.from(e.results)
        .map((result) => result[0].transcript)
        .join(' ');
      setVoiceTranscript(transcript);
      // STRICT REQUIREMENT: We NEVER stop automatically on isFinal.
      // Continuous listening stays active until user explicitly clicks Stop!
    };

    recognition.onerror = (e) => {
      console.warn('Speech recognition notice:', e.error);
    };

    recognition.onend = () => {
      // If user has not clicked stop, seamlessly keep listening
      if (isRecordingRef.current) {
        try {
          recognition.start();
        } catch (e) {}
      }
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
    } catch (e) {
      console.warn('Recognition start error:', e);
    }
  };

  const handleStopAndDetectVoice = async () => {
    isRecordingRef.current = false;
    setIsRecording(false);
    try {
      recognitionRef.current?.stop();
    } catch (e) {}
    stopToneAnalysis();

    setIsAnalyzingVoice(true);
    try {
      // Transmit spoken words + vocal acoustic tone features to multimodal endpoint
      const res = await axios.post(`${API_BASE_URL}/api/detect-voice-mood`, {
        text: voiceTranscript || '',
        tone_features: {
          energy: toneMetrics.energy,
          pitch: toneMetrics.pitch,
          tempo: toneMetrics.tempo,
        },
      });

      const detectedMood = (res.data.mood || 'happy').toLowerCase();
      const rawConf = res.data.confidence;
      const confString = rawConf !== undefined && rawConf !== null
        ? `${Math.round(rawConf)}% Confidence (Voice & Tone)`
        : '92% Confidence (Voice & Tone)';

      setDetectionSource('voice');
      setFaceConfidence(confString);
      dispatch(setActiveMood(detectedMood));

      localStorage.setItem('selectedMood', JSON.stringify({
        mood: detectedMood,
        confidence: rawConf,
        source: 'voice',
        tone_analysis: res.data.tone_analysis,
        words_analysis: res.data.words_analysis,
        mood_distribution: res.data.mood_distribution || { [detectedMood]: 100 },
      }));

      setVoiceResultFeedback({
        mood: detectedMood,
        explanation: res.data.explanation,
        tone: res.data.tone_analysis,
        words: res.data.words_analysis,
      });

      // After user sees confirmed mood feedback, smoothly transition to preferences
      setTimeout(() => {
        setIsVoiceOpen(false);
        setIsAnalyzingVoice(false);
        navigate('/preferences');
      }, 1400);

    } catch (err) {
      console.error('Voice mood detection failed:', err);
      if (voiceTranscript) {
        handleTypeSubmit(voiceTranscript);
      } else {
        setIsVoiceOpen(false);
        setIsAnalyzingVoice(false);
      }
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

        {/* Dynamic atmospheric mood lighting overlay - morphs backdrop lighting per mood */}
        <div
          className="absolute inset-0 pointer-events-none transition-all duration-1000 ease-in-out"
          style={{
            background:
              activeMoodKey.toLowerCase() === 'romantic'
                ? 'radial-gradient(circle at 75% 30%, rgba(236,72,153,0.35) 0%, rgba(244,63,94,0.18) 45%, transparent 75%)'
                : activeMoodKey.toLowerCase() === 'energetic'
                ? 'radial-gradient(circle at 75% 30%, rgba(249,115,22,0.35) 0%, rgba(245,158,11,0.18) 45%, transparent 75%)'
                : activeMoodKey.toLowerCase() === 'calm'
                ? 'radial-gradient(circle at 75% 30%, rgba(0,242,254,0.30) 0%, rgba(16,185,129,0.16) 45%, transparent 75%)'
                : activeMoodKey.toLowerCase() === 'focus'
                ? 'radial-gradient(circle at 75% 30%, rgba(16,185,129,0.30) 0%, rgba(6,182,212,0.16) 45%, transparent 75%)'
                : activeMoodKey.toLowerCase() === 'sad'
                ? 'radial-gradient(circle at 75% 30%, rgba(59,130,246,0.35) 0%, rgba(99,102,241,0.18) 45%, transparent 75%)'
                : 'radial-gradient(circle at 75% 30%, rgba(245,158,11,0.30) 0%, rgba(236,72,153,0.16) 45%, transparent 75%)',
          }}
        />
      </div>

      {/* Main Container Stage */}
      <div className="relative z-10 max-w-7xl mx-auto w-full flex-1 flex flex-col justify-between space-y-8 sm:space-y-12">
        {/* ============================================================== */}
        {/* TOP HERO ROW: Left Headline + Right Low-Profile Tactile Dial   */}
        {/* ============================================================== */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start pt-2 sm:pt-4">
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
                {/* 1. 📸 Detect Mood with Face (Primary AI Scanner) - Theme Unified */}
                <button
                  type="button"
                  onClick={() => setIsCameraOpen(true)}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-full text-white font-bold text-xs sm:text-sm hover:scale-105 active:scale-95 transition-all duration-300 border cursor-pointer"
                  style={{
                    background: `linear-gradient(135deg, ${theme.accent}, ${theme.secondary || theme.accent})`,
                    borderColor: `${theme.accent}66`,
                    boxShadow: `0 4px 25px ${theme.glow || 'rgba(0,0,0,0.4)'}`,
                  }}
                >
                  <span className="text-base">📸</span>
                  <span>Detect Mood with Face</span>
                </button>

                {/* 2. 🎛️ Manually Select Mood - Theme Unified */}
                <button
                  type="button"
                  onClick={() => setIsManualModalOpen(true)}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white font-semibold text-xs sm:text-sm backdrop-blur-xl shadow-lg hover:scale-105 active:scale-95 transition-all duration-300 cursor-pointer border"
                  style={{
                    borderColor: `${theme.accent}40`,
                  }}
                >
                  <span>🎛️</span>
                  <span>Select from Grid</span>
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
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Micro Tactile Emotion Tuner (Clean, Unobstructed) */}
          <div className="lg:col-span-5 xl:col-span-5 flex justify-center lg:justify-end items-start mt-1 lg:mt-0">
            {/* Micro-Profile Tactile Tuner Dial Card */}
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
        <div className="fixed inset-0 z-[70] bg-black/85 backdrop-blur-2xl flex items-center justify-center p-4 pb-28 sm:pb-12 animate-fadeIn">
          <div className="relative w-full max-w-lg rounded-3xl bg-obsidian-900/95 border border-white/20 p-6 sm:p-7 shadow-2xl text-center space-y-5 backdrop-blur-3xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-3.5">
              <div className="flex items-center gap-2.5">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500" />
                </span>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                  Voice & Tone Emotion Agent
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  isRecordingRef.current = false;
                  setIsRecording(false);
                  try {
                    recognitionRef.current?.stop();
                  } catch (e) {}
                  stopToneAnalysis();
                  setIsVoiceOpen(false);
                  setIsAnalyzingVoice(false);
                }}
                className="text-slate-400 hover:text-white text-xs px-2.5 py-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
              >
                ✕ Cancel
              </button>
            </div>

            {/* Visualizer & Mic Cluster */}
            <div className="py-3 flex flex-col items-center justify-center space-y-4">
              {/* Dynamic Live Audio Waveform Bars */}
              <div className="flex items-center justify-center gap-1.5 h-16 w-full max-w-xs px-4 py-2 rounded-2xl bg-obsidian-950/70 border border-white/10">
                {audioWaveform.map((barHeight, idx) => (
                  <div
                    key={idx}
                    className="flex-1 rounded-full bg-gradient-to-t from-rose-500 to-amber-400 transition-all duration-75 shadow-sm"
                    style={{
                      height: `${barHeight}%`,
                      opacity: isRecording ? 0.95 : 0.3,
                    }}
                  />
                ))}
              </div>

              {/* Status & Subtitle */}
              <div>
                <p className="text-base font-bold text-white tracking-tight">
                  {isAnalyzingVoice
                    ? 'Analyzing Spoken Words & Vocal Acoustics...'
                    : 'Listening to your voice & tone...'}
                </p>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  Speak naturally at your own pace. Click{' '}
                  <strong className="text-rose-400 font-semibold">Stop & Detect Mood</strong> when you are finished!
                </p>
              </div>

              {/* Live Tone Acoustic Telemetry */}
              <div className="grid grid-cols-2 gap-2.5 w-full text-left">
                <div className="p-2.5 rounded-xl bg-white/[0.04] border border-white/10">
                  <div className="text-[10px] uppercase font-mono tracking-wider text-slate-400 flex items-center gap-1">
                    <span>⚡</span>
                    <span>Vocal Energy</span>
                  </div>
                  <div className="text-xs font-semibold text-rose-300 mt-0.5 truncate">
                    {toneMetrics.energyLabel}
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-white/[0.04] border border-white/10">
                  <div className="text-[10px] uppercase font-mono tracking-wider text-slate-400 flex items-center gap-1">
                    <span>🎵</span>
                    <span>Vocal Pitch</span>
                  </div>
                  <div className="text-xs font-semibold text-amber-300 mt-0.5 truncate">
                    {toneMetrics.pitchLabel}
                  </div>
                </div>
              </div>
            </div>

            {/* Live Transcript Display Box */}
            <div className="p-3.5 rounded-2xl bg-obsidian-950/90 border border-white/10 text-left min-h-[58px] flex items-center">
              {voiceTranscript ? (
                <p className="text-xs font-mono text-cyan/95 italic leading-relaxed">
                  &ldquo;{voiceTranscript}&rdquo;
                </p>
              ) : (
                <p className="text-xs text-slate-500 italic">
                  Say how you feel or what you are doing (e.g. &quot;Excited for workout&quot;, &quot;Soft romantic evening&quot;, &quot;Feeling calm and relaxed&quot;)...
                </p>
              )}
            </div>

            {/* Confirmed Result Feedback Badge */}
            {voiceResultFeedback && (
              <div className="p-3 rounded-2xl bg-emerald-500/15 border border-emerald-500/35 text-xs text-emerald-300 animate-fadeIn text-left space-y-1">
                <div className="flex items-center gap-2 font-bold uppercase tracking-wider">
                  <span>✓</span>
                  <span>Detected Mood: {voiceResultFeedback.mood}</span>
                </div>
                <p className="text-[11px] text-emerald-200/90">{voiceResultFeedback.explanation}</p>
              </div>
            )}

            {/* PROMINENT STOP & DETECT MOOD BUTTON */}
            <button
              type="button"
              onClick={handleStopAndDetectVoice}
              disabled={isAnalyzingVoice}
              className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-rose-500 via-pink-600 to-amber-500 hover:from-rose-400 hover:to-amber-400 text-white font-bold text-sm shadow-[0_0_25px_rgba(244,63,94,0.4)] transition-all hover:scale-102 active:scale-98 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2.5"
            >
              {isAnalyzingVoice ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Synthesizing Voice & Tone...</span>
                </>
              ) : (
                <>
                  <span className="w-3.5 h-3.5 rounded-sm bg-white" />
                  <span>⏹ Stop & Detect Mood</span>
                </>
              )}
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
