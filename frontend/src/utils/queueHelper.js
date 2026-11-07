import axios from 'axios';
import { API_BASE_URL } from '../config/api';
import { playSong, setQueue, addToPlayNext, addToQueue } from '../store/audioSlice';

// Rich backup pool of well-known, high-quality songs across all moods/genres
const FALLBACK_SIMILAR_TRACKS = [
  { name: 'Kesariya', artist: 'Arijit Singh', mood_match: 'romantic', duration: 268, youtube_id: 'BddP6PYo2gs', image: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=200&auto=format&fit=crop&q=80' },
  { name: 'Raataan Lambiyan', artist: 'Jubin Nautiyal, Asees Kaur', mood_match: 'romantic', duration: 230, youtube_id: 'gvyUuxdRdR4', image: 'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=200&auto=format&fit=crop&q=80' },
  { name: 'Apna Bana Le', artist: 'Arijit Singh', mood_match: 'romantic', duration: 261, youtube_id: 'ElZfdU54Cp8', image: 'https://images.unsplash.com/photo-1518895949257-7621c3c786d7?w=200&auto=format&fit=crop&q=80' },
  { name: 'Ilahi', artist: 'Arijit Singh', mood_match: 'happy', duration: 228, youtube_id: 'fdubeMFwuGs', image: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=200&auto=format&fit=crop&q=80' },
  { name: 'Tum Hi Ho', artist: 'Arijit Singh', mood_match: 'sad', duration: 262, youtube_id: 'IJq0yyWug1k', image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=200&auto=format&fit=crop&q=80' },
  { name: 'Kabira', artist: 'Tochi Raina, Rekha Bhardwaj', mood_match: 'calm', duration: 251, youtube_id: 'jHNNMj5bNQw', image: 'https://images.unsplash.com/photo-1507838153414-b4b713384a76?w=200&auto=format&fit=crop&q=80' },
  { name: 'Kun Faya Kun', artist: 'A.R. Rahman, Javed Ali', mood_match: 'calm', duration: 473, youtube_id: 'T94PHkuydcw', image: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=200&auto=format&fit=crop&q=80' },
  { name: 'Agar Tum Saath Ho', artist: 'Alka Yagnik, Arijit Singh', mood_match: 'sad', duration: 341, youtube_id: 'sK7riqg2mr4', image: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=200&auto=format&fit=crop&q=80' },
  { name: 'Boom Shaka', artist: 'KR$NA', mood_match: 'energetic', duration: 178, youtube_id: '9lZJ0iGjYgU', image: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=200&auto=format&fit=crop&q=80' },
  { name: 'Ghoomar', artist: 'Shreya Ghoshal', mood_match: 'energetic', duration: 282, youtube_id: '6c3XvpF5qZ8', image: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=200&auto=format&fit=crop&q=80' },
  { name: 'Weightless', artist: 'Marconi Union', mood_match: 'calm', duration: 485, youtube_id: 'UfcAVejslrU', image: 'https://images.unsplash.com/photo-1518495973542-4542c06a5843?w=200&auto=format&fit=crop&q=80' },
  { name: 'Clair de Lune', artist: 'Claude Debussy', mood_match: 'focus', duration: 304, youtube_id: 'WNcsUNKlAKw', image: 'https://images.unsplash.com/photo-1520523839898-507127083040?w=200&auto=format&fit=crop&q=80' },
  { name: 'Lofi Study Beat', artist: 'ChilledCow', mood_match: 'focus', duration: 240, youtube_id: 'jfKfPfyJRdk', image: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=200&auto=format&fit=crop&q=80' },
  { name: 'Midnight City', artist: 'M83', mood_match: 'energetic', duration: 244, youtube_id: 'dX3k_QDnzHE', image: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=200&auto=format&fit=crop&q=80' },
  { name: 'Starboy', artist: 'The Weeknd', mood_match: 'energetic', duration: 230, youtube_id: '34Na4j8AVgA', image: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=200&auto=format&fit=crop&q=80' },
  { name: 'Night Owl Ambient', artist: 'Lo-Fi Chill', mood_match: 'calm', duration: 195, youtube_id: 'jfKfPfyJRdk', image: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=200&auto=format&fit=crop&q=80' },
  { name: 'Levitating', artist: 'Dua Lipa', mood_match: 'happy', duration: 203, youtube_id: 'TUVcZfQe-Kw', image: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=200&auto=format&fit=crop&q=80' },
  { name: 'Sunflower', artist: 'Post Malone, Swae Lee', mood_match: 'happy', duration: 158, youtube_id: 'ApXoWvfEYVU', image: 'https://images.unsplash.com/photo-1464375117522-1311d6a5b81f?w=200&auto=format&fit=crop&q=80' },
  { name: 'Channa Mereya', artist: 'Arijit Singh', mood_match: 'sad', duration: 289, youtube_id: '284Ov7ysmfA', image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=200&auto=format&fit=crop&q=80' },
  { name: 'Hawayein', artist: 'Arijit Singh', mood_match: 'romantic', duration: 290, youtube_id: 'cYOB941gyXI', image: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=200&auto=format&fit=crop&q=80' }
];

/**
 * Seeds a Spotify-style queue: plays the selected song immediately, and recommends
 * 10 MORE songs in queue based on search/song context (total 11 songs).
 */
export const playSongWithSimilarQueue = async (dispatch, targetSong, totalQueueTarget = 11) => {
  if (!targetSong) return;

  // 1. Instantly play selected song
  dispatch(playSong(targetSong));

  const neededSimilar = Math.max(10, totalQueueTarget - 1); // strictly 10 more songs in queue
  let similarSongs = [];

  // 2. Query backend for similar tracks based on search/song
  try {
    const res = await axios.get(`${API_BASE_URL}/similar-songs`, {
      params: {
        song_name: targetSong.name,
        artist: targetSong.artist || '',
        limit: neededSimilar + 4,
      },
      timeout: 3500,
    });
    const fetched = res.data?.similar_songs || [];
    if (Array.isArray(fetched) && fetched.length > 0) {
      similarSongs = fetched
        .filter(
          (s) =>
            s.name &&
            s.name.toLowerCase() !== targetSong.name?.toLowerCase()
        )
        .map((s, idx) => ({
          ...s,
          id: s.id || `sim-${Date.now()}-${idx}`,
          image: s.image || targetSong.image || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=200&auto=format&fit=crop&q=80',
          mood_match: s.mood_match || targetSong.mood_match || 'happy',
        }));
    }
  } catch (e) {
    // Fallback: search by artist or mood
    try {
      const searchRes = await axios.get(`${API_BASE_URL}/search-music`, {
        params: {
          query: targetSong.artist || targetSong.mood_match || 'music',
          limit: neededSimilar + 4,
        },
        timeout: 3000,
      });
      const results = searchRes.data?.results || [];
      if (Array.isArray(results) && results.length > 0) {
        similarSongs = results
          .filter(
            (s) =>
              s.name &&
              s.name.toLowerCase() !== targetSong.name?.toLowerCase()
          )
          .map((s, idx) => ({
            ...s,
            id: s.id || `sim-${Date.now()}-${idx}`,
            mood_match: s.mood_match || targetSong.mood_match || 'happy',
          }));
      }
    } catch (err2) {}
  }

  // 3. Pad to guarantee exactly 10 more songs in queue using curated pool
  if (similarSongs.length < neededSimilar) {
    const currentMood = String(targetSong.mood_match || 'happy').toLowerCase();
    const moodMatches = FALLBACK_SIMILAR_TRACKS.filter((s) => s.mood_match === currentMood);
    const pool = moodMatches.length >= 5 ? moodMatches : FALLBACK_SIMILAR_TRACKS;

    pool.forEach((fallback) => {
      if (similarSongs.length < neededSimilar) {
        const isTarget = fallback.name.toLowerCase() === targetSong.name?.toLowerCase();
        const alreadyInList = similarSongs.some(
          (s) => s.name?.toLowerCase() === fallback.name.toLowerCase()
        );
        if (!isTarget && !alreadyInList) {
          similarSongs.push({
            ...fallback,
            id: `seed-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          });
        }
      }
    });
  }

  // 4. Set the queue with target song at index 0 followed by 10 recommended songs
  const finalQueue = [targetSong, ...similarSongs.slice(0, neededSimilar)];
  dispatch(setQueue(finalQueue));
};

/**
 * Inserts song to play next (right after currently playing track)
 */
export const handlePlayNext = (dispatch, song, callback) => {
  if (!song) return;
  dispatch(addToPlayNext(song));
  if (typeof callback === 'function') {
    callback(`↳ "${song.name}" will play next!`);
  }
};

/**
 * Appends song to the end of the playback queue
 */
export const handleAddToQueue = (dispatch, song, callback) => {
  if (!song) return;
  dispatch(addToQueue(song));
  if (typeof callback === 'function') {
    callback(`+ Added "${song.name}" to queue`);
  }
};
