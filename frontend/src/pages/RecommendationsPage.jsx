import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import axios from 'axios';
import { API_BASE_URL } from '../config/api';
import { playSong, setQueue, clearPlaybackHistory, toggleMoodJourneyModal } from '../store/audioSlice';
import DenseTracklist from '../components/DenseTracklist';
import { resolveMusicTheme } from '../utils/themeMap';
import { getUserHistory } from '../utils/userStorage';

const RecommendationsPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();

  const currentSong = useSelector((state) => state.audio.currentSong);
  const activeReduxMood = useSelector((state) => state.audio.activeMood);
  const reduxPlaybackHistory = useSelector((state) => state.audio.playbackHistory) || [];
  const authUser = useSelector((state) => state.auth?.user);

  // Active view tab: 'recommendations' (AI Stream engine) or 'history' (past 20 played tracks)
  const [activeTab, setActiveTab] = useState(() => {
    try {
      const searchParams = new URLSearchParams(window.location.search);
      return searchParams.get('tab') === 'history' ? 'history' : 'recommendations';
    } catch (e) {
      return 'recommendations';
    }
  });
  const [mood, setMood] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);


  // Dynamic theme matching the active atmosphere
  const theme = resolveMusicTheme(currentSong, activeReduxMood || 'calm');

  // Strictly load past 20 played tracks for THIS specific user
  const playedHistory = (reduxPlaybackHistory && reduxPlaybackHistory.length > 0)
    ? reduxPlaybackHistory
    : getUserHistory(authUser);

  useEffect(() => {
    try {
      const searchParams = new URLSearchParams(location.search);
      const tabParam = searchParams.get('tab');
      if (tabParam === 'history') {
        setActiveTab('history');
      } else if (tabParam === 'recommendations') {
        setActiveTab('recommendations');
      }

      const storedMood = localStorage.getItem('selectedMood');
      if (storedMood) {
        setMood(JSON.parse(storedMood));
      } else {
        setMood({ mood: activeReduxMood || 'calm', confidence: 100 });
      }

      const cachedRecs = localStorage.getItem('recommendations');
      let loadedCached = false;
      if (cachedRecs) {
        const parsed = JSON.parse(cachedRecs);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setRecommendations(parsed);
          loadedCached = true;
        }
      }

      // Auto-curate stream if recommendations are empty
      if (!loadedCached) {
        fetchFreshRecommendations();
      }
    } catch (e) {}
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

  const handleClearHistory = () => {
    if (confirm('Clear your listening history?')) {
      dispatch(clearPlaybackHistory());
    }
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 py-6 md:py-8 max-w-7xl animate-fadeIn pb-32">
      
      {/* Top Navigation & Action Controls */}
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
          {activeTab === 'history' && playedHistory.length > 0 && (
            <button
              onClick={handleClearHistory}
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 hover:border-red-500/30 transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              <span>Clear History</span>
            </button>
          )}

          {activeTab === 'recommendations' && (
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
          )}

          <button
            onClick={() => dispatch(toggleMoodJourneyModal())}
            className="inline-flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan border border-cyan/30 hover:border-cyan/50 transition-all cursor-pointer shadow-sm"
            title="Design a personalized mood transition journey from your playlists"
          >
            <span>🚀 Mood Roadmap</span>
          </button>

          <button
            onClick={() => navigate('/mood-detection')}
            className="inline-flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-xl transition-all border shadow-sm"
            style={{
              backgroundColor: `${theme.accent}18`,
              borderColor: `${theme.accent}40`,
              color: theme.accent,
            }}
          >
            <span>🎛️</span>
            <span>Detect Mood</span>
          </button>
        </div>
      </div>

      {/* Hero Overview Banner */}
      <div
        className="relative rounded-3xl bg-obsidian-900/80 backdrop-blur-2xl border p-6 sm:p-8 shadow-2xl mb-8 overflow-hidden transition-all duration-700"
        style={{
          borderColor: `${theme.accent}30`,
          boxShadow: `0 20px 60px -15px ${theme.glow}`,
        }}
      >
        <div
          className="absolute top-0 right-0 w-80 h-32 blur-3xl pointer-events-none transition-all duration-700"
          style={{ backgroundColor: `${theme.accent}20` }}
        />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <div
                className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-bold border"
                style={{
                  backgroundColor: `${theme.accent}15`,
                  borderColor: `${theme.accent}35`,
                  color: theme.accent,
                }}
              >
                <span>● {activeTab === 'history' ? 'PLAYBACK HISTORY (PAST 20 PLAYED)' : 'LIVE AI RECOMMENDATIONS'}</span>
              </div>

              <div
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold border"
                style={{
                  backgroundColor: `${theme.accent}15`,
                  borderColor: `${theme.accent}30`,
                  color: theme.accent,
                }}
              >
                <span>🎧 Active Vibe: {activeReduxMood?.toUpperCase() || 'CALM'}</span>
              </div>
            </div>

            <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              {activeTab === 'history' ? (
                <>Your <span style={{ color: theme.accent }}>Listening History</span></>
              ) : (
                <>Tuned for Your <span className="capitalize" style={{ color: theme.accent }}>{activeReduxMood || 'Current'}</span> Vibe</>
              )}
            </h1>
            
            <p className="text-xs sm:text-sm text-slate-400 mt-2 max-w-2xl leading-relaxed">
              {activeTab === 'history'
                ? 'Strictly recording your past 20 actually played music tracks with transparent Explainable AI reasoning.'
                : 'Curated using multi-class emotional quota balancing, artist similarity matching, and transparent Explainable AI badges.'}
            </p>

            {/* Switcher Tabs: History vs AI Recommendations */}
            <div className="flex items-center gap-2 mt-5">
              <button
                onClick={() => setActiveTab('history')}
                className={`px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer border ${
                  activeTab === 'history'
                    ? 'text-slate-950 shadow-md'
                    : 'bg-white/5 hover:bg-white/10 text-slate-300 border-white/10'
                }`}
                style={
                  activeTab === 'history'
                    ? {
                        backgroundColor: theme.accent,
                        borderColor: theme.accent,
                        boxShadow: `0 0 18px ${theme.glow}`,
                      }
                    : undefined
                }
              >
                🎧 Playback History ({playedHistory.length}/20)
              </button>

              <button
                onClick={() => {
                  setActiveTab('recommendations');
                  if (recommendations.length === 0) fetchFreshRecommendations();
                }}
                className={`px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer border ${
                  activeTab === 'recommendations'
                    ? 'text-slate-950 shadow-md'
                    : 'bg-white/5 hover:bg-white/10 text-slate-300 border-white/10'
                }`}
                style={
                  activeTab === 'recommendations'
                    ? {
                        backgroundColor: theme.accent,
                        borderColor: theme.accent,
                        boxShadow: `0 0 18px ${theme.glow}`,
                      }
                    : undefined
                }
              >
                ✨ AI Recommendations
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-3 px-4 rounded-2xl bg-obsidian-950/80 border border-obsidian-800 text-center">
              <span className="block text-[10px] uppercase font-mono text-slate-500">
                {activeTab === 'history' ? 'Tracks Played' : 'Rec Count'}
              </span>
              <span className="text-xl font-bold text-white font-mono">
                {activeTab === 'history' ? playedHistory.length : recommendations.length}
              </span>
            </div>
            <div className="p-3 px-4 rounded-2xl bg-obsidian-950/80 border border-obsidian-800 text-center">
              <span className="block text-[10px] uppercase font-mono text-slate-500">Capacity</span>
              <span className="text-sm font-bold text-emerald font-mono">
                {activeTab === 'history' ? 'Max 20' : 'Dynamic'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* VIEW 1: PLAYBACK HISTORY (STRICTLY PAST 20 PLAYED TRACKS) */}
      {activeTab === 'history' && (
        <>
          {playedHistory.length === 0 ? (
            <div className="bg-obsidian-900/60 border border-white/10 rounded-3xl p-12 text-center my-6">
              <div
                className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center text-3xl mb-4 shadow-lg"
                style={{
                  backgroundColor: `${theme.accent}15`,
                  border: `1px solid ${theme.accent}35`,
                }}
              >
                🎧
              </div>
              <h3 className="text-lg font-bold text-white mb-1">No Playback History Yet</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto mb-6 leading-relaxed">
                Listening history only tracks music that you actually play, not recommended songs. Start streaming any track from Discover, Home, or Search to build your personal history!
              </p>
              <button
                onClick={() => navigate('/discover')}
                className="px-6 py-2.5 rounded-full text-xs font-bold transition-all shadow-lg hover:scale-105 active:scale-95 cursor-pointer"
                style={{
                  backgroundColor: theme.accent,
                  color: '#060B10',
                  boxShadow: `0 8px 24px -4px ${theme.glow}`,
                }}
              >
                Explore & Play Music →
              </button>
            </div>
          ) : (
            <DenseTracklist
              songs={playedHistory}
              title="Recent Playback History (Past 20 Played)"
              subtitle="Chronological log of your past 20 actively played tracks with distinct Explainable AI reasoning"
            />
          )}
        </>
      )}

      {/* VIEW 2: AI RECOMMENDATIONS STREAM */}
      {activeTab === 'recommendations' && (
        <>
          {loading && (
            <div className="bg-obsidian-900/70 border border-obsidian-800 rounded-3xl p-12 text-center my-6">
              <div className="w-12 h-12 mx-auto mb-4 border-2 border-cyan border-t-transparent rounded-full animate-spin" />
              <h3 className="text-base font-bold text-white mb-1">Synthesizing Your Stream</h3>
              <p className="text-xs text-slate-400">Querying Last.fm, resolving YouTube audio IDs, and computing explanations...</p>
            </div>
          )}

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

          {!loading && !error && (
            <DenseTracklist
              songs={recommendations}
              title="Personalized Emotion Stream"
              subtitle="Balanced across multi-class weights & session history with Explainable AI badges"
            />
          )}
        </>
      )}


    </div>
  );
};

export default RecommendationsPage;
