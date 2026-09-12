/**
 * Spatiomorph - Motion & Transport Engine
 * Governs phase accumulation, clocking (Sync vs. Free: Time / LFO / VCO),
 * direction modes, spatial transformation, and true shape-interpolation morphing.
 */

export const NOTE_DIVISIONS = {
  '1/64': 0.0625,
  '1/32': 0.125,
  '1/16T': 1 / 6,
  '1/16': 0.25,
  '1/16D': 0.375,
  '1/8T': 1 / 3,
  '1/8': 0.5,
  '1/8D': 0.75,
  '1/4T': 2 / 3,
  '1/4': 1.0,
  '1/4D': 1.5,
  '1/2T': 4 / 3,
  '1/2': 2.0,
  '1/2D': 3.0,
  '1/1': 4.0,
  '2/1': 8.0,
  '4/1': 16.0,
  '8/1': 32.0,
  '16/1': 64.0,
  '32/1': 128.0,
  '64/1': 256.0,
  '128/1': 512.0
};

export class MotionEngine {
  constructor(shapeRegistry) {
    this.shapeRegistry = shapeRegistry;

    // Transport state
    this.isPlaying = true;
    this.currentTime = 0; // seconds
    this.accumulatedPhase = 0; // 0.0 to infinity

    // Clock settings
    this.rateMode = 'sync'; // 'sync' | 'free'
    this.freeSubMode = 'lfo'; // 'time' | 'lfo' | 'vco'
    this.bpm = 120.0;
    this.noteDivision = '1/1'; // 1 bar default

    // Free rate values
    this.freeTimeSec = 2.0;   // 0.001s (1ms) to 300s
    this.freeLfoHz = 0.5;     // 0.001 Hz to 2.0 Hz
    this.freeVcoHz = 30.0;    // 1.0 Hz to 600.0 Hz

    // Motion settings
    this.direction = 'cw'; // 'cw' | 'ccw' | 'pingpong' | 'drunk' | 'random_stepped' | 'random_smooth'
    this.directionRate = 1.0; // Drunkenness (drunk) or Teleportation Rate (random_smooth)
    this.reseedRate = 0.0;    // Continuous reseed rate (0 = no movement)
    this.drunkPhase = 0.5;
    this.drunkDir = 1;        // +1 (CW) or -1 (CCW)
    this.drunkTimer = 0.0;
    this.randomSmoothPhase = 0.5;
    this.randomSmoothDir = 1; // +1 (CW) or -1 (CCW)
    this.teleportTimer = 0.0;
    this.randomSteppedPhase = 0.0;
    this.stepTimer = 0.0;

    this.phaseOffsetDeg = 0.0; // 0 to 360
    this.startPointDeg = 0.0; // 0 to 360

    // Spatial Transform
    this.masterScale = 1.0;
    this.scaleX = 1.0;
    this.scaleY = 1.0;
    this.centerX = 0.0;
    this.centerY = 0.0;

    // Surround Panner Target Parameters (Ableton Defaults)
    this.rotationDeg = 0.0; // -180 to +180
    this.autoRotateSpeed = 0.0; // degrees per second
    this.focus = 50;  // 0 to 100% (Ableton default 50%)
    this.center = 50; // 0 to 100% (Ableton default 50%)
    this.smooth = 0;  // 0 to 100% (Default 0% for accurate time-based movement)

    // Active Shape & Target Morph Shape (for continuous topological interpolation)
    this.activeShapeId = 'circle';
    this.shapeParams = {};
    this.targetShapeId = null;
    this.targetShapeParams = null;
    this.shapeMorphT = 0.0; // 0.0 = activeShapeId, 1.0 = targetShapeId

    // Filtered / Smoothed State
    this.currentX = 0.0;
    this.currentY = 0.0;
    this.rawX = 0.0;
    this.rawY = 0.0;
    this.lastX = 0.0;
    this.lastY = 0.0;
    this.velocity = 0.0;

    this.initDefaultShapeParams();
  }

  get phase() {
    return this.accumulatedPhase % 1.0;
  }

  initDefaultShapeParams() {
    const shape = this.shapeRegistry.get(this.activeShapeId);
    if (shape && shape.params) {
      this.shapeParams = {};
      for (const p of shape.params) {
        this.shapeParams[p.id] = p.default;
      }
    }
  }

  setShape(shapeId) {
    if (this.shapeRegistry.get(shapeId)) {
      this.activeShapeId = shapeId;
      this.initDefaultShapeParams();
    }
  }

  setShapeMorphTarget(targetId, targetParams, morphT) {
    this.targetShapeId = targetId;
    this.targetShapeParams = targetParams;
    this.shapeMorphT = Math.max(0, Math.min(1, morphT));
  }

  clearShapeMorph() {
    if (this.targetShapeId && this.shapeMorphT >= 1.0) {
      this.activeShapeId = this.targetShapeId;
      this.shapeParams = { ...this.targetShapeParams };
    }
    this.targetShapeId = null;
    this.targetShapeParams = null;
    this.shapeMorphT = 0.0;
  }

