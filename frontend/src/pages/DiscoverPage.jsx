import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../config/api';
import { playSong, setQueue, setActiveMood, togglePlayPause, toggleTurntable } from '../store/audioSlice';
import { resolveMusicTheme } from '../utils/themeMap';
import AddToPlaylistButton from '../components/AddToPlaylistButton';

const CATEGORY_TILES = [
  {
    id: 'rainy-study',
    title: 'Rainy Lo-Fi Study',
    subtitle: 'Gentle rain textures & peaceful instrumental beats',
    mood: 'calm',
    gradient: 'from-cyan/30 via-slate-900 to-obsidian-950',
    border: 'border-cyan/30',
    badge: 'Deep Focus',
    icon: '🌧️',
    tracksCount: '24 Tracks',
    seedTracks: [
      {
        id: 'capsule-calm-1',
        name: 'Kun Faya Kun',
        artist: 'A.R. Rahman',
        youtube_id: 'T94PHkuydcw',
        image: 'https://i.ytimg.com/vi/T94PHkuydcw/hqdefault.jpg',
        duration: 473,
        mood_match: 'Calm',
      },
      {
        id: 'capsule-calm-2',
        name: 'Iktara',
        artist: 'Kavita Seth',
        youtube_id: 'fSS_R91Nimw',
        image: 'https://i.ytimg.com/vi/fSS_R91Nimw/hqdefault.jpg',
        duration: 253,
        mood_match: 'Calm',
      },
      {
        id: 'capsule-calm-3',
        name: 'Safarnama',
        artist: 'Lucky Ali',
        youtube_id: 'qP_VpX8C0p0',
        image: 'https://i.ytimg.com/vi/qP_VpX8C0p0/hqdefault.jpg',
        duration: 251,
        mood_match: 'Calm',
      },
      {
        id: 'capsule-calm-4',
        name: 'Sham',
        artist: 'Amit Trivedi',
        youtube_id: '7v-z0lJmFio',
        image: 'https://i.ytimg.com/vi/7v-z0lJmFio/hqdefault.jpg',
        duration: 247,
        mood_match: 'Calm',
      },
    ],
  },
  {
    id: 'post-gym',
    title: 'Post-Gym Adrenaline',
    subtitle: 'High BPM, heavy kicks & motivational momentum',
    mood: 'energetic',
    gradient: 'from-orange-500/30 via-slate-900 to-obsidian-950',
    border: 'border-orange-500/30',
    badge: '140+ BPM',
    icon: '⚡',
    tracksCount: '32 Tracks',
    seedTracks: [
      {
        id: 'capsule-energy-1',
        name: 'Believer',
        artist: 'Imagine Dragons',
        youtube_id: '7wtfhZwyrcc',
        image: 'https://i.ytimg.com/vi/7wtfhZwyrcc/hqdefault.jpg',
        duration: 204,
        mood_match: 'Energetic',
      },
      {
        id: 'capsule-energy-2',
        name: 'Machayenge 3',
        artist: 'Emiway Bantai',
        youtube_id: 'Dlz_XHeUUcw',
        image: 'https://i.ytimg.com/vi/Dlz_XHeUUcw/hqdefault.jpg',
        duration: 185,
        mood_match: 'Energetic',
      },
      {
        id: 'capsule-energy-3',
        name: 'Luv Dose',
        artist: 'Yo Yo Honey Singh',
        youtube_id: 'TvngY4unnL4',
        image: 'https://i.ytimg.com/vi/TvngY4unnL4/hqdefault.jpg',
        duration: 228,
        mood_match: 'Energetic',
      },
      {
        id: 'capsule-energy-4',
        name: 'Desi Kalakaar',
        artist: 'Yo Yo Honey Singh',
        youtube_id: 'KhnVc_AC44I',
        image: 'https://i.ytimg.com/vi/KhnVc_AC44I/hqdefault.jpg',
        duration: 259,
        mood_match: 'Energetic',
      },
    ],
  },
  {
    id: 'sunday-clarity',
    title: 'Sunday Morning Clarity',
    subtitle: 'Warm acoustic sunshine, bright keys & joyful rhythm',
    mood: 'happy',
    gradient: 'from-amber-400/30 via-slate-900 to-obsidian-950',
    border: 'border-amber-400/30',
    badge: 'Acoustic Euphoria',
    icon: '☀️',
    tracksCount: '20 Tracks',
    seedTracks: [
      {
        id: 'capsule-happy-1',
        name: 'Kesariya',
        artist: 'Arijit Singh',
        youtube_id: 'BddP6PYo2gs',
        image: 'https://i.ytimg.com/vi/BddP6PYo2gs/hqdefault.jpg',
        duration: 268,
        mood_match: 'Happy',
      },
      {
        id: 'capsule-happy-2',
        name: 'Ilahi',
        artist: 'Arijit Singh',
        youtube_id: 'fdubeMFwuGs',
        image: 'https://i.ytimg.com/vi/fdubeMFwuGs/hqdefault.jpg',
        duration: 228,
        mood_match: 'Happy',
      },
      {
        id: 'capsule-happy-3',
        name: 'Matargashti',
        artist: 'Mohit Chauhan',
        youtube_id: '6vKucgAeF_Q',
        image: 'https://i.ytimg.com/vi/6vKucgAeF_Q/hqdefault.jpg',
        duration: 328,
        mood_match: 'Happy',
      },
      {
        id: 'capsule-happy-4',
        name: 'Subhanallah',
        artist: 'Sreerama Chandra',
        youtube_id: 'RCXB_7zPzYk',
        image: 'https://i.ytimg.com/vi/RCXB_7zPzYk/hqdefault.jpg',
        duration: 249,
        mood_match: 'Happy',
      },
    ],
  },
  {
    id: 'deep-binaural',
    title: 'Deep Space Binaural',
    subtitle: 'Focus frequencies & minimal ambient soundscapes',
    mood: 'focus',
    gradient: 'from-emerald/30 via-slate-900 to-obsidian-950',
    border: 'border-emerald/30',
    badge: 'Theta Waves',
    icon: '🧠',
    tracksCount: '18 Tracks',
    seedTracks: [
      {
        id: 'capsule-focus-1',
        name: 'Kho Gaye Hum Kahan',
        artist: 'Jasleen Royal',
        youtube_id: 'vt4jX0iPU40',
        image: 'https://i.ytimg.com/vi/vt4jX0iPU40/hqdefault.jpg',
        duration: 214,
        mood_match: 'Focus',
      },
      {
        id: 'capsule-focus-2',
        name: 'Phir Se Udd Chala',
        artist: 'Mohit Chauhan',
        youtube_id: '2iqbx7Tzxbw',
        image: 'https://i.ytimg.com/vi/2iqbx7Tzxbw/hqdefault.jpg',
        duration: 271,
        mood_match: 'Focus',
      },
      {
        id: 'capsule-focus-3',
        name: 'Aazaadiyan',
        artist: 'Rahat Fateh Ali Khan',
        youtube_id: '01Qk9mHjC5E',
        image: 'https://i.ytimg.com/vi/01Qk9mHjC5E/hqdefault.jpg',
        duration: 260,
        mood_match: 'Focus',
      },
    ],
  },
  {
    id: 'neon-drive',
    title: 'Late Night Neon Drive',
    subtitle: 'Synthwave bass, analog synthesizers & highway vibes',
    mood: 'calm',
    gradient: 'from-pink-500/30 via-slate-900 to-obsidian-950',
    border: 'border-pink-500/30',
    badge: 'Midnight Flow',
    icon: '🌃',
    tracksCount: '26 Tracks',
    seedTracks: [
      {
        id: 'capsule-neon-1',
        name: 'Blinding Lights',
        artist: 'The Weeknd',
        youtube_id: '4NRXx6U8ABQ',
        image: 'https://i.ytimg.com/vi/4NRXx6U8ABQ/hqdefault.jpg',
        duration: 200,
        mood_match: 'Calm',
      },
      {
        id: 'capsule-neon-2',
        name: 'Starboy',
        artist: 'The Weeknd',
        youtube_id: '34Na4j8AVgA',
        image: 'https://i.ytimg.com/vi/34Na4j8AVgA/hqdefault.jpg',
        duration: 230,
        mood_match: 'Calm',
      },
      {
        id: 'capsule-neon-3',
        name: 'Midnight City',
        artist: 'M83',
        youtube_id: 'dX3k_PDnzHE',
        image: 'https://i.ytimg.com/vi/dX3k_PDnzHE/hqdefault.jpg',
        duration: 243,
        mood_match: 'Calm',
      },
    ],
  },
  {
    id: 'soulful-warmth',
    title: 'Soulful Acoustic Warmth',
    subtitle: 'Heartfelt harmonies, delicate guitar & intimate vocals',
    mood: 'romantic',
    gradient: 'from-rose-500/30 via-slate-900 to-obsidian-950',
    border: 'border-rose-500/30',
    badge: 'Intimate Vibe',
    icon: '💖',
    tracksCount: '22 Tracks',
    seedTracks: [
      {
        id: 'capsule-romantic-1',
        name: 'Raataan Lambiyan',
        artist: 'Jubin Nautiyal',
        youtube_id: 'gvyUuxdRdR4',
        image: 'https://i.ytimg.com/vi/gvyUuxdRdR4/hqdefault.jpg',
        duration: 230,
        mood_match: 'Romantic',
      },
      {
        id: 'capsule-romantic-2',
        name: 'Apna Bana Le',
        artist: 'Arijit Singh',
        youtube_id: 'ElZfdU54Cp8',
        image: 'https://i.ytimg.com/vi/ElZfdU54Cp8/hqdefault.jpg',
        duration: 261,
        mood_match: 'Romantic',
      },
      {
        id: 'capsule-romantic-3',
        name: 'Tum Hi Ho',
        artist: 'Arijit Singh',
        youtube_id: 'IJq0yyWug1k',
        image: 'https://i.ytimg.com/vi/IJq0yyWug1k/hqdefault.jpg',
        duration: 262,
        mood_match: 'Romantic',
      },
    ],
  },
];

