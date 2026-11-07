import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  setSleepTimer,
  clearSleepTimer,
  setSleepTimerModalOpen,
} from '../store/audioSlice';

const SleepTimerModal = () => {
  const dispatch = useDispatch();
  const isOpen = useSelector((state) => state.audio.isSleepTimerModalOpen);
  const sleepTimer = useSelector((state) => state.audio.sleepTimer);
  const activeMood = useSelector((state) => state.audio.activeMood) || 'calm';

  const [customMinutes, setCustomMinutes] = useState('');
  const [toastMessage, setToastMessage] = useState('');

  if (!isOpen) return null;

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 2500);
  };

  const handleSelectPreset = (minutes) => {
    dispatch(setSleepTimer({ minutes }));
    showToast(`🌙 Sleep timer set for ${minutes} minutes (Fades out in last 15s)`);
    setTimeout(() => dispatch(setSleepTimerModalOpen(false)), 800);
  };

  const handleSelectEndOfTrack = () => {
    dispatch(setSleepTimer({ isEndOfTrack: true }));
    showToast('🌙 Sleep timer: Audio will stop at end of current track');
    setTimeout(() => dispatch(setSleepTimerModalOpen(false)), 800);
  };

  const handleCancelTimer = () => {
    dispatch(clearSleepTimer());
    showToast('Timer cancelled');
  };

  const handleCustomSubmit = (e) => {
    e.preventDefault();
    const mins = parseInt(customMinutes, 10);
    if (!isNaN(mins) && mins > 0 && mins <= 360) {
      dispatch(setSleepTimer({ minutes: mins }));
      showToast(`🌙 Sleep timer set for ${mins} minutes`);
      setCustomMinutes('');
      setTimeout(() => dispatch(setSleepTimerModalOpen(false)), 800);
    }
  };

  const formatRemaining = (seconds) => {
    if (!seconds || seconds <= 0) return '0:00';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fadeIn"
      onClick={() => dispatch(setSleepTimerModalOpen(false))}
    >
      <div
        className="relative w-full max-w-md bg-gradient-to-b from-obsidian-900 via-obsidian-950 to-slate-950 border border-white/10 rounded-3xl p-6 sm:p-7 shadow-2xl text-white overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow ambient circle */}
        <div className="absolute -top-16 -right-16 w-44 h-44 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-44 h-44 bg-cyan/15 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-xl shadow-inner">
              🌙
            </div>
            <div>
              <h3 className="font-bold text-lg text-white tracking-wide">Sleep Timer</h3>
              <p className="text-xs text-slate-400">Gently fades audio over the last 15 seconds</p>
            </div>
          </div>
          <button
            onClick={() => dispatch(setSleepTimerModalOpen(false))}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-colors text-sm"
          >
            ✕
          </button>
        </div>

        {/* Active Timer Indicator */}
        {sleepTimer?.active && (
          <div className="mb-6 p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-between">
            <div>
              <div className="text-[11px] uppercase tracking-wider text-indigo-300 font-mono font-semibold">
                Timer Active
              </div>
              <div className="text-2xl font-bold font-mono text-white mt-0.5">
                {sleepTimer.isEndOfTrack ? (
                  <span className="text-base text-indigo-200">At End of Track</span>
                ) : (
                  <span>{formatRemaining(sleepTimer.remainingSeconds)}</span>
                )}
              </div>
              <p className="text-[10px] text-slate-400 mt-0.5">
                {sleepTimer.isEndOfTrack
                  ? 'Will pause immediately when current song ends'
                  : 'Fades out during final 15 seconds'}
              </p>
            </div>
            <button
              onClick={handleCancelTimer}
              className="px-3 py-1.5 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30 text-xs font-semibold transition-all hover:scale-105"
            >
              Cancel
            </button>
          </div>
        )}

        {/* Preset Buttons Grid */}
        <div className="grid grid-cols-2 gap-2.5 mb-4">
          {[15, 30, 45, 60].map((mins) => {
            const isSelected =
              sleepTimer?.active &&
              !sleepTimer.isEndOfTrack &&
              sleepTimer.durationMinutes === mins;
            return (
              <button
                key={mins}
                onClick={() => handleSelectPreset(mins)}
                className={`py-3 px-4 rounded-2xl border text-sm font-semibold transition-all flex items-center justify-between group ${
                  isSelected
                    ? 'bg-indigo-600 text-white border-indigo-400 shadow-lg shadow-indigo-600/30'
                    : 'bg-white/5 hover:bg-white/10 text-slate-200 border-white/5 hover:border-white/15'
                }`}
              >
                <span>{mins} Minutes</span>
                <span className="text-xs opacity-60 font-mono group-hover:translate-x-0.5 transition-transform">
                  →
                </span>
              </button>
            );
          })}
        </div>

        {/* End of Current Track Button */}
        <button
          onClick={handleSelectEndOfTrack}
          className={`w-full py-3 px-4 rounded-2xl border text-sm font-semibold transition-all flex items-center justify-between mb-4 ${
            sleepTimer?.active && sleepTimer?.isEndOfTrack
              ? 'bg-indigo-600 text-white border-indigo-400 shadow-lg shadow-indigo-600/30'
              : 'bg-white/5 hover:bg-white/10 text-slate-200 border-white/5 hover:border-white/15'
          }`}
        >
          <div className="flex items-center gap-2">
            <span>🎵</span>
            <span>At End of Current Track</span>
          </div>
          <span className="text-xs opacity-60 font-mono">End</span>
        </button>

        {/* Custom Minutes Input */}
        <form onSubmit={handleCustomSubmit} className="flex gap-2">
          <input
            type="number"
            min="1"
            max="360"
            placeholder="Custom (e.g. 20 min)"
            value={customMinutes}
            onChange={(e) => setCustomMinutes(e.target.value)}
            className="flex-1 px-4 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-400/50"
          />
          <button
            type="submit"
            disabled={!customMinutes}
            className="px-5 py-2.5 rounded-2xl bg-indigo-500 hover:bg-indigo-600 disabled:opacity-40 disabled:hover:bg-indigo-500 text-white text-sm font-bold shadow-lg shadow-indigo-500/25 transition-all"
          >
            Set
          </button>
        </form>

        {/* Toast confirmation */}
        {toastMessage && (
          <div className="absolute bottom-3 left-6 right-6 py-2 px-3 rounded-xl bg-indigo-950/95 border border-indigo-400/40 text-center text-xs text-indigo-200 shadow-xl animate-fadeIn font-mono">
            {toastMessage}
          </div>
        )}
      </div>
    </div>
  );
};

export default SleepTimerModal;
