import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Particles from '../components/Particles';
import PreferenceSelection from '../components/PreferenceSelection';
import Chatbot from '../components/Chatbot';

const PreferencesPage = () => {
  const navigate = useNavigate();
  const [mood, setMood] = useState(null);
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);

  const handlePlaySong = (song) => {
    localStorage.setItem('recommendations', JSON.stringify([song]));
    navigate('/player');
  };

  const handlePlayPlaylist = (playlist) => {
    if (playlist && playlist.songs && playlist.songs.length > 0) {
      localStorage.setItem('recommendations', JSON.stringify(playlist.songs));
      navigate('/player');
    }
  };

  useEffect(() => {
    // Get mood from localStorage
    const storedMood = localStorage.getItem('selectedMood');
    if (storedMood) {
      setMood(JSON.parse(storedMood));
    } else {
      // If no mood selected, redirect to mood detection
      navigate('/mood-detection');
    }
  }, [navigate]);

  const handlePreferencesSet = (preferences) => {
    // Store preferences in localStorage
    localStorage.setItem('userPreferences', JSON.stringify(preferences));
    // Navigate to recommendations page
    navigate('/recommendations');
  };

  if (!mood) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900">
      <Particles />
      
      <div className="relative z-10">
        <Header />
        
        <div className="container mx-auto px-6 py-12">
          {/* Back Button */}
          <button
            onClick={() => navigate('/mood-detection')}
            className="mb-6 flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span>Back to Mood Detection</span>
          </button>

          {/* Page Header */}
          <div className="text-center mb-12 animate-fadeIn">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl mb-6 shadow-2xl">
              <span className="text-4xl">⚙️</span>
            </div>
            <h1 className="text-5xl font-black text-white mb-4">
               Set Your Preferences
            </h1>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Choose your language, add favorite artists and songs to personalize your recommendations
            </p>

            {/* Current Mood Badge */}
            <div className="mt-6 inline-flex items-center gap-2 bg-slate-800/50 border border-slate-700/50 px-4 py-2 rounded-xl">
              <span className="text-gray-400 text-sm">Current Mood:</span>
              <span className="text-white font-semibold capitalize">{mood.mood || mood}</span>
            </div>
          </div>

          {/* Preferences Component */}
          <PreferenceSelection
            mood={mood}
            onPreferencesSet={handlePreferencesSet}
          />
        </div>
      </div>

      {/* Floating Chatbot */}
      <Chatbot
        isOpen={isChatbotOpen}
        onToggle={() => setIsChatbotOpen(!isChatbotOpen)}
        currentMood={mood}
        onPlaySong={handlePlaySong}
        onPlayPlaylist={handlePlayPlaylist}
      />

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.8s ease-out;
        }
      `}</style>
    </div>
  );
};

export default PreferencesPage;
