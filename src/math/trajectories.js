/**
 * Spatiomorph - Mathematical Trajectory Bank
 * Parametric and Chaotic Spatial Panning Trajectories.
 * All shapes take normalized phase [0.0, 1.0) and return { x: [-1, 1], y: [-1, 1] }.
 */

function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val));
}

// Generate RK4 orbit for 3D differential equations and project to 2D [-1, 1]
function generateAttractorPath(derivs, init, steps = 720, dt = 0.015, proj = [0, 1], discard = 300) {
  let state = [...init];
  // Warm up past transient state
  for (let i = 0; i < discard; i++) {
    state = rk4Step(derivs, state, dt);
  }

  const rawPts = [];
  let minX = Infinity, maxX = -Infinity;
  let minY = Infinity, maxY = -Infinity;

  for (let i = 0; i < steps; i++) {
    state = rk4Step(derivs, state, dt);
    const px = state[proj[0]];
    const py = state[proj[1]];
    rawPts.push({ x: px, y: py });
    if (px < minX) minX = px;
    if (px > maxX) maxX = px;
    if (py < minY) minY = py;
    if (py > maxY) maxY = py;
  }

  const spanX = maxX - minX || 1;
  const spanY = maxY - minY || 1;

  // Normalize to [-0.95, 0.95]
  return rawPts.map(p => ({
    x: clamp(((p.x - minX) / spanX) * 1.9 - 0.95, -1, 1),
    y: clamp(((p.y - minY) / spanY) * 1.9 - 0.95, -1, 1)
  }));
}

function rk4Step(derivs, state, dt) {
  const k1 = derivs(state);
  const s2 = state.map((v, i) => clamp(v + 0.5 * dt * (isFinite(k1[i]) ? k1[i] : 0), -1000, 1000));
  const k2 = derivs(s2);
  const s3 = state.map((v, i) => clamp(v + 0.5 * dt * (isFinite(k2[i]) ? k2[i] : 0), -1000, 1000));
  const k3 = derivs(s3);
  const s4 = state.map((v, i) => clamp(v + dt * (isFinite(k3[i]) ? k3[i] : 0), -1000, 1000));
  const k4 = derivs(s4);

  return state.map((v, i) => {
    const dVal = (dt / 6) * ((isFinite(k1[i]) ? k1[i] : 0) + 2 * (isFinite(k2[i]) ? k2[i] : 0) + 2 * (isFinite(k3[i]) ? k3[i] : 0) + (isFinite(k4[i]) ? k4[i] : 0));
    const next = v + dVal;
    return isFinite(next) ? clamp(next, -1000, 1000) : v;
  });
}

// Lookup sample in precomputed path with linear interpolation and seed offset
function samplePath(path, phase, seed = 42) {
  const len = path.length;
  const seedOffset = ((seed - 42) * 0.00381966) % 1.0;
  const effPhase = ((phase + seedOffset) % 1.0 + 1.0) % 1.0;
  const idxFloat = effPhase * len;
  const i0 = Math.floor(idxFloat) % len;
  const i1 = (i0 + 1) % len;
  const frac = idxFloat - Math.floor(idxFloat);

  return {
    x: path[i0].x + (path[i1].x - path[i0].x) * frac,
    y: path[i0].y + (path[i1].y - path[i0].y) * frac
  };
}

const attractorCommonParams = [
  { id: 'seed', name: 'Random Seed', type: 'number', min: 1, max: 1000, step: 1, default: 42 },
  { id: 'reseed', name: 'Reseed Rate', type: 'number', min: 0.0, max: 5.0, step: 0.05, default: 0.0 }
];

export class ShapeRegistry {
  constructor() {
    this.shapes = new Map();
    this.attractorCache = new Map();
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
    const preferredOrder = [
      'Geometric',
      'Complex / Multilobe',
      'Spirals & Helices',
      'Linear & Crossing',
      'Organic & Natural Forms',
      'Crystalline & Cleavage',
      'Acoustic & Perceptual',
      'Stochastic & Chaos'
    ];
    const presentCats = new Set();
    for (const s of this.shapes.values()) {
      presentCats.add(s.category || 'General');
    }
    const result = [];
    for (const cat of preferredOrder) {
      if (presentCats.has(cat)) {
        result.push(cat);
        presentCats.delete(cat);
      }
    }
    for (const cat of presentCats) {
      result.push(cat);
    }
    return result;
  }

