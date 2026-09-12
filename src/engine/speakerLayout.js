/**
 * Spatiomorph - Speaker Arrangement & Panning Simulation Engine
 * Directly models Ableton Live's Surround Panner configurations:
 * 2-CH, 4-CH (Room, Circle, Center), 6-CH (Room, Circle, Center), 8-CH (Room, Circle, Center).
 * Computes constant-power energy preserving gains (sum g_i^2 = 1.0).
 */

const DEG2RAD = Math.PI / 180;

export const SPEAKER_CONFIGS = {
  '2ch': {
    id: '2ch',
    name: '2-CH (Stereo Centered)',
    channels: 2,
    speakers: [
      { id: '1', label: '1 (Left)', x: -1.0, y: 0.0, angle: 180 },
      { id: '2', label: '2 (Right)', x: 1.0, y: 0.0, angle: 0 }
    ]
  },
  '4ch_room': {
    id: '4ch_room',
    name: '4-CH Room',
    channels: 4,
    speakers: [
      { id: '1', label: '1 (FL)', x: -0.75, y: 0.75, angle: 135 },
      { id: '2', label: '2 (FR)', x: 0.75, y: 0.75, angle: 45 },
      { id: '3', label: '3 (RL)', x: -0.75, y: -0.75, angle: 225 },
      { id: '4', label: '4 (RR)', x: 0.75, y: -0.75, angle: 315 }
    ]
  },
  '4ch_circle': {
    id: '4ch_circle',
    name: '4-CH Circle',
    channels: 4,
    speakers: [
      { id: '1', label: '1 (FL)', x: -0.75, y: 0.75, angle: 135 },
      { id: '2', label: '2 (FR)', x: 0.75, y: 0.75, angle: 45 },
      { id: '3', label: '3 (RR)', x: 0.75, y: -0.75, angle: 315 },
      { id: '4', label: '4 (RL)', x: -0.75, y: -0.75, angle: 225 }
    ]
  },
  '4ch_center': {
    id: '4ch_center',
    name: '4-CH Center',
    channels: 4,
    speakers: [
      { id: '1', label: '1 (Front)', x: 0.0, y: 1.0, angle: 90 },
      { id: '2', label: '2 (Right)', x: 1.0, y: 0.0, angle: 0 },
      { id: '3', label: '3 (Back)', x: 0.0, y: -1.0, angle: 270 },
      { id: '4', label: '4 (Left)', x: -1.0, y: 0.0, angle: 180 }
    ]
  },
  '6ch_room': {
    id: '6ch_room',
    name: '6-CH Room',
    channels: 6,
    speakers: [
      { id: '1', label: '1 (FL)', x: -0.75, y: 0.82, angle: 135 },
      { id: '2', label: '2 (FR)', x: 0.75, y: 0.82, angle: 45 },
      { id: '3', label: '3 (SL)', x: -0.88, y: 0.0, angle: 180 },
      { id: '4', label: '4 (SR)', x: 0.88, y: 0.0, angle: 0 },
      { id: '5', label: '5 (RL)', x: -0.75, y: -0.82, angle: 225 },
      { id: '6', label: '6 (RR)', x: 0.75, y: -0.82, angle: 315 }
    ]
  },
  '6ch_circle': {
    id: '6ch_circle',
    name: '6-CH Circle',
    channels: 6,
    speakers: [
      { id: '1', label: '1 (FL)', x: -0.75, y: 0.82, angle: 135 },
      { id: '2', label: '2 (FR)', x: 0.75, y: 0.82, angle: 45 },
      { id: '3', label: '3 (SR)', x: 0.88, y: 0.0, angle: 0 },
      { id: '4', label: '4 (RR)', x: 0.75, y: -0.82, angle: 315 },
      { id: '5', label: '5 (RL)', x: -0.75, y: -0.82, angle: 225 },
      { id: '6', label: '6 (SL)', x: -0.88, y: 0.0, angle: 180 }
    ]
  },
  '6ch_center': {
    id: '6ch_center',
    name: '6-CH Center',
    channels: 6,
    speakers: [
      { id: '1', label: '1 (Front)', x: 0.0, y: 1.0, angle: 90 },
      { id: '2', label: '2 (FR)', x: Math.cos(30 * DEG2RAD), y: Math.sin(30 * DEG2RAD), angle: 30 },
      { id: '3', label: '3 (RR)', x: Math.cos(30 * DEG2RAD), y: -Math.sin(30 * DEG2RAD), angle: 330 },
      { id: '4', label: '4 (Back)', x: 0.0, y: -1.0, angle: 270 },
      { id: '5', label: '5 (RL)', x: -Math.cos(30 * DEG2RAD), y: -Math.sin(30 * DEG2RAD), angle: 210 },
      { id: '6', label: '6 (FL)', x: -Math.cos(30 * DEG2RAD), y: Math.sin(30 * DEG2RAD), angle: 150 }
    ]
  },
  '8ch_room': {
    id: '8ch_room',
    name: '8-CH Room',
    channels: 8,
    speakers: [
      { id: '1', label: '1 (FL)', x: -0.45, y: 0.88, angle: 115 },
      { id: '2', label: '2 (FR)', x: 0.45, y: 0.88, angle: 65 },
      { id: '3', label: '3 (Side-UL)', x: -0.88, y: 0.38, angle: 160 },
      { id: '4', label: '4 (Side-UR)', x: 0.88, y: 0.38, angle: 20 },
      { id: '5', label: '5 (Side-DL)', x: -0.88, y: -0.38, angle: 200 },
      { id: '6', label: '6 (Side-DR)', x: 0.88, y: -0.38, angle: 340 },
      { id: '7', label: '7 (RL)', x: -0.45, y: -0.88, angle: 245 },
      { id: '8', label: '8 (RR)', x: 0.45, y: -0.88, angle: 295 }
    ]
  },
  '8ch_circle': {
    id: '8ch_circle',
    name: '8-CH Circle',
    channels: 8,
    speakers: [
      { id: '1', label: '1 (FL)', x: -0.45, y: 0.88, angle: 115 },
      { id: '2', label: '2 (FR)', x: 0.45, y: 0.88, angle: 65 },
      { id: '3', label: '3 (Side-UR)', x: 0.88, y: 0.38, angle: 20 },
      { id: '4', label: '4 (Side-DR)', x: 0.88, y: -0.38, angle: 340 },
      { id: '5', label: '5 (RR)', x: 0.45, y: -0.88, angle: 295 },
      { id: '6', label: '6 (RL)', x: -0.45, y: -0.88, angle: 245 },
      { id: '7', label: '7 (Side-DL)', x: -0.88, y: -0.38, angle: 200 },
      { id: '8', label: '8 (Side-UL)', x: -0.88, y: 0.38, angle: 160 }
    ]
  },
  '8ch_center': {
    id: '8ch_center',
    name: '8-CH Center',
    channels: 8,
    speakers: [
      { id: '1', label: '1 (Front)', x: 0.0, y: 1.0, angle: 90 },
      { id: '2', label: '2 (FR)', x: Math.cos(45 * DEG2RAD), y: Math.sin(45 * DEG2RAD), angle: 45 },
      { id: '3', label: '3 (Right)', x: 1.0, y: 0.0, angle: 0 },
      { id: '4', label: '4 (RR)', x: Math.cos(45 * DEG2RAD), y: -Math.sin(45 * DEG2RAD), angle: 315 },
      { id: '5', label: '5 (Back)', x: 0.0, y: -1.0, angle: 270 },
      { id: '6', label: '6 (RL)', x: -Math.cos(45 * DEG2RAD), y: -Math.sin(45 * DEG2RAD), angle: 225 },
      { id: '7', label: '7 (Left)', x: -1.0, y: 0.0, angle: 180 },
      { id: '8', label: '8 (FL)', x: -Math.cos(45 * DEG2RAD), y: Math.sin(45 * DEG2RAD), angle: 135 }
    ]
  }
};

