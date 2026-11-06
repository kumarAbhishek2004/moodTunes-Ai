import { useState } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config/api';

const POPULAR_SINGERS = [
  'Arijit Singh',
  'Jubin Nautiyal',
  'Atif Aslam',
  'AR Rahman',
  'Shreya Ghoshal',
  'Diljit Dosanjh',
  'Anuv Jain',
  'Prateek Kuhad',
  'The Weeknd',
];

const POPULAR_SONGS = [
  'Kesariya',
  'Raataan Lambiyan',
  'Ilahi',
  'Apna Bana Le',
  'Chaleya',
  'Tum Hi Ho',
  'Kabira',
  'Starboy',
];

const LANGUAGES = [
  { id: 'hindi', label: 'Hindi', flag: '🇮🇳' },
  { id: 'english', label: 'English', flag: '🌍' },
  { id: 'punjabi', label: 'Punjabi', flag: '✨' },
];

const PreferenceSelection = ({ mood, onPreferencesSet }) => {
  const moodKey = typeof mood === 'string' ? mood : mood?.mood || 'happy';

  const [language, setLanguage] = useState('hindi');
  const [favoriteArtists, setFavoriteArtists] = useState('');
  const [favoriteSongs, setFavoriteSongs] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [errors, setErrors] = useState({});

  // Search songs/artists via backend search endpoint
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/search-music`, {
        params: { query: searchQuery.trim(), limit: 6 },
      });
      setSearchResults(response.data.results || []);
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddArtist = (artistName) => {
    setFavoriteArtists((prev) => {
      const list = prev
        .split(',')
        .map((a) => a.trim())
        .filter(Boolean);
      if (!list.includes(artistName)) {
        return prev ? `${prev}, ${artistName}` : artistName;
      }
      return prev;
    });
  };

  const handleAddSong = (songName) => {
    setFavoriteSongs((prev) => {
      const list = prev
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      if (!list.includes(songName)) {
        return prev ? `${prev}, ${songName}` : songName;
      }
      return prev;
    });
  };

  const handleSelectFromSearch = (song) => {
    if (song.name) handleAddSong(song.name);
    if (song.artist) handleAddArtist(song.artist);
  };

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    const newErrors = {};

    if (!language) {
      newErrors.language = 'Please choose your preferred music language.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const preferences = {
      mood: moodKey.toLowerCase(),
      language: language.toLowerCase(),
      favoriteSongs: favoriteSongs
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      favoriteSingers: favoriteArtists
        .split(',')
        .map((a) => a.trim())
        .filter(Boolean),
      searchQuery: searchQuery.trim(),
      user_id: 'default',
    };

    onPreferencesSet(preferences);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fadeIn">
      {/* Header Banner */}
      <div className="relative rounded-3xl bg-slate-900/60 backdrop-blur-2xl border border-white/10 p-6 sm:p-8 shadow-2xl overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-32 bg-purple-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/15 border border-purple-500/30 text-purple-300 text-xs font-mono font-bold mb-3">
              <span>● STEP 2: PERSONALIZE YOUR ENGINE</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              Tell Us Your Musical Taste
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-2 max-w-xl leading-relaxed">
              We combine your detected <span className="text-purple-300 font-bold capitalize">{moodKey}</span> mood with your favorite singers, songs, and language for precision curation.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-obsidian-950/80 border border-white/10 text-center flex-shrink-0">
            <span className="block text-[10px] uppercase font-mono text-slate-400">Curated Playlist Quota</span>
            <span className="text-xl sm:text-2xl font-black text-white font-mono">20 Tracks</span>
            <span className="block text-[10px] text-emerald-400 font-mono mt-0.5">● Multi-Class Quota AI</span>
          </div>
        </div>
      </div>

      {/* Main 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: Singer, Song, Language Form */}
        <div className="lg:col-span-7 bg-slate-900/60 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 sm:p-7 shadow-xl space-y-6">
          {/* 1. SINGER / ARTIST NAME */}
          <div>
            <label className="block text-sm font-bold text-white mb-2 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <span>🎤</span>
                <span>Favorite Singer / Artist Name</span>
              </span>
              <span className="text-[11px] text-slate-400 font-normal">Optional (comma separated)</span>
            </label>
            <input
              type="text"
              value={favoriteArtists}
              onChange={(e) => setFavoriteArtists(e.target.value)}
              placeholder="E.g., Arijit Singh, Jubin Nautiyal, Atif Aslam"
              className="w-full bg-obsidian-950/80 text-white text-xs sm:text-sm px-4 py-3 rounded-xl border border-white/15 focus:outline-none focus:border-purple-500 placeholder:text-slate-500 transition-colors shadow-inner"
            />
            {/* Quick Chips */}
            <div className="flex flex-wrap gap-1.5 mt-2.5">
              <span className="text-[10px] text-slate-400 mr-1 self-center">Suggestions:</span>
              {POPULAR_SINGERS.slice(0, 6).map((singer) => (
                <button
                  key={singer}
                  type="button"
                  onClick={() => handleAddArtist(singer)}
                  className="text-[11px] px-2.5 py-0.5 rounded-full bg-white/5 hover:bg-purple-600/20 text-slate-300 hover:text-white border border-white/10 hover:border-purple-500/40 transition-all"
                >
                  + {singer}
                </button>
              ))}
            </div>
          </div>

          {/* 2. FAVORITE SONGS */}
          <div>
            <label className="block text-sm font-bold text-white mb-2 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <span>🎵</span>
                <span>Favorite Song(s)</span>
              </span>
              <span className="text-[11px] text-slate-400 font-normal">Optional (comma separated)</span>
            </label>
            <input
              type="text"
              value={favoriteSongs}
              onChange={(e) => setFavoriteSongs(e.target.value)}
              placeholder="E.g., Kesariya, Raataan Lambiyan, Ilahi"
              className="w-full bg-obsidian-950/80 text-white text-xs sm:text-sm px-4 py-3 rounded-xl border border-white/15 focus:outline-none focus:border-purple-500 placeholder:text-slate-500 transition-colors shadow-inner"
            />
            {/* Quick Chips */}
            <div className="flex flex-wrap gap-1.5 mt-2.5">
              <span className="text-[10px] text-slate-400 mr-1 self-center">Suggestions:</span>
              {POPULAR_SONGS.slice(0, 5).map((song) => (
                <button
                  key={song}
                  type="button"
                  onClick={() => handleAddSong(song)}
                  className="text-[11px] px-2.5 py-0.5 rounded-full bg-white/5 hover:bg-pink-600/20 text-slate-300 hover:text-white border border-white/10 hover:border-pink-500/40 transition-all"
                >
                  + {song}
                </button>
              ))}
            </div>
          </div>

          {/* 3. LANGUAGE PREFERENCE */}
          <div>
            <label className="block text-sm font-bold text-white mb-2 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <span className="text-red-400">*</span>
                <span>Select Music Language</span>
              </span>
              <span className="text-[11px] text-purple-300 font-mono">Mandatory</span>
            </label>

            <div className="grid grid-cols-3 gap-2.5">
              {LANGUAGES.map((lang) => {
                const isSelected = language.toLowerCase() === lang.id;
                return (
                  <button
                    key={lang.id}
                    type="button"
                    onClick={() => {
                      setLanguage(lang.id);
                      setErrors((prev) => ({ ...prev, language: '' }));
                    }}
                    className={`py-3 px-3 rounded-2xl border text-center transition-all flex flex-col items-center gap-1 ${
                      isSelected
                        ? 'bg-purple-600/25 border-purple-500 text-white font-bold shadow-lg shadow-purple-500/20'
                        : 'bg-obsidian-950/70 hover:bg-white/10 border-white/10 text-slate-300 hover:text-white'
                    }`}
                  >
                    <span className="text-xl">{lang.flag}</span>
                    <span className="text-xs font-semibold">{lang.label}</span>
                  </button>
                );
              })}
            </div>
            {errors.language && (
              <p className="text-xs text-rose-400 mt-2 font-mono">{errors.language}</p>
            )}
          </div>

          {/* Submit Action Button */}
          <div className="pt-2">
            <button
              onClick={handleSubmit}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-500 text-white font-bold text-sm tracking-wide uppercase shadow-[0_4px_25px_rgba(168,85,247,0.45)] hover:shadow-[0_6px_30px_rgba(168,85,247,0.65)] hover:scale-[1.02] active:scale-95 transition-all duration-300 flex items-center justify-center gap-2.5"
            >
              <span>🎧</span>
              <span>Generate Personalized Music Stream</span>
              <span>→</span>
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN: Live Search & Quick Add */}
        <div className="lg:col-span-5 bg-slate-900/60 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 sm:p-7 shadow-xl space-y-4">
          <div className="flex items-center gap-2.5 border-b border-white/10 pb-3">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan animate-pulse" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
              Search & Quick-Add Favorites
            </h3>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            Not sure what to type? Search any track or singer from the catalog and tap to automatically add them to your preferences:
          </p>

          {/* Search Box */}
          <div className="flex gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Search e.g. Arijit Singh, Kesariya..."
              className="flex-1 bg-obsidian-950/80 text-white text-xs px-3.5 py-2.5 rounded-xl border border-white/15 focus:outline-none focus:border-cyan placeholder:text-slate-500"
            />
            <button
              type="button"
              onClick={handleSearch}
              disabled={isSearching || !searchQuery.trim()}
              className="px-4 py-2.5 rounded-xl bg-cyan text-obsidian-950 font-bold text-xs hover:bg-cyan/90 transition-all disabled:opacity-40"
            >
              {isSearching ? '...' : 'Search'}
            </button>
          </div>

          {/* Search Results List */}
          <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
            {searchResults.length > 0 ? (
              searchResults.map((song) => (
                <div
                  key={song.id || song.youtube_id || song.name}
                  onClick={() => handleSelectFromSearch(song)}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-obsidian-950/70 hover:bg-white/10 border border-white/10 hover:border-cyan/40 transition-all cursor-pointer group"
                >
                  <div className="truncate pr-2">
                    <p className="text-xs font-bold text-white group-hover:text-cyan truncate">
                      {song.name}
                    </p>
                    <p className="text-[11px] text-slate-400 truncate">{song.artist}</p>
                  </div>
                  <span className="text-[10px] font-mono text-cyan px-2 py-0.5 rounded bg-cyan/10 border border-cyan/20 flex-shrink-0">
                    + Add
                  </span>
                </div>
              ))
            ) : searchQuery && !isSearching ? (
              <p className="text-center text-xs text-slate-500 py-6">
                No matching tracks found for &quot;{searchQuery}&quot;.
              </p>
            ) : (
              <div className="p-4 rounded-2xl bg-obsidian-950/40 border border-white/5 text-center text-slate-500 text-xs">
                <span>💡 Tip: Click any search result to auto-populate your favorite singers and songs.</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PreferenceSelection;
