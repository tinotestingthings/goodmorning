#!/usr/bin/env python3
"""Luisterinus worker (fase 2) — werkt de podcast-wachtrij af.

Per rij met status `requested` in Supabase `podcast_queue` (laatste 14 dagen, zelfde
venster als de app): bron-URL in een nieuw NotebookLM-notebook, Audio Overview (Brief,
Engels), m4a downloaden, uploaden naar de privébucket `digest-audio`, rij op `ready`.
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
import time
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timedelta, timezone
from pathlib import Path

# notebooklm importeren kost ~2,5 s; bij een lege ronde (elke 15 min) slaan we dat
# over. load_notebooklm() vult deze namen zodra er werk is.
AudioFormat = AudioLength = NotebookLMClient = None


def load_notebooklm():
    global AudioFormat, AudioLength, NotebookLMClient
    from notebooklm import AudioFormat, AudioLength, NotebookLMClient


SUPABASE_URL = "https://bobltktjohhnoqhnxslf.supabase.co"
TABLE = "podcast_queue"
BUCKET = "digest-audio"
LANGUAGE = "en"        # fase 0 (Tinus, 22 aug): Brief-formaat; Engels gekozen (NL was ook acceptabel)
DAYS = 14              # oudere requested-rijen zijn in de app onzichtbaar -> niet meer maken
SOURCE_TIMEOUT = 180   # s — bron importeren
GEN_TIMEOUT = 900      # s — een Audio Overview duurt 3–10 min
LOCK = Path(tempfile.gettempdir()) / "luisterinus-worker.lock"

KEY = None  # service_role; pas gelezen in wachtrij-modus (de --test-url-proef heeft hem niet nodig)


def due(name, seconds):
    """True (en stempel verzet) als deze taak weer aan de beurt is. Houdt een
    ronde-elke-15-minuten goedkoop: geen refresh richting Google en geen
    opruimquery's als er niets te doen is. Stempels in de temp-map: na een
    herstart één extra ronde, en dat is precies goed."""
    f = Path(tempfile.gettempdir()) / ("luisterinus-" + name + ".stamp")
    try:
        if f.exists() and time.time() - f.stat().st_mtime < seconds:
            return False
        f.touch()
    except OSError:
        pass
    return True


class RunAborted(Exception):
    """Infra/login kapot: run stoppen, rijen onaangeraakt laten."""


class StillBusy(Exception):
    """Time-out terwijl NotebookLM waarschijnlijk nog werkt: rij blijft `requested`."""


# ---- Supabase (REST, service_role) -----------------------------------------

# Eerst een pad buiten iCloud: launchd-processen krijgen van macOS (TCC) géén
# toegang tot iCloud Drive, dus de symlink naar de vault geeft daar Errno 1
# "Operation not permitted" — terwijl dezelfde regel met de hand wél werkt (die
# erft de rechten van je terminal). Dat kostte 104 stille crashes, 30 aug-1 sep.
# Roteert de sleutel ooit, ververs dan ook ~/.config/goodmorning.env.
SECRETS_FILES = [
    Path.home() / ".config/goodmorning.env",
    Path.home() / "Code/secrets/goodmorning.env",
    Path.home() / "Library/Mobile Documents/com~apple~CloudDocs/Mijn Wiki/.secrets.nosync/goodmorning.env",
]


def service_role():
    key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")  # fase 3: de Cowork-taak sourcet het .env-bestand
    for f in SECRETS_FILES:
        if key:
            break
        try:
            if f.is_file():
                for line in f.read_text().splitlines():
                    if line.startswith("SUPABASE_SERVICE_ROLE_KEY="):
                        key = line.split("=", 1)[1].strip().strip("'\"")
                        break
        except OSError as e:  # o.a. TCC op iCloud: geen traceback, wel een bruikbare regel
            print(f"sleutelbestand niet leesbaar ({f}): {e.strerror}", flush=True)
    if not key:
        raise SystemExit("SUPABASE_SERVICE_ROLE_KEY niet gevonden. Zet een kopie buiten iCloud: "
                         "install -m 600 /dev/null ~/.config/goodmorning.env && "
                         "cat ~/Code/secrets/goodmorning.env > ~/.config/goodmorning.env")
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


def iso_days_ago(days):
    return (datetime.now(timezone.utc) - timedelta(days=days)).isoformat()


def fetch_requested():
    return sb("GET", f"/rest/v1/{TABLE}?status=eq.requested&requested_at=gte.{q(iso_days_ago(DAYS))}"
                     "&select=id,item_url,title&order=requested_at.asc") or []


def patch(filter_, body):
    sb("PATCH", f"/rest/v1/{TABLE}?{filter_}", json.dumps(body).encode(),
       {"Content-Type": "application/json", "Prefer": "return=minimal"})


def upload(object_path, local):
    sb("POST", f"/storage/v1/object/{BUCKET}/" + urllib.parse.quote(object_path, safe="/"),
       Path(local).read_bytes(), {"Content-Type": "audio/mp4", "x-upsert": "true"})


def audio_seconds(path):
    """Duur in seconden via macOS `afinfo`; None als dat niet lukt (de app toont dan geen duur)."""
    try:
        out = subprocess.run(["afinfo", str(path)], capture_output=True, text=True, timeout=30).stdout
        for line in out.splitlines():
            if "estimated duration" in line:
                return int(float(line.split(":")[1].split()[0]))
    except Exception:
        pass
    return None


# ---- NotebookLM ------------------------------------------------------------

def keepalive():
    # fase 3: cookies élke run verversen — óók bij een lege wachtrij, anders verloopt
    # de login stil in weken zonder verzoeken. Best-effort; de preflight oordeelt.
    try:
        r = subprocess.run(["notebooklm", "auth", "refresh", "--quiet"], capture_output=True, text=True, timeout=120)
        if r.returncode != 0:
            print(f"keepalive-refresh gaf exit {r.returncode}: {((r.stderr or r.stdout) or '').strip()[:120]}", flush=True)
    except Exception as e:
        print(f"keepalive-refresh niet gelukt ({type(e).__name__})", flush=True)


def preflight():
    try:
        r = subprocess.run(["notebooklm", "auth", "check", "--test"], capture_output=True, text=True, timeout=120)
    except (subprocess.SubprocessError, OSError) as e:  # hang, of CLI niet op PATH
        raise RunAborted(f"notebooklm-CLI reageert niet ({type(e).__name__}) — installeer/controleer notebooklm-py") from None
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
    secs = audio_seconds(out)
    log(f"gedownload ({Path(out).stat().st_size // 1024} kB, {secs or '?'} s)")
    try:
        await client.notebooks.delete(nb.id)  # alleen na succes opruimen; bij een fout blijft het notebook staan
    except Exception as e:
        log(f"notebook {nb.id} niet opgeruimd ({type(e).__name__}); audio is wel binnen")
    return secs


async def process(client, row):
    rid = row["id"]

    def log(m):
        print(f"[{rid}] {m}", flush=True)

    try:
        with tempfile.TemporaryDirectory() as td:
            out = Path(td) / f"{rid}.m4a"
            secs = await make_podcast(client, row.get("title"), row.get("item_url"), out, log)
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
    body = {"status": "ready", "audio_path": f"{rid}.m4a"}
    if secs:
        body["duration_s"] = secs
    try:
        patch(f"id=eq.{q(rid)}", body)
        log("ready")
    except Exception as e:
        # Tweede poging zonder duration_s: ontbreekt die kolom (migratie niet
        # gedraaid, of PostgREST-schemacache loopt achter), dan zou de rij op
        # `requested` blijven staan en maakt de volgende run de hele podcast
        # opnieuw. Liever ready zonder duur dan eindeloos hergenereren.
        if "duration_s" in body:
            try:
                patch(f"id=eq.{q(rid)}", {"status": "ready", "audio_path": f"{rid}.m4a"})
                log(f"ready (zonder duur: {str(e)[:120]})")
                return
            except Exception as e2:
                e = e2
        log(f"audio staat in de bucket maar status niet gezet ({str(e)[:160]}); volgende run maakt hem opnieuw")


# ---- Opruimen (fase 3) -----------------------------------------------------
# Rijen ouder dan het app-venster weg; daarna elk bucketbestand zonder rij
# (verlopen afleveringen, in de app verwijderde rijen, oude testbestanden).
# Alleen platte namen: de worker schrijft altijd `<id>.m4a` in de bucket-root;
# mapjes (id=None in de listing) laten we staan.

def cleanup():
    # Eén dag achter het app/worker-venster: een rij die bij het ophalen nog nét
    # binnen 14 dagen viel (of in een open app-lijst staat), wordt nooit in
    # dezelfde adem verwijderd — verwerken duurt minuten, geen dag.
    sb("DELETE", f"/rest/v1/{TABLE}?requested_at=lt.{q(iso_days_ago(DAYS + 1))}")
    keep = {r["audio_path"] for r in (sb("GET", f"/rest/v1/{TABLE}?select=audio_path") or []) if r.get("audio_path")}
    if not keep:  # CLAUDE.md-regel 2: "leeg" is nooit bewijs dat alles weg mag — sweep wacht op de volgende run met rijen
        print("geen rijen met audio_path — bestandssweep overgeslagen", flush=True)
        return
    # ponytail: één pagina van 1000 is ruim boven het 14-dagenvenster (~30 bestanden); pagineren pas als dat ooit knelt
    objs = sb("POST", f"/storage/v1/object/list/{BUCKET}",
              json.dumps({"prefix": "", "limit": 1000}).encode(), {"Content-Type": "application/json"}) or []
    for o in objs:
        name = o.get("name")
        if o.get("id") and name and name not in keep:
            sb("DELETE", f"/storage/v1/object/{BUCKET}/" + urllib.parse.quote(name, safe="/"))
            print(f"opgeruimd: {name}", flush=True)


async def run_queue():
    rows = fetch_requested()
    if rows:
        keepalive()
        load_notebooklm()
        preflight()
        async with NotebookLMClient.from_storage() as client:
            for row in rows:
                await process(client, row)
    elif due("keepalive", 12 * 3600):
        keepalive()   # geen werk: login hooguit 2x per dag vers houden, niet elke ronde
    if due("cleanup", 24 * 3600):
        try:  # best-effort, nooit de reden dat een run "mislukt"
            cleanup()
        except Exception as e:
            print(f"opruimen niet gelukt (volgende run opnieuw): {str(e)[:160]}", flush=True)


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
    load_notebooklm()
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
