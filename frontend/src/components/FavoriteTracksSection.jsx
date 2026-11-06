import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import axios from 'axios';
import { API_BASE_URL } from '../config/api';
import { playSong, setQueue } from '../store/audioSlice';
import { resolveMusicTheme } from '../utils/themeMap';
import { resolveKnownYouTubeId } from '../utils/songMap';

const DEFAULT_FAVORITES = [
  {
    id: 'fav-1',
    name: 'Kesariya',
    artist: 'Arijit Singh',
    youtube_id: 'BddP6PYo2gs',
    image: 'https://is1-ssl.mzstatic.com/image/thumb/Music112/v4/9f/13/ca/9f13ca3b-e533-03e0-f19a-f0aaa774581d/196589311191.jpg/600x600bb.jpg',
    duration: 268,
    mood_match: 'Happy',
  },
  {
    id: 'fav-2',
    name: 'Raataan Lambiyan',
    artist: 'Jubin Nautiyal',
    youtube_id: 'gvyUuxdRdR4',
    image: 'https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/61/65/ae/6165aee9-8bb9-0bd4-02b0-5d0f1e6257a3/886449510238.jpg/600x600bb.jpg',
    duration: 230,
    mood_match: 'Romantic',
  },
  {
    id: 'fav-3',
    name: 'Apna Bana Le',
    artist: 'Arijit Singh',
    youtube_id: 'ElZfdU54Cp8',
    image: 'https://is1-ssl.mzstatic.com/image/thumb/Music122/v4/21/cf/34/21cf34f4-cb28-863a-bbdb-8ef839250b7d/8902894362177_cover.jpg/600x600bb.jpg',
    duration: 261,
    mood_match: 'Romantic',
  },
];

