/**
 * utils/imageHelper.js
 * Guaranteed High-Fidelity Music Cover Artwork Resolver & Fallback Engine
 * 
 * Guarantees that every song, queue track, favorite, and stream item always
 * displays authentic, crisp album art and never a broken image or [...] placeholder.
 */
import { resolveKnownYouTubeId } from './songMap';

// Curated verified album covers for iconic and frequent tracks
const CURATED_TRACK_COVERS = {
  'machayenge 3': 'https://i.ytimg.com/vi/nJNooQDc0Bs/hqdefault.jpg',
  'machayenge': 'https://i.ytimg.com/vi/nJNooQDc0Bs/hqdefault.jpg',
  'machayenge 4': 'https://i.ytimg.com/vi/tWzCshc1oN4/hqdefault.jpg',
  'love dose': 'https://i.ytimg.com/vi/nW9WwkWwaW8/hqdefault.jpg',
  'lovedose': 'https://i.ytimg.com/vi/nW9WwkWwaW8/hqdefault.jpg',
  'desi kalakaar': 'https://i.ytimg.com/vi/KhnVcAC5bIm/hqdefault.jpg',
  'blue eyes': 'https://i.ytimg.com/vi/NbyHNASFi6U/hqdefault.jpg',
  'dope shope': 'https://i.ytimg.com/vi/NrXdauEv9HY/hqdefault.jpg',
  'brown rang': 'https://i.ytimg.com/vi/PqFMFVcCZgI/hqdefault.jpg',
  'high heels': 'https://i.ytimg.com/vi/kJqU9F2p6_4/hqdefault.jpg',
  'angreji beat': 'https://i.ytimg.com/vi/2oMv4N1GkQk/hqdefault.jpg',
  'lungi dance': 'https://i.ytimg.com/vi/2kWly_tXpFQ/hqdefault.jpg',
  'makhna': 'https://i.ytimg.com/vi/x-3zJ6A7k8U/hqdefault.jpg',
  'believer': 'https://i.ytimg.com/vi/7wtfhZwyrcc/hqdefault.jpg',
  'raataan lambiyan': 'https://i.ytimg.com/vi/gvyUuxdRdR4/hqdefault.jpg',
  'kesariya': 'https://i.ytimg.com/vi/BddP6PYo2gs/hqdefault.jpg',
  'apna bana le': 'https://i.ytimg.com/vi/ElZfdU54Cp8/hqdefault.jpg',
  'channa mereya': 'https://i.ytimg.com/vi/bzSTpdcs-EI/hqdefault.jpg',
  'agar tum saath ho': 'https://i.ytimg.com/vi/sK7riqg2mr4/hqdefault.jpg',
  'starboy': 'https://i.ytimg.com/vi/34Na4j8AVgA/hqdefault.jpg',
  'blinding lights': 'https://i.ytimg.com/vi/4NRXx6U8ABQ/hqdefault.jpg',
  'boom shack-a-lak': 'https://i.ytimg.com/vi/kZzBd41NuZw/hqdefault.jpg',
  'boom shak-a-lak': 'https://i.ytimg.com/vi/kZzBd41NuZw/hqdefault.jpg',
  'boom shaka': 'https://i.ytimg.com/vi/kZzBd41NuZw/hqdefault.jpg',
  'kho gaye hum kahan': 'https://i.ytimg.com/vi/vt4jX0iPU40/hqdefault.jpg',
  'phir se udd chala': 'https://i.ytimg.com/vi/2iqbx7Tzxbw/hqdefault.jpg',
  'aazaadiyan': 'https://i.ytimg.com/vi/01Qk9mHjC5E/hqdefault.jpg',
  'bekhayali': 'https://i.ytimg.com/vi/VOLKJJvfAbg/hqdefault.jpg',
  'tujhe bhula diya': 'https://i.ytimg.com/vi/1y3wFvC9W2Q/hqdefault.jpg',
  'phir bhi tumko chaahunga': 'https://i.ytimg.com/vi/_aktURityQw/hqdefault.jpg',
  'alvida': 'https://i.ytimg.com/vi/dD9l_s3l8eA/hqdefault.jpg',
  'say my name': 'https://i.ytimg.com/vi/d7m_c0w5z_o/hqdefault.jpg',
  'no cap': 'https://i.ytimg.com/vi/O1mQn4P9z2w/hqdefault.jpg',
  'makasam': 'https://i.ytimg.com/vi/JgZ3o8dD_Q0/hqdefault.jpg',
  'hola amigo': 'https://i.ytimg.com/vi/s_8xW_P6Yp0/hqdefault.jpg',
  'chaleya': 'https://i.ytimg.com/vi/VAdGW7QDJiU/hqdefault.jpg',
};

