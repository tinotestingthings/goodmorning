#!/usr/bin/env python3
"""Snijdt de fragmenten uit het Clip lab tot losse audio-snippers en zet ze in
de privébucket `chordsprint-clips`. Geen microfoon, geen reclame: yt-dlp haalt
alleen de audiostream, ffmpeg knipt exact op de tijden uit jouw fragmentenlijst.

    python3 tools/chordsprint-snippets.py            # live (dd:)
    python3 tools/chordsprint-snippets.py --sandbox  # sandbox (sbx:)
    python3 tools/chordsprint-snippets.py --only int_m3_up,int_P4_down
    python3 tools/chordsprint-snippets.py --dry-run
    python3 tools/chordsprint-snippets.py --watch      # blijft draaien: knipt wat de app vraagt

Bron van waarheid is jouw eigen fragmententekst: die staat in Supabase-tabel
`chordsprint_state` onder de sleutel `<ns>cpt_clipLab`, precies zoals je hem in
het Clip lab hebt geknipt. Het script leest die, knipt elk fragment met een
beweging-label (m3 ↑) naar m4a, uploadt als `<pid>.m4a` en schrijft de index
terug in diezelfde rij (`<ns>cpt_clipSnips`), zodat de app weet wat er klaarstaat.

Nodig: yt-dlp + ffmpeg (`brew install yt-dlp ffmpeg`) en SUPABASE_SERVICE_ROLE_KEY
uit ~/Code/secrets/goodmorning.env (zelfde bron als tools/luisterinus-worker.py).

Let op: dit downloadt van YouTube, wat tegen hun voorwaarden is. Alles blijft
privé — besloten bucket, alleen jouw account, niets publiek.
"""

import argparse, json, os, re, shutil, subprocess, sys, tempfile, time, urllib.error, urllib.parse, urllib.request
from pathlib import Path

SUPABASE_URL = "https://bobltktjohhnoqhnxslf.supabase.co"
TABLE = "chordsprint_state"
BUCKET = "chordsprint-clips"
SECRETS_FILES = [
    Path.home() / "Code/secrets/goodmorning.env",
    Path.home() / "Library/Mobile Documents/com~apple~CloudDocs/Mijn Wiki/.secrets.nosync/goodmorning.env",
]
INTERVALS = ["m2", "M2", "m3", "M3", "P4", "TT", "P5", "m6", "M6", "m7", "M7", "P8"]
# zelfde regels als Segue.parseText: video-regel zet de video, daaronder bereiken
RANGE = re.compile(r"^([\d:.hms]+)\s*(?:-|–|—|tot|to)\s*([\d:.hms]+)\s*(.*)$", re.I)
VIDEO_ID = re.compile(r"(?:youtu\.be/|[?&]v=|/embed/|/shorts/|/live/)([\w-]{11})")
LABEL = re.compile(r"\b(" + "|".join(INTERVALS) + r")\s*(↑|↓)")


def service_key():
    key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    if key:
        return key
    for f in SECRETS_FILES:
        if f.exists():
            for line in f.read_text().splitlines():
                if line.startswith("SUPABASE_SERVICE_ROLE_KEY="):
                    return line.split("=", 1)[1].strip().strip("'\"")
    raise SystemExit("SUPABASE_SERVICE_ROLE_KEY niet gevonden (env of " + str(SECRETS_FILES[0]) + ")")


def sb(method, path, key, body=None, headers=None, raw=False):
    req = urllib.request.Request(SUPABASE_URL + path, method=method)
    req.add_header("apikey", key)
    req.add_header("Authorization", "Bearer " + key)
    for k, v in (headers or {}).items():
        req.add_header(k, v)
    data = None
    if body is not None:
        if raw:
            data = body
        else:
            data = json.dumps(body).encode()
            req.add_header("Content-Type", "application/json")
    with urllib.request.urlopen(req, data) as r:
        out = r.read()
    return json.loads(out) if out and not raw else out


def seconds(txt):
    txt = str(txt).strip()
    m = re.match(r"^(?:(\d+)h)?(?:(\d+)m)?(?:([\d.]+)s)?$", txt, re.I)
    if m and any(m.groups()):
        return int(m.group(1) or 0) * 3600 + int(m.group(2) or 0) * 60 + float(m.group(3) or 0)
    parts = txt.split(":")
    try:
        return sum(float(p) * 60 ** i for i, p in enumerate(reversed(parts)))
    except ValueError:
        return None


