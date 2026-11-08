import { useEffect, useRef, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  setVoiceDJEnabled,
  setVoiceDJStatus,
  setVoiceDJTranscript,
  setVoiceDJFeedback,
  clearVoiceDJFeedback,
} from '../store/audioSlice';
import {
  playVoiceChime,
  speakVoiceFeedback,
  parseVoiceCommand,
  executeVoiceAction,
  getAllAccessiblePlaylists,
  stripWakeWords,
  isAssistantSpeakingNow,
} from '../utils/voiceDJEngine';

/**
 * Phonetic Wake Word Regex:
 * Recognizes "Abhi", "Hey Abhi", "Hi Abhi", "Ok Abhi", and phonetic variations
 * captured by speech recognition engines across accents.
 */
const WAKE_WORD_REGEX =
  /\b(?:hey\s+|ok\s+|hi\s+|okay\s+|yo\s+|hello\s+)?(?:abhi|abhishek|abby|abbie|avi|avhi|abey|obhi|obhey|abi|abhee|abhey|aabi|aabhi|api|avee|moodtunes|aura)\b/i;

/**
 * useVoiceDJ Hook
 * Continuous hands-free voice assistant.
 * Activates automatically when hearing "Hey Abhi" without clicking,
 * responds with "Voice assistant is active.", and supports full voice playback controls,
 * database song search, and page navigation ("open playlist", "pause it", "play music").
 */
