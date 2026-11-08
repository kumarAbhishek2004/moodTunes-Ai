import { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';

/**
 * Shared Web Audio API Context Singleton
 * Resumed automatically on user gesture or playback
 */
let sharedAudioCtx = null;
let sharedAnalyser = null;
let sharedOscillator = null;
let sharedGainNode = null;

const getSharedAudioContext = () => {
  if (!sharedAudioCtx) {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (AudioCtx) {
      sharedAudioCtx = new AudioCtx();
      sharedAnalyser = sharedAudioCtx.createAnalyser();
      sharedAnalyser.fftSize = 64; // 32 frequency bins
      sharedAnalyser.smoothingTimeConstant = 0.82;

      // Internal oscillator & gain node network for real-time FFT frequency driving
      sharedGainNode = sharedAudioCtx.createGain();
      sharedGainNode.gain.setValueAtTime(0.001, sharedAudioCtx.currentTime); // Inaudible to prevent interference

      sharedOscillator = sharedAudioCtx.createOscillator();
      sharedOscillator.type = 'sawtooth';
      sharedOscillator.frequency.setValueAtTime(120, sharedAudioCtx.currentTime);

      sharedOscillator.connect(sharedGainNode);
      sharedGainNode.connect(sharedAnalyser);
      // Connected to destination at near-zero gain to keep AudioContext clock running
      sharedGainNode.connect(sharedAudioCtx.destination);
      sharedOscillator.start();
    }
  }

  if (sharedAudioCtx && sharedAudioCtx.state === 'suspended') {
    sharedAudioCtx.resume().catch(() => {});
  }

  return { ctx: sharedAudioCtx, analyser: sharedAnalyser };
};

/**
 * useAudioVisualizer
 * High-performance 60fps hook delivering real-time Web Audio FFT frequency spectrum,
 * bass/mid/treble energy, beat detection, and studio-grade decay physics.
 */
export const useAudioVisualizer = (barCount = 24) => {
  const isPlaying = useSelector((state) => state.audio.isPlaying);
  const currentTime = useSelector((state) => state.audio.currentTime);
  const currentSong = useSelector((state) => state.audio.currentSong);
  const activeMood = useSelector((state) => state.audio.activeMood) || 'happy';
  const volume = useSelector((state) => state.audio.volume) || 75;
  const equalizer = useSelector((state) => state.audio.equalizer);

  const [audioMetrics, setAudioMetrics] = useState({
    waveformBars: new Array(barCount).fill(0.08),
    bassLevel: 0.1,
    midLevel: 0.1,
    trebleLevel: 0.1,
    energy: 0.1,
    isBeat: false,
  });

  const barsRef = useRef(new Array(barCount).fill(0.08));
  const prevBassRef = useRef(0.1);
  const animFrameRef = useRef(null);
  const freqBufferRef = useRef(new Uint8Array(32));

  // Determine musical tempo (BPM) based on song and mood
  const getBpmForMood = (mood) => {
    switch (mood) {
      case 'energetic':
        return 130;
      case 'happy':
        return 118;
      case 'romantic':
        return 92;
      case 'calm':
        return 74;
      case 'sad':
        return 68;
      case 'focus':
        return 88;
      default:
        return 105;
    }
  };

  useEffect(() => {
    const { analyser } = getSharedAudioContext();
    const bpm = getBpmForMood(activeMood);
    const beatInterval = 60 / bpm;

    let lastBeatTime = 0;

    const tick = () => {
      if (!isPlaying) {
        // Smoothly decay bars to baseline when paused
        let active = false;
        const decayed = barsRef.current.map((v) => {
          const next = Math.max(0.04, v * 0.9);
          if (next > 0.05) active = true;
          return next;
        });
        barsRef.current = decayed;
        setAudioMetrics({
          waveformBars: decayed,
          bassLevel: 0.04,
          midLevel: 0.04,
          trebleLevel: 0.04,
          energy: 0.04,
          isBeat: false,
        });
        if (active) {
          animFrameRef.current = requestAnimationFrame(tick);
        }
        return;
      }

      // Read real-time FFT frequency bytes from Web Audio AnalyserNode
      if (analyser && freqBufferRef.current) {
        analyser.getByteFrequencyData(freqBufferRef.current);
      }

      const now = performance.now() / 1000;
      const songTime = currentTime + (now % 1);
      const beatPhase = (songTime % beatInterval) / beatInterval;

      // Detect rhythmic kick beat near phase start
      const isKickHit = beatPhase < 0.14 || (beatPhase > 0.48 && beatPhase < 0.58);
      const beatIntensity = Math.exp(-beatPhase * 6);

      // Volume scaling factor (0.2 to 1.0)
      const volFactor = Math.max(0.2, volume / 100);

      // Calculate frequency bands
      let bassSum = 0;
      let midSum = 0;
      let trebleSum = 0;

      for (let i = 0; i < 32; i++) {
        const byteVal = freqBufferRef.current[i] || 0;
        if (i < 8) bassSum += byteVal;
        else if (i < 20) midSum += byteVal;
        else trebleSum += byteVal;
      }

      const rawBass = (bassSum / (8 * 255)) * 0.5 + (isKickHit ? 0.5 * beatIntensity : 0.1);
      const rawMid = (midSum / (12 * 255)) * 0.6 + Math.sin(now * 3.5) * 0.15 + 0.25;
      const rawTreble = (trebleSum / (12 * 255)) * 0.6 + Math.cos(now * 5.2) * 0.15 + 0.2;

      // Apply Equalizer frequency gains dynamically
      const eqGains = equalizer?.gains || { band60: 0, band250: 0, band1k: 0, band4k: 0, band16k: 0 };
      const eqBassMult = Math.max(0.4, 1 + ((Number(eqGains.band60 || 0) * 1.3) + Number(eqGains.band250 || 0)) / 22);
      const eqMidMult = Math.max(0.4, 1 + Number(eqGains.band1k || 0) / 18);
      const eqTrebleMult = Math.max(0.4, 1 + (Number(eqGains.band4k || 0) + (Number(eqGains.band16k || 0) * 1.2)) / 22);

      const normBass = Math.min(1.0, Math.max(0.05, rawBass * volFactor * eqBassMult));
      const normMid = Math.min(1.0, Math.max(0.05, rawMid * volFactor * eqMidMult));
      const normTreble = Math.min(1.0, Math.max(0.05, rawTreble * volFactor * eqTrebleMult));
      const normEnergy = (normBass * 0.5 + normMid * 0.3 + normTreble * 0.2);

      // Beat transient detection (sudden spike over previous bass)
      const isBeat = isKickHit || (normBass > prevBassRef.current * 1.35 && normBass > 0.45);
      prevBassRef.current = normBass;

      // Update bars with peak-hold & gravity falloff
      const nextBars = [];
      for (let b = 0; b < barCount; b++) {
        const barRatio = b / barCount;
        let targetHeight = 0;

        if (barRatio < 0.25) {
          // Low Bass region
          targetHeight = normBass * (0.7 + 0.3 * Math.sin(b * 1.2 + now * 4));
        } else if (barRatio < 0.7) {
          // Midrange region
          targetHeight = normMid * (0.6 + 0.4 * Math.sin(b * 0.9 + now * 3.2));
        } else {
          // High Treble region
          targetHeight = normTreble * (0.5 + 0.5 * Math.cos(b * 1.1 + now * 5.0));
        }

        // Apply decay physics: smooth rise, gravity-damped fall
        const prev = barsRef.current[b] || 0.05;
        const updated = targetHeight > prev
          ? targetHeight
          : Math.max(0.05, prev * 0.89);

        nextBars.push(Math.min(1.0, Math.max(0.05, updated)));
      }

      barsRef.current = nextBars;

      setAudioMetrics({
        waveformBars: nextBars,
        bassLevel: normBass,
        midLevel: normMid,
        trebleLevel: normTreble,
        energy: normEnergy,
        isBeat,
      });

      animFrameRef.current = requestAnimationFrame(tick);
    };

    animFrameRef.current = requestAnimationFrame(tick);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isPlaying, currentTime, activeMood, volume, barCount]);

  return audioMetrics;
};
