/* =====================================================================
   A Light in the Ashoka Grove — art_grove.js
   Procedural, hand-drawn-in-code night visuals: moon, clouds, fog, stars,
   ponds, lotuses, bridges, hedges, garden lamps, distant Lanka spires;
   the simsupa bower + Sitamma (mood states); sleeping/waking rakshasis;
   keepsakes + the chudamani; and Bala Hanumanthudu with a full antic rig.
   All functions draw in the engine's virtual coordinate space (720x1280).
   ===================================================================== */
(function () {
  "use strict";
  const DG = window.DG;
  const U = DG.util;
  const Art = (DG.Art = {});

  function srand(seed) {
    let s = seed % 2147483647; if (s <= 0) s += 2147483646;
    return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
  }
  Art.srand = srand;

  /* ---------------- glows ---------------- */
  Art.glow = function (ctx, x, y, r, color, a) {
    if (r <= 0) return;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, U.rgba(color, a == null ? 0.9 : a));
    g.addColorStop(1, U.rgba(color, 0));
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(x, y, r, 0, U.TAU); ctx.fill();
  };

  /* ---------------- sky / night ---------------- */
  Art.sky = function (ctx, stops) {
    const g = ctx.createLinearGradient(0, 0, 0, DG.H);
    stops.forEach((s) => g.addColorStop(s[0], s[1]));
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, DG.W, DG.H);
  };

  Art.stars = function (ctx, t, n, ybottom) {
    const rnd = srand(1337);
    ctx.save();
    for (let i = 0; i < n; i++) {
      const x = rnd() * DG.W;
      const y = rnd() * (ybottom || DG.H);
      const tw = 0.5 + 0.5 * Math.sin(t * 1.6 + i * 1.7);
      ctx.globalAlpha = 0.18 + tw * 0.4;
      ctx.fillStyle = "#eaf0ff";
      ctx.beginPath(); ctx.arc(x, y, 0.8 + tw * 1.1, 0, U.TAU); ctx.fill();
    }
    ctx.restore();
  };

  // The moon, veiled lightly by cloud. veil 0..1 dims/softens it.
  Art.moon = function (ctx, x, y, r, t, veil) {
    veil = veil == null ? 0.25 : veil;
    Art.glow(ctx, x, y, r * (3.4 - veil), "#cfe0ff", 0.32 * (1 - veil * 0.4));
    Art.glow(ctx, x, y, r * 1.8, "#eef3ff", 0.5 * (1 - veil * 0.3));
    const g = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, r * 0.2, x, y, r);
    g.addColorStop(0, "#ffffff");
    g.addColorStop(1, "#c4d0ee");
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(x, y, r, 0, U.TAU); ctx.fill();
    ctx.fillStyle = "rgba(150,168,214,0.22)";
    ctx.beginPath(); ctx.arc(x + r * 0.32, y - r * 0.18, r * 0.16, 0, U.TAU); ctx.fill();
    ctx.beginPath(); ctx.arc(x - r * 0.22, y + r * 0.3, r * 0.12, 0, U.TAU); ctx.fill();
    ctx.beginPath(); ctx.arc(x + r * 0.05, y + r * 0.1, r * 0.09, 0, U.TAU); ctx.fill();
    // a soft cloud veil drifting across
    if (veil > 0.02) {
      ctx.save();
      ctx.globalAlpha = U.clamp(veil, 0, 1) * 0.6;
      Art.cloud(ctx, x + Math.sin(t * 0.12) * 30, y + 4, r * 0.9, "#d7def2", 0.5);
      ctx.restore();
    }
  };

  Art.cloud = function (ctx, x, y, s, color, a) {
    color = color || "#ffffff";
    ctx.save();
    ctx.globalAlpha = a == null ? 0.5 : a;
    ctx.fillStyle = color;
    const lobes = [[0, 0, 1], [-0.95, 0.18, 0.72], [0.95, 0.18, 0.72], [-0.45, -0.32, 0.66], [0.5, -0.28, 0.7], [1.7, 0.32, 0.46], [-1.7, 0.32, 0.46]];
    ctx.beginPath();
    lobes.forEach((l) => ctx.arc(x + l[0] * s, y + l[1] * s, l[2] * s, 0, U.TAU));
    ctx.fill();
    ctx.restore();
  };

  // thin, drifting mist wisps (subtle — must never blanket the play area)
  Art.fog = function (ctx, y, h, t, color, a) {
    color = color || "#9fb0e0";
    ctx.save();
    ctx.globalAlpha = a == null ? 0.05 : a;
    const rnd = srand(77);
    for (let i = 0; i < 4; i++) {
      const base = rnd();
      const cxp = (base * (DG.W + 500) + t * (6 + i * 2)) % (DG.W + 500) - 250;
      const cyp = y + (rnd() - 0.5) * h;
      const w = 220 + base * 160, hh = 24 + base * 14;
      const g = ctx.createRadialGradient(cxp, cyp, 0, cxp, cyp, w);
      g.addColorStop(0, U.rgba(color, 0.5));
      g.addColorStop(1, U.rgba(color, 0));
      ctx.fillStyle = g;
      ctx.save(); ctx.translate(cxp, cyp); ctx.scale(1, hh / w); ctx.beginPath(); ctx.arc(0, 0, w, 0, U.TAU); ctx.fill(); ctx.restore();
    }
    ctx.restore();
  };

  // distant golden Lanka spires on the horizon
  Art.lankaSpires = function (ctx, baseY, t) {
    ctx.save();
    const rnd = srand(909);
    for (let i = 0; i < 7; i++) {
      const x = 40 + i * (DG.W - 80) / 6 + (rnd() - 0.5) * 30;
      const hh = 60 + rnd() * 90;
      const w = 22 + rnd() * 16;
      const g = ctx.createLinearGradient(0, baseY - hh, 0, baseY);
      g.addColorStop(0, "rgba(120,96,60,0.55)");
      g.addColorStop(1, "rgba(40,34,60,0.0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(x - w / 2, baseY);
      ctx.lineTo(x - w / 2, baseY - hh * 0.7);
      ctx.lineTo(x, baseY - hh);
      ctx.lineTo(x + w / 2, baseY - hh * 0.7);
      ctx.lineTo(x + w / 2, baseY);
      ctx.closePath(); ctx.fill();
      // a faint lit window
      ctx.fillStyle = U.rgba("#ffcf6b", 0.25 + 0.15 * Math.sin(t * 1.3 + i));
      ctx.beginPath(); ctx.arc(x, baseY - hh * 0.55, 2.2, 0, U.TAU); ctx.fill();
    }
    ctx.restore();
  };

  /* ---------------- ground ---------------- */
  // a dim night-grove floor wash
  Art.groundWash = function (ctx) {
    const g = ctx.createLinearGradient(0, DG.H * 0.2, 0, DG.H);
    g.addColorStop(0, "#171636");
    g.addColorStop(0.6, "#14142f");
    g.addColorStop(1, "#101027");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, DG.W, DG.H);
  };

  /* ---------------- water / ponds ---------------- */
  // pond: {x,y,rx,ry, seed}; t animates ripples
  Art.pond = function (ctx, p, t, moonX, moonY) {
    ctx.save();
    ctx.translate(p.x, p.y);
    // water body
    const g = ctx.createRadialGradient(0, -p.ry * 0.2, p.rx * 0.1, 0, 0, p.rx);
    g.addColorStop(0, "#1f2f5e");
    g.addColorStop(0.7, "#15224a");
    g.addColorStop(1, "#0e1838");
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.ellipse(0, 0, p.rx, p.ry, 0, 0, U.TAU); ctx.fill();
    // shoreline rim
    ctx.lineWidth = 3; ctx.strokeStyle = "rgba(120,140,200,0.18)";
    ctx.beginPath(); ctx.ellipse(0, 0, p.rx, p.ry, 0, 0, U.TAU); ctx.stroke();
    // clip for ripples & moon reflection
    ctx.beginPath(); ctx.ellipse(0, 0, p.rx - 2, p.ry - 2, 0, 0, U.TAU); ctx.clip();
    // moon glimmer reflection
    if (moonX != null) {
      const rx = U.clamp((moonX - p.x), -p.rx, p.rx);
      Art.glow(ctx, rx, p.ry * 0.1, p.rx * 0.5, "#cfe0ff", 0.16);
    }
    // ripple lines
    ctx.strokeStyle = "rgba(160,180,235,0.14)";
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 4; i++) {
      const yy = -p.ry * 0.5 + i * p.ry * 0.4;
      ctx.beginPath();
      for (let x = -p.rx; x <= p.rx; x += 8) {
        const yo = yy + Math.sin(x * 0.05 + t * 1.2 + i) * 2.2;
        if (x === -p.rx) ctx.moveTo(x, yo); else ctx.lineTo(x, yo);
      }
      ctx.stroke();
    }
    ctx.restore();
  };

  Art.lilypad = function (ctx, x, y, s, t) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(Math.sin(t * 0.6 + x) * 0.05);
    const g = ctx.createLinearGradient(0, -s, 0, s);
    g.addColorStop(0, "#2f7d52"); g.addColorStop(1, "#1c5238");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, s, -0.35, U.TAU - 0.35);
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = "rgba(10,30,20,0.35)"; ctx.lineWidth = 1.4;
    for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(i / 5 * 6.0 + 0.3) * s, Math.sin(i / 5 * 6.0 + 0.3) * s); ctx.stroke(); }
    ctx.restore();
  };

  Art.lotus = function (ctx, x, y, s, t, color) {
    color = color || "#ff9fc0";
    ctx.save();
    ctx.translate(x, y);
    const bob = Math.sin(t * 1.2 + x * 0.05) * 1.2;
    ctx.translate(0, bob);
    Art.glow(ctx, 0, 0, s * 1.8, "#ffd0e6", 0.18);
    for (let layer = 0; layer < 2; layer++) {
      const r = layer === 0 ? s : s * 0.66;
      const col = layer === 0 ? color : U.mix(color, "#ffffff", 0.4);
      const petals = 8;
      for (let i = 0; i < petals; i++) {
        ctx.save();
        ctx.rotate((i / petals) * U.TAU + (layer ? Math.PI / petals : 0));
        const grd = ctx.createLinearGradient(0, 0, 0, -r * 1.6);
        grd.addColorStop(0, U.mix(col, "#ffffff", 0.4));
        grd.addColorStop(1, col);
        ctx.fillStyle = grd;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(r * 0.5, -r, 0, -r * 1.6);
        ctx.quadraticCurveTo(-r * 0.5, -r, 0, 0);
        ctx.fill();
        ctx.restore();
      }
    }
    ctx.fillStyle = "#ffe08a";
    ctx.beginPath(); ctx.arc(0, 0, s * 0.3, 0, U.TAU); ctx.fill();
    ctx.restore();
  };

  // a plank bridge between (x0,y0) and (x1,y1)
  Art.bridge = function (ctx, x0, y0, x1, y1) {
    ctx.save();
    const dx = x1 - x0, dy = y1 - y0;
    const len = Math.hypot(dx, dy), ang = Math.atan2(dy, dx);
    ctx.translate(x0, y0); ctx.rotate(ang);
    const w = 34;
    // shadow on water
    ctx.fillStyle = "rgba(0,0,0,0.25)";
    U.roundRect(ctx, 0, -w / 2 + 5, len, w, 6); ctx.fill();
    // planks
    const n = Math.max(3, Math.floor(len / 16));
    for (let i = 0; i < n; i++) {
      const px = (i / n) * len;
      const g = ctx.createLinearGradient(0, -w / 2, 0, w / 2);
      g.addColorStop(0, "#7a5230"); g.addColorStop(0.5, "#8f6238"); g.addColorStop(1, "#5e3e22");
      ctx.fillStyle = g;
      U.roundRect(ctx, px + 1, -w / 2, len / n - 2, w, 3); ctx.fill();
    }
    // rope rails
    ctx.strokeStyle = "rgba(220,200,150,0.4)"; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(0, -w / 2 - 3); ctx.lineTo(len, -w / 2 - 3); ctx.moveTo(0, w / 2 + 3); ctx.lineTo(len, w / 2 + 3); ctx.stroke();
    ctx.restore();
  };

  // ashoka hedge / shrub clump with red-orange blossoms
  Art.hedge = function (ctx, x, y, s, seed) {
    const rnd = srand(seed || 7);
    ctx.save();
    ctx.translate(x, y);
    // soft cast shadow
    ctx.fillStyle = "rgba(0,0,0,0.22)";
    ctx.beginPath(); ctx.ellipse(0, s * 0.5, s * 1.1, s * 0.35, 0, 0, U.TAU); ctx.fill();
    const blobs = 5 + (seed % 3);
    for (let i = 0; i < blobs; i++) {
      const bx = (rnd() - 0.5) * s * 1.8;
      const by = -rnd() * s * 0.9;
      const br = s * (0.5 + rnd() * 0.5);
      const g = ctx.createRadialGradient(bx - br * 0.3, by - br * 0.3, br * 0.2, bx, by, br);
      g.addColorStop(0, "#1f5e3e"); g.addColorStop(1, "#123a28");
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(bx, by, br, 0, U.TAU); ctx.fill();
    }
    // ashoka blossoms (warm dots)
    for (let i = 0; i < blobs * 2; i++) {
      const bx = (rnd() - 0.5) * s * 1.7;
      const by = -rnd() * s * 1.2;
      ctx.fillStyle = U.choose(["#ff7a3c", "#ff9a4a", "#ff5d6c", "#ffb24a"]);
      ctx.beginPath(); ctx.arc(bx, by, 2 + rnd() * 1.6, 0, U.TAU); ctx.fill();
    }
    ctx.restore();
  };

  Art.rock = function (ctx, x, y, s, seed) {
    const rnd = srand(seed || 3);
    ctx.save(); ctx.translate(x, y);
    ctx.fillStyle = "rgba(0,0,0,0.2)";
    ctx.beginPath(); ctx.ellipse(0, s * 0.4, s * 1.1, s * 0.3, 0, 0, U.TAU); ctx.fill();
    const g = ctx.createLinearGradient(0, -s, 0, s);
    g.addColorStop(0, "#454a66"); g.addColorStop(1, "#2a2d44");
    ctx.fillStyle = g;
    ctx.beginPath();
    const n = 7;
    for (let i = 0; i <= n; i++) {
      const a = (i / n) * U.TAU;
      const rr = s * (0.7 + rnd() * 0.4);
      const px = Math.cos(a) * rr, py = Math.sin(a) * rr * 0.7;
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = "rgba(180,190,230,0.12)";
    ctx.beginPath(); ctx.ellipse(-s * 0.2, -s * 0.3, s * 0.4, s * 0.25, -0.4, 0, U.TAU); ctx.fill();
    ctx.restore();
  };

  // hanging garden lamp (a small steady warm light)
  Art.gardenLamp = function (ctx, x, y, t) {
    ctx.save(); ctx.translate(x, y);
    ctx.strokeStyle = "rgba(180,170,140,0.4)"; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(0, -26); ctx.lineTo(0, -8); ctx.stroke();
    const fl = 0.85 + 0.15 * Math.sin(t * 8 + x);
    Art.glow(ctx, 0, 0, 26 * fl, "#ffcf6b", 0.4);
    ctx.fillStyle = "rgba(60,46,28,0.9)";
    U.roundRect(ctx, -7, -8, 14, 16, 4); ctx.fill();
    ctx.fillStyle = U.rgba("#ffe6a8", 0.9);
    ctx.beginPath(); ctx.arc(0, 0, 3.2 * fl, 0, U.TAU); ctx.fill();
    ctx.restore();
  };

  /* ---------------- the simsupa bower + Sitamma ---------------- */
  // big sheltering tree at top-right
  Art.simsupa = function (ctx, x, y, s, t) {
    ctx.save(); ctx.translate(x, y);
    // trunk
    const tg = ctx.createLinearGradient(-s * 0.16, 0, s * 0.16, 0);
    tg.addColorStop(0, "#3a2a1c"); tg.addColorStop(0.5, "#5a4026"); tg.addColorStop(1, "#2c1f14");
    ctx.fillStyle = tg;
    ctx.beginPath();
    ctx.moveTo(-s * 0.13, 0);
    ctx.quadraticCurveTo(-s * 0.05, -s * 0.5, -s * 0.16, -s * 1.0);
    ctx.lineTo(s * 0.16, -s * 1.0);
    ctx.quadraticCurveTo(s * 0.05, -s * 0.5, s * 0.13, 0);
    ctx.closePath(); ctx.fill();
    // canopy — layered night-green blobs
    const sway = Math.sin(t * 0.5) * 4;
    const blobs = [[0, -1.35, 0.75], [-0.55, -1.1, 0.55], [0.55, -1.15, 0.58], [0, -1.8, 0.6], [-0.35, -1.65, 0.45], [0.4, -1.6, 0.48], [-0.7, -1.5, 0.4], [0.72, -1.5, 0.42]];
    for (let pass = 0; pass < 2; pass++) {
      ctx.fillStyle = pass === 0 ? "#143a2a" : "#1c5038";
      ctx.beginPath();
      blobs.forEach((b, i) => {
        const off = pass === 0 ? 0 : 0.12;
        ctx.moveTo((b[0] + off) * s + sway, (b[1] + off) * s);
        ctx.arc((b[0]) * s + sway * (1 - i * 0.06), (b[1]) * s, b[2] * s * (pass === 0 ? 1 : 0.82), 0, U.TAU);
      });
      ctx.fill();
    }
    // a few ashoka blossoms + dangling lamp
    const rnd = srand(404);
    for (let i = 0; i < 10; i++) {
      const bx = (rnd() - 0.5) * s * 1.6;
      const by = -s * (1.1 + rnd() * 0.8);
      ctx.fillStyle = U.choose(["#ff7a3c", "#ff5d6c", "#ffb24a"]);
      ctx.beginPath(); ctx.arc(bx + sway, by, 2.4, 0, U.TAU); ctx.fill();
    }
    ctx.restore();
  };

  // Sitamma seated under the tree. o:{fear 0..1, recognized 0..1, glow}
  Art.sitamma = function (ctx, x, y, s, t, o) {
    o = o || {};
    const fear = U.clamp(o.fear || 0, 0, 1);
    const rec = U.clamp(o.recognized || 0, 0, 1);
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    const breathe = Math.sin(t * 1.4) * 1.2;

    // aura around her: pale "moon veiled by cloud", warmer with recognition,
    // uneasy cool when frightened.
    const auraCol = rec > 0.05 ? U.mix("#ffd9a6", "#fff1cf", rec) : U.mix("#a9b8e8", "#8f9ad6", fear);
    Art.glow(ctx, 0, -20, 78 + rec * 40, auraCol, 0.22 + rec * 0.3);
    if (fear > 0.15 && rec < 0.1) {
      // uneasy reddish unrest light around the bower
      Art.glow(ctx, 0, -20, 90, "#7a4a6a", 0.12 * fear);
    }

    // seated body — sari drape
    const sari = rec > 0.05 ? "#ffd9b0" : "#caa9c8";
    const sariDk = U.mix(sari, "#3a2a4a", 0.4);
    const rg = ctx.createLinearGradient(0, -6, 0, 44);
    rg.addColorStop(0, sari); rg.addColorStop(1, sariDk);
    ctx.fillStyle = rg;
    ctx.beginPath();
    ctx.moveTo(-20, 44);
    ctx.quadraticCurveTo(-26, 6, -12, -10 + breathe);
    ctx.quadraticCurveTo(0, -16 + breathe, 12, -10 + breathe);
    ctx.quadraticCurveTo(26, 6, 20, 44);
    ctx.closePath(); ctx.fill();
    // folded knees
    ctx.fillStyle = sariDk;
    ctx.beginPath(); ctx.ellipse(-10, 42, 12, 8, 0, 0, U.TAU); ctx.ellipse(10, 42, 12, 8, 0, 0, U.TAU); ctx.fill();
    // arms resting (or drawn close when fearful)
    ctx.strokeStyle = "#e8b98e"; ctx.lineWidth = 7; ctx.lineCap = "round";
    const armIn = fear * 4;
    ctx.beginPath();
    ctx.moveTo(-11, -6 + breathe); ctx.quadraticCurveTo(-20 + armIn, 14, -8 + armIn, 30);
    ctx.moveTo(11, -6 + breathe); ctx.quadraticCurveTo(20 - armIn, 14, 8 - armIn, 30);
    ctx.stroke();

    // neck + head (head bows lower when sorrowful/fearful, lifts with recognition)
    const headDrop = U.lerp(2, 8, fear) - rec * 9;
    const hx = -fear * 2, hy = -34 + breathe + headDrop;
    ctx.fillStyle = "#edbf94";
    ctx.fillRect(-4, hy + 12, 8, 9);
    ctx.beginPath(); ctx.arc(hx, hy, 15, 0, U.TAU); ctx.fill();
    // long dark hair
    ctx.fillStyle = "#1c1410";
    ctx.beginPath(); ctx.arc(hx, hy - 2, 15.5, Math.PI * 0.92, U.TAU + Math.PI * 0.08); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(hx - 13, hy - 2); ctx.quadraticCurveTo(hx - 22, hy + 26, hx - 12, hy + 48);
    ctx.lineTo(hx - 4, hy + 46); ctx.quadraticCurveTo(hx - 12, hy + 22, hx - 7, hy - 4);
    ctx.closePath(); ctx.fill();
    // veil over hair (the "cloud"), lifts as recognized
    ctx.save();
    ctx.globalAlpha = 0.5 * (1 - rec);
    ctx.fillStyle = "#d9def0";
    ctx.beginPath();
    ctx.moveTo(hx - 16, hy + 2);
    ctx.quadraticCurveTo(hx, hy - 22, hx + 16, hy + 2);
    ctx.quadraticCurveTo(hx + 10, hy + 8, hx, hy + 6);
    ctx.quadraticCurveTo(hx - 10, hy + 8, hx - 16, hy + 2);
    ctx.closePath(); ctx.fill();
    ctx.restore();

    // face — eyes & brow shift with mood
    ctx.save(); ctx.translate(hx, hy);
    // eyes
    ctx.fillStyle = "#241a2a";
    const eo = 5;
    if (rec > 0.4) {
      // gentle, lifted gaze
      ctx.beginPath(); ctx.arc(-eo, 0, 2.0, 0, U.TAU); ctx.arc(eo, 0, 2.0, 0, U.TAU); ctx.fill();
    } else {
      // downcast / worried (small lidded eyes)
      ctx.lineWidth = 1.8; ctx.strokeStyle = "#241a2a"; ctx.lineCap = "round";
      ctx.beginPath(); ctx.moveTo(-eo - 2, 1); ctx.quadraticCurveTo(-eo, 2.4, -eo + 2, 1);
      ctx.moveTo(eo - 2, 1); ctx.quadraticCurveTo(eo, 2.4, eo + 2, 1); ctx.stroke();
    }
    // brows — knit when fearful
    if (fear > 0.25) {
      ctx.strokeStyle = "#3a2a20"; ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(-eo - 3, -5 + fear); ctx.lineTo(-eo + 2, -6);
      ctx.moveTo(eo + 3, -5 + fear); ctx.lineTo(eo - 2, -6); ctx.stroke();
    }
    // bindi
    ctx.fillStyle = "#c83f63"; ctx.beginPath(); ctx.arc(0, -6, 1.6, 0, U.TAU); ctx.fill();
    // mouth — sorrow vs. soft smile of recognition
    ctx.strokeStyle = "#a65c52"; ctx.lineWidth = 1.6; ctx.lineCap = "round";
    ctx.beginPath();
    if (rec > 0.4) ctx.arc(0, 6, 3.4, 0.15 * Math.PI, 0.85 * Math.PI);
    else ctx.arc(0, 10, 3.4, 1.15 * Math.PI, 1.85 * Math.PI); // downturned
    ctx.stroke();
    // a tear when very sorrowful and not yet recognized
    if (fear > 0.4 && rec < 0.1) {
      ctx.fillStyle = "rgba(180,210,255,0.8)";
      ctx.beginPath(); ctx.arc(-eo, 6 + (t * 14 % 8), 1.2, 0, U.TAU); ctx.fill();
    }
    ctx.restore();
    ctx.restore();
  };

  /* ---------------- rakshasi (sleeping guardian) ---------------- */
  // o:{state:'sleep'|'stir'|'awake'|'settle', phase 0..1, facing, seed}
  Art.rakshasi = function (ctx, x, y, s, t, o) {
    o = o || {};
    const st = o.state || "sleep";
    const ph = U.clamp(o.phase || 0, 0, 1);
    const face = o.facing || 1;
    // "up" amount: 0 = lying down, 1 = sitting upright
    let up = 0;
    if (st === "stir") up = U.smooth(ph) * 0.7;
    else if (st === "awake") up = 0.7 + 0.3 * U.smooth(ph);
    else if (st === "settle") up = 0.7 * (1 - U.smooth(ph));
    ctx.save(); ctx.translate(x, y); ctx.scale(face * s, s);

    const skin = "#6a4a72", skinDk = "#4a3052";
    const sari = "#5a2440", sariDk = "#3a1630";

    // ground mat / shadow
    ctx.fillStyle = "rgba(0,0,0,0.28)";
    ctx.beginPath(); ctx.ellipse(0, 6, 34, 9, 0, 0, U.TAU); ctx.fill();

    // reclining lower body (legs folded to one side) — stays low
    ctx.fillStyle = sariDk;
    ctx.beginPath();
    ctx.moveTo(-30, 4);
    ctx.quadraticCurveTo(-34, -8, -16, -10);
    ctx.quadraticCurveTo(6, -12, 18, -2);
    ctx.quadraticCurveTo(26, 6, 16, 8);
    ctx.closePath(); ctx.fill();
    // sari drape highlight
    ctx.fillStyle = sari;
    ctx.beginPath();
    ctx.moveTo(-26, 2); ctx.quadraticCurveTo(-20, -8, 2, -8); ctx.quadraticCurveTo(14, -6, 14, 2);
    ctx.quadraticCurveTo(-6, 4, -26, 2); ctx.fill();

    // torso pivots up from the hip (around -16,-6)
    ctx.save();
    ctx.translate(-14, -6);
    ctx.rotate(-up * 0.34);
    // torso
    const tg = ctx.createLinearGradient(0, -36, 0, 0);
    tg.addColorStop(0, skin); tg.addColorStop(1, skinDk);
    ctx.fillStyle = tg;
    ctx.beginPath(); ctx.ellipse(0, -18, 14, 20, 0, 0, U.TAU); ctx.fill();
    // sari blouse
    ctx.fillStyle = sari;
    ctx.beginPath(); ctx.ellipse(0, -8, 14, 11, 0, 0, U.TAU); ctx.fill();
    // arm
    ctx.strokeStyle = skin; ctx.lineWidth = 6.5; ctx.lineCap = "round";
    if (st === "stir") {
      // hand rubbing the head/eyes
      ctx.beginPath(); ctx.moveTo(4, -22); ctx.quadraticCurveTo(16, -34, 8, -44 + ph * 4); ctx.stroke();
    } else if (st === "awake") {
      ctx.beginPath(); ctx.moveTo(4, -22); ctx.quadraticCurveTo(20, -20, 24, -30); ctx.stroke();
    } else {
      ctx.beginPath(); ctx.moveTo(2, -20); ctx.quadraticCurveTo(12, -10, 8, 0); ctx.stroke();
    }
    // head
    ctx.translate(2, -40);
    ctx.fillStyle = skin;
    ctx.beginPath(); ctx.arc(0, 0, 12, 0, U.TAU); ctx.fill();
    // wild dark hair
    ctx.fillStyle = "#1a1020";
    ctx.beginPath(); ctx.arc(0, -2, 13, Math.PI * 0.85, U.TAU + Math.PI * 0.15); ctx.fill();
    for (let i = 0; i < 5; i++) {
      const a = Math.PI + i * 0.5;
      ctx.beginPath(); ctx.moveTo(Math.cos(a) * 9, Math.sin(a) * 9 - 2);
      ctx.lineTo(Math.cos(a) * 18, Math.sin(a) * 16 - 2); ctx.lineTo(Math.cos(a + 0.2) * 12, Math.sin(a + 0.2) * 12 - 2);
      ctx.closePath(); ctx.fill();
    }
    // forehead mark
    ctx.fillStyle = "#caa24a"; ctx.beginPath(); ctx.arc(2, -6, 1.4, 0, U.TAU); ctx.fill();
    // face
    const eyeOpen = st === "awake" ? 1 : st === "stir" ? ph * 0.6 : 0;
    if (eyeOpen > 0.2) {
      ctx.fillStyle = "#ffd86b";
      ctx.beginPath(); ctx.ellipse(-3, -2, 2.4, 1.4 + eyeOpen, 0, 0, U.TAU); ctx.ellipse(5, -2, 2.4, 1.4 + eyeOpen, 0, 0, U.TAU); ctx.fill();
      ctx.fillStyle = "#3a2a1a";
      ctx.beginPath(); ctx.arc(-3, -2, 1, 0, U.TAU); ctx.arc(5, -2, 1, 0, U.TAU); ctx.fill();
    } else {
      // closed, lashed eyes
      ctx.strokeStyle = "#2a1a2a"; ctx.lineWidth = 1.2; ctx.lineCap = "round";
      ctx.beginPath(); ctx.moveTo(-6, -2); ctx.lineTo(-1, -2); ctx.moveTo(2, -2); ctx.lineTo(7, -2); ctx.stroke();
    }
    // mouth
    ctx.strokeStyle = "#3a1a2a"; ctx.lineWidth = 1.2;
    ctx.beginPath();
    if (st === "awake") ctx.arc(1, 4, 2.4, 1.1 * Math.PI, 1.9 * Math.PI); // small startled "o"/frown
    else ctx.moveTo(-2, 4), ctx.lineTo(4, 4);
    ctx.stroke();
    ctx.restore(); // torso

    // sleep "z z z" or an alert mark
    ctx.scale(face, 1); // un-mirror text
    if (st === "sleep" || st === "settle") {
      ctx.fillStyle = U.rgba("#cfe0ff", 0.6 + 0.3 * Math.sin(t * 2));
      U.text(ctx, "z", face * 18, -46 - (t * 8 % 10), { size: 11, fill: U.rgba("#cfe0ff", 0.7) });
      U.text(ctx, "z", face * 26, -54 - (t * 6 % 12), { size: 8, fill: U.rgba("#cfe0ff", 0.5) });
    } else if (st === "awake") {
      ctx.globalAlpha = 0.6 + 0.4 * Math.sin(t * 8);
      U.text(ctx, "!", face * 14, -64, { size: 20, fill: "#ff9a6a", stroke: "rgba(60,20,20,0.6)", strokeW: 3 });
      ctx.globalAlpha = 1;
    }
    ctx.restore();
  };

  /* ---------------- keepsakes & chudamani ---------------- */
  // kinds: 'ring' | 'blossom' | 'leaf'
  Art.keepsake = function (ctx, x, y, t, kind) {
    ctx.save();
    ctx.translate(x, y + Math.sin(t * 1.6 + x) * 2.5);
    const pulse = 0.7 + 0.3 * Math.sin(t * 3 + x);
    Art.glow(ctx, 0, 0, 20 * pulse, "#ffe6a0", 0.5);
    ctx.rotate(Math.sin(t * 0.8) * 0.2);
    if (kind === "ring") {
      ctx.strokeStyle = "#ffd24a"; ctx.lineWidth = 3.4;
      ctx.beginPath(); ctx.arc(0, 1, 6.5, 0, U.TAU); ctx.stroke();
      ctx.fillStyle = "#bfe0ff"; ctx.beginPath(); ctx.arc(0, -6, 2.6, 0, U.TAU); ctx.fill();
    } else if (kind === "leaf") {
      ctx.fillStyle = "#7ed18a";
      ctx.beginPath(); ctx.moveTo(0, -8); ctx.quadraticCurveTo(7, 0, 0, 9); ctx.quadraticCurveTo(-7, 0, 0, -8); ctx.fill();
      ctx.strokeStyle = "#2f7d52"; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(0, -7); ctx.lineTo(0, 8); ctx.stroke();
    } else {
      // blossom
      ctx.fillStyle = "#ff8fb0";
      for (let i = 0; i < 5; i++) { ctx.save(); ctx.rotate(i / 5 * U.TAU); ctx.beginPath(); ctx.ellipse(0, -6, 3.2, 5.5, 0, 0, U.TAU); ctx.fill(); ctx.restore(); }
      ctx.fillStyle = "#ffe08a"; ctx.beginPath(); ctx.arc(0, 0, 2.6, 0, U.TAU); ctx.fill();
    }
    ctx.restore();
  };

  // the crest-jewel — ornate, strongly glowing
  Art.chudamani = function (ctx, x, y, t, opts) {
    opts = opts || {};
    const sc = opts.scale || 1;
    ctx.save();
    ctx.translate(x, y + (opts.float === false ? 0 : Math.sin(t * 1.8) * 3));
    ctx.scale(sc, sc);
    const pulse = 0.75 + 0.25 * Math.sin(t * 3);
    Art.glow(ctx, 0, 0, 30 * pulse, "#fff0c0", 0.6);
    Art.glow(ctx, 0, 0, 16, "#bfe6ff", 0.5);
    // gold crest setting
    ctx.fillStyle = "#ffd24a"; ctx.strokeStyle = "#b5701a"; ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(0, -12);
    ctx.lineTo(9, -3); ctx.lineTo(6, 11); ctx.lineTo(-6, 11); ctx.lineTo(-9, -3);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    // little gold points (crown of the crest)
    ctx.fillStyle = "#ffe08a";
    for (let i = -1; i <= 1; i++) { ctx.beginPath(); ctx.arc(i * 5, -12, 2.2, 0, U.TAU); ctx.fill(); }
    // central gem
    const gg = ctx.createRadialGradient(-1.5, -1.5, 0.5, 0, 0, 6);
    gg.addColorStop(0, "#eaffff"); gg.addColorStop(0.5, "#7fd0ff"); gg.addColorStop(1, "#2f7ad0");
    ctx.fillStyle = gg;
    ctx.beginPath(); ctx.arc(0, 0, 5.2, 0, U.TAU); ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.9)";
    ctx.beginPath(); ctx.arc(-1.6, -1.6, 1.4, 0, U.TAU); ctx.fill();
    // sparkles
    ctx.fillStyle = "rgba(255,255,255," + (0.4 + 0.4 * Math.sin(t * 5)) + ")";
    U.starPath(ctx, 9, -10, 4, 2.4, 1); ctx.fill();
    ctx.restore();
  };

  /* =====================================================================
     BALA HANUMANTHUDU — small, childlike, fully pose-animated, with a
     lamp he carries. State drives the antic; we compute joint params here.
     ===================================================================== */
  function crown(ctx, r) {
    ctx.fillStyle = "#ffd24a"; ctx.strokeStyle = "#b5701a"; ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(-r * 0.62, -r * 0.72);
    ctx.lineTo(-r * 0.62, -r * 1.02);
    ctx.lineTo(-r * 0.3, -r * 0.78);
    ctx.lineTo(0, -r * 1.18);
    ctx.lineTo(r * 0.3, -r * 0.78);
    ctx.lineTo(r * 0.62, -r * 1.02);
    ctx.lineTo(r * 0.62, -r * 0.72);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = "#ff5a7a"; ctx.beginPath(); ctx.arc(0, -r * 0.86, r * 0.09, 0, U.TAU); ctx.fill();
  }

  // compute a pose from state. returns joint params in local units.
  // local origin = hip center; body sits above; ground at ~ +22.
  function poseFor(o, t) {
    const st = o.state || "idle";
    const ph = U.clamp(o.phase == null ? 0 : o.phase, 0, 1);
    const wk = o.walkPhase || 0;
    // defaults (standing idle breathe)
    const breathe = Math.sin(t * 2.4) * 1.4;
    const P = {
      hipY: 0,
      bodyY: -breathe * 0.5,
      bodyRot: 0,
      headX: 0, headY: -26 - breathe * 0.4, headTilt: 0,
      // arms: shoulder->hand target offsets (front = lamp hand)
      backArm: { x: -10, y: -2 }, frontArm: { x: 11, y: -1 },
      backLeg: { x: -7, y: 22 }, frontLeg: { x: 8, y: 22 },
      tailCurl: 0.0 + Math.sin(t * 1.5) * 0.06,
      eyeX: 0, eyeY: 0, blink: (Math.sin(t * 0.7) > 0.97) ? 1 : 0,
      mouth: "smile", awe: 0,
      lampHand: null, // if set, override front hand to hold lamp here
    };

    if (st === "walk" || st === "hop") {
      const sp = st === "hop" ? 1 : 1;
      const c = Math.sin(wk * Math.PI * 2);
      const c2 = Math.cos(wk * Math.PI * 2);
      P.bodyY = -2 - Math.abs(Math.sin(wk * Math.PI * 2)) * 4;
      P.bodyRot = 0.06 * c;
      P.headY = -26 + P.bodyY * 0.3;
      P.headTilt = 0.05 * c;
      P.backLeg = { x: -8 - c * 8 * sp, y: 22 - Math.max(0, c) * 6 };
      P.frontLeg = { x: 8 + c * 8 * sp, y: 22 - Math.max(0, -c) * 6 };
      P.backArm = { x: -11 + c * 5, y: -2 + c2 * 2 };
      P.frontArm = { x: 12 - c * 4, y: -2 - c2 * 2 };
      P.tailCurl = 0.1 + c * 0.12;
      P.eyeX = 0.6;
    } else if (st === "reach") {
      // reach for the moon-fruit: crouch, then spring, both arms up, awe
      const k = ph;
      const crouch = k < 0.35 ? U.smooth(k / 0.35) : 1 - U.smooth(U.clamp((k - 0.35) / 0.4, 0, 1));
      const spring = k > 0.35 ? U.smooth(U.clamp((k - 0.35) / 0.25, 0, 1)) : 0;
      const fall = k > 0.7 ? U.smooth((k - 0.7) / 0.3) : 0;
      P.hipY = crouch * 8 - spring * 22 + fall * 22;
      P.bodyY = -2 - spring * 6;
      P.headY = -26 + crouch * 4 - spring * 3;
      P.headTilt = -0.18 + fall * 0.5; // look up, then bashful down
      P.backArm = { x: -10, y: -22 - spring * 8 };
      P.frontArm = { x: 12, y: -22 - spring * 8 };
      if (k > 0.7) { P.backArm = { x: -12, y: 2 }; P.frontArm = { x: 12, y: 4 }; } // tumbled, bashful
      P.backLeg = { x: -8, y: 22 - crouch * 6 + spring * 6 };
      P.frontLeg = { x: 8, y: 22 - crouch * 6 + spring * 6 };
      P.tailCurl = 0.3 + spring * 0.3;
      P.eyeX = 0; P.eyeY = k < 0.7 ? -1 : 0.6;
      P.awe = k < 0.7 ? 1 : 0;
      P.mouth = k > 0.7 ? "bashful" : "awe";
      P.lookUp = k < 0.7;
    } else if (st === "spin") {
      // tail-chase / spin in place
      P.bodyRot = Math.sin(ph * Math.PI * 2) * 0.3;
      P.headTilt = Math.sin(ph * Math.PI * 4) * 0.2;
      P.tailCurl = 0.4 + Math.sin(ph * Math.PI * 6) * 0.3;
      P.frontArm = { x: 14, y: 6 };
      P.eyeX = Math.sin(ph * Math.PI * 4);
    } else if (st === "scratch") {
      // head-scratch
      P.headTilt = 0.12;
      P.frontArm = { x: 4 + Math.sin(t * 14) * 2, y: -24 };
      P.mouth = "o";
      P.eyeY = -0.4;
    } else if (st === "peek") {
      // curious tilt / peek
      P.headTilt = Math.sin(ph * Math.PI) * 0.4;
      P.bodyRot = Math.sin(ph * Math.PI) * 0.06;
      P.eyeX = 1; P.eyeY = -0.3;
    } else if (st === "hops") {
      // a few little hops in place
      const c = Math.abs(Math.sin(ph * Math.PI * 3));
      P.hipY = -c * 12;
      P.bodyY = -2 - c * 3;
      P.headY = -26 - c * 2;
      P.backLeg = { x: -7, y: 22 + c * 4 };
      P.frontLeg = { x: 8, y: 22 + c * 4 };
      P.tailCurl = 0.2 + c * 0.2;
    } else if (st === "firefly") {
      // catch a firefly: one paw reaches up and around
      const a = ph * Math.PI * 2;
      P.frontArm = { x: 14 + Math.cos(a) * 8, y: -16 + Math.sin(a) * 10 };
      P.headTilt = Math.cos(a) * 0.12;
      P.eyeX = Math.cos(a) * 0.8; P.eyeY = Math.sin(a) * 0.6 - 0.2;
      P.mouth = "o";
    } else if (st === "yawn") {
      // yawn & stretch
      const k = Math.sin(ph * Math.PI);
      P.backArm = { x: -10, y: -20 * k - 2 };
      P.frontArm = { x: 12, y: -20 * k - 2 };
      P.headTilt = -0.1 * k;
      P.mouth = k > 0.4 ? "yawn" : "smile";
      P.blink = k > 0.3 ? 1 : 0;
    } else if (st === "splash") {
      // paw-splash near a pond
      const c = Math.sin(ph * Math.PI * 3);
      P.frontArm = { x: 14, y: 8 + c * 6 };
      P.bodyRot = 0.05;
      P.headTilt = 0.08;
      P.mouth = "smile";
    } else if (st === "pray") {
      // anjali — hands together, eyes closed, Rama nama; gentle sway
      const sway = Math.sin(t * 1.6) * 0.04;
      P.bodyRot = sway;
      P.headY = -25;
      P.headTilt = 0.06 + sway;
      P.backArm = { x: 2, y: 2 };
      P.frontArm = { x: 5, y: 2 };
      P.anjali = true;
      P.blink = 1;
      P.mouth = "smile";
      P.tailCurl = 0.25 + Math.sin(t * 1.2) * 0.05;
    } else if (st === "bow") {
      P.bodyRot = 0.5 * U.smooth(ph);
      P.headY = -22; P.headTilt = 0.4 * U.smooth(ph);
      P.anjali = true; P.blink = 1;
    }
    return P;
  }

  // draw a tapered limb from shoulder/hip (sx,sy) to hand/foot (hx,hy)
  function limb(ctx, sx, sy, hx, hy, w, color, tip) {
    ctx.strokeStyle = color; ctx.lineWidth = w; ctx.lineCap = "round";
    const mx = (sx + hx) / 2 + (sy - hy) * 0.12, my = (sy + hy) / 2 + (hx - sx) * 0.12;
    ctx.beginPath(); ctx.moveTo(sx, sy); ctx.quadraticCurveTo(mx, my, hx, hy); ctx.stroke();
    if (tip) { ctx.fillStyle = tip; ctx.beginPath(); ctx.arc(hx, hy, w * 0.45, 0, U.TAU); ctx.fill(); }
  }

  // x,y at the hero's ground point (feet). s scale. o = state object.
  Art.bala = function (ctx, x, y, s, t, o) {
    o = o || {};
    const P = poseFor(o, t);
    const dir = o.facing || 1;
    const skin = "#f08a2e", skinDk = "#cf6c1c", muzzle = "#ffdca6";
    const lampBright = o.lamp == null ? 1 : o.lamp;
    const glowR = (o.glow || 1);

    ctx.save();
    // ground point → hip is ~ -22 above feet
    ctx.translate(x, y - 22 * s + P.hipY * s);
    ctx.scale(s, s);
    // devotion halo (small, soft) — grows when praying
    Art.glow(ctx, P.headX, P.headY, (18 + (o.state === "pray" ? 10 : 0)) * glowR, "#ffe9a8", 0.4);

    ctx.save();
    ctx.rotate(P.bodyRot);
    ctx.scale(dir, 1);
    ctx.translate(0, P.bodyY);

    // tail (behind)
    ctx.strokeStyle = skin; ctx.lineWidth = 7; ctx.lineCap = "round";
    const tc = P.tailCurl;
    ctx.beginPath();
    ctx.moveTo(-8, 8);
    ctx.quadraticCurveTo(-30, 6 - tc * 20, -22, -18 - tc * 16);
    ctx.quadraticCurveTo(-16, -34 - tc * 10, -2, -28 - tc * 8);
    ctx.stroke();
    ctx.fillStyle = "#ffe6c0";
    ctx.beginPath(); ctx.arc(-2, -28 - tc * 8, 4, 0, U.TAU); ctx.fill();

    // back leg
    limb(ctx, -4, 8, P.backLeg.x, P.backLeg.y, 8, skinDk, muzzle);
    // back arm (unless praying/anjali, which draws both forward)
    if (!P.anjali) limb(ctx, -5, -8, P.backArm.x, P.backArm.y, 7, skinDk, muzzle);

    // body
    const bg = ctx.createLinearGradient(-12, -18, 12, 14);
    bg.addColorStop(0, skin); bg.addColorStop(1, skinDk);
    ctx.fillStyle = bg;
    ctx.beginPath(); ctx.ellipse(0, -6, 13, 16, 0, 0, U.TAU); ctx.fill();
    // lighter belly
    ctx.fillStyle = "#ffd9a0";
    ctx.beginPath(); ctx.ellipse(2, -4, 7, 11, 0, 0, U.TAU); ctx.fill();
    // little gold dhoti
    ctx.fillStyle = "#ffcf3f";
    ctx.beginPath(); ctx.moveTo(-11, 4); ctx.lineTo(12, 4); ctx.quadraticCurveTo(14, 16, 2, 18); ctx.quadraticCurveTo(-12, 18, -13, 6); ctx.closePath(); ctx.fill();

    // front leg
    limb(ctx, 4, 8, P.frontLeg.x, P.frontLeg.y, 8, skin, muzzle);

    // head
    const HX = P.headX, HY = P.headY, HR = 15;
    ctx.save();
    ctx.translate(HX, HY); ctx.rotate(P.headTilt);
    // ears
    ctx.fillStyle = skin;
    ctx.beginPath(); ctx.arc(-HR * 0.92, -2, 5.5, 0, U.TAU); ctx.arc(HR * 0.92, -2, 5.5, 0, U.TAU); ctx.fill();
    ctx.fillStyle = muzzle;
    ctx.beginPath(); ctx.arc(-HR * 0.92, -2, 2.6, 0, U.TAU); ctx.arc(HR * 0.92, -2, 2.6, 0, U.TAU); ctx.fill();
    // head ball
    ctx.fillStyle = skin;
    ctx.beginPath(); ctx.arc(0, 0, HR, 0, U.TAU); ctx.fill();
    // muzzle
    ctx.fillStyle = muzzle;
    ctx.beginPath(); ctx.ellipse(4, 5, 9, 7, 0, 0, U.TAU); ctx.fill();
    // crown
    crown(ctx, HR);
    // face
    const ex = 4.5, ey = -1;
    if (P.blink) {
      ctx.strokeStyle = "#2a1a14"; ctx.lineWidth = 1.4; ctx.lineCap = "round";
      ctx.beginPath(); ctx.moveTo(-ex - 2, ey); ctx.lineTo(-ex + 2, ey); ctx.moveTo(ex - 2, ey); ctx.lineTo(ex + 2, ey); ctx.stroke();
    } else {
      ctx.fillStyle = "#fff";
      ctx.beginPath(); ctx.ellipse(-ex, ey, 3, 3.4, 0, 0, U.TAU); ctx.ellipse(ex, ey, 3, 3.4, 0, 0, U.TAU); ctx.fill();
      ctx.fillStyle = "#1a1422";
      const px = P.eyeX * 1.4, py = P.eyeY * 1.4;
      ctx.beginPath(); ctx.arc(-ex + px, ey + py, 1.7, 0, U.TAU); ctx.arc(ex + px, ey + py, 1.7, 0, U.TAU); ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.beginPath(); ctx.arc(-ex + px + 0.5, ey + py - 0.6, 0.6, 0, U.TAU); ctx.arc(ex + px + 0.5, ey + py - 0.6, 0.6, 0, U.TAU); ctx.fill();
    }
    // brows for awe
    if (P.awe) {
      ctx.strokeStyle = "#9a4a1a"; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(-ex - 2, ey - 4); ctx.lineTo(-ex + 2, ey - 5); ctx.moveTo(ex - 2, ey - 5); ctx.lineTo(ex + 2, ey - 4); ctx.stroke();
    }
    // mouth
    ctx.strokeStyle = "#9a3b2e"; ctx.fillStyle = "#7a2b22"; ctx.lineWidth = 1.4; ctx.lineCap = "round";
    if (P.mouth === "o" || P.mouth === "awe") { ctx.beginPath(); ctx.arc(4, 9, 2.2, 0, U.TAU); ctx.fillStyle = "#6a241c"; ctx.fill(); }
    else if (P.mouth === "yawn") { ctx.beginPath(); ctx.ellipse(4, 10, 2.6, 3.6, 0, 0, U.TAU); ctx.fillStyle = "#6a241c"; ctx.fill(); }
    else if (P.mouth === "bashful") { ctx.beginPath(); ctx.arc(4, 7, 3, 0.1 * Math.PI, 0.9 * Math.PI); ctx.stroke(); }
    else { ctx.beginPath(); ctx.arc(4, 7, 3.4, 0.12 * Math.PI, 0.88 * Math.PI); ctx.stroke(); }
    // red tilak
    ctx.fillStyle = "#e23b3b"; ctx.beginPath(); ctx.moveTo(2, -9); ctx.lineTo(0.5, -3); ctx.lineTo(3.5, -3); ctx.closePath(); ctx.fill();
    ctx.restore(); // head

    // front arm / lamp. When praying → both hands in anjali (no lamp held high).
    if (P.anjali) {
      // hands together in front of chest
      limb(ctx, -5, -8, 6, -2, 7, skin, null);
      limb(ctx, 5, -8, 6, -2, 7, skin, null);
      ctx.fillStyle = muzzle; ctx.beginPath(); ctx.arc(7, -3, 4, 0, U.TAU); ctx.fill();
    } else {
      // front arm carries the lamp
      limb(ctx, 5, -8, P.frontArm.x, P.frontArm.y, 7, skin, null);
      // the diya in his hand
      drawDiya(ctx, P.frontArm.x + 2, P.frontArm.y + 2, 5, lampBright, t);
    }

    ctx.restore(); // body (dir)
    ctx.restore(); // hero
  };

  // a little oil lamp (diya). lit flickers.
  function drawDiya(ctx, x, y, s, bright, t) {
    ctx.save(); ctx.translate(x, y);
    // bowl
    const g = ctx.createLinearGradient(0, 0, 0, s * 0.7);
    g.addColorStop(0, "#caa24a"); g.addColorStop(1, "#7a4a16");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(-s, 0); ctx.quadraticCurveTo(0, s * 0.95, s, 0); ctx.quadraticCurveTo(0, -s * 0.2, -s, 0); ctx.fill();
    if (bright > 0.05) {
      const fl = (0.85 + 0.15 * Math.sin(t * 14)) * bright;
      Art.glow(ctx, 0, -s * 0.9, s * 3.2 * fl, "#ffcf6b", 0.5 * bright);
      const fg = ctx.createLinearGradient(0, -s * 0.2, 0, -s * 1.7);
      fg.addColorStop(0, "#ff7b2e"); fg.addColorStop(0.5, "#ffd24a"); fg.addColorStop(1, "#fff7d0");
      ctx.fillStyle = fg;
      ctx.beginPath();
      ctx.moveTo(0, -s * 0.1); ctx.quadraticCurveTo(s * 0.4 * fl, -s * 0.8, 0, -s * 1.5 * fl);
      ctx.quadraticCurveTo(-s * 0.4 * fl, -s * 0.8, 0, -s * 0.1); ctx.fill();
    }
    ctx.restore();
  }
  Art.diya = drawDiya;
})();
