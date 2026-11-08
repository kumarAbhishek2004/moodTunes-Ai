import { createSlice } from '@reduxjs/toolkit';

import { resolveKnownYouTubeId } from '../utils/songMap';

import { getUserHistory, saveUserHistory, clearUserHistory } from '../utils/userStorage';



// Retrieve cached state safely without risking JSON parsing crashes

const cachedQueue = (() => {

  try {

    const raw = localStorage.getItem('recommendations');

    if (!raw) return [];

    const parsed = JSON.parse(raw);

    return Array.isArray(parsed) ? parsed : [];

  } catch (e) {

    return [];

  }

})();



const cachedCurrentSong = (() => {

  try {

    const raw = localStorage.getItem('currentSong');

    if (!raw) return null;

    return JSON.parse(raw);

  } catch (e) {

    return null;

  }

})();



const cachedCurrentIndex = (() => {

  try {

    const raw = localStorage.getItem('currentIndex');

    if (raw !== null && raw !== undefined) {

      const idx = parseInt(raw, 10);

      return !isNaN(idx) && idx >= 0 ? idx : 0;

    }

  } catch (e) {}

  return 0;

})();



const cachedPlaybackPosition = (() => {

  try {

    const raw = localStorage.getItem('playbackPosition');

    if (raw !== null && raw !== undefined) {

      const pos = parseFloat(raw);

      return !isNaN(pos) && pos > 0 ? pos : 0;

    }

  } catch (e) {}

  return 0;

})();



// Calculate initial song and index accurately so refresh stays on current track

const resolvedInitial = (() => {

  if (!cachedQueue || cachedQueue.length === 0) {

    return { song: cachedCurrentSong || null, index: 0 };

  }



  // 1. If we have a cached current song, match it within the queue

  if (cachedCurrentSong) {

    const matchIdx = cachedQueue.findIndex(

      (s) => (s.id && s.id === cachedCurrentSong.id) ||

             (s.name?.toLowerCase() === cachedCurrentSong.name?.toLowerCase() &&

              s.artist?.toLowerCase() === cachedCurrentSong.artist?.toLowerCase())

    );

    if (matchIdx !== -1) {

      return { song: cachedQueue[matchIdx], index: matchIdx };

    }

  }



  // 2. If index is valid within cachedQueue

  if (cachedCurrentIndex >= 0 && cachedCurrentIndex < cachedQueue.length) {

    return { song: cachedQueue[cachedCurrentIndex], index: cachedCurrentIndex };

  }



  // 3. Fallback to first track

  return { song: cachedQueue[0], index: 0 };

})();



const initialMood = (() => {

  try {

    const raw = localStorage.getItem('selectedMood');

    if (!raw) return 'happy';

    const parsed = JSON.parse(raw);

    if (typeof parsed === 'string') return parsed.toLowerCase();

    if (parsed && typeof parsed === 'object') {

      const m = parsed.mood || parsed.id;

      if (m) return String(m).toLowerCase();

    }

    return 'happy';

  } catch (e) {

    return 'happy';

  }

})();



const cachedHistory = getUserHistory();



