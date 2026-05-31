import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Particles from '../components/Particles';
import MoodDetection from '../components/MoodDetection';
import Chatbot from '../components/Chatbot';

const MoodDetectionPage = () => {
  const navigate = useNavigate();
  const [detectedMood, setDetectedMood] = useState(null);
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);

  const handlePlaySong = (song) => {
    localStorage.setItem('recommendations', JSON.stringify([song]));
    navigate('/player');
  };

  const handleMoodDetected = (mood) => {
    setDetectedMood(mood);
    // Store mood in localStorage
    localStorage.setItem('selectedMood', JSON.stringify(mood));
    // Navigate to preferences page
    setTimeout(() => {
      navigate('/preferences');
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900">
      <Particles />
      
      <div className="relative z-10">
        <Header />
        
        <div className="container mx-auto px-6 py-12">
          {/* Back Button */}
          <button
            onClick={() => navigate('/')}
            className="mb-6 flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span>Back to Home</span>
          </button>

          {/* Page Header */}
          <div className="text-center mb-12 animate-fadeIn">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl mb-6 shadow-2xl">
              <span className="text-4xl">😊</span>
            </div>
            <h1 className="text-5xl font-black text-white mb-4">
               Detect Your Mood
            </h1>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Let AI analyze your emotions through facial recognition or choose your mood manually
            </p>
          </div>

          {/* Mood Detection Component */}
          <MoodDetection onMoodDetected={handleMoodDetected} />

          {detectedMood && (
            <div className="mt-8 text-center animate-fadeIn">
              <div className="inline-flex items-center gap-3 bg-green-500/20 border border-green-500/50 text-green-400 px-6 py-3 rounded-xl">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="font-semibold">Mood detected! Redirecting to preferences...</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Floating Chatbot */}
      <Chatbot
        isOpen={isChatbotOpen}
        onToggle={() => setIsChatbotOpen(!isChatbotOpen)}
        currentMood={detectedMood}
        onPlaySong={handlePlaySong}
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

export default MoodDetectionPage;
