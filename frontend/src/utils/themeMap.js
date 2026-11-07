/**
 * utils/themeMap.js
 * Dynamic theme resolver based on Mood and Music Genre.
 * Strict guideline: When music is playing, colors adapt to the mood and musical genre of the track!
 */

export const THEME_PALETTES = {
  romantic: {
    key: 'romantic',
    name: 'Romantic & Soulful',
    accent: '#EC4899',
    accentRgb: '236, 72, 153',
    primary: 'rgba(236, 72, 153, 0.35)',
    secondary: 'rgba(244, 63, 94, 0.22)',
    ambient: 'rgba(236, 72, 153, 0.16)',
    glow: 'rgba(236, 72, 153, 0.55)',
    border: 'border-pink-500/40',
    badgeBg: 'bg-pink-500/15 text-pink-400 border-pink-500/30',
  },
  hiphop: {
    key: 'hiphop',
    name: 'Hip-Hop & Urban',
    accent: '#F59E0B',
    accentRgb: '245, 158, 11',
    primary: 'rgba(245, 158, 11, 0.35)',
    secondary: 'rgba(239, 68, 68, 0.22)',
    ambient: 'rgba(245, 158, 11, 0.16)',
    glow: 'rgba(245, 158, 11, 0.55)',
    border: 'border-amber-500/40',
    badgeBg: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  },
  electronic: {
    key: 'electronic',
    name: 'Electronic & Synth',
    accent: '#8B5CF6',
    accentRgb: '139, 92, 246',
    primary: 'rgba(139, 92, 246, 0.38)',
    secondary: 'rgba(6, 182, 212, 0.22)',
    ambient: 'rgba(139, 92, 246, 0.16)',
    glow: 'rgba(139, 92, 246, 0.55)',
    border: 'border-purple-500/40',
    badgeBg: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
  },
  rock: {
    key: 'rock',
    name: 'Rock & Metal',
    accent: '#EF4444',
    accentRgb: '239, 68, 68',
    primary: 'rgba(239, 68, 68, 0.38)',
    secondary: 'rgba(249, 115, 22, 0.22)',
    ambient: 'rgba(239, 68, 68, 0.16)',
    glow: 'rgba(239, 68, 68, 0.55)',
    border: 'border-rose-500/40',
    badgeBg: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
  },
  calm: {
    key: 'calm',
    name: 'Calm & Acoustic',
    accent: '#00F2FE',
    accentRgb: '0, 242, 254',
    primary: 'rgba(0, 242, 254, 0.35)',
    secondary: 'rgba(16, 185, 129, 0.22)',
    ambient: 'rgba(0, 242, 254, 0.16)',
    glow: 'rgba(0, 242, 254, 0.55)',
    border: 'border-cyan/40',
    badgeBg: 'bg-cyan/15 text-cyan border-cyan/30',
  },
  focus: {
    key: 'focus',
    name: 'Focus & Lo-Fi',
    accent: '#10B981',
    accentRgb: '16, 185, 129',
    primary: 'rgba(16, 185, 129, 0.35)',
    secondary: 'rgba(6, 182, 212, 0.22)',
    ambient: 'rgba(16, 185, 129, 0.16)',
    glow: 'rgba(16, 185, 129, 0.55)',
    border: 'border-emerald-500/40',
    badgeBg: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  },
  jazz: {
    key: 'jazz',
    name: 'Jazz & Soul',
    accent: '#6366F1',
    accentRgb: '99, 102, 241',
    primary: 'rgba(99, 102, 241, 0.35)',
    secondary: 'rgba(168, 85, 247, 0.22)',
    ambient: 'rgba(99, 102, 241, 0.16)',
    glow: 'rgba(99, 102, 241, 0.55)',
    border: 'border-indigo-500/40',
    badgeBg: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30',
  },
  energetic: {
    key: 'energetic',
    name: 'Energetic & Party',
    accent: '#F97316',
    accentRgb: '249, 115, 22',
    primary: 'rgba(249, 115, 22, 0.38)',
    secondary: 'rgba(234, 179, 8, 0.22)',
    ambient: 'rgba(249, 115, 22, 0.16)',
    glow: 'rgba(249, 115, 22, 0.55)',
    border: 'border-orange-500/40',
    badgeBg: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
  },
  sad: {
    key: 'sad',
    name: 'Reflective & Deep',
    accent: '#3B82F6',
    accentRgb: '59, 130, 246',
    primary: 'rgba(59, 130, 246, 0.35)',
    secondary: 'rgba(99, 102, 241, 0.22)',
    ambient: 'rgba(59, 130, 246, 0.16)',
    glow: 'rgba(59, 130, 246, 0.55)',
    border: 'border-blue-500/40',
    badgeBg: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  },
  happy: {
    key: 'happy',
    name: 'Happy & Pop',
    accent: '#F59E0B',
    accentRgb: '245, 158, 11',
    primary: 'rgba(245, 158, 11, 0.35)',
    secondary: 'rgba(236, 72, 153, 0.22)',
    ambient: 'rgba(245, 158, 11, 0.16)',
    glow: 'rgba(245, 158, 11, 0.55)',
    border: 'border-amber-500/40',
    badgeBg: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  },
};

