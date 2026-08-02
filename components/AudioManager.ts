// lib/AudioManager.ts

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

  // تشغيل الموسيقى المحيطية الفرعونية (قيثارة ونسمات النيل)
  public startPharaonicBgm(isNight: boolean = false) {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    this.stopBgm();
    const now = this.ctx.currentTime;

    this.bgmGain = this.ctx.createGain();
    this.bgmGain.gain.setValueAtTime(0.05, now);
    this.bgmGain.connect(this.ctx.destination);

    // سلم خماسي فرعوني (Pentatonic Scale)
    const frequencies = isNight 
      ? [146.83, 164.81, 196.00, 220.00, 261.63] // نغمات ليلية هادئة
      : [220.00, 246.94, 293.66, 329.63, 392.00]; // نغمات نهارية مشرقة

    frequencies.forEach((freq, index) => {
      if (!this.ctx || !this.bgmGain) return;
      const osc = this.ctx.createOscillator();
      osc.type = isNight ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(freq, now);
      
      const noteGain = this.ctx.createGain();
      noteGain.gain.setValueAtTime(0.01, now);
      
      // نبضات بطيئة تحاكي عزف القيثارة
      const pulseRate = 2 + index * 1.5;
      for (let i = 0; i < 60; i += pulseRate) {
        noteGain.gain.exponentialRampToValueAtTime(0.03, now + i);
        noteGain.gain.exponentialRampToValueAtTime(0.005, now + i + pulseRate / 2);
      }

      osc.connect(noteGain);
      noteGain.connect(this.bgmGain);
      osc.start(now);
      this.bgmOscillators.push(osc);
    });
  }

  public stopBgm() {
    this.bgmOscillators.forEach(osc => {
      try { osc.stop(); osc.disconnect(); } catch (e) {}
    });
    this.bgmOscillators = [];
  }

  // صوت خرير المياه أو صوت بيطري للإنقاذ
  public playSpatialSfx(type: 'water' | 'harp' | 'danger' | 'vet') {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.ctx.destination);

    if (type === 'danger') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(110, now);
      osc.frequency.linearRampToValueAtTime(88, now + 0.4);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
      osc.start(now);
      osc.stop(now + 0.4);
    } else if (type === 'vet') {
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

// إضافة الكائن المساعد والدالة التي تتطلبها الصفحة الرئيسية لتختفي كافة الأخطاء تماماً
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