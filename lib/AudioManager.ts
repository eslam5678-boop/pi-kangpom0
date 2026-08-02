// نوع يمثل فترات اليوم الفرعوني
export type TimeOfDay = 'sunrise' | 'day' | 'sunset' | 'night';

export class AudioManagerAndCycle {
  private static audioCtx: AudioContext | null = null;
  private static isMuted: boolean = false;
  private static currentTime: TimeOfDay = 'day';

  // تهيئة محرك الصوتيات Web Audio API
  private static initAudio() {
    if (!this.audioCtx && typeof window !== 'undefined') {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.audioCtx = new AudioContextClass();
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  // تشغيل صوت القيثارة الفرعونية (نغمة ترحيبية / تفاعل)
  public static playHarpSound(freq: number = 440) {
    if (this.isMuted) return;
    this.initAudio();
    if (!this.audioCtx) return;

    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, this.audioCtx.currentTime);

    // تدرج صوتي يشبه نبرة الأوتار
    gain.gain.setValueAtTime(0.3, this.audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, this.audioCtx.currentTime + 1.5);

    osc.connect(gain);
    gain.connect(this.audioCtx.destination);

    osc.start();
    osc.stop(this.audioCtx.currentTime + 1.5);
  }

  // تشغيل صوت خرير الماء (عند الري أو الصيد)
  public static playWaterSound() {
    if (this.isMuted) return;
    this.initAudio();
    if (!this.audioCtx) return;

    const bufferSize = this.audioCtx.sampleRate * 0.5; // نصف ثانية
    const buffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 0.2 - 0.1;
    }

    const noise = this.audioCtx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.audioCtx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 800;

    noise.connect(filter);
    filter.connect(this.audioCtx.destination);

    noise.start();
  }

  // الحصول على مرشح الألوان (CSS Filter) المناسب للخريطة بناءً على الوقت
  public static getCycleFilter(time: TimeOfDay): string {
    switch (time) {
      case 'sunrise':
        return 'contrast(105%) brightness(105%) sepia(25%) hue-rotate(-10deg)';
      case 'day':
        return 'contrast(100%) brightness(100%) sepia(0%)';
      case 'sunset':
        return 'contrast(110%) brightness(90%) sepia(40%) hue-rotate(-20deg) saturate(130%)';
      case 'night':
        return 'contrast(120%) brightness(70%) sepia(30%) hue-rotate(180deg) saturate(85%)';
    }
  }
}