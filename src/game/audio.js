// Procedural audio using Web Audio API. Zone-based ambient drones + one-shot SFX.
// No external audio files required.

export class AudioSystem {
  constructor() {
    this.enabled = true;
    this.ctx = null;
    this.master = null;
    this.currentAmbient = null;
    this.currentZoneId = null;
    this._initialized = false;
  }

  init() {
    if (this._initialized) return;
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.6;
      this.master.connect(this.ctx.destination);
      this._initialized = true;
    } catch (e) {
      this.enabled = false;
    }
  }

  resume() {
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
  }

  setZone(zoneId) {
    if (!this.enabled) return;
    this.init();
    if (this.currentZoneId === zoneId) return;
    this.currentZoneId = zoneId;
    // fade out previous ambient
    if (this.currentAmbient) {
      try {
        this.currentAmbient.gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 1.2);
        const prev = this.currentAmbient;
        setTimeout(() => {
          try { prev.oscillators.forEach(o => o.stop()); } catch (e) { /* noop */ }
        }, 1400);
      } catch (e) { /* noop */ }
    }
    this.currentAmbient = this._buildAmbient(zoneId);
  }

  _buildAmbient(zoneId) {
    const ctx = this.ctx;
    const g = ctx.createGain();
    g.gain.value = 0;
    g.connect(this.master);

    const cfg = {
      dungeon: { base: 55, detune: 6, wave: 'sawtooth', filter: 400, vol: 0.07 },
      garden: { base: 110, detune: 12, wave: 'triangle', filter: 1200, vol: 0.06 },
      catacombs: { base: 70, detune: 8, wave: 'sine', filter: 500, vol: 0.07 },
      abyss: { base: 45, detune: 20, wave: 'sawtooth', filter: 300, vol: 0.1 },
    }[zoneId] || { base: 60, detune: 4, wave: 'sine', filter: 400, vol: 0.05 };

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = cfg.filter;
    filter.Q.value = 2;
    filter.connect(g);

    // A few detuned oscillators for an eerie drone
    const oscillators = [];
    for (let i = 0; i < 4; i++) {
      const osc = ctx.createOscillator();
      osc.type = cfg.wave;
      osc.frequency.value = cfg.base;
      osc.detune.value = (Math.random() - 0.5) * cfg.detune * 100;
      const og = ctx.createGain();
      og.gain.value = 0.25;
      osc.connect(og);
      og.connect(filter);
      osc.start();
      oscillators.push(osc);
    }

    // wind/whisper layer (white noise via buffer)
    const noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const data = noiseBuf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() - 0.5) * 2;
    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuf;
    noise.loop = true;
    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.value = zoneId === 'garden' ? 800 : 200;
    noiseFilter.Q.value = 0.5;
    const noiseGain = ctx.createGain();
    noiseGain.gain.value = zoneId === 'garden' || zoneId === 'abyss' ? 0.15 : 0.05;
    noise.connect(noiseFilter); noiseFilter.connect(noiseGain); noiseGain.connect(filter);
    noise.start();
    oscillators.push(noise);

    g.gain.linearRampToValueAtTime(cfg.vol, ctx.currentTime + 2);
    return { gain: g, oscillators };
  }

  // --- One-shot SFX ---

  _blip(freq, dur = 0.1, type = 'square', vol = 0.2) {
    if (!this.enabled) return;
    this.init();
    const ctx = this.ctx;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    osc.connect(g); g.connect(this.master);
    g.gain.value = 0;
    g.gain.linearRampToValueAtTime(vol, ctx.currentTime + 0.005);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
    osc.start();
    osc.stop(ctx.currentTime + dur + 0.05);
  }

  sfxShoot() { this._blip(620, 0.08, 'square', 0.12); this._blip(280, 0.12, 'sawtooth', 0.08); }
  sfxSwing() { this._blip(180, 0.12, 'triangle', 0.15); }
  sfxHit() { this._blip(140, 0.1, 'sawtooth', 0.15); }
  sfxPickup() { this._blip(880, 0.1, 'sine', 0.18); this._blip(1320, 0.12, 'sine', 0.12); }
  sfxDoor() { this._blip(200, 0.35, 'sawtooth', 0.18); }
  sfxSpell() {
    this._blip(440, 0.2, 'sine', 0.18);
    setTimeout(() => this._blip(880, 0.18, 'triangle', 0.14), 50);
    setTimeout(() => this._blip(1200, 0.15, 'sine', 0.1), 120);
  }
  sfxHurt() { this._blip(110, 0.2, 'sawtooth', 0.22); }
  sfxDeath() {
    this._blip(220, 0.4, 'sawtooth', 0.25);
    setTimeout(() => this._blip(110, 0.5, 'sawtooth', 0.25), 200);
    setTimeout(() => this._blip(55, 0.8, 'sawtooth', 0.25), 450);
  }
  sfxBossRoar() {
    this._blip(90, 0.8, 'sawtooth', 0.35);
    setTimeout(() => this._blip(60, 0.6, 'sawtooth', 0.25), 100);
  }
}
