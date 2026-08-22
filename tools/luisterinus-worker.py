#!/usr/bin/env python3
"""Luisterinus worker (fase 2) — werkt de podcast-wachtrij af.

Per rij met status `requested` in Supabase `podcast_queue` (laatste 14 dagen, zelfde
venster als de app): bron-URL in een nieuw NotebookLM-notebook, Audio Overview (Brief,
Nederlands), m4a downloaden, uploaden naar de privébucket `digest-audio`, rij op `ready`.
Elke rij is best-effort: een inhoudelijke fout geeft één logregel + `failed`, en de
volgende rij gaat door. Infra-fouten (login verlopen, NotebookLM onbereikbaar) breken de
run af en laten de rijen onaangeraakt (exit 2), zodat je "draai notebooklm login" ziet
in plaats van een rij vol "mislukt".

Gebruik:
  python3 tools/luisterinus-worker.py                       # wachtrij afwerken (exit 0, ook bij failed-rijen; 2 = afgebroken)
  python3 tools/luisterinus-worker.py --test-url URL --out podcast.m4a   # losse proef, geen Supabase

Vereist: `pip install "notebooklm-py[browser]"` + `notebooklm login` (eenmalig), en de
service_role als `SUPABASE_SERVICE_ROLE_KEY` in `~/Code/secrets/goodmorning.env` (symlink naar
`Mijn Wiki/.secrets.nosync/goodmorning.env`, zie Automations.md) of als omgevingsvariabele —
wordt bij het starten gelezen, staat nergens in dit bestand. notebooklm-py praat met ongedocumenteerde
Google-endpoints en kan zonder waarschuwing breken; daarom raakt dit script de digest
zelf nooit aan (feed.json blijft van één schrijver).
"""
import argparse
import asyncio
import fcntl
import json
import os
import subprocess
import sys
import tempfile
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timedelta, timezone
from pathlib import Path

from notebooklm import AudioFormat, AudioLength, NotebookLMClient

SUPABASE_URL = "https://bobltktjohhnoqhnxslf.supabase.co"
TABLE = "podcast_queue"
BUCKET = "digest-audio"
LANGUAGE = "nl"        # fase 0 (Tinus, 22 aug): NL en EN allebei acceptabel; Brief-formaat gekozen
DAYS = 14              # oudere requested-rijen zijn in de app onzichtbaar -> niet meer maken
SOURCE_TIMEOUT = 180   # s — bron importeren
GEN_TIMEOUT = 900      # s — een Audio Overview duurt 3–10 min
LOCK = Path(tempfile.gettempdir()) / "luisterinus-worker.lock"

KEY = None  # service_role; pas gelezen in wachtrij-modus (de --test-url-proef heeft hem niet nodig)


class RunAborted(Exception):
    """Infra/login kapot: run stoppen, rijen onaangeraakt laten."""


class StillBusy(Exception):
    """Time-out terwijl NotebookLM waarschijnlijk nog werkt: rij blijft `requested`."""


# ---- Supabase (REST, service_role) -----------------------------------------

SECRETS_FILES = [  # conventie uit Mijn Wiki/90 System/Automations.md: één iCloud-vrij .env-bestand
    Path.home() / "Code/secrets/goodmorning.env",
    Path.home() / "Library/Mobile Documents/com~apple~CloudDocs/Mijn Wiki/.secrets.nosync/goodmorning.env",
]


def service_role():
    key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")  # fase 3: de Cowork-taak sourcet het .env-bestand
    for f in SECRETS_FILES:
        if key:
            break
        if f.is_file():
            for line in f.read_text().splitlines():
                if line.startswith("SUPABASE_SERVICE_ROLE_KEY="):
                    key = line.split("=", 1)[1].strip().strip("'\"")
                    break
    if not key:
        raise SystemExit("SUPABASE_SERVICE_ROLE_KEY niet gevonden (env of " + str(SECRETS_FILES[0]) + ")")
    return key


def sb(method, path, data=None, headers=None):
    h = {"apikey": KEY, "Authorization": "Bearer " + KEY}
    if headers:
        h.update(headers)
    req = urllib.request.Request(SUPABASE_URL + path, data=data, method=method, headers=h)
    try:
        with urllib.request.urlopen(req, timeout=120) as r:
            txt = r.read().decode()
    except urllib.error.HTTPError as e:  # de body zegt wát er mis is (bijv. 42501 permission denied)
        raise RuntimeError(f"Supabase {e.code} op {method} {path.split('?')[0]}: {e.read().decode()[:300]}") from None
    return json.loads(txt) if txt else None


def q(s):
    return urllib.parse.quote(s, safe="")


def fetch_requested():
    since = (datetime.now(timezone.utc) - timedelta(days=DAYS)).isoformat()
    return sb("GET", f"/rest/v1/{TABLE}?status=eq.requested&requested_at=gte.{q(since)}"
                     "&select=id,item_url,title&order=requested_at.asc") or []


def patch(filter_, body):
    sb("PATCH", f"/rest/v1/{TABLE}?{filter_}", json.dumps(body).encode(),
       {"Content-Type": "application/json", "Prefer": "return=minimal"})


def upload(object_path, local):
    sb("POST", f"/storage/v1/object/{BUCKET}/" + urllib.parse.quote(object_path, safe="/"),
       Path(local).read_bytes(), {"Content-Type": "audio/mp4", "x-upsert": "true"})


