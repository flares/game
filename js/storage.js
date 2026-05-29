/* =====================================================================
   Divya Gatha — storage.js
   Cross-game stats & progress in localStorage. One small JSON blob.
   ===================================================================== */
(function () {
  "use strict";
  const DG = window.DG;
  const KEY = "divyaGatha.save.v1";

  const def = () => ({
    blessings: 0,          // shared currency (golden flowers) across all games
    games: {
      hanuman: { best: 0, stars: 0, plays: 0, reached: 0 },
      setu:    { best: 0, stars: 0, plays: 0, reached: 0 },
      arjuna:  { best: 0, stars: 0, plays: 0, reached: 0 },
    },
    lampsLit: 0,           // ambience on the home temple, grows with total stars
    firstSeen: Date.now(),
    lastPlayed: 0,
  });

  const Store = (DG.Store = {
    data: def(),

    load() {
      try {
        const raw = localStorage.getItem(KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          this.data = Object.assign(def(), parsed);
          this.data.games = Object.assign(def().games, parsed.games || {});
          for (const k in def().games) this.data.games[k] = Object.assign(def().games[k], (parsed.games || {})[k] || {});
        }
      } catch (e) { this.data = def(); }
      return this.data;
    },

    save() {
      this.data.lastPlayed = Date.now();
      try { localStorage.setItem(KEY, JSON.stringify(this.data)); } catch (e) {}
    },

    addBlessings(n) { this.data.blessings += n; this.save(); return this.data.blessings; },

    totalStars() {
      const g = this.data.games;
      return (g.hanuman.stars || 0) + (g.setu.stars || 0) + (g.arjuna.stars || 0);
    },

    // record a finished play; returns {newBest, newStars}
    record(gameId, { score, stars, reached }) {
      const g = this.data.games[gameId];
      if (!g) return {};
      g.plays = (g.plays || 0) + 1;
      const newBest = score > (g.best || 0);
      if (newBest) g.best = score;
      const newStars = stars > (g.stars || 0);
      if (newStars) g.stars = stars;
      if (reached != null) g.reached = Math.max(g.reached || 0, reached);
      this.data.lampsLit = this.totalStars();
      this.save();
      return { newBest, newStars };
    },

    game(id) { return this.data.games[id]; },
  });

  Store.load();
})();
