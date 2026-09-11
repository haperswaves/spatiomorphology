/**
 * Automated test suite for Spatiomorphology
 * Run with: node tests/trajectories.test.mjs
 */

import { ShapeRegistry } from '../src/math/trajectories.js';
import { MotionEngine, NOTE_DIVISIONS } from '../src/engine/motionEngine.js';
import { SpeakerSimulationEngine, SPEAKER_CONFIGS } from '../src/engine/speakerLayout.js';

let totalTests = 0;
let passedTests = 0;

function assert(condition, message) {
  totalTests++;
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    throw new Error(message);
  }
  passedTests++;
  console.log(`✅ PASSED: ${message}`);
}

console.log('--- Testing Spatiomorphology Core Engine ---\n');

// 1. Shape Registry & Trajectory Bounds Test
console.log('[1] Testing Shape Registry & Coordinate Bounds:');
const registry = new ShapeRegistry();
const allShapes = registry.getAll();
assert(allShapes.length >= 9, `Expected at least 9 default shapes, got ${allShapes.length}`);

for (const shape of allShapes) {
  const defaultParams = {};
  for (const p of shape.params || []) {
    defaultParams[p.id] = p.default;
  }

  // Sample 200 points along phase [0, 1)
  let maxCoord = 0;
  for (let i = 0; i < 200; i++) {
    const phase = i / 200;
    const pt = shape.compute(phase, defaultParams);
    assert(typeof pt.x === 'number' && !isNaN(pt.x), `${shape.name} phase ${phase} pt.x is NaN`);
    assert(typeof pt.y === 'number' && !isNaN(pt.y), `${shape.name} phase ${phase} pt.y is NaN`);
    assert(pt.x >= -1.0001 && pt.x <= 1.0001, `${shape.name} pt.x ${pt.x} out of bounds [-1, 1]`);
    assert(pt.y >= -1.0001 && pt.y <= 1.0001, `${shape.name} pt.y ${pt.y} out of bounds [-1, 1]`);
    maxCoord = Math.max(maxCoord, Math.abs(pt.x), Math.abs(pt.y));
  }
  assert(maxCoord > 0.1, `${shape.name} produced non-trivial movement (max coord = ${maxCoord.toFixed(2)})`);
}

// 2. Speaker Simulation & Energy Conservation Test
console.log('\n[2] Testing Speaker Layouts & Constant Power Law:');
const layouts = ['stereo', 'quad', 'octophonic'];
for (const layoutId of layouts) {
  const sim = new SpeakerSimulationEngine(layoutId);
  const cfg = SPEAKER_CONFIGS[layoutId];
  assert(sim.layout.channels === cfg.channels, `${layoutId} has correct channel count: ${cfg.channels}`);

  // Test at center (0, 0), front (0, 0.8), right (0.8, 0)
  const testCoords = [
    { x: 0, y: 0 },
    { x: 0, y: 0.8 },
    { x: 0.8, y: 0 },
    { x: -0.5, y: -0.5 }
  ];

  for (const coord of testCoords) {
    const gains = sim.calculateGains(coord.x, coord.y, 100, 50);
    assert(gains.length === cfg.channels, `Gains output length matches channel count`);

    // Sum of squares energy check
    let sumSquares = 0;
    for (const g of gains) {
      assert(g.gain >= 0, `Speaker gain must be non-negative: ${g.gain}`);
      sumSquares += g.gain * g.gain;
    }
    assert(
      Math.abs(sumSquares - 1.0) < 0.05,
      `${layoutId} at (${coord.x}, ${coord.y}) preserves acoustic energy: sum(g^2) = ${sumSquares.toFixed(3)}`
    );
  }
}

// 3. Motion Engine & Tempo Sync Clocking
console.log('\n[3] Testing Motion Engine, Clocking & Smooth Filter:');
const engine = new MotionEngine(registry);
engine.bpm = 120;
engine.noteDivision = '1/1'; // 1 bar = 4 beats = 2.0s at 120bpm
const fSync = engine.getFrequency();
assert(Math.abs(fSync - 0.5) < 0.001, `1 bar at 120 BPM should be 0.5 Hz, got ${fSync}`);

engine.noteDivision = '1/4'; // 1 beat = 0.5s at 120bpm -> 2.0 Hz
const fQuarter = engine.getFrequency();
assert(Math.abs(fQuarter - 2.0) < 0.001, `1/4 note at 120 BPM should be 2.0 Hz, got ${fQuarter}`);

// Test smoothing filter
engine.smooth = 50;
engine.update(0.016);
const state1 = engine.getState();
assert(!isNaN(state1.x) && !isNaN(state1.y), `Engine state coordinates are valid`);

console.log(`\n========================================`);
console.log(`All ${passedTests} / ${totalTests} assertions passed successfully!`);
console.log(`========================================\n`);
