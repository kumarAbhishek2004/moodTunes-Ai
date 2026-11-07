import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import axios from 'axios';
import { API_BASE_URL } from '../config/api';
import { playSong, setQueue } from '../store/audioSlice';
import { resolveMusicTheme } from '../utils/themeMap';
import { resolveKnownYouTubeId } from '../utils/songMap';

// Curated Starter Favorites for each of the 6 moods (Leaving slots 3, 4, 5 open for user personalization)
const DEFAULT_FAVORITES_BY_MOOD = {
  happy: [
    {
      id: 'fav-h-1',
      name: 'Kesariya',
      artist: 'Arijit Singh',
      youtube_id: 'BddP6PYo2gs',
      image: 'https://i.ytimg.com/vi/BddP6PYo2gs/hqdefault.jpg',
      duration: 268,
      mood_match: 'Happy',
    },
    {
      id: 'fav-h-2',
      name: 'Ilahi',
      artist: 'Arijit Singh',
      youtube_id: 'fdubeMFwuGs',
      image: 'https://i.ytimg.com/vi/fdubeMFwuGs/hqdefault.jpg',
      duration: 228,
      mood_match: 'Happy',
    },
  ],
  romantic: [
    {
      id: 'fav-r-1',
      name: 'Raataan Lambiyan',
      artist: 'Jubin Nautiyal',
      youtube_id: 'gvyUuxdRdR4',
      image: 'https://i.ytimg.com/vi/gvyUuxdRdR4/hqdefault.jpg',
      duration: 230,
      mood_match: 'Romantic',
    },
    {
      id: 'fav-r-2',
      name: 'Apna Bana Le',
      artist: 'Arijit Singh',
      youtube_id: 'ElZfdU54Cp8',
      image: 'https://i.ytimg.com/vi/ElZfdU54Cp8/hqdefault.jpg',
      duration: 261,
      mood_match: 'Romantic',
    },
  ],
  calm: [
    {
      id: 'fav-c-1',
      name: 'Kun Faya Kun',
      artist: 'A.R. Rahman',
      youtube_id: 'T94PHkuydcw',
      image: 'https://i.ytimg.com/vi/T94PHkuydcw/hqdefault.jpg',
      duration: 473,
      mood_match: 'Calm',
    },
    {
      id: 'fav-c-2',
      name: 'Iktara',
      artist: 'Kavita Seth',
      youtube_id: 'fSS_R91Nimw',
      image: 'https://i.ytimg.com/vi/fSS_R91Nimw/hqdefault.jpg',
      duration: 253,
      mood_match: 'Calm',
    },
  ],
  energetic: [
    {
      id: 'fav-e-1',
      name: 'Believer',
      artist: 'Imagine Dragons',
      youtube_id: '7wtfhZwyrcc',
      image: 'https://i.ytimg.com/vi/7wtfhZwyrcc/hqdefault.jpg',
      duration: 204,
      mood_match: 'Energetic',
    },
    {
      id: 'fav-e-2',
      name: 'Machayenge 3',
      artist: 'Emiway Bantai',
      youtube_id: 'Dlz_XHeUUcw',
      image: 'https://i.ytimg.com/vi/Dlz_XHeUUcw/hqdefault.jpg',
      duration: 185,
      mood_match: 'Energetic',
    },
  ],
  focus: [
    {
      id: 'fav-f-1',
      name: 'Kho Gaye Hum Kahan',
      artist: 'Jasleen Royal',
      youtube_id: 'vt4jX0iPU40',
      image: 'https://i.ytimg.com/vi/vt4jX0iPU40/hqdefault.jpg',
      duration: 214,
      mood_match: 'Focus',
    },
    {
      id: 'fav-f-2',
      name: 'Phir Se Udd Chala',
      artist: 'Mohit Chauhan',
      youtube_id: '2iqbx7Tzxbw',
      image: 'https://i.ytimg.com/vi/2iqbx7Tzxbw/hqdefault.jpg',
      duration: 271,
      mood_match: 'Focus',
    },
  ],
  sad: [
    {
      id: 'fav-s-1',
      name: 'Channa Mereya',
      artist: 'Arijit Singh',
      youtube_id: '284Ov7ysmfA',
      image: 'https://i.ytimg.com/vi/284Ov7ysmfA/hqdefault.jpg',
      duration: 289,
      mood_match: 'Sad',
    },
    {
      id: 'fav-s-2',
      name: 'Agar Tum Saath Ho',
      artist: 'Alka Yagnik & Arijit Singh',
      youtube_id: 'sK7riqg2mr4',
      image: 'https://i.ytimg.com/vi/sK7riqg2mr4/hqdefault.jpg',
      duration: 341,
      mood_match: 'Sad',
    },
  ],
};

