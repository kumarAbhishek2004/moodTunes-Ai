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
 * Resolves current theme dynamically.
 * If music is playing: analyzes song's genre, tags, and mood match.
 * If no song is playing: uses the user's selected/detected mood.
 */
export const resolveMusicTheme = (currentSong, activeMood = 'happy') => {
  // If a song is active, check genre / tags / mood
  if (currentSong) {
    const candidates = [];
    if (currentSong.genre) candidates.push(currentSong.genre);
    if (currentSong.mood_match) candidates.push(currentSong.mood_match);
    if (Array.isArray(currentSong.tags)) candidates.push(...currentSong.tags);
    if (currentSong.artist) candidates.push(currentSong.artist);
    if (currentSong.name) candidates.push(currentSong.name);

    for (const cand of candidates) {
      const c = String(cand).toLowerCase();
      // Rock / Metal
      if (c.includes('rock') || c.includes('metal') || c.includes('punk') || c.includes('hard') || c.includes('heavy') || c.includes('intense')) {
        return THEME_PALETTES.rock;
      }
      // Electronic / EDM / Dance
      if (c.includes('edm') || c.includes('electro') || c.includes('dance') || c.includes('house') || c.includes('techno') || c.includes('club') || c.includes('synth')) {
        return THEME_PALETTES.electronic;
      }
      // Hip Hop / Rap / Trap / Urban
      if (c.includes('hip hop') || c.includes('hiphop') || c.includes('rap') || c.includes('trap') || c.includes('drill') || c.includes('honey singh') || c.includes('badshah') || c.includes('raftaar') || c.includes('drake') || c.includes('eminem')) {
        return THEME_PALETTES.hiphop;
      }
      // Romantic / Soulful / Bollywood Love
      if (c.includes('romantic') || c.includes('love') || c.includes('romance') || c.includes('bollywood') || c.includes('jubin') || c.includes('arijit') || c.includes('atif') || c.includes('shreya') || c.includes('sufi')) {
        return THEME_PALETTES.romantic;
      }
      // Calm / Lo-Fi / Acoustic
      if (c.includes('calm') || c.includes('chill') || c.includes('acoustic') || c.includes('ambient') || c.includes('lofi') || c.includes('lo-fi') || c.includes('peaceful') || c.includes('serene')) {
        return THEME_PALETTES.calm;
      }
      // Focus / Study / Classical
      if (c.includes('focus') || c.includes('study') || c.includes('instrumental') || c.includes('classical') || c.includes('piano')) {
        return THEME_PALETTES.focus;
      }
      // Jazz / Blues
      if (c.includes('jazz') || c.includes('blues') || c.includes('soul') || c.includes('funk')) {
        return THEME_PALETTES.jazz;
      }
      // Energetic / Workout
      if (c.includes('energetic') || c.includes('energy') || c.includes('workout') || c.includes('fitness') || c.includes('party') || c.includes('fast')) {
        return THEME_PALETTES.energetic;
      }
      // Sad / Reflective
      if (c.includes('sad') || c.includes('reflective') || c.includes('melancholy') || c.includes('cry') || c.includes('heartbreak') || c.includes('broken')) {
        return THEME_PALETTES.sad;
      }
      // Happy / Pop
      if (c.includes('happy') || c.includes('joy') || c.includes('cheerful') || c.includes('pop')) {
        return THEME_PALETTES.happy;
      }
    }
  }

  // Fallback to active mood
  const moodKey = (activeMood || 'happy').toLowerCase();
  if (THEME_PALETTES[moodKey]) {
    return THEME_PALETTES[moodKey];
  }
  return THEME_PALETTES.happy;
};
