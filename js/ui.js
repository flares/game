/* =====================================================================
   Divya Gatha — ui.js
   Shared UI: buttons, panels, star ratings, floating text, and the
   generic Story (intro) and Result (outro) scenes that teach the
   episode without any quiz — just narrative + celebration.
   ===================================================================== */
(function () {
  "use strict";
  const DG = window.DG;
  const U = DG.util;
  const UI = (DG.UI = {});

  /* ---------------- Button ---------------- */
  class Button {
    constructor(o) {
      Object.assign(this, {
        x: 0, y: 0, w: 220, h: 74, label: "", sub: "",
        style: "primary", shape: "rect", r: 20,
        enabled: true, visible: true, pressed: false,
        icon: null, onTap: null, font: 32, color: null,
      }, o);
    }
    get cx() { return this.x + this.w / 2; }
    get cy() { return this.y + this.h / 2; }
    contains(p) {
      if (!this.visible || !this.enabled) return false;
      if (this.shape === "round") return U.dist(p.x, p.y, this.cx, this.cy) <= this.w / 2 + 6;
      return p.x >= this.x - 4 && p.x <= this.x + this.w + 4 && p.y >= this.y - 4 && p.y <= this.y + this.h + 4;
    }
    draw(ctx, t) {
      if (!this.visible) return;
      const dn = this.pressed ? 3 : 0;
      ctx.save();
      ctx.translate(0, dn);
      const a = this.enabled ? 1 : 0.45;
      ctx.globalAlpha = a;
      if (this.shape === "round") {
        const r = this.w / 2;
        ctx.save();
        ctx.shadowColor = "rgba(0,0,0,0.35)"; ctx.shadowBlur = 10; ctx.shadowOffsetY = 4;
        const g = ctx.createLinearGradient(this.cx, this.cy - r, this.cx, this.cy + r);
        const base = this.color || "#3b2b66";
        g.addColorStop(0, U.mix(base, "#ffffff", 0.25));
        g.addColorStop(1, base);
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(this.cx, this.cy, r, 0, U.TAU); ctx.fill();
        ctx.restore();
        ctx.strokeStyle = "rgba(255,255,255,0.35)"; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(this.cx, this.cy, r - 1, 0, U.TAU); ctx.stroke();
        if (this.icon) this.icon(ctx, this.cx, this.cy, r, t);
        else if (this.label) U.text(ctx, this.label, this.cx, this.cy, { size: this.font, fill: "#fff" });
        ctx.restore();
        return;
      }
      // rect
      ctx.shadowColor = "rgba(0,0,0,0.32)"; ctx.shadowBlur = 12; ctx.shadowOffsetY = 5;
      let top, bot, border, txt;
      if (this.style === "primary") { top = "#ffe08a"; bot = "#f0a93c"; border = "#9b5a16"; txt = "#5a2d08"; }
      else if (this.style === "green") { top = "#9be08a"; bot = "#46a85a"; border = "#246b2a"; txt = "#0f3a14"; }
      else if (this.style === "ghost") { top = "rgba(255,255,255,0.22)"; bot = "rgba(255,255,255,0.10)"; border = "rgba(255,255,255,0.5)"; txt = "#fff"; }
      else { top = U.mix(this.color || "#5a4a8a", "#fff", 0.2); bot = this.color || "#5a4a8a"; border = "rgba(0,0,0,0.3)"; txt = "#fff"; }
      const g = ctx.createLinearGradient(0, this.y, 0, this.y + this.h);
      g.addColorStop(0, top); g.addColorStop(1, bot);
      ctx.fillStyle = g;
      U.roundRect(ctx, this.x, this.y, this.w, this.h, this.r); ctx.fill();
      ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
      // top sheen
      ctx.fillStyle = "rgba(255,255,255,0.25)";
      U.roundRect(ctx, this.x + 4, this.y + 4, this.w - 8, this.h * 0.4, this.r * 0.7); ctx.fill();
      ctx.strokeStyle = border; ctx.lineWidth = 3;
      U.roundRect(ctx, this.x, this.y, this.w, this.h, this.r); ctx.stroke();
      const ly = this.sub ? this.cy - this.h * 0.13 : this.cy;
      if (this.icon) this.icon(ctx, this.x + 30, this.cy, 18, t);
      U.text(ctx, this.label, this.cx + (this.icon ? 14 : 0), ly, { size: this.font, fill: txt, shadow: "rgba(255,255,255,0.4)", shadowBlur: 2 });
      if (this.sub) U.text(ctx, this.sub, this.cx, this.cy + this.h * 0.2, { size: this.font * 0.5, fill: txt, weight: "bold" });
      ctx.restore();
    }
  }
  UI.Button = Button;

  UI.handleDown = function (buttons, p) {
    for (const b of buttons) if (b.contains(p)) { b.pressed = true; }
  };
  UI.handleUp = function (buttons, p) {
    let hit = null;
    for (const b of buttons) {
      if (b.pressed) {
        b.pressed = false;
        if (b.contains(p)) { hit = b; }
      }
    }
    if (hit) { DG.Audio.tap(); if (hit.onTap) hit.onTap(); }
    return hit;
  };
  UI.drawButtons = function (buttons, ctx, t) { for (const b of buttons) b.draw(ctx, t); };

  /* ---------------- panel / chip / banner ---------------- */
  UI.panel = function (ctx, x, y, w, h, opts) {
    opts = opts || {};
    ctx.save();
    ctx.shadowColor = "rgba(0,0,0,0.4)"; ctx.shadowBlur = 24; ctx.shadowOffsetY = 10;
    const g = ctx.createLinearGradient(0, y, 0, y + h);
    g.addColorStop(0, opts.top || "#fff8ec");
    g.addColorStop(1, opts.bottom || "#ffe9c7");
    ctx.fillStyle = g;
    U.roundRect(ctx, x, y, w, h, opts.r || 28); ctx.fill();
    ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
    ctx.strokeStyle = opts.border || "#e0a94e"; ctx.lineWidth = opts.lw || 5;
    U.roundRect(ctx, x, y, w, h, opts.r || 28); ctx.stroke();
    // inner hairline
    ctx.strokeStyle = "rgba(255,255,255,0.6)"; ctx.lineWidth = 2;
    U.roundRect(ctx, x + 6, y + 6, w - 12, h - 12, (opts.r || 28) - 6); ctx.stroke();
    ctx.restore();
  };

  UI.chip = function (ctx, cx, y, text, opts) {
    opts = opts || {};
    ctx.save();
    ctx.font = `bold ${opts.size || 30}px "Trebuchet MS", sans-serif`;
    const tw = ctx.measureText(text).width;
    const padL = opts.icon ? 52 : 22;
    const w = tw + padL + 22, h = opts.h || 50;
    const x = cx - w / 2;
    ctx.shadowColor = "rgba(0,0,0,0.3)"; ctx.shadowBlur = 8; ctx.shadowOffsetY = 3;
    const g = ctx.createLinearGradient(0, y, 0, y + h);
    g.addColorStop(0, opts.top || "rgba(40,28,80,0.92)");
    g.addColorStop(1, opts.bottom || "rgba(20,14,46,0.92)");
    ctx.fillStyle = g;
    U.roundRect(ctx, x, y, w, h, h / 2); ctx.fill();
    ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
    ctx.strokeStyle = opts.border || "rgba(255,216,107,0.7)"; ctx.lineWidth = 2;
    U.roundRect(ctx, x, y, w, h, h / 2); ctx.stroke();
    if (opts.icon) opts.icon(ctx, x + 26, y + h / 2, h * 0.34);
    U.text(ctx, text, x + padL + tw / 2, y + h / 2, { size: opts.size || 30, fill: opts.color || "#ffe9b3" });
    ctx.restore();
    return { x, y, w, h };
  };

  UI.title = function (ctx, text, cx, cy, size, t) {
    ctx.save();
    const g = ctx.createLinearGradient(0, cy - size / 2, 0, cy + size / 2);
    g.addColorStop(0, "#fff6cf"); g.addColorStop(0.5, "#ffd166"); g.addColorStop(1, "#f4892e");
    U.text(ctx, text, cx, cy + 3, { size, fill: "rgba(0,0,0,0.25)", weight: "bold" });
    U.text(ctx, text, cx, cy, { size, fill: g, stroke: "#7a3d0c", strokeW: size * 0.07, shadow: "rgba(255,210,80,0.5)", shadowBlur: 14 });
    ctx.restore();
  };

  /* ---------------- star rating row ---------------- */
  // animated: stars pop in over time `tin` seconds elapsed since shown
  UI.stars = function (ctx, cx, cy, earned, total, size, tin) {
    total = total || 3;
    const gap = size * 2.4;
    const x0 = cx - (gap * (total - 1)) / 2;
    for (let i = 0; i < total; i++) {
      const filled = i < earned;
      let sc = 1;
      if (filled && tin != null) {
        const lt = tin - 0.25 - i * 0.28;
        if (lt <= 0) { sc = 0; }
        else sc = U.easeOutBack(U.clamp(lt / 0.5, 0, 1));
      }
      if (sc <= 0) { DG.Art.star(ctx, x0 + i * gap, cy, size, false); continue; }
      ctx.save();
      ctx.translate(x0 + i * gap, cy);
      ctx.scale(sc, sc);
      DG.Art.star(ctx, 0, 0, size, filled, DG.time);
      ctx.restore();
      if (!filled) DG.Art.star(ctx, x0 + i * gap, cy, size, false);
    }
  };

  /* ---------------- floating "+1" texts ---------------- */
  UI.Floaters = function () {
    const list = [];
    return {
      push(x, y, text, opts) {
        opts = opts || {};
        list.push({ x, y, text, life: 0, max: opts.life || 1.1, vy: opts.vy || -70, color: opts.color || "#fff3b0", size: opts.size || 36 });
      },
      update(dt) { for (let i = list.length - 1; i >= 0; i--) { const f = list[i]; f.life += dt; f.y += f.vy * dt; f.vy *= 0.96; if (f.life >= f.max) list.splice(i, 1); } },
      draw(ctx) {
        for (const f of list) {
          const k = f.life / f.max;
          const a = U.clamp(1 - k, 0, 1);
          ctx.globalAlpha = a;
          U.text(ctx, f.text, f.x, f.y, { size: f.size * (1 + k * 0.2), fill: f.color, stroke: "rgba(90,45,8,0.8)", strokeW: 5 });
          ctx.globalAlpha = 1;
        }
      },
    };
  };

  /* ---------------- shared menu background (drifting petals) ---------------- */
  UI.makePetals = function (color) {
    const ps = DG.Particles();
    let acc = 0;
    return {
      ps,
      update(dt) {
        acc += dt;
        while (acc > 0.22) {
          acc -= 0.22;
          ps.spawn({
            x: U.rand(0, DG.W), y: -20,
            vx: U.rand(-20, 20), vy: U.rand(40, 90), g: 6, drag: 1,
            life: U.rand(7, 11), size: U.rand(6, 12),
            rot: U.rand(0, 6.28), spin: U.rand(-1.5, 1.5),
            type: "petal", color: color || U.choose(["#ffb3c7", "#ffd98a", "#ffc0a3", "#ffe3f0"]),
          });
        }
        ps.update(dt);
      },
      draw(ctx) { ctx.globalAlpha = 0.85; ps.draw(ctx); ctx.globalAlpha = 1; },
    };
  };

  /* =====================================================================
     Story scene (intro). cfg:
       { id, title, titleTe, lines:[..], lesson, accent, sky:[stops],
         hero(ctx, t), onPlay(), onBack(), best, stars }
     ===================================================================== */
  UI.StoryScene = function (cfg) {
    const petals = UI.makePetals(cfg.petalColor);
    let tin = 0;
    const buttons = [];
    const play = new UI.Button({
      x: DG.W / 2 - 150, y: DG.H - 230, w: 300, h: 92,
      label: "▶  Play", style: "primary", font: 40, onTap: () => cfg.onPlay(),
    });
    const back = new UI.Button({
      x: 28, y: 44, w: 60, h: 60, shape: "round", color: "#2a1d4e",
      icon: (ctx, cx, cy, r) => { U.text(ctx, "←", cx, cy, { size: 34, fill: "#ffe9b3" }); },
      onTap: () => cfg.onBack(),
    });
    buttons.push(play, back);

    return {
      buttons,
      enter() { tin = 0; },
      update(dt) { tin += dt; petals.update(dt); },
      onDown(p) { UI.handleDown(buttons, p); },
      onUp(p) { UI.handleUp(buttons, p); },
      render(ctx) {
        DG.Art.sky(ctx, cfg.sky || [[0, "#3a2c6e"], [0.5, "#7a4f8e"], [1, "#f0a07a"]]);
        if (cfg.bg) cfg.bg(ctx, DG.time);
        petals.draw(ctx);

        // hero illustration up top
        const hy = 250 + Math.sin(DG.time * 1.4) * 8;
        if (cfg.hero) cfg.hero(ctx, DG.W / 2, hy, DG.time);

        // narrative card
        const cardX = 56, cardY = 430, cardW = DG.W - 112, cardH = 470;
        const pop = U.easeOutBack(U.clamp(tin / 0.5, 0, 1));
        ctx.save();
        ctx.translate(DG.W / 2, cardY + cardH / 2);
        ctx.scale(pop, pop);
        ctx.translate(-DG.W / 2, -(cardY + cardH / 2));
        UI.panel(ctx, cardX, cardY, cardW, cardH);
        UI.title(ctx, cfg.title, DG.W / 2, cardY + 58, 46, DG.time);
        if (cfg.titleTe) U.text(ctx, cfg.titleTe, DG.W / 2, cardY + 100, { size: 30, fill: "#a9602a", family: '"Nirmala UI","Noto Sans Telugu",sans-serif' });

        ctx.fillStyle = "#5a3a1e";
        let ty = cardY + 150;
        ctx.textAlign = "center"; ctx.textBaseline = "top";
        ctx.font = '500 27px "Trebuchet MS", sans-serif';
        for (const line of cfg.lines) {
          const wrapped = wrapText(ctx, line, cardW - 72);
          for (const w of wrapped) { ctx.fillText(w, DG.W / 2, ty); ty += 34; }
          ty += 8;
        }
        if (cfg.lesson) {
          ty += 4;
          U.text(ctx, "✦ " + cfg.lesson + " ✦", DG.W / 2, ty + 8, { size: 24, fill: "#b5701a", weight: "bold" });
        }
        ctx.restore();

        // how-to hint above the play button
        if (cfg.hint) U.text(ctx, cfg.hint, DG.W / 2, DG.H - 268, { size: 23, fill: "rgba(255,255,255,0.92)", stroke: "rgba(0,0,0,0.3)", strokeW: 4 });

        UI.drawButtons(buttons, ctx, DG.time);
      },
    };
  };

  /* =====================================================================
     Result scene (outro). cfg:
       { title, titleTe, lines:[..], lesson, stars, blessings, newBest,
         accent, sky, hero(ctx,t), onReplay(), onHome() }
     ===================================================================== */
  UI.ResultScene = function (cfg) {
    const petals = UI.makePetals(cfg.petalColor);
    const confetti = DG.Particles();
    let tin = 0, blessShown = 0, popped = false;
    const buttons = [];
    const replay = new UI.Button({ x: DG.W / 2 - 320, y: DG.H - 200, w: 300, h: 88, label: "↻ Play Again", style: "primary", font: 32, onTap: () => cfg.onReplay() });
    const home = new UI.Button({ x: DG.W / 2 + 20, y: DG.H - 200, w: 300, h: 88, label: "⌂ Home", style: "purple", color: "#5a4a8a", font: 32, onTap: () => cfg.onHome() });
    buttons.push(replay, home);

    function burst() {
      for (let i = 0; i < 80; i++) {
        confetti.spawn({
          x: U.rand(0, DG.W), y: U.rand(-200, 120),
          vx: U.rand(-40, 40), vy: U.rand(40, 160), g: 60, drag: 0.99,
          life: U.rand(3, 5), size: U.rand(6, 13), rot: U.rand(0, 6.28), spin: U.rand(-5, 5),
          type: U.chance(0.5) ? "petal" : "star",
          color: U.choose(["#ffd86b", "#ff8fb0", "#9be08a", "#8fd0e6", "#fff3b0"]),
        });
      }
    }

    return {
      buttons,
      enter() { tin = 0; blessShown = 0; popped = false; DG.Audio.fanfare(); burst(); },
      update(dt) {
        tin += dt; petals.update(dt); confetti.update(dt);
        if (tin > 1.4 && blessShown < cfg.blessings) {
          blessShown = Math.min(cfg.blessings, blessShown + Math.ceil(cfg.blessings * dt * 1.2) + 1);
          if (blessShown % 3 === 0) DG.Audio.coin();
        }
        if (tin > 0.5 && !popped) { popped = true; DG.Audio.bell(); }
      },
      onDown(p) { UI.handleDown(buttons, p); },
      onUp(p) { UI.handleUp(buttons, p); },
      render(ctx) {
        DG.Art.sky(ctx, cfg.sky || [[0, "#2a2363"], [0.5, "#6b4f9e"], [1, "#f0a05a"]]);
        DG.Art.stars(ctx, DG.time, 40, DG.H * 0.4);
        petals.draw(ctx);
        confetti.draw(ctx);

        const hy = 230 + Math.sin(DG.time * 1.4) * 8;
        if (cfg.hero) cfg.hero(ctx, DG.W / 2, hy, DG.time);

        const cardX = 56, cardY = 360, cardW = DG.W - 112, cardH = 520;
        const pop = U.easeOutBack(U.clamp(tin / 0.5, 0, 1));
        ctx.save();
        ctx.translate(DG.W / 2, cardY + cardH / 2); ctx.scale(pop, pop); ctx.translate(-DG.W / 2, -(cardY + cardH / 2));
        UI.panel(ctx, cardX, cardY, cardW, cardH, { top: "#fff8ec", bottom: "#ffe1bd" });
        UI.title(ctx, cfg.title, DG.W / 2, cardY + 56, 44, DG.time);
        if (cfg.titleTe) U.text(ctx, cfg.titleTe, DG.W / 2, cardY + 96, { size: 28, fill: "#a9602a", family: '"Nirmala UI","Noto Sans Telugu",sans-serif' });

        UI.stars(ctx, DG.W / 2, cardY + 168, cfg.stars, 3, 34, tin);

        ctx.fillStyle = "#5a3a1e"; ctx.textAlign = "center"; ctx.textBaseline = "top";
        ctx.font = '500 26px "Trebuchet MS", sans-serif';
        let ty = cardY + 224;
        for (const line of cfg.lines || []) {
          const wrapped = wrapText(ctx, line, cardW - 72);
          for (const w of wrapped) { ctx.fillText(w, DG.W / 2, ty); ty += 33; }
          ty += 6;
        }
        if (cfg.lesson) { U.text(ctx, "✦ " + cfg.lesson + " ✦", DG.W / 2, ty + 6, { size: 23, fill: "#b5701a", weight: "bold" }); ty += 40; }

        // blessings earned
        DG.Art.blessing(ctx, DG.W / 2 - 70, ty + 30, 18, DG.time);
        U.text(ctx, "+" + blessShown + " blessings", DG.W / 2 + 18, ty + 30, { size: 30, fill: "#c8761f" });
        if (cfg.newBest) U.text(ctx, "★ New Best! ★", DG.W / 2, ty + 72, { size: 24, fill: "#e2403b", weight: "bold" });
        ctx.restore();

        UI.drawButtons(buttons, ctx, DG.time);
      },
    };
  };

  /* word-wrap helper */
  function wrapText(ctx, text, maxW) {
    const words = text.split(" ");
    const lines = [];
    let cur = "";
    for (const w of words) {
      const test = cur ? cur + " " + w : w;
      if (ctx.measureText(test).width > maxW && cur) { lines.push(cur); cur = w; }
      else cur = test;
    }
    if (cur) lines.push(cur);
    return lines;
  }
  UI.wrapText = wrapText;
})();
