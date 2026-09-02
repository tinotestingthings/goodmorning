(function () {
  "use strict";

  // Utrecht Toen: historische straatfoto's op de plek waar ze gemaakt zijn.
  // Statische port van de publiekskaart uit ~/Code/utrecht-in-beeld (Next.js +
  // D1). Alles wat daar /api/photos deed — jaarfilter, Haversine-straal,
  // sorteren op afstand, contextlinks — gebeurt hier in de browser op
  // data.json (gebouwd met tools/build-utrecht-toen.mjs). Geen opslag, geen
  // Supabase-tabel: de kaart is de hele staat. De reviewwerkbank hoort bij de
  // bronrepo en zit bewust niet in deze app.

  var UTRECHT = { latitude: 52.0907, longitude: 5.1214 };
  var YEAR_MIN = 1800, YEAR_MAX = 1997;
  var EARTH_RADIUS_M = 6371008.8, M_PER_DEG = 111320;
  var TIER_LABEL = { exact: "Exacte plek", building: "Ongeveer bij dit gebouw of object", street: "Ergens aan deze straat" };
  var TIER_HELP = {
    exact: "De bron geeft de camerastandplaats, of de locatie is handmatig gecontroleerd.",
    building: "De pin markeert het genoemde gebouw of object; de camerastandplaats is niet bekend.",
    street: "Alleen de straat is bekend. De foto kan elders langs deze straat zijn gemaakt."
  };
  var METHOD_LABEL = {
    manually_verified: "Camerastandplaats handmatig geverifieerd", exact_address_geocoded: "Adres gegeocodeerd",
    street_geocoded: "Straat gegeocodeerd", landmark_geocoded: "Gebouw of object gekoppeld",
    source_coordinates: "Camerastandplaats uit bronmetadata"
  };
  // Kijkrichting: bronfeit of afgeleid — dat verschil blijft zichtbaar (handboek §4.2).
  var BEARING_LABEL = {
    source_metadata: "bronmetadata", source_description: "uit de bronbeschrijving",
    calculated_from_subject: "berekend uit het onderwerp", calculated_from_street_direction: "berekend uit de straatrichting"
  };
  var CONFIDENCE = { high: "hoge", medium: "middelmatige", low: "lage" };
  var SOURCE = { wikimedia_commons: "Wikimedia Commons", utrecht_archief: "Het Utrechts Archief", europeana: "Europeana", nationaal_archief: "Nationaal Archief" };

  var $ = function (id) { return document.getElementById(id); };
  var app = $("app"), dock = $("dock"), sheet = $("sheet"), full = $("full"), msg = $("msg");
  var all = [], providers = [], results = [];
  var center = UTRECHT, radius = 1000, yearFrom = YEAR_MIN, yearTo = YEAR_MAX, enabled = {};
  var selectedId = null, map = null, mapReady = false;

  // ---- geo (zelfde formules als lib/geo.ts in de bronrepo) -----------------
  function rad(v) { return v * Math.PI / 180; }
  function distance(a, b) {
    var dLat = rad(b.latitude - a.latitude), dLng = rad(b.longitude - a.longitude);
    var h = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(rad(a.latitude)) * Math.cos(rad(b.latitude)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
    return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(h));
  }
  function offset(lat, lng, northM, eastM) {
    return [lng + eastM / (M_PER_DEG * Math.cos(rad(lat))), lat + northM / M_PER_DEG];
  }
  function circle(lat, lng, r) {
    var ring = [];
    for (var i = 0; i <= 64; i++) { var a = i / 64 * Math.PI * 2; ring.push(offset(lat, lng, Math.cos(a) * r, Math.sin(a) * r)); }
    return { type: "Feature", properties: {}, geometry: { type: "Polygon", coordinates: [ring] } };
  }
  function empty() { return { type: "FeatureCollection", features: [] }; }

  function tier(p) {
    if (p.verification_status === "manually_verified") return "exact";
    if (p.location_method === "source_coordinates" && /point of view|camerastandplaats/i.test(p.location_evidence)) return "exact";
    if (p.location_method === "exact_address_geocoded" || p.location_method === "landmark_geocoded") return "building";
    return "street";
  }

  function query() {
    var out = [];
    all.forEach(function (p) {
      if (!p.date_from || !p.date_to) return;
      if (Number(p.date_from.slice(0, 4)) > yearTo || Number(p.date_to.slice(0, 4)) < yearFrom) return;
      var d = distance(center, p);
      if (d <= radius) out.push(Object.assign({ distance_m: d }, p));
    });
    return out.sort(function (a, b) { return a.distance_m - b.distance_m || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0); });
  }

  // ---- kaartdata --------------------------------------------------------------
  // Eén feature per foto; MapLibre's clustering voegt samen wat op dezelfde plek
  // ligt (point_count). Een eigen clusterProperties-som brak de tile-opbouw in
  // de worker ("Expected number, found null") en dan verschijnt er niets.
  function photoFeatures() {
    return { type: "FeatureCollection", features: results.map(function (p) {
      return { type: "Feature", properties: { photoId: p.id, tier: tier(p), selected: p.id === selectedId },
        geometry: { type: "Point", coordinates: [p.longitude, p.latitude] } };
    }) };
  }

  function bearingFeatures(p) {
    if (p.bearing == null) return empty();
    var h = rad(p.bearing), len = 95, side = 14, back = 25;
    var n = Math.cos(h) * len, e = Math.sin(h) * len;
    var pt = function (north, east) { return offset(p.latitude, p.longitude, north, east); };
    var tip = pt(n, e);
    var left = pt(n - Math.cos(h) * back + Math.cos(h + Math.PI / 2) * side, e - Math.sin(h) * back + Math.sin(h + Math.PI / 2) * side);
    var right = pt(n - Math.cos(h) * back - Math.cos(h + Math.PI / 2) * side, e - Math.sin(h) * back - Math.sin(h + Math.PI / 2) * side);
    return { type: "FeatureCollection", features: [
      { type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: [[p.longitude, p.latitude], tip] } },
      { type: "Feature", properties: {}, geometry: { type: "Polygon", coordinates: [[tip, left, right, tip]] } }
    ] };
  }

  function cssVar(name, fallback) {
    var v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    return v || fallback;
  }
  var ACCENT = cssVar("--blue", "#4a90d9");

  // Markers: één accentkleur, vorm zegt hoe zeker de plek is. Alleen arc/rect,
  // dus ook oudere Safari's tekenen ze.
  function markerImage(t) {
    var r = 2, c = document.createElement("canvas");
    c.width = 40 * r; c.height = 48 * r;
    var x = c.getContext("2d");
    x.scale(r, r); x.lineWidth = 3; x.lineJoin = "round";
    if (t === "exact") {
      x.fillStyle = ACCENT; x.strokeStyle = "#fff";
      x.beginPath(); x.arc(20, 19, 13, 0, Math.PI * 2); x.fill(); x.stroke();
      x.beginPath(); x.moveTo(11, 27); x.lineTo(20, 40); x.lineTo(29, 27); x.closePath(); x.fill();
    } else if (t === "building") {
      x.fillStyle = ACCENT; x.strokeStyle = "#fff"; x.globalAlpha = 0.85;
      x.fillRect(7, 7, 26, 26); x.strokeRect(7, 7, 26, 26); x.globalAlpha = 1;
    } else {
      x.fillStyle = "rgba(255,255,255,.85)"; x.strokeStyle = ACCENT; x.setLineDash([3, 3]);
      x.beginPath(); x.arc(20, 21, 14, 0, Math.PI * 2); x.fill(); x.stroke(); x.setLineDash([]);
    }
    var ic = t === "street" ? ACCENT : "#fff";
    x.strokeStyle = ic; x.fillStyle = ic; x.lineWidth = 2;
    x.strokeRect(15, 17, 10, 8); x.fillRect(17, 14, 4, 3);
    x.beginPath(); x.arc(20, 21, 2, 0, Math.PI * 2); x.stroke();
    return x.getImageData(0, 0, c.width, c.height);
  }

  function dark() {
    var t = document.documentElement.getAttribute("data-theme");
    if (t) return t === "dark";
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  }

  function initMap() {
    map = new maplibregl.Map({
      container: "map",
      style: "https://tiles.openfreemap.org/styles/" + (dark() ? "dark" : "positron"),
      center: [UTRECHT.longitude, UTRECHT.latitude], zoom: 13.25, attributionControl: false
    });
    map.on("error", function (e) { console.error("Kaartfout:", e.error && e.error.message); });
    map.addControl(new maplibregl.AttributionControl({ compact: true }), "bottom-left");
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "bottom-right");
    map.on("load", function () {
      map.addSource("search-radius", { type: "geojson", data: circle(center.latitude, center.longitude, radius) });
      map.addLayer({ id: "search-radius-fill", source: "search-radius", type: "fill", paint: { "fill-color": ACCENT, "fill-opacity": 0.05 } });
      map.addLayer({ id: "search-radius-line", source: "search-radius", type: "line", paint: { "line-color": ACCENT, "line-width": 1.5, "line-opacity": 0.5, "line-dasharray": [3, 2] } });
      map.addSource("search-center", { type: "geojson", data: { type: "Point", coordinates: [center.longitude, center.latitude] } });
      map.addLayer({ id: "search-center-halo", source: "search-center", type: "circle", paint: { "circle-radius": 9, "circle-color": "#fff", "circle-opacity": 0.9 } });
      map.addLayer({ id: "search-center-dot", source: "search-center", type: "circle", paint: { "circle-radius": 5, "circle-color": ACCENT, "circle-stroke-color": "#fff", "circle-stroke-width": 1.5 } });
      map.addSource("accuracy", { type: "geojson", data: empty() });
      map.addLayer({ id: "accuracy-fill", source: "accuracy", type: "fill", paint: { "fill-color": ACCENT, "fill-opacity": 0.08 } });
      map.addLayer({ id: "accuracy-line", source: "accuracy", type: "line", paint: { "line-color": ACCENT, "line-width": 1.5, "line-opacity": 0.6, "line-dasharray": [3, 2] } });
      ["exact", "building", "street"].forEach(function (t) { map.addImage("photo-" + t, markerImage(t), { pixelRatio: 2 }); });
      map.addSource("photos", { type: "geojson", data: empty(), cluster: true, clusterRadius: 56, clusterMaxZoom: 16 });
      map.addLayer({ id: "clusters", source: "photos", type: "circle", filter: ["has", "point_count"],
        paint: { "circle-color": ACCENT, "circle-radius": ["step", ["get", "point_count"], 20, 10, 24, 25, 29], "circle-stroke-color": "#fff", "circle-stroke-width": 3 } });
      map.addLayer({ id: "cluster-count", source: "photos", type: "symbol", filter: ["has", "point_count"],
        // text-font moet een font zijn dat OpenFreeMap serveert; MapLibre's standaard
        // "Open Sans" geeft een 404 op de glyphs en dan mislukt de hele tile (geen pins).
        layout: { "text-field": ["get", "point_count_abbreviated"], "text-font": ["Noto Sans Bold"], "text-size": 12, "text-allow-overlap": true }, paint: { "text-color": "#fff" } });
      map.addLayer({ id: "selected-ring", source: "photos", type: "circle", filter: ["all", ["!", ["has", "point_count"]], ["==", ["get", "selected"], true]],
        paint: { "circle-radius": 18, "circle-color": "rgba(0,0,0,0)", "circle-stroke-color": ACCENT, "circle-stroke-width": 3, "circle-translate": [0, -20] } });
      map.addLayer({ id: "points", source: "photos", type: "symbol", filter: ["!", ["has", "point_count"]],
        layout: { "icon-image": ["match", ["get", "tier"], "exact", "photo-exact", "building", "photo-building", "photo-street"], "icon-anchor": "bottom", "icon-allow-overlap": true } });
      map.addSource("bearing", { type: "geojson", data: empty() });
      map.addLayer({ id: "bearing-halo", source: "bearing", type: "line", filter: ["==", ["geometry-type"], "LineString"], paint: { "line-color": "#fff", "line-width": 7, "line-opacity": 0.85 } });
      map.addLayer({ id: "bearing-line", source: "bearing", type: "line", filter: ["==", ["geometry-type"], "LineString"], paint: { "line-color": ACCENT, "line-width": 3 } });
      map.addLayer({ id: "bearing-arrow", source: "bearing", type: "fill", filter: ["==", ["geometry-type"], "Polygon"], paint: { "fill-color": ACCENT } });

      var openCluster = function (ev) {
        var f = ev.features && ev.features[0];
        var id = f && Number(f.properties.cluster_id);
        if (!f || !isFinite(id)) return;
        map.getSource("photos").getClusterExpansionZoom(id).then(function (zoom) {
          map.easeTo({ center: f.geometry.coordinates, zoom: zoom, duration: 550 });
        });
      };
      var openPhoto = function (ev) {
        var f = ev.features && ev.features[0];
        if (f && typeof f.properties.photoId === "string") select(f.properties.photoId);
      };
      map.on("click", "clusters", openCluster); map.on("click", "cluster-count", openCluster);
      map.on("click", "points", openPhoto);
      ["clusters", "cluster-count", "points"].forEach(function (l) {
        map.on("mouseenter", l, function () { map.getCanvas().style.cursor = "pointer"; });
        map.on("mouseleave", l, function () { map.getCanvas().style.cursor = ""; });
      });
      mapReady = true;
      syncMap(); syncSelection();
    });
  }

  function syncMap() {
    if (!mapReady) return;
    map.getSource("search-radius").setData(circle(center.latitude, center.longitude, radius));
    map.getSource("search-center").setData({ type: "Point", coordinates: [center.longitude, center.latitude] });
    map.getSource("photos").setData(photoFeatures());
  }

  // Alleen bij een échte selectiewissel vliegen; een herberekening van de
  // resultaten (ander filter) laat de camera met rust.
  var flownTo = null;
  function syncSelection() {
    var p = selected();
    if (!mapReady) return;
    map.getSource("bearing").setData(p ? bearingFeatures(p) : empty());
    var t = p && tier(p);
    map.getSource("accuracy").setData(p && t !== "exact" && p.location_accuracy_m != null ? circle(p.latitude, p.longitude, p.location_accuracy_m) : empty());
    if (p && flownTo !== p.id) {
      flownTo = p.id;
      // Nooit uitzoomen: wie ingezoomd zijn route loopt, blijft op dat niveau.
      map.flyTo({ center: [p.longitude, p.latitude], zoom: Math.max(map.getZoom(), t === "street" ? 13.5 : 15), duration: 650 });
    }
    if (!p) flownTo = null;
  }

  // ---- tekst ------------------------------------------------------------------
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function title(p) { return p.title.replace(/^HUA-\d+-/, "").trim(); }
  function date(p) {
    if (p.date_precision === "range") return (p.date_from || "").slice(0, 4) + "–" + (p.date_to || "").slice(0, 4);
    return p.original_date.replace(/\s+00:00$/, "").replace(/\s+date QS:.*$/, "");
  }
  function dist(m) { return m < 1000 ? Math.round(m) + " m" : (m / 1000).toFixed(1).replace(".", ",") + " km"; }
  function description(s) {
    return s.replace(/(?:https?:\/\/|www\.)\S+/gi, "").replace(/\s*->\s*/g, " ").replace(/\s*["']?>+\s*/g, " ").replace(/\s{2,}/g, " ").trim();
  }
  function ext(href, label) { return '<a href="' + esc(href) + '" target="_blank" rel="noreferrer">' + esc(label) + ' ↗</a>'; }

  // ---- UI ---------------------------------------------------------------------
  function selected() {
    for (var i = 0; i < results.length; i++) if (results[i].id === selectedId) return results[i];
    return null;
  }
  function selectedIndex() {
    for (var i = 0; i < results.length; i++) if (results[i].id === selectedId) return i;
    return -1;
  }

  function say(text, bad) {
    msg.firstElementChild.textContent = text || "";
    msg.className = text ? "on" + (bad ? " bad" : "") : "";
  }

  function refresh() {
    results = query();
    if (selectedId && !selected()) selectedId = null;
    $("count").textContent = results.length + " van " + all.length;
    renderDock(); renderSheet(); syncMap(); syncSelection();
  }

  function select(id) {
    selectedId = id;
    full.className = "";
    renderSheet(); syncMap(); syncSelection();
  }

  function renderDock() {
    dock.innerHTML = "";
    if (!results.length) {
      var e = document.createElement("span"); e.className = "empty"; e.textContent = "Geen foto’s binnen deze straal en periode."; dock.appendChild(e);
      return;
    }
    results.slice(0, 8).forEach(function (p) {
      var b = document.createElement("button");
      b.type = "button"; b.className = "card";
      b.innerHTML = '<img alt="" loading="lazy"><b></b><small></small>';
      b.firstChild.src = p.thumbnail_url;
      b.children[1].textContent = title(p);
      b.children[2].textContent = date(p) + " · " + dist(p.distance_m);
      b.onclick = function () { select(p.id); };
      dock.appendChild(b);
    });
  }

  function renderSheet() {
    var p = selected();
    app.className = p ? "has-sel" : "";
    if (!p) { sheet.innerHTML = ""; return; }
    var t = tier(p), rev = p.location_revision, ctx = p.context_contributions || [];
    var h = '<button type="button" class="close" id="sheetClose" aria-label="Sluit fotodetails">×</button>'
      + '<div class="frame"><img id="sheetImg" src="' + esc(p.thumbnail_url) + '" alt="' + esc(title(p)) + '">'
      + '<span class="date">' + esc(date(p)) + '</span><p class="fail">De foto kon niet bij de bron worden geladen.</p></div>'
      + '<div class="body"><h2>' + esc(title(p)) + '</h2><p class="desc">' + esc(description(p.description)) + '</p>'
      + '<div class="tier ' + t + '"><strong>' + TIER_LABEL[t] + (rev && rev.status === "newly_established" ? "<em>Nieuw vastgesteld</em>" : "") + '</strong><span>' + TIER_HELP[t] + '</span></div>';
    if (rev && rev.status === "newly_established") {
      var prev = rev.previous_location;
      h += '<section class="rev" aria-label="Wijzigingsgeschiedenis van de locatie"><header><strong>Nieuw vastgesteld</strong><time>' + esc(new Date(rev.established_at).toLocaleDateString("nl-NL")) + '</time></header>'
        + '<p>De camerastandplaats is tijdens menselijke review opnieuw vastgesteld. De eerdere inschatting blijft hieronder bewaard.</p><dl>'
        + '<dt>Eerst</dt><dd>' + prev.latitude.toFixed(6) + ", " + prev.longitude.toFixed(6) + '<small>' + esc(METHOD_LABEL[prev.method] || prev.method) + " · " + (prev.accuracy_m == null ? "nauwkeurigheid onbekend" : "circa " + prev.accuracy_m + " m") + '</small></dd>'
        + '<dt>Nu</dt><dd>' + p.latitude.toFixed(6) + ", " + p.longitude.toFixed(6) + '<small>Handmatig geverifieerd · ' + (p.location_accuracy_m == null ? "nauwkeurigheid niet opgegeven" : "circa " + p.location_accuracy_m + " m") + '</small></dd>'
        + '<dt>Verschuiving</dt><dd>' + dist(distance(prev, p)) + '</dd></dl>'
        + (p.location_reference_url ? '<p>' + ext(p.location_reference_url, "Bekijk bewijs voor de nieuwe plek") + '</p>' : "") + '</section>';
    }
    if (ctx.length) {
      var byProvider = {}, names = [];
      ctx.forEach(function (c) { if (!byProvider[c.provider_name]) { byProvider[c.provider_name] = []; names.push(c.provider_name); } byProvider[c.provider_name].push(c); });
      h += '<section class="ctx" aria-label="Aanvullende verhalen over deze plek">' + names.map(function (n) {
        return '<strong>Bijdrage van: ' + esc(n) + '</strong><ul>' + byProvider[n].map(function (c) { return "<li>" + ext(c.url, c.title) + "</li>"; }).join("") + "</ul>";
      }).join("") + "</section>";
    }
    h += '<details><summary>Bron &amp; overige informatie</summary><dl>'
      + '<dt>Fotograaf</dt><dd>' + esc(p.photographer || "Onbekend") + '</dd>'
      + '<dt>Instelling</dt><dd>' + esc(p.institution) + '</dd>'
      + '<dt>Locatietype</dt><dd>' + TIER_LABEL[t] + '</dd>'
      + '<dt>Methode</dt><dd>' + esc(METHOD_LABEL[p.location_method] || p.location_method) + '</dd>'
      + '<dt>Zekerheid</dt><dd>' + (CONFIDENCE[p.location_confidence] || esc(p.location_confidence)) + ' zekerheid</dd>'
      + '<dt>Nauwkeurigheid</dt><dd>' + (p.location_accuracy_m == null ? "Niet opgegeven door bron" : "circa " + p.location_accuracy_m + " m") + '</dd>'
      + '<dt>Onderbouwing</dt><dd>' + esc(p.location_evidence) + (p.location_reference_url ? " " + ext(p.location_reference_url, "Bekijk locatiebron") : "") + '</dd>'
      + '<dt>Controle</dt><dd>' + (p.verification_status === "manually_verified" ? "Handmatig geverifieerd" : "Niet handmatig geverifieerd") + '</dd>'
      + (p.bearing != null ? '<dt>Kijkrichting</dt><dd>' + esc(p.bearing) + "° · " + esc(BEARING_LABEL[p.bearing_method] || p.bearing_method || "herkomst onbekend") + '</dd>' : "")
      + '<dt>Databron</dt><dd>' + esc(SOURCE[p.source] || p.source) + '</dd>'
      + '<dt>Rechten</dt><dd>' + (p.license_url ? ext(p.license_url, p.license) : esc(p.license)) + '</dd></dl>'
      + '<p>' + ext(p.source_record_url, "Bekijk origineel bij de bron") + '</p>'
      + '<p class="note">Broncoördinaten, gegeocodeerde locaties en nieuw vastgestelde camerastandplaatsen blijven afzonderlijk gelabeld. Bij een correctie blijft de eerdere locatie in de wijzigingsgeschiedenis bewaard. Datums en kijkrichtingen worden niet aangevuld.</p></details>'
      + '<div class="nav"><button type="button" id="prev">← Vorige</button><span>' + (selectedIndex() + 1) + " / " + results.length + '</span><button type="button" id="next">Volgende →</button></div></div>';
    sheet.innerHTML = h;
    sheet.scrollTop = 0;
    $("sheetClose").onclick = function () { select(null); };
    $("prev").onclick = function () { step(-1); };
    $("next").onclick = function () { step(1); };
    var img = $("sheetImg");
    img.onerror = function () { img.parentNode.className = "frame failed"; };
    img.onclick = function () { openFull(p); };
  }

  function step(dir) {
    if (!results.length) return;
    var i = (selectedIndex() + dir + results.length) % results.length;
    select(results[i].id);
  }

  function openFull(p) {
    var img = full.querySelector("img");
    img.src = p.image_url; img.alt = title(p);
    full.querySelector("strong").textContent = title(p);
    full.querySelector("span").textContent = date(p);
    full.className = "on";
  }
  $("fullClose").onclick = function () { full.className = ""; };
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") full.className = ""; });

  // ---- filters ----------------------------------------------------------------
  $("radius").onchange = function () { radius = Number(this.value); refresh(); };
  function yearInput(el, apply) {
    el.onchange = function () {
      var y = Number(el.value);
      if (!/^\d{4}$/.test(el.value) || y < YEAR_MIN || y > YEAR_MAX) { el.value = apply(null); return; }
      el.value = apply(y); refresh();
    };
  }
  yearInput($("yfrom"), function (y) { if (y != null) { yearFrom = y; if (y > yearTo) { yearTo = y; $("yto").value = y; } } return yearFrom; });
  yearInput($("yto"), function (y) { if (y != null) { yearTo = y; if (y < yearFrom) { yearFrom = y; $("yfrom").value = y; } } return yearTo; });

  $("storiesBtn").onclick = function () {
    var on = $("stories").className !== "on";
    $("stories").className = on ? "on" : "";
    this.setAttribute("aria-expanded", String(on));
  };
  function renderProviders() {
    var box = $("providers"); box.innerHTML = "";
    providers.forEach(function (pr) {
      var l = document.createElement("label"), c = document.createElement("input");
      c.type = "checkbox"; c.checked = !!enabled[pr.id];
      c.onchange = function () { enabled[pr.id] = c.checked; applyProviders(); };
      l.appendChild(c); l.appendChild(document.createTextNode(pr.name)); box.appendChild(l);
    });
    applyProviders();
  }
  // Providers uitzetten verbergt hun links; de foto's zelf blijven.
  function applyProviders() {
    var n = providers.filter(function (pr) { return enabled[pr.id]; }).length;
    $("storiesN").textContent = n + "/" + providers.length;
    all.forEach(function (p) { p.context_contributions = (p.all_contributions || []).filter(function (c) { return enabled[c.provider_id]; }); });
    refresh();
  }

  $("near").onclick = function () {
    var btn = this;
    if (!navigator.geolocation) { say("Locatie is niet beschikbaar; Utrecht blijft in beeld."); return; }
    btn.disabled = true; btn.lastElementChild.textContent = "Zoeken…"; say("");
    navigator.geolocation.getCurrentPosition(function (pos) {
      btn.disabled = false; btn.lastElementChild.textContent = "Dicht bij mij";
      center = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
      selectedId = null; refresh();
      if (mapReady) map.flyTo({ center: [center.longitude, center.latitude], zoom: 14, duration: 900 });
      if (distance(center, UTRECHT) > 15000) say("Je staat buiten Utrecht; de collectie is voorlopig beperkt tot de stad.");
    }, function () {
      btn.disabled = false; btn.lastElementChild.textContent = "Dicht bij mij";
      center = UTRECHT; refresh();
      say("Geen locatietoegang. We tonen het centrum van Utrecht.");
      if (mapReady) map.flyTo({ center: [UTRECHT.longitude, UTRECHT.latitude], zoom: 13.25 });
    }, { enableHighAccuracy: true, timeout: 10000 });
  };
  msg.querySelector("button").onclick = function () { say(""); };

  // ---- start --------------------------------------------------------------------
  if (typeof maplibregl === "undefined") say("De kaartbibliotheek laadt niet — ben je offline?", true);
  else initMap();

  fetch("data.json").then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); }).then(function (d) {
    providers = d.providers;
    all = d.photos.map(function (p) { p.all_contributions = p.context_contributions; return p; });
    providers.forEach(function (pr) { enabled[pr.id] = true; });
    renderProviders();
  }).catch(function () { say("De foto’s konden niet worden geladen.", true); });
})();
