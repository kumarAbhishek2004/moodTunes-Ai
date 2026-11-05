import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { playSong, setQueue, setActiveMood } from '../store/audioSlice';

const EMOTION_COLORS = {
  happy: '#F59E0B',
  calm: '#00F2FE',
  focus: '#10B981',
  energetic: '#F97316',
  sad: '#3B82F6',
  intense: '#EF4444',
  surprise: '#A855F7',
  neutral: '#94A3B8',
};

const PIPELINE_STEPS = [
  {
    step: 1,
    title: 'Analyzing Expression & Input',
    subtitle: 'Extracting linguistic and facial cues',
  },
  {
    step: 2,
    title: 'Multi-Class Neural Weights',
    subtitle: 'Computing 7-emotion probability distribution',
  },
  {
    step: 3,
    title: 'Querying Last.fm & Neural Seeds',
    subtitle: 'Parallel lookup & YouTube audio resolution',
  },
  {
    step: 4,
    title: 'Synthesizing Explainable Stream',
    subtitle: 'Anti-repetition filtering & mood tagging',
  },
];

const NeuralPulseModal = ({
  isOpen,
  onClose,
  currentStep = 1,
  dominantMood = 'calm',
  confidence = 90,
  emotions = [],
  songs = [],
  errorMessage = null,
}) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Esc key closes modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const activeColor = EMOTION_COLORS[dominantMood?.toLowerCase()] || '#00F2FE';
  const isFinished = currentStep >= 4 && songs.length > 0;

  const handleLaunchStream = () => {
    if (songs && songs.length > 0) {
      dispatch(setActiveMood(dominantMood));
      dispatch(setQueue(songs));
      dispatch(playSong(songs[0]));
      try {
        localStorage.setItem('recommendations', JSON.stringify(songs));
      } catch (e) {}
    }
    onClose();
    navigate('/recommendations');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-fadeIn">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-xl transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Surface */}
      <div className="relative w-full max-w-xl bg-obsidian-900/95 backdrop-blur-2xl border border-obsidian-750/90 rounded-3xl shadow-2xl shadow-black/90 p-6 sm:p-8 z-10 overflow-hidden">
        {/* Dynamic Glow Halo */}
        <div
          className="absolute -top-24 -left-24 w-72 h-72 rounded-full blur-3xl opacity-20 pointer-events-none transition-colors duration-700"
          style={{ backgroundColor: activeColor }}
        />
        <div
          className="absolute -bottom-24 -right-24 w-72 h-72 rounded-full blur-3xl opacity-15 pointer-events-none transition-colors duration-700"
          style={{ backgroundColor: activeColor }}
        />

        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-obsidian-800/80 mb-6">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full animate-ping" style={{ backgroundColor: activeColor }} />
            <h3 className="text-base sm:text-lg font-bold text-white tracking-wide">
              Neural Pulse Engine
            </h3>
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-cyan/15 text-cyan border border-cyan/30">
              Live Pipeline
            </span>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-obsidian-800 transition-colors"
            aria-label="Close modal"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Centerpiece: Glowing Pulsating Neural Orb */}
        <div className="flex flex-col items-center justify-center my-4">
          <div className="relative flex items-center justify-center w-36 h-36 sm:w-44 sm:h-44">
            {/* Outer Ripple Rings */}
            <div
              className="absolute inset-0 rounded-full animate-ping [animation-duration:3s] opacity-25"
              style={{ border: `2px solid ${activeColor}` }}
            />
            <div
              className="absolute -inset-3 rounded-full animate-pulse [animation-duration:2s] opacity-35"
              style={{ border: `1px solid ${activeColor}` }}
            />

            {/* Core Neural Sphere */}
            <div
              className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-full flex flex-col items-center justify-center p-3 shadow-2xl transition-all duration-500 overflow-hidden"
              style={{
                background: `radial-gradient(circle at 30% 30%, ${activeColor}99 0%, #0F172A 70%, #060B10 100%)`,
                boxShadow: `0 0 35px ${activeColor}55, inset 0 2px 4px rgba(255,255,255,0.4)`,
              }}
            >
              {/* Rotating particle arc */}
              <div
                className="absolute inset-1 rounded-full border-t-2 border-r-2 border-white/60 animate-spin [animation-duration:4s]"
              />

              <div className="relative z-10 text-center">
                <span className="text-2xl sm:text-3xl block">
                  {dominantMood === 'happy' ? '✨' :
                   dominantMood === 'energetic' ? '⚡' :
                   dominantMood === 'sad' ? '🌧️' :
                   dominantMood === 'calm' ? '🌊' : '🧠'}
                </span>
                <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-white mt-1 block">
                  {dominantMood}
                </span>
                <span className="text-[10px] font-mono text-white/80">
                  {Math.round(confidence)}%
                </span>
              </div>
            </div>
          </div>

          <p className="text-xs text-slate-400 mt-2 text-center font-mono">
            {isFinished ? '✓ Synthesis Complete' : 'Executing High-Performance Pipeline...'}
          </p>
        </div>

        {/* 4-Step Pipeline Status Telemetry */}
        <div className="space-y-3 my-6 bg-obsidian-950/60 p-4 rounded-2xl border border-obsidian-800/80">
          {PIPELINE_STEPS.map((stepItem) => {
            const isCompleted = currentStep > stepItem.step || (currentStep === 4 && isFinished);
            const isCurrent = currentStep === stepItem.step && !isFinished;

            return (
              <div
                key={stepItem.step}
                className={`flex items-center justify-between p-2.5 rounded-xl transition-all ${
                  isCurrent
                    ? 'bg-cyan/10 border border-cyan/30'
                    : isCompleted
                    ? 'bg-obsidian-900/60'
                    : 'opacity-40'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-colors ${
                      isCompleted
                        ? 'bg-emerald text-obsidian-950'
                        : isCurrent
                        ? 'bg-cyan text-obsidian-950 animate-pulse'
                        : 'bg-obsidian-800 text-slate-500'
                    }`}
                  >
                    {isCompleted ? '✓' : stepItem.step}
                  </div>
                  <div className="min-w-0">
                    <p className={`text-xs font-semibold truncate ${isCurrent ? 'text-cyan' : 'text-slate-200'}`}>
                      {stepItem.title}
                    </p>
                    <p className="text-[10px] text-slate-400 truncate">
                      {stepItem.subtitle}
                    </p>
                  </div>
                </div>

                <div className="flex-shrink-0 ml-2">
                  {isCompleted && (
                    <span className="text-[10px] font-mono font-semibold text-emerald">
                      100% ✓
                    </span>
                  )}
                  {isCurrent && (
                    <div className="w-3.5 h-3.5 border-2 border-cyan border-t-transparent rounded-full animate-spin" />
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Multi-Class Confidence Breakdown Spectrum */}
        {emotions && emotions.length > 0 && (
          <div className="mb-6">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between">
              <span>Multi-Class Emotion Spectrum</span>
              <span className="text-[10px] text-slate-500 font-mono">DeepFace / Gemini</span>
            </div>
            <div className="space-y-1.5">
              {emotions.slice(0, 4).map((item) => {
                const color = EMOTION_COLORS[item.emotion?.toLowerCase()] || '#00F2FE';
                const pct = Math.round(item.score);
                return (
                  <div key={item.emotion} className="flex items-center gap-2 text-xs">
                    <span className="w-16 capitalize text-slate-300 text-[11px] font-medium truncate">
                      {item.emotion}
                    </span>
                    <div className="flex-1 h-2 bg-obsidian-800 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700 ease-out"
                        style={{
                          width: `${pct}%`,
                          backgroundColor: color,
                        }}
                      />
                    </div>
                    <span className="w-9 text-right font-mono text-[11px] text-slate-400">
                      {pct}%
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Error State */}
        {errorMessage && (
          <div className="p-3 mb-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
            {errorMessage}
          </div>
        )}

        {/* CTA Launch Button */}
        <div className="pt-2">
          {isFinished ? (
            <button
              onClick={handleLaunchStream}
              className="w-full flex items-center justify-center gap-2.5 py-3.5 px-6 rounded-2xl bg-gradient-to-r from-cyan via-emerald to-amber-analog text-obsidian-950 font-bold text-sm shadow-xl shadow-cyan/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
              <span>Listen Now ({songs.length} Tracks Ready)</span>
            </button>
          ) : (
            <div className="flex items-center justify-center gap-2 py-3 text-xs text-slate-400">
              <div className="w-3.5 h-3.5 border-2 border-cyan border-t-transparent rounded-full animate-spin" />
              <span>Synthesizing your personalized stream...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NeuralPulseModal;
