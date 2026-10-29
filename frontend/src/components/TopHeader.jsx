import { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../config/api';
import { playSong } from '../store/audioSlice';
import { logout } from '../store/authSlice';

const getTimeGreeting = () => {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'Good Morning';
  if (hour >= 12 && hour < 17) return 'Good Afternoon';
  if (hour >= 17 && hour < 22) return 'Good Evening';
  return 'Late Night Session';
};

const getContextVibe = (activeMood) => {
  const hour = new Date().getHours();
  if (hour >= 22 || hour < 5) return '🌙 18°C • Deep Focus & Lo-Fi';
  if (hour >= 5 && hour < 12) return '🌅 21°C • Morning Clarity';
  if (hour >= 12 && hour < 17) return '☀️ 25°C • Afternoon Drive';
  return `⛅ 20°C • ${activeMood ? activeMood.charAt(0).toUpperCase() + activeMood.slice(1) : 'Calm'} Evening Vibe`;
};

const TopHeader = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const activeMood = useSelector((state) => state.audio.activeMood) || 'calm';

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const searchContainerRef = useRef(null);
  const profileContainerRef = useRef(null);
  const searchInputRef = useRef(null);

  const greeting = getTimeGreeting();
  const vibePill = getContextVibe(activeMood);
  const displayName = user?.full_name ? user.full_name.split(' ')[0] : 'Explorer';

  // Global Ctrl+K / Cmd+K shortcut to focus search
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
        setIsDropdownOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setIsDropdownOpen(false);
      }
      if (profileContainerRef.current && !profileContainerRef.current.contains(e.target)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const response = await axios.get(`${API_BASE_URL}/search-music`, {
          params: { query: searchQuery.trim(), limit: 8 },
        });
        setSearchResults(response.data.results || []);
        setIsDropdownOpen(true);
      } catch (err) {
        console.error('Search failed:', err);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSelectSong = (song) => {
    dispatch(playSong(song));
    setIsDropdownOpen(false);
    setSearchQuery('');
  };

  const handleLogout = () => {
    dispatch(logout());
    setIsProfileOpen(false);
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-20 w-full bg-obsidian-950/70 backdrop-blur-xl border-b border-obsidian-800/60 px-4 sm:px-6 py-3.5 transition-all">
      <div className="flex items-center justify-between gap-4">
        {/* Left: Dynamic Personalized Greeting & Weather Context */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="hidden sm:block">
            <h1 className="text-sm md:text-base font-semibold text-white tracking-tight flex items-center gap-1.5 truncate">
              <span>{greeting},</span>
              <span className="text-cyan font-bold">{displayName}</span>
              <span className="inline-block animate-wave">👋</span>
            </h1>
          </div>

          {/* Context Weather Vibe Pill */}
          <div
            className="flex items-center gap-2 px-3 py-1 rounded-full bg-obsidian-900/90 border border-obsidian-750/70 text-slate-300 text-xs shadow-inner cursor-default hover:border-cyan/30 transition-colors"
            title="Real-time context and ambient tuning"
          >
            <span className="truncate max-w-[210px] sm:max-w-none">{vibePill}</span>
          </div>
        </div>

        {/* Center / Right: Instant Search Bar */}
        <div ref={searchContainerRef} className="relative flex-1 max-w-md hidden md:block">
          <div className="relative flex items-center">
            <svg
              className="absolute left-3.5 w-4 h-4 text-slate-400 pointer-events-none"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => {
                if (searchResults.length > 0) setIsDropdownOpen(true);
              }}
              placeholder="Search tracks, artists, moods..."
              className="w-full bg-obsidian-900/90 text-white text-xs sm:text-sm pl-10 pr-16 py-2 rounded-xl border border-obsidian-800 focus:outline-none focus:border-cyan/60 focus:ring-1 focus:ring-cyan/40 transition-all placeholder:text-slate-500"
            />
            {isSearching ? (
              <div className="absolute right-3.5 w-4 h-4 border-2 border-cyan border-t-transparent rounded-full animate-spin" />
            ) : (
              <span className="absolute right-2.5 hidden sm:inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono font-medium text-slate-400 bg-obsidian-800 border border-obsidian-700">
                ⌘K
              </span>
            )}
          </div>

          {/* Search Results Dropdown */}
          {isDropdownOpen && searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-obsidian-900/95 backdrop-blur-2xl border border-obsidian-750/90 rounded-2xl shadow-2xl shadow-black/80 overflow-hidden z-50 animate-fadeIn">
              <div className="p-2 border-b border-obsidian-800/80 flex items-center justify-between text-[11px] text-slate-400 px-3">
                <span>Top Results</span>
                <span>Click track to play</span>
              </div>
              <div className="max-h-80 overflow-y-auto custom-scrollbar p-1.5 space-y-1">
                {searchResults.map((song) => (
                  <div
                    key={song.id || `${song.name}-${song.artist}`}
                    onClick={() => handleSelectSong(song)}
                    className="flex items-center gap-3 p-2 rounded-xl hover:bg-obsidian-800/80 transition-colors cursor-pointer group"
                  >
                    <img
                      src={song.image || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=80&auto=format&fit=crop&q=80'}
                      alt={song.name}
                      className="w-10 h-10 rounded-lg object-cover bg-obsidian-800 flex-shrink-0"
                      onError={(e) => {
                        e.target.src = 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=80&auto=format&fit=crop&q=80';
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white group-hover:text-cyan transition-colors truncate">
                        {song.name}
                      </p>
                      <p className="text-xs text-slate-400 truncate">{song.artist}</p>
                    </div>
                    {song.genre && (
                      <span className="text-[10px] font-mono text-slate-400 px-2 py-0.5 rounded bg-obsidian-800/60 border border-obsidian-700/50">
                        {song.genre}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: Quick Action & Profile Avatar */}
        <div className="flex items-center gap-3">
          {/* Quick Scanner Shortcut Button */}
          <button
            onClick={() => navigate('/mood-detection')}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan/10 hover:bg-cyan/20 border border-cyan/30 text-cyan text-xs font-semibold transition-all hover:scale-[1.02] shadow-sm shadow-cyan/10"
          >
            <span>📸</span>
            <span>Scan Mood</span>
          </button>

          {/* User Profile Dropdown */}
          <div ref={profileContainerRef} className="relative">
            {isAuthenticated ? (
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center gap-2 p-1 pl-1.5 rounded-full bg-obsidian-900 border border-obsidian-800 hover:border-cyan/40 transition-colors"
                aria-label="User menu"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-cyan via-emerald to-amber-analog p-[1.5px] shadow-sm">
                  <div className="w-full h-full bg-obsidian-950 rounded-full flex items-center justify-center text-white font-bold text-xs">
                    {(user?.full_name || user?.email || 'U').charAt(0).toUpperCase()}
                  </div>
                </div>
                <svg
                  className={`w-3.5 h-3.5 text-slate-400 mr-1.5 transition-transform ${isProfileOpen ? 'rotate-180' : ''}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            ) : (
              <button
                onClick={() => navigate('/login')}
                className="px-3.5 py-1.5 rounded-xl bg-obsidian-800 hover:bg-obsidian-700 text-white text-xs font-semibold border border-obsidian-700 transition-colors"
              >
                Sign In
              </button>
            )}

            {/* Profile Dropdown Menu */}
            {isProfileOpen && isAuthenticated && (
              <div className="absolute right-0 mt-2 w-56 bg-obsidian-900/95 backdrop-blur-2xl border border-obsidian-750/90 rounded-2xl shadow-2xl shadow-black/80 p-2 z-50 animate-fadeIn">
                <div className="px-3 py-2 border-b border-obsidian-800/80">
                  <p className="text-xs font-semibold text-white truncate">
                    {user?.full_name || 'Listener'}
                  </p>
                  <p className="text-[11px] text-slate-400 truncate">
                    {user?.email}
                  </p>
                </div>
                <div className="py-1">
                  <Link
                    to="/playlists"
                    onClick={() => setIsProfileOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 text-xs text-slate-300 hover:text-white rounded-lg hover:bg-obsidian-800/60 transition-colors"
                  >
                    <span>🎵</span>
                    <span>My Playlists</span>
                  </Link>
                  <Link
                    to="/preferences"
                    onClick={() => setIsProfileOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 text-xs text-slate-300 hover:text-white rounded-lg hover:bg-obsidian-800/60 transition-colors"
                  >
                    <span>⚙️</span>
                    <span>Taste Preferences</span>
                  </Link>
                </div>
                <div className="pt-1 border-t border-obsidian-800/80">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-rose-400 hover:text-rose-300 rounded-lg hover:bg-rose-500/10 transition-colors text-left"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default TopHeader;
