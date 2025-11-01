import { useEffect, useState } from 'react';
import axios from 'axios';

const Recommendations = ({ mood, preferences, onRecommendations }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (mood && preferences) {
      fetchRecommendations();
    }
  }, [mood, preferences]);

  const fetchRecommendations = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await axios.post('http://localhost:8000/api/personalized-recommendations', {
        mood: mood.mood || mood,
        user_id: 'default',
        limit: 20,
        preferences: {
          language: preferences.language,
          favorite_songs: preferences.favoriteSongs || [],
          favorite_singers: preferences.favoriteSingers || [],
          search_query: preferences.searchQuery || ''
        }
      });

      onRecommendations(response.data.songs || []);
    } catch (err) {
      setError(err.response?.data?.detail || err.message);
      console.error('Error fetching recommendations:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto animate-fadeIn">
        <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-3xl p-12 shadow-2xl">
          <div className="flex flex-col items-center justify-center py-20">
            <div className="relative mb-8">
              <div className="absolute inset-0 bg-purple-500 rounded-full blur-2xl opacity-50 animate-ping"></div>
              <div className="relative w-24 h-24 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-2xl">
                <svg className="w-12 h-12 text-white animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                </svg>
              </div>
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">Finding Perfect Songs...</h3>
            <p className="text-gray-400 text-center max-w-md">
              Curating personalized playlist based on your preferences
            </p>
            <div className="mt-4 space-y-2 text-center">
              <p className="text-sm text-purple-300">
                🌐 Language: <span className="font-semibold capitalize">{preferences.language}</span>
              </p>
              <p className="text-sm text-pink-300">
                😊 Mood: <span className="font-semibold capitalize">{mood.mood || mood}</span>
              </p>
            </div>
            <div className="mt-8 flex space-x-2">
              <div className="w-3 h-3 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
              <div className="w-3 h-3 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              <div className="w-3 h-3 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-5xl mx-auto animate-fadeIn">
        <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-3xl p-12 shadow-2xl">
          <div className="bg-red-900/20 border border-red-500/50 rounded-2xl p-8 text-center">
            <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-white mb-3">Oops! Something went wrong</h3>
            <p className="text-red-400 mb-6">{error}</p>
            <button
              onClick={fetchRecommendations}
              className="bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white font-bold px-8 py-3 rounded-xl transition transform hover:scale-105 shadow-2xl shadow-red-500/50"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default Recommendations;
