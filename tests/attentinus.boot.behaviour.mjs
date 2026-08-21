// Gedragstest voor de sync-beslisboom in attentinus/boot.js.
//
// Bewaakt twee dingen tegelijk:
//   * regel #2 uit CLAUDE.md — "leeg" is nooit vanzelf "veilig om te
//     overschrijven", en alleen een geslaagde pull maakt de server leidend;
//   * de telefoonfix — een verwijdering die niet meer gepusht kon worden
//     voordat iOS het tabblad bevroor, mag bij de volgende start niet door
//     oude serverdata worden teruggedraaid.
//
//   cd /tmp && npm i jsdom && node <repo>/tests/attentinus.boot.behaviour.mjs <repo>
//
// Draai dit na elke wijziging aan attentinus/boot.js.
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
// Node resolvet "jsdom" vanaf de map van dit bestand, niet vanaf de cwd —
// vanuit een worktree wordt /tmp/node_modules dus nooit gevonden. Val dan
// terug op resolutie vanaf de cwd, zodat het recept hierboven overal werkt.
let JSDOM;
try { ({ JSDOM } = await import("jsdom")); }
catch (e) {
  if (e?.code !== "ERR_MODULE_NOT_FOUND") throw e;
  ({ JSDOM } = createRequire(process.cwd() + "/")("jsdom"));
}
const GM = process.argv[2] || new URL("..", import.meta.url).pathname;
const BOOT = readFileSync(GM + "/sandbox/attentinus/boot.js", "utf8");

const KEY = "dd:attentinus.people";
const DIRTY = "dd:__attentinus_pending";
const STAMP = "dd:__attentinus_seen";
const ANNA = [{ id: "p1", name: "Anna", month: 3, day: 4, ideas: [] }];
const ANNA_BOB = ANNA.concat([{ id: "p2", name: "Bob", month: 9, day: 1, ideas: [] }]);
const J = v => JSON.stringify(v);

let failures = 0;
function check(name, got, want) {
  const ok = J(got) === J(want);
  if (!ok) failures++;
  console.log(`${ok ? "  ok  " : "  FAIL"} ${name}${ok ? "" : `\n        got  ${J(got)}\n        want ${J(want)}`}`);
}

const tick = (ms = 40) => new Promise(r => setTimeout(r, ms));

// Eén scenario = een verse document + een gescript Supabase-stub.
async function boot({ serverRow = null, seedLocal = {}, pushFails = false,
                     serverStamp = null, selectErrorFrom = 0 }) {
  const dom = new JSDOM(
    `<!doctype html><html><body><script type="application/gm-app" id="gm-app-code">window.APP_RAN=true;</script></body></html>`,
    { url: "https://example.test/attentinus/index.html", runScripts: "dangerously" }
  );
  const { window } = dom;
  for (const [k, v] of Object.entries(seedLocal)) window.localStorage.setItem(k, v);

  const calls = { upserts: [], selects: 0 };
  // Zoals echt: na een geslaagde upsert geeft de server ónze stempel terug,
  // maar in Postgres-notatie ("+00:00" i.p.v. "Z").
  let stamp = serverStamp;
  window.supabase = {
    createClient: () => ({
      from: () => {
        return {
          select: () => ({ eq: () => {
            calls.selects++;
            // supabase-js *resolvet* met {error} bij een gewone HTTP-fout.
            if (selectErrorFrom && calls.selects >= selectErrorFrom) {
              return Promise.resolve({ error: { message: "JWT expired" } });
            }
            return Promise.resolve({ data: serverRow ? [{ data: serverRow, updated_at: stamp }] : [] });
          } }),
          upsert: row => {
            calls.upserts.push(row);
            if (!pushFails) stamp = String(row.updated_at).replace(/Z$/, "+00:00");
            // .upsert(...).select() geeft de rij terug zoals de server hem opslaat.
            return { select: () => Promise.resolve(pushFails
              ? { error: { message: "network" } }
              : { data: [{ updated_at: stamp }], error: null }) };
          }
        };
      },
      auth: {
        getSession: () => Promise.resolve({ data: { session: { user: { id: "u1" } } } }),
        onAuthStateChange: () => {}
      }
    })
  };

  window.eval(BOOT);
  await tick();

  // De app schrijft via de logische key; de shim maakt er dd:… van.
  const write = list => window.localStorage.setItem("attentinus.people", J(list));
  const read = () => window.localStorage.getItem("attentinus.people");
  const raw = k => window.localStorage.getItem(k);
  // Wegswipen op de telefoon: alleen visibilitychange, daarna vriest iOS in.
  const background = async () => {
    Object.defineProperty(window.document, "hidden", { value: true, configurable: true });
    window.document.dispatchEvent(new window.Event("visibilitychange"));
    await tick();
  };
  const foreground = async () => {
    Object.defineProperty(window.document, "hidden", { value: false, configurable: true });
    window.document.dispatchEvent(new window.Event("visibilitychange"));
    await tick();
  };
  // Wegswipen en sluiten vuren vlak na elkaar in dezelfde turn.
  const hardClose = async () => {
    Object.defineProperty(window.document, "hidden", { value: true, configurable: true });
    window.document.dispatchEvent(new window.Event("visibilitychange"));
    window.dispatchEvent(new window.Event("pagehide"));
    await tick();
  };
  return { window, calls, write, read, raw, background, foreground, hardClose };
}

