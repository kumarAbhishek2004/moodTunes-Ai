import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MoodDetection from '../components/MoodDetection';

const MoodDetectionPage = () => {
  const navigate = useNavigate();
  const [detectedMood, setDetectedMood] = useState(null);

  const handleMoodDetected = (moodData) => {
    setDetectedMood(moodData);
    try {
      localStorage.setItem('selectedMood', JSON.stringify(moodData));
    } catch (e) {}

    // Smooth transition to recommendations or preferences
    setTimeout(() => {
      navigate('/preferences');
    }, 1200);
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 py-6 md:py-8 max-w-6xl">
      {/* Back Button & Breadcrumb */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => navigate('/')}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white px-3 py-1.5 rounded-lg bg-obsidian-900/70 border border-obsidian-800 hover:border-obsidian-700 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span>Back to Home</span>
        </button>

        <span className="text-[11px] font-mono text-slate-500 uppercase tracking-wider">
          Step 1 of 3 • Emotional Tuning
        </span>
      </div>

      {/* Main Mood Detection Interface */}
      <MoodDetection onMoodDetected={handleMoodDetected} />

      {/* Feedback Toast */}
      {detectedMood && (
        <div className="mt-8 text-center animate-fadeIn">
          <div className="inline-flex items-center gap-3 bg-cyan/15 border border-cyan/40 text-cyan px-6 py-3 rounded-2xl shadow-xl shadow-cyan/10">
            <span className="w-2 h-2 rounded-full bg-cyan animate-ping" />
            <span className="text-sm font-semibold">
              Mood detected ({detectedMood.mood || 'tuned'})! Curating your taste preferences...
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default MoodDetectionPage;
