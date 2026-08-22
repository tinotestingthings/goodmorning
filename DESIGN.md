# DESIGN.md — zo zien de goodmorning-apps eruit

Lees dit alleen bij UI/CSS-werk. De waarden staan in `design.css` (root): de basistokens én de paletten van
de themakiezer. De hoofdapp linkt hem vóór `style.css`; elke utility-app linkt hem als laatste stylesheet en
laadt `theme-sync.js` in `<head>`, zodat hij hetzelfde thema draagt als de hoofdapp. Referentie voor alles:
**het Utilities-menu van de hoofdapp**.

## Smaak (Tinus)

- Minimalistisch en duidelijk. Drukke UI is "heel lelijk".
- Rustige achtergrond, één accentkleur (blauw), strakke SVG-lijniconen (stroke 2, round caps).
- Geen decoratie, geen nep-elementen, geen verzonnen cijfers. Een badge toont alleen een écht aantal.
- Navigatie is het eerste ergernispunt: zo min mogelijk menu's; terug = één grote knop linksboven.
- Niets zichtbaar zonder data (Opduikinus-principe): geen lege kaarten, geen "nog niets"-blokken
  op Today. Een app-pagina mag wél één rustige lege-staat-regel tonen.
- Telefoon, iPad en laptop zijn alle drie eerste klas; test alle drie.

## Thema

Het gekozen thema van de hoofdapp (Settings → Appearance) geldt overal: theme.js zet `data-theme` en
schrijft het weg, `theme-sync.js` leest het in de utility-apps. Zonder keuze volgt `design.css` het
systeem (licht basis, donker via `prefers-color-scheme`). Nooit een app die vast licht of vast donker is.

| Token (alias) | Gebruik |
|---|---|
| `--bg` | pagina |
| `--card-bg` (`--card`) | kaarten, tegels |
| `--text` | tekst |
| `--text-dim` (`--muted`) | subregels, meta, lege staat |
| `--border` (`--line`) | randen, scheidingslijnen |
| `--skip` (`--blue`) | accent: links, primaire knop, "iets voor jou" |
| `--keep` (`--green`, `--good`) | ok, iconen in tegels |
| `--dismiss` (`--red`, `--bad`) | gevaar, verwijderen, rode badge |
| `--warn` | let op |

Vorm: `--radius` / `--radius-sm` / `--radius-lg`, `--space-1…5`, `--font`, `--shadow` (licht subtiel, donker geen).
De waarden staan alléén in `design.css` — hier niet herhalen, dan lopen ze nooit uit de pas.

## Do / don't

- Do: één actie per regel, tekstknoppen in accentkleur, status als rustige tekst.
- Do: conditionele kaarten — verschijnen alleen als er iets is.
- Don't: schaduwen stapelen, gradients, meerdere accentkleuren, iconen in andere kleuren dan groen
  (tegel) of tekstkleur (inline).
- Don't: een app een eigen kleurset geven. Extra semantische kleuren (bijv. `--soon`) mogen, maar
  basiskleuren komen altijd uit `design.css`.

## Werkwijze

Sandbox → `/code-review medium` → telefoon/iPad/laptop → promote.
