/**
 * Spatiomorph - Biloba Engine: L'Espace du Son (Annette Vande Gorne)
 * Implements 16 Figures d'Espace, Caliber Width (Calibre),
 * Directivity (Projecteur vs Radiateur vs Bilobé Ginkgo), and Ginkgo Fan Geometry.
 */

export const FIGURES_D_ESPACE = [
  { id: 'fixe', name: "1. Point / Fixe", desc: "Stationary focal point with subtle micro-acousmatic breathing." },
  { id: 'translation', name: "2. Translation", desc: "Linear acoustic corridor crossing the spatial field." },
  { id: 'rotation', name: "3. Rotation", desc: "Revolving tournoiement around the central listening axis." },
  { id: 'elargissement', name: "4. Élargissement", desc: "Progressive broadening and narrowing of spatial caliber." },
  { id: 'contournement', name: "5. Contournement", desc: "Perimeter bounding hugging the outer speaker boundary." },
  { id: 'zigzag', name: "6. Zig-zag", desc: "Rapid angular zig-zag vector excursions across axes." },
  { id: 'echappement', name: "7. Échappement", desc: "Centrifugal acceleration and flight beyond room boundaries." },
  { id: 'balancement', name: "8. Balancement", desc: "Harmonic pendulum swinging between polar speaker axes." },
  { id: 'spirale', name: "9. Spirale", desc: "Centripetal or centrifugal logarithmic spiral winding." },
  { id: 'vague', name: "10. Vague / Ondulation", desc: "Sinusoidal acoustic wave propagating transversely." },
  { id: 'tressage', name: "11. Tressage", desc: "Dual braided intertwined ribbons in counterpoint." },
  { id: 'rebondissement', name: "12. Rebondissement", desc: "Elastic acoustic billiard rebounds off perimeter walls." },
  { id: 'dispersion', name: "13. Dispersion", desc: "Explosive centrifugal fragmentation outward into space." },
  { id: 'polyphonie', name: "14. Polyphonie Spatiale", desc: "Autonomous contrapuntal trajectories traversing field." },
  { id: 'combinee', name: "15. Trajectoire Combinée", desc: "Composite translation coupled with orbital tournoiement." },
  { id: 'enveloppement', name: "16. Enveloppement", desc: "Omnidirectional expansion filling all speakers equally." }
];

export class FiguresEngine {
  constructor() {
    this.activeFigure = 'rotation';
    this.caliber = 0.35; // 0.0 (pinpoint point) to 1.0 (enveloppant / broad field)
    this.directivity = 'bilobed'; // 'projector' | 'radiator' | 'bilobed'
    this.lobeAngleDeg = 70; // 15° to 180° for Bilobed Ginkgo fan
    this.ginkgoMorph = 0.5; // 0.0 (petiole stem) to 1.0 (broad double fan)

    this.reboundState = { x: 0.1, y: 0.1, vx: 0.8, vy: 0.6 };
    this.lastTime = performance.now();
  }

  setFigure(id) {
    if (FIGURES_D_ESPACE.some(f => f.id === id)) {
      this.activeFigure = id;
    }
  }

  setCaliber(cal) {
    this.caliber = Math.max(0, Math.min(1, cal));
  }

  setDirectivity(mode) {
    if (['projector', 'radiator', 'bilobed'].includes(mode)) {
      this.directivity = mode;
    }
  }

  setLobeAngle(deg) {
    this.lobeAngleDeg = Math.max(15, Math.min(180, deg));
  }