const FavoriteTracksSection = () => {
  const dispatch = useDispatch();
  const { token, isAuthenticated } = useSelector((state) => state.auth);
  const currentSong = useSelector((state) => state.audio.currentSong);
  const isPlaying = useSelector((state) => state.audio.isPlaying);
  const activeMood = useSelector((state) => state.audio.activeMood) || 'happy';

  // Strict guideline: colors adapt to song's mood and genre
  const theme = resolveMusicTheme(currentSong, activeMood);

  const [favorites, setFavorites] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null); // null = adding, number = editing

  // Dual search state: Song Title + Singer / Artist
  const [searchTitle, setSearchTitle] = useState('');
  const [searchArtist, setSearchArtist] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [savingTrackId, setSavingTrackId] = useState(null);

  // Manual input state
  const [manualTitle, setManualTitle] = useState('');
  const [manualArtist, setManualArtist] = useState('');
  const [manualImage, setManualImage] = useState('');
  const [isFetchingArt, setIsFetchingArt] = useState(false);

  // Status feedback
  const [syncStatus, setSyncStatus] = useState('');

  // Lock body scroll when modal is open to completely prevent whole website scrolling/reloading
  useEffect(() => {
    if (isModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isModalOpen]);

  // 1. Load favorites on mount / auth change
  useEffect(() => {
    loadFavorites();
  }, [token, isAuthenticated]);

  const loadFavorites = async () => {
    try {
      const authToken = token || localStorage.getItem('token');
      if (authToken) {
        const res = await axios.get(`${API_BASE_URL}/api/user/favorites`, {
          headers: { Authorization: `Bearer ${authToken}` },
        });
        if (res.data?.favorites && Array.isArray(res.data.favorites) && res.data.favorites.length > 0) {
          setFavorites(res.data.favorites.slice(0, 5));
          localStorage.setItem('my_favorite_tracks', JSON.stringify(res.data.favorites.slice(0, 5)));
          setSyncStatus('cloud');
          return;
        }
      }
    } catch (e) {
      console.warn('Could not fetch favorites from database, falling back to local cache', e);
    }

    // Fallback to localStorage or defaults
    try {
      const stored = localStorage.getItem('my_favorite_tracks');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setFavorites(parsed.slice(0, 5));
          setSyncStatus('local');
          return;
        }
      }
    } catch (e) {}

    // Initial default state
    setFavorites(DEFAULT_FAVORITES);
    setSyncStatus('local');
    try {
      localStorage.setItem('my_favorite_tracks', JSON.stringify(DEFAULT_FAVORITES));
    } catch (e) {}
  };

  // 2. Persist favorites to Database & LocalStorage
  const persistFavorites = async (updatedList) => {
    const trimmed = updatedList.slice(0, 5);
    setFavorites(trimmed);
    try {
      localStorage.setItem('my_favorite_tracks', JSON.stringify(trimmed));
    } catch (e) {}

    try {
      const authToken = token || localStorage.getItem('token');
      const headers = authToken ? { Authorization: `Bearer ${authToken}` } : {};
      const res = await axios.post(
        `${API_BASE_URL}/api/user/favorites`,
        { favorites: trimmed },
        { headers }
      );
      if (res.data?.saved_to_db) {
        setSyncStatus('cloud');
      } else {
        setSyncStatus('local');
      }
    } catch (e) {
      console.warn('Could not sync favorites to database', e);
      setSyncStatus('local');
    }
  };

  // 3. Play a favorite track
  const handlePlayFavorite = (song) => {
    let playTarget = { ...song };
    const isRaataan = String(playTarget.name || '').toLowerCase().includes('raataan');
    if (!playTarget.youtube_id || (playTarget.youtube_id === 'gvyUuxdRdR4' && !isRaataan)) {
      const knownYt = resolveKnownYouTubeId(playTarget.name, playTarget.artist);
      if (knownYt) {
        playTarget.youtube_id = knownYt;
      }
    }
    dispatch(setQueue(favorites));
    dispatch(playSong(playTarget));
  };

  // 4. Remove a favorite track
  const handleRemoveFavorite = (songId, e) => {
    e.stopPropagation();
    const nextList = favorites.filter((s) => s.id !== songId);
    persistFavorites(nextList);
  };

  // 5. Debounced Dual Search for Song Title + Singer / Artist
  useEffect(() => {
    const t = searchTitle.trim();
    const a = searchArtist.trim();
    if (!t && !a) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await axios.get(`${API_BASE_URL}/api/search-tracks`, {
          params: { title: t, artist: a, limit: 8 },
        });
        setSearchResults(res.data?.tracks || []);
      } catch (e) {
        console.warn('Search failed:', e);
      } finally {
        setIsSearching(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [searchTitle, searchArtist]);

  const handleManualSearchTrigger = async () => {
    const t = searchTitle.trim();
    const a = searchArtist.trim();
    if (!t && !a) return;
    setIsSearching(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/api/search-tracks`, {
        params: { title: t, artist: a, limit: 8 },
      });
      setSearchResults(res.data?.tracks || []);
    } catch (e) {
      console.warn('Search failed:', e);
    } finally {
      setIsSearching(false);
    }
  };

  // 6. Select a searched track and save to favorites with visual feedback
  const handleSelectSearchedTrack = (track) => {
    setSavingTrackId(track.id);
    const knownYt = resolveKnownYouTubeId(track.name, track.artist);
    const newTrack = {
      id: track.id || `custom-${Date.now()}`,
      name: track.name,
      artist: track.artist,
      image: track.image,
      duration: track.duration || 210,
      youtube_id: track.youtube_id || knownYt || null,
      mood_match: 'Favorite',
    };

    let nextList = [...favorites];
    if (editingIndex !== null && editingIndex < nextList.length) {
      nextList[editingIndex] = newTrack;
    } else {
      nextList.push(newTrack);
    }

    persistFavorites(nextList);
    setTimeout(() => {
      setSavingTrackId(null);
      closeModal();
    }, 450);
  };

  // 7. Manually fetch artwork for manual inputs
  const handleFindArtwork = async () => {
    if (!manualTitle) return;
    setIsFetchingArt(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/api/track-artwork`, {
        params: { name: manualTitle, artist: manualArtist },
      });
      if (res.data?.image) {
        setManualImage(res.data.image);
      }
    } catch (e) {
      console.warn('Artwork lookup failed:', e);
    } finally {
      setIsFetchingArt(false);
    }
  };

  // 8. Submit manual track
  const handleSaveManualTrack = () => {
    if (!manualTitle.trim()) return;

    const knownYt = resolveKnownYouTubeId(manualTitle, manualArtist);
    const newTrack = {
      id: `manual-${Date.now()}`,
      name: manualTitle.trim(),
      artist: manualArtist.trim() || 'Unknown Artist',
      image:
        manualImage.trim() ||
        'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&auto=format&fit=crop&q=80',
      duration: 210,
      youtube_id: knownYt || null,
      mood_match: 'Favorite',
    };

    let nextList = [...favorites];
    if (editingIndex !== null && editingIndex < nextList.length) {
      nextList[editingIndex] = newTrack;
    } else {
      nextList.push(newTrack);
    }

    persistFavorites(nextList);
    closeModal();
  };

  const openAddModal = () => {
    setEditingIndex(null);
    setSearchTitle('');
    setSearchArtist('');
    setSearchResults([]);
    setManualTitle('');
    setManualArtist('');
    setManualImage('');
    setSavingTrackId(null);
    setIsModalOpen(true);
  };

  const openEditModal = (idx, song, e) => {
    e.stopPropagation();
    setEditingIndex(idx);
    setSearchTitle(song.name);
    setSearchArtist(song.artist);
    setSearchResults([]);
    setManualTitle(song.name);
    setManualArtist(song.artist);
    setManualImage(song.image || '');
    setSavingTrackId(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingIndex(null);
    setSavingTrackId(null);
  };

  return (
    <div className="space-y-4 pt-4 sm:pt-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="text-xl">⭐</span>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2 drop-shadow">
              <span>My Top 5 Favorite Tracks</span>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-amber-400/15 text-amber-300 border border-amber-400/30">
                {favorites.length} / 5 Slots
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Personalized playlist stored on your account database with Spotify/Apple Music HD artwork.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Cloud Database Sync Status Pill */}
          {syncStatus === 'cloud' ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[11px] font-mono font-medium shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Database Synced</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cyan/10 border border-cyan/25 text-cyan text-[11px] font-mono font-medium">
              <span>💾 Local Storage</span>
            </span>
          )}

          {/* Add Track Button */}
          {favorites.length < 5 && (
            <button
              onClick={openAddModal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-white text-xs font-bold shadow-md hover:scale-105 active:scale-95 transition-all"
              style={{
                backgroundColor: theme.accent,
                boxShadow: `0 4px 15px ${theme.glow}`,
              }}
            >
              <span>+</span>
              <span>Add Track</span>
            </button>
          )}
        </div>
      </div>

      {/* Grid of up to 5 Slots */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {favorites.map((song, idx) => {
          const isCurrent =
            currentSong &&
            (currentSong.id === song.id ||
              (currentSong.name === song.name && currentSong.artist === song.artist));
          const isSongPlaying = isCurrent && isPlaying;

          return (
            <div
              key={song.id || `${song.name}-${idx}`}
              onClick={() => handlePlayFavorite(song)}
              className={`group relative flex flex-col justify-between p-3 rounded-2xl bg-slate-900/60 hover:bg-slate-900/80 border transition-all duration-300 cursor-pointer overflow-hidden backdrop-blur-xl shadow-lg hover:shadow-2xl ${
                isSongPlaying
                  ? 'shadow-lg'
                  : 'border-white/10'
              }`}
              style={
                isSongPlaying
                  ? {
                      borderColor: theme.accent,
                      boxShadow: `0 0 25px ${theme.glow}`,
                    }
                  : undefined
              }
            >
              {/* Slot Badge & Controls Overlay */}
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-white/10 text-slate-300">
                  #{idx + 1}
                </span>

                <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                  {/* Edit button */}
                  <button
                    onClick={(e) => openEditModal(idx, song, e)}
                    className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                    title="Customize this track"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </button>

                  {/* Remove button */}
                  <button
                    onClick={(e) => handleRemoveFavorite(song.id, e)}
                    className="p-1 rounded-md text-slate-400 hover:text-rose-400 hover:bg-white/10 transition-colors"
                    title="Remove from favorites"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Artwork Container */}
              <div className="relative w-full aspect-square rounded-xl overflow-hidden bg-obsidian-950 mb-2.5 shadow-inner">
                <img
                  src={song.image || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&auto=format&fit=crop&q=80'}
                  alt={song.name}
                  className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-500"
                  onError={(e) => {
                    e.target.src = 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&auto=format&fit=crop&q=80';
                  }}
                />

                {/* Play overlay */}
                <div className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity ${
                  isSongPlaying ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                }`}>
                  <div
                    className="w-10 h-10 rounded-full text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform"
                    style={{
                      backgroundColor: theme.accent,
                      boxShadow: `0 0 15px ${theme.glow}`,
                    }}
                  >
                    {isSongPlaying ? (
                      <div className="flex items-end gap-0.5 h-3.5">
                        <span className="w-1 bg-white rounded-full animate-bounce [animation-delay:-0.3s]" />
                        <span className="w-1 bg-white rounded-full animate-bounce [animation-delay:-0.15s]" />
                        <span className="w-1 bg-white rounded-full animate-bounce" />
                      </div>
                    ) : (
                      <svg className="w-4 h-4 fill-current ml-0.5" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    )}
                  </div>
                </div>
              </div>

              {/* Title & Artist */}
              <div className="min-w-0">
                <h4
                  className="text-xs sm:text-sm font-bold text-white truncate transition-colors"
                  style={{ color: isSongPlaying ? theme.accent : undefined }}
                >
                  {song.name}
                </h4>
                <p className="text-[11px] text-slate-400 truncate mt-0.5">
                  {song.artist}
                </p>
              </div>
            </div>
          );
        })}

        {/* Empty Slots up to 5 */}
        {Array.from({ length: Math.max(0, 5 - favorites.length) }).map((_, i) => (
          <div
            key={`empty-slot-${i}`}
            onClick={openAddModal}
            className="flex flex-col items-center justify-center aspect-square rounded-2xl border-2 border-dashed border-white/15 hover:border-purple-500/50 bg-slate-900/30 hover:bg-slate-900/50 text-slate-400 hover:text-white transition-all cursor-pointer p-4 text-center group"
          >
            <div className="w-10 h-10 rounded-full bg-white/5 group-hover:bg-purple-500/20 text-slate-300 group-hover:text-purple-300 flex items-center justify-center mb-2 transition-colors">
              <span className="text-xl">+</span>
            </div>
            <span className="text-xs font-semibold">Slot #{favorites.length + i + 1}</span>
            <span className="text-[10px] text-slate-400 mt-0.5">Add Favorite</span>
          </div>
        ))}
      </div>

      {/* Add / Customize Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-2xl flex items-center justify-center p-3 sm:p-5 overscroll-contain animate-fadeIn"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeModal();
          }}
        >
          <div
            className="relative w-full max-w-xl max-h-[88vh] flex flex-col rounded-3xl bg-obsidian-900 border border-white/15 p-5 sm:p-6 shadow-2xl overscroll-contain overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-3 flex-shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-base">🎵</span>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                  {editingIndex !== null ? `Customize Favorite #${editingIndex + 1}` : 'Add Favorite Track (Up to 5)'}
                </h3>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="text-slate-400 hover:text-white text-xs px-2.5 py-1 rounded-lg hover:bg-white/10 transition-colors"
              >
                ✕ Close
              </button>
            </div>

            {/* Scrollable Modal Content */}
            <div className="overflow-y-auto overscroll-contain custom-scrollbar flex-1 pr-1 space-y-4">
              {/* Dual Filter: Song Title + Singer / Artist */}
              <div className="space-y-2.5 p-3.5 rounded-2xl bg-white/[0.03] border border-white/10">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-white flex items-center gap-1.5">
                    <span>🔍</span>
                    <span>Search Song & Singer Filter</span>
                  </label>
                  <span className="text-[10px] text-purple-400 font-mono">Instant Spotify & Apple HD</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                      Song Title <span className="text-purple-400 font-normal">*</span>
                    </label>
                    <input
                      type="text"
                      value={searchTitle}
                      onChange={(e) => setSearchTitle(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleManualSearchTrigger()}
                      placeholder="e.g. Boom, Love Dose, Kesariya..."
                      className="w-full px-3.5 py-2.5 rounded-xl bg-obsidian-950 border border-white/15 text-white text-xs focus:outline-none focus:border-purple-500 placeholder-slate-500"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                      Singer / Artist <span className="text-slate-500 font-normal">(filter)</span>
                    </label>
                    <input
                      type="text"
                      value={searchArtist}
                      onChange={(e) => setSearchArtist(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleManualSearchTrigger()}
                      placeholder="e.g. Apache Indian, Honey Singh..."
                      className="w-full px-3.5 py-2.5 rounded-xl bg-obsidian-950 border border-white/15 text-white text-xs focus:outline-none focus:border-purple-500 placeholder-slate-500"
                    />
                  </div>
                </div>

                {/* Search Action / Status */}
                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-slate-400">
                    {isSearching
                      ? 'Searching tracks...'
                      : searchResults.length > 0
                      ? `Found ${searchResults.length} matching tracks`
                      : 'Type song title or singer to find exact track'}
                  </span>
                  <button
                    type="button"
                    onClick={handleManualSearchTrigger}
                    disabled={isSearching || (!searchTitle.trim() && !searchArtist.trim())}
                    className="px-3.5 py-1.5 rounded-xl bg-purple-600/30 hover:bg-purple-600/50 text-purple-200 border border-purple-500/40 text-xs font-semibold flex items-center gap-1.5 disabled:opacity-40 transition-all cursor-pointer"
                  >
                    {isSearching ? (
                      <>
                        <span className="w-3 h-3 border-2 border-purple-300 border-t-transparent rounded-full animate-spin" />
                        <span>Searching...</span>
                      </>
                    ) : (
                      <>
                        <span>🔍</span>
                        <span>Search Songs</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Search Results with Prominent Save Button */}
                {searchResults.length > 0 && (
                  <div className="max-h-56 overflow-y-auto overscroll-contain space-y-2 custom-scrollbar bg-obsidian-950/95 rounded-xl p-2 border border-white/10 mt-2">
                    {searchResults.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-2 rounded-xl bg-white/[0.02] hover:bg-purple-600/15 border border-transparent hover:border-purple-500/30 transition-all gap-2"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-10 h-10 rounded-lg object-cover bg-obsidian-800 flex-shrink-0 shadow"
                          />
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-white truncate">{item.name}</p>
                            <p className="text-[11px] text-slate-400 truncate">{item.artist}</p>
                          </div>
                        </div>

                        {/* Prominent Save Button */}
                        <button
                          type="button"
                          onClick={() => handleSelectSearchedTrack(item)}
                          disabled={savingTrackId === item.id}
                          className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold shadow-md hover:shadow-purple-500/25 transition-all flex items-center gap-1.5 flex-shrink-0 hover:scale-103 active:scale-97 disabled:opacity-70 cursor-pointer"
                        >
                          {savingTrackId === item.id ? (
                            <>
                              <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              <span>Saving...</span>
                            </>
                          ) : (
                            <>
                              <span>💾</span>
                              <span>Save to Top 5</span>
                            </>
                          )}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Divider */}
              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-white/10"></div>
                <span className="flex-shrink mx-3 text-[10px] uppercase font-mono text-slate-500">
                  or enter custom details
                </span>
                <div className="flex-grow border-t border-white/10"></div>
              </div>

              {/* Manual Form */}
              <div className="space-y-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">Song Title *</label>
                  <input
                    type="text"
                    value={manualTitle}
                    onChange={(e) => setManualTitle(e.target.value)}
                    placeholder="Song Title"
                    className="w-full px-3.5 py-2 rounded-xl bg-obsidian-950 border border-white/10 text-white text-xs focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">Artist Name</label>
                  <input
                    type="text"
                    value={manualArtist}
                    onChange={(e) => setManualArtist(e.target.value)}
                    placeholder="Artist"
                    className="w-full px-3.5 py-2 rounded-xl bg-obsidian-950 border border-white/10 text-white text-xs focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-semibold text-slate-400">Artwork Image URL</label>
                    <button
                      type="button"
                      onClick={handleFindArtwork}
                      disabled={!manualTitle || isFetchingArt}
                      className="text-[10px] text-cyan hover:underline disabled:opacity-50 font-mono cursor-pointer"
                    >
                      {isFetchingArt ? 'Searching...' : '🔍 Auto-Find Artwork'}
                    </button>
                  </div>
                  <input
                    type="text"
                    value={manualImage}
                    onChange={(e) => setManualImage(e.target.value)}
                    placeholder="https://..."
                    className="w-full px-3.5 py-2 rounded-xl bg-obsidian-950 border border-white/10 text-white text-xs focus:outline-none focus:border-purple-500 font-mono text-[11px]"
                  />
                </div>

                {manualImage && (
                  <div className="flex items-center gap-3 p-2 rounded-xl bg-obsidian-950 border border-white/10">
                    <img src={manualImage} alt="Preview" className="w-10 h-10 rounded-lg object-cover" />
                    <span className="text-[11px] text-slate-300 font-mono">Artwork preview loaded</span>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Bottom Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-white/10 flex-shrink-0">
              <button
                type="button"
                onClick={closeModal}
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveManualTrack}
                disabled={!manualTitle.trim()}
                className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-xs font-bold shadow-md transition-all hover:scale-102 cursor-pointer"
              >
                Save Track to Database
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FavoriteTracksSection;
