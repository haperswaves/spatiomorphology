/**
 * Spatiomorphology - Motion & Transport Engine
 * Governs phase accumulation, tempo-sync/Hz clocking, direction modes,
 * spatial transformation, and Surround Panner parameter smoothing.
 */

export const NOTE_DIVISIONS = {
  '32/1': 128,
  '16/1': 64,
  '8/1': 32,
  '4/1': 16,
  '2/1': 8,
  '1/1': 4,
  '1/2D': 3,
  '1/2': 2,
  '1/2T': 4 / 3,
  '1/4D': 1.5,
  '1/4': 1,
  '1/4T': 2 / 3,
  '1/8D': 0.75,
  '1/8': 0.5,
  '1/8T': 1 / 3,
  '1/16D': 0.375,
  '1/16': 0.25,
  '1/16T': 1 / 6,
  '1/32': 0.125,
  '1/64': 0.0625
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
    this.bpm = 120.0;
    this.noteDivision = '1/1'; // 1 bar default
    this.freeHz = 0.5; // 0.5 Hz default

    // Motion settings
    this.direction = 'cw'; // 'cw' | 'ccw' | 'pingpong'
    this.phaseOffsetDeg = 0.0; // 0 to 360
    this.startPointDeg = 0.0; // 0 to 360

    // Spatial Transform
    this.masterScale = 0.9;
    this.scaleX = 1.0;
    this.scaleY = 1.0;
    this.centerX = 0.0;
    this.centerY = 0.0;

    // Surround Panner Target Parameters
    this.rotationDeg = 0.0; // -180 to +180
    this.autoRotateSpeed = 0.0; // degrees per second
    this.focus = 100; // 0 to 100%
    this.center = 50; // 0 to 100%
    this.smooth = 15; // 0 to 100%

    // Active Shape
    this.activeShapeId = 'circle';
    this.shapeParams = {};

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

  getFrequency() {
    if (this.rateMode === 'free') {
      return Math.max(0.001, this.freeHz);
    } else {
      const beats = NOTE_DIVISIONS[this.noteDivision] || 4;
      const secondsPerBeat = 60.0 / Math.max(20, this.bpm);
      const period = beats * secondsPerBeat;
      return 1.0 / period;
    }
  }

  getEffectivePhase(normPhase) {
    let p = (normPhase + this.phaseOffsetDeg / 360.0 + this.startPointDeg / 360.0) % 1.0;
    if (p < 0) p += 1.0;

    if (this.direction === 'ccw') {
      return (1.0 - p) % 1.0;
    } else if (this.direction === 'pingpong') {
      // Triangle bounce 0 -> 1 -> 0
      const doubled = (p * 2) % 2.0;
      return doubled <= 1.0 ? doubled : 2.0 - doubled;
    }
    return p;
  }

  update(dt) {
    if (dt <= 0) return this.getState();

    // Auto-rotate panner rotation angle
    if (this.autoRotateSpeed !== 0) {
      this.rotationDeg = (this.rotationDeg + this.autoRotateSpeed * dt) % 360;
      if (this.rotationDeg > 180) this.rotationDeg -= 360;
      if (this.rotationDeg < -180) this.rotationDeg += 360;
    }

    if (this.isPlaying) {
      const freq = this.getFrequency();
      this.accumulatedPhase += freq * dt;
      this.currentTime += dt;
    }

    const normPhase = this.accumulatedPhase % 1.0;
    const effectivePhase = this.getEffectivePhase(normPhase);

    // Compute raw shape point
    const shape = this.shapeRegistry.get(this.activeShapeId);
    let pt = { x: 0, y: 0 };
    if (shape) {
      pt = shape.compute(effectivePhase, this.shapeParams);
    }

    // Apply scaling
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

    // Low-pass exponential smoothing filter for Surround Panner 'Smooth'
    // Smooth 0 = near instant (tau = 0.001s), Smooth 100 = heavy lag (tau = 0.8s)
    const tau = 0.001 + Math.pow(this.smooth / 100.0, 2) * 0.8;
    const alpha = 1.0 - Math.exp(-dt / tau);

    this.lastX = this.currentX;
    this.lastY = this.currentY;

    this.currentX += alpha * (this.rawX - this.currentX);
    this.currentY += alpha * (this.rawY - this.currentY);

    // Velocity magnitude for visual trail physics
    const dx = this.currentX - this.lastX;
    const dy = this.currentY - this.lastY;
    this.velocity = Math.sqrt(dx * dx + dy * dy) / dt;

    return this.getState();
  }

  // Get current state snapshot
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
      shapeParams: { ...this.shapeParams }
    };
  }

  // Transform an array of points through current scale, rotation and center
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
