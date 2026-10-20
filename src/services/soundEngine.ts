class SoundEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private ambientGain: GainNode | null = null;
  private muted: boolean = false;
  private ambientActive: boolean = false;
  private ambientOscs: OscillatorNode[] = [];

  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.ambientGain = null;
    this.muted = false;
    this.ambientActive = false;
    this.ambientOscs = [];
    try {
      const savedMute = localStorage.getItem("ludoMuted");
      this.muted = savedMute === "true";
    } catch {
      this.muted = false;
    }
  }
  initCtx(): AudioContext {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this.muted ? 0 : 1;
      this.masterGain.connect(this.ctx.destination);
      this.ambientGain = this.ctx.createGain();
      this.ambientGain.gain.value = 0.08;
      this.ambientGain.connect(this.masterGain);
    }
    if (this.ctx.state === "suspended") {
      this.ctx.resume();
    }
    return this.ctx;
  }
  unlock(): void {
    try {
      this.initCtx();
    } catch (e) {
      console.warn("Audio unlock failed:", e);
    }
  }
  isMuted(): boolean {
    return this.muted;
  }
  setMuted(mute: boolean): void {
    this.muted = mute;
    try {
      localStorage.setItem("ludoMuted", String(mute));
    } catch {
    }
    if (this.ctx && this.masterGain) {
      const t = this.ctx.currentTime;
      this.masterGain.gain.cancelScheduledValues(t);
      this.masterGain.gain.setTargetAtTime(mute ? 0 : 1, t, 0.02);
    }
  }
  toggleMute(): boolean {
    this.setMuted(!this.muted);
    return this.muted;
  }
  tone(freq: number, dur: number, type: OscillatorType = "sine", vol: number = 0.2, delay: number = 0, glideTo?: number): void {
    if (this.muted) return;
    const c = this.initCtx();
    const t0 = c.currentTime + delay;
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (glideTo) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(10, glideTo), t0 + dur);
    }
    gain.gain.setValueAtTime(1e-4, t0);
    gain.gain.linearRampToValueAtTime(vol, t0 + 0.01);
    gain.gain.exponentialRampToValueAtTime(1e-4, t0 + dur);
    osc.connect(gain);
    if (this.masterGain) gain.connect(this.masterGain);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
  }
  noiseBurst(dur: number, vol: number = 0.2, delay: number = 0, freq: number = 1600): void {
    if (this.muted) return;
    const c = this.initCtx();
    const t0 = c.currentTime + delay;
    const bufferSize = Math.max(1, Math.floor(c.sampleRate * dur));
    const buffer = c.createBuffer(1, bufferSize, c.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    }
    const src = c.createBufferSource();
    src.buffer = buffer;
    const filter = c.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = freq;
    const gain = c.createGain();
    gain.gain.setValueAtTime(vol, t0);
    gain.gain.exponentialRampToValueAtTime(1e-3, t0 + dur);
    src.connect(filter);
    filter.connect(gain);
    if (this.masterGain) gain.connect(this.masterGain);
    src.start(t0);
  }
  playDiceTick() {
    this.tone(280 + Math.random() * 180, 0.05, "square", 0.12);
  }
  playDiceSettle() {
    this.tone(440, 0.12, "triangle", 0.3);
    this.tone(660, 0.18, "triangle", 0.22, 0.04);
  }
  playHop(delay = 0) {
    this.tone(240 + Math.random() * 80, 0.08, "sine", 0.25, delay);
    this.noiseBurst(0.06, 0.1, delay, 2e3);
  }
  playCapture() {
    this.noiseBurst(0.28, 0.45, 0, 2200);
    this.tone(220, 0.35, "sawtooth", 0.35, 0.02, 50);
    this.tone(110, 0.3, "square", 0.25, 0.05, 40);
  }
  playPowerup() {
    this.tone(523.25, 0.1, "triangle", 0.25, 0);
    this.tone(659.25, 0.1, "triangle", 0.25, 0.08);
    this.tone(783.99, 0.15, "sine", 0.3, 0.16);
    this.tone(1046.5, 0.25, "sine", 0.35, 0.24);
  }
  playShield() {
    this.tone(300, 0.2, "sine", 0.25, 0, 600);
    this.tone(450, 0.25, "triangle", 0.2, 0.05, 900);
  }
  playStarBlessing() {
    this.tone(880, 0.12, "sine", 0.25, 0);
    this.tone(1108.73, 0.12, "sine", 0.25, 0.08);
    this.tone(1318.51, 0.2, "sine", 0.3, 0.16);
  }
  playVictory() {
    if (this.muted) return;
    const c = this.initCtx();
    const t0 = c.currentTime;
    const bassOsc = c.createOscillator();
    const bassGain = c.createGain();
    bassOsc.type = "sawtooth";
    bassOsc.frequency.setValueAtTime(180, t0);
    bassOsc.frequency.exponentialRampToValueAtTime(32, t0 + 0.8);
    bassGain.gain.setValueAtTime(0.5, t0);
    bassGain.gain.exponentialRampToValueAtTime(1e-3, t0 + 1.2);
    const bassFilter = c.createBiquadFilter();
    bassFilter.type = "lowpass";
    bassFilter.frequency.setValueAtTime(300, t0);
    bassFilter.frequency.linearRampToValueAtTime(80, t0 + 0.8);
    bassOsc.connect(bassFilter);
    bassFilter.connect(bassGain);
    if (this.masterGain) bassGain.connect(this.masterGain);
    bassOsc.start(t0);
    bassOsc.stop(t0 + 1.3);
    const bufSize = Math.floor(c.sampleRate * 1.2);
    const buffer = c.createBuffer(1, bufSize, c.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufSize, 2);
    }
    const noiseSrc = c.createBufferSource();
    noiseSrc.buffer = buffer;
    const noiseFilter = c.createBiquadFilter();
    noiseFilter.type = "highpass";
    noiseFilter.frequency.setValueAtTime(3500, t0);
    const noiseGain = c.createGain();
    noiseGain.gain.setValueAtTime(0.35, t0 + 0.05);
    noiseGain.gain.exponentialRampToValueAtTime(1e-3, t0 + 1.2);
    noiseSrc.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    if (this.masterGain) noiseGain.connect(this.masterGain);
    noiseSrc.start(t0 + 0.05);
    const fanfareNotes = [
      { freq: 261.63, delay: 0, dur: 0.22, vol: 0.35 },
      // C4
      { freq: 329.63, delay: 0.12, dur: 0.22, vol: 0.35 },
      // E4
      { freq: 392, delay: 0.24, dur: 0.22, vol: 0.35 },
      // G4
      { freq: 523.25, delay: 0.36, dur: 0.35, vol: 0.4 },
      // C5
      { freq: 659.25, delay: 0.5, dur: 0.35, vol: 0.4 },
      // E5
      { freq: 783.99, delay: 0.64, dur: 0.4, vol: 0.45 }
      // G5
    ];
    fanfareNotes.forEach(({ freq, delay, dur, vol }) => {
      const osc = c.createOscillator();
      const osc2 = c.createOscillator();
      const gain = c.createGain();
      const filter = c.createBiquadFilter();
      const startTime = t0 + delay;
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(freq, startTime);
      osc2.type = "triangle";
      osc2.frequency.setValueAtTime(freq * 1.002, startTime);
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(2e3, startTime);
      gain.gain.setValueAtTime(1e-3, startTime);
      gain.gain.linearRampToValueAtTime(vol, startTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(1e-3, startTime + dur);
      osc.connect(filter);
      osc2.connect(filter);
      filter.connect(gain);
      if (this.masterGain) gain.connect(this.masterGain);
      osc.start(startTime);
      osc2.start(startTime);
      osc.stop(startTime + dur + 0.05);
      osc2.stop(startTime + dur + 0.05);
    });
    const chordNotes = [261.63, 392, 523.25, 659.25, 783.99, 1046.5, 1318.51];
    const chordStartTime = t0 + 0.82;
    const chordDuration = 2.8;
    chordNotes.forEach((freq, idx) => {
      const osc = c.createOscillator();
      const oscTriangle = c.createOscillator();
      const gain = c.createGain();
      const filter = c.createBiquadFilter();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(freq, chordStartTime);
      oscTriangle.type = "triangle";
      oscTriangle.frequency.setValueAtTime(freq * 0.998, chordStartTime);
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(2600, chordStartTime);
      const vol = idx >= 4 ? 0.22 : 0.32;
      gain.gain.setValueAtTime(1e-3, chordStartTime);
      gain.gain.linearRampToValueAtTime(vol, chordStartTime + 0.12);
      gain.gain.setValueAtTime(vol * 0.85, chordStartTime + 1.2);
      gain.gain.exponentialRampToValueAtTime(1e-4, chordStartTime + chordDuration);
      osc.connect(filter);
      oscTriangle.connect(filter);
      filter.connect(gain);
      if (this.masterGain) gain.connect(this.masterGain);
      osc.start(chordStartTime);
      oscTriangle.start(chordStartTime);
      osc.stop(chordStartTime + chordDuration + 0.1);
      oscTriangle.stop(chordStartTime + chordDuration + 0.1);
    });
    const chimeFreqs = [1046.5, 1318.51, 1567.98, 2093, 2637.02, 3135.96, 4186.01];
    chimeFreqs.forEach((freq, i) => {
      const delay = 0.9 + i * 0.08;
      const startTime = t0 + delay;
      const osc = c.createOscillator();
      const gain = c.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, startTime);
      gain.gain.setValueAtTime(1e-3, startTime);
      gain.gain.linearRampToValueAtTime(0.18, startTime + 0.01);
      gain.gain.exponentialRampToValueAtTime(1e-4, startTime + 0.45);
      osc.connect(gain);
      if (this.masterGain) gain.connect(this.masterGain);
      osc.start(startTime);
      osc.stop(startTime + 0.5);
    });
  }
  toggleAmbientMusic() {
    this.ambientActive = !this.ambientActive;
    const c = this.initCtx();
    if (this.ambientActive && this.ambientGain) {
      this.ambientOscs.forEach((o) => o.stop());
      this.ambientOscs = [];
      [110, 164.81, 220, 329.63].forEach((freq) => {
        const osc = c.createOscillator();
        osc.type = "sine";
        osc.frequency.value = freq;
        if (this.ambientGain) osc.connect(this.ambientGain);
        osc.start();
        this.ambientOscs.push(osc);
      });
    } else {
      this.ambientOscs.forEach((o) => o.stop());
      this.ambientOscs = [];
    }
    return this.ambientActive;
  }
  isAmbientActive() {
    return this.ambientActive;
  }
}
export const soundEngine = new SoundEngine();