# ---- NotebookLM ------------------------------------------------------------

def preflight():
    r = subprocess.run(["notebooklm", "auth", "check", "--test"], capture_output=True, text=True, timeout=120)
    if r.returncode != 0:
        raise RunAborted("NotebookLM-login verlopen of kapot — draai: notebooklm login")


async def make_podcast(client, title, url, out, log):
    if not url:
        raise ValueError("geen item_url")
    try:
        nb = await client.notebooks.create((title or "Luisterinus")[:80])
    except Exception as e:  # nog niets inhoudelijks gebeurd: dit is infra, geen rij-fout
        raise RunAborted(f"NotebookLM onbereikbaar: {type(e).__name__}: {str(e)[:160]}") from e
    log(f"notebook {nb.id}")
    await client.sources.add_url(nb.id, url, wait=True, wait_timeout=SOURCE_TIMEOUT)
    log("bron toegevoegd")
    st = await client.artifacts.generate_audio(
        nb.id, language=LANGUAGE, audio_format=AudioFormat.BRIEF, audio_length=AudioLength.DEFAULT)
    log(f"audio gestart (task {st.task_id}), wachten…")
    try:
        res = await client.artifacts.wait_for_completion(nb.id, st.task_id, timeout=GEN_TIMEOUT)
    except (asyncio.TimeoutError, TimeoutError) as e:
        raise StillBusy(nb.id) from e
    if getattr(res, "is_failed", False):
        msg = getattr(res, "error", None) or getattr(res, "error_code", None) or "generatie mislukt"
        if getattr(res, "is_rate_limited", False):
            msg = f"quotum/rate-limit bereikt — {msg}"
        raise RuntimeError(f"NotebookLM: {msg}")
    if not getattr(res, "is_complete", True):
        raise StillBusy(nb.id)
    await client.artifacts.download_audio(nb.id, str(out))
    log(f"gedownload ({Path(out).stat().st_size // 1024} kB)")
    try:
        await client.notebooks.delete(nb.id)  # alleen na succes opruimen; bij een fout blijft het notebook staan
    except Exception as e:
        log(f"notebook {nb.id} niet opgeruimd ({type(e).__name__}); audio is wel binnen")


async def process(client, row):
    rid = row["id"]

    def log(m):
        print(f"[{rid}] {m}", flush=True)

    try:
        with tempfile.TemporaryDirectory() as td:
            out = Path(td) / f"{rid}.m4a"
            await make_podcast(client, row.get("title"), row.get("item_url"), out, log)
            upload(f"{rid}.m4a", out)
    except RunAborted:
        raise
    except StillBusy as e:
        log(f"time-out; NotebookLM werkt mogelijk nog (notebook {e}) — rij blijft 'requested'")
        return
    except Exception as e:  # inhoudelijk mislukt: één regel, door met de volgende
        log(f"FAILED: {type(e).__name__}: {str(e)[:200]}")
        try:  # statusguard: een verse "probeer opnieuw" van de gebruiker niet overschrijven
            patch(f"id=eq.{q(rid)}&status=eq.requested", {"status": "failed"})
        except Exception as e2:
            log(f"status kon niet op failed: {e2}")
        return
    try:
        patch(f"id=eq.{q(rid)}", {"status": "ready", "audio_path": f"{rid}.m4a"})
        log("ready")
    except Exception as e:  # audio staat al in de bucket; niet op failed zetten
        log(f"audio staat in de bucket maar status niet gezet ({e}); volgende run maakt hem af")


async def run_queue():
    rows = fetch_requested()
    if not rows:
        print("wachtrij leeg")
        return
    preflight()
    async with NotebookLMClient.from_storage() as client:
        for row in rows:
            await process(client, row)


def locked_run():
    # ponytail: procesvergrendeling op deze ene Mac is genoeg tegen overlappende runs
    # (fase 3-cron + handmatige start); een rij-claim in de tabel pas als er ooit meer
    # machines meedoen.
    with open(LOCK, "w") as lf:
        try:
            fcntl.flock(lf, fcntl.LOCK_EX | fcntl.LOCK_NB)
        except BlockingIOError:
            print("al bezig (andere run houdt de lock) — niets gedaan")
            return 0
        try:
            asyncio.run(run_queue())
            return 0
        except RunAborted as e:
            print(f"AFGEBROKEN: {e}", flush=True)
            return 2


async def run_test(url, out):
    async with NotebookLMClient.from_storage() as client:
        await make_podcast(client, "Luisterinus proef", url, Path(out), lambda m: print(m, flush=True))


def main():
    ap = argparse.ArgumentParser(description="Luisterinus: podcast-wachtrij afwerken via NotebookLM")
    ap.add_argument("--test-url", help="één URL omzetten zonder Supabase (proef)")
    ap.add_argument("--out", default="podcast.m4a", help="uitvoerbestand bij --test-url")
    a = ap.parse_args()
    if a.test_url:
        try:
            asyncio.run(run_test(a.test_url, a.out))
            return 0
        except Exception as e:
            print(f"FAILED: {type(e).__name__}: {str(e)[:300]}", flush=True)
            return 1
    global KEY
    KEY = service_role()
    return locked_run()


if __name__ == "__main__":
    sys.exit(main())
