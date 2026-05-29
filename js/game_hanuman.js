/* =====================================================================
   Divya Gatha — game_hanuman.js   (Ramayana, Game 1)
   "Hanumanthudu's Leap" — a serene hold-to-fly journey across the great
   ocean to Lanka to find Sitamma.
     • Hold anywhere to rise, release to glide gently down.
     • Collect golden blessings; gather Rama-nama orbs to refill devotion.
     • Storm clouds & rocks only cost devotion — when it empties Hanumanthudu
       simply pauses to breathe, then flies on. He NEVER loses. The only
       outcome is reaching Lanka. (Respecting the deity, per design.)
   ===================================================================== */
(function () {
  "use strict";
  const DG = window.DG;
  const U = DG.util;
  const W = DG.W, H = DG.H;

  DG.Scenes.Hanuman = function () {
    const DURATION = 70;           // seconds of flight to Lanka
    const oceanY = H - 150;
    const ceil = 150;
    const heroX = W * 0.32;

    const hero = { y: H * 0.45, vy: 0, kb: 0, flap: 0, invuln: 0, bow: 0 };
    let holding = false;
    let prog = 0, scroll = 0, speed = 260;
    let collected = 0, dev = 100, devMax = 100, resting = 0;
    let spawnT = 0, lineT = 1.2;
    let state = "play", arriveT = 0;
    const ents = [];               // {kind:'flower'|'orb'|'cloud'|'rock', x,y,r,phase,amp,by}
    const clouds = [];             // pure parallax decoration
    const parts = DG.Particles();
    const floaters = DG.UI.Floaters();
    let sitaX = W + 360;

    for (let i = 0; i < 6; i++) clouds.push({ x: U.rand(0, W), y: U.rand(120, 380), s: U.rand(26, 54), sp: U.rand(8, 22), a: U.rand(0.5, 0.9) });

    const back = new DG.UI.Button({
      x: 22, y: 26, w: 56, h: 56, shape: "round", color: "#22305a",
      icon: (ctx, cx, cy) => U.text(ctx, "←", cx, cy, { size: 30, fill: "#ffe9b3" }),
      onTap: () => DG.Flow.home(),
    });

    function spawnFlowerLine() {
      const n = U.randInt(3, 5);
      const by = U.rand(ceil + 120, oceanY - 160);
      const amp = U.rand(40, 120);
      const ph = U.rand(0, 6.28);
      for (let i = 0; i < n; i++) {
        ents.push({ kind: "flower", x: W + 60 + i * 78, y: by + Math.sin(ph + i * 0.7) * amp, r: 20, t: U.rand(0, 6) });
      }
      if (U.chance(0.4)) ents.push({ kind: "orb", x: W + 60 + n * 78 + 40, y: U.rand(ceil + 140, oceanY - 180), r: 24, t: U.rand(0, 6) });
    }
    function spawnObstacle() {
      if (U.chance(0.6)) {
        ents.push({ kind: "cloud", x: W + 90, y: U.rand(ceil + 120, oceanY - 220), r: 56, t: U.rand(0, 6), by: 0 });
      } else {
        ents.push({ kind: "rock", x: W + 90, y: U.rand(ceil + 160, oceanY - 120), r: 40, t: U.rand(0, 6), spin: U.rand(-1, 1) });
      }
    }

    function hit() {
      if (hero.invuln > 0 || resting > 0) return;
      dev -= 34; hero.invuln = 1.1; hero.kb = 70; hero.vy = -120;
      DG.Audio.softFail();
      parts.burst({ x: heroX, y: hero.y, type: "spark", color: "#ffd0d0", speedMin: 80, speedMax: 220, life: 0.5, size: 5 }, 12);
      if (dev <= 0) { dev = 0; resting = 1.6; floaters.push(heroX, hero.y - 70, "Breathe…", { color: "#cfe3ff", size: 30 }); }
    }

    function collect(e) {
      if (e.kind === "flower") {
        collected += 1; DG.Audio.coin();
        floaters.push(e.x, e.y - 10, "+1", { color: "#fff3b0" });
      } else {
        collected += 2; dev = Math.min(devMax, dev + 28); DG.Audio.sparkle();
        floaters.push(e.x, e.y - 10, "Jai! +2", { color: "#bfe0ff", size: 30 });
      }
      parts.burst({ x: e.x, y: e.y, type: "star", color: "#ffe07a", speedMin: 60, speedMax: 180, life: 0.6, size: 5, g: 60 }, 10);
    }

    return {
      buttons: [back],
      enter() { DG.Audio.startMusic(); },
      onDown(p) { DG.UI.handleDown([back], p); holding = true; },
      onUp(p) { DG.UI.handleUp([back], p); holding = false; },
      onKey(code) { if (code === "Space" || code === "ArrowUp") { hero.vy = -360; hero.flap = 1; DG.Audio.flap(); } },

      update(dt) {
        parts.update(dt); floaters.update(dt);
        for (const c of clouds) { c.x -= c.sp * dt * (0.4 + prog * 0.3); if (c.x < -120) { c.x = W + 120; c.y = U.rand(120, 380); } }

        if (state === "arrive") {
          arriveT += dt;
          sitaX = U.lerp(sitaX, W * 0.62, dt * 2.2);
          hero.bow = U.lerp(hero.bow, 0.5, dt * 2);
          hero.y = U.lerp(hero.y, H * 0.5, dt * 2);
          hero.flap = Math.max(0, hero.flap - dt * 2);
          if (arriveT > 0.4 && Math.random() < dt * 6) parts.spawn({ x: U.rand(W * 0.4, W * 0.8), y: H * 0.3, vy: 60, type: "petal", color: U.choose(["#ffb3c7", "#ffd98a"]), life: 3, size: 9, g: 20 });
          if (arriveT > 3.0) finish();
          return;
        }

        // flight physics — hold to rise, release to glide
        const G = 980, LIFT = 1750;
        if (resting > 0) {
          resting -= dt;
          hero.y = U.approach(hero.y, H * 0.42, 140 * dt);
          hero.invuln = Math.max(hero.invuln, 0.2);
          dev = Math.min(devMax, dev + (devMax / 1.6) * dt);
        } else {
          hero.vy += G * dt;
          if (holding) { hero.vy -= LIFT * dt; hero.flap = Math.min(1, hero.flap + dt * 6); }
          else hero.flap = Math.max(0, hero.flap - dt * 4);
          hero.vy = U.clamp(hero.vy, -460, 620);
          hero.y += hero.vy * dt;
          if (holding && Math.random() < dt * 8) DG.Audio.flap();
        }
        if (hero.y < ceil) { hero.y = ceil; hero.vy = Math.max(hero.vy, 40); }
        if (hero.y > oceanY - 14) { // gentle bounce off the sea — never a loss
          hero.y = oceanY - 14; hero.vy = -360;
          parts.burst({ x: heroX, y: oceanY, type: "splash", color: "#cdeefb", angle: -Math.PI / 2, spread: 0.7, speedMin: 100, speedMax: 240, life: 0.5, size: 6, g: 400 }, 8);
          DG.Audio.splash();
          if (hero.invuln <= 0 && resting <= 0) { dev = Math.max(0, dev - 10); hero.invuln = 0.6; }
        }
        hero.kb = U.approach(hero.kb, 0, 160 * dt);
        if (hero.invuln > 0) hero.invuln -= dt;

        // progress & speed
        speed = 260 + prog * 110;
        scroll += speed * dt;
        prog += dt / DURATION;
        if (prog >= 1) { prog = 1; state = "arrive"; arriveT = 0; DG.Audio.bell(); return; }

        // spawning
        spawnT -= dt; lineT -= dt;
        if (lineT <= 0) { spawnFlowerLine(); lineT = U.rand(1.6, 2.6); }
        if (spawnT <= 0 && prog > 0.06) { spawnObstacle(); spawnT = U.rand(1.4, 2.4) * (1.2 - prog * 0.4); }

        // move + collide
        for (let i = ents.length - 1; i >= 0; i--) {
          const e = ents[i];
          e.x -= speed * dt;
          e.t += dt;
          if (e.kind === "cloud") e.y += Math.sin(e.t * 1.5) * 14 * dt;
          if (e.x < -100) { ents.splice(i, 1); continue; }
          const d = U.dist(e.x, e.y, heroX + hero.kb, hero.y);
          if (e.kind === "flower" || e.kind === "orb") {
            if (d < e.r + 34) { collect(e); ents.splice(i, 1); }
          } else {
            if (d < e.r + 24) hit();
          }
        }
      },

      render(ctx) {
        // sky
        const golden = state === "arrive";
        DG.Art.sky(ctx, golden
          ? [[0, "#6a4ea0"], [0.5, "#ffae6a"], [1, "#ffe0a0"]]
          : [[0, "#4a78b8"], [0.55, "#8fc1e6"], [1, "#d8f0ff"]]);
        DG.Art.sun(ctx, W * 0.74, 180, 46, DG.time, "#fff6d8", golden ? "#ff9a4a" : "#ffd98a", false);
        for (const c of clouds) DG.Art.cloud(ctx, c.x, c.y, c.s, "#ffffff", c.a);

        // distant Lanka on the horizon, growing as we near
        const lankaX = U.lerp(W + 120, W * 0.78, U.clamp(prog * 1.15, 0, 1));
        DG.Art.glow(ctx, lankaX, oceanY - 70, 120, "#ffd98a", 0.4 * U.clamp(prog, 0, 1));
        DG.Art.temple(ctx, lankaX, oceanY - 30, 30 + prog * 26, "#caa24a");

        // ocean
        DG.Art.ocean(ctx, oceanY, H, DG.time, { deep: "#0c4a72", mid: "#1f76ad", light: "#5fb0d6", foam: "#dff4ff" }, scroll);
        DG.Art.waterline(ctx, oceanY, DG.time);

        // arrival shore + Sitamma
        if (state === "arrive") {
          ctx.fillStyle = "#e6c98a";
          ctx.beginPath(); ctx.moveTo(sitaX - 80, H); ctx.lineTo(sitaX - 40, oceanY - 6);
          ctx.quadraticCurveTo(sitaX + 120, oceanY - 30, sitaX + 260, oceanY + 20); ctx.lineTo(W + 60, H); ctx.closePath(); ctx.fill();
          DG.Art.tree(ctx, sitaX + 120, oceanY - 4, 70, "#2f7d4f", "#6b4423");
          DG.Art.sitamma(ctx, sitaX + 40, oceanY - 30, 1.0, DG.time);
        }

        // entities
        for (const e of ents) {
          if (e.kind === "flower") DG.Art.blessing(ctx, e.x, e.y, 16, e.t);
          else if (e.kind === "orb") {
            DG.Art.glow(ctx, e.x, e.y, 30, "#bfe0ff", 0.6);
            DG.Art.blessing(ctx, e.x, e.y, 18, e.t * 1.4);
            U.text(ctx, "ॐ", e.x, e.y, { size: 18, fill: "#3a2a6a" });
          } else if (e.kind === "cloud") {
            DG.Art.cloud(ctx, e.x, e.y, e.r * 0.6, "#6b6f8a", 0.92);
            ctx.fillStyle = "rgba(80,90,120,0.5)";
            for (let k = 0; k < 2; k++) { const fx = e.x - 10 + k * 20, fy = e.y + e.r * 0.5 + Math.sin(e.t * 6 + k) * 3; ctx.fillRect(fx, fy, 3, 12); }
          } else {
            ctx.save(); ctx.translate(e.x, e.y); ctx.rotate(e.t * (e.spin || 0.4));
            const g = ctx.createLinearGradient(0, -e.r, 0, e.r); g.addColorStop(0, "#9a8a78"); g.addColorStop(1, "#5a4636");
            ctx.fillStyle = g; ctx.beginPath();
            ctx.moveTo(-e.r, 6); ctx.lineTo(-e.r * 0.5, -e.r); ctx.lineTo(e.r * 0.6, -e.r * 0.7); ctx.lineTo(e.r, 4); ctx.lineTo(e.r * 0.3, e.r); ctx.lineTo(-e.r * 0.6, e.r * 0.8); ctx.closePath(); ctx.fill();
            ctx.restore();
          }
        }

        parts.draw(ctx);

        // Hanumanthudu
        const blink = hero.invuln > 0 && Math.floor(DG.time * 14) % 2 === 0;
        if (!blink) {
          const lean = state === "arrive" ? -0.1 : U.clamp(hero.vy / 900, -0.35, 0.5);
          DG.Art.hanuman(ctx, heroX + hero.kb, hero.y, 0.92, DG.time, { flap: hero.flap, lean });
        }
        floaters.draw(ctx);

        // ===== HUD =====
        back.draw(ctx, DG.time);
        // progress bar to Lanka
        const bx = 96, bw = W - 96 - 30, byy = 40;
        ctx.fillStyle = "rgba(20,14,46,0.6)"; U.roundRect(ctx, bx, byy, bw, 18, 9); ctx.fill();
        const pg = ctx.createLinearGradient(bx, 0, bx + bw, 0); pg.addColorStop(0, "#ffd98a"); pg.addColorStop(1, "#ff8a4a");
        ctx.fillStyle = pg; U.roundRect(ctx, bx, byy, bw * U.clamp(prog, 0.02, 1), 18, 9); ctx.fill();
        DG.Art.hanuman(ctx, bx + bw * U.clamp(prog, 0.02, 1), byy + 9, 0.18, DG.time, { flap: 0.5 });
        U.text(ctx, "🛕", bx + bw + 16, byy + 9, { size: 22 });
        U.text(ctx, "to Lanka", bx + 6, byy + 38, { size: 17, fill: "rgba(255,255,255,0.85)", align: "left" });
        // devotion meter
        const dy = byy + 56;
        ctx.fillStyle = "rgba(20,14,46,0.6)"; U.roundRect(ctx, bx, dy, bw, 14, 7); ctx.fill();
        const dg = ctx.createLinearGradient(bx, 0, bx + bw, 0); dg.addColorStop(0, "#ff7aa0"); dg.addColorStop(1, "#ffd0e0");
        ctx.fillStyle = dg; U.roundRect(ctx, bx, dy, bw * (dev / devMax), 14, 7); ctx.fill();
        U.text(ctx, "Devotion", bx + 6, dy + 26, { size: 15, fill: "rgba(255,255,255,0.8)", align: "left" });
        // blessings collected chip
        DG.UI.chip(ctx, W - 92, 96, "" + collected, { icon: (c, x, y, r) => DG.Art.blessing(c, x, y, r, DG.time), size: 26, h: 44 });

        if (state === "arrive") DG.UI.title(ctx, "Lanka!", W / 2, 150, 60, DG.time);
        else if (DG.time % 12 < 3 && prog < 0.12) U.text(ctx, "Hold to fly up • release to glide", W / 2, H - 60, { size: 24, fill: "rgba(255,255,255,0.95)", stroke: "rgba(0,0,0,0.35)", strokeW: 5 });
      },
    };

    function finish() {
      const stars = collected >= 18 ? 3 : collected >= 10 ? 2 : 1;
      DG.Flow.win("hanuman", {
        score: collected, stars, blessings: collected + 5, reached: 1,
        title: "You reached Lanka!",
        titleTe: "లంక చేరావు!",
        lines: [
          "Hanumanthudu crossed the vast ocean and found Sitamma safe in the Ashoka grove.",
          "He gave her Ramudu's ring and the hope that rescue was near. You gathered " + collected + " blessings on the way!",
        ],
        lesson: "Courage and devotion can cross any ocean.",
      });
    }
  };
})();
