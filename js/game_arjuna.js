/* =====================================================================
   Divya Gatha — game_arjuna.js   (Mahabharata, Game 3)
   "Arjunudu's Lakshyam" — the Matsya-Yantra. A golden fish revolves on a
   wheel; pierce its eye, as Arjunudu did to win the contest, by looking
   only at the reflection in the water.
     • HOLD to draw the bow and gather focus — the world quietly dims until
       only the eye remains (single-pointed concentration).
     • RELEASE to loose the arrow. The calmer & fuller your focus, the truer
       the arrow flies.
     • Missed shots simply land in the petals — breathe and try again,
       as many times as you like. (No losing; focus is the lesson.)
   Win: pierce the eye three times as the wheel spins ever faster.
   ===================================================================== */
(function () {
  "use strict";
  const DG = window.DG;
  const U = DG.util;
  const W = DG.W, H = DG.H;

  DG.Scenes.Arjuna = function () {
    const WC = { x: W * 0.5, y: H * 0.245 };
    const R = 118;
    const fl = R * 0.5;
    const eyeR = R * 0.09;
    const poolTop = H * 0.72;
    const bow = { x: W * 0.22, y: H * 0.6 };

    let angle = 0, omega = 1.05, dir = 1;
    let need = 3, hits = 0, arrows = 0, perfects = 0;
    let drawing = false, focus = 0;
    let aim = { x: WC.x, y: WC.y - R }, retic = { x: WC.x, y: WC.y - R };
    let arrow = null, frel = 0;
    const stuck = [];
    const parts = DG.Particles();
    const petals = DG.UI.makePetals(["#ffd98a", "#ffb3c7", "#fff3b0"]);
    const floaters = DG.UI.Floaters();
    let hitpause = 0, eyeFlash = 0, state = "play", arriveT = 0;

    const back = new DG.UI.Button({
      x: 22, y: 26, w: 56, h: 56, shape: "round", color: "#2a1d4e",
      icon: (ctx, cx, cy) => U.text(ctx, "←", cx, cy, { size: 30, fill: "#ffe9b3" }),
      onTap: () => DG.Flow.home(),
    });

    function eyeAt(a) {
      const Fo = { x: WC.x + R * Math.sin(a), y: WC.y - R * Math.cos(a) };
      const ex = fl * 0.32, ey = -fl * 0.05;
      return { x: Fo.x + ex * Math.cos(a) - ey * Math.sin(a), y: Fo.y + ex * Math.sin(a) + ey * Math.cos(a) };
    }

    function release() {
      if (!drawing) return;
      drawing = false;
      frel = focus;
      arrows++;
      const ox = bow.x + 8, oy = bow.y - 8;
      arrow = { x0: ox, y0: oy, tx: retic.x, ty: retic.y, t: 0, dur: 0.12 };
      DG.Audio.twang(); DG.Audio.arrowFly();
    }

    function evaluate() {
      const eye = eyeAt(angle);
      const d = U.dist(arrow.tx, arrow.ty, eye.x, eye.y);
      const tol = 15 + frel * 38;
      stuck.push({ x: arrow.tx, y: arrow.ty, ang: Math.atan2(arrow.ty - arrow.y0, arrow.tx - arrow.x0), life: 0 });
      if (d < tol) {
        hits++;
        const bull = d < 13 && frel > 0.85;
        if (bull) perfects++;
        eyeFlash = 0.6; hitpause = 0.7;
        DG.Audio.sparkle(); DG.Audio.chime();
        for (let i = 0; i < 22; i++) parts.spawn({ x: eye.x, y: eye.y, vx: U.rand(-220, 220), vy: U.rand(-220, 120), g: 320, drag: 0.98, life: 0.8, size: U.rand(4, 9), type: "star", color: bull ? "#fff3b0" : "#ffd86b" });
        floaters.push(eye.x, eye.y - 30, bull ? "Bullseye!" : "Hit!", { color: bull ? "#fff3b0" : "#bfffd0", size: 32 });
        if (hits >= need) { state = "arrive"; arriveT = 0; DG.Audio.conch(); }
        else { omega += 0.7; if (U.chance(0.4)) dir *= -1; }
      } else {
        DG.Audio.softFail();
        floaters.push(arrow.tx, arrow.ty - 20, "Focus…", { color: "#cfe3ff", size: 26, vy: -50 });
      }
      arrow = null;
    }

    return {
      buttons: [back],
      enter() { DG.Audio.startMusic(); },
      onDown(p) {
        DG.UI.handleDown([back], p);
        if (state === "play" && !arrow && hitpause <= 0 && !back.contains(p)) {
          drawing = true; focus = 0;
          aim = eyeAt(angle); retic = { x: aim.x, y: aim.y };
        }
      },
      onUp(p) { DG.UI.handleUp([back], p); release(); },
      onKey(code) { if (code === "Space") { if (drawing) release(); else if (!arrow && hitpause <= 0 && state === "play") { drawing = true; focus = 0; aim = eyeAt(angle); } } },

      update(dt) {
        parts.update(dt); petals.update(dt); floaters.update(dt);
        for (let i = stuck.length - 1; i >= 0; i--) { stuck[i].life += dt; if (stuck[i].life > 1.6) stuck.splice(i, 1); }
        if (eyeFlash > 0) eyeFlash -= dt;

        if (state === "arrive") {
          arriveT += dt;
          if (Math.random() < dt * 8) parts.spawn({ x: U.rand(0, W), y: U.rand(0, H * 0.4), vy: 70, type: "petal", color: U.choose(["#ffd98a", "#ffb3c7", "#fff3b0"]), life: 3.2, size: 9, g: 18 });
          if (arriveT > 3.0) finish();
          return;
        }

        if (hitpause > 0) { hitpause -= dt; }
        else {
          // concentration dilates time: the harder you focus, the slower the
          // wheel turns — so a calm, full-focus shot lands true.
          const slow = drawing ? (1 - focus * 0.9) : 1;
          angle += omega * dir * dt * slow;
        }

        if (drawing) {
          focus = Math.min(1, focus + dt / 1.1);
          const eye = eyeAt(angle);
          aim.x = U.lerp(aim.x, eye.x, U.clamp(dt * 6, 0, 1));
          aim.y = U.lerp(aim.y, eye.y, U.clamp(dt * 6, 0, 1));
          const wob = (1 - focus) * 46;
          retic.x = aim.x + Math.cos(DG.time * 6.7) * wob * 0.9 + Math.sin(DG.time * 3.1) * wob * 0.3;
          retic.y = aim.y + Math.sin(DG.time * 5.3) * wob;
        }

        if (arrow) {
          arrow.t += dt / arrow.dur;
          const e = U.easeOut(U.clamp(arrow.t, 0, 1));
          arrow.x = U.lerp(arrow.x0, arrow.tx, e);
          arrow.y = U.lerp(arrow.y0, arrow.ty, e);
          if (arrow.t >= 1) evaluate();
        }
      },

      render(ctx) {
        // ornate hall sky
        DG.Art.sky(ctx, [[0, "#33245e"], [0.5, "#6b4a86"], [0.72, "#caa0b0"], [1, "#f0c89a"]]);
        DG.Art.stars(ctx, DG.time, 26, H * 0.3);

        // hanging garland + diya posts
        DG.Art.toran(ctx, 0, W, 6, "#2e8b3d");
        DG.Art.diya(ctx, 60, H * 0.5, 18, true, DG.time);
        DG.Art.diya(ctx, W - 60, H * 0.5, 18, true, DG.time);

        // pole
        ctx.fillStyle = "#7a5a2a"; U.roundRect(ctx, WC.x - 9, WC.y, 18, H * 0.62 - WC.y, 6); ctx.fill();
        ctx.fillStyle = "#caa24a"; U.roundRect(ctx, WC.x - 9, WC.y, 18, 14, 4); ctx.fill();

        // the rotating fish wheel (eye is the target)
        DG.Art.fishWheel(ctx, WC.x, WC.y, R, angle);
        const eye = eyeAt(angle);
        if (eyeFlash > 0) { DG.Art.glow(ctx, eye.x, eye.y, 40, "#fff3b0", eyeFlash); }

        // hit pips
        for (let i = 0; i < need; i++) {
          const x = WC.x + (i - (need - 1) / 2) * 46;
          ctx.save(); ctx.globalAlpha = i < hits ? 1 : 0.3;
          DG.Art.glow(ctx, x, WC.y + R + 34, 16, "#ffd86b", i < hits ? 0.6 : 0.1);
          U.text(ctx, "🎯", x, WC.y + R + 34, { size: 24 }); ctx.restore();
        }

        // reflecting pool
        const pg = ctx.createLinearGradient(0, poolTop, 0, H);
        pg.addColorStop(0, "#2a5e86"); pg.addColorStop(1, "#10324e");
        ctx.fillStyle = pg; ctx.fillRect(0, poolTop, W, H - poolTop);
        DG.Art.waterline(ctx, poolTop, DG.time, "#bfe0f0");
        // faint inverted reflection of the wheel (the way Arjunudu aimed)
        ctx.save();
        ctx.beginPath(); ctx.rect(0, poolTop, W, H - poolTop); ctx.clip();
        ctx.globalAlpha = 0.22;
        ctx.translate(WC.x, poolTop + (poolTop - WC.y));
        ctx.scale(1, -1);
        ctx.translate(-WC.x, -poolTop + (WC.y - poolTop));
        const ripple = 1 + Math.sin(DG.time * 2) * 0.02;
        ctx.translate(WC.x, WC.y); ctx.scale(ripple, 1); ctx.translate(-WC.x, -WC.y);
        DG.Art.fishWheel(ctx, WC.x, WC.y, R, angle);
        ctx.restore();

        petals.draw(ctx);

        // Arjunudu + dynamic bow
        DG.Art.arjunudu(ctx, W * 0.16, H * 0.72, 1.15, DG.time);
        drawBow(ctx);

        // stuck arrows (missed) fading in the petals
        for (const s of stuck) { ctx.save(); ctx.globalAlpha = U.clamp(1 - s.life / 1.6, 0, 1); DG.Art.arrow(ctx, s.x, s.y, s.ang, 46); ctx.restore(); }
        // flying arrow
        if (arrow && arrow.x != null) DG.Art.arrow(ctx, arrow.x, arrow.y, Math.atan2(arrow.ty - arrow.y0, arrow.tx - arrow.x0), 48);

        parts.draw(ctx);

        // ---- focus visualisation: world dims, only the eye/reticle remains ----
        if (drawing) {
          const holeR = U.lerp(150, 46, focus);
          const g = ctx.createRadialGradient(retic.x, retic.y, holeR * 0.4, retic.x, retic.y, holeR + 240);
          g.addColorStop(0, "rgba(8,6,22,0)");
          g.addColorStop(0.5, U.rgba("#08061a", 0.26 + focus * 0.32));
          g.addColorStop(1, U.rgba("#08061a", 0.42 + focus * 0.32));
          ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
          // highlight the true eye
          DG.Art.glow(ctx, eye.x, eye.y, 26, "#fff3b0", 0.3 + focus * 0.5);
          // reticle ring
          ctx.strokeStyle = U.mix("#ffffff", "#ffd24a", focus); ctx.lineWidth = 3;
          const rr = U.lerp(58, 16, focus);
          ctx.beginPath(); ctx.arc(retic.x, retic.y, rr, 0, U.TAU); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(retic.x - rr - 8, retic.y); ctx.lineTo(retic.x - rr + 6, retic.y);
          ctx.moveTo(retic.x + rr - 6, retic.y); ctx.lineTo(retic.x + rr + 8, retic.y);
          ctx.moveTo(retic.x, retic.y - rr - 8); ctx.lineTo(retic.x, retic.y - rr + 6);
          ctx.moveTo(retic.x, retic.y + rr - 6); ctx.lineTo(retic.x, retic.y + rr + 8); ctx.stroke();
        }

        // arrival
        if (state === "arrive") DG.UI.title(ctx, "Lakshya Bhedam!", W / 2, H * 0.5, 50, DG.time);

        floaters.draw(ctx);

        // ===== HUD =====
        back.draw(ctx, DG.time);
        // focus / steadiness bar
        const bx = 30, by = H * 0.62, bh = H * 0.22;
        ctx.fillStyle = "rgba(20,14,46,0.55)"; U.roundRect(ctx, bx, by, 16, bh, 8); ctx.fill();
        const fg = ctx.createLinearGradient(0, by + bh, 0, by); fg.addColorStop(0, "#8fd0e6"); fg.addColorStop(1, "#fff3b0");
        ctx.fillStyle = fg; const fhh = bh * (drawing ? focus : 0); U.roundRect(ctx, bx, by + bh - fhh, 16, fhh, 8); ctx.fill();
        U.text(ctx, "focus", bx + 8, by + bh + 18, { size: 16, fill: "rgba(255,255,255,0.8)" });
        DG.UI.chip(ctx, W - 96, 40, hits + " / " + need, { size: 24, h: 44, icon: (c, x, y, r) => U.text(c, "🎯", x, y, { size: r * 2 }) });
        U.text(ctx, "Arrows: " + arrows, W - 96, 84, { size: 18, fill: "rgba(255,255,255,0.85)" });

        if (arrows === 0 && !drawing && state === "play") U.text(ctx, "Hold to aim & focus • release to shoot", W / 2, H - 40, { size: 23, fill: "rgba(255,255,255,0.95)", stroke: "rgba(0,0,0,0.35)", strokeW: 5 });
      },
    };

    function drawBow(ctx) {
      const eye = retic;
      const ang = Math.atan2((drawing ? retic.y : WC.y - R) - bow.y, (drawing ? retic.x : WC.x) - bow.x);
      const pull = drawing ? focus * 16 : 0;
      ctx.save();
      ctx.translate(bow.x, bow.y);
      ctx.rotate(ang);
      // bow limb
      ctx.strokeStyle = "#8a5a22"; ctx.lineWidth = 6; ctx.lineCap = "round";
      ctx.beginPath(); ctx.arc(0, 0, 46, -1.15, 1.15); ctx.stroke();
      // string
      const tipx = Math.cos(-1.15) * 46, tipy = Math.sin(-1.15) * 46;
      const tipx2 = Math.cos(1.15) * 46, tipy2 = Math.sin(1.15) * 46;
      ctx.strokeStyle = "#f0f0f0"; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(tipx, tipy); ctx.lineTo(-pull, 0); ctx.lineTo(tipx2, tipy2); ctx.stroke();
      // nocked arrow
      if (!arrow) {
        ctx.strokeStyle = "#9a6b3a"; ctx.lineWidth = 4;
        ctx.beginPath(); ctx.moveTo(-pull, 0); ctx.lineTo(54, 0); ctx.stroke();
        ctx.fillStyle = "#dfe6ee"; ctx.beginPath(); ctx.moveTo(60, 0); ctx.lineTo(50, -5); ctx.lineTo(50, 5); ctx.closePath(); ctx.fill();
      }
      ctx.restore();
    }

    function finish() {
      const stars = arrows <= need ? 3 : arrows <= need + 2 ? 2 : 1;
      DG.Flow.win("arjuna", {
        score: perfects * 10 + hits * 5, stars, blessings: hits * 5 + perfects * 3, reached: 1,
        title: "The eye is pierced!",
        titleTe: "లక్ష్యభేదనం!",
        lines: [
          "Like Arjunudu, you fixed your mind on one point alone — the eye of the fish — and let the world fall away.",
          "You found the mark in " + arrows + " arrow" + (arrows === 1 ? "" : "s") + (perfects ? ", with " + perfects + " bullseye" + (perfects === 1 ? "" : "s") + "!" : "!"),
        ],
        lesson: "Focus on one thing, and you cannot miss.",
      });
    }
  };
})();
