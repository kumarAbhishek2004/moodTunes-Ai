import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import axios from 'axios';
import { API_BASE_URL } from '../config/api';
import { playSong, setQueue, setActiveMood } from '../store/audioSlice';
import DenseTracklist from '../components/DenseTracklist';
import Chatbot from '../components/Chatbot';

const RecommendationsPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const activeReduxMood = useSelector((state) => state.audio.activeMood);
  const [mood, setMood] = useState(null);
  const [preferences, setPreferences] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);

  useEffect(() => {
    try {
      const storedMood = localStorage.getItem('selectedMood');
      const storedPreferences = localStorage.getItem('userPreferences');
      const cachedRecs = localStorage.getItem('recommendations');

      if (storedMood) {
        setMood(JSON.parse(storedMood));
      } else {
        setMood({ mood: activeReduxMood || 'calm', confidence: 100 });
      }

      if (storedPreferences) {
        setPreferences(JSON.parse(storedPreferences));
      }

      if (cachedRecs) {
        const parsedRecs = JSON.parse(cachedRecs);
        if (Array.isArray(parsedRecs) && parsedRecs.length > 0) {
          setRecommendations(parsedRecs);
          return;
        }
      }
    } catch (e) {}

    // If no cached recs, fetch freshly
    fetchFreshRecommendations();
  }, [activeReduxMood]);

  const fetchFreshRecommendations = async () => {
    setLoading(true);
    setError(null);

    const storedMood = localStorage.getItem('selectedMood');
    const moodObj = storedMood ? JSON.parse(storedMood) : { mood: activeReduxMood || 'calm' };
    const moodKey = (typeof moodObj === 'string' ? moodObj : moodObj.mood) || 'calm';

    const storedPrefs = localStorage.getItem('userPreferences');
    const prefsObj = storedPrefs ? JSON.parse(storedPrefs) : {};

    try {
      const response = await axios.post(`${API_BASE_URL}/api/personalized-recommendations`, {
        mood: moodKey,
        mood_distribution: moodObj.mood_distribution || { [moodKey]: 100 },
        user_id: 'default',
        limit: 20,
        preferences: {
          language: prefsObj.language || 'hindi',
          favorite_songs: prefsObj.favoriteSongs || [],
          favorite_singers: prefsObj.favoriteSingers || [],
          search_query: prefsObj.searchQuery || '',
        },
      });

      const songs = response.data.songs || response.data.recommendations || [];
      if (songs.length > 0) {
        setRecommendations(songs);
        dispatch(setQueue(songs));
        try {
          localStorage.setItem('recommendations', JSON.stringify(songs));
        } catch (e) {}
      } else {
        throw new Error('No songs returned from recommendation engine');
      }
    } catch (err) {
      console.error('Error fetching recommendations:', err);
      setError(err.response?.data?.detail || 'Failed to curate stream. Please verify backend connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 py-6 md:py-8 max-w-7xl animate-fadeIn">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <button
          onClick={() => navigate('/')}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white px-3.5 py-2 rounded-xl bg-obsidian-900/80 border border-obsidian-800 hover:border-obsidian-750 transition-colors w-fit"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span>Back to Home</span>
        </button>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchFreshRecommendations}
            disabled={loading}
            className="inline-flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-xl bg-obsidian-800 hover:bg-obsidian-750 text-slate-200 border border-obsidian-700 transition-colors disabled:opacity-50"
          >
            <svg className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>Regenerate Stream</span>
          </button>

          <button
            onClick={() => navigate('/mood-detection')}
            className="inline-flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-xl bg-cyan/15 hover:bg-cyan/25 text-cyan border border-cyan/30 transition-colors"
          >
            <span>🎛️</span>
            <span>Change Mood</span>
          </button>
        </div>
      </div>

      {/* Stream Overview Banner */}
      <div className="relative rounded-3xl bg-obsidian-900/80 backdrop-blur-2xl border border-obsidian-800/90 p-6 sm:p-8 shadow-2xl mb-8 overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-32 bg-cyan/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan/10 border border-cyan/30 text-cyan text-xs font-mono font-bold mb-3">
              <span>● LIVE AI STREAM</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              Tuned for Your <span className="text-cyan capitalize">{mood?.mood || activeReduxMood || 'Current'}</span> Vibe
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-2 max-w-2xl leading-relaxed">
              Curated using multi-class emotional quota balancing, artist similarity matching, and transparent Explainable AI badges.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-3 px-4 rounded-2xl bg-obsidian-950/80 border border-obsidian-800 text-center">
              <span className="block text-[10px] uppercase font-mono text-slate-500">Total Tracks</span>
              <span className="text-xl font-bold text-white font-mono">{recommendations.length}</span>
            </div>
            <div className="p-3 px-4 rounded-2xl bg-obsidian-950/80 border border-obsidian-800 text-center">
              <span className="block text-[10px] uppercase font-mono text-slate-500">Audio Fidelity</span>
              <span className="text-sm font-bold text-emerald font-mono">Parallel HD</span>
            </div>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="bg-obsidian-900/70 border border-obsidian-800 rounded-3xl p-12 text-center my-6">
          <div className="w-12 h-12 mx-auto mb-4 border-2 border-cyan border-t-transparent rounded-full animate-spin" />
          <h3 className="text-base font-bold text-white mb-1">Synthesizing Your Stream</h3>
          <p className="text-xs text-slate-400">Querying Last.fm, resolving YouTube audio IDs, and computing explanations...</p>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="bg-rose-500/10 border border-rose-500/30 rounded-3xl p-8 text-center my-6">
          <p className="text-sm text-rose-300 mb-4">{error}</p>
          <button
            onClick={fetchFreshRecommendations}
            className="px-5 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs transition-colors"
          >
            Retry Generation
          </button>
        </div>
      )}

      {/* Dense Tracklist Table */}
      {!loading && !error && (
        <DenseTracklist
          songs={recommendations}
          title="Personalized Emotion Stream"
          subtitle={`Balanced across multi-class weights & session history`}
        />
      )}

      {/* AI Chatbot Assistant */}
      <Chatbot
        isOpen={isChatbotOpen}
        onToggle={() => setIsChatbotOpen(!isChatbotOpen)}
        currentMood={mood?.mood || activeReduxMood}
        onPlaySong={(song) => dispatch(playSong(song))}
        onPlayPlaylist={(pl) => {
          if (pl?.songs?.length > 0) {
            dispatch(setQueue(pl.songs));
            dispatch(playSong(pl.songs[0]));
          }
        }}
      />
    </div>
  );
};

export default RecommendationsPage;