const initialState = {

  currentSong: resolvedInitial.song,

  queue: cachedQueue,

  playbackHistory: cachedHistory,

  currentIndex: resolvedInitial.index,

  isPlaying: false,

  volume: 75,

  isMuted: false,

  currentTime: cachedPlaybackPosition,

  duration: 240, // default placeholder until metadata loads

  seekTarget: cachedPlaybackPosition > 0 ? cachedPlaybackPosition : null, // trigger seek in engine

  activeMood: initialMood,

  isTurntableOpen: false,
  turntableTab: 'vinyl',

  isVideoMode: false,

  isQueueOpen: false,

  isShuffle: false,

  repeatMode: 'off', // 'off' | 'all' | 'one'

  isPlayerDismissed: false, // Allows removing the player dock from the screen
  isChatbotOpen: false, // Global Aura AI / Voice Assistant open state



  // Feature 1: Sleep Timer (Fade-Out Mode)

  sleepTimer: {

    active: false,

    durationMinutes: null,

    targetTimestamp: null,

    isEndOfTrack: false,

    remainingSeconds: 0,

    initialVolumeBeforeFade: null,

  },

  isSleepTimerModalOpen: false,



  // Feature 2: Global Keyboard Shortcuts Help

  isShortcutsModalOpen: false,



  // Feature 4: Smart Mood Elevation (AI DJ Mode)

  smartMoodElevation: {

    enabled: true,

    lastElevatedSongId: null,

    elevationToast: null,

  },



  // Feature 5: Shareable Vibe Card

  isVibeCardOpen: false,

  vibeCardSong: null,



  // Feature 6: Hands-Free Voice DJ ("Hey Abhi")

  voiceDJ: {

    isEnabled: true,

    wakeStatus: 'idle', // 'idle' | 'wake_detected' | 'processing' | 'success' | 'error'

    transcript: '',

    feedbackText: '',

    feedbackType: '', // 'youtube' | 'playlist' | 'control' | 'mood' | 'error'

  },



  // Feature 7: Smooth Crossfade & Seamless Transitions (3-5s)

  crossfade: {

    enabled: false,

    durationSeconds: 3, // 0, 2, 3, 5

    isFadingOut: false,

    isFadingIn: false,

  },



  // Feature 9: AI Mood Journey Roadmap

  isMoodJourneyModalOpen: false,



  // Feature 8: 5-Band Equalizer & Sound Presets

  equalizer: {

    isOpen: false,

    preset: 'flat', // 'flat' | 'bass_heavy' | 'vocals' | 'vinyl' | 'lofi' | 'night' | 'acoustic' | 'custom'

    gains: {

      band60: 0,

      band250: 0,

      band1k: 0,

      band4k: 0,

      band16k: 0,

    },

  },

};



