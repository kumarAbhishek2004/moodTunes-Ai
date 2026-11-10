import React, { useState, useEffect, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import axios from 'axios';
import { API_BASE_URL } from '../config/api';
import { addToQueue, addToPlayNext } from '../store/audioSlice';
import { getUserCustomPlaylists, getUserPlaylistSongs } from '../utils/userStorage';
import { cleanSongTitle } from '../utils/textHelper';
import { resolveTrackArtwork, handleArtworkError } from '../utils/imageHelper';

const STARTER_PLAYLISTS = [
  { id: 'starter-calm-and-relax', name: 'Calm & Relax', emoji: '🍃', mood: 'calm', cover: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=800&q=80' },
  { id: 'starter-happy-vibes', name: 'Happy Vibes', emoji: '😊', mood: 'happy', cover: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80' },
  { id: 'starter-energetic-boost', name: 'Energetic Boost', emoji: '⚡', mood: 'energetic', cover: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=800&q=80' },
  { id: 'starter-late-night-blues', name: 'Late Night Blues', emoji: '🌙', mood: 'sad', cover: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=800&q=80' },
  { id: 'starter-deep-focus', name: 'Deep Focus & Flow', emoji: '🎯', mood: 'focus', cover: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=800&q=80' },
  { id: 'starter-romantic-evening', name: 'Romantic Evening', emoji: '❤️', mood: 'romantic', cover: 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?auto=format&fit=crop&w=800&q=80' },
];

const PRESET_QUICK_SEARCHES = [
  'Galat Launda',
  'Shoorveer Arjun',
  'Arijit Singh',
  'Lofi Chill Beats',
  'Sidhu Moose Wala',
  'Workout Phonk',
];

const formatDuration = (seconds) => {
  if (!seconds || isNaN(seconds)) return '3:45';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
};

/**
 * AddToQueueModal
 * Gives users 2 flexible options to add music into the active queue:
 * 1. Search songs live (YouTube + catalog)
 * 2. Add from their playlists (either individual songs or entire playlists)
 */
const AddToQueueModal = ({ isOpen, onClose, onFeedback }) => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth || {});
  const { queue = [], activeMood = 'happy' } = useSelector((state) => state.audio || {});

  const [activeTab, setActiveTab] = useState('search'); // 'search' | 'playlist'
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [addedIds, setAddedIds] = useState(new Set());
  const [selectedPlaylistId, setSelectedPlaylistId] = useState(null);
  const [apiPlaylists, setApiPlaylists] = useState([]);
  const [modalToast, setModalToast] = useState(null);

  const showToast = (msg) => {
    setModalToast(msg);
    if (onFeedback) onFeedback(msg);
    setTimeout(() => setModalToast(null), 2500);
  };

  // 1. Fetch user playlists from backend & localStorage when modal opens
  useEffect(() => {
    if (!isOpen) return;
    const fetchPlaylists = async () => {
      try {
        const token = localStorage.getItem('token');
        if (token && !user?.isGuest) {
          const res = await axios.get(`${API_BASE_URL}/api/playlists`, {
            headers: { Authorization: `Bearer ${token}` },
            timeout: 3500,
          });
          if (Array.isArray(res.data)) {
            setApiPlaylists(res.data);
          }
        }
      } catch (e) {
        // Fallback to local
      }
    };
    fetchPlaylists();
  }, [isOpen, user]);

  // Combined available playlists
  const allPlaylists = useMemo(() => {
    const localCustom = getUserCustomPlaylists(user);
    const combinedMap = new Map();

    // Starter playlists with user-added songs
    STARTER_PLAYLISTS.forEach((p) => {
      const songs = getUserPlaylistSongs(p.id, user);
      combinedMap.set(p.id, {
        ...p,
        songs,
        isCustom: false,
      });
    });

    // Local custom / imported playlists
    (localCustom || []).forEach((p) => {
      const pid = p.id || p._id;
      if (!pid) return;
      const songs = (p.songs && p.songs.length > 0) ? p.songs : getUserPlaylistSongs(pid, user);
      combinedMap.set(pid, {
        ...p,
        id: pid,
        songs,
        isCustom: true,
      });
    });

    // Backend playlists
    (apiPlaylists || []).forEach((p) => {
      const pid = p.id || p._id;
      if (!pid) return;
      const songs = (p.songs && p.songs.length > 0) ? p.songs : getUserPlaylistSongs(pid, user);
      combinedMap.set(pid, {
        ...p,
        id: pid,
        songs,
        isCustom: true,
      });
    });

    return Array.from(combinedMap.values());
  }, [user, apiPlaylists]);

  // Set default selected playlist when entering playlist tab
  useEffect(() => {
    if (activeTab === 'playlist' && !selectedPlaylistId && allPlaylists.length > 0) {
      const withSongs = allPlaylists.find((p) => p.songs && p.songs.length > 0);
      setSelectedPlaylistId((withSongs || allPlaylists[0]).id);
    }
  }, [activeTab, selectedPlaylistId, allPlaylists]);

  const activePlaylist = useMemo(() => {
    return allPlaylists.find((p) => p.id === selectedPlaylistId) || allPlaylists[0] || null;
  }, [allPlaylists, selectedPlaylistId]);

  // 2. Debounced search
  useEffect(() => {
    const trimmed = searchQuery.trim();
    if (!trimmed || trimmed.length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    const abortController = new AbortController();
    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await axios.get(`${API_BASE_URL}/search-music`, {
          params: { query: trimmed, limit: 10 },
          signal: abortController.signal,
          timeout: 6500,
        });
        if (Array.isArray(res.data?.results)) {
          setSearchResults(res.data.results);
        }
      } catch (err) {
        if (!axios.isCancel(err)) {
          console.warn('Search notice:', err?.message);
        }
      } finally {
        setIsSearching(false);
      }
    }, 380);

    return () => {
      clearTimeout(timer);
      abortController.abort();
    };
  }, [searchQuery]);

  if (!isOpen) return null;

  // Handlers for adding songs
  const handleAddToQueue = (song) => {
    if (!song) return;
    dispatch(addToQueue(song));
    setAddedIds((prev) => new Set(prev).add(song.id || song.youtube_id || song.name));
    showToast(`✨ Added "${cleanSongTitle(song.name)}" to queue`);
  };

  const handlePlayNext = (song) => {
    if (!song) return;
    dispatch(addToPlayNext(song));
    setAddedIds((prev) => new Set(prev).add(song.id || song.youtube_id || song.name));
    showToast(`⚡ "${cleanSongTitle(song.name)}" will play next!`);
  };

  const handleAddAllFromPlaylist = (playlist) => {
    if (!playlist || !playlist.songs || playlist.songs.length === 0) {
      showToast('⚠️ No tracks in this playlist to add');
      return;
    }
    dispatch(addToQueue(playlist.songs));
    showToast(`🎉 Added ${playlist.songs.length} tracks from "${playlist.name}" to queue!`);
  };

  return (
    <div className="fixed inset-0 z-[160] flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-5 animate-fadeIn font-sans select-none">
      <div className="relative w-full max-w-3xl lg:max-w-4xl max-h-[90vh] rounded-3xl bg-slate-950/95 border border-cyan/30 shadow-2xl p-5 sm:p-6 text-white backdrop-blur-2xl flex flex-col overflow-hidden">
        
        {/* Ambient Top Glow */}
        <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-80 h-36 bg-cyan/20 blur-3xl rounded-full pointer-events-none" />

        {/* Floating In-Modal Toast */}
        {modalToast && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-xl text-xs font-bold text-white bg-slate-900/95 border border-cyan/40 shadow-2xl shadow-cyan/30 animate-fadeIn text-center max-w-[90%] truncate">
            {modalToast}
          </div>
        )}

        {/* Header */}
        <div className="relative z-10 flex items-center justify-between pb-3.5 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-cyan-400 to-emerald-400 flex items-center justify-center text-slate-950 font-black text-lg shadow-lg shadow-cyan-500/20">
              +
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-wide">Add Music to Queue</h3>
              <p className="text-[11px] text-slate-400">
                Queue currently has <span className="text-cyan-300 font-bold font-mono">{queue.length}</span> tracks
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title="Close"
          >
            ✕
          </button>
        </div>

        {/* Mode Selector Tabs: Search or From Playlist */}
        <div className="flex items-center gap-2 my-3.5 p-1 rounded-2xl bg-white/5 border border-white/10 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('search')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'search'
                ? 'bg-cyan text-slate-950 shadow-md shadow-cyan/25 scale-[1.01]'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <span>🔍</span>
            <span>Search Songs</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('playlist')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'playlist'
                ? 'bg-cyan text-slate-950 shadow-md shadow-cyan/25 scale-[1.01]'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <span>📑</span>
            <span>From Your Playlists</span>
          </button>
        </div>

        {/* TAB 1: Search Music */}
        {activeTab === 'search' && (
          <div className="flex-1 flex flex-col min-h-0 space-y-3">
            {/* Search Input */}
            <div className="relative shrink-0">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm">🔍</span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search song title, artist, YouTube URL or rap..."
                className="w-full pl-9 pr-8 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-cyan transition"
                autoFocus
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Quick Search Preset Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 shrink-0 no-scrollbar">
              <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider shrink-0 mr-1">Trending:</span>
              {PRESET_QUICK_SEARCHES.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setSearchQuery(preset)}
                  className="shrink-0 px-2.5 py-1 rounded-lg text-[11px] bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white transition cursor-pointer"
                >
                  {preset}
                </button>
              ))}
            </div>

            {/* Search Results List */}
            <div className="flex-1 overflow-y-auto pr-1 space-y-1.5 divide-y divide-white/5 custom-scrollbar min-h-0">
              {isSearching ? (
                <div className="flex flex-col items-center justify-center py-12 text-slate-400 gap-2">
                  <div className="w-6 h-6 border-2 border-cyan border-t-transparent rounded-full animate-spin" />
                  <span className="text-xs">Finding tracks...</span>
                </div>
              ) : searchResults.length > 0 ? (
                searchResults.map((song, i) => {
                  const sKey = song.id || song.youtube_id || song.name;
                  const isAdded = addedIds.has(sKey);
                  return (
                    <div
                      key={sKey || i}
                      className="pt-1.5 first:pt-0 flex items-center justify-between p-2 sm:p-2.5 rounded-xl hover:bg-white/5 transition-all group gap-2.5"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1 pr-1">
                        <img
                          src={resolveTrackArtwork(song)}
                          onError={handleArtworkError}
                          alt={song.name}
                          className="w-10 h-10 rounded-lg object-cover bg-slate-800 shrink-0 shadow-sm"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-white truncate group-hover:text-cyan transition-colors">
                            {cleanSongTitle(song.name)}
                          </p>
                          <p className="text-[11px] text-slate-400 truncate">
                            {song.artist || 'Unknown Artist'} • {formatDuration(song.duration || song.duration_ms / 1000)}
                          </p>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-2 shrink-0 ml-auto">
                        <button
                          type="button"
                          onClick={() => handlePlayNext(song)}
                          className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 transition-all hover:scale-105 active:scale-95 cursor-pointer flex items-center gap-1 shrink-0"
                          title="Insert this song to play immediately after the current track"
                        >
                          <span>⚡</span>
                          <span className="hidden sm:inline">Play Next</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleAddToQueue(song)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all hover:scale-105 active:scale-95 cursor-pointer flex items-center gap-1 shrink-0 ${
                            isAdded
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                              : 'bg-cyan hover:bg-cyan-400 text-slate-950 shadow-md shadow-cyan/20 font-semibold'
                          }`}
                          title="Append to the end of the queue"
                        >
                          <span>{isAdded ? '✓' : '+'}</span>
                          <span>{isAdded ? 'Added' : 'Queue'}</span>
                        </button>
                      </div>
                    </div>
                  );
                })
              ) : searchQuery.trim().length >= 2 ? (
                <div className="text-center py-12 text-slate-400 text-xs">
                  <p className="text-2xl mb-1.5">🎵</p>
                  No tracks found matching "{searchQuery}". Try a different title or artist name.
                </div>
              ) : (
                <div className="text-center py-12 text-slate-400 text-xs">
                  <p className="text-2xl mb-1.5">🎧</p>
                  Type a song or artist above, or click a trending pill to discover songs.
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: From Playlists */}
        {activeTab === 'playlist' && (
          <div className="flex-1 flex flex-col sm:flex-row gap-4 min-h-0 min-w-0 overflow-hidden">
            {/* Playlist Sidebar List */}
            <div className="sm:w-56 lg:w-60 shrink-0 flex sm:flex-col gap-1.5 overflow-x-auto sm:overflow-y-auto sm:border-r border-white/10 sm:pr-3 custom-scrollbar">
              {allPlaylists.map((pl) => {
                const isSelected = pl.id === selectedPlaylistId;
                const count = pl.songs?.length || 0;
                return (
                  <button
                    key={pl.id}
                    type="button"
                    onClick={() => setSelectedPlaylistId(pl.id)}
                    className={`shrink-0 sm:shrink sm:w-full text-left p-2.5 rounded-xl border transition-all flex items-center gap-2.5 cursor-pointer ${
                      isSelected
                        ? 'bg-cyan/15 border-cyan/40 text-white shadow-md'
                        : 'bg-white/5 border-white/5 text-slate-400 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <span className="text-lg">{pl.emoji || '🎵'}</span>
                    <div className="min-w-0 flex-1 truncate">
                      <p className="text-xs font-bold truncate leading-tight text-white">{pl.name}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5 capitalize">
                        {count} tracks • {pl.mood || 'custom'}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Selected Playlist Content */}
            <div className="flex-1 flex flex-col min-h-0 min-w-0 pl-0 sm:pl-1 overflow-hidden">
              {activePlaylist ? (
                <>
                  {/* Playlist Top Action Header */}
                  <div className="flex items-center justify-between pb-2.5 border-b border-white/10 shrink-0 gap-2">
                    <div className="min-w-0 flex-1">
                      <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                        <span>{activePlaylist.emoji || '🎵'}</span>
                        <span className="truncate">{activePlaylist.name}</span>
                      </h4>
                      <p className="text-[11px] text-slate-400 truncate">
                        {activePlaylist.songs?.length || 0} tracks available in this playlist
                      </p>
                    </div>

                    {activePlaylist.songs?.length > 0 && (
                      <button
                        type="button"
                        onClick={() => handleAddAllFromPlaylist(activePlaylist)}
                        className="shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-400 to-cyan text-slate-950 shadow-md shadow-emerald-500/20 hover:scale-105 active:scale-95 transition-all cursor-pointer flex items-center gap-1.5"
                        title="Add all songs in this playlist to the queue"
                      >
                        <span>+ Add All ({activePlaylist.songs.length})</span>
                      </button>
                    )}
                  </div>

                  {/* Playlist Tracks List */}
                  <div className="flex-1 overflow-y-auto pr-1.5 space-y-1.5 divide-y divide-white/5 custom-scrollbar min-h-0 pt-2">
                    {activePlaylist.songs && activePlaylist.songs.length > 0 ? (
                      activePlaylist.songs.map((song, i) => {
                        const sKey = song.id || song.youtube_id || song.name;
                        const isAdded = addedIds.has(sKey);
                        return (
                          <div
                            key={sKey || i}
                            className="pt-1.5 first:pt-0 flex items-center justify-between p-2 sm:p-2.5 rounded-xl hover:bg-white/5 transition-all group gap-2.5"
                          >
                            <div className="flex items-center gap-2.5 min-w-0 flex-1 pr-1">
                              <span className="font-mono text-[10px] text-slate-500 w-5 shrink-0 text-center">{i + 1}</span>
                              <img
                                src={resolveTrackArtwork(song)}
                                onError={handleArtworkError}
                                alt={song.name}
                                className="w-10 h-10 rounded-lg object-cover bg-slate-800 shrink-0 shadow-sm"
                              />
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-bold text-white truncate group-hover:text-cyan transition-colors">
                                  {cleanSongTitle(song.name)}
                                </p>
                                <p className="text-[10px] text-slate-400 truncate">
                                  {song.artist || 'Unknown Artist'}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0 ml-auto">
                              <button
                                type="button"
                                onClick={() => handlePlayNext(song)}
                                className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 transition-all hover:scale-105 active:scale-95 cursor-pointer flex items-center gap-1 shrink-0"
                                title="Play immediately next"
                              >
                                <span>⚡</span>
                                <span>Next</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleAddToQueue(song)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all hover:scale-105 active:scale-95 cursor-pointer flex items-center gap-1 shrink-0 ${
                                  isAdded
                                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                    : 'bg-cyan hover:bg-cyan-400 text-slate-950 shadow-sm font-semibold'
                                }`}
                                title="Add to queue"
                              >
                                <span>{isAdded ? '✓' : '+'}</span>
                                <span>{isAdded ? 'Added' : 'Queue'}</span>
                              </button>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-center py-10 text-slate-400 text-xs">
                        <p className="text-2xl mb-1.5">📂</p>
                        This playlist currently has no tracks.
                        <p className="text-[10px] text-slate-500 mt-1">
                          You can add songs from the "Search Songs" tab or your Playlists page!
                        </p>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="text-center py-12 text-slate-400 text-xs">
                  Select a playlist from the list to view and add tracks.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Modal Footer */}
        <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs text-slate-400 shrink-0">
          <span>
            Queue: <span className="text-white font-mono font-bold">{queue.length}</span> songs ready to stream
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white font-semibold transition cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddToQueueModal;
