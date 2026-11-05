import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../config/api';
import { playSong, setQueue, setActiveMood } from '../store/audioSlice';
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
    image: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=120&auto=format&fit=crop&q=80',
  },
  {
    rank: 2,
    id: 'trend-2',
    name: 'Apna Bana Le',
    artist: 'Arijit Singh',
    youtube_id: 'ElZfdU54Cp8',
    mood_match: 'Calm',
    ai_explanation: 'Top trending acoustic ballad across Hindi & Indie streaming charts',
    duration: 261,
    plays: '315.2M',
    image: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=120&auto=format&fit=crop&q=80',
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
    image: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=120&auto=format&fit=crop&q=80',
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
    image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=120&auto=format&fit=crop&q=80',
  },
  {
    rank: 5,
    id: 'trend-5',
    name: 'Tum Hi Ho',
    artist: 'Arijit Singh',
    youtube_id: 'IJq0yyWug1k',
    mood_match: 'Reflective',
    ai_explanation: 'Iconic soulful ballad with emotional piano progression',
    duration: 262,
    plays: '680.1M',
    image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=120&auto=format&fit=crop&q=80',
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
    image: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=120&auto=format&fit=crop&q=80',
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
    image: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=120&auto=format&fit=crop&q=80',
  },
  {
    rank: 8,
    id: 'trend-8',
    name: 'Agar Tum Saath Ho',
    artist: 'Alka Yagnik, Arijit Singh',
    youtube_id: 'sK7riqg2mr4',
    mood_match: 'Reflective',
    ai_explanation: 'Deep melancholic resonance with soaring strings arrangement',
    duration: 341,
    plays: '490.2M',
    image: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=120&auto=format&fit=crop&q=80',
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
  const { currentSong, isPlaying } = useSelector((state) => state.audio);

  const [trendingTracks, setTrendingTracks] = useState(TRENDING_SEEDS);
  const [activeCategoryLoading, setActiveCategoryLoading] = useState(null);

  const handlePlayCategory = async (tile) => {
    setActiveCategoryLoading(tile.id);
    try {
      const res = await axios.post(`${API_BASE_URL}/api/recommendations`, {
        mood: tile.mood,
        limit: 20,
        user_id: 'default',
      });
      const songs = res.data.recommendations || [];
      if (songs.length > 0) {
        dispatch(setActiveMood(tile.mood));
        dispatch(setQueue(songs));
        dispatch(playSong(songs[0]));
        try {
          localStorage.setItem('recommendations', JSON.stringify(songs));
        } catch (e) {}
      }
    } catch (e) {
      console.error('Error curating category stream:', e);
    } finally {
      setActiveCategoryLoading(null);
    }
  };

  const handlePlayTrendingSong = (song) => {
    dispatch(setQueue(trendingTracks));
    dispatch(playSong(song));
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 py-6 md:py-8 max-w-7xl animate-fadeIn">
      {/* Header Banner */}
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan/15 text-cyan border border-cyan/30 text-xs font-mono font-bold mb-3">
          <span>● GLOBAL DISCOVERY HUB</span>
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
            return (
              <div
                key={tile.id}
                onClick={() => handlePlayCategory(tile)}
                className={`group relative overflow-hidden rounded-3xl bg-gradient-to-br ${tile.gradient} border ${tile.border} p-6 shadow-xl hover:shadow-2xl hover:scale-[1.02] active:scale-[0.99] transition-all cursor-pointer flex flex-col justify-between min-h-[180px]`}
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

                  <div className="w-8 h-8 rounded-full bg-cyan text-obsidian-950 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                    {isLoading ? (
                      <div className="w-3.5 h-3.5 border-2 border-obsidian-950 border-t-transparent rounded-full animate-spin" />
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
          <div className="col-span-2">Fidelity</div>
          <div className="col-span-1 text-center">Time</div>
          <div className="col-span-1 text-right">Actions</div>
        </div>

        {/* Rows */}
        <div className="divide-y divide-obsidian-850/50 mt-1">
          {trendingTracks.map((song) => {
            const isCurrent =
              currentSong &&
              (currentSong.id === song.id ||
                (currentSong.name === song.name && currentSong.artist === song.artist));

            return (
              <div
                key={song.id}
                onClick={() => handlePlayTrendingSong(song)}
                className={`group flex md:grid md:grid-cols-12 items-center gap-3 md:gap-4 px-3 py-3 rounded-xl transition-all cursor-pointer ${
                  isCurrent
                    ? 'bg-cyan/10 border border-cyan/30'
                    : 'hover:bg-obsidian-800/60 border border-transparent hover:border-obsidian-750/50'
                }`}
              >
                {/* Rank / Play Icon */}
                <div className="w-7 md:w-auto md:col-span-1 flex items-center justify-center flex-shrink-0">
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
                </div>

                {/* Track Details */}
                <div className="flex items-center gap-3 min-w-0 flex-1 md:col-span-5">
                  <img
                    src={song.image}
                    alt={song.name}
                    className="w-11 h-11 rounded-lg object-cover bg-obsidian-800 flex-shrink-0"
                    onError={(e) => {
                      e.target.src =
                        'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=100&auto=format&fit=crop&q=80';
                    }}
                  />
                  <div className="min-w-0">
                    <p
                      className={`text-xs sm:text-sm font-semibold truncate ${
                        isCurrent ? 'text-cyan' : 'text-white group-hover:text-cyan transition-colors'
                      }`}
                    >
                      {song.name}
                    </p>
                    <p className="text-xs text-slate-400 truncate">{song.artist}</p>
                  </div>
                </div>

                {/* Plays */}
                <div className="hidden md:block md:col-span-2 font-mono text-xs text-slate-300">
                  {song.plays}
                </div>

                {/* Fidelity Badge */}
                <div className="hidden md:block md:col-span-2">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald/10 border border-emerald/25 text-emerald text-[11px] font-mono font-semibold">
                    <span>●</span>
                    <span>Parallel HD</span>
                  </span>
                </div>

                {/* Duration */}
                <div className="hidden md:block md:col-span-1 text-center font-mono text-xs text-slate-400">
                  {formatDuration(song.duration)}
                </div>

                {/* Actions */}
                <div
                  className="flex items-center justify-end gap-2 md:col-span-1 flex-shrink-0"
                  onClick={(e) => e.stopPropagation()}
                >
                  <AddToPlaylistButton song={song} compact={true} />
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
