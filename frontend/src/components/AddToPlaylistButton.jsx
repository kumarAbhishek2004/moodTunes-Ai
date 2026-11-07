import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import axios from 'axios';
import { API_BASE_URL } from '../config/api';
import { resolveMusicTheme } from '../utils/themeMap';
import { getUserPlaylistSongs, saveUserPlaylistSongs } from '../utils/userStorage';
import { resolveTrackArtwork, handleArtworkError } from '../utils/imageHelper';

const DEFAULT_MOOD_CONFIGS = {
  calm: { name: 'Calm', emoji: '🍃', accent: '#00F2FE', accentRgb: '0, 242, 254' },
  happy: { name: 'Happy', emoji: '😊', accent: '#F59E0B', accentRgb: '245, 158, 11' },
  energetic: { name: 'Energetic', emoji: '⚡', accent: '#F97316', accentRgb: '249, 115, 22' },
  sad: { name: 'Sad', emoji: '🌙', accent: '#3B82F6', accentRgb: '59, 130, 246' },
  focus: { name: 'Focus', emoji: '🎯', accent: '#10B981', accentRgb: '16, 185, 129' },
  romantic: { name: 'Romantic', emoji: '💖', accent: '#EC4899', accentRgb: '236, 72, 153' },
};

const STARTER_PLAYLISTS = [
  { id: 'starter-calm-and-relax', name: 'Calm & Relax', mood: 'calm', emoji: '🍃' },
  { id: 'starter-happy-vibes', name: 'Happy Vibes', mood: 'happy', emoji: '😊' },
  { id: 'starter-energetic-boost', name: 'Energetic Boost', mood: 'energetic', emoji: '⚡' },
  { id: 'starter-late-night-blues', name: 'Late Night Blues', mood: 'sad', emoji: '🌙' },
  { id: 'starter-deep-focus', name: 'Deep Focus', mood: 'focus', emoji: '🎯' },
  { id: 'starter-romantic-twilight', name: 'Romantic Twilight', mood: 'romantic', emoji: '💖' },
];

const getStoredSongs = (playlistId, user) => {
  return getUserPlaylistSongs(playlistId, user);
};

const saveStoredSongs = (playlistId, songs, user) => {
  saveUserPlaylistSongs(playlistId, songs, user);
};

