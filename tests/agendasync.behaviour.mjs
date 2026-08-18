// Gedragstest voor de vangnetten in agendasync.js, toegevoegd na het
// data-verlies van 2026-08-18.
//
//   cd /tmp && npm i jsdom && node <repo>/tests/agendasync.behaviour.mjs <repo>
//
// Draai dit na elke wijziging aan agendasync.js.
import { JSDOM } from "jsdom";
import { readFileSync } from "node:fs";
const GM = process.argv[2] || new URL("..", import.meta.url).pathname;

function harness({ pullFails, serverTodos, localTodos }) {
  const dom = new JSDOM(`<!doctype html><html><body></body></html>`, { url:"https://x.test/", runScripts:"outside-only" });
  const w = dom.window;
  w.k = (n) => "dd." + n;
  const store = { "dd.todos": JSON.stringify(localTodos) };
  Object.defineProperty(w, "localStorage", { value: {
    getItem: x => (x in store ? store[x] : null),
    setItem: (x,v) => { store[x] = String(v); },
    removeItem: x => { delete store[x]; } }, configurable:true });

  let upserted = null;
  const row = { data: { "dd.todos": serverTodos } };
  const chain = {
    select: () => ({ eq: () => Promise.resolve(pullFails ? { error:{message:"boom"} } : { data:[{ ...row, updated_at:"t1" }] }) }),
    upsert: (payload) => { upserted = payload; return Promise.resolve({}); },
  };
  w.SB = { from: () => chain,
           auth: { getSession: () => Promise.resolve({ data:{ session:{ user:{ id:"u1" } } } }),
                   onAuthStateChange: () => {} } };
  let readyFired = false;
  w.document.addEventListener("dd-agenda-ready", () => { readyFired = true; });
  w.eval(readFileSync(GM + "/agendasync.js", "utf8"));
  return { w, get upserted(){ return upserted; }, get ready(){ return readyFired; }, store };
}

const wait = (ms) => new Promise(r => setTimeout(r, ms));

const t = [];
// 1. Mislukte eerste pull -> niet primed, geen ready-signaal, geen push
{
  const h = harness({ pullFails:true, serverTodos:[1,2,3,4,5,6], localTodos:[] });
  await wait(60);
  h.w.AgendaSync.pushNow();
  await wait(60);
  t.push(["mislukte pull: geen ready-signaal", h.ready === false]);
  t.push(["mislukte pull: niets gepusht",      h.upserted === null]);
  t.push(["mislukte pull: niet primed",        h.w.AgendaSync.primed() === false]);
}
// 2. Geslaagde pull -> wel primed en ready
{
  const h = harness({ pullFails:false, serverTodos:[1,2,3], localTodos:[1,2,3] });
  await wait(60);
  t.push(["geslaagde pull: ready-signaal", h.ready === true]);
  t.push(["geslaagde pull: primed",        h.w.AgendaSync.primed() === true]);
}
// 3. Krimpvangnet: server 6 items, lokaal leeg -> push mag dd.todos niet legen
{
  const h = harness({ pullFails:false, serverTodos:[1,2,3,4,5,6], localTodos:[1,2,3,4,5,6] });
  await wait(60);
  h.store["dd.todos"] = JSON.stringify([]);       // simuleer een lege lokale staat
  h.w.AgendaSync.pushNow();
  await wait(80);
  const wrote = h.upserted && h.upserted.data["dd.todos"];
  t.push(["krimpvangnet: server behoudt 6 items", Array.isArray(wrote) && wrote.length === 6]);
}
// 4. Gewone bewerking komt er nog steeds door
{
  const h = harness({ pullFails:false, serverTodos:[1,2,3,4,5,6], localTodos:[1,2,3,4,5,6] });
  await wait(60);
  h.store["dd.todos"] = JSON.stringify([1,2,3,4,5]);   // één item weg
  h.w.AgendaSync.pushNow();
  await wait(80);
  const wrote = h.upserted && h.upserted.data["dd.todos"];
  t.push(["normale bewerking gaat door (6->5)", Array.isArray(wrote) && wrote.length === 5]);
}
let bad = 0;
for (const [naam, ok] of t) { if (!ok) bad++; console.log((ok ? "PASS  " : "FAAL  ") + naam); }
console.log(bad ? `\n${bad} test(s) gefaald` : "\nalle tests geslaagd");
process.exit(bad ? 1 : 0);