export const audioSlice = createSlice({

  name: 'audio',

  initialState,

  reducers: {

    playSong: (state, action) => {

      let song = { ...action.payload };

      if (!song) return;



      // Ground truth authority: ALWAYS prioritize verified YouTube ID from resolveKnownYouTubeId

      const isRaataan = String(song.name || '').toLowerCase().includes('raataan');

      const knownId = resolveKnownYouTubeId(song.name, song.artist);

      if (knownId) {

        song.youtube_id = knownId;

      } else if (song.youtube_id === 'gvyUuxdRdR4' && !isRaataan) {

        song.youtube_id = null; // Clear incorrect fallback

      }



      state.currentSong = song;

      state.isPlaying = true;

      state.currentTime = 0;

      state.isTurntableOpen = true; // Open on music player section when music is played!

      state.isVideoMode = false;

      state.isPlayerDismissed = false;

      

      // Only fallback-update mood if user hasn't actively dialed or chosen an atmosphere

      if (song.mood_match && !state.activeMood) {

        state.activeMood = song.mood_match.toLowerCase();

      }



      // Add to queue if not present or update existing

      const index = state.queue.findIndex((s) => s.id === song.id || (s.name === song.name && s.artist === song.artist));

      if (index === -1) {

        state.queue.unshift(song);

        state.currentIndex = 0;

      } else {

        state.queue[index] = song;

        state.currentIndex = index;

      }



      // Strictly record into playback history (ONLY past 20 tracks actually played by the user)

      const prevHist = state.playbackHistory || [];

      const deduplicated = prevHist.filter(

        (s) => !(s.name?.toLowerCase() === song.name?.toLowerCase() && s.artist?.toLowerCase() === song.artist?.toLowerCase())

      );

      const playedEntry = {

        ...song,

        playedAt: new Date().toISOString(),

      };

      const updatedHist = [playedEntry, ...deduplicated].slice(0, 20);

      state.playbackHistory = updatedHist;



      try {

        localStorage.setItem('currentSong', JSON.stringify(song));

        localStorage.setItem('currentIndex', String(state.currentIndex));

        localStorage.setItem('recommendations', JSON.stringify(state.queue));

        localStorage.setItem('playbackPosition', '0');

        saveUserHistory(updatedHist);

      } catch (e) {

        // storage overflow guard

      }

    },



    updateSongYouTubeId: (state, action) => {

      const { id, name, artist, youtube_id } = action.payload || {};

      if (!youtube_id) return;



      if (state.currentSong && (state.currentSong.id === id || (state.currentSong.name === name && state.currentSong.artist === artist))) {

        state.currentSong = { ...state.currentSong, youtube_id };

        try {

          localStorage.setItem('currentSong', JSON.stringify(state.currentSong));

        } catch (e) {}

      }



      const qIdx = state.queue.findIndex((s) => s.id === id || (s.name === name && s.artist === artist));

      if (qIdx !== -1) {

        state.queue[qIdx] = { ...state.queue[qIdx], youtube_id };

        try {

          localStorage.setItem('recommendations', JSON.stringify(state.queue));

        } catch (e) {}

      }

    },



    setQueue: (state, action) => {

      const songs = action.payload || [];

      state.queue = songs;

      if (songs.length > 0) {

        if (!state.currentSong) {

          state.currentSong = songs[0];

          state.currentIndex = 0;

        } else {

          const foundIdx = songs.findIndex(

            (s) => s.id === state.currentSong.id ||

                  (s.name?.toLowerCase() === state.currentSong.name?.toLowerCase() &&

                   s.artist?.toLowerCase() === state.currentSong.artist?.toLowerCase())

          );

          if (foundIdx !== -1) {

            state.currentIndex = foundIdx;

          }

        }

      }

      try {

        localStorage.setItem('recommendations', JSON.stringify(songs));

        localStorage.setItem('currentIndex', String(state.currentIndex));

        if (state.currentSong) {

          localStorage.setItem('currentSong', JSON.stringify(state.currentSong));

        }

      } catch (e) {}

    },



    addToQueue: (state, action) => {

      const payload = action.payload;

      if (!payload) return;

      const songsToAdd = Array.isArray(payload) ? payload : [payload];

      songsToAdd.forEach((song) => {

        if (!song) return;

        const exists = state.queue.some(

          (s) => (s.id && s.id === song.id) || (s.name?.toLowerCase() === song.name?.toLowerCase() && s.artist?.toLowerCase() === song.artist?.toLowerCase())

        );

        if (!exists) {

          state.queue.push(song);

        }

      });

      // If no song is currently playing, start with the newly added song

      if (!state.currentSong && state.queue.length > 0) {

        state.currentSong = state.queue[0];

        state.currentIndex = 0;

        state.isPlaying = true;

      }

      try {

        localStorage.setItem('recommendations', JSON.stringify(state.queue));

      } catch (e) {}

    },



    addToPlayNext: (state, action) => {

      const song = action.payload;

      if (!song) return;

      if (state.queue.length === 0 || !state.currentSong) {

        state.queue = [song];

        state.currentIndex = 0;

        state.currentSong = song;

        state.isPlaying = true;

      } else {

        // Remove duplicate if it was already in queue elsewhere

        state.queue = state.queue.filter(

          (s, idx) => idx === state.currentIndex || !(s.id === song.id || (s.name?.toLowerCase() === song.name?.toLowerCase() && s.artist?.toLowerCase() === song.artist?.toLowerCase()))

        );

        const insertIdx = state.currentIndex + 1;

        state.queue.splice(insertIdx, 0, song);

      }

      try {

        localStorage.setItem('recommendations', JSON.stringify(state.queue));

      } catch (e) {}

    },



    moveQueueItem: (state, action) => {

      const { fromIndex, toIndex } = action.payload || {};

      if (fromIndex === undefined || toIndex === undefined) return;

      if (fromIndex < 0 || fromIndex >= state.queue.length || toIndex < 0 || toIndex >= state.queue.length) return;

      if (fromIndex === toIndex) return;



      const [movedItem] = state.queue.splice(fromIndex, 1);

      state.queue.splice(toIndex, 0, movedItem);



      if (state.currentIndex === fromIndex) {

        state.currentIndex = toIndex;

      } else if (fromIndex < state.currentIndex && toIndex >= state.currentIndex) {

        state.currentIndex -= 1;

      } else if (fromIndex > state.currentIndex && toIndex <= state.currentIndex) {

        state.currentIndex += 1;

      }

      try {

        localStorage.setItem('recommendations', JSON.stringify(state.queue));

      } catch (e) {}

    },



    moveSongToNext: (state, action) => {

      const fromIndex = action.payload;

      const targetIndex = state.currentIndex + 1;

      if (fromIndex <= state.currentIndex || fromIndex >= state.queue.length || targetIndex >= state.queue.length) return;

      const [item] = state.queue.splice(fromIndex, 1);

      state.queue.splice(targetIndex, 0, item);

      try {

        localStorage.setItem('recommendations', JSON.stringify(state.queue));

      } catch (e) {}

    },



    clearUpcomingQueue: (state) => {

      if (state.currentIndex >= 0 && state.currentIndex < state.queue.length) {

        state.queue = state.queue.slice(0, state.currentIndex + 1);

      } else {

        state.queue = state.currentSong ? [state.currentSong] : [];

        state.currentIndex = 0;

      }

      try {

        localStorage.setItem('recommendations', JSON.stringify(state.queue));

      } catch (e) {}

    },



    shuffleUpcomingQueue: (state) => {

      const upcoming = state.queue.slice(state.currentIndex + 1);

      if (upcoming.length <= 1) return;

      for (let i = upcoming.length - 1; i > 0; i--) {

        const j = Math.floor(Math.random() * (i + 1));

        [upcoming[i], upcoming[j]] = [upcoming[j], upcoming[i]];

      }

      state.queue = [...state.queue.slice(0, state.currentIndex + 1), ...upcoming];

      try {

        localStorage.setItem('recommendations', JSON.stringify(state.queue));

      } catch (e) {}

    },



    togglePlayPause: (state) => {

      if (!state.currentSong && state.queue.length > 0) {

        state.currentSong = state.queue[0];

        state.isPlaying = true;

      } else if (state.currentSong) {

        state.isPlaying = !state.isPlaying;

      }

    },



    setPlaying: (state, action) => {

      state.isPlaying = action.payload;

    },



    playNext: (state) => {

      if (state.queue.length === 0) return;



      if (state.repeatMode === 'one' && state.currentSong) {

        state.currentTime = 0;

        state.seekTarget = 0;

        state.isPlaying = true;

        return;

      }



      let nextIndex = state.currentIndex + 1;

      if (nextIndex >= state.queue.length) {

        if (state.repeatMode === 'all') {

          nextIndex = 0;

        } else {

          state.isPlaying = false;

          return;

        }

      }



      state.currentIndex = nextIndex;

      let song = { ...state.queue[nextIndex] };



      // Ensure YouTube ID is accurate

      const isRaataan = String(song.name || '').toLowerCase().includes('raataan');

      const knownId = resolveKnownYouTubeId(song.name, song.artist);

      if (knownId) {

        song.youtube_id = knownId;

      } else if (song.youtube_id === 'gvyUuxdRdR4' && !isRaataan) {

        song.youtube_id = null;

      }



      state.queue[nextIndex] = song;

      state.currentSong = song;

      state.currentTime = 0;

      state.isPlaying = true;

      state.isPlayerDismissed = false;

      if (state.currentSong?.mood_match) {

        state.activeMood = state.currentSong.mood_match.toLowerCase();

      }



      // Record in playback history

      const prevHist = state.playbackHistory || [];

      const deduplicated = prevHist.filter(

        (s) => !(s.name?.toLowerCase() === song.name?.toLowerCase() && s.artist?.toLowerCase() === song.artist?.toLowerCase())

      );

      const playedEntry = {

        ...song,

        playedAt: new Date().toISOString(),

      };

      const updatedHist = [playedEntry, ...deduplicated].slice(0, 20);

      state.playbackHistory = updatedHist;



      try {

        saveUserHistory(updatedHist);

        localStorage.setItem('currentSong', JSON.stringify(song));

        localStorage.setItem('currentIndex', String(state.currentIndex));

        localStorage.setItem('playbackPosition', '0');

      } catch (e) {}

    },



    playPrevious: (state) => {

      if (state.queue.length === 0) return;



      // If more than 3 seconds in, replay current track

      if (state.currentTime > 3) {

        state.currentTime = 0;

        state.seekTarget = 0;

        return;

      }



      let prevIndex = state.currentIndex - 1;

      if (prevIndex < 0) {

        prevIndex = state.queue.length - 1;

      }



      state.currentIndex = prevIndex;

      state.currentSong = state.queue[prevIndex];

      state.currentTime = 0;

      state.isPlaying = true;

      if (state.currentSong?.mood_match) {

        state.activeMood = state.currentSong.mood_match.toLowerCase();

      }

      try {

        localStorage.setItem('currentSong', JSON.stringify(state.currentSong));

        localStorage.setItem('currentIndex', String(state.currentIndex));

        localStorage.setItem('playbackPosition', '0');

      } catch (e) {}

    },



    setVolume: (state, action) => {

      state.volume = Math.max(0, Math.min(100, action.payload));

      state.isMuted = state.volume === 0;

    },



    toggleMute: (state) => {

      state.isMuted = !state.isMuted;

    },



    setProgress: (state, action) => {

      const ct = action.payload.currentTime ?? state.currentTime;

      state.currentTime = ct;

      if (action.payload.duration) {

        state.duration = action.payload.duration;

      }

      if (ct > 0 && Math.abs(ct - (state._lastSavedPos || 0)) >= 2) {

        state._lastSavedPos = ct;

        try {

          localStorage.setItem('playbackPosition', String(Math.round(ct * 10) / 10));

        } catch (e) {}

      }

    },



    seekTo: (state, action) => {

      state.currentTime = action.payload;

      state.seekTarget = action.payload;

    },



    clearSeekTarget: (state) => {

      state.seekTarget = null;

    },



    clearPlaybackHistory: (state) => {

      state.playbackHistory = [];

      clearUserHistory();

    },



    switchUserHistory: (state, action) => {

      state.playbackHistory = getUserHistory(action.payload);

    },



    setActiveMood: (state, action) => {

      const val = action.payload;

      const raw = typeof val === 'object' && val !== null ? (val.mood || val.id || 'happy') : val;

      state.activeMood = String(raw || 'happy').toLowerCase();

      try {

        localStorage.setItem('selectedMood', JSON.stringify({ mood: state.activeMood }));

      } catch (e) {}

    },



    setTurntableOpen: (state, action) => {

      state.isTurntableOpen = action.payload;

    },



    toggleTurntable: (state) => {

      state.isTurntableOpen = !state.isTurntableOpen;

    },

    openTurntableTab: (state, action) => {

      state.isTurntableOpen = true;

      state.turntableTab = action.payload || 'lyrics';

    },



    closeTurntable: (state) => {

      state.isTurntableOpen = false;

    },

    toggleQueue: (state) => {

      state.isQueueOpen = !state.isQueueOpen;

    },

    openQueue: (state) => {

      state.isQueueOpen = true;

    },

    closeQueue: (state) => {

      state.isQueueOpen = false;

    },

    setQueueOpen: (state, action) => {

      state.isQueueOpen = Boolean(action.payload);

    },



    toggleShuffle: (state) => {

      state.isShuffle = !state.isShuffle;

    },



    cycleRepeatMode: (state) => {

      const modes = ['off', 'all', 'one'];

      const nextIdx = (modes.indexOf(state.repeatMode) + 1) % modes.length;

      state.repeatMode = modes[nextIdx];

    },



    playSongAtIndex: (state, action) => {

      const index = action.payload;

      if (index >= 0 && index < state.queue.length) {

        state.currentIndex = index;

        let song = { ...state.queue[index] };



        // Ensure correct YouTube ID for indexed track

        const isRaataan = String(song.name || '').toLowerCase().includes('raataan');

        const knownId = resolveKnownYouTubeId(song.name, song.artist);

        if (knownId) {

          song.youtube_id = knownId;

        } else if (song.youtube_id === 'gvyUuxdRdR4' && !isRaataan) {

          song.youtube_id = null;

        }



        state.queue[index] = song;

        state.currentSong = song;

        state.currentTime = 0;

        state.isPlaying = true;

        state.isPlayerDismissed = false;

        if (state.currentSong?.mood_match) {

          state.activeMood = state.currentSong.mood_match.toLowerCase();

        }



        // Strictly record into playback history (ONLY past 20 tracks actually played by the user)

        const prevHist = state.playbackHistory || [];

        const deduplicated = prevHist.filter(

          (s) => !(s.name?.toLowerCase() === song.name?.toLowerCase() && s.artist?.toLowerCase() === song.artist?.toLowerCase())

        );

        const playedEntry = {

          ...song,

          playedAt: new Date().toISOString(),

        };

        const updatedHist = [playedEntry, ...deduplicated].slice(0, 20);

        state.playbackHistory = updatedHist;



        try {

          saveUserHistory(updatedHist);

          localStorage.setItem('currentSong', JSON.stringify(song));

        } catch (e) {}

      }

    },



    removeFromQueue: (state, action) => {

      const index = action.payload;

      if (index >= 0 && index < state.queue.length) {

        state.queue.splice(index, 1);

        if (state.currentIndex >= state.queue.length) {

          state.currentIndex = Math.max(0, state.queue.length - 1);

        }

        if (state.queue.length === 0) {

          state.currentSong = null;

          state.isPlaying = false;

        } else if (state.currentIndex === index) {

          state.currentSong = state.queue[state.currentIndex];

        }

        try {

          localStorage.setItem('recommendations', JSON.stringify(state.queue));

        } catch (e) {}

      }

    },



    clearQueue: (state) => {

      state.queue = [];

      state.currentSong = null;

      state.currentIndex = 0;

      state.isPlaying = false;

      try {

        localStorage.removeItem('recommendations');

      } catch (e) {}

    },



    setVideoMode: (state, action) => {

      state.isVideoMode = action.payload;

    },



    toggleVideoMode: (state) => {

      state.isVideoMode = !state.isVideoMode;

    },



    // Dismiss & remove player from screen

    closePlayer: (state) => {

      state.isPlaying = false;

      state.isTurntableOpen = false;

      state.isPlayerDismissed = true;

    },



    // Restore player dock to screen

    reopenPlayer: (state) => {

      state.isPlayerDismissed = false;

    },



    // Permanently remove song & player from screen

    clearCurrentSong: (state) => {

      state.isPlaying = false;

      state.isTurntableOpen = false;

      state.currentSong = null;

      state.isPlayerDismissed = true;

      try {

        localStorage.removeItem('currentSong');

      } catch (e) {}

    },



    // Feature 1: Sleep Timer Reducers

    setSleepTimer: (state, action) => {

      const { minutes, isEndOfTrack } = action.payload || {};

      if (isEndOfTrack) {

        state.sleepTimer = {

          active: true,

          durationMinutes: null,

          targetTimestamp: null,

          isEndOfTrack: true,

          remainingSeconds: 0,

          initialVolumeBeforeFade: state.volume,

        };

      } else if (minutes && minutes > 0) {

        const totalSeconds = Math.round(minutes * 60);

        state.sleepTimer = {

          active: true,

          durationMinutes: minutes,

          targetTimestamp: Date.now() + totalSeconds * 1000,

          isEndOfTrack: false,

          remainingSeconds: totalSeconds,

          initialVolumeBeforeFade: state.volume,

        };

      }

    },

    clearSleepTimer: (state) => {

      state.sleepTimer = {

        active: false,

        durationMinutes: null,

        targetTimestamp: null,

        isEndOfTrack: false,

        remainingSeconds: 0,

        initialVolumeBeforeFade: null,

      };

    },

    tickSleepTimer: (state, action) => {

      if (!state.sleepTimer.active) return;

      if (state.sleepTimer.isEndOfTrack) return;

      const remaining = typeof action.payload === 'number' ? action.payload : Math.max(0, state.sleepTimer.remainingSeconds - 1);

      state.sleepTimer.remainingSeconds = remaining;

      if (remaining <= 0) {

        state.isPlaying = false;

        state.sleepTimer.active = false;

      }

    },

    toggleSleepTimerModal: (state) => {

      state.isSleepTimerModalOpen = !state.isSleepTimerModalOpen;

    },

    setSleepTimerModalOpen: (state, action) => {

      state.isSleepTimerModalOpen = Boolean(action.payload);

    },



    // Feature 2: Keyboard Shortcuts Modal Reducers

    toggleShortcutsModal: (state) => {

      state.isShortcutsModalOpen = !state.isShortcutsModalOpen;

    },

    setShortcutsModalOpen: (state, action) => {

      state.isShortcutsModalOpen = Boolean(action.payload);

    },



    // Feature 4: Smart Mood Elevation (AI DJ Mode)

    toggleSmartMoodElevation: (state) => {

      state.smartMoodElevation.enabled = !state.smartMoodElevation.enabled;

    },

    setElevationToast: (state, action) => {

      state.smartMoodElevation.elevationToast = action.payload;

    },

    clearElevationToast: (state) => {

      state.smartMoodElevation.elevationToast = null;

    },

    markSongElevated: (state, action) => {

      state.smartMoodElevation.lastElevatedSongId = action.payload;

    },



    // Feature 5: Shareable Vibe Card

    openVibeCard: (state, action) => {

      state.vibeCardSong = action.payload || state.currentSong;

      state.isVibeCardOpen = true;

    },

    closeVibeCard: (state) => {

      state.isVibeCardOpen = false;

      state.vibeCardSong = null;

    },



    // Feature 6: Hands-Free Voice DJ Reducers

    toggleVoiceDJ: (state) => {

      state.voiceDJ.isEnabled = !state.voiceDJ.isEnabled;

      if (!state.voiceDJ.isEnabled) {

        state.voiceDJ.wakeStatus = 'idle';

        state.voiceDJ.transcript = '';

        state.voiceDJ.feedbackText = '';

      }

    },

    setVoiceDJEnabled: (state, action) => {

      state.voiceDJ.isEnabled = Boolean(action.payload);

      if (!state.voiceDJ.isEnabled) {

        state.voiceDJ.wakeStatus = 'idle';

        state.voiceDJ.transcript = '';

        state.voiceDJ.feedbackText = '';

      }

    },

    setVoiceDJStatus: (state, action) => {

      state.voiceDJ.wakeStatus = action.payload;

    },

    setVoiceDJTranscript: (state, action) => {

      state.voiceDJ.transcript = action.payload;

    },

    setVoiceDJFeedback: (state, action) => {

      state.voiceDJ.feedbackText = action.payload.text || '';

      state.voiceDJ.feedbackType = action.payload.type || '';

      state.voiceDJ.wakeStatus = action.payload.status || 'success';

    },

    clearVoiceDJFeedback: (state) => {
      state.voiceDJ.wakeStatus = 'idle';
      state.voiceDJ.transcript = '';
      state.voiceDJ.feedbackText = '';
    },

    // Aura AI / Voice Assistant Modal Reducers
    toggleChatbot: (state) => {
      state.isChatbotOpen = !state.isChatbotOpen;
    },
    setChatbotOpen: (state, action) => {
      state.isChatbotOpen = Boolean(action.payload);
    },
    openChatbot: (state) => {
      state.isChatbotOpen = true;
    },
    closeChatbot: (state) => {
      state.isChatbotOpen = false;
    },



    // Feature 7: Crossfade Reducers

    setCrossfadeEnabled: (state, action) => {

      state.crossfade.enabled = Boolean(action.payload);

    },

    setCrossfadeDuration: (state, action) => {

      state.crossfade.durationSeconds = Math.max(0, Math.min(10, Number(action.payload) || 0));

    },

    setCrossfadeFadingOut: (state, action) => {

      state.crossfade.isFadingOut = Boolean(action.payload);

    },

    setCrossfadeFadingIn: (state, action) => {

      state.crossfade.isFadingIn = Boolean(action.payload);

    },



    // Feature 8: 5-Band Equalizer Reducers

    toggleEqualizerModal: (state) => {

      state.equalizer.isOpen = !state.equalizer.isOpen;

    },

    setEqualizerModalOpen: (state, action) => {

      state.equalizer.isOpen = Boolean(action.payload);

    },

    setEqualizerPreset: (state, action) => {

      const preset = action.payload;

      state.equalizer.preset = preset;

      switch (preset) {

        case 'bass_heavy':

          state.equalizer.gains = { band60: 7, band250: 5, band1k: 0, band4k: -1, band16k: -2 };

          break;

        case 'vocals':

          state.equalizer.gains = { band60: -2, band250: 0, band1k: 4, band4k: 6, band16k: 2 };

          break;

        case 'vinyl':

          state.equalizer.gains = { band60: 3, band250: 4, band1k: 2, band4k: -2, band16k: -4 };

          break;

        case 'lofi':

          state.equalizer.gains = { band60: 4, band250: 2, band1k: -3, band4k: -1, band16k: -5 };

          break;

        case 'night':

          state.equalizer.gains = { band60: -4, band250: -2, band1k: 3, band4k: -3, band16k: -6 };

          break;

        case 'acoustic':

          state.equalizer.gains = { band60: 2, band250: 1, band1k: 3, band4k: 4, band16k: 3 };

          break;

        case 'flat':

        default:

          state.equalizer.gains = { band60: 0, band250: 0, band1k: 0, band4k: 0, band16k: 0 };

          break;

      }

    },

    setEqualizerBandGain: (state, action) => {

      const { band, gain } = action.payload;

      if (state.equalizer.gains && state.equalizer.gains[band] !== undefined) {

        state.equalizer.gains[band] = Math.max(-12, Math.min(12, Number(gain) || 0));

        state.equalizer.preset = 'custom';

      }

    },

    resetEqualizer: (state) => {

      state.equalizer.preset = 'flat';

      state.equalizer.gains = { band60: 0, band250: 0, band1k: 0, band4k: 0, band16k: 0 };

    },



    // Feature 9: Mood Journey Reducers

    toggleMoodJourneyModal: (state) => {

      state.isMoodJourneyModalOpen = !state.isMoodJourneyModalOpen;

    },

    setMoodJourneyModalOpen: (state, action) => {

      state.isMoodJourneyModalOpen = Boolean(action.payload);

    },

  },

});



