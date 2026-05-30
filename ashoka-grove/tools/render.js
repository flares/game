// Render real scenes + a sprite contact sheet to PNGs for visual QA.
const fs = require("fs");
const { loadGame, createCanvas } = require("./env");
const DG = loadGame();
const U = DG.util, Art = DG.Art;
const OUT = require("path").join(__dirname, "out");
fs.mkdirSync(OUT, { recursive: true });

function save(canvas, name) { fs.writeFileSync(`${OUT}/${name}`, canvas.toBuffer("image/png")); console.log("wrote", name); }
function setTime(t) { DG.time = t; }

// ---- full grove scene shots ----
function groveShot(name, mutate) {
  const c = createCanvas(720, 1280), ctx = c.getContext("2d");
  const scene = DG.Scenes.Grove();
  scene.enter();
  // dismiss intro
  scene.onDown({ x: 360, y: 700 }); scene.onUp({ x: 360, y: 700 });
  setTime(3.0);
  for (let i = 0; i < 5; i++) scene.update(1 / 60);
  const h = scene.__debug.hero(), B = scene.__debug.board();
  if (mutate) mutate(h, B, scene);
  scene.render(ctx);
  save(c, name);
  return { scene, h, B };
}

// A) reveal most of the maze (big aura) to inspect layout + sprites
groveShot("grove_reveal.png", (h, B) => {
  h.x = 360; h.y = 760; h.pray = 1; h.auraR = 1100; h.lampB = 0.4; h.state = "pray"; h.keepsakes = 2;
});

// B) realistic in-play darkness (small lamp)
groveShot("grove_play.png", (h, B) => {
  // place hero on the trail mid-journey
  const tp = B.trailPts[Math.floor(B.trailPts.length * 0.5)];
  h.x = tp.x; h.y = tp.y; h.state = "walk"; h.facing = 1; h.auraR = 0; h.lampB = 1; h.lampR = 44;
});

// C) praying with aura (mid darkness) — shows the two-light mechanic
groveShot("grove_pray.png", (h, B) => {
  const tp = B.trailPts[Math.floor(B.trailPts.length * 0.45)];
  h.x = tp.x; h.y = tp.y; h.state = "pray"; h.pray = 1; h.auraR = 100; h.lampB = 0.2; h.lampR = 20;
});

// D) frightened Sita + an awake rakshasi near her
groveShot("grove_fear.png", (h, B) => {
  h.x = B.sita.x - 140; h.y = B.sita.y + 180; h.auraR = 600; h.pray = 1; h.lampB = 0.6;
  B.sita_fear = 0.85;
  if (B.rak[0]) { B.rak[0].x = B.sita.x - 120; B.rak[0].y = B.sita.y + 90; B.rak[0].state = "awake"; B.rak[0].phase = 0.8; }
});

// E) reunion / dawn (hero grown, Sita recognizes)
groveShot("grove_dawn.png", (h, B, scene) => {
  h.x = B.sita.x - 70; h.y = B.sita.y + 60; h.scale = 0.64 * 2.2; h.state = "pray"; h.pray = 1;
  h.keepsakes = 3; h.hasChud = true;
  B.sita_rec = 1; B.sita_fear = 0;
  scene.__debug.setState("dawn");
  // nudge dawn progress by stepping a few frames in dawn state
  for (let i = 0; i < 60; i++) { DG.time += 1 / 60; scene.update(1 / 60); }
});

// E2) clean reunion close-up (no note) to inspect grown hero + recognized Sita
(function () {
  const c = createCanvas(720, 1280), ctx = c.getContext("2d");
  const scene = DG.Scenes.Grove(); scene.enter();
  const h = scene.__debug.hero(), B = scene.__debug.board();
  h.keepsakes = 3; h.hasChud = true;
  scene.__debug.setState("dawn");
  for (let i = 0; i < 90; i++) { DG.time += 1 / 60; scene.update(1 / 60); }
  B.sita_rec = 1; B.sita_fear = 0;
  h.x = B.sita.x - 70; h.y = B.sita.y + 60; h.scale = 0.64 * 2.2; h.state = "pray"; h.pray = 1;
  scene.render(ctx); save(c, "reunion_clean.png");
})();

// F) intro card
(function () {
  const c = createCanvas(720, 1280), ctx = c.getContext("2d");
  const scene = DG.Scenes.Grove(); scene.enter(); setTime(2.2);
  scene.update(1 / 60); scene.render(ctx); save(c, "intro.png");
})();

