import { useSelector, useDispatch } from 'react-redux';
import { useLocation } from 'react-router-dom';
import { toggleTurntable } from '../store/audioSlice';
import { resolveMusicTheme } from '../utils/themeMap';
import PersistentAudioEngine from './PersistentAudioEngine';
import HorizontalNavbar from './HorizontalNavbar';
import BottomPlayer from './BottomPlayer';
import QueueDrawer from './QueueDrawer';
import TurntablePlayer from './TurntablePlayer';

export const MOOD_GLOW_MAP = {
  calm: {
    primary: 'rgba(0, 242, 254, 0.28)',    // Mint / Electric Cyan
    secondary: 'rgba(16, 185, 129, 0.18)', // Emerald
    accent: '#00F2FE',
    ambient: 'rgba(0, 242, 254, 0.15)',
  },
  focus: {
    primary: 'rgba(16, 185, 129, 0.30)',   // Emerald Teal
    secondary: 'rgba(6, 182, 212, 0.18)',  // Deep Cyan
    accent: '#10B981',
    ambient: 'rgba(16, 185, 129, 0.15)',
  },
  happy: {
    primary: 'rgba(245, 158, 11, 0.28)',   // Warm Amber / Gold
    secondary: 'rgba(236, 72, 153, 0.18)', // Soft Coral
    accent: '#F59E0B',
    ambient: 'rgba(245, 158, 11, 0.15)',
  },
  energetic: {
    primary: 'rgba(249, 115, 22, 0.30)',   // Electric Orange
    secondary: 'rgba(234, 179, 8, 0.18)',  // Bright Gold
    accent: '#F97316',
    ambient: 'rgba(249, 115, 22, 0.15)',
  },
  romantic: {
    primary: 'rgba(236, 72, 153, 0.30)',   // Rose / Magenta
    secondary: 'rgba(244, 63, 94, 0.18)',  // Coral
    accent: '#EC4899',
    ambient: 'rgba(236, 72, 153, 0.15)',
  },
  sad: {
    primary: 'rgba(37, 99, 235, 0.28)',    // Deep Sapphire
    secondary: 'rgba(99, 102, 241, 0.18)', // Indigo
    accent: '#3B82F6',
    ambient: 'rgba(37, 99, 235, 0.15)',
  },
  reflective: {
    primary: 'rgba(59, 130, 246, 0.28)',   // Sapphire / Slate
    secondary: 'rgba(139, 92, 246, 0.18)', // Violet
    accent: '#60A5FA',
    ambient: 'rgba(59, 130, 246, 0.15)',
  },
  intense: {
    primary: 'rgba(239, 68, 68, 0.30)',    // Crimson
    secondary: 'rgba(168, 85, 247, 0.18)', // Dark Purple
    accent: '#EF4444',
    ambient: 'rgba(239, 68, 68, 0.15)',
  },
};

/**
 * AppShell
 * Root streaming platform shell with clean horizontal top navigation,
 * dynamic mood-based whole-website color morphing,
 * and seamless full/minimized audio playback.
 */
const AppShell = ({ children }) => {
  const dispatch = useDispatch();
  const location = useLocation();
  const currentSong = useSelector((state) => state.audio.currentSong);
  const activeMood = useSelector((state) => state.audio.activeMood) || 'happy';
  const isTurntableOpen = useSelector((state) => state.audio.isTurntableOpen);
  
  // Strict guideline: When music is playing, colors dynamically adapt to song's mood and genre!
  const glow = resolveMusicTheme(currentSong, activeMood);

  const isAuthRoute = location.pathname === '/login';

  return (
    <div
      className="relative min-h-screen text-slate-100 overflow-x-hidden font-sans flex flex-col transition-colors duration-1000"
      style={{
        backgroundColor: '#060B10',
        ['--mood-accent']: glow.accent,
        ['--mood-accent-rgb']: glow.accentRgb,
      }}
    >
      {/* 1. Root Persistent Audio Engine (Uninterrupted across client-side routes) */}
      <PersistentAudioEngine />

      {/* 2. Dynamic Ambient Background Mesh (Transforms whole website based on mood) */}
      <div
        aria-hidden="true"
        className="fixed inset-0 pointer-events-none transition-all duration-1000 ease-out z-0"
        style={{
          background: `
            radial-gradient(circle at 50% 20%, ${glow.primary} 0%, transparent 60%),
            radial-gradient(circle at 18% 70%, ${glow.secondary} 0%, transparent 50%),
            radial-gradient(circle at 82% 80%, ${glow.primary} 0%, transparent 50%),
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
          {/* Horizontal Top Navigation Bar */}
          <HorizontalNavbar />

          {/* Main Full-Width Content Container */}
          <main className="flex-1 w-full min-w-0 pb-28">
            {children}
          </main>

          {/* Persistent Bottom Player Dock (Shown ONLY when someone minimizes the music player!) */}
          {!isTurntableOpen && <BottomPlayer />}

          {/* Slide-out Queue Drawer */}
          <QueueDrawer />

          {/* Fullscreen Vinyl Turntable Modal (Expanded Interface) */}
          {isTurntableOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-6 bg-black/85 backdrop-blur-3xl animate-fadeIn">
              <div
                className="w-full max-w-5xl max-h-[95vh] overflow-y-auto custom-scrollbar rounded-3xl shadow-2xl relative transition-all duration-700 border"
                style={{
                  backgroundColor: '#080E16f2',
                  borderColor: `${glow.accent}40`,
                  boxShadow: `0 25px 80px -10px ${glow.accent}33`,
                }}
              >
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
