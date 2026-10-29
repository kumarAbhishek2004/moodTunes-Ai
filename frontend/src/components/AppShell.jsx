import { useSelector } from 'react-redux';
import PersistentAudioEngine from './PersistentAudioEngine';

const MOOD_GLOW_MAP = {
  happy: {
    primary: 'rgba(245, 158, 11, 0.18)',   // Warm Amber / Gold
    secondary: 'rgba(236, 72, 153, 0.12)', // Soft Coral
  },
  calm: {
    primary: 'rgba(0, 242, 254, 0.18)',    // Mint / Electric Cyan
    secondary: 'rgba(16, 185, 129, 0.14)', // Emerald
  },
  energetic: {
    primary: 'rgba(249, 115, 22, 0.22)',   // Electric Orange
    secondary: 'rgba(234, 179, 8, 0.15)',  // Bright Gold
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
 * Root layout wrapper maintaining persistent playback engine and ambient background mesh.
 */
const AppShell = ({ children }) => {
  const activeMood = useSelector((state) => state.audio.activeMood) || 'happy';
  const glow = MOOD_GLOW_MAP[activeMood.toLowerCase()] || MOOD_GLOW_MAP.happy;

  return (
    <div className="relative min-h-screen bg-obsidian-950 text-slate-100 overflow-x-hidden selection:bg-cyan selection:text-obsidian-950">
      {/* 1. Root Persistent Audio Engine (Never unmounts across route changes) */}
      <PersistentAudioEngine />

      {/* 2. Dynamic Ambient Background Mesh (Morphs smoothly as mood changes) */}
      <div
        aria-hidden="true"
        className="fixed inset-0 pointer-events-none transition-all duration-1000 ease-out z-0"
        style={{
          background: `
            radial-gradient(circle at 15% 20%, ${glow.primary} 0%, transparent 45%),
            radial-gradient(circle at 85% 75%, ${glow.secondary} 0%, transparent 50%),
            #060B10
          `,
        }}
      />

      {/* Subtle Noise / Grid Texture */}
      <div
        aria-hidden="true"
        className="fixed inset-0 pointer-events-none z-0 opacity-20 bg-[radial-gradient(rgba(255,255,255,0.08)_1px,transparent_1px)] [background-size:24px_24px]"
      />

      {/* 3. Main Content Container */}
      <div className="relative z-10 flex flex-col min-h-screen">
        {children}
      </div>
    </div>
  );
};

export default AppShell;
