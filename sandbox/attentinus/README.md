# Attentinus — verjaardagen, jaarlijkse datums en cadeau-ideeën

Stille lijst van mensen met een terugkerende datum (verjaardag, trouwdag, …)
en per persoon een cadeau-ideeënbak. Bewust handmatig (geen adresboek-import):
een handvol mensen die ertoe doen is precies genoeg.

- **Binnenkort** = komende 60 dagen; ≤ 21 dagen kleurt oranje, vandaag rood.
- De digest-home toont een rij ("X is over N dagen jarig · 2 ideeën") zodra
  iemand binnen 21 dagen valt — zelfde alleen-als-er-iets-speelt-patroon als
  de events-tegel. Home leest `attentinus.people` read-only uit
  `attentinus_state`.
- Ideeën afvinken = "gebruikt"; ze blijven staan als geschiedenis.

## Lokaal testen zonder login

Op localhost werkt `index.html?demo` zonder Daily Digest-sessie: voorbeeld-
personen in een eigen `demo:`-namespace (raakt nooit echte state), sync uit.

## Eenmalige setup: Supabase-tabel

De app draait zonder tabel gewoon lokaal (melding onderaan). Voor sync:

```sql
create table public.attentinus_state (
  user_id uuid primary key references auth.users(id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
alter table public.attentinus_state enable row level security;
create policy "own row" on public.attentinus_state
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
```

## State (in `attentinus_state.data`, keys via de boot-shim)

- `attentinus.people` — `[{id, name, label, month, day, year|null,
  ideas: [{id, text, done, addedAt}]}]`; `year` optioneel voor leeftijd.
