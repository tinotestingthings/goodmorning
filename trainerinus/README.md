# Trainerinus — oefencoach over de trainer-apps heen

Read-only dashboard: is er vandaag geoefend in Vogelspotinus, ChordSprint,
NoteSprint en Kangaroo Gym? Plus een gezamenlijke "alles-groen"-streak en een
weekoverzicht. Leest de per-user rijen uit de state-tabellen van die apps
(zelfde Supabase-auth, RLS geeft alleen je eigen rij) en schrijft er **nooit**
naar — alleen naar zijn eigen `trainerinus.*`-keys.

## Hoe "vandaag geoefend" wordt bepaald

| App | Signaal | Kwaliteit |
|---|---|---|
| Vogelspotinus | `vogelspotinus.stats` (lastPracticeDate, dagteller, streak) | exact; streak wordt teruggevuld in de historie |
| Kangaroo Gym | gedateerde workout-/cardio-/spierhistorie | exact; "groen" = laatste training ≤ N rustdagen geleden (instelbaar, default 2) |
| ChordSprint | hash van de `cpt_*`-keys + `updated_at` van de rij | heuristiek: state veranderd = geoefend op de dag van de laatste push |
| NoteSprint | hash van `noteSprint*`/`noteReader*`-keys + `updated_at` | zelfde heuristiek |

Chord-/NoteSprint slaan zelf geen datums op, dus daar bouwt de historie zich
op **vanaf het moment dat Trainerinus meekijkt**. De gezamenlijke streak start
daardoor pas na installatie.

## Namespaces

- Oefendata van de andere apps wordt altijd uit **`dd:`** (live) gelezen — daar
  gebeurt het echte oefenen; de sandbox-kopieën zijn dev-speeltuinen. Lezen is
  veilig: er is geen schrijfpad naar andermans tabellen.
- De eigen state volgt gewoon de omgeving (`dd:`/`sbx:` via de boot-shim), dus
  sandbox-testen raakt nooit live Trainerinus-historie.

## Lokaal testen zonder login

Op localhost werkt `index.html?demo` zonder Daily Digest-sessie: nep-Supabase
met vaste voorbeeldrijen, eigen `demo:`-namespace (raakt nooit echte state),
sync uit. Op de echte site is er geen apart loginscherm: de app ontgrendelt
met de digest-sessie — log dus eerst in op de Daily Digest van dezelfde
omgeving (root of /sandbox/) en open Trainerinus daarna.

## Eenmalige setup: Supabase-tabel

De app draait zonder tabel gewoon lokaal (sync uit, melding in instellingen).
Voor sync tussen apparaten éénmalig in de Supabase SQL-editor:

```sql
create table public.trainerinus_state (
  user_id uuid primary key references auth.users(id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
alter table public.trainerinus_state enable row level security;
create policy "own row" on public.trainerinus_state
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
grant select, insert, update on public.trainerinus_state to authenticated;
```

De laatste regel is niet optioneel: zonder GRANT bestaat de tabel wel, maar
krijgt de app 42501 ("permission denied") en draait hij lokaal door met sync
uit. De app toont in dat geval zelf de juiste regel.

## Eigen state (in `trainerinus_state.data`, keys via de boot-shim)

- `trainerinus.settings` — welke apps meetellen + gym-rustdagen
- `trainerinus.log` — `{"YYYY-MM-DD": {vogels:1, chords:1, ...}}`, max 120 dagen
- `trainerinus.markers` — laatst geziene state-hash per heuristiek-app
