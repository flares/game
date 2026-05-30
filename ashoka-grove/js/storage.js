/* =====================================================================
   A Light in the Ashoka Grove — storage.js
   Tiny, gentle persistence. No score; just what the heart remembers.
   ===================================================================== */
(function () {
  "use strict";
  const DG = window.DG;
  const KEY = "ashokaGrove.save.v2";

  const def = () => ({
    visits: 0,
    bestKeepsakes: 0,   // most keepsakes ever gathered in one visit (of 3)
    completed: false,   // has hope been carried home at least once
    settings: { muted: false },
    lastPlayed: 0,
  });

  const Store = (DG.Store = {
    data: def(),
    load() {
      try {
        const raw = localStorage.getItem(KEY);
        if (raw) {
          const p = JSON.parse(raw);
          this.data = Object.assign(def(), p);
          this.data.settings = Object.assign(def().settings, p.settings || {});
        }
      } catch (e) { this.data = def(); }
      return this.data;
    },
    save() {
      this.data.lastPlayed = Date.now();
      try { localStorage.setItem(KEY, JSON.stringify(this.data)); } catch (e) {}
    },
    beginVisit() { this.data.visits++; this.save(); },
    finishVisit(keepsakes) {
      this.data.bestKeepsakes = Math.max(this.data.bestKeepsakes, keepsakes);
      this.data.completed = true;
      this.save();
    },
    get settings() { return this.data.settings; },
  });

  Store.load();
})();
