import { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  toggleQueue,
  closeQueue,
  playSongAtIndex,
  removeFromQueue,
  clearUpcomingQueue,
  shuffleUpcomingQueue,
  moveQueueItem,
  moveSongToNext,
} from '../store/audioSlice';
import { resolveMusicTheme } from '../utils/themeMap';
import { resolveTrackArtwork, handleArtworkError } from '../utils/imageHelper';
import AddToQueueModal from './AddToQueueModal';

const formatDuration = (seconds) => {
  if (!seconds || isNaN(seconds)) return '3:45';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
};

const QueueDrawer = () => {
  const dispatch = useDispatch();
  const [toastMessage, setToastMessage] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Spotify-style Drag and Drop state
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const [dropPosition, setDropPosition] = useState(null); // 'before' | 'after'

  const { queue, currentIndex, isPlaying, isQueueOpen, activeMood } = useSelector(
    (state) => state.audio
  );

  const currentSong = queue[currentIndex] || null;
  const theme = resolveMusicTheme(currentSong, activeMood);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2200);
  };

  if (!isQueueOpen) return null;

  const upcomingCount = Math.max(0, queue.length - (currentIndex + 1));

  // --- Drag and Drop Handlers (Spotify-Style) ---
  const handleDragStart = (e, idx) => {
    setDraggedIndex(idx);
    e.dataTransfer.effectAllowed = 'move';
    try {
      e.dataTransfer.setData('text/plain', String(idx));
    } catch (err) {}
  };

  const handleDragOver = (e, idx) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (draggedIndex === null || draggedIndex === idx) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const relY = e.clientY - rect.top;
    const isTopHalf = relY < rect.height / 2;
    const pos = isTopHalf ? 'before' : 'after';

    if (dragOverIndex !== idx || dropPosition !== pos) {
      setDragOverIndex(idx);
      setDropPosition(pos);
    }
  };

  const handleDragLeave = (e) => {
    // Only clear if actually left the element boundary
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setDragOverIndex(null);
      setDropPosition(null);
    }
  };

  const handleDrop = (e, targetIdx) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === targetIdx) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      setDropPosition(null);
      return;
    }

    let destIdx = targetIdx;
    if (dropPosition === 'after' && draggedIndex < targetIdx) {
      destIdx = targetIdx;
    } else if (dropPosition === 'before' && draggedIndex > targetIdx) {
      destIdx = targetIdx;
    } else if (dropPosition === 'after' && draggedIndex > targetIdx) {
      destIdx = targetIdx + 1;
    } else if (dropPosition === 'before' && draggedIndex < targetIdx) {
      destIdx = targetIdx - 1;
    }

    // Clamp strictly within upcoming queue boundary
    const minUpcoming = currentIndex + 1;
    const maxUpcoming = queue.length - 1;
    destIdx = Math.max(minUpcoming, Math.min(maxUpcoming, destIdx));

    if (destIdx !== draggedIndex) {
      dispatch(moveQueueItem({ fromIndex: draggedIndex, toIndex: destIdx }));
      const songName = queue[draggedIndex]?.name || 'Song';
      const newPos = destIdx - currentIndex;
      showToast(`✨ Moved "${songName}" to #${newPos} in queue`);
    }

    setDraggedIndex(null);
    setDragOverIndex(null);
    setDropPosition(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
    setDropPosition(null);
  };

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
        className="fixed top-0 right-0 bottom-24 w-full sm:w-[420px] md:w-[460px] bg-obsidian-900/95 backdrop-blur-2xl border-l border-white/10 shadow-2xl shadow-black/90 z-40 flex flex-col transition-transform transform translate-x-0 duration-300 ease-out font-sans select-none"
        aria-label="Playback Queue"
      >
        {/* Floating feedback toast */}
        {toastMessage && (
          <div
            className="absolute top-16 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-xl text-xs font-semibold text-white shadow-xl backdrop-blur-xl border border-white/20 animate-fadeIn text-center max-w-[85%] truncate"
            style={{
              backgroundColor: 'rgba(6, 11, 16, 0.95)',
              boxShadow: `0 8px 24px -4px ${theme.glow}`,
            }}
          >
            {toastMessage}
          </div>
        )}

        {/* 1. HEADER */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-obsidian-950/60">
          <div className="flex items-center gap-2.5">
            <div
              className="w-2.5 h-2.5 rounded-full animate-pulse"
              style={{ backgroundColor: theme.accent, boxShadow: `0 0 10px ${theme.glow}` }}
            />
            <h2 className="text-base font-bold text-white tracking-wide">
              Playback Queue
            </h2>
            <span
              className="text-xs px-2.5 py-0.5 rounded-full font-mono font-bold border"
              style={{
                color: theme.accent,
                borderColor: `${theme.accent}40`,
                backgroundColor: `${theme.accent}15`,
              }}
            >
              {queue.length} Tracks
            </span>
          </div>

          {/* Quick Header Actions: Add, Shuffle Upcoming & Clear */}
          <div className="flex items-center gap-1.5">
            {/* Add Music to Queue Button */}
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="text-xs px-2.5 py-1 rounded-lg font-bold transition-all flex items-center gap-1 cursor-pointer hover:scale-105 active:scale-95 text-slate-950 shadow-md"
              style={{
                backgroundColor: theme.accent,
                boxShadow: `0 2px 10px -2px ${theme.glow}`,
              }}
              title="Add songs to queue from playlists or search"
            >
              <span className="font-extrabold text-sm leading-none">+</span>
              <span>Add</span>
            </button>
            {upcomingCount > 1 && (
              <button
                onClick={() => {
                  dispatch(shuffleUpcomingQueue());
                  showToast('🔀 Shuffled upcoming queue!');
                }}
                className="text-xs text-slate-300 hover:text-white transition-colors px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 flex items-center gap-1 cursor-pointer"
                title="Shuffle remaining songs in queue"
              >
                <span>🔀</span>
                <span className="hidden sm:inline">Shuffle</span>
              </button>
            )}

            {upcomingCount > 0 && (
              <button
                onClick={() => {
                  if (confirm('Clear upcoming tracks from queue?')) {
                    dispatch(clearUpcomingQueue());
                    showToast('🧹 Cleared upcoming tracks');
                  }
                }}
                className="text-xs text-slate-400 hover:text-rose-400 transition-colors px-2.5 py-1 rounded-lg hover:bg-rose-500/10 cursor-pointer"
                title="Clear upcoming songs without stopping current track"
              >
                Clear
              </button>
            )}

            {/* Minimize / Collapse Queue to Bottom Player */}
            <button
              onClick={() => dispatch(closeQueue())}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              title="Minimize Queue to Bottom Bar"
              aria-label="Minimize queue to bottom bar"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            <button
              onClick={() => dispatch(closeQueue())}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-colors ml-0.5 cursor-pointer"
              aria-label="Close queue"
              title="Close queue"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* 2. SCROLLABLE QUEUE CONTENT */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-6">
          
          {/* SECTION A: NOW PLAYING */}
          {currentSong ? (
            <div>
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full animate-ping" style={{ backgroundColor: theme.accent }} />
                  Now Playing
                </span>
                <span className="text-[10px] font-mono font-bold capitalize px-2 py-0.5 rounded-full border" style={{ color: theme.accent, borderColor: `${theme.accent}30`, backgroundColor: `${theme.accent}10` }}>
                  {currentSong.mood_match || theme.name}
                </span>
              </div>

              <div
                className="relative group flex items-center gap-3.5 p-3.5 rounded-2xl border shadow-xl transition-all"
                style={{
                  backgroundColor: `${theme.accent}12`,
                  borderColor: `${theme.accent}40`,
                  boxShadow: `0 8px 30px -10px ${theme.glow}`,
                }}
              >
                {/* Artwork with Visualizer */}
                <div className="relative w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 bg-obsidian-800 shadow-md">
                  <img
                    src={resolveTrackArtwork(currentSong)}
                    alt={currentSong.name}
                    className="w-full h-full object-cover"
                    onError={(e) => handleArtworkError(e, currentSong)}
                  />
                  {isPlaying && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center gap-0.5 backdrop-blur-[1px]">
                      <span className="w-1 h-4 rounded-full animate-bounce [animation-delay:-0.3s]" style={{ backgroundColor: theme.accent }} />
                      <span className="w-1 h-5 rounded-full animate-bounce [animation-delay:-0.15s]" style={{ backgroundColor: theme.accent }} />
                      <span className="w-1 h-3 rounded-full animate-bounce" style={{ backgroundColor: theme.accent }} />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-white truncate">
                    {currentSong.name}
                  </p>
                  <p className="text-xs text-slate-300 truncate mt-0.5">
                    {currentSong.artist}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] text-emerald-400 font-mono font-bold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Active Stream
                    </span>
                  </div>
                </div>

                <span className="text-xs font-mono font-bold flex-shrink-0" style={{ color: theme.accent }}>
                  {formatDuration(currentSong.duration)}
                </span>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-slate-500">
              <p className="text-sm">No track currently playing</p>
            </div>
          )}

          {/* SECTION B: CUSTOMIZABLE UPCOMING QUEUE (SPOTIFY DRAG & DROP) */}
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <span>Next Up in Queue</span>
                <span className="text-[10px] text-slate-400 font-normal lowercase">(drag to reorder)</span>
              </span>
              <span className="text-slate-400 font-mono">{upcomingCount} upcoming</span>
            </div>

            {queue.length <= 1 || upcomingCount === 0 ? (
              <div className="p-8 rounded-2xl border border-dashed border-white/10 text-center text-slate-400 text-xs space-y-2">
                <p className="font-semibold text-slate-300">Upcoming queue is empty</p>
                <p className="text-[11px] text-slate-500">Search any track in the top search bar to automatically seed 10 similar songs and drag them around here.</p>
              </div>
            ) : (
              <div className="space-y-1.5">
                {queue.map((song, idx) => {
                  if (idx === currentIndex) return null;
                  const isUpcoming = idx > currentIndex;
                  const queuePosition = idx - currentIndex;
                  const isBeingDragged = draggedIndex === idx;
                  const isDragTarget = dragOverIndex === idx;

                  return (
                    <div
                      key={`${song.id || song.name}-${idx}`}
                      draggable={isUpcoming}
                      onDragStart={(e) => handleDragStart(e, idx)}
                      onDragOver={(e) => handleDragOver(e, idx)}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(e, idx)}
                      onDragEnd={handleDragEnd}
                      className={`group relative flex items-center gap-2.5 p-2 rounded-xl border transition-all duration-150 ${
                        isBeingDragged
                          ? 'opacity-30 border-dashed border-cyan bg-cyan-950/20 scale-[0.98]'
                          : isDragTarget && dropPosition === 'before'
                          ? 'border-t-2 border-t-cyan bg-white/10 border-white/10 shadow-[0_-4px_12px_rgba(6,182,212,0.4)]'
                          : isDragTarget && dropPosition === 'after'
                          ? 'border-b-2 border-b-cyan bg-white/10 border-white/10 shadow-[0_4px_12px_rgba(6,182,212,0.4)]'
                          : isUpcoming
                          ? 'bg-white/5 hover:bg-white/10 border-white/5 hover:border-white/15'
                          : 'opacity-50 hover:opacity-80 bg-black/20 border-transparent'
                      }`}
                    >
                      {/* Spotify-style 6-dot Drag Handle */}
                      {isUpcoming ? (
                        <div
                          className="cursor-grab active:cursor-grabbing p-1 text-slate-500 hover:text-white transition-colors flex items-center justify-center select-none flex-shrink-0"
                          title="Drag to reorder in queue"
                        >
                          <svg className="w-3.5 h-3.5 fill-current opacity-60 group-hover:opacity-100" viewBox="0 0 24 24">
                            <circle cx="8.5" cy="6" r="1.5" />
                            <circle cx="15.5" cy="6" r="1.5" />
                            <circle cx="8.5" cy="12" r="1.5" />
                            <circle cx="15.5" cy="12" r="1.5" />
                            <circle cx="8.5" cy="18" r="1.5" />
                            <circle cx="15.5" cy="18" r="1.5" />
                          </svg>
                        </div>
                      ) : (
                        <div className="w-5" />
                      )}

                      {/* Queue Position Number */}
                      <div className="w-5 text-center flex-shrink-0">
                        <span className="text-xs font-mono font-bold text-slate-400 group-hover:text-white">
                          {isUpcoming ? queuePosition : `-${currentIndex - idx}`}
                        </span>
                      </div>

                      {/* Artwork thumbnail */}
                      <div
                        className="w-9 h-9 rounded-lg overflow-hidden flex-shrink-0 bg-obsidian-800 shadow cursor-pointer group-hover:scale-105 transition-transform"
                        onClick={() => dispatch(playSongAtIndex(idx))}
                        title="Click to play now"
                      >
                        <img
                          src={resolveTrackArtwork(song)}
                          alt={song.name}
                          className="w-full h-full object-cover"
                          onError={(e) => handleArtworkError(e, song)}
                        />
                      </div>

                      {/* Track Details */}
                      <div
                        className="flex-1 min-w-0 cursor-pointer"
                        onClick={() => dispatch(playSongAtIndex(idx))}
                        title="Click to play now"
                      >
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-bold text-white truncate group-hover:text-cyan transition-colors">
                            {song.name}
                          </p>
                          {queuePosition === 1 && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase bg-cyan/20 text-cyan border border-cyan/40">
                              Up Next
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400 truncate mt-0.5">
                          {song.artist}
                        </p>
                      </div>

                      {/* CUSTOMIZATION CONTROLS (SPOTIFY STYLE) */}
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {/* Play Next Shortcut Button (⚡) */}
                        {isUpcoming && queuePosition > 1 && (
                          <button
                            onClick={() => {
                              dispatch(moveSongToNext(idx));
                              showToast(`⚡ "${song.name}" moved to Play Next!`);
                            }}
                            className="p-1.5 rounded-lg bg-white/5 hover:bg-cyan/20 text-slate-400 hover:text-cyan transition-colors cursor-pointer"
                            title="Make this track play next"
                          >
                            <span className="text-xs">⚡</span>
                          </button>
                        )}

                        {/* Move Up Button (▲) */}
                        {idx > currentIndex + 1 && (
                          <button
                            onClick={() => {
                              dispatch(moveQueueItem({ fromIndex: idx, toIndex: idx - 1 }));
                              showToast(`▲ Moved "${song.name}" up`);
                            }}
                            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                            title="Move up in queue"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 15l7-7 7 7" />
                            </svg>
                          </button>
                        )}

                        {/* Move Down Button (▼) */}
                        {idx < queue.length - 1 && isUpcoming && (
                          <button
                            onClick={() => {
                              dispatch(moveQueueItem({ fromIndex: idx, toIndex: idx + 1 }));
                              showToast(`▼ Moved "${song.name}" down`);
                            }}
                            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                            title="Move down in queue"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>
                        )}

                        {/* Remove from Queue (✕) */}
                        <button
                          onClick={() => {
                            dispatch(removeFromQueue(idx));
                            showToast(`Removed "${song.name}" from queue`);
                          }}
                          className="p-1 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors ml-0.5 cursor-pointer"
                          title="Remove from queue"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>

                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

        {/* 3. FOOTER */}
        <div className="p-3 border-t border-white/10 bg-obsidian-950/80 flex items-center justify-between gap-2">
          <p className="text-[11px] text-slate-400 flex items-center gap-1.5 truncate">
            <span>⠿</span>
            <span>Grab <strong>:::</strong> to reorder</span>
          </p>
          <button
            onClick={() => dispatch(closeQueue())}
            className="flex-shrink-0 px-3 py-1 rounded-lg bg-white/10 hover:bg-white/15 text-slate-200 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
            title="Minimize to bottom player dock"
          >
            <span>⬇</span>
            <span>Minimize to Bar</span>
          </button>
        </div>
      </aside>

      {/* Add Music to Queue Modal */}
      <AddToQueueModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onFeedback={showToast}
      />
    </>
  );
};

export default QueueDrawer;
