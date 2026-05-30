/* =====================================================================
   A Light in the Ashoka Grove — audio.js
   A contemplative soundscape (Web Audio, fully synthesized).
   A soft tanpura drone + a bansuri-like melody that begins plaintive
   (viraha / longing) and brightens toward a hopeful raga as the scene's
   `hope` rises. Plus tender SFX: memory-bloom, koel, water, conch, dawn.
   ===================================================================== */
(function () {
  "use strict";
  const DG = window.DG;
  const U = DG.util;

  // C4-based note tables
  const PLAINTIVE = [261.63, 277.18, 311.13, 349.23, 392.00, 415.30, 466.16, 523.25]; // ~Bhairavi
  const HOPEFUL = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25, 587.33, 659.25];    // ~Mohanam

  const Audio = (DG.Audio = {
    ctx: null, master: null, musicGain: null, sfxGain: null, padGain: null,
    unlocked: false, muted: false, musicOn: false,
    hope: 0, _mel: null, _drone: [],

    init() { try { this.muted = (DG.Store && DG.Store.settings.muted) || false; } catch (e) {} },

    unlock() {
      if (this.unlocked) { if (this.ctx.state === "suspended") this.ctx.resume(); return; }
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      const ctx = (this.ctx = new AC());
      this.master = ctx.createGain(); this.master.gain.value = this.muted ? 0 : 1; this.master.connect(ctx.destination);
      this.musicGain = ctx.createGain(); this.musicGain.gain.value = 0; this.musicGain.connect(this.master);
      this.sfxGain = ctx.createGain(); this.sfxGain.gain.value = 0.9; this.sfxGain.connect(this.master);
      this.unlocked = true;
      if (ctx.state === "suspended") ctx.resume();
    },

    setMuted(m) {
      this.muted = m;
      try { DG.Store.settings.muted = m; DG.Store.save(); } catch (e) {}
      if (this.master) { const t = this.ctx.currentTime; this.master.gain.cancelScheduledValues(t); this.master.gain.setTargetAtTime(m ? 0 : 1, t, 0.1); }
    },
    toggleMute() { this.setMuted(!this.muted); return this.muted; },
    suspendMusic() { if (this.ctx) this.ctx.suspend && this.ctx.suspend(); },
    resumeMusic() { if (this.ctx && this.ctx.state === "suspended") this.ctx.resume(); },
    setHope(h) { this.hope = U.clamp(h, 0, 1); },

    _tone(freq, t, dur, type, vol, dest, glide) {
      const ctx = this.ctx, o = ctx.createOscillator(), g = ctx.createGain();
      o.type = type || "sine"; o.frequency.setValueAtTime(freq, t);
      if (glide) o.frequency.exponentialRampToValueAtTime(glide, t + dur);
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(vol, t + Math.min(0.04, dur * 0.3));
      g.gain.exponentialRampToValueAtTime(0.0008, t + dur);
      o.connect(g); g.connect(dest || this.sfxGain); o.start(t); o.stop(t + dur + 0.05);
      return { o, g };
    },

    _bansuri(freq, t, dur, vol) {
      const ctx = this.ctx, o = ctx.createOscillator(), o2 = ctx.createOscillator(), g = ctx.createGain();
      const vib = ctx.createOscillator(), vibg = ctx.createGain();
      o.type = "sine"; o2.type = "triangle";
      o.frequency.setValueAtTime(freq, t); o2.frequency.setValueAtTime(freq, t);
      vib.frequency.setValueAtTime(5, t); vibg.gain.setValueAtTime(freq * 0.007, t);
      vib.connect(vibg); vibg.connect(o.frequency);
      const g2 = ctx.createGain(); g2.gain.value = 0.12; o2.connect(g2); g2.connect(g);
      // soft breathy attack, long release
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(vol, t + 0.12);
      g.gain.setTargetAtTime(0.0001, t + dur * 0.55, dur * 0.3);
      o.connect(g); g.connect(this.musicGain);
      o.start(t); o2.start(t); vib.start(t);
      o.stop(t + dur + 0.2); o2.stop(t + dur + 0.2); vib.stop(t + dur + 0.2);
    },

    startMusic() {
      if (!this.unlocked || this.musicOn) return;
      this.musicOn = true;
      const ctx = this.ctx, t = ctx.currentTime;
      this.musicGain.gain.cancelScheduledValues(t);
      this.musicGain.gain.linearRampToValueAtTime(0.34, t + 3.0);

      const root = 130.81; // C3
      [root / 2, root, root * 1.5].forEach((f, i) => {
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.type = i === 2 ? "triangle" : "sine"; o.frequency.value = f;
        g.gain.value = 0; g.gain.setTargetAtTime(i === 0 ? 0.18 : 0.08, t, 2.0);
        const lfo = ctx.createOscillator(), lg = ctx.createGain();
        lfo.frequency.value = 0.05 + i * 0.011; lg.gain.value = 0.03; lfo.connect(lg); lg.connect(g.gain);
        o.connect(g); g.connect(this.musicGain); o.start(t); lfo.start(t);
        this._drone.push(o, lfo);
      });

      let idx = 3;
      const step = () => {
        if (!this.musicOn) return;
        const now = this.ctx.currentTime;
        const scale = this.hope < 0.5 ? PLAINTIVE : HOPEFUL;
        if (U.chance(0.8)) {
          const oct = (this.hope > 0.7 && U.chance(0.3)) ? 2 : 1;
          this._bansuri(scale[idx] * oct, now + 0.03, U.rand(0.9, 1.8) - this.hope * 0.3, U.rand(0.05, 0.1));
        }
        idx += U.choose([-2, -1, -1, 1, 1, 2]);
        idx = U.clamp(idx, 0, scale.length - 1);
        const base = U.choose([900, 1100, 1400, 1800]) - this.hope * 250;
        this._mel = setTimeout(step, base);
      };
      this._mel = setTimeout(step, 1400);
    },
    stopMusic(fade) {
      if (!this.musicOn) return; this.musicOn = false; clearTimeout(this._mel);
      if (this.ctx) {
        const t = this.ctx.currentTime; const f = fade || 1.2;
        this.musicGain.gain.cancelScheduledValues(t); this.musicGain.gain.linearRampToValueAtTime(0, t + f);
        this._drone.forEach((n) => { try { n.stop(t + f + 0.1); } catch (e) {} }); this._drone = [];
      }
    },

    // ----- SFX -----
    bloom() { // a memory awakening — soft bell with a wordless rising 'aa'
      if (!this.unlocked) return; const t = this.ctx.currentTime;
      this._tone(523.25, t, 1.4, "sine", 0.12); this._tone(659.25, t, 1.2, "sine", 0.07); this._tone(783.99, t + 0.04, 1.0, "sine", 0.05);
      this._tone(392, t, 1.6, "sine", 0.05, this.sfxGain, 523.25);
    },
    chime() { if (!this.unlocked) return; const t = this.ctx.currentTime; this._tone(880, t, 0.5, "sine", 0.12); this._tone(1320, t + 0.04, 0.5, "sine", 0.07); },
    waterDrop() { if (!this.unlocked) return; const t = this.ctx.currentTime; this._tone(1200, t, 0.18, "sine", 0.08, null, 500); },
    koel() { // cuckoo's rising call
      if (!this.unlocked) return; const t = this.ctx.currentTime;
      this._tone(520, t, 0.18, "sine", 0.07); this._tone(620, t + 0.16, 0.5, "sine", 0.08, null, 700);
    },
    swell() { // gentle pad when trust rises
      if (!this.unlocked) return; const ctx = this.ctx, t = ctx.currentTime;
      [392, 523.25, 659.25].forEach((f) => this._tone(f, t, 1.6, "sine", 0.06));
    },
    ringDescend() {
      if (!this.unlocked) return; const t = this.ctx.currentTime;
      for (let i = 0; i < 4; i++) this._tone(1400 - i * 120, t + i * 0.08, 0.6, "sine", 0.06);
    },
    nudge() { // a soft 'shhh' — never harsh
      if (!this.unlocked) return; const ctx = this.ctx, t = ctx.currentTime;
      const buf = ctx.createBuffer(1, ctx.sampleRate * 0.4, ctx.sampleRate); const d = buf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 2);
      const src = ctx.createBufferSource(); src.buffer = buf;
      const f = ctx.createBiquadFilter(); f.type = "bandpass"; f.frequency.value = 1400; f.Q.value = 0.6;
      const g = ctx.createGain(); g.gain.value = 0.12; g.gain.setTargetAtTime(0.0001, t + 0.2, 0.12);
      src.connect(f); f.connect(g); g.connect(this.sfxGain); src.start(t);
    },
    conch() {
      if (!this.unlocked) return; const ctx = this.ctx, t = ctx.currentTime;
      const o = ctx.createOscillator(), g = ctx.createGain(), f = ctx.createBiquadFilter();
      o.type = "sawtooth"; o.frequency.setValueAtTime(196, t); o.frequency.exponentialRampToValueAtTime(294, t + 0.5); o.frequency.setValueAtTime(294, t + 1.0);
      f.type = "lowpass"; f.frequency.value = 1100;
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.2, t + 0.2); g.gain.setValueAtTime(0.2, t + 1.1); g.gain.exponentialRampToValueAtTime(0.001, t + 1.9);
      o.connect(f); f.connect(g); g.connect(this.sfxGain); o.start(t); o.stop(t + 2.0);
    },
    dawn() {
      if (!this.unlocked) return; const t = this.ctx.currentTime;
      [261.63, 329.63, 392.00, 523.25].forEach((f, i) => this._tone(f, t + i * 0.18, 2.4, "triangle", 0.09));
      this.conch();
    },
  });

  Audio.init();
})();
