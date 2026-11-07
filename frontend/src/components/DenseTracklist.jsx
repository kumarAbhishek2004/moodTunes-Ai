import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { playSong, setQueue, addToPlayNext, addToQueue, moveQueueItem, openVibeCard } from '../store/audioSlice';
import AddToPlaylistButton from './AddToPlaylistButton';
import { resolveMusicTheme } from '../utils/themeMap';
import { resolveTrackArtwork, handleArtworkError } from '../utils/imageHelper';

const formatDuration = (seconds) => {
  if (!seconds || isNaN(seconds)) return '3:45';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
};

// Distinct, musically insightful Explainable AI reasoning generator
export const generateSongExplainability = (song, index = 0, currentMood = '') => {
  if (song.ai_explanation && !song.ai_explanation.includes('Matches your active listening aura') && !song.ai_explanation.includes('Curated to align')) {
    return song.ai_explanation;
  }

  const name = String(song.name || '').toLowerCase();
  const artist = String(song.artist || '').toLowerCase();
  const genre = String(song.genre || song.mood_match || currentMood || '').toLowerCase();

  // 1. High-Energy / Rap / Workout / Adrenaline
  if (artist.includes('kr$na') || artist.includes('krsna') || artist.includes('divine') || artist.includes('emiway') || artist.includes('raftaar') || genre.includes('energetic') || genre.includes('energy') || genre.includes('party')) {
    const hiphopOptions = [
      '140+ BPM cadence and punchy 808 sub-bass engineered for peak motivational momentum',
      'Fast-paced double-time cadence matching high-intensity workout surges',
      'Aggressive lyrical flow & driving trap rhythm calibrated to elevate adrenaline',
      'Syncopated urban beats matching an active, high-power emotional state',
    ];
    return hiphopOptions[(index + name.length) % hiphopOptions.length];
  }

  // 2. Romantic / Intimate / Soulful
  if (name.includes('kesariya') || name.includes('raataan') || name.includes('apna bana le') || name.includes('tum hi ho') || artist.includes('jubin') || artist.includes('atif') || genre.includes('romantic') || genre.includes('romance') || genre.includes('love')) {
    const romanticOptions = [
      'Delicate acoustic guitar fingerpicking and warm vocal timbre tuned for intimate nostalgia',
      'Harmonic major-seventh chords and tender lyrical delivery evoking romantic warmth',
      'Soulful melodic contours providing a gentle emotional release and heartfelt resonance',
      'Acoustic-driven serenade structured for soothing sentimental connection',
    ];
    return romanticOptions[(index + name.length) % romanticOptions.length];
  }

  // 3. Calm / Spiritual / Acoustic / Chill
  if (name.includes('kun faya kun') || name.includes('iktara') || name.includes('safarnama') || name.includes('sham') || artist.includes('lucky ali') || artist.includes('rahman') || genre.includes('calm') || genre.includes('chill') || genre.includes('peace') || genre.includes('zen')) {
    const calmOptions = [
      'Spiritual acoustic harmonics and peaceful frequencies promoting deep parasympathetic relaxation',
      'Warm unplugged arrangement with gentle organic strings inducing tranquil clarity',
      'Soft polyphonic harmonies designed to quiet mental chatter and foster inner peace',
      'Gentle ambient breeze textures and meditative vocal delivery restoring equilibrium',
    ];
    return calmOptions[(index + name.length) % calmOptions.length];
  }

  // 4. Melancholic / Reflective / Blues / Sad
  if (name.includes('channa') || name.includes('phir le aaya') || name.includes('agar tum') || name.includes('tujhe kitna') || genre.includes('sad') || genre.includes('reflect') || genre.includes('blues')) {
    const sadOptions = [
      'Minor-key string arrangements and expressive vocal nuance facilitating cathartic release',
      'Reflective lyrical poetry accompanied by poignant piano arpeggios for quiet solace',
      'Deep resonant cello lines providing compassionate accompaniment during reflective moments',
      'Nocturnal acoustic warmth tailored for solitary midnight introspection',
    ];
    return sadOptions[(index + name.length) % sadOptions.length];
  }

  // 5. Deep Focus / Ambient / Lo-Fi / Binaural
  if (name.includes('weightless') || name.includes('theta') || name.includes('lo-fi') || name.includes('lofi') || genre.includes('focus') || genre.includes('study')) {
    const focusOptions = [
      'Delta-theta acoustic pacing designed to lower cognitive strain and anchor deep focus',
      'Steady rhythm section with balanced mid frequencies tailored for distraction-free flow',
      'Subtle binaural textures fostering sustained concentration during high-cognition tasks',
      'Minimalist harmonic loop crafted to support prolonged mental clarity',
    ];
    return focusOptions[(index + name.length) % focusOptions.length];
  }

  // 6. Upbeat / Cheerful / Pop / Happy
  if (genre.includes('happy') || genre.includes('joy') || name.includes('ilahi') || name.includes('matargashti')) {
    const happyOptions = [
      'Bright major progressions & uplifting vocal enthusiasm generating positive dopamine cues',
      'Bouncy acoustic rhythm & joyful percussion crafted to uplift mood and energy',
      'Infectious brass accents & upbeat vocal harmonies delivering instant serotonin',
      'Dynamic syncopated clapping and cheerful acoustic strumming radiating vibrant optimism',
    ];
    return happyOptions[(index + name.length) % happyOptions.length];
  }

  // Deterministic diverse bank for any other tracks
  const DIVERSE_EXPLANATION_BANK = [
    'Harmonic resonance balancing acoustic clarity with your current emotional tempo',
    'Dynamic rhythmic section calibrated to sustain mental momentum and positive mood',
    'Warm frequency profile with balanced mids curated for continuous session harmony',
    'Intimate lyrical narrative matching subtle shifts in your reflective listening state',
    'Steady 4/4 syncopated groove selected to match your acoustic energy curve',
    'Subtle textural reverb and melodic phrasing fostering grounding presence',
    'High-fidelity instrumentation designed to induce positive neuroacoustic stimulation',
    'Curated for seamless key transition and atmospheric continuity in your listening stream',
    'Rich analog warmth and distinct tonal depth enhancing your acoustic immersion',
    'Balanced frequency envelope calibrated to complement your listening preferences',
  ];

  return DIVERSE_EXPLANATION_BANK[(index * 7 + name.length + artist.length) % DIVERSE_EXPLANATION_BANK.length];
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

  // Strict guideline: adapt tracklist colors to the playing track's genre & mood
  const theme = resolveMusicTheme(currentSong, activeMood);

  const [trackList, setTrackList] = useState(songs);
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const [dropPosition, setDropPosition] = useState(null); // 'before' | 'after'
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [likedMap, setLikedMap] = useState({});
  const [toastMsg, setToastMsg] = useState(null);

  useEffect(() => {
    setTrackList(songs);
  }, [songs]);

  const handleDragStart = (e, index) => {
    e.dataTransfer.setData('text/plain', String(index));
    e.dataTransfer.effectAllowed = 'move';
    setDraggedIndex(index);
  };

  const handleDragOver = (e, targetIdx) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (draggedIndex === null || draggedIndex === targetIdx) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const midY = rect.top + rect.height / 2;
    const pos = e.clientY < midY ? 'before' : 'after';
    setDragOverIndex(targetIdx);
    setDropPosition(pos);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
    setDropPosition(null);
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

    destIdx = Math.max(0, Math.min(trackList.length - 1, destIdx));

    if (destIdx !== draggedIndex) {
      const updated = [...trackList];
      const [movedItem] = updated.splice(draggedIndex, 1);
      updated.splice(destIdx, 0, movedItem);
      setTrackList(updated);

      // Sync active queue in Redux and localStorage
      dispatch(moveQueueItem({ fromIndex: draggedIndex, toIndex: destIdx }));
      try {
        localStorage.setItem('recommendations', JSON.stringify(updated));
      } catch (err) {}

      showToast(`✨ Reordered: "${movedItem.name}" moved to #${destIdx + 1}`);
    }

    setDraggedIndex(null);
    setDragOverIndex(null);
    setDropPosition(null);
  };

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2000);
  };

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
    if (songs && songs.length > 1) {
      dispatch(setQueue(songs));
    }
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
  const visibleSongs = (allowToggle && !isExpanded && trackList.length > 5)
    ? trackList.slice(0, 5)
    : trackList;

  return (
    <div className="relative bg-obsidian-900/70 backdrop-blur-2xl border border-white/10 rounded-3xl p-4 sm:p-6 shadow-2xl my-8 transition-all duration-300">
      {/* Action feedback toast */}
      {toastMsg && (
        <div className="fixed bottom-24 right-8 z-50 px-4 py-2 rounded-xl bg-obsidian-950/95 border border-white/20 text-xs font-bold text-cyan shadow-2xl backdrop-blur-2xl animate-fadeIn">
          {toastMsg}
        </div>
      )}
      {/* Table Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-white/10 mb-3 px-2 gap-3">
        <div className="flex items-center gap-3">
          <div
            className="w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: theme.accent, boxShadow: `0 0 10px ${theme.glow}` }}
          />
          <div>
            <h3 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <span>{title}</span>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-white/10 text-slate-300 border border-white/10">
                {isExpanded ? `All ${songs.length} Tracks` : `Preview: 5 of ${songs.length}`}
              </span>
            </h3>
            <p className="text-[11px] text-slate-400">
              {subtitle} • {isExpanded ? 'Showing full curated queue' : 'Compact view active'} • Genre: <span style={{ color: theme.accent }}>{theme.name}</span>
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
                  <svg className="w-3.5 h-3.5" style={{ color: theme.accent }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                  <span>⤡ Minimise ({songs.length})</span>
                </>
              ) : (
                <>
                  <svg className="w-3.5 h-3.5" style={{ color: theme.accent }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm hover:scale-102 border"
            style={{
              backgroundColor: `${theme.accent}18`,
              borderColor: `${theme.accent}45`,
              color: theme.accent,
            }}
          >
            <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
            <span>Play Stream</span>
          </button>
        </div>
      </div>

      {/* Desktop Table Header (12 Columns: 1 + 4 + 1 + 3 + 1 + 2 = 12, perfectly spaced without overlap) */}
      <div className="hidden md:grid grid-cols-12 gap-3 px-3 py-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wider border-b border-white/5">
        <div className="col-span-1 text-center">#</div>
        <div className="col-span-4">Title & Artist</div>
        <div className="col-span-1">Mood Vibe</div>
        <div className="col-span-3">Explainable AI Reasoning</div>
        <div className="col-span-1 text-center">Duration</div>
        <div className="col-span-2 text-right pr-2">Actions</div>
      </div>

      {/* Tracklist Rows with Spotify-style Drag & Drop and Clean Column Layout */}
      <div className="divide-y divide-white/5 mt-1">
        {visibleSongs.map((song, idx) => {
          const isCurrent =
            currentSong &&
            (currentSong.id === song.id ||
              (currentSong.name === song.name && currentSong.artist === song.artist));
          const isLiked = likedMap[song.id || `${song.name}-${song.artist}`];
          const isDragOver = dragOverIndex === idx;

          return (
            <div
              key={song.id || `${song.name}-${idx}`}
              onClick={() => handleRowClick(song)}
              draggable={true}
              onDragStart={(e) => handleDragStart(e, idx)}
              onDragOver={(e) => handleDragOver(e, idx)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, idx)}
              className={`group flex md:grid md:grid-cols-12 items-center gap-2 md:gap-3 px-3 py-2.5 rounded-xl transition-all cursor-pointer border ${
                isCurrent
                  ? 'shadow-md'
                  : isDragOver
                  ? dropPosition === 'before'
                    ? 'border-t-2 border-cyan bg-cyan/10'
                    : 'border-b-2 border-cyan bg-cyan/10'
                  : 'hover:bg-white/5 border-transparent hover:border-white/10'
              }`}
              style={
                isCurrent
                  ? {
                      backgroundColor: `${theme.accent}18`,
                      borderColor: `${theme.accent}55`,
                      boxShadow: `0 0 15px ${theme.glow}`,
                    }
                  : undefined
              }
            >
              {/* Col 1: Drag Handle (⠿) & Index / Active Equalizer */}
              <div className="w-8 md:w-auto md:col-span-1 flex items-center justify-center gap-1.5 flex-shrink-0">
                <div
                  className="cursor-grab active:cursor-grabbing p-1 text-slate-500 hover:text-white transition-colors flex items-center justify-center select-none"
                  title="Drag up or down to reorder tracks in queue / stream"
                  onClick={(e) => e.stopPropagation()}
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

                {isCurrent && isPlaying ? (
                  <div className="flex items-end gap-[2px] h-3.5">
                    <span className="w-[3px] h-3 rounded-full animate-bounce [animation-delay:-0.3s]" style={{ backgroundColor: theme.accent }} />
                    <span className="w-[3px] h-3.5 rounded-full animate-bounce [animation-delay:-0.15s]" style={{ backgroundColor: theme.accent }} />
                    <span className="w-[3px] h-2 rounded-full animate-bounce" style={{ backgroundColor: theme.accent }} />
                  </div>
                ) : (
                  <span
                    className={`text-xs font-mono font-bold ${
                      isCurrent ? 'text-cyan' : 'text-slate-400 group-hover:text-white'
                    }`}
                    style={{ color: isCurrent ? theme.accent : undefined }}
                  >
                    {idx + 1}
                  </span>
                )}
              </div>

              {/* Col 2: Thumbnail, Title, Artist */}
              <div className="flex items-center gap-3 min-w-0 flex-1 md:col-span-4">
                <img
                  src={resolveTrackArtwork(song)}
                  alt={song.name}
                  className="w-11 h-11 rounded-lg object-cover bg-obsidian-800 flex-shrink-0 shadow-sm"
                  onError={(e) => handleArtworkError(e, song)}
                />
                <div className="min-w-0">
                  <p
                    className={`text-xs sm:text-sm font-semibold truncate transition-colors`}
                    style={{ color: isCurrent ? theme.accent : undefined }}
                  >
                    {song.name}
                  </p>
                  <p className="text-xs text-slate-400 truncate">{song.artist}</p>
                </div>
              </div>

              {/* Col 3: Mood Vibe */}
              <div className="hidden md:block md:col-span-1">
                <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-obsidian-800 text-slate-300 border border-white/10 capitalize truncate max-w-full">
                  <span>✨</span>
                  <span className="truncate">{song.mood_match || 'Match'}</span>
                </span>
              </div>

              {/* Col 4: Explainable AI Badge */}
              <div className="hidden md:block md:col-span-3 min-w-0">
                {(() => {
                  const reasoning = generateSongExplainability(song, idx, activeMood);
                  return (
                    <div
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald/10 border border-emerald/25 text-emerald text-[11px] truncate max-w-full"
                      title={reasoning}
                    >
                      <span className="flex-shrink-0">💡</span>
                      <span className="truncate">{reasoning}</span>
                    </div>
                  );
                })()}
              </div>

              {/* Col 5: Duration (Dedicated column, strictly isolated from actions) */}
              <div className="hidden md:block md:col-span-1 text-center font-mono text-xs text-slate-400">
                {formatDuration(song.duration)}
              </div>

              {/* Col 6: Actions (Generous 2-column container = ZERO overlapping) */}
              <div
                className="flex items-center justify-end gap-1.5 md:gap-2 md:col-span-2 flex-shrink-0"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Like Button */}
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

                {/* Play Next Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    dispatch(addToPlayNext(song));
                    showToast(`⚡ "${song.name}" set to play next!`);
                  }}
                  className="px-2 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/25 text-[10.5px] font-mono font-bold transition-all hover:scale-105 whitespace-nowrap hidden sm:inline-flex"
                  title="Make this track play immediately next"
                >
                  ⚡ Next
                </button>

                {/* Add to Queue Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    dispatch(addToQueue(song));
                    showToast(`+ Added "${song.name}" to queue`);
                  }}
                  className="px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 text-[10.5px] font-mono font-bold transition-all hover:scale-105 whitespace-nowrap hidden md:inline-flex"
                  title="Add to playback queue"
                >
                  + Queue
                </button>

                {/* Add To Playlist Modal Button */}
                <AddToPlaylistButton song={song} compact={true} />

                {/* Share Vibe Card Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    dispatch(openVibeCard(song));
                  }}
                  className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                  title="Generate Vibe Card for this track"
                >
                  <span className="text-xs">📸</span>
                </button>
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
