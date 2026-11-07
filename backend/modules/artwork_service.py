"""
modules/artwork_service.py
High-definition track artwork, multi-provider music search (Spotify, YouTube, iTunes), and fuzzy matching.
"""
import os
import re
import difflib
import base64
import time
import requests
from typing import Optional, List, Dict
from dotenv import load_dotenv

load_dotenv()
env_backend = os.path.join(os.path.dirname(__file__), "..", ".env")
if os.path.exists(env_backend):
    load_dotenv(env_backend)


COMMON_TRANSLITERATIONS = {
    "kasariya": "kesariya",
    "kesriya": "kesariya",
    "kesariyan": "kesariya",
    "kesari": "kesariya",
    "arjit": "arijit",
    "arjit singh": "arijit singh",
    "arjeet": "arijit",
    "singh arjit": "arijit singh",
    "ratan": "raataan",
    "raatan": "raataan",
    "ratan lambiyan": "raataan lambiyan",
    "raatan lambiyan": "raataan lambiyan",
    "lambiya": "lambiyan",
    "beliver": "believer",
    "believr": "believer",
    "iktara": "iktara",
    "ik tara": "iktara",
    "iktaraa": "iktara",
    "channa merya": "channa mereya",
    "chana mereya": "channa mereya",
    "channa meriya": "channa mereya",
    "apna bna le": "apna bana le",
    "apna banale": "apna bana le",
    "apna bna": "apna bana le",
    "kun faya": "kun faya kun",
    "kun faya kun": "kun faya kun",
    "phir se ud chala": "phir se udd chala",
    "ud chala": "udd chala",
    "safarnama": "safarnama",
    "safar nama": "safarnama",
    "ranjha": "raanjha",
    "raanjhana": "raanjha",
    "agar tum sath ho": "agar tum saath ho",
    "tum sath ho": "agar tum saath ho",
    "sath ho": "saath ho",
    "tere vaste": "tere vaaste",
    "tere waste": "tere vaaste",
    "o mahi": "o maahi",
    "omahi": "o maahi",
    "maan meri jan": "maan meri jaan",
    "man meri jaan": "maan meri jaan",
    "kal ho na ho": "kal ho naa ho",
    "zalima": "zaalima",
    "hawayen": "hawayein",
    "dil nu": "dil nu",
    "dill nu": "dil nu",
    "boom shaka": "boom shack a lak",
    "boom shakalak": "boom shack a lak",
    "boom shak": "boom shack a lak",
    "boom shaka lak": "boom shack a lak",
    "krsna": "krsna",
    "kr$na": "krsna",
    "krishna": "krsna",
    "honey sing": "yo yo honey singh",
    "hony singh": "yo yo honey singh",
    "badsa": "badshah",
    "emiway": "emiway bantai",
    "imagin dragons": "imagine dragons",
    "weekend": "the weeknd",
    "weeknd": "the weeknd",
    "starbooy": "starboy",
    "chaleyaa": "chaleya",
    "shayaad": "shayad",
    "shayed": "shayad",
    "machayengey": "machayenge 3",
}

def normalize_search(s: str) -> str:
    if not s:
        return ""
    s = s.lower().strip()
    s = s.replace("$", "s")
    s = re.sub(r'[^a-z0-9\s]', ' ', s)
    s = re.sub(r'\s+', ' ', s).strip()
    for k, v in COMMON_TRANSLITERATIONS.items():
        s = re.sub(r'\b' + re.escape(k) + r'\b', v, s)
    return s

def calc_similarity(query: str, title: str, artist: str = "") -> float:
    q_norm = normalize_search(query)
    if not q_norm:
        return 0.0
    t_norm = normalize_search(title)
    a_norm = normalize_search(artist)
    comb_norm = f"{t_norm} {a_norm}".strip()
    inv_comb = f"{a_norm} {t_norm}".strip()

    # Direct whole-string or token inclusion
    if q_norm == t_norm or q_norm == comb_norm or q_norm in comb_norm or q_norm in t_norm:
        return 1.0
    if a_norm and (q_norm == a_norm or q_norm in a_norm):
        return 0.98

    r_title = difflib.SequenceMatcher(None, q_norm, t_norm).ratio()
    r_artist = difflib.SequenceMatcher(None, q_norm, a_norm).ratio() if a_norm else 0.0
    r_comb = difflib.SequenceMatcher(None, q_norm, comb_norm).ratio()
    r_inv = difflib.SequenceMatcher(None, q_norm, inv_comb).ratio()

    q_tokens = q_norm.split()
    all_tokens = comb_norm.split()
    token_scores = []
    for qt in q_tokens:
        best_t = max([difflib.SequenceMatcher(None, qt, tt).ratio() for tt in all_tokens] + [0.0])
        for tt in all_tokens:
            if len(qt) >= 3 and qt in tt:
                best_t = max(best_t, 0.95)
            elif len(tt) >= 4 and tt in qt:
                best_t = max(best_t, 0.85)
        token_scores.append(best_t)

    avg_tokens = sum(token_scores) / len(token_scores) if token_scores else 0.0
    return max(r_title, r_artist, r_comb, r_inv, avg_tokens)


