// Pure test voor attentinus/dates.js — de ene datumlogica voor de app, de
// home-tile en de agenda. Geen jsdom nodig:
//
//   node tests/attentinus.dates.test.mjs [<repo>]
import { readFileSync } from "node:fs";
const GM = process.argv[2] || new URL("..", import.meta.url).pathname;
const src = readFileSync(GM + "/sandbox/attentinus/dates.js", "utf8");
const g = {}; new Function("window", src)(g);
const D = g.AttentDates;

let failures = 0;
function check(name, got, want) {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if (!ok) failures++;
  console.log(`${ok ? "  ok  " : "  FAIL"} ${name}${ok ? "" : `\n        got  ${JSON.stringify(got)}\n        want ${JSON.stringify(want)}`}`);
}
const occ = id => ({ cat: "feestdag", occasion: id });
const at = (y, m, d) => new Date(y, m - 1, d, 12);

console.log("attentinus/dates.js\n");

console.log("feestdagen per jaar");
check("moederdag 2027 = zo 9 mei", D.ymd(D.dateIn(occ("moederdag"), 2027)), "2027-05-09");
check("vaderdag 2027 = zo 20 jun", D.ymd(D.dateIn(occ("vaderdag"), 2027)), "2027-06-20");
check("pasen 2027", D.ymd(D.dateIn(occ("pasen"), 2027)), "2027-03-28");
check("pasen 2026", D.ymd(D.dateIn(occ("pasen"), 2026)), "2026-04-05");
check("hemelvaart 2026 = pasen + 39", D.ymd(D.dateIn(occ("hemelvaart"), 2026)), "2026-05-14");
check("pinksteren 2026 = pasen + 49", D.ymd(D.dateIn(occ("pinksteren"), 2026)), "2026-05-24");
check("secretaressedag 2026 = 3e do apr", D.ymd(D.dateIn(occ("secretaressedag"), 2026)), "2026-04-16");
check("kerst (vaste dag)", D.ymd(D.dateIn(occ("kerst"), 2030)), "2030-12-25");
check("onbekende feestdag -> null", D.dateIn(occ("nope"), 2026), null);

console.log("\nvaste datums");
check("29 feb in niet-schrikkeljaar -> 28 feb", D.ymd(D.dateIn({ month: 2, day: 29 }, 2027)), "2027-02-28");
check("29 feb in schrikkeljaar blijft", D.ymd(D.dateIn({ month: 2, day: 29 }, 2028)), "2028-02-29");
check("zonder maand/dag -> null", D.dateIn({ name: "x" }, 2026), null);

console.log("\nnext()");
check("vandaag telt als 0", D.next({ month: 8, day: 22 }, at(2026, 8, 22)).days, 0);
check("gisteren -> volgend jaar", D.ymd(D.next({ month: 8, day: 21 }, at(2026, 8, 22)).date), "2027-08-21");
check("moederdag vanaf 22 aug 2026 -> 9 mei 2027", D.ymd(D.next(occ("moederdag"), at(2026, 8, 22)).date), "2027-05-09");
check("21 dagen voor moederdag 2027", D.next(occ("moederdag"), at(2027, 4, 18)).days, 21);
check("DST-grens telt hele dagen", D.next({ month: 4, day: 1 }, at(2027, 3, 27)).days, 5);

console.log("\non() voor de agenda");
const list = [{ id: "a", name: "Mama", cat: "feestdag", occasion: "moederdag" }, { id: "b", name: "Emma", month: 5, day: 9 }, { id: "c", name: "Papa", month: 8, day: 24 }];
check("beide op 9 mei 2027", D.on(list, "2027-05-09").map(e => e.id), ["a", "b"]);
check("niets op 10 mei", D.on(list, "2027-05-10"), []);
check("moederdag 2026 was 10 mei", D.on(list, "2026-05-10").map(e => e.id), ["a"]);

console.log("\nteksten");
check("cat-migratie oude rij", D.cat({ label: "Trouwdag" }), "trouwdag");
check("cat-migratie vrij label -> anders", D.cat({ label: "examen" }), "anders");
check("word feestdag", D.word(occ("moederdag")), "moederdag");
check("word anders", D.word({ cat: "anders", label: "Examen" }), "examen");
check("yearText verjaardag", D.yearText({ cat: "verjaardag", year: 1992 }, at(2027, 9, 3)), "wordt 35");
check("yearText feestdag -> null", D.yearText({ cat: "feestdag", occasion: "kerst", year: 1990 }, at(2027, 12, 25)), null);
check("occasionByName op label", D.occasionByName("Moederdag").id, "moederdag");
check("occasionByName op id", D.occasionByName(" vaderdag ").id, "vaderdag");
check("ruleText nth", D.ruleText(D.occasion("moederdag")), "2e zondag van mei");
check("ruleText easter", D.ruleText(D.occasion("hemelvaart")), "39 dagen na Pasen");
check("ruleText fixed", D.ruleText(D.occasion("kerst")), "elk jaar 25 dec");
check("fmt met weekdag", D.fmt(at(2027, 5, 9), true), "zo 9 mei");
check("word onbekende feestdag -> id", D.word({ cat: "feestdag", occasion: "koningsdag" }), "koningsdag");
check("until", [D.until(0), D.until(1), D.until(12)], ["vandaag", "over 1 dag", "over 12 dagen"]);
check("SOON_DAYS gedeeld", D.SOON_DAYS, 21);

console.log(`\n${failures ? `${failures} FAIL` : "alles ok"}`);
process.exit(failures ? 1 : 0);
