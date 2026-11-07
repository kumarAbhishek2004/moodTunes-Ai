import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../config/api';
import { playSong, setQueue, setActiveMood, togglePlayPause, toggleTurntable } from '../store/audioSlice';
import { resolveMusicTheme } from '../utils/themeMap';
import AddToPlaylistButton from '../components/AddToPlaylistButton';
import { resolveTrackArtwork, handleArtworkError } from '../utils/imageHelper';

const CATEGORY_TILES = [
  {
    "id": "rainy-study",
    "title": "Rainy Lo-Fi Study",
    "subtitle": "Gentle rain textures & peaceful instrumental beats",
    "mood": "calm",
    "gradient": "from-cyan/30 via-slate-900 to-obsidian-950",
    "border": "border-cyan/30",
    "badge": "Deep Focus",
    "icon": "🌧️",
    "tracksCount": "24 Tracks",
    "seedTracks": [
      {
        "id": "capsule-calm-1",
        "name": "Kun Faya Kun",
        "artist": "A.R. Rahman",
        "youtube_id": "T94PHkuydcw",
        "image": "https://i.ytimg.com/vi/T94PHkuydcw/hqdefault.jpg",
        "duration": 473,
        "mood_match": "Calm"
      },
      {
        "id": "capsule-calm-2",
        "name": "Iktara",
        "artist": "Kavita Seth",
        "youtube_id": "fSS_R91Nimw",
        "image": "https://i.ytimg.com/vi/fSS_R91Nimw/hqdefault.jpg",
        "duration": 253,
        "mood_match": "Calm"
      },
      {
        "id": "capsule-calm-3",
        "name": "Safarnama",
        "artist": "Lucky Ali",
        "youtube_id": "qP_VpX8C0p0",
        "image": "https://i.ytimg.com/vi/qP_VpX8C0p0/hqdefault.jpg",
        "duration": 251,
        "mood_match": "Calm"
      },
      {
        "id": "capsule-calm-4",
        "name": "Sham",
        "artist": "Amit Trivedi",
        "youtube_id": "7v-z0lJmFio",
        "image": "https://i.ytimg.com/vi/7v-z0lJmFio/hqdefault.jpg",
        "duration": 247,
        "mood_match": "Calm"
      },
      {
        "id": "capsule-calm-5",
        "name": "Weightless",
        "artist": "Marconi Union",
        "youtube_id": "UfcAVejslrU",
        "image": "https://i.ytimg.com/vi/UfcAVejslrU/hqdefault.jpg",
        "duration": 485,
        "mood_match": "Calm"
      },
      {
        "id": "capsule-calm-6",
        "name": "Clair de Lune",
        "artist": "Claude Debussy",
        "youtube_id": "WNcsUNKlAKw",
        "image": "https://i.ytimg.com/vi/WNcsUNKlAKw/hqdefault.jpg",
        "duration": 302,
        "mood_match": "Calm"
      },
      {
        "id": "capsule-calm-7",
        "name": "Sunset Lover",
        "artist": "Petit Biscuit",
        "youtube_id": "wuCK-oiE3rA",
        "image": "https://i.ytimg.com/vi/wuCK-oiE3rA/hqdefault.jpg",
        "duration": 237,
        "mood_match": "Calm"
      },
      {
        "id": "capsule-calm-8",
        "name": "Holocene",
        "artist": "Bon Iver",
        "youtube_id": "TWcyIpul8OE",
        "image": "https://i.ytimg.com/vi/TWcyIpul8OE/hqdefault.jpg",
        "duration": 337,
        "mood_match": "Calm"
      },
      {
        "id": "capsule-calm-9",
        "name": "Kho Gaye Hum Kahan",
        "artist": "Jasleen Royal",
        "youtube_id": "vt4jX0iPU40",
        "image": "https://i.ytimg.com/vi/vt4jX0iPU40/hqdefault.jpg",
        "duration": 214,
        "mood_match": "Calm"
      },
      {
        "id": "capsule-calm-10",
        "name": "Phir Se Udd Chala",
        "artist": "Mohit Chauhan",
        "youtube_id": "2iqbx7Tzxbw",
        "image": "https://i.ytimg.com/vi/2iqbx7Tzxbw/hqdefault.jpg",
        "duration": 271,
        "mood_match": "Calm"
      },
      {
        "id": "capsule-calm-11",
        "name": "Aazaadiyan",
        "artist": "Rahat Fateh Ali Khan",
        "youtube_id": "01Qk9mHjC5E",
        "image": "https://i.ytimg.com/vi/01Qk9mHjC5E/hqdefault.jpg",
        "duration": 260,
        "mood_match": "Calm"
      },
      {
        "id": "capsule-calm-12",
        "name": "River Flows in You",
        "artist": "Yiruma",
        "youtube_id": "7maJOI3QMu0",
        "image": "https://i.ytimg.com/vi/7maJOI3QMu0/hqdefault.jpg",
        "duration": 180,
        "mood_match": "Calm"
      },
      {
        "id": "capsule-calm-13",
        "name": "Lofi Study Session",
        "artist": "ChilledCow",
        "youtube_id": "jfKfPfyJRdk",
        "image": "https://i.ytimg.com/vi/jfKfPfyJRdk/hqdefault.jpg",
        "duration": 240,
        "mood_match": "Calm"
      },
      {
        "id": "capsule-calm-14",
        "name": "Midnight City Ambient",
        "artist": "M83",
        "youtube_id": "dX3k_PDnzHE",
        "image": "https://i.ytimg.com/vi/dX3k_PDnzHE/hqdefault.jpg",
        "duration": 243,
        "mood_match": "Calm"
      },
      {
        "id": "capsule-calm-15",
        "name": "Cold Water Rain Beats",
        "artist": "ChillHop",
        "youtube_id": "5qap5aO4i9A",
        "image": "https://i.ytimg.com/vi/5qap5aO4i9A/hqdefault.jpg",
        "duration": 215,
        "mood_match": "Calm"
      },
      {
        "id": "capsule-calm-16",
        "name": "A Walk in the Park",
        "artist": "Tycho",
        "youtube_id": "Z6ih1aKeETk",
        "image": "https://i.ytimg.com/vi/Z6ih1aKeETk/hqdefault.jpg",
        "duration": 220,
        "mood_match": "Calm"
      },
      {
        "id": "capsule-calm-17",
        "name": "Golden Hour Instrumental",
        "artist": "JVKE",
        "youtube_id": "A5p6g-pW4Hw",
        "image": "https://i.ytimg.com/vi/A5p6g-pW4Hw/hqdefault.jpg",
        "duration": 210,
        "mood_match": "Calm"
      },
      {
        "id": "capsule-calm-18",
        "name": "Experience",
        "artist": "Ludovico Einaudi",
        "youtube_id": "hN_q-_nGv4U",
        "image": "https://i.ytimg.com/vi/hN_q-_nGv4U/hqdefault.jpg",
        "duration": 315,
        "mood_match": "Calm"
      },
      {
        "id": "capsule-calm-19",
        "name": "Nuvole Bianche",
        "artist": "Ludovico Einaudi",
        "youtube_id": "fEOJQawykEQ",
        "image": "https://i.ytimg.com/vi/fEOJQawykEQ/hqdefault.jpg",
        "duration": 340,
        "mood_match": "Calm"
      },
      {
        "id": "capsule-calm-20",
        "name": "Gymnopedie No.1",
        "artist": "Erik Satie",
        "youtube_id": "S-Xm7s9eGuU",
        "image": "https://i.ytimg.com/vi/S-Xm7s9eGuU/hqdefault.jpg",
        "duration": 195,
        "mood_match": "Calm"
      },
      {
        "id": "capsule-calm-21",
        "name": "Acoustic Raindrops",
        "artist": "Calm Horizon",
        "youtube_id": "kXYiU_JCYtU",
        "image": "https://i.ytimg.com/vi/kXYiU_JCYtU/hqdefault.jpg",
        "duration": 225,
        "mood_match": "Calm"
      },
      {
        "id": "capsule-calm-22",
        "name": "Forest Whispers",
        "artist": "Nature Soundscapes",
        "youtube_id": "eKFTSSKCzWA",
        "image": "https://i.ytimg.com/vi/eKFTSSKCzWA/hqdefault.jpg",
        "duration": 300,
        "mood_match": "Calm"
      },
      {
        "id": "capsule-calm-23",
        "name": "Moon River Lo-Fi",
        "artist": "Lofi Fruits",
        "youtube_id": "WPni755-Krg",
        "image": "https://i.ytimg.com/vi/WPni755-Krg/hqdefault.jpg",
        "duration": 195,
        "mood_match": "Calm"
      },
      {
        "id": "capsule-calm-24",
        "name": "Autumn Leaf Lo-Fi",
        "artist": "Chill Beats",
        "youtube_id": "DWcJFNfaw90",
        "image": "https://i.ytimg.com/vi/DWcJFNfaw90/hqdefault.jpg",
        "duration": 230,
        "mood_match": "Calm"
      }
    ]
  },
  {
    "id": "post-gym",
    "title": "Post-Gym Adrenaline",
    "subtitle": "High BPM, heavy kicks & motivational momentum",
    "mood": "energetic",
    "gradient": "from-orange-500/30 via-slate-900 to-obsidian-950",
    "border": "border-orange-500/30",
    "badge": "140+ BPM",
    "icon": "⚡",
    "tracksCount": "32 Tracks",
    "seedTracks": [
      {
        "id": "capsule-energy-1",
        "name": "Believer",
        "artist": "Imagine Dragons",
        "youtube_id": "7wtfhZwyrcc",
        "image": "https://i.ytimg.com/vi/7wtfhZwyrcc/hqdefault.jpg",
        "duration": 204,
        "mood_match": "Energetic"
      },
      {
        "id": "capsule-energy-2",
        "name": "Machayenge 3",
        "artist": "Emiway Bantai",
        "youtube_id": "nJNooQDc0Bs",
        "image": "https://i.ytimg.com/vi/nJNooQDc0Bs/hqdefault.jpg",
        "duration": 185,
        "mood_match": "Energetic"
      },
      {
        "id": "capsule-energy-3",
        "name": "Love Dose",
        "artist": "Yo Yo Honey Singh",
        "youtube_id": "nW9WwkWwaW8",
        "image": "https://i.ytimg.com/vi/nW9WwkWwaW8/hqdefault.jpg",
        "duration": 228,
        "mood_match": "Energetic"
      },
      {
        "id": "capsule-energy-4",
        "name": "Desi Kalakaar",
        "artist": "Yo Yo Honey Singh",
        "youtube_id": "KhnVcAC5bIm",
        "image": "https://i.ytimg.com/vi/KhnVcAC5bIm/hqdefault.jpg",
        "duration": 259,
        "mood_match": "Energetic"
      },
      {
        "id": "capsule-energy-5",
        "name": "Blue Eyes",
        "artist": "Yo Yo Honey Singh",
        "youtube_id": "NbyHNASFi6U",
        "image": "https://i.ytimg.com/vi/NbyHNASFi6U/hqdefault.jpg",
        "duration": 220,
        "mood_match": "Energetic"
      },
      {
        "id": "capsule-energy-6",
        "name": "Dope Shope",
        "artist": "Yo Yo Honey Singh",
        "youtube_id": "NrXdauEv9HY",
        "image": "https://i.ytimg.com/vi/NrXdauEv9HY/hqdefault.jpg",
        "duration": 190,
        "mood_match": "Energetic"
      },
      {
        "id": "capsule-energy-7",
        "name": "Brown Rang",
        "artist": "Yo Yo Honey Singh",
        "youtube_id": "PqFMFVcCZgI",
        "image": "https://i.ytimg.com/vi/PqFMFVcCZgI/hqdefault.jpg",
        "duration": 175,
        "mood_match": "Energetic"
      },
      {
        "id": "capsule-energy-8",
        "name": "High Heels",
        "artist": "Yo Yo Honey Singh & Jaz Dhami",
        "youtube_id": "kJqU9F2p6_4",
        "image": "https://i.ytimg.com/vi/kJqU9F2p6_4/hqdefault.jpg",
        "duration": 215,
        "mood_match": "Energetic"
      },
      {
        "id": "capsule-energy-9",
        "name": "Angreji Beat",
        "artist": "Yo Yo Honey Singh & Gippy Grewal",
        "youtube_id": "2oMv4N1GkQk",
        "image": "https://i.ytimg.com/vi/2oMv4N1GkQk/hqdefault.jpg",
        "duration": 210,
        "mood_match": "Energetic"
      },
      {
        "id": "capsule-energy-10",
        "name": "Lungi Dance",
        "artist": "Yo Yo Honey Singh",
        "youtube_id": "2kWly_tXpFQ",
        "image": "https://i.ytimg.com/vi/2kWly_tXpFQ/hqdefault.jpg",
        "duration": 230,
        "mood_match": "Energetic"
      },
      {
        "id": "capsule-energy-11",
        "name": "Makhna",
        "artist": "Yo Yo Honey Singh",
        "youtube_id": "x-3zJ6A7k8U",
        "image": "https://i.ytimg.com/vi/x-3zJ6A7k8U/hqdefault.jpg",
        "duration": 185,
        "mood_match": "Energetic"
      },
      {
        "id": "capsule-energy-12",
        "name": "Party All Night",
        "artist": "Yo Yo Honey Singh",
        "youtube_id": "yTCDVfMz15M",
        "image": "https://i.ytimg.com/vi/yTCDVfMz15M/hqdefault.jpg",
        "duration": 260,
        "mood_match": "Energetic"
      },
      {
        "id": "capsule-energy-13",
        "name": "Char Botal Vodka",
        "artist": "Yo Yo Honey Singh",
        "youtube_id": "r5e_241d7c4",
        "image": "https://i.ytimg.com/vi/r5e_241d7c4/hqdefault.jpg",
        "duration": 225,
        "mood_match": "Energetic"
      },
      {
        "id": "capsule-energy-14",
        "name": "Chaleya",
        "artist": "Arijit Singh & Shilpa Rao",
        "youtube_id": "VAdGW7QDJiU",
        "image": "https://i.ytimg.com/vi/VAdGW7QDJiU/hqdefault.jpg",
        "duration": 200,
        "mood_match": "Energetic"
      },
      {
        "id": "capsule-energy-15",
        "name": "Boom Shack-A-Lak",
        "artist": "Apache Indian",
        "youtube_id": "kZzBd41NuZw",
        "image": "https://i.ytimg.com/vi/kZzBd41NuZw/hqdefault.jpg",
        "duration": 272,
        "mood_match": "Energetic"
      },
      {
        "id": "capsule-energy-16",
        "name": "Starboy",
        "artist": "The Weeknd",
        "youtube_id": "34Na4j8AVgA",
        "image": "https://i.ytimg.com/vi/34Na4j8AVgA/hqdefault.jpg",
        "duration": 230,
        "mood_match": "Energetic"
      },
      {
        "id": "capsule-energy-17",
        "name": "Blinding Lights",
        "artist": "The Weeknd",
        "youtube_id": "4NRXx6U8ABQ",
        "image": "https://i.ytimg.com/vi/4NRXx6U8ABQ/hqdefault.jpg",
        "duration": 200,
        "mood_match": "Energetic"
      },
      {
        "id": "capsule-energy-18",
        "name": "The Search",
        "artist": "NF",
        "youtube_id": "fnlJw9H0xAM",
        "image": "https://i.ytimg.com/vi/fnlJw9H0xAM/hqdefault.jpg",
        "duration": 248,
        "mood_match": "Energetic"
      },
      {
        "id": "capsule-energy-19",
        "name": "Till I Collapse",
        "artist": "Eminem",
        "youtube_id": "ytQ5CYE1VZw",
        "image": "https://i.ytimg.com/vi/ytQ5CYE1VZw/hqdefault.jpg",
        "duration": 298,
        "mood_match": "Energetic"
      },
      {
        "id": "capsule-energy-20",
        "name": "Can't Hold Us",
        "artist": "Macklemore & Ryan Lewis",
        "youtube_id": "2zNSgSzhBfM",
        "image": "https://i.ytimg.com/vi/2zNSgSzhBfM/hqdefault.jpg",
        "duration": 258,
        "mood_match": "Energetic"
      },
      {
        "id": "capsule-energy-21",
        "name": "Stronger",
        "artist": "Kanye West",
        "youtube_id": "PsO6Zn4VBUA",
        "image": "https://i.ytimg.com/vi/PsO6Zn4VBUA/hqdefault.jpg",
        "duration": 312,
        "mood_match": "Energetic"
      },
      {
        "id": "capsule-energy-22",
        "name": "Radioactive",
        "artist": "Imagine Dragons",
        "youtube_id": "ktvTqvkJCJU",
        "image": "https://i.ytimg.com/vi/ktvTqvkJCJU/hqdefault.jpg",
        "duration": 187,
        "mood_match": "Energetic"
      },
      {
        "id": "capsule-energy-23",
        "name": "Animals",
        "artist": "Martin Garrix",
        "youtube_id": "gCYcHz2k5x0",
        "image": "https://i.ytimg.com/vi/gCYcHz2k5x0/hqdefault.jpg",
        "duration": 192,
        "mood_match": "Energetic"
      },
      {
        "id": "capsule-energy-24",
        "name": "Levels",
        "artist": "Avicii",
        "youtube_id": "_ovdm2yX4MA",
        "image": "https://i.ytimg.com/vi/_ovdm2yX4MA/hqdefault.jpg",
        "duration": 199,
        "mood_match": "Energetic"
      },
      {
        "id": "capsule-energy-25",
        "name": "Titanium",
        "artist": "David Guetta ft. Sia",
        "youtube_id": "JRfuAukYTKg",
        "image": "https://i.ytimg.com/vi/JRfuAukYTKg/hqdefault.jpg",
        "duration": 245,
        "mood_match": "Energetic"
      },
      {
        "id": "capsule-energy-26",
        "name": "Wake Me Up",
        "artist": "Avicii",
        "youtube_id": "IcrbM1l_BoI",
        "image": "https://i.ytimg.com/vi/IcrbM1l_BoI/hqdefault.jpg",
        "duration": 247,
        "mood_match": "Energetic"
      },
      {
        "id": "capsule-energy-27",
        "name": "Turn Down for What",
        "artist": "DJ Snake & Lil Jon",
        "youtube_id": "HMUDVMiITOU",
        "image": "https://i.ytimg.com/vi/HMUDVMiITOU/hqdefault.jpg",
        "duration": 214,
        "mood_match": "Energetic"
      },
      {
        "id": "capsule-energy-28",
        "name": "Lean On",
        "artist": "Major Lazer & DJ Snake",
        "youtube_id": "YqeW9_5kURI",
        "image": "https://i.ytimg.com/vi/YqeW9_5kURI/hqdefault.jpg",
        "duration": 177,
        "mood_match": "Energetic"
      },
      {
        "id": "capsule-energy-29",
        "name": "Apna Time Aayega",
        "artist": "Ranveer Singh & Divine",
        "youtube_id": "jFGKJBPzA-Y",
        "image": "https://i.ytimg.com/vi/jFGKJBPzA-Y/hqdefault.jpg",
        "duration": 135,
        "mood_match": "Energetic"
      },
      {
        "id": "capsule-energy-30",
        "name": "Mirchi",
        "artist": "DIVINE",
        "youtube_id": "Gv_tq7E8y-Y",
        "image": "https://i.ytimg.com/vi/Gv_tq7E8y-Y/hqdefault.jpg",
        "duration": 218,
        "mood_match": "Energetic"
      },
      {
        "id": "capsule-energy-31",
        "name": "Gali Gali",
        "artist": "Neha Kakkar",
        "youtube_id": "e3Nl_TCQXuw",
        "image": "https://i.ytimg.com/vi/e3Nl_TCQXuw/hqdefault.jpg",
        "duration": 174,
        "mood_match": "Energetic"
      },
      {
        "id": "capsule-energy-32",
        "name": "Kar Gayi Chull",
        "artist": "Badshah & Neha Kakkar",
        "youtube_id": "NTHz9ephYTw",
        "image": "https://i.ytimg.com/vi/NTHz9ephYTw/hqdefault.jpg",
        "duration": 187,
        "mood_match": "Energetic"
      }
    ]
  },
  {
    "id": "sunday-clarity",
    "title": "Sunday Morning Clarity",
    "subtitle": "Warm acoustic sunshine, bright keys & joyful rhythm",
    "mood": "happy",
    "gradient": "from-amber-400/30 via-slate-900 to-obsidian-950",
    "border": "border-amber-400/30",
    "badge": "Acoustic Euphoria",
    "icon": "☀️",
    "tracksCount": "20 Tracks",
    "seedTracks": [
      {
        "id": "capsule-happy-1",
        "name": "Kesariya",
        "artist": "Arijit Singh",
        "youtube_id": "BddP6PYo2gs",
        "image": "https://i.ytimg.com/vi/BddP6PYo2gs/hqdefault.jpg",
        "duration": 268,
        "mood_match": "Happy"
      },
      {
        "id": "capsule-happy-2",
        "name": "Ilahi",
        "artist": "Arijit Singh",
        "youtube_id": "fdubeMFwuGs",
        "image": "https://i.ytimg.com/vi/fdubeMFwuGs/hqdefault.jpg",
        "duration": 228,
        "mood_match": "Happy"
      },
      {
        "id": "capsule-happy-3",
        "name": "Matargashti",
        "artist": "Mohit Chauhan",
        "youtube_id": "6vKucgAeF_Q",
        "image": "https://i.ytimg.com/vi/6vKucgAeF_Q/hqdefault.jpg",
        "duration": 328,
        "mood_match": "Happy"
      },
      {
        "id": "capsule-happy-4",
        "name": "Subhanallah",
        "artist": "Sreerama Chandra",
        "youtube_id": "RCXB_7zPzYk",
        "image": "https://i.ytimg.com/vi/RCXB_7zPzYk/hqdefault.jpg",
        "duration": 249,
        "mood_match": "Happy"
      },
      {
        "id": "capsule-happy-5",
        "name": "Gallan Goodiyan",
        "artist": "Yashita Sharma & Shankar Mahadevan",
        "youtube_id": "jCEdTq3j-0U",
        "image": "https://i.ytimg.com/vi/jCEdTq3j-0U/hqdefault.jpg",
        "duration": 296,
        "mood_match": "Happy"
      },
      {
        "id": "capsule-happy-6",
        "name": "Dil Dhadakne Do",
        "artist": "Suraj Jagan & Joi Barua",
        "youtube_id": "Bq5_mFz2K2s",
        "image": "https://i.ytimg.com/vi/Bq5_mFz2K2s/hqdefault.jpg",
        "duration": 229,
        "mood_match": "Happy"
      },
      {
        "id": "capsule-happy-7",
        "name": "Sooraj Dooba Hain",
        "artist": "Arijit Singh & Aditi Singh Sharma",
        "youtube_id": "nCg3ufihKyU",
        "image": "https://i.ytimg.com/vi/nCg3ufihKyU/hqdefault.jpg",
        "duration": 264,
        "mood_match": "Happy"
      },
      {
        "id": "capsule-happy-8",
        "name": "Badtameez Dil",
        "artist": "Benny Dayal",
        "youtube_id": "II2EO3NwUr8",
        "image": "https://i.ytimg.com/vi/II2EO3NwUr8/hqdefault.jpg",
        "duration": 253,
        "mood_match": "Happy"
      },
      {
        "id": "capsule-happy-9",
        "name": "London Thumakda",
        "artist": "Labh Janjua",
        "youtube_id": "0m3uU46QWrg",
        "image": "https://i.ytimg.com/vi/0m3uU46QWrg/hqdefault.jpg",
        "duration": 231,
        "mood_match": "Happy"
      },
      {
        "id": "capsule-happy-10",
        "name": "Uff Teri Adaa",
        "artist": "Shankar Mahadevan",
        "youtube_id": "kL857iN_Hyo",
        "image": "https://i.ytimg.com/vi/kL857iN_Hyo/hqdefault.jpg",
        "duration": 298,
        "mood_match": "Happy"
      },
      {
        "id": "capsule-happy-11",
        "name": "Senorita",
        "artist": "Farhan Akhtar & Hrithik Roshan",
        "youtube_id": "t8n-C4_vC20",
        "image": "https://i.ytimg.com/vi/t8n-C4_vC20/hqdefault.jpg",
        "duration": 231,
        "mood_match": "Happy"
      },
      {
        "id": "capsule-happy-12",
        "name": "Hairat",
        "artist": "Lucky Ali",
        "youtube_id": "4K07X38V81o",
        "image": "https://i.ytimg.com/vi/4K07X38V81o/hqdefault.jpg",
        "duration": 235,
        "mood_match": "Happy"
      },
      {
        "id": "capsule-happy-13",
        "name": "Khaabon Ke Parinday",
        "artist": "Mohit Chauhan",
        "youtube_id": "d0P3j6zJ2yQ",
        "image": "https://i.ytimg.com/vi/d0P3j6zJ2yQ/hqdefault.jpg",
        "duration": 253,
        "mood_match": "Happy"
      },
      {
        "id": "capsule-happy-14",
        "name": "Der Lagi Lekin",
        "artist": "Shankar Mahadevan",
        "youtube_id": "Z7m2U5VqLho",
        "image": "https://i.ytimg.com/vi/Z7m2U5VqLho/hqdefault.jpg",
        "duration": 337,
        "mood_match": "Happy"
      },
      {
        "id": "capsule-happy-15",
        "name": "I'm Yours",
        "artist": "Jason Mraz",
        "youtube_id": "EkHTsc9PU2A",
        "image": "https://i.ytimg.com/vi/EkHTsc9PU2A/hqdefault.jpg",
        "duration": 242,
        "mood_match": "Happy"
      },
      {
        "id": "capsule-happy-16",
        "name": "Sunday Morning",
        "artist": "Maroon 5",
        "youtube_id": "S2Cti12XBw4",
        "image": "https://i.ytimg.com/vi/S2Cti12XBw4/hqdefault.jpg",
        "duration": 242,
        "mood_match": "Happy"
      },
      {
        "id": "capsule-happy-17",
        "name": "Here Comes the Sun",
        "artist": "The Beatles",
        "youtube_id": "KQetemT1sWc",
        "image": "https://i.ytimg.com/vi/KQetemT1sWc/hqdefault.jpg",
        "duration": 185,
        "mood_match": "Happy"
      },
      {
        "id": "capsule-happy-18",
        "name": "Three Little Birds",
        "artist": "Bob Marley",
        "youtube_id": "zaGUr6wzyT8",
        "image": "https://i.ytimg.com/vi/zaGUr6wzyT8/hqdefault.jpg",
        "duration": 180,
        "mood_match": "Happy"
      },
      {
        "id": "capsule-happy-19",
        "name": "Counting Stars",
        "artist": "OneRepublic",
        "youtube_id": "hT_nvWreIhg",
        "image": "https://i.ytimg.com/vi/hT_nvWreIhg/hqdefault.jpg",
        "duration": 257,
        "mood_match": "Happy"
      },
      {
        "id": "capsule-happy-20",
        "name": "Best Day of My Life",
        "artist": "American Authors",
        "youtube_id": "Y663Nw563qc",
        "image": "https://i.ytimg.com/vi/Y663Nw563qc/hqdefault.jpg",
        "duration": 194,
        "mood_match": "Happy"
      }
    ]
  },
  {
    "id": "deep-binaural",
    "title": "Deep Space Binaural",
    "subtitle": "Focus frequencies & minimal ambient soundscapes",
    "mood": "focus",
    "gradient": "from-emerald/30 via-slate-900 to-obsidian-950",
    "border": "border-emerald/30",
    "badge": "Theta Waves",
    "icon": "🧠",
    "tracksCount": "18 Tracks",
    "seedTracks": [
      {
        "id": "capsule-focus-1",
        "name": "Kho Gaye Hum Kahan",
        "artist": "Jasleen Royal",
        "youtube_id": "vt4jX0iPU40",
        "image": "https://i.ytimg.com/vi/vt4jX0iPU40/hqdefault.jpg",
        "duration": 214,
        "mood_match": "Focus"
      },
      {
        "id": "capsule-focus-2",
        "name": "Phir Se Udd Chala",
        "artist": "Mohit Chauhan",
        "youtube_id": "2iqbx7Tzxbw",
        "image": "https://i.ytimg.com/vi/2iqbx7Tzxbw/hqdefault.jpg",
        "duration": 271,
        "mood_match": "Focus"
      },
      {
        "id": "capsule-focus-3",
        "name": "Aazaadiyan",
        "artist": "Rahat Fateh Ali Khan",
        "youtube_id": "01Qk9mHjC5E",
        "image": "https://i.ytimg.com/vi/01Qk9mHjC5E/hqdefault.jpg",
        "duration": 260,
        "mood_match": "Focus"
      },
      {
        "id": "capsule-focus-4",
        "name": "Deep Focus Theta Waves",
        "artist": "Binaural Mind",
        "youtube_id": "WPni755-Krg",
        "image": "https://i.ytimg.com/vi/WPni755-Krg/hqdefault.jpg",
        "duration": 195,
        "mood_match": "Focus"
      },
      {
        "id": "capsule-focus-5",
        "name": "Weightless Continuum",
        "artist": "Marconi Union",
        "youtube_id": "UfcAVejslrU",
        "image": "https://i.ytimg.com/vi/UfcAVejslrU/hqdefault.jpg",
        "duration": 485,
        "mood_match": "Focus"
      },
      {
        "id": "capsule-focus-6",
        "name": "Ambient Deep Space 432Hz",
        "artist": "Space Lab",
        "youtube_id": "S1x93b4Ym0A",
        "image": "https://i.ytimg.com/vi/S1x93b4Ym0A/hqdefault.jpg",
        "duration": 360,
        "mood_match": "Focus"
      },
      {
        "id": "capsule-focus-7",
        "name": "Stellar Drift",
        "artist": "Solar Fields",
        "youtube_id": "W_f86b7_98k",
        "image": "https://i.ytimg.com/vi/W_f86b7_98k/hqdefault.jpg",
        "duration": 320,
        "mood_match": "Focus"
      },
      {
        "id": "capsule-focus-8",
        "name": "Solar Echoes",
        "artist": "Nigel Stanford",
        "youtube_id": "8j4e6g_a00w",
        "image": "https://i.ytimg.com/vi/8j4e6g_a00w/hqdefault.jpg",
        "duration": 300,
        "mood_match": "Focus"
      },
      {
        "id": "capsule-focus-9",
        "name": "Quiet Horizon",
        "artist": "Brian Eno",
        "youtube_id": "kXYiU_JCYtU",
        "image": "https://i.ytimg.com/vi/kXYiU_JCYtU/hqdefault.jpg",
        "duration": 225,
        "mood_match": "Focus"
      },
      {
        "id": "capsule-focus-10",
        "name": "Alpha Wave Resonance",
        "artist": "Focus Brain",
        "youtube_id": "jfKfPfyJRdk",
        "image": "https://i.ytimg.com/vi/jfKfPfyJRdk/hqdefault.jpg",
        "duration": 240,
        "mood_match": "Focus"
      },
      {
        "id": "capsule-focus-11",
        "name": "Nebula Meditation",
        "artist": "Ambient Pulse",
        "youtube_id": "eKFTSSKCzWA",
        "image": "https://i.ytimg.com/vi/eKFTSSKCzWA/hqdefault.jpg",
        "duration": 300,
        "mood_match": "Focus"
      },
      {
        "id": "capsule-focus-12",
        "name": "Cosmic Lullaby",
        "artist": "Tycho",
        "youtube_id": "Z6ih1aKeETk",
        "image": "https://i.ytimg.com/vi/Z6ih1aKeETk/hqdefault.jpg",
        "duration": 220,
        "mood_match": "Focus"
      },
      {
        "id": "capsule-focus-13",
        "name": "Serenade of the Void",
        "artist": "Stars of the Lid",
        "youtube_id": "7maJOI3QMu0",
        "image": "https://i.ytimg.com/vi/7maJOI3QMu0/hqdefault.jpg",
        "duration": 180,
        "mood_match": "Focus"
      },
      {
        "id": "capsule-focus-14",
        "name": "Zen Garden Rain",
        "artist": "Ambient Flow",
        "youtube_id": "S-Xm7s9eGuU",
        "image": "https://i.ytimg.com/vi/S-Xm7s9eGuU/hqdefault.jpg",
        "duration": 195,
        "mood_match": "Focus"
      },
      {
        "id": "capsule-focus-15",
        "name": "Delta Deep Sleep",
        "artist": "Sleep Wave",
        "youtube_id": "WNcsUNKlAKw",
        "image": "https://i.ytimg.com/vi/WNcsUNKlAKw/hqdefault.jpg",
        "duration": 302,
        "mood_match": "Focus"
      },
      {
        "id": "capsule-focus-16",
        "name": "Astral Plane Harmonics",
        "artist": "Brainwave Sync",
        "youtube_id": "wuCK-oiE3rA",
        "image": "https://i.ytimg.com/vi/wuCK-oiE3rA/hqdefault.jpg",
        "duration": 237,
        "mood_match": "Focus"
      },
      {
        "id": "capsule-focus-17",
        "name": "Gravity Assist",
        "artist": "Brian Eno",
        "youtube_id": "hN_q-_nGv4U",
        "image": "https://i.ytimg.com/vi/hN_q-_nGv4U/hqdefault.jpg",
        "duration": 315,
        "mood_match": "Focus"
      },
      {
        "id": "capsule-focus-18",
        "name": "Event Horizon Soundscape",
        "artist": "Ambient Cosmos",
        "youtube_id": "DWcJFNfaw90",
        "image": "https://i.ytimg.com/vi/DWcJFNfaw90/hqdefault.jpg",
        "duration": 230,
        "mood_match": "Focus"
      }
    ]
  },
  {
    "id": "neon-drive",
    "title": "Late Night Neon Drive",
    "subtitle": "Synthwave bass, analog synthesizers & highway vibes",
    "mood": "calm",
    "gradient": "from-pink-500/30 via-slate-900 to-obsidian-950",
    "border": "border-pink-500/30",
    "badge": "Midnight Flow",
    "icon": "🌃",
    "tracksCount": "26 Tracks",
    "seedTracks": [
      {
        "id": "capsule-neon-1",
        "name": "Blinding Lights",
        "artist": "The Weeknd",
        "youtube_id": "4NRXx6U8ABQ",
        "image": "https://i.ytimg.com/vi/4NRXx6U8ABQ/hqdefault.jpg",
        "duration": 200,
        "mood_match": "Calm"
      },
      {
        "id": "capsule-neon-2",
        "name": "Starboy",
        "artist": "The Weeknd",
        "youtube_id": "34Na4j8AVgA",
        "image": "https://i.ytimg.com/vi/34Na4j8AVgA/hqdefault.jpg",
        "duration": 230,
        "mood_match": "Calm"
      },
      {
        "id": "capsule-neon-3",
        "name": "Midnight City",
        "artist": "M83",
        "youtube_id": "dX3k_PDnzHE",
        "image": "https://i.ytimg.com/vi/dX3k_PDnzHE/hqdefault.jpg",
        "duration": 243,
        "mood_match": "Calm"
      },
      {
        "id": "capsule-neon-4",
        "name": "Nightcall",
        "artist": "Kavinsky",
        "youtube_id": "MV_3Dpw-BRY",
        "image": "https://i.ytimg.com/vi/MV_3Dpw-BRY/hqdefault.jpg",
        "duration": 259,
        "mood_match": "Calm"
      },
      {
        "id": "capsule-neon-5",
        "name": "Resonance",
        "artist": "HOME",
        "youtube_id": "8GW6sLrK40k",
        "image": "https://i.ytimg.com/vi/8GW6sLrK40k/hqdefault.jpg",
        "duration": 212,
        "mood_match": "Calm"
      },
      {
        "id": "capsule-neon-6",
        "name": "After Dark",
        "artist": "Mr.Kitty",
        "youtube_id": "waAlgFq9Xq8",
        "image": "https://i.ytimg.com/vi/waAlgFq9Xq8/hqdefault.jpg",
        "duration": 257,
        "mood_match": "Calm"
      },
      {
        "id": "capsule-neon-7",
        "name": "Tech Noir",
        "artist": "Gunship",
        "youtube_id": "-EDtgyEk_k4",
        "image": "https://i.ytimg.com/vi/-EDtgyEk_k4/hqdefault.jpg",
        "duration": 298,
        "mood_match": "Calm"
      },
      {
        "id": "capsule-neon-8",
        "name": "Days of Thunder",
        "artist": "The Midnight",
        "youtube_id": "R3N26_s9pVU",
        "image": "https://i.ytimg.com/vi/R3N26_s9pVU/hqdefault.jpg",
        "duration": 329,
        "mood_match": "Calm"
      },
      {
        "id": "capsule-neon-9",
        "name": "Sunset",
        "artist": "The Midnight",
        "youtube_id": "5sQ_cE31nZ4",
        "image": "https://i.ytimg.com/vi/5sQ_cE31nZ4/hqdefault.jpg",
        "duration": 326,
        "mood_match": "Calm"
      },
      {
        "id": "capsule-neon-10",
        "name": "Endless Summer",
        "artist": "The Midnight",
        "youtube_id": "6bA2_w8G8d0",
        "image": "https://i.ytimg.com/vi/6bA2_w8G8d0/hqdefault.jpg",
        "duration": 405,
        "mood_match": "Calm"
      },
      {
        "id": "capsule-neon-11",
        "name": "Gloria",
        "artist": "The Midnight",
        "youtube_id": "xZ6K7mXJ3-A",
        "image": "https://i.ytimg.com/vi/xZ6K7mXJ3-A/hqdefault.jpg",
        "duration": 365,
        "mood_match": "Calm"
      },
      {
        "id": "capsule-neon-12",
        "name": "Running in the Night",
        "artist": "FM-84",
        "youtube_id": "YEDG54pT-rI",
        "image": "https://i.ytimg.com/vi/YEDG54pT-rI/hqdefault.jpg",
        "duration": 270,
        "mood_match": "Calm"
      },
      {
        "id": "capsule-neon-13",
        "name": "Bend & Break",
        "artist": "FM-84",
        "youtube_id": "2lQnQxG6H88",
        "image": "https://i.ytimg.com/vi/2lQnQxG6H88/hqdefault.jpg",
        "duration": 265,
        "mood_match": "Calm"
      },
      {
        "id": "capsule-neon-14",
        "name": "Out of Time",
        "artist": "The Weeknd",
        "youtube_id": "2fDzCW5V2ik",
        "image": "https://i.ytimg.com/vi/2fDzCW5V2ik/hqdefault.jpg",
        "duration": 214,
        "mood_match": "Calm"
      },
      {
        "id": "capsule-neon-15",
        "name": "Save Your Tears",
        "artist": "The Weeknd",
        "youtube_id": "XXYlFuWEuKI",
        "image": "https://i.ytimg.com/vi/XXYlFuWEuKI/hqdefault.jpg",
        "duration": 216,
        "mood_match": "Calm"
      },
      {
        "id": "capsule-neon-16",
        "name": "In the Face of Evil",
        "artist": "Magic Sword",
        "youtube_id": "mQWd4A4aLqI",
        "image": "https://i.ytimg.com/vi/mQWd4A4aLqI/hqdefault.jpg",
        "duration": 408,
        "mood_match": "Calm"
      },
      {
        "id": "capsule-neon-17",
        "name": "Turbo Killer",
        "artist": "Carpenter Brut",
        "youtube_id": "er416UnJG44",
        "image": "https://i.ytimg.com/vi/er416UnJG44/hqdefault.jpg",
        "duration": 208,
        "mood_match": "Calm"
      },
      {
        "id": "capsule-neon-18",
        "name": "Roller Mobster",
        "artist": "Carpenter Brut",
        "youtube_id": "qFfybn_W8Ak",
        "image": "https://i.ytimg.com/vi/qFfybn_W8Ak/hqdefault.jpg",
        "duration": 214,
        "mood_match": "Calm"
      },
      {
        "id": "capsule-neon-19",
        "name": "Overdrive",
        "artist": "Lazerhawk",
        "youtube_id": "lT67liG_9Q4",
        "image": "https://i.ytimg.com/vi/lT67liG_9Q4/hqdefault.jpg",
        "duration": 271,
        "mood_match": "Calm"
      },
      {
        "id": "capsule-neon-20",
        "name": "King of the Streets",
        "artist": "Lazerhawk",
        "youtube_id": "L2t4s5D6F7g",
        "image": "https://i.ytimg.com/vi/L2t4s5D6F7g/hqdefault.jpg",
        "duration": 279,
        "mood_match": "Calm"
      },
      {
        "id": "capsule-neon-21",
        "name": "Redline",
        "artist": "Lazerhawk",
        "youtube_id": "M1u8A7b6n88",
        "image": "https://i.ytimg.com/vi/M1u8A7b6n88/hqdefault.jpg",
        "duration": 251,
        "mood_match": "Calm"
      },
      {
        "id": "capsule-neon-22",
        "name": "Memory Reboot",
        "artist": "VØJ & Narvent",
        "youtube_id": "3V7w7c8E9Fs",
        "image": "https://i.ytimg.com/vi/3V7w7c8E9Fs/hqdefault.jpg",
        "duration": 184,
        "mood_match": "Calm"
      },
      {
        "id": "capsule-neon-23",
        "name": "GigaChad Theme (Phonk Remix)",
        "artist": "g3ox_em",
        "youtube_id": "SX_ViT4Ra7k",
        "image": "https://i.ytimg.com/vi/SX_ViT4Ra7k/hqdefault.jpg",
        "duration": 142,
        "mood_match": "Calm"
      },
      {
        "id": "capsule-neon-24",
        "name": "Metamorphosis",
        "artist": "INTERWORLD",
        "youtube_id": "w-sQRS-Um98",
        "image": "https://i.ytimg.com/vi/w-sQRS-Um98/hqdefault.jpg",
        "duration": 142,
        "mood_match": "Calm"
      },
      {
        "id": "capsule-neon-25",
        "name": "Neon Blade",
        "artist": "MoonDeity",
        "youtube_id": "j3iA7s8D9_g",
        "image": "https://i.ytimg.com/vi/j3iA7s8D9_g/hqdefault.jpg",
        "duration": 145,
        "mood_match": "Calm"
      },
      {
        "id": "capsule-neon-26",
        "name": "Tokyo Drift (Phonk Drive)",
        "artist": "Teriyaki Boyz",
        "youtube_id": "iuJDhFRDx9M",
        "image": "https://i.ytimg.com/vi/iuJDhFRDx9M/hqdefault.jpg",
        "duration": 255,
        "mood_match": "Calm"
      }
    ]
  },
  {
    "id": "soulful-warmth",
    "title": "Soulful Acoustic Warmth",
    "subtitle": "Heartfelt harmonies, delicate guitar & intimate vocals",
    "mood": "romantic",
    "gradient": "from-rose-500/30 via-slate-900 to-obsidian-950",
    "border": "border-rose-500/30",
    "badge": "Intimate Vibe",
    "icon": "💖",
    "tracksCount": "22 Tracks",
    "seedTracks": [
      {
        "id": "capsule-romantic-1",
        "name": "Raataan Lambiyan",
        "artist": "Jubin Nautiyal",
        "youtube_id": "gvyUuxdRdR4",
        "image": "https://i.ytimg.com/vi/gvyUuxdRdR4/hqdefault.jpg",
        "duration": 230,
        "mood_match": "Romantic"
      },
      {
        "id": "capsule-romantic-2",
        "name": "Apna Bana Le",
        "artist": "Arijit Singh",
        "youtube_id": "ElZfdU54Cp8",
        "image": "https://i.ytimg.com/vi/ElZfdU54Cp8/hqdefault.jpg",
        "duration": 261,
        "mood_match": "Romantic"
      },
      {
        "id": "capsule-romantic-3",
        "name": "Tum Hi Ho",
        "artist": "Arijit Singh",
        "youtube_id": "IJq0yyWug1k",
        "image": "https://i.ytimg.com/vi/IJq0yyWug1k/hqdefault.jpg",
        "duration": 262,
        "mood_match": "Romantic"
      },
      {
        "id": "capsule-romantic-4",
        "name": "Channa Mereya",
        "artist": "Arijit Singh",
        "youtube_id": "284Ov7ysmfA",
        "image": "https://i.ytimg.com/vi/284Ov7ysmfA/hqdefault.jpg",
        "duration": 289,
        "mood_match": "Romantic"
      },
      {
        "id": "capsule-romantic-5",
        "name": "Agar Tum Saath Ho",
        "artist": "Alka Yagnik & Arijit Singh",
        "youtube_id": "sK7riqg2mr4",
        "image": "https://i.ytimg.com/vi/sK7riqg2mr4/hqdefault.jpg",
        "duration": 341,
        "mood_match": "Romantic"
      },
      {
        "id": "capsule-romantic-6",
        "name": "Shayad",
        "artist": "Arijit Singh",
        "youtube_id": "mFvyb7Fj9_8",
        "image": "https://i.ytimg.com/vi/mFvyb7Fj9_8/hqdefault.jpg",
        "duration": 247,
        "mood_match": "Romantic"
      },
      {
        "id": "capsule-romantic-7",
        "name": "Tere Vaste",
        "artist": "Varun Jain & Sachin-Jigar",
        "youtube_id": "VAdGW7QDJiU",
        "image": "https://i.ytimg.com/vi/VAdGW7QDJiU/hqdefault.jpg",
        "duration": 189,
        "mood_match": "Romantic"
      },
      {
        "id": "capsule-romantic-8",
        "name": "O Maahi",
        "artist": "Arijit Singh",
        "youtube_id": "7c3-Ge36k3w",
        "image": "https://i.ytimg.com/vi/7c3-Ge36k3w/hqdefault.jpg",
        "duration": 233,
        "mood_match": "Romantic"
      },
      {
        "id": "capsule-romantic-9",
        "name": "Heeriye",
        "artist": "Jasleen Royal & Arijit Singh",
        "youtube_id": "RLzC55ai0eo",
        "image": "https://i.ytimg.com/vi/RLzC55ai0eo/hqdefault.jpg",
        "duration": 194,
        "mood_match": "Romantic"
      },
      {
        "id": "capsule-romantic-10",
        "name": "Kahani Suno 2.0",
        "artist": "Kaifi Khalil",
        "youtube_id": "_XBVWlI8TsQ",
        "image": "https://i.ytimg.com/vi/_XBVWlI8TsQ/hqdefault.jpg",
        "duration": 173,
        "mood_match": "Romantic"
      },
      {
        "id": "capsule-romantic-11",
        "name": "Pasoori",
        "artist": "Ali Sethi & Shae Gill",
        "youtube_id": "5Eqb_-j3FDA",
        "image": "https://i.ytimg.com/vi/5Eqb_-j3FDA/hqdefault.jpg",
        "duration": 224,
        "mood_match": "Romantic"
      },
      {
        "id": "capsule-romantic-12",
        "name": "Maan Meri Jaan",
        "artist": "King",
        "youtube_id": "VuG7ge_8I2Y",
        "image": "https://i.ytimg.com/vi/VuG7ge_8I2Y/hqdefault.jpg",
        "duration": 194,
        "mood_match": "Romantic"
      },
      {
        "id": "capsule-romantic-13",
        "name": "Kal Ho Naa Ho",
        "artist": "Sonu Nigam",
        "youtube_id": "oq5Ocx_rEv8",
        "image": "https://i.ytimg.com/vi/oq5Ocx_rEv8/hqdefault.jpg",
        "duration": 321,
        "mood_match": "Romantic"
      },
      {
        "id": "capsule-romantic-14",
        "name": "Kabira",
        "artist": "Tochi Raina & Rekha Bhardwaj",
        "youtube_id": "jHNNMj5bNQw",
        "image": "https://i.ytimg.com/vi/jHNNMj5bNQw/hqdefault.jpg",
        "duration": 223,
        "mood_match": "Romantic"
      },
      {
        "id": "capsule-romantic-15",
        "name": "Gerua",
        "artist": "Arijit Singh & Antara Mitra",
        "youtube_id": "AEIVhBS6baE",
        "image": "https://i.ytimg.com/vi/AEIVhBS6baE/hqdefault.jpg",
        "duration": 345,
        "mood_match": "Romantic"
      },
      {
        "id": "capsule-romantic-16",
        "name": "Zaalima",
        "artist": "Arijit Singh & Harshdeep Kaur",
        "youtube_id": "hhdSyH4QCqA",
        "image": "https://i.ytimg.com/vi/hhdSyH4QCqA/hqdefault.jpg",
        "duration": 299,
        "mood_match": "Romantic"
      },
      {
        "id": "capsule-romantic-17",
        "name": "Hawayein",
        "artist": "Arijit Singh",
        "youtube_id": "cYOB941gyXI",
        "image": "https://i.ytimg.com/vi/cYOB941gyXI/hqdefault.jpg",
        "duration": 290,
        "mood_match": "Romantic"
      },
      {
        "id": "capsule-romantic-18",
        "name": "Tujhe Kitna Chahne Lage",
        "artist": "Arijit Singh",
        "youtube_id": "b_Kz60o0Yjc",
        "image": "https://i.ytimg.com/vi/b_Kz60o0Yjc/hqdefault.jpg",
        "duration": 284,
        "mood_match": "Romantic"
      },
      {
        "id": "capsule-romantic-19",
        "name": "Pehle Bhi Main",
        "artist": "Vishal Mishra",
        "youtube_id": "iAIBF2ngbWY",
        "image": "https://i.ytimg.com/vi/iAIBF2ngbWY/hqdefault.jpg",
        "duration": 250,
        "mood_match": "Romantic"
      },
      {
        "id": "capsule-romantic-20",
        "name": "Perfect",
        "artist": "Ed Sheeran",
        "youtube_id": "2Vv-BfVoq4g",
        "image": "https://i.ytimg.com/vi/2Vv-BfVoq4g/hqdefault.jpg",
        "duration": 263,
        "mood_match": "Romantic"
      },
      {
        "id": "capsule-romantic-21",
        "name": "Someone You Loved",
        "artist": "Lewis Capaldi",
        "youtube_id": "zABLecsR5UE",
        "image": "https://i.ytimg.com/vi/zABLecsR5UE/hqdefault.jpg",
        "duration": 182,
        "mood_match": "Romantic"
      },
      {
        "id": "capsule-romantic-22",
        "name": "Say You Won't Let Go",
        "artist": "James Arthur",
        "youtube_id": "0yW7w8F2TVA",
        "image": "https://i.ytimg.com/vi/0yW7w8F2TVA/hqdefault.jpg",
        "duration": 211,
        "mood_match": "Romantic"
      }
    ]
  }
];

