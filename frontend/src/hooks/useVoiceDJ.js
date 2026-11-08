import { useEffect, useRef, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  setVoiceDJStatus,
  setVoiceDJTranscript,
  setVoiceDJFeedback,
  clearVoiceDJFeedback,
  openChatbot,
} from '../store/audioSlice';
import {
  playVoiceChime,
  parseVoiceCommand,
  executeVoiceAction,
  getAllAccessiblePlaylists,
  stripWakeWords,
} from '../utils/voiceDJEngine';

/**
 * useVoiceDJ Hook
 * Simple, reliable Click-to-Speak Voice Assistant ("Hey Abhi").
 * 
 * Flow:
 * 1. Idle by default (Microphone OFF, zero continuous background listening).
 * 2. User clicks "Hey Abhi" button -> starts listening + plays rising chime.
 * 3. Shows live speech transcript in real-time.
 * 4. User speaks their command (e.g., "play Kesariya", "pause", "open roadmap").
 * 5. As soon as speech finishes, stops mic, parses & executes action, plays confirm chime.
 * 6. Shows confirmation badge for 3 seconds, then cleanly returns to idle.
 */
export const useVoiceDJ = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const audioState = useSelector((state) => state.audio);
  const authUser = useSelector((state) => state.auth?.user);
  const { wakeStatus } = audioState.voiceDJ || {};

  const recognitionRef = useRef(null);
  const audioStateRef = useRef(audioState);
  const isListeningRef = useRef(false);
  const isExecutingRef = useRef(false);
  const silenceTimerRef = useRef(null);
  const autoDismissTimerRef = useRef(null);
  const playlistsRef = useRef([]);

  audioStateRef.current = audioState;

  // Refresh accessible playlists for voice matching
  const refreshPlaylists = useCallback(async () => {
    try {
      const pl = await getAllAccessiblePlaylists(authUser);
      playlistsRef.current = pl;
    } catch (e) {}
  }, [authUser]);

  useEffect(() => {
    refreshPlaylists();
  }, [refreshPlaylists]);

  // Cleanly stops speech recognition and releases mic
  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch (e) {}
      recognitionRef.current = null;
    }
    isListeningRef.current = false;
    clearTimeout(silenceTimerRef.current);
  }, []);

  // Execute parsed speech command
  const executeCommand = useCallback(
    async (speechText) => {
      if (isExecutingRef.current || !speechText || speechText.trim().length < 2) {
        stopListening();
        return;
      }
      isExecutingRef.current = true;
      stopListening();

      dispatch(setVoiceDJStatus('processing'));
      dispatch(setVoiceDJTranscript(speechText));

      await refreshPlaylists();

      // Clean out any wake words like "hey abhi", "abhi", etc.
      const cleaned = stripWakeWords(speechText) || speechText;
      const parsed = parseVoiceCommand(cleaned);

      if (parsed) {
        await executeVoiceAction(
          parsed,
          dispatch,
          audioStateRef.current,
          playlistsRef.current,
          navigate
        );
        playVoiceChime('success');
      } else {
        // Fallback for conversational queries (e.g. "who are you", "recommend a romantic song")
        dispatch(openChatbot());
        try {
          window.dispatchEvent(
            new CustomEvent('moodtunes:aura-chat-query', {
              detail: { query: cleaned },
            })
          );
        } catch (e) {}
        dispatch(
          setVoiceDJFeedback({
            text: `Asked Aura AI: "${cleaned}"`,
            type: 'control',
            status: 'success',
          })
        );
        playVoiceChime('success');
      }

      clearTimeout(autoDismissTimerRef.current);
      autoDismissTimerRef.current = setTimeout(() => {
        dispatch(clearVoiceDJFeedback());
        isExecutingRef.current = false;
      }, 3500);
    },
    [dispatch, navigate, refreshPlaylists, stopListening]
  );

  // Starts single-utterance speech recognition when "Hey Abhi" is clicked
  const startListening = useCallback(() => {
    // If currently executing, wait
    if (isExecutingRef.current) return;

    // If already listening, stop (toggle behavior)
    if (isListeningRef.current) {
      stopListening();
      dispatch(clearVoiceDJFeedback());
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      dispatch(
        setVoiceDJFeedback({
          text: 'Speech recognition is not supported in this browser.',
          type: 'error',
          status: 'error',
        })
      );
      setTimeout(() => dispatch(clearVoiceDJFeedback()), 4000);
      return;
    }

    stopListening();
    clearTimeout(autoDismissTimerRef.current);

    // Play rising wake chime & set status
    playVoiceChime('wake');
    dispatch(setVoiceDJTranscript(''));
    dispatch(setVoiceDJStatus('listening'));

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-IN'; // Indian English: ideal for Hindi & English song titles
    recognition.continuous = false; // Natural single-phrase recognition
    recognition.interimResults = true;
    recognition.maxAlternatives = 3;

    recognition.onstart = () => {
      isListeningRef.current = true;
      // Safety timeout: if user stays silent for 7 seconds, gracefully close
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = setTimeout(() => {
        stopListening();
        dispatch(
          setVoiceDJFeedback({
            text: "Didn't catch that. Click 'Hey Abhi' to speak.",
            type: 'info',
            status: 'idle',
          })
        );
        setTimeout(() => dispatch(clearVoiceDJFeedback()), 2800);
      }, 7000);
    };

    recognition.onresult = (event) => {
      let liveTranscript = '';
      let isFinal = false;

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const res = event.results[i];
        if (res[0]?.transcript) {
          liveTranscript += res[0].transcript + ' ';
        }
        if (res.isFinal) isFinal = true;
      }

      liveTranscript = liveTranscript.trim();
      if (!liveTranscript) return;

      // Update live caption
      dispatch(setVoiceDJTranscript(liveTranscript));

      clearTimeout(silenceTimerRef.current);

      if (isFinal) {
        executeCommand(liveTranscript);
      } else {
        // Finalize after 900ms pause if browser interim doesn't mark final
        silenceTimerRef.current = setTimeout(() => {
          executeCommand(liveTranscript);
        }, 900);
      }
    };

    recognition.onerror = (event) => {
      isListeningRef.current = false;
      clearTimeout(silenceTimerRef.current);

      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        dispatch(
          setVoiceDJFeedback({
            text: 'Microphone permission required. Please allow microphone in your browser.',
            type: 'error',
            status: 'error',
          })
        );
        setTimeout(() => dispatch(clearVoiceDJFeedback()), 4500);
        return;
      }

      if (event.error !== 'no-speech' && event.error !== 'aborted') {
        dispatch(
          setVoiceDJFeedback({
            text: 'Could not hear voice command. Please try again.',
            type: 'error',
            status: 'error',
          })
        );
        setTimeout(() => dispatch(clearVoiceDJFeedback()), 3000);
      } else {
        dispatch(clearVoiceDJFeedback());
      }
    };

    recognition.onend = () => {
      isListeningRef.current = false;
      clearTimeout(silenceTimerRef.current);
    };

    recognitionRef.current = recognition;

    try {
      recognition.start();
    } catch (err) {
      isListeningRef.current = false;
      console.warn('SpeechRecognition start error:', err);
    }
  }, [dispatch, executeCommand, stopListening]);

  // Global event bus listeners for "Hey Abhi" button clicks across the app
  useEffect(() => {
    const handleToggle = () => {
      if (isListeningRef.current) {
        stopListening();
        dispatch(clearVoiceDJFeedback());
      } else {
        startListening();
      }
    };

    const handleStart = () => startListening();
    const handleStop = () => {
      stopListening();
      dispatch(clearVoiceDJFeedback());
    };

    window.addEventListener('moodtunes:toggle-voice-dj', handleToggle);
    window.addEventListener('moodtunes:start-voice-dj', handleStart);
    window.addEventListener('moodtunes:stop-voice-dj', handleStop);

    return () => {
      window.removeEventListener('moodtunes:toggle-voice-dj', handleToggle);
      window.removeEventListener('moodtunes:start-voice-dj', handleStart);
      window.removeEventListener('moodtunes:stop-voice-dj', handleStop);
      stopListening();
      clearTimeout(autoDismissTimerRef.current);
      clearTimeout(silenceTimerRef.current);
    };
  }, [startListening, stopListening, dispatch]);

  return {
    isListening: wakeStatus === 'listening',
    wakeStatus,
    toggleListening: () => {
      if (isListeningRef.current) {
        stopListening();
        dispatch(clearVoiceDJFeedback());
      } else {
        startListening();
      }
    },
    startListening,
    stopListening,
    refreshPlaylists,
  };
};
