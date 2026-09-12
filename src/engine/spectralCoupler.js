/**
 * Spatiomorphology - Spectral Space & Gravitational Coupler
 * Adapts Denis Smalley's concepts of spectral verticality, bass grounding planes,
 * levitation, and diagonal forces into Ableton Live's Surround Panner parameters
 * (Focus, Center, Smooth) and an optional companion Spectral CC (e.g. Cutoff).
 */

export class SpectralCoupler {
  constructor() {
    this.enabled = true;
    this.focusCoupling = false;       // Y verticality -> Focus (off by default)
    this.centerCoupling = false;      // Y verticality -> Center bleed (off by default)
    this.gravitationalSmooth = false; // Y descent -> higher inertial lag / Smooth (off by default)
    this.auxSpectralCc = 26;         // Optional companion CC for Filter Cutoff (0..127)
  }

  /**
   * Modulates Surround Panner parameters according to spectral verticality and diagonal forces.
   * @param {Object} rawState - { x, y, focus, center, smooth, velocity, lastY }
   * @returns {Object} { focus, center, smooth, spectralCc }
   */
  process(rawState) {
    if (!this.enabled) {
      return {
        focus: rawState.focus,
        center: rawState.center,
        smooth: rawState.smooth,
        spectralCc: Math.round(((rawState.y + 1.0) / 2.0) * 127)
      };
    }

    // Normalized verticality [0.0 = Deep Bass Plane / Ground, 1.0 = High Aerial Canopy / Levitation]
    const normY = Math.max(0.0, Math.min(1.0, (rawState.y + 1.0) / 2.0));

    // 1. Focus Coupling:
    // Higher spectral space exhibits sharper localisation (pinpoint Focus 100%).
    // Lower bass regions lose directional resolution and spread into ambient diffusion (Focus 20-40%).
    let effectiveFocus = rawState.focus;
    if (this.focusCoupling) {
      const spectralFocusBias = 30 + normY * 70; // 30% to 100%
      effectiveFocus = Math.round(rawState.focus * (spectralFocusBias / 100.0));
      effectiveFocus = Math.max(5, Math.min(100, effectiveFocus));
    }

    // 2. Center Bleed Coupling:
    // Bass ground plane anchors in the center subwoofer/mono field (high Center bleed).
    // High registers levitate away from center toward peripheral circumspace (low Center bleed).
    let effectiveCenter = rawState.center;
    if (this.centerCoupling) {
      const bassGroundCenter = (1.0 - normY) * 80; // Up to 80% center bleed at bottom
      effectiveCenter = Math.round((rawState.center * 0.5) + (bassGroundCenter * 0.5));
      effectiveCenter = Math.max(0, Math.min(100, effectiveCenter));
    }

    // 3. Gravitational Inertia & Smooth Damping:
    // Sounds plunging into lower registers experience gravitational pull and greater mass (higher Smooth lag).
    // Sounds ascending into levitation become nimble and light (lower Smooth lag).
    let effectiveSmooth = rawState.smooth;
    if (this.gravitationalSmooth) {
      const isDescending = (rawState.lastY !== undefined && rawState.y < rawState.lastY);
      const gravitationalMass = (1.0 - normY) * 35 + (isDescending ? 15 : 0);
      effectiveSmooth = Math.round(rawState.smooth + gravitationalMass * 0.5);
      effectiveSmooth = Math.max(2, Math.min(95, effectiveSmooth));
    }

    // 4. Auxiliary Spectral CC (Cutoff / Brightness):
    // Maps vertical position combined with kinetic diagonal velocity to CC 26
    const velBias = Math.min(20, (rawState.velocity || 0) * 5);
    const spectralCc = Math.max(0, Math.min(127, Math.round(normY * 110 + velBias)));

    return {
      focus: effectiveFocus,
      center: effectiveCenter,
      smooth: effectiveSmooth,
      spectralCc: spectralCc
    };
  }
}
