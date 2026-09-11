/**
 * Spatiomorphology - Expandable Trajectory Bank
 * Mathematical representations of spatial panning forms.
 * All shapes take normalized phase [0.0, 1.0) and return { x: [-1, 1], y: [-1, 1] }.
 */

export class ShapeRegistry {
  constructor() {
    this.shapes = new Map();
    this.registerDefaultShapes();
  }

  register(shapeDef) {
    if (!shapeDef.id || !shapeDef.name || typeof shapeDef.compute !== 'function') {
      throw new Error(`Invalid shape definition: ${shapeDef?.id || 'unknown'}`);
    }
    this.shapes.set(shapeDef.id, {
      ...shapeDef,
      getSampledPath: shapeDef.getSampledPath || ((params, samples = 180) => {
        const points = [];
        for (let i = 0; i < samples; i++) {
          const phase = i / samples;
          points.push(shapeDef.compute(phase, params));
        }
        return points;
      })
    });
  }

  get(id) {
    return this.shapes.get(id);
  }

  getAll() {
    return Array.from(this.shapes.values());
  }

  getCategories() {
    const cats = new Set();
    for (const s of this.shapes.values()) {
      cats.add(s.category || 'General');
    }
    return Array.from(cats);
  }

  registerDefaultShapes() {
    // 1. Circle & Ellipse
    this.register({
      id: 'circle',
      name: 'Circle / Ellipse',
      category: 'Geometric',
      description: 'Continuous circular or elliptic perimeter orbit, evoking spatial enclosure and rotational perspective.',
      params: [
        { id: 'eccentricity', name: 'Eccentricity (X/Y)', type: 'number', min: 0.2, max: 2.0, step: 0.05, default: 1.0 },
        { id: 'tilt', name: 'Tilt Angle (°)', type: 'number', min: -90, max: 90, step: 1, default: 0 }
      ],
      compute: (phase, params = {}) => {
        const ecc = params.eccentricity ?? 1.0;
        const tiltRad = ((params.tilt ?? 0) * Math.PI) / 180;
        const theta = 2 * Math.PI * phase;

        let rawX = Math.cos(theta);
        let rawY = Math.sin(theta);

        if (ecc >= 1.0) {
          rawY /= ecc;
        } else {
          rawX *= ecc;
        }

        // Apply tilt
        const x = rawX * Math.cos(tiltRad) - rawY * Math.sin(tiltRad);
        const y = rawX * Math.sin(tiltRad) + rawY * Math.cos(tiltRad);
        return { x: clamp(x, -1, 1), y: clamp(y, -1, 1) };
      }
    });

    // 2. Regular / Morphable Polygon
    this.register({
      id: 'polygon',
      name: 'Morphable Polygon',
      category: 'Geometric',
      description: 'Regular N-sided polygon (Triangle, Square, Pentagon, Hexagon, Octagon) with morphable corner roundness.',
      params: [
        { id: 'sides', name: 'Vertices / Sides', type: 'number', min: 3, max: 12, step: 1, default: 4 },
        { id: 'roundness', name: 'Corner Roundness', type: 'number', min: 0.0, max: 1.0, step: 0.05, default: 0.0 },
        { id: 'starRatio', name: 'Star Inset', type: 'number', min: 0.2, max: 1.0, step: 0.05, default: 1.0 }
      ],
      compute: (phase, params = {}) => {
        const N = Math.max(3, Math.floor(params.sides ?? 4));
        const roundness = clamp(params.roundness ?? 0, 0, 1);
        const star = clamp(params.starRatio ?? 1, 0.1, 1);

        const angleStep = (2 * Math.PI) / N;
        const theta = 2 * Math.PI * phase;

        const halfStep = angleStep / 2;
        const localAngle = (theta % angleStep) - halfStep;
        let polyR = Math.cos(halfStep) / Math.cos(localAngle);

        if (star < 0.999) {
          const starMod = 1 - (1 - star) * Math.abs(Math.sin(N * theta));
          polyR *= starMod;
        }

        const finalR = (1 - roundness) * polyR + roundness * 1.0;
        const x = finalR * Math.cos(theta);
        const y = finalR * Math.sin(theta);

        return { x: clamp(x, -1, 1), y: clamp(y, -1, 1) };
      }
    });

    // 3. Archimedean Spiral
    this.register({
      id: 'spiral_archimedean',
      name: 'Archimedean Spiral',
      category: 'Vortex & Spiral',
      description: 'Linear spiral expanding outward or inward with configurable revolutions.',
      params: [
        { id: 'turns', name: 'Spiral Turns', type: 'number', min: 1, max: 8, step: 0.5, default: 3 },
        { id: 'innerRadius', name: 'Inner Radius', type: 'number', min: 0.0, max: 0.8, step: 0.05, default: 0.05 },
        { id: 'cyclic', name: 'Cyclic Ping-Pong (0:Wrap, 1:Bounce)', type: 'number', min: 0, max: 1, step: 1, default: 1 }
      ],
      compute: (phase, params = {}) => {
        const turns = params.turns ?? 3;
        const innerR = params.innerRadius ?? 0.05;
        const cyclic = (params.cyclic ?? 1) === 1;

        let rPhase = phase;
        if (cyclic) {
          rPhase = 1 - Math.abs(2 * phase - 1);
        }

        const r = innerR + (1.0 - innerR) * rPhase;
        const theta = 2 * Math.PI * turns * phase;

        return {
          x: clamp(r * Math.cos(theta), -1, 1),
          y: clamp(r * Math.sin(theta), -1, 1)
        };
      }
    });

    // 4. Centrifugal Vortex
    this.register({
      id: 'vortex',
      name: 'Centrifugal / Centripetal Vortex',
      category: 'Vortex & Spiral',
      description: 'Dynamic vortex with exponential radial acceleration, evoking gravitational suction or outward expulsion.',
      params: [
        { id: 'turns', name: 'Rotation Rate', type: 'number', min: 1, max: 10, step: 0.5, default: 4 },
        { id: 'suction', name: 'Suction Curvature', type: 'number', min: 0.5, max: 3.0, step: 0.1, default: 1.8 }
      ],
      compute: (phase, params = {}) => {
        const turns = params.turns ?? 4;
        const suction = params.suction ?? 1.8;

        const wave = 0.5 - 0.5 * Math.cos(2 * Math.PI * phase);
        const r = Math.pow(wave, suction);
        const theta = 2 * Math.PI * turns * phase;

        return {
          x: clamp(r * Math.cos(theta), -1, 1),
          y: clamp(r * Math.sin(theta), -1, 1)
        };
      }
    });

    // 5. Lissajous Curve
    this.register({
      id: 'lissajous',
      name: 'Lissajous Harmonograph',
      category: 'Harmonic',
      description: 'Complex orbital figure generated by perpendicular sinusoidal frequencies (1:1, 1:2 lemniscate, 2:3, etc.).',
      params: [
        { id: 'freqX', name: 'Freq X', type: 'number', min: 1, max: 8, step: 1, default: 1 },
        { id: 'freqY', name: 'Freq Y', type: 'number', min: 1, max: 8, step: 1, default: 2 },
        { id: 'phaseShift', name: 'Phase Shift (°)', type: 'number', min: 0, max: 360, step: 5, default: 90 },
        { id: 'damp', name: 'Orbital Damping', type: 'number', min: 0.0, max: 0.5, step: 0.05, default: 0.0 }
      ],
      compute: (phase, params = {}) => {
        const fx = params.freqX ?? 1;
        const fy = params.freqY ?? 2;
        const delta = ((params.phaseShift ?? 90) * Math.PI) / 180;
        const damp = params.damp ?? 0.0;

        const envelope = 1 - damp * Math.sin(2 * Math.PI * phase);
        const x = envelope * Math.sin(2 * Math.PI * fx * phase + delta);
        const y = envelope * Math.sin(2 * Math.PI * fy * phase);

        return { x: clamp(x, -1, 1), y: clamp(y, -1, 1) };
      }
    });

    // 6. Criss-Cross & Diagonal Surge
    this.register({
      id: 'criss_cross',
      name: 'Diagonal Criss-Cross',
      category: 'Linear & Crossing',
      description: 'Rapid spatial crossing cutting straight through the acoustic center, followed by perimeter sweeps.',
      params: [
        { id: 'pattern', name: 'Pattern Type (0:X, 1:Bow-tie, 2:Asterisk)', type: 'number', min: 0, max: 2, step: 1, default: 0 },
        { id: 'centerDwell', name: 'Center Dwell / Pinch', type: 'number', min: 0.0, max: 1.0, step: 0.05, default: 0.2 }
      ],
      compute: (phase, params = {}) => {
        const mode = Math.floor(params.pattern ?? 0);

        if (mode === 1) {
          // Bow-tie
          const theta = 2 * Math.PI * phase;
          const x = Math.cos(theta);
          const y = Math.sin(theta) * Math.cos(theta);
          return { x: clamp(x, -1, 1), y: clamp(y * 1.8, -1, 1) };
        } else if (mode === 2) {
          // 3-axis Asterisk
          const axisCount = 3;
          const totalPhase = (phase * axisCount) % 1.0;
          const currentAxis = Math.floor(phase * axisCount);
          const axisAngle = (currentAxis * Math.PI) / axisCount;

          const sweep = Math.sin(2 * Math.PI * totalPhase);
          const x = sweep * Math.cos(axisAngle);
          const y = sweep * Math.sin(axisAngle);
          return { x: clamp(x, -1, 1), y: clamp(y, -1, 1) };
        } else {
          // Classic X-Crossing (4 segments)
          const cycle = (phase * 4) % 4;
          const seg = Math.floor(cycle);
          const t = cycle - seg;
          const s = 0.5 - 0.5 * Math.cos(Math.PI * t);

          let x = 0, y = 0;
          switch (seg) {
            case 0:
              x = -1 + 2 * s;
              y = -1 + 2 * s;
              break;
            case 1:
              x = Math.cos((Math.PI / 4) - (Math.PI / 2) * s);
              y = Math.sin((Math.PI / 4) - (Math.PI / 2) * s);
              break;
            case 2:
              x = 1 - 2 * s;
              y = -1 + 2 * s;
              break;
            case 3:
              x = Math.cos((3 * Math.PI / 4) + (Math.PI / 2) * s);
              y = Math.sin((3 * Math.PI / 4) + (Math.PI / 2) * s);
              break;
          }
          return { x: clamp(x, -1, 1), y: clamp(y, -1, 1) };
        }
      }
    });

    // 7. Zig-Zag & Meander
    this.register({
      id: 'zigzag',
      name: 'Zig-Zag / Meander',
      category: 'Linear & Crossing',
      description: 'Stepped or serpentine spatial raster scanning across the surround sound field.',
      params: [
        { id: 'lines', name: 'Scan Lines', type: 'number', min: 2, max: 8, step: 1, default: 4 },
        { id: 'orientation', name: 'Orientation (0:H, 1:V)', type: 'number', min: 0, max: 1, step: 1, default: 0 },
        { id: 'smoothness', name: 'Curve Smoothness', type: 'number', min: 0.0, max: 1.0, step: 0.05, default: 0.5 }
      ],
      compute: (phase, params = {}) => {
        const lines = Math.max(2, Math.floor(params.lines ?? 4));
        const vertical = (params.orientation ?? 0) === 1;
        const smooth = params.smoothness ?? 0.5;

        const sweepPhase = 1 - Math.abs(2 * phase - 1);
        const slowAxis = -1 + 2 * sweepPhase;

        const fastTheta = 2 * Math.PI * (lines / 2) * (phase * 2);
        let fastAxis = Math.sin(fastTheta);

        if (smooth < 0.2) {
          fastAxis = (2 / Math.PI) * Math.asin(Math.sin(fastTheta));
        }

        const x = vertical ? slowAxis : fastAxis;
        const y = vertical ? fastAxis : slowAxis;

        return { x: clamp(x, -1, 1), y: clamp(y, -1, 1) };
      }
    });

    // 8. Rhodonea / Rose Curve
    this.register({
      id: 'rose',
      name: 'Rhodonea Rose Curve',
      category: 'Harmonic',
      description: 'Floral multi-lobed petal trajectories revolving around the central listening position.',
      params: [
        { id: 'petals', name: 'Petal Factor (k)', type: 'number', min: 2, max: 8, step: 1, default: 3 },
        { id: 'offset', name: 'Center Offset (Limaçon)', type: 'number', min: 0.0, max: 1.0, step: 0.05, default: 0.2 }
      ],
      compute: (phase, params = {}) => {
        const k = params.petals ?? 3;
        const b = params.offset ?? 0.2;
        const theta = 2 * Math.PI * phase;

        const r = (b + (1 - b) * Math.cos(k * theta));
        const x = r * Math.cos(theta);
        const y = r * Math.sin(theta);

        return { x: clamp(x, -1, 1), y: clamp(y, -1, 1) };
      }
    });

    // 9. Brownian / Chaotic Drift
    this.register({
      id: 'brownian',
      name: 'Turbulent Acousmatic Drift',
      category: 'Stochastic & Chaos',
      description: 'Smooth organic spatial wandering based on multi-harmonic pseudo-stochastic drift.',
      params: [
        { id: 'complexity', name: 'Harmonic Complexity', type: 'number', min: 1, max: 5, step: 1, default: 3 },
        { id: 'speedRatio', name: 'Spatial Warp Rate', type: 'number', min: 0.5, max: 3.0, step: 0.1, default: 1.618 }
      ],
      compute: (phase, params = {}) => {
        const comp = Math.floor(params.complexity ?? 3);
        const phi = 1.61803398875;
        const warp = params.speedRatio ?? phi;

        let x = 0, y = 0, totalAmp = 0;
        const freqs = [1.0, 2.718, 4.14, 7.38, 11.0];
        const amps = [1.0, 0.55, 0.35, 0.2, 0.12];

        for (let i = 0; i < comp; i++) {
          const f = freqs[i] * warp;
          const a = amps[i];
          x += a * Math.sin(2 * Math.PI * f * phase + i * 1.3);
          y += a * Math.cos(2 * Math.PI * f * phase * phi + i * 2.1);
          totalAmp += a;
        }

        x /= totalAmp;
        y /= totalAmp;

        return { x: clamp(x, -1, 1), y: clamp(y, -1, 1) };
      }
    });
  }
}

function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val));
}