// G) end card
(function () {
  const c = createCanvas(720, 1280), ctx = c.getContext("2d");
  const scene = DG.Scenes.Grove(); scene.enter();
  scene.onDown({ x: 360, y: 700 }); scene.onUp({ x: 360, y: 700 });
  const h = scene.__debug.hero(); h.keepsakes = 3;
  scene.__debug.setState("end"); setTime(2.2);
  scene.render(ctx); save(c, "end.png");
})();

// ---- sprite contact sheet ----
(function () {
  const c = createCanvas(960, 1280), ctx = c.getContext("2d");
  ctx.fillStyle = "#0c0c24"; ctx.fillRect(0, 0, 960, 1280);
  setTime(1.7);
  const label = (s, x, y) => U.text(ctx, s, x, y, { size: 14, fill: "#cfe0ff" });
  function cell(x, y, name, fn) {
    ctx.save(); ctx.strokeStyle = "rgba(120,140,200,0.15)"; ctx.strokeRect(x - 60, y - 70, 120, 130);
    fn(x, y); ctx.restore(); label(name, x, y + 56);
  }
  // Bala antics
  const states = ["idle", "walk", "reach", "spin", "scratch", "peek", "hops", "firefly", "yawn", "splash", "pray", "bow"];
  let gx = 90, gy = 110;
  U.text(ctx, "Bala Hanumanthudu — antics", 480, 36, { size: 22, fill: "#ffe7b3" });
  states.forEach((st, i) => {
    const x = 90 + (i % 6) * 145, y = 110 + Math.floor(i / 6) * 150;
    cell(x, y, st, (cxp, cyp) => Art.bala(ctx, cxp, cyp + 36, 1.3, 1.7, { facing: 1, state: st, phase: 0.5, walkPhase: 0.25, lamp: st === "pray" ? 0.3 : 1, glow: 1.1 }));
  });
  // Rakshasi states
  U.text(ctx, "Rakshasi (sleeping guardian)", 480, 430, { size: 22, fill: "#ffe7b3" });
  ["sleep", "stir", "awake", "settle"].forEach((st, i) => {
    const x = 130 + i * 180, y = 510;
    cell(x, y, st, (cxp, cyp) => Art.rakshasi(ctx, cxp, cyp + 20, 1.2, 1.7, { state: st, phase: 0.5, facing: 1, seed: 12 }));
  });
  // Sitamma moods
  U.text(ctx, "Sitamma — sorrow → fear → recognition", 480, 640, { size: 22, fill: "#ffe7b3" });
  [["sorrow", { fear: 0.15 }], ["fear", { fear: 0.9 }], ["recognized", { fear: 0, recognized: 1 }]].forEach((m, i) => {
    const x = 170 + i * 230, y = 760;
    cell(x, y, m[0], (cxp, cyp) => Art.sitamma(ctx, cxp, cyp + 30, 1.2, 1.7, m[1]));
  });
  // tokens + scenery
  U.text(ctx, "Tokens & scenery", 480, 900, { size: 22, fill: "#ffe7b3" });
  const items = [
    ["ring", (x, y) => Art.keepsake(ctx, x, y, 1.7, "ring")],
    ["blossom", (x, y) => Art.keepsake(ctx, x, y, 1.7, "blossom")],
    ["leaf", (x, y) => Art.keepsake(ctx, x, y, 1.7, "leaf")],
    ["chudamani", (x, y) => Art.chudamani(ctx, x, y, 1.7, { scale: 1.6 })],
    ["lotus", (x, y) => Art.lotus(ctx, x, y, 14, 1.7, "#ff9fc0")],
    ["lamp", (x, y) => Art.gardenLamp(ctx, x, y, 1.7)],
    ["hedge", (x, y) => Art.hedge(ctx, x, y + 10, 26, 5)],
    ["rock", (x, y) => Art.rock(ctx, x, y + 6, 18, 4)],
    ["moon", (x, y) => Art.moon(ctx, x, y, 26, 1.7, 0.2)],
  ];
  items.forEach((it, i) => {
    const x = 90 + (i % 6) * 145, y = 990 + Math.floor(i / 6) * 150;
    cell(x, y, it[0], (cxp, cyp) => it[1](cxp, cyp));
  });
  // pond + bridge strip
  Art.pond(ctx, { x: 760, y: 1130, rx: 120, ry: 60, seed: 3 }, 1.7);
  Art.bridge(ctx, 660, 1130, 860, 1130);
  U.text(ctx, "pond + bridge", 760, 1200, { size: 14, fill: "#cfe0ff" });
  save(c, "sprites.png");
})();

console.log("done.");
