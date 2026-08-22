(function (global) {
  "use strict";

  // Attentinus-datumlogica: één bestand, drie lezers — de app zelf
  // (attentinus/index.html), de home-tile (home.js) en de agenda
  // (calendar.js). Pure functies: geen storage, geen DOM.
  //
  // Een regel in attentinus.people is óf een vaste dag ({month, day, year?})
  // óf een feestdag ({cat: "feestdag", occasion: "<id>"}) die elk jaar via
  // een regel uit OCCASIONS wordt uitgerekend: vaste dag, n-de weekdag van
  // een maand, of een afstand in dagen tot Pasen.
  // Een feestdag toevoegen = één regel hieronder.

  var OCCASIONS = [
    { id: "moederdag",       label: "Moederdag",       rule: { nth: 2,  weekday: 0, month: 5 } },
    { id: "vaderdag",        label: "Vaderdag",        rule: { nth: 3,  weekday: 0, month: 6 } },
    { id: "valentijn",       label: "Valentijnsdag",   rule: { month: 2,  day: 14 } },
    { id: "pasen",           label: "Pasen",           rule: { easter: 0 } },
    { id: "hemelvaart",      label: "Hemelvaart",      rule: { easter: 39 } },
    { id: "pinksteren",      label: "Pinksteren",      rule: { easter: 49 } },
    { id: "secretaressedag", label: "Secretaressedag", rule: { nth: 3,  weekday: 4, month: 4 } },
    { id: "dierendag",       label: "Dierendag",       rule: { month: 10, day: 4 } },
    { id: "sinterklaas",     label: "Sinterklaas",     rule: { month: 12, day: 5 } },
    { id: "kerst",           label: "Kerst",           rule: { month: 12, day: 25 } }
  ];
  var MONTHS = ["jan", "feb", "mrt", "apr", "mei", "jun", "jul", "aug", "sep", "okt", "nov", "dec"];
  var MONTHS_FULL = ["januari", "februari", "maart", "april", "mei", "juni", "juli", "augustus", "september", "oktober", "november", "december"];
  var DAYS = ["zo", "ma", "di", "wo", "do", "vr", "za"];
  var DAYS_FULL = ["zondag", "maandag", "dinsdag", "woensdag", "donderdag", "vrijdag", "zaterdag"];
  var SOON_DAYS = 21;   // "binnenkort"-venster: badge in de app, rij op de digest-home

  function occasion(id) {
    for (var i = 0; i < OCCASIONS.length; i++) if (OCCASIONS[i].id === id) return OCCASIONS[i];
    return null;
  }
  // Id of naam, hoofdletterongevoelig — voor de import ("Mama ; moederdag").
  function occasionByName(s) {
    var t = String(s || "").trim().toLowerCase();
    for (var i = 0; i < OCCASIONS.length; i++) if (OCCASIONS[i].id === t || OCCASIONS[i].label.toLowerCase() === t) return OCCASIONS[i];
    return null;
  }

  // Eerste paasdag (gregoriaans), Meeus/Jones/Butcher.
  function easter(y) {
    var a = y % 19, b = Math.floor(y / 100), c = y % 100, d = Math.floor(b / 4), e = b % 4,
        f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30,
        i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7,
        m = Math.floor((a + 11 * h + 22 * l) / 451), month = Math.floor((h + l - 7 * m + 114) / 31),
        day = ((h + l - 7 * m + 114) % 31) + 1;
    return new Date(y, month - 1, day, 12);
  }
  function nthWeekday(y, month, weekday, n) {
    var first = new Date(y, month - 1, 1, 12);
    return new Date(y, month - 1, 1 + (weekday - first.getDay() + 7) % 7 + (n - 1) * 7, 12);
  }

  // De datum van een regel in jaar y (12:00 lokale tijd, zodat DST-uren niet
  // in de dagentelling lekken), of null als de regel onbruikbaar is.
  function dateIn(entry, y) {
    if (!entry) return null;
    var occ = entry.occasion ? occasion(entry.occasion) : null;
    if (occ) {
      var r = occ.rule;
      if (r.easter != null) { var d = easter(y); d.setDate(d.getDate() + r.easter); return d; }
      if (r.nth) return nthWeekday(y, r.month, r.weekday, r.nth);
      return new Date(y, r.month - 1, r.day, 12);
    }
    if (!entry.month || !entry.day) return null;
    // 29 feb in een niet-schrikkeljaar -> 28 feb (zoals de app altijd al deed).
    return new Date(y, entry.month - 1, Math.min(entry.day, new Date(y, entry.month, 0).getDate()), 12);
  }
  function noon(d) { var x = new Date(d.getTime()); x.setHours(12, 0, 0, 0); return x; }
  function ymd(d) {
    var m = d.getMonth() + 1, day = d.getDate();
    return d.getFullYear() + "-" + (m < 10 ? "0" : "") + m + "-" + (day < 10 ? "0" : "") + day;
  }

  // Eerstvolgende keer vanaf `from` (default vandaag; vandaag telt mee):
  // {date, days} of null.
  function next(entry, from) {
    var now = noon(from || new Date());
    for (var y = now.getFullYear(); y <= now.getFullYear() + 1; y++) {
      var d = dateIn(entry, y);
      if (!d) return null;
      var days = Math.round((d - now) / 86400000);
      if (days >= 0) return { date: d, days: days };
    }
    return null;
  }
  // Alle regels die op dag `ds` (YYYY-MM-DD) vallen — voor de agenda.
  function on(entries, ds) {
    var y = parseInt(String(ds).slice(0, 4), 10);
    return (entries || []).filter(function (e) { var d = dateIn(e, y); return !!d && ymd(d) === ds; });
  }

  // Categorie, met migratie voor rijen van vóór de vaste categorieën (toen
  // was `label` vrije tekst).
  function cat(e) {
    if (e.cat) return e.cat;
    var l = (e.label || "verjaardag").toLowerCase();
    return (l === "verjaardag" || l === "trouwdag" || l === "sterfdag" || l === "jubileum") ? l : "anders";
  }
  // Het woord voor in een zin: "verjaardag", "moederdag", "examen".
  function word(e) {
    var c = cat(e);
    if (c === "feestdag") { var o = occasion(e.occasion); return o ? o.label.toLowerCase() : (e.occasion || "feestdag"); }
    if (c === "anders") return (e.label || "datum").toLowerCase();
    return c;
  }
  // Wat het jaartal betekent op datum d: "wordt 34", "12 jaar getrouwd",
  // "3 jaar geleden". Feestdagen hebben geen jaartal.
  function yearText(e, d) {
    var c = cat(e);
    if (!e.year || c === "feestdag") return null;
    var n = d.getFullYear() - e.year;
    if (n <= 0) return null;
    return { verjaardag: "wordt " + n, trouwdag: n + " jaar getrouwd", sterfdag: n + " jaar geleden" }[c] || n + " jaar";
  }
  // "vandaag" / "over 1 dag" / "over 12 dagen"
  function until(days) { return days === 0 ? "vandaag" : "over " + days + (days === 1 ? " dag" : " dagen"); }
  // "3 sep" / "zo 9 mei"
  function fmt(d, withWeekday) { return (withWeekday ? DAYS[d.getDay()] + " " : "") + d.getDate() + " " + MONTHS[d.getMonth()]; }
  // De regel in woorden: "2e zondag van mei", "39 dagen na Pasen", "elk jaar 14 feb".
  function ruleText(occ) {
    var r = occ.rule;
    if (r.easter != null) return r.easter ? r.easter + " dagen na Pasen" : "eerste paasdag";
    if (r.nth) return r.nth + "e " + DAYS_FULL[r.weekday] + " van " + MONTHS_FULL[r.month - 1];
    return "elk jaar " + r.day + " " + MONTHS[r.month - 1];
  }

  global.AttentDates = {
    OCCASIONS: OCCASIONS, MONTHS: MONTHS, MONTHS_FULL: MONTHS_FULL, SOON_DAYS: SOON_DAYS,
    occasion: occasion, occasionByName: occasionByName, dateIn: dateIn, next: next, on: on,
    cat: cat, word: word, yearText: yearText, until: until, fmt: fmt, ruleText: ruleText, ymd: ymd
  };
})(typeof window !== "undefined" ? window : globalThis);
