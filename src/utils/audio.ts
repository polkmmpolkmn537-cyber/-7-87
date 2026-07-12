/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

class AudioSynthesizer {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;

  // Ambient background music properties
  private ambientInterval: any = null;
  private isAmbientOn: boolean = false;
  private ambientStep: number = 0;
  private ambientGain: GainNode | null = null;
  private ambientDelay: DelayNode | null = null;
  private ambientFeedback: GainNode | null = null;

  private initCtx() {
    if (!this.ctx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        this.ctx = new AudioContextClass();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setMute(muted: boolean) {
    this.isMuted = muted;
    if (!muted) {
      this.initCtx();
      // If ambient music was on, we can make sure the gain node is set correctly
      if (this.isAmbientOn && this.ambientGain && this.ctx) {
        this.ambientGain.gain.setValueAtTime(0.04, this.ctx.currentTime);
      }
    } else {
      // Mute active ambient gain node instantly
      if (this.ambientGain && this.ctx) {
        this.ambientGain.gain.setValueAtTime(0, this.ctx.currentTime);
      }
    }
  }

  public getMuted() {
    return this.isMuted;
  }

  private createNoiseBuffer(): AudioBuffer {
    if (!this.ctx) return {} as AudioBuffer;
    const bufferSize = this.ctx.sampleRate * 2; // 2 seconds
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    return buffer;
  }

  // Sizzle sound for grilling/slicing
  public playSizzle(duration = 0.5, volume = 0.15) {
    if (this.isMuted) return;
    try {
      this.initCtx();
      const ctx = this.ctx;
      if (!ctx) return;

      const noise = ctx.createBufferSource();
      noise.buffer = this.createNoiseBuffer();

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 1200;
      filter.Q.value = 1.5;

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(volume, ctx.currentTime + 0.05);
      gain.gain.setValueAtTime(volume, ctx.currentTime + duration - 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      noise.start();
      noise.stop(ctx.currentTime + duration);
    } catch (e) {
      console.warn('Audio play failed', e);
    }
  }

  // Knife Slicing Swish
  public playSlice() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      const ctx = this.ctx;
      if (!ctx) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.15);

      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.15);

      // Add a tiny metallic sound
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(3000, ctx.currentTime);
      osc2.frequency.exponentialRampToValueAtTime(1500, ctx.currentTime + 0.08);

      gain2.gain.setValueAtTime(0.08, ctx.currentTime);
      gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);

      osc2.connect(gain2);
      gain2.connect(ctx.destination);

