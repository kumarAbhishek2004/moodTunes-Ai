import { createSlice } from '@reduxjs/toolkit';

// Retrieve cached state if available
const cachedQueue = localStorage.getItem('recommendations')
  ? JSON.parse(localStorage.getItem('recommendations'))
  : [];

const initialMood = localStorage.getItem('selectedMood')
  ? (typeof JSON.parse(localStorage.getItem('selectedMood')) === 'string'
      ? JSON.parse(localStorage.getItem('selectedMood'))
      : JSON.parse(localStorage.getItem('selectedMood')).mood || 'happy')
  : 'happy';

const initialState = {
  currentSong: cachedQueue.length > 0 ? cachedQueue[0] : null,
  queue: cachedQueue,
  currentIndex: 0,
  isPlaying: false,
  volume: 75,
  isMuted: false,
  currentTime: 0,
  duration: 240, // default placeholder until metadata loads
  seekTarget: null, // trigger seek in engine
  activeMood: initialMood,
  isTurntableOpen: false,
  isQueueOpen: false,
  isShuffle: false,
  repeatMode: 'off', // 'off' | 'all' | 'one'
};

export const audioSlice = createSlice({
  name: 'audio',
  initialState,
  reducers: {
    playSong: (state, action) => {
      const song = action.payload;
      if (!song) return;
      state.currentSong = song;
      state.isPlaying = true;
      state.currentTime = 0;
      
      // Update mood if song carries a match
      if (song.mood_match) {
        state.activeMood = song.mood_match.toLowerCase();
      }

      // Add to queue if not present
      const index = state.queue.findIndex((s) => s.id === song.id || (s.name === song.name && s.artist === song.artist));
      if (index === -1) {
        state.queue.unshift(song);
        state.currentIndex = 0;
      } else {
        state.currentIndex = index;
      }

      try {
        localStorage.setItem('currentSong', JSON.stringify(song));
        localStorage.setItem('recommendations', JSON.stringify(state.queue));
      } catch (e) {
        // storage overflow guard
      }
    },

    setQueue: (state, action) => {
      const songs = action.payload || [];
      state.queue = songs;
      if (songs.length > 0 && !state.currentSong) {
        state.currentSong = songs[0];
        state.currentIndex = 0;
      }
      try {
        localStorage.setItem('recommendations', JSON.stringify(songs));
      } catch (e) {}
    },

    addToQueue: (state, action) => {
      const song = action.payload;
      if (!song) return;
      const exists = state.queue.some((s) => s.id === song.id);
      if (!exists) {
        state.queue.push(song);
      }
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
      state.currentSong = state.queue[nextIndex];
      state.currentTime = 0;
      state.isPlaying = true;
      if (state.currentSong?.mood_match) {
        state.activeMood = state.currentSong.mood_match.toLowerCase();
      }
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
    },

    setVolume: (state, action) => {
      state.volume = Math.max(0, Math.min(100, action.payload));
      state.isMuted = state.volume === 0;
    },

    toggleMute: (state) => {
      state.isMuted = !state.isMuted;
    },

    setProgress: (state, action) => {
      state.currentTime = action.payload.currentTime ?? state.currentTime;
      if (action.payload.duration) {
        state.duration = action.payload.duration;
      }
    },

    seekTo: (state, action) => {
      state.currentTime = action.payload;
      state.seekTarget = action.payload;
    },

    clearSeekTarget: (state) => {
      state.seekTarget = null;
    },

    setActiveMood: (state, action) => {
      state.activeMood = (action.payload || 'happy').toLowerCase();
      try {
        localStorage.setItem('selectedMood', JSON.stringify(state.activeMood));
      } catch (e) {}
    },

    setTurntableOpen: (state, action) => {
      state.isTurntableOpen = action.payload;
    },

    toggleTurntable: (state) => {
      state.isTurntableOpen = !state.isTurntableOpen;
    },

    toggleQueue: (state) => {
      state.isQueueOpen = !state.isQueueOpen;
    },

    toggleShuffle: (state) => {
      state.isShuffle = !state.isShuffle;
    },

    cycleRepeatMode: (state) => {
      const modes = ['off', 'all', 'one'];
      const nextIdx = (modes.indexOf(state.repeatMode) + 1) % modes.length;
      state.repeatMode = modes[nextIdx];
    },
  },
});

export const {
  playSong,
  setQueue,
  addToQueue,
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
  toggleQueue,
  toggleShuffle,
  cycleRepeatMode,
} = audioSlice.actions;

export default audioSlice.reducer;
