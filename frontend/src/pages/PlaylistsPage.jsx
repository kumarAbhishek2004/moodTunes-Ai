import { useState, useEffect, useMemo, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../config/api';
import { logout } from '../store/authSlice';
import { playSong, setQueue, setPlaying, setActiveMood, addToPlayNext, addToQueue, moveQueueItem, openQueue, shuffleUpcomingQueue } from '../store/audioSlice';
import CreatePlaylistModal from '../components/CreatePlaylistModal';
import ImportPlaylistModal from '../components/ImportPlaylistModal';
import { getUserPlaylistSongs, saveUserPlaylistSongs, getUserCustomPlaylists, saveUserCustomPlaylists } from '../utils/userStorage';
import { resolveTrackArtwork, handleArtworkError } from '../utils/imageHelper';
import { cleanSongTitle } from '../utils/textHelper';

// ============================================================================
// MOOD THEMES & DYNAMIC COLOR GRADING CONFIG
// ============================================================================
export const PLAYLIST_MOOD_CONFIG = {
  all: {
    key: 'all',
    name: 'All Playlists',
    emoji: '🥞',
    accent: '#00F2FE',
    accentRgb: '0, 242, 254',
    bgGrad: 'from-cyan-950/25 via-slate-950/80 to-slate-950',
    heroGrad: 'from-cyan-900/30 via-slate-900/80 to-slate-950/90',
    pillActive: 'bg-cyan-400 text-slate-950 font-bold shadow-lg shadow-cyan-400/30',
  },
  calm: {
    key: 'calm',
    name: 'Calm',
    emoji: '🍃',
    accent: '#00F2FE',
    accentRgb: '0, 242, 254',
    bgGrad: 'from-cyan-950/35 via-[#061720] to-slate-950',
    heroGrad: 'from-cyan-900/30 via-slate-900/85 to-slate-950/95',
    pillActive: 'bg-cyan-400 text-slate-950 font-bold shadow-lg shadow-cyan-400/30',
  },
  happy: {
    key: 'happy',
    name: 'Happy',
    emoji: '😊',
    accent: '#F59E0B',
    accentRgb: '245, 158, 11',
    bgGrad: 'from-amber-950/30 via-[#1c1208] to-slate-950',
    heroGrad: 'from-amber-900/35 via-slate-900/85 to-slate-950/95',
    pillActive: 'bg-amber-500 text-slate-950 font-bold shadow-lg shadow-amber-500/30',
  },
  energetic: {
    key: 'energetic',
    name: 'Energetic',
    emoji: '⚡',
    accent: '#F97316',
    accentRgb: '249, 115, 22',
    bgGrad: 'from-orange-950/35 via-[#200e07] to-slate-950',
    heroGrad: 'from-orange-900/35 via-slate-900/85 to-slate-950/95',
    pillActive: 'bg-orange-500 text-slate-950 font-bold shadow-lg shadow-orange-500/30',
  },
  sad: {
    key: 'sad',
    name: 'Sad',
    emoji: '🌙',
    accent: '#3B82F6',
    accentRgb: '59, 130, 246',
    bgGrad: 'from-blue-950/35 via-[#081128] to-slate-950',
    heroGrad: 'from-blue-900/35 via-slate-900/85 to-slate-950/95',
    pillActive: 'bg-blue-500 text-white font-bold shadow-lg shadow-blue-500/30',
  },
  focus: {
    key: 'focus',
    name: 'Focus',
    emoji: '🎯',
    accent: '#10B981',
    accentRgb: '16, 185, 129',
    bgGrad: 'from-emerald-950/35 via-[#061c14] to-slate-950',
    heroGrad: 'from-emerald-900/30 via-slate-900/85 to-slate-950/95',
    pillActive: 'bg-emerald-500 text-slate-950 font-bold shadow-lg shadow-emerald-500/30',
  },
  romantic: {
    key: 'romantic',
    name: 'Romantic',
    emoji: '💖',
    accent: '#EC4899',
    accentRgb: '236, 72, 153',
    bgGrad: 'from-pink-950/35 via-[#220716] to-slate-950',
    heroGrad: 'from-pink-900/35 via-slate-900/85 to-slate-950/95',
    pillActive: 'bg-pink-500 text-white font-bold shadow-lg shadow-pink-500/30',
  },
};

// ============================================================================
// STARTER MOOD PLAYLISTS — NO HARDCODED SONGS! (Users add songs themselves)
// ============================================================================
const STARTER_MOOD_PLAYLISTS = [
  {
    id: 'starter-calm-and-relax',
    name: 'Calm & Relax',
    emoji: '🍃',
    mood: 'calm',
    description: 'Serene acoustic textures, gentle breeze, and harmonic peace.',
    cover: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=800&q=80',
    songs: [],
  },
  {
    id: 'starter-happy-vibes',
    name: 'Happy Vibes',
    emoji: '😊',
    mood: 'happy',
    description: 'Curated collection for a cheerful and uplifting mood.',
    cover: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
    songs: [],
  },
  {
    id: 'starter-energetic-boost',
    name: 'Energetic Boost',
    emoji: '⚡',
    mood: 'energetic',
    description: 'High-tempo adrenaline anthems, driving kicks, and pump-up rhythm.',
    cover: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=800&q=80',
    songs: [],
  },
  {
    id: 'starter-late-night-blues',
    name: 'Late Night Blues',
    emoji: '🌙',
    mood: 'sad',
    description: 'Reflective, soothing melodies for quiet nocturnal solitude.',
    cover: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=800&q=80',
    songs: [],
  },
  {
    id: 'starter-deep-focus',
    name: 'Deep Focus',
    emoji: '🎯',
    mood: 'focus',
    description: 'Binaural frequencies, soothing ambient lo-fi, and steady concentration.',
    cover: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=800&q=80',
    songs: [],
  },
  {
    id: 'starter-romantic-twilight',
    name: 'Romantic Twilight',
    emoji: '💖',
    mood: 'romantic',
    description: 'Intimate acoustic serenades, delicate guitar chords, and heartfelt poetry.',
    cover: 'https://images.unsplash.com/photo-1518495973542-4542c06a5843?auto=format&fit=crop&w=800&q=80',
    songs: [],
  },
];

// Curated catalog hits available for quick song addition
const POPULAR_SEARCH_CATALOG = [
  { id: 'cat-1', name: 'Boom Shaka', artist: 'KR$NA', youtube_id: 'qE0u79jZq-0', duration: 195, image: 'https://i.ytimg.com/vi/qE0u79jZq-0/hqdefault.jpg', mood_match: 'Energetic' },
  { id: 'cat-2', name: 'Prarthana', artist: 'KR$NA', youtube_id: 'fdubeMFwuGs', duration: 210, image: 'https://i.ytimg.com/vi/fdubeMFwuGs/hqdefault.jpg', mood_match: 'Energetic' },
  { id: 'cat-3', name: 'Kesariya', artist: 'Arijit Singh', youtube_id: 'BddP6PYo2gs', duration: 268, image: 'https://i.ytimg.com/vi/BddP6PYo2gs/hqdefault.jpg', mood_match: 'Happy' },
  { id: 'cat-4', name: 'Ilahi', artist: 'Arijit Singh', youtube_id: 'fdubeMFwuGs', duration: 228, image: 'https://i.ytimg.com/vi/fdubeMFwuGs/hqdefault.jpg', mood_match: 'Happy' },
  { id: 'cat-5', name: 'Raataan Lambiyan', artist: 'Jubin Nautiyal', youtube_id: 'gvyUuxdRdR4', duration: 230, image: 'https://i.ytimg.com/vi/gvyUuxdRdR4/hqdefault.jpg', mood_match: 'Romantic' },
  { id: 'cat-6', name: 'Kun Faya Kun', artist: 'A.R. Rahman', youtube_id: 'T94PHkuydcw', duration: 473, image: 'https://i.ytimg.com/vi/T94PHkuydcw/hqdefault.jpg', mood_match: 'Calm' },
  { id: 'cat-7', name: 'Iktara', artist: 'Kavita Seth', youtube_id: 'fSS_R91Nimw', duration: 253, image: 'https://i.ytimg.com/vi/fSS_R91Nimw/hqdefault.jpg', mood_match: 'Calm' },
  { id: 'cat-8', name: 'Agar Tum Saath Ho', artist: 'Alka Yagnik & Arijit', youtube_id: 'sK7riqg2mr4', duration: 341, image: 'https://i.ytimg.com/vi/sK7riqg2mr4/hqdefault.jpg', mood_match: 'Sad' },
  { id: 'cat-9', name: 'Channa Mereya', artist: 'Arijit Singh', youtube_id: '284Ov7ysmfA', duration: 289, image: 'https://i.ytimg.com/vi/284Ov7ysmfA/hqdefault.jpg', mood_match: 'Sad' },
  { id: 'cat-10', name: 'Apna Bana Le', artist: 'Arijit Singh', youtube_id: 'ElZfdU54Cp8', duration: 261, image: 'https://i.ytimg.com/vi/ElZfdU54Cp8/hqdefault.jpg', mood_match: 'Romantic' },
  { id: 'cat-11', name: 'Zinda', artist: 'Shankar Mahadevan', youtube_id: 'f_45lq33pkw', duration: 211, image: 'https://i.ytimg.com/vi/f_45lq33pkw/hqdefault.jpg', mood_match: 'Energetic' },
  { id: 'cat-12', name: 'Weightless', artist: 'Marconi Union', youtube_id: 'UfcAVejslrU', duration: 488, image: 'https://i.ytimg.com/vi/UfcAVejslrU/hqdefault.jpg', mood_match: 'Focus' },
  { id: 'cat-13', name: 'Kasoor', artist: 'Prateek Kuhad', youtube_id: 'pqpZkM-Z_7E', duration: 210, image: 'https://i.ytimg.com/vi/pqpZkM-Z_7E/hqdefault.jpg', mood_match: 'Calm' },
  { id: 'cat-14', name: 'Mirchi', artist: 'DIVINE', youtube_id: 'T4431ZtqH84', duration: 215, image: 'https://i.ytimg.com/vi/T4431ZtqH84/hqdefault.jpg', mood_match: 'Energetic' },
];

// Helper: Format seconds to mm:ss
const formatSongDuration = (val) => {
  if (!val) return '3:45';
  if (typeof val === 'string' && val.includes(':')) return val;
  const num = Number(val);
  if (isNaN(num)) return '3:45';
  const m = Math.floor(num / 60);
  const s = Math.floor(num % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
};

// Helper: Calculate total playlist minutes
const calculateTotalDuration = (songs) => {
  if (!songs || !Array.isArray(songs) || songs.length === 0) return '0 min';
  let totalSec = 0;
  songs.forEach((s) => {
    if (typeof s.duration === 'number') {
      totalSec += s.duration;
    } else if (typeof s.duration === 'string' && s.duration.includes(':')) {
      const parts = s.duration.split(':');
      totalSec += parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
    } else {
      totalSec += 240;
    }
  });
  const totalMin = Math.round(totalSec / 60);
  if (totalMin < 60) return `${totalMin} min`;
  const hrs = Math.floor(totalMin / 60);
  const mins = totalMin % 60;
  return `${hrs} hr ${mins} min`;
};

// User-isolated playlist song loader & saver
const getStoredSongs = (playlistId, user) => {
  return getUserPlaylistSongs(playlistId, user);
};

const saveStoredSongs = (playlistId, songs, user) => {
  saveUserPlaylistSongs(playlistId, songs, user);
};

const PlaylistsPage = () => {
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const [userPlaylists, setUserPlaylists] = useState(() => getUserCustomPlaylists(user));
  const [loading, setLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [activeMoodFilter, setActiveMoodFilter] = useState('calm');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlaylistId, setSelectedPlaylistId] = useState('starter-calm-and-relax');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isAddSongModalOpen, setIsAddSongModalOpen] = useState(false);
  const [addSongSearch, setAddSongSearch] = useState('');
  const [remoteSearchResults, setRemoteSearchResults] = useState([]);
  const [isSearchingRemote, setIsSearchingRemote] = useState(false);
  const [mobileDetailView, setMobileDetailView] = useState(false);

  // Number of imported playlists in library
  const importedPlaylistsCount = useMemo(() => {
    return (userPlaylists || []).filter((p) => p.source === 'spotify' || p.source === 'youtube' || String(p.id || '').startsWith('imported-')).length;
  }, [userPlaylists]);
  const [localSongsMap, setLocalSongsMap] = useState({});
  const [toastMsg, setToastMsg] = useState(null);
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const [dropPosition, setDropPosition] = useState(null); // 'before' | 'after'

  const currentSong = useSelector((state) => state.audio?.currentSong);
  const isPlaying = useSelector((state) => state.audio?.isPlaying);
  const reduxActiveMood = useSelector((state) => state.audio?.activeMood);
  const { queue = [], currentIndex = 0 } = useSelector((state) => state.audio || {});

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2500);
  };
  
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Load starter playlists and attach any user-added songs from localStorage
  const starterWithUserSongs = useMemo(() => {
    return STARTER_MOOD_PLAYLISTS.map((p) => {
      const userAdded = localSongsMap[p.id] || getStoredSongs(p.id, user);
      return {
        ...p,
        songs: userAdded,
      };
    });
  }, [localSongsMap]);

  // Combine user backend playlists with starter playlists
  const allPlaylists = useMemo(() => {
    const formattedUser = (userPlaylists || []).map((p) => {
      const moodKey = String(p.mood || 'calm').toLowerCase();
      const cfg = PLAYLIST_MOOD_CONFIG[moodKey] || PLAYLIST_MOOD_CONFIG.calm;
      const userAdded = localSongsMap[p.id || p._id] || (p.songs && p.songs.length > 0 ? p.songs : getStoredSongs(p.id || p._id, user));
      return {
        id: p.id || p._id,
        name: p.name || 'Untitled Playlist',
        emoji: cfg.emoji || '🎵',
        mood: moodKey,
        description: p.description || 'Personal music collection',
        cover: p.cover || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=800&q=80',
        songs: userAdded,
        isCustom: true,
        created_at: p.created_at,
      };
    });
    return [...starterWithUserSongs, ...formattedUser];
  }, [userPlaylists, starterWithUserSongs, localSongsMap]);

  // Filter playlists based on selected mood tab and search query
  const filteredPlaylists = useMemo(() => {
    return allPlaylists.filter((p) => {
      const matchesMood = activeMoodFilter === 'all' || p.mood?.toLowerCase() === activeMoodFilter.toLowerCase();
      const matchesSearch = !searchQuery.trim() || 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        p.description?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesMood && matchesSearch;
    });
  }, [allPlaylists, activeMoodFilter, searchQuery]);

  // Active selected playlist: ALWAYS prioritize matching within filtered playlists!
  const activePlaylist = useMemo(() => {
    const foundInFiltered = filteredPlaylists.find((p) => p.id === selectedPlaylistId);
    if (foundInFiltered) return foundInFiltered;
    return filteredPlaylists[0] || allPlaylists[0] || null;
  }, [allPlaylists, selectedPlaylistId, filteredPlaylists]);

  // Dynamic Theme: Governed by the active mood filter or active playlist mood
  const activeMoodKey = (activeMoodFilter !== 'all' ? activeMoodFilter : (activePlaylist?.mood || reduxActiveMood)) || 'calm';
  const moodTheme = PLAYLIST_MOOD_CONFIG[activeMoodKey.toLowerCase()] || PLAYLIST_MOOD_CONFIG.calm;

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (user?.isGuest) {
      setLoading(false);
      return;
    }
    fetchPlaylists();
  }, [isAuthenticated, user?.isGuest, navigate]);

  // Keep Redux active mood synchronized when activeMoodKey changes
  const applyMoodGradingToWholeApp = (moodKey) => {
    const target = String(moodKey || 'calm').toLowerCase();
    dispatch(setActiveMood(target));
    try {
      localStorage.setItem('selectedMood', JSON.stringify({ mood: target }));
    } catch (e) {}
  };

  const handleAuthError = () => {
    dispatch(logout());
    alert('Your session has expired. Please log in again.');
    navigate('/login');
  };

  const fetchPlaylists = async () => {
    try {
      setIsSyncing(true);
      const token = localStorage.getItem('token');
      if (!token || user?.isGuest) {
        setIsSyncing(false);
        return;
      }
      const response = await axios.get(`${API_BASE_URL}/api/playlists`, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 3000,
      });
      if (response.data && Array.isArray(response.data)) {
        setUserPlaylists(response.data);
        saveUserCustomPlaylists(response.data, user);
      }
    } catch (error) {
      console.warn('Backend playlists sync note (local playlists intact):', error?.message);
    } finally {
      setIsSyncing(false);
      setLoading(false);
    }
  };

  // Click on a Mood Filter Pill: Dispatches to Redux and morphs ENTIRE website color grading!
  const handleMoodFilterClick = (moodKey) => {
    setActiveMoodFilter(moodKey);
    const targetMood = moodKey === 'all' ? 'calm' : moodKey;
    applyMoodGradingToWholeApp(targetMood);

    // Immediately synchronize the selected playlist to the first matching playlist
    const matching = allPlaylists.filter((p) => moodKey === 'all' || p.mood?.toLowerCase() === moodKey.toLowerCase());
    if (matching.length > 0) {
      setSelectedPlaylistId(matching[0].id);
    }
  };

  // Click on a Playlist in the left list: Dispatches to Redux and morphs ENTIRE website color grading!
  const handleSelectPlaylist = (playlist) => {
    setSelectedPlaylistId(playlist.id);
    if (playlist.mood) {
      applyMoodGradingToWholeApp(playlist.mood);
    }
    setMobileDetailView(true);
  };

  const handleCreatePlaylist = async (playlistData) => {
    try {
      const token = localStorage.getItem('token');
      let createdId = `custom-${Date.now()}`;
      if (token) {
        try {
          const res = await axios.post(`${API_BASE_URL}/api/playlists`, playlistData, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (res.data?.id) createdId = res.data.id;
        } catch (apiErr) {
          console.warn('Backend playlist creation fallback:', apiErr);
        }
      }
      
      const newPlaylist = {
        id: createdId,
        name: playlistData.name,
        description: playlistData.description,
        mood: playlistData.mood || 'calm',
        cover: playlistData.cover,
        songs: [],
        isCustom: true,
        created_at: new Date().toISOString(),
      };

      const updated = [newPlaylist, ...userPlaylists];
      setUserPlaylists(updated);
      saveUserCustomPlaylists(updated, user);
      setIsCreateModalOpen(false);
      setSelectedPlaylistId(createdId);
      setActiveMoodFilter(playlistData.mood || 'calm');
      applyMoodGradingToWholeApp(playlistData.mood || 'calm');

      // Prompt to add first song
      setTimeout(() => {
        setIsAddSongModalOpen(true);
      }, 350);
    } catch (error) {
      console.error('Error creating playlist:', error);
      alert('Failed to create playlist');
    }
  };

  const handleDeletePlaylist = async (playlistId) => {
    if (!confirm('Are you sure you want to delete this playlist?')) return;
    try {
      const token = localStorage.getItem('token');
      if (token) {
        await axios.delete(`${API_BASE_URL}/api/playlists/${playlistId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
    } catch (e) {
      console.warn('API delete error, deleting locally:', e);
    }
    const updated = userPlaylists.filter((p) => (p.id || p._id) !== playlistId);
    setUserPlaylists(updated);
    saveUserCustomPlaylists(updated, user);
    setSelectedPlaylistId(STARTER_MOOD_PLAYLISTS[0].id);
  };

  // Play entire playlist from beginning
  const handlePlayAll = (playlist = activePlaylist) => {
    if (!playlist || !playlist.songs || playlist.songs.length === 0) {
      alert('This playlist is currently empty. Click "+ Add Songs" to add your favorite tracks!');
      setIsAddSongModalOpen(true);
      return;
    }
    dispatch(setQueue(playlist.songs));
    dispatch(playSong(playlist.songs[0]));
    dispatch(setPlaying(true));
    if (playlist.mood) {
      applyMoodGradingToWholeApp(playlist.mood);
    }
  };

  // Shuffle play entire playlist
  const handleShufflePlay = (playlist = activePlaylist) => {
    if (!playlist || !playlist.songs || playlist.songs.length === 0) {
      alert('This playlist is currently empty. Click "+ Add Songs" to add your favorite tracks!');
      setIsAddSongModalOpen(true);
      return;
    }
    const shuffled = [...playlist.songs].sort(() => Math.random() - 0.5);
    dispatch(setQueue(shuffled));
    dispatch(playSong(shuffled[0]));
    dispatch(setPlaying(true));
    if (playlist.mood) {
      applyMoodGradingToWholeApp(playlist.mood);
    }
  };

  // Play individual track from tracklist
  const handlePlayTrack = (track, trackIndex, playlist = activePlaylist) => {
    if (!track) return;
    dispatch(setQueue(playlist.songs));
    dispatch(playSong(track));
    dispatch(setPlaying(true));
    if (playlist.mood) {
      applyMoodGradingToWholeApp(playlist.mood);
    }
  };

  // Check if active playlist is currently playing in the active queue
  const isPlaylistActiveInQueue = useMemo(() => {
    if (!queue || queue.length === 0 || !activePlaylist?.songs?.length) return false;
    return activePlaylist.songs.some(
      (s) => s.name === currentSong?.name && s.artist === currentSong?.artist
    );
  }, [queue, activePlaylist, currentSong]);

  const upcomingNextSong = useMemo(() => {
    if (!queue || queue.length <= 1 || currentIndex === undefined) return null;
    return queue[currentIndex + 1] || null;
  }, [queue, currentIndex]);

  // Drag and Drop reordering handlers
  const handleDragStart = (e, index) => {
    e.dataTransfer.setData('text/plain', String(index));
    e.dataTransfer.effectAllowed = 'move';
    setDraggedIndex(index);
  };

  const handleDragOver = (e, targetIdx) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (draggedIndex === null || draggedIndex === targetIdx) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const midY = rect.top + rect.height / 2;
    const pos = e.clientY < midY ? 'before' : 'after';
    setDragOverIndex(targetIdx);
    setDropPosition(pos);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
    setDropPosition(null);
  };

  const handleDropTrack = (e, targetIdx) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === targetIdx) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      setDropPosition(null);
      return;
    }

    let destIdx = targetIdx;
    if (dropPosition === 'after' && draggedIndex < targetIdx) {
      destIdx = targetIdx;
    } else if (dropPosition === 'before' && draggedIndex > targetIdx) {
      destIdx = targetIdx;
    } else if (dropPosition === 'after' && draggedIndex > targetIdx) {
      destIdx = targetIdx + 1;
    } else if (dropPosition === 'before' && draggedIndex < targetIdx) {
      destIdx = targetIdx - 1;
    }

    destIdx = Math.max(0, Math.min(activePlaylist.songs.length - 1, destIdx));

    if (destIdx !== draggedIndex) {
      const updatedSongs = [...activePlaylist.songs];
      const [movedSong] = updatedSongs.splice(draggedIndex, 1);
      updatedSongs.splice(destIdx, 0, movedSong);

      saveStoredSongs(activePlaylist.id, updatedSongs, user);
      setLocalSongsMap((prev) => ({
        ...prev,
        [activePlaylist.id]: updatedSongs,
      }));

      // Synchronize live playback queue if this playlist is active
      if (isPlaylistActiveInQueue) {
        dispatch(setQueue(updatedSongs));
      }
      showToast(`✨ Reordered: "${movedSong.name}" moved to #${destIdx + 1}`);
    }

    setDraggedIndex(null);
    setDragOverIndex(null);
    setDropPosition(null);
  };

  const handleMoveSong = (fromIdx, direction, e) => {
    e.stopPropagation();
    const toIdx = direction === 'up' ? fromIdx - 1 : fromIdx + 1;
    if (!activePlaylist?.songs || toIdx < 0 || toIdx >= activePlaylist.songs.length) return;

    const updatedSongs = [...activePlaylist.songs];
    const [movedSong] = updatedSongs.splice(fromIdx, 1);
    updatedSongs.splice(toIdx, 0, movedSong);

    saveStoredSongs(activePlaylist.id, updatedSongs, user);
    setLocalSongsMap((prev) => ({
      ...prev,
      [activePlaylist.id]: updatedSongs,
    }));

    if (isPlaylistActiveInQueue) {
      dispatch(setQueue(updatedSongs));
    }
    showToast(`✨ Moved "${movedSong.name}" to #${toIdx + 1}`);
  };

  const handlePlayNextInQueue = (track, e) => {
    e.stopPropagation();
    dispatch(addToPlayNext(track));
    showToast(`⚡ "${track.name}" will play next in queue!`);
  };

  const handleAddToUpcomingQueue = (track, e) => {
    e.stopPropagation();
    dispatch(addToQueue(track));
    showToast(`+ Added "${track.name}" to upcoming queue`);
  };

  // Add a song into the active playlist (Users add their own songs)
  const handleAddTrackToActivePlaylist = async (song) => {
    if (!activePlaylist) return;

    // Check if song is already added
    const alreadyExists = (activePlaylist.songs || []).some(
      (s) => (s.id && s.id === song.id) || (s.name.toLowerCase() === song.name.toLowerCase() && s.artist.toLowerCase() === song.artist.toLowerCase())
    );
    if (alreadyExists) {
      alert(`"${song.name}" is already in this playlist.`);
      return;
    }

    const newSongObj = {
      ...song,
      id: song.id || `song-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      mood_match: activePlaylist.mood,
    };

    const updatedSongs = [...(activePlaylist.songs || []), newSongObj];
    
    // Save to local storage and memory
    saveStoredSongs(activePlaylist.id, updatedSongs);
    setLocalSongsMap((prev) => ({
      ...prev,
      [activePlaylist.id]: updatedSongs,
    }));

    // If it's a backend playlist, sync with API
    if (activePlaylist.isCustom) {
      try {
        const token = localStorage.getItem('token');
        if (token) {
          await axios.post(
            `${API_BASE_URL}/api/playlists/${activePlaylist.id}/songs`,
            newSongObj,
            { headers: { Authorization: `Bearer ${token}` } }
          );
        }
      } catch (err) {
        console.warn('API sync warning:', err);
      }
    }
  };

  // Remove a song from the playlist
  const handleRemoveTrackFromPlaylist = async (songId) => {
    if (!activePlaylist) return;
    const updatedSongs = (activePlaylist.songs || []).filter((s) => s.id !== songId);
    saveStoredSongs(activePlaylist.id, updatedSongs);
    setLocalSongsMap((prev) => ({
      ...prev,
      [activePlaylist.id]: updatedSongs,
    }));

    if (activePlaylist.isCustom) {
      try {
        const token = localStorage.getItem('token');
        if (token) {
          await axios.delete(`${API_BASE_URL}/api/playlists/${activePlaylist.id}/songs/${songId}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
        }
      } catch (e) {
        console.warn('Remove from API error:', e);
      }
    }
  };

  // Live debounced search against catalog and backend for song addition
  useEffect(() => {
    const trimmed = addSongSearch.trim();
    if (!trimmed || trimmed.length < 2) {
      setRemoteSearchResults([]);
      setIsSearchingRemote(false);
      return;
    }

    const abortController = new AbortController();

    const timer = setTimeout(async () => {
      setIsSearchingRemote(true);
      try {
        const res = await axios.get(`${API_BASE_URL}/search-music`, {
          params: { query: trimmed, limit: 8 },
          signal: abortController.signal,
          timeout: 6000,
        });
        if (res.data?.results) {
          setRemoteSearchResults(res.data.results);
        }
      } catch (e) {
        if (!axios.isCancel(e)) {
          // Fallback to local catalog filter
          const filtered = POPULAR_SEARCH_CATALOG.filter(
            (s) =>
              s.name.toLowerCase().includes(trimmed.toLowerCase()) ||
              s.artist.toLowerCase().includes(trimmed.toLowerCase())
          );
          setRemoteSearchResults(filtered);
        }
      } finally {
        setIsSearchingRemote(false);
      }
    }, 380);

    return () => {
      clearTimeout(timer);
      abortController.abort();
    };
  }, [addSongSearch]);

  const displayedAddCatalog = useMemo(() => {
    if (addSongSearch.trim()) {
      if (remoteSearchResults.length > 0) return remoteSearchResults;
      return POPULAR_SEARCH_CATALOG.filter(
        (s) =>
          s.name.toLowerCase().includes(addSongSearch.toLowerCase()) ||
          s.artist.toLowerCase().includes(addSongSearch.toLowerCase())
      );
    }
    return POPULAR_SEARCH_CATALOG;
  }, [addSongSearch, remoteSearchResults]);


  if (user?.isGuest) {
    return (
      <div
        className="min-h-screen text-slate-100 flex flex-col items-center justify-center p-6 relative font-sans"
        style={{
          background: `radial-gradient(ellipse at 50% 0%, rgba(${moodTheme.accentRgb}, 0.20) 0%, transparent 70%), #060B10`,
        }}
      >
        <div className="max-w-md w-full bg-slate-900/80 border border-white/10 rounded-3xl p-8 sm:p-10 text-center backdrop-blur-2xl shadow-2xl relative overflow-hidden">
          <div
            className="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center text-3xl mb-5 border shadow-lg"
            style={{
              backgroundColor: `rgba(${moodTheme.accentRgb}, 0.15)`,
              borderColor: `rgba(${moodTheme.accentRgb}, 0.35)`,
              boxShadow: `0 0 24px rgba(${moodTheme.accentRgb}, 0.3)`,
            }}
          >
            🔒
          </div>
          <span
            className="px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider border inline-block mb-3"
            style={{
              backgroundColor: `rgba(${moodTheme.accentRgb}, 0.1)`,
              color: moodTheme.accent,
              borderColor: `rgba(${moodTheme.accentRgb}, 0.3)`,
            }}
          >
            Member Exclusive Feature
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mb-2.5">
            Playlist Library Locked
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-6">
            You are currently browsing as a <strong>Guest Listener</strong>. Creating, managing, and saving personal mood playlists requires a free MoodTunes AI account.
          </p>
          <div className="flex flex-col gap-3">
            <button
              onClick={() => navigate('/login')}
              className="w-full py-3 px-4 rounded-full font-bold text-xs sm:text-sm text-white shadow-lg hover:scale-[1.02] active:scale-98 transition-all cursor-pointer"
              style={{
                background: 'linear-gradient(135deg, #EC4899 0%, #8B5CF6 50%, #6366F1 100%)',
                boxShadow: '0 8px 24px -4px rgba(236, 72, 153, 0.4)',
              }}
            >
              Log In or Create Account
            </button>
            <button
              onClick={() => navigate('/')}
              className="w-full py-2.5 px-4 rounded-full font-semibold text-xs sm:text-sm text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-all cursor-pointer"
            >
              Back to Discover & Music
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen text-slate-100 transition-colors duration-1000 relative pb-32"

      style={{
        background: `radial-gradient(ellipse at 50% -10%, rgba(${moodTheme.accentRgb}, 0.24) 0%, transparent 70%), #060B10`,
      }}
    >
      {/* Action feedback toast */}
      {toastMsg && (
        <div className="fixed bottom-24 right-8 z-50 px-4 py-2.5 rounded-2xl bg-slate-950/95 border border-white/20 text-xs font-bold text-cyan shadow-2xl backdrop-blur-2xl animate-fadeIn flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-cyan animate-pulse" />
          <span>{toastMsg}</span>
        </div>
      )}
      {/* Dynamic Ambient Mesh for Mood Grading */}
      <div
        aria-hidden="true"
        className="fixed inset-0 pointer-events-none transition-all duration-1000 ease-out z-0 opacity-40"
        style={{
          background: `radial-gradient(circle at 80% 25%, rgba(${moodTheme.accentRgb}, 0.20), transparent 50%), radial-gradient(circle at 20% 75%, rgba(${moodTheme.accentRgb}, 0.14), transparent 50%)`,
        }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-10">
        
        {/* ============================================================== */}
        {/* 1. TOP HEADER & MOOD FILTER PILLS BAR                           */}
        {/* ============================================================== */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-2.5">
                <span className="text-2xl select-none">{moodTheme.emoji}</span>
                <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
                  Your Playlists
                </h1>
              </div>
              <p className="text-sm text-slate-400 mt-1">
                AI-curated playlists for every mood and moment.
              </p>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              {/* 1-Click Import Playlist Button (Always Available) */}
              <button
                onClick={() => setIsImportModalOpen(true)}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-full text-xs sm:text-sm font-bold bg-white/10 hover:bg-white/15 text-white border border-white/15 transition-all duration-300 shadow-md hover:scale-105 active:scale-95 cursor-pointer"
                title="Import public Spotify or YouTube playlist"
              >
                <span>📥</span>
                <span>Import Playlist</span>
                {importedPlaylistsCount > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] bg-cyan/20 text-cyan-300 font-mono">
                    {importedPlaylistsCount}
                  </span>
                )}
              </button>

              {/* Create Playlist Button */}
              <button
                onClick={() => setIsCreateModalOpen(true)}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold transition-all duration-300 shadow-lg hover:scale-105 active:scale-95 cursor-pointer self-start sm:self-auto"
              style={{
                backgroundColor: moodTheme.accent,
                color: '#060B10',
                boxShadow: `0 8px 24px -4px rgba(${moodTheme.accentRgb}, 0.45)`,
              }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
              <span>Create Playlist</span>
              </button>
            </div>
          </div>

          {/* Horizontal Mood Filter Pills: Dynamically changes ENTIRE APP color grading */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
            {Object.values(PLAYLIST_MOOD_CONFIG).map((pill) => {
              const isSelected = activeMoodFilter === pill.key;
              return (
                <button
                  key={pill.key}
                  onClick={() => handleMoodFilterClick(pill.key)}
                  className={`shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold transition-all duration-300 cursor-pointer border ${
                    isSelected
                      ? pill.pillActive
                      : 'bg-slate-900/60 hover:bg-slate-800/80 text-slate-300 border-white/10 hover:border-white/20'
                  }`}
                  style={
                    isSelected
                      ? {
                          backgroundColor: pill.accent,
                          borderColor: pill.accent,
                          color: '#060B10',
                          boxShadow: `0 4px 18px rgba(${pill.accentRgb}, 0.35)`,
                        }
                      : undefined
                  }
                >
                  <span>{pill.emoji}</span>
                  <span>{pill.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ============================================================== */}
        {/* 2. MASTER-DETAIL DUAL-PANEL LAYOUT                              */}
        {/* ============================================================== */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* ============================================================ */}
          {/* LEFT PANEL: Playlist Selector List (5 Cols)                  */}
          {/* ============================================================ */}
          <div className={`lg:col-span-5 space-y-3 ${mobileDetailView ? 'hidden lg:block' : 'block'}`}>
            
            {/* Quick search input within playlists */}
            <div className="relative mb-4">
              <input
                type="text"
                placeholder="Search playlists..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-900/70 border border-white/10 focus:border-white/25 rounded-2xl px-4 py-2.5 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none transition-all pl-10"
              />
              <svg className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            {filteredPlaylists.length === 0 ? (
              <div className="text-center py-16 bg-slate-900/40 rounded-3xl border border-white/5 p-6">
                <span className="text-4xl select-none">📂</span>
                <h3 className="text-base font-semibold text-slate-300 mt-3">No Playlists Found</h3>
                <p className="text-xs text-slate-500 mt-1 mb-4">Create your first custom playlist</p>
                <button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="px-4 py-2 rounded-full text-xs font-semibold text-white transition-all cursor-pointer"
                  style={{ backgroundColor: moodTheme.accent, color: '#060B10' }}
                >
                  Create Playlist
                </button>
              </div>
            ) : (
              filteredPlaylists.map((playlist) => {
                const isSelected = activePlaylist?.id === playlist.id;
                const pTheme = PLAYLIST_MOOD_CONFIG[playlist.mood?.toLowerCase()] || PLAYLIST_MOOD_CONFIG.calm;
                const totalDurationStr = calculateTotalDuration(playlist.songs);

                return (
                  <div
                    key={playlist.id}
                    onClick={() => handleSelectPlaylist(playlist)}
                    className={`group relative flex items-center gap-3.5 p-3 rounded-2xl transition-all duration-300 cursor-pointer border backdrop-blur-md overflow-hidden ${
                      isSelected
                        ? 'bg-slate-900/85 scale-[1.01]'
                        : 'bg-slate-950/50 hover:bg-slate-900/70 border-white/5 hover:border-white/15'
                    }`}
                    style={
                      isSelected
                        ? {
                            borderColor: pTheme.accent,
                            boxShadow: `0 0 25px -4px rgba(${pTheme.accentRgb}, 0.28)`,
                          }
                        : undefined
                    }
                  >
                    {/* Active Accent Highlight Indicator Bar */}
                    {isSelected && (
                      <div
                        className="absolute left-0 top-0 bottom-0 w-1 rounded-r-full"
                        style={{ backgroundColor: pTheme.accent }}
                      />
                    )}

                    {/* Thumbnail Artwork with Play Triangle Overlay */}
                    <div className="relative w-16 h-16 sm:w-18 sm:h-18 rounded-xl overflow-hidden shrink-0 bg-slate-800 shadow-md">
                      <img
                        src={playlist.cover}
                        alt={playlist.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        onError={(e) => {
                          e.target.src = 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=400&q=80';
                        }}
                      />
                      {/* Play overlay button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePlayAll(playlist);
                        }}
                        className="absolute inset-0 bg-black/40 hover:bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                        title="Play Playlist"
                      >
                        <div
                          className="w-7 h-7 rounded-full flex items-center justify-center shadow-lg"
                          style={{ backgroundColor: pTheme.accent, color: '#060B10' }}
                        >
                          <svg className="w-3.5 h-3.5 translate-x-0.5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z" />
                          </svg>
                        </div>
                      </button>
                    </div>

                    {/* Playlist Info */}
                    <div className="flex-1 min-w-0 pr-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm select-none">{playlist.emoji || pTheme.emoji}</span>
                        <h3 className={`text-sm sm:text-base font-bold truncate transition-colors ${
                          isSelected ? 'text-white' : 'text-slate-200 group-hover:text-white'
                        }`}>
                          {playlist.name}
                        </h3>
                      </div>
                      <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
                        <span>{playlist.songs?.length || 0} songs</span>
                        <span>•</span>
                        <span>{totalDurationStr}</span>
                      </p>
                    </div>

                    {/* Right Forward Chevron Icon */}
                    <div className="shrink-0 text-slate-500 group-hover:text-slate-200 transition-colors pr-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* ============================================================ */}
          {/* RIGHT PANEL: Selected Playlist View (7 Cols)                 */}
          {/* ============================================================ */}
          <div className={`lg:col-span-7 ${mobileDetailView ? 'block' : 'hidden lg:block'}`}>
            
            {/* Mobile Back Button */}
            <div className="lg:hidden mb-4">
              <button
                onClick={() => setMobileDetailView(false)}
                className="flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span>Back to Playlists</span>
              </button>
            </div>

            {/* Selected Playlist Hero Card */}
            <div
              className="relative rounded-3xl p-6 sm:p-7 backdrop-blur-2xl border shadow-2xl overflow-hidden transition-all duration-500 mb-6"
              style={{
                background: `linear-gradient(135deg, rgba(${moodTheme.accentRgb}, 0.16) 0%, rgba(15, 23, 42, 0.85) 100%)`,
                borderColor: `rgba(${moodTheme.accentRgb}, 0.35)`,
                boxShadow: `0 25px 60px -12px rgba(0,0,0,0.7), 0 0 45px rgba(${moodTheme.accentRgb}, 0.18)`,
              }}
            >
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                
                {/* Large Cover Artwork */}
                <div className="relative w-36 h-36 sm:w-44 sm:h-44 rounded-2xl overflow-hidden shadow-2xl shrink-0 border border-white/10 group">
                  <img
                    src={activePlaylist?.cover}
                    alt={activePlaylist?.name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    onError={(e) => {
                      e.target.src = 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=600&q=80';
                    }}
                  />
                  <button
                    onClick={() => handlePlayAll()}
                    className="absolute inset-0 bg-black/40 hover:bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                  >
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center shadow-2xl"
                      style={{ backgroundColor: moodTheme.accent, color: '#060B10' }}
                    >
                      <svg className="w-6 h-6 translate-x-0.5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </div>
                  </button>
                </div>

                {/* Hero Info & Action Buttons */}
                <div className="flex-1 text-center sm:text-left flex flex-col justify-between min-h-36">
                  <div>
                    <div className="flex items-center justify-center sm:justify-start gap-2">
                      <span className="text-xl select-none">{activePlaylist?.emoji || moodTheme.emoji}</span>
                      <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                        {activePlaylist?.name}
                      </h2>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed">
                      {activePlaylist?.description}
                    </p>
                    <div className="text-xs text-slate-400 mt-2 flex items-center justify-center sm:justify-start gap-2">
                      <span className="font-semibold text-slate-300">{activePlaylist?.songs?.length || 0} songs</span>
                      <span>•</span>
                      <span>{calculateTotalDuration(activePlaylist?.songs)}</span>
                      <span
                        className="ml-2 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider"
                        style={{
                          color: moodTheme.accent,
                          borderColor: `rgba(${moodTheme.accentRgb}, 0.35)`,
                          backgroundColor: `rgba(${moodTheme.accentRgb}, 0.12)`,
                        }}
                      >
                        {activePlaylist?.mood || moodTheme.name}
                      </span>
                    </div>
                  </div>

                  {/* Actions Row: Play All, Shuffle, Add Songs, Delete */}
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5 mt-5">
                    
                    {/* Play All Button */}
                    <button
                      onClick={() => handlePlayAll()}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-full text-xs sm:text-sm font-bold transition-all duration-300 shadow-lg hover:scale-105 active:scale-95 cursor-pointer"
                      style={{
                        backgroundColor: moodTheme.accent,
                        color: '#060B10',
                        boxShadow: `0 8px 24px -4px rgba(${moodTheme.accentRgb}, 0.45)`,
                      }}
                    >
                      <svg className="w-4 h-4 translate-x-0.5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                      <span>Play All</span>
                    </button>

                    {/* Shuffle Button */}
                    <button
                      onClick={() => handleShufflePlay()}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-full text-xs sm:text-sm font-semibold bg-white/10 hover:bg-white/15 text-white border border-white/10 hover:border-white/20 transition-all cursor-pointer active:scale-95"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4h4l4 5-4 5H4M16 4h4v4M16 20h4v-4M20 4l-7 7M4 20h4l7-7" />
                      </svg>
                      <span>Shuffle</span>
                    </button>

                    {/* Add Songs Button */}
                    <button
                      onClick={() => setIsAddSongModalOpen(true)}
                      className="flex items-center gap-1.5 px-4 py-2.5 rounded-full text-xs sm:text-sm font-semibold bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 transition-all cursor-pointer active:scale-95"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      <span>Add Songs</span>
                    </button>

                    {/* Adjust Queue Button */}
                    <button
                      onClick={() => dispatch(openQueue())}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-full text-xs sm:text-sm font-semibold transition-all cursor-pointer active:scale-95 shadow-md border"
                      style={{
                        backgroundColor: isPlaylistActiveInQueue ? 'rgba(0, 242, 254, 0.15)' : 'rgba(255, 255, 255, 0.08)',
                        borderColor: isPlaylistActiveInQueue ? 'rgba(0, 242, 254, 0.45)' : 'rgba(255, 255, 255, 0.15)',
                        color: isPlaylistActiveInQueue ? '#00F2FE' : '#FFFFFF',
                      }}
                      title="Open Queue Drawer to customize upcoming tracks"
                    >
                      <span className={isPlaylistActiveInQueue ? 'animate-pulse' : ''}>🎛️</span>
                      <span>{isPlaylistActiveInQueue ? 'Adjust Live Queue' : 'Queue Drawer'}</span>
                    </button>

                    {/* Delete Playlist (for custom user playlists) */}
                    {activePlaylist?.isCustom && (
                      <button
                        onClick={() => handleDeletePlaylist(activePlaylist.id)}
                        className="p-2.5 rounded-full bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 hover:border-red-500/40 transition-all cursor-pointer"
                        title="Delete Playlist"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Active Queue Control & Status Banner */}
            {isPlaylistActiveInQueue && (
              <div className="mb-4 p-4 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-slate-900/80 to-cyan-950/40 border border-emerald-500/30 backdrop-blur-xl flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xl">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-emerald-400 animate-ping shrink-0" />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider">
                        ● Active In Playing Queue
                      </span>
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-white/10 text-slate-300 font-mono">
                        Track {currentIndex + 1} of {queue.length}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 mt-0.5">
                      {upcomingNextSong ? (
                        <span>Up Next: <strong className="text-white">{upcomingNextSong.name}</strong> • {upcomingNextSong.artist}</span>
                      ) : (
                        <span>End of queue reached. Drag tracks or click <strong>⚡ Next</strong> to schedule more!</span>
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => dispatch(openQueue())}
                    className="px-3.5 py-1.5 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan border border-cyan/30 text-xs font-bold transition-all hover:scale-105 active:scale-95 flex items-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <span>🎛️ Adjust Full Queue</span>
                    <span>→</span>
                  </button>
                  <button
                    onClick={() => {
                      dispatch(shuffleUpcomingQueue());
                      showToast('🔀 Upcoming queue shuffled!');
                    }}
                    className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 text-xs font-semibold transition-all cursor-pointer"
                    title="Shuffle upcoming queue"
                  >
                    🔀 Shuffle Next
                  </button>
                </div>
              </div>
            )}

            {/* Tracklist Table */}
            <div className="bg-slate-950/60 backdrop-blur-xl rounded-3xl border border-white/10 overflow-hidden shadow-xl">
              
              {/* Table Column Headers (12 Columns: 1 Drag + 3 Title + 2 Artist + 1 Time + 5 Actions) */}
              <div className="grid grid-cols-12 px-4 sm:px-5 py-3 text-xs font-mono uppercase tracking-wider text-slate-400 border-b border-white/5 bg-slate-900/40 items-center">
                <div className="col-span-1 text-center"># / Drag</div>
                <div className="col-span-5 sm:col-span-4 md:col-span-3">Title</div>
                <div className="hidden sm:block sm:col-span-2 md:col-span-2">Artist</div>
                <div className="hidden sm:block sm:col-span-1 md:col-span-1 text-center">Time</div>
                <div className="col-span-6 sm:col-span-4 md:col-span-5 text-right pr-2">Queue & Actions</div>
              </div>

              {/* Empty Playlist State (User will add songs themselves!) */}
              {!activePlaylist?.songs || activePlaylist.songs.length === 0 ? (
                <div className="text-center py-14 px-6">
                  <div
                    className="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center text-2xl mb-3 shadow-lg"
                    style={{
                      backgroundColor: `rgba(${moodTheme.accentRgb}, 0.15)`,
                      border: `1px solid rgba(${moodTheme.accentRgb}, 0.35)`,
                    }}
                  >
                    🎵
                  </div>
                  <h4 className="text-base font-bold text-white">Your Playlist is Empty</h4>
                  <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto mb-5 leading-relaxed">
                    No songs yet — build your custom soundtrack by adding your favorite tracks.
                  </p>
                  <button
                    onClick={() => setIsAddSongModalOpen(true)}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold transition-all cursor-pointer shadow-lg hover:scale-105 active:scale-95"
                    style={{ backgroundColor: moodTheme.accent, color: '#060B10' }}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                    </svg>
                    <span>Add Songs to Playlist</span>
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-white/5">
                  {activePlaylist.songs.map((track, idx) => {
                    const isTrackPlaying = isPlaying && currentSong?.name === track.name && currentSong?.artist === track.artist;
                    const isNextUp = upcomingNextSong && upcomingNextSong.name === track.name && upcomingNextSong.artist === track.artist;
                    const isDragOver = dragOverIndex === idx;

                    return (
                      <div
                        key={track.id || `${track.name}-${idx}`}
                        draggable={true}
                        onDragStart={(e) => handleDragStart(e, idx)}
                        onDragOver={(e) => handleDragOver(e, idx)}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDropTrack(e, idx)}
                        className={`group grid grid-cols-12 items-center px-4 sm:px-5 py-2.5 transition-all border-y ${
                          isTrackPlaying
                            ? 'bg-cyan-500/10 border-cyan/30 shadow-md'
                            : isDragOver
                            ? dropPosition === 'before'
                              ? 'border-t-2 border-cyan bg-cyan/15 border-b-transparent'
                              : 'border-b-2 border-cyan bg-cyan/15 border-t-transparent'
                            : 'border-transparent hover:bg-white/5'
                        }`}
                      >
                        {/* Column 1: Drag Handle (⠿) & Index / Audio Wave */}
                        <div className="col-span-1 flex items-center justify-center gap-1.5 text-xs font-mono text-slate-400">
                          {/* 6-Dot Drag Handle */}
                          <div
                            className="cursor-grab active:cursor-grabbing p-1 text-slate-500 hover:text-white transition-colors flex items-center justify-center select-none"
                            title="Drag up or down to reorder in playlist & queue"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <svg className="w-3.5 h-3.5 fill-current opacity-60 group-hover:opacity-100" viewBox="0 0 24 24">
                              <circle cx="8.5" cy="6" r="1.5" />
                              <circle cx="15.5" cy="6" r="1.5" />
                              <circle cx="8.5" cy="12" r="1.5" />
                              <circle cx="15.5" cy="12" r="1.5" />
                              <circle cx="8.5" cy="18" r="1.5" />
                              <circle cx="15.5" cy="18" r="1.5" />
                            </svg>
                          </div>

                          {isTrackPlaying ? (
                            <div className="flex items-end gap-[2px] h-3.5" title="Playing Now">
                              <span className="w-[3px] h-3 rounded-full animate-bounce [animation-delay:-0.3s]" style={{ backgroundColor: moodTheme.accent }} />
                              <span className="w-[3px] h-3.5 rounded-full animate-bounce [animation-delay:-0.15s]" style={{ backgroundColor: moodTheme.accent }} />
                              <span className="w-[3px] h-2 rounded-full animate-bounce" style={{ backgroundColor: moodTheme.accent }} />
                            </div>
                          ) : (
                            <span className="font-mono text-slate-400 text-xs">{idx + 1}</span>
                          )}
                        </div>

                        {/* Column 2: Artwork & Title */}
                        <div
                          onClick={() => handlePlayTrack(track, idx)}
                          className="col-span-5 sm:col-span-4 md:col-span-3 flex items-center gap-2.5 sm:gap-3 min-w-0 pr-2 cursor-pointer"
                        >
                          <img
                            src={resolveTrackArtwork(track)}
                            alt={track.name}
                            className="w-10 h-10 rounded-lg object-cover shrink-0 shadow-sm bg-slate-800"
                            onError={(e) => handleArtworkError(e, track)}
                          />
                          <div className="min-w-0">
                            <p className={`text-xs sm:text-sm font-semibold truncate ${
                              isTrackPlaying ? 'text-cyan font-bold' : 'text-slate-200 group-hover:text-white'
                            }`}>
                              {cleanSongTitle(track.name)}
                            </p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              {isTrackPlaying && (
                                <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-cyan/20 text-cyan font-bold">
                                  PLAYING
                                </span>
                              )}
                              {isNextUp && !isTrackPlaying && (
                                <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-bold">
                                  UP NEXT ⚡
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Column 3: Artist */}
                        <div
                          onClick={() => handlePlayTrack(track, idx)}
                          className="hidden sm:block sm:col-span-2 md:col-span-2 min-w-0 cursor-pointer pr-2"
                        >
                          <p className="text-xs text-slate-400 group-hover:text-slate-300 truncate">
                            {track.artist}
                          </p>
                        </div>

                        {/* Column 4: Duration (Clean, isolated, never overlapped) */}
                        <div className="hidden sm:block sm:col-span-1 md:col-span-1 text-center font-mono text-xs text-slate-400 select-none pr-1">
                          {formatSongDuration(track.duration)}
                        </div>

                        {/* Column 5: Queue Adjustments & Actions (Dedicated wide area with zero overflow into Time) */}
                        <div className="col-span-6 sm:col-span-4 md:col-span-5 flex items-center justify-end gap-1.5 sm:gap-2 text-right">
                          {/* Play Next in Queue Button */}
                          <button
                            onClick={(e) => handlePlayNextInQueue(track, e)}
                            className="px-2 sm:px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] sm:text-xs font-mono font-bold transition-all hover:scale-105 whitespace-nowrap cursor-pointer shadow-sm shrink-0"
                            title="Make this song play next in queue"
                          >
                            ⚡ Next
                          </button>

                          {/* Add to Queue Button */}
                          <button
                            onClick={(e) => handleAddToUpcomingQueue(track, e)}
                            className="px-2 sm:px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 text-[10px] sm:text-xs font-mono font-bold transition-all hover:scale-105 whitespace-nowrap cursor-pointer hidden md:inline-flex shrink-0"
                            title="Add to upcoming queue"
                          >
                            + Queue
                          </button>

                          {/* Move Up / Down Quick Buttons */}
                          <div className="hidden xl:flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity shrink-0">
                            <button
                              onClick={(e) => handleMoveSong(idx, 'up', e)}
                              disabled={idx === 0}
                              className="p-1 rounded hover:bg-white/10 text-slate-400 hover:text-white disabled:opacity-20 cursor-pointer text-xs"
                              title="Move Up in Playlist & Queue"
                            >
                              ▲
                            </button>
                            <button
                              onClick={(e) => handleMoveSong(idx, 'down', e)}
                              disabled={idx === activePlaylist.songs.length - 1}
                              className="p-1 rounded hover:bg-white/10 text-slate-400 hover:text-white disabled:opacity-20 cursor-pointer text-xs"
                              title="Move Down in Playlist & Queue"
                            >
                              ▼
                            </button>
                          </div>

                          {/* Remove Song Button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveTrackFromPlaylist(track.id);
                            }}
                            className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-white/5 hover:bg-red-500/20 text-slate-400 hover:text-red-400 flex items-center justify-center text-xs transition cursor-pointer shrink-0"
                            title="Remove from playlist"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>
        </div>

      </div>

      {/* ============================================================== */}
      {/* 3. MODALS: CREATE PLAYLIST & ADD SONGS                          */}
      {/* ============================================================== */}
      <CreatePlaylistModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={handleCreatePlaylist}
      />

      {/* Ultra-Modern Add Songs Search Modal */}
      {isAddSongModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-fadeIn">
          <div
            className="bg-slate-950/95 border rounded-3xl p-6 sm:p-7 max-w-xl w-full shadow-2xl space-y-4 max-h-[85vh] flex flex-col"
            style={{
              borderColor: `rgba(${moodTheme.accentRgb}, 0.35)`,
              boxShadow: `0 25px 70px -10px rgba(0,0,0,0.85), 0 0 45px rgba(${moodTheme.accentRgb}, 0.2)`,
            }}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-3 shrink-0">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <span>🎵</span>
                  <span>Add Songs to "{activePlaylist?.name}"</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Search by song title or artist name to add tracks
                </p>
              </div>
              <button
                onClick={() => setIsAddSongModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Search Input */}
            <div className="relative shrink-0">
              <input
                type="text"
                autoFocus
                placeholder="Search song title or artist (e.g. KR$NA, Arijit, Believer)..."
                value={addSongSearch}
                onChange={(e) => setAddSongSearch(e.target.value)}
                className="w-full bg-slate-900 border border-white/15 focus:border-white/30 rounded-2xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none pl-10"
                style={{
                  boxShadow: `0 0 15px rgba(${moodTheme.accentRgb}, 0.1)`,
                }}
              />
              <svg className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              {isSearchingRemote && (
                <div className="absolute right-3.5 top-3.5">
                  <div className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: moodTheme.accent }} />
                </div>
              )}
            </div>

            {/* Song Results List */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
              {displayedAddCatalog.map((song) => {
                const isAlreadyInPlaylist = (activePlaylist?.songs || []).some(
                  (s) => (s.id && s.id === song.id) || (s.name.toLowerCase() === song.name.toLowerCase() && s.artist.toLowerCase() === song.artist.toLowerCase())
                );

                return (
                  <div
                    key={`${song.name}-${song.artist}`}
                    className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-900/60 hover:bg-slate-900 border border-white/5 transition"
                  >
                    <div className="flex items-center gap-3 min-w-0 pr-3">
                      <img
                        src={resolveTrackArtwork(song)}
                        alt={song.name}
                        className="w-11 h-11 rounded-xl object-cover shrink-0 shadow-sm"
                        onError={(e) => handleArtworkError(e, song)}
                      />
                      <div className="min-w-0">
                        <p className="text-xs sm:text-sm font-semibold text-white truncate">{cleanSongTitle(song.name)}</p>
                        <p className="text-[11px] text-slate-400 truncate">{song.artist}</p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleAddTrackToActivePlaylist(song)}
                      disabled={isAlreadyInPlaylist}
                      className={`shrink-0 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        isAlreadyInPlaylist
                          ? 'bg-white/10 text-slate-400 opacity-60 cursor-not-allowed'
                          : 'hover:scale-105 active:scale-95 text-slate-950 shadow-md'
                      }`}
                      style={
                        !isAlreadyInPlaylist
                          ? { backgroundColor: moodTheme.accent, color: '#060B10' }
                          : undefined
                      }
                    >
                      {isAlreadyInPlaylist ? '✓ In Playlist' : '+ Add'}
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Modal Footer */}
            <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs text-slate-400 shrink-0">
              <span>{activePlaylist?.songs?.length || 0} tracks currently in playlist</span>
              <button
                onClick={() => setIsAddSongModalOpen(false)}
                className="px-4 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white font-semibold transition"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 1-Click Spotify / YouTube Playlist Importer Modal */}
      <ImportPlaylistModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        initialMood={activeMoodKey}
        onImportSuccess={(newPl) => {
          if (newPl) {
            setUserPlaylists((prev) => {
              const prevArr = Array.isArray(prev) ? prev : [];
              const updated = [newPl, ...prevArr.filter((p) => (p.id || p._id) !== newPl.id)];
              saveUserCustomPlaylists(updated, user);
              return updated;
            });
            if (newPl.mood) {
              const m = newPl.mood.toLowerCase();
              setActiveMoodFilter(m);
              applyMoodGradingToWholeApp(m);
            }
            setSelectedPlaylistId(newPl.id);
            showToast(`🎉 Imported "${newPl.name}" under ${newPl.mood || 'custom'}!`);
          }
          fetchPlaylists();
        }}
      />

    </div>
  );
};

export default PlaylistsPage;
