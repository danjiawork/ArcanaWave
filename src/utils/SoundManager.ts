export class SoundManager {
  private ctx: AudioContext | null = null;

  init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  private playTone(freq: number, type: OscillatorType, duration: number, vol: number = 0.1) {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
    
    gain.gain.setValueAtTime(0, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(vol, this.ctx.currentTime + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
    
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    
    osc.start();
    osc.stop(this.ctx.currentTime + duration);
  }

  playFan() {
    if (!this.ctx) return;
    // 神秘的展开音效 (Magical sweep)
    [300, 400, 500, 600, 800, 1200].forEach((f, i) => {
      setTimeout(() => this.playTone(f, 'sine', 0.5, 0.05), i * 40);
    });
  }

  playDraw() {
    if (!this.ctx) return;
    // 抽牌的清脆音效 (Chime)
    this.playTone(880, 'sine', 1.5, 0.1);
    this.playTone(1108.73, 'sine', 1.5, 0.08); // C#6
    this.playTone(1318.51, 'sine', 1.5, 0.05); // E6
  }

  playReveal() {
    if (!this.ctx) return;
    // 翻牌的深沉共鸣音效 (Deep resonant chord)
    this.playTone(220, 'triangle', 3, 0.2); // A3
    this.playTone(277.18, 'triangle', 3, 0.15); // C#4
    this.playTone(329.63, 'triangle', 3, 0.15); // E4
    this.playTone(440, 'sine', 4, 0.1); // A4
  }
}

export const soundManager = new SoundManager();
