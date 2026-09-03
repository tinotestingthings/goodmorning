# Utrecht Toen — utility-app

Historische straat- en gebouwfoto's van Utrecht op de plek waar ze gemaakt zijn, voor onderweg
op de telefoon. Statische port van de publiekskaart uit `~/Code/utrecht-in-beeld` (Next.js +
Cloudflare D1, met reviewwerkbank). Die repo blijft de bron van waarheid voor data en regels;
lees daar `CLAUDE.md` en `APP-HANDBOEK.md` voordat je aan de data komt.

- `index.html` + `boot.js`: kaart (MapLibre 5, cdnjs), filters (straal, periode, verhalen),
  fotoblad met de drie locatieniveaus, onzekerheidscirkel, kijkrichting alleen bij een echte
  bearing, wijzigingsgeschiedenis bij "Nieuw vastgesteld".
- Camera in het fotoblad, twee knoppen op één overlay. "Stap in de oude foto": MediaPipe
  Selfie Segmentation (jsdelivr, versie vastgepind; wasm ≈ 6 MB eenmalig) snijdt je per frame
  uit en zet je op de oude foto, Teams/Snapchat-achtig; de knop verschijnt alleen als de
  bibliotheek geladen is. "Maak een toen/nu-foto op deze locatie": de oude foto half
  doorzichtig over het camerabeeld om hetzelfde kader te zoeken; resultaat toen en nu
  naast/onder elkaar. Beide als jpeg: opslaan (download) of delen (Web Share). HUA-beeld via
  IIIF `full/1200,`; beide hosts sturen CORS. In de Utilities-iframe via `allow="camera; web-share"`.
- `data.json`: 132 foto's + 2 contextproviders. Genereren: `node tools/build-utrecht-toen.mjs`
  (vanuit de repo-root). Nooit met de hand bewerken.
- Geen Supabase-tabel, geen opslag: de kaart is de hele staat.
- GPS werkt alleen op https (GitHub Pages) of localhost; in de Utilities-iframe via
  `allow="geolocation"` op het frame.
