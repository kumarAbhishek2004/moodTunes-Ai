import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Particles from '../components/Particles';
import MusicPlayer from '../components/MusicPlayer';
import Chatbot from '../components/Chatbot';

const MusicPlayerPage = () => {
  const navigate = useNavigate();
  const [recommendations, setRecommendations] = useState([]);
  const [currentSong, setCurrentSong] = useState(null);
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);
  const [mood, setMood] = useState(null);

  useEffect(() => {
    // Get recommendations from localStorage
    const storedRecommendations = localStorage.getItem('recommendations');
    const storedMood = localStorage.getItem('selectedMood');
    
    if (storedRecommendations) {
      const songs = JSON.parse(storedRecommendations);
      setRecommendations(songs);
      if (songs.length > 0) {
        setCurrentSong(songs[0]);
      }
    } else {
      // If no recommendations, redirect to start
      navigate('/mood-detection');
    }

    if (storedMood) {
      setMood(JSON.parse(storedMood));
    }
  }, [navigate]);

  const handlePlaySong = (song) => {
    setCurrentSong(song);
    
    // Add to recommendations if not already there
    if (!recommendations.find(s => s.id === song.id)) {
      setRecommendations(prev => [song, ...prev]);
      localStorage.setItem('recommendations', JSON.stringify([song, ...recommendations]));
    }
  };

  const handlePlayPlaylist = (playlist) => {
    if (playlist && playlist.songs && playlist.songs.length > 0) {
      // Replace current queue with playlist songs
      setRecommendations(playlist.songs);
      setCurrentSong(playlist.songs[0]);
      
      // Update localStorage
      localStorage.setItem('recommendations', JSON.stringify(playlist.songs));
    }
  };

  if (recommendations.length === 0) {
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
        <Header onPlaySong={handlePlaySong} />
        
        <div className="container mx-auto px-6 py-12">
          {/* Navigation Buttons */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => navigate('/recommendations')}
              className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span>Back to Recommendations</span>
            </button>

            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2 bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700/50 text-white px-4 py-2 rounded-lg transition-all"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              <span>Start Over</span>
            </button>
          </div>

          {/* Page Header */}
          <div className="text-center mb-12 animate-fadeIn">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl mb-6 shadow-2xl">
              <span className="text-4xl">▶️</span>
            </div>
            <h1 className="text-5xl font-black text-white mb-4">
               Enjoy Your Music
            </h1>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Stream your personalized playlist seamlessly with our integrated player
            </p>

            {/* Stats */}
            <div className="mt-6 flex items-center justify-center gap-4">
              <div className="inline-flex items-center gap-2 bg-slate-800/50 border border-slate-700/50 px-4 py-2 rounded-xl">
                <svg className="w-5 h-5 text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z"/>
                </svg>
                <span className="text-white font-semibold">{recommendations.length} Songs</span>
              </div>
            </div>
          </div>

          {/* Music Player */}
          <MusicPlayer
            currentSong={currentSong}
            queue={recommendations}
            onPlaySong={handlePlaySong}
          />
        </div>
      </div>

      {/* Chatbot */}
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

export default MusicPlayerPage;
