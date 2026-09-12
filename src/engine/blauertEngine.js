/**
 * Spatiomorph - Kornblume Engine: Spatial Hearing (Jens Blauert)
 * Implements Interaural Coherence (k vs 1-k), Blauert Directional Bands
 * (1 kHz Rear, 4 kHz Front, 8 kHz Overhead), Precedence Effect (Haas Ghosting),
 * and Franssen Transient Decoupling.
 */

export const BLAUERT_BANDS = [
  { id: 'neutral', name: 'Neutral / Transparent', desc: 'Flat spectral distribution across median plane.' },
  { id: 'rear_1k', name: '1 kHz Band (Rear Pull)', desc: '1 kHz directional band pulls auditory event to the rear hemisphere.' },
  { id: 'front_4k', name: '4 kHz Band (Front Presence)', desc: '4 kHz directional band focuses auditory event in the frontal plane.' },
  { id: 'overhead_8k', name: '8 kHz Band (Overhead / Elevation)', desc: '8 kHz directional band elevates auditory event into the vertical/overhead axis.' },
  { id: 'multiband', name: 'Tri-Band Spectral Split (T1..T6)', desc: 'Divides T1-T2 to Front (4k), T3-T4 to Rear (1k), T5-T6 to Overhead (8k).' }
];

export class BlauertEngine {
  constructor() {
    this.coherence = 0.85; // k: 0.0 (fully diffuse / 1-k envelope) to 1.0 (compact point)
    this.activeBand = 'front_4k';
    this.precedenceEnabled = true;
    this.haasDelayMs = 15; // 1ms to 40ms Haas precedence window
    this.franssenEnabled = false;

    this.transientState = 0.0;
    this.lastFranssenAnchor = { x: -0.7, y: 0.0 };
  }

  setCoherence(val) {
    this.coherence = Math.max(0.0, Math.min(1.0, val));
  }

  setBand(bandId) {
    if (BLAUERT_BANDS.some(b => b.id === bandId)) {
      this.activeBand = bandId;
    }
  }

  setPrecedence(enabled) {
    this.precedenceEnabled = !!enabled;
  }

  setHaasDelay(ms) {
    this.haasDelayMs = Math.max(1, Math.min(40, ms));
  }

  setFranssen(enabled) {
    this.franssenEnabled = !!enabled;
  }

  /**
   * Applies Blauert directional bands and coherence to trajectory coordinates.
   * @param {number} x - Normalized X [-1, 1]
   * @param {number} y - Normalized Y [-1, 1]
   * @param {number} voiceIndex - Voice index 0..5
   * @returns {{x: number, y: number, ghost: {x: number, y: number, alpha: number} | null}}
   */
  processCoordinate(x, y, voiceIndex = 0) {
    let outX = x;
    let outY = y;

    // Apply Blauert Directional Band bias
    let band = this.activeBand;
    if (band === 'multiband') {
      if (voiceIndex < 2) band = 'front_4k';
      else if (voiceIndex < 4) band = 'rear_1k';
      else band = 'overhead_8k';
    }

    switch (band) {
      case 'rear_1k':
        // Strong pull towards rear plane (Y < 0)
        outY = outY * 0.4 - 0.55;
        outX = outX * 0.8;
        break;
      case 'front_4k':
        // Strong pull towards front plane (Y > 0)
        outY = outY * 0.4 + 0.55;
        outX = outX * 0.85;
        break;
      case 'overhead_8k':
        // Elevation / centered focus
        outX = outX * 0.35;
        outY = outY * 0.35;
        break;
      case 'neutral':
      default:
        break;
    }

    // Franssen transient decoupling
    if (this.franssenEnabled) {
      // Steady-state anchor holds 75% weight; dynamic transients drift
      outX = this.lastFranssenAnchor.x * 0.75 + outX * 0.25;
      outY = this.lastFranssenAnchor.y * 0.75 + outY * 0.25;
    }

    // Precedence / Haas ghost image
    let ghost = null;
    if (this.precedenceEnabled) {
      // Haas ghost lags behind with delay proportional to haasDelayMs
      const haasRad = (this.haasDelayMs / 40.0) * 0.4;
      const angle = Math.atan2(outY, outX) - 0.45;
      ghost = {
        x: Math.max(-1, Math.min(1, outX + haasRad * Math.cos(angle))),
        y: Math.max(-1, Math.min(1, outY + haasRad * Math.sin(angle))),
        alpha: Math.max(0.1, (1.0 - this.coherence) * 0.7 + 0.2)
      };
    }

    return {
      x: Math.max(-1, Math.min(1, outX)),
      y: Math.max(-1, Math.min(1, outY)),
      coherence: this.coherence,
      ghost: ghost
    };
  }

  /**
   * Applies Interaural Coherence (k vs 1-k) to speaker gains.
   * As k drops (1-k rises), speaker gains decorrelate into diffuse acoustic envelopment.
   */
  applyToSpeakerGains(speakers) {
    const k = this.coherence;
    const diffuseRatio = 1.0 - k;
    if (diffuseRatio <= 0.01) return speakers;

    const n = speakers.length || 1;
    const uniformGain = 1.0 / Math.sqrt(n);

    return speakers.map((spk, i) => {
      // Decorrelation creates subtle phase/amplitude broadening across channels
      const decorrMod = 1.0 + diffuseRatio * 0.3 * Math.sin(i * 1.618);
      const blendedGain = spk.gain * k + uniformGain * diffuseRatio * decorrMod;
      return {
        ...spk,
        gain: Math.max(0, blendedGain)
      };
    });
  }
}
