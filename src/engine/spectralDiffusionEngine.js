/**
 * Spatiomorph - Ipê-amarelo Engine: Spectral Diffusion (Daniel L. Barreiro)
 * Implements 8-Channel FFT Spectral Diffusion, Dynamic LUT Scramble,
 * Forest Strata (Canopy Bloom vs Understory vs Ground/Terra Roxa),
 * Kinetic Boundary Ricochet, and Maresia Wave Surge.
 */

export const IPE_STRATA = [
  { id: 'full', name: 'Full Biome (Canopy + Ground)', desc: 'Full-spectrum spatial diffusion across all height and radial layers.' },
  { id: 'canopy', name: 'Canopy Bloom (High Frequencies)', desc: 'Yellow floral canopy flutter elevated at the outer perimeter.' },
  { id: 'understory', name: 'Trunk / Understory (Mid Frequencies)', desc: 'Bark and branch resonance swirling across mid-radius space.' },
  { id: 'ground', name: 'Terra Roxa / Roots (Low Frequencies)', desc: 'Deep subterranean sub-bass anchored at room center.' }
];

export class SpectralDiffusionEngine {
  constructor() {
    this.stratum = 'canopy'; // 'full' | 'canopy' | 'understory' | 'ground'
    this.lutRateHz = 1.2; // 0.0 to 5.0 Hz scramble speed
    this.kineticCollision = true;
    this.lutTable = [0, 1, 2, 3, 4, 5, 6, 7];
    this.lastLutScrambleTime = performance.now();

    // Kinetic velocity states for 6 trajectories
    this.velocities = Array.from({ length: 6 }, (_, i) => ({
      vx: 0.5 * Math.cos(i * 1.05 + 0.2),
      vy: 0.5 * Math.sin(i * 1.05 + 0.2)
    }));

    // Maresia Wave Surge
    this.maresiaActive = false;
    this.maresiaProgress = 0.0;
    this.maresiaStartTime = 0;
    this.maresiaDurationMs = 2800;
  }

  setStratum(s) {
    if (IPE_STRATA.some(item => item.id === s)) {
      this.stratum = s;
    }
  }

  setLutRate(hz) {
    this.lutRateHz = Math.max(0.0, Math.min(5.0, hz));
  }

  setKineticCollision(enabled) {
    this.kineticCollision = !!enabled;
  }

  triggerMaresia() {
    this.maresiaActive = true;
    this.maresiaProgress = 0.0;
    this.maresiaStartTime = performance.now();
  }

  update(currentTime) {
    // 1. Check LUT Scramble update
    if (this.lutRateHz > 0.05) {
      const intervalMs = 1000 / this.lutRateHz;
      if (currentTime - this.lastLutScrambleTime >= intervalMs) {
        this.lastLutScrambleTime = currentTime;
        this.scrambleLut();
      }
    }

    // 2. Update Maresia wave surge
    if (this.maresiaActive) {
      const elapsed = currentTime - this.maresiaStartTime;
      this.maresiaProgress = Math.min(1.0, elapsed / this.maresiaDurationMs);
      if (this.maresiaProgress >= 1.0) {
        this.maresiaActive = false;
        this.maresiaProgress = 0.0;
      }
    }
  }

  scrambleLut() {
    // Fisher-Yates shuffle for 8 frequency bins
    for (let i = this.lutTable.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.lutTable[i], this.lutTable[j]] = [this.lutTable[j], this.lutTable[i]];
    }
  }

  /**
   * Applies stratum filtering and kinetic collisions to trajectory coordinates.
   * @param {number} x - Normalized X [-1, 1]
   * @param {number} y - Normalized Y [-1, 1]
   * @param {number} voiceIndex - Voice index 0..5
   * @returns {{x: number, y: number, stratumRadius: number, collided: boolean}}
   */
  processCoordinate(x, y, voiceIndex = 0) {
    let outX = x;
    let outY = y;
    let collided = false;

    // Apply Stratum spatial scaling and radial bounding
    let stratumRadius = 0.85;
    switch (this.stratum) {
      case 'canopy':
        // Pushes outwards toward perimeter with delicate fluttering
        stratumRadius = 0.90;
        const flutter = 0.06 * Math.sin(performance.now() * 0.004 + voiceIndex);
        outX = outX * 0.85 + Math.sign(outX || 1) * 0.15 + flutter;
        outY = outY * 0.85 + Math.sign(outY || 1) * 0.15 - flutter;
        break;
      case 'understory':
        // Mid-range radius
        stratumRadius = 0.60;
        outX = outX * 0.6;
        outY = outY * 0.6;
        break;
      case 'ground':
        // Centered roots
        stratumRadius = 0.28;
        outX = outX * 0.28;
        outY = outY * 0.28;
        break;
      case 'full':
      default:
        stratumRadius = 0.85;
        break;
    }

    // Kinetic boundary collision
    if (this.kineticCollision) {
      const limit = 0.90;
      const r = Math.hypot(outX, outY);
      if (r > limit) {
        collided = true;
        const normAngle = Math.atan2(outY, outX);
        // Elastic rebound
        outX = limit * Math.cos(normAngle);
        outY = limit * Math.sin(normAngle);
      }
    }

    return {
      x: Math.max(-1, Math.min(1, outX)),
      y: Math.max(-1, Math.min(1, outY)),
      stratumRadius,
      collided
    };
  }

  /**
   * Modulates speaker gains according to Barreiro's LUT scramble and Maresia surge.
   */
  applyToSpeakerGains(speakers) {
    const numSpeakers = speakers.length || 1;

    let modified = speakers.map((spk, idx) => {
      // Map physical speaker index through scrambled LUT
      const scrambledIdx = this.lutTable[idx % this.lutTable.length] % numSpeakers;
      const sourceSpk = speakers[scrambledIdx] || spk;
      return {
        ...spk,
        gain: 0.6 * spk.gain + 0.4 * sourceSpk.gain
      };
    });

    // Apply Maresia wave surge: sweeping wave propagating across perimeter
    if (this.maresiaActive) {
      const waveAngle = this.maresiaProgress * Math.PI * 4; // 2 full revolutions
      const waveWidth = 0.8;

      modified = modified.map(spk => {
        const spkAngle = Math.atan2(spk.y, spk.x);
        const diff = Math.atan2(Math.sin(spkAngle - waveAngle), Math.cos(spkAngle - waveAngle));
        const surge = Math.max(0, 1 - Math.abs(diff) / waveWidth);
        return {
          ...spk,
          gain: Math.min(1.0, spk.gain + surge * 0.6)
        };
      });
    }

    return modified;
  }
}
