import { NavLink, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';

const MobileNav = () => {
  const location = useLocation();
  const currentSong = useSelector((state) => state.audio.currentSong);

  const tabs = [
    {
      to: '/',
      label: 'Home',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
    },
    {
      to: '/mood-detection',
      label: 'Scanner',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      to: '/recommendations',
      label: 'Stream',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
        </svg>
      ),
    },
    {
      to: '/playlists',
      label: 'Playlists',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h7" />
        </svg>
      ),
    },
    {
      to: '/preferences',
      label: 'Taste',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
        </svg>
      ),
    },
  ];

  // If a song is currently loaded in the BottomPlayer, adjust bottom offset so MobileNav sits above it
  const bottomPositionClass = currentSong ? 'bottom-20' : 'bottom-0';

  return (
    <nav
      className={`md:hidden fixed ${bottomPositionClass} left-0 right-0 z-30 bg-obsidian-950/95 backdrop-blur-xl border-t border-obsidian-800/80 px-2 py-1.5 transition-all duration-200`}
      aria-label="Mobile Navigation"
    >
      <div className="flex items-center justify-around">
        {tabs.map((tab) => {
          const isActive = location.pathname === tab.to;
          return (
            <NavLink
              key={tab.to}
              to={tab.to}
              className={`flex flex-col items-center justify-center py-1 px-3 rounded-lg transition-colors min-w-[56px] ${
                isActive ? 'text-cyan' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="relative">
                {tab.icon}
                {isActive && (
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-cyan shadow-[0_0_6px_#00F2FE]" />
                )}
              </div>
              <span className="text-[10px] font-medium tracking-tight mt-1">
                {tab.label}
              </span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileNav;
