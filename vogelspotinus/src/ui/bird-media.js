// ---------------------------------------------------------------------------
// Bird photos and call playback -- the two pieces of media UI that every
// screen needs, built once here instead of being re-templated per screen.
// ---------------------------------------------------------------------------

import { h, icon } from "../core/dom.js";
import { t } from "../core/i18n.js";
import { photoUrl, primaryName } from "../core/birds.js";
import {
  hasMultiplePhotos,
  photoAttribution,
  photoVariants,
  photosReady,
  quizPhotoUrl,
} from "../core/photos.js";
import { toggleSound } from "../core/sound.js";
import { openLightbox } from "./lightbox.js";

export const PLACEHOLDER_IMG =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300">' +
      '<rect width="100%" height="100%" fill="#dedad0"/>' +
      '<text x="50%" y="50%" font-family="sans-serif" font-size="18" fill="#5c6b5c" ' +
      'text-anchor="middle" dy=".3em">No photo</text></svg>'
  );

/**
 * A framed bird photo.
 *
 * `fit` defaults to "cover": Wikipedia photos arrive in wildly different
 * aspect ratios, and letterboxing every one of them (the old behaviour) made
 * the browse grid a field of grey bars. The uncropped image is one tap away in
 * the lightbox, which is the only place "contain" is right.
 *
 * @param {object} bird
 * @param {object} [options]
 * @param {"cover"|"contain"} [options.fit]
 * @param {boolean} [options.zoomable] attach click/Enter to open the lightbox
 * @param {string}  [options.alt]      pass "" for quiz photos, where the name is the answer
 * @param {boolean} [options.vary]     quiz photos: rotate through the photo
 *   variants (data/bird-photos.json) and, when a soort maar een foto heeft,
 *   de uitsnede licht varieren -- allebei tegen het onthouden van de foto in
 *   plaats van de vogel.
 * @param {string}  [options.src]      een specifieke variant afdwingen. Nodig
 *   waar de aanroeper zelf al heeft gekozen welke foto's naast elkaar komen te
 *   staan (de rasgroepquiz toont er drie tegelijk en moet er drie VERSCHILLENDE
 *   hebben; quizPhotoUrl vermijdt alleen de vorige, niet alle vorige).
 */
export function birdPhoto(
  bird,
  { fit = "cover", zoomable = true, alt, vary = false, src: forcedSrc } = {}
) {
  const src = forcedSrc ?? (vary ? quizPhotoUrl(bird) : photoUrl(bird)) ?? PLACEHOLDER_IMG;
  const altText = alt ?? primaryName(bird) ?? t("a11yBirdPhoto");
  const attribution = vary ? photoAttribution(bird, src) : null;

  const img = h("img", {
    src,
    alt: altText,
    loading: "lazy",
    decoding: "async",
    title: attribution || undefined,
  });
  const frame = h("div", { class: `photo photo-${fit}` }, img);

  if (vary && fit === "cover" && !hasMultiplePhotos(bird) && src !== PLACEHOLDER_IMG) {
    // Een soort, een foto: dan tenminste niet elke keer exact dezelfde pixels.
    const zoom = 1.15 + Math.random() * 0.3;
    img.style.transform = `scale(${zoom.toFixed(2)})`;
    img.style.objectPosition = `${Math.round(20 + Math.random() * 60)}% ${Math.round(
      20 + Math.random() * 60
    )}%`;
  }

  if (zoomable && src !== PLACEHOLDER_IMG) {
    frame.classList.add("photo-zoomable");
    frame.tabIndex = 0;
    frame.setAttribute("role", "button");
    frame.setAttribute("aria-label", t("a11yViewPhotoFullscreen"));
    // Bij een variant tonen we die variant ook in de lightbox; de Wikipedia-
    // basisfoto behoudt zijn hogere-resolutie "full" versie.
    const full = vary && src !== photoUrl(bird) ? src : photoUrl(bird, { full: true }) ?? src;
    const open = () => openLightbox(full, attribution ? `${altText} — ${attribution}` : altText);
    frame.addEventListener("click", open);
    frame.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        open();
      }
    });
  }
  return frame;
}

/**
 * Alle foto's van een soort naast elkaar, om doorheen te schuiven.
 *
 * Bij een bouwstijl is dit het punt van de hele kaart: acht gebouwen laten
 * zien wat "Jugendstil" betekent, waar een enkele foto je alleen dát gebouw
 * leert. Zelfde winst bij honden (verschillende dieren van hetzelfde ras) en
 * bij vogels (zomer- en winterkleed uit de iNaturalist-set).
 *
 * Heeft de soort maar een foto, dan is dit gewoon birdPhoto() -- geen lege
 * puntjesrij, geen strip om niets.
 */
