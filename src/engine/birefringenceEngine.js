/**
 * Spatiomorph - Calcite Engine: Ambisonic Birefringence (Natasha Barrett)
 * Implements Optical Birefringence (Ordinary To vs Extraordinary Te ray splitting),
 * Optic Axis rotation, Rhombohedral Cleavage Symmetry, and 3D Higher-Order Ambisonic Tilt.
 */

export const CALCITE_CLEAVAGE_MODES = [
  { id: 'rhombohedral', name: 'Rhombohedral Cleavage (6 Facets)', desc: '101° and 78° crystal cleavage facets split sound into double refracted pairs.' },
  { id: 'trigonal', name: 'Trigonal Prism (3-Fold Symmetry)', desc: '3-fold rotational symmetry along the optical c-axis.' },
  { id: 'twin', name: 'Polysynthetic Twin Planes', desc: 'Mirrored acoustic reflection across internal crystal boundary lamellae.' }
];

export class BirefringenceEngine {
  constructor() {
    this.raySeparation = 0.35; // 0.0 to 1.0 (distance between To and Te rays)
    this.opticAxisDeg = 45; // 0° to 360° optic axis orientation
    this.cleavageMode = 'rhombohedral'; // 'rhombohedral' | 'trigonal' | 'twin'
    this.elevationDeg = 0; // -90° to +90° 3D HOA elevation
    this.spatialDecay = 2.5; // Cavernous / acoustic reverberation decay in seconds
  }

  setRaySeparation(val) {
    this.raySeparation = Math.max(0.0, Math.min(1.0, val));
  }

  setOpticAxis(deg) {
    this.opticAxisDeg = ((deg % 360) + 360) % 360;
  }

  setCleavageMode(mode) {
    if (CALCITE_CLEAVAGE_MODES.some(m => m.id === mode)) {
      this.cleavageMode = mode;
    }
  }

  setElevation(deg) {
    this.elevationDeg = Math.max(-90, Math.min(90, deg));
  }

  setSpatialDecay(sec) {
    this.spatialDecay = Math.max(0.1, Math.min(10.0, sec));
  }

  /**
   * Computes the Ordinary (To) and Extraordinary (Te) ray coordinates.
   * @param {number} x - Input normalized X [-1, 1]
   * @param {number} y - Input normalized Y [-1, 1]
   * @returns {{
   *   ordinary: {x: number, y: number},
   *   extraordinary: {x: number, y: number},
   *   hoaCoeffs: {w: number, x: number, y: number, z: number}
   * }}
   */
  processCoordinate(x, y) {
    // Ordinary Ray (To) follows unperturbed trajectory
    const ordinary = {
      x: Math.max(-1, Math.min(1, x)),
      y: Math.max(-1, Math.min(1, y))
    };

    // Extraordinary Ray (Te) departs along optic axis
    const opticRad = (this.opticAxisDeg * Math.PI) / 180;
    const splitDist = this.raySeparation * 0.55;

    let teX = x + splitDist * Math.cos(opticRad);
    let teY = y + splitDist * Math.sin(opticRad);

    if (this.cleavageMode === 'trigonal') {
      // 3-fold rotation shift
      const triRad = opticRad + (2 * Math.PI) / 3;
      teX = x + splitDist * Math.cos(triRad);
      teY = y + splitDist * Math.sin(triRad);
    } else if (this.cleavageMode === 'twin') {
      // Mirrored reflection across twin plane
      const normX = Math.cos(opticRad + Math.PI / 2);
      const normY = Math.sin(opticRad + Math.PI / 2);
      const dot = x * normX + y * normY;
      teX = x - 2 * dot * normX * this.raySeparation;
      teY = y - 2 * dot * normY * this.raySeparation;
    }

    const extraordinary = {
      x: Math.max(-1, Math.min(1, teX)),
      y: Math.max(-1, Math.min(1, teY))
    };

    // 3D Higher Order Ambisonics B-format representation
    const elevRad = (this.elevationDeg * Math.PI) / 180;
    const azimRad = Math.atan2(ordinary.y, ordinary.x);

    const hoaCoeffs = {
      w: 0.7071, // Omnidirectional monopole
      x: Math.cos(azimRad) * Math.cos(elevRad), // Front-back dipole
      y: Math.sin(azimRad) * Math.cos(elevRad), // Left-right dipole
      z: Math.sin(elevRad) // Elevation dipole
    };

    return {
      ordinary,
      extraordinary,
      hoaCoeffs
    };
  }

  /**
   * Distributes acoustic energy between Ordinary and Extraordinary rays across speakers.
   */
  applyToSpeakerGains(speakers, ordinary, extraordinary) {
    if (this.raySeparation <= 0.01) return speakers;

    return speakers.map(spk => {
      const dOrd = Math.hypot(spk.x - ordinary.x, spk.y - ordinary.y);
      const dExt = Math.hypot(spk.x - extraordinary.x, spk.y - extraordinary.y);

      // Distance attenuation for both rays
      const gOrd = Math.max(0, 1 - dOrd * 0.7);
      const gExt = Math.max(0, 1 - dExt * 0.7);

      // Blend 60% Ordinary (fundamental) + 40% Extraordinary (refracted)
      const combined = gOrd * 0.6 + gExt * 0.4 * this.raySeparation;
      return {
        ...spk,
        gain: Math.max(0, spk.gain * 0.5 + combined * 0.5)
      };
    });
  }
}