const lastPushed = calls => {
  const u = calls.upserts[calls.upserts.length - 1];
  return u ? u.data[KEY] : null;
};

console.log("attentinus/boot.js — sync-gedrag\n");

// ---------------------------------------------------------------- de bug ---
{
  console.log("telefoon: verwijdering overleeft een push die niet meer wegkwam");
  // Stap 1 — telefoon heeft Anna+Bob, gebruiker verwijdert Bob, swipet weg.
  const a = await boot({ serverRow: { [KEY]: J(ANNA_BOB) }, pushFails: true });
  a.write(ANNA);
  await a.background();
  check("push wordt bij wegswipen meteen geprobeerd", a.calls.upserts.length, 1);
  check("de push bevat de verwijdering", lastPushed(a.calls), J(ANNA));
  check("mislukte push blijft als 'open' gemarkeerd", a.raw(DIRTY), "1");

  // Stap 2 — iOS gooit het tabblad weg; later opent de app opnieuw. De server
  // heeft Bob nog. Vóór de fix seedde die oude rij Bob gewoon terug.
  const b = await boot({
    serverRow: { [KEY]: J(ANNA_BOB) },
    seedLocal: { [KEY]: J(ANNA), [DIRTY]: "1" }
  });
  check("Bob komt NIET terug na herstart", b.read(), J(ANNA));
  await tick(1700);
  check("de inhaalslag pusht de verwijdering alsnog", lastPushed(b.calls), J(ANNA));
  check("na een geslaagde push staat er niets meer open", b.raw(DIRTY), null);
}

// ------------------------------------------------- de laatste verwijderen ---
{
  console.log("\nde laatste persoon verwijderen komt door het leeg-vangnet heen");
  const a = await boot({ serverRow: { [KEY]: J(ANNA) } });
  a.write([]);
  await a.background();
  check("lege lijst wordt gepusht", lastPushed(a.calls), "[]");
  check("niets meer open", a.raw(DIRTY), null);
}

// ------------------------------------------------------ vangnet blijft staan ---
{
  console.log("\nvangnet: leeg zónder gebruikersactie overschrijft de server niet");
  const a = await boot({ serverRow: { [KEY]: J(ANNA_BOB) } });
  check("serverdata is geseed", a.read(), J(ANNA_BOB));
  // localStorage buiten de app om leeggelopen (Safari-opruiming, quota-fout).
  a.window.localStorage.removeItem(KEY);
  await a.background();
  check("er wordt niets gepusht", a.calls.upserts.length, 0);
}