      osc2.start();
      osc2.stop(ctx.currentTime + 0.08);
    } catch (e) {
      console.warn(e);
    }
  }

  // Wrap rustle sound
  public playWrap() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      const ctx = this.ctx;
      if (!ctx) return;

      const noise = ctx.createBufferSource();
      noise.buffer = this.createNoiseBuffer();

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 600;

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.12, ctx.currentTime + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      noise.start();
      noise.stop(ctx.currentTime + 0.2);
    } catch (e) {
      console.warn(e);
    }
  }

  // Classic cash register bell / coin sound
  public playCoin() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      const ctx = this.ctx;
      if (!ctx) return;

      const now = ctx.currentTime;
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      const gain2 = ctx.createGain();

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(987.77, now); // B5
      osc1.frequency.setValueAtTime(1318.51, now + 0.08); // E6

      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(1174.66, now); // D6
      osc2.frequency.setValueAtTime(1567.98, now + 0.08); // G6

      gain1.gain.setValueAtTime(0.12, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

      gain2.gain.setValueAtTime(0.10, now);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

      osc1.connect(gain1);
      gain1.connect(ctx.destination);

      osc2.connect(gain2);
      gain2.connect(ctx.destination);

      osc1.start();
      osc2.start();

      osc1.stop(now + 0.5);
      osc2.stop(now + 0.5);
    } catch (e) {
      console.warn(e);
    }
  }

  // Chime for happy served customer
  public playHappyChime() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      const ctx = this.ctx;
      if (!ctx) return;

      const now = ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      notes.forEach((freq, index) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + index * 0.06);

        gain.gain.setValueAtTime(0.08, now + index * 0.06);
        gain.gain.exponentialRampToValueAtTime(0.001, now + index * 0.06 + 0.3);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + index * 0.06);
        osc.stop(now + index * 0.06 + 0.35);
      });
    } catch (e) {
      console.warn(e);
    }
  }

  // Sad buzzer for burnt or angry customer
  public playSadBuzz() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      const ctx = this.ctx;
      if (!ctx) return;

      const now = ctx.currentTime;
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sawtooth';
      osc2.type = 'triangle';

      osc1.frequency.setValueAtTime(120, now);
      osc1.frequency.linearRampToValueAtTime(90, now + 0.35);

      osc2.frequency.setValueAtTime(122, now);
      osc2.frequency.linearRampToValueAtTime(92, now + 0.35);

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(400, now);

      osc1.connect(filter);
      osc2.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc1.start();
      osc2.start();
      osc1.stop(now + 0.4);
      osc2.stop(now + 0.4);
    } catch (e) {
      console.warn(e);
    }
  }

  // Bell sound for customer entry
  public playDoorBell() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      const ctx = this.ctx;
      if (!ctx) return;

      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(1500, now);
      osc.frequency.exponentialRampToValueAtTime(1100, now + 0.2);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(now + 0.5);
    } catch (e) {
      console.warn(e);
    }
  }

  // ==========================================
  // PROCEDURAL AMBIENT BACKGROUND MUSIC
  // ==========================================

  public startAmbientMusic() {
    this.initCtx();
    const ctx = this.ctx;
    if (!ctx) return;

    if (this.isAmbientOn) return;
    this.isAmbientOn = true;

    try {
      // Create master ambient volume control (soft & cozy)
      this.ambientGain = ctx.createGain();
      this.ambientGain.gain.setValueAtTime(this.isMuted ? 0 : 0.045, ctx.currentTime);
      this.ambientGain.connect(ctx.destination);

      // Create a lush delay/echo node for lofi atmosphere
      this.ambientDelay = ctx.createDelay(1.0);
      this.ambientDelay.delayTime.setValueAtTime(0.42, ctx.currentTime); // 420ms delay

      this.ambientFeedback = ctx.createGain();
      this.ambientFeedback.gain.setValueAtTime(0.42, ctx.currentTime); // 42% feedback

      // Feedback loop routing
      this.ambientDelay.connect(this.ambientFeedback);
      this.ambientFeedback.connect(this.ambientDelay);

      // Connect delay output to master ambient gain
      this.ambientDelay.connect(this.ambientGain);

      this.ambientStep = 0;
      this.ambientInterval = setInterval(() => {
        this.playAmbientStep();
      }, 350); // 350ms per step sequence
    } catch (e) {
      console.warn('Ambient music failed to start', e);
    }
  }

  public stopAmbientMusic() {
    this.isAmbientOn = false;
    if (this.ambientInterval) {
      clearInterval(this.ambientInterval);
      this.ambientInterval = null;
    }
    if (this.ambientGain) {
      try {
        this.ambientGain.disconnect();
      } catch (e) {}
      this.ambientGain = null;
    }
    this.ambientDelay = null;
    this.ambientFeedback = null;
  }

  public isAmbientPlaying(): boolean {
    return this.isAmbientOn;
  }

  private playAmbientStep() {
    if (this.isMuted || !this.isAmbientOn) return;
    const ctx = this.ctx;
    if (!ctx) return;

    if (ctx.state === 'suspended') {
      ctx.resume();
      return;
    }

    const step = this.ambientStep;
    this.ambientStep = (this.ambientStep + 1) % 16;

    // Maqam Hijaz Scale in D (Aesthetic Middle Eastern Lofi tones)
    // D4 (293.66), Eb4 (311.13), F#4 (369.99), G4 (392.00), A4 (440.00), Bb4 (466.16), C5 (523.25), D5 (587.33), Eb5 (622.25), F#5 (739.99)
    const scale = [293.66, 311.13, 369.99, 392.00, 440.00, 466.16, 523.25, 587.33, 622.25, 739.99];

    // 1. Play warm lofi pad chords on step 0 and step 8
    if (step === 0) {
      // D minor/Hijaz root pad: D3 (146.83), A3 (220.00), F#4 (369.99)
      this.playSynthPad([146.83, 220.00, 369.99], 3.8, 0.035);
    } else if (step === 8) {
      // G minor shift: G3 (196.00), Bb3 (233.08), G4 (392.00)
      this.playSynthPad([196.00, 233.08, 392.00], 3.8, 0.035);
    }

    // 2. Play subtle rhythmic darbuka lofi hits
    if (step === 0 || step === 4 || step === 8 || step === 12) {
      this.playLofiDrum(true); // Low "Dum"
    } else if (step === 2 || step === 6 || step === 10 || step === 14) {
      this.playLofiDrum(false); // High crisp "Tak"
    }

    // 3. Play elegant walk of Hijaz notes (Oud/Qanun pluck simulation)
    const melodyPattern = [
      true,  false, true,  false,
      true,  true,  false, true,
      false, true,  true,  false,
      true,  false, true,  true
    ];

    if (melodyPattern[step] && Math.random() < 0.60) {
      let noteIndex = 0;
      if (step < 4) {
        // Lower motif
        noteIndex = Math.floor(Math.random() * 4);
      } else if (step < 8) {
        // Mid-climb
        noteIndex = 2 + Math.floor(Math.random() * 5);
      } else if (step < 12) {
        // Majestic peak
        noteIndex = 4 + Math.floor(Math.random() * 6);
      } else {
        // Resolve downward
        noteIndex = Math.floor(Math.random() * 3);
      }

      const freq = scale[Math.min(scale.length - 1, noteIndex)];
      this.playLofiPluck(freq);
    }
  }

  private playSynthPad(frequencies: number[], duration: number, vol: number) {
    const ctx = this.ctx;
    if (!ctx || !this.ambientGain) return;

    try {
      const padGain = ctx.createGain();
      padGain.gain.setValueAtTime(0, ctx.currentTime);
      padGain.gain.linearRampToValueAtTime(vol, ctx.currentTime + 1.5); // Warm, ultra-slow attack
      padGain.gain.setValueAtTime(vol, ctx.currentTime + duration - 1.5);
      padGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(380, ctx.currentTime); // Warm filter to cut sizzles

      frequencies.forEach((f) => {
        const osc = ctx.createOscillator();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(f, ctx.currentTime);

        // subtle detuning for vintage chorus analog charm
        osc.detune.setValueAtTime(Math.random() * 12 - 6, ctx.currentTime);

        osc.connect(filter);
        osc.start();
        osc.stop(ctx.currentTime + duration);
      });

      filter.connect(padGain);
      padGain.connect(this.ambientGain);
    } catch (e) {}
  }

  private playLofiDrum(isDum: boolean) {
    const ctx = this.ctx;
    if (!ctx || !this.ambientGain) return;

    try {
      const now = ctx.currentTime;
      if (isDum) {
        // Low cozy kick "Dum"
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(100, now);
        osc.frequency.exponentialRampToValueAtTime(45, now + 0.15);

        gain.gain.setValueAtTime(0.04, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

        osc.connect(gain);
        gain.connect(this.ambientGain);

        osc.start();
        osc.stop(now + 0.16);
      } else {
        // High crisp stick "Tak"
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(580, now);
        osc.frequency.exponentialRampToValueAtTime(150, now + 0.06);

        gain.gain.setValueAtTime(0.015, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

        osc.connect(gain);
        gain.connect(this.ambientGain);

        osc.start();
        osc.stop(now + 0.07);

        // Add ultra soft high-passed noise rustle
        const noiseSource = ctx.createBufferSource();
        noiseSource.buffer = this.createNoiseBuffer();

        const filter = ctx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.value = 5000;

        const noiseGain = ctx.createGain();
        noiseGain.gain.setValueAtTime(0.008, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

        noiseSource.connect(filter);
        filter.connect(noiseGain);
        noiseGain.connect(this.ambientGain);

        noiseSource.start();
        noiseSource.stop(now + 0.06);
      }
    } catch (e) {}
  }

  private playLofiPluck(freq: number) {
    const ctx = this.ctx;
    if (!ctx || !this.ambientGain || !this.ambientDelay) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const subOsc = ctx.createOscillator();
      const pluckGain = ctx.createGain();

      osc.type = 'sine'; // Pure pluck
      osc.frequency.setValueAtTime(freq, now);

      subOsc.type = 'triangle'; // Middle Eastern string/oud buzz
      subOsc.frequency.setValueAtTime(freq, now);
      subOsc.detune.setValueAtTime(6, now); // Sweet pitch thickness

      pluckGain.gain.setValueAtTime(0, now);
      pluckGain.gain.linearRampToValueAtTime(0.03, now + 0.008); // Sharp string pluck attack
      pluckGain.gain.exponentialRampToValueAtTime(0.001, now + 0.4); // Natural string decay

      // Simple lowpass to make plucks softer
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1600, now);

      osc.connect(filter);
      subOsc.connect(filter);
      filter.connect(pluckGain);

      // 1. Send to master ambient out (Dry)
      pluckGain.connect(this.ambientGain);

      // 2. Send to feedback delay line (Wet) for cosmic echo tail
      pluckGain.connect(this.ambientDelay);

      osc.start();
      subOsc.start();

      osc.stop(now + 0.45);
      subOsc.stop(now + 0.45);
    } catch (e) {}
  }
}

export const sfx = new AudioSynthesizer();
