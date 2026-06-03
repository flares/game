/* =====================================================================
   A Light in the Ashoka Grove — grove.js
   The single-screen night search. Procedural maze (new every visit) on a
   45x80 grid (16px cells): ponds, bridges, lotuses, hedges. Bala
   Hanumanthudu (joystick) crosses bottom-left -> top-right to Sitamma,
   lit only by a small lamp (which WAKES sleeping rakshasis) and, when he
   pauses to say Rama-nama, a wider safe aura. Gather Rama's keepsakes +
   the chudamani, don't startle Sitamma, toss her the jewel, then grow.
   ===================================================================== */
(function () {
  "use strict";
  const DG = window.DG;
  const U = DG.util;
  const Art = DG.Art;
  const W = DG.W, H = DG.H;

  // ---- grid ----
  const CELL = 16, GW = 45, GH = 80;
  const cx = (gx) => gx * CELL + CELL / 2;
  const cy = (gy) => gy * CELL + CELL / 2;

  // ---- tunables ----
  const HERO_S = 0.64;
  const SITA_S = 0.72;
  const HERO_R = 11;
  const SPEED = 158;
  const LAMP_MOVE = 44, LAMP_PRAY = 20;
  const AURA_BASE = 68;
  const PRAY_AFTER = 2.2;
  const SITA_ZONE = 224;
  const WAKE_RATE = 0.85, WAKE_DECAY = 0.55, WAKE_STIR = 0.6, WAKE_FULL = 1.0;

  // ---- Rama namaas ----
  const RAMA_MAX = 10;           // 10 namaas max
  const RAMA_PASSIVE = 1 / 15;  // 1 namaa per 15 seconds passively
  const RAMA_PRAY   = 1.0;      // 1 per second while praying → fills 10 in 10 s
  const RAMA_COST   = 5;        // namaas lost per rakshasi fully awakened

  // ---- dawn ----
  const DAWN_TIME = 480;         // 8 minutes until dawn
  const DAWN_WARN = 90;          // warn at 90 s remaining

  // ---- maze corridor width ----
  const TRAIL_R = 0.88 * CELL;   // narrower corridors → clearer maze walls

  /* ================= board generation (fresh each visit) ================ */
  function genBoard(seed) {
    const rnd = Art.srand(seed);
    const rint = (a, b) => Math.floor(a + rnd() * (b - a + 1));
    const walk  = new Uint8Array(GW * GH).fill(1); // 1=wall initially
    const trail = new Uint8Array(GW * GH);          // corridors
    const safe  = new Uint8Array(GW * GH);          // safe-path cells (no rakshasis)
    const idx   = (gx, gy) => gy * GW + gx;

    const start = { x: cx(4), y: cy(74) };
    const sita  = { x: cx(38), y: cy(11) };

    // token positions
    const pick = (xMin, xMax, yMin, yMax) => ({
      x: U.clamp(U.rand(xMin, xMax), 56, W - 56),
      y: U.clamp(U.rand(yMin, yMax), 120, H - 90),
    });
    const keepsakes = [
      Object.assign(pick(120, W - 90, H * 0.60, H * 0.78), { kind: "ring",    got: false }),
      Object.assign(pick(80,  W - 90, H * 0.38, H * 0.56), { kind: "blossom", got: false }),
      Object.assign(pick(120, W - 90, H * 0.18, H * 0.34), { kind: "leaf",    got: false }),
    ];
    const chud = Object.assign(pick(W * 0.42, W - 90, 150, H * 0.30), { got: false });

    // --- corridor carving ---
    const trailPts = [], safePts = [];

    // stamp a corridor into walk[] and optionally safe[]
    function stampCorridor(pts, isSafe) {
      for (let i = 0; i < pts.length - 1; i++) {
        const p0 = pts[i], p1 = pts[i + 1];
        const L = U.dist(p0.x, p0.y, p1.x, p1.y);
        const steps = Math.max(2, Math.floor(L / 7));
        for (let k = 0; k <= steps; k++) {
          const p = { x: U.lerp(p0.x, p1.x, k / steps), y: U.lerp(p0.y, p1.y, k / steps) };
          (isSafe ? safePts : trailPts).push(p);
        }
      }
    }

    // build waypoint list for one carve call
    function wpts(a, b, jX, jY, nWp) {
      nWp = nWp || 3;
      const pts = [a];
      for (let i = 1; i < nWp; i++) {
        const tt = i / nWp;
        pts.push({
          x: U.clamp(U.lerp(a.x, b.x, tt) + (rnd() - 0.5) * jX, 50, W - 50),
          y: U.clamp(U.lerp(a.y, b.y, tt) + (rnd() - 0.5) * jY, 84, H - 64),
        });
      }
      pts.push(b); return pts;
    }

    // SAFE route: direct-ish, low jitter, no rakshasis placed on it
    stampCorridor(wpts(start, sita, 90, 70, 4), true);

    // exploration routes (keepsake chain)
    let prev = start;
    for (const tk of [keepsakes[0], keepsakes[1], keepsakes[2], chud]) {
      stampCorridor(wpts(prev, tk, 130, 100, 2), false); prev = tk;
    }
    stampCorridor(wpts(chud, sita, 160, 100, 2), false);
    // extra branch routes with guards
    stampCorridor(wpts(start, sita, 300, 200, 5), false);
    stampCorridor(wpts({ x: W * 0.25, y: H * 0.55 }, { x: W * 0.75, y: H * 0.35 }, 120, 80, 3), false);

    // stamp all corridors with narrowed radius
    function bakePoints(pts, markSafe) {
      for (const p of pts) {
        const g0x = Math.max(0, Math.floor((p.x - TRAIL_R) / CELL));
        const g1x = Math.min(GW - 1, Math.floor((p.x + TRAIL_R) / CELL));
        const g0y = Math.max(0, Math.floor((p.y - TRAIL_R) / CELL));
        const g1y = Math.min(GH - 1, Math.floor((p.y + TRAIL_R) / CELL));
        for (let gy = g0y; gy <= g1y; gy++) {
          for (let gx = g0x; gx <= g1x; gx++) {
            if (U.dist(cx(gx), cy(gy), p.x, p.y) <= TRAIL_R) {
              trail[idx(gx, gy)] = 1;
              if (markSafe) safe[idx(gx, gy)] = 1;
            }
          }
        }
      }
    }
    bakePoints(safePts,  true);
    bakePoints(trailPts, false);
    const allTrailPts = safePts.concat(trailPts);

    // convert to walk grid
    for (let i = 0; i < GW * GH; i++) walk[i] = trail[i] ? 1 : 0;

    const far = (x, y, r) =>
      U.dist(x, y, start.x, start.y) > r && U.dist(x, y, sita.x, sita.y) > r;

    // --- ponds ---
    const ponds = [], bridges = [];
    let tries = 0;
    const nP = rint(5, 8);
    while (ponds.length < nP && tries < 140) {
      tries++;
      const px = U.rand(100, W - 100), py = U.rand(170, H - 150);
      const rx = U.rand(3.8, 7.0) * CELL, ry = U.rand(2.6, 4.8) * CELL;
      if (!far(px, py, 140)) continue;
      if (ponds.some((q) => U.dist(px, py, q.x, q.y) < (rx + q.rx) * 0.78)) continue;
      const pond = { x: px, y: py, rx, ry, seed: rint(1, 9999) };
      ponds.push(pond);
      const g0x = Math.max(0, Math.floor((px - rx) / CELL)), g1x = Math.min(GW - 1, Math.floor((px + rx) / CELL));
      const g0y = Math.max(0, Math.floor((py - ry) / CELL)), g1y = Math.min(GH - 1, Math.floor((py + ry) / CELL));
      for (let gy = g0y; gy <= g1y; gy++) {
        for (let gx = g0x; gx <= g1x; gx++) {
          const ddx = (cx(gx) - px) / rx, ddy = (cy(gy) - py) / ry;
          if (ddx * ddx + ddy * ddy <= 1 && !trail[idx(gx, gy)]) walk[idx(gx, gy)] = 0;
        }
      }
      const inside = allTrailPts.filter((p) => { const ddx = (p.x - px) / rx, ddy = (p.y - py) / ry; return ddx * ddx + ddy * ddy <= 1.04; });
      if (inside.length > 1) {
        const a2 = inside[0], b2 = inside[inside.length - 1], ang = Math.atan2(b2.y - a2.y, b2.x - a2.x);
        bridges.push({ x0: a2.x - Math.cos(ang) * 12, y0: a2.y - Math.sin(ang) * 12, x1: b2.x + Math.cos(ang) * 12, y1: b2.y + Math.sin(ang) * 12 });
      }
    }

    const onWater = (x, y) => ponds.some((p) => { const ddx = (x - p.x) / p.rx, ddy = (y - p.y) / p.ry; return ddx * ddx + ddy * ddy <= 1.1; });

    // --- hedges & rocks (a few decorative) ---
    const hedges = [], rocks = [];
    const blockBlob = (x, y, rCells) => {
      const r = rCells * CELL;
      const g0x = Math.max(0, Math.floor((x - r) / CELL)), g1x = Math.min(GW - 1, Math.floor((x + r) / CELL));
      const g0y = Math.max(0, Math.floor((y - r) / CELL)), g1y = Math.min(GH - 1, Math.floor((y + r) / CELL));
      for (let gy = g0y; gy <= g1y; gy++) for (let gx = g0x; gx <= g1x; gx++)
        if (U.dist(cx(gx), cy(gy), x, y) <= r && !trail[idx(gx, gy)]) walk[idx(gx, gy)] = 0;
    };
    for (let i = 0; i < rint(5, 8); i++) {
      const x = U.rand(70, W - 70), y = U.rand(150, H - 140);
      if (!far(x, y, 110) || onWater(x, y)) continue;
      const s = U.rand(14, 24); hedges.push({ x, y, s, seed: rint(1, 9999) }); blockBlob(x, y, s / CELL * 0.7);
    }
    for (let i = 0; i < rint(4, 7); i++) {
      const x = U.rand(70, W - 70), y = U.rand(150, H - 140);
      if (!far(x, y, 100) || onWater(x, y)) continue;
      const s = U.rand(10, 18); rocks.push({ x, y, s, seed: rint(1, 9999) }); blockBlob(x, y, s / CELL * 0.55);
    }

    // --- BFS from start ---
    const dist2 = new Int32Array(GW * GH).fill(-1);
    const q2 = [idx(Math.floor(start.x / CELL), Math.floor(start.y / CELL))]; dist2[q2[0]] = 0;
    let head2 = 0;
    while (head2 < q2.length) {
      const c = q2[head2++], gx = c % GW, gy = (c / GW) | 0;
      for (const d of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = gx + d[0], ny = gy + d[1];
        if (nx < 0 || ny < 0 || nx >= GW || ny >= GH) continue;
        const ni = idx(nx, ny);
        if (walk[ni] && dist2[ni] < 0) { dist2[ni] = dist2[c] + 1; q2.push(ni); }
      }
    }
    const walkAt    = (x, y) => { const gx = Math.floor(x / CELL), gy = Math.floor(y / CELL); if (gx < 1 || gy < 1 || gx >= GW - 1 || gy >= GH - 1) return false; return walk[idx(gx, gy)] === 1; };
    const reachable = (x, y) => { const gx = Math.floor(x / CELL), gy = Math.floor(y / CELL); return gx >= 0 && gy >= 0 && gx < GW && gy < GH && dist2[idx(gx, gy)] >= 0; };
    const onSafe    = (x, y) => { const gx = Math.floor(x / CELL), gy = Math.floor(y / CELL); return gx >= 0 && gy >= 0 && gx < GW && gy < GH && safe[idx(gx, gy)] === 1; };
    const spot = (xMin, xMax, yMin, yMax, awayFrom, minAway) => {
      for (let i = 0; i < 240; i++) {
        const x = U.rand(xMin, xMax), y = U.rand(yMin, yMax);
        if (!walkAt(x, y) || !reachable(x, y) || onWater(x, y)) continue;
        if (awayFrom && awayFrom.some((a3) => U.dist(x, y, a3.x, a3.y) < minAway)) continue;
        return { x, y };
      }
      return { x: U.clamp((xMin + xMax) / 2, 40, W - 40), y: U.clamp((yMin + yMax) / 2, 40, H - 40) };
    };

    // --- rakshasis: never on safe path ---
    const rak = [];
    const nR = rint(8, 12);
    tries = 0;
    while (rak.length < nR && tries < 400) {
      tries++;
      const x = U.rand(64, W - 64), y = U.rand(140, H - 120);
      if (!walkAt(x, y) || !reachable(x, y) || onWater(x, y)) continue;
      if (U.dist(x, y, start.x, start.y) < 130 || U.dist(x, y, sita.x, sita.y) < 110) continue;
      if (onSafe(x, y)) continue; // no rakshasis on safe path
      if (rak.some((r) => U.dist(x, y, r.x, r.y) < 80)) continue;
      let nearTrail = Infinity;
      for (let s2 = 0; s2 < trailPts.length; s2 += 3)
        nearTrail = Math.min(nearTrail, U.dist(x, y, trailPts[s2].x, trailPts[s2].y));
      if (nearTrail > 72 && rnd() > 0.5) continue;
      rak.push({ x, y, wake: 0, state: "sleep", phase: 0, facing: rnd() > 0.5 ? 1 : -1, seed: rint(1, 9999), awakeT: 0 });
    }
    if (!rak.some((r) => U.dist(r.x, r.y, chud.x, chud.y) < 110)) {
      const gp = spot(chud.x - 80, chud.x + 80, chud.y - 70, chud.y + 90, [chud], 38);
      if (gp && !onSafe(gp.x, gp.y))
        rak.push({ x: gp.x, y: gp.y, wake: 0, state: "sleep", phase: 0, facing: -1, seed: rint(1, 9999), awakeT: 0 });
    }

    // --- gate rakshasis at narrow corridor chokepoints ---
    const gates = [];
    const nGates = rint(3, 5);
    tries = 0;
    while (gates.length < nGates && tries < 200) {
      tries++;
      // pick a point along exploration (non-safe) trail
      const tp = trailPts[(Math.floor(rnd() * trailPts.length))];
      if (!tp) continue;
      const x = tp.x + (rnd() - 0.5) * 24, y = tp.y + (rnd() - 0.5) * 24;
      if (!walkAt(x, y) || onSafe(x, y)) continue;
      if (U.dist(x, y, start.x, start.y) < 120 || U.dist(x, y, sita.x, sita.y) < 100) continue;
      if (gates.some((g) => U.dist(x, y, g.x, g.y) < 140)) continue;
      gates.push({ x, y, seed: rint(1, 9999) });
      // place a rakshasi at the gate
      rak.push({ x: x + (rnd() - 0.5) * 20, y: y + (rnd() - 0.5) * 20,
        wake: 0, state: "sleep", phase: 0, facing: rnd() > 0.5 ? 1 : -1,
        seed: rint(1, 9999), awakeT: 0, isGate: true });
    }

    // --- dense TREE placement on wall cells ---
    const bigTrees = [], smallTrees = [];
    const TREE_STEP = 3; // sample every 3 cells
    for (let gy = 0; gy < GH; gy += TREE_STEP) {
      for (let gx = 0; gx < GW; gx += TREE_STEP) {
        if (walk[idx(gx, gy)]) continue; // skip corridors
        const wx = cx(gx) + (rnd() - 0.5) * CELL * 0.9;
        const wy = cy(gy) + (rnd() - 0.5) * CELL * 0.9;
        if (onWater(wx, wy)) continue;
        // check proximity to a corridor cell
        let nearCorridor = false;
        for (let dy2 = -1; dy2 <= 1 && !nearCorridor; dy2++) {
          for (let dx2 = -1; dx2 <= 1 && !nearCorridor; dx2++) {
            const nx = gx + dx2, ny = gy + dy2;
            if (nx >= 0 && ny >= 0 && nx < GW && ny < GH && walk[idx(nx, ny)]) nearCorridor = true;
          }
        }
        const tseed = rint(1, 9999);
        if (nearCorridor) {
          smallTrees.push({ x: wx, y: wy, s: U.rand(14, 26), seed: tseed });
        } else if (rnd() < 0.65) {
          bigTrees.push({ x: wx, y: wy, s: U.rand(28, 52), seed: tseed });
        }
      }
    }

    // --- water dressing ---
    const lotuses = [], pads = [], reeds = [], steps = [];
    for (const p of ponds) {
      for (let i = 0; i < rint(1, 3); i++) { const a = rnd() * U.TAU, rr = rnd() * 0.66; lotuses.push({ x: p.x + Math.cos(a) * p.rx * rr, y: p.y + Math.sin(a) * p.ry * rr, s: U.rand(7, 12), color: U.choose(["#ff9fc0", "#ffd0e0", "#ffb3d0"]) }); }
      for (let i = 0; i < rint(1, 3); i++) { const a = rnd() * U.TAU, rr = 0.4 + rnd() * 0.5; pads.push({ x: p.x + Math.cos(a) * p.rx * rr, y: p.y + Math.sin(a) * p.ry * rr, s: U.rand(9, 16) }); }
      const ra = rnd() * U.TAU;
      for (let i = 0; i < rint(3, 6); i++) { const a = ra + (rnd() - 0.5) * 0.8; reeds.push({ x: p.x + Math.cos(a) * p.rx * 0.96, y: p.y + Math.sin(a) * p.ry * 0.96, h: U.rand(14, 26), seed: rint(1, 9999) }); }
      if (rnd() < 0.6) for (let i = 0; i < rint(2, 4); i++) { const tt = i / 4; steps.push({ x: p.x + (tt - 0.5) * p.rx * 1.2, y: p.y + (rnd() - 0.5) * p.ry * 0.6, s: U.rand(5, 8) }); }
    }
    const lamps = [];
    for (let i = 0; i < 9; i++) { const sp = spot(56, W - 56, 200, H - 200); lamps.push({ x: sp.x, y: sp.y - 40 }); }

    return { walk, walkAt, reachable, onSafe, start, sita, ponds, bridges, hedges, rocks,
             keepsakes, chud, rak, gates, lotuses, pads, reeds, steps, lamps,
             bigTrees, smallTrees, allTrailPts };
  }

  /* ============================ the scene ============================ */
  DG.Scenes.Grove = function () {
    let B;                  // board
    let hero;               // {x,y,facing,...}
    let state = "intro";    // intro|explore|approach|tossing|reunion|dawn|end
    let stateT = 0;
    const ps = DG.Particles();       // ambient + bursts (fireflies, petals)
    const flies = [];                // firefly light points
    const clouds = [];               // moving sky clouds
    let veilC = null, veilX = null;  // offscreen fog-of-war
    let moonVeil = 0.35;
    let veilBase = 0.82;             // darkness over the grove (lifts at dawn)
    let note = null, noteT = 0;      // contextual toast
    let toss = null;                 // chudamani projectile during tossing
    let dawnK = 0;                   // 0..1 dawn progress
    let dawnTimer = DAWN_TIME;       // seconds until dawn
    let dawnWarnShown = false;
    const TIPS = [
      'When lost, pause and pray — say "Ram" — to see further.',
      "Your lamp wakes rakshasis. Move gently through the grove.",
      "The wider aura of Rama-nama is safe — it wakes no one.",
      "Gather Rama's keepsakes to strengthen the aura.",
      "Find the chudamani, then carry it to Sitamma.",
      "Do not startle Sitamma — toss her the jewel first.",
      "Praying for 10 seconds fills your Rama-nama bar fully.",
      "Gates guard some paths — a safe path leads to Sitamma.",
    ];
    let tipI = 0, tipT = 0; const TIP_PERIOD = 7.5;

    const keyVec = { x: 0, y: 0 };
    const keys = {};
    function onKeyDown(e) {
      const k = e.key.toLowerCase();
      if (["arrowup", "w"].includes(k)) keys.up = 1;
      else if (["arrowdown", "s"].includes(k)) keys.down = 1;
      else if (["arrowleft", "a"].includes(k)) keys.left = 1;
      else if (["arrowright", "d"].includes(k)) keys.right = 1;
      else return;
      e.preventDefault();
    }
    function onKeyUp(e) {
      const k = e.key.toLowerCase();
      if (["arrowup", "w"].includes(k)) keys.up = 0;
      else if (["arrowdown", "s"].includes(k)) keys.down = 0;
      else if (["arrowleft", "a"].includes(k)) keys.left = 0;
      else if (["arrowright", "d"].includes(k)) keys.right = 0;
    }

    function showNote(text, secs) { note = text; noteT = secs || 3.4; }

    function newBoard() {
      B = genBoard((Date.now() ^ (Math.random() * 1e9)) | 0);
      hero = {
        x: B.start.x, y: B.start.y, facing: 1,
        vx: 0, vy: 0, moving: false, still: 0, walkPhase: 0,
        state: "idle", anticT: 0, anticGap: U.rand(0.7, 1.4), anticDur: 0,
        lampR: LAMP_MOVE, lampB: 1, auraR: 0, pray: 0,
        keepsakes: 0, hasChud: false, scale: HERO_S, anticPhase: 0,
        ramaBar: 3, // start with 3 namaas
      };
      flies.length = 0;
      for (let i = 0; i < 22; i++)
        flies.push({ x: U.rand(0, W), y: U.rand(120, H - 40), p: U.rand(0, 6.28), sp: U.rand(0.4, 1.0), r: U.rand(8, 26) });
      // moving clouds
      clouds.length = 0;
      for (let i = 0; i < 7; i++)
        clouds.push({
          x: U.rand(-120, W + 120), y: U.rand(40, H * 0.38),
          s: U.rand(44, 80), speed: U.rand(7, 18),
          alpha: U.rand(0.28, 0.60),
        });
      dawnK = 0; dawnTimer = DAWN_TIME; dawnWarnShown = false;
      veilBase = 0.82; moonVeil = 0.35; toss = null;
    }

    function setSitaMood() { /* computed live in update from rakshasi commotion */ }

    // -- antic scheduler --
    const ANTICS = ["reach", "reach", "spin", "scratch", "peek", "hops", "firefly", "yawn"];
    function pickAntic() {
      // contextual flavours
      const nearPond = B.ponds.some((p) => U.dist(hero.x, hero.y, p.x, p.y) < p.rx + 26);
      const nearSita = U.dist(hero.x, hero.y, B.sita.x, B.sita.y) < 260;
      if (nearSita && U.chance(0.6)) return "pray";
      if (nearPond && U.chance(0.5)) return "splash";
      return U.choose(ANTICS);
    }

    // ---------------- update ----------------
    function update(dt) {
      stateT += dt;
      ps.update(dt);
      if (noteT > 0) { noteT -= dt; if (noteT <= 0) note = null; }
      tipT += dt; if (tipT > TIP_PERIOD) { tipT = 0; tipI = (tipI + 1) % TIPS.length; }
      // fireflies drift
      for (const f of flies) { f.p += f.sp * dt; f.x += Math.cos(f.p) * 8 * dt; f.y += Math.sin(f.p * 0.7) * 6 * dt; }
      // clouds drift
      for (const c of clouds) { c.x += c.speed * dt; if (c.x > W + 160) c.x = -160; }

      if (state === "intro" || state === "end") return;

      // ---- dawn countdown ----
      if (state === "explore" || state === "approach") {
        dawnTimer -= dt;
        if (!dawnWarnShown && dawnTimer < DAWN_WARN) {
          dawnWarnShown = true;
          showNote("Dawn is near — reach Sitamma before the light breaks!", 4.0);
        }
        if (dawnTimer <= 0) {
          dawnTimer = 0;
          // Dawn breaks — transition (soft, still playable)
          state = "dawn"; stateT = 0; DG.Audio.dawn && DG.Audio.dawn();
        }
      }

      // ---- Rama namaas — passive accumulation ----
      if (state === "explore" || state === "approach") {
        hero.ramaBar = U.clamp(hero.ramaBar + RAMA_PASSIVE * dt, 0, RAMA_MAX);
      }

      // ----- input vector -----
      let ix = 0, iy = 0;
      const jv = DG.UI.Joystick.vector();
      ix += jv.x; iy += jv.y;
      ix += (keys.right ? 1 : 0) - (keys.left ? 1 : 0);
      iy += (keys.down ? 1 : 0) - (keys.up ? 1 : 0);
      let mag = Math.hypot(ix, iy);
      const driving = (state === "explore" || state === "approach");
      if (driving && mag > 0.08) {
        if (mag > 1) { ix /= mag; iy /= mag; mag = 1; }
        hero.moving = true; hero.still = 0; hero.pray = U.approach(hero.pray, 0, dt * 4);
        const sp = SPEED * mag;
        // move with slide collision
        const nx = hero.x + ix * sp * dt;
        if (canStand(nx, hero.y)) hero.x = nx;
        const ny = hero.y + iy * sp * dt;
        if (canStand(hero.x, ny)) hero.y = ny;
        hero.x = U.clamp(hero.x, CELL * 1.5, W - CELL * 1.5);
        hero.y = U.clamp(hero.y, CELL * 1.5, H - CELL * 1.5);
        if (Math.abs(ix) > 0.05) hero.facing = ix > 0 ? 1 : -1;
        hero.walkPhase = (hero.walkPhase + sp * dt / 26) % 1;
        hero.state = "walk";
      } else {
        hero.moving = false;
        hero.still += dt;
        // antic / prayer scheduling
        if (hero.still >= PRAY_AFTER || state === "reunion" || state === "dawn") {
          hero.state = "pray"; hero.pray = U.approach(hero.pray, 1, dt * 1.4);
        } else {
          hero.pray = U.approach(hero.pray, 0, dt * 3);
          if (hero.state === "walk" || hero.state === "idle") { hero.state = "idle"; hero.anticT = 0; hero.anticGap = U.rand(0.7, 1.5); }
          if (hero.state === "idle") {
            hero.anticT += dt;
            if (hero.anticT >= hero.anticGap) { hero.state = pickAntic(); hero.anticPhase = 0; hero.anticDur = U.rand(1.1, 1.6); hero.anticT = 0; }
          } else if (hero.state !== "pray") {
            hero.anticPhase += dt / hero.anticDur;
            if (hero.anticPhase >= 1) { hero.state = "idle"; hero.anticT = 0; hero.anticGap = U.rand(0.8, 1.6); }
          }
        }
      }

      // ----- lighting -----
      const praying = hero.pray > 0.5;
      hero.lampR = U.approach(hero.lampR, hero.moving ? LAMP_MOVE : (praying ? LAMP_PRAY : LAMP_MOVE * 0.92), dt * 240);
      hero.lampB = U.approach(hero.lampB, praying ? 0.18 : 1, dt * 3);

      // Rama namaas: praying fills bar fast (fills 10 in 10 s)
      if (praying && (state === "explore" || state === "approach")) {
        hero.ramaBar = U.clamp(hero.ramaBar + RAMA_PRAY * dt, 0, RAMA_MAX);
      }

      // Aura scaled by ramaBar (bigger bar → bigger reveal)
      const ramaFrac = hero.ramaBar / RAMA_MAX;
      const auraTarget = hero.pray * (AURA_BASE * (0.5 + 0.6 * ramaFrac) + hero.keepsakes * 8);
      hero.auraR = U.approach(hero.auraR, auraTarget, dt * 360);

      // ----- rakshasis: lamp wakes; aura does not -----
      let commotion = 0;
      const lampLit = hero.lampB > 0.5;
      for (const r of B.rak) {
        const d = U.dist(hero.x, hero.y, r.x, r.y);
        const inLamp = lampLit && d < hero.lampR * 0.92;
        if (inLamp) {
          const closeness = 1 - d / (hero.lampR * 0.92);
          r.wake += dt * WAKE_RATE * (0.4 + closeness) * hero.lampB;
        } else {
          r.wake -= dt * WAKE_DECAY;
        }
        r.wake = U.clamp(r.wake, 0, 1.3);
        // state machine
        const prev = r.state;
        if (r.state === "sleep") { if (r.wake > WAKE_STIR) { r.state = "stir"; r.phase = 0; DG.Audio.nudge && DG.Audio.nudge(); } }
        else if (r.state === "stir") { r.phase = U.clamp(r.phase + dt * 1.6, 0, 1); if (r.wake > WAKE_FULL) { r.state = "awake"; r.phase = 0; r.awakeT = 0; } else if (r.wake < 0.25) { r.state = "settle"; r.phase = 0; } }
        else if (r.state === "awake") { r.phase = U.clamp(r.phase + dt * 1.4, 0, 1); r.awakeT += dt; if (r.wake < 0.3) { r.state = "settle"; r.phase = 0; } }
        else if (r.state === "settle") { r.phase = U.clamp(r.phase + dt * 0.8, 0, 1); if (r.phase >= 1) { r.state = "sleep"; r.wake = 0; } }
        if (r.state === "stir" || r.state === "awake") {
          const prox = U.clamp(1 - U.dist(r.x, r.y, B.sita.x, B.sita.y) / 700, 0.15, 1);
          commotion += (r.state === "awake" ? 1 : 0.5) * prox;
        }
        if (prev === "sleep" && r.state === "stir") showNoteOnce("shh");
        // cost: fully waking costs Rāma energy
        if (prev === "stir" && r.state === "awake") {
          hero.ramaBar = Math.max(0, hero.ramaBar - RAMA_COST);
          showNoteOnce("rakCost");
        }
      }

      // ----- Sitamma's fear from commotion -----
      const fearTarget = U.clamp(commotion * 0.5, 0, 1);
      B.sita_fear = U.approach(B.sita_fear == null ? 0 : B.sita_fear, fearTarget, dt * (fearTarget > (B.sita_fear || 0) ? 1.2 : 0.4));
      if ((B.sita_fear || 0) > 0.5 && state === "explore" && commotion > 0.6) showNoteOnce("startle");

      // ----- pickups -----
      if (driving) {
        for (const k of B.keepsakes) if (!k.got && U.dist(hero.x, hero.y, k.x, k.y) < 28) {
          k.got = true; hero.keepsakes++; DG.Audio.chime && DG.Audio.chime();
          ps.burst({ x: k.x, y: k.y, type: "spark", color: "#ffe6a0", speedMin: 40, speedMax: 130, life: 0.8, size: 4 }, 14);
          showNote("Rama's keepsake — his aura grows.", 2.6);
        }
        if (!B.chud.got && U.dist(hero.x, hero.y, B.chud.x, B.chud.y) < 30) {
          B.chud.got = true; hero.hasChud = true; DG.Audio.bloom && DG.Audio.bloom();
          ps.burst({ x: B.chud.x, y: B.chud.y, type: "spark", color: "#bfe6ff", speedMin: 50, speedMax: 160, life: 1.0, size: 5 }, 22);
          showNote("The chūḍāmaṇi! Carry it to Sitamma.", 3.0);
        }
      }

      // ----- approach / toss prompt -----
      const dS = U.dist(hero.x, hero.y, B.sita.x, B.sita.y);
      if (state === "explore" && dS < SITA_ZONE) {
        state = "approach"; stateT = 0;
        if (!hero.hasChud) showNote("Find Rama's chūḍāmaṇi before you greet her.", 3.2);
        else if ((B.sita_fear || 0) > 0.5) showNote("She is frightened — calm the grove, do not startle her.", 3.2);
        else showNote("Toss the chūḍāmaṇi first, so she is not afraid.", 3.4);
      }
      if (state === "approach") {
        if (dS > SITA_ZONE + 30) { state = "explore"; stateT = 0; }
        DG.UI.tossBtn.visible = hero.hasChud && (B.sita_fear || 0) < 0.55;
      } else {
        DG.UI.tossBtn.visible = false;
      }

      // ----- toss in flight -----
      if (state === "tossing" && toss) {
        toss.t += dt / toss.dur;
        const k = U.clamp(toss.t, 0, 1);
        toss.x = U.lerp(toss.x0, toss.x1, k);
        toss.y = U.lerp(toss.y0, toss.y1, k) - Math.sin(k * Math.PI) * 120; // arc
        if (k >= 1) { state = "reunion"; stateT = 0; DG.Audio.swell && DG.Audio.swell(); ps.burst({ x: B.sita.x, y: B.sita.y - 30, type: "petal", color: "#ffd0e6", speedMin: 30, speedMax: 120, life: 1.6, size: 8, g: 30 }, 26); }
      }

      // ----- reunion -> walk to her, then grow & dawn -----
      if (state === "reunion") {
        B.sita_rec = U.approach(B.sita_rec == null ? 0 : B.sita_rec, 1, dt * 0.7);
        B.sita_fear = U.approach(B.sita_fear || 0, 0, dt * 1.5);
        // glide hero to a spot just below-left of Sita
        const tx = B.sita.x - 70, ty = B.sita.y + 60;
        hero.x = U.approach(hero.x, tx, dt * 90); hero.y = U.approach(hero.y, ty, dt * 90);
        hero.facing = 1; hero.state = "pray"; hero.pray = 1;
        if (stateT > 2.4) { state = "dawn"; stateT = 0; DG.Audio.dawn && DG.Audio.dawn(); }
      }
      if (state === "dawn") {
        dawnK = U.clamp(dawnK + dt * 0.5, 0, 1);
        veilBase = U.lerp(0.82, 0.12, dawnK);
        moonVeil = U.lerp(0.35, 0.05, dawnK);
        hero.scale = U.approach(hero.scale, HERO_S * 2.3, dt * 1.2);
        if (dawnK > 0.2 && U.chance(dt * 6)) ps.burst({ x: U.rand(0, W), y: U.rand(0, H * 0.7), type: "petal", color: U.choose(["#ffd0e6", "#ffe6a0", "#ffc0a3"]), speedMin: 10, speedMax: 60, life: 3, size: 7, g: 14 }, 1);
        if (stateT > 3.2) { state = "end"; stateT = 0; DG.Store.finishVisit(hero.keepsakes); }
      }
    }

    let lastShh = -1;
    let lastRakCost = -99;
    function showNoteOnce(kind) {
      if (kind === "shh") { if (DG.time - lastShh > 4) { lastShh = DG.time; showNote("Shh… your lamp is stirring a rakshasi. Pause and pray.", 2.8); } }
      else if (kind === "startle") { showNote("Careful — do not startle Sitamma, or she will fear Ravana's illusion.", 3.4); }
      else if (kind === "rakCost") {
        if (DG.time - lastRakCost > 3) {
          lastRakCost = DG.time;
          const left = hero.ramaBar.toFixed(0);
          showNote(`A rakshasi woke! 5 Rāma namaas lost. (${left} remain)`, 2.6);
        }
      }
    }

    function canStand(x, y) {
      // sample hero footprint
      return B.walkAt(x, y) && B.walkAt(x - HERO_R, y) && B.walkAt(x + HERO_R, y) && B.walkAt(x, y + HERO_R * 0.6) && B.walkAt(x, y - HERO_R);
    }

    // ---------------- render ----------------
    function ensureVeil() {
      if (veilC) return;
      veilC = document.createElement("canvas"); veilC.width = W; veilC.height = H;
      veilX = veilC.getContext("2d");
    }

    // Y-based depth scale for 3-D perspective feel
    function depthScale(y) { return U.lerp(0.72, 1.0, U.clamp(y / H, 0, 1)); }

    function render(ctx) {
      // sky — groundWash is now transparent at top, so sky/stars/spires are visible
      Art.sky(ctx, [[0, U.mix("#060618", "#2a1a3a", dawnK)], [0.28, U.mix("#0a0a2c", "#4a2a68", dawnK)], [0.55, U.mix("#0e0e38", "#6a4a6e", dawnK)], [0.80, U.mix("#181640", "#e0a06a", dawnK)], [1, U.mix("#100e2e", "#ffd089", dawnK)]]);
      Art.groundWash(ctx);
      Art.stars(ctx, DG.time, 90, H * 0.28);
      Art.lankaSpires(ctx, H * 0.27, DG.time);
      Art.perspectiveGround(ctx);
      Art.groundPath(ctx, B.allTrailPts, TRAIL_R * 1.4); // warm earthy corridors

      // ground props (painter's order = top-to-bottom for depth)
      for (const p of B.ponds) Art.pond(ctx, p, DG.time, B._moonX, B._moonY);
      for (const st of B.steps) Art.stepStone(ctx, st.x, st.y, st.s);
      for (const br of B.bridges) Art.bridge(ctx, br.x0, br.y0, br.x1, br.y1);
      for (const pd of B.pads) Art.lilypad(ctx, pd.x, pd.y, pd.s, DG.time);
      for (const lo of B.lotuses) Art.lotus(ctx, lo.x, lo.y, lo.s, DG.time, lo.color);
      for (const rd of B.reeds) Art.reed(ctx, rd.x, rd.y, rd.h, DG.time, rd.seed);
      for (const h of B.hedges) Art.hedge(ctx, h.x, h.y, h.s, h.seed);
      for (const r of B.rocks) Art.rock(ctx, r.x, r.y, r.s, r.seed);
      // big forest trees (wall filler, depth-sorted)
      for (const t of B.bigTrees.slice().sort((a, b) => a.y - b.y))
        Art.bigTree(ctx, t.x, t.y, t.s * depthScale(t.y), DG.time, t.seed);
      // small trees (corridor edges)
      for (const t of B.smallTrees.slice().sort((a, b) => a.y - b.y))
        Art.smallTree(ctx, t.x, t.y, t.s * depthScale(t.y), DG.time, t.seed);
      // gates at chokepoints
      for (const g of B.gates) Art.gate(ctx, g.x, g.y, false);
      for (const la of B.lamps) Art.gardenLamp(ctx, la.x, la.y, DG.time);

      // keepsakes / chudamani
      for (const k of B.keepsakes) if (!k.got) Art.keepsake(ctx, k.x, k.y, DG.time, k.kind);
      if (!B.chud.got) Art.chudamani(ctx, B.chud.x, B.chud.y, DG.time);

      // depth-sort rakshasis and hero together
      const entities = B.rak.map(r => ({ y: r.y, draw: () => Art.rakshasi(ctx, r.x, r.y, 0.72 * depthScale(r.y), DG.time, r) }));
      entities.push({ y: hero.y, draw: () => {
        Art.bala(ctx, hero.x, hero.y, hero.scale * depthScale(hero.y), DG.time, {
          facing: hero.facing, state: hero.state, phase: hero.anticPhase, walkPhase: hero.walkPhase,
          lamp: hero.lampB, glow: 1 + hero.keepsakes * 0.12 + (B.sita_rec || 0),
        });
      }});
      entities.sort((a, b) => a.y - b.y);
      for (const e of entities) e.draw();

      // simsupa tree, slab, Sitamma (always at top-right, drawn after everything)
      Art.simsupa(ctx, B.sita.x + 28, B.sita.y - 8, 120, DG.time);
      Art.slab(ctx, B.sita.x, B.sita.y + 40, 88, 30);
      Art.sitamma(ctx, B.sita.x, B.sita.y + 18, SITA_S, DG.time, { fear: B.sita_fear || 0, recognized: B.sita_rec || 0 });

      // chudamani in flight
      if (state === "tossing" && toss) Art.chudamani(ctx, toss.x, toss.y, DG.time, { float: false });

      // ---- fog-of-war veil ----
      ensureVeil();
      veilX.setTransform(1, 0, 0, 1, 0, 0);
      veilX.clearRect(0, 0, W, H);
      veilX.fillStyle = U.rgba("#070818", veilBase);
      veilX.fillRect(0, 0, W, H);
      veilX.globalCompositeOperation = "destination-out";
      punch(veilX, hero.x, hero.y - 16, hero.lampR, 0.96 * hero.lampB + 0.2);
      if (hero.auraR > 4) punch(veilX, hero.x, hero.y - 16, hero.auraR, 0.55);
      punch(veilX, B.sita.x, B.sita.y - 6, 96, 0.4 + (B.sita_rec || 0) * 0.5);
      for (const k of B.keepsakes) if (!k.got) punch(veilX, k.x, k.y, 16, 0.12);
      if (!B.chud.got) punch(veilX, B.chud.x, B.chud.y, 20, 0.16);
      for (const la of B.lamps) punch(veilX, la.x, la.y + 32, 40, 0.30);
      veilX.globalCompositeOperation = "source-over";
      ctx.drawImage(veilC, 0, 0);

      // ---- additive light tints over veil ----
      ctx.save(); ctx.globalCompositeOperation = "lighter";
      Art.glow(ctx, hero.x, hero.y - 16, hero.lampR * 0.9, "#ffcf6b", 0.22 * hero.lampB);
      if (hero.auraR > 4) Art.glow(ctx, hero.x, hero.y - 16, hero.auraR, "#9fd0ff", 0.10 * hero.pray);
      for (const la of B.lamps) Art.glow(ctx, la.x, la.y + 32, 40, "#ffcf6b", 0.13);
      ctx.restore();

      // fireflies
      ctx.save(); ctx.globalCompositeOperation = "lighter";
      for (const f of flies) {
        const tw = 0.5 + 0.5 * Math.sin(f.p * 3);
        Art.glow(ctx, f.x, f.y, 7 + tw * 5, "#cfffa0", 0.16 * tw);
        ctx.fillStyle = U.rgba("#eaffc0", 0.5 * tw); ctx.beginPath(); ctx.arc(f.x, f.y, 1.4, 0, U.TAU); ctx.fill();
      }
      ctx.restore();

      // moon + clouds + fog (above veil, so they shine through the dark)
      B._moonX = W * 0.24; B._moonY = H * 0.13;
      Art.moon(ctx, B._moonX, B._moonY, 52, DG.time, moonVeil);
      // moving sky clouds (drawn ABOVE veil so they're actually visible at night)
      for (const c of clouds) Art.skyCloud(ctx, c.x, c.y, c.s, c.alpha * (0.5 + 0.5 * (1 - dawnK * 0.4)));
      Art.fog(ctx, H * 0.55, 220, DG.time, "#9fb0e0", 0.07 * (1 - dawnK));
      Art.fog(ctx, H * 0.8, 200, DG.time, "#8f9ad6", 0.06 * (1 - dawnK));

      ps.draw(ctx);

      // ---- UI ----
      DG.UI.drawHUD(ctx, { keepsakes: hero.keepsakes, total: 3, hasChud: hero.hasChud,
        fear: B.sita_fear || 0, muted: DG.Audio.muted,
        ramaBar: hero.ramaBar, ramaMax: RAMA_MAX,
        dawnTimer, dawnTime: DAWN_TIME });
      DG.UI.Joystick.draw(ctx);
      DG.UI.tossBtn.draw(ctx, DG.time);
      if (note) DG.UI.drawNote(ctx, note);
      else if (state === "explore" || state === "approach") {
        const a = U.clamp(Math.min(tipT, TIP_PERIOD - tipT), 0, 1) * 0.7;
        if (a > 0.02) DG.UI.drawTip(ctx, TIPS[tipI], a);
      }

      if (state === "intro") DG.UI.drawIntro(ctx, DG.time);
      if (state === "end") DG.UI.drawEnd(ctx, DG.time, hero.keepsakes);
    }

    function punch(c, x, y, r, a) {
      if (r <= 0) return;
      const g = c.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, "rgba(0,0,0," + a + ")");
      g.addColorStop(0.7, "rgba(0,0,0," + a * 0.6 + ")");
      g.addColorStop(1, "rgba(0,0,0,0)");
      c.fillStyle = g; c.beginPath(); c.arc(x, y, r, 0, U.TAU); c.fill();
    }

    function doToss() {
      if (state !== "approach" || !hero.hasChud) return;
      state = "tossing"; stateT = 0;
      toss = { x: hero.x, y: hero.y - 24, x0: hero.x, y0: hero.y - 24, x1: B.sita.x, y1: B.sita.y + 6, t: 0, dur: 1.0 };
      DG.UI.tossBtn.visible = false;
      DG.Audio.ringDescend && DG.Audio.ringDescend();
      showNote("« Rama sends his keepsake »", 2.4);
    }

    // ---------------- scene interface ----------------
    return {
      enter() {
        newBoard();
        B.sita_fear = 0; B.sita_rec = 0;
        DG.Store.beginVisit();
        DG.UI.Joystick.reset();
        DG.UI.tossBtn.onTap = doToss;
        window.addEventListener("keydown", onKeyDown);
        window.addEventListener("keyup", onKeyUp);
        state = "intro"; stateT = 0;
      },
      exit() { window.removeEventListener("keydown", onKeyDown); window.removeEventListener("keyup", onKeyUp); },
      update,
      render,
      onDown(p) {
        if (state === "intro") { state = "explore"; stateT = 0; showNote("Drag to guide him. Pause to pray — a wider, safe light reveals the way.", 4.2); return; }
        if (state === "end") { DG.Scenes.go(DG.Scenes.Grove()); return; }
        // mute toggle hit?
        if (DG.UI.hitMute(p)) { DG.Audio.toggleMute(); return; }
        // toss button?
        if (DG.UI.tossBtn.visible && DG.UI.tossBtn.contains(p)) { DG.UI.tossBtn.pressed = true; return; }
        // else joystick
        DG.UI.Joystick.down(p);
      },
      onMove(p) { DG.UI.Joystick.move(p); },
      onUp(p) {
        if (DG.UI.tossBtn.pressed) { DG.UI.tossBtn.pressed = false; if (DG.UI.tossBtn.contains(p)) doToss(); }
        DG.UI.Joystick.up(p);
      },
      onKey() { if (state === "intro") { state = "explore"; } else if (state === "end") DG.Scenes.go(DG.Scenes.Grove()); },
      // test-only seam (never used in production play)
      __debug: {
        hero: () => hero, board: () => B, doToss,
        state: () => state, setState: (s) => { state = s; stateT = 0; },
      },
    };
  };
})();