export const useVoiceDJ = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const audioState = useSelector((state) => state.audio);
  const authUser = useSelector((state) => state.auth?.user);
  const { isEnabled, wakeStatus } = audioState.voiceDJ || {};

  const recognitionRef = useRef(null);
  const isEnabledRef = useRef(isEnabled);
  const audioStateRef = useRef(audioState);
  const isListeningWindowRef = useRef(false);
  const isExecutingRef = useRef(false);
  const listeningCooldownUntilRef = useRef(0);
  const listeningWindowTimerRef = useRef(null);
  const silenceTimerRef = useRef(null);
  const autoCollapseTimerRef = useRef(null);
  const restartTimerRef = useRef(null);
  const playlistsRef = useRef([]);

  isEnabledRef.current = isEnabled;
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

  // Execute parsed speech command strictly within database & navigation
  const executeCommand = useCallback(
    async (speechText) => {
      if (isExecutingRef.current || !speechText || speechText.trim().length < 2) return;
      isExecutingRef.current = true;
      listeningCooldownUntilRef.current = Date.now() + 3500; // Cooldown prevents audio feedback loop
      isListeningWindowRef.current = false;
      clearTimeout(listeningWindowTimerRef.current);
      clearTimeout(silenceTimerRef.current);

      dispatch(setVoiceDJStatus('processing'));
      dispatch(setVoiceDJTranscript(speechText));

      await refreshPlaylists();
      const parsed = parseVoiceCommand(speechText);

      if (parsed) {
        await executeVoiceAction(
          parsed,
          dispatch,
          audioStateRef.current,
          playlistsRef.current,
          navigate
        );

        clearTimeout(autoCollapseTimerRef.current);
        autoCollapseTimerRef.current = setTimeout(() => {
          dispatch(clearVoiceDJFeedback());
          isExecutingRef.current = false;
        }, 3500);
      } else {
        isExecutingRef.current = false;
        dispatch(clearVoiceDJFeedback());
      }
    },
    [dispatch, navigate, refreshPlaylists]
  );

  // Trigger wake window when "Hey Abhi" is spoken
  const triggerWakeWindow = useCallback(() => {
    isListeningWindowRef.current = true;
    playVoiceChime('wake');
    speakVoiceFeedback('Voice assistant is active.');
    dispatch(
      setVoiceDJFeedback({
        text: '🎙️ Voice assistant active • Speak your command',
        type: 'info',
        status: 'listening',
      })
    );

    clearTimeout(listeningWindowTimerRef.current);
    listeningWindowTimerRef.current = setTimeout(() => {
      isListeningWindowRef.current = false;
      dispatch(clearVoiceDJFeedback());
    }, 8000);
  }, [dispatch]);

  // Initialize and maintain continuous speech listener
  useEffect(() => {
    if (!isEnabled) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {}
        recognitionRef.current = null;
      }
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn('Speech recognition not supported in this browser.');
      return;
    }

    let isCancelled = false;

    // Auto-verify or prompt microphone permission without locking the hardware
    const checkMicPermission = async () => {
      if (navigator.permissions && navigator.permissions.query) {
        try {
          const perm = await navigator.permissions.query({ name: 'microphone' });
          if (perm.state === 'prompt' && navigator.mediaDevices?.getUserMedia) {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            stream.getTracks().forEach((track) => track.stop());
          }
        } catch (e) {
          if (navigator.mediaDevices?.getUserMedia) {
            try {
              const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
              stream.getTracks().forEach((track) => track.stop());
            } catch (err) {}
          }
        }
      } else if (navigator.mediaDevices?.getUserMedia) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          stream.getTracks().forEach((track) => track.stop());
        } catch (err) {}
      }
    };

    checkMicPermission();

    const startRecognizer = () => {
      if (isCancelled || !isEnabledRef.current) return;

      // Cleanly abort previous instance if any
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {}
        recognitionRef.current = null;
      }

      const recognition = new SpeechRecognition();
      recognition.lang = 'en-IN'; // Indian English: ideal for Hindi & English music queries
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.maxAlternatives = 3;

      recognition.onstart = () => {
        // Ready in background silently, awaits "Hey Abhi" or direct commands
      };

      recognition.onresult = (event) => {
        if (!isEnabledRef.current || isExecutingRef.current) return;

        // Skip while assistant is speaking to prevent self-trigger loop
        if (isAssistantSpeakingNow()) return;

        // Cooldown guard prevents music audio from re-triggering commands
        if (Date.now() < listeningCooldownUntilRef.current) return;

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

        // Update real-time transcript caption on overlay
        dispatch(setVoiceDJTranscript(liveTranscript));

        const lower = liveTranscript.toLowerCase();

        // Check if any alternative contains wake word ("Hey Abhi")
        let matchedWake = WAKE_WORD_REGEX.test(lower);
        if (!matchedWake && event.results[event.resultIndex]) {
          for (let a = 0; a < event.results[event.resultIndex].length; a++) {
            if (WAKE_WORD_REGEX.test(event.results[event.resultIndex][a]?.transcript || '')) {
              matchedWake = true;
              break;
            }
          }
        }

        if (matchedWake) {
          const stripped = stripWakeWords(lower);

          if (stripped.length > 2) {
            // Full command with wake word: e.g. "Hey Abhi play music" / "Hey Abhi pause it" / "Hey Abhi open playlist"
            clearTimeout(silenceTimerRef.current);
            if (isFinal) {
              executeCommand(liveTranscript);
            } else {
              silenceTimerRef.current = setTimeout(() => {
                executeCommand(liveTranscript);
              }, 500);
            }
          } else {
            // Wake word alone: "Hey Abhi" -> activates and speaks "Voice assistant is active."
            if (!isListeningWindowRef.current) {
              triggerWakeWindow();
            }
          }
        } else if (isListeningWindowRef.current) {
          // Assistant is in active listening window after "Hey Abhi" was spoken
          clearTimeout(silenceTimerRef.current);
          if (isFinal) {
            executeCommand(liveTranscript);
          } else {
            silenceTimerRef.current = setTimeout(() => {
              executeCommand(liveTranscript);
            }, 550);
          }
        } else {
          // Direct command fallback: e.g. "pause", "play music", "open playlist", "next song"
          const directMatch = parseVoiceCommand(liveTranscript);
          if (directMatch && directMatch.type !== 'WAKE_ONLY' && (isFinal || liveTranscript.split(' ').length >= 2)) {
            clearTimeout(silenceTimerRef.current);
            if (isFinal) {
              executeCommand(liveTranscript);
            } else {
              silenceTimerRef.current = setTimeout(() => {
                executeCommand(liveTranscript);
              }, 600);
            }
          }
        }
      };

      recognition.onerror = (event) => {
        // 'no-speech' is normal when user is silent; ignore it
        if (event.error === 'no-speech' || event.error === 'aborted') {
          return;
        }
        console.warn('Speech recognition status:', event.error);
        if (event.error === 'not-allowed') {
          dispatch(
            setVoiceDJFeedback({
              text: '⚠️ Microphone access needed. Please click "Allow" on the microphone prompt.',
              type: 'error',
              status: 'error',
            })
          );
        }
      };

      recognition.onend = () => {
        // Automatically restart speech recognition for continuous uninterrupted listening
        if (!isCancelled && isEnabledRef.current) {
          clearTimeout(restartTimerRef.current);
          restartTimerRef.current = setTimeout(() => {
            if (!isCancelled && isEnabledRef.current) {
              startRecognizer();
            }
          }, 150);
        }
      };

      recognitionRef.current = recognition;

      try {
        recognition.start();
      } catch (err) {
        if (err.name !== 'InvalidStateError') {
          console.warn('Recognition start caught:', err);
        }
      }
    };

    startRecognizer();

    // User gesture safety fallback: ensure recognizer starts if browser delayed autoplay
    const handleFirstGesture = () => {
      if (isEnabledRef.current && !recognitionRef.current) {
        startRecognizer();
      }
    };
    window.addEventListener('click', handleFirstGesture, { once: true });
    window.addEventListener('keydown', handleFirstGesture, { once: true });

    return () => {
      isCancelled = true;
      window.removeEventListener('click', handleFirstGesture);
      window.removeEventListener('keydown', handleFirstGesture);
      clearTimeout(silenceTimerRef.current);
      clearTimeout(listeningWindowTimerRef.current);
      clearTimeout(autoCollapseTimerRef.current);
      clearTimeout(restartTimerRef.current);
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {}
        recognitionRef.current = null;
      }
    };
  }, [isEnabled, executeCommand, triggerWakeWindow, dispatch]);

  return {
    isEnabled,
    wakeStatus,
    toggleEnabled: () => dispatch(setVoiceDJEnabled(!isEnabled)),
    triggerManualListening: triggerWakeWindow,
    refreshPlaylists,
  };
};
