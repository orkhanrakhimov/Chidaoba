"""Build-time translation for chidaoba.com.

The English pages are generated first. Each one is then copied to /ka/ and /ru/
with every visible text, attribute and JSON string swapped for its translation
from _src/i18n/<lang>.json. Internal links get the language prefix.
Keys can contain {placeholders} (used by the live translator for dynamic text).
"""
import html as H
import json
import os
import re

LANGS = ["ka"]
NAMES = {"en": "EN", "ka": "KA"}
FULL = {"en": "English", "ka": "ქართული"}
LOCALE = {"en": "en", "ka": "ka", "ru": "ru"}
HERE = os.path.dirname(os.path.abspath(__file__))

TOKEN = re.compile(r'(<!--.*?-->|<script\b[^>]*>.*?</script>|<style\b[^>]*>.*?</style>|<[^>]+>)', re.S)
ATTR = re.compile(r'(\s(?:placeholder|aria-label|title|alt|content|data-ok-text)=")([^"]*)(")')
HREF = re.compile(r'(\s(?:href|action)=")(/[^"]*)(")')
SAME = re.compile(r"^([\d.,\-– ]+ ?(cm|kg|in|ml)|EU [\d\-]+|[A-Z]\d|X{0,2}[SML]|XXL|XL|@\w+.*|CHIDAOBA( CULTURE)?|Chidaoba Culture|BJJ|WhatsApp|Instagram|Facebook|EN|KA|RU|\d+)$")
KEEP = ("/assets/", "/admin", "//", "/site.webmanifest", "/ka/")


def load(lang):
    p = os.path.join(HERE, "i18n", lang + ".json")
    return json.load(open(p, encoding="utf-8")) if os.path.exists(p) else {}


def norm(s):
    return " ".join(s.split())


class Tr:
    def __init__(self, lang):
        self.lang, self.d, self.missing = lang, load(lang), set()
        self.pats = []
        for k, v in sorted(self.d.items(), key=lambda kv: -len(kv[0])):
            if "{" in k and v:
                names = re.findall(r"\{(\w+)\}", k)
                rx = re.escape(k)
                for n in names:
                    rx = rx.replace(re.escape("{" + n + "}"), "(.+?)", 1)
                self.pats.append((re.compile("^" + rx + "$"), names, v))

    def lookup(self, key, depth=0):
        if key in self.d and self.d[key]:
            return self.d[key]
        if SAME.match(key):
            return key
        if depth < 4:
            for rx, names, out in self.pats:
                m = rx.match(key)
                if m:
                    for n, val in zip(names, m.groups()):
                        out = out.replace("{" + n + "}", self.lookup(val, depth + 1) or val)
                    return out
        return None

    def text(self, raw, escaped=True):
        val = H.unescape(raw) if escaped else raw
        key = norm(val)
        if not key or not re.search(r"[A-Za-z]{2}", key):
            return raw
        out = self.lookup(key)
        if out is not None:
            lead = raw[: len(raw) - len(raw.lstrip())]
            trail = raw[len(raw.rstrip()):]
            return lead + (H.escape(out, quote=False) if escaped else out) + trail
        self.missing.add(key)
        return raw

    def json_strings(self, o):
        if isinstance(o, str):
            return self.text(o, escaped=False)
        if isinstance(o, list):
            return [self.json_strings(v) for v in o]
        if isinstance(o, dict):
            return {k: self.json_strings(v) for k, v in o.items()}
        return o

    def link(self, href):
        if href.startswith(KEEP):
            return href
        return "/" + self.lang + href

    def page(self, doc, path):
        out = []
        for tok in TOKEN.split(doc):
            if not tok:
                continue
            if tok.startswith("<script"):
                m = re.match(r'(<script\b[^>]*type="application/json"[^>]*>)(.*)(</script>)$', tok, re.S)
                if m:
                    data = self.json_strings(json.loads(m.group(2)))
                    tok = m.group(1) + json.dumps(data, ensure_ascii=False).replace("</", "<\\/") + m.group(3)
                out.append(tok)
            elif tok.startswith("<!--") or tok.startswith("<style"):
                out.append(tok)
            elif tok.startswith("<"):
                if tok.startswith(("<meta", "<img", "<input", "<textarea", "<a ", "<button", "<nav", "<section", "<div", "<form", "<svg", "<span", "<label", "<aside", "<article", "<header", "<footer", "<ul", "<details", "<fieldset", "<select", "<iframe", "<p ", "<h")):
                    tok = ATTR.sub(lambda m: m.group(1) + H.escape(self.text(H.unescape(m.group(2)), escaped=False)) + m.group(3), tok)
                tok = HREF.sub(lambda m: m.group(1) + self.link(m.group(2)) + m.group(3), tok)
                out.append(tok)
            else:
                out.append(self.text(tok))
        doc = "".join(out)
        doc = doc.replace('<html lang="en">', f'<html lang="{LOCALE[self.lang]}">', 1)
        base = "https://chidaoba.com"
        doc = doc.replace(f'href="{base}{path}"', f'href="{base}/{self.lang}{path}"')
        doc = doc.replace(f'content="{base}{path}"', f'content="{base}/{self.lang}{path}"')
        return doc


def switcher(path, lang):
    items = []
    for l in ["en"] + LANGS:
        href = path if l == "en" else f"/{l}{path}"
        cur = ' aria-current="true" class="on"' if l == lang else ""
        items.append(f'<a href="{href}" hreflang="{l}" lang="{l}"{cur}><b>{NAMES[l]}</b>{FULL[l]}</a>')
    return (f'<details class="lang-dd"><summary aria-label="Language">{NAMES[lang]}<i aria-hidden="true"></i></summary>'
            f'<div class="lang-menu">{"".join(items)}</div></details>')


def alternates(path):
    base = "https://chidaoba.com"
    tags = [f'<link rel="alternate" hreflang="en" href="{base}{path}">']
    tags += [f'<link rel="alternate" hreflang="{l}" href="{base}/{l}{path}">' for l in LANGS]
    tags.append(f'<link rel="alternate" hreflang="x-default" href="{base}{path}">')
    return "\n".join(tags)


def runtime_js(lang):
    """Dictionary plus a small translator for text that page scripts create."""
    d = load(lang)
    src = open(os.path.join(HERE, "i18n-runtime.js"), encoding="utf-8").read()
    return f"window.CHD_LANG={json.dumps(lang)};window.CHD_I18N={json.dumps(d, ensure_ascii=False)};\n" + src
