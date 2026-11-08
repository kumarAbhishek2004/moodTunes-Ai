with open('frontend/src/pages/PlaylistsPage.jsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()
for i, line in enumerate(lines):
    if any(k in line.lower() for k in ['artist', 'drag', 'time', 'queue', 'actions']):
        safe = line.encode('ascii', 'replace').decode()
        if any(h in safe for h in ['#', 'TITLE', 'ARTIST', 'TIME', 'ACTIONS', 'Next', 'Queue']):
            print(f"{i+1}: {safe.strip()[:100]}")