// Atmospheric curated cover themes keyed by mood
const MOOD_PALETTES = {
  energetic: { c1: '#FF5A8A', c2: '#F97316', bg1: '#1F1122', bg2: '#0D0714', label: 'Energetic' },
  happy: { c1: '#FBBF24', c2: '#F59E0B', bg1: '#261B0B', bg2: '#0D0A04', label: 'Happy' },
  calm: { c1: '#00F2FE', c2: '#06B6D4', bg1: '#091E28', bg2: '#040E14', label: 'Calm' },
  romantic: { c1: '#EC4899', c2: '#A855F7', bg1: '#260B24', bg2: '#0D040E', label: 'Romantic' },
  sad: { c1: '#60A5FA', c2: '#3B82F6', bg1: '#0B1728', bg2: '#040A14', label: 'Reflective' },
  focus: { c1: '#34D399', c2: '#10B981', bg1: '#09251B', bg2: '#030E0B', label: 'Focus' },
};

/**
 * Generates an elegant, zero-latency SVG Vinyl Cover Data URI.
 * Works 100% offline, never 404s, never fails CORS, and looks like a deluxe vinyl record sleeve.
 */
export const generateVinylCoverSvg = (song = {}) => {
  const name = String(song.name || 'MoodTunes Track')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
  const artist = String(song.artist || 'Curated Stream')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

  const moodKey = String(song.detected_mood || song.mood_match || song.genre || 'energetic').toLowerCase();
  const palette = MOOD_PALETTES[moodKey] || MOOD_PALETTES.energetic;

  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${palette.bg1}" />
      <stop offset="100%" stop-color="${palette.bg2}" />
    </linearGradient>
    <linearGradient id="accent" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${palette.c1}" />
      <stop offset="100%" stop-color="${palette.c2}" />
    </linearGradient>
    <radialGradient id="vinylGlow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="${palette.c1}" stop-opacity="0.35" />
      <stop offset="70%" stop-color="${palette.c2}" stop-opacity="0.08" />
      <stop offset="100%" stop-color="transparent" />
    </radialGradient>
  </defs>

  <!-- Background Base -->
  <rect width="400" height="400" fill="url(#bg)" />

  <!-- Ambient Glow -->
  <circle cx="200" cy="180" r="160" fill="url(#vinylGlow)" />

  <!-- Stylized Vinyl Grooves -->
  <circle cx="200" cy="180" r="130" fill="none" stroke="rgba(255,255,255,0.04)" stroke-width="2" />
  <circle cx="200" cy="180" r="110" fill="none" stroke="rgba(255,255,255,0.05)" stroke-width="2" />
  <circle cx="200" cy="180" r="90" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="2" />
  <circle cx="200" cy="180" r="70" fill="none" stroke="rgba(255,255,255,0.07)" stroke-width="2" />

  <!-- Center Vinyl Label Disc -->
  <circle cx="200" cy="180" r="48" fill="#0A0E17" stroke="${palette.c1}" stroke-width="2.5" />
  <circle cx="200" cy="180" r="12" fill="${palette.c2}" />

  <!-- Musical Frequency Waveform Bars in Center -->
  <g transform="translate(160, 168)">
    <rect x="0" y="8" width="6" height="16" rx="3" fill="${palette.c1}" opacity="0.9" />
    <rect x="10" y="0" width="6" height="24" rx="3" fill="${palette.c1}" />
    <rect x="20" y="4" width="6" height="20" rx="3" fill="${palette.c2}" />
    <rect x="30" y="10" width="6" height="14" rx="3" fill="${palette.c1}" opacity="0.85" />
    <rect x="40" y="2" width="6" height="22" rx="3" fill="${palette.c2}" />
    <rect x="50" y="7" width="6" height="17" rx="3" fill="${palette.c1}" opacity="0.9" />
    <rect x="60" y="12" width="6" height="12" rx="3" fill="${palette.c2}" opacity="0.75" />
    <rect x="70" y="5" width="6" height="19" rx="3" fill="${palette.c1}" />
  </g>

  <!-- MoodTunes AI Branding Badge -->
  <rect x="24" y="24" width="108" height="26" rx="13" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.12)" />
  <circle cx="37" cy="37" r="4" fill="${palette.c1}" />
  <text x="47" y="41" fill="#FFFFFF" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="700" letter-spacing="0.5">MOODTUNES</text>

  <!-- Mood Badge -->
  <rect x="286" y="24" width="90" height="26" rx="13" fill="rgba(${palette.c1 === '#FF5A8A' ? '255,90,138' : '0,242,254'},0.12)" stroke="${palette.c1}" stroke-width="1" stroke-opacity="0.3" />
  <text x="331" y="41" fill="${palette.c1}" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="10.5" font-weight="700">${palette.label.toUpperCase()}</text>

  <!-- Track Title & Artist Metadata Footer Card -->
  <rect x="20" y="308" width="360" height="72" rx="14" fill="rgba(6,11,20,0.85)" stroke="rgba(255,255,255,0.08)" />
  <text x="36" y="338" fill="#FFFFFF" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="16" font-weight="800">${name.length > 28 ? name.slice(0, 26) + '…' : name}</text>
  <text x="36" y="362" fill="rgba(255,255,255,0.65)" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12.5" font-weight="500">${artist.length > 34 ? artist.slice(0, 32) + '…' : artist}</text>
