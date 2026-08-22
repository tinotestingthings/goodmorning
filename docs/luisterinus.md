# Luisterinus — digest-item → NotebookLM-podcast

Projectplan: artifact "Luisterinus" (21 aug 2026). Kort: één knop op de digest-kaart
(triage-deck) zet een item in Supabase-wachtrij `podcast_queue`; een los script
(fase 2/3, notebooklm-py) maakt er een Audio Overview van en zet de mp3 in de
privébucket `digest-audio`; de kaart toont een speler zodra de rij `ready` is.
feed.json wordt door dit project nooit aangeraakt. notebooklm-py is onofficieel
en kan zonder waarschuwing breken — daarom is elke stap best-effort en buiten
het kritieke pad van de digest.

## Oppervlakken (fase 1, app-kant)

- **Digest-kaart** (triage.js): knop "Maak er een podcast van" → nieuwe rij; status/speler op de kaart zolang die in de deck staat.
- **Utilities-tegel "Luisterinus"** (practice.js): rood nummertje = rijen `requested` + `ready` van de laatste 14 dagen.
- **Today-tile in de hero-rij** (home.js, `appendPodcastTile`): alléén zichtbaar als er ≥1 podcast `ready` is; nummertje = aantal.
- **Luisterinus-app** (`luisterinus/`): lijst van de laatste 14 dagen met speler, "in de maak…", en "probeer opnieuw" bij `failed`. Leest alleen (plus failed→requested); deelt de login-sessie van Daily Digest.

## Statusmodel (fase 1, app-kant — zit in triage.js)

- geen rij in `podcast_queue` → kaart toont alleen de knop "Maak er een podcast van"
- `requested` → "Podcast in de maak…" (ook voor onbekende statussen: rustig wachten)
- `ready` + `audio_path` → knop "Speel de podcast af" → signed URL (1 uur) → `<audio controls>`
- `failed` → "Podcast mislukt — probeer opnieuw" (zet de rij terug op `requested`)
- Supabase/tabel onbereikbaar → knop blijft staan, druk geeft één rustige toast; niets breekt

## Fase 0 — handmatige NL-kwaliteitsproef (go/no-go, ~1 uur, geen code)

1. Ga naar notebooklm.google.com → nieuw notebook → voeg de bron-URL's van één
   echte digest-dag toe (3–5 stuks, uit `feed.json` → `daily[].url`).
2. Genereer een Audio Overview; zet de uitvoertaal op Nederlands
   (NotebookLM-instellingen → uitvoertaal, of via "Aanpassen" bij de Audio
   Overview).
3. Beoordeel al luisterend: lengte, toon, feitelijkheid — is dit iets waar je
   naar wílt luisteren?
4. Noteer welke gratis-tier-limieten je raakt (aantal Audio Overviews per dag).
5. No-go bij matige kwaliteit: project stopt hier; de knop in de app kan dan
   weer weg (één blok in triage.js + wat CSS).

**Uitkomst (22 aug 2026, Tinus, in Gemini Notebook — de nieuwe naam van NotebookLM): GO.**
Brief-formaat gemaakt; Nederlands én Engels allebei acceptabel. Het script gebruikt daarom `AudioFormat.BRIEF`, `language="nl"`.

## Eénmalige setup (Tinus, Supabase SQL-editor)

```sql
-- Wachtrijtabel. De app (ingelogd, publishable key) leest/schrijft;
-- het verwerkscript (fase 2/3) gebruikt service_role en omzeilt RLS.
create table if not exists public.podcast_queue (
  id text primary key,              -- digest-item-id uit feed.json
  item_url text not null,
  title text not null default '',
  status text not null default 'requested'
    check (status in ('requested', 'ready', 'failed')),
  audio_path text,                  -- pad in bucket digest-audio; gezet door het script
  requested_at timestamptz not null default now()
);

alter table public.podcast_queue enable row level security;
-- Tabelrechten: policies alleen zijn niet genoeg (anders 42501 "permission denied").
grant select, insert, update on public.podcast_queue to authenticated;

create policy "podcast_queue authenticated select" on public.podcast_queue
  for select to authenticated using (true);
create policy "podcast_queue authenticated insert" on public.podcast_queue
  for insert to authenticated with check (true);
create policy "podcast_queue authenticated update" on public.podcast_queue
  for update to authenticated using (true);

-- Privébucket voor de mp3's (repo is publiek — audio hoort daar niet in).
insert into storage.buckets (id, name, public)
  values ('digest-audio', 'digest-audio', false)
  on conflict (id) do nothing;

-- Ingelogde app mag lezen (nodig voor createSignedUrl); schrijven blijft
-- service_role-only, dus geen insert/update-policy voor authenticated.
create policy "digest-audio authenticated read" on storage.objects
  for select to authenticated using (bucket_id = 'digest-audio');
```

## Storage-check als een signed URL "Object not found" geeft

Dat is ook wat RLS teruggeeft als de leespolicy ontbreekt, dus check in de SQL-editor:

