import { useState, useEffect, useMemo, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../config/api';
import { logout } from '../store/authSlice';
import { playSong, setQueue, setPlaying, setActiveMood } from '../store/audioSlice';
import CreatePlaylistModal from '../components/CreatePlaylistModal';

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

// Load playlist songs from localStorage (where user added them)
const getStoredSongs = (playlistId) => {
  try {
    const raw = localStorage.getItem(`playlist_user_songs_${playlistId}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {}
  return [];
};

const saveStoredSongs = (playlistId, songs) => {
  try {
    localStorage.setItem(`playlist_user_songs_${playlistId}`, JSON.stringify(songs));
  } catch (e) {}
};

const PlaylistsPage = () => {
  const [userPlaylists, setUserPlaylists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeMoodFilter, setActiveMoodFilter] = useState('calm');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlaylistId, setSelectedPlaylistId] = useState('starter-calm-and-relax');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isAddSongModalOpen, setIsAddSongModalOpen] = useState(false);
  const [addSongSearch, setAddSongSearch] = useState('');
  const [remoteSearchResults, setRemoteSearchResults] = useState([]);
  const [isSearchingRemote, setIsSearchingRemote] = useState(false);
  const [mobileDetailView, setMobileDetailView] = useState(false);
  const [localSongsMap, setLocalSongsMap] = useState({});

  const { isAuthenticated } = useSelector((state) => state.auth);
  const currentSong = useSelector((state) => state.audio?.currentSong);
  const isPlaying = useSelector((state) => state.audio?.isPlaying);
  const reduxActiveMood = useSelector((state) => state.audio?.activeMood);
  
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Load starter playlists and attach any user-added songs from localStorage
  const starterWithUserSongs = useMemo(() => {
    return STARTER_MOOD_PLAYLISTS.map((p) => {
      const userAdded = localSongsMap[p.id] || getStoredSongs(p.id);
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
      const userAdded = localSongsMap[p.id || p._id] || p.songs || getStoredSongs(p.id || p._id);
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
    fetchPlaylists();
  }, [isAuthenticated, navigate]);

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
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        handleAuthError();
        return;
      }
      const response = await axios.get(`${API_BASE_URL}/api/playlists`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUserPlaylists(response.data || []);
    } catch (error) {
      console.warn('Error fetching backend playlists:', error);
      if (error.response?.status === 401) {
        handleAuthError();
      }
    } finally {
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

      setUserPlaylists((prev) => [newPlaylist, ...prev]);
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
    setUserPlaylists((prev) => prev.filter((p) => (p.id || p._id) !== playlistId));
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
    if (!addSongSearch.trim()) {
      setRemoteSearchResults([]);
      setIsSearchingRemote(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearchingRemote(true);
      try {
        const res = await axios.get(`${API_BASE_URL}/search-music`, {
          params: { query: addSongSearch.trim(), limit: 8 },
        });
        if (res.data?.results) {
          setRemoteSearchResults(res.data.results);
        }
      } catch (e) {
        // Fallback to local catalog filter
        const filtered = POPULAR_SEARCH_CATALOG.filter(
          (s) =>
            s.name.toLowerCase().includes(addSongSearch.toLowerCase()) ||
            s.artist.toLowerCase().includes(addSongSearch.toLowerCase())
        );
        setRemoteSearchResults(filtered);
      } finally {
        setIsSearchingRemote(false);
      }
    }, 280);

    return () => clearTimeout(timer);
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

  return (
    <div
      className="min-h-screen text-slate-100 transition-colors duration-1000 relative pb-32"
      style={{
        background: `radial-gradient(ellipse at 50% -10%, rgba(${moodTheme.accentRgb}, 0.24) 0%, transparent 70%), #060B10`,
      }}
    >
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

            {/* Create Playlist Button (Clean, no duplicate ++ symbol) */}
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

            {loading ? (
              <div className="flex justify-center items-center py-20">
                <div
                  className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2"
                  style={{ borderColor: moodTheme.accent }}
                />
              </div>
            ) : filteredPlaylists.length === 0 ? (
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

            {/* Tracklist Table */}
            <div className="bg-slate-950/60 backdrop-blur-xl rounded-3xl border border-white/10 overflow-hidden shadow-xl">
              
              {/* Table Column Headers */}
              <div className="grid grid-cols-12 px-5 py-3 text-xs font-mono uppercase tracking-wider text-slate-400 border-b border-white/5 bg-slate-900/40">
                <div className="col-span-1 text-center">#</div>
                <div className="col-span-6 sm:col-span-5">Title</div>
                <div className="col-span-3 sm:col-span-4">Artist</div>
                <div className="col-span-2 text-right pr-2">Duration</div>
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
                    const isTrackPlaying = isPlaying && currentSong?.name === track.name;

                    return (
                      <div
                        key={track.id || `${track.name}-${idx}`}
                        className={`group grid grid-cols-12 items-center px-5 py-3 transition-colors ${
                          isTrackPlaying ? 'bg-white/10' : 'hover:bg-white/5'
                        }`}
                      >
                        {/* Column 1: Index or Equalizer */}
                        <div
                          onClick={() => handlePlayTrack(track, idx)}
                          className="col-span-1 flex items-center justify-center text-xs font-mono text-slate-400 cursor-pointer"
                        >
                          {isTrackPlaying ? (
                            <div className="flex items-end gap-0.5 h-3.5">
                              <span className="w-1 rounded-full animate-pulse h-full" style={{ backgroundColor: moodTheme.accent }} />
                              <span className="w-1 rounded-full animate-pulse h-2/3" style={{ backgroundColor: moodTheme.accent }} />
                              <span className="w-1 rounded-full animate-pulse h-4/5" style={{ backgroundColor: moodTheme.accent }} />
                            </div>
                          ) : (
                            <span className="group-hover:hidden">{idx + 1}</span>
                          )}
                          {!isTrackPlaying && (
                            <svg className="w-3.5 h-3.5 hidden group-hover:block text-white" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M8 5v14l11-7z" />
                            </svg>
                          )}
                        </div>

                        {/* Column 2: Song Name & Artwork */}
                        <div
                          onClick={() => handlePlayTrack(track, idx)}
                          className="col-span-6 sm:col-span-5 flex items-center gap-3 min-w-0 pr-2 cursor-pointer"
                        >
                          {track.image && (
                            <img
                              src={track.image}
                              alt={track.name}
                              className="w-9 h-9 rounded-lg object-cover shrink-0 shadow-sm"
                              onError={(e) => {
                                e.target.style.display = 'none';
                              }}
                            />
                          )}
                          <div className="min-w-0">
                            <p className={`text-xs sm:text-sm font-semibold truncate ${
                              isTrackPlaying ? 'text-white' : 'text-slate-200 group-hover:text-white'
                            }`}>
                              {track.name}
                            </p>
                          </div>
                        </div>

                        {/* Column 3: Artist */}
                        <div
                          onClick={() => handlePlayTrack(track, idx)}
                          className="col-span-3 sm:col-span-4 min-w-0 cursor-pointer"
                        >
                          <p className="text-xs text-slate-400 group-hover:text-slate-300 truncate">
                            {track.artist}
                          </p>
                        </div>

                        {/* Column 4: Duration & Actions */}
                        <div className="col-span-2 flex items-center justify-end gap-2 text-right">
                          <span className="text-xs font-mono text-slate-400">
                            {formatSongDuration(track.duration)}
                          </span>

                          {/* YouTube Stream Badge Icon */}
                          <button
                            onClick={() => handlePlayTrack(track, idx)}
                            className="w-6 h-6 rounded-md bg-red-600/80 hover:bg-red-600 flex items-center justify-center text-white shrink-0 shadow transition-transform group-hover:scale-110 cursor-pointer"
                            title="Play Track"
                          >
                            <svg className="w-3 h-3 translate-x-0.2" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M8 5v14l11-7z" />
                            </svg>
                          </button>

                          {/* Remove Song Button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveTrackFromPlaylist(track.id);
                            }}
                            className="w-6 h-6 rounded-md bg-white/5 hover:bg-red-500/20 text-slate-400 hover:text-red-400 flex items-center justify-center text-xs transition cursor-pointer"
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
                        src={song.image || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=100&q=80'}
                        alt={song.name}
                        className="w-11 h-11 rounded-xl object-cover shrink-0 shadow-sm"
                        onError={(e) => {
                          e.target.src = 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=100&q=80';
                        }}
                      />
                      <div className="min-w-0">
                        <p className="text-xs sm:text-sm font-semibold text-white truncate">{song.name}</p>
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

    </div>
  );
};

export default PlaylistsPage;
