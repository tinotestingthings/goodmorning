// Gedragstest voor de sync/offline-beslisboom in notesprint/boot.js.
// Bewaakt regel #2 uit CLAUDE.md: alleen een *geslaagde* pull maakt lokaal
// leidend, en "leeg" is nooit "veilig om te overschrijven".
//
//   cd /tmp && npm i jsdom && node <repo>/tests/notesprint.boot.behaviour.mjs <repo>
//
// Draai dit na elke wijziging aan notesprint/boot.js.
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
const BOOT = readFileSync(GM + "/sandbox/notesprint/boot.js", "utf8");
const APP_MARK = "APP_RAN";

let failures = 0;
function check(name, got, want) {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if (!ok) failures++;
  console.log(`${ok ? "  ok  " : "  FAIL"} ${name}${ok ? "" : `\n        got  ${JSON.stringify(got)}\n        want ${JSON.stringify(want)}`}`);
}

// One scenario = one fresh document + a scripted Supabase stub.
async function scenario({ libLoaded = true, session = true, pullOk = true, serverRow = null, seedLocal = {}, storedSession = true, fetchOk = true }) {
  const dom = new JSDOM(
    `<!doctype html><html><body><script type="application/gm-app" id="gm-app-code">window.${APP_MARK}=true;</script></body></html>`,
    { url: "https://example.test/notesprint/index.html", runScripts: "dangerously" }
  );
  const { window } = dom;
  for (const [k, v] of Object.entries(seedLocal)) window.localStorage.setItem(k, v);
  if (storedSession) window.localStorage.setItem("sb-bobltktjohhnoqhnxslf-auth-token", JSON.stringify({ access_token: "tok_abc", user: { id: "u1" } }));

  const calls = { upserts: [], selects: 0, fetches: [] };
  const q = () => ({
    select: () => ({ eq: () => pullOk ? Promise.resolve({ data: serverRow ? [{ data: serverRow }] : [] }) : Promise.reject(new Error("offline")) }),
    upsert: row => { calls.upserts.push(row); return Promise.resolve({ error: null }); }
  });
  if (libLoaded) {
    window.supabase = {
      createClient: () => ({
        from: () => { calls.selects++; return q(); },
        auth: {
          getSession: () => Promise.resolve({ data: { session: session ? { user: { id: "u1" }, access_token: "tok_abc" } : null } }),
          onAuthStateChange: () => {}
        }
      })
    };
  }
  window.fetch = (url, opts) => { calls.fetches.push({ url, opts }); return Promise.resolve({ ok: fetchOk, status: fetchOk ? 204 : 500 }); };

  window.eval(BOOT);
  await new Promise(r => setTimeout(r, 30));

  return {
    window, calls,
    appRan: window[APP_MARK] === true,
    gated: !!window.document.getElementById("gm-gate"),
    notice: (window.document.getElementById("gm-offline-note") || {}).textContent || null,
    dirty: () => window.localStorage.getItem("dd:gmOfflineDirty"),
    local: key => window.localStorage.getItem(key),
    write: (k, v) => window.localStorage.setItem(k, v),
    hide: () => window.dispatchEvent(new window.Event("pagehide"))
  };
}

console.log("\nboot.js — offline & sync behaviour\n");

{
  const s = await scenario({ pullOk: true, serverRow: { "dd:noteSprintThemeV1": "neon" } });
  check("healthy pull runs the app and seeds server state", [s.appRan, s.gated, s.local("dd:noteSprintThemeV1")], [true, false, "neon"]);
}
{
  const s = await scenario({ pullOk: false, seedLocal: {} });
  check("failed pull with NO local data still refuses to run (data-loss rule)", [s.appRan, s.gated], [false, true]);
}
{
  const s = await scenario({ pullOk: false, seedLocal: { "dd:noteSprintThemeV1": "duo" } });
  check("failed pull WITH local data runs offline instead of gating", [s.appRan, s.gated, !!s.notice], [true, false, true]);
  s.write("noteSprintScoreV1", "42");
  await new Promise(r => setTimeout(r, 30));
  check("offline writes are flagged dirty, never pushed", [s.dirty(), s.calls.upserts.length], ["1", 0]);
}
{
  const s = await scenario({ libLoaded: false, storedSession: true, seedLocal: { "dd:noteSprintThemeV1": "duo" } });
  check("no Supabase client + signed-in device + local data -> offline", [s.appRan, s.gated], [true, false]);
}
{
  const s = await scenario({ libLoaded: false, storedSession: false, seedLocal: {} });
  check("no Supabase client + never signed in -> gate", [s.appRan, s.gated], [false, true]);
}
{
  // The core regression: work done offline must survive the next online load.
  const s = await scenario({
    pullOk: true,
    serverRow: { "dd:noteSprintScoreV1": "OLD_SERVER" },
    seedLocal: { "dd:noteSprintScoreV1": "NEW_OFFLINE", "dd:gmOfflineDirty": "1" }
  });
  check("dirty local is NOT overwritten by an older server row", s.local("dd:noteSprintScoreV1"), "NEW_OFFLINE");
  await new Promise(r => setTimeout(r, 1700));
  check("...and is pushed up instead", s.calls.upserts.at(-1)?.data["dd:noteSprintScoreV1"], "NEW_OFFLINE");
  check("...clearing the dirty flag once it lands", s.dirty(), null);
}
{
  const s = await scenario({ pullOk: true, serverRow: { "sbx:noteSprintThemeV1": "keep-me" } });
  s.write("noteSprintThemeV1", "night");
  s.hide();
  await new Promise(r => setTimeout(r, 30));
  const post = s.calls.fetches.at(-1);
  check("pagehide sends one keepalive POST", [s.calls.fetches.length, post?.opts.keepalive, post?.opts.method], [1, true, "POST"]);
  const body = JSON.parse(post.opts.body);
  check("...carrying the new value", body.data["dd:noteSprintThemeV1"], "night");
  check("...and preserving the other environment's keys", body.data["sbx:noteSprintThemeV1"], "keep-me");
}

{
  // The keepalive POST is fire-and-forget, but its answer must still decide the
  // bookkeeping: assuming success would let the next load seed the older server
  // row over work that never arrived.
  const s = await scenario({ pullOk: true, serverRow: {}, fetchOk: false });
  s.write("noteSprintScoreV1", "99");
  s.hide();
  await new Promise(r => setTimeout(r, 30));
  check("a rejected keepalive flush marks the device dirty", s.dirty(), "1");
}
{
  const s = await scenario({ pullOk: true, serverRow: {}, seedLocal: { "dd:gmOfflineDirty": "1" } });
  s.write("noteSprintScoreV1", "99");
  s.hide();
  await new Promise(r => setTimeout(r, 30));
  check("a delivered keepalive flush clears it again", [s.dirty(), s.calls.upserts.length], [null, 0]);
}
{
  // Too big for the keepalive budget -> fall back to the read-then-upsert path,
  // but flag dirty first so a hard unload can't lose the work silently.
  const s = await scenario({ pullOk: true, serverRow: { "sbx:noteSprintLearningV1": "x".repeat(70000) } });
  s.write("noteSprintScoreV1", "99");
  s.hide();
  await new Promise(r => setTimeout(r, 30));
  check("an oversized payload uses the upsert path, not keepalive", [s.calls.fetches.length, s.calls.upserts.length], [0, 1]);
}

console.log(`\n${failures ? `✗ ${failures} failing` : "✓ all passed"}\n`);
process.exit(failures ? 1 : 0);
