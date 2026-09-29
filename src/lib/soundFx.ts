/**
 * Modern High-Fidelity Chess Sound Engine
 * Synthesizes authentic acoustic wood impacts, crisp piece-to-piece strikes,
 * elegant crystal harmonic check chimes, and ambient cinematic game-over chords.
 * Zero external audio file network dependencies, 0 latency, 100% organic acoustic physics.
 */
class ModernChessSFX {
  private ctx: AudioContext | null = null;

  private initCtx(): AudioContext | null {
    if (typeof window === "undefined") return null;
    try {
      if (!this.ctx) {
        const AudioCtx =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext })
            .webkitAudioContext;
        this.ctx = new AudioCtx();
      }
      if (this.ctx.state === "suspended") {
        this.ctx.resume();
      }
      return this.ctx;
    } catch {
      return null;
    }
  }

  // Create micro noise buffer for acoustic wood click transients
  private createNoiseBuffer(duration = 0.05): AudioBuffer | null {
    if (!this.ctx) return null;
    const bufferSize = Math.floor(this.ctx.sampleRate * duration);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    return buffer;
  }

  /**
   * Modern Clean Wood Move Sound (Chess.com / Lichess Style)
   * A soft, tactile wooden knock:
   * 1. High-frequency felt/wood contact transient (filtered click)
   * 2. Warm low-frequency wooden board resonance (190Hz -> 130Hz decay)
   */
  playMove() {
    const ctx = this.initCtx();
    if (!ctx) return;
    const now = ctx.currentTime;

    // ── 1. Wood Impact Transient (tactile surface tap) ──
    const noiseBuffer = this.createNoiseBuffer(0.025);
    if (noiseBuffer) {
      const noise = ctx.createBufferSource();
      noise.buffer = noiseBuffer;

      const bandpass = ctx.createBiquadFilter();
      bandpass.type = "bandpass";
      bandpass.frequency.setValueAtTime(1400, now);
      bandpass.Q.setValueAtTime(2.5, now);

      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.18, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.022);

      noise.connect(bandpass);
      bandpass.connect(noiseGain);
      noiseGain.connect(ctx.destination);

      noise.start(now);
      noise.stop(now + 0.025);
    }

    // ── 2. Wooden Board Body Resonance (warm acoustic thud) ──
    const osc = ctx.createOscillator();
    const oscFilter = ctx.createBiquadFilter();
    const oscGain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(190, now);
    osc.frequency.exponentialRampToValueAtTime(130, now + 0.045);

    oscFilter.type = "lowpass";
    oscFilter.frequency.setValueAtTime(450, now);

    oscGain.gain.setValueAtTime(0.35, now);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.055);

    osc.connect(oscFilter);
    oscFilter.connect(oscGain);
    oscGain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.06);
  }

  /**
   * Crisp Wooden Capture Sound
   * Decisive tactile collision of two pieces + secondary wood board settle
   */
  playCapture() {
    const ctx = this.initCtx();
    if (!ctx) return;
    const now = ctx.currentTime;

    // ── 1. Piece-to-Piece Strike Transient (crisp snap) ──
    const noiseBuffer = this.createNoiseBuffer(0.035);
    if (noiseBuffer) {
      const noise = ctx.createBufferSource();
      noise.buffer = noiseBuffer;

      const bandpass = ctx.createBiquadFilter();
      bandpass.type = "bandpass";
      bandpass.frequency.setValueAtTime(2200, now);
      bandpass.Q.setValueAtTime(2.0, now);

      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.28, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);

      noise.connect(bandpass);
      bandpass.connect(noiseGain);
      noiseGain.connect(ctx.destination);

      noise.start(now);
      noise.stop(now + 0.035);
    }

    // ── 2. Heavy Wood Body Punch ──
    const osc = ctx.createOscillator();
    const oscFilter = ctx.createBiquadFilter();
    const oscGain = ctx.createGain();

    osc.type = "triangle";
    osc.frequency.setValueAtTime(230, now);
    osc.frequency.exponentialRampToValueAtTime(115, now + 0.05);

    oscFilter.type = "lowpass";
    oscFilter.frequency.setValueAtTime(550, now);

    oscGain.gain.setValueAtTime(0.42, now);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);

    osc.connect(oscFilter);
    oscFilter.connect(oscGain);
    oscGain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.075);

    // ── 3. Secondary subtle wood settle (+14ms) ──
    setTimeout(() => {
      if (!this.ctx) return;
      const t = this.ctx.currentTime;
      const settleOsc = this.ctx.createOscillator();
      const settleGain = this.ctx.createGain();

      settleOsc.type = "sine";
      settleOsc.frequency.setValueAtTime(145, t);
      settleOsc.frequency.exponentialRampToValueAtTime(95, t + 0.035);

      settleGain.gain.setValueAtTime(0.2, t);
      settleGain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);

      settleOsc.connect(settleGain);
      settleGain.connect(this.ctx.destination);

      settleOsc.start(t);
      settleOsc.stop(t + 0.045);
    }, 14);
  }

  /**
   * Elegant Harmonic Check Chime
   * Clear, dual harmonic vibraphone/chime chime (warm G5 + C6)
   * High-class, subtle, distinct and pleasant.
   */
  playCheck() {
    const ctx = this.initCtx();
    if (!ctx) return;
    const now = ctx.currentTime;

    const harmonics = [
      { freq: 784.0, gain: 0.16 }, // G5
      { freq: 1046.5, gain: 0.13 }, // C6
      { freq: 1568.0, gain: 0.06 }, // G6 shimmer
    ];

    harmonics.forEach(({ freq, gain: vol }) => {
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const oscGain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now);

      // Soft attack (4ms) prevents clicks, long smooth decay (280ms)
      oscGain.gain.setValueAtTime(0.001, now);
      oscGain.gain.linearRampToValueAtTime(vol, now + 0.006);
      oscGain.gain.exponentialRampToValueAtTime(0.0005, now + 0.28);

      osc.connect(oscGain);
      oscGain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.3);
    });
  }

  /**
   * Modern Cinematic Game Over Chord
   * Victory: Rich warm major chord swell (C4 - G4 - C5 - E5)
   * Defeat: Soft, dignified melancholic ambient minor pad (A3 - E4 - A4 - C5)
   */
  playGameOver(isVictory: boolean) {
    const ctx = this.initCtx();
    if (!ctx) return;
    const now = ctx.currentTime;

    const notes = isVictory
      ? [261.63, 392.0, 523.25, 659.25] // C4, G4, C5, E5 (Major)
      : [220.0, 329.63, 440.0, 523.25]; // A3, E4, A4, C5 (Minor)

    notes.forEach((freq, idx) => {
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now);

      filter.type = "lowpass";
      filter.frequency.setValueAtTime(1200, now);

      const delay = idx * 0.05;
      const noteStart = now + delay;
      const noteEnd = noteStart + 0.65;

      gain.gain.setValueAtTime(0.001, noteStart);
      gain.gain.linearRampToValueAtTime(0.12, noteStart + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0005, noteEnd);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc.start(noteStart);
      osc.stop(noteEnd + 0.05);
    });
  }

  /**
   * Modern Castling Sound (King + Rook double slide)
   */
  playCastle() {
    this.playMove();
    setTimeout(() => {
      this.playMove();
    }, 90);
  }

  /**
   * Promotion Chime (Ascending celebratory arpeggio)
   */
  playPromote() {
    const ctx = this.initCtx();
    if (!ctx) return;
    const now = ctx.currentTime;
    const notes = [523.25, 659.25, 784.0, 1046.5]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now + idx * 0.06);

      gain.gain.setValueAtTime(0.001, now + idx * 0.06);
      gain.gain.linearRampToValueAtTime(0.12, now + idx * 0.06 + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.22);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + idx * 0.06);
      osc.stop(now + idx * 0.06 + 0.25);
    });
  }
}

export const sfx = new ModernChessSFX();