import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { clearElevationToast, openQueue } from '../store/audioSlice';

const MoodElevationToast = () => {
  const dispatch = useDispatch();
  const toast = useSelector((state) => state.audio.smartMoodElevation?.elevationToast);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      dispatch(clearElevationToast());
    }, 7000);
    return () => clearTimeout(timer);
  }, [toast, dispatch]);

  if (!toast) return null;

  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[110] w-full max-w-lg px-4 pointer-events-none animate-slideDown">
      <div className="pointer-events-auto p-4 rounded-2xl bg-gradient-to-r from-amber-950/90 via-obsidian-900/95 to-slate-900/95 border border-amber-500/40 shadow-2xl backdrop-blur-xl flex items-start gap-3.5 text-white">
        {/* Glow Brain Icon */}
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-lg shadow-lg shadow-amber-500/30 flex-shrink-0 animate-pulse">
          🧠
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 pr-1">
          <div className="flex items-center gap-2">
            <span className="text-[11px] uppercase tracking-wider font-mono font-bold text-amber-400">
              {toast.title || 'AI DJ Elevation'}
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono">
              Active
            </span>
          </div>
          <p className="text-xs text-slate-200 mt-1 leading-relaxed">
            {toast.description}
          </p>
          <div className="mt-2.5 flex items-center gap-2">
            <button
              onClick={() => {
                dispatch(openQueue());
                dispatch(clearElevationToast());
              }}
              className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-[11px] font-semibold transition-colors"
            >
              View Elevated Queue →
            </button>
            <button
              onClick={() => dispatch(clearElevationToast())}
              className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 text-[11px] transition-colors"
            >
              Dismiss
            </button>
          </div>
        </div>

        {/* Close X */}
        <button
          onClick={() => dispatch(clearElevationToast())}
          className="text-slate-400 hover:text-white transition-colors text-sm p-1 -mr-1"
        >
          ✕
        </button>
      </div>
    </div>
  );
};

export default MoodElevationToast;
