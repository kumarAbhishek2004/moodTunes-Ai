from youtube_transcript_api import YouTubeTranscriptApi
import json

vid = "1GgL3jQrR6E"
api = YouTubeTranscriptApi()
try:
    transcripts = api.list(vid)
    for t in transcripts:
        fetched = t.fetch()
        res = [{"start": round(itm.start, 2), "duration": round(itm.duration, 2), "text": itm.text} for itm in fetched]
        with open("backend/lakshman_transcript.json", "w", encoding="utf-8") as f:
            json.dump(res, f, ensure_ascii=False, indent=2)
        print("Saved", len(res), "entries to backend/lakshman_transcript.json")
except Exception as e:
    print("Error:", e)
