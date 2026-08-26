// Pure test voor clipinus/segue.js — de codec-helft (tijden, video-id's, link
// bouwen/lezen). De spelerhelft heeft een browser nodig en zit hier niet in.
//
//   node tests/segue.codec.test.mjs [<repo>]
import { readFileSync } from "node:fs";
const GM = process.argv[2] || new URL("..", import.meta.url).pathname;
const src = readFileSync(GM + "/sandbox/clipinus/segue.js", "utf8");
const g = {}; new Function("window", src)(g);
const S = g.Segue;

let failures = 0;
function check(name, got, want) {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if (!ok) failures++;
  console.log(`${ok ? "  ok  " : "  FAIL"} ${name}${ok ? "" : `\n        got  ${JSON.stringify(got)}\n        want ${JSON.stringify(want)}`}`);
}

console.log("clipinus/segue.js\n");

console.log("tijden");
check("1:02:03", S.seconds("1:02:03"), 3723);
check("4:20", S.seconds("4:20"), 260);
check("83", S.seconds("83"), 83);
check("1m23s", S.seconds("1m23s"), 83);
check("1h2m3s", S.seconds("1h2m3s"), 3723);
check("leeg = 0", S.seconds(""), 0);
check("onzin = NaN", isNaN(S.seconds("straks")), true);
check("klok 3723", S.clock(3723), "1:02:03");
check("klok 65", S.clock(65), "1:05");

console.log("\nvideo-id");
check("watch-url", S.videoId("https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=42s"), "dQw4w9WgXcQ");
check("youtu.be", S.videoId("https://youtu.be/dQw4w9WgXcQ?si=x"), "dQw4w9WgXcQ");
check("shorts", S.videoId("https://www.youtube.com/shorts/dQw4w9WgXcQ"), "dQw4w9WgXcQ");
check("kaal id", S.videoId("dQw4w9WgXcQ"), "dQw4w9WgXcQ");
check("geen id", S.videoId("https://example.com/video"), null);

console.log("\nlink bouwen en lezen");
const clips = [
  { id: "dQw4w9WgXcQ", start: "1:12", end: "1:40", label: "Refrein" },
  { id: "https://youtu.be/oHg5SJYRHA0", start: 0, end: 12, label: "Coda, één keer" }
];
const link = S.build(clips, { title: "Test" });
check("link-vorm", link.startsWith(S.SEGUE_URL), true);
const round = S.parse(link);
check("titel", round.title, "Test");
check("transitie", round.transition, "hard-cut");
check("clips", round.clips, [
  { id: "dQw4w9WgXcQ", start: 72, end: 100, label: "Refrein" },
  { id: "oHg5SJYRHA0", start: 0, end: 12, label: "Coda één keer" }   // komma wordt spatie
]);

console.log("\nlezen van vreemde links");
const plain = "2~Clips~hard-cut~dQw4w9WgXcQ,0,30,Intro";
const std = Buffer.from(plain, "utf8").toString("base64");
check("kaal base64", S.parse(std).clips[0].label, "Intro");
check("url-safe zonder padding", S.parse(std.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")).clips.length, 1);
check("onleesbaar = null", S.parse("!!!"), null);
check("lege lijst = null", S.parse(Buffer.from("2~x~hard-cut~", "utf8").toString("base64")), null);
check("accenten overleven", S.parse(S.build([{ id: "dQw4w9WgXcQ", start: 1, end: 2, label: "café — één" }])).clips[0].label, "café — één");
check("eind <= start blijft staan", S.parse(S.build([{ id: "dQw4w9WgXcQ", start: 30, end: 0, label: "tot eind" }])).clips[0].end, 0);


// De speler-helft met een nep-YT: geen browser nodig, maar wel de echte
// doorschakel-logica (tik op de eindtijd, ENDED als vangnet, fout = overslaan).
console.log("\nvolgorde (nep-speler)");
const wait = ms => new Promise(r => setTimeout(r, ms));
let made = null;
class FakePlayer {
  constructor(el, cfg) {
    made = this; this.cfg = cfg; this.loads = []; this.state = 1;
    this.t = cfg.playerVars.start || 0;
    setTimeout(() => cfg.events.onReady(), 0);
  }
  getCurrentTime() { return this.t; }
  getPlayerState() { return this.state; }
  loadVideoById(o) { this.loads.push(o); this.t = o.startSeconds; this.state = 1; }
  pauseVideo() { this.state = 2; }
  destroy() { this.dead = true; }
}
g.YT = { Player: FakePlayer };

const seq = [
  { id: "aaaaaaaaaaa", start: 0, end: 10, label: "een" },
  { id: "aaaaaaaaaaa", start: 20, end: 30, label: "twee" },
  { id: "bbbbbbbbbbb", start: 5, end: 8, label: "drie" }
];
const seen = [];
let ends = 0;
const ctl = S.play({}, seq, { onChange: i => seen.push(i), onEnd: () => ends++ });
await wait(60);
check("eerste clip in playerVars", [made.cfg.videoId, made.cfg.playerVars.start, made.cfg.playerVars.end], ["aaaaaaaaaaa", 0, 10]);

made.t = 10.2; await wait(400);
check("na eindtijd -> clip 2", made.loads[0], { videoId: "aaaaaaaaaaa", startSeconds: 20, endSeconds: 30 });
made.t = 30.1; await wait(400);
check("en door naar clip 3", made.loads[1], { videoId: "bbbbbbbbbbb", startSeconds: 5, endSeconds: 8 });
check("index volgt mee", ctl.index(), 2);

made.t = 8.1; await wait(400);
check("einde meldt zich", ends, 1);
await wait(400);
check("en maar één keer", ends, 1);
check("onChange per clip", seen, [0, 1, 2]);

made.state = 1; made.t = 100; await wait(400);
check("na het einde geen nieuwe clip", made.loads.length, 2);

// Een fout onderweg, en het ENDED-vangnet met zijn race-guard
const ctl2 = S.play({}, seq, { onError: why => seen.push(why) });
await wait(60);
made.cfg.events.onError({ data: 150 });
check("fout = overslaan", made.loads[made.loads.length - 1].startSeconds, 20);
check("fout wordt gemeld", seen[seen.length - 1], "clip");
const loads = made.loads.length;
made.cfg.events.onStateChange({ data: 0 });
check("laat ENDED vlak na een wissel slaat niets over", made.loads.length, loads);
await wait(1100);
made.cfg.events.onStateChange({ data: 0 });
check("ENDED schakelt daarna wel door", made.loads[made.loads.length - 1].videoId, "bbbbbbbbbbb");
ctl.destroy(); ctl2.destroy();
check("destroy ruimt op", made.dead, true);

console.log(failures ? `\n${failures} FAIL` : "\nalles ok");
process.exit(failures ? 1 : 0);