  getFrequency() {
    if (this.rateMode === 'free') {
      if (this.freeSubMode === 'time') {
        const period = Math.max(0.001, Math.min(300, this.freeTimeSec));
        return 1.0 / period;
      } else if (this.freeSubMode === 'vco') {
        return Math.max(1.0, Math.min(600.0, this.freeVcoHz));
      } else {
        // LFO
        return Math.max(0.001, Math.min(2.0, this.freeLfoHz));
      }
    } else {
      const beats = NOTE_DIVISIONS[this.noteDivision] || 4.0;
      const secondsPerBeat = 60.0 / Math.max(20, this.bpm);
      const period = beats * secondsPerBeat;
      return 1.0 / period;
    }
  }

  getEffectivePhase(normPhase) {
    let p = 0;
    if (this.direction === 'drunk') {
      p = this.drunkPhase + this.phaseOffsetDeg / 360.0 + this.startPointDeg / 360.0;
    } else if (this.direction === 'random_smooth') {
      p = this.randomSmoothPhase + this.phaseOffsetDeg / 360.0 + this.startPointDeg / 360.0;
    } else if (this.direction === 'random_stepped') {
      p = this.randomSteppedPhase + this.phaseOffsetDeg / 360.0 + this.startPointDeg / 360.0;
    } else if (this.direction === 'ccw') {
      const base = normPhase + this.phaseOffsetDeg / 360.0 + this.startPointDeg / 360.0;
      p = 1.0 - (((base % 1.0) + 1.0) % 1.0);
    } else if (this.direction === 'pingpong') {
      const base = (((normPhase + this.phaseOffsetDeg / 360.0 + this.startPointDeg / 360.0) % 1.0) + 1.0) % 1.0;
      const doubled = (base * 2) % 2.0;
      p = doubled <= 1.0 ? doubled : 2.0 - doubled;
    } else {
      // cw
      p = normPhase + this.phaseOffsetDeg / 360.0 + this.startPointDeg / 360.0;
    }
    return ((p % 1.0) + 1.0) % 1.0;
  }

  update(dt) {
    if (dt <= 0) return this.getState();

    // Auto-rotate spin
    if (this.autoRotateSpeed !== 0) {
      this.rotationDeg = (this.rotationDeg + this.autoRotateSpeed * dt) % 360;
      if (this.rotationDeg > 180) this.rotationDeg -= 360;
      if (this.rotationDeg < -180) this.rotationDeg += 360;
    }

    if (this.isPlaying) {
      const freq = this.getFrequency();
      this.accumulatedPhase += freq * dt;
      this.currentTime += dt;

      // Update Drunk, Random with Motion, and Random Stepped phases
      if (this.direction === 'drunk') {
        // Coinflips occur based on Drunkenness (directionRate)
        this.drunkTimer += dt;
        const coinflipInterval = 1.0 / Math.max(0.05, this.directionRate * 2.0);
        if (this.drunkTimer >= coinflipInterval) {
          this.drunkTimer = 0.0;
          this.drunkDir = Math.random() < 0.5 ? 1 : -1;
        }
        // Moves at Temporal Clock & Rate (freq * dt) in the drunkDir direction
        this.drunkPhase = ((this.drunkPhase + this.drunkDir * freq * dt) % 1.0 + 1.0) % 1.0;
      } else if (this.direction === 'random_smooth') {
        // Random with Motion: forward CW/CCW motion respecting Temporal Clock & Rate,
        // periodically teleports to another point and randomly chooses direction (CW or CCW)
        this.teleportTimer += dt;
        const teleportInterval = 2.0 / Math.max(0.1, this.directionRate);
        if (this.teleportTimer >= teleportInterval) {
          this.teleportTimer = 0.0;
          this.randomSmoothPhase = Math.random();
          this.randomSmoothDir = Math.random() < 0.5 ? 1 : -1;
        }
        this.randomSmoothPhase = ((this.randomSmoothPhase + this.randomSmoothDir * freq * dt) % 1.0 + 1.0) % 1.0;
      } else if (this.direction === 'random_stepped') {
        // Random: static on path, jumping to another point in time with Temporal Clock & Rate
        this.stepTimer += dt;
        const interval = 1.0 / Math.max(0.001, freq);
        if (this.stepTimer >= interval) {
          this.stepTimer = this.stepTimer % interval;
          this.randomSteppedPhase = Math.random();
        }
      }

      // Continuous Reseed advancement if reseed > 0
      const curReseed = this.shapeParams.reseed !== undefined ? this.shapeParams.reseed : this.reseedRate;
      if (curReseed > 0 && this.shapeParams.seed !== undefined) {
        this.shapeParams.seed = ((this.shapeParams.seed - 1 + curReseed * Math.max(0.1, freq) * dt * 8) % 999) + 1;
      }
    }

    const normPhase = this.accumulatedPhase % 1.0;
    const effectivePhase = this.getEffectivePhase(normPhase);

    // 1. Compute Base Shape Point
    const shapeA = this.shapeRegistry.get(this.activeShapeId);
    let ptA = shapeA ? shapeA.compute(effectivePhase, this.shapeParams) : { x: 0, y: 0 };

    // 2. Continuous Geometric Shape Interpolation (Morphing)
    let pt = ptA;
    if (this.targetShapeId && this.shapeMorphT > 0) {
      const shapeB = this.shapeRegistry.get(this.targetShapeId);
      if (shapeB) {
        const ptB = shapeB.compute(effectivePhase, this.targetShapeParams || this.shapeParams);
        pt = {
          x: ptA.x + (ptB.x - ptA.x) * this.shapeMorphT,
          y: ptA.y + (ptB.y - ptA.y) * this.shapeMorphT
        };
      }
    }

    // Apply Scaling
    let sx = pt.x * this.scaleX * this.masterScale;
    let sy = pt.y * this.scaleY * this.masterScale;

    // Apply Surround Panner Rotation
    const rotRad = (this.rotationDeg * Math.PI) / 180.0;
    const cosR = Math.cos(rotRad);
    const sinR = Math.sin(rotRad);
    const rx = sx * cosR - sy * sinR;
    const ry = sx * sinR + sy * cosR;

    // Apply Center Offset
    this.rawX = clamp(rx + this.centerX, -1.0, 1.0);
    this.rawY = clamp(ry + this.centerY, -1.0, 1.0);

    // Smooth Lag Filter (Smooth = 0 -> instantaneous exact trajectory)
    if (this.smooth <= 0.01) {
      this.currentX = this.rawX;
      this.currentY = this.rawY;
    } else {
      const tau = 0.001 + Math.pow(this.smooth / 100.0, 2) * 0.8;
      const alpha = 1.0 - Math.exp(-dt / tau);
      this.lastX = this.currentX;
      this.lastY = this.currentY;
      this.currentX += alpha * (this.rawX - this.currentX);
      this.currentY += alpha * (this.rawY - this.currentY);
    }

    // Velocity magnitude
    const dx = this.currentX - (this.lastX || this.currentX);
    const dy = this.currentY - (this.lastY || this.currentY);
    this.velocity = Math.sqrt(dx * dx + dy * dy) / Math.max(0.001, dt);
    this.lastX = this.currentX;
    this.lastY = this.currentY;

    return this.getState();
  }

