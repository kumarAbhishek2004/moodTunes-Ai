import { useState, useRef, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  togglePlayPause,
  playNext,
  playPrevious,
  setVolume,
  toggleMute,
  seekTo,
  toggleShuffle,
  cycleRepeatMode,
  toggleQueue,
  toggleTurntable,
  openVibeCard,
  toggleSleepTimerModal,
  toggleShortcutsModal,
  closePlayer,
  reopenPlayer,
  clearCurrentSong,
} from '../store/audioSlice';
import { resolveMusicTheme } from '../utils/themeMap';
import { resolveTrackArtwork, handleArtworkError } from '../utils/imageHelper';

// Helper to format seconds into mm:ss
const formatTime = (seconds) => {
  if (isNaN(seconds) || seconds === null) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
};

// Deterministic pseudo-random heights for the waveform bars
const generateWaveformHeights = (seedStr, count = 46) => {
  const heights = [];
  let seed = 0;
  for (let i = 0; i < seedStr.length; i++) {
    seed = (seed + seedStr.charCodeAt(i) * (i + 1)) % 1000;
  }
  for (let i = 0; i < count; i++) {
    const val = Math.abs(Math.sin(seed + i * 0.45) * 0.75 + Math.cos(seed * 0.2 + i * 0.8) * 0.25);
    heights.push(Math.max(22, Math.floor(val * 100)));
  }
  return heights;
};

const MOOD_COLOR_MAP = {
  calm: {
    accent: '#00F2FE',
    glow: 'rgba(0, 242, 254, 0.55)',
    border: 'border-cyan/40',
    text: 'text-cyan',
    badgeBg: 'bg-cyan/15 text-cyan border-cyan/30',
  },
  focus: {
    accent: '#10B981',
    glow: 'rgba(16, 185, 129, 0.55)',
    border: 'border-emerald-500/40',
    text: 'text-emerald-400',
    badgeBg: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  },
  happy: {
    accent: '#F59E0B',
    glow: 'rgba(245, 158, 11, 0.55)',
    border: 'border-amber-500/40',
    text: 'text-amber-400',
    badgeBg: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  },
  energetic: {
    accent: '#F97316',
    glow: 'rgba(249, 115, 22, 0.55)',
    border: 'border-orange-500/40',
    text: 'text-orange-400',
    badgeBg: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
  },
  romantic: {
    accent: '#EC4899',
    glow: 'rgba(236, 72, 153, 0.55)',
    border: 'border-pink-500/40',
    text: 'text-pink-400',
    badgeBg: 'bg-pink-500/15 text-pink-400 border-pink-500/30',
  },
  sad: {
    accent: '#3B82F6',
    glow: 'rgba(59, 130, 246, 0.55)',
    border: 'border-blue-500/40',
    text: 'text-blue-400',
    badgeBg: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  },
  reflective: {
    accent: '#60A5FA',
    glow: 'rgba(96, 165, 250, 0.55)',
    border: 'border-blue-400/40',
    text: 'text-blue-300',
    badgeBg: 'bg-blue-400/15 text-blue-300 border-blue-400/30',
  },
  intense: {
    accent: '#EF4444',
    glow: 'rgba(239, 68, 68, 0.55)',
    border: 'border-rose-500/40',
    text: 'text-rose-400',
    badgeBg: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
  },
};