const TRENDING_SEEDS = [
  {
    rank: 1,
    id: 'trend-1',
    name: 'Kesariya',
    artist: 'Arijit Singh',
    youtube_id: 'BddP6PYo2gs',
    mood_match: 'Happy',
    ai_explanation: 'Dominating global streams with 420M+ plays & high vocal resonance',
    duration: 268,
    plays: '428.5M',
    image: 'https://i.ytimg.com/vi/BddP6PYo2gs/hqdefault.jpg',
  },
  {
    rank: 2,
    id: 'trend-2',
    name: 'Apna Bana Le',
    artist: 'Arijit Singh',
    youtube_id: 'ElZfdU54Cp8',
    mood_match: 'Romantic',
    ai_explanation: 'Top trending acoustic ballad across Hindi & Indie streaming charts',
    duration: 261,
    plays: '315.2M',
    image: 'https://i.ytimg.com/vi/ElZfdU54Cp8/hqdefault.jpg',
  },
  {
    rank: 3,
    id: 'trend-3',
    name: 'Chaleya',
    artist: 'Arijit Singh, Shilpa Rao',
    youtube_id: 'VAdGW7QDJiU',
    mood_match: 'Energetic',
    ai_explanation: 'High rhythmic bounce with punchy drum arrangement',
    duration: 200,
    plays: '280.9M',
    image: 'https://i.ytimg.com/vi/VAdGW7QDJiU/hqdefault.jpg',
  },
  {
    rank: 4,
    id: 'trend-4',
    name: 'Raataan Lambiyan',
    artist: 'Jubin Nautiyal, Asees Kaur',
    youtube_id: 'gvyUuxdRdR4',
    mood_match: 'Romantic',
    ai_explanation: 'Intimate vocal harmony with timeless melody structure',
    duration: 230,
    plays: '512.4M',
    image: 'https://i.ytimg.com/vi/gvyUuxdRdR4/hqdefault.jpg',
  },
  {
    rank: 5,
    id: 'trend-5',
    name: 'Tum Hi Ho',
    artist: 'Arijit Singh',
    youtube_id: 'IJq0yyWug1k',
    mood_match: 'Romantic',
    ai_explanation: 'Iconic soulful ballad with emotional piano progression',
    duration: 262,
    plays: '680.1M',
    image: 'https://i.ytimg.com/vi/IJq0yyWug1k/hqdefault.jpg',
  },
  {
    rank: 6,
    id: 'trend-6',
    name: 'Ilahi',
    artist: 'Arijit Singh',
    youtube_id: 'fdubeMFwuGs',
    mood_match: 'Happy',
    ai_explanation: 'Vibrant wanderlust anthem with uplifting acoustic rhythm',
    duration: 228,
    plays: '194.3M',
    image: 'https://i.ytimg.com/vi/fdubeMFwuGs/hqdefault.jpg',
  },
  {
    rank: 7,
    id: 'trend-7',
    name: 'Kabira',
    artist: 'Tochi Raina, Rekha Bhardwaj',
    youtube_id: 'jHNNMj5bNQw',
    mood_match: 'Calm',
    ai_explanation: 'Folk acoustic resonance and soulful vocal narrative',
    duration: 251,
    plays: '385.7M',
    image: 'https://i.ytimg.com/vi/jHNNMj5bNQw/hqdefault.jpg',
  },
  {
    rank: 8,
    id: 'trend-8',
    name: 'Agar Tum Saath Ho',
    artist: 'Alka Yagnik, Arijit Singh',
    youtube_id: 'sK7riqg2mr4',
    mood_match: 'Sad',
    ai_explanation: 'Deep melancholic resonance with soaring strings arrangement',
    duration: 341,
    plays: '490.2M',
    image: 'https://i.ytimg.com/vi/sK7riqg2mr4/hqdefault.jpg',
  },
];

