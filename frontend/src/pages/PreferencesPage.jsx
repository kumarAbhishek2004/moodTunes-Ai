import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PreferenceSelection from '../components/PreferenceSelection';

const PreferencesPage = () => {
  const navigate = useNavigate();
  const [mood, setMood] = useState(null);

  useEffect(() => {
    try {
      const storedMood = localStorage.getItem('selectedMood');
      if (storedMood) {
        setMood(JSON.parse(storedMood));
      } else {
        // If no mood is set yet, default to happy
        setMood({ mood: 'happy', source: 'manual' });
      }
    } catch (e) {
      setMood({ mood: 'happy', source: 'manual' });
    }
  }, [navigate]);

  const handlePreferencesSet = (preferences) => {
    // Clear old cached recommendations so fresh ones are computed for these preferences
    localStorage.removeItem('recommendations');
    // Store user preferences in localStorage
    localStorage.setItem('userPreferences', JSON.stringify(preferences));
    // Directly navigate to recommendations page
    navigate('/recommendations');
  };

  if (!mood) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const moodKey = typeof mood === 'string' ? mood : mood.mood || 'happy';
  const isFaceVerified = mood.source === 'face' && mood.confidence;

  return (
    <div className="container mx-auto px-4 sm:px-6 py-6 md:py-8 max-w-6xl animate-fadeIn">
      {/* Top Navigation Row */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => navigate('/')}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white px-3.5 py-2 rounded-xl bg-obsidian-900/80 border border-white/10 hover:border-white/20 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span>Back to Home</span>
        </button>

        {/* Current Mood Pill */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-obsidian-900/80 border border-white/10 text-xs font-mono">
          <span className="text-slate-400">Current Mood:</span>
          <span className="text-white font-bold capitalize">{moodKey}</span>
          {isFaceVerified ? (
            <span className="ml-1 text-[10px] text-purple-300 px-2 py-0.5 rounded-full bg-purple-500/20 border border-purple-500/30">
              📸 {Math.round(mood.confidence)}% Confidence
            </span>
          ) : mood.source === 'manual' ? (
            <span className="ml-1 text-[10px] text-cyan px-2 py-0.5 rounded-full bg-cyan/15 border border-cyan/30">
              🎯 Manual
            </span>
          ) : null}
        </div>
      </div>

      {/* Preferences Form Component */}
      <PreferenceSelection
        mood={mood}
        onPreferencesSet={handlePreferencesSet}
      />
    </div>
  );
};

export default PreferencesPage;
