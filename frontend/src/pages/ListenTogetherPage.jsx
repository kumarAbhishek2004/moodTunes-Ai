import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { playSong, setPlaying, setProgress, seekTo, setActiveMood } from '../store/audioSlice';
import TurntablePlayer from '../components/TurntablePlayer';
import AudioVisualizerCanvas from '../components/AudioVisualizerCanvas';

/**
 * ListenTogetherPage
 * "Listen Together" Sync Room (Party Mode)
 * Synchronizes playback across multiple clients via WebSockets
 * with real-time floating reaction emoji cannons.
 */
const ListenTogetherPage = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const authUser = useSelector((state) => state.auth?.user);
  const { currentSong, isPlaying, currentTime, activeMood } = useSelector((state) => state.audio);

  const [isHost, setIsHost] = useState(false);
  const [participants, setParticipants] = useState([]);
  const [floatingReactions, setFloatingReactions] = useState([]);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  const socketRef = useRef(null);
  const reactionIdRef = useRef(0);

  const clientName = authUser?.name || `Guest_${Math.floor(Math.random() * 900 + 100)}`;
  const clientAvatar = authUser?.avatar || '🎧';

  // Connect WebSocket
  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    // Connect to port 8000 for backend WebSocket or current host
    const wsHost = window.location.hostname === 'localhost' ? '127.0.0.1:8000' : window.location.host;
    const wsUrl = `${protocol}//${wsHost}/ws/room/${roomId}?name=${encodeURIComponent(clientName)}&avatar=${encodeURIComponent(clientAvatar)}`;

    const ws = new WebSocket(wsUrl);
    socketRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === 'ROOM_STATE_INIT') {
          setIsHost(Boolean(data.is_host));
          setParticipants(data.participants || []);
          if (data.state?.currentSong && !isHost) {
            dispatch(playSong(data.state.currentSong));
            if (data.state.isPlaying) dispatch(setPlaying(true));
            if (data.state.currentTime) dispatch(seekTo(data.state.currentTime));
          }
        } else if (data.type === 'USER_JOINED') {
          setParticipants(data.participants || []);
        } else if (data.type === 'USER_LEFT') {
          setParticipants(data.participants || []);
          if (data.host_id && authUser?.id === data.host_id) {
            setIsHost(true);
          }
        } else if (data.type === 'SYNC_PLAYBACK') {
          const payload = data.payload || {};
          if (payload.currentSong) dispatch(playSong(payload.currentSong));
          if (payload.isPlaying !== undefined) dispatch(setPlaying(payload.isPlaying));
          if (payload.currentTime !== undefined) dispatch(seekTo(payload.currentTime));
          if (payload.activeMood) dispatch(setActiveMood(payload.activeMood));
        } else if (data.type === 'FLOAT_REACTION') {
          triggerFloatingEmoji(data.emoji, data.sender_name);
        }
      } catch (err) {
        console.error('WS parse error:', err);
      }
    };

    ws.onclose = () => {
      setIsConnected(false);
    };

    return () => {
      ws.close();
    };
  }, [roomId, clientName, clientAvatar, dispatch, isHost]);

  // Trigger floating reaction animation
  const triggerFloatingEmoji = (emoji, senderName = '') => {
    const id = reactionIdRef.current++;
    const leftPercent = 20 + Math.random() * 60; // 20% to 80%
    const rotation = -20 + Math.random() * 40;

    const newReaction = {
      id,
      emoji,
      senderName,
      leftPercent,
      rotation,
    };

    setFloatingReactions((prev) => [...prev, newReaction]);

    setTimeout(() => {
      setFloatingReactions((prev) => prev.filter((r) => r.id !== id));
    }, 2800);
  };

  const sendReaction = (emoji) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(
        JSON.stringify({
          type: 'FLOAT_REACTION',
          emoji,
        })
      );
    }
  };

  const copyRoomLink = () => {
    const link = window.location.href;
    navigator.clipboard.writeText(link).then(() => {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    });
  };

  return (
    <div className="relative min-h-screen text-slate-100 flex flex-col font-sans select-none overflow-hidden">
      {/* Floating Emoji Reactions Layer */}
      <div className="fixed inset-0 pointer-events-none z-[160] overflow-hidden">
        {floatingReactions.map((r) => (
          <div
            key={r.id}
            style={{
              left: `${r.leftPercent}%`,
              transform: `rotate(${r.rotation}deg)`,
              bottom: '15%',
            }}
            className="absolute flex flex-col items-center animate-floatUp"
          >
            <span className="text-4xl filter drop-shadow-[0_0_12px_rgba(255,255,255,0.7)]">
              {r.emoji}
            </span>
            {r.senderName && (
              <span className="px-2 py-0.5 rounded-full bg-black/75 text-[10px] font-bold text-white border border-white/20 mt-1 whitespace-nowrap">
                {r.senderName}
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Top Header */}
      <header className="relative z-20 flex items-center justify-between px-6 py-4 border-b border-white/10 bg-slate-950/80 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/')}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            ←
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base">👥</span>
              <h1 className="text-sm sm:text-base font-bold text-white">
                Listen Together • Room: <span className="font-mono text-cyan">{roomId}</span>
              </h1>
              {isConnected ? (
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-mono font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  LIVE
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-[10px] font-mono">
                  Connecting...
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400">
              {isHost ? 'You are the Party Host (Playback syncs to everyone)' : 'Synced Listener Mode'}
            </p>
          </div>
        </div>

        {/* Invite Link & Participants Pill */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-slate-300">
            <span>🎧</span>
            <span>{participants.length} Listeners</span>
          </div>

          <button
            onClick={copyRoomLink}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-cyan text-slate-950 text-xs font-bold shadow-lg shadow-cyan/25 hover:brightness-110 active:scale-95 transition-all cursor-pointer"
          >
            <span>🔗</span>
            <span>{copiedLink ? 'Copied Link!' : 'Invite Friends'}</span>
          </button>
        </div>
      </header>

      {/* Main Party Room Content */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center p-4 max-w-6xl mx-auto w-full">
        {/* Turntable Player Embed */}
        <div className="w-full">
          <TurntablePlayer isModal={false} />
        </div>

        {/* Live Reaction Emojis Toolbar */}
        <div className="mt-4 p-3 rounded-2xl bg-slate-950/90 border border-white/10 shadow-2xl backdrop-blur-xl flex items-center justify-center gap-2 sm:gap-4">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider hidden sm:inline">
            React:
          </span>
          {['❤️', '🔥', '💃', '🎵', '🚀', '✨'].map((emoji) => (
            <button
              key={emoji}
              onClick={() => sendReaction(emoji)}
              className="text-2xl sm:text-3xl p-1.5 hover:scale-135 active:scale-90 transition-transform cursor-pointer"
              title={`Send ${emoji}`}
            >
              {emoji}
            </button>
          ))}
        </div>
      </main>
    </div>
  );
};

export default ListenTogetherPage;