  getState() {
    return {
      x: this.currentX,
      y: this.currentY,
      rawX: this.rawX,
      rawY: this.rawY,
      rotationDeg: this.rotationDeg,
      focus: this.focus,
      center: this.center,
      smooth: this.smooth,
      phase: this.accumulatedPhase % 1.0,
      effectivePhase: this.getEffectivePhase(this.accumulatedPhase % 1.0),
      frequencyHz: this.getFrequency(),
      velocity: this.velocity,
      isPlaying: this.isPlaying,
      activeShapeId: this.activeShapeId,
      shapeParams: { ...this.shapeParams },
      targetShapeId: this.targetShapeId,
      shapeMorphT: this.shapeMorphT,
      direction: this.direction,
      directionRate: this.directionRate,
      reseedRate: this.reseedRate
    };
  }

  getSampledPath(samples = 180) {
    const shapeA = this.shapeRegistry.get(this.activeShapeId);
    if (!shapeA) return [];

    const shapeB = (this.targetShapeId && this.shapeMorphT > 0) ? this.shapeRegistry.get(this.targetShapeId) : null;
    const t = this.shapeMorphT;
    const rawPoints = [];

    for (let i = 0; i < samples; i++) {
      const normPhase = i / samples;
      const effPhase = this.getEffectivePhase(normPhase);
      const ptA = shapeA.compute(effPhase, this.shapeParams) || { x: 0, y: 0 };
      if (shapeB) {
        const ptB = shapeB.compute(effPhase, this.targetShapeParams || this.shapeParams) || { x: 0, y: 0 };
        rawPoints.push({
          x: ptA.x + (ptB.x - ptA.x) * t,
          y: ptA.y + (ptB.y - ptA.y) * t
        });
      } else {
        rawPoints.push(ptA);
      }
    }

    return this.transformPoints(rawPoints);
  }

  transformPoints(points) {
    const rotRad = (this.rotationDeg * Math.PI) / 180.0;
    const cosR = Math.cos(rotRad);
    const sinR = Math.sin(rotRad);

    return points.map(pt => {
      const sx = pt.x * this.scaleX * this.masterScale;
      const sy = pt.y * this.scaleY * this.masterScale;
      const rx = sx * cosR - sy * sinR;
      const ry = sx * sinR + sy * cosR;
      return {
        x: clamp(rx + this.centerX, -1.0, 1.0),
        y: clamp(ry + this.centerY, -1.0, 1.0)
      };
    });
  }
}

function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val));
}