  /**
   * Modifies a trajectory coordinate based on the active Figure d'Espace and Directivity.
   * @param {number} x - Normalized X [-1, 1]
   * @param {number} y - Normalized Y [-1, 1]
   * @param {number} phase - Normalized phase [0, 1)
   * @param {number} voiceIndex - Voice index 0..5
   * @returns {{x: number, y: number, caliber: number, lobes: Array<{x: number, y: number}>}}
   */
  processCoordinate(x, y, phase, voiceIndex = 0) {
    let outX = Number.isFinite(x) ? x : 0;
    let outY = Number.isFinite(y) ? y : 0;
    const safePhase = Number.isFinite(phase) ? phase : 0;
    const phi = safePhase * Math.PI * 2;

    switch (this.activeFigure) {
      case 'fixe': {
        // Micro-breathing around current center
        const micro = 0.03 * Math.sin(phi * 4 + voiceIndex);
        outX = x * 0.2 + micro;
        outY = y * 0.2 + micro;
        break;
      }
      case 'translation': {
        // Linear corridor
        outX = Math.cos(phi) * 0.85;
        outY = Math.sin(voiceIndex * (Math.PI / 3)) * 0.6;
        break;
      }
      case 'rotation': {
        // Tournoiement
        const r = Math.hypot(x, y) || 0.75;
        const angle = Math.atan2(y, x) + phi;
        outX = r * Math.cos(angle);
        outY = r * Math.sin(angle);
        break;
      }
      case 'elargissement': {
        // Radial breathing caliber
        const breathe = 0.2 + 0.7 * (0.5 + 0.5 * Math.sin(phi));
        outX = x * breathe;
        outY = y * breathe;
        break;
      }
      case 'contournement': {
        // Hugging perimeter
        const angle = phi + (voiceIndex * Math.PI) / 3;
        outX = 0.92 * Math.cos(angle);
        outY = 0.92 * Math.sin(angle);
        break;
      }
      case 'zigzag': {
        // Zig-zag vectors
        const triX = Math.abs((phase * 4) % 2 - 1) * 2 - 1;
        const triY = Math.sin(phi * 3);
        outX = triX * 0.85;
        outY = triY * 0.8;
        break;
      }
      case 'echappement': {
        // Centrifugal outward flight
        const escR = (phase % 1.0) * 1.1;
        const escAngle = phi * 3;
        outX = Math.min(1.0, Math.max(-1.0, escR * Math.cos(escAngle)));
        outY = Math.min(1.0, Math.max(-1.0, escR * Math.sin(escAngle)));
        break;
      }
      case 'balancement': {
        // Harmonic pendulum swing
        const swing = Math.sin(phi) * 0.88;
        outX = swing;
        outY = 0.3 * Math.cos(phi * 2);
        break;
      }
      case 'spirale': {
        // Inward/outward spiral
        const spR = (0.2 + 0.75 * Math.abs(Math.sin(phi * 0.5)));
        outX = spR * Math.cos(phi * 2.5);
        outY = spR * Math.sin(phi * 2.5);
        break;
      }
      case 'vague': {
        // Sinusoidal transverse wave
        outX = Math.cos(phi) * 0.85;
        outY = 0.45 * Math.sin(phi * 3 + voiceIndex);
        break;
      }
      case 'tressage': {
        // Braided double ribbon
        const braidSign = (voiceIndex % 2 === 0) ? 1 : -1;
        outX = Math.cos(phi) * 0.8;
        outY = braidSign * 0.35 * Math.sin(phi * 3);
        break;
      }
      case 'rebondissement': {
        // Elastic rebound
        const now = performance.now();
        const dt = Math.min(0.05, (now - this.lastTime) / 1000);
        this.lastTime = now;
        this.reboundState.x += this.reboundState.vx * dt;
        this.reboundState.y += this.reboundState.vy * dt;
        if (Math.abs(this.reboundState.x) > 0.88) {
          this.reboundState.vx *= -1;
          this.reboundState.x = Math.sign(this.reboundState.x) * 0.88;
        }
        if (Math.abs(this.reboundState.y) > 0.88) {
          this.reboundState.vy *= -1;
          this.reboundState.y = Math.sign(this.reboundState.y) * 0.88;
        }
        outX = this.reboundState.x;
        outY = this.reboundState.y;
        break;
      }
      case 'dispersion': {
        // Centrifugal explosive burst
        const burst = (phase * 1.5) % 1.0;
        const burstAngle = (voiceIndex * (Math.PI / 3)) + Math.sin(phi) * 0.5;
        outX = burst * 0.9 * Math.cos(burstAngle);
        outY = burst * 0.9 * Math.sin(burstAngle);
        break;
      }
      case 'polyphonie':
      case 'combinee': {
        // Translation + rotation
        const transX = Math.sin(phi * 0.5) * 0.4;
        const rotX = 0.5 * Math.cos(phi * 2);
        const rotY = 0.5 * Math.sin(phi * 2);
        outX = transX + rotX;
        outY = rotY;
        break;
      }
      case 'enveloppement': {
        // Omnidirectional expansion
        outX = 0.0;
        outY = 0.0;
        break;
      }
      default:
        break;
    }

    const finalX = Number.isFinite(outX) ? Math.max(-1, Math.min(1, outX)) : 0;
    const finalY = Number.isFinite(outY) ? Math.max(-1, Math.min(1, outY)) : 0;

    // Directivity Lobes calculation (Ginkgo bilobed leaf geometry)
    const lobes = [];
    if (this.directivity === 'bilobed') {
      const halfLobe = (this.lobeAngleDeg * Math.PI) / 360;
      const baseHeading = Math.atan2(finalY, finalX);
      const lobeDist = 0.15 + this.caliber * 0.25;

      const lx1 = finalX + lobeDist * Math.cos(baseHeading + halfLobe);
      const ly1 = finalY + lobeDist * Math.sin(baseHeading + halfLobe);
      const lx2 = finalX + lobeDist * Math.cos(baseHeading - halfLobe);
      const ly2 = finalY + lobeDist * Math.sin(baseHeading - halfLobe);

      lobes.push({
        x: Number.isFinite(lx1) ? Math.max(-1, Math.min(1, lx1)) : 0,
        y: Number.isFinite(ly1) ? Math.max(-1, Math.min(1, ly1)) : 0
      });
      lobes.push({
        x: Number.isFinite(lx2) ? Math.max(-1, Math.min(1, lx2)) : 0,
        y: Number.isFinite(ly2) ? Math.max(-1, Math.min(1, ly2)) : 0
      });
    }

    return {
      x: finalX,
      y: finalY,
      caliber: this.caliber,
      lobes: lobes
    };
  }

  /**
   * Adjusts speaker gains based on Biloba directivity and caliber.
   */
  applyToSpeakerGains(speakers, mainX, mainY) {
    if (this.activeFigure === 'enveloppement') {
      // Equal distribution across all speakers
      const eqGain = 1 / Math.sqrt(speakers.length || 1);
      return speakers.map(s => ({
        ...s,
        gain: s.gain * (1 - this.caliber) + eqGain * this.caliber
      }));
    }

    if (this.directivity === 'radiator') {
      // Broad omnidirectional bleed
      const diffuseSpread = this.caliber * 0.4;
      const avgGain = speakers.reduce((sum, s) => sum + s.gain, 0) / (speakers.length || 1);
      return speakers.map(s => ({
        ...s,
        gain: s.gain * (1 - diffuseSpread) + avgGain * diffuseSpread
      }));
    }

    return speakers;
  }
}
