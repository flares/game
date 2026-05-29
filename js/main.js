/* =====================================================================
   Divya Gatha — main.js
   Game registry (metadata, illustrations, stories), the Flow controller
   (Home → Story → Play → Result), the tap-to-begin splash, and bootstrap.
   ===================================================================== */
(function () {
  "use strict";
  const DG = window.DG;
  const U = DG.util;
  const W = DG.W, H = DG.H;

  /* ---------------- per-game illustrations ---------------- */
  function heroHanuman(ctx, x, y, t) {
    DG.Art.hanuman(ctx, x, y, 1.25, t, { flap: 0.5 + 0.5 * Math.sin(t * 5), lean: -0.12 });
  }
  function iconHanuman(ctx, x, y, r, t) {
    DG.Art.hanuman(ctx, x + 6, y + 8, r / 78, t, { flap: 0.5 + 0.5 * Math.sin(t * 5), lean: -0.1 });
  }
  function heroSetu(ctx, x, y, t) {
    DG.Art.stone(ctx, x + 70, y - 6 + Math.sin(t * 2) * 5, 64, 64, t, { glow: true });
    DG.Art.glow(ctx, x + 70, y - 6, 50, "#ffe07a", 0.35);
    DG.Art.ramudu(ctx, x - 30, y + 40, 1.25, t, { bow: true });
    DG.Art.squirrel(ctx, x + 70, y + 36, 1.2, t, { dir: -1 });
  }
  function iconSetu(ctx, x, y, r, t) {
    DG.Art.stone(ctx, x, y + 6, r * 1.1, r * 0.8, t, { glow: true });
    DG.Art.squirrel(ctx, x + r * 0.5, y - r * 0.5, r / 26, t, { dir: -1 });
  }
  function heroArjuna(ctx, x, y, t) {
    DG.Art.fishWheel(ctx, x + 40, y - 70, 46, t * 0.8);
    DG.Art.arjunudu(ctx, x - 30, y + 40, 1.3, t);
    DG.Art.arrow(ctx, x - 4, y - 8, -0.7, 56);
  }
  function iconArjuna(ctx, x, y, r, t) {
    DG.Art.fishWheel(ctx, x, y - r * 0.2, r * 0.66, t * 0.8);
    DG.Art.arrow(ctx, x - r * 0.7, y + r * 0.7, -0.7, r * 0.9);
  }

  /* ---------------- registry ---------------- */
  DG.games = [
    {
      id: "hanuman",
      titleEn: "Hanumanthudu's Leap",
      titleTe: "హనుమంతుడి లంఘనం",
      tag: "Soar across the ocean to Lanka. Hold to fly, release to glide.",
      accent: "#ef8a2c",
      sky: [[0, "#4a78b8"], [0.55, "#8fc1e6"], [1, "#ffe0a0"]],
      icon: iconHanuman, hero: heroHanuman,
      playScene: () => DG.Scenes.Hanuman(),
      bestLabel: (n) => n + " 🌼",
      story: {
        title: "Hanumanthudu's Leap",
        titleTe: "హనుమంతుడి లంఘనం",
        lines: [
          "Sitamma was carried across the sea to Lanka. Brave Hanumanthudu — the mighty son of Vayu, the wind — offered to find her.",
          "He grew vast as a mountain and leapt from the shore, soaring over the endless ocean with Ramudu's hope in his heart.",
        ],
        lesson: "Courage and devotion can cross any ocean.",
        hint: "Hold to fly up • release to glide • gather blessings!",
      },
    },
    {
      id: "setu",
      titleEn: "Setu Bandhanam",
      titleTe: "సేతు బంధనం",
      tag: "Build Ramudu's floating bridge of stones to Lanka, one tap at a time.",
      accent: "#1f9aa8",
      sky: [[0, "#3a78b0"], [0.5, "#86bfe0"], [1, "#e8f6ff"]],
      icon: iconSetu, hero: heroSetu,
      playScene: () => DG.Scenes.Setu(),
      bestLabel: (n) => "Best " + n,
      story: {
        title: "Setu Bandhanam",
        titleTe: "సేతు బంధనం",
        lines: [
          "To reach Lanka, Ramudu's vanara army had to cross the sea. Nala and Nila began building a great bridge of stones.",
          "Wherever Ramudu's name was written, the stones floated! Even a tiny squirrel rolled in the sand to help — for every small effort matters.",
        ],
        lesson: "Great things are built together, stone by stone.",
        hint: "Tap to drop each stone in line for a strong bridge.",
      },
    },
    {
      id: "arjuna",
      titleEn: "Arjunudu's Lakshyam",
      titleTe: "అర్జునుడి లక్ష్యం",
      tag: "Pierce the eye of the spinning fish — the way of perfect focus.",
      accent: "#7a5ad0",
      sky: [[0, "#2a2363"], [0.5, "#6b4f9e"], [1, "#f0c89a"]],
      icon: iconArjuna, hero: heroArjuna,
      playScene: () => DG.Scenes.Arjuna(),
      bestLabel: (n) => "Best " + n,
      story: {
        title: "Arjunudu's Lakshyam",
        titleTe: "అర్జునుడి లక్ష్యం",
        lines: [
          "Guru Dronacharya asked each prince what he saw while aiming at a wooden bird. Only Arjunudu answered: \"I see only the eye of the bird.\"",
          "So, to win the great contest, he pierced the eye of a spinning fish high on a wheel — looking only at its reflection in the water below.",
        ],
        lesson: "Fix your mind on one point, and you cannot miss.",
        hint: "Hold to aim & focus • release to shoot. Stay calm and steady.",
      },
    },
  ];
  DG.gameById = (id) => DG.games.find((g) => g.id === id);

  /* ---------------- Flow ---------------- */
  DG.Flow = {
    home() { DG.Scenes.go(DG.Scenes.Home()); },

    play(id) {
      const g = DG.gameById(id);
      DG.Scenes.go(DG.UI.StoryScene({
        id, title: g.story.title, titleTe: g.story.titleTe,
        lines: g.story.lines, lesson: g.story.lesson, hint: g.story.hint,
        sky: g.sky, accent: g.accent, hero: g.hero,
        onPlay: () => DG.Scenes.go(g.playScene()),
        onBack: () => DG.Flow.home(),
      }));
    },

    win(id, payload) {
      const g = DG.gameById(id);
      const rec = DG.Store.record(id, { score: payload.score, stars: payload.stars, reached: payload.reached });
      DG.Store.addBlessings(payload.blessings);
      DG.Scenes.go(DG.UI.ResultScene({
        title: payload.title, titleTe: payload.titleTe,
        lines: payload.lines, lesson: payload.lesson,
        stars: payload.stars, blessings: payload.blessings, newBest: rec.newBest,
        sky: [[0, "#2a2363"], [0.45, "#6b4f9e"], [1, "#ffcf8a"]],
        accent: g.accent, hero: g.hero,
        onReplay: () => DG.Scenes.go(g.playScene()),
        onHome: () => DG.Flow.home(),
      }));
    },
  };

  /* ---------------- Splash (tap to begin → unlocks audio) ---------------- */
  DG.Scenes.Splash = function () {
    const petals = DG.UI.makePetals();
    let t0 = 0, started = false;
    return {
      enter() { t0 = 0; },
      update(dt) { t0 += dt; petals.update(dt); },
      onDown() {
        if (started) return; started = true;
        DG.Audio.unlock(); DG.Audio.startMusic();
        DG.Flow.home();
      },
      render(ctx) {
        DG.Art.sky(ctx, [[0, "#241a52"], [0.4, "#6b4a8e"], [0.75, "#f0956a"], [1, "#ffd089"]]);
        DG.Art.stars(ctx, DG.time, 40, H * 0.45);
        DG.Art.sun(ctx, W / 2, H * 0.34, 64, DG.time, "#fff3c4", "#ff9a4a");
        DG.Art.hills(ctx, H * 0.62, 140, "#5a3f86", 5, 6);
        DG.Art.temple(ctx, W / 2, H * 0.6, 64, "#3a2a5e");
        petals.draw(ctx);
        DG.Art.toran(ctx, 0, W, 8);

        DG.Art.hanuman(ctx, W / 2, H * 0.62 + Math.sin(DG.time * 2) * 8, 1.0, DG.time, { lean: -0.1 });

        DG.UI.title(ctx, "Divya Gatha", W / 2, H * 0.2, 84, DG.time);
        U.text(ctx, "దివ్య గాథ", W / 2, H * 0.2 + 64, { size: 38, fill: "#ffe7b3", family: '"Nirmala UI","Noto Sans Telugu",sans-serif', shadow: "rgba(0,0,0,0.4)", shadowBlur: 6 });
        U.text(ctx, "Epic adventures of the Ramayana & Mahabharata", W / 2, H * 0.2 + 116, { size: 22, fill: "rgba(255,255,255,0.92)", weight: "500", shadow: "rgba(0,0,0,0.4)", shadowBlur: 4 });

        const pulse = 0.7 + 0.3 * Math.sin(DG.time * 3);
        ctx.globalAlpha = pulse;
        U.text(ctx, "Tap to begin", W / 2, H * 0.85, { size: 40, fill: "#fff6d8", stroke: "#7a3d0c", strokeW: 4, shadow: "rgba(255,210,80,0.6)", shadowBlur: 16 });
        ctx.globalAlpha = 1;
        U.text(ctx, "🙏  For little hearts", W / 2, H * 0.9, { size: 22, fill: "rgba(255,231,179,0.85)" });
      },
    };
  };

  /* ---------------- boot ---------------- */
  function boot() {
    DG.start(DG.Scenes.Splash());
    if ("serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker.register("service-worker.js").catch(function () {});
      });
    }
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
