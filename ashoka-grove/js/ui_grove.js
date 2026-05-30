/* =====================================================================
   A Light in the Ashoka Grove — ui_grove.js
   Floating virtual joystick, the ceremonial "toss" button, the keepsake
   HUD, contextual note banner, mute toggle, intro & end cards.
   ===================================================================== */
(function () {
  "use strict";
  const DG = window.DG;
  const U = DG.util;
  const W = DG.W, H = DG.H;
  const UI = (DG.UI = DG.UI || {});
  const TEL = '"Nirmala UI","Noto Sans Telugu","Trebuchet MS",sans-serif';

  /* ---------------- floating joystick ---------------- */
  const JR = 74; // travel radius
  const J = {
    active: false, ever: false,
    bx: 0, by: 0, tx: 0, ty: 0, vx: 0, vy: 0,
    reset() { this.active = false; this.vx = 0; this.vy = 0; },
    vector() { return { x: this.vx, y: this.vy }; },
    down(p) {
      if (p.y < 96) return;                 // keep clear of the HUD
      this.active = true; this.ever = true;
      this.bx = p.x; this.by = p.y; this.tx = p.x; this.ty = p.y; this.vx = 0; this.vy = 0;
    },
    move(p) {
      if (!this.active) return;
      let dx = p.x - this.bx, dy = p.y - this.by;
      const d = Math.hypot(dx, dy);
      if (d > JR) { dx = dx / d * JR; dy = dy / d * JR; }
      this.tx = this.bx + dx; this.ty = this.by + dy;
      this.vx = dx / JR; this.vy = dy / JR;
    },
    up() { this.active = false; this.vx = 0; this.vy = 0; },
    draw(ctx) {
      if (this.active) {
        ctx.save();
        // base ring
        ctx.strokeStyle = "rgba(200,210,255,0.35)"; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(this.bx, this.by, JR, 0, U.TAU); ctx.stroke();
        ctx.fillStyle = "rgba(40,46,90,0.25)";
        ctx.beginPath(); ctx.arc(this.bx, this.by, JR, 0, U.TAU); ctx.fill();
        // thumb
        DG.Art.glow(ctx, this.tx, this.ty, 34, "#ffcf6b", 0.35);
        const g = ctx.createRadialGradient(this.tx - 6, this.ty - 6, 4, this.tx, this.ty, 26);
        g.addColorStop(0, "#fff3d2"); g.addColorStop(1, "#e0a94e");
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(this.tx, this.ty, 26, 0, U.TAU); ctx.fill();
        ctx.strokeStyle = "rgba(120,80,20,0.6)"; ctx.lineWidth = 2; ctx.stroke();
        ctx.restore();
      } else if (!this.ever) {
        // first-time hint, low-center
        const hx = W / 2, hy = H - 150;
        const pulse = 0.5 + 0.5 * Math.sin(DG.time * 3);
        ctx.save(); ctx.globalAlpha = 0.4 + pulse * 0.3;
        ctx.strokeStyle = "rgba(200,210,255,0.5)"; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(hx, hy, JR, 0, U.TAU); ctx.stroke();
        DG.Art.glow(ctx, hx + 24 * pulse, hy, 22, "#ffcf6b", 0.3);
        ctx.fillStyle = "rgba(255,243,210,0.8)";
        ctx.beginPath(); ctx.arc(hx + 24 * pulse, hy, 22, 0, U.TAU); ctx.fill();
        ctx.restore();
        U.text(ctx, "drag to guide him", hx, hy + JR + 22, { size: 22, fill: "rgba(255,247,220,0.85)", shadow: "rgba(0,0,0,0.5)", shadowBlur: 4 });
      }
    },
  };
  UI.Joystick = J;

  /* ---------------- toss button (ceremonial) ---------------- */
  const tossBtn = {
    x: W / 2 - 165, y: H - 250, w: 330, h: 78, visible: false, pressed: false, onTap: null,
    contains(p) { return this.visible && p.x >= this.x - 6 && p.x <= this.x + this.w + 6 && p.y >= this.y - 6 && p.y <= this.y + this.h + 6; },
    draw(ctx, t) {
      if (!this.visible) return;
      const pulse = 0.5 + 0.5 * Math.sin(t * 3);
      ctx.save();
      ctx.translate(0, this.pressed ? 3 : 0);
      DG.Art.glow(ctx, this.x + this.w / 2, this.y + this.h / 2, 90, "#ffd98a", 0.18 + pulse * 0.12);
      ctx.shadowColor = "rgba(0,0,0,0.4)"; ctx.shadowBlur = 14; ctx.shadowOffsetY = 5;
      const g = ctx.createLinearGradient(0, this.y, 0, this.y + this.h);
      g.addColorStop(0, "#ffe6a6"); g.addColorStop(1, "#f0a93c");
      ctx.fillStyle = g; U.roundRect(ctx, this.x, this.y, this.w, this.h, 22); ctx.fill();
      ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
      ctx.strokeStyle = "#9b5a16"; ctx.lineWidth = 3; U.roundRect(ctx, this.x, this.y, this.w, this.h, 22); ctx.stroke();
      DG.Art.chudamani(ctx, this.x + 40, this.y + this.h / 2, t, { float: false, scale: 1.1 });
      U.text(ctx, "Toss the chūḍāmaṇi", this.x + this.w / 2 + 22, this.y + this.h / 2, { size: 28, fill: "#5a2d08", shadow: "rgba(255,255,255,0.4)", shadowBlur: 2 });
      ctx.restore();
    },
  };
  UI.tossBtn = tossBtn;

  /* ---------------- mute toggle (top-right) ---------------- */
  const muteRect = { x: W - 70, y: 26, w: 48, h: 48 };
  UI.hitMute = function (p) { return p.x >= muteRect.x - 6 && p.x <= muteRect.x + muteRect.w + 6 && p.y >= muteRect.y - 6 && p.y <= muteRect.y + muteRect.h + 6; };

  function muteIcon(ctx, muted) {
    const cx = muteRect.x + muteRect.w / 2, cy = muteRect.y + muteRect.h / 2;
    ctx.save();
    ctx.fillStyle = "rgba(20,18,46,0.55)"; ctx.strokeStyle = "rgba(255,216,107,0.5)"; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(cx, cy, 24, 0, U.TAU); ctx.fill(); ctx.stroke();
    ctx.fillStyle = "#ffe7b3";
    ctx.beginPath(); ctx.moveTo(cx - 8, cy - 4); ctx.lineTo(cx - 2, cy - 4); ctx.lineTo(cx + 4, cy - 10); ctx.lineTo(cx + 4, cy + 10); ctx.lineTo(cx - 2, cy + 4); ctx.lineTo(cx - 8, cy + 4); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = "#ffe7b3"; ctx.lineWidth = 2; ctx.lineCap = "round";
    if (muted) { ctx.beginPath(); ctx.moveTo(cx + 8, cy - 7); ctx.lineTo(cx + 15, cy + 7); ctx.moveTo(cx + 15, cy - 7); ctx.lineTo(cx + 8, cy + 7); ctx.stroke(); }
    else { ctx.beginPath(); ctx.arc(cx + 8, cy, 5, -0.6, 0.6); ctx.arc(cx + 8, cy, 9, -0.6, 0.6); ctx.stroke(); }
    ctx.restore();
  }

  /* ---------------- HUD ---------------- */
  UI.drawHUD = function (ctx, s) {
    // keepsakes (3 lotus pips) top-left
    const x0 = 30, y0 = 50;
    for (let i = 0; i < s.total; i++) {
      const x = x0 + i * 34;
      const got = i < s.keepsakes;
      ctx.save();
      if (got) { DG.Art.glow(ctx, x, y0, 16, "#ffe6a0", 0.4); DG.Art.lotus(ctx, x, y0, 9, DG.time, "#ff9fc0"); }
      else { ctx.globalAlpha = 0.4; ctx.strokeStyle = "rgba(255,216,107,0.6)"; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, y0, 9, 0, U.TAU); ctx.stroke(); }
      ctx.restore();
    }
    // chudamani pip
    const cxp = x0 + s.total * 34 + 14;
    if (s.hasChud) DG.Art.chudamani(ctx, cxp, y0, DG.time, { float: false, scale: 0.95 });
    else { ctx.save(); ctx.globalAlpha = 0.35; ctx.strokeStyle = "rgba(180,210,255,0.7)"; ctx.lineWidth = 2; U.starPath(ctx, cxp, y0, 5, 9, 4); ctx.stroke(); ctx.restore(); }

    muteIcon(ctx, s.muted);
  };

  /* ---------------- note banner ---------------- */
  UI.drawNote = function (ctx, text) {
    ctx.save();
    ctx.font = '600 24px "Trebuchet MS", sans-serif';
    const lines = wrap(ctx, text, W - 150);
    const h = 26 + lines.length * 30, w = Math.min(W - 60, maxW(ctx, lines) + 56);
    const x = (W - w) / 2, y = 96;
    ctx.shadowColor = "rgba(0,0,0,0.4)"; ctx.shadowBlur = 16; ctx.shadowOffsetY = 5;
    const g = ctx.createLinearGradient(0, y, 0, y + h);
    g.addColorStop(0, "rgba(30,22,60,0.92)"); g.addColorStop(1, "rgba(16,12,40,0.92)");
    ctx.fillStyle = g; U.roundRect(ctx, x, y, w, h, 18); ctx.fill();
    ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
    ctx.strokeStyle = "rgba(255,216,107,0.55)"; ctx.lineWidth = 2; U.roundRect(ctx, x, y, w, h, 18); ctx.stroke();
    let ty = y + 16 + 12;
    for (const ln of lines) { U.text(ctx, ln, W / 2, ty, { size: 24, fill: "#ffe9b3", weight: "600" }); ty += 30; }
    ctx.restore();
  };

  /* ---------------- intro card ---------------- */
  UI.drawIntro = function (ctx, t) {
    ctx.save();
    ctx.fillStyle = "rgba(8,8,24,0.62)"; ctx.fillRect(0, 0, W, H);
    DG.Art.moon(ctx, W / 2, H * 0.20, 56, t, 0.15);
    // a small praying Bala Hanumanthudu
    DG.Art.bala(ctx, W / 2, H * 0.40, 1.4, t, { facing: 1, state: "pray", lamp: 0.3, glow: 1.2 });

    UI.title(ctx, "A Light in the", W / 2, H * 0.52, 46, t);
    UI.title(ctx, "Ashoka Grove", W / 2, H * 0.52 + 54, 52, t);
    U.text(ctx, "అభయం — Abhayam", W / 2, H * 0.52 + 104, { size: 30, fill: "#ffe7b3", family: TEL, shadow: "rgba(0,0,0,0.5)", shadowBlur: 6 });

    const lines = [
      "Cross the moonlit grove to Sitamma.",
      "Your little lamp lights the way — but it wakes the",
      "sleeping rakshasis. Pause and say Rāma-nāma, and a",
      "wider, safe aura reveals the path.",
      "Gather Rama's keepsakes and the chūḍāmaṇi,",
      "and do not startle her.",
    ];
    ctx.fillStyle = "rgba(255,247,224,0.94)"; ctx.textAlign = "center"; ctx.textBaseline = "top";
    ctx.font = '500 24px "Trebuchet MS", sans-serif';
    let ty = H * 0.66;
    for (const ln of lines) { ctx.fillText(ln, W / 2, ty); ty += 32; }

    const pulse = 0.7 + 0.3 * Math.sin(t * 3);
    ctx.globalAlpha = pulse;
    U.text(ctx, "Tap to begin", W / 2, H * 0.90, { size: 38, fill: "#fff6d8", stroke: "#7a3d0c", strokeW: 4, shadow: "rgba(255,210,80,0.6)", shadowBlur: 16 });
    ctx.globalAlpha = 1;
    ctx.restore();
  };

  /* ---------------- end card ---------------- */
  UI.drawEnd = function (ctx, t, keepsakes) {
    ctx.save();
    ctx.fillStyle = "rgba(20,14,30,0.42)"; ctx.fillRect(0, 0, W, H);
    UI.title(ctx, "Hope is carried home", W / 2, H * 0.34, 44, t);
    U.text(ctx, "ఆశ ఇంటికి చేరింది", W / 2, H * 0.34 + 50, { size: 28, fill: "#ffe7b3", family: TEL, shadow: "rgba(0,0,0,0.5)", shadowBlur: 6 });
    U.text(ctx, "Sitamma saw Rama's keepsake, and was not afraid.", W / 2, H * 0.45, { size: 24, fill: "rgba(255,247,224,0.95)" });
    U.text(ctx, "Keepsakes kept  " + keepsakes + " / 3", W / 2, H * 0.51, { size: 26, fill: "#ffd98a", weight: "bold" });

    const pulse = 0.7 + 0.3 * Math.sin(t * 3);
    ctx.globalAlpha = pulse;
    U.text(ctx, "Tap to walk the grove again", W / 2, H * 0.62, { size: 30, fill: "#fff6d8", stroke: "#7a3d0c", strokeW: 4, shadow: "rgba(255,210,80,0.6)", shadowBlur: 14 });
    ctx.globalAlpha = 1;
    ctx.restore();
  };

  /* ---------------- shared title ---------------- */
  UI.title = function (ctx, text, cx, cy, size, t) {
    ctx.save();
    const g = ctx.createLinearGradient(0, cy - size / 2, 0, cy + size / 2);
    g.addColorStop(0, "#fff6cf"); g.addColorStop(0.5, "#ffd166"); g.addColorStop(1, "#f4892e");
    U.text(ctx, text, cx, cy + 3, { size, fill: "rgba(0,0,0,0.3)", weight: "bold" });
    U.text(ctx, text, cx, cy, { size, fill: g, stroke: "#7a3d0c", strokeW: size * 0.07, shadow: "rgba(255,210,80,0.5)", shadowBlur: 14 });
    ctx.restore();
  };

  /* ---------------- helpers ---------------- */
  function wrap(ctx, text, maxWidth) {
    const words = text.split(" "); const lines = []; let cur = "";
    for (const w of words) { const test = cur ? cur + " " + w : w; if (ctx.measureText(test).width > maxWidth && cur) { lines.push(cur); cur = w; } else cur = test; }
    if (cur) lines.push(cur); return lines;
  }
  function maxW(ctx, lines) { let m = 0; for (const l of lines) m = Math.max(m, ctx.measureText(l).width); return m; }
})();
