/* =====================================================================
   Divya Gatha — game_setu.js   (Ramayana, Game 2)
   "Setu Bandhanam" — build Ramudu's bridge (Rama Setu) to Lanka.
     • A glowing "రామ" stone hovers and drifts up & down at the bridge edge.
     • Tap to drop it — align it with the stone before to keep the causeway
       thick & strong. A clean line = "Perfect!".
     • Miss badly? The famous little squirrel rushes in and patches the gap,
       so the bridge ALWAYS advances. (Every effort counts — even the
       smallest. No losing.)
   Win: lay all the stones across the sea to Lanka.
   ===================================================================== */
(function () {
  "use strict";
  const DG = window.DG;
  const U = DG.util;
  const W = DG.W, H = DG.H;

  DG.Scenes.Setu = function () {
    const seaY = H * 0.46;
    const base = seaY + 96;        // causeway centre line
    const baseH = 124;             // ideal thickness
    const stepW = 94;
    const GOAL = 16;               // stones to reach Lanka
    const shoreRight = 220;

    const stones = [];             // {x0, top, bot, bob, saved, perfect}
    let activeRight = shoreRight;
    stones.push({ x0: -200, x1: shoreRight, top: base - baseH / 2 - 6, bot: base + baseH / 2 + 6, shore: true });

    let camX = -110, camTarget = -110;
    let placed = 0, perfects = 0, combo = 0, score = 0;
    let current = null;            // moving stone {cy, dir, h, t}
    let spawnDelay = 0.5;
    let state = "play", arriveT = 0;
    const debris = DG.Particles();
    const splash = DG.Particles();
    const floaters = DG.UI.Floaters();
    const squirrel = { active: false, x: 0, y: 0, tx: 0, t: 0, dir: 1 };
    let curThickness = baseH;
    let crossX = -300;             // Ramudu & army crossing on arrival

    const back = new DG.UI.Button({
      x: 22, y: 26, w: 56, h: 56, shape: "round", color: "#3a2a1a",
      icon: (ctx, cx, cy) => U.text(ctx, "←", cx, cy, { size: 30, fill: "#ffe9b3" }),
      onTap: () => DG.Flow.home(),
    });

    function spawnStone() {
      if (placed >= GOAL) { state = "arrive"; arriveT = 0; DG.Audio.bell(); return; }
      const amp = 150 + Math.min(placed * 6, 90);
      const spd = 1.4 + placed * 0.07;
      current = { cy: base - amp, dir: 1, h: curThickness, t: 0, amp, spd, x0: activeRight, slide: 1 };
    }

    function place() {
      if (!current || current.slide > 0) return;
      const prev = stones[stones.length - 1];
      const pTop = prev.top, pBot = prev.bot, pC = (pTop + pBot) / 2;
      const top = current.cy - current.h / 2;
      const bot = current.cy + current.h / 2;
      const oTop = Math.max(top, pTop), oBot = Math.min(bot, pBot);
      const overlap = oBot - oTop;
      const stone = { x0: activeRight, x1: activeRight + stepW, bob: U.rand(0, 6) };

      if (overlap < 14) {
        // squirrel to the rescue — a tiny aligned patch
        stone.top = pC - 12; stone.bot = pC + 12; stone.saved = true;
        curThickness = Math.max(40, 24);
        combo = 0;
        startSquirrel(activeRight + stepW / 2, pC);
        floaters.push(W * 0.6, base - 150, "Squirrel saves it!", { color: "#e8d3b0", size: 26 });
        DG.Audio.softFail();
        score += 1;
      } else {
        // trim overhang → falling debris
        spawnDebris(top, oTop, stone.x0); spawnDebris(oBot, bot, stone.x0);
        stone.top = oTop; stone.bot = oBot;
        const diff = Math.abs(current.cy - pC);
        if (diff < 15) {
          stone.perfect = true; perfects++; combo++;
          // a clean placement strengthens (regrows) the causeway
          const grow = Math.min(baseH, (oBot - oTop) + 26);
          const c = (oTop + oBot) / 2; stone.top = c - grow / 2; stone.bot = c + grow / 2;
          curThickness = grow;
          score += 2 + combo;
          floaters.push(activeRight + stepW / 2 - camX, stone.top - 18, combo > 1 ? "Perfect x" + combo + "!" : "Perfect!", { color: "#bfffd0", size: 28 });
          sparkle(activeRight + stepW / 2, c);
          DG.Audio.chime();
        } else {
          curThickness = oBot - oTop;
          combo = 0; score += 1;
          DG.Audio.thud();
        }
      }
      stones.push(stone);
      activeRight += stepW;
      placed++;
      camTarget = activeRight - W * 0.6;
      current = null;
      spawnDelay = 0.28;
      DG.Audio.drum();
    }

    function spawnDebris(a, b, x0) {
      if (b - a < 4) return;
      for (let i = 0; i < 5; i++) {
        debris.spawn({ x: x0 + U.rand(0, stepW) - camX, y: U.rand(a, b), vx: U.rand(-30, 30), vy: U.rand(-40, 20), g: 900, drag: 1, life: 1.4, size: U.rand(4, 9), type: "dot", color: U.choose(["#8a6a48", "#6e5238", "#a78a64"]) });
      }
    }
    function sparkle(wx, wy) {
      for (let i = 0; i < 14; i++) splash.spawn({ x: wx - camX, y: wy, vx: U.rand(-160, 160), vy: U.rand(-160, 60), g: 300, drag: 0.98, life: 0.7, size: U.rand(4, 8), type: "star", color: "#bfffd0" });
    }
    function startSquirrel(wx, wy) { squirrel.active = true; squirrel.x = wx + 260; squirrel.y = wy; squirrel.tx = wx; squirrel.t = 0; squirrel.dir = -1; }

    function waterSplash(wx) {
      for (let i = 0; i < 8; i++) splash.spawn({ x: wx - camX, y: seaY + 6, vx: U.rand(-80, 80), vy: U.rand(-220, -80), g: 700, drag: 1, life: 0.6, size: U.rand(4, 8), type: "splash", color: "#cdeefb" });
      DG.Audio.splash();
    }

    spawnStone.firstDelay = true;

    return {
      buttons: [back],
      enter() { DG.Audio.startMusic(); spawnDelay = 0.7; },
      onDown(p) { DG.UI.handleDown([back], p); if (state === "play" && !back.contains(p)) place(); },
      onUp(p) { DG.UI.handleUp([back], p); },
      onKey(code) { if ((code === "Space" || code === "ArrowUp") && state === "play") place(); },

      update(dt) {
        debris.update(dt); splash.update(dt); floaters.update(dt);
        camX = U.lerp(camX, camTarget, U.clamp(dt * 4, 0, 1));

        if (squirrel.active) {
          squirrel.t += dt;
          squirrel.x = U.approach(squirrel.x, squirrel.tx, 420 * dt);
          if (Math.abs(squirrel.x - squirrel.tx) < 2 && squirrel.t > 1.4) squirrel.active = false;
        }

        if (state === "arrive") {
          arriveT += dt;
          crossX = U.lerp(crossX, activeRight - W * 0.1, dt * 1.2);
          camTarget = activeRight - W * 0.55;
          if (arriveT > 0.3 && Math.random() < dt * 8) splash.spawn({ x: U.rand(0, W), y: U.rand(0, H * 0.4), vy: 70, type: "petal", color: U.choose(["#ffb3c7", "#ffd98a", "#bfffd0"]), life: 3.2, size: 9, g: 18 });
          if (arriveT > 3.2) finish();
          return;
        }

        if (current) {
          if (current.slide > 0) { current.slide = Math.max(0, current.slide - dt * 3); }
          else { current.t += dt; current.cy = base + Math.sin(current.t * current.spd) * current.amp; }
        } else {
          spawnDelay -= dt;
          if (spawnDelay <= 0) spawnStone();
        }
      },

      render(ctx) {
        DG.Art.sky(ctx, [[0, "#3a78b0"], [0.5, "#86bfe0"], [1, "#dff2ff"]]);
        DG.Art.sun(ctx, W * 0.8, 150, 44, DG.time, "#fff6d8", "#ffd98a", false);
        DG.Art.cloud(ctx, (W * 0.3 - camX * 0.1) % (W + 200), 120, 40, "#fff", 0.85);
        DG.Art.cloud(ctx, (W * 0.7 - camX * 0.1) % (W + 200) + 100, 180, 32, "#fff", 0.8);

        // Lanka temple at the end of the bridge
        const lankaWorld = shoreRight + GOAL * stepW + 120;
        DG.Art.glow(ctx, lankaWorld - camX, seaY - 10, 130, "#ffd98a", 0.4);
        DG.Art.temple(ctx, lankaWorld - camX, seaY + 30, 56, "#caa24a");

        // sea
        DG.Art.ocean(ctx, seaY, H, DG.time, { deep: "#0c4a72", mid: "#1f76ad", light: "#5fb0d6", foam: "#dff4ff" });
        DG.Art.waterline(ctx, seaY, DG.time);

        // start shore (left) with Ramudu, Lakshmana, vanaras
        const shoreScreenR = shoreRight - camX;
        ctx.fillStyle = "#d8c089";
        ctx.beginPath(); ctx.moveTo(-50, H); ctx.lineTo(-50, seaY - 20); ctx.quadraticCurveTo(shoreScreenR - 120, seaY - 26, shoreScreenR, seaY + 10); ctx.lineTo(shoreScreenR, H); ctx.closePath(); ctx.fill();
        DG.Art.tree(ctx, shoreScreenR - 200, seaY - 18, 56, "#2f7d4f");
        DG.Art.ramudu(ctx, shoreScreenR - 120, seaY - 6, 0.9, DG.time, { bow: true });
        DG.Art.lakshmana(ctx, shoreScreenR - 60, seaY + 2, 0.8, DG.time);
        DG.Art.vanara(ctx, shoreScreenR - 170, seaY + 6, 0.8, DG.time, { fur: "#a86a3a" });
        DG.Art.vanara(ctx, shoreScreenR - 235, seaY + 12, 0.7, DG.time, { fur: "#9a5a2a" });

        // placed bridge stones (+ reflections)
        for (const s of stones) {
          if (s.shore) continue;
          const sx = s.x0 - camX;
          if (sx > W + 60 || sx < -120) continue;
          const bob = Math.sin(DG.time * 1.5 + s.x0 * 0.05) * 2;
          // reflection
          ctx.save(); ctx.globalAlpha = 0.18;
          ctx.fillStyle = "#0c4a72";
          ctx.fillRect(sx + 4, s.bot + bob, stepW - 8, (s.bot - s.top) * 0.5);
          ctx.restore();
          DG.Art.stone(ctx, sx + stepW / 2, (s.top + s.bot) / 2 + bob, stepW - 6, s.bot - s.top, DG.time, { glow: s.perfect });
          if (s.perfect) { ctx.strokeStyle = "rgba(150,255,180,0.5)"; ctx.lineWidth = 2; U.roundRect(ctx, sx + 3, s.top + bob, stepW - 6, s.bot - s.top, 10); ctx.stroke(); }
        }

        // drop guide + previous-centre marker
        if (current && state === "play") {
          const prev = stones[stones.length - 1];
          const pC = (prev.top + prev.bot) / 2;
          const gx = activeRight + stepW / 2 - camX;
          ctx.strokeStyle = "rgba(255,255,255,0.35)"; ctx.lineWidth = 2; ctx.setLineDash([8, 10]);
          ctx.beginPath(); ctx.moveTo(gx, seaY - 60); ctx.lineTo(gx, H); ctx.stroke(); ctx.setLineDash([]);
          ctx.strokeStyle = "rgba(191,255,208,0.7)"; ctx.lineWidth = 3;
          ctx.beginPath(); ctx.moveTo(gx - 26, pC); ctx.lineTo(gx + 26, pC); ctx.stroke();
          // moving glowing stone
          const sx = current.x0 + stepW * current.slide * 1.2 - camX;
          DG.Art.stone(ctx, sx + stepW / 2, current.cy, stepW - 6, current.h, DG.time, { glow: true });
          DG.Art.glow(ctx, sx + stepW / 2, current.cy, 60, "#ffe07a", 0.4);
        }

        // squirrel
        if (squirrel.active) DG.Art.squirrel(ctx, squirrel.x - camX, squirrel.y - 20 + Math.sin(squirrel.t * 12) * 3, 1.1, DG.time, { dir: squirrel.dir });

        debris.draw(ctx); splash.draw(ctx);

        // arrival crossing
        if (state === "arrive") {
          DG.Art.ramudu(ctx, crossX - camX, base - (stones[stones.length - 1] ? (base - (stones[stones.length - 1].top + stones[stones.length - 1].bot) / 2) : 0) - 60, 0.85, DG.time, { bow: true });
          DG.Art.vanara(ctx, crossX - camX - 70, base - 56, 0.8, DG.time);
          DG.Art.squirrel(ctx, crossX - camX + 60, base - 50, 1.0, DG.time, { dir: 1 });
          DG.UI.title(ctx, "Setu complete!", W / 2, 150, 54, DG.time);
        }

        floaters.draw(ctx);

        // HUD
        back.draw(ctx, DG.time);
        // progress
        const bx = 96, bw = W - 96 - 30, byy = 40;
        ctx.fillStyle = "rgba(20,14,46,0.55)"; U.roundRect(ctx, bx, byy, bw, 18, 9); ctx.fill();
        const pg = ctx.createLinearGradient(bx, 0, bx + bw, 0); pg.addColorStop(0, "#ffd98a"); pg.addColorStop(1, "#ff8a4a");
        ctx.fillStyle = pg; U.roundRect(ctx, bx, byy, bw * U.clamp(placed / GOAL, 0.02, 1), 18, 9); ctx.fill();
        U.text(ctx, "🛕", bx + bw + 16, byy + 9, { size: 22 });
        U.text(ctx, "stones " + placed + " / " + GOAL, bx + 6, byy + 38, { size: 17, fill: "rgba(255,255,255,0.85)", align: "left" });
        // combo
        if (combo > 1 && state === "play") U.text(ctx, "Perfect streak x" + combo, W / 2, 36, { size: 24, fill: "#bfffd0", stroke: "rgba(0,0,0,0.4)", strokeW: 4 });

        if (placed < 2 && state === "play") U.text(ctx, "Tap to drop the stone in line", W / 2, H - 60, { size: 24, fill: "rgba(255,255,255,0.95)", stroke: "rgba(0,0,0,0.35)", strokeW: 5 });
      },
    };

    function finish() {
      const stars = perfects >= 12 ? 3 : perfects >= 7 ? 2 : 1;
      DG.Flow.win("setu", {
        score, stars, blessings: placed + perfects * 2, reached: 1,
        title: "The bridge is built!",
        titleTe: "సేతువు పూర్తయింది!",
        lines: [
          "Stone by stone, the vanara army built Ramudu's bridge across the sea — the stones floated because Ramudu's name was written on them.",
          "You laid " + placed + " stones with " + perfects + " perfect placements. Even the little squirrel helped, for every effort matters.",
        ],
        lesson: "Teamwork — big and small — builds great things.",
      });
    }
  };
})();