def parse_clips(text):
    """Zelfde interpretatie als de app: alleen regels met een beweging-label."""
    vid, out = None, []
    for raw in (text or "").splitlines():
        line = raw.strip()
        if not line or line.startswith("#"):
            continue
        parts = line.split()
        m = VIDEO_ID.search(parts[0]) or (re.fullmatch(r"[\w-]{11}", parts[0]) and re.match(r"(.*)", parts[0]))
        if m:
            vid = m.group(1) if m.re is VIDEO_ID else parts[0]
            parts = parts[1:]
        rest = " ".join(parts).strip()
        if not rest or not vid:
            continue
        r = RANGE.match(rest)
        if not r:
            continue
        start, end = seconds(r.group(1)), seconds(r.group(2))
        lab = LABEL.search(r.group(3) or "")
        if start is None or end is None or end <= start or not lab:
            continue
        pid = "int_%s_%s" % (lab.group(1), "up" if lab.group(2) == "↑" else "down")
        out.append({"pid": pid, "video": vid, "start": start, "end": end, "label": r.group(3).strip()})
    # eerste (= kortste knip staat bovenaan in de tekst) wint per beweging
    seen, uniq = set(), []
    for c in out:
        if c["pid"] in seen:
            continue
        seen.add(c["pid"])
        uniq.append(c)
    return uniq


def cut(clip, tmp, verbose=False):
    """Audio van één video ophalen (gecachet per video) en het bereik uitsnijden."""
    src = tmp / (clip["video"] + ".m4a")
    if not src.exists():
        print("   audio ophalen: " + clip["video"])
        subprocess.run(
            ["yt-dlp", "-f", "bestaudio[ext=m4a]/bestaudio", "-o", str(src), "--no-playlist",
             "--quiet", "--no-warnings", "https://www.youtube.com/watch?v=" + clip["video"]],
            check=True)
    dst = tmp / (clip["pid"] + ".m4a")
    subprocess.run(
        ["ffmpeg", "-y", "-loglevel", "error", "-ss", str(clip["start"]), "-to", str(clip["end"]),
         "-i", str(src), "-vn", "-c:a", "aac", "-b:a", "64k", "-ac", "1", str(dst)],
        check=True)
    return dst


def fetch_row(key, ns):
    rows = sb("GET", "/rest/v1/%s?select=user_id,data" % TABLE, key)
    rows = [r for r in rows if isinstance(r.get("data"), dict) and (ns + "cpt_clipLab") in r["data"]]
    if not rows:
        raise SystemExit("geen rij met %scpt_clipLab in %s — open het Clip lab eerst" % (ns, TABLE))
    return rows[0]


def process(clip, tmp, key, ns):
    """Knippen, uploaden, ondertekenen. Terug: index-item of None bij een fout."""
    try:
        path = cut(clip, tmp)
    except subprocess.CalledProcessError as e:
        print("   overgeslagen (yt-dlp/ffmpeg gaf een fout): " + str(e))
        return None
    obj = "%s/%s.m4a" % (ns.rstrip(":"), clip["pid"])
    sb("POST", "/storage/v1/object/" + urllib.parse.quote(BUCKET + "/" + obj, safe="/"), key,
       body=path.read_bytes(), raw=True,
       headers={"Content-Type": "audio/mp4", "x-upsert": "true"})
    sg = sb("POST", "/storage/v1/object/sign/" + urllib.parse.quote(BUCKET + "/" + obj, safe="/"),
            key, body={"expiresIn": 31536000})
    print("   %.0f KB geüpload" % (path.stat().st_size / 1024))
    return {"obj": obj, "url": SUPABASE_URL + "/storage/v1" + sg["signedURL"],
            "dur": round(clip["end"] - clip["start"], 1), "size": path.stat().st_size}


