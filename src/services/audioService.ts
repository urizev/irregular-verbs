/**
 * Servicio de síntesis de audio mediante Web Audio API para efectos de sonido sin dependencias de red.
 */
class AudioService {
  private ctx: AudioContext | null = null;
  public soundEnabled = true;

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public playClick(): void {
    if (!this.soundEnabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.05);

      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.05);
    } catch {
      // Ignorar errores de audio
    }
  }

  public playCorrect(): void {
    if (!this.soundEnabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
      notes.forEach((freq, index) => {
        const startTime = ctx.currentTime + index * 0.08;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, startTime);

        gain.gain.setValueAtTime(0.25, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.15);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + 0.15);
      });
    } catch {
      // Ignorar
    }
  }

  public playWrong(): void {
    if (!this.soundEnabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const notes = [220, 174.61]; // A3, F3
      notes.forEach((freq, index) => {
        const startTime = ctx.currentTime + index * 0.12;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, startTime);

        gain.gain.setValueAtTime(0.18, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.2);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + 0.2);
      });
    } catch {
      // Ignorar
    }
  }

  public playVictory(): void {
    if (!this.soundEnabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const fanfare = [
        { freq: 523.25, duration: 0.1 }, // C5
        { freq: 659.25, duration: 0.1 }, // E5
        { freq: 783.99, duration: 0.12 }, // G5
        { freq: 1046.5, duration: 0.35 }, // C6
      ];

      let currentTime = ctx.currentTime;
      fanfare.forEach((item) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(item.freq, currentTime);

        gain.gain.setValueAtTime(0.3, currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, currentTime + item.duration);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(currentTime);
        osc.stop(currentTime + item.duration);

        currentTime += item.duration * 0.85;
      });
    } catch {
      // Ignorar
    }
  }
}

export const audioService = new AudioService();
