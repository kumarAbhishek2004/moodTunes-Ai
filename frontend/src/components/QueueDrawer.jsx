import { useSelector, useDispatch } from 'react-redux';
import {
  toggleQueue,
  playSongAtIndex,
  removeFromQueue,
  clearQueue,
} from '../store/audioSlice';
import { resolveMusicTheme } from '../utils/themeMap';

const formatDuration = (seconds) => {
  if (!seconds || isNaN(seconds)) return '3:45';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
};

const QueueDrawer = () => {
  const dispatch = useDispatch();
  const { queue, currentIndex, isPlaying, isQueueOpen, activeMood } = useSelector(
    (state) => state.audio
  );

  const currentSong = queue[currentIndex] || null;
  const theme = resolveMusicTheme(currentSong, activeMood);

  if (!isQueueOpen) return null;

  return (
    <>
      {/* Backdrop overlay for mobile & tablet */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity animate-fadeIn lg:bg-transparent"
        onClick={() => dispatch(toggleQueue())}
        aria-hidden="true"
      />

      {/* Drawer Panel */}
      <aside
        className="fixed top-0 right-0 bottom-24 w-full sm:w-96 md:w-[420px] bg-obsidian-900/95 backdrop-blur-2xl border-l border-obsidian-800/80 shadow-2xl shadow-black/80 z-40 flex flex-col transition-transform transform translate-x-0 duration-300 ease-out"
        aria-label="Playback Queue"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-obsidian-800/60 bg-obsidian-950/40">
          <div className="flex items-center gap-2.5">
            <div
              className="w-2 h-2 rounded-full animate-pulse"
              style={{ backgroundColor: theme.accent, boxShadow: `0 0 8px ${theme.glow}` }}
            />
            <h2 className="text-base font-semibold text-white tracking-wide">
              Queue
            </h2>
            <span
              className="text-xs px-2 py-0.5 rounded-full font-mono border"
              style={{
                color: theme.accent,
                borderColor: `${theme.accent}40`,
                backgroundColor: `${theme.accent}15`,
              }}
            >
              {queue.length}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {queue.length > 0 && (
              <button
                onClick={() => dispatch(clearQueue())}
                className="text-xs text-slate-400 hover:text-rose-400 transition-colors px-2 py-1 rounded hover:bg-obsidian-800/60"
                title="Clear entire queue"
              >
                Clear
              </button>
            )}
            <button
              onClick={() => dispatch(toggleQueue())}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-obsidian-800 transition-colors"
              aria-label="Close queue"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Scrollable Queue Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-6">
          {/* Section 1: Now Playing */}
          {currentSong ? (
            <div>
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: theme.accent }} />
                  Now Playing
                </span>
                <span className="text-[10px] font-mono capitalize" style={{ color: theme.accent }}>
                  {theme.name}
                </span>
              </div>
              <div
                className="relative group flex items-center gap-3 p-3 rounded-xl border shadow-lg"
                style={{
                  backgroundColor: `${theme.accent}15`,
                  borderColor: `${theme.accent}50`,
                  boxShadow: `0 0 15px ${theme.glow}`,
                }}
              >
                <div className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-obsidian-800">
                  <img
                    src={currentSong.image || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=120&auto=format&fit=crop&q=80'}
                    alt={currentSong.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.src = 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=120&auto=format&fit=crop&q=80';
                    }}
                  />
                  {isPlaying && (
                    <div className="absolute inset-0 bg-obsidian-950/60 flex items-center justify-center gap-0.5">
                      <span className="w-1 h-3.5 rounded-full animate-bounce [animation-delay:-0.3s]" style={{ backgroundColor: theme.accent }} />
                      <span className="w-1 h-4 rounded-full animate-bounce [animation-delay:-0.15s]" style={{ backgroundColor: theme.accent }} />
                      <span className="w-1 h-2.5 rounded-full animate-bounce" style={{ backgroundColor: theme.accent }} />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate group-hover:opacity-90 transition-opacity">
                    {currentSong.name}
                  </p>
                  <p className="text-xs text-slate-400 truncate">
                    {currentSong.artist}
                  </p>
                  {currentSong.mood_match && (
                    <span
                      className="inline-block mt-1 text-[10px] font-medium px-1.5 py-0.5 rounded border"
                      style={{
                        color: theme.accent,
                        backgroundColor: `${theme.accent}20`,
                        borderColor: `${theme.accent}40`,
                      }}
                    >
                      {currentSong.mood_match}
                    </span>
                  )}
                </div>

                <span className="text-xs font-mono flex-shrink-0" style={{ color: theme.accent }}>
                  {formatDuration(currentSong.duration)}
                </span>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-slate-500">
              <svg className="w-10 h-10 mx-auto mb-2 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
              </svg>
              <p className="text-sm">No track currently playing</p>
            </div>
          )}

          {/* Section 2: Next Up */}
          <div>
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2.5 flex items-center justify-between">
              <span>Next In Queue</span>
              <span className="text-slate-500">{Math.max(0, queue.length - 1)} tracks</span>
            </div>

            {queue.length <= 1 ? (
              <div className="p-6 rounded-xl border border-dashed border-obsidian-800 text-center text-slate-500 text-xs">
                Queue is empty. Select songs or dial a mood to fill your stream.
              </div>
            ) : (
              <div className="space-y-1.5">
                {queue.map((song, idx) => {
                  if (idx === currentIndex) return null; // Already shown in Now Playing
                  return (
                    <div
                      key={`${song.id || song.name}-${idx}`}
                      className="group flex items-center gap-3 p-2.5 rounded-lg hover:bg-obsidian-800/60 border border-transparent hover:border-obsidian-700/50 transition-all cursor-pointer"
                      onClick={() => dispatch(playSongAtIndex(idx))}
                    >
                      {/* Index / Hover Play Icon */}
                      <div className="w-5 text-center flex-shrink-0">
                        <span className="text-xs text-slate-500 group-hover:hidden font-mono">
                          {idx + 1}
                        </span>
                        <button
                          className="hidden group-hover:inline-flex text-cyan hover:scale-110 transition-transform"
                          title="Play now"
                        >
                          <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z" />
                          </svg>
                        </button>
                      </div>

                      {/* Artwork */}
                      <div className="w-10 h-10 rounded-md overflow-hidden flex-shrink-0 bg-obsidian-800">
                        <img
                          src={song.image || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=100&auto=format&fit=crop&q=80'}
                          alt={song.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.src = 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=100&auto=format&fit=crop&q=80';
                          }}
                        />
                      </div>

                      {/* Song Details */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-slate-200 group-hover:text-white font-medium truncate">
                          {song.name}
                        </p>
                        <p className="text-xs text-slate-400 truncate">
                          {song.artist}
                        </p>
                      </div>

                      {/* Mood Pill */}
                      {song.mood_match && (
                        <span className="text-[10px] text-slate-400 bg-obsidian-800/80 px-1.5 py-0.5 rounded border border-obsidian-700/40 hidden sm:inline-block">
                          {song.mood_match}
                        </span>
                      )}

                      {/* Duration */}
                      <span className="text-xs font-mono text-slate-500 group-hover:hidden flex-shrink-0">
                        {formatDuration(song.duration)}
                      </span>

                      {/* Remove from queue button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          dispatch(removeFromQueue(idx));
                        }}
                        className="hidden group-hover:inline-flex text-slate-500 hover:text-rose-400 p-1 rounded transition-colors"
                        title="Remove from queue"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer info banner */}
        <div className="p-3 border-t border-obsidian-800/60 bg-obsidian-950/60 text-center">
          <p className="text-[11px] text-slate-500">
            Powered by MoodTunes AI Dynamic Audio Engine
          </p>
        </div>
      </aside>
    </>
  );
};

export default QueueDrawer;
