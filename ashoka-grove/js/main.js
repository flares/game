/* =====================================================================
   A Light in the Ashoka Grove — main.js
   Boot straight into the grove (its own intro card is the "tap to begin").
   First tap unlocks audio (engine). Music is deferred to a later phase.
   ===================================================================== */
(function () {
  "use strict";
  const DG = window.DG;

  function boot() {
    DG.start(DG.Scenes.Grove());
    if ("serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker.register("service-worker.js").catch(function () {});
      });
    }
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
