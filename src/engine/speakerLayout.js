/**
 * Spatiomorphology - Speaker Layout & Panning Simulation Engine
 * Models Stereo, Quadraphonic, and Octophonic layouts.
 * Computes energy-preserving panning gains and dB meters modulated by Focus and Center.
 */

export const SPEAKER_CONFIGS = {
  stereo: {
    id: 'stereo',
    name: 'Stereo (2.0)',
    channels: 2,
    speakers: [
      { id: 'L', label: 'Left (L)', x: -0.8, y: 0.8, angle: 135 },
      { id: 'R', label: 'Right (R)', x: 0.8, y: 0.8, angle: 45 }
    ]
  },
  quad: {
    id: 'quad',
    name: 'Quadraphonic (4.0)',
    channels: 4,
    speakers: [
      { id: 'FL', label: 'Front Left (FL)', x: -0.75, y: 0.75, angle: 135 },
      { id: 'FR', label: 'Front Right (FR)', x: 0.75, y: 0.75, angle: 45 },
      { id: 'RL', label: 'Rear Left (RL)', x: -0.75, y: -0.75, angle: 225 },
      { id: 'RR', label: 'Rear Right (RR)', x: 0.75, y: -0.75, angle: 315 }
    ]
  },
  octophonic: {
    id: 'octophonic',
    name: 'Octophonic Ring (8.0)',
    channels: 8,
    speakers: [
      { id: '1', label: 'Ch 1 (Front)', x: 0.0, y: 0.9, angle: 90 },
      { id: '2', label: 'Ch 2 (FR)', x: 0.64, y: 0.64, angle: 45 },
      { id: '3', label: 'Ch 3 (Right)', x: 0.9, y: 0.0, angle: 0 },
      { id: '4', label: 'Ch 4 (RR)', x: 0.64, y: -0.64, angle: 315 },
      { id: '5', label: 'Ch 5 (Rear)', x: 0.0, y: -0.9, angle: 270 },
      { id: '6', label: 'Ch 6 (RL)', x: -0.64, y: -0.64, angle: 225 },
      { id: '7', label: 'Ch 7 (Left)', x: -0.9, y: 0.0, angle: 180 },
      { id: '8', label: 'Ch 8 (FL)', x: -0.64, y: 0.64, angle: 135 }
    ]
  }
};

export class SpeakerSimulationEngine {
  constructor(initialLayout = 'quad') {
    this.currentLayoutId = initialLayout;
    this.layout = SPEAKER_CONFIGS[initialLayout] || SPEAKER_CONFIGS.quad;
  }

  setLayout(layoutId) {
    if (SPEAKER_CONFIGS[layoutId]) {
      this.currentLayoutId = layoutId;
      this.layout = SPEAKER_CONFIGS[layoutId];
    }
  }

  getLayout() {
    return this.layout;
  }

  /**
   * Calculate gains for all speakers based on sound coordinate (x, y), Focus, and Center.
   * Focus: 0 (completely diffuse/ambient) to 100 (razor pinpoint localization)
   * Center: 0 (hollow center) to 100 (full center presence)
   */
  calculateGains(soundX, soundY, focusPercent = 100, centerPercent = 50) {
    const speakers = this.layout.speakers;
    const numSpk = speakers.length;

    // Focus controls spatial exponent: Focus 0 -> p = 0.5; Focus 100 -> p = 5.0
    const focusNorm = Math.max(0, Math.min(100, focusPercent)) / 100.0;
    const powerExp = 0.5 + Math.pow(focusNorm, 2) * 4.5;
    const diffuseFloor = (1.0 - focusNorm) * 0.4;

    // Center distance
    const distFromCenter = Math.sqrt(soundX * soundX + soundY * soundY);
    const centerNorm = Math.max(0, Math.min(100, centerPercent)) / 100.0;

    const rawWeights = [];
    let sumSquares = 0;

    for (let i = 0; i < numSpk; i++) {
      const spk = speakers[i];
      const dx = soundX - spk.x;
      const dy = soundY - spk.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Distance-based proximity weight
      let weight = 1.0 / Math.pow(dist + 0.18, powerExp);

      // Blend diffuse floor
      weight = (1.0 - diffuseFloor) * weight + diffuseFloor;

      // Center modulation adjustment when near origin
      if (distFromCenter < 0.3) {
        const centerFactor = (1.0 - distFromCenter / 0.3);
        weight *= (0.5 + 0.5 * centerNorm * centerFactor);
      }

      rawWeights.push(weight);
      sumSquares += weight * weight;
    }

    // Energy normalization (sum of squares = 1.0 for constant acoustic power)
    const normFactor = sumSquares > 0.00001 ? Math.sqrt(sumSquares) : 1.0;

    return speakers.map((spk, idx) => {
      const gain = rawWeights[idx] / normFactor;
      // Convert to dB (-60 dB noise floor to 0 dB max)
      const clampedGain = Math.max(0.001, gain);
      const db = 20 * Math.log10(clampedGain);
      return {
        id: spk.id,
        label: spk.label,
        x: spk.x,
        y: spk.y,
        angle: spk.angle,
        gain: gain,
        db: Math.max(-60, db)
      };
    });
  }
}
