/* =====================================================================
   Divya Gatha — scene_home.js
   The hub: animated dawn temple scene, three game cards, blessings,
   "lamps of devotion" that light up with total stars, mute + info.
   Reads the game registry from DG.games and navigates via DG.Flow.
   ===================================================================== */
(function () {
  "use strict";
  const DG = window.DG;
  const U = DG.util;

  DG.Scenes.Home = function () {
    const petals = DG.UI.makePetals();
    let infoOpen = false;
    let flyer = { x: -200, y: 180, t: U.rand(3, 9) }; // Hanumanthudu crossing the sky

    // --- cards from registry ---
    const cardX = 46, cardW = DG.W - 92, cardH = 230, gap = 22, top = 332;
    const cards = DG.games.map((g, i) => {
      const y = top + i * (cardH + gap);
      return {
        g, x: cardX, y, w: cardW, h: cardH, pressed: 0,
        onTap: () => DG.Flow.play(g.id),
        contains(p) { return p.x >= this.x && p.x <= this.x + this.w && p.y >= this.y && p.y <= this.y + this.h; },
      };
    });

    const muteBtn = new DG.UI.Button({
      x: DG.W - 86, y: 40, w: 60, h: 60, shape: "round", color: "#2a1d4e",
      icon: (ctx, cx, cy, r) => U.text(ctx, DG.Audio.muted ? "🔇" : "🔊", cx, cy + 1, { size: 28 }),
      onTap: () => { DG.Audio.toggleMute(); if (!DG.Audio.muted) DG.Audio.startMusic(); },
    });
    const infoBtn = new DG.UI.Button({
      x: 26, y: 40, w: 60, h: 60, shape: "round", color: "#2a1d4e",
      icon: (ctx, cx, cy) => U.text(ctx, "i", cx, cy, { size: 34, fill: "#ffe9b3", family: "Georgia, serif" }),
      onTap: () => { infoOpen = true; },
    });
    const infoClose = new DG.UI.Button({
      x: DG.W / 2 - 110, y: DG.H - 250, w: 220, h: 80, label: "Got it", style: "primary", font: 32,
      onTap: () => { infoOpen = false; },
    });

    const tappables = [...cards, muteBtn, infoBtn];

    function drawCard(ctx, c, t) {
      const g = c.g;
      const press = c.pressed ? 4 : 0;
      ctx.save();
      ctx.translate(0, press);
      DG.UI.panel(ctx, c.x, c.y, c.w, c.h, { top: U.mix(g.accent, "#ffffff", 0.78), bottom: U.mix(g.accent, "#ffffff", 0.55), border: g.accent, r: 26 });
      // illustration medallion on the left
      const medR = 78, icx = c.x + 104, icy = c.y + c.h / 2;
      ctx.save();
      ctx.beginPath(); ctx.arc(icx, icy, medR, 0, U.TAU); ctx.clip();
      const bg = ctx.createLinearGradient(icx, icy - medR, icx, icy + medR);
      bg.addColorStop(0, U.mix(g.accent, "#fff", 0.35)); bg.addColorStop(1, g.accent);
      ctx.fillStyle = bg; ctx.fillRect(icx - medR - 8, icy - medR - 8, medR * 2 + 16, medR * 2 + 16);
      g.icon(ctx, icx, icy, 64, t);
      ctx.restore();
      ctx.strokeStyle = "rgba(255,255,255,0.7)"; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.arc(icx, icy, medR, 0, U.TAU); ctx.stroke();

      // texts
      const tx = c.x + 198;
      U.text(ctx, g.titleEn, tx, c.y + 52, { size: 30, fill: "#3a2410", align: "left", shadow: "rgba(255,255,255,0.5)", shadowBlur: 2 });
      U.text(ctx, g.titleTe, tx, c.y + 88, { size: 23, fill: U.mix(g.accent, "#000", 0.25), align: "left", family: '"Nirmala UI","Noto Sans Telugu",sans-serif' });
      ctx.fillStyle = "#6a4a2a"; ctx.textAlign = "left"; ctx.textBaseline = "top";
      ctx.font = '500 21px "Trebuchet MS", sans-serif';
      const tagLines = DG.UI.wrapText(ctx, g.tag, c.w - 218);
      let ty = c.y + 116;
      for (const ln of tagLines.slice(0, 2)) { ctx.fillText(ln, tx, ty); ty += 26; }
      // stars + best
      const st = DG.Store.game(g.id);
      const sy = c.y + c.h - 34;
      for (let i = 0; i < 3; i++) DG.Art.star(ctx, tx + 18 + i * 40, sy, 15, i < st.stars, t);
      if (st.best > 0) U.text(ctx, g.bestLabel ? g.bestLabel(st.best) : "Best " + st.best, c.x + c.w - 24, sy, { size: 20, fill: "#8a5a2a", align: "right" });
      ctx.restore();
    }

    return {
      enter() { DG.Audio.startMusic(); },
      update(dt) {
        petals.update(dt);
        flyer.t -= dt;
        if (flyer.t <= 0 && flyer.x < -150) { flyer.x = -180; flyer.y = U.rand(120, 240); flyer.t = 0; }
        if (flyer.x >= -180 && flyer.x < DG.W + 200) flyer.x += dt * 150;
        if (flyer.x >= DG.W + 200) { flyer.x = -400; flyer.t = U.rand(8, 16); }
        // smooth press release
        for (const c of cards) c.pressed = c.pressed && c._held ? 1 : 0;
      },
      onDown(p) {
        if (infoOpen) { DG.UI.handleDown([infoClose], p); return; }
        DG.UI.handleDown(tappables, p);
        for (const c of cards) { c._held = c.pressed = c.contains(p); }
      },
      onUp(p) {
        if (infoOpen) { DG.UI.handleUp([infoClose], p); return; }
        for (const c of cards) c._held = false;
        DG.UI.handleUp(tappables, p);
      },
      render(ctx) {
        // dawn sky
        DG.Art.sky(ctx, [[0, "#2c2061"], [0.35, "#7d4f93"], [0.7, "#f3956a"], [1, "#ffd089"]]);
        DG.Art.stars(ctx, DG.time, 28, 220);
        DG.Art.sun(ctx, DG.W * 0.5, 250, 54, DG.time, "#fff3c4", "#ff9a4a");
        // distant temple + hills
        DG.Art.hills(ctx, 320, 120, "#6b4a86", 3, 6);
        DG.Art.temple(ctx, DG.W * 0.5, 300, 52, "#4a356e");
        DG.Art.hills(ctx, 330, 80, "#7e5a96", 11, 7);
        // flyer
        DG.Art.hanuman(ctx, flyer.x, flyer.y + Math.sin(DG.time * 3) * 6, 0.5, DG.time, { lean: -0.15 });
        petals.draw(ctx);

        // toran across the very top
        DG.Art.toran(ctx, 10, DG.W - 10, 8);

        // title
        DG.UI.title(ctx, "Divya Gatha", DG.W / 2, 150, 72, DG.time);
        U.text(ctx, "దివ్య గాథ", DG.W / 2, 200, { size: 32, fill: "#ffe7b3", family: '"Nirmala UI","Noto Sans Telugu",sans-serif', shadow: "rgba(0,0,0,0.4)", shadowBlur: 6 });
        U.text(ctx, "Epic adventures of the Ramayana & Mahabharata", DG.W / 2, 240, { size: 21, fill: "rgba(255,255,255,0.92)", weight: "500", shadow: "rgba(0,0,0,0.4)", shadowBlur: 4 });

        // blessings chip
        DG.UI.chip(ctx, DG.W / 2, 268, DG.Store.data.blessings + " blessings", {
          icon: (c, x, y, r) => DG.Art.blessing(c, x, y, r, DG.time),
        });

        // cards
        for (const c of cards) drawCard(ctx, c, DG.time);

        // lamps of devotion (light up with total stars; max 9)
        const totalStars = DG.Store.totalStars();
        const ly = DG.H - 70;
        const n = 9;
        for (let i = 0; i < n; i++) {
          const x = DG.W / 2 + (i - (n - 1) / 2) * 64;
          DG.Art.diya(ctx, x, ly, 13, i < totalStars, DG.time);
        }
        U.text(ctx, totalStars > 0 ? "Lamps of devotion: " + totalStars + " / 9" : "Earn stars to light the lamps", DG.W / 2, DG.H - 28, { size: 19, fill: "rgba(255,231,179,0.85)" });

        muteBtn.draw(ctx, DG.time);
        infoBtn.draw(ctx, DG.time);

        // info overlay
        if (infoOpen) {
          ctx.fillStyle = "rgba(10,7,24,0.78)"; ctx.fillRect(0, 0, DG.W, DG.H);
          const px = 60, py = 260, pw = DG.W - 120, ph = 660;
          DG.UI.panel(ctx, px, py, pw, ph);
          DG.UI.title(ctx, "For Grown-ups", DG.W / 2, py + 56, 40, DG.time);
          const lines = [
            "Divya Gatha is a gentle, ad-free, offline story-playground drawn from our epics.",
            "",
            "• Three hand-crafted games — no quizzes, just play.",
            "• The deities and heroes always succeed — there is no \"losing\" to evil. Children explore the stories at their own pace.",
            "• Hanumanthudu leaps to Lanka, the vanaras build Ramudu's bridge, and Arjunudu learns the power of focus.",
            "• Stars and blessings are saved on this device only.",
            "",
            "Made with love, so little ones can meet Hanumanthudu, Ramudu, Sitamma and Arjunudu through play.",
          ];
          ctx.fillStyle = "#5a3a1e"; ctx.textAlign = "center"; ctx.textBaseline = "top";
          ctx.font = '500 24px "Trebuchet MS", sans-serif';
          let ty = py + 110;
          for (const line of lines) {
            if (!line) { ty += 14; continue; }
            const wrapped = DG.UI.wrapText(ctx, line, pw - 64);
            for (const w of wrapped) { ctx.fillText(w, DG.W / 2, ty); ty += 31; }
            ty += 4;
          }
          infoClose.draw(ctx, DG.time);
        }
      },
    };
  };
})();
