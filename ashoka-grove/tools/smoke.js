// Headless smoke test: drive the real scene through every state with no
// runtime errors, and stress board generation for solvability.
const { loadGame, createCanvas } = require("./env");
const DG = loadGame();
const ctx = createCanvas(720, 1280).getContext("2d");

let fails = 0;
const assert = (c, m) => { if (!c) { console.log("  ✗ " + m); fails++; } else console.log("  ✓ " + m); };
const step = (scene, dt) => { DG.time += dt; scene.update(dt); scene.render(ctx); };

// 1) board generation stress — every board must keep Sitamma reachable
console.log("board generation (300 boards):");
let minOpen = 1e9, reachFail = 0;
for (let i = 0; i < 300; i++) {
  const s = DG.Scenes.Grove(); s.enter();
  const B = s.__debug.board();
  if (!B.reachable(B.sita.x, B.sita.y)) reachFail++;
  if (!B.reachable(B.chud.x, B.chud.y)) reachFail++;
  for (const k of B.keepsakes) if (!B.reachable(k.x, k.y)) reachFail++;
  s.exit();
}
assert(reachFail === 0, "Sitamma + chudamani + keepsakes reachable on all 300 boards (" + reachFail + " misses)");

// 2) full play-through driven through the real update loop
console.log("play-through:");
const scene = DG.Scenes.Grove();
scene.enter();
const seen = {};
const record = () => { seen[scene.__debug.state()] = true; };

// dismiss intro
scene.onDown({ x: 360, y: 700 }); scene.onUp({ x: 360, y: 700 });
record();
assert(scene.__debug.state() === "explore", "intro → explore on tap");

// wander with the joystick for a while (exercises movement/collision/lighting/rakshasi)
scene.onDown({ x: 360, y: 1050 });
for (let i = 0; i < 360; i++) {
  scene.onMove({ x: 360 + Math.cos(i * 0.2) * 50 + 40, y: 1050 - 60 }); // push up-ish
  step(scene, 1 / 60);
  record();
}
scene.onUp({ x: 360, y: 1000 });

// stand still long enough to enter prayer (aura)
const h = scene.__debug.hero();
for (let i = 0; i < 200; i++) { step(scene, 1 / 60); record(); }
assert(h.pray > 0.5 && h.auraR > 50, "idle prayer raises the safe aura (pray=" + h.pray.toFixed(2) + ", auraR=" + h.auraR.toFixed(0) + ")");

// exercise a rakshasi waking via the lamp
const B = scene.__debug.board();
const r0 = B.rak[0];
h.x = r0.x; h.y = r0.y; h.pray = 0; h.lampB = 1; h.moving = true; h.still = 0;
let woke = false;
for (let i = 0; i < 200; i++) { h.x = r0.x; h.y = r0.y; h.lampB = 1; step(scene, 1 / 60); if (r0.state !== "sleep") woke = true; }
assert(woke, "lamp resting on a rakshasi wakes her (state=" + r0.state + ")");

// collect everything, walk into Sitamma's zone, toss, reunion → dawn → end
h.keepsakes = 3; h.hasChud = true;
h.x = B.sita.x - 150; h.y = B.sita.y + 150;
B.sita_fear = 0;
for (let i = 0; i < 30; i++) { step(scene, 1 / 60); record(); }
assert(scene.__debug.state() === "approach", "entering Sitamma's zone → approach");
assert(DG.UI.tossBtn.visible, "toss button appears (have chudamani, calm)");

scene.__debug.doToss();
record();
assert(scene.__debug.state() === "tossing", "toss → tossing");

for (let i = 0; i < 600 && scene.__debug.state() !== "end"; i++) { step(scene, 1 / 60); record(); }
assert(scene.__debug.state() === "end", "reaches the end (hope carried home)");
assert((B.sita_rec || 0) > 0.9, "Sitamma recognized (rec=" + (B.sita_rec || 0).toFixed(2) + ")");
assert(h.scale > 0.64 * 1.5, "Hanuman grew great (scale=" + h.scale.toFixed(2) + ")");

const states = ["intro", "explore", "approach", "tossing", "reunion", "dawn", "end"];
assert(states.every((s) => seen[s] || s === "intro"), "visited states: " + Object.keys(seen).join(", "));

// tapping at end starts a fresh board
DG.Scenes.go = (s) => { DG._next = s; };
scene.onDown({ x: 360, y: 760 });
assert(!!DG._next, "tap at end → new grove scene");

console.log(fails === 0 ? "\nSMOKE PASSED ✅" : "\nSMOKE FAILED ❌ (" + fails + ")");
process.exit(fails === 0 ? 0 : 1);
