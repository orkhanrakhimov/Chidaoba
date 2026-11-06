"""Builds the printable waiver PDFs (A4) in English and Georgian: python3 _src/make_waivers.py"""
import os, re, sys
sys.path.insert(0, os.path.dirname(__file__))
import waivers as W
from playwright.sync_api import sync_playwright
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
css = open(os.path.join(ROOT, "assets/css/site.css"), encoding="utf-8").read()
wv = css[css.index("/* camp waivers"):]
wv = re.sub(r"@media \(max-width:700px\)\{[^}]*\}\}?", "", wv)
fonts = (f"@font-face{{font-family:'Archivo';src:url(file://{ROOT}/assets/fonts/archivo-latin.woff2);font-weight:300 800}}"
         f"@font-face{{font-family:'Gremi Web';src:url(file://{ROOT}/assets/fonts/gremi-web.woff);unicode-range:U+10A0-10FF,U+1C90-1CBF,U+2D00-2D2F,U+0020-0021,U+0025,U+0028-0029,U+002C-002E,U+0030-003B,U+003F,U+00A0}}")
os.makedirs(os.path.join(ROOT, "assets/docs"), exist_ok=True)
with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_page()
    for k, w in W.WAIVERS.items():
        for lang in ("en", "ka"):
            ff = "'Gremi Web','Archivo',sans-serif" if lang == "ka" else "'Archivo',sans-serif"
            html = (f"<!doctype html><html lang='{lang}'><head><meta charset='utf-8'><title>{w['title'][0 if lang=='en' else 1]}</title>"
                    f"<style>{fonts}{wv}body{{margin:0;font-family:{ff};background:#fff}}.wv-doc{{border-radius:0;padding:0;max-width:none;font-size:10.5pt}}"
                    f"{'.wv-doc{letter-spacing:.03em}.wv-f span,.wv-foot{font-size:10pt}' if lang=='ka' else ''}</style></head><body>{W.doc_html(w, lang)}</body></html>")
            tmp = f"/tmp/wv-{k}-{lang}.html"; open(tmp, "w", encoding="utf-8").write(html)
            pg.goto("file://" + tmp); pg.wait_for_timeout(500)
            out = os.path.join(ROOT, "assets/docs", f"chidaoba-waiver-{k}{'' if lang=='en' else '-ka'}.pdf")
            pg.pdf(path=out, format="A4", margin={"top": "14mm", "bottom": "14mm", "left": "14mm", "right": "14mm"}, print_background=True,
                   display_header_footer=True, header_template="<span></span>",
                   footer_template="<div style='font-size:8px;width:100%;text-align:center;color:#777'><span class='pageNumber'></span> / <span class='totalPages'></span></div>")
            print(out, os.path.getsize(out))
