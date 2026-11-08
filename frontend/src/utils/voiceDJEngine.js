/**
 * Voice DJ Engine ("Hey Abhi")
 * Provides audio chimes, speech synthesis, natural language voice command parsing,
 * database-restricted playback (playlists, history, favorites, database tracks),
 * and hands-free voice navigation across the entire application.
 */
import axios from 'axios';
import { API_BASE_URL } from '../config/api';
import {
  playSong,
  setPlaying,
  playNext,
  playPrevious,
  setVolume,
  toggleMute,
  toggleShuffle,
  setQueue,
  setActiveMood,
  setSleepTimer,
  openVibeCard,
  closeVibeCard,
  setVoiceDJFeedback,
  openQueue,
  closeQueue,
  setTurntableOpen,
  setSleepTimerModalOpen,
  setShortcutsModalOpen,
} from '../store/audioSlice';
import { getUserPlaylistSongs, getUserCustomPlaylists, getUserHistory } from './userStorage';
import { resolveKnownYouTubeId, FAMOUS_SONGS_YOUTUBE } from './songMap';
import { FALLBACK_SIMILAR_TRACKS } from './queueHelper';

// Web Audio API Chime Synthesizer (Instant, Zero Network Dependency)
export const playVoiceChime = (type = 'wake') => {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
    const now = ctx.currentTime;

    if (type === 'wake') {
      // Modern Siri-style rising major chord (C5 -> E5 -> G5)
      [523.25, 659.25, 783.99].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);
        gain.gain.setValueAtTime(0.0001, now + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.12, now + idx * 0.08 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.08 + 0.28);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.3);
      });
    } else if (type === 'success') {
      // Soft gentle confirm (F5 -> A5)
      [698.46, 880.0].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.07);
        gain.gain.setValueAtTime(0.0001, now + idx * 0.07);
        gain.gain.exponentialRampToValueAtTime(0.09, now + idx * 0.07 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.07 + 0.22);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.07);
        osc.stop(now + idx * 0.07 + 0.25);
      });
    } else if (type === 'error') {
      // Subtle low chime (D4)
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(293.66, now);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.3);
    }
  } catch (e) {
    // Non-blocking fallback
  }
};

// Track local assistant speaking status to prevent feedback loop
let isAssistantSpeaking = false;
let assistantSpeakingTimer = null;

export const isAssistantSpeakingNow = () => isAssistantSpeaking;

// Natural Voice Feedback (Text-to-Speech) - Ultra concise (e.g. "Voice assistant is active.", "Playing.", "Paused.")
export const speakVoiceFeedback = (text) => {
  try {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    clearTimeout(assistantSpeakingTimer);

    isAssistantSpeaking = true;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.05;
    utterance.pitch = 1.0;
    utterance.volume = 0.95;

    utterance.onend = () => {
      isAssistantSpeaking = false;
    };
    utterance.onerror = () => {
      isAssistantSpeaking = false;
    };

    // Auto-reset speaking flag after 3 seconds maximum
    assistantSpeakingTimer = setTimeout(() => {
      isAssistantSpeaking = false;
    }, 3000);

    const voices = window.speechSynthesis.getVoices();
    const naturalVoice = voices.find(
      (v) =>
        v.lang.startsWith('en') &&
        (v.name.includes('Natural') ||
          v.name.includes('Google') ||
          v.name.includes('Samantha') ||
          v.name.includes('David') ||
          v.name.includes('Rishi'))
    );
    if (naturalVoice) utterance.voice = naturalVoice;
    window.speechSynthesis.speak(utterance);
  } catch (e) {
    isAssistantSpeaking = false;
  }
};

// Starter Playlists pool
export const STARTER_PLAYLIST_KEYS = [
  { id: 'starter-calm-and-relax', name: 'Calm & Relax', mood: 'calm' },
  { id: 'starter-happy-vibes', name: 'Happy Vibes', mood: 'happy' },
  { id: 'starter-energetic-pulse', name: 'Energetic Pulse', mood: 'energetic' },
  { id: 'starter-midnight-rain', name: 'Midnight Rain', mood: 'sad' },
  { id: 'starter-deep-focus', name: 'Deep Focus', mood: 'focus' },
  { id: 'starter-romantic-twilight', name: 'Romantic Twilight', mood: 'romantic' },
];

/**
 * Normalizes speech text and song titles for flexible, resilient voice matching.
 * Strips pipes, parenthesis, brackets, suffixes ("official video", "remix"), and generic filler words ("song", "track").
 */