def save_index(row, key, ns, index, jobs_done):
    """Index bijwerken en afgehandelde aanvragen weghalen — in één schrijfactie."""
    fresh = fetch_row(key, ns)                      # verse rij: de app schrijft ook
    data = dict(fresh["data"])
    try:
        cur = json.loads(data.get(ns + "cpt_clipSnips") or "{}")
    except ValueError:
        cur = {}
    cur.update(index)
    data[ns + "cpt_clipSnips"] = json.dumps(cur)
    if jobs_done:
        lab = json.loads(data.get(ns + "cpt_clipLab") or "{}")
        try:
            jobs = json.loads(lab.get("jobs") or "[]")
        except ValueError:
            jobs = []
        lab["jobs"] = json.dumps([j for j in jobs if j not in jobs_done])
        data[ns + "cpt_clipLab"] = json.dumps(lab)
    sb("PATCH", "/rest/v1/%s?user_id=eq.%s" % (TABLE, urllib.parse.quote(fresh["user_id"])), key,
       body={"data": data}, headers={"Prefer": "return=minimal"})


def watch(key, ns):
    """Reageert binnen enkele seconden op de knop 'Maak fragment' in de app."""
    print("kijkt mee op %s — druk in het Clip lab op 'Maak fragment'. Ctrl-C om te stoppen." % ns.rstrip(":"))
    with tempfile.TemporaryDirectory() as td:
        tmp = Path(td)
        while True:
            try:
                row = fetch_row(key, ns)
                lab = json.loads(row["data"][ns + "cpt_clipLab"])
                jobs = json.loads(lab.get("jobs") or "[]")
                if jobs:
                    clips = {c["pid"]: c for c in parse_clips(lab.get("text", ""))}
                    index, done = {}, []
                    for pid in jobs:
                        c = clips.get(pid)
                        if not c:
                            print("!  %s staat niet (meer) in de lijst — aanvraag weggehaald" % pid)
                            done.append(pid)
                            continue
                        print("-> %s  %.1f-%.1fs" % (pid, c["start"], c["end"]))
                        item = process(c, tmp, key, ns)
                        if item:
                            index[pid] = item
                            done.append(pid)
                    if index or done:
                        save_index(row, key, ns, index, done)
                        print("   klaar — de app pikt het binnen een paar seconden op\n")
            except KeyboardInterrupt:
                raise
            except Exception as e:                  # netwerk hikt: gewoon doorgaan
                print("   (even geen verbinding: %s)" % e)
            time.sleep(3)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--sandbox", action="store_true", help="sbx:-sleutels i.p.v. dd:")
    ap.add_argument("--only", help="komma-lijst van pids (int_m3_up,...)")
    ap.add_argument("--dry-run", action="store_true", help="alleen tonen wat er geknipt zou worden")
    ap.add_argument("--watch", action="store_true",
                    help="blijf draaien en knip wat de app aanvraagt (knop 'Maak fragment')")
    args = ap.parse_args()
    ns = "sbx:" if args.sandbox else "dd:"

    for tool in ("yt-dlp", "ffmpeg"):
        if not shutil.which(tool):
            raise SystemExit(tool + " ontbreekt — installeer met: brew install yt-dlp ffmpeg")

    key = service_key()
    if args.watch:
        try:
            watch(key, ns)
        except KeyboardInterrupt:
            print("\ngestopt")
        return
    row = fetch_row(key, ns)
    lab = json.loads(row["data"][ns + "cpt_clipLab"])
    clips = parse_clips(lab.get("text", ""))
    if args.only:
        want = {p.strip() for p in args.only.split(",")}
        clips = [c for c in clips if c["pid"] in want]
    if not clips:
        raise SystemExit("geen fragmenten met een beweging-label gevonden")

    print("%d fragmenten (%s):" % (len(clips), ns.rstrip(":")))
    for c in clips:
        print("   %-13s %s  %.1f-%.1fs  (%.1fs)" % (c["pid"], c["video"], c["start"], c["end"], c["end"] - c["start"]))
    if args.dry_run:
        return

    index = {}
    with tempfile.TemporaryDirectory() as td:
        tmp = Path(td)
        for c in clips:
            print("-> " + c["pid"])
            item = process(c, tmp, key, ns)
            if item:
                index[c["pid"]] = item
    save_index(row, key, ns, index, list(index))
    print("\nklaar: %d snippers in bucket %s, index in %scpt_clipSnips" % (len(index), BUCKET, ns))
    print("Open ChordSprint opnieuw (of wissel van tab) om ze op te halen.")
    print("De links zijn een jaar geldig; opnieuw draaien vernieuwt ze.")


if __name__ == "__main__":
    main()
