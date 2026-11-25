"""Copy the public camp data from Supabase into _src/data/camps.json, so the build can write
camp details straight into the pages (search engines read them without running any script).
Uses only the public anon key that is already on the website. Run by .github/workflows/camp-pages.yml."""
import json, os, re, urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
cfg = open(os.path.join(ROOT, "assets", "js", "config.js"), encoding="utf-8").read()
url = re.search(r'SUPABASE_URL:\s*"([^"]+)"', cfg).group(1)
key = re.search(r'SUPABASE_ANON_KEY:\s*"([^"]+)"', cfg).group(1)
req = urllib.request.Request(url + "/rest/v1/camps?select=*&status=in.(published,sold_out,completed)&order=start_date.asc.nullslast",
                             headers={"apikey": key, "Authorization": "Bearer " + key})
camps = json.load(urllib.request.urlopen(req, timeout=30))
# keep only what the public pages show; drop timestamps so the file only changes when the content does
DROP = {"created_at", "updated_at"}
camps = [{k: v for k, v in c.items() if k not in DROP} for c in camps]
path = os.path.join(ROOT, "_src", "data", "camps.json")
new = json.dumps(camps, ensure_ascii=False, indent=1, sort_keys=True) + "\n"
old = open(path, encoding="utf-8").read() if os.path.exists(path) else ""
if new != old:
    open(path, "w", encoding="utf-8").write(new)
    print("camps.json updated:", len(camps), "camps")
else:
    print("camps.json unchanged")
