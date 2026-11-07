/**
 * User-Scoped Storage Utility
 * Guarantees that playback history and playlist songs are strictly isolated per user account.
 * When a user logs in with a different email, they never see another user's history or playlist tracks.
 */

export const getUserStorageKey = (prefix, user) => {
  let resolvedUser = user;
  if (!resolvedUser) {
    try {
      const raw = localStorage.getItem('user');
      resolvedUser = raw ? JSON.parse(raw) : null;
    } catch (e) {
      resolvedUser = null;
    }
  }

  if (!resolvedUser || resolvedUser.isGuest) {
    return `${prefix}_guest`;
  }

  const userIdentifier = String(
    resolvedUser.email || resolvedUser.id || 'default'
  )
    .toLowerCase()
    .trim();

  return `${prefix}_${userIdentifier}`;
};

/**
 * Gets user-scoped playback history (strictly past 20 played tracks)
 */
export const getUserHistory = (user) => {
  try {
    const key = getUserStorageKey('playbackHistory', user);
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.slice(0, 20) : [];
  } catch (e) {
    return [];
  }
};

/**
 * Saves user-scoped playback history
 */
export const saveUserHistory = (history, user) => {
  try {
    const key = getUserStorageKey('playbackHistory', user);
    localStorage.setItem(key, JSON.stringify((history || []).slice(0, 20)));
  } catch (e) {}
};

/**
 * Clears user-scoped playback history
 */
export const clearUserHistory = (user) => {
  try {
    const key = getUserStorageKey('playbackHistory', user);
    localStorage.removeItem(key);
    // Also clean up old global key if any exists
    localStorage.removeItem('playbackHistory');
  } catch (e) {}
};

/**
 * Gets user-scoped playlist songs.
 * Returns empty array [] if this user hasn't added songs to this playlist yet.
 */
export const getUserPlaylistSongs = (playlistId, user) => {
  if (!playlistId) return [];
  try {
    const key = getUserStorageKey(`playlist_user_songs_${playlistId}`, user);
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    return [];
  }
};

/**
 * Saves user-scoped playlist songs.
 */
export const saveUserPlaylistSongs = (playlistId, songs, user) => {
  if (!playlistId) return;
  try {
    const key = getUserStorageKey(`playlist_user_songs_${playlistId}`, user);
    localStorage.setItem(key, JSON.stringify(songs || []));
  } catch (e) {}
};

/**
 * Gets user-scoped custom playlists list
 */
export const getUserCustomPlaylists = (user) => {
  try {
    const key = getUserStorageKey('user_custom_playlists', user);
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    return [];
  }
};

/**
 * Saves user-scoped custom playlists list
 */
export const saveUserCustomPlaylists = (playlists, user) => {
  try {
    const key = getUserStorageKey('user_custom_playlists', user);
    localStorage.setItem(key, JSON.stringify(playlists || []));
  } catch (e) {}
};