const AddToPlaylistButton = ({ song, compact = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [userPlaylists, setUserPlaylists] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCreateNew, setShowCreateNew] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [newPlaylistMood, setNewPlaylistMood] = useState('calm');
  const [successToast, setSuccessToast] = useState(null);
  const [localAddedSet, setLocalAddedSet] = useState(new Set());

  const navigate = useNavigate();
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const [showGuestNotice, setShowGuestNotice] = useState(false);
  const reduxActiveMood = useSelector((state) => state.audio?.activeMood);
  const currentSong = useSelector((state) => state.audio?.currentSong);

  // Dynamic theme resolution matching the active mood
  const theme = resolveMusicTheme(currentSong || song, reduxActiveMood);

  useEffect(() => {
    if (isOpen && isAuthenticated) {
      fetchPlaylists();
    }
  }, [isOpen, isAuthenticated]);

  const fetchPlaylists = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (token) {
        const response = await axios.get(`${API_BASE_URL}/api/playlists`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setUserPlaylists(response.data || []);
      }
    } catch (error) {
      console.warn('Error fetching playlists in popover:', error);
    } finally {
      setLoading(false);
    }
  };

  // Combine user custom playlists with starter playlists
  const allAvailablePlaylists = useMemo(() => {
    const customList = (userPlaylists || []).map((p) => {
      const m = String(p.mood || 'calm').toLowerCase();
      const cfg = DEFAULT_MOOD_CONFIGS[m] || DEFAULT_MOOD_CONFIGS.calm;
      const stored = getStoredSongs(p.id || p._id, user);
      const songList = p.songs?.length > 0 ? p.songs : stored;
      return {
        id: p.id || p._id,
        name: p.name || 'Untitled Playlist',
        mood: m,
        emoji: cfg.emoji || '🎵',
        songs: songList,
        isCustom: true,
      };
    });

    const starterList = STARTER_PLAYLISTS.map((s) => {
      const stored = getStoredSongs(s.id);
      return {
        ...s,
        songs: stored,
        isCustom: false,
      };
    });

    return [...customList, ...starterList];
  }, [userPlaylists, isOpen]);

  // Check if target song is currently in playlist
  const isSongInPlaylist = (playlist) => {
    if (!song) return false;
    if (localAddedSet.has(playlist.id)) return true;
    const songs = playlist.songs || [];
    return songs.some(
      (s) =>
        (s.id && s.id === song.id) ||
        (s.name && song.name && s.name.toLowerCase() === song.name.toLowerCase() && s.artist && song.artist && s.artist.toLowerCase() === song.artist.toLowerCase())
    );
  };

  const handleAddToPlaylist = async (playlist) => {
    if (!song) return;

    const normalizedSong = {
      ...song,
      id: song.id || `song-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      mood_match: playlist.mood,
    };

    // Update local state and localStorage immediately
    const existing = getStoredSongs(playlist.id, user);
    const updated = [...existing, normalizedSong];
    saveStoredSongs(playlist.id, updated);
    setLocalAddedSet((prev) => new Set([...prev, playlist.id]));

    // Sync to backend if it's a backend custom playlist
    if (playlist.isCustom) {
      try {
        const token = localStorage.getItem('token');
        if (token) {
          await axios.post(
            `${API_BASE_URL}/api/playlists/${playlist.id}/songs`,
            normalizedSong,
            { headers: { Authorization: `Bearer ${token}` } }
          );
        }
      } catch (err) {
        console.warn('Backend sync note:', err);
      }
    }

    // Show sleek non-blocking feedback toast
    setSuccessToast(`Added to "${playlist.name}"`);
    setTimeout(() => {
      setSuccessToast(null);
    }, 2400);
  };

  const handleCreateAndAdd = async (e) => {
    e.preventDefault();
    if (!newPlaylistName.trim()) return;

    try {
      const token = localStorage.getItem('token');
      let createdId = `custom-${Date.now()}`;

      const normalizedSong = {
        ...song,
        id: song.id || `song-${Date.now()}`,
        mood_match: newPlaylistMood,
      };

      if (token) {
        try {
          const res = await axios.post(
            `${API_BASE_URL}/api/playlists`,
            {
              name: newPlaylistName.trim(),
              description: 'Created from player',
              mood: newPlaylistMood,
              songs: [normalizedSong],
              is_public: false,
            },
            { headers: { Authorization: `Bearer ${token}` } }
          );
          if (res.data?.id) createdId = res.data.id;
        } catch (apiErr) {
          console.warn('Fallback local playlist creation:', apiErr);
        }
      }

      // Save locally
      saveStoredSongs(createdId, [normalizedSong]);
      setLocalAddedSet((prev) => new Set([...prev, createdId]));

      setUserPlaylists((prev) => [
        {
          id: createdId,
          name: newPlaylistName.trim(),
          mood: newPlaylistMood,
          songs: [normalizedSong],
        },
        ...prev,
      ]);

      setSuccessToast(`Created "${newPlaylistName}" & added song!`);
      setNewPlaylistName('');
      setShowCreateNew(false);

      setTimeout(() => {
        setSuccessToast(null);
      }, 2400);
    } catch (error) {
      console.error('Error creating playlist:', error);
      alert('Failed to create playlist');
    }
  };

  if (!isAuthenticated || !song) {
    return null;
  }

  return (
    <div className="relative inline-block">
      {/* Trigger Button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          if (user?.isGuest) {
            setShowGuestNotice(true);
            return;
          }
          setIsOpen(!isOpen);
        }}
        className={`${
          compact
            ? 'w-9 h-9 sm:w-10 sm:h-10 rounded-2xl flex items-center justify-center transition-all duration-300 border backdrop-blur-md cursor-pointer hover:scale-105 active:scale-95'
            : 'px-4 py-2.5 rounded-full font-bold text-xs sm:text-sm transition-all flex items-center gap-2 shadow-lg cursor-pointer hover:scale-105 active:scale-95'
        }`}
        style={
          compact
            ? {
                backgroundColor: isOpen ? `rgba(${theme.accentRgb}, 0.2)` : 'rgba(255, 255, 255, 0.05)',
                borderColor: isOpen ? theme.accent : 'rgba(255, 255, 255, 0.12)',
                color: isOpen ? theme.accent : '#CBD5E1',
                boxShadow: isOpen ? `0 0 16px rgba(${theme.accentRgb}, 0.35)` : undefined,
              }
            : {
                backgroundColor: theme.accent,
                color: '#060B10',
                boxShadow: `0 8px 24px -4px rgba(${theme.accentRgb}, 0.45)`,
              }
        }
        title="Add to playlist"
      >
        <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
        </svg>
        {!compact && <span>Add to Playlist</span>}
      </button>

      {/* Popover Dropdown */}
      {isOpen && (
        <>
          {/* Backdrop Click Dismiss */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => {
              setIsOpen(false);
              setShowCreateNew(false);
            }}
          />

          {/* Ultra-Aesthetic Glassmorphic Container */}
          <div
            className="absolute right-0 top-full mt-2 w-80 sm:w-88 rounded-3xl bg-slate-950/95 backdrop-blur-3xl border shadow-2xl z-50 overflow-hidden animate-fadeIn"
            style={{
              borderColor: `rgba(${theme.accentRgb}, 0.35)`,
              boxShadow: `0 25px 70px -10px rgba(0,0,0,0.9), 0 0 35px rgba(${theme.accentRgb}, 0.22)`,
            }}
          >
            {/* Header with Track Details */}
            <div
              className="p-4 border-b border-white/10 flex items-center justify-between gap-3"
              style={{
                background: `linear-gradient(135deg, rgba(${theme.accentRgb}, 0.14) 0%, rgba(15, 23, 42, 0.9) 100%)`,
              }}
            >
              <div className="flex items-center gap-3 min-w-0">
                <img
                  src={resolveTrackArtwork(song)}
                  alt={song.name}
                  className="w-10 h-10 rounded-xl object-cover shrink-0 shadow-md border border-white/10"
                  onError={(e) => handleArtworkError(e, song)}
                />
                <div className="min-w-0">
                  <h3 className="text-xs font-mono uppercase tracking-wider text-slate-400">Add to Playlist</h3>
                  <p className="text-sm font-bold text-white truncate">{song.name}</p>
                  <p className="text-[11px] text-slate-400 truncate">{song.artist}</p>
                </div>
              </div>

              <button
                onClick={() => setIsOpen(false)}
                className="w-7 h-7 rounded-full bg-white/5 hover:bg-white/15 flex items-center justify-center text-slate-400 hover:text-white transition-colors text-xs shrink-0 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Micro Toast Feedback */}
            {successToast && (
              <div
                className="mx-3 mt-2 p-2 rounded-xl text-xs font-semibold text-center animate-fadeIn border"
                style={{
                  backgroundColor: `rgba(${theme.accentRgb}, 0.15)`,
                  borderColor: theme.accent,
                  color: '#ffffff',
                }}
              >
                ✓ {successToast}
              </div>
            )}

            {/* Body: Create form or List */}
            <div className="max-h-72 overflow-y-auto p-2 space-y-1.5 custom-scrollbar">
              {loading ? (
                <div className="py-8 text-center">
                  <div
                    className="w-7 h-7 border-2 border-t-transparent rounded-full animate-spin mx-auto"
                    style={{ borderColor: theme.accent }}
                  />
                </div>
              ) : showCreateNew ? (
                /* Inline Quick Playlist Creation */
                <form onSubmit={handleCreateAndAdd} className="p-3 bg-slate-900/80 rounded-2xl border border-white/10 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">New Playlist</span>
                    <button
                      type="button"
                      onClick={() => setShowCreateNew(false)}
                      className="text-[10px] text-slate-400 hover:text-white"
                    >
                      Cancel
                    </button>
                  </div>

                  {/* Mood Selector Chips */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                    {Object.entries(DEFAULT_MOOD_CONFIGS).map(([mKey, mVal]) => (
                      <button
                        key={mKey}
                        type="button"
                        onClick={() => setNewPlaylistMood(mKey)}
                        className={`shrink-0 px-2.5 py-1 rounded-xl text-[11px] flex items-center gap-1 border transition-all cursor-pointer ${
                          newPlaylistMood === mKey ? 'shadow-sm font-bold text-white' : 'text-slate-400 border-white/5 bg-slate-950/60'
                        }`}
                        style={
                          newPlaylistMood === mKey
                            ? {
                                backgroundColor: `rgba(${mVal.accentRgb}, 0.25)`,
                                borderColor: mVal.accent,
                                color: mVal.accent,
                              }
                            : undefined
                        }
                      >
                        <span>{mVal.emoji}</span>
                        <span>{mVal.name}</span>
                      </button>
                    ))}
                  </div>

                  <input
                    type="text"
                    value={newPlaylistName}
                    onChange={(e) => setNewPlaylistName(e.target.value)}
                    placeholder="Enter playlist name..."
                    autoFocus
                    className="w-full bg-slate-950/90 border border-white/15 focus:border-white/30 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none"
                  />

                  <button
                    type="submit"
                    disabled={!newPlaylistName.trim()}
                    className="w-full py-2 rounded-xl text-xs font-bold transition-all disabled:opacity-40 cursor-pointer shadow-md"
                    style={{
                      backgroundColor: theme.accent,
                      color: '#060B10',
                    }}
                  >
                    Create & Add Song
                  </button>
                </form>
              ) : (
                <>
                  {/* Create New Playlist Button */}
                  <button
                    onClick={() => setShowCreateNew(true)}
                    className="w-full p-2.5 rounded-2xl transition-all flex items-center gap-2.5 text-xs font-bold border border-dashed cursor-pointer group mb-1"
                    style={{
                      borderColor: `rgba(${theme.accentRgb}, 0.4)`,
                      backgroundColor: `rgba(${theme.accentRgb}, 0.08)`,
                      color: theme.accent,
                    }}
                  >
                    <div
                      className="w-6 h-6 rounded-lg flex items-center justify-center text-xs group-hover:scale-110 transition-transform"
                      style={{
                        backgroundColor: theme.accent,
                        color: '#060B10',
                      }}
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                      </svg>
                    </div>
                    <span>Create New Playlist</span>
                  </button>

                  {/* Playlists List */}
                  {allAvailablePlaylists.map((playlist) => {
                    const added = isSongInPlaylist(playlist);
                    const pMood = DEFAULT_MOOD_CONFIGS[playlist.mood] || DEFAULT_MOOD_CONFIGS.calm;

                    return (
                      <div
                        key={playlist.id}
                        className="group flex items-center justify-between p-2.5 rounded-2xl bg-slate-900/50 hover:bg-slate-900 border border-white/5 hover:border-white/15 transition-all"
                      >
                        <div className="flex items-center gap-2.5 min-w-0 pr-2">
                          <div
                            className="w-8 h-8 rounded-xl flex items-center justify-center text-sm shrink-0 border"
                            style={{
                              backgroundColor: `rgba(${pMood.accentRgb}, 0.15)`,
                              borderColor: `rgba(${pMood.accentRgb}, 0.3)`,
                            }}
                          >
                            {playlist.emoji}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-100 group-hover:text-white truncate">
                              {playlist.name}
                            </p>
                            <p className="text-[10px] text-slate-400">
                              {playlist.songs?.length || 0} songs
                            </p>
                          </div>
                        </div>

                        {/* State Button */}
                        {added ? (
                          <span
                            className="text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0"
                            style={{
                              color: '#10B981',
                              backgroundColor: 'rgba(16, 185, 129, 0.12)',
                              borderColor: 'rgba(16, 185, 129, 0.3)',
                            }}
                          >
                            ✓ Added
                          </span>
                        ) : (
                          <button
                            onClick={() => handleAddToPlaylist(playlist)}
                            className="w-7 h-7 rounded-full flex items-center justify-center transition-all hover:scale-110 active:scale-95 shrink-0 shadow cursor-pointer"
                            style={{
                              backgroundColor: theme.accent,
                              color: '#060B10',
                            }}
                            title="Add to this playlist"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                            </svg>
                          </button>
                        )}
                      </div>
                    );
                  })}
                </>
              )}
            </div>
          </div>
        </>
      )}
      {/* Guest Notice Modal */}
      {showGuestNotice && (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={(e) => {
              e.stopPropagation();
              setShowGuestNotice(false);
            }}
          />
          <div
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-80 sm:w-96 p-6 rounded-3xl bg-slate-950/95 border border-white/20 shadow-2xl backdrop-blur-2xl text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-14 h-14 mx-auto rounded-2xl bg-pink-500/15 border border-pink-500/30 flex items-center justify-center text-2xl mb-4">
              🔒
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Member Exclusive Feature</h3>
            <p className="text-xs text-slate-300 leading-relaxed mb-6">
              You are currently browsing as a <strong>Guest</strong>. Creating playlists and saving songs requires a free MoodTunes AI account.
            </p>
            <div className="flex flex-col gap-2.5">
              <button
                onClick={() => {
                  setShowGuestNotice(false);
                  navigate('/login');
                }}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white shadow-lg cursor-pointer transition-all hover:scale-[1.02]"
                style={{
                  background: 'linear-gradient(135deg, #EC4899 0%, #8B5CF6 50%, #6366F1 100%)',
                }}
              >
                Log In or Sign Up
              </button>
              <button
                onClick={() => setShowGuestNotice(false)}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-medium text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
              >
                Continue as Guest
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AddToPlaylistButton;
