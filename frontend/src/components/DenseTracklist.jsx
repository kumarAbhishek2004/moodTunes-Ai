import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { playSong } from '../store/audioSlice';
import AddToPlaylistButton from './AddToPlaylistButton';

const formatDuration = (seconds) => {
  if (!seconds || isNaN(seconds)) return '3:45';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
};

const DenseTracklist = ({
  songs = [],
  title = 'Recommended Stream',
  subtitle = 'AI-Curated',
  defaultExpanded = true,
  allowToggle = true,
}) => {
  const dispatch = useDispatch();
  const { currentSong, isPlaying, activeMood } = useSelector((state) => state.audio);

  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [likedMap, setLikedMap] = useState({});

  useEffect(() => {
    try {
      const stored = localStorage.getItem('liked_songs');
      if (stored) setLikedMap(JSON.parse(stored));
    } catch (e) {}
  }, []);

  const toggleLike = (song, e) => {
    e.stopPropagation();
    const id = song.id || `${song.name}-${song.artist}`;
    const next = { ...likedMap, [id]: !likedMap[id] };
    setLikedMap(next);
    try {
      localStorage.setItem('liked_songs', JSON.stringify(next));
    } catch (e) {}
  };

  const handleRowClick = (song) => {
    dispatch(playSong(song));
  };

  if (!songs || songs.length === 0) {
    return (
      <div className="bg-obsidian-900/60 backdrop-blur-xl border border-obsidian-800/80 rounded-3xl p-8 text-center my-6">
        <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-cyan/10 border border-cyan/20 flex items-center justify-center text-cyan">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
          </svg>
        </div>
        <p className="text-sm font-semibold text-white">No active stream loaded</p>
        <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
          Select or detect your mood to curate an authentic stream.
        </p>
      </div>
    );
  }

  // Display either top 5 (minimised) or all songs (maximised)
  const visibleSongs = (allowToggle && !isExpanded && songs.length > 5)
    ? songs.slice(0, 5)
    : songs;

  return (
    <div className="bg-obsidian-900/70 backdrop-blur-2xl border border-white/10 rounded-3xl p-4 sm:p-6 shadow-2xl my-8 transition-all duration-300">
      {/* Table Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-white/10 mb-3 px-2 gap-3">
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-cyan shadow-[0_0_8px_#00F2FE]" />
          <div>
            <h3 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <span>{title}</span>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-white/10 text-slate-300 border border-white/10">
                {isExpanded ? `All ${songs.length} Tracks` : `Preview: 5 of ${songs.length}`}
              </span>
            </h3>
            <p className="text-[11px] text-slate-400">
              {subtitle} • {isExpanded ? 'Showing full curated queue' : 'Compact view active'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-end sm:self-auto">
          {/* Minimise / Maximise Toggle Button (User Request 3) */}
          {allowToggle && songs.length > 5 && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-obsidian-800 hover:bg-obsidian-750 text-slate-200 border border-white/15 text-xs font-semibold transition-all hover:scale-102 active:scale-98 shadow-sm"
              title={isExpanded ? 'Minimise view to top 5 tracks' : 'Maximise to view all tracks'}
            >
              {isExpanded ? (
                <>
                  <svg className="w-3.5 h-3.5 text-cyan" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                  <span>⤡ Minimise ({songs.length})</span>
                </>
              ) : (
                <>
                  <svg className="w-3.5 h-3.5 text-cyan" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                  </svg>
                  <span>⤢ Maximise All ({songs.length})</span>
                </>
              )}
            </button>
          )}

          {/* Play All Button */}
          <button
            onClick={() => handleRowClick(songs[0])}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan/15 hover:bg-cyan/25 text-cyan border border-cyan/30 text-xs font-bold transition-all shadow-sm hover:scale-102"
          >
            <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
            <span>Play Stream</span>
          </button>
        </div>
      </div>

      {/* Desktop Table Header */}
      <div className="hidden md:grid grid-cols-12 gap-4 px-3 py-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wider border-b border-white/5">
        <div className="col-span-1 text-center">#</div>
        <div className="col-span-4">Title & Artist</div>
        <div className="col-span-2">Mood Vibe</div>
        <div className="col-span-3">Explainable AI Reasoning</div>
        <div className="col-span-1 text-center">Duration</div>
        <div className="col-span-1 text-right">Actions</div>
      </div>

      {/* Tracklist Rows */}
      <div className="divide-y divide-white/5 mt-1">
        {visibleSongs.map((song, idx) => {
          const isCurrent =
            currentSong &&
            (currentSong.id === song.id ||
              (currentSong.name === song.name && currentSong.artist === song.artist));
          const isLiked = likedMap[song.id || `${song.name}-${song.artist}`];

          return (
            <div
              key={song.id || `${song.name}-${idx}`}
              onClick={() => handleRowClick(song)}
              className={`group flex md:grid md:grid-cols-12 items-center gap-3 md:gap-4 px-3 py-2.5 rounded-xl transition-all cursor-pointer ${
                isCurrent
                  ? 'bg-cyan/10 border border-cyan/30 shadow-md shadow-cyan/5'
                  : 'hover:bg-white/5 border border-transparent hover:border-white/10'
              }`}
            >
              {/* Col 1: Index / Active Equalizer / Play icon */}
              <div className="w-6 md:w-auto md:col-span-1 flex items-center justify-center flex-shrink-0">
                {isCurrent && isPlaying ? (
                  <div className="flex items-end gap-[2px] h-3.5">
                    <span className="w-[3px] h-3 bg-cyan rounded-full animate-bounce [animation-delay:-0.3s]" />
                    <span className="w-[3px] h-3.5 bg-cyan rounded-full animate-bounce [animation-delay:-0.15s]" />
                    <span className="w-[3px] h-2 bg-cyan rounded-full animate-bounce" />
                  </div>
                ) : (
                  <>
                    <span
                      className={`text-xs font-mono group-hover:hidden ${
                        isCurrent ? 'text-cyan font-bold' : 'text-slate-400'
                      }`}
                    >
                      {idx + 1}
                    </span>
                    <button
                      className="hidden group-hover:inline-flex text-cyan hover:scale-110 transition-transform"
                      title="Play on Turntable"
                    >
                      <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </button>
                  </>
                )}
              </div>

              {/* Col 2: Thumbnail, Title, Artist */}
              <div className="flex items-center gap-3 min-w-0 flex-1 md:col-span-4">
                <img
                  src={
                    song.image ||
                    'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=100&auto=format&fit=crop&q=80'
                  }
                  alt={song.name}
                  className="w-11 h-11 rounded-lg object-cover bg-obsidian-800 flex-shrink-0 shadow-sm"
                  onError={(e) => {
                    e.target.src =
                      'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=100&auto=format&fit=crop&q=80';
                  }}
                />
                <div className="min-w-0">
                  <p
                    className={`text-xs sm:text-sm font-semibold truncate ${
                      isCurrent ? 'text-cyan' : 'text-white group-hover:text-cyan transition-colors'
                    }`}
                  >
                    {song.name}
                  </p>
                  <p className="text-xs text-slate-400 truncate">{song.artist}</p>
                </div>
              </div>

              {/* Col 3: Mood Vibe */}
              <div className="hidden md:block md:col-span-2">
                <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-obsidian-800 text-slate-300 border border-white/10 capitalize">
                  <span>✨</span>
                  <span>{song.mood_match || 'Dynamic Match'}</span>
                </span>
              </div>

              {/* Col 4: Explainable AI Badge */}
              <div className="hidden md:block md:col-span-3 min-w-0">
                <div
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald/10 border border-emerald/25 text-emerald text-[11px] truncate max-w-full"
                  title={song.ai_explanation || 'Curated to align with your emotional spectrum'}
                >
                  <span className="flex-shrink-0">💡</span>
                  <span className="truncate">
                    {song.ai_explanation || 'Matches your active listening aura'}
                  </span>
                </div>
              </div>

              {/* Col 5: Duration */}
              <div className="hidden md:block md:col-span-1 text-center font-mono text-xs text-slate-400">
                {formatDuration(song.duration)}
              </div>

              {/* Col 6: Actions (Like & Playlist) */}
              <div
                className="flex items-center justify-end gap-1.5 md:col-span-1 flex-shrink-0"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={(e) => toggleLike(song, e)}
                  className={`p-1.5 rounded-lg transition-colors ${
                    isLiked
                      ? 'text-rose-500'
                      : 'text-slate-400 hover:text-white hover:bg-white/10'
                  }`}
                  title={isLiked ? 'Unlike' : 'Like'}
                >
                  <svg
                    className="w-4 h-4"
                    fill={isLiked ? 'currentColor' : 'none'}
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.8}
                      d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                    />
                  </svg>
                </button>

                <AddToPlaylistButton song={song} compact={true} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom Minimise / Maximise Callout Banner (User Request 3) */}
      {allowToggle && songs.length > 5 && (
        <div className="pt-4 border-t border-white/10 mt-3 flex items-center justify-between px-2">
          <span className="text-xs text-slate-400 font-mono">
            {isExpanded
              ? `Showing all ${songs.length} curated recommendations`
              : `Showing top 5 of ${songs.length} recommendations`}
          </span>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="inline-flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-cyan border border-cyan/20 transition-all hover:scale-102"
          >
            {isExpanded ? (
              <>
                <span>▲ Minimise to Top 5</span>
              </>
            ) : (
              <>
                <span>▼ Maximise All ({songs.length} Tracks)</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default DenseTracklist;