CURATED_SEARCH_HITS = [
    # --- KR$NA (Krsna) Desi Hip-Hop ---
    {"id": "curated-krsna-1", "name": "Say My Name", "artist": "KR$NA", "youtube_id": "d7m_c0w5z_o", "image": "https://i.ytimg.com/vi/d7m_c0w5z_o/hqdefault.jpg", "duration": 215, "detected_mood": "Energetic", "mood_match": "Energetic"},
    {"id": "curated-krsna-2", "name": "No Cap", "artist": "KR$NA", "youtube_id": "O1mQn4P9z2w", "image": "https://i.ytimg.com/vi/O1mQn4P9z2w/hqdefault.jpg", "duration": 180, "detected_mood": "Energetic", "mood_match": "Energetic"},
    {"id": "curated-krsna-3", "name": "Makasam", "artist": "KR$NA", "youtube_id": "JgZ3o8dD_Q0", "image": "https://i.ytimg.com/vi/JgZ3o8dD_Q0/hqdefault.jpg", "duration": 320, "detected_mood": "Energetic", "mood_match": "Energetic"},
    {"id": "curated-krsna-4", "name": "Hola Amigo", "artist": "KR$NA & Seedhe Maut", "youtube_id": "s_8xW_P6Yp0", "image": "https://i.ytimg.com/vi/s_8xW_P6Yp0/hqdefault.jpg", "duration": 210, "detected_mood": "Energetic", "mood_match": "Energetic"},
    {"id": "curated-krsna-5", "name": "Prarthana", "artist": "KR$NA", "youtube_id": "8P6pT7ZzG5c", "image": "https://i.ytimg.com/vi/8P6pT7ZzG5c/hqdefault.jpg", "duration": 195, "detected_mood": "Energetic", "mood_match": "Energetic"},
    {"id": "curated-krsna-6", "name": "I Guess", "artist": "KR$NA", "youtube_id": "Y_JzW5vW_9w", "image": "https://i.ytimg.com/vi/Y_JzW5vW_9w/hqdefault.jpg", "duration": 175, "detected_mood": "Energetic", "mood_match": "Energetic"},
    {"id": "curated-krsna-7", "name": "Roll Up", "artist": "KR$NA ft. Badshah", "youtube_id": "6_P2mK_xV8A", "image": "https://i.ytimg.com/vi/6_P2mK_xV8A/hqdefault.jpg", "duration": 205, "detected_mood": "Energetic", "mood_match": "Energetic"},
    {"id": "curated-krsna-8", "name": "Blow Up", "artist": "KR$NA", "youtube_id": "m9z8X8pQ2Y0", "image": "https://i.ytimg.com/vi/m9z8X8pQ2Y0/hqdefault.jpg", "duration": 190, "detected_mood": "Energetic", "mood_match": "Energetic"},
    {"id": "curated-boom-shack", "name": "Boom Shack-A-Lak", "artist": "Apache Indian", "youtube_id": "kZzBd41NuZw", "image": "https://i.ytimg.com/vi/kZzBd41NuZw/hqdefault.jpg", "duration": 272, "detected_mood": "Energetic", "mood_match": "Energetic"},

    # --- CALM ---
    {"id": "curated-kun-faya", "name": "Kun Faya Kun", "artist": "A.R. Rahman", "youtube_id": "T94PHkuydcw", "image": "https://i.ytimg.com/vi/T94PHkuydcw/hqdefault.jpg", "duration": 473, "detected_mood": "Calm", "mood_match": "Calm"},
    {"id": "curated-iktara", "name": "Iktara", "artist": "Kavita Seth", "youtube_id": "fSS_R91Nimw", "image": "https://i.ytimg.com/vi/fSS_R91Nimw/hqdefault.jpg", "duration": 253, "detected_mood": "Calm", "mood_match": "Calm"},
    {"id": "curated-safarnama", "name": "Safarnama", "artist": "Lucky Ali", "youtube_id": "qP_VpX8C0p0", "image": "https://i.ytimg.com/vi/qP_VpX8C0p0/hqdefault.jpg", "duration": 251, "detected_mood": "Calm", "mood_match": "Calm"},
    {"id": "curated-sham", "name": "Sham", "artist": "Amit Trivedi", "youtube_id": "7v-z0lJmFio", "image": "https://i.ytimg.com/vi/7v-z0lJmFio/hqdefault.jpg", "duration": 247, "detected_mood": "Calm", "mood_match": "Calm"},
    {"id": "curated-weightless", "name": "Weightless", "artist": "Marconi Union", "youtube_id": "UfcAVejslrU", "image": "https://i.ytimg.com/vi/UfcAVejslrU/hqdefault.jpg", "duration": 485, "detected_mood": "Calm", "mood_match": "Calm"},
    {"id": "curated-clair-de-lune", "name": "Clair de Lune", "artist": "Claude Debussy", "youtube_id": "WNcsUNKlAKw", "image": "https://i.ytimg.com/vi/WNcsUNKlAKw/hqdefault.jpg", "duration": 302, "detected_mood": "Calm", "mood_match": "Calm"},
    {"id": "curated-sunset-lover", "name": "Sunset Lover", "artist": "Petit Biscuit", "youtube_id": "wuCK-oiE3rA", "image": "https://i.ytimg.com/vi/wuCK-oiE3rA/hqdefault.jpg", "duration": 237, "detected_mood": "Calm", "mood_match": "Calm"},
    {"id": "curated-holocene", "name": "Holocene", "artist": "Bon Iver", "youtube_id": "TWcyIpul8OE", "image": "https://i.ytimg.com/vi/TWcyIpul8OE/hqdefault.jpg", "duration": 337, "detected_mood": "Calm", "mood_match": "Calm"},
    {"id": "curated-river-flows", "name": "River Flows in You", "artist": "Yiruma", "youtube_id": "7maJOI3QMu0", "image": "https://i.ytimg.com/vi/7maJOI3QMu0/hqdefault.jpg", "duration": 180, "detected_mood": "Calm", "mood_match": "Calm"},
    {"id": "curated-lofi-study", "name": "Lofi Study Session", "artist": "ChilledCow", "youtube_id": "jfKfPfyJRdk", "image": "https://i.ytimg.com/vi/jfKfPfyJRdk/hqdefault.jpg", "duration": 240, "detected_mood": "Calm", "mood_match": "Calm"},

    # --- ROMANTIC ---
    {"id": "curated-raataan", "name": "Raataan Lambiyan", "artist": "Jubin Nautiyal", "youtube_id": "gvyUuxdRdR4", "image": "https://i.ytimg.com/vi/gvyUuxdRdR4/hqdefault.jpg", "duration": 230, "detected_mood": "Romantic", "mood_match": "Romantic"},
    {"id": "curated-apna-bana-le", "name": "Apna Bana Le", "artist": "Arijit Singh", "youtube_id": "ElZfdU54Cp8", "image": "https://i.ytimg.com/vi/ElZfdU54Cp8/hqdefault.jpg", "duration": 261, "detected_mood": "Romantic", "mood_match": "Romantic"},
    {"id": "curated-tum-hi-ho", "name": "Tum Hi Ho", "artist": "Arijit Singh", "youtube_id": "IJq0yyWug1k", "image": "https://i.ytimg.com/vi/IJq0yyWug1k/hqdefault.jpg", "duration": 262, "detected_mood": "Romantic", "mood_match": "Romantic"},
    {"id": "curated-channa-mereya", "name": "Channa Mereya", "artist": "Arijit Singh", "youtube_id": "284Ov7ysmfA", "image": "https://i.ytimg.com/vi/284Ov7ysmfA/hqdefault.jpg", "duration": 289, "detected_mood": "Romantic", "mood_match": "Romantic"},
    {"id": "curated-agar-tum-saath", "name": "Agar Tum Saath Ho", "artist": "Alka Yagnik & Arijit Singh", "youtube_id": "sK7riqg2mr4", "image": "https://i.ytimg.com/vi/sK7riqg2mr4/hqdefault.jpg", "duration": 341, "detected_mood": "Romantic", "mood_match": "Romantic"},
    {"id": "curated-shayad", "name": "Shayad", "artist": "Arijit Singh", "youtube_id": "mFvyb7Fj9_8", "image": "https://i.ytimg.com/vi/mFvyb7Fj9_8/hqdefault.jpg", "duration": 247, "detected_mood": "Romantic", "mood_match": "Romantic"},
    {"id": "curated-tere-vaste", "name": "Tere Vaste", "artist": "Varun Jain & Sachin-Jigar", "youtube_id": "VAdGW7QDJUI", "image": "https://i.ytimg.com/vi/VAdGW7QDJUI/hqdefault.jpg", "duration": 189, "detected_mood": "Romantic", "mood_match": "Romantic"},
    {"id": "curated-o-maahi", "name": "O Maahi", "artist": "Arijit Singh", "youtube_id": "7c3-Ge36k3w", "image": "https://i.ytimg.com/vi/7c3-Ge36k3w/hqdefault.jpg", "duration": 233, "detected_mood": "Romantic", "mood_match": "Romantic"},
    {"id": "curated-heeriye", "name": "Heeriye", "artist": "Jasleen Royal & Arijit Singh", "youtube_id": "RLzC55ai0eo", "image": "https://i.ytimg.com/vi/RLzC55ai0eo/hqdefault.jpg", "duration": 194, "detected_mood": "Romantic", "mood_match": "Romantic"},
    {"id": "curated-kahani-suno", "name": "Kahani Suno 2.0", "artist": "Kaifi Khalil", "youtube_id": "_XBVWlI8TsQ", "image": "https://i.ytimg.com/vi/_XBVWlI8TsQ/hqdefault.jpg", "duration": 173, "detected_mood": "Romantic", "mood_match": "Romantic"},
    {"id": "curated-pasoori", "name": "Pasoori", "artist": "Ali Sethi & Shae Gill", "youtube_id": "5Eqb_-j3FDA", "image": "https://i.ytimg.com/vi/5Eqb_-j3FDA/hqdefault.jpg", "duration": 224, "detected_mood": "Romantic", "mood_match": "Romantic"},
    {"id": "curated-maan-meri-jaan", "name": "Maan Meri Jaan", "artist": "King", "youtube_id": "VuG7ge_8I2Y", "image": "https://i.ytimg.com/vi/VuG7ge_8I2Y/hqdefault.jpg", "duration": 194, "detected_mood": "Romantic", "mood_match": "Romantic"},
    {"id": "curated-kal-ho-naa-ho", "name": "Kal Ho Naa Ho", "artist": "Sonu Nigam", "youtube_id": "oq5Ocx_rEv8", "image": "https://i.ytimg.com/vi/oq5Ocx_rEv8/hqdefault.jpg", "duration": 321, "detected_mood": "Romantic", "mood_match": "Romantic"},
    {"id": "curated-kabira", "name": "Kabira", "artist": "Tochi Raina & Rekha Bhardwaj", "youtube_id": "jHNNMj5bNQw", "image": "https://i.ytimg.com/vi/jHNNMj5bNQw/hqdefault.jpg", "duration": 223, "detected_mood": "Romantic", "mood_match": "Romantic"},
    {"id": "curated-gerua", "name": "Gerua", "artist": "Arijit Singh & Antara Mitra", "youtube_id": "AEIVhBS6baE", "image": "https://i.ytimg.com/vi/AEIVhBS6baE/hqdefault.jpg", "duration": 345, "detected_mood": "Romantic", "mood_match": "Romantic"},
    {"id": "curated-zaalima", "name": "Zaalima", "artist": "Arijit Singh & Harshdeep Kaur", "youtube_id": "hhdSyH4QCqA", "image": "https://i.ytimg.com/vi/hhdSyH4QCqA/hqdefault.jpg", "duration": 299, "detected_mood": "Romantic", "mood_match": "Romantic"},
    {"id": "curated-hawayein", "name": "Hawayein", "artist": "Arijit Singh", "youtube_id": "cYOB941gyXI", "image": "https://i.ytimg.com/vi/cYOB941gyXI/hqdefault.jpg", "duration": 290, "detected_mood": "Romantic", "mood_match": "Romantic"},
    {"id": "curated-tujhe-kitna", "name": "Tujhe Kitna Chahne Lage", "artist": "Arijit Singh", "youtube_id": "b_Kz60o0Yjc", "image": "https://i.ytimg.com/vi/b_Kz60o0Yjc/hqdefault.jpg", "duration": 284, "detected_mood": "Romantic", "mood_match": "Romantic"},
    {"id": "curated-pehle-bhi-main", "name": "Pehle Bhi Main", "artist": "Vishal Mishra", "youtube_id": "iAIBF2ngbWY", "image": "https://i.ytimg.com/vi/iAIBF2ngbWY/hqdefault.jpg", "duration": 250, "detected_mood": "Romantic", "mood_match": "Romantic"},
    {"id": "curated-raanjha", "name": "Raanjha", "artist": "B Praak & Jasleen Royal", "youtube_id": "V7LwfY5U5WI", "image": "https://i.ytimg.com/vi/V7LwfY5U5WI/hqdefault.jpg", "duration": 228, "detected_mood": "Romantic", "mood_match": "Romantic"},

    # --- HAPPY ---
    {"id": "curated-kesariya", "name": "Kesariya", "artist": "Arijit Singh", "youtube_id": "BddP6PYo2gs", "image": "https://i.ytimg.com/vi/BddP6PYo2gs/hqdefault.jpg", "duration": 268, "detected_mood": "Happy", "mood_match": "Happy"},
    {"id": "curated-ilahi", "name": "Ilahi", "artist": "Arijit Singh", "youtube_id": "fdubeMFwuGs", "image": "https://i.ytimg.com/vi/fdubeMFwuGs/hqdefault.jpg", "duration": 228, "detected_mood": "Happy", "mood_match": "Happy"},
    {"id": "curated-matargashti", "name": "Matargashti", "artist": "Mohit Chauhan", "youtube_id": "6vKucgAeF_Q", "image": "https://i.ytimg.com/vi/6vKucgAeF_Q/hqdefault.jpg", "duration": 328, "detected_mood": "Happy", "mood_match": "Happy"},
    {"id": "curated-subhanallah", "name": "Subhanallah", "artist": "Sreerama Chandra", "youtube_id": "RCXB_7zPzYk", "image": "https://i.ytimg.com/vi/RCXB_7zPzYk/hqdefault.jpg", "duration": 249, "detected_mood": "Happy", "mood_match": "Happy"},
    {"id": "curated-gallan-goodiyan", "name": "Gallan Goodiyan", "artist": "Yashita Sharma & Shankar Mahadevan", "youtube_id": "jCEdTq3j-0U", "image": "https://i.ytimg.com/vi/jCEdTq3j-0U/hqdefault.jpg", "duration": 296, "detected_mood": "Happy", "mood_match": "Happy"},
    {"id": "curated-dil-dhadakne", "name": "Dil Dhadakne Do", "artist": "Suraj Jagan & Joi Barua", "youtube_id": "Bq5_mFz2K2s", "image": "https://i.ytimg.com/vi/Bq5_mFz2K2s/hqdefault.jpg", "duration": 229, "detected_mood": "Happy", "mood_match": "Happy"},
    {"id": "curated-sooraj-dooba", "name": "Sooraj Dooba Hain", "artist": "Arijit Singh", "youtube_id": "nCg3ufihKyU", "image": "https://i.ytimg.com/vi/nCg3ufihKyU/hqdefault.jpg", "duration": 264, "detected_mood": "Happy", "mood_match": "Happy"},
    {"id": "curated-badtameez-dil", "name": "Badtameez Dil", "artist": "Benny Dayal", "youtube_id": "II2EO3NwUr8", "image": "https://i.ytimg.com/vi/II2EO3NwUr8/hqdefault.jpg", "duration": 253, "detected_mood": "Happy", "mood_match": "Happy"},
    {"id": "curated-london-thumakda", "name": "London Thumakda", "artist": "Labh Janjua", "youtube_id": "0m3uU46QWrg", "image": "https://i.ytimg.com/vi/0m3uU46QWrg/hqdefault.jpg", "duration": 231, "detected_mood": "Happy", "mood_match": "Happy"},

    # --- ENERGETIC ---
    {"id": "curated-believer", "name": "Believer", "artist": "Imagine Dragons", "youtube_id": "7wtfhZwyrcc", "image": "https://i.ytimg.com/vi/7wtfhZwyrcc/hqdefault.jpg", "duration": 204, "detected_mood": "Energetic", "mood_match": "Energetic"},
    {"id": "curated-machayenge-3", "name": "Machayenge 3", "artist": "Emiway Bantai", "youtube_id": "Dlz_XHeUUcw", "image": "https://i.ytimg.com/vi/Dlz_XHeUUcw/hqdefault.jpg", "duration": 185, "detected_mood": "Energetic", "mood_match": "Energetic"},
    {"id": "curated-love-dose", "name": "Love Dose", "artist": "Yo Yo Honey Singh", "youtube_id": "TvngY4unyL4", "image": "https://i.ytimg.com/vi/TvngY4unyL4/hqdefault.jpg", "duration": 228, "detected_mood": "Energetic", "mood_match": "Energetic"},
    {"id": "curated-desi-kalakaar", "name": "Desi Kalakaar", "artist": "Yo Yo Honey Singh", "youtube_id": "KhnvxXffwio", "image": "https://i.ytimg.com/vi/KhnvxXffwio/hqdefault.jpg", "duration": 259, "detected_mood": "Energetic", "mood_match": "Energetic"},
    {"id": "curated-blue-eyes", "name": "Blue Eyes", "artist": "Yo Yo Honey Singh", "youtube_id": "NbyHNASFi6U", "image": "https://i.ytimg.com/vi/NbyHNASFi6U/hqdefault.jpg", "duration": 220, "detected_mood": "Energetic", "mood_match": "Energetic"},
    {"id": "curated-dope-shope", "name": "Dope Shope", "artist": "Yo Yo Honey Singh", "youtube_id": "t0qI_01sLpQ", "image": "https://i.ytimg.com/vi/t0qI_01sLpQ/hqdefault.jpg", "duration": 190, "detected_mood": "Energetic", "mood_match": "Energetic"},
    {"id": "curated-brown-rang", "name": "Brown Rang", "artist": "Yo Yo Honey Singh", "youtube_id": "PqFMFVcCZgI", "image": "https://i.ytimg.com/vi/PqFMFVcCZgI/hqdefault.jpg", "duration": 175, "detected_mood": "Energetic", "mood_match": "Energetic"},
    {"id": "curated-high-heels", "name": "High Heels", "artist": "Yo Yo Honey Singh & Jaz Dhami", "youtube_id": "kJqU9F2p6_4", "image": "https://i.ytimg.com/vi/kJqU9F2p6_4/hqdefault.jpg", "duration": 215, "detected_mood": "Energetic", "mood_match": "Energetic"},
    {"id": "curated-angreji-beat", "name": "Angreji Beat", "artist": "Yo Yo Honey Singh & Gippy Grewal", "youtube_id": "2oMv4N1GkQk", "image": "https://i.ytimg.com/vi/2oMv4N1GkQk/hqdefault.jpg", "duration": 210, "detected_mood": "Energetic", "mood_match": "Energetic"},
    {"id": "curated-lungi-dance", "name": "Lungi Dance", "artist": "Yo Yo Honey Singh", "youtube_id": "2kWly_tXpFQ", "image": "https://i.ytimg.com/vi/2kWly_tXpFQ/hqdefault.jpg", "duration": 230, "detected_mood": "Energetic", "mood_match": "Energetic"},
    {"id": "curated-chaleya", "name": "Chaleya", "artist": "Arijit Singh & Shilpa Rao", "youtube_id": "VAdGW7QDJUI", "image": "https://i.ytimg.com/vi/VAdGW7QDJUI/hqdefault.jpg", "duration": 200, "detected_mood": "Energetic", "mood_match": "Energetic"},
    {"id": "curated-starboy", "name": "Starboy", "artist": "The Weeknd", "youtube_id": "34Na4j8AVgA", "image": "https://i.ytimg.com/vi/34Na4j8AVgA/hqdefault.jpg", "duration": 230, "detected_mood": "Energetic", "mood_match": "Energetic"},
    {"id": "curated-blinding-lights", "name": "Blinding Lights", "artist": "The Weeknd", "youtube_id": "4NRXx6U8ABQ", "image": "https://i.ytimg.com/vi/4NRXx6U8ABQ/hqdefault.jpg", "duration": 200, "detected_mood": "Energetic", "mood_match": "Energetic"},
    {"id": "curated-apna-time", "name": "Apna Time Aayega", "artist": "Ranveer Singh & Divine", "youtube_id": "jFGKJBPzA-Y", "image": "https://i.ytimg.com/vi/jFGKJBPzA-Y/hqdefault.jpg", "duration": 135, "detected_mood": "Energetic", "mood_match": "Energetic"},
    {"id": "curated-kar-gayi-chull", "name": "Kar Gayi Chull", "artist": "Badshah & Neha Kakkar", "youtube_id": "NTHz9ephYTw", "image": "https://i.ytimg.com/vi/NTHz9ephYTw/hqdefault.jpg", "duration": 187, "detected_mood": "Energetic", "mood_match": "Energetic"},
    {"id": "curated-dil-nu", "name": "Dil Nu", "artist": "AP Dhillon", "youtube_id": "xU3X_g_l07c", "image": "https://i.ytimg.com/vi/xU3X_g_l07c/hqdefault.jpg", "duration": 195, "detected_mood": "Energetic", "mood_match": "Energetic"},

    # --- FOCUS ---
    {"id": "curated-kho-gaye", "name": "Kho Gaye Hum Kahan", "artist": "Jasleen Royal", "youtube_id": "vt4jX0iPU40", "image": "https://i.ytimg.com/vi/vt4jX0iPU40/hqdefault.jpg", "duration": 214, "detected_mood": "Focus", "mood_match": "Focus"},
    {"id": "curated-phir-se-udd", "name": "Phir Se Udd Chala", "artist": "Mohit Chauhan", "youtube_id": "2iqbx7Tzxbw", "image": "https://i.ytimg.com/vi/2iqbx7Tzxbw/hqdefault.jpg", "duration": 271, "detected_mood": "Focus", "mood_match": "Focus"},
    {"id": "curated-aazaadiyan", "name": "Aazaadiyan", "artist": "Rahat Fateh Ali Khan", "youtube_id": "01Qk9mHjC5E", "image": "https://i.ytimg.com/vi/01Qk9mHjC5E/hqdefault.jpg", "duration": 260, "detected_mood": "Focus", "mood_match": "Focus"},
    {"id": "curated-deep-focus", "name": "Deep Focus Theta Waves", "artist": "Binaural Mind", "youtube_id": "WPni755-Krg", "image": "https://i.ytimg.com/vi/WPni755-Krg/hqdefault.jpg", "duration": 195, "detected_mood": "Focus", "mood_match": "Focus"},

    # --- SAD ---
    {"id": "curated-bekhayali", "name": "Bekhayali", "artist": "Sachet Tandon", "youtube_id": "VOLKJJvfAbg", "image": "https://i.ytimg.com/vi/VOLKJJvfAbg/hqdefault.jpg", "duration": 371, "detected_mood": "Sad", "mood_match": "Sad"},
    {"id": "curated-tujhe-bhula-diya", "name": "Tujhe Bhula Diya", "artist": "Mohit Chauhan & Shekhar", "youtube_id": "1y3wFvC9W2Q", "image": "https://i.ytimg.com/vi/1y3wFvC9W2Q/hqdefault.jpg", "duration": 279, "detected_mood": "Sad", "mood_match": "Sad"},
    {"id": "curated-phir-bhi-tumko", "name": "Phir Bhi Tumko Chaahunga", "artist": "Arijit Singh", "youtube_id": "_aktURityQw", "image": "https://i.ytimg.com/vi/_aktURityQw/hqdefault.jpg", "duration": 351, "detected_mood": "Sad", "mood_match": "Sad"},
    {"id": "curated-alvida", "name": "Alvida", "artist": "KK", "youtube_id": "dD9l_s3l8eA", "image": "https://i.ytimg.com/vi/dD9l_s3l8eA/hqdefault.jpg", "duration": 340, "detected_mood": "Sad", "mood_match": "Sad"},
]


