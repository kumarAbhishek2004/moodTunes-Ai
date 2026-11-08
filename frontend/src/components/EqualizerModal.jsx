import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  setEqualizerModalOpen,
  setEqualizerPreset,
  setEqualizerBandGain,
  resetEqualizer,
  setCrossfadeEnabled,
  setCrossfadeDuration,
} from '../store/audioSlice';

/**
 * EqualizerModal
 * Studio-grade 5-Band Equalizer with 7 one-click sound presets
 * and seamless track crossfade duration controller (3-5s).
 * Fully adjustable, sleek, with prominent Back/Close controls and responsive scrolling.
 */
const EqualizerModal = () => {
  const dispatch = useDispatch();
  const { equalizer, crossfade } = useSelector((state) => state.audio);
  const [appliedToast, setAppliedToast] = useState(false);

  const isOpen = equalizer?.isOpen;

  // Global ESC key listener to close modal immediately
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        dispatch(setEqualizerModalOpen(false));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, dispatch]);

  if (!isOpen) return null;

  const { preset, gains } = equalizer;
  const { enabled: cfEnabled, durationSeconds: cfDuration } = crossfade || { enabled: false, durationSeconds: 3 };

  const bands = [
    { key: 'band60', label: '60 Hz', sub: 'Sub-Bass' },
    { key: 'band250', label: '250 Hz', sub: 'Bass' },
    { key: 'band1k', label: '1 kHz', sub: 'Mid' },
    { key: 'band4k', label: '4 kHz', sub: 'Vocals' },
    { key: 'band16k', label: '16 kHz', sub: 'Treble' },
  ];

  const presets = [
    { id: 'flat', name: 'Studio / Flat', icon: '🎚️' },
    { id: 'bass_heavy', name: 'Bass Heavy', icon: '🔊' },
    { id: 'vocals', name: 'Clear Vocals', icon: '🎙️' },
    { id: 'vinyl', name: 'Warm Vinyl', icon: '💿' },
    { id: 'lofi', name: 'Lo-Fi Beats', icon: '☕' },
    { id: 'night', name: 'Night Mode', icon: '🌙' },
    { id: 'acoustic', name: 'Acoustic', icon: '🎸' },
  ];

  const getPresetDescription = (id) => {
    switch (id) {
      case 'bass_heavy':
        return '🔊 Deep Sub-Bass Resonator (+7dB Sub • +5dB Bass) & Dynamic Loudness Boost Active';
      case 'vocals':
        return '🎙️ Midrange Vocal Presence Clarity (+6dB Vocals • Intelligibility Boost) Active';
      case 'vinyl':
        return '💿 Warm Analog Vinyl Needle Warmth & Subtle Turntable Atmosphere Active';
      case 'lofi':
        return '☕ Vintage Cassette Tape Saturation & Cozy Mellow Tones Active';
      case 'night':
        return '🌙 Night Ear-Comfort: Peak Decibel Normalization & Softened Treble Active';
      case 'acoustic':
        return '🎸 Natural Dynamic Clarity & Acoustic String Brilliance Active';
      case 'custom':
        return '🎛️ Custom 5-Band Studio Faders & Acoustic Gain Balancing Active';
      case 'flat':
      default:
        return '🎚️ Studio Flat Natural Dynamic Output (0 dB Neutral)';
    }
  };

  // Generate SVG curve points across the 5 bands
  const getCurvePath = () => {
    const width = 340;
    const height = 90;
    const stepX = width / (bands.length - 1);

    const points = bands.map((b, idx) => {
      const g = gains[b.key] || 0; // -12 to +12
      const y = height / 2 - (g / 12) * (height / 2 - 10);
      return { x: idx * stepX, y };
    });

    let d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i];
      const p1 = points[i + 1];
      const cpX = (p0.x + p1.x) / 2;
      d += ` C ${cpX} ${p0.y}, ${cpX} ${p1.y}, ${p1.x} ${p1.y}`;
    }
    return d;
  };

  const handleClose = () => {
    dispatch(setEqualizerModalOpen(false));
  };

  const handleApply = () => {
    setAppliedToast(true);
    setTimeout(() => {
      setAppliedToast(false);
      handleClose();
    }, 1100);
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
      className="fixed inset-0 z-[150] flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-4 animate-fadeIn font-sans"
    >
      <div className="relative w-full max-w-lg max-h-[90vh] flex flex-col rounded-3xl bg-slate-950/95 border border-cyan/30 shadow-2xl text-white backdrop-blur-2xl overflow-hidden">
        {/* Ambient Top Glow */}
        <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-64 h-28 bg-cyan/20 blur-3xl rounded-full pointer-events-none" />

        {/* Applied Toast Notification */}
        {appliedToast && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-2xl bg-cyan text-slate-950 font-bold text-xs shadow-xl shadow-cyan/40 flex items-center gap-2 animate-bounce">
            <span>✓</span>
            <span>Sound Profile Applied to Playback!</span>
          </div>
        )}

        {/* Sticky Header with Visible Back & Close Button */}
        <div className="relative z-10 flex items-center justify-between px-5 py-4 border-b border-white/10 bg-slate-950/90 shrink-0">
          <div className="flex items-center gap-2.5">
            <button
              onClick={handleClose}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 hover:text-white text-xs font-semibold transition-all cursor-pointer mr-1"
              title="Close and return to player"
            >
              <span>←</span>
              <span>Back</span>
            </button>
            <div className="w-8 h-8 rounded-xl bg-cyan/15 border border-cyan/30 flex items-center justify-center text-cyan shadow-sm shadow-cyan/20 text-sm">
              🎛️
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white tracking-wide">Sound Equalizer</h3>
              <p className="text-[10px] text-slate-400">5-Band Studio Faders & Audio Presets</p>
            </div>
          </div>

          <button
            onClick={handleClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer text-sm"
            title="Close (Esc)"
          >
            ✕
          </button>
        </div>

        {/* Scrollable Modal Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1 custom-scrollbar">
          {/* Dynamic SVG Frequency Curve Display */}
          <div className="relative h-20 sm:h-24 rounded-2xl bg-black/50 border border-white/10 p-2 flex flex-col justify-between overflow-hidden">
            <div className="flex items-center justify-between text-[9px] text-slate-400 px-2 font-mono">
              <span>+12 dB</span>
              <span className="text-cyan font-bold tracking-wider uppercase">{preset.replace('_', ' ')}</span>
              <span>-12 dB</span>
            </div>

            <div className="relative flex-1 w-full flex items-center justify-center">
              {/* 0dB Center Reference Line */}
              <div className="absolute inset-x-2 top-1/2 h-[1px] bg-white/10 border-t border-dashed border-white/20" />

              <svg viewBox="0 0 340 90" className="w-full h-full overflow-visible">
                <defs>
                  <linearGradient id="eqCurveGrad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#00F2FE" />
                    <stop offset="50%" stopColor="#4FACFE" />
                    <stop offset="100%" stopColor="#A855F7" />
                  </linearGradient>
                </defs>
                <path
                  d={getCurvePath()}
                  fill="none"
                  stroke="url(#eqCurveGrad)"
                  strokeWidth="3"
                  strokeLinecap="round"
                  className="drop-shadow-[0_0_8px_rgba(0,242,254,0.6)] transition-all duration-200"
                />
              </svg>
            </div>

            <div className="flex justify-between text-[8.5px] text-slate-500 font-mono px-2">
              <span>Sub-Bass</span>
              <span>Bass</span>
              <span>Mid</span>
              <span>Vocals</span>
              <span>Treble</span>
            </div>
          </div>

          {/* Active Profile Status Badge */}
          <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-cyan/10 border border-cyan/25 text-cyan text-[11px] font-medium">
            <span className="w-2 h-2 rounded-full bg-cyan animate-pulse shrink-0" />
            <span className="leading-tight">{getPresetDescription(preset)}</span>
          </div>

          {/* 1-Click Preset Buttons */}
          <div>
            <label className="text-[10px] font-bold text-slate-300 uppercase tracking-wider block mb-1.5">
              Sound Presets
            </label>
            <div className="flex flex-wrap gap-1.5">
              {presets.map((p) => {
                const isSelected = preset === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => dispatch(setEqualizerPreset(p.id))}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-cyan text-slate-950 shadow-md shadow-cyan/30 scale-105'
                        : 'bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10'
                    }`}
                  >
                    <span>{p.icon}</span>
                    <span>{p.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 5-Band Vertical Faders */}
          <div className="grid grid-cols-5 gap-1.5 sm:gap-2 p-3 rounded-2xl bg-black/40 border border-white/10">
            {bands.map((b) => {
              const gain = gains[b.key] || 0;
              return (
                <div key={b.key} className="flex flex-col items-center">
                  <span className="text-[9.5px] font-mono text-cyan font-bold mb-1">
                    {gain > 0 ? `+${gain}` : gain} dB
                  </span>

                  <div className="relative h-24 sm:h-28 flex items-center justify-center my-0.5">
                    <input
                      type="range"
                      min="-12"
                      max="12"
                      step="1"
                      value={gain}
                      onChange={(e) =>
                        dispatch(setEqualizerBandGain({ band: b.key, gain: e.target.value }))
                      }
                      className="w-24 sm:w-28 -rotate-90 cursor-pointer accent-cyan bg-white/10 rounded-lg appearance-none h-1.5"
                    />
                  </div>

                  <span className="text-[10px] font-bold text-white mt-0.5">{b.label}</span>
                  <span className="text-[8.5px] text-slate-400">{b.sub}</span>
                </div>
              );
            })}
          </div>

          {/* Crossfade Transition Controller */}
          <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <span className="text-sm">🔀</span>
                <div>
                  <span className="text-xs font-bold text-white block">Smooth Track Crossfade</span>
                  <span className="text-[9.5px] text-slate-400">Continuous fade transition between tracks</span>
                </div>
              </div>

              <button
                onClick={() => dispatch(setCrossfadeEnabled(!cfEnabled))}
                className={`px-2.5 py-0.5 rounded-full text-[9.5px] font-mono font-bold transition-all cursor-pointer ${
                  cfEnabled
                    ? 'bg-cyan text-slate-950 shadow-md shadow-cyan/25'
                    : 'bg-white/10 text-slate-400'
                }`}
              >
                {cfEnabled ? 'ENABLED' : 'OFF'}
              </button>
            </div>

            {cfEnabled && (
              <div className="flex items-center justify-between pt-2 border-t border-white/10">
                <span className="text-[10px] text-slate-300">Transition Duration:</span>
                <div className="flex items-center gap-1">
                  {[2, 3, 4, 5].map((sec) => (
                    <button
                      key={sec}
                      onClick={() => dispatch(setCrossfadeDuration(sec))}
                      className={`px-2 py-0.5 rounded-lg text-[9.5px] font-mono font-bold transition-all cursor-pointer ${
                        cfDuration === sec
                          ? 'bg-cyan text-slate-950 shadow-sm shadow-cyan/30'
                          : 'bg-black/40 text-slate-400 hover:text-white border border-white/10'
                      }`}
                    >
                      {sec}s
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Actions Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-white/10 bg-slate-950/90 shrink-0">
          <button
            onClick={() => dispatch(resetEqualizer())}
            className="text-xs text-slate-400 hover:text-white flex items-center gap-1.5 cursor-pointer px-2 py-1 transition-colors"
          >
            ↺ Reset to Flat
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handleClose}
              className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 hover:text-white text-xs font-semibold transition-all cursor-pointer"
            >
              Close
            </button>
            <button
              onClick={handleApply}
              disabled={appliedToast}
              className="px-4 py-1.5 rounded-xl bg-cyan text-slate-950 font-bold text-xs shadow-md shadow-cyan/25 hover:brightness-110 active:scale-95 transition-all cursor-pointer flex items-center gap-1.5"
            >
              {appliedToast ? '✓ Applied!' : 'Apply Settings'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EqualizerModal;
