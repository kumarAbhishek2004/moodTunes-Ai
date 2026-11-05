import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../config/api';
import NeuralPulseModal from './NeuralPulseModal';

const PROMPT_CHIPS = [
  { label: '🌧️ 3am Rainy Study', text: '3am rainy study session, gentle lo-fi beats, peaceful and reflective' },
  { label: '⚡ Post-Gym Workout', text: 'High energy gym workout, heavy bass, intense motivational tracks' },
  { label: '☕ Sunday Acoustic', text: 'Sunny Sunday morning coffee, sweet acoustic guitar and uplifting melodies' },
  { label: '🌃 Night City Drive', text: 'Late night highway drive under neon lights, synthwave and deep vibes' },
  { label: '💔 Heartbroken Melancholy', text: 'Late night quiet heartbreak, emotional slow tempo ballad songs' },
];

const MultiModalBar = () => {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('text'); // 'text' | 'voice'
  const [sceneText, setSceneText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [speechSupported, setSpeechSupported] = useState(true);

  // Neural Pulse Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [dominantMood, setDominantMood] = useState('calm');
  const [confidence, setConfidence] = useState(85);
  const [emotions, setEmotions] = useState([]);
  const [songs, setSongs] = useState([]);
  const [errorMessage, setErrorMessage] = useState(null);

  const recognitionRef = useRef(null);

  // Check Web Speech API support
  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onresult = (event) => {
          let currentText = '';
          for (let i = 0; i < event.results.length; i++) {
            currentText += event.results[i][0].transcript;
          }
          setVoiceTranscript(currentText);
        };

        recognition.onend = () => {
          setIsRecording(false);
          // If we gathered text, auto-submit after short delay
          if (voiceTranscript.trim()) {
            executeMultiModalPipeline(voiceTranscript);
          }
        };

        recognition.onerror = (err) => {
          console.error('Speech recognition error:', err);
          setIsRecording(false);
        };

        recognitionRef.current = recognition;
      } catch (err) {
        setSpeechSupported(false);
      }
    } else {
      setSpeechSupported(false);
    }
  }, [voiceTranscript]);

  const toggleVoiceRecording = () => {
    if (!speechSupported) {
      alert('Speech recognition is not supported in this browser. Please use "Type the Scene" instead.');
      return;
    }

    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
      if (voiceTranscript.trim()) {
        executeMultiModalPipeline(voiceTranscript);
      }
    } else {
      setVoiceTranscript('');
      try {
        recognitionRef.current?.start();
        setIsRecording(true);
      } catch (err) {
        console.error('Error starting speech recognition:', err);
        setIsRecording(false);
      }
    }
  };

  // Execute full 4-step pipeline: Text/Voice -> Multi-Class Emotion -> Last.fm Recommendations -> Explainable Stream
  const executeMultiModalPipeline = async (inputText) => {
    if (!inputText || !inputText.trim()) return;

    // Reset and open modal
    setErrorMessage(null);
    setCurrentStep(1);
    setDominantMood('calm');
    setConfidence(85);
    setEmotions([]);
    setSongs([]);
    setIsModalOpen(true);

    try {
      // STEP 1: Sentiment & multi-class emotion analysis
      setCurrentStep(1);
      const moodResponse = await axios.post(`${API_BASE_URL}/api/detect-mood-text`, {
        text: inputText.trim(),
      });

      const moodData = moodResponse.data;
      const detectedMood = moodData.mood || 'calm';
      const detectedConf = moodData.confidence || 85;
      const allEmotionsList = moodData.all_emotions || [];
      const moodDistribution = moodData.mood_distribution || { [detectedMood]: 100 };

      setDominantMood(detectedMood);
      setConfidence(detectedConf);
      setEmotions(allEmotionsList);

      // STEP 2: Multi-Class Neural Weights computation display
      setCurrentStep(2);
      await new Promise((r) => setTimeout(r, 600)); // Smooth visual cadence

      // STEP 3: Last.fm & seeds querying with multi-class distribution
      setCurrentStep(3);
      const recResponse = await axios.post(`${API_BASE_URL}/api/recommendations`, {
        mood: detectedMood,
        mood_distribution: moodDistribution,
        limit: 20,
        user_id: 'default',
      });

      const returnedSongs = recResponse.data.recommendations || [];

      // STEP 4: Synthesizing Explainable Stream
      setCurrentStep(4);
      setSongs(returnedSongs);

      // Save mood in localStorage
      try {
        localStorage.setItem('selectedMood', JSON.stringify({
          mood: detectedMood,
          confidence: detectedConf,
          isManual: false,
          prompt: inputText,
        }));
      } catch (e) {}
    } catch (err) {
      console.error('Pipeline failed:', err);
      setErrorMessage(
        err.response?.data?.detail || 'Failed to complete analysis pipeline. Please check backend connection.'
      );
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto my-8 px-4">
      {/* Container Surface */}
      <div className="relative bg-obsidian-900/80 backdrop-blur-2xl border border-obsidian-800/90 rounded-3xl p-5 sm:p-7 shadow-2xl shadow-black/80 overflow-hidden">
        {/* Subtle Ambient Header Glow */}
        <div className="absolute top-0 right-0 w-80 h-32 bg-cyan/5 blur-3xl pointer-events-none" />

        {/* Top Header & Tri-Modal Selector Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5 border-b border-obsidian-800/60 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan animate-pulse" />
              <h2 className="text-base sm:text-lg font-bold text-white tracking-wide">
                Multi-Modal Vibe Studio
              </h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan/15 text-cyan border border-cyan/30">
                3 Channels
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Express your feelings via camera facial scan, one-tap voice, or narrative scene
            </p>
          </div>

          {/* Tri-Modal Quick Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/mood-detection')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-obsidian-850 hover:bg-obsidian-800 text-slate-300 hover:text-white border border-obsidian-750 transition-colors"
              title="Open Camera Facial Scan"
            >
              <span>📸</span>
              <span>Face Scan</span>
            </button>

            <button
              onClick={() => setActiveTab('voice')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'voice'
                  ? 'bg-orange-500/15 text-orange-400 border border-orange-500/30'
                  : 'bg-obsidian-850 text-slate-300 hover:text-white border border-obsidian-750'
              }`}
            >
              <span>🎙️</span>
              <span>Voice Mood</span>
            </button>

            <button
              onClick={() => setActiveTab('text')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'text'
                  ? 'bg-cyan/15 text-cyan border border-cyan/30'
                  : 'bg-obsidian-850 text-slate-300 hover:text-white border border-obsidian-750'
              }`}
            >
              <span>✍️</span>
              <span>Type Scene</span>
            </button>
          </div>
        </div>

        {/* Channel 1: Type the Scene (MoodTrue) */}
        {activeTab === 'text' && (
          <div className="space-y-4 animate-fadeIn">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                executeMultiModalPipeline(sceneText);
              }}
              className="relative flex items-center"
            >
              <input
                type="text"
                value={sceneText}
                onChange={(e) => setSceneText(e.target.value)}
                placeholder="Describe your scene: '3am rainy study session', 'post-gym energy', 'calm morning coffee'..."
                className="w-full bg-obsidian-950/80 text-white text-xs sm:text-sm pl-4 pr-32 py-3.5 rounded-2xl border border-obsidian-750 focus:outline-none focus:border-cyan focus:ring-1 focus:ring-cyan/40 placeholder:text-slate-500 transition-all shadow-inner"
              />
              <button
                type="submit"
                disabled={!sceneText.trim()}
                className="absolute right-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan to-emerald hover:from-cyan/90 hover:to-emerald/90 text-obsidian-950 text-xs font-bold transition-all disabled:opacity-30 disabled:pointer-events-none flex items-center gap-1.5 shadow-md shadow-cyan/10"
              >
                <span>Curate</span>
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </button>
            </form>

            {/* Clickable Narrative Prompt Chips */}
            <div>
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Clickable Scene Presets
              </div>
              <div className="flex flex-wrap gap-2">
                {PROMPT_CHIPS.map((chip) => (
                  <button
                    key={chip.label}
                    onClick={() => {
                      setSceneText(chip.text);
                      executeMultiModalPipeline(chip.text);
                    }}
                    className="text-xs px-3 py-1.5 rounded-full bg-obsidian-950/70 hover:bg-obsidian-800 text-slate-300 hover:text-white border border-obsidian-800 hover:border-cyan/40 transition-all text-left"
                  >
                    {chip.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Channel 2: Voice Mood (Speech Recognition) */}
        {activeTab === 'voice' && (
          <div className="flex flex-col items-center justify-center py-6 text-center animate-fadeIn space-y-4">
            <div className="relative">
              {/* Outer pulsing ring when recording */}
              {isRecording && (
                <div className="absolute inset-0 rounded-full animate-ping bg-orange-500/20" />
              )}

              <button
                onClick={toggleVoiceRecording}
                className={`relative w-20 h-20 rounded-full flex items-center justify-center transition-all ${
                  isRecording
                    ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/40 scale-105'
                    : 'bg-gradient-to-tr from-orange-500 to-amber-500 text-obsidian-950 shadow-xl shadow-orange-500/20 hover:scale-105'
                }`}
                title={isRecording ? 'Click to Stop' : 'Click to Speak'}
              >
                {isRecording ? (
                  <div className="w-6 h-6 rounded bg-white animate-pulse" />
                ) : (
                  <svg className="w-8 h-8 fill-current" viewBox="0 0 24 24">
                    <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
                    <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
                  </svg>
                )}
              </button>
            </div>

            {/* Visualizer Wave when speaking */}
            {isRecording ? (
              <div className="space-y-2">
                <div className="flex items-center justify-center gap-1.5 h-6">
                  {[...Array(9)].map((_, i) => (
                    <span
                      key={i}
                      className="w-1 bg-orange-400 rounded-full animate-bounce"
                      style={{
                        animationDelay: `${i * 0.1}s`,
                        height: `${Math.max(8, Math.sin(i) * 24)}px`,
                      }}
                    />
                  ))}
                </div>
                <p className="text-xs font-semibold text-orange-400 animate-pulse">
                  Listening... speak naturally about how you feel
                </p>
                {voiceTranscript && (
                  <p className="text-xs text-slate-300 italic max-w-md bg-obsidian-950 p-2 rounded-lg border border-obsidian-800">
                    "{voiceTranscript}"
                  </p>
                )}
              </div>
            ) : (
              <div>
                <p className="text-xs font-semibold text-slate-300">
                  Tap microphone to speak your mood
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  e.g. "I'm exhausted from work and need soothing ambient music"
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Concept 03: Neural Pulse Live Pipeline Modal */}
      <NeuralPulseModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        currentStep={currentStep}
        dominantMood={dominantMood}
        confidence={confidence}
        emotions={emotions}
        songs={songs}
        errorMessage={errorMessage}
      />
    </div>
  );
};

export default MultiModalBar;
