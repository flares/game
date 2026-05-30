// Minimal browser-env mock so the game's classic scripts run under Node.
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const { createCanvas } = require("canvas");

const GAME = path.join(__dirname, "..");

// localStorage
const _ls = {};
global.localStorage = {
  getItem: (k) => (k in _ls ? _ls[k] : null),
  setItem: (k, v) => { _ls[k] = String(v); },
  removeItem: (k) => { delete _ls[k]; },
};

// window === global; event + raf stubs
global.window = global;
global.addEventListener = () => {};
global.removeEventListener = () => {};
global.requestAnimationFrame = () => 0;
global.cancelAnimationFrame = () => {};
global.navigator = { userAgent: "node", language: "en" };
global.performance = { now: () => Date.now() };

// a real offscreen main canvas the engine could grab
const mainCanvas = createCanvas(720, 1280);
mainCanvas.addEventListener = () => {};
mainCanvas.getBoundingClientRect = () => ({ left: 0, top: 0, width: 720, height: 1280 });

global.document = {
  readyState: "complete",
  getElementById: () => mainCanvas,
  createElement: (tag) => (tag === "canvas" ? createCanvas(720, 1280) : { getContext: () => ({}) }),
  addEventListener: () => {},
};

function loadGame() {
  const files = ["engine.js", "audio.js", "storage.js", "art_grove.js", "ui_grove.js", "grove.js"];
  for (const f of files) {
    const code = fs.readFileSync(path.join(GAME, "js", f), "utf8");
    vm.runInThisContext(code, { filename: f });
  }
  return global.DG;
}

module.exports = { loadGame, createCanvas, mainCanvas };
