import { useState, useRef, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { playSong, setQueue } from '../store/audioSlice';
import { getUserPlaylistSongs } from '../utils/userStorage';
import axios from 'axios';
import { API_BASE_URL } from '../config/api';


const STARTER_MOOD_PLAYLISTS = [
  { id: 'starter-calm-and-relax', name: 'Calm & Relax', mood: 'calm', emoji: '🍃' },
  { id: 'starter-happy-vibes', name: 'Happy Vibes', mood: 'happy', emoji: '😊' },
  { id: 'starter-energetic-boost', name: 'Energetic Boost', mood: 'energetic', emoji: '⚡' },
  { id: 'starter-late-night-blues', name: 'Late Night Blues', mood: 'sad', emoji: '🌙' },
  { id: 'starter-deep-focus', name: 'Deep Focus', mood: 'focus', emoji: '🎯' },
  { id: 'starter-romantic-twilight', name: 'Romantic Twilight', mood: 'romantic', emoji: '💖' },
];

const CHATBOT_MOOD_THEMES = {
  calm: {
    name: 'Calm',
    accent: '#00F2FE',
    accentRgb: '0, 242, 254',
    gradient: 'from-cyan-400 to-emerald-400',
    headerGrad: 'from-cyan-950/60 via-slate-900/85 to-emerald-950/40',
    userBubble: 'from-cyan-600 to-teal-600',
    spark: '🌊',
  },
  romantic: {
    name: 'Romantic',
    accent: '#EC4899',
    accentRgb: '236, 72, 153',
    gradient: 'from-pink-500 to-rose-400',
    headerGrad: 'from-pink-950/60 via-slate-900/85 to-rose-950/40',
    userBubble: 'from-pink-600 to-rose-600',
    spark: '💖',
  },
  happy: {
    name: 'Happy',
    accent: '#F59E0B',
    accentRgb: '245, 158, 11',
    gradient: 'from-amber-400 to-pink-500',
    headerGrad: 'from-amber-950/60 via-slate-900/85 to-orange-950/40',
    userBubble: 'from-amber-500 to-orange-500',
    spark: '✨',
  },
  energetic: {
    name: 'Energetic',
    accent: '#F97316',
    accentRgb: '249, 115, 22',
    gradient: 'from-orange-500 to-amber-400',
    headerGrad: 'from-orange-950/60 via-slate-900/85 to-amber-950/40',
    userBubble: 'from-orange-500 to-amber-500',
    spark: '⚡',
  },
  focus: {
    name: 'Focus',
    accent: '#10B981',
    accentRgb: '16, 185, 129',
    gradient: 'from-emerald-400 to-teal-500',
    headerGrad: 'from-emerald-950/60 via-slate-900/85 to-teal-950/40',
    userBubble: 'from-emerald-600 to-teal-600',
    spark: '🧠',
  },
  sad: {
    name: 'Reflective',
    accent: '#3B82F6',
    accentRgb: '59, 130, 246',
    gradient: 'from-blue-500 to-indigo-500',
    headerGrad: 'from-blue-950/60 via-slate-900/85 to-indigo-950/40',
    userBubble: 'from-blue-600 to-indigo-600',
    spark: '🌧️',
  },
};

const Chatbot = ({ isOpen, onToggle, currentMood, onPlaySong, onPlayPlaylist }) => {
  // Load messages from sessionStorage on mount
  const [messages, setMessages] = useState(() => {
    const savedMessages = localStorage.getItem('chatbotMessages');
    if (savedMessages) {
      return JSON.parse(savedMessages);
    }
    return [
      {
        role: 'assistant',
        content: 'Hi! I\'m your music assistant. You can:\n• Say "play [song name]" for instant playback\n• Say "play playlist [name]" to play your playlists\n• Ask for recommendations\n• Search by artist, lyrics, or mood!',
        songs: [],
        playCommand: null,
        playlistName: null
      }
    ];
  });
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('auto');

  const reduxCurrentSong = useSelector((state) => state.audio?.currentSong);
  const isPlayerDismissed = useSelector((state) => state.audio?.isPlayerDismissed);
  const reduxActiveMood = useSelector((state) => state.audio?.activeMood);
  const authUser = useSelector((state) => state.auth?.user);
  const dispatch = useDispatch();

  // Dynamic vertical offset: If BottomPlayer dock is active, float above dock; otherwise stay anchored near bottom corner
  const isBottomPlayerVisible = Boolean(reduxCurrentSong && !isPlayerDismissed);
  const bottomOffsetClass = isBottomPlayerVisible ? 'bottom-24 sm:bottom-26' : 'bottom-5 sm:bottom-6';

  const rawMood = typeof currentMood === 'object' && currentMood !== null 
    ? (currentMood.mood || currentMood.id) 
    : (currentMood || reduxActiveMood);
  const moodStr = String(rawMood || '').toLowerCase().trim();
  
  // Intelligent theme resolution based on active mood and playing track
  const resolveTheme = () => {
    if (CHATBOT_MOOD_THEMES[moodStr]) return CHATBOT_MOOD_THEMES[moodStr];
    if (moodStr.includes('energetic') || moodStr.includes('energy') || moodStr.includes('party')) return CHATBOT_MOOD_THEMES.energetic;
    if (moodStr.includes('romantic') || moodStr.includes('romance') || moodStr.includes('love')) return CHATBOT_MOOD_THEMES.romantic;
    if (moodStr.includes('calm') || moodStr.includes('chill') || moodStr.includes('peace') || moodStr.includes('zen') || moodStr.includes('relax') || moodStr.includes('acoustic')) return CHATBOT_MOOD_THEMES.calm;
    if (moodStr.includes('focus') || moodStr.includes('study') || moodStr.includes('lofi') || moodStr.includes('lo-fi')) return CHATBOT_MOOD_THEMES.focus;
    if (moodStr.includes('sad') || moodStr.includes('reflect') || moodStr.includes('blues') || moodStr.includes('melanchol')) return CHATBOT_MOOD_THEMES.sad;
    if (moodStr.includes('happy') || moodStr.includes('joy') || moodStr.includes('cheer')) return CHATBOT_MOOD_THEMES.happy;
    
    // Check current playing track tag
    if (reduxCurrentSong) {
      const g = String(reduxCurrentSong.genre || reduxCurrentSong.mood_match || '').toLowerCase();
      if (g.includes('energetic')) return CHATBOT_MOOD_THEMES.energetic;
      if (g.includes('romantic')) return CHATBOT_MOOD_THEMES.romantic;
      if (g.includes('calm')) return CHATBOT_MOOD_THEMES.calm;
      if (g.includes('focus')) return CHATBOT_MOOD_THEMES.focus;
      if (g.includes('sad')) return CHATBOT_MOOD_THEMES.sad;
    }
    return CHATBOT_MOOD_THEMES.happy;
  };

  const moodTheme = resolveTheme();
  const messagesEndRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Save messages to sessionStorage whenever they change
  useEffect(() => {
    localStorage.setItem('chatbotMessages', JSON.stringify(messages));
    scrollToBottom();
  }, [messages]);

  const handleSongClick = async (songName, artistName) => {
    try {
      console.log(`🎵 Playing: "${songName}" by ${artistName}`);
      
      setMessages(prev => [...prev, {
        role: 'system',
        content: `🔍 Loading "${songName}"...`,
        songs: [],
        playCommand: null,
        playlistName: null
      }]);
      
      const response = await axios.get(`${API_BASE_URL}/search-song`, {
        params: { name: songName, artist: artistName }
      });
      
      const song = response.data;
      
      if (!song.youtube_id) {
        setMessages(prev => prev.filter(msg => !msg.content.includes('🔍 Loading')));
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: `❌ "${songName}" found but no video available.`,
          songs: [],
          playCommand: null,
          playlistName: null
        }]);
        return;
      }
      
      setMessages(prev => prev.filter(msg => !msg.content.includes('🔍 Loading')));
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `Now playing: "${song.name}" by ${song.artist}`,
        songs: [],
        playCommand: null,
        playlistName: null
      }]);
      
      if (onPlaySong) {
        onPlaySong(song);
      }
      
    } catch (error) {
      console.error('❌ Error:', error);
      setMessages(prev => prev.filter(msg => !msg.content.includes('🔍 Loading')));
      
      const errorMsg = error.response?.data?.detail || 'Song not found';
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `❌ ${errorMsg}`,
        songs: [],
        playCommand: null,
        playlistName: null
      }]);
    }
  };

  const handlePlaylistClick = async (playlistQuery) => {
    try {
      const q = String(playlistQuery || '').trim().toLowerCase();
      const isAuto =
        !q ||
        q === 'auto' ||
        q === 'my playlist' ||
        q === 'the playlist' ||
        q === 'playlist' ||
        q === 'music' ||
        q === 'music from my' ||
        q === 'music from my playlist' ||
        q === 'from my playlist' ||
        q === 'from my' ||
        q.includes('music from my') ||
        q.includes('from my playlist');

      // Load all custom user playlists from backend if available
      let userCustomPlaylists = [];
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const resp = await axios.get(`${API_BASE_URL}/api/playlists`, {
            headers: { Authorization: `Bearer ${token}` },
            timeout: 2500,
          });
          if (Array.isArray(resp.data)) {
            userCustomPlaylists = resp.data;
          }
        } catch (e) {}
      }

      // Build complete pool with user-scoped stored songs
      const allCandidatePlaylists = [
        ...userCustomPlaylists.map(p => ({
          ...p,
          id: p.id || p._id,
          songs: (p.songs && p.songs.length > 0) ? p.songs : getUserPlaylistSongs(p.id || p._id, authUser),
        })),
        ...STARTER_MOOD_PLAYLISTS.map(p => ({
          ...p,
          songs: getUserPlaylistSongs(p.id, authUser),
        })),
      ];

      let targetPlaylist = null;

      if (isAuto) {
        // User requested "play music from my playlist": resolve by active mood!
        const currentMoodKey = String(moodStr || reduxActiveMood || 'calm').toLowerCase();
        
        // 1. Try to find a playlist matching the active mood that has songs
        targetPlaylist = allCandidatePlaylists.find(
          p => String(p.mood || '').toLowerCase() === currentMoodKey && Array.isArray(p.songs) && p.songs.length > 0
        );

        // 2. If mood playlist is empty, pick the first user playlist that actually has songs
        if (!targetPlaylist) {
          targetPlaylist = allCandidatePlaylists.find(
            p => Array.isArray(p.songs) && p.songs.length > 0
          );
        }

        // 3. Fallback to the mood starter playlist even if empty (to give clear feedback)
        if (!targetPlaylist) {
          targetPlaylist = allCandidatePlaylists.find(
            p => String(p.mood || '').toLowerCase() === currentMoodKey
          ) || allCandidatePlaylists[0];
        }
      } else {
        // Specific playlist name mentioned (e.g. "travelling", "romantic twilight", "happy vibes", "music")
        targetPlaylist = allCandidatePlaylists.find(p => {
          const pName = String(p.name || '').toLowerCase();
          const pMood = String(p.mood || '').toLowerCase();
          return pName === q || pName.includes(q) || q.includes(pName) || pMood === q;
        });

        // Backend fallback lookup by exact name if not found in local candidates
        if (!targetPlaylist && token) {
          try {
            const resp = await axios.get(
              `${API_BASE_URL}/api/playlists/by-name/${encodeURIComponent(playlistQuery)}`,
              { headers: { Authorization: `Bearer ${token}` }, timeout: 2500 }
            );
            if (resp.data) {
              const p = resp.data;
              targetPlaylist = {
                ...p,
                id: p.id || p._id,
                songs: (p.songs && p.songs.length > 0) ? p.songs : getUserPlaylistSongs(p.id || p._id, authUser),
              };
            }
          } catch (e) {}
        }
      }

      if (!targetPlaylist) {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: `❌ Could not find playlist "${playlistQuery}". Try mentioning one of your playlists like "Calm & Relax", "Happy Vibes", or your custom playlists!`,
          songs: [],
          playCommand: null,
          playlistName: null,
        }]);
        return;
      }

      if (!targetPlaylist.songs || targetPlaylist.songs.length === 0) {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: `⚠️ Your playlist "${targetPlaylist.name}" is currently empty. Add songs to it using the "+ Add to Playlist" button on any track!`,
          songs: [],
          playCommand: null,
          playlistName: null,
        }]);
        return;
      }

      // Immediately initiate playback!
      dispatch(setQueue(targetPlaylist.songs));
      dispatch(playSong(targetPlaylist.songs[0]));
      if (onPlayPlaylist) {
        onPlayPlaylist(targetPlaylist);
      }

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `🎵 Now playing from your "${targetPlaylist.name}" playlist (${targetPlaylist.songs.length} tracks)!`,
        songs: targetPlaylist.songs.slice(0, 5),
        playCommand: null,
        playlistName: targetPlaylist.name,
      }]);

    } catch (error) {
      console.error('❌ Playlist playback error:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `❌ Could not play playlist "${playlistQuery}". Please try again.`,
        songs: [],
        playCommand: null,
        playlistName: null,
      }]);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4';
      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        
        // Check if audio has sufficient data
        if (audioBlob.size < 1000) {
          setMessages(prev => prev.filter(msg => msg.role !== 'system'));
          setMessages(prev => [...prev, {
            role: 'assistant',
            content: '⚠️ Recording too short. Please speak for at least 1 second.',
            songs: [],
            playCommand: null,
            playlistName: null
          }]);
        } else {
          await transcribeAudio(audioBlob);
        }
        
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorder.start();
      setIsRecording(true);
      
      setMessages(prev => [...prev, {
        role: 'system',
        content: '🎤 Listening... Speak now (supports English & Hindi)',
        songs: [],
        playCommand: null,
        playlistName: null
      }]);
      
    } catch (error) {
      console.error('Microphone error:', error);
      alert('Could not access microphone. Please grant permission.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const transcribeAudio = async (audioBlob) => {
    setIsTranscribing(true);
    
    try {
      const formData = new FormData();
      formData.append('file', audioBlob, 'recording.webm');
      
      // Choose endpoint based on language selection
      const endpoint = selectedLanguage === 'auto' 
        ? `${API_BASE_URL}/voice/transcribe-detailed`
        : `${API_BASE_URL}/voice/transcribe?language=${selectedLanguage}`;
      
      const response = await axios.post(
        endpoint,
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
          timeout: 30000 // 30 second timeout
        }
      );
      
      const { transcript, detected_language, language_name, confidence } = response.data;
      
      setMessages(prev => prev.filter(msg => msg.role !== 'system'));
      setInput(transcript);
      
      // Show language detection info
      const languageInfo = language_name ? ` (${language_name})` : '';
      const confidenceInfo = confidence ? ` [${Math.round(confidence * 100)}% confident]` : '';
      
      setMessages(prev => [...prev, {
        role: 'user',
        content: `🎤 ${transcript}${languageInfo}${confidenceInfo}`,
        songs: [],
        playCommand: null,
        playlistName: null
      }]);
      
      setTimeout(() => handleSendMessage(transcript), 500);
      
    } catch (error) {
      console.error('Transcription error:', error);
      setMessages(prev => prev.filter(msg => msg.role !== 'system'));
      
      let errorMessage = 'Sorry, couldn\'t understand. Please try again.';
      
      if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      } else if (error.code === 'ECONNABORTED') {
        errorMessage = 'Transcription timeout. Please try with shorter audio.';
      } else if (!navigator.onLine) {
        errorMessage = 'No internet connection. Please check your network.';
      }
      
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `❌ ${errorMessage}`,
        songs: [],
        playCommand: null,
        playlistName: null
      }]);
    } finally {
      setIsTranscribing(false);
    }
  };

  const renderMessage = (message) => {
    const { content, songs, playCommand, playlistName } = message;
    
    return (
      <div className="space-y-2">
        {content && (
          <p className="text-sm whitespace-pre-wrap leading-relaxed">{content}</p>
        )}
        
        {/* Render song buttons */}
        {songs && songs.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {songs.map((song, idx) => (
              <button
                key={idx}
                onClick={() => handleSongClick(song.name, song.artist)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl transition-all text-sm group border shadow-sm backdrop-blur-md hover:scale-[1.02] active:scale-95"
                style={{
                  backgroundColor: `rgba(${moodTheme.accentRgb}, 0.12)`,
                  borderColor: `rgba(${moodTheme.accentRgb}, 0.35)`,
                  color: moodTheme.accent,
                }}
              >
                <svg className="w-4 h-4 group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                </svg>
                <div className="text-left">
                  <div className="font-semibold text-white group-hover:underline">{song.name}</div>
                  <div className="text-[11px] opacity-80" style={{ color: moodTheme.accent }}>{song.artist}</div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  };

  const handleSendMessage = async (messageText) => {
    const textToSend = messageText || input;
    if (!textToSend.trim()) return;

    // Check for direct playlist voice/text intent (instant response without roundtrip)
    const lower = textToSend.trim().toLowerCase();
    const isPlaylistIntent = 
      /\b(?:play|start|listen to)\s+(?:music\s+)?(?:from\s+)?(?:my\s+)?(?:the\s+)?playlist\b/i.test(lower) ||
      /\b(?:play|start|listen to)\s+my\s+playlist\b/i.test(lower) ||
      /\b(?:play|start|listen to)\s+playlist\b/i.test(lower) ||
      /\bplay\s+(?:my\s+)?([a-zA-Z0-9_\-\s&]+?)\s+playlist\b/i.test(lower) ||
      /\bplay\s+playlist\s+([a-zA-Z0-9_\-\s&]+)\b/i.test(lower);

    if (isPlaylistIntent) {
      // NOTE: Do NOT append user message here — handleSend/transcribeAudio already appended it!
      setInput('');

      let playlistTarget = 'auto';
      const m1 = lower.match(/\b(?:play|start|listen to)\s+(?:my\s+)?([a-zA-Z0-9_\-\s&]+?)\s+playlist\b/i);
      const m2 = lower.match(/\b(?:play|start|listen to)\s+playlist\s+([a-zA-Z0-9_\-\s&]+)\b/i);
      const genericWords = ['music', 'song', 'songs', 'track', 'tracks', 'music from', 'music from my', 'from my', 'my', 'the', 'a', ''];

      if (m1 && m1[1]) {
        const raw = m1[1].replace(/^(?:some|any|a|the|my|our)\s+/, '').trim();
        if (!genericWords.includes(raw)) {
          playlistTarget = raw;
        }
      } else if (m2 && m2[1]) {
        const raw = m2[1].replace(/^(?:named|called|title)\s+/, '').trim();
        if (!genericWords.includes(raw)) {
          playlistTarget = raw;
        }
      }

      await handlePlaylistClick(playlistTarget);
      return;
    }

    setIsLoading(true);

    try {
      const response = await axios.post(`${API_BASE_URL}/chat`, {
        message: textToSend,
        user_id: 'default',
        current_mood: currentMood?.mood || currentMood
      });

      // Handle playlist command
      if (response.data.playlist_name) {
        await handlePlaylistClick(response.data.playlist_name);
      }
      // Handle direct play command
      else if (response.data.play_command && response.data.play_command.autoplay) {
        const cmd = response.data.play_command;
        await handleSongClick(cmd.name, cmd.artist);
      }

      // Add assistant response
      const assistantMessage = {
        role: 'assistant',
        content: response.data.response || '',
        songs: response.data.recommended_songs || [],
        playCommand: response.data.play_command || null,
        playlistName: response.data.playlist_name || null
      };
      
      setMessages(prev => [...prev, assistantMessage]);
      
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: error.response?.data?.detail || 'Connection error. Please try again.',
        songs: [],
        playCommand: null,
        playlistName: null
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim()) return;
    
    const userMessage = {
      role: 'user',
      content: input,
      songs: [],
      playCommand: null,
      playlistName: null
    };
    setMessages(prev => [...prev, userMessage]);
    
    const currentInput = input;
    setInput('');
    await handleSendMessage(currentInput);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const SUGGESTION_PROMPTS = [
    { label: '💖 Romantic Hits', text: 'Play romantic Bollywood love songs' },
    { label: '⚡ Gym Energy', text: 'Play high energy workout beats' },
    { label: '🌧️ Lo-Fi Chill', text: 'Play calm relaxing lo-fi study music' },
    { label: '✨ Surprise Me', text: 'Recommend a popular trending hit song' },
  ];

  const handlePromptClick = (text) => {
    setInput(text);
    handleSendMessage(text);
  };

  return (
    <>
      {/* ============================================================== */}
      {/* ULTRA-MODERN FLOATING AI COPILOT LAUNCHER                      */}
      {/* Anchored at a stable, dedicated location on the screen          */}
      {/* ============================================================== */}
      {!isOpen && (
        <button
          onClick={onToggle}
          className={`fixed ${bottomOffsetClass} right-4 sm:right-6 z-50 group flex items-center gap-2.5 px-3.5 py-2.5 sm:px-4 sm:py-3 rounded-full bg-slate-950/90 hover:bg-slate-900/95 backdrop-blur-2xl transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer overflow-hidden border`}
          style={{
            borderColor: `${moodTheme.accent}60`,
            boxShadow: `0 10px 30px -4px rgba(${moodTheme.accentRgb}, 0.35)`,
          }}
          title="Open Aura AI Music Assistant"
        >
          {/* Ambient Shimmer Gradient */}
          <div
            className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
            style={{
              background: `radial-gradient(circle at center, rgba(${moodTheme.accentRgb}, 0.25), transparent 70%)`
            }}
          />

          {/* Glowing AI Avatar Orb in Mood Colors */}
          <div
            className={`relative flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-tr ${moodTheme.gradient} shadow-md`}
          >
            <span className="text-sm select-none">{moodTheme.spark}</span>
            {/* Animated Glow Halo */}
            <span
              className="absolute -inset-1 rounded-full animate-ping opacity-40 pointer-events-none border"
              style={{ borderColor: moodTheme.accent }}
            />
            {/* Live Status Pip */}
            <span
              className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-slate-950 animate-pulse"
              style={{ backgroundColor: moodTheme.accent }}
            />
          </div>

          {/* Sleek Modern Labels */}
          <div className="flex flex-col items-start text-left leading-tight pr-1">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-white tracking-wide group-hover:text-slate-100 transition-colors">
                Aura AI
              </span>
              <span
                className="text-[8px] font-mono font-bold px-1.5 py-0.2 rounded-full border uppercase tracking-wider"
                style={{
                  color: moodTheme.accent,
                  backgroundColor: `rgba(${moodTheme.accentRgb}, 0.15)`,
                  borderColor: `rgba(${moodTheme.accentRgb}, 0.35)`,
                }}
              >
                {moodTheme.name}
              </span>
            </div>
            <span className="text-[10px] text-slate-400 group-hover:text-slate-300 transition-colors mt-0.5 flex items-center gap-1">
              <span
                className="w-1.5 h-1.5 rounded-full inline-block animate-pulse"
                style={{ backgroundColor: moodTheme.accent }}
              />
              <span>Ask anything • Voice</span>
            </span>
          </div>
        </button>
      )}

      {/* ============================================================== */}
      {/* MODERN GLASSMORPHIC AI CHATBOT DIALOG                         */}
      {/* ============================================================== */}
      {isOpen && (
        <div
          className={`fixed ${bottomOffsetClass} right-4 sm:right-6 w-[94vw] sm:w-[410px] max-h-[82vh] h-[600px] rounded-3xl bg-slate-950/92 backdrop-blur-3xl border shadow-2xl flex flex-col z-50 overflow-hidden animate-fadeIn`}
          style={{
            borderColor: `${moodTheme.accent}40`,
            boxShadow: `0 25px 80px rgba(0,0,0,0.85), 0 0 45px rgba(${moodTheme.accentRgb}, 0.25)`,
          }}
        >
          {/* Modernized Header matching active mood */}
          <div className={`flex items-center justify-between p-3.5 sm:p-4 border-b border-white/10 bg-gradient-to-r ${moodTheme.headerGrad}`}>
            <div className="flex items-center gap-3">
              <div className="relative">
                <div
                  className={`w-9 h-9 rounded-full bg-gradient-to-tr ${moodTheme.gradient} flex items-center justify-center shadow-lg`}
                >
                  <span className="text-sm select-none">{moodTheme.spark}</span>
                </div>
                <span
                  className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-slate-950 animate-pulse"
                  style={{ backgroundColor: moodTheme.accent }}
                />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-white tracking-wide">Aura AI Copilot</h3>
                  <span
                    className="text-[8px] font-mono px-1.5 py-0.2 rounded-full border"
                    style={{
                      color: moodTheme.accent,
                      backgroundColor: `rgba(${moodTheme.accentRgb}, 0.2)`,
                      borderColor: `rgba(${moodTheme.accentRgb}, 0.35)`,
                    }}
                  >
                    {moodTheme.name}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400">Natural Voice & Smart Music Assistant</p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => {
                  localStorage.removeItem('chatbotMessages');
                  setMessages([
                    {
                      role: 'assistant',
                      content: 'Hi! I\'m your music assistant. You can:\n• Say "play [song name]" for instant playback\n• Say "play playlist [name]" to play your playlists\n• Ask for recommendations\n• Search by artist, lyrics, or mood!',
                      songs: [],
                      playCommand: null,
                      playlistName: null
                    }
                  ]);
                }}
                className="w-7 h-7 rounded-full bg-white/5 hover:bg-white/15 border border-white/10 flex items-center justify-center text-slate-400 hover:text-red-400 transition-all text-xs cursor-pointer"
                title="Clear chat"
              >
                🗑️
              </button>
              <button
                onClick={onToggle}
                className="w-7 h-7 rounded-full bg-white/5 hover:bg-white/15 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-all text-xs cursor-pointer"
                title="Close Assistant"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 custom-scrollbar">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.role === 'user' ? 'justify-end' : message.role === 'system' ? 'justify-center' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] p-3.5 rounded-2xl shadow-lg ${
                    message.role === 'user'
                      ? 'text-white rounded-br-sm'
                      : message.role === 'system'
                      ? 'bg-yellow-500/15 border border-yellow-500/30 text-yellow-300 text-xs rounded-xl'
                      : 'bg-slate-900/90 border border-white/10 text-slate-100 rounded-bl-sm'
                  }`}
                  style={
                    message.role === 'user'
                      ? {
                          background: `linear-gradient(135deg, ${moodTheme.accent}, rgba(${moodTheme.accentRgb}, 0.85))`,
                          boxShadow: `0 4px 18px rgba(${moodTheme.accentRgb}, 0.35)`,
                        }
                      : undefined
                  }
                >
                  {renderMessage(message)}
                  {message.role !== 'system' && (
                    <p className="text-[10px] mt-1.5 opacity-60 text-right">
                      {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  )}
                </div>
              </div>
            ))}
            {(isLoading || isTranscribing) && (
              <div className="flex justify-start">
                <div
                  className="bg-slate-900/90 border p-3 rounded-2xl rounded-bl-sm shadow-lg flex items-center gap-2"
                  style={{ borderColor: `rgba(${moodTheme.accentRgb}, 0.3)` }}
                >
                  <span className="text-xs font-semibold" style={{ color: moodTheme.accent }}>Aura AI is thinking</span>
                  <div className="flex gap-1">
                    <div className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ backgroundColor: moodTheme.accent }}></div>
                    <div className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ backgroundColor: moodTheme.accent, animationDelay: '0.2s' }}></div>
                    <div className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ backgroundColor: moodTheme.accent, animationDelay: '0.4s' }}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Suggestion Prompt Chips */}
          <div className="px-3 py-1.5 border-t border-white/5 bg-slate-950/60 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {SUGGESTION_PROMPTS.map((p) => (
              <button
                key={p.label}
                onClick={() => handlePromptClick(p.text)}
                disabled={isLoading || isRecording}
                className="shrink-0 text-[10px] px-2.5 py-1 rounded-full bg-white/5 hover:bg-white/15 border text-slate-300 hover:text-white transition-all cursor-pointer whitespace-nowrap active:scale-95"
                style={{ borderColor: `rgba(${moodTheme.accentRgb}, 0.25)` }}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Modernized Input Footer */}
          <div className="p-3 border-t border-white/10 bg-slate-950/90">
            <div
              className="flex items-center gap-2 bg-slate-900/90 border rounded-2xl p-1.5 transition-all"
              style={{
                borderColor: `rgba(${moodTheme.accentRgb}, 0.35)`,
                boxShadow: `0 0 15px rgba(${moodTheme.accentRgb}, 0.12)`,
              }}
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask Aura or type a song title..."
                className="flex-1 bg-transparent text-white px-3 py-1.5 focus:outline-none placeholder-slate-500 text-xs sm:text-sm"
                disabled={isLoading || isRecording}
              />

              {/* Voice Mic Button */}
              <button
                onClick={isRecording ? stopRecording : startRecording}
                disabled={isLoading || isTranscribing}
                className={`p-2 rounded-xl transition-all cursor-pointer disabled:opacity-50 ${
                  isRecording
                    ? 'bg-red-600 text-white animate-pulse shadow-lg shadow-red-500/50'
                    : 'bg-white/5 hover:bg-white/15 text-slate-300 hover:text-white'
                }`}
                title={isRecording ? 'Stop recording' : 'Voice search'}
              >
                {isRecording ? (
                  <span className="text-xs">⏹️</span>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                )}
              </button>

              {/* Send Button */}
              <button
                onClick={handleSend}
                disabled={isLoading || !input.trim() || isRecording}
                className="p-2 rounded-xl text-white shadow-md hover:opacity-95 transition-all disabled:opacity-30 disabled:pointer-events-none cursor-pointer active:scale-95"
                style={{
                  background: `linear-gradient(135deg, ${moodTheme.accent}, rgba(${moodTheme.accentRgb}, 0.85))`,
                  boxShadow: `0 4px 15px rgba(${moodTheme.accentRgb}, 0.35)`,
                }}
                title="Send message"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>

            {/* Language & Status Indicator */}
            <div className="flex items-center justify-between mt-2 px-1 text-[10px] text-slate-400">
              <div className="flex items-center gap-1.5">
                <span>Language:</span>
                <select
                  value={selectedLanguage}
                  onChange={(e) => setSelectedLanguage(e.target.value)}
                  className="bg-slate-900 border border-white/10 text-slate-300 rounded px-1.5 py-0.5 text-[10px] focus:outline-none"
                  disabled={isRecording || isTranscribing}
                >
                  <option value="auto">Auto-detect</option>
                  <option value="en">English</option>
                  <option value="hi">Hindi</option>
                </select>
              </div>

              {isRecording ? (
                <span className="text-red-400 font-semibold animate-pulse">
                  🔴 Recording voice...
                </span>
              ) : isTranscribing ? (
                <span className="text-yellow-400 font-semibold animate-pulse">
                  ⏳ Transcribing...
                </span>
              ) : (
                <span className="text-slate-500">Instant AI stream integration</span>
              )}
            </div>
          </div>
        </div>
      )}

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(168, 85, 247, 0.5);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(168, 85, 247, 0.7);
        }
      `}</style>
    </>
  );
};

export default Chatbot;