export const {

  playSong,

  updateSongYouTubeId,

  setQueue,

  addToQueue,

  addToPlayNext,

  moveQueueItem,

  moveSongToNext,

  clearUpcomingQueue,

  shuffleUpcomingQueue,

  togglePlayPause,

  setPlaying,

  playNext,

  playPrevious,

  setVolume,

  toggleMute,

  setProgress,

  seekTo,

  clearSeekTarget,

  setActiveMood,

  setTurntableOpen,

  toggleTurntable,
  openTurntableTab,

  setVideoMode,

  toggleVideoMode,

  closeTurntable,

  toggleQueue,

  openQueue,

  closeQueue,

  setQueueOpen,

  toggleShuffle,

  cycleRepeatMode,

  playSongAtIndex,

  removeFromQueue,

  clearQueue,

  closePlayer,

  reopenPlayer,

  clearCurrentSong,

  clearPlaybackHistory,

  switchUserHistory,



  // Feature 1

  setSleepTimer,

  clearSleepTimer,

  tickSleepTimer,

  toggleSleepTimerModal,

  setSleepTimerModalOpen,



  // Feature 2

  toggleShortcutsModal,

  setShortcutsModalOpen,



  // Feature 4

  toggleSmartMoodElevation,

  setElevationToast,

  clearElevationToast,

  markSongElevated,



  // Feature 5

  openVibeCard,

  closeVibeCard,



  // Feature 6: Voice DJ

  toggleVoiceDJ,

  setVoiceDJEnabled,

  setVoiceDJStatus,

  setVoiceDJTranscript,

  setVoiceDJFeedback,

  clearVoiceDJFeedback,

  // Aura AI / Voice Assistant
  toggleChatbot,
  setChatbotOpen,
  openChatbot,
  closeChatbot,



  // Feature 7: Crossfade

  setCrossfadeEnabled,

  setCrossfadeDuration,

  setCrossfadeFadingOut,

  setCrossfadeFadingIn,



  // Feature 8: 5-Band Equalizer

  toggleEqualizerModal,

  setEqualizerModalOpen,

  setEqualizerPreset,

  setEqualizerBandGain,

  resetEqualizer,



  // Feature 9: Mood Journey

  toggleMoodJourneyModal,

  setMoodJourneyModalOpen,

} = audioSlice.actions;



export default audioSlice.reducer;

