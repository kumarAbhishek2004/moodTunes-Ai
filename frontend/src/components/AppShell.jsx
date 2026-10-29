import { useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';
import PersistentAudioEngine from './PersistentAudioEngine';
import Sidebar from './Sidebar';
import TopHeader from './TopHeader';
import BottomPlayer from './BottomPlayer';
import QueueDrawer from './QueueDrawer';
import MobileNav from './MobileNav';

const MOOD_GLOW_MAP = {
  happy: {
    primary: 'rgba(245, 158, 11, 0.18)',   // Warm Amber / Gold
    secondary: 'rgba(236, 72, 153, 0.12)', // Soft Coral
  },
  calm: {
    primary: 'rgba(0, 242, 254, 0.18)',    // Mint / Electric Cyan
    secondary: 'rgba(16, 185, 129, 0.14)', // Emerald
  },
  focus: {
    primary: 'rgba(16, 185, 129, 0.20)',   // Emerald Teal
    secondary: 'rgba(6, 182, 212, 0.14)',  // Deep Cyan
  },
  energetic: {
    primary: 'rgba(249, 115, 22, 0.22)',   // Electric Orange
    secondary: 'rgba(234, 179, 8, 0.15)',  // Bright Gold
  },
  romantic: {
    primary: 'rgba(236, 72, 153, 0.22)',   // Rose / Magenta
    secondary: 'rgba(244, 63, 94, 0.15)',  // Coral
  },
  sad: {
    primary: 'rgba(37, 99, 235, 0.20)',    // Deep Sapphire
    secondary: 'rgba(99, 102, 241, 0.15)', // Indigo
  },
  intense: {
    primary: 'rgba(239, 68, 68, 0.22)',    // Crimson
    secondary: 'rgba(168, 85, 247, 0.15)', // Dark Purple
  },
};

/**
 * AppShell
 * Root desktop/mobile streaming platform navigation shell with persistent audio playback.
 */
const AppShell = ({ children }) => {
  const location = useLocation();
  const activeMood = useSelector((state) => state.audio.activeMood) || 'happy';
  const glow = MOOD_GLOW_MAP[activeMood.toLowerCase()] || MOOD_GLOW_MAP.happy;

  const isAuthRoute = location.pathname === '/login';

  return (
    <div className="relative min-h-screen bg-obsidian-950 text-slate-100 overflow-x-hidden selection:bg-cyan selection:text-obsidian-950 font-sans">
      {/* 1. Root Persistent Audio Engine (Uninterrupted across client-side routes) */}
      <PersistentAudioEngine />

      {/* 2. Dynamic Ambient Background Mesh (Morphs smoothly as emotional state updates) */}
      <div
        aria-hidden="true"
        className="fixed inset-0 pointer-events-none transition-all duration-1000 ease-out z-0"
        style={{
          background: `
            radial-gradient(circle at 18% 22%, ${glow.primary} 0%, transparent 48%),
            radial-gradient(circle at 82% 78%, ${glow.secondary} 0%, transparent 52%),
            #060B10
          `,
        }}
      />

      {/* Subtle Noise / Grid Texture */}
      <div
        aria-hidden="true"
        className="fixed inset-0 pointer-events-none z-0 opacity-20 bg-[radial-gradient(rgba(255,255,255,0.08)_1px,transparent_1px)] [background-size:24px_24px]"
      />

      {/* 3. Streaming Shell Layout */}
      {isAuthRoute ? (
        <div className="relative z-10 min-h-screen flex items-center justify-center">
          {children}
        </div>
      ) : (
        <div className="relative z-10 flex min-h-screen">
          {/* Desktop Fixed Sidebar */}
          <Sidebar />

          {/* Main Content Area (Offset by sidebar width on desktop) */}
          <div className="flex-1 flex flex-col md:pl-64 min-w-0">
            {/* Top Bar with Personalized Greeting & Context */}
            <TopHeader />

            {/* Scrollable Page Body (pb-32 ensures player dock never covers content) */}
            <main className="flex-1 pb-32 md:pb-28">
              {children}
            </main>
          </div>

          {/* Persistent Bottom Player Dock */}
          <BottomPlayer />

          {/* Slide-out Queue Drawer */}
          <QueueDrawer />

          {/* Mobile Bottom Navigation Dock */}
          <MobileNav />
        </div>
      )}
    </div>
  );
};

export default AppShell;
