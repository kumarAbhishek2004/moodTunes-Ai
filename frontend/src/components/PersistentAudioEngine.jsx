import { useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import axios from 'axios';
import { API_BASE_URL } from '../config/api';
import {
  setPlaying,
  playNext,
  setProgress,
  clearSeekTarget,
  updateSongYouTubeId,
  clearSleepTimer,
  tickSleepTimer,
} from '../store/audioSlice';
import { resolveKnownYouTubeId } from '../utils/songMap';

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
  const isTransitioningRef = useRef(false);

  const {
    currentSong,
    isPlaying,
    volume,
    isMuted,
    seekTarget,
    isVideoMode,
    sleepTimer,
  } = useSelector((state) => state.audio);

  const sleepTimerRef = useRef(sleepTimer);
  useEffect(() => {
    sleepTimerRef.current = sleepTimer;
  }, [sleepTimer]);

  const triggerAdvanceNext = () => {
    if (isTransitioningRef.current) return;
    if (sleepTimerRef.current?.active && sleepTimerRef.current?.isEndOfTrack) {
      dispatch(setPlaying(false));
      dispatch(clearSleepTimer());
      return;
    }
    isTransitioningRef.current = true;
    dispatch(playNext());
    setTimeout(() => {
      isTransitioningRef.current = false;
    }, 1200);
  };

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
              triggerAdvanceNext();
            }
            // YT.PlayerState.PLAYING = 1
            else if (event.data === 1) {
              dispatch(setPlaying(true));
            }
            // YT.PlayerState.PAUSED = 2
            else if (event.data === 2) {
              // Ignore pause if we are in the middle of track transition
              if (!isTransitioningRef.current) {
                dispatch(setPlaying(false));
              }
            }
          },
          onError: (err) => {
            console.warn('YouTube Player error:', err.data);
            // If the video cannot be embedded or is restricted, attempt an alternate search or auto-advance
            if (currentSong && (err.data === 101 || err.data === 150 || err.data === 2)) {
              axios
                .get(`${API_BASE_URL}/youtube/search`, {
                  params: { song_name: `${currentSong.name} audio`, artist: currentSong.artist || '' },
                  timeout: 4000,
                })
                .then((res) => {
                  const altId = res.data?.video_id;
                  if (altId && altId !== currentSong.youtube_id && playerRef.current?.loadVideoById) {
                    dispatch(updateSongYouTubeId({ id: currentSong.id, name: currentSong.name, artist: currentSong.artist, youtube_id: altId }));
                    playerRef.current.loadVideoById(altId);
                  }
                })
                .catch(() => {});
            }
          },
        },
      });
    } catch (e) {
      console.error('Failed to initialize YouTube Player:', e);
    }
  };

  // 2. Track changes when currentSong updates
  useEffect(() => {
    if (!currentSong) return;

    const loadAndPlay = (vidId) => {
      if (!playerRef.current || typeof playerRef.current.loadVideoById !== 'function') return;
      try {
        playerRef.current.loadVideoById(vidId);
        if (playerRef.current.playVideo) {
          playerRef.current.playVideo();
        }
        dispatch(setPlaying(true));
      } catch (e) {
        console.error('Error loading video by ID:', e);
      }
    };

    // Ground truth: ALWAYS check fast verified known songs map first (e.g. Love Dose, Desi Kalakaar, Chaleya)
    const isRaataan = String(currentSong.name || '').toLowerCase().includes('raataan');
    const knownVidId = resolveKnownYouTubeId(currentSong.name, currentSong.artist);
    let effectiveVidId = knownVidId || currentSong.youtube_id;

    // Discard wrongly assigned fallback ID (Raataan Lambiyan) for non-Raataan tracks
    if (effectiveVidId === 'gvyUuxdRdR4' && !isRaataan) {
      effectiveVidId = null;
    }

    if (effectiveVidId && effectiveVidId !== currentSong.youtube_id) {
      dispatch(updateSongYouTubeId({ id: currentSong.id, name: currentSong.name, artist: currentSong.artist, youtube_id: effectiveVidId }));
    }

    if (effectiveVidId) {
      loadAndPlay(effectiveVidId);
      return;
    }

    // If still no video ID, dynamically query the backend for this exact song
    let isCancelled = false;
    axios
      .get(`${API_BASE_URL}/youtube/search`, {
        params: { song_name: currentSong.name, artist: currentSong.artist || '' },
        timeout: 5000,
      })
      .then((res) => {
        if (isCancelled) return;
        const resolvedId = res.data?.video_id || res.data?.youtube_id;
        if (resolvedId) {
          dispatch(updateSongYouTubeId({ id: currentSong.id, name: currentSong.name, artist: currentSong.artist, youtube_id: resolvedId }));
          loadAndPlay(resolvedId);
        }
      })
      .catch(() => {
        // Fallback to /search-song
        axios
          .get(`${API_BASE_URL}/search-song`, {
            params: { name: currentSong.name, artist: currentSong.artist || '' },
            timeout: 5000,
          })
          .then((res2) => {
            if (isCancelled) return;
            const resolvedId2 = res2.data?.youtube_id || res2.data?.video_id;
            if (resolvedId2) {
              dispatch(updateSongYouTubeId({ id: currentSong.id, name: currentSong.name, artist: currentSong.artist, youtube_id: resolvedId2 }));
              loadAndPlay(resolvedId2);
            }
          })
          .catch((err2) => {
            console.warn('Could not resolve YouTube ID for track:', currentSong.name, err2);
          });
      });

    return () => {
      isCancelled = true;
    };
  }, [currentSong?.id, currentSong?.name, currentSong?.artist, currentSong?.youtube_id]);

  // 3. Sync Play / Pause
  useEffect(() => {
    if (!playerRef.current || typeof playerRef.current.getPlayerState !== 'function') return;

    try {
      const state = playerRef.current.getPlayerState();
      if (isPlaying && state !== 1 && state !== 3) {
        playerRef.current.playVideo();
      } else if (!isPlaying) {
        playerRef.current.pauseVideo();
      }
    } catch (e) {}
  }, [isPlaying]);

  // 3.1 Stop video if song is cleared
  useEffect(() => {
    if (!currentSong && playerRef.current && typeof playerRef.current.stopVideo === 'function') {
      try {
        playerRef.current.stopVideo();
      } catch (e) {}
    }
  }, [currentSong]);

  // 4. Sync Volume & Mute (Exclusive playback: mutes audio engine when isVideoMode is playing video!)
  useEffect(() => {
    if (!playerRef.current || typeof playerRef.current.setVolume !== 'function') return;
    try {
      if (isMuted || isVideoMode) {
        playerRef.current.mute();
      } else {
        playerRef.current.unMute();
        playerRef.current.setVolume(volume);
      }
    } catch (e) {}
  }, [volume, isMuted, isVideoMode]);

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

            // Guaranteed Autoplay: If track reached within 0.8s of the end, trigger next song
            if (dur > 5 && current >= dur - 0.8) {
              triggerAdvanceNext();
            }
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

  // 7. When user switches to Music Video section, pause background audio to prevent double sound
  useEffect(() => {
    if (!playerRef.current || typeof playerRef.current.pauseVideo !== 'function') return;
    try {
      if (isVideoMode) {
        playerRef.current.pauseVideo();
      } else if (isPlaying && currentSong?.youtube_id) {
        playerRef.current.playVideo();
      }
    } catch (e) {}
  }, [isVideoMode, isPlaying, currentSong]);


  // 6.1 Sleep Timer Countdown & 15s Smooth Fade-Out
  useEffect(() => {
    if (!sleepTimer?.active || sleepTimer?.isEndOfTrack) return;

    const timer = setInterval(() => {
      if (!sleepTimer.targetTimestamp) return;
      const now = Date.now();
      const remainingSec = Math.max(0, Math.round((sleepTimer.targetTimestamp - now) / 1000));
      dispatch(tickSleepTimer(remainingSec));

      if (playerRef.current && typeof playerRef.current.setVolume === 'function') {
        if (remainingSec <= 15 && remainingSec > 0) {
          const baseVol = sleepTimer.initialVolumeBeforeFade ?? volume;
          const faded = Math.round(baseVol * (remainingSec / 15));
          playerRef.current.setVolume(faded);
        } else if (remainingSec === 0) {
          dispatch(setPlaying(false));
          dispatch(clearSleepTimer());
          if (sleepTimer.initialVolumeBeforeFade !== null) {
            playerRef.current.setVolume(sleepTimer.initialVolumeBeforeFade);
          }
        }
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [sleepTimer?.active, sleepTimer?.targetTimestamp, sleepTimer?.isEndOfTrack, sleepTimer?.initialVolumeBeforeFade, volume, dispatch]);

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