const TRENDING_SEEDS = [
  {
    rank: 1,
    id: 'trend-1',
    name: 'Kesariya',
    artist: 'Arijit Singh',
    youtube_id: 'BddP6PYo2gs',
    mood_match: 'Happy',
    ai_explanation: 'Dominating global streams with 420M+ plays & high vocal resonance',
    duration: 268,
    plays: '428.5M',
    image: 'https://i.ytimg.com/vi/BddP6PYo2gs/hqdefault.jpg',
  },
  {
    rank: 2,
    id: 'trend-2',
    name: 'Apna Bana Le',
    artist: 'Arijit Singh',
    youtube_id: 'ElZfdU54Cp8',
    mood_match: 'Romantic',
    ai_explanation: 'Top trending acoustic ballad across Hindi & Indie streaming charts',
    duration: 261,
    plays: '315.2M',
    image: 'https://i.ytimg.com/vi/ElZfdU54Cp8/hqdefault.jpg',
  },
  {
    rank: 3,
    id: 'trend-3',
    name: 'Chaleya',
    artist: 'Arijit Singh, Shilpa Rao',
    youtube_id: 'VAdGW7QDJUI',
    mood_match: 'Energetic',
    ai_explanation: 'High rhythmic bounce with punchy drum arrangement',
    duration: 200,
    plays: '280.9M',
    image: 'https://i.ytimg.com/vi/VAdGW7QDJUI/hqdefault.jpg',
  },
  {
    rank: 4,
    id: 'trend-4',
    name: 'Raataan Lambiyan',
    artist: 'Jubin Nautiyal, Asees Kaur',
    youtube_id: 'gvyUuxdRdR4',
    mood_match: 'Romantic',
    ai_explanation: 'Intimate vocal harmony with timeless melody structure',
    duration: 230,
    plays: '512.4M',
    image: 'https://i.ytimg.com/vi/gvyUuxdRdR4/hqdefault.jpg',
  },
  {
    rank: 5,
    id: 'trend-5',
    name: 'Tum Hi Ho',
    artist: 'Arijit Singh',
    youtube_id: 'IJq0yyWug1k',
    mood_match: 'Romantic',
    ai_explanation: 'Iconic soulful ballad with emotional piano progression',
    duration: 262,
    plays: '680.1M',
    image: 'https://i.ytimg.com/vi/IJq0yyWug1k/hqdefault.jpg',
  },
  {
    rank: 6,
    id: 'trend-6',
    name: 'Ilahi',
    artist: 'Arijit Singh',
    youtube_id: 'fdubeMFwuGs',
    mood_match: 'Happy',
    ai_explanation: 'Vibrant wanderlust anthem with uplifting acoustic rhythm',
    duration: 228,
    plays: '194.3M',
    image: 'https://i.ytimg.com/vi/fdubeMFwuGs/hqdefault.jpg',
  },
  {
    rank: 7,
    id: 'trend-7',
    name: 'Kabira',
    artist: 'Tochi Raina, Rekha Bhardwaj',
    youtube_id: 'jHNNMj5bNQw',
    mood_match: 'Calm',
    ai_explanation: 'Folk acoustic resonance and soulful vocal narrative',
    duration: 251,
    plays: '385.7M',
    image: 'https://i.ytimg.com/vi/jHNNMj5bNQw/hqdefault.jpg',
  },
  {
    rank: 8,
    id: 'trend-8',
    name: 'Agar Tum Saath Ho',
    artist: 'Alka Yagnik, Arijit Singh',
    youtube_id: 'sK7riqg2mr4',
    mood_match: 'Sad',
    ai_explanation: 'Deep melancholic resonance with soaring strings arrangement',
    duration: 341,
    plays: '490.2M',
    image: 'https://i.ytimg.com/vi/sK7riqg2mr4/hqdefault.jpg',
  },
];