```sql
select id, public from storage.buckets;                                  -- bestaat 'digest-audio' (privé)?
select name from storage.objects where bucket_id = 'digest-audio';     -- staat het bestand op het verwachte pad?
select policyname from pg_policies where schemaname = 'storage' and tablename = 'objects';  -- staat "digest-audio authenticated read" erbij?
```

## Testen zonder NotebookLM (fase 1-acceptatie)

Na de SQL hierboven (via het Supabase-dashboard, of met service_role uit de
macOS Keychain `gm-supabase-service-role`):

1. Upload een willekeurig audiobestand naar `digest-audio` (bijv. `test/test.m4a`;
   `say "…" -o t.aiff && afconvert t.aiff -f mp4f -d aac test.m4a` maakt er een).
2. Zet een ready-rij met het id van een item uit de huidige `feed.json` `daily`:
   `insert into podcast_queue (id, item_url, title, status, audio_path) values ('<item-id>', '<url>', 'test', 'ready', 'test/test.m4a');`
3. Open de sandbox-triage → de kaart van dat item toont "Speel de podcast af".

Klaar-criteria (plan): knop en speler werken op telefoon, iPad en laptop;
zonder wachtrijrecords is de kaart identiek aan nu, op de knop zelf na
(de knop is het instappunt en staat er altijd; alle status-UI komt uit data).

## Fase 2 — worker-script (`tools/luisterinus-worker.py`, 22 aug 2026)

Status: fase 0 = GO, fase 1 live (v2026.08.21-5), script geschreven, `/code-review medium` (8 bevindingen)
verwerkt, NotebookLM-kant end-to-end bewezen (`--test-url` op het camperverhuurder-artikel → 17 min deep-dive;
sindsdien staat het script op **Brief**). notebooklm-py 0.8.1 (pyenv 3.10.13), `notebooklm login` gedaan.

**Draaien (Tinus, handmatig in fase 2):**
```bash
python3 tools/luisterinus-worker.py
```
Leest de service_role uit de Keychain (`gm-supabase-service-role`), werkt alle `requested`-rijen van de laatste
14 dagen af. Exit 0 = klaar (ook als een rij `failed` werd — dat is inhoudelijk, de app toont "probeer opnieuw");
exit 2 = afgebroken zonder rijen aan te raken (login verlopen → `notebooklm login`, of NotebookLM onbereikbaar).
Tweede gelijktijdige run zegt "al bezig" en stopt (lockfile in de temp-map).
Losse proef zonder Supabase: `python3 tools/luisterinus-worker.py --test-url <url> --out podcast.m4a`.

**Per rij:** preflight `notebooklm auth check --test` → notebook aanmaken → `sources.add_url(wait=True)` →
`generate_audio(language="nl", audio_format=BRIEF)` → `wait_for_completion(timeout=900)` → `download_audio`
(m4a) → notebook verwijderen (mag falen) → upload `digest-audio/<id>.m4a` (`audio/mp4`, upsert) →
`PATCH status=ready, audio_path=<id>.m4a`.

**Foutregels (bewust):**
- inhoudelijke fout (bron niet importeerbaar, generatie mislukt, quotum) → `failed`, maar alleen als de rij nog
  `requested` is (een verse "probeer opnieuw" wordt nooit overschreven); door met de volgende rij;
- time-out → rij blijft `requested` (NotebookLM werkt waarschijnlijk nog; notebook blijft staan, id in het log);
- infra vóór er een notebook is (login, onbereikbaar) → run afgebroken, exit 2, niets aangeraakt;
- upload gelukt maar `ready` niet gezet → rij blijft `requested`, volgende run overschrijft het bestand (upsert).

**API-signaturen (geverifieerd via introspectie op 0.8.1):** `client.notebooks.create(title)`;
`client.sources.add_url(id, url, wait=True, wait_timeout=)`; `client.artifacts.generate_audio(id, language=,
audio_format=AudioFormat.BRIEF|DEEP_DIVE|CRITIQUE|DEBATE, audio_length=AudioLength.SHORT|DEFAULT|LONG)` →
`.task_id`; `client.artifacts.wait_for_completion(id, task_id, timeout=)` → `GenerationStatus` met
`is_complete/is_failed/is_rate_limited/error/error_code`; `client.artifacts.download_audio(id, path)`;
`client.notebooks.delete(id)` (idempotent). `ArtifactStatus` zit niet in de top-level module.

**Daarna (fase 3):** Cowork-taak 2×/dag die dit script draait; `notebooklm auth refresh --quiet` als keepalive;
opruimen >14 dagen (bucket + rijen); rij in `Mijn Wiki/90 System/Automations.md`. Opslag: een Brief is ~5–10 MB,
de deep-dive-proef was 32 MB; de gratis Supabase-bucket (1 GB) is met het 14-dagenvenster ruim genoeg.

## Opruimen (fase 3)

Bucketbestanden en wachtrijrijen ouder dan 14 dagen weggooien — doet het
verwerkscript, niet de app.
