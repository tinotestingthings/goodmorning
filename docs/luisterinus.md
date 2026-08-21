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

## Fase 2 — worker-script (stand 21 aug 2026, avond: nog te schrijven)

Status: fase 1 live (v2026.08.21-5). notebooklm-py 0.8.1 geïnstalleerd (pyenv 3.10.13,
`notebooklm` op PATH), Playwright-login gedaan, `notebooklm auth check --test` → "Authentication is valid".
Nog niets werkt de wachtrij af; elke knopdruk blijft "in de maak" tot dit script bestaat.

**Bestand:** `tools/luisterinus-worker.py` (Python, buiten de PWA). Tinus draait hem zelf:
`python3 tools/luisterinus-worker.py` — het script leest de service_role via
`security find-generic-password -s gm-supabase-service-role -w` (Claude mag die sleutel niet lezen).
Extra modus voor een losse proef zonder Supabase: `--test-url <url> --out podcast.m4a`.

**Per `requested`-rij:**
1. `GET {SUPABASE_URL}/rest/v1/podcast_queue?status=eq.requested&select=*` (headers `apikey` + `Authorization: Bearer <service_role>`)
2. NotebookLM (API-signaturen geverifieerd via introspectie op 0.8.1):
   ```python
   from notebooklm import NotebookLMClient, AudioFormat, AudioLength
   async with NotebookLMClient.from_storage() as client:
       nb = await client.notebooks.create(title)                                   # nb.id
       await client.sources.add_url(nb.id, url, wait=True, wait_timeout=120)      # SourcesAPI: wait bestaat hier wél
       st = await client.artifacts.generate_audio(nb.id, language="nl",
               audio_format=AudioFormat.DEEP_DIVE, audio_length=AudioLength.DEFAULT)  # st.task_id
       await client.artifacts.wait_for_completion(nb.id, st.task_id, timeout=900)  # ArtifactsAPI; default 300 s is te kort
       await client.artifacts.download_audio(nb.id, "/tmp/<id>.m4a")             # m4a, speelt in de app (bewezen)
       await client.notebooks.delete(nb.id)                                       # idempotent; alleen na succes
   ```
   (`AudioFormat`: BRIEF/CRITIQUE/DEBATE/DEEP_DIVE; `AudioLength`: SHORT/DEFAULT/LONG; `ArtifactStatus.COMPLETED/FAILED`.)
3. Upload: `POST {SUPABASE_URL}/storage/v1/object/digest-audio/<id>.m4a`, `Content-Type: audio/mp4`, `x-upsert: true`.
4. `PATCH /rest/v1/podcast_queue?id=eq.<id>` → `{"status":"ready","audio_path":"<id>.m4a"}`; bij elke exception
   `{"status":"failed"}` + één logregel, en door met de volgende rij (nooit blijven hangen).

**Eerste run = fase 0-luisterproef**: de echte aanvraag `sbx-test-camperverhuurder-ai-chatbot` (Ius Mentis-artikel)
staat klaar als `requested`. Bevalt de NL-audio niet → project stopt; knop kan er in één commit uit.

**Daarna (fase 3):** Cowork-taak 2×/dag die dit script draait; `notebooklm auth refresh --quiet` als keepalive;
opruimen >14 dagen (bucket + rijen); rij in `Mijn Wiki/90 System/Automations.md`.

## Opruimen (fase 3)

Bucketbestanden en wachtrijrijen ouder dan 14 dagen weggooien — doet het
verwerkscript, niet de app.