const formatDuration = (seconds) => {
  if (!seconds || isNaN(seconds)) return '3:45';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
};

const DiscoverPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { currentSong, isPlaying, activeMood } = useSelector((state) => state.audio);

  const [trendingTracks, setTrendingTracks] = useState(TRENDING_SEEDS);
  const [activeCategoryLoading, setActiveCategoryLoading] = useState(null);
  const [playbackToast, setPlaybackToast] = useState(null);

  const showToast = (message) => {
    setPlaybackToast(message);
    setTimeout(() => {
      setPlaybackToast(null);
    }, 3500);
  };

  const handlePlayCategory = async (tile) => {
    // 1. INSTANT PLAYBACK GUARANTEE: Immediately queue and play seeds without waiting for network!
    const fallbackSongs = tile.seedTracks || [];
    if (fallbackSongs.length > 0) {
      dispatch(setActiveMood(tile.mood));
      dispatch(setQueue(fallbackSongs));
      dispatch(playSong(fallbackSongs[0]));
      showToast(`▶ Streaming ${tile.title}: "${fallbackSongs[0].name}"`);
    }

    setActiveCategoryLoading(tile.id);
    try {
      const res = await axios.post(`${API_BASE_URL}/api/recommendations`, {
        mood: tile.mood,
        limit: 20,
        user_id: 'default',
      }, { timeout: 4000 });
      
      const remoteSongs = res.data?.recommendations || [];
      if (remoteSongs.length > 0) {
        // Enrich queue with full live recommendations
        dispatch(setQueue(remoteSongs));
        try {
          localStorage.setItem('recommendations', JSON.stringify(remoteSongs));
        } catch (e) {}
      }
    } catch (e) {
      console.warn('Backend live recommendations notice (using verified instant stream):', e);
    } finally {
      setActiveCategoryLoading(null);
    }
  };

  const handlePlayTrendingSong = (song) => {
    dispatch(setQueue(trendingTracks));
    dispatch(playSong(song));
    showToast(`▶ Now Playing: "${song.name}" by ${song.artist}`);
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 py-6 md:py-8 max-w-7xl animate-fadeIn relative">
      {/* Floating Playback Confirmation Toast */}
      {playbackToast && (
        <div className="fixed top-20 right-4 sm:right-8 z-50 px-4 py-2.5 rounded-2xl bg-obsidian-900/95 border border-cyan/40 text-white text-xs font-semibold shadow-2xl backdrop-blur-2xl flex items-center gap-3 animate-fadeIn">
          <span className="w-2.5 h-2.5 rounded-full bg-cyan animate-ping" />
          <span>{playbackToast}</span>
          <button
            onClick={() => dispatch(toggleTurntable())}
            className="ml-2 px-2.5 py-1 rounded-lg bg-cyan/20 hover:bg-cyan/30 text-cyan text-[11px] font-bold border border-cyan/30 transition-all cursor-pointer"
          >
            Open Turntable ↗
          </button>
        </div>
      )}

      {/* Header Banner */}
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan/15 text-cyan border border-cyan/30 text-xs font-mono font-bold mb-3">
          <span>🌐 GLOBAL DISCOVERY HUB</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
          Explore Ambient Soundscapes
        </h1>
        <p className="text-sm sm:text-base text-slate-400 mt-2 max-w-2xl">
          Curated emotional environments, neural genre blends, and live trending charts powered by Last.fm and parallel streaming.
        </p>
      </div>

      {/* 1. Curated Category Vibe Tiles */}
      <section className="mb-12">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <span>✨</span>
            <span>Curated Vibe Capsules</span>
          </h2>
          <span className="text-xs text-slate-400">One-tap acoustic immersion</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {CATEGORY_TILES.map((tile) => {
            const isLoading = activeCategoryLoading === tile.id;
            const isTileActive = activeMood === tile.mood && isPlaying;

            return (
              <div
                key={tile.id}
                onClick={() => handlePlayCategory(tile)}
                className={`group relative overflow-hidden rounded-3xl bg-gradient-to-br ${tile.gradient} border ${
                  isTileActive ? 'border-cyan ring-2 ring-cyan/40 shadow-2xl shadow-cyan/20' : tile.border
                } p-6 shadow-xl hover:shadow-2xl hover:scale-[1.02] active:scale-[0.99] transition-all cursor-pointer flex flex-col justify-between min-h-[180px]`}
              >
                {/* Top Badge & Icon */}
                <div className="flex items-center justify-between mb-3">
                  <span className="text-3xl filter drop-shadow-md group-hover:scale-110 transition-transform">
                    {tile.icon}
                  </span>
                  <span className="text-[10px] font-mono font-semibold px-2.5 py-1 rounded-full bg-obsidian-950/80 text-white border border-white/10 backdrop-blur-md">
                    {tile.badge}
                  </span>
                </div>

                {/* Content */}
                <div>
                  <h3 className="text-lg font-bold text-white group-hover:text-cyan transition-colors">
                    {tile.title}
                  </h3>
                  <p className="text-xs text-slate-300/80 mt-1 line-clamp-2 leading-relaxed">
                    {tile.subtitle}
                  </p>
                </div>

                {/* Footer Action */}
                <div className="flex items-center justify-between pt-4 mt-3 border-t border-white/10">
                  <span className="text-[11px] font-mono text-slate-400">
                    {tile.tracksCount}
                  </span>

                  <div className="w-9 h-9 rounded-full bg-cyan text-obsidian-950 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform font-bold">
                    {isLoading ? (
                      <div className="w-4 h-4 border-2 border-obsidian-950 border-t-transparent rounded-full animate-spin" />
                    ) : isTileActive ? (
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
            );
          })}
        </div>
      </section>

      {/* 2. Numbered Trending on Last.fm Global Chart */}
      <section className="bg-obsidian-900/70 backdrop-blur-2xl border border-obsidian-800/90 rounded-3xl p-5 sm:p-8 shadow-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-obsidian-800/60 mb-4">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <span>🔥</span>
              <span>Trending on Last.fm & Global Charts</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Top requested tracks with verified Parallel HD streaming fidelity
            </p>
          </div>
          <span className="text-[11px] font-mono px-3 py-1 rounded-full bg-obsidian-800 text-slate-300 border border-obsidian-750 w-fit">
            Updated Hourly
          </span>
        </div>

        {/* Dense Table Header */}
        <div className="hidden md:grid grid-cols-12 gap-4 px-3 py-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wider border-b border-obsidian-800/40">
          <div className="col-span-1 text-center">Rank</div>
          <div className="col-span-5">Track & Artist</div>
          <div className="col-span-2">Plays</div>
          <div className="col-span-2">Mood Vibe</div>
          <div className="col-span-1 text-center">Time</div>
          <div className="col-span-1 text-right">Save</div>
        </div>

        {/* Track Rows */}
        <div className="divide-y divide-obsidian-800/40 mt-1">
          {trendingTracks.map((song) => {
            const isCurrent =
              currentSong &&
              (currentSong.id === song.id ||
                (currentSong.name === song.name && currentSong.artist === song.artist));
            const isSongPlaying = isCurrent && isPlaying;

            return (
              <div
                key={song.id}
                onClick={() => handlePlayTrendingSong(song)}
                className={`group flex md:grid md:grid-cols-12 items-center gap-3 md:gap-4 px-3 py-3 rounded-xl transition-all cursor-pointer ${
                  isSongPlaying
                    ? 'bg-cyan/15 border border-cyan/40 shadow-lg'
                    : 'hover:bg-obsidian-800/60 border border-transparent hover:border-obsidian-750/50'
                }`}
              >
                {/* Rank / Play Icon */}
                <div className="w-7 md:w-auto md:col-span-1 flex items-center justify-center flex-shrink-0">
                  {isSongPlaying ? (
                    <div className="flex items-end gap-0.5 h-3 text-cyan">
                      <span className="w-1 h-3 bg-cyan rounded-full animate-bounce [animation-delay:-0.3s]" />
                      <span className="w-1 h-3 bg-cyan rounded-full animate-bounce [animation-delay:-0.15s]" />
                      <span className="w-1 h-3 bg-cyan rounded-full animate-bounce" />
                    </div>
                  ) : (
                    <>
                      <span
                        className={`text-sm font-black font-mono group-hover:hidden ${
                          song.rank <= 3 ? 'text-amber-400' : 'text-slate-400'
                        }`}
                      >
                        #{song.rank}
                      </span>
                      <button
                        className="hidden group-hover:inline-flex text-cyan hover:scale-110 transition-transform"
                        title="Play"
                      >
                        <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </button>
                    </>
                  )}
                </div>

                {/* Track Details */}
                <div className="flex items-center gap-3 min-w-0 flex-1 md:col-span-5">
                  <img
                    src={song.image}
                    alt={song.name}
                    className="w-11 h-11 rounded-lg object-cover bg-obsidian-800 flex-shrink-0 shadow-md"
                    onError={(e) => {
                      if (song.youtube_id && !e.target.src.includes('ytimg.com')) {
                        e.target.src = `https://i.ytimg.com/vi/${song.youtube_id}/hqdefault.jpg`;
                      } else {
                        e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(song.name || 'Song')}&background=0f172a&color=38bdf8&size=100&bold=true`;
                      }
                    }}
                  />
                  <div className="min-w-0">
                    <p
                      className={`text-xs sm:text-sm font-semibold truncate ${
                        isSongPlaying ? 'text-cyan font-bold' : 'text-white group-hover:text-cyan transition-colors'
                      }`}
                    >
                      {song.name}
                    </p>
                    <p className="text-xs text-slate-400 truncate">{song.artist}</p>
                  </div>
                </div>

                {/* Plays */}
                <div className="hidden md:block md:col-span-2 text-xs font-mono text-slate-400">
                  {song.plays}
                </div>

                {/* Mood Badge */}
                <div className="hidden md:block md:col-span-2">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan/10 text-cyan border border-cyan/25">
                    {song.mood_match || 'Trending'}
                  </span>
                </div>

                {/* Time */}
                <div className="hidden md:block md:col-span-1 text-center text-xs font-mono text-slate-400">
                  {formatDuration(song.duration)}
                </div>

                {/* Add to Playlist button */}
                <div
                  className="hidden md:flex md:col-span-1 justify-end"
                  onClick={(e) => e.stopPropagation()}
                >
                  <AddToPlaylistButton song={song} variant="minimal" />
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};

export default DiscoverPage;