// --------------------------------------------------------- normale werking ---
{
  console.log("\nnormale werking blijft intact");
  const a = await boot({ serverRow: { [KEY]: J(ANNA_BOB) } });
  check("verse start seedt de server", a.read(), J(ANNA_BOB));
  check("schone start pusht niets", a.calls.upserts.length, 0);

  const b = await boot({ serverRow: null });
  check("lege server seedt niets", b.read(), null);

  // Wijziging op de laptop wordt bij terugkomen opgepikt zolang lokaal schoon is.
  const c = await boot({ serverRow: { [KEY]: J(ANNA) } });
  check("start met Anna", c.read(), J(ANNA));
  await c.foreground();
  check("pull op de voorgrond draait niets terug", c.read(), J(ANNA));
  check("schone voorgrond-pull pusht niet", c.calls.upserts.length, 0);
}

// ------------------------------------------ mislukte pre-push select -------
{
  console.log("\neen select die met {error} resolvet plant alsnog een retry");
  // selectErrorFrom 2: de boot-pull slaagt, de select vóór de push faalt.
  const a = await boot({ serverRow: { [KEY]: J(ANNA_BOB) }, selectErrorFrom: 2 });
  a.write(ANNA);
  await a.background();
  check("er is niets gepusht", a.calls.upserts.length, 0);
  check("de wijziging blijft openstaan", a.raw(DIRTY), "1");
  await tick(9000);
  check("er is opnieuw geprobeerd", a.calls.selects >= 3, true);
}

// ------------------------------------------------- dubbele flush ------------
{
  console.log("\nwegswipen + sluiten levert één push op, geen twee");
  const a = await boot({ serverRow: { [KEY]: J(ANNA_BOB) } });
  a.write(ANNA);
  await a.hardClose();
  check("precies één upsert", a.calls.upserts.length, 1);
}

// ------------------------------------------------- allebei gewijzigd --------
{
  console.log("\nlokaal én server gewijzigd: geen van beide wordt gewist");
  const a = await boot({
    serverRow: { [KEY]: J(ANNA_BOB) },
    serverStamp: "2026-08-21T10:00:00.000Z",
    seedLocal: { [KEY]: "[]", [DIRTY]: "1", [STAMP]: "2026-08-14T09:00:00.000Z" }
  });
  check("lokaal blijft staan", a.read(), "[]");
  await tick(1700);
  check("de server wordt niet overschreven", a.calls.upserts.length, 0);
  check("het conflict is zichtbaar voor de app", a.window.__gmAttent.conflict(), true);
  // Uitweg: 'deze lijst' neemt de geziene serverstempel over en pusht meteen.
  a.window.__gmAttent.keepMine();
  await tick();
  check("'deze lijst' pusht de lokale lijst alsnog", lastPushed(a.calls), "[]");
  check("conflict weg, niets meer open", [a.window.__gmAttent.conflict(), a.raw(DIRTY)], [false, null]);
}

// ------------------------------------------ twee wijzigingen op een rij ----
{
  console.log("\ntwee wijzigingen in één sessie: de eigen stempel is geen conflict");
  const a = await boot({ serverRow: { [KEY]: J(ANNA) }, serverStamp: "2026-08-21T09:00:00+00:00" });
  a.write(ANNA_BOB);
  await tick(1700);
  check("eerste wijziging gepusht", a.calls.upserts.length, 1);
  a.write(ANNA);
  await tick(1700);
  check("tweede wijziging ook gepusht", a.calls.upserts.length, 2);
  check("geen conflict", a.window.__gmAttent.conflict(), false);
  check("niets meer open", a.raw(DIRTY), null);
  check("bewaarde stempel is de serverstring", a.raw(STAMP)?.endsWith("+00:00"), true);
}

// ------------------------------------------ toevoegen en meteen weer weg -----
{
  console.log("\nwijziging die zichzelf opheft laat niets openstaan");
  const a = await boot({ serverRow: { [KEY]: J(ANNA) } });
  a.write(ANNA_BOB);
  a.write(ANNA);
  await tick(1700);
  check("niets gepusht", a.calls.upserts.length, 0);
  check("en niets open", a.raw(DIRTY), null);
}

console.log(`\n${failures ? `${failures} FAIL` : "alles ok"}`);
process.exit(failures ? 1 : 0);
