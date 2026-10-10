/**
 * Luxury Audio Engine for "Heaven" Perfume Intro
 * Procedurally generates realistic aerosol spray, crystal chimes, and ambient luxury soundscape
 * Uses Web Audio API without needing external audio file dependencies.
 */

class LuxuryAudioEngine {
  constructor() {
    this.ctx = null;
    this.isMuted = false;
    this.ambientGain = null;
    this.ambientOscillators = [];
    this.initialized = false;
  }

  init() {
    if (this.initialized) return;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioContext();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.7, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
      this.initialized = true;
    } catch (e) {
      console.warn('Web Audio not supported or blocked:', e);
    }
  }

  resume() {
    if (!this.ctx) this.init();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(this.isMuted ? 0 : 0.7, this.ctx.currentTime, 0.05);
    }
    return this.isMuted;
  }

  /**
   * Authentic aerosol perfume mist spray sound
   * Combines filtered white noise with an exponential pressure envelope and air rush
   */
  playSpraySound() {
    if (!this.ctx || this.isMuted) return;
    this.resume();

    const t = this.ctx.currentTime;
    const duration = 1.3;

    // 1. White Noise Buffer for Fine Mist Aerosol
    const bufferSize = this.ctx.sampleRate * duration;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;

    // Highpass Filter (sheen of fine mist)
    const highpass = this.ctx.createBiquadFilter();
    highpass.type = 'highpass';
    highpass.frequency.setValueAtTime(3200, t);
    highpass.frequency.exponentialRampToValueAtTime(4500, t + 0.3);

    // Bandpass Filter (resonance of nozzle chamber)
    const bandpass = this.ctx.createBiquadFilter();
    bandpass.type = 'bandpass';
    bandpass.frequency.setValueAtTime(4800, t);
    bandpass.Q.setValueAtTime(1.8, t);

    // Amplitude Envelope (burst, steady spray, gentle release)
    const sprayGain = this.ctx.createGain();
    sprayGain.gain.setValueAtTime(0.0001, t);
    sprayGain.gain.exponentialRampToValueAtTime(0.55, t + 0.06); // Fast attack
    sprayGain.gain.setValueAtTime(0.5, t + 0.3); // Sustain
    sprayGain.gain.exponentialRampToValueAtTime(0.001, t + duration); // Smooth decay

    // Panner (Spatialized from right nozzle towards center)
    const panner = this.ctx.createStereoPanner ? this.ctx.createStereoPanner() : null;
    if (panner) {
      panner.pan.setValueAtTime(0.4, t);
      panner.pan.linearRampToValueAtTime(-0.1, t + 0.8);
      whiteNoise.connect(highpass);
      highpass.connect(bandpass);
      bandpass.connect(sprayGain);
      sprayGain.connect(panner);
      panner.connect(this.masterGain);
    } else {
      whiteNoise.connect(highpass);
      highpass.connect(bandpass);
      bandpass.connect(sprayGain);
      sprayGain.connect(this.masterGain);
    }

    whiteNoise.start(t);
    whiteNoise.stop(t + duration);

    // 2. Tactile Click of the Atomizer Pump
    const clickOsc = this.ctx.createOscillator();
    const clickGain = this.ctx.createGain();
    clickOsc.type = 'sine';
    clickOsc.frequency.setValueAtTime(120, t);
    clickOsc.frequency.exponentialRampToValueAtTime(40, t + 0.04);

    clickGain.gain.setValueAtTime(0.3, t);
    clickGain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);

    clickOsc.connect(clickGain);
    clickGain.connect(this.masterGain);
    clickOsc.start(t);
    clickOsc.stop(t + 0.06);

    // 3. Shimmering Crystal Overtones
    this.playCrystalShimmer(t + 0.2, 0.9);
  }

  /**
   * Crystal shimmer sound effect
   */
  playCrystalShimmer(startTime, duration = 1.0) {
    if (!this.ctx || this.isMuted) return;
    const freqs = [1046.5, 1318.5, 1567.98, 2093.0]; // C6, E6, G6, C7 major chord

    freqs.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime + idx * 0.08);

      gain.gain.setValueAtTime(0.0001, startTime + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.08 / (idx + 1), startTime + idx * 0.08 + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + idx * 0.08 + duration);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(startTime + idx * 0.08);
      osc.stop(startTime + idx * 0.08 + duration);
    });
  }

  /**
   * Sound played when droplets assemble into the golden "Heaven" logo
   */
  playLogoAssemblyChime() {
    if (!this.ctx || this.isMuted) return;
    this.resume();

    const t = this.ctx.currentTime;
    // Ascending ethereal celestial pentatonic notes
    const melody = [523.25, 659.25, 783.99, 987.77, 1046.5, 1318.51]; // C5, E5, G5, B5, C6, E6

    melody.forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(3000, t);

      osc.type = i % 2 === 0 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(freq, t + i * 0.15);

      const noteStart = t + i * 0.15;
      gain.gain.setValueAtTime(0.0001, noteStart);
      gain.gain.exponentialRampToValueAtTime(0.12, noteStart + 0.08);
      gain.gain.exponentialRampToValueAtTime(0.0001, noteStart + 1.8);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);

      osc.start(noteStart);
      osc.stop(noteStart + 2.0);
    });
  }

  /**
   * Deep metallic golden shimmer sound when logo solidifies
   */
  playGoldenShimmer() {
    if (!this.ctx || this.isMuted) return;
    this.resume();

    const t = this.ctx.currentTime;
    const baseFreq = 261.63; // C4

    [1, 2, 3, 4, 6].forEach((harmonic, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(baseFreq * harmonic, t);
      // Subtle pitch bend upwards
      osc.frequency.exponentialRampToValueAtTime(baseFreq * harmonic * 1.015, t + 1.5);

      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(0.1 / (idx + 1), t + 0.2);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 2.5);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(t);
      osc.stop(t + 2.6);
    });
  }

  /**
   * Continuous subtle luxury ambient harmonic drone
   */
  startAmbientDrone() {
    if (!this.ctx || this.ambientGain) return;
    this.resume();

    const t = this.ctx.currentTime;
    this.ambientGain = this.ctx.createGain();
    this.ambientGain.gain.setValueAtTime(0.001, t);
    this.ambientGain.gain.exponentialRampToValueAtTime(0.05, t + 2.0);
    this.ambientGain.connect(this.masterGain);

    const rootFreqs = [130.81, 196.00, 329.63]; // C3, G3, E4 warm triad
    rootFreqs.forEach((freq) => {
      const osc = this.ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);

      // Lowpass for warmth
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(450, t);

      osc.connect(filter);
      filter.connect(this.ambientGain);
      osc.start(t);
      this.ambientOscillators.push(osc);
    });
  }

  stopAmbientDrone() {
    if (this.ambientGain && this.ctx) {
      this.ambientGain.gain.setTargetAtTime(0.0001, this.ctx.currentTime, 0.8);
      setTimeout(() => {
        this.ambientOscillators.forEach((osc) => {
          try { osc.stop(); } catch(e) {}
        });
        this.ambientOscillators = [];
        this.ambientGain = null;
      }, 1000);
    }
  }
}

window.luxuryAudio = new LuxuryAudioEngine();
