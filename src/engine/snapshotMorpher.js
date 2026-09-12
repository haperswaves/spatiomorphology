/**
 * Spatiomorph - Snapshot Morpher (9-Pad Numpad Matrix)
 * Manages 9 snapshot slots mapped to Numpad 1..9 layout:
 * [ 7 ] [ 8 ] [ 9 ]
 * [ 4 ] [ 5 ] [ 6 ]
 * [ 1 ] [ 2 ] [ 3 ]
 * Performs continuous mathematical parameter and geometric shape interpolation
 * across linear, logarithmic, exponential, and s-curves.
 */

import { NOTE_DIVISIONS } from './motionEngine.js';

export const MORPH_CURVES = {
  scurve: {
    id: 'scurve',
    name: 'S-Curve (Smoothstep)',
    fn: (t) => {
      const c = Math.max(0, Math.min(1, t));
      return c * c * (3 - 2 * c);
    }
  },
  linear: {
    id: 'linear',
    name: 'Linear (Constant Velocity)',
    fn: (t) => Math.max(0, Math.min(1, t))
  },
  logarithmic: {
    id: 'logarithmic',
    name: 'Logarithmic (Ease-Out)',
    fn: (t) => Math.sin((Math.max(0, Math.min(1, t)) * Math.PI) / 2)
  },
  exponential: {
    id: 'exponential',
    name: 'Exponential (Ease-In)',
    fn: (t) => 1 - Math.cos((Math.max(0, Math.min(1, t)) * Math.PI) / 2)
  }
};

// Numpad row ordering: Row 1 = [7, 8, 9], Row 2 = [4, 5, 6], Row 3 = [1, 2, 3]
export const NUMPAD_ORDER = [7, 8, 9, 4, 5, 6, 1, 2, 3];

export class SnapshotMorpher {
  constructor(polyEngine) {
    this.polyEngine = polyEngine;

    // 9 snapshot slots: index 0..8 corresponds to numpad 1..9 (slotIndex = numpadKey - 1)
    this.snapshots = new Array(9).fill(null);
    this.activeSlot = -1;
    this.targetSlot = -1;

    // Morph Timing Settings
    this.morphDurationSec = 5.0; // 0.1s to 300s when clock is free
    this.morphDivision = '4/1';  // 1/64 to 128/1 when clock is beat-synced
    this.morphCurve = 'scurve';

    // Runtime Morph State
    this.isMorphing = false;
    this.morphProgress = 0.0; // 0.0 to 1.0
    this.morphStartSnapshot = null;
    this.morphTargetSnapshot = null;
  }

  // Get Numpad key number (1..9) for 0-indexed slot
  getNumpadKey(slotIndex) {
    return slotIndex + 1;
  }

  // Capture current state of all voices into a snapshot
  captureState() {
    const voicesData = this.polyEngine.voices.map(v => {
      const e = v.engine;
      return {
        active: v.active,
        muted: v.muted,
        shapeId: e.activeShapeId,
        shapeParams: { ...e.shapeParams },
        rateMode: e.rateMode,
        freeSubMode: e.freeSubMode,
        bpm: e.bpm,
        noteDivision: e.noteDivision,
        freeTimeSec: e.freeTimeSec,
        freeLfoHz: e.freeLfoHz,
        freeVcoHz: e.freeVcoHz,
        direction: e.direction,
        phaseOffsetDeg: e.phaseOffsetDeg,
        startPointDeg: e.startPointDeg,
        masterScale: e.masterScale,
        scaleX: e.scaleX,
        scaleY: e.scaleY,
        centerX: e.centerX,
        centerY: e.centerY,
        rotationDeg: e.rotationDeg,
        autoRotateSpeed: e.autoRotateSpeed,
        focus: e.focus,
        center: e.center,
        smooth: e.smooth
      };
    });

    return {
      timestamp: Date.now(),
      voices: voicesData
    };
  }

  storeSnapshot(slotIndex) {
    if (slotIndex >= 0 && slotIndex < 9) {
      this.snapshots[slotIndex] = this.captureState();
      this.activeSlot = slotIndex;
    }
  }

  deleteSnapshot(slotIndex) {
    if (slotIndex >= 0 && slotIndex < 9) {
      this.snapshots[slotIndex] = null;
      if (this.activeSlot === slotIndex) this.activeSlot = -1;
    }
  }

  hasSnapshot(slotIndex) {
    return slotIndex >= 0 && slotIndex < 9 && !!this.snapshots[slotIndex];
  }

  // Instant Recall without morphing
  recallSnapshot(slotIndex) {
    if (!this.hasSnapshot(slotIndex)) return;

    const snap = this.snapshots[slotIndex];
    snap.voices.forEach((sv, i) => {
      const v = this.polyEngine.voices[i];
      if (!v || !sv) return;
      v.active = sv.active;
      v.muted = sv.muted;
      const e = v.engine;
      e.setShape(sv.shapeId);
      e.shapeParams = { ...sv.shapeParams };
      e.rateMode = sv.rateMode;
      e.freeSubMode = sv.freeSubMode || 'lfo';
      e.bpm = sv.bpm;
      e.noteDivision = sv.noteDivision;
      e.freeTimeSec = sv.freeTimeSec || 2.0;
      e.freeLfoHz = sv.freeLfoHz || 0.5;
      e.freeVcoHz = sv.freeVcoHz || 30.0;
      e.direction = sv.direction;
      e.phaseOffsetDeg = sv.phaseOffsetDeg;
      e.startPointDeg = sv.startPointDeg;
      e.masterScale = sv.masterScale;
      e.scaleX = sv.scaleX;
      e.scaleY = sv.scaleY;
      e.centerX = sv.centerX;
      e.centerY = sv.centerY;
      e.rotationDeg = sv.rotationDeg;
      e.autoRotateSpeed = sv.autoRotateSpeed;
      e.focus = sv.focus;
      e.center = sv.center;
      e.smooth = sv.smooth;
      e.clearShapeMorph();
    });

    this.activeSlot = slotIndex;
    this.targetSlot = -1;
    this.isMorphing = false;
  }

