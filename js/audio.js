/**
 * Synthesized Web Audio API sound engine for ATC Radar.
 * Zero external audio files required; works 100% offline.
 */
export class SoundEngine {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.lastWarningTime = 0;
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  setMuted(muted) {
    this.muted = Boolean(muted);
  }

  isMuted() {
    return this.muted;
  }

  _canPlay() {
    if (this.muted) return false;
    this.init();
    return Boolean(this.ctx && this.ctx.state === 'running');
  }

  /** Soft click when grabbing an aircraft */
  playGrab() {
    if (!this._canPlay()) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(760, now);
    osc.frequency.exponentialRampToValueAtTime(520, now + 0.045);

    gain.gain.setValueAtTime(0.09, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.055);
  }

  /** Confirmation tone when path locks onto a runway or heliport */
  playLock() {
    if (!this._canPlay()) return;
    const now = this.ctx.currentTime;

    const notes = [660, 880];
    notes.forEach((freq, idx) => {
      const start = now + idx * 0.055;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, start);

      gain.gain.setValueAtTime(0.001, start);
      gain.gain.linearRampToValueAtTime(0.11, start + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.11);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(start);
      osc.stop(start + 0.12);
    });
  }

  /** Pleasant chime when an aircraft lands safely */
  playLand() {
    if (!this._canPlay()) return;
    const now = this.ctx.currentTime;

    const notes = [587.33, 880, 1174.66]; // D5 - A5 - D6
    notes.forEach((freq, idx) => {
      const start = now + idx * 0.06;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, start);

      gain.gain.setValueAtTime(0.001, start);
      gain.gain.linearRampToValueAtTime(0.12, start + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.24);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(start);
      osc.stop(start + 0.26);
    });
  }

  /** Intermittent radar warning beep during proximity alert */
  playWarningBeep() {
    if (!this._canPlay()) return;
    const nowMs = performance.now();
    if (nowMs - this.lastWarningTime < 460) return;
    this.lastWarningTime = nowMs;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(980, now);
    osc.frequency.setValueAtTime(780, now + 0.07);

    gain.gain.setValueAtTime(0.055, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.15);
  }

  /** Alert chirp when VIP / Emergency aircraft approaches */
  playVipAlert() {
    if (!this._canPlay()) return;
    const now = this.ctx.currentTime;

    [0, 0.14].forEach((offset) => {
      const start = now + offset;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(640, start);
      osc.frequency.linearRampToValueAtTime(960, start + 0.09);

      gain.gain.setValueAtTime(0.06, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.11);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(start);
      osc.stop(start + 0.12);
    });
  }

  /** Subtle buzz when tapping an uneditable VIP flight */
  playDenied() {
    if (!this._canPlay()) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(170, now);
    osc.frequency.linearRampToValueAtTime(130, now + 0.09);

    gain.gain.setValueAtTime(0.06, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.11);
  }

  /** Subtle chime when wind direction shifts */
  playWindShift() {
    if (!this._canPlay()) return;
    const now = this.ctx.currentTime;
    const notes = [440, 554.37, 440]; // A4 - C#5 - A4
    notes.forEach((freq, idx) => {
      const start = now + idx * 0.08;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, start);
      gain.gain.setValueAtTime(0.001, start);
      gain.gain.linearRampToValueAtTime(0.07, start + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.16);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(start);
      osc.stop(start + 0.18);
    });
  }

  /** Collision alarm & low impact */
  playCollision() {
    if (!this._canPlay()) return;
    const now = this.ctx.currentTime;

    // Low impact thud
    const sub = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    sub.type = 'sine';
    sub.frequency.setValueAtTime(140, now);
    sub.frequency.exponentialRampToValueAtTime(36, now + 0.45);
    subGain.gain.setValueAtTime(0.28, now);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
    sub.connect(subGain);
    subGain.connect(this.ctx.destination);
    sub.start(now);
    sub.stop(now + 0.52);

    // Descending radar alarm
    const alarm = this.ctx.createOscillator();
    const alarmGain = this.ctx.createGain();
    alarm.type = 'sawtooth';
    alarm.frequency.setValueAtTime(520, now);
    alarm.frequency.linearRampToValueAtTime(220, now + 0.55);
    alarmGain.gain.setValueAtTime(0.11, now);
    alarmGain.gain.exponentialRampToValueAtTime(0.001, now + 0.58);
    alarm.connect(alarmGain);
    alarmGain.connect(this.ctx.destination);
    alarm.start(now);
    alarm.stop(now + 0.6);
  }
}
