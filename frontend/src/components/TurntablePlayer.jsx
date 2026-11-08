import { useState, useRef, useEffect } from 'react';



import { useSelector, useDispatch } from 'react-redux';



import { useNavigate } from 'react-router-dom';



import {



  togglePlayPause,



  setPlaying,



  playNext,



  playPrevious,



  seekTo,



  setVolume,



  toggleMute,



  toggleShuffle,



  cycleRepeatMode,



  toggleTurntable,



  toggleQueue,



  closeQueue,



  setVideoMode,



  playSongAtIndex,



  closePlayer,



  moveQueueItem,



  moveSongToNext,



  removeFromQueue,



  clearUpcomingQueue,



  shuffleUpcomingQueue,



  openVibeCard,



  toggleSleepTimerModal,



  toggleShortcutsModal,



  toggleEqualizerModal,



  toggleMoodJourneyModal,



} from '../store/audioSlice';



import AudioVisualizerCanvas from './AudioVisualizerCanvas';



import axios from 'axios';



import { API_BASE_URL } from '../config/api';



import { resolveMusicTheme } from '../utils/themeMap';



import { resolveTrackArtwork, handleArtworkError } from '../utils/imageHelper';



import AddToPlaylistButton from './AddToPlaylistButton';







const formatTime = (seconds) => {



  if (isNaN(seconds) || seconds === null) return '0:00';



  const mins = Math.floor(seconds / 60);



  const secs = Math.floor(seconds % 60);



  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;



};







const MOOD_GLOW_COLORS = {



  happy: '#F59E0B',



  calm: '#00F2FE',



  focus: '#10B981',



  energetic: '#F97316',



  romantic: '#EC4899',



  sad: '#3B82F6',



  intense: '#EF4444',



};