  // Start smooth morph to target slot
  morphToSlot(targetIndex) {
    if (!this.hasSnapshot(targetIndex)) return;

    this.morphStartSnapshot = this.captureState();
    this.morphTargetSnapshot = this.snapshots[targetIndex];
    this.targetSlot = targetIndex;
    this.isMorphing = true;
    this.morphProgress = 0.0;
  }

  getEffectiveDuration(clockRateMode = 'free', masterBpm = 120) {
    if (clockRateMode === 'free') {
      return Math.max(0.1, Math.min(300.0, this.morphDurationSec));
    } else {
      const beats = NOTE_DIVISIONS[this.morphDivision] || 4.0;
      const secondsPerBeat = 60.0 / Math.max(20, masterBpm);
      return beats * secondsPerBeat;
    }
  }

  update(dt, clockRateMode = 'free', masterBpm = 120) {
    if (!this.isMorphing || !this.morphTargetSnapshot) {
      return {
        isMorphing: false,
        progress: 0.0,
        activeSlot: this.activeSlot,
        targetSlot: this.targetSlot
      };
    }

    const duration = this.getEffectiveDuration(clockRateMode, masterBpm);
    this.morphProgress += dt / duration;

    const rawT = Math.min(1.0, this.morphProgress);
    const curveFn = MORPH_CURVES[this.morphCurve]?.fn || MORPH_CURVES.scurve.fn;
    const curvedT = curveFn(rawT);

    const startVoices = this.morphStartSnapshot.voices;
    const targetVoices = this.morphTargetSnapshot.voices;

    for (let i = 0; i < this.polyEngine.maxVoices; i++) {
      const sv = startVoices[i];
      const tv = targetVoices[i];
      const v = this.polyEngine.voices[i];
      const e = v.engine;

      if (!sv || !tv) continue;

      // 1. Continuous Float Interpolation
      e.masterScale = lerp(sv.masterScale, tv.masterScale, curvedT);
      e.scaleX = lerp(sv.scaleX, tv.scaleX, curvedT);
      e.scaleY = lerp(sv.scaleY, tv.scaleY, curvedT);
      e.centerX = lerp(sv.centerX, tv.centerX, curvedT);
      e.centerY = lerp(sv.centerY, tv.centerY, curvedT);
      e.rotationDeg = lerp(sv.rotationDeg, tv.rotationDeg, curvedT);
      e.autoRotateSpeed = lerp(sv.autoRotateSpeed, tv.autoRotateSpeed, curvedT);
      e.focus = lerp(sv.focus, tv.focus, curvedT);
      e.center = lerp(sv.center, tv.center, curvedT);
      e.smooth = lerp(sv.smooth, tv.smooth, curvedT);
      e.phaseOffsetDeg = lerp(sv.phaseOffsetDeg, tv.phaseOffsetDeg, curvedT);
      e.startPointDeg = lerp(sv.startPointDeg, tv.startPointDeg, curvedT);
      e.freeTimeSec = lerp(sv.freeTimeSec || 2, tv.freeTimeSec || 2, curvedT);
      e.freeLfoHz = lerp(sv.freeLfoHz || 0.5, tv.freeLfoHz || 0.5, curvedT);
      e.freeVcoHz = lerp(sv.freeVcoHz || 30, tv.freeVcoHz || 30, curvedT);

      // 2. Continuous Geometric Shape Interpolation (No snapping!)
      if (sv.shapeId === tv.shapeId) {
        // Same shape: smoothly interpolate parameters
        e.clearShapeMorph();
        for (const [paramKey, startVal] of Object.entries(sv.shapeParams || {})) {
          const endVal = tv.shapeParams?.[paramKey] ?? startVal;
          if (typeof startVal === 'number' && typeof endVal === 'number') {
            e.shapeParams[paramKey] = lerp(startVal, endVal, curvedT);
          }
        }
      } else {
        // Different shapes: crossfade mathematical paths in real time
        e.activeShapeId = sv.shapeId;
        e.shapeParams = { ...sv.shapeParams };
        e.setShapeMorphTarget(tv.shapeId, tv.shapeParams, curvedT);
      }

      // Discrete states toggle halfway
      if (curvedT >= 0.5) {
        v.active = tv.active;
        v.muted = tv.muted;
        e.direction = tv.direction;
        e.rateMode = tv.rateMode;
        e.freeSubMode = tv.freeSubMode || 'lfo';
        e.noteDivision = tv.noteDivision;
      }
    }

    if (this.morphProgress >= 1.0) {
      this.isMorphing = false;
      this.activeSlot = this.targetSlot;
      this.targetSlot = -1;

      // Finalize all shape morphs to target
      this.polyEngine.voices.forEach(v => v.engine.clearShapeMorph());
    }

    return {
      isMorphing: this.isMorphing,
      progress: rawT,
      activeSlot: this.activeSlot,
      targetSlot: this.targetSlot
    };
  }
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}
