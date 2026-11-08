import urllib.request
import re
import json
import xml.etree.ElementTree as ET

video_id = 'tpFRSu5v7VQ'
url = f'https://www.youtube.com/watch?v={video_id}'
headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'}

req = urllib.request.Request(url, headers=headers)
try:
    with urllib.request.urlopen(req, timeout=6) as resp:
        html = resp.read().decode('utf-8', errors='ignore')
        idx = html.find('captionTracks')
        if idx != -1:
            snippet = html[idx:idx+1500]
            m = re.search(r'baseUrl":"(https:[^"]+)', snippet)
            if m:
                cap_url = m.group(1).replace('\\u0026', '&')
                req2 = urllib.request.Request(cap_url, headers=headers)
                with urllib.request.urlopen(req2, timeout=6) as resp2:
                    xml_content = resp2.read().decode('utf-8')
                    root = ET.fromstring(xml_content)
                    print(f"Total caption lines found: {len(root)}")
                    for elem in root[:25]:
                        start = elem.attrib.get('start', '0')
                        dur = elem.attrib.get('dur', '0')
                        text = elem.text or ''
                        print(f"[{float(start):.1f}s - dur {float(dur):.1f}s] {text}")
        else:
            print("No captionTracks found")
except Exception as e:
    print(f"Error: {e}")