  registerDefaultShapes() {
    // ==========================================
    // 1. GEOMETRIC
    // ==========================================

    // Circle / Ellipse
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

        if (ecc >= 1.0) rawY /= ecc;
        else rawX *= ecc;

        const x = rawX * Math.cos(tiltRad) - rawY * Math.sin(tiltRad);
        const y = rawX * Math.sin(tiltRad) + rawY * Math.cos(tiltRad);
        return { x: clamp(x, -1, 1), y: clamp(y, -1, 1) };
      }
    });

    // Morphable Polygon (Bipolar Roundness: -1.0 to +1.0)
    this.register({
      id: 'polygon',
      name: 'Morphable Polygon',
      category: 'Geometric',
      description: 'Regular N-sided polygon with bipolar roundness (-1.0 pucker/star to +1.0 bloat/circle).',
      params: [
        { id: 'sides', name: 'Vertices / Sides', type: 'number', min: 3, max: 12, step: 1, default: 4 },
        { id: 'roundness', name: 'Roundness (Pucker ↔ Bloat)', type: 'number', min: -1.0, max: 1.0, step: 0.05, default: 0.0 },
        { id: 'starRatio', name: 'Star Inset', type: 'number', min: 0.2, max: 1.0, step: 0.05, default: 1.0 }
      ],
      compute: (phase, params = {}) => {
        const N = Math.max(3, Math.floor(params.sides ?? 4));
        const roundness = clamp(params.roundness ?? 0, -1.0, 1.0);
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

        // Bipolar transformation:
        // roundness > 0: bloat toward perfect circle (r = 1.0)
        // roundness < 0: pucker inward (concave star pinch)
        let finalR;
        if (roundness >= 0) {
          finalR = (1 - roundness) * polyR + roundness * 1.0;
        } else {
          const puckerFactor = Math.abs(roundness);
          const puckerPinch = Math.abs(Math.sin(N * theta / 2));
          finalR = polyR * (1.0 - puckerFactor * 0.65 * puckerPinch);
        }

        const x = finalR * Math.cos(theta);
        const y = finalR * Math.sin(theta);
        return { x: clamp(x, -1, 1), y: clamp(y, -1, 1) };
      }
    });

    // ==========================================
    // 2. VORTEX & SPIRAL
    // ==========================================

    // Archimedean Spiral
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
        if (cyclic) rPhase = 1 - Math.abs(2 * phase - 1);

        const r = innerR + (1.0 - innerR) * rPhase;
        const theta = 2 * Math.PI * turns * phase;
        return { x: clamp(r * Math.cos(theta), -1, 1), y: clamp(r * Math.sin(theta), -1, 1) };
      }
    });

    // Centrifugal Vortex
    this.register({
      id: 'vortex',
      name: 'Centrifugal / Centripetal Vortex',
      category: 'Vortex & Spiral',
      description: 'Dynamic vortex with exponential radial acceleration, evoking gravitational suction or expulsion.',
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
        return { x: clamp(r * Math.cos(theta), -1, 1), y: clamp(r * Math.sin(theta), -1, 1) };
      }
    });

    // ==========================================
    // 3. HARMONIC
    // ==========================================

    // Lissajous Curve
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

    // Rhodonea Rose Curve
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

    // ==========================================
    // 4. LINEAR & CROSSING
    // ==========================================

    // Diagonal Criss-Cross with functional Center Dwell / Pinch
    this.register({
      id: 'criss_cross',
      name: 'Diagonal Criss-Cross',
      category: 'Linear & Crossing',
      description: 'Rapid spatial crossing cutting straight through the acoustic center, with adjustable center pinch dwell.',
      params: [
        { id: 'pattern', name: 'Pattern Type (0:X, 1:Bow-tie, 2:Asterisk)', type: 'number', min: 0, max: 2, step: 1, default: 0 },
        { id: 'centerDwell', name: 'Center Dwell / Pinch', type: 'number', min: 0.0, max: 1.0, step: 0.05, default: 0.3 }
      ],
      compute: (phase, params = {}) => {
        const mode = Math.floor(params.pattern ?? 0);
        const dwell = clamp(params.centerDwell ?? 0.3, 0.0, 0.95);

        if (mode === 1) {
          // Bow-tie
          const theta = 2 * Math.PI * phase;
          let x = Math.cos(theta);
          let y = Math.sin(theta) * Math.cos(theta);
          // Apply pinch toward center
          if (dwell > 0) {
            const pinch = 1.0 - dwell * (1.0 - Math.abs(x));
            y *= pinch;
          }
          return { x: clamp(x, -1, 1), y: clamp(y * 1.8, -1, 1) };
        } else if (mode === 2) {
          // 3-axis Asterisk
          const axisCount = 3;
          const totalPhase = (phase * axisCount) % 1.0;
          const currentAxis = Math.floor(phase * axisCount);
          const axisAngle = (currentAxis * Math.PI) / axisCount;

          let sweep = Math.sin(2 * Math.PI * totalPhase);
          if (dwell > 0) {
            const sSign = Math.sign(sweep);
            const sMag = Math.pow(Math.abs(sweep), 1.0 + dwell * 2.5);
            sweep = sSign * sMag;
          }
          return { x: clamp(sweep * Math.cos(axisAngle), -1, 1), y: clamp(sweep * Math.sin(axisAngle), -1, 1) };
        } else {
          // Classic X-Crossing (4 segments) with center dwell time-warp
          const cycle = (phase * 4) % 4;
          const seg = Math.floor(cycle);
          const t = cycle - seg;

          // Non-linear S-curve with dwell expansion near center (s = 0.5)
          let s = t;
          if (dwell > 0) {
            const centered = (t - 0.5) * 2; // [-1, 1]
            const sign = Math.sign(centered);
            const warped = sign * Math.pow(Math.abs(centered), 1.0 - dwell * 0.7);
            s = warped * 0.5 + 0.5;
          }
          const curvedS = 0.5 - 0.5 * Math.cos(Math.PI * s);

          let x = 0, y = 0;
          switch (seg) {
            case 0:
              x = -1 + 2 * curvedS;
              y = -1 + 2 * curvedS;
              break;
            case 1:
              x = Math.cos((Math.PI / 4) - (Math.PI / 2) * curvedS);
              y = Math.sin((Math.PI / 4) - (Math.PI / 2) * curvedS);
              break;
            case 2:
              x = 1 - 2 * curvedS;
              y = -1 + 2 * curvedS;
              break;
            case 3:
              x = Math.cos((3 * Math.PI / 4) + (Math.PI / 2) * curvedS);
              y = Math.sin((3 * Math.PI / 4) + (Math.PI / 2) * curvedS);
              break;
          }
          return { x: clamp(x, -1, 1), y: clamp(y, -1, 1) };
        }
      }
    });

    // Zig-Zag / Meander with silky continuous smoothness morph
    this.register({
      id: 'zigzag',
      name: 'Zig-Zag / Meander',
      category: 'Linear & Crossing',
      description: 'Stepped or serpentine spatial raster scanning across the surround sound field.',
      params: [
        { id: 'lines', name: 'Scan Lines', type: 'number', min: 2, max: 8, step: 1, default: 4 },
        { id: 'orientation', name: 'Orientation (0:H, 1:V)', type: 'number', min: 0, max: 1, step: 1, default: 0 },
        { id: 'smoothness', name: 'Curve Smoothness (Linear ↔ Sine)', type: 'number', min: 0.0, max: 1.0, step: 0.02, default: 0.5 }
      ],
      compute: (phase, params = {}) => {
        const lines = Math.max(2, Math.floor(params.lines ?? 4));
        const vertical = (params.orientation ?? 0) === 1;
        const smooth = clamp(params.smoothness ?? 0.5, 0.0, 1.0);

        const sweepPhase = 1 - Math.abs(2 * phase - 1);
        const slowAxis = -1 + 2 * sweepPhase;

        const fastTheta = 2 * Math.PI * (lines / 2) * (phase * 2);
        const sinWave = Math.sin(fastTheta);
        const triWave = (2 / Math.PI) * Math.asin(Math.sin(fastTheta));

        // Smooth continuous crossfade between sharp linear triangle and sine
        const fastAxis = (1.0 - smooth) * triWave + smooth * sinWave;

        const x = vertical ? slowAxis : fastAxis;
        const y = vertical ? fastAxis : slowAxis;
        return { x: clamp(x, -1, 1), y: clamp(y, -1, 1) };
      }
    });

    // ==========================================
    // 5. STOCHASTIC & CHAOS (17 Strange Attractors + Drift)
    // ==========================================

    // Stochastic Drift (formerly Turbulent Acousmatic Drift)
    this.register({
      id: 'stochastic_drift',
      name: 'Stochastic Drift',
      category: 'Stochastic & Chaos',
      description: 'Multi-harmonic pseudo-stochastic Brownian spatial wandering with seed control.',
      params: [
        { id: 'seed', name: 'Random Seed', type: 'number', min: 1, max: 1000, step: 1, default: 42 },
        { id: 'reseed', name: 'Reseed Rate', type: 'number', min: 0.0, max: 5.0, step: 0.05, default: 0.0 },
        { id: 'complexity', name: 'Harmonic Complexity', type: 'number', min: 1, max: 8, step: 1, default: 4 },
        { id: 'speedRatio', name: 'Spatial Warp Rate', type: 'number', min: 0.5, max: 3.0, step: 0.1, default: 1.618 }
      ],
      compute: (phase, params = {}) => {
        const seed = params.seed ?? 42;
        const comp = Math.min(8, Math.max(1, Math.floor(params.complexity ?? 4)));
        const warp = params.speedRatio ?? 1.61803398875;

        let x = 0, y = 0, totalAmp = 0;
        const freqs = [1.0, 2.718, 4.14, 7.38, 11.0, 15.6, 21.2, 28.5];
        const amps = [1.0, 0.65, 0.45, 0.32, 0.22, 0.15, 0.10, 0.07];

        for (let i = 0; i < comp; i++) {
          const f = freqs[i] * warp;
          const a = amps[i];
          const phaseOffset = (seed * 1.618033 + i * 2.39996) % (2 * Math.PI);
          x += a * Math.sin(2 * Math.PI * f * phase + phaseOffset);
          y += a * Math.cos(2 * Math.PI * f * phase * 1.618 + phaseOffset * 1.3);
          totalAmp += a;
        }

        return { x: clamp(x / totalAmp, -1, 1), y: clamp(y / totalAmp, -1, 1) };
      }
    });

    // 1. Lorenz Attractor (Speed normalized to 0.22x)
    const lorenzPath = generateAttractorPath(([x, y, z]) => [
      10 * (y - x),
      x * (28 - z) - y,
      x * y - (8 / 3) * z
    ], [0.1, 0.0, 0.0], 800, 0.015, [0, 2]); // x, z projection

    this.register({
      id: 'attractor_lorenz',
      name: 'Lorenz Attractor',
      category: 'Stochastic & Chaos',
      description: 'The iconic chaotic butterfly attractor discovered by Edward Lorenz.',
      params: attractorCommonParams,
      compute: (phase, params = {}) => samplePath(lorenzPath, phase * 0.22, params.seed)
    });

    // 2. Rössler Attractor
    const rosslerPath = generateAttractorPath(([x, y, z]) => [
      -y - z,
      x + 0.2 * y,
      0.2 + z * (x - 5.7)
    ], [0.1, 0.0, 0.0], 800, 0.035, [0, 1]);

    this.register({
      id: 'attractor_rossler',
      name: 'Rössler Attractor',
      category: 'Stochastic & Chaos',
      description: 'Smooth continuous single-band chaotic spiral fold.',
      params: attractorCommonParams,
      compute: (phase, params = {}) => samplePath(rosslerPath, phase, params.seed)
    });

    // 3. Bouali Attractor (Speed normalized to 0.30x)
    const boualiPath = generateAttractorPath(([x, y, z]) => [
      3 * x * (1 - y) - z,
      -2.2 * y * (1 - x * x),
      0.001 * x
    ], [1.0, 0.1, 0.1], 800, 0.02, [0, 1]);

    this.register({
      id: 'attractor_bouali',
      name: 'Bouali Attractor',
      category: 'Stochastic & Chaos',
      description: 'Dynamic limit-cycle chaotic butterfly from non-linear mechanics.',
      params: attractorCommonParams,
      compute: (phase, params = {}) => samplePath(boualiPath, phase * 0.30, params.seed)
    });

    // 4. Thomas Attractor
    const thomasPath = generateAttractorPath(([x, y, z]) => [
      Math.sin(y) - 0.208186 * x,
      Math.sin(z) - 0.208186 * y,
      Math.sin(x) - 0.208186 * z
    ], [0.1, 0.0, 0.0], 800, 0.08, [0, 1]);

    this.register({
      id: 'attractor_thomas',
      name: 'Thomas Cyclically Symmetric',
      category: 'Stochastic & Chaos',
      description: 'Trigonometric cycloidal labyrinth traversing 3D symmetrical loops.',
      params: attractorCommonParams,
      compute: (phase, params = {}) => samplePath(thomasPath, phase, params.seed)
    });

    // 5. Aizawa Attractor (Speed normalized to 0.45x)
    const aizawaPath = generateAttractorPath(([x, y, z]) => [
      (z - 0.7) * x - 3.5 * y,
      3.5 * x + (z - 0.7) * y,
      0.6 + 0.95 * z - (z * z * z) / 3 - (x * x + y * y) * (1 + 0.25 * z) + 0.1 * z * (x * x * x)
    ], [0.1, 0.0, 0.0], 800, 0.02, [0, 1]);

    this.register({
      id: 'attractor_aizawa',
      name: 'Aizawa Attractor',
      category: 'Stochastic & Chaos',
      description: 'Chaotic spherical torus with pulsating polar jet transitions.',
      params: attractorCommonParams,
      compute: (phase, params = {}) => samplePath(aizawaPath, phase * 0.45, params.seed)
    });

    // 6. Chen Attractor (Speed normalized to 0.20x)
    const chenPath = generateAttractorPath(([x, y, z]) => [
      35 * (y - x),
      (28 - 35) * x - x * z + 28 * y,
      x * y - 3 * z
    ], [-0.1, 0.5, -0.6], 800, 0.01, [0, 2]);

    this.register({
      id: 'attractor_chen',
      name: 'Chen Attractor',
      category: 'Stochastic & Chaos',
      description: 'Dual-scroll hyperchaotic attractor with higher topological complexity than Lorenz.',
      params: attractorCommonParams,
      compute: (phase, params = {}) => samplePath(chenPath, phase * 0.20, params.seed)
    });

    // 7. Halvorsen Attractor (Speed normalized to 0.30x)
    const halvorsenPath = generateAttractorPath(([x, y, z]) => [
      -1.89 * x - 4 * y - 4 * z - y * y,
      -1.89 * y - 4 * z - 4 * x - z * z,
      -1.89 * z - 4 * x - 4 * y - x * x
    ], [-1.48, -1.2, 0.5], 800, 0.015, [0, 1]);

    this.register({
      id: 'attractor_halvorsen',
      name: 'Halvorsen Attractor',
      category: 'Stochastic & Chaos',
      description: 'Tri-lobed cyclically rotating chaotic attractor with triple rotational symmetry.',
      params: attractorCommonParams,
      compute: (phase, params = {}) => samplePath(halvorsenPath, phase * 0.30, params.seed)
    });

    // 8. Liu-Chen Attractor
    const liuChenPath = generateAttractorPath(([x, y, z]) => [
      40 * (y - x),
      1 * x - 0.5 * x * z,
      -11 * z + 0.3 * x * x
    ], [0.2, 0.1, 0.2], 800, 0.01, [0, 2]);

    this.register({
      id: 'attractor_liu_chen',
      name: 'Liu-Chen Attractor',
      category: 'Stochastic & Chaos',
      description: 'Complex swirling scroll attractor with rapid multi-directional excursions.',
      params: attractorCommonParams,
      compute: (phase, params = {}) => samplePath(liuChenPath, phase, params.seed)
    });

    // 9. Nosé-Hoover Attractor
    const noseHooverPath = generateAttractorPath(([x, y, z]) => [
      y,
      -x + y * z,
      1.5 - y * y
    ], [0.1, 0.0, 0.0], 800, 0.03, [0, 1]);

    this.register({
      id: 'attractor_nose_hoover',
      name: 'Nosé-Hoover Attractor',
      category: 'Stochastic & Chaos',
      description: 'Conservative Hamiltonian chaotic loop system from statistical thermodynamics.',
      params: attractorCommonParams,
      compute: (phase, params = {}) => samplePath(noseHooverPath, phase, params.seed)
    });

    // 10. Sprott Attractor (Case B)
    const sprottPath = generateAttractorPath(([x, y, z]) => [
      y * z,
      x - y,
      1 - x * y
    ], [0.5, 0.5, 0.5], 800, 0.04, [0, 1]);

    this.register({
      id: 'attractor_sprott',
      name: 'Sprott Attractor',
      category: 'Stochastic & Chaos',
      description: 'Minimal algebraic chaotic attractor with beautiful harmonic weaving.',
      params: attractorCommonParams,
      compute: (phase, params = {}) => samplePath(sprottPath, phase, params.seed)
    });

    // 11. Four-Wing Attractor
    const fourWingPath = generateAttractorPath(([x, y, z]) => [
      0.2 * x + y * z,
      0.01 * x - 0.4 * y - x * z,
      -z + x * y
    ], [1.0, 1.0, 1.0], 800, 0.02, [0, 1]);

    this.register({
      id: 'attractor_four_wing',
      name: 'Four-Wing Attractor',
      category: 'Stochastic & Chaos',
      description: 'Quad-lobed spatial cross attractor alternating between four quadrants.',
      params: attractorCommonParams,
      compute: (phase, params = {}) => samplePath(fourWingPath, phase, params.seed)
    });

    // 12. Chua Double-Scroll Attractor
    const chuaPath = generateAttractorPath(([x, y, z]) => {
      const h = -0.714 * x + 0.5 * (-1.143 + 0.714) * (Math.abs(x + 1) - Math.abs(x - 1));
      return [
        15.6 * (y - x - h),
        x - y + z,
        -28.0 * y
      ];
    }, [0.7, 0.0, 0.0], 800, 0.01, [0, 1]);

    this.register({
      id: 'attractor_chua',
      name: 'Chua Double Scroll',
      category: 'Stochastic & Chaos',
      description: 'Electronic non-linear chaotic circuit attractor tracing two resonant scrolls.',
      params: attractorCommonParams,
      compute: (phase, params = {}) => samplePath(chuaPath, phase, params.seed)
    });

    // 13. Arneodo Attractor
    const arneodoPath = generateAttractorPath(([x, y, z]) => [
      y,
      z,
      5.5 * x - 3.5 * y - z - 1.0 * (x * x * x)
    ], [-0.1, 0.5, 0.1], 800, 0.015, [0, 1]);

    this.register({
      id: 'attractor_arneodo',
      name: 'Arneodo Attractor',
      category: 'Stochastic & Chaos',
      description: 'Three-dimensional cubic folding attractor with dense harmonic excursions.',
      params: attractorCommonParams,
      compute: (phase, params = {}) => samplePath(arneodoPath, phase, params.seed)
    });

    // 14. Dequan Li Attractor (Speed normalized to 0.14x)
    const dequanLiPath = generateAttractorPath(([x, y, z]) => [
      40 * (y - x) + 0.16 * x * z,
      55 * x + 20 * y - x * z,
      1.833 * z + x * y - 0.65 * (x * x)
    ], [0.1, 0.1, 0.1], 800, 0.006, [0, 1]);

    this.register({
      id: 'attractor_dequan_li',
      name: 'Dequan Li Five-Wing',
      category: 'Stochastic & Chaos',
      description: 'High-dimensional five-winged hyperchaotic multi-fold attractor.',
      params: attractorCommonParams,
      compute: (phase, params = {}) => samplePath(dequanLiPath, phase * 0.14, params.seed)
    });

    // 15. Rabinovich-Fabrikant Attractor
    const rabinovichPath = generateAttractorPath(([x, y, z]) => [
      y * (z - 1 + x * x) + 0.1 * x,
      x * (3 * z + 1 - x * x) + 0.1 * y,
      -2 * z * (0.14 + x * y)
    ], [-1.0, 0.0, 0.5], 800, 0.008, [0, 1]);

    this.register({
      id: 'attractor_rabinovich',
      name: 'Rabinovich-Fabrikant',
      category: 'Stochastic & Chaos',
      description: 'Modulated wave chaotic attractor exhibiting turbulence in non-equilibrium media.',
      params: attractorCommonParams,
      compute: (phase, params = {}) => samplePath(rabinovichPath, phase, params.seed)
    });

    // 16. Rikitake Dynamo Attractor
    const rikitakePath = generateAttractorPath(([x, y, z]) => [
      -2 * x + y * z,
      -2 * y + x * (z - 5),
      1 - x * y
    ], [0.1, 1.0, 2.0], 800, 0.015, [0, 1]);

    this.register({
      id: 'attractor_rikitake',
      name: 'Rikitake Dynamo',
      category: 'Stochastic & Chaos',
      description: 'Geomagnetic core field reversal oscillator tracing asymmetric dual vortices.',
      params: attractorCommonParams,
      compute: (phase, params = {}) => samplePath(rikitakePath, phase, params.seed)
    });

    // 17. Dadras Attractor
    const dadrasPath = generateAttractorPath(([x, y, z]) => [
      y - 3 * x + 2.7 * y * z,
      1.7 * y - x * z + z,
      2 * x * y - 9 * z
    ], [1.1, 2.1, -2.0], 800, 0.008, [0, 1]);

    this.register({
      id: 'attractor_dadras',
      name: 'Dadras Attractor',
      category: 'Stochastic & Chaos',
      description: 'Multi-spiral 3D autonomous chaotic system with five equilibrium states.',
      params: attractorCommonParams,
      compute: (phase, params = {}) => samplePath(dadrasPath, phase, params.seed)
    });

    // 18. Biloba Fan (Ginkgo Biloba - Annette Vande Gorne)
    this.register({
      id: 'biloba_fan',
      name: 'Biloba Fan (Ginkgo)',
      category: 'Organic & Natural Forms',
      description: 'Dual-lobed Ginkgo Biloba fan leaf geometry spanning to the boundaries of the acoustic field.',
      params: [
        { id: 'aperture', name: 'Fan Aperture', type: 'number', min: 30, max: 180, step: 5, default: 130 },
        { id: 'notch', name: 'Lobe Notch Depth', type: 'number', min: 0.1, max: 0.9, step: 0.05, default: 0.45 },
        { id: 'reach', name: 'Fan Reach / Radius', type: 'number', min: 0.5, max: 1.5, step: 0.05, default: 1.0 }
      ],
      compute: (phase, params = {}) => {
        const aperture = params.aperture ?? 130;
        const notch = params.notch ?? 0.45;
        const reach = params.reach ?? 1.0;

        const t = phase * Math.PI * 2;
        const th = Math.sin(t) * ((aperture * Math.PI) / 360);
        const normTh = th / ((aperture * Math.PI) / 360); // -1..1

        // Lobe profile: peaks at ~ +/- 0.5, notch at 0
        const lobeShape = 1.0 - notch * Math.pow(Math.cos(normTh * Math.PI), 2);
        const verticalDrive = Math.cos(t); // -1 at stem, +1 at lobes

        let x, y;
        if (verticalDrive >= 0) {
          const r = (0.25 + 0.75 * Math.pow(verticalDrive, 0.8) * lobeShape) * reach;
          x = Math.sin(th) * r * 2.2;
          y = (Math.cos(th) * r * 1.9) - 0.95;
        } else {
          const stemDepth = -verticalDrive; // 0 to 1
          x = Math.sin(th) * 0.15 * (1 - stemDepth);
          y = -0.75 - stemDepth * 0.20;
        }

        // Scale and center vertically to span [-1, 1] boundaries cleanly
        return {
          x: clamp(x, -1, 1),
          y: clamp(y * 1.25 + 0.23, -1, 1)
        };
      }
    });

    // 19. Branching Petiole (Venation)
    this.register({
      id: 'branching_petiole',
      name: 'Branching Petiole (Venation)',
      category: 'Organic & Natural Forms',
      description: 'Dichotomous branching trajectory radiating from Ginkgo leaf stem into perimeter veins.',
      params: [
        { id: 'branches', name: 'Branch Factor', type: 'number', min: 1, max: 32, step: 1, default: 4 },
        { id: 'curvature', name: 'Stem Curvature', type: 'number', min: 0.1, max: 1.0, step: 0.05, default: 0.5 }
      ],
      compute: (phase, params = {}) => {
        const b = params.branches ?? 4;
        const curve = params.curvature ?? 0.5;
        const t = phase * Math.PI * 2;
        const stem = Math.sin(t * b);
        const y = Math.sin(t) * 0.85;
        const x = (Math.cos(t) * 0.4 + stem * 0.45 * Math.abs(y)) * curve * 1.5;
        return { x: clamp(x, -1, 1), y: clamp(y, -1, 1) };
      }
    });

    // 20. Cornflower Rosette (Kornblume - Jens Blauert)
    this.register({
      id: 'cornflower_rosette',
      name: 'Cornflower Rosette (Kornblume)',
      category: 'Organic & Natural Forms',
      description: 'Blauert cornflower phyllotaxis rosette with golden-ratio ray florets radiating outward.',
      params: [
        { id: 'petals', name: 'Ray Florets', type: 'number', min: 5, max: 21, step: 1, default: 13 },
        { id: 'bloom', name: 'Bloom Spread', type: 'number', min: 0.3, max: 1.0, step: 0.05, default: 0.85 }
      ],
      compute: (phase, params = {}) => {
        const petals = params.petals ?? 13;
        const bloom = params.bloom ?? 0.85;
        const angle = phase * Math.PI * 2 * petals;
        const radius = Math.sqrt(phase) * bloom;
        return {
          x: clamp(radius * Math.cos(angle), -1, 1),
          y: clamp(radius * Math.sin(angle), -1, 1)
        };
      }
    });

    // 21. Clifton Precedence Leap
    this.register({
      id: 'clifton_jumper',
      name: 'Clifton Precedence Leap',
      category: 'Acoustic & Perceptual',
      description: 'Franssen & Clifton precedence breakdown exhibiting sudden leaps between acoustic poles.',
      params: [
        { id: 'dwell', name: 'Pole Dwell Ratio', type: 'number', min: 0.1, max: 0.9, step: 0.05, default: 0.6 },
        { id: 'leapSpeed', name: 'Leap Velocity', type: 'number', min: 1, max: 5, step: 1, default: 3 }
      ],
      compute: (phase, params = {}) => {
        const dwell = params.dwell ?? 0.6;
        const p = phase % 1.0;
        let x, y;
        if (p < dwell * 0.5) {
          x = -0.85;
          y = 0.2 * Math.sin(p * 20);
        } else if (p < 0.5) {
          const jumpT = (p - dwell * 0.5) / (0.5 - dwell * 0.5);
          x = -0.85 + 1.7 * (0.5 - 0.5 * Math.cos(jumpT * Math.PI));
          y = 0.5 * Math.sin(jumpT * Math.PI);
        } else if (p < 0.5 + dwell * 0.5) {
          x = 0.85;
          y = 0.2 * Math.sin(p * 20);
        } else {
          const jumpBackT = (p - (0.5 + dwell * 0.5)) / (0.5 - dwell * 0.5);
          x = 0.85 - 1.7 * (0.5 - 0.5 * Math.cos(jumpBackT * Math.PI));
          y = -0.5 * Math.sin(jumpBackT * Math.PI);
        }
        return { x: clamp(x, -1, 1), y: clamp(y, -1, 1) };
      }
    });

    // 22. Calcite Rhombohedron (Natasha Barrett)
    this.register({
      id: 'calcite_rhombohedron',
      name: 'Calcite Rhombohedron',
      category: 'Crystalline & Cleavage',
      description: 'Iceland spar 101° and 78° crystal cleavage facets projected into 2D acoustic space.',
      params: [
        { id: 'skew', name: 'Cleavage Skew', type: 'number', min: 0.1, max: 0.8, step: 0.05, default: 0.45 },
        { id: 'facets', name: 'Facet Count', type: 'number', min: 3, max: 8, step: 1, default: 6 }
      ],
      compute: (phase, params = {}) => {
        const facets = params.facets ?? 6;
        const skew = params.skew ?? 0.45;
        const segment = Math.floor(phase * facets);
        const subPhase = (phase * facets) % 1.0;
        const a1 = (segment * 2 * Math.PI) / facets;
        const a2 = ((segment + 1) * 2 * Math.PI) / facets;
        const p1 = { x: Math.cos(a1) * 0.85 + skew * Math.sin(a1), y: Math.sin(a1) * 0.85 };
        const p2 = { x: Math.cos(a2) * 0.85 + skew * Math.sin(a2), y: Math.sin(a2) * 0.85 };
        return {
          x: clamp(p1.x + (p2.x - p1.x) * subPhase, -1, 1),
          y: clamp(p1.y + (p2.y - p1.y) * subPhase, -1, 1)
        };
      }
    });

    // 23. Birefringent Ray Lissajous
    this.register({
      id: 'birefringent_lissajous',
      name: 'Birefringent Ray Lissajous',
      category: 'Crystalline & Cleavage',
      description: 'Dual polarized Lissajous figure tracing ordinary and extraordinary ray interference.',
      params: [
        { id: 'freqRatio', name: 'Frequency Ratio', type: 'number', min: 1, max: 5, step: 1, default: 3 },
        { id: 'phaseSplit', name: 'Optical Phase Split', type: 'number', min: 0, max: 180, step: 5, default: 90 }
      ],
      compute: (phase, params = {}) => {
        const ratio = params.freqRatio ?? 3;
        const splitRad = ((params.phaseSplit ?? 90) * Math.PI) / 180;
        const t = phase * Math.PI * 2;
        const x = 0.85 * Math.sin(t * 2 + splitRad);
        const y = 0.85 * Math.sin(t * ratio);
        return { x: clamp(x, -1, 1), y: clamp(y, -1, 1) };
      }
    });

    // 24. Canopy Flutter (Ipê-amarelo - Daniel L. Barreiro)
    this.register({
      id: 'canopy_flutter',
      name: 'Canopy Flutter (Ipê-amarelo)',
      category: 'Organic & Natural Forms',
      description: 'Golden trumpet tree blossoms spiraling down through forest canopy strata in the wind.',
      params: [
        { id: 'flutterRate', name: 'Petal Flutter Rate', type: 'number', min: 1, max: 8, step: 1, default: 5 },
        { id: 'swirl', name: 'Canopy Swirl', type: 'number', min: 0.1, max: 1.0, step: 0.05, default: 0.7 }
      ],
      compute: (phase, params = {}) => {
        const rate = params.flutterRate ?? 5;
        const swirl = params.swirl ?? 0.7;
        const t = phase * Math.PI * 2;
        const r = 0.3 + 0.55 * (1 - phase);
        const flutter = 0.12 * Math.sin(t * rate);
        const angle = t * 2 * swirl;
        return {
          x: clamp((r + flutter) * Math.cos(angle), -1, 1),
          y: clamp((r + flutter) * Math.sin(angle), -1, 1)
        };
      }
    });

    // 25. Kinetic Boundary Ricochet
    this.register({
      id: 'kinetic_bounce',
      name: 'Kinetic Boundary Ricochet',
      category: 'Organic & Natural Forms',
      description: 'Barreiro kinetic elastic collision trajectory reflecting off acoustic boundary walls with bipolar post-bounce velocity boost or reduction.',
      params: [
        { id: 'bounces', name: 'Wall Collisions', type: 'number', min: 2, max: 12, step: 1, default: 4 },
        { id: 'elasticity', name: 'Elastic Energy', type: 'number', min: -1.0, max: 1.0, step: 0.05, default: 0.5 }
      ],
      compute: (phase, params = {}) => {
        const bounces = params.bounces ?? 4;
        const elast = clamp(params.elasticity ?? 0.5, -1.0, 1.0);

        // Bipolar boost/reduction factor:
        // elast > 0: velocity boost upon rebounding (up to +2.4x) decaying back to 1.0x Clock speed
        // elast < 0: velocity reduction upon rebounding (down to 0.15x) smoothly accelerating back to 1.0x Clock speed
        const B = elast >= 0 ? 2.4 * elast : 0.85 * elast;
        const segFloat = (phase % 1.0) * bounces;
        const segIdx = Math.floor(segFloat);
        const tau = segFloat - segIdx; // Progress within rebound segment [0, 1)

        // Monotonically warped progress: post-collision velocity surge/stall that settles back to Clock speed
        const w = (tau + (B / 3) * (1 - Math.pow(1 - tau, 3))) / (1 + B / 3);
        const effPhase = (segIdx + w) / bounces;

        // Billiard fold reflecting at boundary walls (+/- 0.95), completely independent of elasticity scaling
        const triX = Math.abs(((effPhase * bounces * 1.0) % 2) - 1) * 2 - 1;
        const triY = Math.abs(((effPhase * bounces * 0.75 + 0.33) % 2) - 1) * 2 - 1;

        return {
          x: clamp(triX * 0.95, -1, 1),
          y: clamp(triY * 0.95, -1, 1)
        };
      }
    });
  }
}
