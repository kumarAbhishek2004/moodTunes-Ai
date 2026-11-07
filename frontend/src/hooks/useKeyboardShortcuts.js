import { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  togglePlayPause,
  playNext,
  playPrevious,
  toggleMute,
  seekTo,
  toggleQueue,
  toggleTurntable,
  toggleSleepTimerModal,
  toggleShortcutsModal,
  openVibeCard,
} from '../store/audioSlice';

/**
 * useKeyboardShortcuts
 * Global keyboard controller for MoodTunes AI.
 * Handles space, seeking, next/prev, mute, queue, turntable, and shortcuts modal.
 */
export const useKeyboardShortcuts = () => {
  const dispatch = useDispatch();
  const {
    isPlaying,
    currentTime,
    duration,
    isMuted,
    currentSong,
  } = useSelector((state) => state.audio);

  const [toastMessage, setToastMessage] = useState(null);

  const triggerToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((curr) => (curr === msg ? null : curr));
    }, 1500);
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      // 1. Guard against active inputs, textareas, and contenteditable elements
      const target = e.target;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable ||
          target.getAttribute('role') === 'textbox')
      ) {
        return;
      }

      // 2. Space: Play / Pause toggle
      if (e.code === 'Space') {
        e.preventDefault();
        dispatch(togglePlayPause());
        triggerToast(isPlaying ? '⏸️ Paused' : '▶️ Playing');
        return;
      }

      // 3. Arrow Keys: Seek and Skip
      if (e.code === 'ArrowRight') {
        e.preventDefault();
        if (e.shiftKey) {
          dispatch(playNext());
          triggerToast('⏭️ Next Track');
        } else {
          const nextTime = Math.min(duration || 300, (currentTime || 0) + 5);
          dispatch(seekTo(nextTime));
          triggerToast('⏩ +5s Forward');
        }
        return;
      }

      if (e.code === 'ArrowLeft') {
        e.preventDefault();
        if (e.shiftKey) {
          dispatch(playPrevious());
          triggerToast('⏮️ Previous Track');
        } else {
          const prevTime = Math.max(0, (currentTime || 0) - 5);
          dispatch(seekTo(prevTime));
          triggerToast('⏪ -5s Rewind');
        }
        return;
      }

      // 4. M: Toggle Mute
      if (e.code === 'KeyM') {
        e.preventDefault();
        dispatch(toggleMute());
        triggerToast(isMuted ? '🔊 Unmuted' : '🔇 Muted');
        return;
      }

      // 5. Q: Toggle Queue Drawer
      if (e.code === 'KeyQ') {
        e.preventDefault();
        dispatch(toggleQueue());
        return;
      }

      // 6. T: Toggle Vinyl Turntable
      if (e.code === 'KeyT') {
        e.preventDefault();
        dispatch(toggleTurntable());
        return;
      }

      // 7. S: Open Sleep Timer
      if (e.code === 'KeyS' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        dispatch(toggleSleepTimerModal());
        return;
      }

      // 8. V: Open Shareable Vibe Card
      if (e.code === 'KeyV' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        if (currentSong) {
          dispatch(openVibeCard(currentSong));
        } else {
          triggerToast('Play a track first to generate a Vibe Card');
        }
        return;
      }

      // 9. L: Favorite / Like Current Track
      if (e.code === 'KeyL' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        if (currentSong) {
          try {
            const raw = localStorage.getItem('liked_songs') || '{}';
            const likedMap = JSON.parse(raw);
            const songId = currentSong.id || `${currentSong.name}-${currentSong.artist}`;
            const isNowLiked = !likedMap[songId];
            likedMap[songId] = isNowLiked;
            localStorage.setItem('liked_songs', JSON.stringify(likedMap));
            triggerToast(isNowLiked ? `❤️ Added "${currentSong.name}" to Favorites` : `💔 Removed "${currentSong.name}"`);
          } catch (err) {}
        }
        return;
      }

      // 10. ?: Open Keyboard Shortcuts Cheat Sheet
      if (e.key === '?' || (e.shiftKey && e.code === 'Slash')) {
        e.preventDefault();
        dispatch(toggleShortcutsModal());
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, currentTime, duration, isMuted, currentSong, dispatch]);

  return { toastMessage };
};

export default useKeyboardShortcuts;
