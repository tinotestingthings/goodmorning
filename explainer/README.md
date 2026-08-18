# Ecosystem explainer (Remotion)

Korte explainer-video (52 s, 1920×1080, 30 fps) over hoe kennis het goodmorning-
ecosysteem binnenkomt, in de app belandt, gereviewd wordt en tot actie leidt.
Bedoeld om te draaien tijdens een presentatie, terwijl Tinus erover praat — de
on-screen tekst is daarom bewust minimaal.

Script en storyboard staan in de vault:
`40 Projects/2026-08-18-ecosystem-explainer-remotion-script.md`.

## Draaien

```bash
cd explainer
npm install
npm run dev        # Remotion Studio — scrub door de tijdlijn
```

## Renderen

```bash
npm run build      # out/ecosystem-explainer.mp4  (h264)
npm run build:gif  # out/ecosystem-explainer.gif  (elke 2e frame)
npm run still      # out/frame.png                (losse frame, --frame=N)
npm run typecheck
```

`node_modules/` en `out/` staan in `.gitignore` — alleen de bron gaat mee in git.

## Opbouw

Zes beats staan náást elkaar op één brede strip; de "camera" is één
`translateX`. Daardoor leest het als één doorlopende beweging in plaats van
losse cuts — er wordt nergens hard gesneden.

| Beat | Frames | Wat er gebeurt |
|---|---|---|
| 1 `Beat1Sources` | 0–240 | Ruim 60 bronnen stromen binnen tot het frame te vol is |
| 2 `Beat2Tasks` | 240–540 | Privacy Watch + Compliance Radar trechteren ze tot 4 kaarten |
| 3 `Beat3Inbox` | 540–780 | Landing in `00 Inbox` (badge "wacht op mij"), digest publiceert `feed.json` |
| 4 `Beat4Triage` | 780–1200 | De swipe: bewaren, archiveren, en via het More-menu een taak maken |
| 5 `Beat5Vault` | 1200–1440 | Supabase `actions` → `20 Sources` / `99 Archive` / `30 Tasks` |
| 6 `Beat6Loop` | 1440–1560 | De hele ring, met "utility apps" als genoemde categorie |

Timing zit in `src/theme.ts` (`BEATS`), teksten en bronnamen in `src/data.ts`.
Kleuren zijn letterlijk de app-tokens uit `../style.css`, zodat video en app
één geheel zijn.

## Eigen video erin (schermopname, clip)

Remotion speelt gewoon mp4/webm/mov af.

1. Zet het bestand in `public/`, bijvoorbeeld `public/app-demo.mp4`.
2. Gebruik `<ScreenRecording>`:

```tsx
import { ScreenRecording } from "../components/ScreenRecording";

<ScreenRecording file="app-demo.mp4" startFrom={90} endAt={420} />
```

`startFrom` en `endAt` zijn **frames** van de compositie (30 fps), niet seconden
— `startFrom={90}` slaat dus de eerste 3 seconden van je opname over.

### In de telefoon monteren

De `PhoneFrame` is een gewone container, dus een portret-schermopname past er
zo in. In `src/scenes/Beat4Triage.tsx` vervang je de inhoud van de
`<PhoneFrame>` door:

```tsx
<PhoneFrame width={400}>
  <ScreenRecording file="app-demo.mp4" />
</PhoneFrame>
```

Let op: een telefoonopname is meestal ~1170px breed en wordt hier op 400px
getoond, dus dat is scherp. Andersom — een klein UI-element opblazen naar
1080p — wordt zacht. Neem daarom liever op met de telefoon in portret en knip
strak bij, in plaats van in te zoomen op een detail.

### Geluid

`<ScreenRecording>` staat op `muted`. Wil je wel geluid, haal die prop weg; voor
losse audio gebruik je `<Audio src={staticFile("...")} />` uit `remotion`.

## Aanpassen

- **Andere lengte?** Pas `BEATS` in `src/theme.ts` aan; `TOTAL` moet gelijk zijn
  aan de som van de durations (er zit een check op in de README, niet in code).
- **Andere voorbeeldkaarten?** `TRIAGE_CARDS` in `src/data.ts`. De drie die er nu
  staan komen echt uit de feed van 2026-08-18.
- **Ondertitels erbij** (als de video zelfstandig moet staan): de vijf regels
  staan in het script-document; die horen dan als extra `<Caption>` onderin.