const TurntablePlayer = ({ isModal = false, onClose }) => {



  const dispatch = useDispatch();



  const navigate = useNavigate();



  const progressBarRef = useRef(null);







  const {



    currentSong,



    queue,



    currentIndex,



    isPlaying,



    currentTime,



    duration,



    volume,



    isMuted,



    isShuffle,



    repeatMode,



    activeMood,



    isVideoMode,



    sleepTimer,



  } = useSelector((state) => state.audio);







  const [isLiked, setIsLiked] = useState(false);



  const turntableTab = useSelector((state) => state.audio.turntableTab);
  const [playerTab, setPlayerTab] = useState(turntableTab || (isVideoMode ? 'video' : 'vinyl'));

  useEffect(() => {
    if (turntableTab) {
      setPlayerTab(turntableTab);
    }
  }, [turntableTab]);



  const [lyricsData, setLyricsData] = useState(null);
  const [isLyricsLoading, setIsLyricsLoading] = useState(false);
  const [lyricsFontSize, setLyricsFontSize] = useState('md'); // 'sm' | 'md' | 'lg'
  const [copiedLyricsToast, setCopiedLyricsToast] = useState(false);







  useEffect(() => {



    if (!currentSong?.name) return;



    let isCancelled = false;



    setIsLyricsLoading(true);







    axios



      .get(`${API_BASE_URL}/api/lyrics`, {



        params: { name: currentSong.name, artist: currentSong.artist || '', duration: duration || 240 },



        timeout: 5000,



      })



      .then((res) => {



        if (!isCancelled) {



          setLyricsData(res.data);



          setIsLyricsLoading(false);



        }



      })



      .catch(() => {



        if (!isCancelled) setIsLyricsLoading(false);



      });







    return () => {



      isCancelled = true;



    };



  }, [currentSong?.name, currentSong?.artist]);















  // Customizable Queue drag & drop state



  const [draggedIndex, setDraggedIndex] = useState(null);



  const [dragOverIndex, setDragOverIndex] = useState(null);



  const [dropPosition, setDropPosition] = useState(null);



  const [queueToast, setQueueToast] = useState(null);







  const showQueueToast = (msg) => {



    setQueueToast(msg);



    setTimeout(() => setQueueToast(null), 3000);



  };







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







    const minUpcoming = Math.max(0, currentIndex + 1);



    const maxUpcoming = queue.length - 1;



    destIdx = Math.max(minUpcoming, Math.min(maxUpcoming, destIdx));







    if (destIdx !== draggedIndex) {



      dispatch(moveQueueItem({ fromIndex: draggedIndex, toIndex: destIdx }));



      const trackName = queue[draggedIndex]?.name || 'Track';



      const pos = destIdx - currentIndex;



      showQueueToast(`✨ Moved "${trackName}" to #${pos} in queue`);



    }







    setDraggedIndex(null);



    setDragOverIndex(null);



    setDropPosition(null);



  };







  const handleMoveUp = (idx, e) => {



    e.stopPropagation();



    if (idx <= currentIndex + 1) return;



    dispatch(moveQueueItem({ fromIndex: idx, toIndex: idx - 1 }));



    showQueueToast(`▲ Moved "${queue[idx]?.name}" up`);



  };







  const handleMoveDown = (idx, e) => {



    e.stopPropagation();



    if (idx >= queue.length - 1) return;



    dispatch(moveQueueItem({ fromIndex: idx, toIndex: idx + 1 }));



    showQueueToast(`▼ Moved "${queue[idx]?.name}" down`);



  };







  const handlePlayNextTrack = (idx, e) => {



    e.stopPropagation();



    dispatch(moveSongToNext(idx));



    showQueueToast(`⚡ "${queue[idx]?.name}" will play next!`);



  };







  const handleRemoveTrack = (idx, e) => {



    e.stopPropagation();



    const trackName = queue[idx]?.name || 'Track';



    dispatch(removeFromQueue(idx));



    showQueueToast(`✕ Removed "${trackName}" from queue`);



  };







  const handleSelectQueueTrack = (idx) => {



    dispatch(playSongAtIndex(idx));



    setPlayerTab('vinyl'); // Instantly transition to spinning 12" Vinyl Model!



    dispatch(setVideoMode(false));



  };







  // Strict guideline: colors totally based on song's mood and genre when playing!



  const theme = resolveMusicTheme(currentSong, activeMood);



  const moodColor = theme.accent;







  // Sync tab with external isVideoMode changes



  useEffect(() => {



    if (isVideoMode && playerTab !== 'video') {



      setPlayerTab('video');



    } else if (!isVideoMode && playerTab === 'video') {



      setPlayerTab('vinyl');



    }



  }, [isVideoMode]);







  useEffect(() => {



    if (!currentSong) return;



    // Guarantee that turntable immediately engages into active playing when loaded



    if (!isPlaying) {



      dispatch(setPlaying(true));



    }



    try {



      const stored = localStorage.getItem('liked_songs');



      if (stored) {



        const map = JSON.parse(stored);



        setIsLiked(!!map[currentSong.id || `${currentSong.name}-${currentSong.artist}`]);



      }



    } catch (e) {}



  }, [currentSong?.id, currentSong?.name]);







  const toggleLike = () => {



    if (!currentSong) return;



    const id = currentSong.id || `${currentSong.name}-${currentSong.artist}`;



    const nextState = !isLiked;



    setIsLiked(nextState);



    try {



      const stored = localStorage.getItem('liked_songs');



      const map = stored ? JSON.parse(stored) : {};



      map[id] = nextState;



      localStorage.setItem('liked_songs', JSON.stringify(map));



    } catch (e) {}



  };







  const handleSeekClick = (e) => {



    if (!progressBarRef.current || !duration) return;



    const rect = progressBarRef.current.getBoundingClientRect();



    const clickX = e.clientX - rect.left;



    const pct = Math.max(0, Math.min(1, clickX / rect.width));



    dispatch(seekTo(pct * duration));



  };







  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;







  const youtubeEmbedUrl = currentSong?.youtube_id



    ? `https://www.youtube-nocookie.com/embed/${currentSong.youtube_id}?autoplay=1&enablejsapi=1&rel=0&modestbranding=1`



    : `https://www.youtube-nocookie.com/embed?listType=search&list=${encodeURIComponent(



        `${currentSong?.name || ''} ${currentSong?.artist || ''} official music video`



      )}&autoplay=1`;







  const handleClose = () => {



    dispatch(closeQueue());



    if (onClose) {



      onClose();



    } else {



      dispatch(toggleTurntable());



      if (!isModal) {



        navigate(-1);



      }



    }



  };







  if (!currentSong) {



    return (



      <div className="flex flex-col items-center justify-center min-h-[70vh] p-6 text-center">



        <div className="w-24 h-24 rounded-full bg-obsidian-900 border border-obsidian-800 flex items-center justify-center text-slate-500 mb-4 shadow-inner">



          <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">



            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />



          </svg>



        </div>



        <h3 className="text-lg font-bold text-white mb-1">Turntable Standing By</h3>



        <p className="text-xs text-slate-400 max-w-sm mb-6">



          No song is currently active. Select a track or dial in a mood to spin up the analog vinyl engine.



        </p>



        <button



          onClick={() => navigate('/mood-detection')}



          className="px-5 py-2.5 rounded-xl bg-cyan/15 hover:bg-cyan/25 text-cyan border border-cyan/30 text-xs font-bold transition-all"



        >



          Dial In a Mood



        </button>



      </div>



    );



  }







  return (



    <div className={`relative w-full max-w-5xl mx-auto flex flex-col justify-between select-none ${isModal ? 'p-4 sm:p-8' : 'p-4 sm:p-6 my-4'}`}>



      {/* Top Bar / Header */}



      {/* Top Header: Responsive, Sleek & Contained (Never Outbursts) */}
      <div className="flex flex-wrap lg:flex-nowrap items-center justify-between gap-3 pb-3 border-b border-white/10 w-full mb-4">
        {/* Left: Brand & Live Format Status */}
        <div className="flex items-center gap-2.5 shrink-0">
          <span
            className="w-2.5 h-2.5 rounded-full animate-pulse"
            style={{ backgroundColor: moodColor, boxShadow: `0 0 8px ${moodColor}` }}
          />
          <div>
            <h2 className="text-xs sm:text-sm font-bold text-white uppercase tracking-widest font-mono">
              {playerTab === "queue"
                ? "Active Music Queue"
                : playerTab === "video"
                ? "HD Music Video Player"
                : playerTab === "lyrics"
                ? "Song Lyrics"
                : "Analog Vinyl Turntable"}
            </h2>
            <p className="text-[10px] text-slate-400 font-mono">
              Genre: <span style={{ color: moodColor }}>{theme.name}</span> • {playerTab === "video" ? "1080p Stream" : "33 ⅓ RPM Hi-Fi"}
            </p>
          </div>
        </div>

        {/* Center: Mode Switcher Tabs (Vinyl / Video / Lyrics / Queue) */}
        <div className="flex items-center p-0.5 rounded-xl bg-obsidian-950/90 border border-white/10 shadow-inner shrink-0">
          <button
            onClick={() => {
              setPlayerTab("vinyl");
              dispatch(setVideoMode(false));
            }}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              playerTab === "vinyl"
                ? "shadow-sm border"
                : "text-slate-400 hover:text-white"
            }`}
            style={{
              backgroundColor: playerTab === "vinyl" ? `${moodColor}22` : undefined,
              borderColor: playerTab === "vinyl" ? `${moodColor}55` : undefined,
              color: playerTab === "vinyl" ? moodColor : undefined,
            }}
            title="Switch to Analog Vinyl Turntable"
          >
            <span>🎵</span>
            <span>Vinyl</span>
          </button>

          <button
            onClick={() => {
              setPlayerTab("video");
              dispatch(setVideoMode(true));
            }}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              playerTab === "video"
                ? "bg-rose-500/20 text-rose-400 border border-rose-500/40 shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
            title="Switch to Music Video Section"
          >
            <span>🎬</span>
            <span>Video</span>
          </button>

          <button
            onClick={() => {
              setPlayerTab("lyrics");
              dispatch(setVideoMode(false));
            }}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              playerTab === "lyrics"
                ? "shadow-sm border"
                : "text-slate-400 hover:text-white"
            }`}
            style={{
              backgroundColor: playerTab === "lyrics" ? `${moodColor}22` : undefined,
              borderColor: playerTab === "lyrics" ? `${moodColor}55` : undefined,
              color: playerTab === "lyrics" ? moodColor : undefined,
            }}
            title="View Song Lyrics"
          >
            <span>📝</span>
            <span>Lyrics</span>
          </button>

          <button
            onClick={() => {
              setPlayerTab("queue");
              dispatch(setVideoMode(false));
            }}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              playerTab === "queue"
                ? "shadow-sm border"
                : "text-slate-400 hover:text-white"
            }`}
            style={{
              backgroundColor: playerTab === "queue" ? `${moodColor}22` : undefined,
              borderColor: playerTab === "queue" ? `${moodColor}55` : undefined,
              color: playerTab === "queue" ? moodColor : undefined,
            }}
            title="Show Queue & Change Tracks"
          >
            <span>≡</span>
            <span>Queue ({queue.length})</span>
          </button>
        </div>

        {/* Right: Tools & Window Controls (Minimal, Never Outbursts) */}
        <div className="flex items-center gap-1.5 shrink-0 ml-auto sm:ml-0">
          {/* Equalizer */}
          <button
            onClick={() => dispatch(toggleEqualizerModal())}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-obsidian-950/90 hover:bg-obsidian-800 text-slate-300 hover:text-white border border-white/10 text-xs font-bold transition-all cursor-pointer"
            title="5-Band Equalizer & Presets"
          >
            <span>🎚️</span>
            <span className="hidden xl:inline">EQ</span>
          </button>

          {/* Sleep Timer */}
          <button
            onClick={() => dispatch(toggleSleepTimerModal())}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
              sleepTimer?.active
                ? "bg-indigo-600/30 text-indigo-300 border-indigo-400 shadow-sm"
                : "bg-obsidian-950/90 text-slate-400 hover:text-white border-white/10"
            }`}
            title="Sleep Timer (Press S)"
          >
            <span>🌙</span>
            <span className="hidden xl:inline">
              {sleepTimer?.active
                ? (sleepTimer?.isEndOfTrack ? "Track" : `${Math.ceil((sleepTimer?.remainingSeconds ?? 0) / 60)}m`)
                : "Timer"}
            </span>
          </button>

          {/* Share Vibe Card */}
          <button
            onClick={() => dispatch(openVibeCard(currentSong))}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-obsidian-950/90 hover:bg-obsidian-800 text-slate-300 hover:text-white border border-white/10 text-xs font-bold transition-all cursor-pointer"
            title="Generate Shareable Vibe Card (Press V)"
          >
            <span>📸</span>
            <span className="hidden xl:inline">Share</span>
          </button>

          {/* Keyboard Shortcuts Guide */}
          <button
            onClick={() => dispatch(toggleShortcutsModal())}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-white bg-obsidian-950/90 hover:bg-obsidian-800 border border-white/10 transition-colors cursor-pointer text-xs font-bold"
            title="Keyboard Shortcuts (Press ?)"
          >
            ⌨️
          </button>

          {/* Minimize */}
          <button
            onClick={handleClose}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-white bg-obsidian-900/80 hover:bg-obsidian-800 border border-white/10 transition-colors cursor-pointer"
            title="Minimize to Bottom Bar"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* Close */}
          <button
            onClick={() => dispatch(closePlayer())}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-rose-400 hover:bg-rose-500/15 bg-obsidian-900/80 border border-white/10 transition-colors cursor-pointer"
            title="Remove Player from Screen (Stop & Close)"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Main Showcase Stage: EITHER Queue List OR Vinyl/Video View */}



      {playerTab === 'queue' ? (



        <div className="w-full space-y-4 my-2 animate-fadeIn">



          {/* Header Controls for Customizable Queue View */}



          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">



            <div>



              <div className="flex items-center gap-2">



                <h3 className="text-base font-bold text-white flex items-center gap-2">



                  <span>Customizable Playback Queue</span>



                  <span



                    className="text-[11px] font-mono px-2.5 py-0.5 rounded-full border"



                    style={{



                      color: moodColor,



                      borderColor: `${moodColor}40`,



                      backgroundColor: `${moodColor}15`,



                    }}



                  >



                    {Math.max(0, queue.length - (currentIndex + 1))} Upcoming Tracks



                  </span>



                </h3>



              </div>



              <p className="text-xs text-slate-400 mt-0.5">



                Drag handle <span className="font-mono text-slate-300">⠿</span> to reorder • Use <span className="text-amber-400 font-semibold">⚡ Play Next</span> &amp; arrows to customize upcoming tracks.



              </p>



            </div>







            <div className="flex items-center flex-wrap gap-2">



              {queue.length - (currentIndex + 1) > 1 && (



                <button



                  onClick={() => {



                    dispatch(shuffleUpcomingQueue());



                    showQueueToast('🔀 Upcoming queue shuffled!');



                  }}



                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 text-xs font-semibold transition-all hover:scale-102"



                  title="Shuffle upcoming songs in queue"



                >



                  <span>🔀 Shuffle</span>



                </button>



              )}







              {queue.length - (currentIndex + 1) > 0 && (



                <button



                  onClick={() => {



                    if (confirm('Clear upcoming tracks from queue?')) {



                      dispatch(clearUpcomingQueue());



                      showQueueToast('🗑️ Cleared upcoming queue');



                    }



                  }}



                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/25 text-xs font-semibold transition-all hover:scale-102"



                  title="Clear upcoming songs"



                >



                  <span>🗑️ Clear</span>



                </button>



              )}







              <button



                onClick={() => {



                  setPlayerTab('vinyl');



                  dispatch(setVideoMode(false));



                }}



                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-200 border border-white/15 text-xs font-semibold transition-all hover:scale-102"



              >



                <span>🎵 Vinyl Disc</span>



              </button>



              <button



                onClick={() => {



                  setPlayerTab('video');



                  dispatch(setVideoMode(true));



                }}



                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 text-xs font-semibold transition-all hover:scale-102"



              >



                <span>🎬 Video</span>



              </button>



            </div>



          </div>







          {/* Floating Queue Toast Notification */}



          {queueToast && (



            <div className="px-4 py-2 rounded-xl bg-obsidian-900 border border-cyan/40 text-cyan text-xs font-semibold shadow-lg animate-fadeIn flex items-center gap-2">



              <span className="w-2 h-2 rounded-full bg-cyan animate-ping" />



              <span>{queueToast}</span>



            </div>



          )}







          {/* Scrollable Customizable Queue Track List with Drag & Drop */}



          <div className="max-h-[50vh] overflow-y-auto space-y-2 pr-1 custom-scrollbar">



            {queue.map((song, idx) => {



              const isCurrent =



                currentSong &&



                (currentSong.id === song.id ||



                  (currentSong.name === song.name && currentSong.artist === song.artist));



              const isUpcoming = idx > currentIndex;



              const isPast = idx < currentIndex;



              const isDragOver = dragOverIndex === idx;







              return (



                <div



                  key={song.id || `${song.name}-${idx}`}



                  onClick={() => handleSelectQueueTrack(idx)}



                  draggable={isUpcoming}



                  onDragStart={(e) => isUpcoming && handleDragStart(e, idx)}



                  onDragOver={(e) => isUpcoming && handleDragOver(e, idx)}



                  onDragLeave={handleDragLeave}



                  onDrop={(e) => isUpcoming && handleDrop(e, idx)}



                  className={`group relative flex items-center justify-between p-3 rounded-2xl transition-all cursor-pointer border ${



                    isCurrent



                      ? 'border-cyan/40 shadow-lg'



                      : isDragOver



                      ? dropPosition === 'before'



                        ? 'border-t-2 border-cyan bg-cyan/10'



                        : 'border-b-2 border-cyan bg-cyan/10'



                      : 'bg-obsidian-900/60 hover:bg-obsidian-800/80 border-white/5 hover:border-white/15'



                  }`}



                  style={{



                    borderColor: isCurrent ? `${moodColor}80` : undefined,



                    backgroundColor: isCurrent ? `${moodColor}20` : undefined,



                  }}



                >



                  <div className="flex items-center gap-2 sm:gap-3.5 min-w-0 flex-1">



                    {/* Reorder / Drag Handle OR Equalizer / Track Index */}



                    <div className="flex items-center gap-1 flex-shrink-0">



                      {isUpcoming ? (



                        <div



                          className="cursor-grab active:cursor-grabbing p-1.5 text-slate-500 hover:text-white transition-colors flex items-center justify-center select-none"



                          title="Drag up or down to customize queue position"



                        >



                          <svg className="w-4 h-4 fill-current opacity-70 group-hover:opacity-100" viewBox="0 0 24 24">



                            <circle cx="8.5" cy="6" r="1.5" />



                            <circle cx="15.5" cy="6" r="1.5" />



                            <circle cx="8.5" cy="12" r="1.5" />



                            <circle cx="15.5" cy="12" r="1.5" />



                            <circle cx="8.5" cy="18" r="1.5" />



                            <circle cx="15.5" cy="18" r="1.5" />



                          </svg>



                        </div>



                      ) : (



                        <div className="w-4" />



                      )}







                      <div className="w-7 text-center">



                        {isCurrent && isPlaying ? (



                          <div className="flex items-end gap-0.5 h-3.5 justify-center">



                            <span className="w-1 rounded-full animate-bounce h-full" style={{ backgroundColor: moodColor }} />



                            <span className="w-1 rounded-full animate-bounce [animation-delay:-0.15s] h-2/3" style={{ backgroundColor: moodColor }} />



                            <span className="w-1 rounded-full animate-bounce [animation-delay:-0.3s] h-4/5" style={{ backgroundColor: moodColor }} />



                          </div>



                        ) : (



                          <span



                            className={`text-xs font-mono ${isCurrent ? 'font-bold' : isUpcoming ? 'text-slate-300 font-bold' : 'text-slate-500'}`}



                            style={{ color: isCurrent ? moodColor : undefined }}



                          >



                            {isUpcoming ? `#${idx - currentIndex}` : isCurrent ? '▶' : `-${currentIndex - idx}`}



                          </span>



                        )}



                      </div>



                    </div>







                    {/* Artwork with guaranteed resolver */}



                    <img



                      src={resolveTrackArtwork(song)}



                      alt={song.name}



                      className="w-11 h-11 rounded-xl object-cover bg-obsidian-950 flex-shrink-0 shadow-md cursor-pointer hover:scale-105 transition-transform"



                      onClick={() => handleSelectQueueTrack(idx)}



                      title="Click to play now"



                      onError={(e) => handleArtworkError(e, song)}



                    />







                    {/* Title & Artist */}



                    <div



                      className="min-w-0 flex-1 cursor-pointer"



                      onClick={() => handleSelectQueueTrack(idx)}



                      title="Click to play now"



                    >



                      <div className="flex items-center gap-2">



                        <h4



                          className={`text-xs sm:text-sm font-bold truncate transition-colors ${



                            isCurrent ? 'text-white' : 'text-slate-200 group-hover:text-white'



                          }`}



                        >



                          {song.name}



                        </h4>



                        {isCurrent && (



                          <span



                            className="text-[9px] font-mono px-1.5 py-0.2 rounded-md uppercase font-bold"



                            style={{



                              color: moodColor,



                              backgroundColor: `${moodColor}25`,



                              border: `1px solid ${moodColor}40`,



                            }}



                          >



                            Playing Now



                          </span>



                        )}



                        {isUpcoming && idx === currentIndex + 1 && (



                          <span className="text-[9px] font-mono px-1.5 py-0.2 rounded-md bg-amber-500/15 text-amber-300 border border-amber-500/30 uppercase font-bold">



                            Next Up



                          </span>



                        )}



                      </div>



                      <p className="text-[11px] text-slate-400 truncate mt-0.5">



                        {song.artist}



                      </p>



                    </div>



                  </div>







                  {/* Right: Customizable Queue Reorder Controls & Duration */}



                  <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0 ml-2">



                    {/* 1-Click Move Up / Down Controls for Upcoming Queue */}



                    {isUpcoming && (



                      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>



                        {/* Play Next (⚡) */}



                        {idx > currentIndex + 1 && (



                          <button



                            onClick={(e) => handlePlayNextTrack(idx, e)}



                            className="px-2 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 text-[10px] font-mono font-bold transition-all hover:scale-105"



                            title="Make this track play immediately next"



                          >



                            ⚡ Next



                          </button>



                        )}







                        {/* Move Up (▲) */}



                        <button



                          onClick={(e) => handleMoveUp(idx, e)}



                          disabled={idx <= currentIndex + 1}



                          className={`p-1.5 rounded-lg text-xs transition-all ${



                            idx <= currentIndex + 1



                              ? 'text-slate-600 cursor-not-allowed opacity-30'



                              : 'text-slate-400 hover:text-white hover:bg-white/10 hover:scale-110'



                          }`}



                          title="Move track up in queue"



                        >



                          ▲



                        </button>







                        {/* Move Down (▼) */}



                        <button



                          onClick={(e) => handleMoveDown(idx, e)}



                          disabled={idx >= queue.length - 1}



                          className={`p-1.5 rounded-lg text-xs transition-all ${



                            idx >= queue.length - 1



                              ? 'text-slate-600 cursor-not-allowed opacity-30'



                              : 'text-slate-400 hover:text-white hover:bg-white/10 hover:scale-110'



                          }`}



                          title="Move track down in queue"



                        >



                          ▼



                        </button>







                        {/* Remove from Queue (✕) */}



                        <button



                          onClick={(e) => handleRemoveTrack(idx, e)}



                          className="p-1.5 rounded-lg text-xs text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"



                          title="Remove from queue"



                        >



                          ✕



                        </button>



                      </div>



                    )}







                    <span className="hidden sm:inline-block text-[10px] font-mono px-2 py-0.5 rounded-full bg-obsidian-950 text-slate-400 border border-white/10 capitalize">



                      {song.mood_match || song.genre || 'Stream'}



                    </span>







                    <span className="text-xs font-mono text-slate-400 w-10 text-right">



                      {formatTime(song.duration)}



                    </span>







                    {/* Play Track button */}



                    <button



                      onClick={() => handleSelectQueueTrack(idx)}



                      className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 hover:scale-110 transition-transform"



                      style={{ color: isCurrent ? moodColor : undefined }}



                      title="Play track now"



                    >



                      <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">



                        <path d="M8 5v14l11-7z" />



                      </svg>



                    </button>



                  </div>



                </div>



              );



            })}



          </div>



        </div>



      ) : (



        /* Main Showcase Stage: Vinyl Disc OR Music Video */



        <div className="relative flex flex-col lg:flex-row items-center justify-around gap-8 sm:gap-12 my-6">



          {/* Dynamic Color Bleed Halo behind Player (matches track's mood/genre) */}



          <div



            className="absolute w-80 h-80 sm:w-96 sm:h-96 rounded-full blur-3xl opacity-30 transition-all duration-1000 pointer-events-none"



            style={{ backgroundColor: moodColor }}



          />







          {/* 1. Dual-Mode Lyrics Experience: Real-time Synced Karaoke + Full Complete Lyrics */}
          {playerTab === 'lyrics' ? (
          <div className="flex flex-col items-center w-full max-w-xl animate-fadeIn">
            <div className="relative w-full h-[420px] sm:h-[460px] rounded-3xl bg-slate-950/85 border border-white/15 p-4 sm:p-5 flex flex-col shadow-2xl backdrop-blur-2xl overflow-hidden">
              
              {/* Lyrics Panel Header */}
              <div className="flex items-center justify-between pb-3 border-b border-white/10 w-full shrink-0 gap-2 mb-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-base select-none">🎤</span>
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-bold text-white truncate max-w-[200px] sm:max-w-[280px]">
                      {currentSong.name}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium truncate max-w-[200px] sm:max-w-[280px]">
                      {currentSong.artist || 'Complete Lyrics'}
                    </span>
                  </div>
                </div>

                {/* Header Action Tools: Font Size Adjustment + 1-Click Copy */}
                <div className="flex items-center gap-2">
                  {/* Font size toggle */}
                  <div className="flex items-center bg-black/40 rounded-lg p-0.5 border border-white/10">
                    <button
                      onClick={() => setLyricsFontSize('sm')}
                      className={`px-1.5 py-0.5 rounded font-mono font-bold text-[10px] transition cursor-pointer ${
                        lyricsFontSize === 'sm' ? 'text-cyan bg-cyan/15' : 'text-slate-400 hover:text-white'
                      }`}
                      title="Smaller text"
                    >
                      A-
                    </button>
                    <button
                      onClick={() => setLyricsFontSize('md')}
                      className={`px-1.5 py-0.5 rounded font-mono font-bold text-[10px] transition cursor-pointer ${
                        lyricsFontSize === 'md' ? 'text-cyan bg-cyan/15' : 'text-slate-400 hover:text-white'
                      }`}
                      title="Medium text"
                    >
                      A
                    </button>
                    <button
                      onClick={() => setLyricsFontSize('lg')}
                      className={`px-1.5 py-0.5 rounded font-mono font-bold text-[10px] transition cursor-pointer ${
                        lyricsFontSize === 'lg' ? 'text-cyan bg-cyan/15' : 'text-slate-400 hover:text-white'
                      }`}
                      title="Larger text"
                    >
                      A+
                    </button>
                  </div>

                  {/* Copy full lyrics button */}
                  {lyricsData?.full_text && (
                    <button
                      onClick={() => {
                        if (lyricsData?.full_text) {
                          navigator.clipboard.writeText(lyricsData.full_text);
                          setCopiedLyricsToast(true);
                          setTimeout(() => setCopiedLyricsToast(false), 2000);
                        }
                      }}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 text-[10px] font-bold transition cursor-pointer active:scale-95"
                      title="Copy complete lyrics to clipboard"
                    >
                      {copiedLyricsToast ? (
                        <>
                          <span className="text-emerald-400">✓</span>
                          <span className="text-emerald-300">Copied</span>
                        </>
                      ) : (
                        <>
                          <span>📋</span>
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>

              {/* Complete Lyrics Content Body */}
              <div className="flex-1 w-full overflow-y-auto py-2 px-1 sm:px-2 custom-scrollbar text-left space-y-3">
                {isLyricsLoading ? (
                  <div className="h-full flex flex-col items-center justify-center py-20 text-slate-400 text-xs">
                    <div className="w-7 h-7 border-2 border-cyan/30 border-t-cyan rounded-full animate-spin mb-3"></div>
                    <span className="animate-pulse">Loading song lyrics...</span>
                  </div>
                ) : lyricsData?.full_text ? (
                  lyricsData.full_text.split('\n\n').map((verse, vIdx) => (
                    <div
                      key={vIdx}
                      className="bg-white/[0.03] hover:bg-white/[0.05] rounded-2xl p-4 border border-white/5 transition-all shadow-sm"
                    >
                      <p
                        className={`whitespace-pre-line leading-relaxed text-slate-200 font-medium ${
                          lyricsFontSize === 'sm' ? 'text-xs' : lyricsFontSize === 'lg' ? 'text-base' : 'text-sm'
                        }`}
                      >
                        {verse}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="h-full flex flex-col items-center justify-center py-20 text-center px-4">
                    <span className="text-3xl mb-3 opacity-60">📜</span>
                    <h4 className="text-sm font-bold text-slate-300 mb-1">No lyrics available for this song</h4>
                    <p className="text-xs text-slate-500 max-w-xs">
                      We couldn't extract lyrics for this track. Sit back and enjoy the music!
                    </p>
                  </div>
                )}
              </div>

            </div>
          </div>
        ) : playerTab === 'video' ? (



            <div className="flex flex-col items-center w-full max-w-lg animate-fadeIn">



              <div className="relative w-full aspect-video rounded-2xl overflow-hidden shadow-2xl border border-white/20 bg-black flex flex-col justify-between group">



                <iframe



                  src={youtubeEmbedUrl}



                  title={`${currentSong.name} - ${currentSong.artist}`}



                  className="w-full h-full border-0"



                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"



                  allowFullScreen



                />







                {/* Video Badge Overlay */}



                <div className="absolute top-2 left-2 z-10 pointer-events-none flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-black/70 backdrop-blur-md text-[10px] font-mono text-rose-400 border border-rose-500/30">



                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />



                  <span>HD Music Video</span>



                </div>



              </div>







              {/* Real-time Frequency Spectrum Visualizer */}



              <div className="w-full max-w-xs mt-3 px-2">



                <AudioVisualizerCanvas height={50} accentColor={moodColor} />



              </div>







              {/* Quick Switch Buttons */}



              <div className="flex items-center gap-2 mt-3">



                <button



                  onClick={() => {



                    setPlayerTab('vinyl');



                    dispatch(setVideoMode(false));



                  }}



                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 hover:bg-cyan/20 text-slate-300 hover:text-cyan border border-white/10 hover:border-cyan/30 text-xs font-semibold transition-all hover:scale-105"



                >



                  <span>🎵 Switch to Vinyl</span>



                </button>



                <button



                  onClick={() => {



                    setPlayerTab('queue');



                    dispatch(setVideoMode(false));



                  }}



                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 hover:bg-white/15 text-slate-300 hover:text-white border border-white/10 text-xs font-semibold transition-all hover:scale-105"



                  style={{ color: moodColor }}



                >



                  <span>≡ View Queue ({queue.length})</span>



                </button>



              </div>



            </div>



          ) : (



            <div className="flex flex-col items-center animate-fadeIn">



              {/* 12" Vinyl Disc Enclosure */}



              <div className="relative w-64 h-64 sm:w-80 sm:h-80 md:w-96 md:h-96 flex items-center justify-center">



                {/* Turntable Platter Base */}



                <div



                  className="absolute inset-0 rounded-full bg-obsidian-950 border border-obsidian-800 shadow-2xl"



                  style={{



                    boxShadow: `0 25px 60px -15px rgba(0,0,0,0.9), 0 0 35px ${moodColor}44`,



                  }}



                />







                {/* Rotating Vinyl Record */}



                <div



                  className={`relative w-[92%] h-[92%] rounded-full bg-[#0a0a0a] flex items-center justify-center shadow-2xl transition-transform ${



                    isPlaying ? 'animate-spin [animation-duration:6s]' : ''



                  }`}



                  style={{



                    boxShadow: 'inset 0 0 30px rgba(0,0,0,0.9), 0 4px 15px rgba(0,0,0,0.6)',



                  }}



                >



                  {/* Concentric Vinyl Grooves */}



                  <div className="absolute inset-4 rounded-full border border-white/5 opacity-50" />



                  <div className="absolute inset-8 rounded-full border border-white/5 opacity-60" />



                  <div className="absolute inset-12 rounded-full border border-white/5 opacity-70" />



                  <div className="absolute inset-16 rounded-full border border-white/5 opacity-50" />



                  <div className="absolute inset-20 rounded-full border border-white/5 opacity-60" />



                  <div className="absolute inset-24 rounded-full border border-white/5 opacity-40" />







                  {/* High-Gloss Vinyl Sheen Overlay */}



                  <div



                    className="absolute inset-0 rounded-full pointer-events-none opacity-25"



                    style={{



                      background:



                        'linear-gradient(135deg, rgba(255,255,255,0.4) 0%, transparent 40%, rgba(255,255,255,0.2) 60%, transparent 100%)',



                    }}



                  />







                  {/* Center Album Art Label */}



                  <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-full overflow-hidden border-4 border-obsidian-950 shadow-inner flex items-center justify-center bg-obsidian-900">



                    <img



                      src={resolveTrackArtwork(currentSong)}



                      alt={currentSong.name}



                      className="w-full h-full object-cover"



                      onError={(e) => handleArtworkError(e, currentSong)}



                    />



                    {/* Center Spindle Hole */}



                    <div className="absolute w-4 h-4 rounded-full bg-obsidian-950 border-2 border-white/40 shadow-inner" />



                  </div>



                </div>







                {/* Mechanical Tonearm Assembly */}



                <div



                  className={`absolute -top-4 -right-4 w-28 h-48 sm:w-36 sm:h-56 pointer-events-none origin-top-right transition-transform duration-700 ease-out z-20 ${



                    isPlaying ? 'rotate-12 translate-x-1' : '-rotate-6'



                  }`}



                >



                  {/* Pivot Base */}



                  <div className="absolute top-2 right-2 w-8 h-8 rounded-full bg-gradient-to-br from-slate-400 to-slate-700 border border-slate-400 shadow-md flex items-center justify-center">



                    <div className="w-3 h-3 rounded-full bg-slate-900" />



                  </div>



                  {/* Curved Metallic Arm */}



                  <div className="absolute top-6 right-5 w-1.5 h-36 bg-gradient-to-b from-slate-300 via-slate-400 to-slate-600 rounded-full shadow-lg transform -rotate-12 origin-top" />



                  {/* Cartridge & Stylus Needle */}



                  <div className="absolute bottom-6 left-6 w-4 h-7 bg-slate-900 border border-slate-600 rounded-sm shadow-md flex flex-col items-center justify-end">



                    <div className="w-1 h-1.5 bg-amber-400 rounded-full" />



                  </div>



                </div>



              </div>







              {/* Quick Switch Buttons */}



              <div className="flex items-center gap-2 mt-3">



                <button



                  onClick={() => {



                    setPlayerTab('video');



                    dispatch(setVideoMode(true));



                  }}



                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 hover:bg-rose-500/20 text-slate-300 hover:text-rose-300 border border-white/10 hover:border-rose-500/30 text-xs font-semibold transition-all hover:scale-105"



                >



                  <span>🎬 Watch Video</span>



                </button>



                <button



                  onClick={() => {



                    setPlayerTab('queue');



                    dispatch(setVideoMode(false));



                  }}



                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 hover:bg-white/15 text-slate-300 hover:text-white border border-white/10 text-xs font-semibold transition-all hover:scale-105"



                  style={{ color: moodColor }}



                >



                  <span>≡ View Queue ({queue.length})</span>



                </button>



              </div>



            </div>



          )}







        {/* Right Stage: Now Playing Info & Explainable AI */}



        <div className="flex-1 max-w-md w-full space-y-4 text-center lg:text-left">



          {/* Mood Badge */}



          <div className="flex items-center justify-center lg:justify-start gap-2">



            <span



              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold capitalize border"



              style={{



                backgroundColor: `${moodColor}18`,



                borderColor: `${moodColor}40`,



                color: moodColor,



              }}



            >



              <span>●</span>



              <span>{currentSong.mood_match || activeMood || 'Dynamic Match'}</span>



            </span>







            <span className="text-xs font-mono text-slate-500">• 320kbps Stream</span>



          </div>







          {/* Track Title & Artist */}



          <div>



            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-snug">



              {currentSong.name}



            </h1>



            <p className="text-base sm:text-lg font-medium text-slate-300 mt-1">



              {currentSong.artist}



            </p>



          </div>







          {/* Explainable AI Badge - Strictly hidden for user-searched or manually chosen songs */}



          {Boolean(



            currentSong.ai_explanation &&



            currentSong.source !== 'search' &&



            currentSong.source !== 'manual' &&



            currentSong.source !== 'favorites' &&



            !currentSong.isUserSelected



          ) && (



            <div className="p-3.5 rounded-2xl bg-emerald/10 border border-emerald/25 text-emerald text-xs leading-relaxed flex items-start gap-2.5 animate-fadeIn">



              <span className="text-sm mt-0.5 flex-shrink-0">💡</span>



              <div>



                <span className="font-semibold block mb-0.5">Why AI Recommended This:</span>



                <p className="text-emerald-200/90 text-[11px]">



                  {currentSong.ai_explanation}



                </p>



              </div>



            </div>



          )}







          {/* Scrubber Progress Bar */}



          <div className="space-y-1.5 pt-2">



            <div



              ref={progressBarRef}



              onClick={handleSeekClick}



              className="group relative w-full h-2.5 bg-obsidian-950/80 rounded-full cursor-pointer overflow-hidden border border-obsidian-800"



            >



              <div



                className="h-full rounded-full transition-all duration-150"



                style={{



                  width: `${progressPercent}%`,



                  background: `linear-gradient(90deg, ${moodColor} 0%, #ffffff 100%)`,



                }}



              />



            </div>



            <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">



              <span>{formatTime(currentTime)}</span>



              <span>{formatTime(duration)}</span>



            </div>



          </div>







          {/* Transport Controls */}



          <div className="flex items-center justify-center lg:justify-start gap-4 pt-2">



            {/* Shuffle */}



            <button



              onClick={() => dispatch(toggleShuffle())}



              className={`p-2 rounded-xl transition-colors ${



                isShuffle ? 'text-cyan bg-cyan/10' : 'text-slate-400 hover:text-white'



              }`}



              title="Shuffle"



            >



              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">



                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H4v-4m16 4h-4v-4m0-4h4V4M4 8h4V4m4 12l8 4M4 20l16-16" />



              </svg>



            </button>







            {/* Previous */}



            <button



              onClick={() => dispatch(playPrevious())}



              className="p-2 text-slate-300 hover:text-white hover:scale-110 transition-transform"



              title="Previous"



            >



              <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">



                <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />



              </svg>



            </button>







            {/* Play / Pause Giant Button */}



            <button



              onClick={() => dispatch(togglePlayPause())}



              className="w-14 h-14 rounded-full flex items-center justify-center text-obsidian-950 shadow-xl transition-all hover:scale-105 active:scale-95"



              style={{



                background: `linear-gradient(135deg, ${moodColor} 0%, #ffffff 100%)`,



                boxShadow: `0 8px 25px -4px ${moodColor}77`,



              }}



              title={isPlaying ? 'Pause' : 'Play'}



            >



              {isPlaying ? (



                <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">



                  <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />



                </svg>



              ) : (



                <svg className="w-6 h-6 fill-current ml-0.5" viewBox="0 0 24 24">



                  <path d="M8 5v14l11-7z" />



                </svg>



              )}



            </button>







            {/* Next */}



            <button



              onClick={() => dispatch(playNext())}



              className="p-2 text-slate-300 hover:text-white hover:scale-110 transition-transform"



              title="Next"



            >



              <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">



                <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />



              </svg>



            </button>







            {/* Repeat */}



            <button



              onClick={() => dispatch(cycleRepeatMode())}



              className={`p-2 rounded-xl transition-colors relative ${



                repeatMode !== 'off' ? 'text-cyan bg-cyan/10' : 'text-slate-400 hover:text-white'



              }`}



              title={`Repeat: ${repeatMode}`}



            >



              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">



                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />



              </svg>



              {repeatMode === 'one' && (



                <span className="absolute top-1 right-1 text-[8px] font-bold text-cyan">1</span>



              )}



            </button>







            {/* Like */}



            <button



              onClick={toggleLike}



              className={`p-2 rounded-xl transition-colors ${



                isLiked ? 'text-rose-500' : 'text-slate-400 hover:text-white'



              }`}



              title={isLiked ? 'Unlike' : 'Like'}



            >



              <svg className="w-5 h-5" fill={isLiked ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor">



                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />



              </svg>



            </button>







            {/* Add to Playlist */}



            <AddToPlaylistButton song={currentSong} compact={true} />



          </div>







          {/* Quick "Up Next in Queue" switcher card (direct track changing) */}



          {queue.length > 1 && (



            <div



              onClick={() => setPlayerTab('queue')}



              className="p-3 rounded-2xl bg-obsidian-950/70 border border-white/10 hover:border-white/20 transition-all cursor-pointer group flex items-center justify-between gap-3 mt-4"



            >



              <div className="flex items-center gap-2.5 min-w-0">



                <span className="text-base">📋</span>



                <div className="min-w-0 text-left">



                  <span className="text-[10px] uppercase font-mono tracking-wider block text-slate-400">



                    Up Next in Queue ({queue.length} Tracks)



                  </span>



                  <p className="text-xs font-bold text-white group-hover:underline truncate mt-0.5">



                    {queue[(currentIndex + 1) % queue.length]?.name || 'Next track'} • {queue[(currentIndex + 1) % queue.length]?.artist}



                  </p>



                </div>



              </div>



              <span



                className="text-[11px] font-bold flex items-center gap-1 group-hover:translate-x-0.5 transition-transform flex-shrink-0"



                style={{ color: moodColor }}



              >



                <span>Change Track</span>



                <span>→</span>



              </span>



            </div>



          )}



        </div>



      </div>



    )}



    </div>



  );



};







export default TurntablePlayer;



