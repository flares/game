/* =====================================================================
   Divya Gatha — audio.js
   Fully synthesized audio via Web Audio API (no files to ship).
   - A soft devotional bed: tanpura-like drone + a flute melody that
     wanders a pentatonic raga (Mohanam ~ C D E G A).
   - A library of friendly SFX: chime, bell, conch, twang, splash, etc.
   Respects a persisted mute flag. Created lazily on first user gesture.
   ===================================================================== */
(function () {
  "use strict";
  const DG = window.DG;

  const Audio = (DG.Audio = {
    ctx: null,
    master: null,
    musicGain: null,
    sfxGain: null,
    unlocked: false,
    muted: false,
    musicOn: false,
    _melodyTimer: null,
    _droneNodes: [],

    init() {
      // read persisted preference (storage may not be ready yet; guard)
      try { this.muted = localStorage.getItem("divyaGatha.muted") === "1"; } catch (e) {}
    },

    unlock() {
      if (this.unlocked) { if (this.ctx && this.ctx.state === "suspended") this.ctx.resume(); return; }
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.muted ? 0 : 1;
      this.master.connect(this.ctx.destination);
      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.value = 0.0;
      this.musicGain.connect(this.master);
      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.value = 0.9;
      this.sfxGain.connect(this.master);
      this.unlocked = true;
      if (this.ctx.state === "suspended") this.ctx.resume();
    },

    setMuted(m) {
      this.muted = m;
      try { localStorage.setItem("divyaGatha.muted", m ? "1" : "0"); } catch (e) {}
      if (this.master) {
        const t = this.ctx.currentTime;
        this.master.gain.cancelScheduledValues(t);
        this.master.gain.setTargetAtTime(m ? 0 : 1, t, 0.08);
      }
    },
    toggleMute() { this.setMuted(!this.muted); return this.muted; },

    suspendMusic() { if (this.ctx) this.ctx.suspend && this.ctx.suspend(); },
    resumeMusic() { if (this.ctx && this.ctx.state === "suspended") this.ctx.resume(); },

    // ----- low-level voice -----
    _tone(freq, t, dur, type, vol, dest, glideTo) {
      const ctx = this.ctx;
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = type || "sine";
      o.frequency.setValueAtTime(freq, t);
      if (glideTo) o.frequency.exponentialRampToValueAtTime(glideTo, t + dur);
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(vol, t + Math.min(0.02, dur * 0.3));
      g.gain.exponentialRampToValueAtTime(0.0008, t + dur);
      o.connect(g); g.connect(dest || this.sfxGain);
      o.start(t); o.stop(t + dur + 0.05);
      return { o, g };
    },

    // soft flute-ish voice with light vibrato (for melody)
    _flute(freq, t, dur, vol) {
      const ctx = this.ctx;
      const o = ctx.createOscillator();
      const o2 = ctx.createOscillator();
      const g = ctx.createGain();
      const vib = ctx.createOscillator();
      const vibg = ctx.createGain();
      o.type = "sine"; o2.type = "triangle";
      o.frequency.setValueAtTime(freq, t);
      o2.frequency.setValueAtTime(freq * 2, t);
      vib.frequency.setValueAtTime(5.5, t);
      vibg.gain.setValueAtTime(freq * 0.006, t);
      vib.connect(vibg); vibg.connect(o.frequency);
      const g2 = ctx.createGain(); g2.gain.value = 0.18; o2.connect(g2); g2.connect(g);
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(vol, t + 0.06);
      g.gain.setTargetAtTime(0.0001, t + dur * 0.6, dur * 0.25);
      o.connect(g); g.connect(this.musicGain);
      o.start(t); o2.start(t); vib.start(t);
      o.stop(t + dur + 0.1); o2.stop(t + dur + 0.1); vib.stop(t + dur + 0.1);
    },

    startMusic() {
      if (!this.unlocked || this.musicOn) return;
      this.musicOn = true;
      const ctx = this.ctx, t = ctx.currentTime;
      this.musicGain.gain.cancelScheduledValues(t);
      this.musicGain.gain.linearRampToValueAtTime(0.32, t + 2.0);

      // tanpura-ish drone: tonic C2/C3 + fifth G2, gently pulsing
      const root = 130.81; // C3
      const drone = [root / 2, root, root * 1.5, root * 2];
      drone.forEach((f, i) => {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = i === 2 ? "triangle" : "sine";
        o.frequency.value = f;
        g.gain.value = 0;
        g.gain.setTargetAtTime(i === 0 ? 0.16 : 0.07, t, 1.5);
        const lfo = ctx.createOscillator();
        const lfog = ctx.createGain();
        lfo.frequency.value = 0.06 + i * 0.013;
        lfog.gain.value = 0.025;
        lfo.connect(lfog); lfog.connect(g.gain);
        o.connect(g); g.connect(this.musicGain);
        o.start(t); lfo.start(t);
        this._droneNodes.push(o, lfo);
      });

      // wandering pentatonic melody (Mohanam): C D E G A across octaves
      const scale = [261.63, 293.66, 329.63, 392.0, 440.0, 523.25, 587.33, 659.25];
      let idx = 2;
      const step = () => {
        if (!this.musicOn) return;
        const now = this.ctx.currentTime;
        // gentle random walk, occasionally rest
        if (DG.util.chance(0.78)) {
          const f = scale[idx];
          this._flute(f, now + 0.02, DG.util.rand(0.5, 1.1), DG.util.rand(0.05, 0.11));
        }
        idx += DG.util.choose([-2, -1, -1, 1, 1, 2]);
        idx = DG.util.clamp(idx, 0, scale.length - 1);
        const wait = DG.util.choose([520, 620, 740, 900, 1180]);
        this._melodyTimer = setTimeout(step, wait);
      };
      this._melodyTimer = setTimeout(step, 900);
    },

    stopMusic(fade) {
      if (!this.musicOn) return;
      this.musicOn = false;
      clearTimeout(this._melodyTimer);
      if (this.ctx) {
        const t = this.ctx.currentTime;
        this.musicGain.gain.cancelScheduledValues(t);
        this.musicGain.gain.linearRampToValueAtTime(0, t + (fade || 0.6));
        this._droneNodes.forEach((n) => { try { n.stop(t + (fade || 0.6) + 0.1); } catch (e) {} });
        this._droneNodes = [];
      }
    },

    // ----- SFX -----
    chime() { if (!this.unlocked) return; const t = this.ctx.currentTime; [880, 1320].forEach((f, i) => this._tone(f, t + i * 0.05, 0.5, "sine", 0.18)); },
    coin() { if (!this.unlocked) return; const t = this.ctx.currentTime; this._tone(987, t, 0.09, "square", 0.1); this._tone(1318, t + 0.07, 0.22, "square", 0.1); },
    sparkle() { if (!this.unlocked) return; const t = this.ctx.currentTime; for (let i = 0; i < 3; i++) this._tone(1200 + i * 360 + Math.random() * 120, t + i * 0.04, 0.22, "sine", 0.08); },
    bell() { if (!this.unlocked) return; const t = this.ctx.currentTime; this._tone(660, t, 1.1, "sine", 0.16); this._tone(990, t, 0.9, "sine", 0.08); this._tone(1320, t, 0.6, "sine", 0.05); },
    tap() { if (!this.unlocked) return; const t = this.ctx.currentTime; this._tone(420, t, 0.08, "sine", 0.14, null, 300); },
    whoosh() {
      if (!this.unlocked) return;
      const ctx = this.ctx, t = ctx.currentTime;
      const buf = ctx.createBuffer(1, ctx.sampleRate * 0.35, ctx.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
      const src = ctx.createBufferSource(); src.buffer = buf;
      const f = ctx.createBiquadFilter(); f.type = "bandpass"; f.frequency.setValueAtTime(500, t); f.frequency.exponentialRampToValueAtTime(1600, t + 0.3); f.Q.value = 0.8;
      const g = ctx.createGain(); g.gain.value = 0.25; g.gain.setTargetAtTime(0.0001, t + 0.18, 0.1);
      src.connect(f); f.connect(g); g.connect(this.sfxGain); src.start(t);
    },
    flap() { if (!this.unlocked) return; const t = this.ctx.currentTime; this._tone(300, t, 0.13, "sine", 0.12, null, 520); },
    splash() {
      if (!this.unlocked) return;
      const ctx = this.ctx, t = ctx.currentTime;
      const buf = ctx.createBuffer(1, ctx.sampleRate * 0.3, ctx.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 1.5);
      const src = ctx.createBufferSource(); src.buffer = buf;
      const f = ctx.createBiquadFilter(); f.type = "lowpass"; f.frequency.setValueAtTime(1800, t); f.frequency.exponentialRampToValueAtTime(400, t + 0.25);
      const g = ctx.createGain(); g.gain.value = 0.3; g.gain.setTargetAtTime(0.0001, t + 0.1, 0.12);
      src.connect(f); f.connect(g); g.connect(this.sfxGain); src.start(t);
    },
    thud() { if (!this.unlocked) return; const t = this.ctx.currentTime; this._tone(150, t, 0.18, "sine", 0.22, null, 70); },
    twang() {
      if (!this.unlocked) return;
      const ctx = this.ctx, t = ctx.currentTime;
      this._tone(220, t, 0.18, "sawtooth", 0.12, null, 120);
      this._tone(440, t, 0.12, "triangle", 0.08);
    },
    arrowFly() { if (!this.unlocked) return; const t = this.ctx.currentTime; this._tone(1700, t, 0.22, "sine", 0.06, null, 700); },
    conch() {
      // shankh — a warm rising horn, used for victory
      if (!this.unlocked) return;
      const ctx = this.ctx, t = ctx.currentTime;
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = "sawtooth";
      o.frequency.setValueAtTime(196, t);
      o.frequency.exponentialRampToValueAtTime(294, t + 0.5);
      o.frequency.setValueAtTime(294, t + 1.0);
      const f = ctx.createBiquadFilter(); f.type = "lowpass"; f.frequency.value = 1100;
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.22, t + 0.18);
      g.gain.setValueAtTime(0.22, t + 1.1);
      g.gain.exponentialRampToValueAtTime(0.001, t + 1.8);
      o.connect(f); f.connect(g); g.connect(this.sfxGain);
      o.start(t); o.stop(t + 1.9);
      this._tone(392, t + 0.05, 1.4, "sine", 0.05);
    },
    fanfare() {
      if (!this.unlocked) return;
      const t = this.ctx.currentTime;
      const notes = [392, 523.25, 659.25, 783.99];
      notes.forEach((f, i) => this._tone(f, t + i * 0.12, 0.5, "triangle", 0.14));
      this.conch();
    },
    softFail() {
      // never harsh — a gentle "try again" wobble
      if (!this.unlocked) return;
      const t = this.ctx.currentTime;
      this._tone(330, t, 0.18, "sine", 0.12, null, 247);
      this._tone(247, t + 0.12, 0.22, "sine", 0.1, null, 220);
    },
    drum() { if (!this.unlocked) return; const t = this.ctx.currentTime; this._tone(120, t, 0.16, "sine", 0.2, null, 60); },
  });

  Audio.init();
})();
