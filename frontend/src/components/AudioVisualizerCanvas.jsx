import React, { useRef, useEffect } from 'react';
import { useAudioVisualizer } from '../hooks/useAudioVisualizer';

/**
 * AudioVisualizerCanvas
 * Renders a neon FFT frequency spectrum visualizer with peak hold caps
 * and mood-adaptive gradients matching the active track.
 */
const AudioVisualizerCanvas = ({
  height = 90,
  accentColor = '#00F2FE',
  secondaryColor = '#4FACFE',
  className = '',
}) => {
  const canvasRef = useRef(null);
  const peakCapsRef = useRef(new Array(32).fill(0));
  const { waveformBars, bassLevel, isBeat } = useAudioVisualizer(32);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, width, h);

    const barCount = waveformBars.length;
    const spacing = 3;
    const totalSpacing = spacing * (barCount - 1);
    const barWidth = Math.max(2, (width - totalSpacing) / barCount);

    // Create vertical mood gradient for bars
    const gradient = ctx.createLinearGradient(0, 0, 0, h);
    gradient.addColorStop(0, '#FFFFFF');
    gradient.addColorStop(0.2, accentColor);
    gradient.addColorStop(0.8, secondaryColor || accentColor);
    gradient.addColorStop(1, 'rgba(0,0,0,0.2)');

    // Optional subtle bass pulse glow
    if (bassLevel > 0.45) {
      ctx.shadowBlur = Math.round(bassLevel * 14);
      ctx.shadowColor = accentColor;
    } else {
      ctx.shadowBlur = 0;
    }

    for (let i = 0; i < barCount; i++) {
      const val = waveformBars[i] || 0.05;
      const barH = Math.max(3, val * (h - 8));
      const x = i * (barWidth + spacing);
      const y = h - barH;

      // Draw Main Bar
      ctx.fillStyle = gradient;
      ctx.beginPath();
      // Rounded top cap
      const radius = Math.min(2, barWidth / 2);
      ctx.roundRect(x, y, barWidth, barH, [radius, radius, 0, 0]);
      ctx.fill();

      // Peak Hold Cap (Studio Monitor hardware aesthetic)
      let prevPeak = peakCapsRef.current[i] || 0;
      let currentPeak = y - 3;
      if (currentPeak < prevPeak) {
        prevPeak = currentPeak; // instant rise
      } else {
        prevPeak = Math.min(h - 3, prevPeak + 0.9); // gentle gravity fall
      }
      peakCapsRef.current[i] = prevPeak;

      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(x, prevPeak, barWidth, 1.5);
    }
  }, [waveformBars, accentColor, secondaryColor, bassLevel]);

  return (
    <div className={`relative w-full overflow-hidden select-none ${className}`}>
      <canvas
        ref={canvasRef}
        width={320}
        height={height}
        className="w-full h-full block"
      />
      {isBeat && (
        <div
          className="absolute inset-0 pointer-events-none opacity-20 transition-opacity duration-150 rounded-xl"
          style={{
            background: `radial-gradient(circle, ${accentColor} 0%, transparent 70%)`,
          }}
        />
      )}
    </div>
  );
};

export default AudioVisualizerCanvas;
