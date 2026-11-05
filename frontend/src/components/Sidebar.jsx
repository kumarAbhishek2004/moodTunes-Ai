import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../store/authSlice';

const MOOD_COLOR_MAP = {
  happy: { color: 'text-amber-400', bg: 'bg-amber-400/10', border: 'border-amber-400/30', dot: 'bg-amber-400' },
  calm: { color: 'text-cyan', bg: 'bg-cyan/10', border: 'border-cyan/30', dot: 'bg-cyan' },
  energetic: { color: 'text-orange-400', bg: 'bg-orange-400/10', border: 'border-orange-400/30', dot: 'bg-orange-400' },
  sad: { color: 'text-blue-400', bg: 'bg-blue-400/10', border: 'border-blue-400/30', dot: 'bg-blue-400' },
  intense: { color: 'text-rose-400', bg: 'bg-rose-400/10', border: 'border-rose-400/30', dot: 'bg-rose-400' },
};

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const activeMood = useSelector((state) => state.audio.activeMood) || 'happy';
  const moodStyle = MOOD_COLOR_MAP[activeMood.toLowerCase()] || MOOD_COLOR_MAP.happy;

  const navLinks = [
    {
      to: '/',
      label: 'Home',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
    },
    {
      to: '/discover',
      label: 'Discover & Charts',
      badge: 'Hot',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
        </svg>
      ),
    },
    {
      to: '/mood-detection',
      label: 'Mood Scanner',
      badge: 'AI',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      to: '/recommendations',
      label: 'Curated Stream',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
        </svg>
      ),
    },
    {
      to: '/player',
      label: 'Turntable View',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      to: '/playlists',
      label: 'My Playlists',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 6h16M4 10h16M4 14h16M4 18h7" />
        </svg>
      ),
    },
    {
      to: '/preferences',
      label: 'Taste Profile',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
        </svg>
      ),
    },
  ];

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  return (
    <aside
      className="hidden md:flex flex-col w-64 fixed top-0 bottom-24 left-0 bg-obsidian-900/80 backdrop-blur-xl border-r border-obsidian-800/80 z-30 select-none"
      aria-label="Desktop Navigation"
    >
      {/* Brand Logo */}
      <div className="p-6 pb-5 flex items-center justify-between border-b border-obsidian-800/50">
        <NavLink to="/" className="flex items-center gap-3 group">
          <div className="relative w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan via-emerald to-amber-analog p-[1.5px] shadow-lg shadow-cyan/20 group-hover:shadow-cyan/40 transition-shadow">
            <div className="w-full h-full bg-obsidian-950 rounded-[10px] flex items-center justify-center">
              {/* Animated Mini Equalizer Logo */}
              <div className="flex items-end gap-[2px] h-4">
                <span className="w-[3px] h-2.5 bg-cyan rounded-full animate-pulse" />
                <span className="w-[3px] h-4 bg-emerald rounded-full animate-pulse [animation-delay:150ms]" />
                <span className="w-[3px] h-3 bg-amber-analog rounded-full animate-pulse [animation-delay:300ms]" />
              </div>
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-base font-bold text-white tracking-tight">
                MoodTunes
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-gradient-to-r from-cyan/20 to-emerald/20 text-cyan border border-cyan/30">
                AI
              </span>
            </div>
            <p className="text-[10px] text-slate-500 font-mono tracking-wider uppercase">
              Audio Intelligence
            </p>
          </div>
        </NavLink>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto custom-scrollbar">
        <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider px-3 mb-2">
          Menu
        </div>

        {navLinks.map((link) => {
          const isActive = location.pathname === link.to;
          return (
            <NavLink
              key={link.to}
              to={link.to}
              className={`relative flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                isActive
                  ? 'bg-cyan/10 text-white shadow-sm border border-cyan/20'
                  : 'text-slate-400 hover:text-white hover:bg-obsidian-800/60'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className={isActive ? 'text-cyan' : 'text-slate-400 group-hover:text-white transition-colors'}>
                  {link.icon}
                </span>
                <span>{link.label}</span>
              </div>

              {link.badge && (
                <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-cyan/20 text-cyan border border-cyan/30">
                  {link.badge}
                </span>
              )}

              {/* Active glow indicator pill */}
              {isActive && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r-full bg-cyan shadow-[0_0_8px_#00F2FE]" />
              )}
            </NavLink>
          );
        })}

        {/* Dynamic Vibe Status Pill */}
        <div className="pt-5 px-1">
          <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider px-2 mb-2">
            Active Emotion Vibe
          </div>
          <div
            onClick={() => navigate('/mood-detection')}
            className={`p-3 rounded-xl border cursor-pointer transition-all hover:scale-[1.02] ${moodStyle.bg} ${moodStyle.border}`}
            role="button"
            tabIndex={0}
            title="Click to change or scan mood"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-medium text-slate-300">
                Current Tuning
              </span>
              <span className={`w-2 h-2 rounded-full ${moodStyle.dot} animate-ping`} />
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-sm font-bold uppercase tracking-wide capitalize ${moodStyle.color}`}>
                {activeMood}
              </span>
              <span className="text-[11px] text-slate-400">• Dynamic</span>
            </div>
          </div>
        </div>

        {/* Quick Shortcuts */}
        <div className="pt-5 px-1">
          <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider px-2 mb-2">
            Quick Actions
          </div>
          <div className="space-y-1">
            <button
              onClick={() => navigate('/mood-detection')}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-slate-300 hover:text-white rounded-lg hover:bg-obsidian-800/50 transition-colors text-left"
            >
              <span className="text-amber-400">⚡</span>
              <span>Fast Face Emotion Scan</span>
            </button>
            <button
              onClick={() => navigate('/recommendations')}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-slate-300 hover:text-white rounded-lg hover:bg-obsidian-800/50 transition-colors text-left"
            >
              <span className="text-cyan">✨</span>
              <span>Curated AI Stream</span>
            </button>
          </div>
        </div>
      </nav>

      {/* User Footer Profile */}
      <div className="p-3.5 border-t border-obsidian-800/50 bg-obsidian-950/40">
        {isAuthenticated ? (
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-cyan to-emerald flex items-center justify-center text-obsidian-950 font-bold text-xs flex-shrink-0">
                {(user?.full_name || user?.email || 'U').charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-white truncate">
                  {user?.full_name || 'Listener'}
                </p>
                <p className="text-[10px] text-slate-400 truncate">
                  {user?.email || 'Logged In'}
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="text-slate-400 hover:text-rose-400 p-1.5 rounded-lg hover:bg-obsidian-800 transition-colors"
              title="Sign out"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        ) : (
          <NavLink
            to="/login"
            className="flex items-center justify-center gap-2 w-full py-2 px-3 rounded-xl bg-obsidian-800 hover:bg-obsidian-750 text-white text-xs font-semibold border border-obsidian-700/60 transition-colors"
          >
            <span>Sign In / Register</span>
          </NavLink>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