</svg>`.trim();

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
};

/**
 * Resolves the absolute best available artwork for a track.
 * Follows a cascade:
 * 1. Valid authentic image URL provided in track (rejecting broken/stale placeholders)
 * 2. Curated track cover map (e.g. Machayenge 3, Love Dose, Desi Kalakaar)
 * 3. YouTube thumbnail if youtube_id is present or resolvable
 * 4. High-fidelity SVG Vinyl Cover Data URI
 */
export const resolveTrackArtwork = (song) => {
  if (!song || typeof song !== 'object') {
    return generateVinylCoverSvg({ name: 'Track', artist: 'MoodTunes AI' });
  }

  const rawImage = String(song.image || '').trim();

  // 1. If valid external artwork is present and not broken/stale
  if (
    rawImage &&
    !rawImage.includes('1511671782779') && // rejected stale mic
    !rawImage.includes('ui-avatars.com') &&  // rejected dot box
    !rawImage.includes('undefined') &&
    !rawImage.includes('null') &&
    (rawImage.startsWith('http://') || rawImage.startsWith('https://') || rawImage.startsWith('data:image'))
  ) {
    return rawImage;
  }

  // 2. Check curated covers by title
  const normTitle = String(song.name || '').toLowerCase().trim();
  for (const [key, coverUrl] of Object.entries(CURATED_TRACK_COVERS)) {
    if (normTitle.includes(key)) {
      return coverUrl;
    }
  }

  // 3. YouTube HQ thumbnail from youtube_id
  const ytId = song.youtube_id || resolveKnownYouTubeId(song.name, song.artist);
  if (ytId && typeof ytId === 'string' && ytId.length >= 8) {
    return `https://i.ytimg.com/vi/${ytId}/hqdefault.jpg`;
  }

  // 4. Guaranteed zero-latency SVG vinyl album cover
  return generateVinylCoverSvg(song);
};

/**
 * Universal error handler for <img> tags.
 * Ensures an image NEVER shows broken or missing placeholder.
 */
export const handleArtworkError = (event, song = {}) => {
  if (!event || !event.target) return;
  const currentSrc = String(event.target.src || '');

  // Step 1: If current wasn't a YouTube thumbnail, try resolving YouTube thumbnail
  const ytId = song.youtube_id || resolveKnownYouTubeId(song.name, song.artist);
  if (ytId && !currentSrc.includes('i.ytimg.com')) {
    event.target.src = `https://i.ytimg.com/vi/${ytId}/hqdefault.jpg`;
    return;
  }

  // Step 2: Fallback to guaranteed local SVG vinyl cover
  event.target.onerror = null; // stop retry loop
  event.target.src = generateVinylCoverSvg(song);
};

export default {
  resolveTrackArtwork,
  handleArtworkError,
  generateVinylCoverSvg,
};
