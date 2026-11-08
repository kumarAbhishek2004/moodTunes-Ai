/**
 * Helper to clean and format track titles and artist names,
 * removing messy artifacts like empty brackets, dangling pipes, or trailing hyphens.
 */
export const cleanSongTitle = (title) => {
  if (!title) return '';
  return String(title)
    .replace(/\|\s*\(\s*\)/gi, '')
    .replace(/\(\s*\)/g, '')
    .replace(/\[\s*\]/g, '')
    .replace(/\s*\|\s*$/, '')
    .replace(/^\s*\|\s*/, '')
    .replace(/\s+-\s*$/, '')
    .replace(/\s+/g, ' ')
    .trim();
};