class ArtworkService:
    def __init__(self):
        self.spotify_client_id = os.getenv("SPOTIFY_CLIENT_ID", "")
        self.spotify_client_secret = os.getenv("SPOTIFY_CLIENT_SECRET", "")
        self.youtube_api_key = os.getenv("YOUTUBE_API_KEY", "")
        self.spotify_token = None
        self.spotify_token_expires = 0
        self.cache: Dict[str, str] = {}

    def _get_spotify_token(self) -> Optional[str]:
        if self.spotify_token and time.time() < self.spotify_token_expires:
            return self.spotify_token
        if not self.spotify_client_id or not self.spotify_client_secret:
            return None
        try:
            auth_str = f"{self.spotify_client_id}:{self.spotify_client_secret}"
            auth_b64 = base64.b64encode(auth_str.encode()).decode()
            resp = requests.post(
                "https://accounts.spotify.com/api/token",
                data={"grant_type": "client_credentials"},
                headers={"Authorization": f"Basic {auth_b64}"},
                timeout=4
            )
            if resp.status_code == 200:
                data = resp.json()
                self.spotify_token = data.get("access_token")
                self.spotify_token_expires = time.time() + data.get("expires_in", 3600) - 60
                return self.spotify_token
        except Exception:
            pass
        return None

    def infer_mood(self, name: str, artist: str, genre: str = "") -> str:
        combined = f"{name} {artist} {genre}".lower()

        energetic_keywords = [
            "dance", "workout", "party", "boom", "machayenge", "energy", "bhangra",
            "remix", "bass", "dhol", "badshah", "honey singh", "emiway", "mc stan",
            "raftaar", "punjabi", "electronic", "club", "dj", "hip-hop", "rap", "rock", "fast", "krsna", "seedhe maut"
        ]
        if any(k in combined for k in energetic_keywords):
            return "Energetic"

        romantic_keywords = [
            "love", "ishq", "dil", "pyar", "romantic", "tum", "teriyaan", "raataan",
            "kesariya", "humsafar", "sanware", "pehla nasha", "zaalima", "soniye",
            "shiddat", "saibo", "tujh mein rab", "mohabbat", "nazar", "aashiqui", "heeriye", "ranjha"
        ]
        if any(k in combined for k in romantic_keywords):
            return "Romantic"

        sad_keywords = [
            "sad", "dard", "judai", "judaai", "alvida", "broken", "tears", "channa mereya",
            "agar tum saath ho", "bekhayali", "phir bhi tumko", "tujhe bhula diya",
            "alone", "heartbreak", "ronde", "tanha", "gham", "roya", "dooriyan"
        ]
        if any(k in combined for k in sad_keywords):
            return "Sad"

        focus_keywords = [
            "focus", "lo-fi", "lofi", "study", "instrumental", "classical", "piano",
            "ambient", "flow", "meditation", "breeze", "concentration", "deep work", "acoustic guitar", "binaural"
        ]
        if any(k in combined for k in focus_keywords):
            return "Focus"

        calm_keywords = [
            "calm", "peace", "acoustic", "shanti", "soothing", "ocean", "sukoon",
            "khamoshiyan", "kun faya", "hawaa", "baarish", "iktara", "safarnama",
            "sham", "peaceful", "serene", "tranquil", "sleep", "relax", "weightless"
        ]
        if any(k in combined for k in calm_keywords):
            return "Calm"

        happy_keywords = [
            "happy", "smile", "sunshine", "cheerful", "celebration", "ilahi",
            "matargashti", "subhanallah", "gallan goodiyan", "joy", "fun", "uplifting",
            "good vibe", "festive"
        ]
        if any(k in combined for k in happy_keywords):
            return "Happy"

        return "Calm"

    def search_tracks(self, query: str, limit: int = 12, filter_artist: str = "") -> List[Dict]:
        """Multi-provider search: Curated -> Spotify Web API -> YouTube API -> iTunes API."""
        tQ = normalize_search(query)
        aQ = normalize_search(filter_artist)
        if not tQ and not aQ:
            return []

        scored_results: List[Dict] = []
        seen_keys = set()

        # 1. Curated Hits Match (Strict title vs artist check)
        for hit in CURATED_SEARCH_HITS:
            h_name = normalize_search(hit["name"])
            h_artist = normalize_search(hit["artist"])
            score = 0.0

            if tQ and aQ:
                titleMatch = (tQ in h_name or h_name in tQ or difflib.SequenceMatcher(None, tQ, h_name).ratio() >= 0.75)
                artistMatch = (aQ in h_artist or h_artist in aQ or difflib.SequenceMatcher(None, aQ, h_artist).ratio() >= 0.75)
                if titleMatch and artistMatch:
                    score = 1.0
                elif titleMatch:
                    score = 0.85
                elif artistMatch:
                    score = 0.82
            elif tQ and not aQ:
                if tQ in h_name or h_name in tQ:
                    score = 1.0
                elif tQ in h_artist or h_artist in tQ:
                    score = 0.95
                else:
                    score = max(difflib.SequenceMatcher(None, tQ, h_name).ratio(), difflib.SequenceMatcher(None, tQ, h_artist).ratio())
            elif not tQ and aQ:
                if aQ in h_artist or h_artist in aQ:
                    score = 1.0
                else:
                    score = difflib.SequenceMatcher(None, aQ, h_artist).ratio()

            if score >= 0.70:
                key = f"{hit['name'].lower()}:{hit['artist'].lower()}"
                if key not in seen_keys:
                    seen_keys.add(key)
                    hit_copy = dict(hit)
                    hit_copy["score"] = score
                    hit_copy["detected_mood"] = hit.get("detected_mood") or self.infer_mood(hit["name"], hit["artist"])
                    hit_copy["mood_match"] = hit_copy["detected_mood"]
                    scored_results.append(hit_copy)

        # 2. Spotify Web API Search (Official tracks, Authentic 640x640 album art)
        if len(scored_results) < limit:
            token = self._get_spotify_token()
            if token:
                try:
                    from .music_player import music_player
                    s_query = f"{query} {filter_artist}".strip()
                    if query and filter_artist:
                        s_query = f"track:{query} artist:{filter_artist}"
                    elif not query and filter_artist:
                        s_query = f"artist:{filter_artist}"

                    s_resp = requests.get(
                        "https://api.spotify.com/v1/search",
                        params={"q": s_query, "type": "track", "limit": max(limit * 2, 10)},
                        headers={"Authorization": f"Bearer {token}"},
                        timeout=3.5
                    )
                    if s_resp.status_code == 200:
                        s_items = s_resp.json().get("tracks", {}).get("items", [])
                        for s_item in s_items:
                            s_name = s_item.get("name", "")
                            s_artists = [a.get("name", "") for a in s_item.get("artists", [])]
                            s_artist = ", ".join(s_artists)
                            key = f"{s_name.lower()}:{s_artist.lower()}"
                            if key in seen_keys:
                                continue

                            s_images = s_item.get("album", {}).get("images", [])
                            s_img = s_images[0].get("url") if s_images else None
                            s_dur = int(s_item.get("duration_ms", 210000) / 1000)

                            yt_id = None
                            full_title = f"{s_artist} {s_name}".lower()
                            for song_k, vid in music_player.POPULAR_SONG_MAP.items():
                                if song_k in full_title or song_k in s_name.lower():
                                    yt_id = vid
                                    break
                            if not yt_id:
                                with music_player._lock:
                                    yt_id = music_player.cache.get(f"{s_artist} {s_name}") or music_player.cache.get(full_title)

                            detected = self.infer_mood(s_name, s_artist)
                            seen_keys.add(key)
                            scored_results.append({
                                "id": f"spotify-{s_item.get('id')}",
                                "name": s_name,
                                "artist": s_artist,
                                "image": s_img or (f"https://i.ytimg.com/vi/{yt_id}/hqdefault.jpg" if yt_id else f"https://ui-avatars.com/api/?name={s_name}&background=1e1b4b&color=a855f7&size=400&bold=true"),
                                "duration": s_dur,
                                "preview_url": s_item.get("preview_url"),
                                "youtube_id": yt_id,
                                "detected_mood": detected,
                                "mood_match": detected,
                                "score": 0.88,
                                "source": "spotify"
                            })
                except Exception:
                    pass

        # 3. YouTube Search API (Covers every single song, underground rap & video)
        if len(scored_results) < limit:
            try:
                from .config import Config
                yt_service = Config.get_youtube()
                if yt_service:
                    yt_query = f"{query} {filter_artist} official audio song".strip()
                    request = yt_service.search().list(
                        q=yt_query,
                        part="snippet",
                        maxResults=max(limit, 6),
                        type="video"
                    )
                    yt_resp = request.execute()
                    items = yt_resp.get("items", [])
                    for item in items:
                        vid = item.get("id", {}).get("videoId")
                        snippet = item.get("snippet", {})
                        title = snippet.get("title", "")
                        channel = snippet.get("channelTitle", "")
                        if not vid or not title:
                            continue

                        # Clean title
                        clean_title = re.sub(r'[\(\[\{].*?[\)\]\}]', '', title).strip()
                        key = f"{clean_title.lower()}:{channel.lower()}"
                        if key in seen_keys:
                            continue

                        seen_keys.add(key)
                        thumb = snippet.get("thumbnails", {}).get("high", {}).get("url") or f"https://i.ytimg.com/vi/{vid}/hqdefault.jpg"
                        detected = self.infer_mood(clean_title, channel)
                        scored_results.append({
                            "id": f"yt-{vid}",
                            "name": clean_title,
                            "artist": filter_artist or channel,
                            "image": thumb,
                            "duration": 210,
                            "youtube_id": vid,
                            "detected_mood": detected,
                            "mood_match": detected,
                            "score": 0.84,
                            "source": "youtube"
                        })
            except Exception:
                pass

        # 4. iTunes Search Fallback
        if len(scored_results) < limit:
            try:
                from .music_player import music_player
                norm_term = normalize_search(f"{query} {filter_artist}".strip())
                resp = requests.get(
                    "https://itunes.apple.com/search",
                    params={"term": norm_term, "entity": "song", "limit": max(limit * 2, 10)},
                    timeout=3.5
                )
                if resp.status_code == 200:
                    results = resp.json().get("results", [])
                    for item in results:
                        t_name = item.get("trackName", "")
                        t_artist = item.get("artistName", "")
                        if not t_name:
                            continue
                        key = f"{t_name.lower()}:{t_artist.lower()}"
                        if key in seen_keys:
                            continue

                        raw_art = item.get("artworkUrl100", "")
                        high_res = raw_art.replace("100x100bb", "600x600bb") if raw_art else None
                        dur = int(item.get("trackTimeMillis", 210000) / 1000)

                        yt_id = None
                        full_title = f"{t_artist} {t_name}".lower()
                        for song_k, vid in music_player.POPULAR_SONG_MAP.items():
                            if song_k in full_title or song_k in t_name.lower():
                                yt_id = vid
                                break
                        if not yt_id:
                            with music_player._lock:
                                yt_id = music_player.cache.get(f"{t_artist} {t_name}") or music_player.cache.get(full_title)

                        seen_keys.add(key)
                        detected = self.infer_mood(t_name, t_artist, item.get("primaryGenreName", ""))
                        scored_results.append({
                            "id": f"itunes-{item.get('trackId')}",
                            "name": t_name,
                            "artist": t_artist,
                            "image": high_res or (f"https://i.ytimg.com/vi/{yt_id}/hqdefault.jpg" if yt_id else f"https://ui-avatars.com/api/?name={t_name}&background=1e1b4b&color=a855f7&size=400&bold=true"),
                            "duration": dur,
                            "preview_url": item.get("previewUrl"),
                            "youtube_id": yt_id,
                            "detected_mood": detected,
                            "mood_match": detected,
                            "score": 0.75,
                            "source": "itunes"
                        })
            except Exception:
                pass

        # Sort all results by score descending
        scored_results.sort(key=lambda x: x.get("score", 0.0), reverse=True)
        return scored_results[:limit]


artwork_service = ArtworkService()