export function birdPhotoStrip(bird, { fit = "cover" } = {}) {
  const urls = photoVariants(bird);
  if (urls.length <= 1) {
    // main.js laadt de extra foto's ná de eerste render, dus wie meteen een
    // kaart opent zou stil de oude ene-foto-versie krijgen. Zodra de rest
    // binnen is, vervangen we de foto alsnog door de strip.
    const losse = birdPhoto(bird, { fit });
    photosReady()?.then(() => {
      if (losse.isConnected && photoVariants(bird).length > 1) {
        losse.replaceWith(birdPhotoStrip(bird, { fit }));
      }
    });
    return losse;
  }

  const naam = primaryName(bird) ?? t("a11yBirdPhoto");
  const bijschrift = h("p", { class: "photo-caption" });
  const spoor = h("div", { class: "photo-track" });

  const frames = urls.map((url, i) => {
    const positie = `${i + 1} / ${urls.length}`;
    const frame = h(
      "div",
      {
        class: `photo photo-${fit} photo-zoomable`,
        role: "button",
        // Alleen de foto die in beeld staat doet mee met Tab; anders levert
        // een stijl met acht foto's acht identieke tabstops op.
        tabIndex: i === 0 ? 0 : -1,
        "aria-label": `${positie} — ${t("a11yViewPhotoFullscreen")}`,
      },
      h("img", {
        src: url,
        alt: i === 0 ? naam : "",
        loading: i === 0 ? "eager" : "lazy",
        decoding: "async",
      })
    );
    // De eerste foto heeft een hogere-resolutie versie in de data; de rest
    // bestaat alleen als thumb. Zonder dit toont de lightbox een opgeblazen
    // thumbnail waar hij eerder het origineel gaf.
    const groot = i === 0 ? photoUrl(bird, { full: true }) ?? url : url;
    const bron = photoAttribution(bird, url);
    const open = () => openLightbox(groot, bron ? `${naam} — ${bron}` : naam);
    frame.addEventListener("click", open);
    frame.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        open();
      }
    });
    spoor.append(frame);
    return frame;
  });

  // Knoppen, geen stipjes: op een laptop zonder touchpad-veeg is dit de enige
  // manier om bij foto 2 te komen (een verticaal scrollwiel schuift de strip
  // niet, en de scrollbar is verborgen).
  const stippen = urls.map((_, i) =>
    h("button", {
      type: "button",
      "aria-label": `${t("photoNr")} ${i + 1} / ${urls.length}`,
      // Het verschil in offsetLeft is precies de afstand vanaf het begin van de
      // strip. Niet scrollIntoView: dat scrolt ook het blad eronder verticaal
      // mee. En niet clientWidth * i: die breedte is 0 zolang het blad nog
      // niet is uitgemeten, en dan schuift de strip nergens heen.
      onclick: () =>
        spoor.scrollTo({ left: frames[i].offsetLeft - frames[0].offsetLeft, behavior: "smooth" }),
    })
  );

  // Welke foto in beeld staat volgt uit de scrollpositie, zodat de puntjes en
  // de bronregel niet uit de pas kunnen lopen met wat je ziet. De guard vangt
  // een breedte van 0 (blad nog niet zichtbaar) en een index buiten de reeks.
  const toon = () => {
    const breedte = spoor.clientWidth;
    const ruw = breedte > 0 ? Math.round(spoor.scrollLeft / breedte) : 0;
    const i = Math.min(urls.length - 1, Math.max(0, ruw));
    stippen.forEach((s, j) => s.classList.toggle("on", j === i));
    frames.forEach((f, j) => {
      f.tabIndex = j === i ? 0 : -1;
    });
    const bron = photoAttribution(bird, urls[i]) ?? "";
    bijschrift.textContent = bron;
    // Volledige tekst als tooltip: sommige bronnen zijn een hele
    // rijksmonument-omschrijving en worden in één regel afgekapt.
    bijschrift.title = bron;
  };
  spoor.addEventListener("scroll", toon, { passive: true });
  // Bij draaien verandert clientWidth en klopt de afgeleide index niet meer --
  // dan zou de bronregel bij de verkeerde foto staan.
  new ResizeObserver(toon).observe(spoor);
  toon();

  return h(
    "div",
    { class: "photo-strip" },
    spoor,
    h("div", { class: "photo-dots", role: "group", "aria-label": `${urls.length} ${t("photoCount")}` }, ...stippen),
    bijschrift
  );
}

/**
 * A play/stop button for a bird's call. Returns null when no recording exists,
 * so callers can drop it straight into a child list.
 *
 * @param {object} bird
 * @param {object} [options]
 * @param {"button"|"fab"} [options.variant]
 */
export function soundButton(bird, { variant = "button" } = {}) {
  if (!bird?.soundUrl) return null;

  const label = h("span", {}, t("playCall"));
  const button = h(
    "button",
    {
      type: "button",
      class: variant === "fab" ? "sound-fab" : "secondary sound-button",
      "aria-label": t("playCall"),
    },
    icon("speaker"),
    variant === "fab" ? null : label
  );

  const setState = (playing) => {
    button.classList.toggle("playing", playing);
    const text = playing ? t("stopSound") : t("playCall");
    button.setAttribute("aria-label", text);
    button.replaceChildren(icon(playing ? "stop" : "speaker"));
    if (variant !== "fab") button.append(h("span", {}, text));
  };

  button.addEventListener("click", (e) => {
    e.stopPropagation();
    toggleSound(bird, setState);
  });
  return button;
}
