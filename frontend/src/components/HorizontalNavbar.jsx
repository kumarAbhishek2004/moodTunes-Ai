import { useState, useEffect, useRef } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import axios from 'axios';
import { API_BASE_URL } from '../config/api';
import { playSong } from '../store/audioSlice';
import { logout } from '../store/authSlice';
import { resolveMusicTheme } from '../utils/themeMap';

const HorizontalNavbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const currentSong = useSelector((state) => state.audio.currentSong);
  const activeMood = useSelector((state) => state.audio.activeMood) || 'happy';

  // Strict guideline: dynamically adapt all navbar accents to playing track's genre & mood
  const theme = resolveMusicTheme(currentSong, activeMood);

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  const profileRef = useRef(null);
  const searchRef = useRef(null);
  const searchInputRef = useRef(null);

  const displayName = user?.full_name ? user.full_name.split(' ')[0] : 'Abhishek';

  // Global Ctrl+K / Cmd+K search shortcut
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Focus search input when search opens
  useEffect(() => {
    if (isSearchOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
  }, [isSearchOpen]);

  // Click outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setIsProfileOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced music search
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
          params: { query: searchQuery.trim(), limit: 6 },
        });
        setSearchResults(response.data.results || []);
      } catch (err) {
        console.error('Search failed:', err);
      } finally {
        setIsSearching(false);
      }
    }, 280);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSelectSong = (song) => {
    dispatch(playSong(song));
    setIsSearchOpen(false);
    setSearchQuery('');
  };

  const handleLogout = () => {
    dispatch(logout());
    setIsProfileOpen(false);
    navigate('/login');
  };

  const navItems = [
    { name: 'Home', path: '/' },
    { name: 'Discover', path: '/discover' },
    { name: 'History', path: '/recommendations' },
    { name: 'Insights', path: '/playlists' },
  ];

  return (
    <header className="sticky top-0 z-40 w-full bg-obsidian-950/60 backdrop-blur-2xl border-b border-white/10 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 h-16 sm:h-20 flex items-center justify-between gap-4">
        {/* ========================================================= */}
        {/* LEFT: Equalizer Icon + MoodTunes AI Brand                 */}
        {/* ========================================================= */}
        <NavLink to="/" className="flex items-center gap-3 group select-none">
          {/* Dynamic Equalizer Bars Icon */}
          <div className="flex items-end gap-1 h-6 px-1 py-0.5">
            <span
              className="w-1.5 h-3.5 rounded-full animate-pulse transition-colors duration-500"
              style={{ backgroundColor: theme.accent, opacity: 0.8 }}
            />
            <span
              className="w-1.5 h-6 rounded-full transition-colors duration-500"
              style={{ backgroundColor: theme.accent, boxShadow: `0 0 8px ${theme.glow}` }}
            />
            <span
              className="w-1.5 h-4.5 rounded-full animate-pulse transition-colors duration-500"
              style={{ backgroundColor: theme.accent, animationDelay: '150ms', opacity: 0.9 }}
            />
            <span
              className="w-1.5 h-3 rounded-full transition-colors duration-500"
              style={{ backgroundColor: theme.accent, opacity: 0.7 }}
            />
          </div>

          <span
            className="text-lg sm:text-xl font-extrabold text-white tracking-tight group-hover:opacity-90 transition-all"
            style={{
              textShadow: `0 0 20px ${theme.glow}`,
            }}
          >
            MoodTunes AI
          </span>
        </NavLink>

        {/* ========================================================= */}
        {/* CENTER: Sleek Pill Navigation Bar                        */}
        {/* ========================================================= */}
        <nav className="flex items-center gap-1 sm:gap-2 bg-obsidian-900/60 p-1.5 rounded-full border border-white/10 backdrop-blur-md shadow-inner">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <NavLink
                key={item.name}
                to={item.path}
                className={`relative px-4 sm:px-5 py-1.5 rounded-full text-xs sm:text-sm font-semibold transition-all duration-300 ${
                  isActive
                    ? 'text-white shadow-lg scale-105'
                    : 'text-slate-300 hover:text-white hover:bg-white/10'
                }`}
                style={
                  isActive
                    ? {
                        backgroundColor: theme.accent,
                        boxShadow: `0 4px 18px ${theme.glow}`,
                      }
                    : undefined
                }
              >
                {item.name}
              </NavLink>
            );
          })}
        </nav>

        {/* ========================================================= */}
        {/* RIGHT: Search Shortcut + User Profile Dropdown            */}
        {/* ========================================================= */}
        <div className="flex items-center gap-3">
          {/* Search Trigger */}
          <button
            onClick={() => setIsSearchOpen(true)}
            className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-slate-300 hover:text-white transition-all"
            title="Search songs (Ctrl+K)"
          >
            <svg className="w-3.5 h-3.5" style={{ color: theme.accent }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <span className="hidden md:inline">Search</span>
            <kbd className="text-[10px] font-mono text-slate-400 bg-obsidian-900 px-1.5 py-0.5 rounded border border-white/10">
              ⌘K
            </kbd>
          </button>

          {/* User Profile Avatar */}
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setIsProfileOpen((prev) => !prev)}
              className="relative rounded-full p-0.5 border-2 shadow-md hover:scale-105 transition-all focus:outline-none"
              style={{
                borderColor: `${theme.accent}99`,
                boxShadow: `0 0 12px ${theme.glow}`,
              }}
              title={`Logged in as ${displayName}`}
            >
              <img
                src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80"
                alt="Profile Avatar"
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-full object-cover"
              />
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-obsidian-950" />
            </button>

            {/* Profile Dropdown Menu */}
            {isProfileOpen && (
              <div className="absolute right-0 mt-3 w-56 rounded-2xl bg-obsidian-900/95 border border-white/10 shadow-2xl backdrop-blur-2xl py-2 z-50 animate-fadeIn text-xs">
                <div className="px-4 py-2.5 border-b border-white/10">
                  <p className="font-bold text-white text-sm">Hi {displayName} 👋</p>
                  <p className="text-[11px] text-slate-400 truncate">{user?.email || 'user@moodtunes.ai'}</p>
                  <div className="mt-1.5 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-wider">
                      Mood AI Active
                    </span>
                  </div>
                </div>

                <div className="py-1">
                  <button
                    onClick={() => {
                      setIsProfileOpen(false);
                      navigate('/preferences');
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-white/10 text-slate-200 hover:text-white flex items-center gap-2.5 transition-colors"
                  >
                    <span>⚙️</span>
                    <span>Taste Profile & Preferences</span>
                  </button>

                  <button
                    onClick={() => {
                      setIsProfileOpen(false);
                      navigate('/mood-detection');
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-white/10 text-slate-200 hover:text-white flex items-center gap-2.5 transition-colors"
                  >
                    <span>📸</span>
                    <span>Mood AI Scanner</span>
                  </button>

                  <button
                    onClick={() => {
                      setIsProfileOpen(false);
                      navigate('/player');
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-white/10 text-slate-200 hover:text-white flex items-center gap-2.5 transition-colors"
                  >
                    <span>💿</span>
                    <span>Vinyl Turntable Studio</span>
                  </button>
                </div>

                <div className="pt-1 border-t border-white/10">
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 flex items-center gap-2.5 transition-colors font-semibold"
                  >
                    <span>🚪</span>
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* QUICK SEARCH MODAL OVERLAY                                */}
      {/* ========================================================= */}
      {isSearchOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-start justify-center pt-20 px-4 animate-fadeIn">
          <div
            ref={searchRef}
            className="w-full max-w-xl rounded-2xl bg-obsidian-900 border border-white/15 shadow-2xl overflow-hidden"
          >
            <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10 bg-obsidian-950/80">
              <svg className="w-5 h-5" style={{ color: theme.accent }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search tracks, artists, moods (e.g. Arijit Singh, Kesariya)..."
                className="flex-1 bg-transparent text-white text-sm placeholder:text-slate-500 focus:outline-none"
              />
              <button
                onClick={() => setIsSearchOpen(false)}
                className="text-slate-400 hover:text-white text-xs px-2 py-1 rounded hover:bg-white/10"
              >
                ESC
              </button>
            </div>

            <div className="max-h-72 overflow-y-auto p-2">
              {isSearching ? (
                <div className="py-6 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                  <span
                    className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin"
                    style={{ borderColor: theme.accent, borderTopColor: 'transparent' }}
                  />
                  Searching YouTube & catalog...
                </div>
              ) : searchResults.length > 0 ? (
                <div className="space-y-1">
                  {searchResults.map((song) => (
                    <button
                      key={song.id || song.youtube_id || song.name}
                      onClick={() => handleSelectSong(song)}
                      className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-white/10 transition-colors text-left group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className="w-9 h-9 rounded-lg bg-obsidian-800 flex items-center justify-center text-xs font-bold group-hover:scale-105 transition-transform flex-shrink-0"
                          style={{ color: theme.accent }}
                        >
                          ▶
                        </div>
                        <div className="truncate">
                          <p className="text-xs font-bold text-white group-hover:text-cyan transition-colors truncate">
                            {song.name}
                          </p>
                          <p className="text-[11px] text-slate-400 truncate">{song.artist}</p>
                        </div>
                      </div>
                      <span
                        className="text-[10px] font-mono px-2 py-0.5 rounded border"
                        style={{
                          color: theme.accent,
                          borderColor: `${theme.accent}40`,
                          backgroundColor: `${theme.accent}15`,
                        }}
                      >
                        Play Now
                      </span>
                    </button>
                  ))}
                </div>
              ) : searchQuery ? (
                <div className="py-6 text-center text-xs text-slate-400">
                  No matching tracks found. Try a different artist or song title.
                </div>
              ) : (
                <div className="py-6 text-center text-xs text-slate-500">
                  Start typing to find any song from YouTube or Last.fm...
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default HorizontalNavbar;
