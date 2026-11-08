import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../config/api';
import { setQueue, playSong, setActiveMood } from '../store/audioSlice';
import { getUserHistory, getUserCustomPlaylists, getUserPlaylistSongs } from '../utils/userStorage';
import { cleanSongTitle } from '../utils/textHelper';
import { resolveMusicTheme } from '../utils/themeMap';

/**
 * RoadmapPage
 * Dedicated full-page experience for the "Emotional Elevation Roadmap".
 * Accessible to everyone (guests and logged-in users).
 * Intelligently sequences songs to transition listeners from their current state
 * to an elevated target mood with ascending valence, tempo, and energy.
 */
const RoadmapPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const currentSong = useSelector((state) => state.audio.currentSong);
  const activeMood = useSelector((state) => state.audio.activeMood) || 'sad';
  const authUser = useSelector((state) => state.auth?.user);
  const reduxHistory = useSelector((state) => state.audio?.playbackHistory) || [];

  const theme = resolveMusicTheme(currentSong, activeMood);

  const [startMood, setStartMood] = useState(activeMood);
  const [targetMood, setTargetMood] = useState('happy');
  const [trackCount, setTrackCount] = useState(6);
  const [anchorSong, setAnchorSong] = useState('');
  const [language, setLanguage] = useState('all');
  const [isLoading, setIsLoading] = useState(false);
  const [journeyData, setJourneyData] = useState(null);

  const moodOptions = [
    { id: 'sad', name: 'Melancholic / Sad', icon: '🌧️', color: '#3B82F6', valence: '22%', bpm: '65-80 BPM' },
    { id: 'calm', name: 'Calm & Serene', icon: '🌊', color: '#00F2FE', valence: '48%', bpm: '80-95 BPM' },
    { id: 'focus', name: 'Deep Focus', icon: '🧠', color: '#10B981', valence: '60%', bpm: '90-105 BPM' },
    { id: 'romantic', name: 'Warm Romance', icon: '💖', color: '#EC4899', valence: '65%', bpm: '85-105 BPM' },
    { id: 'happy', name: 'Joyful & Happy', icon: '✨', color: '#F59E0B', valence: '85%', bpm: '110-128 BPM' },
    { id: 'energetic', name: 'Peak High Energy', icon: '⚡', color: '#F97316', valence: '92%', bpm: '128-145 BPM' },
  ];

  const handleGenerateJourney = async () => {
    setIsLoading(true);
    try {
      // 1. Gather all user custom playlists with their songs
      const rawPlaylists = getUserCustomPlaylists(authUser) || [];
      const userPlaylists = rawPlaylists.map((pl) => {
        const storedSongs = getUserPlaylistSongs(pl.id || pl._id, authUser);
        return {
          ...pl,
          songs: storedSongs && storedSongs.length > 0 ? storedSongs : (pl.songs || []),
        };
      });

      // 2. Gather user listening history
      const userHistory = (reduxHistory && reduxHistory.length > 0)
        ? reduxHistory
        : getUserHistory(authUser);

      const res = await axios.post(`${API_BASE_URL}/api/mood/journey`, {
        start_mood: startMood,
        target_mood: targetMood,
        num_tracks: trackCount,
        user_playlists: userPlaylists,
        user_history: userHistory,
        anchor_song: anchorSong.trim() || undefined,
        language: language,
      });
      setJourneyData(res.data);
    } catch (err) {
      console.error('Mood journey generation error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartPlayback = () => {
    if (journeyData && journeyData.tracks && journeyData.tracks.length > 0) {
      dispatch(setQueue(journeyData.tracks));
      dispatch(playSong(journeyData.tracks[0]));
      dispatch(setActiveMood(journeyData.start_mood));
    }
  };

  return (
    <div
      className="min-h-screen text-slate-100 transition-colors duration-1000 relative pb-32 font-sans selection:bg-cyan/30"
      style={{
        background: `radial-gradient(ellipse at 50% -5%, rgba(${theme.accentRgb || '0, 242, 254'}, 0.25) 0%, transparent 70%), #060B10`,
      }}
    >
      {/* Dynamic Ambient Background Glow */}
      <div
        aria-hidden="true"
        className="fixed inset-0 pointer-events-none transition-all duration-1000 ease-out z-0 opacity-40"
        style={{
          background: `radial-gradient(circle at 85% 20%, rgba(${theme.accentRgb || '0, 242, 254'}, 0.18), transparent 50%), radial-gradient(circle at 15% 75%, rgba(${theme.accentRgb || '0, 242, 254'}, 0.12), transparent 50%)`,
        }}
      />

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-14 space-y-10 sm:space-y-14">

        {/* HERO SECTION */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-mono font-bold tracking-wide backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-cyan animate-pulse shadow-[0_0_10px_#00F2FE]" />
            <span className="text-cyan">AI MOOD TRANSITION ARCHITECTURE</span>
            <span className="text-slate-400">•</span>
            <span className="text-slate-300">Emotional Elevation Roadmap</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-tight">
            Design your{' '}
            <span
              className="bg-clip-text text-transparent bg-gradient-to-r"
              style={{
                backgroundImage: `linear-gradient(135deg, ${theme.accent} 0%, #FFFFFF 100%)`,
              }}
            >
              emotional journey.
            </span>
          </h1>

          <p className="text-sm sm:text-lg text-slate-300 leading-relaxed font-normal max-w-2xl mx-auto">
            Instead of remaining in one mood forever, elevate your mental state step-by-step.
            Our recommendation engine intelligently sequences BPM, acoustic key, and musical valence from your playlists, history, and library.
          </p>
        </div>

        {/* MAIN ROADMAP BUILDER CARD */}
        <div className="rounded-3xl bg-slate-900/70 border border-white/10 p-6 sm:p-10 backdrop-blur-2xl shadow-2xl space-y-8">
          
          {/* STEP 1 & STEP 2: STARTING AND DESTINATION MOODS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
            
            {/* Start Mood Selection */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-cyan/20 text-cyan text-xs flex items-center justify-center font-mono">1</span>
                  <span>Where are you now? (Starting Mood)</span>
                </label>
                <span className="text-[10px] font-mono text-cyan">Step 1</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {moodOptions.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => {
                      setStartMood(m.id);
                      setJourneyData(null);
                    }}
                    className={`flex flex-col items-start p-3 rounded-2xl text-xs font-semibold transition-all cursor-pointer border text-left ${
                      startMood === m.id
                        ? 'bg-cyan-500/15 border-cyan/70 text-white shadow-lg shadow-cyan/20 scale-[1.02]'
                        : 'bg-white/5 hover:bg-white/10 border-white/5 text-slate-300 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2 w-full justify-between mb-1">
                      <span className="text-lg select-none">{m.icon}</span>
                      <span className="text-[10px] font-mono opacity-70 px-1.5 py-0.5 rounded bg-white/10">{m.valence}</span>
                    </div>
                    <span className="font-bold">{m.name}</span>
                    <span className="text-[10px] font-mono text-slate-400 mt-0.5">{m.bpm}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Target Mood Selection */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-300 text-xs flex items-center justify-center font-mono">2</span>
                  <span>Where do you want to feel? (Target Destination)</span>
                </label>
                <span className="text-[10px] font-mono text-amber-300">Step 2</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {moodOptions.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => {
                      setTargetMood(m.id);
                      setJourneyData(null);
                    }}
                    className={`flex flex-col items-start p-3 rounded-2xl text-xs font-semibold transition-all cursor-pointer border text-left ${
                      targetMood === m.id
                        ? 'bg-amber-500/15 border-amber-400/80 text-amber-100 shadow-lg shadow-amber-500/20 scale-[1.02]'
                        : 'bg-white/5 hover:bg-white/10 border-white/5 text-slate-300 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2 w-full justify-between mb-1">
                      <span className="text-lg select-none">{m.icon}</span>
                      <span className="text-[10px] font-mono opacity-70 px-1.5 py-0.5 rounded bg-white/10">{m.valence}</span>
                    </div>
                    <span className="font-bold">{m.name}</span>
                    <span className="text-[10px] font-mono text-slate-400 mt-0.5">{m.bpm}</span>
                  </button>
                ))}
              </div>
            </div>

          </div>

          {/* STEP 3: JOURNEY TRACK COUNT SELECTOR */}
          <div className="pt-2 border-t border-white/10 flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-purple-500/20 text-purple-300 text-xs flex items-center justify-center font-mono">3</span>
                <span>Elevation Transition Pace</span>
              </span>
              <p className="text-xs text-slate-400">Choose how many songs to transition smoothly between moods</p>
            </div>

            <div className="flex items-center gap-2">
              {[3, 4, 6, 8].map((cnt) => (
                <button
                  key={cnt}
                  onClick={() => {
                    setTrackCount(cnt);
                    setJourneyData(null);
                  }}
                  className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer border ${
                    trackCount === cnt
                      ? 'bg-cyan text-obsidian-950 border-cyan shadow-md'
                      : 'bg-white/5 hover:bg-white/10 border-white/10 text-slate-300'
                  }`}
                >
                  {cnt} Tracks
                </button>
              ))}
            </div>
          </div>

          {/* STEP 4: OPTIONAL FINE-TUNING (Anchor Song & Language Filter) */}
          <div className="pt-4 border-t border-white/10 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs flex items-center justify-center font-mono">4</span>
                <span>Optional Fine-Tuning</span>
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-slate-400">Optional</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Option A: Must-Have / Anchor Song */}
              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-2">
                <label className="text-xs font-semibold text-white flex items-center gap-2">
                  <span>🎯 Must-Have Song (Anchor Track)</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={anchorSong}
                    onChange={(e) => {
                      setAnchorSong(e.target.value);
                      setJourneyData(null);
                    }}
                    placeholder="e.g. Kesariya, Believer, Fix You, Raataan..."
                    className="w-full py-2.5 px-3.5 pr-8 text-xs rounded-xl bg-black/40 border border-white/15 focus:border-cyan focus:outline-none text-white placeholder-slate-500 font-sans"
                  />
                  {anchorSong && (
                    <button
                      onClick={() => {
                        setAnchorSong('');
                        setJourneyData(null);
                      }}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs cursor-pointer"
                    >
                      ✕
                    </button>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  AI analyzes this song&apos;s emotional valence and automatically places it into the matching milestone of your journey.
                </p>
              </div>

              {/* Option B: Language Preference */}
              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-2">
                <label className="text-xs font-semibold text-white flex items-center gap-2">
                  <span>🌐 Preferred Language</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                  {[
                    { id: 'all', label: '🌍 Any / All' },
                    { id: 'hindi', label: '🇮🇳 Hindi' },
                    { id: 'english', label: '🌐 English' },
                    { id: 'punjabi', label: '🎵 Punjabi' },
                    { id: 'instrumental', label: '🎹 Lo-Fi / Inst.' },
                  ].map((lang) => (
                    <button
                      key={lang.id}
                      onClick={() => {
                        setLanguage(lang.id);
                        setJourneyData(null);
                      }}
                      className={`py-1.5 px-2.5 rounded-xl text-[11px] font-semibold transition-all cursor-pointer border text-center ${
                        language === lang.id
                          ? 'bg-cyan-500/25 border-cyan text-white shadow-sm'
                          : 'bg-white/5 hover:bg-white/10 border-white/5 text-slate-400 hover:text-white'
                      }`}
                    >
                      {lang.label}
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Filters recommendations across your journey to emphasize your preferred language.
                </p>
              </div>
            </div>
          </div>

          {/* GENERATE ROADMAP BUTTON */}
          <div>
            <button
              onClick={handleGenerateJourney}
              disabled={isLoading}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-cyan via-blue-500 to-indigo-600 text-slate-950 font-extrabold text-sm sm:text-base shadow-xl shadow-cyan/25 hover:brightness-110 active:scale-[0.99] transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  <span>Synthesizing Emotional Milestones & BPM Trajectory...</span>
                </div>
              ) : (
                <>
                  <span>🚀 Generate Personalized Elevation Roadmap</span>
                  <span>→</span>
                </>
              )}
            </button>
          </div>

          {/* ============================================================== */}
          {/* GENERATED ROADMAP VIEW                                         */}
          {/* ============================================================== */}
          {journeyData && (
            <div className="space-y-8 animate-fadeIn pt-4 border-t border-white/10">
              
              {/* Trajectory Summary & Play Action */}
              <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-cyan-950/60 via-slate-900/70 to-indigo-950/60 border border-cyan/40 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="space-y-2 max-w-xl">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🗺️</span>
                    <h3 className="text-base sm:text-lg font-bold text-white tracking-wide">
                      {journeyData.summary}
                    </h3>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-cyan-200">
                    <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300">
                      🎵 {journeyData.playlist_tracks_count || 0} from your playlists
                    </span>
                    <span className="px-2.5 py-1 rounded-full bg-blue-500/20 border border-blue-500/40 text-blue-300">
                      🎧 {journeyData.history_tracks_count || 0} from listening history
                    </span>
                    {(journeyData.bridge_tracks_count || 0) > 0 && (
                      <span className="px-2.5 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300">
                        ✨ {journeyData.bridge_tracks_count} AI harmonic bridges
                      </span>
                    )}
                  </div>
                </div>

                <button
                  onClick={handleStartPlayback}
                  className="px-6 py-3.5 rounded-full bg-gradient-to-r from-emerald-400 to-cyan text-obsidian-950 font-extrabold text-sm shadow-xl hover:scale-105 active:scale-95 transition-all cursor-pointer flex items-center gap-2 shrink-0"
                >
                  <span>▶ Start Elevation Journey</span>
                  <span>({journeyData.tracks.length} Songs)</span>
                </button>
              </div>

              {/* ROADMAP MILESTONES (STAGES) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono">
                    Roadmap Milestones ({journeyData.stages.length} Sequential Stages)
                  </h4>
                  <span className="text-xs text-slate-400">Smooth BPM & Valence Progression</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                  {journeyData.stages.map((stg) => (
                    <div
                      key={stg.stage_number}
                      className="p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-cyan/30 transition-all flex flex-col justify-between space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="w-7 h-7 rounded-full bg-cyan/20 border border-cyan/40 text-cyan font-bold text-xs flex items-center justify-center font-mono">
                          {stg.stage_number}
                        </span>
                        <span className="text-xs font-mono font-bold text-cyan">
                          ~{stg.target_bpm} BPM
                        </span>
                      </div>

                      <div>
                        <h5 className="text-sm font-bold text-white capitalize">{stg.title}</h5>
                        <p className="text-xs text-slate-400 mt-1 leading-relaxed">{stg.description}</p>
                      </div>

                      <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[11px] font-mono text-slate-400">
                        <span>Stage {stg.stage_number}</span>
                        <span className="text-cyan font-semibold">{stg.track_count} tracks</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* TRACK SEQUENCE TABLE */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono">
                  Personalized Track Sequence ({journeyData.tracks.length} Songs)
                </h4>

                <div className="rounded-2xl border border-white/10 bg-black/40 overflow-hidden divide-y divide-white/5">
                  {journeyData.tracks.map((t, idx) => {
                    const isPlaylist = t.source_type === 'playlist';
                    const isHistory = t.source_type === 'history';

                    return (
                      <div
                        key={t.id || idx}
                        className="p-3.5 sm:p-4 flex items-center justify-between gap-4 hover:bg-white/5 transition-colors"
                      >
                        <div className="flex items-center gap-3.5 min-w-0 flex-1">
                          <span className="w-6 text-center font-mono text-xs text-slate-500 font-bold shrink-0">
                            {idx + 1}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="font-bold text-sm text-white truncate">{cleanSongTitle(t.name)}</p>
                            <p className="text-xs text-slate-400 truncate">{t.artist}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {t.estimated_bpm && (
                            <span className="hidden sm:inline-block text-[11px] font-mono px-2 py-0.5 rounded-full bg-white/5 text-slate-300 border border-white/10">
                              {t.estimated_bpm} BPM
                            </span>
                          )}
                          <span
                            className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                              t.is_anchor
                                ? 'bg-purple-500/25 border-purple-400 text-purple-200 shadow-sm shadow-purple-500/30'
                                : isPlaylist
                                ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                                : isHistory
                                ? 'bg-blue-500/15 border-blue-500/30 text-blue-300'
                                : 'bg-amber-500/15 border-amber-500/30 text-amber-300'
                            }`}
                          >
                            {t.is_anchor ? '🌟 MUST-HAVE ANCHOR' : isPlaylist ? 'YOUR PLAYLIST' : isHistory ? 'HISTORY' : 'AI BRIDGE'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          )}

        </div>

      </div>
    </div>
  );
};

export default RoadmapPage;
