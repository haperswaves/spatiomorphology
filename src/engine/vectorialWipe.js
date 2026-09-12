/**
 * Spatiomorph - Proximate Vectorial Wipe & Distal Interpolation Engine
 * Controls high-velocity proximate sweeps and distal aperture breaches.
 * Computes real-time Volume CC ducking per trajectory (starts at 127, lowers accordingly).
 */

export class VectorialWipeEngine {
  constructor() {
    // Wipe State
    this.wipeActive = false;
    this.wipeProgress = 0.0; // 0.0 to 1.0
    this.wipeDuration = 2.0; // seconds
    this.wipeMode = 'restoration'; // 'restoration' | 'shift' | 'prolongation'
    this.wipeX = -1.3;
    this.wipeY = -0.15;
    this.wipeOcclusion = 0.0; // 0.0 to 1.0

    // Distal Interpolation State
    this.breachActive = false;
    this.breachProgress = 0.0; // 0.0 to 1.0
    this.breachDuration = 1.0; // seconds
    this.distalAperture = 0.0; // 0.0 to 1.0

    // Callbacks
    this.onShiftCallback = null;
  }

  triggerWipe(mode = 'restoration', duration = 2.0) {
    this.wipeActive = true;
    this.wipeProgress = 0.0;
    this.wipeDuration = Math.max(0.5, duration);
    this.wipeMode = mode;
    this.wipeX = -1.3;
    this.wipeY = -0.15;
    this.wipeOcclusion = 0.0;
  }

  triggerDistalBreach(duration = 1.2) {
    this.breachActive = true;
    this.breachProgress = 0.0;
    this.breachDuration = Math.max(0.3, duration);
  }

  update(dt) {
    // 1. Process Vectorial Wipe
    if (this.wipeActive) {
      this.wipeProgress += dt / this.wipeDuration;

      if (this.wipeProgress <= 1.0) {
        const t = this.wipeProgress;
        this.wipeX = -1.3 + 2.6 * t;
        this.wipeY = -0.15 + 0.3 * Math.sin(Math.PI * t);

        const distToCenter = Math.hypot(this.wipeX, this.wipeY);
        if (distToCenter < 0.45) {
          this.wipeOcclusion = (1.0 - distToCenter / 0.45) * 0.9;
        } else {
          this.wipeOcclusion = 0.0;
        }
      } else {
        this.wipeActive = false;
        this.wipeOcclusion = 0.0;

        if (this.wipeMode === 'shift') {
          if (this.onShiftCallback) this.onShiftCallback();
        } else if (this.wipeMode === 'prolongation') {
          this.wipeX = 0.95;
          this.wipeY = 0.2;
        }
      }
    }

    // 2. Process Distal Interpolation Breach
    if (this.breachActive) {
      this.breachProgress += dt / this.breachDuration;
      if (this.breachProgress <= 1.0) {
        this.distalAperture = Math.sin(Math.PI * this.breachProgress);
      } else {
        this.breachActive = false;
        this.distalAperture = 0.0;
      }
    }

    return {
      wipeActive: this.wipeActive,
      wipeProgress: this.wipeProgress,
      wipeMode: this.wipeMode,
      wipeX: this.wipeX,
      wipeY: this.wipeY,
      wipeOcclusion: this.wipeOcclusion,
      breachActive: this.breachActive,
      distalAperture: this.distalAperture
    };
  }

  /**
   * Calculates volume (0..127) for a trajectory based on wipe occlusion and breach states.
   * Starts at 127 (unity volume) and ducks accordingly.
   */
  computeVoiceVolume(x, y) {
    let vol = 127;

    // During proximate wipe: duck background voices that are behind the wipe
    if (this.wipeActive && this.wipeOcclusion > 0) {
      const duckFactor = 1.0 - this.wipeOcclusion;
      vol = Math.round(vol * Math.max(0.05, duckFactor));
    }

    // During distal breach: duck proximate voices (r < 0.4) to expose distal horizon
    if (this.breachActive && this.distalAperture > 0) {
      const r = Math.hypot(x, y);
      if (r < 0.45) {
        const breachDuck = 1.0 - (1.0 - r / 0.45) * this.distalAperture * 0.9;
        vol = Math.round(vol * Math.max(0.1, breachDuck));
      }
    }

    return Math.max(0, Math.min(127, vol));
  }
}
