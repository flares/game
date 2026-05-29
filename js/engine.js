/* =====================================================================
   Divya Gatha — engine.js
   Core: virtual-resolution stage, hi-DPI fit, game loop, input mapping,
   scene manager with golden transitions, particle system, math/draw utils.
   Everything hangs off a single global: window.DG
   ===================================================================== */
(function () {
  "use strict";
  const DG = (window.DG = window.DG || {});

  // Virtual design resolution (portrait). All scenes draw in this space;
  // the stage scales + letterboxes it to fit any screen.
  const W = 720, H = 1280;
  DG.W = W;
  DG.H = H;

  /* ------------------------------------------------------------------ */
  /* Math + drawing utilities                                            */
  /* ------------------------------------------------------------------ */
  const util = (DG.util = {
    TAU: Math.PI * 2,
    clamp(v, a, b) { return v < a ? a : v > b ? b : v; },
    lerp(a, b, t) { return a + (b - a) * t; },
    inv(a, b, v) { return (v - a) / (b - a); },
    map(v, a, b, c, d) { return c + (d - c) * ((v - a) / (b - a)); },
    rand(a, b) { if (b === undefined) { b = a === undefined ? 1 : a; a = 0; } return a + Math.random() * (b - a); },
    randInt(a, b) { return Math.floor(util.rand(a, b + 1)); },
    choose(arr) { return arr[(Math.random() * arr.length) | 0]; },
    chance(p) { return Math.random() < p; },
    sign(v) { return v < 0 ? -1 : v > 0 ? 1 : 0; },
    dist(ax, ay, bx, by) { return Math.hypot(ax - bx, ay - by); },
    dist2(ax, ay, bx, by) { const dx = ax - bx, dy = ay - by; return dx * dx + dy * dy; },
    smooth(t) { t = util.clamp(t, 0, 1); return t * t * (3 - 2 * t); },
    easeIn(t) { return t * t * t; },
    easeOut(t) { return 1 - Math.pow(1 - t, 3); },
    easeInOut(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; },
    easeOutBack(t) { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); },
    easeOutElastic(t) {
      const c4 = (2 * Math.PI) / 3;
      return t <= 0 ? 0 : t >= 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
    },
    wrap(v, m) { return ((v % m) + m) % m; },
    lerpAngle(a, b, t) { let d = util.wrap(b - a + Math.PI, util.TAU) - Math.PI; return a + d * t; },
    approach(v, target, step) { if (v < target) return Math.min(v + step, target); if (v > target) return Math.max(v - step, target); return v; },
    aabb(a, b) { return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y; },

    // "#rrggbb" + alpha → "rgba(...)"
    rgba(hex, a) {
      hex = hex.replace("#", "");
      if (hex.length === 3) hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
      const n = parseInt(hex, 16);
      return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
    },
    // mix two "#rrggbb" colors → "#rrggbb"
    mix(c1, c2, t) {
      const p = (h) => { h = h.replace("#", ""); if (h.length === 3) h = h[0]+h[0]+h[1]+h[1]+h[2]+h[2]; const n = parseInt(h, 16); return [(n>>16)&255,(n>>8)&255,n&255]; };
      const a = p(c1), b = p(c2);
      const r = (v) => Math.round(util.lerp(a[v], b[v], t));
      const hx = (v) => v.toString(16).padStart(2, "0");
      return "#" + hx(r(0)) + hx(r(1)) + hx(r(2));
    },

    roundRect(ctx, x, y, w, h, r) {
      if (r === undefined) r = 8;
      r = Math.min(r, w / 2, h / 2);
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.arcTo(x + w, y, x + w, y + h, r);
      ctx.arcTo(x + w, y + h, x, y + h, r);
      ctx.arcTo(x, y + h, x, y, r);
      ctx.arcTo(x, y, x + w, y, r);
      ctx.closePath();
    },

    // Star polygon path (centered at x,y)
    starPath(ctx, x, y, spikes, outer, inner) {
      let rot = -Math.PI / 2;
      const step = Math.PI / spikes;
      ctx.beginPath();
      ctx.moveTo(x + Math.cos(rot) * outer, y + Math.sin(rot) * outer);
      for (let i = 0; i < spikes; i++) {
        rot += step; ctx.lineTo(x + Math.cos(rot) * inner, y + Math.sin(rot) * inner);
        rot += step; ctx.lineTo(x + Math.cos(rot) * outer, y + Math.sin(rot) * outer);
      }
      ctx.closePath();
    },

    // Convenience styled text. opts: {size,weight,family,fill,stroke,strokeW,align,baseline,shadow,shadowBlur,letter}
    text(ctx, str, x, y, opts) {
      opts = opts || {};
      const size = opts.size || 28;
      const weight = opts.weight || "bold";
      const family = opts.family || '"Trebuchet MS", "Segoe UI", Verdana, system-ui, sans-serif';
      ctx.save();
      ctx.font = `${weight} ${size}px ${family}`;
      ctx.textAlign = opts.align || "center";
      ctx.textBaseline = opts.baseline || "middle";
      if (opts.shadow) {
        ctx.shadowColor = opts.shadow;
        ctx.shadowBlur = opts.shadowBlur == null ? 8 : opts.shadowBlur;
        ctx.shadowOffsetY = opts.shadowOffsetY || 0;
      }
      if (opts.stroke) {
        ctx.lineWidth = opts.strokeW || 4;
        ctx.lineJoin = "round";
        ctx.strokeStyle = opts.stroke;
        ctx.strokeText(str, x, y);
      }
      ctx.shadowBlur = opts.shadow ? (opts.shadowBlur == null ? 8 : opts.shadowBlur) : 0;
      ctx.fillStyle = opts.fill || "#fff";
      ctx.fillText(str, x, y);
      ctx.restore();
    },
  });

  /* ------------------------------------------------------------------ */
  /* Stage: hi-DPI canvas, fit + letterbox, virtual<->screen transform   */
  /* ------------------------------------------------------------------ */
  const Stage = (DG.Stage = {
    canvas: null, ctx: null,
    scale: 1, offX: 0, offY: 0, dpr: 1,
    cssW: 0, cssH: 0,

    init() {
      this.canvas = document.getElementById("game");
      this.ctx = this.canvas.getContext("2d", { alpha: false });
      window.addEventListener("resize", () => this.resize());
      this.resize();
    },

    resize() {
      const dpr = (this.dpr = Math.min(window.devicePixelRatio || 1, 2.5));
      const cssW = (this.cssW = window.innerWidth);
      const cssH = (this.cssH = window.innerHeight);
      this.canvas.width = Math.round(cssW * dpr);
      this.canvas.height = Math.round(cssH * dpr);
      this.canvas.style.width = cssW + "px";
      this.canvas.style.height = cssH + "px";
      // contain fit
      this.scale = Math.min(cssW / W, cssH / H);
      this.offX = (cssW - W * this.scale) / 2;
      this.offY = (cssH - H * this.scale) / 2;
      if (DG.Scenes.current && DG.Scenes.current.onResize) DG.Scenes.current.onResize();
    },

    // Begin a frame: paint letterbox, then enter virtual space (clipped).
    begin() {
      const ctx = this.ctx, dpr = this.dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      // letterbox backdrop
      const g = ctx.createRadialGradient(this.cssW / 2, this.cssH * 0.35, 40, this.cssW / 2, this.cssH * 0.5, Math.max(this.cssW, this.cssH));
      g.addColorStop(0, "#191037");
      g.addColorStop(1, "#08060f");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, this.cssW, this.cssH);
      ctx.save();
      ctx.translate(this.offX, this.offY);
      ctx.scale(this.scale, this.scale);
      ctx.beginPath();
      ctx.rect(0, 0, W, H);
      ctx.clip();
    },

    end() {
      const ctx = this.ctx;
      ctx.restore();
      // soft inner frame on the play area edges
      ctx.save();
      ctx.translate(this.offX, this.offY);
      ctx.scale(this.scale, this.scale);
      ctx.lineWidth = 6;
      ctx.strokeStyle = "rgba(0,0,0,0.25)";
      ctx.strokeRect(0, 0, W, H);
      ctx.restore();
    },

    // screen (clientX/Y) → virtual coords
    toVirtual(clientX, clientY) {
      const r = this.canvas.getBoundingClientRect();
      return {
        x: (clientX - r.left - this.offX) / this.scale,
        y: (clientY - r.top - this.offY) / this.scale,
      };
    },
  });

  /* ------------------------------------------------------------------ */
  /* Input: unified pointer (touch + mouse), mapped to virtual space     */
  /* ------------------------------------------------------------------ */
  const Input = (DG.Input = {
    x: W / 2, y: H / 2, down: false,
    init() {
      const c = Stage.canvas;
      const get = (e) => {
        const t = (e.touches && e.touches[0]) || (e.changedTouches && e.changedTouches[0]) || e;
        return Stage.toVirtual(t.clientX, t.clientY);
      };
      const down = (e) => {
        e.preventDefault();
        DG.Audio.unlock();
        const p = get(e); this.x = p.x; this.y = p.y; this.down = true;
        const s = DG.Scenes.current;
        if (s && s.onDown && !DG.Scenes.transitioning) s.onDown(p);
      };
      const move = (e) => {
        const p = get(e); this.x = p.x; this.y = p.y;
        const s = DG.Scenes.current;
        if (s && s.onMove && !DG.Scenes.transitioning) s.onMove(p);
      };
      const up = (e) => {
        const p = get(e); this.x = p.x; this.y = p.y; this.down = false;
        const s = DG.Scenes.current;
        if (s && s.onUp && !DG.Scenes.transitioning) s.onUp(p);
      };
      c.addEventListener("touchstart", down, { passive: false });
      c.addEventListener("touchmove", move, { passive: false });
      c.addEventListener("touchend", up, { passive: false });
      c.addEventListener("touchcancel", up, { passive: false });
      c.addEventListener("mousedown", down);
      window.addEventListener("mousemove", move);
      window.addEventListener("mouseup", up);
      // basic keyboard for desktop testing / accessibility
      window.addEventListener("keydown", (e) => {
        if (e.repeat) return;
        const s = DG.Scenes.current;
        if (e.code === "Space" || e.code === "ArrowUp" || e.code === "Enter") {
          DG.Audio.unlock();
          if (s && s.onKey) s.onKey(e.code);
        }
      });
    },
  });

  /* ------------------------------------------------------------------ */
  /* Scene manager with a golden cross-fade transition                   */
  /* ------------------------------------------------------------------ */
  const Scenes = (DG.Scenes = {
    current: null,
    next: null,
    transitioning: false,
    phase: "idle", // 'out' | 'in'
    t: 0,
    dur: 0.42,

    set(scene) {
      if (this.current && this.current.exit) this.current.exit();
      this.current = scene;
      if (scene && scene.enter) scene.enter();
      if (scene && scene.onResize) scene.onResize();
    },

    // Transition to a new scene with a divine light wipe.
    go(scene) {
      if (this.transitioning) { this._pending = scene; return; }
      this.next = scene;
      this.transitioning = true;
      this.phase = "out";
      this.t = 0;
    },

    update(dt) {
      if (this.current && this.current.update && (!this.transitioning || this.phase === "in")) {
        this.current.update(dt);
      } else if (this.current && this.current.update && this.phase === "out") {
        this.current.update(dt); // keep animating during fade-out
      }
      if (!this.transitioning) return;
      this.t += dt;
      if (this.phase === "out" && this.t >= this.dur) {
        this.set(this.next);
        this.next = null;
        this.phase = "in";
        this.t = 0;
      } else if (this.phase === "in" && this.t >= this.dur) {
        this.transitioning = false;
        this.phase = "idle";
        if (this._pending) { const p = this._pending; this._pending = null; this.go(p); }
      }
    },

    render(ctx) {
      if (this.current && this.current.render) this.current.render(ctx);
      if (this.transitioning) {
        let a;
        if (this.phase === "out") a = util.clamp(this.t / this.dur, 0, 1);
        else a = 1 - util.clamp(this.t / this.dur, 0, 1);
        const g = ctx.createRadialGradient(W / 2, H / 2, 60, W / 2, H / 2, H * 0.8);
        g.addColorStop(0, util.rgba("#fff6d8", a));
        g.addColorStop(0.5, util.rgba("#ffd98a", a));
        g.addColorStop(1, util.rgba("#f6a13c", a * 0.92));
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, W, H);
      }
    },
  });

  /* ------------------------------------------------------------------ */
  /* Particle system (petals, sparks, splashes, stars, smoke, glow)      */
  /* ------------------------------------------------------------------ */
  DG.Particles = function () {
    const list = [];
    return {
      list,
      get count() { return list.length; },
      spawn(o) {
        list.push({
          x: o.x, y: o.y,
          vx: o.vx || 0, vy: o.vy || 0,
          g: o.g || 0, drag: o.drag == null ? 1 : o.drag,
          life: 0, max: o.life || 1,
          size: o.size || 6, size2: o.size2 == null ? o.size || 6 : o.size2,
          rot: o.rot || 0, spin: o.spin || 0,
          color: o.color || "#fff", color2: o.color2 || null,
          type: o.type || "dot",
          fade: o.fade == null ? true : o.fade,
        });
        return this;
      },
      burst(o, n) {
        for (let i = 0; i < n; i++) {
          const a = o.angle == null ? util.rand(0, util.TAU) : o.angle + util.rand(-(o.spread || 0.6), o.spread || 0.6);
          const sp = util.rand(o.speedMin || 40, o.speedMax || 200);
          this.spawn(Object.assign({}, o, { vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, rot: util.rand(0, util.TAU), spin: util.rand(-6, 6) }));
        }
        return this;
      },
      update(dt) {
        for (let i = list.length - 1; i >= 0; i--) {
          const p = list[i];
          p.life += dt;
          if (p.life >= p.max) { list.splice(i, 1); continue; }
          p.vy += p.g * dt;
          p.vx *= Math.pow(p.drag, dt * 60);
          p.vy *= Math.pow(p.drag, dt * 60);
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          p.rot += p.spin * dt;
        }
      },
      draw(ctx) {
        for (const p of list) {
          const k = p.life / p.max;
          const a = p.fade ? util.clamp(1 - k, 0, 1) : 1;
          const sz = util.lerp(p.size, p.size2, k);
          ctx.save();
          ctx.globalAlpha = a;
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rot);
          const col = p.color2 ? util.mix(p.color, p.color2, k) : p.color;
          if (p.type === "dot" || p.type === "spark") {
            ctx.fillStyle = col;
            if (p.type === "spark") { ctx.shadowColor = col; ctx.shadowBlur = 12; }
            ctx.beginPath(); ctx.arc(0, 0, sz, 0, util.TAU); ctx.fill();
          } else if (p.type === "petal") {
            ctx.fillStyle = col;
            ctx.beginPath();
            ctx.ellipse(0, 0, sz, sz * 0.55, 0, 0, util.TAU);
            ctx.fill();
          } else if (p.type === "star") {
            ctx.fillStyle = col; ctx.shadowColor = col; ctx.shadowBlur = 10;
            util.starPath(ctx, 0, 0, 5, sz, sz * 0.45); ctx.fill();
          } else if (p.type === "splash") {
            ctx.strokeStyle = col; ctx.lineWidth = Math.max(1, sz * 0.4); ctx.lineCap = "round";
            ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, sz * 1.6); ctx.stroke();
          } else if (p.type === "smoke") {
            ctx.fillStyle = col; ctx.globalAlpha = a * 0.5;
            ctx.beginPath(); ctx.arc(0, 0, sz, 0, util.TAU); ctx.fill();
          } else if (p.type === "ring") {
            ctx.strokeStyle = col; ctx.globalAlpha = a; ctx.lineWidth = 3;
            ctx.beginPath(); ctx.arc(0, 0, sz, 0, util.TAU); ctx.stroke();
          }
          ctx.restore();
        }
      },
    };
  };

  /* ------------------------------------------------------------------ */
  /* Main loop                                                           */
  /* ------------------------------------------------------------------ */
  let last = 0, running = false;
  DG.time = 0;
  function frame(now) {
    if (!running) return;
    if (!last) last = now;
    let dt = (now - last) / 1000;
    last = now;
    if (dt > 1 / 20) dt = 1 / 20; // clamp big gaps (tab switches)
    DG.time += dt;
    Scenes.update(dt);
    Stage.begin();
    Scenes.render(Stage.ctx);
    Stage.end();
    requestAnimationFrame(frame);
  }

  DG.start = function (firstScene) {
    Stage.init();
    Input.init();
    Scenes.set(firstScene);
    running = true;
    requestAnimationFrame(frame);
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) { DG.Audio.suspendMusic(); }
      else { last = 0; DG.Audio.resumeMusic(); }
    });
  };
})();
