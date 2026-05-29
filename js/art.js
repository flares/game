/* =====================================================================
   Divya Gatha — art.js
   Procedural, hand-drawn-in-code visuals: skies, sun, clouds, mountains,
   ocean, temples, diyas, lotuses — and the characters (Hanumanthudu,
   Ramudu, Sitamma, Arjunudu, vanaras, the striped squirrel) plus props
   (floating "రామ" stones, the Matsya-Yantra fish wheel).
   All functions draw in the engine's virtual coordinate space.
   ===================================================================== */
(function () {
  "use strict";
  const DG = window.DG;
  const U = DG.util;
  const Art = (DG.Art = {});

  // deterministic pseudo-random for stable silhouettes
  function srand(seed) {
    let s = seed % 2147483647; if (s <= 0) s += 2147483646;
    return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
  }

  /* ---------------- generic glows / halos ---------------- */
  Art.glow = function (ctx, x, y, r, color, a) {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, U.rgba(color, a == null ? 0.9 : a));
    g.addColorStop(1, U.rgba(color, 0));
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(x, y, r, 0, U.TAU); ctx.fill();
  };

  Art.halo = function (ctx, x, y, r, t, color) {
    color = color || "#ffe9a8";
    const pulse = 1 + Math.sin(t * 2) * 0.04;
    Art.glow(ctx, x, y, r * 1.5 * pulse, color, 0.55);
    ctx.save();
    ctx.strokeStyle = U.rgba(color, 0.85);
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(x, y, r, 0, U.TAU); ctx.stroke();
    // tiny rays
    ctx.strokeStyle = U.rgba(color, 0.5);
    ctx.lineWidth = 2;
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * U.TAU + t * 0.3;
      ctx.beginPath();
      ctx.moveTo(x + Math.cos(a) * (r + 3), y + Math.sin(a) * (r + 3));
      ctx.lineTo(x + Math.cos(a) * (r + 10 + Math.sin(t * 3 + i) * 3), y + Math.sin(a) * (r + 10));
      ctx.stroke();
    }
    ctx.restore();
  };

  /* ---------------- sky ---------------- */
  // stops: array of [pos, color]
  Art.sky = function (ctx, stops) {
    const g = ctx.createLinearGradient(0, 0, 0, DG.H);
    stops.forEach((s) => g.addColorStop(s[0], s[1]));
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, DG.W, DG.H);
  };

  Art.stars = function (ctx, t, n, ybottom) {
    const rnd = srand(99);
    ctx.save();
    for (let i = 0; i < n; i++) {
      const x = rnd() * DG.W;
      const y = rnd() * (ybottom || DG.H * 0.5);
      const tw = 0.5 + 0.5 * Math.sin(t * 2 + i * 1.7);
      ctx.globalAlpha = 0.35 + tw * 0.5;
      ctx.fillStyle = "#fff7e0";
      ctx.beginPath(); ctx.arc(x, y, 1.2 + tw * 1.3, 0, U.TAU); ctx.fill();
    }
    ctx.restore();
  };

  Art.sun = function (ctx, x, y, r, t, core, edge, rays) {
    core = core || "#fff3c4"; edge = edge || "#ffb347";
    Art.glow(ctx, x, y, r * 3.2, edge, 0.5);
    if (rays !== false) {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(t * 0.05);
      ctx.fillStyle = U.rgba(edge, 0.22);
      for (let i = 0; i < 12; i++) {
        ctx.rotate(U.TAU / 12);
        ctx.beginPath();
        ctx.moveTo(0, -r * 1.2);
        ctx.lineTo(r * 0.5, -r * 3.6);
        ctx.lineTo(-r * 0.5, -r * 3.6);
        ctx.closePath(); ctx.fill();
      }
      ctx.restore();
    }
    const g = ctx.createRadialGradient(x, y, r * 0.2, x, y, r);
    g.addColorStop(0, "#fffdf0");
    g.addColorStop(0.6, core);
    g.addColorStop(1, edge);
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(x, y, r, 0, U.TAU); ctx.fill();
  };

  Art.moon = function (ctx, x, y, r) {
    Art.glow(ctx, x, y, r * 2.6, "#cfe2ff", 0.4);
    const g = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, r * 0.2, x, y, r);
    g.addColorStop(0, "#ffffff");
    g.addColorStop(1, "#cdd8f0");
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(x, y, r, 0, U.TAU); ctx.fill();
    ctx.fillStyle = "rgba(150,170,210,0.25)";
    ctx.beginPath(); ctx.arc(x + r * 0.3, y - r * 0.2, r * 0.18, 0, U.TAU); ctx.fill();
    ctx.beginPath(); ctx.arc(x - r * 0.2, y + r * 0.3, r * 0.13, 0, U.TAU); ctx.fill();
  };

  /* ---------------- clouds ---------------- */
  Art.cloud = function (ctx, x, y, s, color, a) {
    color = color || "#ffffff";
    ctx.save();
    ctx.globalAlpha = a == null ? 0.9 : a;
    ctx.fillStyle = color;
    const lobes = [[0, 0, 1], [-0.9, 0.15, 0.75], [0.9, 0.15, 0.75], [-0.45, -0.35, 0.7], [0.5, -0.3, 0.72], [1.6, 0.3, 0.5], [-1.6, 0.3, 0.5]];
    ctx.beginPath();
    lobes.forEach((l) => ctx.arc(x + l[0] * s, y + l[1] * s, l[2] * s, 0, U.TAU));
    ctx.fill();
    ctx.restore();
  };

  /* ---------------- mountains / hills ---------------- */
  Art.hills = function (ctx, baseY, height, color, seed, segs) {
    segs = segs || 8;
    const rnd = srand(seed);
    const pts = [];
    for (let i = 0; i <= segs; i++) {
      pts.push([(i / segs) * DG.W, baseY - (0.35 + rnd() * 0.65) * height]);
    }
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(0, baseY);
    ctx.lineTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) {
      const xc = (pts[i - 1][0] + pts[i][0]) / 2;
      const yc = (pts[i - 1][1] + pts[i][1]) / 2;
      ctx.quadraticCurveTo(pts[i - 1][0], pts[i - 1][1], xc, yc);
    }
    ctx.lineTo(DG.W, baseY);
    ctx.closePath();
    ctx.fill();
  };

  /* ---------------- ocean ---------------- */
  // animated sea filling y0..y1; pal: {deep, mid, light, foam}
  Art.ocean = function (ctx, y0, y1, t, pal, scroll) {
    pal = pal || { deep: "#0b3a63", mid: "#1d6fa5", light: "#4aa6cf", foam: "#cdeefb" };
    scroll = scroll || 0;
    const g = ctx.createLinearGradient(0, y0, 0, y1);
    g.addColorStop(0, pal.light);
    g.addColorStop(0.4, pal.mid);
    g.addColorStop(1, pal.deep);
    ctx.fillStyle = g;
    ctx.fillRect(0, y0, DG.W, y1 - y0);

    // moving shimmer bands
    ctx.save();
    ctx.beginPath(); ctx.rect(0, y0, DG.W, y1 - y0); ctx.clip();
    const bands = 7;
    for (let i = 0; i < bands; i++) {
      const yy = y0 + (i + 0.5) / bands * (y1 - y0);
      const amp = 5 + i * 2.2;
      const k = i / bands;
      ctx.strokeStyle = U.rgba(pal.foam, 0.10 + 0.06 * (1 - k));
      ctx.lineWidth = 2 + i * 0.6;
      ctx.beginPath();
      for (let x = -20; x <= DG.W + 20; x += 14) {
        const yo = yy + Math.sin((x * 0.018) + t * (1.0 + i * 0.25) + scroll * 0.01 + i) * amp;
        if (x === -20) ctx.moveTo(x, yo); else ctx.lineTo(x, yo);
      }
      ctx.stroke();
    }
    // sparkle glints
    const rnd = srand(7);
    for (let i = 0; i < 26; i++) {
      const x = (rnd() * DG.W + t * 6 * (rnd() > .5 ? 1 : -1)) % DG.W;
      const yy = y0 + rnd() * (y1 - y0) * 0.7;
      const tw = Math.sin(t * 3 + i * 2);
      if (tw > 0.6) {
        ctx.fillStyle = U.rgba(pal.foam, (tw - 0.6) * 1.6);
        ctx.fillRect((x + DG.W) % DG.W, yy, 3, 1.5);
      }
    }
    ctx.restore();
  };

  // surface waterline with foam at given y
  Art.waterline = function (ctx, y, t, color) {
    ctx.save();
    ctx.strokeStyle = color || "#dff4ff";
    ctx.lineWidth = 3; ctx.globalAlpha = 0.7;
    ctx.beginPath();
    for (let x = 0; x <= DG.W; x += 12) {
      const yo = y + Math.sin(x * 0.03 + t * 2) * 4;
      if (x === 0) ctx.moveTo(x, yo); else ctx.lineTo(x, yo);
    }
    ctx.stroke();
    ctx.restore();
  };

  /* ---------------- flora & ornaments ---------------- */
  Art.lotus = function (ctx, x, y, s, color, t) {
    color = color || "#ff8fb0";
    t = t || 0;
    ctx.save();
    ctx.translate(x, y);
    const petals = 8;
    for (let layer = 0; layer < 2; layer++) {
      const r = layer === 0 ? s : s * 0.7;
      const col = layer === 0 ? color : U.mix(color, "#ffffff", 0.35);
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
    ctx.fillStyle = "#ffd86b";
    ctx.beginPath(); ctx.arc(0, 0, s * 0.32, 0, U.TAU); ctx.fill();
    ctx.restore();
  };

  // oil lamp; lit flame flickers with t
  Art.diya = function (ctx, x, y, s, lit, t) {
    ctx.save();
    ctx.translate(x, y);
    // bowl
    const g = ctx.createLinearGradient(0, 0, 0, s * 0.6);
    g.addColorStop(0, "#c8732e");
    g.addColorStop(1, "#7a3d12");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(-s, 0);
    ctx.quadraticCurveTo(0, s * 0.95, s, 0);
    ctx.quadraticCurveTo(s * 0.6, -s * 0.18, 0, -s * 0.18);
    ctx.quadraticCurveTo(-s * 0.6, -s * 0.18, -s, 0);
    ctx.fill();
    ctx.fillStyle = "#e7a85a";
    ctx.beginPath(); ctx.ellipse(0, -s * 0.16, s * 0.85, s * 0.16, 0, 0, U.TAU); ctx.fill();
    if (lit) {
      const fl = 1 + Math.sin(t * 12 + x) * 0.12;
      Art.glow(ctx, 0, -s * 0.9, s * 2.4, "#ffd36b", 0.6);
      const fg = ctx.createLinearGradient(0, -s * 0.2, 0, -s * 1.7);
      fg.addColorStop(0, "#ff7b2e");
      fg.addColorStop(0.5, "#ffd24a");
      fg.addColorStop(1, "#fff7d0");
      ctx.fillStyle = fg;
      ctx.beginPath();
      ctx.moveTo(0, -s * 0.2);
      ctx.quadraticCurveTo(s * 0.4 * fl, -s * 0.8, 0, -s * 1.6 * fl);
      ctx.quadraticCurveTo(-s * 0.4 * fl, -s * 0.8, 0, -s * 0.2);
      ctx.fill();
    }
    ctx.restore();
  };

  // mango-leaf garland (toran) hung from y across given width
  Art.toran = function (ctx, x0, x1, y, color) {
    color = color || "#2e8b3d";
    const n = Math.floor((x1 - x0) / 34);
    ctx.save();
    ctx.strokeStyle = "#7a4a16"; ctx.lineWidth = 3;
    ctx.beginPath();
    for (let i = 0; i <= n; i++) {
      const x = U.lerp(x0, x1, i / n);
      const yy = y + Math.sin(i / n * Math.PI) * 6;
      if (i === 0) ctx.moveTo(x, yy); else ctx.lineTo(x, yy);
    }
    ctx.stroke();
    for (let i = 0; i <= n; i++) {
      const x = U.lerp(x0, x1, i / n);
      const yy = y + Math.sin(i / n * Math.PI) * 6;
      const leaf = (i % 2 === 0) ? color : U.mix(color, "#ffd24a", 0.5);
      ctx.fillStyle = leaf;
      ctx.beginPath();
      ctx.moveTo(x, yy);
      ctx.quadraticCurveTo(x - 7, yy + 14, x, yy + 26);
      ctx.quadraticCurveTo(x + 7, yy + 14, x, yy);
      ctx.fill();
    }
    ctx.restore();
  };

  Art.tree = function (ctx, x, y, s, leaf, trunk) {
    leaf = leaf || "#2f7d4f"; trunk = trunk || "#6b4423";
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = trunk;
    U.roundRect(ctx, -s * 0.08, -s, s * 0.16, s, s * 0.05); ctx.fill();
    const blobs = [[0, -s * 1.2, 0.55], [-0.4, -s * 0.95 / s, 0.4], [0.42, -1.0, 0.42], [0, -1.55, 0.42]];
    ctx.fillStyle = leaf;
    ctx.beginPath();
    [[0, -1.2, 0.6], [-0.45, -1.0, 0.45], [0.45, -1.0, 0.45], [0, -1.55, 0.45], [-0.25, -1.45, 0.35], [0.28, -1.45, 0.35]].forEach((b) =>
      ctx.arc(b[0] * s, b[1] * s, b[2] * s, 0, U.TAU));
    ctx.fill();
    ctx.fillStyle = U.mix(leaf, "#ffffff", 0.18);
    ctx.beginPath();
    ctx.arc(-0.2 * s, -1.4 * s, 0.3 * s, 0, U.TAU);
    ctx.arc(0.18 * s, -1.2 * s, 0.26 * s, 0, U.TAU);
    ctx.fill();
    ctx.restore();
  };

  // simple temple / gopuram silhouette
  Art.temple = function (ctx, x, y, s, color) {
    color = color || "#3a2a5e";
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = color;
    // base
    U.roundRect(ctx, -s, -s * 0.9, s * 2, s * 0.9, 6); ctx.fill();
    // tiers
    for (let i = 0; i < 3; i++) {
      const w = s * (1.5 - i * 0.35);
      const h = s * 0.4;
      const yy = -s * 0.9 - i * h;
      ctx.beginPath();
      ctx.moveTo(-w / 2, yy);
      ctx.lineTo(w / 2, yy);
      ctx.lineTo(w / 2 - s * 0.12, yy - h);
      ctx.lineTo(-w / 2 + s * 0.12, yy - h);
      ctx.closePath(); ctx.fill();
    }
    // kalasham dome
    const topY = -s * 0.9 - 3 * s * 0.4;
    ctx.beginPath(); ctx.arc(0, topY, s * 0.16, 0, U.TAU); ctx.fill();
    ctx.fillStyle = "#ffd86b";
    ctx.beginPath(); ctx.arc(0, topY - s * 0.16, s * 0.05, 0, U.TAU); ctx.fill();
    // doorway glow
    ctx.fillStyle = "rgba(255,200,90,0.5)";
    U.roundRect(ctx, -s * 0.18, -s * 0.6, s * 0.36, s * 0.6, 4); ctx.fill();
    ctx.restore();
  };

  Art.star = function (ctx, x, y, r, filled, t) {
    ctx.save();
    ctx.translate(x, y);
    if (filled) {
      Art.glow(ctx, 0, 0, r * 2, "#ffd86b", 0.5);
      const g = ctx.createLinearGradient(0, -r, 0, r);
      g.addColorStop(0, "#fff3b0"); g.addColorStop(1, "#ffb43c");
      ctx.fillStyle = g; ctx.strokeStyle = "#b5701a"; ctx.lineWidth = 2;
      U.starPath(ctx, 0, 0, 5, r, r * 0.45); ctx.fill(); ctx.stroke();
    } else {
      ctx.fillStyle = "rgba(255,255,255,0.12)";
      ctx.strokeStyle = "rgba(255,255,255,0.4)"; ctx.lineWidth = 2;
      U.starPath(ctx, 0, 0, 5, r, r * 0.45); ctx.fill(); ctx.stroke();
    }
    ctx.restore();
  };

  // golden flower / blessing token (collectible)
  Art.blessing = function (ctx, x, y, r, t) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(t * 0.8);
    Art.glow(ctx, 0, 0, r * 2.4, "#ffe07a", 0.5);
    ctx.fillStyle = "#ffd24a";
    for (let i = 0; i < 6; i++) {
      ctx.rotate(U.TAU / 6);
      ctx.beginPath();
      ctx.ellipse(0, -r * 0.8, r * 0.42, r * 0.8, 0, 0, U.TAU);
      ctx.fill();
    }
    ctx.fillStyle = "#fff2c0";
    ctx.beginPath(); ctx.arc(0, 0, r * 0.5, 0, U.TAU); ctx.fill();
    ctx.fillStyle = "#e89c2b";
    ctx.beginPath(); ctx.arc(0, 0, r * 0.26, 0, U.TAU); ctx.fill();
    ctx.restore();
  };

  /* =====================================================================
     CHARACTERS
     ===================================================================== */

  // friendly face helper (used for human figures). Draws eyes+smile.
  function face(ctx, r, opts) {
    opts = opts || {};
    ctx.fillStyle = "#1a1a2a";
    const ex = r * 0.32, ey = -r * 0.05, er = r * 0.13;
    ctx.beginPath(); ctx.arc(-ex, ey, er, 0, U.TAU); ctx.arc(ex, ey, er, 0, U.TAU); ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.beginPath(); ctx.arc(-ex + er * 0.3, ey - er * 0.3, er * 0.35, 0, U.TAU); ctx.arc(ex + er * 0.3, ey - er * 0.3, er * 0.35, 0, U.TAU); ctx.fill();
    // smile
    ctx.strokeStyle = "#a23b2e"; ctx.lineWidth = r * 0.07; ctx.lineCap = "round";
    ctx.beginPath(); ctx.arc(0, r * 0.18, r * 0.34, 0.2 * Math.PI, 0.8 * Math.PI); ctx.stroke();
    if (opts.tilak) {
      ctx.fillStyle = opts.tilak;
      ctx.beginPath();
      ctx.moveTo(0, -r * 0.55); ctx.lineTo(-r * 0.08, -r * 0.2); ctx.lineTo(r * 0.08, -r * 0.2);
      ctx.closePath(); ctx.fill();
    }
  }

  // crown / mukut
  function crown(ctx, r, color) {
    color = color || "#ffd24a";
    ctx.fillStyle = color; ctx.strokeStyle = "#b5701a"; ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-r * 0.7, -r * 0.7);
    ctx.lineTo(-r * 0.7, -r * 1.05);
    ctx.lineTo(-r * 0.35, -r * 0.75);
    ctx.lineTo(0, -r * 1.25);
    ctx.lineTo(r * 0.35, -r * 0.75);
    ctx.lineTo(r * 0.7, -r * 1.05);
    ctx.lineTo(r * 0.7, -r * 0.7);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = "#ff5a7a";
    ctx.beginPath(); ctx.arc(0, -r * 0.85, r * 0.1, 0, U.TAU); ctx.fill();
  }

  /* ---- Hanumanthudu — flying, with mace, tail, halo (divine) ---- */
  // x,y at chest center. dir +1 faces right. flap 0..1 animates limbs.
  Art.hanuman = function (ctx, x, y, s, t, opts) {
    opts = opts || {};
    const flap = opts.flap == null ? (0.5 + 0.5 * Math.sin(t * 6)) : opts.flap;
    const dir = opts.dir || 1;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(dir * s, s);
    if (opts.lean) ctx.rotate(opts.lean);

    const skin = "#f0892f", skinDk = "#cf6c1c", muzzle = "#ffd9a0";
    const headR = 24;
    const headX = 30, headY = -34;

    // halo behind head (divine glow)
    Art.halo(ctx, headX, headY, headR + 6, t);

    // tail curling up behind
    ctx.strokeStyle = skin; ctx.lineWidth = 12; ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(-18, 6);
    ctx.quadraticCurveTo(-70, 10 + flap * 8, -64, -54 - flap * 10);
    ctx.quadraticCurveTo(-60, -86, -34, -78);
    ctx.stroke();
    ctx.fillStyle = "#ffe6c0"; // tail tuft
    ctx.beginPath(); ctx.arc(-34, -78, 8, 0, U.TAU); ctx.fill();

    // back leg
    ctx.strokeStyle = skinDk; ctx.lineWidth = 15; ctx.lineCap = "round";
    ctx.beginPath(); ctx.moveTo(-6, 12); ctx.quadraticCurveTo(-34, 30, -50, 18 + flap * 6); ctx.stroke();
    // dhoti (gold cloth)
    ctx.fillStyle = "#ffcf3f";
    ctx.beginPath();
    ctx.moveTo(-14, -4); ctx.lineTo(16, -4); ctx.quadraticCurveTo(22, 26, 4, 30);
    ctx.quadraticCurveTo(-18, 32, -20, 6); ctx.closePath(); ctx.fill();
    // front leg
    ctx.strokeStyle = skin; ctx.lineWidth = 15;
    ctx.beginPath(); ctx.moveTo(8, 14); ctx.quadraticCurveTo(34, 26, 54, 36 - flap * 6); ctx.stroke();

    // torso
    const tg = ctx.createLinearGradient(-20, -20, 24, 24);
    tg.addColorStop(0, skin); tg.addColorStop(1, skinDk);
    ctx.fillStyle = tg;
    ctx.beginPath(); ctx.ellipse(2, -6, 24, 26, -0.2, 0, U.TAU); ctx.fill();
    // chest sash
    ctx.strokeStyle = "#e23b3b"; ctx.lineWidth = 6;
    ctx.beginPath(); ctx.moveTo(-16, -22); ctx.lineTo(20, 8); ctx.stroke();

    // back arm raising the gada (mace)
    ctx.strokeStyle = skinDk; ctx.lineWidth = 12;
    const maceA = -0.5 - flap * 0.5;
    const mx = 14 + Math.cos(maceA) * 30, my = -28 + Math.sin(maceA) * 30;
    ctx.beginPath(); ctx.moveTo(8, -18); ctx.lineTo(mx, my); ctx.stroke();
    // gada
    ctx.save();
    ctx.translate(mx, my); ctx.rotate(maceA - Math.PI / 2);
    ctx.strokeStyle = "#caa24a"; ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -34); ctx.stroke();
    const mg = ctx.createRadialGradient(0, -44, 2, 0, -44, 16);
    mg.addColorStop(0, "#ffe9a8"); mg.addColorStop(1, "#c8922f");
    ctx.fillStyle = mg; ctx.beginPath(); ctx.arc(0, -44, 14, 0, U.TAU); ctx.fill();
    ctx.restore();

    // front arm reaching forward
    ctx.strokeStyle = skin; ctx.lineWidth = 12;
    ctx.beginPath(); ctx.moveTo(14, -10); ctx.quadraticCurveTo(40, -6, 56, -16 - flap * 4); ctx.stroke();
    ctx.fillStyle = muzzle; ctx.beginPath(); ctx.arc(58, -17 - flap * 4, 7, 0, U.TAU); ctx.fill();

    // head
    ctx.fillStyle = skin;
    ctx.beginPath(); ctx.arc(headX, headY, headR, 0, U.TAU); ctx.fill();
    // ears
    ctx.beginPath(); ctx.arc(headX - headR * 0.9, headY - 2, 8, 0, U.TAU); ctx.arc(headX + headR * 0.9, headY - 2, 8, 0, U.TAU); ctx.fill();
    ctx.fillStyle = muzzle; ctx.beginPath(); ctx.arc(headX - headR * 0.9, headY - 2, 4, 0, U.TAU); ctx.arc(headX + headR * 0.9, headY - 2, 4, 0, U.TAU); ctx.fill();
    // muzzle
    ctx.fillStyle = muzzle;
    ctx.beginPath(); ctx.ellipse(headX + 8, headY + 8, 15, 12, 0, 0, U.TAU); ctx.fill();
    // crown
    ctx.save(); ctx.translate(headX, headY); crown(ctx, headR); ctx.restore();
    // face
    ctx.save(); ctx.translate(headX + 4, headY + 2);
    ctx.fillStyle = "#1a1a2a";
    ctx.beginPath(); ctx.arc(-2, -2, 3.2, 0, U.TAU); ctx.arc(12, -2, 3.2, 0, U.TAU); ctx.fill();
    ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(-1, -3, 1.1, 0, U.TAU); ctx.arc(13, -3, 1.1, 0, U.TAU); ctx.fill();
    ctx.strokeStyle = "#a23b2e"; ctx.lineWidth = 2.2; ctx.lineCap = "round";
    ctx.beginPath(); ctx.arc(6, 6, 6, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke();
    // tilak
    ctx.fillStyle = "#e23b3b"; ctx.beginPath(); ctx.moveTo(5, -10); ctx.lineTo(3, -2); ctx.lineTo(7, -2); ctx.closePath(); ctx.fill();
    ctx.restore();

    ctx.restore();
  };

  /* ---- Generic divine/human figure (Ramudu, Sitamma, etc.) ---- */
  // opts: skin, robe, robe2, crown(bool), bow(bool), halo(bool), tilak
  Art.deva = function (ctx, x, y, s, t, opts) {
    opts = opts || {};
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s, s);
    const skin = opts.skin || "#7aa6d6";
    const robe = opts.robe || "#ffd24a";
    const robe2 = opts.robe2 || U.mix(robe, "#000000", 0.18);
    const headR = 18, headY = -56;

    if (opts.halo) Art.halo(ctx, 0, headY, headR + 5, t, opts.haloColor);

    // robe / lower body
    const rg = ctx.createLinearGradient(0, -30, 0, 40);
    rg.addColorStop(0, robe); rg.addColorStop(1, robe2);
    ctx.fillStyle = rg;
    ctx.beginPath();
    ctx.moveTo(-16, -30); ctx.lineTo(16, -30);
    ctx.quadraticCurveTo(26, 30, 14, 40); ctx.lineTo(-14, 40);
    ctx.quadraticCurveTo(-26, 30, -16, -30); ctx.closePath(); ctx.fill();
    // sash
    ctx.fillStyle = U.mix(robe, "#ffffff", 0.35);
    ctx.beginPath(); ctx.moveTo(-16, -26); ctx.lineTo(16, -26); ctx.lineTo(12, -16); ctx.lineTo(-12, -16); ctx.closePath(); ctx.fill();
    // arms
    ctx.strokeStyle = skin; ctx.lineWidth = 9; ctx.lineCap = "round";
    ctx.beginPath(); ctx.moveTo(-12, -26); ctx.quadraticCurveTo(-26, -6, -22, 14); ctx.stroke();
    if (opts.bow) {
      // holding a bow on the right
      ctx.beginPath(); ctx.moveTo(12, -26); ctx.quadraticCurveTo(30, -16, 30, 2); ctx.stroke();
      ctx.strokeStyle = "#8a5a22"; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.arc(38, -16, 30, -0.7 * Math.PI, 0.0 * Math.PI); ctx.stroke();
      ctx.strokeStyle = "#eee"; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(38 + Math.cos(-0.7 * Math.PI) * 30, -16 + Math.sin(-0.7 * Math.PI) * 30);
      ctx.lineTo(38 + Math.cos(0) * 30, -16); ctx.stroke();
    } else {
      ctx.beginPath(); ctx.moveTo(12, -26); ctx.quadraticCurveTo(26, -6, 22, 14); ctx.stroke();
    }
    // neck + head
    ctx.fillStyle = skin;
    ctx.fillRect(-5, headY + headR - 4, 10, 10);
    ctx.beginPath(); ctx.arc(0, headY, headR, 0, U.TAU); ctx.fill();
    // hair
    ctx.fillStyle = opts.hair || "#241a14";
    ctx.beginPath(); ctx.arc(0, headY - 2, headR, Math.PI, U.TAU); ctx.fill();
    ctx.beginPath(); ctx.arc(-headR * 0.8, headY, 5, 0, U.TAU); ctx.arc(headR * 0.8, headY, 5, 0, U.TAU); ctx.fill();
    if (opts.crown) { ctx.save(); ctx.translate(0, headY); crown(ctx, headR, opts.crownColor); ctx.restore(); }
    // face
    ctx.save(); ctx.translate(0, headY); face(ctx, headR, { tilak: opts.tilak }); ctx.restore();
    ctx.restore();
  };

  Art.ramudu = function (ctx, x, y, s, t, opts) {
    opts = opts || {};
    Art.deva(ctx, x, y, s, t, Object.assign({ skin: "#6f9ad6", robe: "#ffd24a", crown: true, bow: opts.bow, halo: true, haloColor: "#bfe0ff", tilak: "#e23b3b", hair: "#1b1430" }, opts));
  };
  Art.lakshmana = function (ctx, x, y, s, t, opts) {
    Art.deva(ctx, x, y, s, t, Object.assign({ skin: "#e0a06a", robe: "#9be0a8", robe2: "#4fa86a", crown: true, halo: true, haloColor: "#d9ffe0", tilak: "#e23b3b" }, opts || {}));
  };
  Art.sitamma = function (ctx, x, y, s, t, opts) {
    Art.deva(ctx, x, y, s, t, Object.assign({ skin: "#f2c79b", robe: "#ff6f8e", robe2: "#c83f63", crown: false, halo: true, haloColor: "#ffd9e6", hair: "#1b1208" }, opts || {}));
  };
  Art.arjunudu = function (ctx, x, y, s, t, opts) {
    Art.deva(ctx, x, y, s, t, Object.assign({ skin: "#cf9a63", robe: "#8fd0e6", robe2: "#3f86a8", crown: true, crownColor: "#ffd24a", halo: false, tilak: "#e23b3b", hair: "#1b1430" }, opts || {}));
  };

  /* ---- Vanara (monkey helper) carrying a stone ---- */
  Art.vanara = function (ctx, x, y, s, t, opts) {
    opts = opts || {};
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    const fur = opts.fur || "#a86a3a", furDk = U.mix(opts.fur || "#a86a3a", "#000", 0.25);
    const bob = Math.sin(t * 6) * 2;
    ctx.translate(0, bob);
    // tail
    ctx.strokeStyle = fur; ctx.lineWidth = 7; ctx.lineCap = "round";
    ctx.beginPath(); ctx.moveTo(-10, 14); ctx.quadraticCurveTo(-30, 6, -26, -20); ctx.stroke();
    // legs
    ctx.lineWidth = 9;
    ctx.beginPath(); ctx.moveTo(-6, 16); ctx.lineTo(-8, 34); ctx.moveTo(8, 16); ctx.lineTo(10, 34); ctx.stroke();
    // body
    ctx.fillStyle = furDk; ctx.beginPath(); ctx.ellipse(0, 2, 16, 18, 0, 0, U.TAU); ctx.fill();
    ctx.fillStyle = "#e7c79a"; ctx.beginPath(); ctx.ellipse(0, 6, 8, 11, 0, 0, U.TAU); ctx.fill();
    // arms up holding stone
    ctx.strokeStyle = fur; ctx.lineWidth = 8;
    ctx.beginPath(); ctx.moveTo(-12, -6); ctx.lineTo(-14, -24); ctx.moveTo(12, -6); ctx.lineTo(14, -24); ctx.stroke();
    // head
    ctx.fillStyle = fur; ctx.beginPath(); ctx.arc(0, -20, 13, 0, U.TAU); ctx.fill();
    ctx.beginPath(); ctx.arc(-12, -22, 5, 0, U.TAU); ctx.arc(12, -22, 5, 0, U.TAU); ctx.fill();
    ctx.fillStyle = "#e7c79a"; ctx.beginPath(); ctx.ellipse(0, -16, 9, 7, 0, 0, U.TAU); ctx.fill();
    ctx.fillStyle = "#1a1a2a"; ctx.beginPath(); ctx.arc(-4, -22, 2.2, 0, U.TAU); ctx.arc(4, -22, 2.2, 0, U.TAU); ctx.fill();
    ctx.restore();
  };

  /* ---- The famous little squirrel (three light stripes from Ramudu's fingers) ---- */
  Art.squirrel = function (ctx, x, y, s, t, opts) {
    opts = opts || {};
    ctx.save(); ctx.translate(x, y); ctx.scale((opts.dir || 1) * s, s);
    const body = "#8a6a4a", belly = "#e8d3b0";
    const bob = Math.sin(t * 10) * 1.2;
    ctx.translate(0, bob);
    // big fluffy tail
    const tg = ctx.createLinearGradient(-20, -20, 0, 6);
    tg.addColorStop(0, U.mix(body, "#fff", 0.25)); tg.addColorStop(1, body);
    ctx.fillStyle = tg;
    ctx.beginPath();
    ctx.moveTo(-6, 6);
    ctx.quadraticCurveTo(-34, 8, -30, -22);
    ctx.quadraticCurveTo(-26, -44, -6, -34);
    ctx.quadraticCurveTo(-18, -22, -6, 6);
    ctx.fill();
    // body
    ctx.fillStyle = body; ctx.beginPath(); ctx.ellipse(2, 0, 12, 14, -0.2, 0, U.TAU); ctx.fill();
    ctx.fillStyle = belly; ctx.beginPath(); ctx.ellipse(5, 2, 6, 9, -0.2, 0, U.TAU); ctx.fill();
    // three stripes
    ctx.strokeStyle = "#f3e6c8"; ctx.lineWidth = 1.6; ctx.lineCap = "round";
    for (let i = -1; i <= 1; i++) {
      ctx.beginPath(); ctx.moveTo(-6 + i * 0.5, -10 + i * 4); ctx.quadraticCurveTo(0, -2 + i * 4, 6, 6 + i * 3); ctx.stroke();
    }
    // legs
    ctx.strokeStyle = body; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(2, 12); ctx.lineTo(0, 20); ctx.moveTo(8, 12); ctx.lineTo(8, 20); ctx.stroke();
    // head
    ctx.fillStyle = body; ctx.beginPath(); ctx.arc(10, -12, 9, 0, U.TAU); ctx.fill();
    // ears
    ctx.beginPath(); ctx.moveTo(6, -20); ctx.lineTo(3, -26); ctx.lineTo(9, -22); ctx.closePath();
    ctx.moveTo(14, -20); ctx.lineTo(15, -27); ctx.lineTo(18, -20); ctx.closePath(); ctx.fill();
    ctx.fillStyle = "#1a1a2a"; ctx.beginPath(); ctx.arc(13, -13, 2.4, 0, U.TAU); ctx.fill();
    ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(13.7, -13.7, 0.8, 0, U.TAU); ctx.fill();
    ctx.fillStyle = "#3a2a1a"; ctx.beginPath(); ctx.arc(18, -10, 1.6, 0, U.TAU); ctx.fill();
    ctx.restore();
  };

  /* ---- Floating bridge stone with "రామ" written on it ---- */
  Art.stone = function (ctx, x, y, w, h, t, opts) {
    opts = opts || {};
    ctx.save();
    ctx.translate(x, y);
    if (opts.glow) Art.glow(ctx, 0, 0, w * 0.9, "#ffd98a", 0.4);
    const g = ctx.createLinearGradient(0, -h / 2, 0, h / 2);
    g.addColorStop(0, opts.top || "#b89a78");
    g.addColorStop(1, opts.bottom || "#6e5238");
    ctx.fillStyle = g;
    U.roundRect(ctx, -w / 2, -h / 2, w, h, Math.min(w, h) * 0.22);
    ctx.fill();
    // top light edge
    ctx.fillStyle = "rgba(255,255,255,0.18)";
    U.roundRect(ctx, -w / 2 + 3, -h / 2 + 3, w - 6, h * 0.28, 6); ctx.fill();
    // speckles
    ctx.fillStyle = "rgba(0,0,0,0.12)";
    const rnd = srand(Math.floor(w * 13 + h));
    for (let i = 0; i < 5; i++) ctx.beginPath(), ctx.arc((rnd() - 0.5) * w * 0.7, (rnd() - 0.5) * h * 0.5, 1.5 + rnd() * 2, 0, U.TAU), ctx.fill();
    // the sacred name
    DG.util.text(ctx, opts.name || "రామ", 0, 1, { size: Math.min(h * 0.5, w * 0.42), fill: "#5a2d12", weight: "bold", family: '"Nirmala UI","Noto Sans Telugu","Trebuchet MS",sans-serif' });
    ctx.restore();
  };

  /* ---- Matsya-Yantra: the rotating golden fish on a wheel (Arjuna's target) ---- */
  Art.fishWheel = function (ctx, x, y, R, angle, opts) {
    opts = opts || {};
    ctx.save();
    ctx.translate(x, y);
    // mounting hub glow
    Art.glow(ctx, 0, 0, R * 1.5, "#ffe8a0", 0.25);
    ctx.rotate(angle);
    // wheel spokes ring
    ctx.strokeStyle = "#caa24a"; ctx.lineWidth = 6;
    ctx.beginPath(); ctx.arc(0, 0, R, 0, U.TAU); ctx.stroke();
    ctx.lineWidth = 3;
    for (let i = 0; i < 8; i++) {
      ctx.save(); ctx.rotate((i / 8) * U.TAU);
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -R); ctx.stroke();
      ctx.restore();
    }
    // fish riding the rim (so its eye sweeps a circle)
    ctx.save();
    ctx.translate(0, -R);
    const fl = R * 0.5;
    const fg = ctx.createLinearGradient(-fl, 0, fl, 0);
    fg.addColorStop(0, "#ffd86b"); fg.addColorStop(1, "#e7912b");
    ctx.fillStyle = fg;
    ctx.beginPath();
    ctx.moveTo(-fl, 0);
    ctx.quadraticCurveTo(0, -fl * 0.6, fl * 0.7, 0);
    ctx.quadraticCurveTo(0, fl * 0.6, -fl, 0);
    ctx.fill();
    // tail
    ctx.beginPath(); ctx.moveTo(-fl, 0); ctx.lineTo(-fl - fl * 0.5, -fl * 0.4); ctx.lineTo(-fl - fl * 0.5, fl * 0.4); ctx.closePath(); ctx.fill();
    // fin
    ctx.fillStyle = "#c8761f"; ctx.beginPath(); ctx.moveTo(-fl * 0.1, -fl * 0.2); ctx.lineTo(fl * 0.2, -fl * 0.7); ctx.lineTo(fl * 0.3, -fl * 0.15); ctx.closePath(); ctx.fill();
    // the eye — the target
    ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(fl * 0.32, -fl * 0.05, fl * 0.18, 0, U.TAU); ctx.fill();
    ctx.fillStyle = opts.eye || "#2a1a1a"; ctx.beginPath(); ctx.arc(fl * 0.34, -fl * 0.05, fl * 0.09, 0, U.TAU); ctx.fill();
    ctx.restore();
    ctx.restore();
    // return world position of the eye for hit-testing
    const ex = x + Math.cos(angle - Math.PI / 2) * R + Math.cos(angle) * (R * 0.5 * 0.32);
    const ey = y + Math.sin(angle - Math.PI / 2) * R + Math.sin(angle) * (R * 0.5 * 0.32);
    return { x: ex, y: ey, r: R * 0.5 * 0.18 };
  };

  // simple arrow
  Art.arrow = function (ctx, x, y, angle, len, opts) {
    opts = opts || {};
    ctx.save(); ctx.translate(x, y); ctx.rotate(angle);
    ctx.strokeStyle = opts.shaft || "#9a6b3a"; ctx.lineWidth = opts.w || 4; ctx.lineCap = "round";
    ctx.beginPath(); ctx.moveTo(-len, 0); ctx.lineTo(0, 0); ctx.stroke();
    // head
    ctx.fillStyle = opts.head || "#dfe6ee";
    ctx.beginPath(); ctx.moveTo(len * 0.18, 0); ctx.lineTo(-4, -6); ctx.lineTo(-4, 6); ctx.closePath(); ctx.fill();
    // fletching
    ctx.fillStyle = opts.fletch || "#e23b3b";
    ctx.beginPath(); ctx.moveTo(-len, 0); ctx.lineTo(-len + 10, -7); ctx.lineTo(-len + 6, 0); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(-len, 0); ctx.lineTo(-len + 10, 7); ctx.lineTo(-len + 6, 0); ctx.closePath(); ctx.fill();
    ctx.restore();
  };
})();
