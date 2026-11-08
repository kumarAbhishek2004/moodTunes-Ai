import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import axios from 'axios';
import { API_BASE_URL } from '../config/api';
import { setQueue, playSong, setActiveMood } from '../store/audioSlice';
import { getUserHistory, getUserCustomPlaylists, getUserPlaylistSongs } from '../utils/userStorage';
import { cleanSongTitle } from '../utils/textHelper';

/**
 * MoodJourneyModal
 * "Emotional Elevation Roadmap"
 * Sequences songs to transition the listener from their current state
 * to a target mood by ascending musical valence and BPM.
 * Strictly personalized using the user's playlists and listening history.
 */
const MoodJourneyModal = ({ isOpen, onClose }) => {
  const dispatch = useDispatch();
  const currentMood = useSelector((state) => state.audio.activeMood) || 'sad';
  const authUser = useSelector((state) => state.auth?.user);
  const reduxHistory = useSelector((state) => state.audio?.playbackHistory) || [];

  const [startMood, setStartMood] = useState(currentMood);
  const [targetMood, setTargetMood] = useState('happy');
  const [trackCount, setTrackCount] = useState(6);
  const [anchorSong, setAnchorSong] = useState('');
  const [language, setLanguage] = useState('all');
  const [isLoading, setIsLoading] = useState(false);
  const [journeyData, setJourneyData] = useState(null);

  if (!isOpen) return null;

  const moodOptions = [
    { id: 'sad', name: 'Sad / Melancholic', icon: '🌧️', color: '#3B82F6', valence: '22%' },
    { id: 'calm', name: 'Calm & Serene', icon: '🌊', color: '#00F2FE', valence: '48%' },
    { id: 'focus', name: 'Deep Focus', icon: '🧠', color: '#10B981', valence: '60%' },
    { id: 'romantic', name: 'Warm Romance', icon: '💖', color: '#EC4899', valence: '65%' },
    { id: 'happy', name: 'Joyful & Happy', icon: '✨', color: '#F59E0B', valence: '85%' },
    { id: 'energetic', name: 'Peak Energy', icon: '⚡', color: '#F97316', valence: '92%' },
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
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fadeIn font-sans">
      <div className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-3xl bg-slate-950/95 border border-cyan/30 shadow-2xl p-5 sm:p-6 text-white backdrop-blur-2xl">
        {/* Glow Ambient Top */}
        <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-80 h-36 bg-cyan/20 blur-3xl rounded-full pointer-events-none" />

        {/* Header */}
        <div className="relative z-10 flex items-center justify-between pb-4 border-b border-white/10 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan via-blue-500 to-indigo-600 flex items-center justify-center text-lg shadow-lg shadow-cyan/25">
              🚀
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-wide">Emotional Elevation Roadmap</h3>
              <p className="text-xs text-slate-400">Personalized mood journey crafted from your playlists & history</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Step 1: Start Mood & Target Mood Pickers */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
          <div>
            <label className="text-xs font-bold text-slate-300 block mb-2 uppercase tracking-wider">
              1. Starting Mood
            </label>
            <div className="space-y-1.5">
              {moodOptions.map((m) => (
                <button
                  key={m.id}
                  onClick={() => {
                    setStartMood(m.id);
                    setJourneyData(null);
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    startMood === m.id
                      ? 'bg-white/15 border border-cyan shadow-sm text-white'
                      : 'bg-white/5 hover:bg-white/10 border border-white/5 text-slate-300'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span>{m.icon}</span>
                    <span>{m.name}</span>
                  </span>
                  <span className="text-[10px] font-mono opacity-60">{m.valence} valence</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-300 block mb-2 uppercase tracking-wider">
              2. Target Destination Mood
            </label>
            <div className="space-y-1.5">
              {moodOptions.map((m) => (
                <button
                  key={m.id}
                  onClick={() => {
                    setTargetMood(m.id);
                    setJourneyData(null);
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    targetMood === m.id
                      ? 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-400 text-amber-200 shadow-sm'
                      : 'bg-white/5 hover:bg-white/10 border border-white/5 text-slate-300'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span>{m.icon}</span>
                    <span>{m.name}</span>
                  </span>
                  <span className="text-[10px] font-mono opacity-60">{m.valence} valence</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Optional Fine-Tuning (Anchor Song & Language Filter) */}
        {!journeyData && (
          <div className="space-y-3 pt-3 border-t border-white/10 mb-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <span>Optional Fine-Tuning</span>
              </span>
              <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-slate-400">Optional</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Anchor Song */}
              <div className="space-y-1">
                <label className="text-[11px] text-slate-300 font-medium block">🎯 Must-Have Song (Anchor)</label>
                <div className="relative">
                  <input
                    type="text"
                    value={anchorSong}
                    onChange={(e) => setAnchorSong(e.target.value)}
                    placeholder="e.g. Kesariya, Believer..."
                    className="w-full py-2 px-3 text-xs rounded-xl bg-black/40 border border-white/15 focus:border-cyan focus:outline-none text-white placeholder-slate-500 font-sans"
                  />
                  {anchorSong && (
                    <button
                      onClick={() => setAnchorSong('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs cursor-pointer"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>

              {/* Language Selector */}
              <div className="space-y-1">
                <label className="text-[11px] text-slate-300 font-medium block">🌐 Language</label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full py-2 px-3 text-xs rounded-xl bg-black/40 border border-white/15 focus:border-cyan focus:outline-none text-white font-sans"
                >
                  <option value="all">🌍 Any Language</option>
                  <option value="hindi">🇮🇳 Hindi</option>
                  <option value="english">🌐 English</option>
                  <option value="punjabi">🎵 Punjabi</option>
                  <option value="instrumental">🎹 Lo-Fi / Instrumental</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Generate Button */}
        {!journeyData && (
          <button
            onClick={handleGenerateJourney}
            disabled={isLoading}
            className="w-full py-3 rounded-2xl bg-gradient-to-r from-cyan via-blue-500 to-indigo-600 text-slate-950 font-bold text-sm shadow-xl shadow-cyan/25 hover:brightness-110 active:scale-[0.99] transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <span>Sequencing Tracks from Your Playlists & Library...</span>
            ) : (
              <>
                <span>✨ Generate Personalized Elevation Roadmap</span>
                <span>→</span>
              </>
            )}
          </button>
        )}

        {/* Roadmap Preview Display */}
        {journeyData && (
          <div className="space-y-4 animate-fadeIn">
            {/* Trajectory Summary Banner */}
            <div className="p-3.5 rounded-2xl bg-cyan-950/40 border border-cyan/30 text-xs text-cyan-200 leading-relaxed flex items-start gap-2.5">
              <span className="text-base">🗺️</span>
              <div className="flex-1 space-y-1">
                <p className="font-semibold text-white">{journeyData.summary}</p>
                <div className="flex items-center gap-2 text-[10px] font-mono text-cyan-300 pt-0.5">
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300">
                    🎵 {journeyData.playlist_tracks_count || 0} from your playlists
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-blue-500/20 border border-blue-500/40 text-blue-300">
                    🎧 {journeyData.history_tracks_count || 0} from history
                  </span>
                  {(journeyData.bridge_tracks_count || 0) > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300">
                      ✨ {journeyData.bridge_tracks_count} bridge tracks
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Stages Stepper */}
            <div>
              <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block mb-2">
                Roadmap Milestones ({journeyData.stages.length} Stages)
              </label>

              <div className="space-y-2">
                {journeyData.stages.map((stg) => (
                  <div
                    key={stg.stage_number}
                    className="p-3 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-full bg-cyan/20 border border-cyan/40 text-cyan font-bold text-xs flex items-center justify-center">
                        {stg.stage_number}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-white capitalize">{stg.title}</h4>
                        <p className="text-[10px] text-slate-400">{stg.description}</p>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-mono font-bold text-cyan">~{stg.target_bpm} BPM</span>
                      <span className="text-[10px] text-slate-400 block">{stg.track_count} tracks</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Track Queue Preview */}
            <div>
              <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block mb-2">
                Personalized Track Sequence ({journeyData.tracks.length} Songs)
              </label>
              <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
                {journeyData.tracks.map((t, idx) => {
                  const isPlaylist = t.source_type === 'playlist';
                  const isHistory = t.source_type === 'history';

                  return (
                    <div
                      key={t.id || idx}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-black/40 border border-white/5 text-xs hover:border-white/15 transition-colors"
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1 pr-2">
                        <span className="font-mono text-[10px] text-slate-500 w-4 shrink-0">{idx + 1}</span>
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-white truncate">{cleanSongTitle(t.name)}</p>
                          <p className="text-[10px] text-slate-400 truncate">{t.artist}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {/* Source Tag Badge */}
                        {t.is_anchor ? (
                          <span
                            className="px-2 py-0.5 rounded-full text-[9.5px] font-mono font-bold bg-purple-500/25 border border-purple-400 text-purple-200 shadow-sm"
                            title="Your chosen must-have track"
                          >
                            🌟 Must-Have
                          </span>
                        ) : isPlaylist ? (
                          <span
                            className="px-2 py-0.5 rounded-full text-[9.5px] font-mono font-bold bg-emerald-500/15 border border-emerald-500/35 text-emerald-300 max-w-[130px] truncate"
                            title={t.source_badge}
                          >
                            🎵 {t.source_name}
                          </span>
                        ) : isHistory ? (
                          <span
                            className="px-2 py-0.5 rounded-full text-[9.5px] font-mono font-bold bg-blue-500/15 border border-blue-500/35 text-blue-300"
                            title="From your listening history"
                          >
                            🎧 History
                          </span>
                        ) : (
                          <span
                            className="px-2 py-0.5 rounded-full text-[9.5px] font-mono font-bold bg-amber-500/15 border border-amber-500/35 text-amber-300"
                            title="Curated Bridge Track to smooth mood transition"
                          >
                            ✨ Bridge
                          </span>
                        )}

                        <span className="px-2 py-0.5 rounded-full text-[9.5px] font-bold uppercase bg-white/10 text-cyan shrink-0">
                          Stage {t.stage_index}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2.5 pt-2">
              <button
                onClick={() => setJourneyData(null)}
                className="px-4 py-2.5 rounded-xl border border-white/10 text-xs font-bold text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                ← Back
              </button>

              <button
                onClick={handleStartPlayback}
                className="flex-1 py-2.5 rounded-xl bg-cyan text-slate-950 font-bold text-xs shadow-lg shadow-cyan/30 hover:brightness-110 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <span>▶ Start Emotional Journey</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MoodJourneyModal;
