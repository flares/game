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
      g.addColorStop(0, "rgba(160,120,60,0.75)");
      g.addColorStop(1, "rgba(40,34,60,0.0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(x - w / 2, baseY);
      ctx.lineTo(x - w / 2, baseY - hh * 0.7);
      ctx.lineTo(x, baseY - hh);
      ctx.lineTo(x + w / 2, baseY - hh * 0.7);
      ctx.lineTo(x + w / 2, baseY);
      ctx.closePath(); ctx.fill();
      // warm lit window
      ctx.fillStyle = U.rgba("#ffcf6b", 0.46 + 0.18 * Math.sin(t * 1.3 + i));
      ctx.beginPath(); ctx.arc(x, baseY - hh * 0.55, 2.8, 0, U.TAU); ctx.fill();
    }
    ctx.restore();
  };

  /* ---------------- ground ---------------- */
  // a dim night-grove floor wash — deep olive-green, transparent at top so sky shows
  Art.groundWash = function (ctx) {
    const g = ctx.createLinearGradient(0, DG.H * 0.12, 0, DG.H);
    g.addColorStop(0,    "rgba(10,22,14,0)");
    g.addColorStop(0.16, "rgba(10,22,14,0.78)");
    g.addColorStop(0.52, "#0e1c12");
    g.addColorStop(0.84, "#0c1a10");
    g.addColorStop(1,    "#0a160e");
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

  // ashoka hedge / shrub clump with red-orange blossoms — cartoon style with bold outlines
  Art.hedge = function (ctx, x, y, s, seed) {
    const rnd = srand(seed || 7);
    ctx.save();
    ctx.translate(x, y);
    // soft cast shadow
    ctx.fillStyle = "rgba(0,0,0,0.22)";
    ctx.beginPath(); ctx.ellipse(0, s * 0.5, s * 1.1, s * 0.35, 0, 0, U.TAU); ctx.fill();
    const blobs = 5 + (seed % 3);
    // pre-store blob positions so outline + fill passes are consistent
    const blobData = [];
    for (let i = 0; i < blobs; i++) {
      blobData.push({ bx: (rnd() - 0.5) * s * 1.8, by: -rnd() * s * 0.9, br: s * (0.5 + rnd() * 0.5) });
    }
    // dark outline ring pass
    ctx.fillStyle = "#1a3818";
    ctx.beginPath();
    blobData.forEach(b => ctx.arc(b.bx, b.by, b.br + 3.5, 0, U.TAU));
    ctx.fill();
    // flat vivid green fill pass
    ctx.fillStyle = "#2a7040";
    ctx.beginPath();
    blobData.forEach(b => ctx.arc(b.bx, b.by, b.br, 0, U.TAU));
    ctx.fill();
    // bold stroke outline per blob
    ctx.strokeStyle = "#1a3020"; ctx.lineWidth = 2.2; ctx.lineJoin = "round";
    blobData.forEach(b => {
      ctx.beginPath(); ctx.arc(b.bx, b.by, b.br, 0, U.TAU); ctx.stroke();
    });
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
    Art.glow(ctx, 0, 0, 52 * fl, "#ffcf6b", 0.58);
    Art.glow(ctx, 0, 30, 60 * fl, "#ffc050", 0.22); // warm ground pool
    ctx.fillStyle = "rgba(60,46,28,0.9)";
    U.roundRect(ctx, -7, -8, 14, 16, 4); ctx.fill();
    ctx.fillStyle = U.rgba("#ffe6a8", 0.9);
    ctx.beginPath(); ctx.arc(0, 0, 3.2 * fl, 0, U.TAU); ctx.fill();
    ctx.restore();
  };

  // water reeds / cattails on a shore
  Art.reed = function (ctx, x, y, h, t, seed) {
    const rnd = srand(seed || 5);
    ctx.save(); ctx.translate(x, y);
    for (let i = 0; i < 3; i++) {
      const ox = (rnd() - 0.5) * 8, hh = h * (0.7 + rnd() * 0.5);
      const sway = Math.sin(t * 1.4 + i + x * 0.05) * 3;
      ctx.strokeStyle = "#2f6e44"; ctx.lineWidth = 2; ctx.lineCap = "round";
      ctx.beginPath(); ctx.moveTo(ox, 0); ctx.quadraticCurveTo(ox + sway * 0.5, -hh * 0.6, ox + sway, -hh); ctx.stroke();
      // cattail head
      ctx.fillStyle = "#6b4326";
      ctx.beginPath(); ctx.ellipse(ox + sway, -hh, 2, 5, 0, 0, U.TAU); ctx.fill();
    }
    ctx.restore();
  };

  // a small wet stepping stone in water
  Art.stepStone = function (ctx, x, y, s) {
    ctx.save(); ctx.translate(x, y);
    ctx.fillStyle = "rgba(0,0,0,0.25)"; ctx.beginPath(); ctx.ellipse(0, s * 0.4, s * 1.1, s * 0.5, 0, 0, U.TAU); ctx.fill();
    const g = ctx.createRadialGradient(-s * 0.3, -s * 0.3, s * 0.2, 0, 0, s);
    g.addColorStop(0, "#5a6080"); g.addColorStop(1, "#343852");
    ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(0, 0, s, s * 0.78, 0, 0, U.TAU); ctx.fill();
    ctx.fillStyle = "rgba(180,200,240,0.16)"; ctx.beginPath(); ctx.ellipse(-s * 0.2, -s * 0.2, s * 0.45, s * 0.3, -0.4, 0, U.TAU); ctx.fill();
    ctx.restore();
  };

  // a carved stone slab (Sitamma's seat at the foot of the tree)
  Art.slab = function (ctx, x, y, w, h) {
    ctx.save(); ctx.translate(x, y);
    ctx.fillStyle = "rgba(0,0,0,0.3)"; ctx.beginPath(); ctx.ellipse(0, h * 0.55, w * 0.62, h * 0.5, 0, 0, U.TAU); ctx.fill();
    // front face
    ctx.fillStyle = "#3a3d56"; U.roundRect(ctx, -w / 2, -h * 0.1, w, h * 0.7, 6); ctx.fill();
    // top
    const g = ctx.createLinearGradient(0, -h * 0.5, 0, 0);
    g.addColorStop(0, "#6a6f8e"); g.addColorStop(1, "#4a4e68");
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.ellipse(0, -h * 0.1, w / 2, h * 0.32, 0, 0, U.TAU); ctx.fill();
    ctx.fillStyle = "rgba(190,205,240,0.14)";
    ctx.beginPath(); ctx.ellipse(-w * 0.12, -h * 0.16, w * 0.28, h * 0.16, -0.2, 0, U.TAU); ctx.fill();
    // little moss
    ctx.fillStyle = "rgba(60,120,80,0.4)";
    ctx.beginPath(); ctx.arc(-w * 0.32, h * 0.18, 4, 0, U.TAU); ctx.arc(w * 0.3, h * 0.26, 3, 0, U.TAU); ctx.fill();
    ctx.restore();
  };

  /* ---------------- the simsupa bower + Sitamma ---------------- */
  // big sheltering simsupa bower at top-right — cartoon style with bold outlines
  Art.simsupa = function (ctx, x, y, s, t) {
    ctx.save(); ctx.translate(x, y);
    // trunk
    ctx.fillStyle = "#3a2a1c";
    ctx.strokeStyle = "#1e100a"; ctx.lineWidth = 2.5; ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(-s * 0.13, 0);
    ctx.quadraticCurveTo(-s * 0.05, -s * 0.5, -s * 0.16, -s * 1.0);
    ctx.lineTo(s * 0.16, -s * 1.0);
    ctx.quadraticCurveTo(s * 0.05, -s * 0.5, s * 0.13, 0);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    // canopy — dark outline ring first, then vivid green fill
    const sway = Math.sin(t * 0.5) * 4;
    const blobs = [[0, -1.35, 0.75], [-0.55, -1.1, 0.55], [0.55, -1.15, 0.58], [0, -1.8, 0.6], [-0.35, -1.65, 0.45], [0.4, -1.6, 0.48], [-0.7, -1.5, 0.4], [0.72, -1.5, 0.42]];
    ctx.fillStyle = "#1a3818";
    ctx.beginPath();
    blobs.forEach((b, i) => ctx.arc(b[0] * s + sway * (1 - i * 0.06), b[1] * s, b[2] * s * 1.08 + 3, 0, U.TAU));
    ctx.fill();
    // vivid green main canopy
    ctx.fillStyle = "#2e7848";
    ctx.beginPath();
    blobs.forEach((b, i) => ctx.arc(b[0] * s + sway * (1 - i * 0.06), b[1] * s, b[2] * s, 0, U.TAU));
    ctx.fill();
    // moonlit green highlight (upper left)
    ctx.fillStyle = "#4a9e64";
    ctx.beginPath();
    blobs.slice(0, 4).forEach((b, i) => ctx.arc(b[0] * s + sway * (1 - i * 0.06) - 8, b[1] * s - 8, b[2] * s * 0.5, 0, U.TAU));
    ctx.fill();
    // bold stroke outline
    ctx.strokeStyle = "#1a3020"; ctx.lineWidth = 2.8; ctx.lineJoin = "round";
    blobs.forEach((b, i) => {
      ctx.beginPath(); ctx.arc(b[0] * s + sway * (1 - i * 0.06), b[1] * s, b[2] * s, 0, U.TAU); ctx.stroke();
    });
    // ashoka blossoms
    const rnd = srand(404);
    for (let i = 0; i < 10; i++) {
      const bx = (rnd() - 0.5) * s * 1.6;
      const by = -s * (1.1 + rnd() * 0.8);
      ctx.fillStyle = U.choose(["#ff7a3c", "#ff5d6c", "#ffb24a"]);
      ctx.beginPath(); ctx.arc(bx + sway, by, 2.4, 0, U.TAU); ctx.fill();
    }
    ctx.restore();
  };

  // Sitamma seated under the tree — cartoon style with big expressive eyes.
  // o:{fear 0..1, recognized 0..1}
  Art.sitamma = function (ctx, x, y, s, t, o) {
    o = o || {};
    const fear = U.clamp(o.fear || 0, 0, 1);
    const rec  = U.clamp(o.recognized || 0, 0, 1);
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    const breathe = Math.sin(t * 1.4) * 1.6;

    // aura
    const auraCol = rec > 0.05 ? U.mix("#ffd9a6", "#fff1cf", rec) : U.mix("#a9b8e8", "#8f9ad6", fear);
    Art.glow(ctx, 0, -20, 90 + rec * 55, auraCol, 0.26 + rec * 0.36);
    if (fear > 0.15 && rec < 0.1) Art.glow(ctx, 0, -20, 100, "#7a4a6a", 0.14 * fear);

    // ---- palette ----
    const sariA   = rec > 0.05 ? "#bf3e10" : "#7a2e96";
    const sariB   = rec > 0.05 ? "#e05a20" : "#9240b8";
    const gold    = "#ffd050";
    const skin    = "#ecb882", skinDk = "#c8906c";

    // lower sari drape (seated)
    const sg = ctx.createLinearGradient(0, 0, 0, 50);
    sg.addColorStop(0, sariB); sg.addColorStop(1, sariA);
    ctx.fillStyle = sg;
    ctx.beginPath();
    ctx.moveTo(-28, 50);
    ctx.quadraticCurveTo(-33, 12, -14, -2 + breathe * 0.4);
    ctx.quadraticCurveTo(0, -11 + breathe * 0.5, 14, -2 + breathe * 0.4);
    ctx.quadraticCurveTo(33, 12, 28, 50);
    ctx.closePath(); ctx.fill();
    // gold border
    ctx.strokeStyle = gold; ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(-28, 50); ctx.quadraticCurveTo(-33, 12, -14, -2 + breathe * 0.4);
    ctx.moveTo(14, -2 + breathe * 0.4); ctx.quadraticCurveTo(33, 12, 28, 50);
    ctx.stroke();
    // knee bumps
    ctx.fillStyle = U.mix(sariA, "#000", 0.28);
    ctx.beginPath(); ctx.ellipse(-12, 48, 14, 9, 0.12, 0, U.TAU); ctx.ellipse(12, 48, 14, 9, -0.12, 0, U.TAU); ctx.fill();

    // torso
    const tg2 = ctx.createLinearGradient(0, -28, 0, 4);
    tg2.addColorStop(0, skin); tg2.addColorStop(1, sariB);
    ctx.fillStyle = tg2;
    ctx.beginPath(); ctx.ellipse(0, -10 + breathe * 0.3, 15, 19, 0, 0, U.TAU); ctx.fill();
    ctx.strokeStyle = "#3a1808"; ctx.lineWidth = 2; ctx.lineJoin = "round"; ctx.stroke();

    // arms
    ctx.strokeStyle = skin; ctx.lineWidth = 10; ctx.lineCap = "round";
    const aIn = fear * 5;
    ctx.beginPath(); ctx.moveTo(-13, -10 + breathe * 0.3); ctx.quadraticCurveTo(-27 + aIn, 6, -16 + aIn * 0.6, 31); ctx.stroke();
    ctx.beginPath(); ctx.moveTo( 13, -10 + breathe * 0.3); ctx.quadraticCurveTo( 27 - aIn, 6,  16 - aIn * 0.6, 31); ctx.stroke();
    ctx.fillStyle = skin;
    ctx.beginPath(); ctx.arc(-16 + aIn * 0.6, 31, 5.5, 0, U.TAU); ctx.arc(16 - aIn * 0.6, 31, 5.5, 0, U.TAU); ctx.fill();
    // bangles
    ctx.strokeStyle = gold; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.arc(-16 + aIn * 0.6, 27, 5.2, 0, U.TAU); ctx.stroke();
    ctx.beginPath(); ctx.arc( 16 - aIn * 0.6, 27, 5.2, 0, U.TAU); ctx.stroke();

    // ---- BIG CARTOON HEAD ----
    const headDrop = U.lerp(2, 11, fear) - rec * 13;
    const hx = -fear * 2, hy = -47 + breathe * 0.3 + headDrop;
    const HR = 24; // large cartoon radius

    ctx.fillStyle = skin; ctx.fillRect(hx - 6, hy + HR - 2, 12, 15); // neck

    // hair mass (dark, voluminous)
    ctx.fillStyle = "#1c100a";
    ctx.beginPath(); ctx.arc(hx, hy, HR + 5, 0, U.TAU); ctx.fill();
    ctx.beginPath(); ctx.arc(hx - HR * 0.76, hy - HR * 0.52, 14, 0, U.TAU); ctx.fill(); // side bun
    // jasmine flowers in bun
    ctx.fillStyle = "#fffcea";
    for (let i = 0; i < 5; i++) {
      const fa = -0.6 + i * 0.45;
      ctx.beginPath(); ctx.arc(hx - HR * 0.76 + Math.cos(fa) * 11, hy - HR * 0.52 + Math.sin(fa) * 11, 3, 0, U.TAU); ctx.fill();
    }

    // veil / dupatta — fades as recognized
    const veilA = 0.55 * (1 - rec * 0.8);
    if (veilA > 0.04) {
      ctx.save(); ctx.globalAlpha = veilA; ctx.fillStyle = "#dde6fa";
      ctx.beginPath();
      ctx.moveTo(hx - HR - 4, hy - 3); ctx.quadraticCurveTo(hx, hy - HR * 1.45, hx + HR + 4, hy - 3);
      ctx.quadraticCurveTo(hx + HR - 2, hy + 10, hx, hy + 8);
      ctx.quadraticCurveTo(hx - HR + 2, hy + 10, hx - HR - 4, hy - 3);
      ctx.closePath(); ctx.fill(); ctx.restore();
    }

    // face skin (radial gradient, lit from upper-left)
    const fg2 = ctx.createRadialGradient(hx - 5, hy - 7, 3, hx, hy, HR);
    fg2.addColorStop(0, "#fce0bf"); fg2.addColorStop(1, skin);
    ctx.fillStyle = fg2; ctx.beginPath(); ctx.arc(hx, hy, HR, 0, U.TAU); ctx.fill();
    ctx.strokeStyle = "#3a1808"; ctx.lineWidth = 2.2; ctx.lineJoin = "round"; ctx.stroke();

    // rosy cheeks
    ctx.fillStyle = U.rgba("#ff9a80", 0.32);
    ctx.beginPath(); ctx.arc(hx - 10, hy + 5, 7, 0, U.TAU); ctx.arc(hx + 10, hy + 5, 7, 0, U.TAU); ctx.fill();

    // ---- EYES (large, expressive) ----
    const eo = 9, eyeY = hy - 3;
    const eyeHh = rec > 0.3 ? 10 : (fear > 0.25 ? 10.5 : 8.5);
    // whites
    ctx.fillStyle = "#fff";
    ctx.beginPath(); ctx.ellipse(hx - eo, eyeY, 9.5, eyeHh, 0, 0, U.TAU); ctx.ellipse(hx + eo, eyeY, 9.5, eyeHh, 0, 0, U.TAU); ctx.fill();
    // iris
    const eyeSY = rec > 0.3 ? -2.2 : (fear > 0.25 ? 1.8 : 1);
    ctx.fillStyle = "#2c1a0e";
    ctx.beginPath(); ctx.arc(hx - eo, eyeY + eyeSY, 6, 0, U.TAU); ctx.arc(hx + eo, eyeY + eyeSY, 6, 0, U.TAU); ctx.fill();
    ctx.fillStyle = "#100804";
    ctx.beginPath(); ctx.arc(hx - eo, eyeY + eyeSY, 3.6, 0, U.TAU); ctx.arc(hx + eo, eyeY + eyeSY, 3.6, 0, U.TAU); ctx.fill();
    // eye shines
    ctx.fillStyle = "#fff";
    ctx.beginPath(); ctx.arc(hx - eo - 2.2, eyeY + eyeSY - 2.4, 2.4, 0, U.TAU); ctx.arc(hx + eo - 2.2, eyeY + eyeSY - 2.4, 2.4, 0, U.TAU); ctx.fill();
    ctx.beginPath(); ctx.arc(hx - eo + 2.8, eyeY + eyeSY + 1.6, 1.1, 0, U.TAU); ctx.arc(hx + eo + 2.8, eyeY + eyeSY + 1.6, 1.1, 0, U.TAU); ctx.fill();
    // lower lid (downcast)
    if (rec < 0.3) {
      ctx.save(); ctx.fillStyle = skin;
      ctx.beginPath(); ctx.ellipse(hx - eo, eyeY, 9.5, eyeHh, 0, 0, Math.PI); ctx.fill();
      ctx.beginPath(); ctx.ellipse(hx + eo, eyeY, 9.5, eyeHh, 0, 0, Math.PI); ctx.fill();
      ctx.restore();
    }
    // eyelashes (upper)
    ctx.strokeStyle = "#1c100a"; ctx.lineWidth = 1.9; ctx.lineCap = "round";
    for (const side of [-1, 1]) {
      const bex = hx + side * eo;
      for (let l = -3; l <= 3; l++) {
        const la = Math.PI + (l / 6) * 0.76;
        ctx.beginPath();
        ctx.moveTo(bex + Math.cos(la) * 9, eyeY + Math.sin(la) * 9);
        ctx.lineTo(bex + Math.cos(la) * 14, eyeY + Math.sin(la) * 14 - 2.4);
        ctx.stroke();
      }
    }

    // eyebrows
    ctx.strokeStyle = "#2a1610"; ctx.lineWidth = 3; ctx.lineCap = "round";
    const brY = eyeY - eyeHh - 4;
    if (fear > 0.25) {
      ctx.beginPath();
      ctx.moveTo(hx - eo - 7, brY + fear * 4); ctx.lineTo(hx - eo + 5, brY);
      ctx.moveTo(hx + eo - 5, brY); ctx.lineTo(hx + eo + 7, brY + fear * 4); ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.moveTo(hx - eo - 7, brY + 1); ctx.quadraticCurveTo(hx - eo, brY - 3, hx - eo + 5, brY + 1);
      ctx.moveTo(hx + eo - 5, brY + 1); ctx.quadraticCurveTo(hx + eo, brY - 3, hx + eo + 7, brY + 1);
      ctx.stroke();
    }

    // nose
    ctx.fillStyle = U.rgba(skinDk, 0.5);
    ctx.beginPath(); ctx.arc(hx - 2, hy + 6, 2.5, 0, U.TAU); ctx.arc(hx + 3, hy + 6, 2.5, 0, U.TAU); ctx.fill();

    // BINDI (prominent)
    ctx.fillStyle = "#cc2050"; ctx.beginPath(); ctx.arc(hx, hy - 10, 4, 0, U.TAU); ctx.fill();
    ctx.fillStyle = "#ff4080"; ctx.beginPath(); ctx.arc(hx + 0.7, hy - 10.8, 1.8, 0, U.TAU); ctx.fill();

    // mouth
    ctx.strokeStyle = "#b04838"; ctx.lineWidth = 2.8; ctx.lineCap = "round";
    if (rec > 0.4) { ctx.beginPath(); ctx.arc(hx, hy + 10, 6, 0.1 * Math.PI, 0.9 * Math.PI); ctx.stroke(); }
    else           { ctx.beginPath(); ctx.arc(hx, hy + 14, 5.5, 1.1 * Math.PI, 1.9 * Math.PI); ctx.stroke(); }

    // tear
    if (fear > 0.4 && rec < 0.1) {
      ctx.fillStyle = "rgba(160,210,255,0.85)";
      ctx.beginPath(); ctx.arc(hx - eo, hy + 8 + (t * 12 % 8), 1.8, 0, U.TAU); ctx.fill();
    }

    // ---- jewelry ----
    for (const side of [-1, 1]) {
      const ex2 = hx + side * (HR + 2), ey2 = hy + 7;
      ctx.fillStyle = gold; ctx.beginPath(); ctx.arc(ex2, ey2, 6, 0, U.TAU); ctx.fill();
      ctx.fillStyle = "#c030a8"; ctx.beginPath(); ctx.arc(ex2, ey2, 3.2, 0, U.TAU); ctx.fill();
      ctx.strokeStyle = gold; ctx.lineWidth = 1.8;
      ctx.beginPath(); ctx.moveTo(ex2, ey2 + 6); ctx.lineTo(ex2, ey2 + 8); ctx.stroke();
      ctx.fillStyle = gold; ctx.beginPath(); ctx.arc(ex2, ey2 + 11, 2.8, 0, U.TAU); ctx.fill();
    }
    // necklace arc
    ctx.save(); ctx.strokeStyle = gold; ctx.lineWidth = 2.6; ctx.lineCap = "round";
    ctx.beginPath();
    const nBase = hy + HR * 0.9;
    for (let ni = 0; ni <= 9; ni++) {
      const na = Math.PI * (0.65 + ni / 9 * 0.7);
      const nx2 = hx + Math.cos(na) * (HR * 0.92), ny2 = nBase + Math.sin(na) * (HR * 0.45);
      if (ni === 0) ctx.moveTo(nx2, ny2); else ctx.lineTo(nx2, ny2);
    }
    ctx.stroke();
    ctx.fillStyle = gold; ctx.beginPath(); ctx.arc(hx, nBase + HR * 0.45 + 6, 5, 0, U.TAU); ctx.fill();
    ctx.fillStyle = "#2080d8"; ctx.beginPath(); ctx.arc(hx, nBase + HR * 0.45 + 6, 3, 0, U.TAU); ctx.fill();
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
  // tall, ornate gold kireetam with a back halo arc and a red crest gem
  function crown(ctx, r) {
    const gold = "#ffd24a", goldDk = "#cf8e22", goldLt = "#fff1b4", gem = "#e23b3b", green = "#3fae6a";
    const band = (y0, y1) => { const g = ctx.createLinearGradient(0, y0, 0, y1); g.addColorStop(0, goldLt); g.addColorStop(0.5, gold); g.addColorStop(1, goldDk); return g; };
    ctx.save();
    ctx.lineJoin = "round"; ctx.strokeStyle = goldDk; ctx.lineWidth = 0.8;
    // back halo arc (prabha)
    ctx.strokeStyle = U.rgba(goldLt, 0.85); ctx.lineWidth = r * 0.14;
    ctx.beginPath(); ctx.arc(0, -r * 0.18, r * 1.16, Math.PI * 1.12, Math.PI * 1.88); ctx.stroke();
    ctx.strokeStyle = goldDk; ctx.lineWidth = r * 0.04;
    ctx.beginPath(); ctx.arc(0, -r * 0.18, r * 1.16, Math.PI * 1.12, Math.PI * 1.88); ctx.stroke();
    // side flares at the base
    ctx.fillStyle = band(-r * 1.05, -r * 0.6); ctx.strokeStyle = goldDk; ctx.lineWidth = 0.8;
    for (const sgn of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(sgn * 0.74 * r, -r * 0.66);
      ctx.quadraticCurveTo(sgn * 1.12 * r, -r * 0.82, sgn * 0.96 * r, -r * 1.06);
      ctx.quadraticCurveTo(sgn * 0.82 * r, -r * 0.94, sgn * 0.66 * r, -r * 0.84);
      ctx.closePath(); ctx.fill(); ctx.stroke();
    }
    // base band across the brow
    ctx.fillStyle = band(-r * 1.0, -r * 0.66);
    ctx.beginPath();
    ctx.moveTo(-r * 0.78, -r * 0.64); ctx.lineTo(r * 0.78, -r * 0.64);
    ctx.lineTo(r * 0.68, -r * 0.98); ctx.lineTo(-r * 0.68, -r * 0.98); ctx.closePath(); ctx.fill(); ctx.stroke();
    // tier 2
    ctx.fillStyle = band(-r * 1.34, -r * 0.96);
    ctx.beginPath();
    ctx.moveTo(-r * 0.6, -r * 0.96); ctx.lineTo(r * 0.6, -r * 0.96);
    ctx.lineTo(r * 0.44, -r * 1.34); ctx.lineTo(-r * 0.44, -r * 1.34); ctx.closePath(); ctx.fill(); ctx.stroke();
    // tier 3
    ctx.fillStyle = band(-r * 1.66, -r * 1.3);
    ctx.beginPath();
    ctx.moveTo(-r * 0.4, -r * 1.32); ctx.lineTo(r * 0.4, -r * 1.32);
    ctx.lineTo(r * 0.26, -r * 1.66); ctx.lineTo(-r * 0.26, -r * 1.66); ctx.closePath(); ctx.fill(); ctx.stroke();
    // finial dome + spire
    ctx.fillStyle = band(-r * 2.0, -r * 1.6);
    ctx.beginPath(); ctx.ellipse(0, -r * 1.66, r * 0.26, r * 0.18, 0, Math.PI, 0); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-r * 0.13, -r * 1.72); ctx.lineTo(r * 0.13, -r * 1.72); ctx.lineTo(0, -r * 2.12); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = gem; ctx.beginPath(); ctx.arc(0, -r * 2.12, r * 0.07, 0, U.TAU); ctx.fill();
    // gems
    ctx.fillStyle = gem; ctx.beginPath(); ctx.arc(0, -r * 0.82, r * 0.12, 0, U.TAU); ctx.fill();
    ctx.fillStyle = goldLt; ctx.beginPath(); ctx.arc(0, -r * 0.85, r * 0.04, 0, U.TAU); ctx.fill();
    ctx.fillStyle = green; ctx.beginPath(); ctx.arc(-r * 0.4, -r * 0.8, r * 0.06, 0, U.TAU); ctx.arc(r * 0.4, -r * 0.8, r * 0.06, 0, U.TAU); ctx.fill();
    ctx.fillStyle = gem; ctx.beginPath(); ctx.arc(0, -r * 1.12, r * 0.07, 0, U.TAU); ctx.fill();
    ctx.restore();
  }

  // white flower garland (vaijayanti mala) draping the chest
  function drawGarland(ctx) {
    for (const sgn of [-1, 1]) {
      for (let i = 0; i <= 7; i++) {
        const tt = i / 7;
        const fx = U.lerp(sgn * 7, 0, tt) + sgn * Math.sin(tt * Math.PI) * 5.5;
        const fy = U.lerp(-15, 13, tt);
        ctx.fillStyle = "#fff8ee"; ctx.beginPath(); ctx.arc(fx, fy, 2.0, 0, U.TAU); ctx.fill();
        if (i % 2 === 0) { ctx.fillStyle = "#ff9ab0"; ctx.beginPath(); ctx.arc(fx, fy, 0.8, 0, U.TAU); ctx.fill(); }
      }
    }
    // gold-set pendant where the strands meet
    ctx.fillStyle = "#ffcf3f"; ctx.beginPath(); ctx.arc(0, 12, 3.4, 0, U.TAU); ctx.fill();
    ctx.fillStyle = "#3fae6a"; ctx.beginPath(); ctx.arc(0, 12, 2.0, 0, U.TAU); ctx.fill();
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
  // The divine child Bala Hanumanthudu: cream skin, white face-fur ruff, tall
  // gold kireetam, white garland, red dhoti + flowing scarf, tail, the lamp.
  Art.bala = function (ctx, x, y, s, t, o) {
    o = o || {};
    const P = poseFor(o, t);
    const dir = o.facing || 1;
    const skin = "#f4caa0", skinDk = "#dca878", fur = "#fff8ef", hair = "#3a2416";
    const red = "#e23b2e", redDk = "#b3281f", gold = "#ffcf3f";
    const lampBright = o.lamp == null ? 1 : o.lamp;
    const glowR = (o.glow || 1);

    ctx.save();
    ctx.translate(x, y - 22 * s + P.hipY * s);
    ctx.scale(s, s);
    Art.glow(ctx, P.headX, P.headY, (20 + (o.state === "pray" ? 12 : 0)) * glowR, "#ffe9a8", 0.42);

    ctx.save();
    ctx.rotate(P.bodyRot);
    ctx.scale(dir, 1);
    ctx.translate(0, P.bodyY);

    // ---- flowing red scarf (angavastram) behind both shoulders ----
    const wav = Math.sin(t * 3) * 4;
    for (const sgn of [-1, 1]) {
      ctx.fillStyle = sgn < 0 ? redDk : red;
      ctx.beginPath();
      ctx.moveTo(sgn * 6, -14);
      ctx.quadraticCurveTo(sgn * 28, -10 + wav, sgn * 31, 12 + wav);
      ctx.quadraticCurveTo(sgn * 35, 32, sgn * 21, 35 - wav);
      ctx.quadraticCurveTo(sgn * 20, 14, sgn * 11, -8);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = gold;
      ctx.beginPath();
      ctx.moveTo(sgn * 21, 35 - wav); ctx.quadraticCurveTo(sgn * 35, 32, sgn * 31, 12 + wav);
      ctx.lineTo(sgn * 28, 14); ctx.quadraticCurveTo(sgn * 31, 29, sgn * 19, 32 - wav); ctx.closePath(); ctx.fill();
    }

    // ---- tail (skin w/ brown tuft) ----
    ctx.strokeStyle = skin; ctx.lineWidth = 6; ctx.lineCap = "round";
    const tc = P.tailCurl;
    ctx.beginPath();
    ctx.moveTo(-6, 10);
    ctx.quadraticCurveTo(-32, 8 - tc * 22, -24, -20 - tc * 16);
    ctx.quadraticCurveTo(-18, -40 - tc * 10, -32, -42 - tc * 8);
    ctx.stroke();
    ctx.fillStyle = hair; ctx.beginPath(); ctx.arc(-32, -42 - tc * 8, 5.5, 0, U.TAU); ctx.fill();

    // back leg + back arm
    limb(ctx, -4, 8, P.backLeg.x, P.backLeg.y, 8.5, skinDk, skin);
    if (!P.anjali) limb(ctx, -5, -8, P.backArm.x, P.backArm.y, 7.5, skinDk, skin);

    // ---- dhoti (red + gold hem) ----
    ctx.fillStyle = red;
    ctx.beginPath(); ctx.moveTo(-13, 1); ctx.lineTo(13, 1); ctx.quadraticCurveTo(16, 20, 3, 22); ctx.quadraticCurveTo(-14, 22, -15, 3); ctx.closePath(); ctx.fill();
    ctx.fillStyle = gold;
    ctx.beginPath(); ctx.moveTo(-15, 3); ctx.quadraticCurveTo(-14, 22, 3, 22); ctx.quadraticCurveTo(16, 20, 13, 1); ctx.lineTo(10.5, 5); ctx.quadraticCurveTo(13, 18, 2, 19); ctx.quadraticCurveTo(-12, 19, -12.5, 5); ctx.closePath(); ctx.fill();

    // front leg + gold anklet
    limb(ctx, 4, 8, P.frontLeg.x, P.frontLeg.y, 8.5, skin, skin);
    ctx.strokeStyle = gold; ctx.lineWidth = 1.8; ctx.beginPath(); ctx.arc(P.frontLeg.x, P.frontLeg.y, 3.6, 0, U.TAU); ctx.stroke();

    // ---- torso (cream, chubby) ----
    const bg = ctx.createLinearGradient(-12, -18, 12, 14);
    bg.addColorStop(0, "#f8d4ac"); bg.addColorStop(1, skinDk);
    ctx.fillStyle = bg;
    ctx.beginPath(); ctx.ellipse(0, -6, 13, 16, 0, 0, U.TAU); ctx.fill();
    ctx.strokeStyle = "#2a1808"; ctx.lineWidth = 2; ctx.lineJoin = "round"; ctx.stroke();
    ctx.fillStyle = U.rgba("#ffffff", 0.14); ctx.beginPath(); ctx.ellipse(2, -4, 7, 10, 0, 0, U.TAU); ctx.fill();
    // pearl belt
    ctx.strokeStyle = "#ffe9b0"; ctx.lineWidth = 1.5; ctx.setLineDash([1.4, 1.8]);
    ctx.beginPath(); ctx.moveTo(-12, 2); ctx.quadraticCurveTo(0, 6, 12, 2); ctx.stroke(); ctx.setLineDash([]);
    // gold choker
    ctx.fillStyle = gold; ctx.beginPath(); ctx.ellipse(0, -17, 7.5, 2.6, 0, 0, U.TAU); ctx.fill();
    ctx.fillStyle = "#e23b3b"; ctx.beginPath(); ctx.arc(0, -16, 1.2, 0, U.TAU); ctx.fill();

    // ---- white flower garland ----
    drawGarland(ctx);

    // ---- front arm / lamp (or anjali) ----
    if (P.anjali) {
      limb(ctx, -5, -8, 6, -2, 7.5, skin, null);
      limb(ctx, 5, -8, 6, -2, 7.5, skin, null);
      ctx.fillStyle = skin; ctx.beginPath(); ctx.arc(7, -3, 4.5, 0, U.TAU); ctx.fill();
    } else {
      limb(ctx, 5, -8, P.frontArm.x, P.frontArm.y, 7.5, skin, null);
      ctx.strokeStyle = gold; ctx.lineWidth = 2.2; ctx.beginPath(); ctx.arc(P.frontArm.x, P.frontArm.y, 3.4, 0, U.TAU); ctx.stroke();
      drawDiya(ctx, P.frontArm.x + 2, P.frontArm.y + 2, 5, lampBright, t);
    }

    // ---- head ----
    const HX = P.headX, HY = P.headY, HR = 15;
    ctx.save();
    ctx.translate(HX, HY); ctx.rotate(P.headTilt);
    // hair base
    ctx.fillStyle = hair;
    ctx.beginPath(); ctx.arc(0, -2, HR + 2, 0, U.TAU); ctx.fill();
    // jhumka earrings
    ctx.fillStyle = gold;
    ctx.beginPath(); ctx.arc(-HR * 0.98, HR * 0.28, 2.2, 0, U.TAU); ctx.arc(HR * 0.98, HR * 0.28, 2.2, 0, U.TAU); ctx.fill();
    ctx.beginPath(); ctx.arc(-HR * 0.98, HR * 0.52, 1.4, 0, U.TAU); ctx.arc(HR * 0.98, HR * 0.52, 1.4, 0, U.TAU); ctx.fill();
    // face ball (cream, slightly larger)
    const fg2 = ctx.createRadialGradient(-3, -3, 2, 0, 0, HR);
    fg2.addColorStop(0, "#fce4c4"); fg2.addColorStop(1, skin);
    ctx.fillStyle = fg2; ctx.beginPath(); ctx.arc(0, 0, HR, 0, U.TAU); ctx.fill();
    ctx.strokeStyle = "#2a1408"; ctx.lineWidth = 2.2; ctx.lineJoin = "round"; ctx.stroke();
    // clear cream muzzle / snout oval (vanara face feature)
    ctx.fillStyle = fur;
    ctx.beginPath(); ctx.ellipse(0, 5, HR * 0.58, HR * 0.5, 0, 0, U.TAU); ctx.fill();
    ctx.strokeStyle = U.rgba(skin, 0.4); ctx.lineWidth = 0.8;
    ctx.beginPath(); ctx.ellipse(0, 5, HR * 0.58, HR * 0.5, 0, 0, U.TAU); ctx.stroke();
    // rosy cheeks
    ctx.fillStyle = U.rgba("#ff9a8a", 0.45);
    ctx.beginPath(); ctx.arc(-6, 3, 3.5, 0, U.TAU); ctx.arc(6, 3, 3.5, 0, U.TAU); ctx.fill();
    // crown (drawn after face base so it sits on the head)
    crown(ctx, HR);
    // eyes (big, expressive)
    const ex = 5.2, ey = -1.5;
    if (P.blink) {
      ctx.strokeStyle = "#2a1a14"; ctx.lineWidth = 1.4; ctx.lineCap = "round";
      ctx.beginPath(); ctx.moveTo(-ex - 2.5, ey); ctx.quadraticCurveTo(-ex, ey + 1.6, -ex + 2.5, ey); ctx.moveTo(ex - 2.5, ey); ctx.quadraticCurveTo(ex, ey + 1.6, ex + 2.5, ey); ctx.stroke();
    } else {
      ctx.fillStyle = "#fff";
      ctx.beginPath(); ctx.ellipse(-ex, ey, 3.2, 3.8, 0, 0, U.TAU); ctx.ellipse(ex, ey, 3.2, 3.8, 0, 0, U.TAU); ctx.fill();
      const px = P.eyeX * 1.3, py = P.eyeY * 1.3;
      ctx.fillStyle = "#4a2c14";
      ctx.beginPath(); ctx.arc(-ex + px, ey + py, 2.1, 0, U.TAU); ctx.arc(ex + px, ey + py, 2.1, 0, U.TAU); ctx.fill();
      ctx.fillStyle = "#1a1008";
      ctx.beginPath(); ctx.arc(-ex + px, ey + py, 1.1, 0, U.TAU); ctx.arc(ex + px, ey + py, 1.1, 0, U.TAU); ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.beginPath(); ctx.arc(-ex + px + 0.7, ey + py - 0.9, 0.7, 0, U.TAU); ctx.arc(ex + px + 0.7, ey + py - 0.9, 0.7, 0, U.TAU); ctx.fill();
      ctx.strokeStyle = "#2a1a14"; ctx.lineWidth = 1; ctx.lineCap = "round";
      ctx.beginPath(); ctx.arc(-ex, ey, 3.7, Math.PI * 1.05, Math.PI * 1.7); ctx.arc(ex, ey, 3.7, Math.PI * 1.3, Math.PI * 1.95); ctx.stroke();
    }
    // brows
    ctx.strokeStyle = hair; ctx.lineWidth = 1.1; ctx.lineCap = "round";
    const by2 = ey - 5.4;
    ctx.beginPath();
    ctx.moveTo(-ex - 3, by2 + (P.awe ? 1.2 : 0)); ctx.quadraticCurveTo(-ex, by2 - 1.4, -ex + 3, by2);
    ctx.moveTo(ex - 3, by2); ctx.quadraticCurveTo(ex, by2 - 1.4, ex + 3, by2 + (P.awe ? 1.2 : 0)); ctx.stroke();
    // tiny nose
    ctx.fillStyle = U.rgba(skinDk, 0.85); ctx.beginPath(); ctx.arc(0, 2.6, 1, 0, U.TAU); ctx.fill();
    // mouth
    ctx.strokeStyle = "#a23b2e"; ctx.lineWidth = 1.4; ctx.lineCap = "round";
    if (P.mouth === "o" || P.mouth === "awe") { ctx.fillStyle = "#7a2b22"; ctx.beginPath(); ctx.arc(0, 7.5, 2, 0, U.TAU); ctx.fill(); }
    else if (P.mouth === "yawn") { ctx.fillStyle = "#7a2b22"; ctx.beginPath(); ctx.ellipse(0, 8, 2.4, 3.4, 0, 0, U.TAU); ctx.fill(); }
    else if (P.mouth === "bashful") { ctx.beginPath(); ctx.arc(0, 5.5, 2.6, 0.12 * Math.PI, 0.88 * Math.PI); ctx.stroke(); }
    else { ctx.beginPath(); ctx.arc(0, 5, 3, 0.12 * Math.PI, 0.88 * Math.PI); ctx.stroke(); }
    // Vaishnava tilak (vertical mark + red dot)
    ctx.fillStyle = "#e23b2e"; ctx.beginPath(); ctx.moveTo(-1.5, -10); ctx.lineTo(1.5, -10); ctx.lineTo(0.8, -2.6); ctx.lineTo(-0.8, -2.6); ctx.closePath(); ctx.fill();
    ctx.fillStyle = "#ffe7b0"; ctx.fillRect(-0.5, -9.4, 1, 5.6);
    ctx.fillStyle = "#e23b2e"; ctx.beginPath(); ctx.arc(0, -8.6, 1.1, 0, U.TAU); ctx.fill();
    ctx.restore(); // head

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

  /* ---------------- forest trees (maze walls) — cartoon style ---------------- */
  Art.bigTree = function (ctx, x, y, s, t, seed) {
    const rnd = srand(seed || 11);
    ctx.save(); ctx.translate(x, y);
    // ground shadow
    ctx.fillStyle = "rgba(0,0,0,0.32)";
    ctx.beginPath(); ctx.ellipse(s * 0.1, s * 0.18, s * 1.15, s * 0.32, 0, 0, U.TAU); ctx.fill();
    // trunk — flat fill with bold outline
    ctx.fillStyle = "#4a2e12";
    ctx.strokeStyle = "#1e0e06"; ctx.lineWidth = 2.5; ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(-s * 0.12, s * 0.14);
    ctx.bezierCurveTo(-s * 0.10, -s * 0.42, -s * 0.13, -s * 0.78, -s * 0.11, -s * 1.06);
    ctx.lineTo(s * 0.11, -s * 1.06);
    ctx.bezierCurveTo(s * 0.13, -s * 0.78, s * 0.10, -s * 0.42, s * 0.12, s * 0.14);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    // single round canopy — dark ring outline, vivid green fill, moonlit highlight
    const sway = Math.sin(t * 0.55 + seed * 0.3) * 3.5;
    const cx = sway, cy = -s * 1.52, cr = s * 0.72;
    // dark outline ring
    ctx.fillStyle = "#1a3818";
    ctx.beginPath(); ctx.arc(cx, cy, cr + 4, 0, U.TAU); ctx.fill();
    // vivid green body
    ctx.fillStyle = "#2e7848";
    ctx.beginPath(); ctx.arc(cx, cy, cr, 0, U.TAU); ctx.fill();
    // mid-green highlight
    ctx.fillStyle = "#4a9e64";
    ctx.beginPath(); ctx.arc(cx - cr * 0.22, cy - cr * 0.22, cr * 0.58, 0, U.TAU); ctx.fill();
    // soft moonlit top
    ctx.fillStyle = "rgba(120,220,150,0.22)";
    ctx.beginPath(); ctx.arc(cx - cr * 0.30, cy - cr * 0.35, cr * 0.30, 0, U.TAU); ctx.fill();
    // bold outline stroke on canopy
    ctx.strokeStyle = "#1a3020"; ctx.lineWidth = 2.8; ctx.lineJoin = "round";
    ctx.beginPath(); ctx.arc(cx, cy, cr, 0, U.TAU); ctx.stroke();
    // ashoka blossoms scattered across canopy
    for (let i = 0; i < 8; i++) {
      const bx = (rnd() - 0.5) * cr * 1.8 + cx, by = cy + (rnd() - 0.5) * cr * 1.8;
      ctx.fillStyle = U.choose(["#ff7a3c", "#ff9a4a", "#ff5d6c", "#ffb24a"]);
      ctx.beginPath(); ctx.arc(bx, by, 2.6 + rnd() * 1.4, 0, U.TAU); ctx.fill();
    }
    ctx.restore();
  };

  Art.smallTree = function (ctx, x, y, s, t, seed) {
    const rnd = srand(seed || 17);
    ctx.save(); ctx.translate(x, y);
    // shadow
    ctx.fillStyle = "rgba(0,0,0,0.24)";
    ctx.beginPath(); ctx.ellipse(s * 0.05, s * 0.12, s * 0.88, s * 0.26, 0, 0, U.TAU); ctx.fill();
    // trunk — flat fill with bold outline
    ctx.fillStyle = "#3a2010";
    ctx.strokeStyle = "#1e0e06"; ctx.lineWidth = 2; ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(-s * 0.1, s * 0.1); ctx.lineTo(-s * 0.08, -s * 0.72);
    ctx.lineTo(s * 0.08, -s * 0.72); ctx.lineTo(s * 0.1, s * 0.1); ctx.closePath(); ctx.fill(); ctx.stroke();
    // single round canopy — cartoon style
    const sway2 = Math.sin(t * 0.7 + seed * 0.5) * 2;
    const cx = sway2, cy = -s * 1.02, cr = s * 0.58;
    // dark outline ring
    ctx.fillStyle = "#1a3818";
    ctx.beginPath(); ctx.arc(cx, cy, cr + 3, 0, U.TAU); ctx.fill();
    // vivid green fill
    ctx.fillStyle = "#2e7848";
    ctx.beginPath(); ctx.arc(cx, cy, cr, 0, U.TAU); ctx.fill();
    // moonlit highlight
    ctx.fillStyle = "#4a9e64";
    ctx.beginPath(); ctx.arc(cx - cr * 0.2, cy - cr * 0.22, cr * 0.52, 0, U.TAU); ctx.fill();
    ctx.fillStyle = "rgba(120,220,150,0.20)";
    ctx.beginPath(); ctx.arc(cx - cr * 0.28, cy - cr * 0.30, cr * 0.26, 0, U.TAU); ctx.fill();
    // bold outline
    ctx.strokeStyle = "#1a3020"; ctx.lineWidth = 2.4; ctx.lineJoin = "round";
    ctx.beginPath(); ctx.arc(cx, cy, cr, 0, U.TAU); ctx.stroke();
    // blossoms
    for (let i = 0; i < 4; i++) {
      const bx = (rnd() - 0.5) * cr * 1.7 + cx, by = cy + (rnd() - 0.5) * cr * 1.7;
      ctx.fillStyle = U.choose(["#ff7a3c", "#ff9a4a", "#ff5d6c"]);
      ctx.beginPath(); ctx.arc(bx, by, 1.8 + rnd(), 0, U.TAU); ctx.fill();
    }
    ctx.restore();
  };

  /* ------------ sky clouds (big, dark dramatic cartoon, for moving layer) ------------ */
  Art.skyCloud = function (ctx, x, y, s, alpha) {
    const a = alpha == null ? 0.75 : alpha;
    ctx.save();
    const lobes = [[0, 0, 1], [-1.1, 0.22, 0.72], [1.1, 0.22, 0.72],
                   [-0.5, -0.36, 0.65], [0.52, -0.32, 0.66],
                   [1.9, 0.35, 0.44], [-1.9, 0.35, 0.44]];
    // deep shadow base
    ctx.globalAlpha = a;
    ctx.fillStyle = "#0e1e3a";
    ctx.beginPath(); lobes.forEach(l => ctx.arc(x + l[0] * s, y + l[1] * s + 9, l[2] * s, 0, U.TAU)); ctx.fill();
    // dark blue-grey main body
    ctx.fillStyle = "#1e3050";
    ctx.beginPath(); lobes.forEach(l => ctx.arc(x + l[0] * s, y + l[1] * s, l[2] * s, 0, U.TAU)); ctx.fill();
    // bold dark outline
    ctx.strokeStyle = "#0a1222"; ctx.lineWidth = 2.5; ctx.lineJoin = "round";
    lobes.forEach(l => { ctx.beginPath(); ctx.arc(x + l[0] * s, y + l[1] * s, l[2] * s, 0, U.TAU); ctx.stroke(); });
    // moonlit highlight — bright white top catches the moon
    ctx.fillStyle = "rgba(180,210,255,0.55)";
    ctx.beginPath(); ctx.arc(x - 0.18 * s, y - 0.30 * s, s * 0.52, 0, U.TAU); ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.88)";
    ctx.beginPath(); ctx.arc(x - 0.22 * s, y - 0.38 * s, s * 0.28, 0, U.TAU); ctx.fill();
    ctx.restore();
  };

  /* ------------ subtle perspective ground grid (3-D feel) ------------ */
  Art.perspectiveGround = function (ctx) {
    const vpX = DG.W * 0.5, vpY = DG.H * 0.18; // vanishing point
    ctx.save(); ctx.globalAlpha = 0.07; ctx.strokeStyle = "#c89650"; ctx.lineWidth = 1;
    // converging vertical lines
    for (let i = 0; i <= 10; i++) {
      const bx = (i / 10) * DG.W;
      ctx.beginPath(); ctx.moveTo(vpX + (bx - vpX) * 0.12, vpY + (DG.H - vpY) * 0.12); ctx.lineTo(bx, DG.H); ctx.stroke();
    }
    // horizontal parallel lines (spacing compressed toward top)
    for (let i = 1; i <= 10; i++) {
      const k = Math.pow(i / 10, 1.7);
      const y = vpY + (DG.H - vpY) * k;
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(DG.W, y); ctx.stroke();
    }
    ctx.restore();
  };

  /* ------------ warm earthy path texture along corridors ------------ */
  // Call after groundWash so corridors show warm earth when fog lifts.
  Art.groundPath = function (ctx, pts, rad) {
    if (!pts || !pts.length) return;
    rad = rad || 14;
    ctx.save();
    // dark earthy base — richer brown than the blue-indigo ground
    ctx.globalAlpha = 0.54;
    ctx.fillStyle = "#3a2010";
    ctx.beginPath();
    for (let i = 0; i < pts.length; i += 3) {
      ctx.arc(pts[i].x, pts[i].y, rad, 0, U.TAU);
    }
    ctx.fill();
    // warm sandy highlight
    ctx.globalAlpha = 0.26;
    ctx.fillStyle = "#7a5028";
    ctx.beginPath();
    for (let i = 1; i < pts.length; i += 4) {
      ctx.arc(pts[i].x, pts[i].y, rad * 0.52, 0, U.TAU);
    }
    ctx.fill();
    ctx.restore();
  };

  /* ------------ gate / archway at maze chokepoints ------------ */
  Art.gate = function (ctx, x, y, open) {
    ctx.save(); ctx.translate(x, y);
    const w = 38, h = 52;
    // shadow
    ctx.fillStyle = "rgba(0,0,0,0.3)";
    ctx.beginPath(); ctx.ellipse(0, h * 0.55, w * 0.6, 8, 0, 0, U.TAU); ctx.fill();
    const wood = "#5a3010", woodLt = "#7a4820", woodDk = "#2e180a";
    // two pillars
    for (const sx of [-w / 2 + 5, w / 2 - 5]) {
      const pg = ctx.createLinearGradient(sx - 5, 0, sx + 5, 0);
      pg.addColorStop(0, woodDk); pg.addColorStop(0.5, woodLt); pg.addColorStop(1, woodDk);
      ctx.fillStyle = pg;
      U.roundRect(ctx, sx - 6, -h + 6, 12, h, 3); ctx.fill();
    }
    // crossbeam
    const bg = ctx.createLinearGradient(0, -h + 2, 0, -h + 18);
    bg.addColorStop(0, woodLt); bg.addColorStop(1, wood);
    ctx.fillStyle = bg;
    U.roundRect(ctx, -w / 2, -h, w, 14, 4); ctx.fill();
    // arched opening cutout
    ctx.fillStyle = open ? "rgba(0,0,0,0)" : U.rgba("#2a1008", 0.7);
    ctx.beginPath();
    ctx.arc(0, -h + 14, 13, Math.PI, 0); ctx.lineTo(13, -h * 0.4); ctx.lineTo(-13, -h * 0.4); ctx.closePath(); ctx.fill();
    // gem on top
    ctx.fillStyle = "#ffcf3f";
    ctx.beginPath(); ctx.arc(0, -h + 2, 4.5, 0, U.TAU); ctx.fill();
    ctx.fillStyle = "#ff4080";
    ctx.beginPath(); ctx.arc(0, -h + 2, 2.5, 0, U.TAU); ctx.fill();
    ctx.restore();
  };
})();
