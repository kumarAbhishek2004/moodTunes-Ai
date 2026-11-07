import { addToPlayNext, setElevationToast, markSongElevated } from '../store/audioSlice';

// Uplifting transitional songs curated to bridge low mood -> peace -> warm optimism -> joy
const ELEVATION_BRIDGE_SONGS = [
  {
    id: 'elevate-bridge-1',
    name: 'Safarnama',
    artist: 'Lucky Ali',
    mood_match: 'Calm',
    youtube_id: 'qP_VpX8C0p0',
    image: 'https://i.ytimg.com/vi/qP_VpX8C0p0/hqdefault.jpg',
    duration: 251,
    ai_explanation: 'AI DJ Transition 1: Gentle soothing acoustic textures to ease tension and ground emotions.',
  },
  {
    id: 'elevate-bridge-2',
    name: 'Apna Bana Le',
    artist: 'Arijit Singh',
    mood_match: 'Romantic',
    youtube_id: 'ElZfdU54Cp8',
    image: 'https://i.ytimg.com/vi/ElZfdU54Cp8/hqdefault.jpg',
    duration: 261,
    ai_explanation: 'AI DJ Transition 2: Warm, heartwarming vocal resonance to kindle emotional comfort.',
  },
  {
    id: 'elevate-bridge-3',
    name: 'Kesariya',
    artist: 'Arijit Singh',
    mood_match: 'Happy',
    youtube_id: 'BddP6PYo2gs',
    image: 'https://i.ytimg.com/vi/BddP6PYo2gs/hqdefault.jpg',
    duration: 268,
    ai_explanation: 'AI DJ Transition 3: Uplifting harmonic cadence to gently elevate your energy into brightness.',
  },
];

const LOW_MOOD_KEYWORDS = ['sad', 'melancholic', 'gloomy', 'depressed', 'grief', 'heartbroken', 'lonely'];

/**
 * Checks if a song corresponds to a low/sad mood
 */
const isLowMoodSong = (song) => {
  if (!song) return false;
  const mood = String(song.mood_match || song.detected_mood || song.mood || '').toLowerCase();
  const name = String(song.name || '').toLowerCase();
  return LOW_MOOD_KEYWORDS.some((kw) => mood.includes(kw)) || name.includes('channa mereya') || name.includes('agar tum');
};

/**
 * checkAndTriggerMoodElevation
 * Scans playback history and subtly nudges queue if listener is caught in a melancholic spiral.
 */
export const checkAndTriggerMoodElevation = (dispatch, state) => {
  const {
    playbackHistory,
    currentSong,
    smartMoodElevation,
    queue,
  } = state?.audio || {};

  if (!smartMoodElevation?.enabled) return false;
  if (!playbackHistory || playbackHistory.length < 4) return false;

  // Don't elevate again for the exact same track
  if (currentSong?.id && smartMoodElevation.lastElevatedSongId === currentSong.id) {
    return false;
  }

  // Look at the latest 4 tracks played
  const recentTracks = playbackHistory.slice(0, 4);
  const lowMoodCount = recentTracks.filter(isLowMoodSong).length;

  // If 3 or 4 of the past 4 songs are sad/melancholic
  if (lowMoodCount >= 3) {
    // Check if upcoming queue already has elevation songs
    const alreadyQueued = queue?.some((s) => s.id?.startsWith('elevate-bridge'));
    if (alreadyQueued) return false;

    // Dispatch elevation songs to play next in sequence (in reverse order so first is next)
    for (let i = ELEVATION_BRIDGE_SONGS.length - 1; i >= 0; i--) {
      dispatch(addToPlayNext(ELEVATION_BRIDGE_SONGS[i]));
    }

    if (currentSong?.id) {
      dispatch(markSongElevated(currentSong.id));
    }

    dispatch(
      setElevationToast({
        title: '🧠 AI DJ Smart Mood Elevation',
        description:
          'Noticed a melancholic streak. Nudging your queue with warm, uplifting acoustic vibes to gently lift your energy.',
      })
    );

    return true;
  }

  return false;
};