export class SpeakerSimulationEngine {
  constructor(initialLayout = '4ch_room') {
    this.currentLayoutId = initialLayout;
    this.layout = SPEAKER_CONFIGS[initialLayout] || SPEAKER_CONFIGS['4ch_room'];
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
  calculateGains(soundX, soundY, focusPercent = 50, centerPercent = 50) {
    const speakers = this.layout.speakers;
    const numSpk = speakers.length;

    // Focus controls spatial exponent: Focus 0 -> p = 0.5; Focus 100 -> p = 5.0
    const focusNorm = Math.max(0, Math.min(100, focusPercent)) / 100.0;
    const powerExp = 0.6 + Math.pow(focusNorm, 2) * 4.4;
    const diffuseFloor = (1.0 - focusNorm) * 0.35;

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
      if (distFromCenter < 0.35) {
        const centerFactor = (1.0 - distFromCenter / 0.35);
        weight *= (0.5 + 0.5 * centerNorm * centerFactor);
      }

      rawWeights.push(weight);
      sumSquares += weight * weight;
    }

    // Energy normalization (sum of squares = 1.0 for constant acoustic power)
    const normFactor = sumSquares > 0.00001 ? Math.sqrt(sumSquares) : 1.0;

    return speakers.map((spk, idx) => {
      const gain = rawWeights[idx] / normFactor;
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