const BottomPlayer = () => {
  const dispatch = useDispatch();
  const waveformRef = useRef(null);

  const {
    currentSong,
    queue,
    isPlaying,
    volume,
    isMuted,
    currentTime,
    duration,
    isShuffle,
    repeatMode,
    isQueueOpen,
    activeMood,
    isPlayerDismissed,
    sleepTimer,
  } = useSelector((state) => state.audio);

  const [isLiked, setIsLiked] = useState(false);
  const [hoverTime, setHoverTime] = useState(null);
  const [hoverX, setHoverX] = useState(0);

  // Strictly adapt player colors to the playing track's mood and genre!
  const moodStyle = resolveMusicTheme(currentSong, activeMood);

  const progressPercent = useMemo(() => {
    if (!duration || duration <= 0) return 0;
    return Math.min(100, Math.max(0, (currentTime / duration) * 100));
  }, [currentTime, duration]);

  const waveformHeights = useMemo(() => {
    const seed = currentSong ? `${currentSong.name}-${currentSong.artist}` : 'default';
    return generateWaveformHeights(seed, 46);
  }, [currentSong]);

  const handleWaveformClick = (e) => {
    if (!waveformRef.current || !duration) return;
    const rect = waveformRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const pct = Math.max(0, Math.min(1, clickX / rect.width));
    dispatch(seekTo(pct * duration));
  };

  const handleWaveformMouseMove = (e) => {
    if (!waveformRef.current || !duration) return;
    const rect = waveformRef.current.getBoundingClientRect();
    const hoverOffset = e.clientX - rect.left;
    const pct = Math.max(0, Math.min(1, hoverOffset / rect.width));
    setHoverTime(pct * duration);
    setHoverX(hoverOffset);
  };

  const handleWaveformMouseLeave = () => {
    setHoverTime(null);
  };

  if (!currentSong) return null;

  // If user requested to remove player from screen, provide subtle restore pill with permanent dismiss
  if (isPlayerDismissed) {
    return (
      <div className="fixed bottom-5 left-4 sm:left-6 z-40 animate-fadeIn flex items-center gap-2">
        <button
          onClick={() => dispatch(reopenPlayer())}
          className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-slate-900/95 hover:bg-slate-800 text-white text-xs font-semibold shadow-2xl border border-white/20 hover:border-cyan/50 backdrop-blur-xl transition-all hover:scale-105 active:scale-95 cursor-pointer group"
          title="Restore music player dock"
        >
          <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: moodStyle.accent }} />
          <span>🎵 Show Player</span>
          <span className="text-[10px] text-slate-400 font-normal truncate max-w-[130px]">
            ({currentSong.name})
          </span>
        </button>

        <button
          onClick={() => dispatch(clearCurrentSong())}
          className="p-2 rounded-full bg-slate-900/90 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-white/15 transition-all shadow-lg cursor-pointer"
          title="Dismiss permanently"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    );
  }

  return (
    <footer
      role="region"
      aria-label="Persistent Audio Player"
      className="fixed bottom-0 left-0 right-0 z-40 h-24 bg-obsidian-950/90 backdrop-blur-2xl border-t border-white/10 shadow-[0_-10px_40px_rgba(0,0,0,0.85)] transition-all duration-300 select-none"
    >
      {/* Mobile progress hairline bar at top */}
      <div className="md:hidden absolute top-0 left-0 right-0 h-1 bg-obsidian-800">
        <div
          className="h-full transition-all duration-300"
          style={{ width: `${progressPercent}%`, backgroundColor: moodStyle.accent }}
        />
      </div>

      <div className="max-w-7xl mx-auto h-full px-4 md:px-6 flex items-center justify-between gap-4">
        {/* ========================================================= */}
        {/* ZONE 1 (LEFT): Track Artwork, Metadata, Like Heart         */}
        {/* ========================================================= */}
        <div className="flex items-center gap-3.5 min-w-0 w-1/4">
          <div
            onClick={() => dispatch(toggleTurntable())}
            className="group relative w-13 h-13 sm:w-14 sm:h-14 rounded-xl overflow-hidden bg-obsidian-900 border border-white/10 flex-shrink-0 cursor-pointer shadow-md"
            title="Click to expand Vinyl Turntable"
          >
            <img
              src={resolveTrackArtwork(currentSong)}
              alt={currentSong.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
              onError={(e) => handleArtworkError(e, currentSong)}
            />

            {/* Hover expand overlay */}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              </svg>
            </div>
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h4
                onClick={() => dispatch(toggleTurntable())}
                className="text-sm font-bold text-white truncate cursor-pointer hover:text-cyan transition-colors"
                title={currentSong.name}
              >
                {currentSong.name}
              </h4>
              <span
                className="hidden lg:inline-block px-1.5 py-0.5 text-[10px] font-bold tracking-wider uppercase rounded-md border"
                style={{
                  color: moodStyle.accent,
                  borderColor: `${moodStyle.accent}40`,
                  backgroundColor: `${moodStyle.accent}15`,
                }}
              >
                {currentSong.mood_match || activeMood}
              </span>
            </div>
            <p className="text-xs text-slate-400 truncate mt-0.5" title={currentSong.artist}>
              {currentSong.artist}
            </p>
          </div>

          {/* Like Heart Button */}
          <button
            onClick={() => setIsLiked(!isLiked)}
            aria-label={isLiked ? 'Unlike song' : 'Like song'}
            className="p-1.5 text-slate-400 hover:text-white transition-colors focus:outline-none"
          >
            <svg
              className={`w-5 h-5 transition-transform active:scale-125 ${
                isLiked ? 'text-pink-500 fill-pink-500' : 'text-slate-400 hover:text-white'
              }`}
              fill={isLiked ? 'currentColor' : 'none'}
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              />
            </svg>
          </button>

          {/* Share Vibe Card Button */}
          <button
            onClick={() => dispatch(openVibeCard(currentSong))}
            aria-label="Share Vibe Card"
            className="p-1.5 text-slate-400 hover:text-white transition-colors focus:outline-none"
            title="Generate Shareable Vibe Card (Press V)"
          >
            <span className="text-sm">📸</span>
          </button>
        </div>

        {/* ========================================================= */}
        {/* ZONE 2 (CENTER): Transport Controls & Waveform Scrubber   */}
        {/* ========================================================= */}
        <div className="flex-1 max-w-2xl flex flex-col items-center justify-center">
          {/* Controls Cluster */}
          <div className="flex items-center gap-4 mb-1">
            {/* Shuffle */}
            <button
              onClick={() => dispatch(toggleShuffle())}
              aria-label="Toggle shuffle"
              className={`p-1.5 rounded-lg transition-colors ${
                isShuffle ? 'text-white' : 'text-slate-400 hover:text-white'
              }`}
              style={{ color: isShuffle ? moodStyle.accent : undefined }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H4m0 0l4-4m-4 4l4 4m8-12h4m0 0l-4-4m4 4l-4 4m0 6l-6-6m-6 6l12-12" />
              </svg>
            </button>

            {/* Previous */}
            <button
              onClick={() => dispatch(playPrevious())}
              aria-label="Previous track"
              className="p-1.5 text-slate-300 hover:text-white hover:scale-110 active:scale-95 transition-transform"
            >
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
              </svg>
            </button>

            {/* Primary Glowing Circular Play / Pause Macro Button (Image 2) */}
            <button
              onClick={() => dispatch(togglePlayPause())}
              aria-label={isPlaying ? 'Pause' : 'Play'}
              className="w-11 h-11 rounded-full text-obsidian-950 flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-lg"
              style={{
                backgroundColor: moodStyle.accent,
                boxShadow: `0 0 20px ${moodStyle.glow}`,
              }}
            >
              {isPlaying ? (
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                  <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                </svg>
              ) : (
                <svg className="w-5 h-5 fill-current ml-0.5" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </button>

            {/* Next */}
            <button
              onClick={() => dispatch(playNext())}
              aria-label="Next track"
              className="p-1.5 text-slate-300 hover:text-white hover:scale-110 active:scale-95 transition-transform"
            >
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
              </svg>
            </button>

            {/* Repeat Mode */}
            <button
              onClick={() => dispatch(cycleRepeatMode())}
              aria-label="Cycle repeat mode"
              className="p-1.5 rounded-lg transition-colors relative text-slate-400 hover:text-white"
              style={{ color: repeatMode !== 'off' ? moodStyle.accent : undefined }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              {repeatMode === 'one' && (
                <span className="absolute -top-1 -right-1 text-[9px] font-bold px-1 rounded-full bg-obsidian-900" style={{ color: moodStyle.accent }}>
                  1
                </span>
              )}
            </button>
          </div>

          {/* Interactive Waveform Scrubber & Timestamps */}
          <div className="w-full hidden md:flex items-center gap-3">
            <span className="text-[11px] font-mono text-slate-400 w-10 text-right select-none">
              {formatTime(currentTime)}
            </span>

            {/* Waveform Bar Track */}
            <div
              ref={waveformRef}
              onClick={handleWaveformClick}
              onMouseMove={handleWaveformMouseMove}
              onMouseLeave={handleWaveformMouseLeave}
              className="relative flex-1 h-7 flex items-center justify-between gap-[2px] cursor-pointer group py-1"
            >
              {waveformHeights.map((h, idx) => {
                const barPct = (idx / waveformHeights.length) * 100;
                const isPlayed = barPct <= progressPercent;

                return (
                  <div
                    key={idx}
                    style={{
                      height: `${h}%`,
                      backgroundColor: isPlayed ? moodStyle.accent : undefined,
                      boxShadow: isPlayed ? `0 0 5px ${moodStyle.accent}aa` : undefined,
                    }}
                    className={`flex-1 rounded-full transition-colors duration-150 ${
                      isPlayed
                        ? ''
                        : 'bg-obsidian-800 group-hover:bg-obsidian-700'
                    }`}
                  />
                );
              })}

              {/* Hover Timestamp Tooltip */}
              {hoverTime !== null && (
                <div
                  className="absolute -top-6 -translate-x-1/2 px-2 py-0.5 rounded-md bg-obsidian-900 border text-[10px] font-mono shadow-lg pointer-events-none"
                  style={{
                    left: `${hoverX}px`,
                    borderColor: `${moodStyle.accent}66`,
                    color: moodStyle.accent,
                  }}
                >
                  {formatTime(hoverTime)}
                </div>
              )}
            </div>

            <span className="text-[11px] font-mono text-slate-400 w-10 text-left select-none">
              {formatTime(duration)}
            </span>
          </div>
        </div>

        {/* ========================================================= */}
        {/* ZONE 3 (RIGHT): Volume, Queue with Badge, Maximize Icon    */}
        {/* ========================================================= */}
        <div className="flex items-center justify-end gap-3 min-w-0 w-1/4">
          {/* Queue Drawer Button with Badge (Image 2: [ ≡ 20 ]) */}
          <button
            onClick={() => dispatch(toggleQueue())}
            aria-label="Toggle queue"
            className="p-2 rounded-xl transition-all relative text-slate-400 hover:text-white hover:bg-white/5"
            style={{ color: isQueueOpen ? moodStyle.accent : undefined }}
            title="View full recommendation queue"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h7" />
            </svg>
            {queue.length > 0 && (
              <span
                className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-obsidian-950 font-bold text-[9px] flex items-center justify-center shadow-sm"
                style={{ backgroundColor: moodStyle.accent }}
              >
                {queue.length > 99 ? '99+' : queue.length}
              </span>
            )}
          </button>

          {/* Volume Control Cluster */}
          <div className="hidden lg:flex items-center gap-2 group">
            <button
              onClick={() => dispatch(toggleMute())}
              aria-label={isMuted ? 'Unmute' : 'Mute'}
              className="text-slate-400 hover:text-white transition-colors"
            >
              {isMuted || volume === 0 ? (
                <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                </svg>
              ) : volume < 50 ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                </svg>
              )}
            </button>

            <input
              type="range"
              min="0"
              max="100"
              value={isMuted ? 0 : volume}
              onChange={(e) => dispatch(setVolume(Number(e.target.value)))}
              style={{ accentColor: moodStyle.accent }}
              className="w-20 h-1 bg-obsidian-700 rounded-full appearance-none cursor-pointer group-hover:bg-obsidian-600 transition-colors"
            />
          </div>

          {/* Sleep Timer Button */}
          <button
            onClick={() => dispatch(toggleSleepTimerModal())}
            aria-label="Sleep Timer"
            className={`p-1.5 rounded-xl transition-all flex items-center gap-1 ${
              sleepTimer?.active
                ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-400/50'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
            title="Sleep Timer (Press S)"
          >
            <span className="text-sm">🌙</span>
            {sleepTimer?.active && (
              <span className="text-[10px] font-mono font-bold text-indigo-300 hidden sm:inline">
                {sleepTimer?.isEndOfTrack ? 'Track' : `${Math.ceil((sleepTimer?.remainingSeconds ?? 0) / 60)}m`}
              </span>
            )}
          </button>

          {/* Keyboard Shortcuts Guide Button */}
          <button
            onClick={() => dispatch(toggleShortcutsModal())}
            aria-label="Keyboard Shortcuts"
            className="hidden xl:flex p-1.5 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-all"
            title="Keyboard Shortcuts (Press ?)"
          >
            <span className="text-xs font-mono font-bold">⌨️</span>
          </button>

          {/* Fullscreen Vinyl Turntable Maximize Button [ ⛶ ] (Image 2) */}
          <button
            onClick={() => dispatch(toggleTurntable())}
            aria-label="Maximize vinyl turntable"
            className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-all cursor-pointer"
            title="Maximize to Vinyl Turntable Player"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
            </svg>
          </button>

          {/* Close & Remove Player from Screen Button [ ✕ ] */}
          <button
            onClick={() => dispatch(closePlayer())}
            aria-label="Remove player from screen"
            className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/15 rounded-xl transition-all cursor-pointer flex-shrink-0"
            title="Remove player from screen (Stop & Close)"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </footer>
  );
};

export default BottomPlayer;
