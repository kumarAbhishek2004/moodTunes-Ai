import React, { useRef, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { closeVibeCard } from '../store/audioSlice';
import { resolveMusicTheme } from '../utils/themeMap';

const VibeCardModal = () => {
  const dispatch = useDispatch();
  const isOpen = useSelector((state) => state.audio.isVibeCardOpen);
  const song = useSelector((state) => state.audio.vibeCardSong);
  const activeMood = useSelector((state) => state.audio.activeMood) || 'calm';

  const [toastMessage, setToastMessage] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const cardRef = useRef(null);

  if (!isOpen || !song) return null;

  const theme = resolveMusicTheme(song, activeMood);
  const moodName = (song.mood_match || song.detected_mood || activeMood || 'Calm').toUpperCase();
  const songImage =
    song.image ||
    (song.youtube_id ? `https://i.ytimg.com/vi/${song.youtube_id}/hqdefault.jpg` : null) ||
    'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80';

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 2500);
  };

  // High-Resolution PNG Generator using HTML5 Canvas (100% Cross-Browser, Zero Dependency)
  const handleDownloadImage = async () => {
    try {
      setIsGenerating(true);
      const canvas = document.createElement('canvas');
      const width = 800;
      const height = 1000;
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');

      // 1. Base Gradient Background
      const bgGrad = ctx.createLinearGradient(0, 0, width, height);
      bgGrad.addColorStop(0, '#0a0d14');
      bgGrad.addColorStop(0.5, '#0e111a');
      bgGrad.addColorStop(1, '#05070a');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // 2. Mood Glow Radial
      const glowGrad = ctx.createRadialGradient(width / 2, 340, 50, width / 2, 340, 400);
      glowGrad.addColorStop(0, theme.accent + '33');
      glowGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = glowGrad;
      ctx.fillRect(0, 0, width, height);

      // 3. Card Border
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
      ctx.lineWidth = 4;
      ctx.strokeRect(20, 20, width - 40, height - 40);

      // 4. Header: MoodTunes AI Brand
      ctx.font = 'bold 22px system-ui, -apple-system, sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.fillText('MOODTUNES AI', 60, 80);

      ctx.font = 'bold 13px monospace';
      ctx.fillStyle = theme.accent;
      ctx.fillText(`PARALLEL EMOTION AUDIO • ${moodName}`, 60, 105);

      // 5. Draw 12" Vinyl Disc Visual
      const centerX = width / 2;
      const centerY = 370;
      const radius = 190;

      // Outer Vinyl Base
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.fillStyle = '#111317';
      ctx.fill();
      ctx.strokeStyle = '#282c35';
      ctx.lineWidth = 3;
      ctx.stroke();

      // Concentric Grooves
      for (let r = 165; r >= 95; r -= 14) {
        ctx.beginPath();
        ctx.arc(centerX, centerY, r, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // Center Artwork Disc
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = songImage;

      await new Promise((resolve) => {
        img.onload = () => {
          ctx.save();
          ctx.beginPath();
          ctx.arc(centerX, centerY, 75, 0, Math.PI * 2);
          ctx.closePath();
          ctx.clip();
          ctx.drawImage(img, centerX - 75, centerY - 75, 150, 150);
          ctx.restore();
          resolve();
        };
        img.onerror = () => {
          // Fallback colored center if image cross-origin blocked
          ctx.beginPath();
          ctx.arc(centerX, centerY, 75, 0, Math.PI * 2);
          ctx.fillStyle = theme.accent;
          ctx.fill();
          resolve();
        };
      });

      // Center Spindle Hole
      ctx.beginPath();
      ctx.arc(centerX, centerY, 14, 0, Math.PI * 2);
      ctx.fillStyle = '#0a0d14';
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.lineWidth = 2;
      ctx.stroke();

      // 6. Song Title & Artist
      ctx.textAlign = 'center';
      ctx.font = 'bold 36px system-ui, -apple-system, sans-serif';
      ctx.fillStyle = '#ffffff';
      const cleanTitle = song.name.length > 28 ? song.name.substring(0, 26) + '...' : song.name;
      ctx.fillText(cleanTitle, centerX, 640);

      ctx.font = '20px system-ui, -apple-system, sans-serif';
      ctx.fillStyle = '#94a3b8';
      ctx.fillText(song.artist || 'Unknown Artist', centerX, 680);

      // 7. Mood Pill Badge
      ctx.font = 'bold 15px monospace';
      const badgeText = `✨ ${moodName} VIBE • HARMONIC CADENCE`;
      const badgeWidth = ctx.measureText(badgeText).width + 36;
      ctx.fillStyle = theme.accent + '22';
      ctx.strokeStyle = theme.accent + '88';
      ctx.lineWidth = 1.5;
      const badgeX = centerX - badgeWidth / 2;
      ctx.beginPath();
      ctx.roundRect(badgeX, 720, badgeWidth, 38, 19);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = theme.accent;
      ctx.fillText(badgeText, centerX, 744);

      // 8. Explainable AI Reasoning Snippet
      ctx.font = 'italic 16px system-ui, -apple-system, sans-serif';
      ctx.fillStyle = '#cbd5e1';
      const quote =
        song.ai_explanation ||
        `Curated for emotional resonance with ${moodName.toLowerCase()} harmonic frequencies.`;
      const wrappedQuote = quote.length > 70 ? quote.substring(0, 68) + '...' : quote;
      ctx.fillText(`"${wrappedQuote}"`, centerX, 820);

      // 9. Watermark Footer
      ctx.font = '13px monospace';
      ctx.fillStyle = '#64748b';
      ctx.fillText('STREAMING ON MOODTUNES AI • LISTEN NOW', centerX, 920);

      // Trigger Download
      const link = document.createElement('a');
      link.download = `MoodTunes-Vibe-${song.name.replace(/[^a-zA-Z0-9]/g, '_')}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();

      showToast('📸 Vibe Card downloaded successfully!');
    } catch (err) {
      console.error('Download error:', err);
      showToast('Generated, click download again');
    } finally {
      setIsGenerating(false);
    }
  };

  // Copy formatted text for Instagram / WhatsApp Status
  const handleCopyStoryText = () => {
    const text = `🎵 Currently listening to "${song.name}" by ${song.artist}\n✨ Mood: ${moodName} (Harmonic Frequency)\n💡 ${song.ai_explanation || 'Curated on MoodTunes AI'}\n🎧 Stream with facial emotion AI on MoodTunes AI`;
    navigator.clipboard.writeText(text);
    showToast('📋 Copied story quote to clipboard!');
  };

  // Share to Twitter / X
  const handleShareTwitter = () => {
    const text = encodeURIComponent(
      `Listening to "${song.name}" by ${song.artist} on @MoodTunesAI ✨ Matching my ${moodName} vibe with real-time emotion audio! 🎵`
    );
    window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank');
  };

  // Share to WhatsApp
  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(
      `🎵 Currently spinning "${song.name}" by ${song.artist} on MoodTunes AI (Mood: ${moodName})\nCheck it out!`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn"
      onClick={() => dispatch(closeVibeCard())}
    >
      <div
        className="relative w-full max-w-lg bg-obsidian-950/95 border border-white/10 rounded-3xl p-6 sm:p-7 shadow-2xl text-white overflow-hidden max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow ambient */}
        <div
          className="absolute -top-16 -right-16 w-52 h-52 rounded-full blur-3xl pointer-events-none opacity-20"
          style={{ backgroundColor: theme.accent }}
        />

        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">📸</span>
            <div>
              <h3 className="font-bold text-base text-white">Shareable Vibe Card</h3>
              <p className="text-xs text-slate-400">Export your current listening frequency</p>
            </div>
          </div>
          <button
            onClick={() => dispatch(closeVibeCard())}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center text-sm"
          >
            ✕
          </button>
        </div>

        {/* ========================================================= */}
        {/* Visual Card Preview                                       */}
        {/* ========================================================= */}
        <div
          ref={cardRef}
          className="relative rounded-2xl p-5 border border-white/10 overflow-hidden flex flex-col items-center text-center shadow-xl mb-5 flex-shrink-0"
          style={{
            background: `radial-gradient(circle at 50% 30%, ${theme.accent}20 0%, #0d1117 75%)`,
          }}
        >
          {/* Top Brand Banner */}
          <div className="w-full flex items-center justify-between mb-4 text-[10px] uppercase font-mono tracking-wider">
            <span className="font-bold text-white flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: theme.accent }} />
              MoodTunes AI
            </span>
            <span style={{ color: theme.accent }} className="font-semibold">
              {moodName}
            </span>
          </div>

          {/* Vinyl Disc with Artwork Center */}
          <div className="relative w-40 h-40 rounded-full bg-[#111317] border-2 border-white/15 flex items-center justify-center shadow-2xl mb-4 group">
            {/* Concentric Grooves */}
            <div className="absolute inset-2 rounded-full border border-white/5 pointer-events-none" />
            <div className="absolute inset-5 rounded-full border border-white/5 pointer-events-none" />
            <div className="absolute inset-8 rounded-full border border-white/5 pointer-events-none" />

            {/* Artwork Center */}
            <div className="relative w-16 h-16 rounded-full overflow-hidden border border-white/30 shadow-md">
              <img
                src={songImage}
                alt={song.name}
                className="w-full h-full object-cover animate-spin-slow"
              />
              {/* Spindle hole */}
              <div className="absolute inset-0 m-auto w-3.5 h-3.5 rounded-full bg-obsidian-950 border border-white/40" />
            </div>
          </div>

          {/* Song Info */}
          <h4 className="font-bold text-lg text-white tracking-tight line-clamp-1">
            {song.name}
          </h4>
          <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{song.artist}</p>

          {/* Mood Badge */}
          <div
            className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono font-bold border"
            style={{
              backgroundColor: `${theme.accent}18`,
              borderColor: `${theme.accent}40`,
              color: theme.accent,
            }}
          >
            <span>✨</span>
            <span>{moodName} FREQUENCY</span>
          </div>

          {/* Explainable AI quote snippet */}
          <p className="text-[11px] text-slate-300 italic mt-3 max-w-xs leading-relaxed">
            "{song.ai_explanation || 'Curated with AI emotional valence & harmonic cadence.'}"
          </p>
        </div>

        {/* ========================================================= */}
        {/* Action Buttons                                            */}
        {/* ========================================================= */}
        <div className="space-y-2 mt-auto">
          {/* Main Download Button */}
          <button
            onClick={handleDownloadImage}
            disabled={isGenerating}
            className="w-full py-3 px-4 rounded-xl font-bold text-sm text-slate-950 shadow-lg transition-all flex items-center justify-center gap-2 hover:scale-[1.01]"
            style={{
              backgroundColor: theme.accent,
            }}
          >
            <span>📸</span>
            <span>{isGenerating ? 'Rendering Card...' : 'Download Vibe Card (PNG)'}</span>
          </button>

          {/* Share Grid */}
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={handleCopyStoryText}
              className="py-2 px-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-200 border border-white/5 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
              title="Copy formatted story quote"
            >
              <span>📋</span>
              <span className="truncate">Copy Text</span>
            </button>
            <button
              onClick={handleShareTwitter}
              className="py-2 px-2.5 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 border border-sky-500/20 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
              title="Post to X / Twitter"
            >
              <span>🐦</span>
              <span className="truncate">Post on X</span>
            </button>
            <button
              onClick={handleShareWhatsApp}
              className="py-2 px-2.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/20 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
              title="Share via WhatsApp"
            >
              <span>💬</span>
              <span className="truncate">WhatsApp</span>
            </button>
          </div>
        </div>

        {/* Toast confirmation */}
        {toastMessage && (
          <div className="absolute bottom-3 left-6 right-6 py-2 px-3 rounded-xl bg-obsidian-900 border border-white/20 text-center text-xs text-white shadow-xl animate-fadeIn font-mono">
            {toastMessage}
          </div>
        )}
      </div>
    </div>
  );
};

export default VibeCardModal;