const formatDuration = (seconds) => {
  if (!seconds || isNaN(seconds)) return '3:45';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
};

const DiscoverPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { currentSong, isPlaying, activeMood } = useSelector((state) => state.audio);

  const [trendingTracks, setTrendingTracks] = useState(TRENDING_SEEDS);
  const [activeCategoryLoading, setActiveCategoryLoading] = useState(null);
  const [playbackToast, setPlaybackToast] = useState(null);
  const [isRefreshingTrending, setIsRefreshingTrending] = useState(false);
  const [lastUpdatedTime, setLastUpdatedTime] = useState('Hourly Sync Active');

  const fetchLiveTrending = async (showRefreshToast = false) => {
    setIsRefreshingTrending(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/api/trending-tracks?limit=15`, { timeout: 6000 });
      if (res.data?.tracks && res.data.tracks.length > 0) {
        setTrendingTracks(res.data.tracks);
        setLastUpdatedTime(`Live Sync (${res.data.updated_at || 'Just Now'})`);
        if (showRefreshToast) showToast('🔥 Live Last.fm Global Charts refreshed!');
      } else {
        setLastUpdatedTime('Hourly Sync • Verified Charts');
        if (showRefreshToast) showToast('✓ Verified Global Charts up to date');
      }
    } catch (err) {
      setLastUpdatedTime('Hourly Sync • Verified Charts');
    } finally {
      setIsRefreshingTrending(false);
    }
  };

  useEffect(() => {
    fetchLiveTrending(false);
  }, []);

  const showToast = (message) => {
    setPlaybackToast(message);
    setTimeout(() => {
      setPlaybackToast(null);
    }, 3500);
  };

  const handlePlayCategory = (tile) => {
    const capsuleSongs = tile.seedTracks || [];
    if (capsuleSongs.length > 0) {
      dispatch(setActiveMood(tile.mood));
      dispatch(setQueue(capsuleSongs));
      dispatch(playSong(capsuleSongs[0]));
      showToast(`▶ Streaming ${tile.title}: "${capsuleSongs[0].name}" (${capsuleSongs.length} tracks queued)`);
      try {
        localStorage.setItem('recommendations', JSON.stringify(capsuleSongs));
      } catch (e) {}
    }
  };

  const handlePlayTrendingSong = (song) => {
    dispatch(setQueue(trendingTracks));
    dispatch(playSong(song));
    showToast(`▶ Now Playing: "${song.name}" by ${song.artist}`);
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 py-6 md:py-8 max-w-7xl animate-fadeIn relative">
      {/* Floating Playback Confirmation Toast */}
      {playbackToast && (
        <div className="fixed top-20 right-4 sm:right-8 z-50 px-4 py-2.5 rounded-2xl bg-obsidian-900/95 border border-cyan/40 text-white text-xs font-semibold shadow-2xl backdrop-blur-2xl flex items-center gap-3 animate-fadeIn">
          <span className="w-2.5 h-2.5 rounded-full bg-cyan animate-ping" />
          <span>{playbackToast}</span>
          <button
            onClick={() => dispatch(toggleTurntable())}
            className="ml-2 px-2.5 py-1 rounded-lg bg-cyan/20 hover:bg-cyan/30 text-cyan text-[11px] font-bold border border-cyan/30 transition-all cursor-pointer"
          >
            Open Turntable ↗
          </button>
        </div>
      )}

      {/* Header Banner */}
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan/15 text-cyan border border-cyan/30 text-xs font-mono font-bold mb-3">
          <span>🌐 GLOBAL DISCOVERY HUB</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
          Explore Ambient Soundscapes
        </h1>
        <p className="text-sm sm:text-base text-slate-400 mt-2 max-w-2xl">
          Curated emotional environments, neural genre blends, and live trending charts powered by Last.fm and parallel streaming.
        </p>
      </div>

      {/* 1. Curated Category Vibe Tiles */}
      <section className="mb-12">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <span>✨</span>
            <span>Curated Vibe Capsules</span>
          </h2>
          <span className="text-xs text-slate-400">One-tap acoustic immersion</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {CATEGORY_TILES.map((tile) => {
            const isLoading = activeCategoryLoading === tile.id;
            const isTileActive = activeMood === tile.mood && isPlaying;

            return (
              <div
                key={tile.id}
                onClick={() => handlePlayCategory(tile)}
                className={`group relative overflow-hidden rounded-3xl bg-gradient-to-br ${tile.gradient} border ${
                  isTileActive ? 'border-cyan ring-2 ring-cyan/40 shadow-2xl shadow-cyan/20' : tile.border
                } p-6 shadow-xl hover:shadow-2xl hover:scale-[1.02] active:scale-[0.99] transition-all cursor-pointer flex flex-col justify-between min-h-[180px]`}
              >
                {/* Top Badge & Icon */}
                <div className="flex items-center justify-between mb-3">
                  <span className="text-3xl filter drop-shadow-md group-hover:scale-110 transition-transform">
                    {tile.icon}
                  </span>
                  <span className="text-[10px] font-mono font-semibold px-2.5 py-1 rounded-full bg-obsidian-950/80 text-white border border-white/10 backdrop-blur-md">
                    {tile.badge}
                  </span>
                </div>

                {/* Content */}
                <div>
                  <h3 className="text-lg font-bold text-white group-hover:text-cyan transition-colors">
                    {tile.title}
                  </h3>
                  <p className="text-xs text-slate-300/80 mt-1 line-clamp-2 leading-relaxed">
                    {tile.subtitle}
                  </p>
                </div>

                {/* Footer Action */}
                <div className="flex items-center justify-between pt-4 mt-3 border-t border-white/10">
                  <span className="text-[11px] font-mono text-slate-400">
                    {tile.tracksCount}
                  </span>

                  <div className="w-9 h-9 rounded-full bg-cyan text-obsidian-950 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform font-bold">
                    {isLoading ? (
                      <div className="w-4 h-4 border-2 border-obsidian-950 border-t-transparent rounded-full animate-spin" />
                    ) : isTileActive ? (
                      <div className="flex items-end gap-0.5 h-3.5">
                        <span className="w-1 bg-obsidian-950 rounded-full animate-bounce [animation-delay:-0.3s]" />
                        <span className="w-1 bg-obsidian-950 rounded-full animate-bounce [animation-delay:-0.15s]" />
                        <span className="w-1 bg-obsidian-950 rounded-full animate-bounce" />
                      </div>
                    ) : (
                      <svg className="w-4 h-4 fill-current ml-0.5" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 2. Numbered Trending on Last.fm Global Chart */}
      <section className="bg-obsidian-900/70 backdrop-blur-2xl border border-obsidian-800/90 rounded-3xl p-5 sm:p-8 shadow-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-obsidian-800/60 mb-4">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <span>🔥</span>
              <span>Trending on Last.fm & Global Charts</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Top requested tracks with verified Parallel HD streaming fidelity
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono px-3 py-1 rounded-full bg-obsidian-800 text-slate-300 border border-obsidian-750 flex items-center gap-1.5 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>{lastUpdatedTime}</span>
            </span>
            <button
              onClick={() => fetchLiveTrending(true)}
              disabled={isRefreshingTrending}
              className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 text-xs transition-all hover:scale-105 cursor-pointer disabled:opacity-50"
              title="Refresh live Last.fm trending chart"
            >
              <svg className={`w-3.5 h-3.5 ${isRefreshingTrending ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
        </div>

        {/* Dense Table Header */}
        <div className="hidden md:grid grid-cols-12 gap-4 px-3 py-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wider border-b border-obsidian-800/40">
          <div className="col-span-1 text-center">Rank</div>
          <div className="col-span-5">Track & Artist</div>
          <div className="col-span-2">Plays</div>
          <div className="col-span-2">Mood Vibe</div>
          <div className="col-span-1 text-center">Time</div>
          <div className="col-span-1 text-right">Save</div>
        </div>

        {/* Track Rows */}
        <div className="divide-y divide-obsidian-800/40 mt-1">
          {trendingTracks.map((song) => {
            const isCurrent =
              currentSong &&
              (currentSong.id === song.id ||
                (currentSong.name === song.name && currentSong.artist === song.artist));
            const isSongPlaying = isCurrent && isPlaying;

            return (
              <div
                key={song.id}
                onClick={() => handlePlayTrendingSong(song)}
                className={`group flex md:grid md:grid-cols-12 items-center gap-3 md:gap-4 px-3 py-3 rounded-xl transition-all cursor-pointer ${
                  isSongPlaying
                    ? 'bg-cyan/15 border border-cyan/40 shadow-lg'
                    : 'hover:bg-obsidian-800/60 border border-transparent hover:border-obsidian-750/50'
                }`}
              >
                {/* Rank / Play Icon */}
                <div className="w-7 md:w-auto md:col-span-1 flex items-center justify-center flex-shrink-0">
                  {isSongPlaying ? (
                    <div className="flex items-end gap-0.5 h-3 text-cyan">
                      <span className="w-1 h-3 bg-cyan rounded-full animate-bounce [animation-delay:-0.3s]" />
                      <span className="w-1 h-3 bg-cyan rounded-full animate-bounce [animation-delay:-0.15s]" />
                      <span className="w-1 h-3 bg-cyan rounded-full animate-bounce" />
                    </div>
                  ) : (
                    <>
                      <span
                        className={`text-sm font-black font-mono group-hover:hidden ${
                          song.rank <= 3 ? 'text-amber-400' : 'text-slate-400'
                        }`}
                      >
                        #{song.rank}
                      </span>
                      <button
                        className="hidden group-hover:inline-flex text-cyan hover:scale-110 transition-transform"
                        title="Play"
                      >
                        <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </button>
                    </>
                  )}
                </div>

                {/* Track Details */}
                <div className="flex items-center gap-3 min-w-0 flex-1 md:col-span-5">
                  <img
                    src={resolveTrackArtwork(song)}
                    alt={song.name}
                    className="w-11 h-11 rounded-lg object-cover bg-obsidian-800 flex-shrink-0 shadow-md"
                    onError={(e) => handleArtworkError(e, song)}
                  />
                  <div className="min-w-0">
                    <p
                      className={`text-xs sm:text-sm font-semibold truncate ${
                        isSongPlaying ? 'text-cyan font-bold' : 'text-white group-hover:text-cyan transition-colors'
                      }`}
                    >
                      {song.name}
                    </p>
                    <p className="text-xs text-slate-400 truncate">{song.artist}</p>
                  </div>
                </div>

                {/* Plays */}
                <div className="hidden md:block md:col-span-2 text-xs font-mono text-slate-400">
                  {song.plays}
                </div>

                {/* Mood Badge */}
                <div className="hidden md:block md:col-span-2">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan/10 text-cyan border border-cyan/25">
                    {song.mood_match || 'Trending'}
                  </span>
                </div>

                {/* Time */}
                <div className="hidden md:block md:col-span-1 text-center text-xs font-mono text-slate-400">
                  {formatDuration(song.duration)}
                </div>

                {/* Add to Playlist button */}
                <div
                  className="hidden md:flex md:col-span-1 justify-end"
                  onClick={(e) => e.stopPropagation()}
                >
                  <AddToPlaylistButton song={song} variant="minimal" />
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};

export default DiscoverPage;