// Automatic sanitizer: Replaces broken/stale stock microphone images with authentic album covers
const sanitizeFavoritesByMood = (data) => {
  if (!data || typeof data !== 'object') return DEFAULT_FAVORITES_BY_MOOD;
  const cleaned = {};
  for (const moodKey of Object.keys(DEFAULT_FAVORITES_BY_MOOD)) {
    const defaultList = DEFAULT_FAVORITES_BY_MOOD[moodKey] || [];
    const sourceList = Array.isArray(data[moodKey]) && data[moodKey].length > 0 ? data[moodKey] : defaultList;
    cleaned[moodKey] = sourceList.map((track, idx) => {
      const def = defaultList[idx] || {};
      const ytId = track.youtube_id || def.youtube_id;
      const isBadImage = !track.image || track.image.includes('1511671782779') || track.image.includes('mzstatic');
      const realImage = isBadImage
        ? (ytId ? `https://i.ytimg.com/vi/${ytId}/hqdefault.jpg` : (def.image || track.image))
        : track.image;
      return {
        ...track,
        youtube_id: ytId,
        image: realImage,
      };
    });
  }
  return cleaned;
};

export const MOOD_TABS = [
  { key: 'happy', label: 'Happy', emoji: '✨', color: '#F59E0B', badge: 'bg-amber-500/10 text-amber-300 border-amber-500/30' },
  { key: 'calm', label: 'Calm', emoji: '🌊', color: '#00F2FE', badge: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30' },
  { key: 'romantic', label: 'Romantic', emoji: '💖', color: '#EC4899', badge: 'bg-pink-500/10 text-pink-300 border-pink-500/30' },
  { key: 'energetic', label: 'Energetic', emoji: '⚡', color: '#F97316', badge: 'bg-orange-500/10 text-orange-300 border-orange-500/30' },
  { key: 'focus', label: 'Focus', emoji: '🧠', color: '#10B981', badge: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30' },
  { key: 'sad', label: 'Reflective', emoji: '🌧️', color: '#3B82F6', badge: 'bg-blue-500/10 text-blue-300 border-blue-500/30' },
];

const FavoriteTracksSection = () => {
  const dispatch = useDispatch();
  const { token, isAuthenticated } = useSelector((state) => state.auth);
  const currentSong = useSelector((state) => state.audio.currentSong);
  const isPlaying = useSelector((state) => state.audio.isPlaying);
  const activeMood = useSelector((state) => state.audio.activeMood) || 'happy';

  const theme = resolveMusicTheme(currentSong, activeMood);

  // Active mood tab for viewing/editing 5 tracks
  const [selectedMoodTab, setSelectedMoodTab] = useState(activeMood.toLowerCase());

  // Store 5 tracks per mood
  const [favoritesByMood, setFavoritesByMood] = useState(DEFAULT_FAVORITES_BY_MOOD);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);

  // Search state
  const [searchTitle, setSearchTitle] = useState('');
  const [searchArtist, setSearchArtist] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [onlyCurrentMoodFilter, setOnlyCurrentMoodFilter] = useState(false);

  // Conflict warning state when song mood differs from active tab
  const [pendingConflict, setPendingConflict] = useState(null);
  const [savingTrackId, setSavingTrackId] = useState(null);

  // Manual input state
  const [manualTitle, setManualTitle] = useState('');
  const [manualArtist, setManualArtist] = useState('');
  const [manualImage, setManualImage] = useState('');
  const [isFetchingArt, setIsFetchingArt] = useState(false);

  // Sync Status
  const [syncStatus, setSyncStatus] = useState('');

  // Auto-sync selectedMoodTab with activeMood when activeMood changes on dial/page
  useEffect(() => {
    if (activeMood) {
      setSelectedMoodTab(activeMood.toLowerCase());
    }
  }, [activeMood]);

  // Lock body scroll when modal is open
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

  // Load favorites by mood on mount
  useEffect(() => {
    loadAllFavorites();
  }, [token, isAuthenticated]);

  const loadAllFavorites = async () => {
    try {
      const authToken = token || localStorage.getItem('token');
      if (authToken) {
        const res = await axios.get(`${API_BASE_URL}/api/user/favorites`, {
          headers: { Authorization: `Bearer ${authToken}` },
        });
        if (res.data?.favorites_by_mood && Object.keys(res.data.favorites_by_mood).length > 0) {
          const sanitized = sanitizeFavoritesByMood({ ...DEFAULT_FAVORITES_BY_MOOD, ...res.data.favorites_by_mood });
          setFavoritesByMood(sanitized);
          localStorage.setItem('aura_favorites_by_mood_v3', JSON.stringify(sanitized));
          setSyncStatus('cloud');
          return;
        }
      }
    } catch (e) {
      console.warn('Could not fetch mood favorites from cloud, using local cache', e);
    }

    try {
      const stored = localStorage.getItem('aura_favorites_by_mood_v3');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && typeof parsed === 'object') {
          const sanitized = sanitizeFavoritesByMood({ ...DEFAULT_FAVORITES_BY_MOOD, ...parsed });
          setFavoritesByMood(sanitized);
          localStorage.setItem('aura_favorites_by_mood_v3', JSON.stringify(sanitized));
          setSyncStatus('local');
          return;
        }
      }
    } catch (e) {}

    const cleanDefault = sanitizeFavoritesByMood(DEFAULT_FAVORITES_BY_MOOD);
    setFavoritesByMood(cleanDefault);
    localStorage.setItem('aura_favorites_by_mood_v3', JSON.stringify(cleanDefault));
    setSyncStatus('local');
  };

  // Persist updated mood favorites to local cache and backend
  const persistMoodFavorites = async (moodKey, updatedList) => {
    const trimmed = updatedList.slice(0, 5);
    const updatedByMood = {
      ...favoritesByMood,
      [moodKey]: trimmed,
    };
    setFavoritesByMood(updatedByMood);

    try {
      localStorage.setItem('aura_favorites_by_mood_v3', JSON.stringify(updatedByMood));
    } catch (e) {}

    try {
      const authToken = token || localStorage.getItem('token');
      const headers = authToken ? { Authorization: `Bearer ${authToken}` } : {};
      const res = await axios.post(
        `${API_BASE_URL}/api/user/favorites`,
        { favorites: trimmed, mood: moodKey },
        { headers }
      );
      if (res.data?.saved_to_db) {
        setSyncStatus('cloud');
      } else {
        setSyncStatus('local');
      }
    } catch (e) {
      console.warn('Could not sync mood favorites to database', e);
      setSyncStatus('local');
    }
  };

  const currentFavorites = favoritesByMood[selectedMoodTab] || [];
  const currentTabMeta = MOOD_TABS.find((t) => t.key === selectedMoodTab) || MOOD_TABS[0];

  // Play a favorite track
  const handlePlayFavorite = (song) => {
    let playTarget = { ...song };
    const isRaataan = String(playTarget.name || '').toLowerCase().includes('raataan');
    if (!playTarget.youtube_id || (playTarget.youtube_id === 'gvyUuxdRdR4' && !isRaataan)) {
      const knownYt = resolveKnownYouTubeId(playTarget.name, playTarget.artist);
      if (knownYt) {
        playTarget.youtube_id = knownYt;
      }
    }
    dispatch(setQueue(currentFavorites));
    dispatch(playSong(playTarget));
  };

  // Remove track from current mood favorites
  const handleRemoveFavorite = (songId, e) => {
    e.stopPropagation();
    const nextList = currentFavorites.filter((s) => s.id !== songId);
    persistMoodFavorites(selectedMoodTab, nextList);
  };

  // Search tracks with artist and title
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
          params: { title: t, artist: a, limit: 12 },
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
        params: { title: t, artist: a, limit: 12 },
      });
      setSearchResults(res.data?.tracks || []);
    } catch (e) {
      console.warn('Search failed:', e);
    } finally {
      setIsSearching(false);
    }
  };

  // Execute saving a track to a specific mood target
  const executeSaveTrack = (track, targetMood) => {
    setSavingTrackId(track.id);
    const knownYt = resolveKnownYouTubeId(track.name, track.artist);
    const newTrack = {
      id: track.id || `custom-${Date.now()}`,
      name: track.name,
      artist: track.artist,
      image: track.image,
      duration: track.duration || 210,
      youtube_id: track.youtube_id || knownYt || null,
      mood_match: targetMood.charAt(0).toUpperCase() + targetMood.slice(1),
    };

    const targetList = favoritesByMood[targetMood] ? [...favoritesByMood[targetMood]] : [];
    let nextList = [...targetList];

    if (targetMood === selectedMoodTab && editingIndex !== null && editingIndex < nextList.length) {
      nextList[editingIndex] = newTrack;
    } else {
      if (nextList.length >= 5) {
        nextList[4] = newTrack; // replace last if full
      } else {
        nextList.push(newTrack);
      }
    }

    persistMoodFavorites(targetMood, nextList);
    setPendingConflict(null);

    setTimeout(() => {
      setSavingTrackId(null);
      closeModal();
    }, 400);
  };

  // User clicked a searched track
  const handleSelectSearchedTrack = (track) => {
    const trackMood = (track.detected_mood || track.mood_match || 'Calm').toLowerCase();
    const currentTab = selectedMoodTab.toLowerCase();

    // Check if song mood matches current mood tab
    if (trackMood === currentTab || !trackMood) {
      executeSaveTrack(track, currentTab);
    } else {
      // Prompt user with smart choice: Save to current mood anyway or save to detected mood
      setPendingConflict({
        track,
        detectedMood: track.detected_mood || track.mood_match || 'Calm',
        targetMood: currentTab,
      });
    }
  };

  // Find artwork for manual inputs
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

  // Save manual track
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
      mood_match: selectedMoodTab.charAt(0).toUpperCase() + selectedMoodTab.slice(1),
    };

    let nextList = [...currentFavorites];
    if (editingIndex !== null && editingIndex < nextList.length) {
      nextList[editingIndex] = newTrack;
    } else {
      nextList.push(newTrack);
    }

    persistMoodFavorites(selectedMoodTab, nextList);
    closeModal();
  };

  const openAddModal = () => {
    setEditingIndex(null);
    setSearchTitle('');
    setSearchArtist('');
    setSearchResults([]);
    setPendingConflict(null);
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
    setPendingConflict(null);
    setManualTitle(song.name);
    setManualArtist(song.artist);
    setManualImage(song.image || '');
    setSavingTrackId(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingIndex(null);
    setPendingConflict(null);
    setSavingTrackId(null);
  };

  // Filter search results if "Only current mood" toggle is on
  const displayedSearchResults = onlyCurrentMoodFilter
    ? searchResults.filter(
        (r) => (r.detected_mood || '').toLowerCase() === selectedMoodTab.toLowerCase()
      )
    : searchResults;

  return (
    <div className="space-y-4 pt-4 sm:pt-6">
      {/* Header with Mood Badges & Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="text-xl">⭐</span>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2 drop-shadow">
                <span>Top 5 Favorites by Mood</span>
              </h3>
              <span
                className="text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full border shadow-sm transition-all"
                style={{
                  color: currentTabMeta.color,
                  backgroundColor: `${currentTabMeta.color}18`,
                  borderColor: `${currentTabMeta.color}40`,
                }}
              >
                {currentTabMeta.emoji} {currentTabMeta.label} ({currentFavorites.length}/5)
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Each emotion has its own dedicated 5 tracks, automatically filtered and stored on your account database.
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
          {currentFavorites.length < 5 && (
            <button
              onClick={openAddModal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-obsidian-950 text-xs font-bold shadow-md hover:scale-105 active:scale-95 transition-all cursor-pointer"
              style={{
                backgroundColor: currentTabMeta.color,
                boxShadow: `0 4px 15px ${currentTabMeta.color}66`,
              }}
            >
              <span>+</span>
              <span>Add to {currentTabMeta.label}</span>
            </button>
          )}
        </div>
      </div>

      {/* Mood Tab Bar: Switch between the 6 moods' 5 favorites */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
        {MOOD_TABS.map((tab) => {
          const isSelected = selectedMoodTab === tab.key;
          const count = (favoritesByMood[tab.key] || []).length;
          return (
            <button
              key={tab.key}
              onClick={() => setSelectedMoodTab(tab.key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer whitespace-nowrap border ${
                isSelected
                  ? 'text-white shadow-md'
                  : 'bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white border-white/10'
              }`}
              style={
                isSelected
                  ? {
                      backgroundColor: `${tab.color}25`,
                      borderColor: `${tab.color}80`,
                      boxShadow: `0 0 15px -3px ${tab.color}50`,
                      color: tab.color,
                    }
                  : undefined
              }
            >
              <span>{tab.emoji}</span>
              <span>{tab.label}</span>
              <span
                className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                  isSelected ? 'bg-white/20 text-white' : 'bg-white/5 text-slate-400'
                }`}
              >
                {count}/5
              </span>
            </button>
          );
        })}
      </div>

      {/* Grid of up to 5 Slots for the active mood */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {currentFavorites.map((song, idx) => {
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
                isSongPlaying ? 'shadow-lg' : 'border-white/10'
              }`}
              style={
                isSongPlaying
                  ? {
                      borderColor: currentTabMeta.color,
                      boxShadow: `0 0 25px ${currentTabMeta.color}44`,
                    }
                  : undefined
              }
            >
              {/* Slot Badge & Controls Overlay */}
              <div className="flex items-center justify-between mb-2.5">
                <div className="flex items-center gap-1">
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-white/10 text-slate-300">
                    #{idx + 1}
                  </span>
                  <span
                    className="text-[9px] font-mono px-1.5 py-0.5 rounded-md border uppercase"
                    style={{
                      color: currentTabMeta.color,
                      borderColor: `${currentTabMeta.color}40`,
                      backgroundColor: `${currentTabMeta.color}15`,
                    }}
                  >
                    {currentTabMeta.label}
                  </span>
                </div>

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
                  src={
                    song.image && !song.image.includes('1511671782779')
                      ? song.image
                      : (song.youtube_id
                          ? `https://i.ytimg.com/vi/${song.youtube_id}/hqdefault.jpg`
                          : `https://ui-avatars.com/api/?name=${encodeURIComponent(song.name || 'Song')}&background=0f172a&color=38bdf8&size=500&font-size=0.35&bold=true`)
                  }
                  alt={song.name}
                  className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-500"
                  onError={(e) => {
                    if (song.youtube_id && !e.target.src.includes('ytimg.com')) {
                      e.target.src = `https://i.ytimg.com/vi/${song.youtube_id}/hqdefault.jpg`;
                    } else {
                      e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(song.name || 'Song')}&background=0f172a&color=38bdf8&size=500&font-size=0.35&bold=true`;
                    }
                  }}
                />

                {/* Play overlay */}
                <div
                  className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity ${
                    isSongPlaying ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                  }`}
                >
                  <div
                    className="w-10 h-10 rounded-full text-obsidian-950 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform font-bold"
                    style={{
                      backgroundColor: currentTabMeta.color,
                      boxShadow: `0 0 15px ${currentTabMeta.color}88`,
                    }}
                  >
                    {isSongPlaying ? (
                      <div className="flex items-end gap-0.5 h-3.5">
                        <span className="w-1 bg-obsidian-950 rounded-full animate-bounce [animation-delay:-0.3s]" />
                        <span className="w-1 bg-obsidian-950 rounded-full animate-bounce [animation-delay:-0.15s]" />
                        <span className="w-1 bg-obsidian-950 rounded-full animate-bounce" />
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
                  style={{ color: isSongPlaying ? currentTabMeta.color : undefined }}
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
        {Array.from({ length: Math.max(0, 5 - currentFavorites.length) }).map((_, i) => (
          <div
            key={`empty-slot-${i}`}
            onClick={openAddModal}
            className="flex flex-col items-center justify-center aspect-square rounded-2xl border-2 border-dashed border-white/15 hover:border-purple-500/50 bg-slate-900/30 hover:bg-slate-900/50 text-slate-400 hover:text-white transition-all cursor-pointer p-4 text-center group"
          >
            <div
              className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center mb-2 transition-colors"
              style={{ color: currentTabMeta.color }}
            >
              <span className="text-xl">+</span>
            </div>
            <span className="text-xs font-semibold">Slot #{currentFavorites.length + i + 1}</span>
            <span className="text-[10px] text-slate-400 mt-0.5">Add {currentTabMeta.label} Track</span>
          </div>
        ))}
      </div>

      {/* Add / Customize Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-[70] bg-black/85 backdrop-blur-2xl flex items-center justify-center p-3 sm:p-5 pb-28 sm:pb-28 overscroll-contain animate-fadeIn"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeModal();
          }}
        >
          <div
            className="relative w-full max-w-xl max-h-[78vh] sm:max-h-[82vh] flex flex-col rounded-3xl bg-obsidian-900 border border-white/15 p-5 sm:p-6 shadow-2xl overscroll-contain overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-3 flex-shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-base">{currentTabMeta.emoji}</span>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                  {editingIndex !== null
                    ? `Customize ${currentTabMeta.label} Favorite #${editingIndex + 1}`
                    : `Add Favorite to ${currentTabMeta.label} (Up to 5)`}
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
              {/* Conflict / Mood Guidance Banner */}
              {pendingConflict && (
                <div className="p-4 rounded-2xl bg-amber-500/15 border border-amber-500/35 space-y-3 animate-fadeIn">
                  <div className="flex items-start gap-2.5">
                    <span className="text-lg">💡</span>
                    <div>
                      <h4 className="text-xs font-bold text-amber-200">
                        Mood Match Notice: "{pendingConflict.track.name}"
                      </h4>
                      <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                        This track is classified as{' '}
                        <strong className="text-amber-300 uppercase">
                          {pendingConflict.detectedMood}
                        </strong>
                        , but you are currently adding to your{' '}
                        <strong className="text-cyan-300 uppercase">
                          {pendingConflict.targetMood}
                        </strong>{' '}
                        playlist.
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-amber-500/20">
                    <button
                      type="button"
                      onClick={() =>
                        executeSaveTrack(pendingConflict.track, pendingConflict.targetMood)
                      }
                      className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold border border-white/20 transition-all cursor-pointer"
                    >
                      Save to {pendingConflict.targetMood} anyway
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        executeSaveTrack(
                          pendingConflict.track,
                          pendingConflict.detectedMood.toLowerCase()
                        )
                      }
                      className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-xs font-bold shadow-md hover:scale-102 transition-all cursor-pointer"
                    >
                      Save to {pendingConflict.detectedMood} Favorites →
                    </button>
                    <button
                      type="button"
                      onClick={() => setPendingConflict(null)}
                      className="px-2.5 py-1.5 rounded-xl text-slate-400 hover:text-white text-xs transition-colors ml-auto"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Dual Filter: Song Title + Singer / Artist */}
              <div className="space-y-2.5 p-3.5 rounded-2xl bg-white/[0.03] border border-white/10">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-white flex items-center gap-1.5">
                    <span>🔍</span>
                    <span>Search Song & Singer</span>
                  </label>
                  <span className="text-[10px] text-purple-400 font-mono">
                    Instant Mood Auto-Detect
                  </span>
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
                      placeholder="e.g. Kun Faya Kun, Boom, Kesariya..."
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
                      placeholder="e.g. A.R. Rahman, Arijit Singh..."
                      className="w-full px-3.5 py-2.5 rounded-xl bg-obsidian-950 border border-white/15 text-white text-xs focus:outline-none focus:border-purple-500 placeholder-slate-500"
                    />
                  </div>
                </div>

                {/* Filter Switch: All vs Current Mood */}
                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setOnlyCurrentMoodFilter(false)}
                      className={`text-[10.5px] px-2.5 py-1 rounded-full border transition-all cursor-pointer ${
                        !onlyCurrentMoodFilter
                          ? 'bg-purple-600/30 text-purple-200 border-purple-400/40 font-bold'
                          : 'bg-white/5 text-slate-400 border-white/10 hover:text-white'
                      }`}
                    >
                      All Results
                    </button>
                    <button
                      type="button"
                      onClick={() => setOnlyCurrentMoodFilter(true)}
                      className={`text-[10.5px] px-2.5 py-1 rounded-full border transition-all cursor-pointer flex items-center gap-1 ${
                        onlyCurrentMoodFilter
                          ? 'bg-cyan/20 text-cyan border-cyan/40 font-bold shadow-sm'
                          : 'bg-white/5 text-slate-400 border-white/10 hover:text-white'
                      }`}
                    >
                      <span>🎯 Filter:</span>
                      <span>Only {currentTabMeta.label} Songs</span>
                    </button>
                  </div>

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
                        <span>🔍 Search</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Search Results */}
                {displayedSearchResults.length > 0 && (
                  <div className="max-h-60 overflow-y-auto overscroll-contain space-y-2 custom-scrollbar bg-obsidian-950/95 rounded-xl p-2 border border-white/10 mt-2">
                    {displayedSearchResults.map((item) => {
                      const detected = item.detected_mood || item.mood_match || 'Calm';
                      const isMatch = detected.toLowerCase() === selectedMoodTab.toLowerCase();
                      return (
                        <div
                          key={item.id}
                          className="flex items-center justify-between p-2 rounded-xl bg-white/[0.02] hover:bg-white/[0.06] border border-transparent hover:border-white/10 transition-all gap-2"
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
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span
                                  className={`text-[9px] font-mono px-1.5 py-0.2 rounded-full border uppercase ${
                                    isMatch
                                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                      : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                                  }`}
                                >
                                  {isMatch ? `✓ ${detected} Match` : `Belongs to ${detected}`}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Save Button */}
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
                                <span>+</span>
                                <span>Select</span>
                              </>
                            )}
                          </button>
                        </div>
                      );
                    })}
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
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                    Song Title *
                  </label>
                  <input
                    type="text"
                    value={manualTitle}
                    onChange={(e) => setManualTitle(e.target.value)}
                    placeholder="Song Title"
                    className="w-full px-3.5 py-2 rounded-xl bg-obsidian-950 border border-white/10 text-white text-xs focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                    Artist Name
                  </label>
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
                    <label className="text-[11px] font-semibold text-slate-400">
                      Artwork Image URL
                    </label>
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
                    <img
                      src={manualImage}
                      alt="Preview"
                      className="w-10 h-10 rounded-lg object-cover"
                    />
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
                Save to {currentTabMeta.label}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FavoriteTracksSection;