/**
 * Resolves current theme dynamically ensuring STRICT 100% UI COLOR UNIFORMITY.
 * The user's active atmosphere / mood always governs the entire application theme!
 * (Navbar, Equalizer, Waveforms, Sliders, Glows, Chatbot, and Action Buttons).
 */
export const resolveMusicTheme = (currentSong, activeMood = 'happy') => {
  // 1. Primary authority: The user's active mood atmosphere!
  const rawMood = typeof activeMood === 'object' && activeMood !== null ? activeMood.mood : activeMood;
  const moodStr = String(rawMood || '').toLowerCase().trim();

  if (moodStr) {
    if (THEME_PALETTES[moodStr]) {
      return THEME_PALETTES[moodStr];
    }
    if (moodStr.includes('energetic') || moodStr.includes('energy')) return THEME_PALETTES.energetic;
    if (moodStr.includes('romantic') || moodStr.includes('romance') || moodStr.includes('love')) return THEME_PALETTES.romantic;
    if (moodStr.includes('calm') || moodStr.includes('peace') || moodStr.includes('zen') || moodStr.includes('relax')) return THEME_PALETTES.calm;
    if (moodStr.includes('focus') || moodStr.includes('study') || moodStr.includes('work')) return THEME_PALETTES.focus;
    if (moodStr.includes('sad') || moodStr.includes('reflect') || moodStr.includes('melanchol')) return THEME_PALETTES.sad;
    if (moodStr.includes('happy') || moodStr.includes('joy') || moodStr.includes('cheer')) return THEME_PALETTES.happy;
  }

  // 2. Secondary fallback: check song tags if no active mood is specified
  if (currentSong) {
    const candidates = [];
    if (currentSong.genre) candidates.push(currentSong.genre);
    if (currentSong.mood_match) candidates.push(currentSong.mood_match);
    if (Array.isArray(currentSong.tags)) candidates.push(...currentSong.tags);
    if (currentSong.artist) candidates.push(currentSong.artist);
    if (currentSong.name) candidates.push(currentSong.name);

    for (const cand of candidates) {
      const c = String(cand).toLowerCase();
      if (c.includes('energetic') || c.includes('workout') || c.includes('party')) return THEME_PALETTES.energetic;
      if (c.includes('romantic') || c.includes('romance') || c.includes('love')) return THEME_PALETTES.romantic;
      if (c.includes('calm') || c.includes('chill') || c.includes('ambient') || c.includes('lofi')) return THEME_PALETTES.calm;
      if (c.includes('focus') || c.includes('study') || c.includes('piano')) return THEME_PALETTES.focus;
      if (c.includes('sad') || c.includes('reflective') || c.includes('heartbreak')) return THEME_PALETTES.sad;
      if (c.includes('happy') || c.includes('pop') || c.includes('cheerful')) return THEME_PALETTES.happy;
      if (c.includes('rock') || c.includes('metal')) return THEME_PALETTES.rock;
      if (c.includes('electronic') || c.includes('edm')) return THEME_PALETTES.electronic;
      if (c.includes('hip hop') || c.includes('rap')) return THEME_PALETTES.hiphop;
    }
  }

  return THEME_PALETTES.happy;
};
