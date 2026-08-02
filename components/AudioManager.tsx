// components/AudioManager.tsx

export type TimeOfDay = "day" | "sunset" | "night" | "sunrise";

class AudioManager {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private bgmOscillators: OscillatorNode[] = [];
  private bgmGain: GainNode | null = null;

  private init() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioContextClass();
    }
  }

  public startPharaonicBgm(isNight: boolean = false) {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;
    this.stopBgm();
    const now = this.ctx.currentTime;
    this.bgmGain = this.ctx.createGain();
    this.bgmGain.gain.setValueAtTime(0.05, now);
    this.bgmGain.connect(this.ctx.destination);
  }

  public stopBgm() {
    this.bgmOscillators.forEach(osc => {
      try { osc.stop(); osc.disconnect(); } catch (e) {}
    });
    this.bgmOscillators = [];
  }

  public playSpatialSfx(type: 'water' | 'harp' | 'danger' | 'vet') {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.ctx.destination);

    if (type === 'harp' || type === 'vet') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.5);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
      osc.start(now);
      osc.stop(now + 0.5);
    }
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.isMuted) this.stopBgm();
    return this.isMuted;
  }
}

export const audioManager = new AudioManager();

// الكائن والدالة المطلوبة لتختفي المشكلة من صفحة page.tsx تماماً
export const AudioManagerAndCycle = {
  getCycleFilter(timeOfDay: TimeOfDay): string {
    switch (timeOfDay) {
      case "night":
        return "brightness(0.4) contrast(1.2) sepia(0.3)";
      case "sunset":
        return "brightness(0.8) sepia(0.5) hue-rotate(-20deg)";
      case "sunrise":
        return "brightness(0.9) sepia(0.2)";
      case "day":
      default:
        return "brightness(1) contrast(1)";
    }
  },
  playHarpSound(freq: number = 440) {
    audioManager.playSpatialSfx('harp');
  },
  playWaterSound() {
    audioManager.playSpatialSfx('water');
  }
};

export default AudioManagerAndCycle;