export const normalizeVoiceText = (text) => {
  if (!text || typeof text !== 'string') return '';
  return text
    .toLowerCase()
    .replace(/[|()\[\]{}\-_/\\:;"'.,!@#$%^&*~`]/g, ' ')
    .replace(/\b(?:official\s+video|official\s+audio|lyrics|lyric\s+video|music\s+video|remix|hd|4k|feat|ft)\b/gi, ' ')
    .replace(/\b(?:song|track|music|audio|tune)\b/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

/**
 * Compares song name/artist against spoken voice query with fuzzy word overlap
 */
export const matchSongTitleOrArtist = (songName, songArtist, rawQuery) => {
  const normS = normalizeVoiceText(songName);
  const normQ = normalizeVoiceText(rawQuery);
  const normArtist = normalizeVoiceText(songArtist);

  if (!normS || !normQ) return false;
  if (normS === normQ || normQ.includes(normS) || normS.includes(normQ)) return true;

  const sWords = new Set(normS.split(' ').filter(Boolean));
  const qWords = normQ.split(' ').filter(Boolean);
  if (qWords.length > 0 && qWords.every((w) => sWords.has(w))) return true;

  if (normArtist && (normArtist.includes(normQ) || normQ.includes(normArtist))) return true;

  return false;
};

/**
 * Loads all accessible playlists (combining backend user playlists + local storage + starters)
 */
export const getAllAccessiblePlaylists = async (user) => {
  let customPlaylists = getUserCustomPlaylists(user) || [];
  let serverPlaylists = [];

  try {
    const token = localStorage.getItem('token');
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const res = await axios.get(`${API_BASE_URL}/api/playlists`, { headers, timeout: 3500 });
    const fetched = res.data?.playlists || (Array.isArray(res.data) ? res.data : []);
    if (Array.isArray(fetched) && fetched.length > 0) {
      serverPlaylists = fetched;
    }
  } catch (e) {
    try {
      const res2 = await axios.get(`${API_BASE_URL}/playlists`, { timeout: 2500 });
      if (Array.isArray(res2.data)) serverPlaylists = res2.data;
    } catch (e2) {}
  }

  // Merge serverPlaylists with customPlaylists (server takes precedence)
  const mergedCustom = [...serverPlaylists];
  for (const cp of customPlaylists) {
    const id = cp.id || cp._id;
    if (!mergedCustom.some((p) => (p.id || p._id) === id)) {
      mergedCustom.push(cp);
    }
  }

  const fullCustom = mergedCustom.map((p) => {
    const id = p.id || p._id;
    const songs =
      Array.isArray(p.songs) && p.songs.length > 0
        ? p.songs
        : getUserPlaylistSongs(id, user);
    return {
      ...p,
      id,
      name: p.name || 'Custom Playlist',
      songs: Array.isArray(songs) ? songs : [],
    };
  });

  const fullStarters = STARTER_PLAYLIST_KEYS.map((p) => ({
    ...p,
    songs: getUserPlaylistSongs(p.id, user),
  }));

  return [...fullCustom, ...fullStarters];
};

/**
 * Strips wake words ("Hey Abhi", "Abhi", "Avi", etc.) and polite prefixes cleanly
 */
export const stripWakeWords = (rawTranscript) => {
  if (!rawTranscript || typeof rawTranscript !== 'string') return '';
  return rawTranscript
    .trim()
    .replace(/^(?:hey|ok|okay|hi|hello|yo)\s+/i, '')
    .replace(
      /^(?:abhi|abhishek|abby|abbie|avi|avhi|abey|obhi|obhey|abi|abhee|abhey|aabi|aabhi|api|avee|moodtunes|aura)\b[\s,]*/i,
      ''
    )
    .replace(/^(?:please|can you|could you|would you|just)\s+/i, '')
    .replace(/\b(?:abhi|abhishek|abby|abbie|avi|obhi)\s*$/i, '')
    .trim();
};

/**
 * Searches the entire local/database ecosystem for a matching song.
 * Sources searched:
 * 1. User & Starter Playlists (Local + Server)
 * 2. User Playback History
 * 3. User Favorites
 * 4. Backend Database API (/api/voice/search-database)
 * 5. Curated Database Seeds (FALLBACK_SIMILAR_TRACKS)
 * 6. Famous Song Catalog (FAMOUS_SONGS_YOUTUBE)
 */
export const findSongInDatabase = async (rawQuery, allPlaylists = []) => {
  if (!rawQuery || typeof rawQuery !== 'string') return null;
  const q = rawQuery.toLowerCase().trim();

  // 1. Search in Playlists (Custom + Server + Starters)
  for (const pl of allPlaylists) {
    if (Array.isArray(pl.songs)) {
      const match = pl.songs.find((s) => matchSongTitleOrArtist(s.name, s.artist, q));
      if (match) return match;
    }
  }

  // 2. Search in Playback History
  const history = getUserHistory();
  if (Array.isArray(history)) {
    const match = history.find((s) => matchSongTitleOrArtist(s.name, s.artist, q));
    if (match) return match;
  }

  // 3. Search in User Favorites
  try {
    const rawFavs = localStorage.getItem('aura_favorites_by_mood_v3');
    if (rawFavs) {
      const favObj = JSON.parse(rawFavs);
      for (const moodKey in favObj) {
        const list = favObj[moodKey];
        if (Array.isArray(list)) {
          const match = list.find((s) => matchSongTitleOrArtist(s.name, s.artist, q));
          if (match) return match;
        }
      }
    }
  } catch (e) {}

  // 4. Query Backend Voice Database API (Direct search in backend/data/playlists.json & database)
  try {
    const token = localStorage.getItem('token');
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const res = await axios.get(`${API_BASE_URL}/api/voice/search-database`, {
      params: { query: q },
      headers,
      timeout: 3000,
    });
    if (res.data?.found && res.data.song) {
      return res.data.song;
    }
  } catch (e) {}

  // 5. Search in Curated Database Seeds
  const seedMatch = FALLBACK_SIMILAR_TRACKS.find((s) => matchSongTitleOrArtist(s.name, s.artist, q));
  if (seedMatch) return seedMatch;

  // 6. Search in Famous Song Catalog
  const knownYtId = resolveKnownYouTubeId(q, '');
  if (knownYtId) {
    for (const [titleKey, ytId] of Object.entries(FAMOUS_SONGS_YOUTUBE)) {
      if (matchSongTitleOrArtist(titleKey, '', q)) {
        return {
          id: `db-${ytId}`,
          name: titleKey.charAt(0).toUpperCase() + titleKey.slice(1),
          artist: 'Popular Artist',
          youtube_id: ytId,
          image: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=200&auto=format&fit=crop&q=80',
          duration: 240,
        };
      }
    }
    return {
      id: `db-${knownYtId}`,
      name: q.charAt(0).toUpperCase() + q.slice(1),
      artist: 'Popular Artist',
      youtube_id: knownYtId,
      image: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=200&auto=format&fit=crop&q=80',
      duration: 240,
    };
  }

  return null;
};

/**
 * Parses user voice transcript into structured command
 */
export const parseVoiceCommand = (rawTranscript) => {
  if (!rawTranscript || typeof rawTranscript !== 'string') return null;

  const clean = stripWakeWords(rawTranscript);

  // If user just said the wake word alone (e.g. "Hey Abhi")
  if (!clean || clean.length < 2) {
    return { type: 'WAKE_ONLY' };
  }

  // 1. Playback Control Commands (Pause, Stop, Resume, Next, Previous)
  if (
    /^(?:pause(?:\s+it|\s+music|\s+the\s+music|\s+song|\s+playback)?|stop(?:\s+it|\s+music|\s+the\s+music|\s+playing|\s+song|\s+playback)?|hold\s+on|freeze)$/i.test(
      clean
    ) ||
    /^(?:pause|stop\s+music|stop\s+playing)/i.test(clean)
  ) {
    return { type: 'PAUSE' };
  }

  if (
    /^(?:resume(?:\s+it|\s+music|\s+playing)?|unpause|continue(?:\s+playing|\s+music)?|play(?:\s+music|\s+the\s+music|\s+song|\s+a\s+song|\s+some\s+music|\s+something)?|start(?:\s+music|\s+playing)?)$/i.test(
      clean
    )
  ) {
    return { type: 'RESUME' };
  }

  if (/^(?:next|skip|next\s+song|skip\s+song|play\s+next|next\s+track)$/i.test(clean)) {
    return { type: 'NEXT' };
  }

  if (/^(?:previous|go\s+back|previous\s+song|last\s+song|play\s+previous|back)$/i.test(clean)) {
    return { type: 'PREVIOUS' };
  }

  // 2. Navigation Commands (Open Playlist, Queue, Turntable, Recommendations, History, Home)
  if (
    /^(?:open|show|go\s+to|view|display|navigate\s+to)\s+(?:my\s+|the\s+)?playlists?$/i.test(clean) ||
    /^(?:my\s+)?playlists?$/i.test(clean) ||
    /^(?:open|show|go\s+to)\s+library$/i.test(clean)
  ) {
    return {
      type: 'NAVIGATE_PAGE',
      path: '/playlists',
      title: 'Playlists',
      feedback: 'Opening playlists.',
      displayText: '📁 Playlists Opened',
    };
  }

  // Open specific playlist e.g. "open chill playlist", "view my favorites"
  const openSpecificMatch = clean.match(
    /^(?:open|show|go\s+to|view)\s+(?:my\s+|the\s+)?(?:playlist\s+)?([a-zA-Z0-9\s_\-]+?)(?:\s+playlist)?$/i
  );
  if (
    openSpecificMatch &&
    !/^(?:queue|player|turntable|history|recommendations?|home|timer|sleep\s+timer|modal)$/i.test(
      openSpecificMatch[1].trim()
    )
  ) {
    const plName = openSpecificMatch[1].trim();
    if (plName && plName !== 'music' && plName !== 'song') {
      return {
        type: 'OPEN_SPECIFIC_PLAYLIST',
        playlistQuery: plName,
      };
    }
  }

  if (
    /^(?:open|show|view|display)\s+(?:the\s+)?(?:queue|upcoming|up\s+next)$/i.test(clean) ||
    /^(?:queue|upcoming)$/i.test(clean)
  ) {
    return { type: 'OPEN_QUEUE' };
  }

  if (/^(?:close|hide)\s+(?:the\s+)?queue$/i.test(clean)) {
    return { type: 'CLOSE_QUEUE' };
  }

  if (
    /^(?:open|show|view|expand)\s+(?:the\s+)?(?:player|music\s+player|turntable|vinyl|vinyl\s+player)$/i.test(clean) ||
    /^(?:player|turntable|vinyl)$/i.test(clean)
  ) {
    return { type: 'OPEN_PLAYER' };
  }

  if (/^(?:close|hide|minimize|collapse)\s+(?:the\s+)?(?:player|turntable|vinyl)$/i.test(clean)) {
    return { type: 'CLOSE_PLAYER' };
  }

  if (
    /^(?:open|show|go\s+to|view)\s+(?:the\s+)?(?:recommendations?|recommended|discover|explore)$/i.test(clean) ||
    /^(?:recommend|recommendations?)$/i.test(clean)
  ) {
    return {
      type: 'NAVIGATE_PAGE',
      path: '/recommendations',
      title: 'Recommendations',
      feedback: 'Opening recommendations.',
      displayText: '✨ Recommendations Opened',
    };
  }

  if (
    /^(?:open|show|go\s+to|view)\s+(?:my\s+|the\s+)?(?:history|listening\s+history|playback\s+history)$/i.test(clean) ||
    /^(?:history|my\s+history)$/i.test(clean)
  ) {
    return {
      type: 'NAVIGATE_PAGE',
      path: '/recommendations',
      title: 'Listening History',
      feedback: 'Opening listening history.',
      displayText: '📜 History Opened',
      focusHistory: true,
    };
  }

  if (
    /^(?:go\s+home|open\s+home|home\s+page|open\s+mood\s+selector|open\s+dial|show\s+dial|mood\s+selector)$/i.test(clean)
  ) {
    return {
      type: 'NAVIGATE_PAGE',
      path: '/',
      title: 'Home',
      feedback: 'Opening home.',
      displayText: '🏠 Home Opened',
    };
  }

  // 3. Audio & Volume Controls
  if (/^(?:mute|silence)$/i.test(clean)) {
    return { type: 'MUTE' };
  }
  if (/^(?:unmute)$/i.test(clean)) {
    return { type: 'UNMUTE' };
  }
  if (/^(?:shuffle|shuffle\s+queue|shuffle\s+songs)$/i.test(clean)) {
    return { type: 'SHUFFLE' };
  }
  if (/^(?:like|favorite|heart|like\s+this\s+song|add\s+to\s+favorites)$/i.test(clean)) {
    return { type: 'LIKE' };
  }
  if (/^(?:share\s+vibe|vibe\s+card|export\s+card|share\s+card)$/i.test(clean)) {
    return { type: 'VIBE_CARD' };
  }

  const volNumMatch = clean.match(/^(?:set\s+)?volume\s+(?:to\s+)?(\d+)/i);
  if (volNumMatch) {
    return { type: 'SET_VOLUME', value: Math.min(100, Math.max(0, parseInt(volNumMatch[1], 10))) };
  }
  if (/^(?:volume\s+up|increase\s+volume|louder|turn\s+it\s+up)/i.test(clean)) {
    return { type: 'VOLUME_UP' };
  }
  if (/^(?:volume\s+down|decrease\s+volume|lower\s+volume|softer|turn\s+it\s+down)/i.test(clean)) {
    return { type: 'VOLUME_DOWN' };
  }

  // 4. Sleep Timer
  const timerMatch = clean.match(/(?:sleep\s+)?timer\s+(?:for\s+)?(\d+)\s*(?:minutes|mins|m)/i);
  if (timerMatch) {
    return { type: 'SLEEP_TIMER', minutes: parseInt(timerMatch[1], 10) };
  }
  if (/^(?:open|show|set)\s+(?:sleep\s+)?timer$/i.test(clean)) {
    return { type: 'OPEN_SLEEP_TIMER' };
  }

  // 5. Close / Dismiss Modal
  if (/^(?:close|dismiss|cancel|hide)\s*(?:modal|dialog|window|drawer|popup)?$/i.test(clean)) {
    return { type: 'CLOSE_MODAL' };
  }

  // 6. User Playlist Specific Commands:
  // e.g. "play Not Like You from my playlist", "play Kesariya from chill playlist"
  const fromPlaylistRegex = /(?:play|start)\s+(.+?)\s+(?:from|in|of)\s+(?:my\s+|the\s+)?(?:playlist\s+)?(.+)/i;
  const fromPlaylistMatch = clean.match(fromPlaylistRegex);

  if (fromPlaylistMatch) {
    const songName = fromPlaylistMatch[1].replace(/^(?:song|track)\s+/i, '').trim();
    const playlistName = fromPlaylistMatch[2].replace(/playlist$/i, '').trim();

    return {
      type: 'PLAYLIST_SONG',
      songQuery: songName,
      playlistQuery: playlistName,
    };
  }

  // 7. Play Entire Playlist command:
  // e.g. "play my chill playlist", "play playlist favorites", "play from my playlist"
  const playAllPlaylistRegex = /(?:play|start)\s+(?:from\s+)?(?:my\s+|the\s+)?playlist\s*(.*)/i;
  const playAllPlaylistMatch = clean.match(playAllPlaylistRegex);

  if (playAllPlaylistMatch) {
    const playlistName = playAllPlaylistMatch[1].trim();
    return {
      type: 'PLAY_PLAYLIST_ALL',
      playlistQuery: playlistName,
    };
  }

  // 8. Mood / Atmosphere command:
  // e.g. "play romantic songs", "play some chill beats", "play party songs"
  const moodRegex = /(?:play|set\s+mood\s+to|i\s+want\s+some)\s*(?:some\s+)?(romantic|happy|sad|calm|energetic|focus|chill|relaxing|party|lofi|lo-fi|rock)\s*(?:songs|music|beats)?/i;
  const moodMatch = clean.match(moodRegex);

  if (moodMatch) {
    let rawMood = moodMatch[1].toLowerCase();
    if (rawMood === 'chill' || rawMood === 'relaxing') rawMood = 'calm';
    if (rawMood === 'party') rawMood = 'energetic';
    if (rawMood === 'lofi' || rawMood === 'lo-fi') rawMood = 'focus';
    return {
      type: 'PLAY_MOOD',
      mood: rawMood,
    };
  }

  // 9. Direct Song Query:
  // e.g. "play Not Like You", "play Kesariya", "play Believer"
  const directSongMatch = clean.match(/(?:play|stream|search\s+and\s+play|search)\s+(?:song\s+|track\s+)?(.+)/i);
  if (directSongMatch) {
    return {
      type: 'DATABASE_SONG_SEARCH',
      query: directSongMatch[1].trim(),
    };
  }

  // Fallback: If user just spoke a song title like "Not Like You", "Kesariya", "Believer"
  if (clean.length > 2) {
    return {
      type: 'DATABASE_SONG_SEARCH',
      query: clean,
    };
  }

  return null;
};

/**
 * Executes the parsed voice action strictly within database.
 * Supports navigation, playback controls, and playlist commands.
 */
export const executeVoiceAction = async (command, dispatch, audioState, allPlaylists = [], navigate = null) => {
  if (!command) return;

  switch (command.type) {
    case 'WAKE_ONLY': {
      playVoiceChime('wake');
      speakVoiceFeedback('Voice assistant is active.');
      dispatch(
        setVoiceDJFeedback({
          text: '🎙️ Voice assistant active • Speak your command',
          type: 'info',
          status: 'listening',
        })
      );
      break;
    }

    case 'PAUSE': {
      dispatch(setPlaying(false));
      playVoiceChime('success');
      speakVoiceFeedback('Paused.');
      dispatch(setVoiceDJFeedback({ text: '⏸ Paused', type: 'control' }));
      break;
    }

    case 'RESUME': {
      if (audioState.currentSong) {
        dispatch(setPlaying(true));
        playVoiceChime('success');
        speakVoiceFeedback('Playing.');
        dispatch(setVoiceDJFeedback({ text: '▶ Playing', type: 'control' }));
      } else {
        // Fallback: play first available song from playlist, history, or curated seeds
        let songToPlay = null;
        for (const pl of allPlaylists) {
          if (Array.isArray(pl.songs) && pl.songs.length > 0) {
            songToPlay = pl.songs[0];
            break;
          }
        }
        if (!songToPlay && Array.isArray(audioState.playbackHistory) && audioState.playbackHistory.length > 0) {
          songToPlay = audioState.playbackHistory[0];
        }
        if (!songToPlay && FALLBACK_SIMILAR_TRACKS.length > 0) {
          songToPlay = FALLBACK_SIMILAR_TRACKS[0];
        }

        if (songToPlay) {
          dispatch(setQueue([songToPlay]));
          dispatch(playSong(songToPlay));
          playVoiceChime('success');
          speakVoiceFeedback('Playing.');
          dispatch(
            setVoiceDJFeedback({
              text: `▶ Playing "${songToPlay.name}"`,
              type: 'control',
              status: 'success',
            })
          );
        } else {
          speakVoiceFeedback('No songs in queue.');
        }
      }
      break;
    }

    case 'NAVIGATE_PAGE': {
      if (navigate && command.path) {
        navigate(command.path, command.focusHistory ? { state: { activeTab: 'history' } } : undefined);
        playVoiceChime('success');
        speakVoiceFeedback(command.feedback || 'Opening.');
        dispatch(
          setVoiceDJFeedback({
            text: command.displayText || `Opening ${command.title}`,
            type: 'control',
            status: 'success',
          })
        );
      } else if (command.path) {
        window.location.href = command.path;
      }
      break;
    }

    case 'OPEN_SPECIFIC_PLAYLIST': {
      if (navigate) {
        navigate('/playlists', { state: { selectedPlaylistQuery: command.playlistQuery } });
        playVoiceChime('success');
        speakVoiceFeedback(`Opening ${command.playlistQuery} playlist.`);
        dispatch(
          setVoiceDJFeedback({
            text: `📁 Opening "${command.playlistQuery}"`,
            type: 'control',
            status: 'success',
          })
        );
      }
      break;
    }

    case 'OPEN_QUEUE': {
      dispatch(openQueue());
      playVoiceChime('success');
      speakVoiceFeedback('Opening queue.');
      dispatch(setVoiceDJFeedback({ text: '📑 Queue Opened', type: 'control' }));
      break;
    }

    case 'CLOSE_QUEUE': {
      dispatch(closeQueue());
      playVoiceChime('success');
      speakVoiceFeedback('Queue closed.');
      dispatch(setVoiceDJFeedback({ text: 'Queue closed', type: 'control' }));
      break;
    }

    case 'OPEN_PLAYER': {
      dispatch(setTurntableOpen(true));
      playVoiceChime('success');
      speakVoiceFeedback('Opening music player.');
      dispatch(setVoiceDJFeedback({ text: '💿 Player Opened', type: 'control' }));
      break;
    }

    case 'CLOSE_PLAYER': {
      dispatch(setTurntableOpen(false));
      playVoiceChime('success');
      speakVoiceFeedback('Player minimized.');
      dispatch(setVoiceDJFeedback({ text: 'Player minimized', type: 'control' }));
      break;
    }

    case 'OPEN_SLEEP_TIMER': {
      dispatch(setSleepTimerModalOpen(true));
      playVoiceChime('success');
      speakVoiceFeedback('Opening sleep timer.');
      dispatch(setVoiceDJFeedback({ text: '🌙 Sleep Timer Opened', type: 'control' }));
      break;
    }

    case 'CLOSE_MODAL': {
      dispatch(setSleepTimerModalOpen(false));
      dispatch(setShortcutsModalOpen(false));
      dispatch(closeQueue());
      dispatch(closeVibeCard());
      playVoiceChime('success');
      speakVoiceFeedback('Closed.');
      dispatch(setVoiceDJFeedback({ text: 'Closed', type: 'control' }));
      break;
    }

    case 'NEXT': {
      dispatch(playNext());
      playVoiceChime('success');
      speakVoiceFeedback('Playing.');
      dispatch(setVoiceDJFeedback({ text: '⏭ Playing next', type: 'control' }));
      break;
    }

    case 'PREVIOUS': {
      dispatch(playPrevious());
      playVoiceChime('success');
      speakVoiceFeedback('Playing.');
      dispatch(setVoiceDJFeedback({ text: '⏮ Playing previous', type: 'control' }));
      break;
    }

    case 'MUTE': {
      if (!audioState.isMuted) dispatch(toggleMute());
      playVoiceChime('success');
      speakVoiceFeedback('Muted.');
      dispatch(setVoiceDJFeedback({ text: '🔇 Muted', type: 'control' }));
      break;
    }

    case 'UNMUTE': {
      if (audioState.isMuted) dispatch(toggleMute());
      playVoiceChime('success');
      speakVoiceFeedback('Unmuted.');
      dispatch(setVoiceDJFeedback({ text: '🔊 Unmuted', type: 'control' }));
      break;
    }

    case 'SHUFFLE': {
      dispatch(toggleShuffle());
      playVoiceChime('success');
      speakVoiceFeedback('Queue shuffled.');
      dispatch(setVoiceDJFeedback({ text: '🔀 Shuffled', type: 'control' }));
      break;
    }

    case 'VOLUME_UP': {
      const nextVol = Math.min(100, (audioState.volume || 75) + 15);
      dispatch(setVolume(nextVol));
      playVoiceChime('success');
      speakVoiceFeedback(`Volume ${nextVol} percent.`);
      dispatch(setVoiceDJFeedback({ text: `🔊 Volume: ${nextVol}%`, type: 'control' }));
      break;
    }

    case 'VOLUME_DOWN': {
      const prevVol = Math.max(0, (audioState.volume || 75) - 15);
      dispatch(setVolume(prevVol));
      playVoiceChime('success');
      speakVoiceFeedback(`Volume ${prevVol} percent.`);
      dispatch(setVoiceDJFeedback({ text: `🔉 Volume: ${prevVol}%`, type: 'control' }));
      break;
    }

    case 'SET_VOLUME': {
      dispatch(setVolume(command.value));
      playVoiceChime('success');
      speakVoiceFeedback(`Volume ${command.value} percent.`);
      dispatch(setVoiceDJFeedback({ text: `🔊 Volume: ${command.value}%`, type: 'control' }));
      break;
    }

    case 'SLEEP_TIMER': {
      dispatch(setSleepTimer({ minutes: command.minutes }));
      playVoiceChime('success');
      speakVoiceFeedback(`Sleep timer set for ${command.minutes} minutes.`);
      dispatch(
        setVoiceDJFeedback({
          text: `🌙 Timer: ${command.minutes}m`,
          type: 'control',
        })
      );
      break;
    }

    case 'VIBE_CARD': {
      if (audioState.currentSong) {
        dispatch(openVibeCard(audioState.currentSong));
        playVoiceChime('success');
        speakVoiceFeedback('Opening vibe card.');
        dispatch(setVoiceDJFeedback({ text: '📸 Vibe Card', type: 'control' }));
      }
      break;
    }

    case 'PLAYLIST_SONG': {
      const qPlaylist = (command.playlistQuery || '').toLowerCase().trim();
      const qSong = (command.songQuery || '').toLowerCase().trim();

      // If specific playlist was specified, try that first
      if (
        qPlaylist &&
        qPlaylist !== 'playlist' &&
        qPlaylist !== 'my playlist' &&
        qPlaylist !== 'the playlist' &&
        qPlaylist !== 'my' &&
        qPlaylist !== 'the'
      ) {
        const targetPlaylist = allPlaylists.find((p) => {
          const name = (p.name || '').toLowerCase();
          const mood = (p.mood || '').toLowerCase();
          return name === qPlaylist || name.includes(qPlaylist) || qPlaylist.includes(name) || mood === qPlaylist;
        });

        if (targetPlaylist && Array.isArray(targetPlaylist.songs) && targetPlaylist.songs.length > 0) {
          const foundSong = targetPlaylist.songs.find((s) => matchSongTitleOrArtist(s.name, s.artist, qSong));
          if (foundSong) {
            dispatch(setQueue([foundSong]));
            dispatch(playSong(foundSong));
            playVoiceChime('success');
            speakVoiceFeedback('Playing.');
            dispatch(
              setVoiceDJFeedback({
                text: `▶ Playing "${foundSong.name}" from ${targetPlaylist.name}`,
                type: 'playlist',
                status: 'success',
              })
            );
            return;
          }
        }
      }

      // Search across ALL user & starter playlists
      for (const pl of allPlaylists) {
        if (Array.isArray(pl.songs) && pl.songs.length > 0) {
          const foundSong = pl.songs.find((s) => matchSongTitleOrArtist(s.name, s.artist, qSong));
          if (foundSong) {
            dispatch(setQueue([foundSong]));
            dispatch(playSong(foundSong));
            playVoiceChime('success');
            speakVoiceFeedback('Playing.');
            dispatch(
              setVoiceDJFeedback({
                text: `▶ Playing "${foundSong.name}" from ${pl.name}`,
                type: 'playlist',
                status: 'success',
              })
            );
            return;
          }
        }
      }

      // Fallback: check general database (including backend search API)
      const dbFallback = await findSongInDatabase(command.songQuery, allPlaylists);
      if (dbFallback) {
        dispatch(setQueue([dbFallback]));
        dispatch(playSong(dbFallback));
        playVoiceChime('success');
        speakVoiceFeedback('Playing.');
        dispatch(
          setVoiceDJFeedback({
            text: `▶ Playing "${dbFallback.name}"`,
            type: 'database',
            status: 'success',
          })
        );
        return;
      }

      // Not available in database
      playVoiceChime('error');
      speakVoiceFeedback('Not available.');
      dispatch(
        setVoiceDJFeedback({
          text: `⚠️ "${command.songQuery}" not available in database`,
          type: 'error',
          status: 'error',
        })
      );
      break;
    }

    case 'PLAY_PLAYLIST_ALL': {
      const qPlaylist = (command.playlistQuery || '').toLowerCase();
      let targetPlaylist = allPlaylists.find((p) => {
        const name = (p.name || '').toLowerCase();
        const mood = (p.mood || '').toLowerCase();
        return (
          name === qPlaylist ||
          name.includes(qPlaylist) ||
          qPlaylist.includes(name) ||
          mood === qPlaylist
        );
      });

      if (!targetPlaylist || !qPlaylist || qPlaylist === 'my' || qPlaylist === 'the') {
        targetPlaylist = allPlaylists.find((p) => Array.isArray(p.songs) && p.songs.length > 0) || allPlaylists[0];
      }

      if (targetPlaylist && Array.isArray(targetPlaylist.songs) && targetPlaylist.songs.length > 0) {
        dispatch(setQueue(targetPlaylist.songs));
        dispatch(playSong(targetPlaylist.songs[0]));
        playVoiceChime('success');
        speakVoiceFeedback('Playing.');
        dispatch(
          setVoiceDJFeedback({
            text: `▶ Playing playlist "${targetPlaylist.name}"`,
            type: 'playlist',
            status: 'success',
          })
        );
      } else {
        playVoiceChime('error');
        speakVoiceFeedback('Not available.');
        dispatch(
          setVoiceDJFeedback({
            text: `⚠️ Playlist not available`,
            type: 'error',
            status: 'error',
          })
        );
      }
      break;
    }

    case 'PLAY_MOOD': {
      dispatch(setActiveMood(command.mood));
      playVoiceChime('success');
      speakVoiceFeedback('Playing.');
      dispatch(
        setVoiceDJFeedback({
          text: `▶ Playing ${command.mood.toUpperCase()} music`,
          type: 'mood',
          status: 'success',
        })
      );

      // Find matching mood songs from curated database
      const matchingMoodTracks = FALLBACK_SIMILAR_TRACKS.filter(
        (t) => (t.mood_match || '').toLowerCase() === command.mood
      );

      if (matchingMoodTracks.length > 0) {
        dispatch(setQueue(matchingMoodTracks));
        dispatch(playSong(matchingMoodTracks[0]));
      }
      break;
    }

    case 'DATABASE_SONG_SEARCH': {
      const foundSong = await findSongInDatabase(command.query, allPlaylists);

      if (foundSong) {
        // Play only this single song cleanly
        dispatch(setQueue([foundSong]));
        dispatch(playSong(foundSong));
        playVoiceChime('success');
        speakVoiceFeedback('Playing.');
        dispatch(
          setVoiceDJFeedback({
            text: `▶ Playing "${foundSong.name}"`,
            type: 'database',
            status: 'success',
          })
        );
      } else {
        // Song not available in database
        playVoiceChime('error');
        speakVoiceFeedback('Not available.');
        dispatch(
          setVoiceDJFeedback({
            text: `⚠️ "${command.query}" is not available in database`,
            type: 'error',
            status: 'error',
          })
        );
      }
      break;
    }

    default:
      break;
  }
};
