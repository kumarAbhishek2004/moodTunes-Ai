import { useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  setPlaying,
  playNext,
  setProgress,
  clearSeekTarget,
} from '../store/audioSlice';

/**
 * PersistentAudioEngine
 * Anchored at the root of App.jsx so audio never halts during page navigation.
 * Controls YouTube Iframe API with bidirectional state synchronization.
 */
const PersistentAudioEngine = () => {
  const dispatch = useDispatch();
  const playerRef = useRef(null);
  const pollTimerRef = useRef(null);
  const isApiReadyRef = useRef(false);

  const {
    currentSong,
    isPlaying,
    volume,
    isMuted,
    seekTarget,
  } = useSelector((state) => state.audio);

  // 1. Load YouTube IFrame API script dynamically once
  useEffect(() => {
    if (window.YT && window.YT.Player) {
      isApiReadyRef.current = true;
      initPlayer();
      return;
    }

    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

    window.onYouTubeIframeAPIReady = () => {
      isApiReadyRef.current = true;
      initPlayer();
    };

    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, []);

  const initPlayer = () => {
    if (!window.YT || playerRef.current) return;

    try {
      playerRef.current = new window.YT.Player('persistent-yt-player', {
        height: '100%',
        width: '100%',
        videoId: currentSong?.youtube_id || '',
        playerVars: {
          autoplay: 0,
          controls: 0,
          disablekb: 1,
          fs: 0,
          modestbranding: 1,
          rel: 0,
          playsinline: 1,
          origin: window.location.origin,
        },
        events: {
          onReady: (event) => {
            const vol = isMuted ? 0 : volume;
            event.target.setVolume(vol);
            if (currentSong?.youtube_id && isPlaying) {
              event.target.playVideo();
            }
          },
          onStateChange: (event) => {
            // YT.PlayerState.ENDED = 0
            if (event.data === 0) {
              dispatch(playNext());
            }
            // YT.PlayerState.PLAYING = 1
            else if (event.data === 1) {
              dispatch(setPlaying(true));
            }
            // YT.PlayerState.PAUSED = 2
            else if (event.data === 2) {
              dispatch(setPlaying(false));
            }
          },
          onError: (err) => {
            console.warn('YouTube Player error, advancing track:', err.data);
            // On embed error (e.g. video blocked or restricted), auto-advance
            dispatch(playNext());
          },
        },
      });
    } catch (e) {
      console.error('Failed to initialize YouTube Player:', e);
    }
  };

  // 2. Track changes when currentSong updates
  useEffect(() => {
    if (!playerRef.current || !playerRef.current.loadVideoById) return;

    if (currentSong?.youtube_id) {
      const vidId = currentSong.youtube_id;
      if (isPlaying) {
        playerRef.current.loadVideoById(vidId);
      } else {
        playerRef.current.cueVideoById(vidId);
      }
    }
  }, [currentSong?.id, currentSong?.youtube_id]);

  // 3. Sync Play / Pause
  useEffect(() => {
    if (!playerRef.current || typeof playerRef.current.getPlayerState !== 'function') return;

    try {
      const state = playerRef.current.getPlayerState();
      if (isPlaying && state !== 1 && state !== 3) {
        playerRef.current.playVideo();
      } else if (!isPlaying && state === 1) {
        playerRef.current.pauseVideo();
      }
    } catch (e) {}
  }, [isPlaying]);

  // 4. Sync Volume & Mute
  useEffect(() => {
    if (!playerRef.current || typeof playerRef.current.setVolume !== 'function') return;
    try {
      if (isMuted) {
        playerRef.current.mute();
      } else {
        playerRef.current.unMute();
        playerRef.current.setVolume(volume);
      }
    } catch (e) {}
  }, [volume, isMuted]);

  // 5. Handle Seek Targets
  useEffect(() => {
    if (seekTarget !== null && playerRef.current && typeof playerRef.current.seekTo === 'function') {
      try {
        playerRef.current.seekTo(seekTarget, true);
        dispatch(clearSeekTarget());
      } catch (e) {}
    }
  }, [seekTarget, dispatch]);

  // 6. Polling interval to push progress & duration to Redux
  useEffect(() => {
    if (isPlaying) {
      pollTimerRef.current = setInterval(() => {
        if (playerRef.current && typeof playerRef.current.getCurrentTime === 'function') {
          try {
            const current = playerRef.current.getCurrentTime() || 0;
            const dur = playerRef.current.getDuration() || 0;
            dispatch(setProgress({ currentTime: Math.floor(current), duration: Math.floor(dur) }));
          } catch (e) {}
        }
      }, 500);
    } else {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    }

    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, [isPlaying, dispatch]);

  return (
    <div
      aria-hidden="true"
      style={{
        position: 'fixed',
        bottom: 0,
        right: 0,
        width: '1px',
        height: '1px',
        opacity: 0.01,
        pointerEvents: 'none',
        zIndex: -9999,
      }}
    >
      <div id="persistent-yt-player" />
    </div>
  );
};

export default PersistentAudioEngine;
