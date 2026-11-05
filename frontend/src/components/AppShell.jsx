import { useSelector, useDispatch } from 'react-redux';
import { useLocation } from 'react-router-dom';
import { toggleTurntable } from '../store/audioSlice';
import PersistentAudioEngine from './PersistentAudioEngine';
import HorizontalNavbar from './HorizontalNavbar';
import BottomPlayer from './BottomPlayer';
import QueueDrawer from './QueueDrawer';
import TurntablePlayer from './TurntablePlayer';

const MOOD_GLOW_MAP = {
  happy: {
    primary: 'rgba(245, 158, 11, 0.16)',   // Warm Amber / Gold
    secondary: 'rgba(236, 72, 153, 0.10)', // Soft Coral
  },
  calm: {
    primary: 'rgba(0, 242, 254, 0.16)',    // Mint / Electric Cyan
    secondary: 'rgba(16, 185, 129, 0.12)', // Emerald
  },
  focus: {
    primary: 'rgba(16, 185, 129, 0.18)',   // Emerald Teal
    secondary: 'rgba(6, 182, 212, 0.12)',  // Deep Cyan
  },
  energetic: {
    primary: 'rgba(249, 115, 22, 0.20)',   // Electric Orange
    secondary: 'rgba(234, 179, 8, 0.12)',  // Bright Gold
  },
  romantic: {
    primary: 'rgba(236, 72, 153, 0.20)',   // Rose / Magenta
    secondary: 'rgba(244, 63, 94, 0.12)',  // Coral
  },
  sad: {
    primary: 'rgba(37, 99, 235, 0.18)',    // Deep Sapphire
    secondary: 'rgba(99, 102, 241, 0.12)', // Indigo
  },
  intense: {
    primary: 'rgba(239, 68, 68, 0.20)',    // Crimson
    secondary: 'rgba(168, 85, 247, 0.12)', // Dark Purple
  },
};

/**
 * AppShell
 * Root streaming platform shell with clean horizontal top navigation
 * and persistent audio playback across all routes.
 */
const AppShell = ({ children }) => {
  const dispatch = useDispatch();
  const location = useLocation();
  const activeMood = useSelector((state) => state.audio.activeMood) || 'happy';
  const isTurntableOpen = useSelector((state) => state.audio.isTurntableOpen);
  const glow = MOOD_GLOW_MAP[activeMood.toLowerCase()] || MOOD_GLOW_MAP.happy;

  const isAuthRoute = location.pathname === '/login';

  return (
    <div className="relative min-h-screen bg-obsidian-950 text-slate-100 overflow-x-hidden selection:bg-purple-500 selection:text-white font-sans flex flex-col">
      {/* 1. Root Persistent Audio Engine (Uninterrupted across client-side routes) */}
      <PersistentAudioEngine />

      {/* 2. Dynamic Ambient Background Mesh */}
      <div
        aria-hidden="true"
        className="fixed inset-0 pointer-events-none transition-all duration-1000 ease-out z-0"
        style={{
          background: `
            radial-gradient(circle at 18% 18%, ${glow.primary} 0%, transparent 50%),
            radial-gradient(circle at 82% 82%, ${glow.secondary} 0%, transparent 55%),
            #060B10
          `,
        }}
      />

      {/* Subtle Noise / Grid Texture */}
      <div
        aria-hidden="true"
        className="fixed inset-0 pointer-events-none z-0 opacity-15 bg-[radial-gradient(rgba(255,255,255,0.06)_1px,transparent_1px)] [background-size:24px_24px]"
      />

      {/* 3. Streaming Shell Layout */}
      {isAuthRoute ? (
        <div className="relative z-10 min-h-screen flex items-center justify-center">
          {children}
        </div>
      ) : (
        <div className="relative z-10 flex flex-col min-h-screen">
          {/* Horizontal Top Navigation Bar (Matches Aura Studio Concept) */}
          <HorizontalNavbar />

          {/* Main Full-Width Content Container */}
          <main className="flex-1 w-full min-w-0 pb-28">
            {children}
          </main>

          {/* Persistent Bottom Player Dock */}
          <BottomPlayer />

          {/* Slide-out Queue Drawer */}
          <QueueDrawer />

          {/* Fullscreen Vinyl Turntable Modal */}
          {isTurntableOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-6 bg-black/85 backdrop-blur-3xl animate-fadeIn">
              <div className="w-full max-w-5xl max-h-[95vh] overflow-y-auto custom-scrollbar bg-obsidian-950/95 border border-obsidian-750/90 rounded-3xl shadow-2xl">
                <TurntablePlayer isModal={true} onClose={() => dispatch(toggleTurntable())} />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AppShell;
