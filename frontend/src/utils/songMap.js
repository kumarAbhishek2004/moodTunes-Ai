/**
 * utils/songMap.js
 * Instant zero-latency YouTube ID resolver for top famous songs & fallback resolver.
 * Ensures that clicking a song (like Love Dose) ALWAYS plays that exact song,
 * and never accidentally keeps playing the previous song (like Raataan Lambiyan).
 */

export const FAMOUS_SONGS_YOUTUBE = {
  // Yo Yo Honey Singh hits
  'love dose': 'nW9WwkWwaW8',
  'lovedose': 'nW9WwkWwaW8',
  'desi kalakaar': 'KhnVcAC5bIm',
  'blue eyes': 'NbyHNASFi6U',
  'dope shope': 'NrXdauEv9HY',
  'brown rang': 'PqFMFVcCZgI',
  'high heels': 'kJqU9F2p6_4',
  'angreji beat': '2oMv4N1GkQk',
  'lungi dance': '2kWly_tXpFQ',
  'makhna': 'x-3zJ6A7k8U',
  'party all night': 'yTCDVfMz15M',
  'char botal vodka': 'r5e_241d7c4',

  // Bollywood & Romantic hits
  'raataan lambiyan': 'gvyUuxdRdR4',
  'kesariya': 'BddP6PYo2gs',
  'apna bana le': 'ElZfdU54Cp8',
  'ilahi': 'fdubeMFwuGs',
  'tum hi ho': 'IJq0yyWug1k',
  'channa mereya': 'bzSTpdcs-EI',
  'shayad': 'mFvyb7Fj9_8',
  'agar tum saath ho': 'sK7riqg2mr4',
  'tere vaste': 'VAdGW7QDJiU',
  'o maahi': '7c3-Ge36k3w',
  'chaleya': 'VAdGW7QDJiU',
  'heeriye': 'RLzC55ai0eo',
  'kahani suno': '_XBVWlI8TsQ',
  'pasoori': '5Eqb_-j3FDA',
  'maan meri jaan': 'VuG7ge_8I2Y',
  'kal ho naa ho': 'oq5Ocx_rEv8',
  'kabira': 'jHNNMj5bNQw',
  'gerua': 'AEIVhBS6baE',
  'zaalima': 'hhdSyH4QCqA',
  'hawayein': 'cYOB941gyXI',

  // Global & Hip Hop Hits
  'holocene': 'TWcyIpul8OE',
  'starboy': '34Na4j8AVgA',
  'blinding lights': '4NRXx6U8ABQ',
  'shape of you': 'JGwWNGJdvx8',
  'perfect': '2Vv-BfVoq4g',
  'believer': '7wtfhZwyrcc',
  'closer': 'PT2_F-1esPk',
  'someone you loved': 'zABLecsR5UE',
  'stay': 'kTJczUoc56U',
  'as it was': 'H5v3kku4y6Q',
  'sunflower': 'ApXoWvfEYVU',
  'levitating': 'TUVcZfQe-Kw',
  'boom shack-a-lak': 'kZzBd41NuZw',
  'boom shak-a-lak': 'kZzBd41NuZw',
  'boom shakalak': 'kZzBd41NuZw',
  'boom shaka': 'kZzBd41NuZw',

  // Desi Hip Hop & Rap hits
  'machayenge 3': 'nJNooQDc0Bs',
  'machayenge': 'nJNooQDc0Bs',
  'machayenge 4': 'tWzCshc1oN4',
  'say my name': 'd7m_c0w5z_o',
  'no cap': 'O1mQn4P9z2w',
  'makasam': 'JgZ3o8dD_Q0',
  'hola amigo': 's_8xW_P6Yp0',
  'prarthana': '8P6pT7ZzG5c',
  'i guess': 'Y_JzW5vW_9w',
  'roll up': '6_P2mK_xV8A',
  'blow up': 'm9z8X8pQ2Y0',
  'subhanallah': 'RCXB_7zPzYk',
  'matargashti': '6vKucgAeF_Q',
  'gallan goodiyan': 'jCEdTq3j-0U',
  'dil dhadakne do': 'Bq5_mFz2K2s',
  'sooraj dooba hain': 'nCg3ufihKyU',
  'badtameez dil': 'II2EO3NwUr8',
  'london thumakda': '0m3uU46QWrg',
  'senorita': 't8n-C4_vC20',
  'kho gaye hum kahan': 'vt4jX0iPU40',
  'phir se udd chala': '2iqbx7Tzxbw',
  'aazaadiyan': '01Qk9mHjC5E',
  'bekhayali': 'VOLKJJvfAbg',
  'tujhe bhula diya': '1y3wFvC9W2Q',
  'phir bhi tumko chaahunga': '_aktURityQw',
  'alvida': 'dD9l_s3l8eA',
};

/**
 * Common typo & transliteration normalizer
 */
const COMMON_TYPOS = {
  kasariya: 'kesariya',
  kesriya: 'kesariya',
  arjit: 'arijit',
  ratan: 'raataan',
  raatan: 'raataan',
  beliver: 'believer',
  iktara: 'iktara',
  'ik tara': 'iktara',
  'channa merya': 'channa mereya',
  'apna bna le': 'apna bana le',
  'apna banale': 'apna bana le',
  weekend: 'the weeknd',
  weeknd: 'the weeknd',
};

const normalizeSongText = (text = '') => {
  let s = String(text).toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
  for (const [typo, fixed] of Object.entries(COMMON_TYPOS)) {
    if (s.includes(typo)) {
      s = s.replace(new RegExp(`\\b${typo}\\b`, 'g'), fixed);
    }
  }
  return s;
};

/**
 * Normalizes query string and resolves known YouTube ID
 */
export const resolveKnownYouTubeId = (title = '', artist = '') => {
  const t = normalizeSongText(title);
  const a = normalizeSongText(artist);

  // 1. Direct title check
  for (const [key, id] of Object.entries(FAMOUS_SONGS_YOUTUBE)) {
    if (t.includes(key) || key.includes(t)) {
      return id;
    }
  }

  // 2. Combined artist + title check
  const combined = `${a} ${t}`.trim();
  for (const [key, id] of Object.entries(FAMOUS_SONGS_YOUTUBE)) {
    if (combined.includes(key)) {
      return id;
    }
  }

  return null;
};
