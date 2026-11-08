import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { clearVoiceDJFeedback, setVoiceDJEnabled } from '../store/audioSlice';

/**
 * VoiceDJOverlay
 * Floating, dynamic Siri/Gemini-style visual assistant overlay for "Hey Abhi".
 * Displays real-time listening ripples, live speech transcript, and instant playback confirmation badges.
 */
const VoiceDJOverlay = () => {
  const dispatch = useDispatch();
  const voiceDJ = useSelector((state) => state.audio.voiceDJ);

  if (!voiceDJ?.isEnabled) return null;

  const { wakeStatus, transcript, feedbackText, feedbackType } = voiceDJ;
  const isInteracting = wakeStatus === 'listening' || wakeStatus === 'processing' || Boolean(feedbackText);

  // Keep screen clean: Overlay is only visible when actively listening, processing, or showing feedback
  if (!isInteracting) return null;

  // Accent mood colors for glowing aura
  const getGlowColor = () => {
    switch (feedbackType) {
      case 'playlist':
      case 'database':
        return 'from-emerald-500 via-teal-400 to-cyan-500';
      case 'mood':
        return 'from-fuchsia-500 via-pink-500 to-purple-500';
      case 'error':
        return 'from-amber-500 via-orange-500 to-rose-500';
      default:
        return 'from-cyan-400 via-blue-500 to-indigo-500';
    }
  };

  return (
    <div className="fixed top-16 sm:top-20 left-1/2 -translate-x-1/2 z-[120] w-[92vw] sm:w-auto max-w-lg pointer-events-auto select-none font-sans animate-fadeIn">
      {/* Dynamic Expanded Assistant Pill */}
      <div className="relative rounded-3xl bg-slate-950/95 border border-cyan/30 p-4 sm:p-5 shadow-2xl backdrop-blur-2xl text-white overflow-hidden animate-fadeIn transition-all duration-300">
        {/* Ambient Glow Aura */}
        <div
          className={`absolute -top-16 -left-16 w-44 h-44 rounded-full blur-3xl opacity-35 bg-gradient-to-br ${getGlowColor()}`}
        />
        <div
          className={`absolute -bottom-16 -right-16 w-44 h-44 rounded-full blur-3xl opacity-35 bg-gradient-to-br ${getGlowColor()}`}
        />

          <div className="relative z-10 flex items-center justify-between gap-3 mb-2.5">
            <div className="flex items-center gap-2.5">
              {/* Pulsing Animated Equalizer Audio Rings */}
              <div className="relative w-8 h-8 rounded-full bg-gradient-to-tr from-cyan via-blue-500 to-indigo-600 flex items-center justify-center text-sm shadow-lg shadow-cyan/30">
                <span className="relative z-10">🎙️</span>
                <span className="absolute -inset-1 rounded-full border border-cyan/60 animate-ping pointer-events-none" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-cyan block leading-tight flex items-center gap-1.5">
                  <span>Voice DJ • Hey Abhi</span>
                  {wakeStatus === 'listening' && (
                    <span className="inline-flex items-center gap-0.5">
                      <span className="w-1 h-2 bg-cyan rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-1 h-3.5 bg-cyan rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-1 h-2 bg-cyan rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </span>
                  )}
                </span>
                <span className="text-xs font-bold text-white">
                  {wakeStatus === 'listening'
                    ? 'Listening... Speak your command'
                    : wakeStatus === 'processing'
                    ? 'Processing Voice Command...'
                    : 'Command Executed'}
                </span>
              </div>
            </div>

            <button
              onClick={() => { window.dispatchEvent(new CustomEvent('moodtunes:stop-voice-dj')); dispatch(clearVoiceDJFeedback()); }}
              className="w-7 h-7 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer text-xs"
              title="Dismiss"
            >
              ✕
            </button>
          </div>

          {/* Transcript / Spoken Words Live Display */}
          {transcript && (
            <div className="mt-2 py-2 px-3.5 rounded-xl bg-white/5 border border-cyan/20 text-xs font-mono text-cyan-200 flex items-center gap-2">
              <span className="text-cyan font-bold text-sm">❝</span>
              <span className="flex-1 font-semibold text-white tracking-wide">{transcript}</span>
              <span className="text-cyan font-bold text-sm">❞</span>
            </div>
          )}

          {/* Execution Feedback Banner */}
          {feedbackText && (
            <div
              className={`mt-2.5 p-3 rounded-2xl border text-xs font-medium flex items-center gap-2.5 shadow-lg ${
                feedbackType === 'playlist' || feedbackType === 'database'
                  ? 'bg-emerald-950/70 border-emerald-500/40 text-emerald-200'
                  : feedbackType === 'error'
                  ? 'bg-amber-950/70 border-amber-500/40 text-amber-200'
                  : 'bg-cyan-950/70 border-cyan/40 text-cyan-200'
              }`}
            >
              <span className="text-base">
                {feedbackType === 'playlist' || feedbackType === 'database'
                  ? '🎵'
                  : feedbackType === 'error'
                  ? '⚠️'
                  : '✨'}
              </span>
              <span className="flex-1 font-semibold">{feedbackText}</span>
            </div>
          )}

          {/* Quick Voice Hints for Discovery */}
          {wakeStatus === 'listening' && (
            <div className="mt-3 pt-2.5 border-t border-white/10 flex flex-wrap gap-1.5 text-[10px] text-slate-400">
              <span className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10">
                &ldquo;Play Kesariya&rdquo;
              </span>
              <span className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10">
                &ldquo;Play from my playlist&rdquo;
              </span>
              <span className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10">
                &ldquo;Volume 80&rdquo;
              </span>
              <span className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10">
                &ldquo;Next track&rdquo;
              </span>
            </div>
          )}
        </div>
    </div>
  );
};

export default VoiceDJOverlay;
