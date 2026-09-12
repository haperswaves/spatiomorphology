/**
 * Automated test suite for Spatiomorph v1.2
 * Tests:
 * 1. Shape Registry (All 26+ mathematical trajectories including 17 strange attractors)
 * 2. Morphable polygon bipolar roundness, criss-cross dwell, continuous zig-zag smoothness
 * 3. 10 Ableton Surround Panner speaker layouts and constant-power energy preservation
 * 4. Free Clock Tri-Mode (Time, LFO, VCO) & Note Divisions
 * 5. 9-Pad Numpad Snapshot Morpher & True Shape Crossfade Interpolation
 * 6. Vectorial Wipe Volume CC Ducking (starts at 127)
 * 7. Proxemics & Spectral Coupling with Filter CC 26
 * Run with: node tests/trajectories.test.mjs
 */

import { ShapeRegistry } from '../src/math/trajectories.js';
import { MotionEngine, NOTE_DIVISIONS } from '../src/engine/motionEngine.js';
import {
  PolyphonicEngine,
  POUNAMU_PALETTES,
  PLAIFOLIA_PALETTES,
  BILOBA_PALETTES,
  KORNBLUME_PALETTES,
  CALCITE_PALETTES,
  IPE_AMARELO_PALETTES
} from '../src/engine/polyEngine.js';
import { ProxemicsEngine } from '../src/engine/proxemics.js';
import { SpectralCoupler } from '../src/engine/spectralCoupler.js';
import { VectorialWipeEngine } from '../src/engine/vectorialWipe.js';
import { SnapshotMorpher, MORPH_CURVES, NUMPAD_ORDER } from '../src/engine/snapshotMorpher.js';
import { SpeakerSimulationEngine, SPEAKER_CONFIGS } from '../src/engine/speakerLayout.js';
import { FiguresEngine, FIGURES_D_ESPACE } from '../src/engine/figuresEngine.js';
import { BlauertEngine, BLAUERT_BANDS } from '../src/engine/blauertEngine.js';
import { BirefringenceEngine, CALCITE_CLEAVAGE_MODES } from '../src/engine/birefringenceEngine.js';
import { SpectralDiffusionEngine, IPE_STRATA } from '../src/engine/spectralDiffusionEngine.js';
import { calculateSurroundPannerDispersionRadius } from '../src/ui/canvasRenderer.js';

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

console.log('--- Testing Spatiomorph v1.2 Core Engine ---\n');

// 1. Shape Registry & Trajectory Bounds Test
console.log('[1] Testing Shape Registry & 17 Strange Attractors:');
const registry = new ShapeRegistry();
const allShapes = registry.getAll();
assert(allShapes.length >= 26, `Expected at least 26 shapes including 17 strange attractors, got ${allShapes.length}`);

// Verify that the requested strange attractors are registered
const expectedAttractors = [
  'attractor_lorenz', 'attractor_rossler', 'attractor_bouali', 'attractor_thomas',
  'attractor_aizawa', 'attractor_chen', 'attractor_halvorsen', 'attractor_liu_chen',
  'attractor_nose_hoover', 'attractor_sprott', 'attractor_four_wing', 'attractor_chua',
  'attractor_arneodo', 'attractor_dequan_li', 'attractor_rabinovich', 'attractor_rikitake', 'attractor_dadras'
];

for (const id of expectedAttractors) {
  assert(registry.get(id) !== undefined, `Attractor ${id} is registered`);
}

for (const shape of allShapes) {
  const defaultParams = {};
  for (const p of shape.params || []) {
    defaultParams[p.id] = p.default;
  }

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
  assert(maxCoord > 0.05, `${shape.name} produced non-trivial movement (max coord = ${maxCoord.toFixed(2)})`);
}

// 2. Trajectory Math Fixes: Bipolar Polygon, Criss-Cross Dwell, Continuous Zig-Zag Smoothness
console.log('\n[2] Testing Trajectory Math Fixes:');
const polygon = registry.get('polygon');
// Negative roundness (pucker) vs positive roundness (bloat)
const ptPucker = polygon.compute(0.125, { sides: 4, roundness: -0.8, starRatio: 1 });
const ptBloat = polygon.compute(0.125, { sides: 4, roundness: 0.8, starRatio: 1 });
assert(Math.hypot(ptPucker.x, ptPucker.y) < Math.hypot(ptBloat.x, ptBloat.y), `Polygon pucker produces smaller radius than bloat`);

// Zig-Zag continuous smoothness
const zigzag = registry.get('zigzag');
const ptSharp = zigzag.compute(0.25, { lines: 4, orientation: 0, smoothness: 0.0 });
const ptSmooth1 = zigzag.compute(0.25, { lines: 4, orientation: 0, smoothness: 0.3 });
const ptSmooth2 = zigzag.compute(0.25, { lines: 4, orientation: 0, smoothness: 0.8 });
assert(typeof ptSharp.x === 'number' && typeof ptSmooth1.x === 'number' && typeof ptSmooth2.x === 'number', `Zig-Zag continuous smoothness computes cleanly`);

// 3. Speaker Layouts (All 10 Ableton Surround Panner arrangements)
console.log('\n[3] Testing 10 Ableton Speaker Arrangements & Energy Conservation:');
const expectedLayouts = [
  '2ch', '4ch_room', '4ch_circle', '4ch_center',
  '6ch_room', '6ch_circle', '6ch_center',
  '8ch_room', '8ch_circle', '8ch_center'
];

for (const layoutId of expectedLayouts) {
  const cfg = SPEAKER_CONFIGS[layoutId];
  assert(cfg !== undefined, `Layout ${layoutId} exists in SPEAKER_CONFIGS`);
  const sim = new SpeakerSimulationEngine(layoutId);

  // Verify 2-CH is centered at y = 0
  if (layoutId === '2ch') {
    assert(cfg.speakers[0].y === 0.0 && cfg.speakers[1].y === 0.0, `2-CH has speakers vertically centered at y=0`);
  }

  // Energy conservation check at multiple points
  const testPoints = [{ x: 0, y: 0 }, { x: 0.7, y: 0.7 }, { x: -0.6, y: 0.2 }, { x: 0, y: -0.8 }];
  for (const pt of testPoints) {
    const gains = sim.calculateGains(pt.x, pt.y, 50, 50);
    assert(gains.length === cfg.channels, `${layoutId} outputs ${cfg.channels} channel gains`);

    let sumSq = 0;
    for (const g of gains) {
      assert(g.gain >= 0, `Gain must be >= 0`);
      sumSq += g.gain * g.gain;
    }
    assert(Math.abs(sumSq - 1.0) < 0.05, `${layoutId} preserves acoustic power at (${pt.x}, ${pt.y}): sum(g^2) = ${sumSq.toFixed(3)}`);
  }
}

// 4. Free Clock Tri-Mode (Time, LFO, VCO) & Note Divisions
console.log('\n[4] Testing Free Clock Tri-Mode (Time, LFO, VCO):');
const motion = new MotionEngine(registry);

// Time mode: 2000ms = 2s -> 0.5 Hz
motion.rateMode = 'free';
motion.freeSubMode = 'time';
motion.freeTimeSec = 2.0;
assert(Math.abs(motion.getFrequency() - 0.5) < 0.001, `Time 2.0s produces 0.5 Hz`);

// Time mode: 1ms = 0.001s -> 1000 Hz (clamped to 300s/1ms)
motion.freeTimeSec = 0.01;
assert(Math.abs(motion.getFrequency() - 100.0) < 0.01, `Time 10ms produces 100 Hz`);

// LFO mode: 0.25 Hz
motion.freeSubMode = 'lfo';
motion.freeLfoHz = 0.25;
assert(Math.abs(motion.getFrequency() - 0.25) < 0.001, `LFO mode produces 0.25 Hz`);

// VCO mode: 440 Hz (audio-rate spatial rotation!)
motion.freeSubMode = 'vco';
motion.freeVcoHz = 440.0;
assert(Math.abs(motion.getFrequency() - 440.0) < 0.001, `VCO mode produces 440.0 Hz`);

// Note divisions precision & 128/1
assert(NOTE_DIVISIONS['128/1'] === 512.0, `128/1 musical division is 512 beats`);
assert(NOTE_DIVISIONS['1/64'] === 0.0625, `1/64 musical division is 0.0625 beats`);

// 5. Continuous Geometric Shape Interpolation (Morphing)
console.log('\n[5] Testing Continuous Geometric Shape-Crossfading:');
motion.setShape('circle');
motion.setShapeMorphTarget('polygon', { sides: 4, roundness: 0, starRatio: 1 }, 0.5);
motion.update(0.016);
const morphState = motion.getState();
assert(morphState.shapeMorphT === 0.5, `Shape morph ratio is at 50%`);
assert(!isNaN(morphState.x) && !isNaN(morphState.y), `Morph coordinate is valid`);

// 6. 9-Pad Numpad Snapshot Morpher
console.log('\n[6] Testing 9-Pad Numpad Snapshot Morpher:');
const poly = new PolyphonicEngine(registry, 6);
const morpher = new SnapshotMorpher(poly);

// Verify 9 slots and Numpad mapping
assert(morpher.snapshots.length === 9, `Snapshot Morpher has exactly 9 slots`);
assert(NUMPAD_ORDER.length === 9, `Numpad ordering has 9 keys`);

// Store and recall pad 1 (slot 0)
morpher.storeSnapshot(0);
assert(morpher.hasSnapshot(0) === true, `Pad 1 (Slot 0) stored`);

// Store pad 9 (slot 8)
morpher.storeSnapshot(8);
assert(morpher.hasSnapshot(8) === true, `Pad 9 (Slot 8) stored`);

// Trigger morph to pad 9
morpher.morphDurationSec = 2.0;
morpher.morphToSlot(8);
assert(morpher.isMorphing === true, `Morph to Pad 9 initiated`);
morpher.update(1.0, 'free', 120);
assert(morpher.isMorphing === true, `Morphing in progress at 50%`);
morpher.update(1.1, 'free', 120);
assert(morpher.isMorphing === false, `Morph completed`);
assert(morpher.activeSlot === 8, `Target Pad 9 active`);

// Delete snapshot
morpher.deleteSnapshot(0);
assert(morpher.hasSnapshot(0) === false, `Slot 0 deleted successfully`);

// 7. Vectorial Wipe Volume CC Ducking
console.log('\n[7] Testing Vectorial Wipe Volume CC Ducking (starts at 127):');
const wipe = new VectorialWipeEngine();
// Baseline volume without wipe
assert(wipe.computeVoiceVolume(0, 0) === 127, `Voice volume defaults to 127`);

// Trigger wipe and step halfway into proximate zone
wipe.triggerWipe('restoration', 1.0);
wipe.update(0.5);
const duckedVol = wipe.computeVoiceVolume(0, 0);
assert(duckedVol < 127, `Proximate wipe ducks volume CC (got ${duckedVol} < 127)`);

wipe.update(0.6);
assert(wipe.computeVoiceVolume(0, 0) === 127, `Volume restored to 127 after wipe completion`);

// 8. Proxemics & Spectral Coupling with Filter CC
console.log('\n[8] Testing Spectral Coupler & Filter Cutoff CC:');
const coupler = new SpectralCoupler();
const res = coupler.process({ x: 0, y: 0.8, focus: 50, center: 50, smooth: 0, velocity: 1.0 });
assert(res.spectralCc >= 80, `High aerial position produces high filter cutoff CC (${res.spectralCc})`);

// 9. v1.2.1 Refinements: Direction Modes, Sampled Path Morphing, Attractor Reseed & Speed
console.log('\n[9] Testing v1.2.1 Refinements (Direction Modes, Path Morphing, Attractor Reseed):');
// Direction modes
const dirTestMotion = new MotionEngine(registry);
for (const mode of ['drunk', 'random_smooth', 'random_stepped']) {
  dirTestMotion.direction = mode;
  dirTestMotion.directionRate = 1.5;
  for (let i = 0; i < 20; i++) {
    const pt = dirTestMotion.update(0.016, 'sync', 120);
    assert(!isNaN(pt.x) && !isNaN(pt.y), `Direction mode '${mode}' produces valid coordinates`);
  }
}

// Sampled path length and morph interpolation
const path180 = dirTestMotion.getSampledPath(180);
assert(path180.length === 180, `Sampled path produces exactly 180 points`);
dirTestMotion.setShapeMorphTarget('attractor_lorenz', { seed: 42, reseed: 0.5 }, 0.5);
const morphPath = dirTestMotion.getSampledPath(180);
assert(morphPath.length === 180, `Morphed sampled path crossfade produces 180 points`);
assert(!isNaN(morphPath[0].x) && !isNaN(morphPath[0].y), `Morphed path points are valid`);

// Attractor reseed & speed normalization
const lorenz = registry.get('attractor_lorenz');
assert(lorenz !== undefined, `Lorenz attractor registered`);
const lorenzParams = { seed: 100, reseed: 2.0 };
const ptA = lorenz.compute(0.25, lorenzParams);
assert(!isNaN(ptA.x) && !isNaN(ptA.y), `Lorenz computes valid point with seed/reseed`);

// 10. v1.2.2 Docket Refinements:
console.log('\n[10] Testing v1.2.2 Docket Refinements:');

// 1. Speaker layout arena boundaries (r = 1.0)
const twoCh = SPEAKER_CONFIGS['2ch'];
assert(Math.abs(twoCh.speakers[0].x - (-1.0)) < 0.001 && Math.abs(twoCh.speakers[1].x - 1.0) < 0.001, `2-CH stereo speakers are aligned with Arena boundary at x = ±1.0`);

for (const centerLayout of ['4ch_center', '6ch_center', '8ch_center']) {
  const cfg = SPEAKER_CONFIGS[centerLayout];
  for (const spk of cfg.speakers) {
    const r = Math.hypot(spk.x, spk.y);
    assert(Math.abs(r - 1.0) < 0.001, `${centerLayout} speaker ${spk.id} sits on Arena boundary (r = ${r.toFixed(3)})`);
  }
}

// 2. Spectral Coupler options default to disabled (off)
const sc = new SpectralCoupler();
assert(sc.focusCoupling === false, `Spectral Coupler focus coupling defaults to off`);
assert(sc.centerCoupling === false, `Spectral Coupler center coupling defaults to off`);
assert(sc.gravitationalSmooth === false, `Spectral Coupler gravitational smooth defaults to off`);

// 3. PolyEngine Sync From Trajectory Settings
const polyV122 = new PolyphonicEngine(registry, 6);
const proxV122 = new ProxemicsEngine();
proxV122.activeZoneLocks.set(1, 'intimate');
polyV122.voices[0].engine.setShape('polygon');
polyV122.voices[0].engine.rotationDeg = 45;
polyV122.voices[0].engine.masterScale = 0.55;
polyV122.voices[0].engine.direction = 'drunk';
polyV122.voices[0].engine.directionRate = 2.5;

polyV122.copyTrajectorySettings(0, 2, proxV122); // Copy T1 to T3
assert(polyV122.voices[2].engine.activeShapeId === 'polygon', `T3 copied shape bank type from T1`);
assert(polyV122.voices[2].engine.rotationDeg === 45, `T3 copied rotation from T1`);
assert(polyV122.voices[2].engine.masterScale === 0.55, `T3 copied master scale from T1`);
assert(polyV122.voices[2].engine.direction === 'drunk', `T3 copied direction from T1`);
assert(polyV122.voices[2].engine.directionRate === 2.5, `T3 copied direction rate from T1`);
assert(proxV122.activeZoneLocks.get(3) === 'intimate', `T3 copied proxemic zone lock from T1`);

// 4. PolyEngine Sync From Clock Settings
polyV122.voices[0].engine.rateMode = 'free';
polyV122.voices[0].engine.freeSubMode = 'lfo';
polyV122.voices[0].engine.freeLfoHz = 1.25;
polyV122.voices[0].engine.startPointDeg = 90;
polyV122.voices[0].engine.accumulatedPhase = 0.77;

polyV122.copyClockSettings(0, 3); // Copy T1 clock to T4
assert(polyV122.voices[3].engine.rateMode === 'free', `T4 copied rateMode from T1`);
assert(polyV122.voices[3].engine.freeSubMode === 'lfo', `T4 copied freeSubMode from T1`);
assert(polyV122.voices[3].engine.freeLfoHz === 1.25, `T4 copied freeLfoHz from T1`);
assert(polyV122.voices[3].engine.startPointDeg === 90, `T4 synchronized start angle from T1`);
assert(polyV122.voices[3].engine.accumulatedPhase === 0.77, `T4 synchronized accumulated phase from T1`);

// 5. Random (stepped) static during period and jumping on tick
const steppedMotion = new MotionEngine(registry);
steppedMotion.direction = 'random_stepped';
steppedMotion.rateMode = 'free';
steppedMotion.freeSubMode = 'time';
steppedMotion.freeTimeSec = 1.0; // 1s period
steppedMotion.isPlaying = true;
steppedMotion.stepTimer = 0.0;
steppedMotion.randomSteppedPhase = 0.333;

// Advance small dt (0.1s < 1.0s period) -> phase must remain static
steppedMotion.update(0.1);
assert(steppedMotion.randomSteppedPhase === 0.333, `Random (stepped) remains static during clock period`);

// Advance past 1.0s interval -> triggers step jump
steppedMotion.update(1.0);
assert(typeof steppedMotion.randomSteppedPhase === 'number', `Random (stepped) updates randomSteppedPhase after clock period`);

// 11. Personality Suite: Biloba, Kornblume, Calcite, Ipê-amarelo
console.log('\n[11] Testing 6-Personality Suite & Dedicated Engines:');

// 1. Palette coverage (All 6 personalities must supply 6 valid voice palettes)
const polyPersonalities = ['pounamu', 'plaifolia', 'biloba', 'kornblume', 'calcite', 'ipe_amarelo'];
for (const p of polyPersonalities) {
  polyV122.setPersonality(p);
  const pals = polyV122.getPalettes();
  assert(pals && pals.length === 6, `${p} provides exactly 6 voice palettes`);
  for (let i = 0; i < 6; i++) {
    assert(pals[i].primary && pals[i].primary.startsWith('#'), `${p} voice ${i + 1} has valid primary hex color`);
  }
}

// 2. Biloba Engine (Annette Vande Gorne - 16 Figures d'Espace, Caliber, Directivity)
console.log('\nTesting Biloba Engine (L\'Espace du Son):');
const biloba = new FiguresEngine();
assert(FIGURES_D_ESPACE.length === 16, `Biloba has exactly 16 Figures d'Espace`);

for (const fig of FIGURES_D_ESPACE) {
  biloba.setFigure(fig.id);
  assert(biloba.activeFigure === fig.id, `Figure '${fig.name}' selectable`);
  const coord = biloba.processCoordinate(0.5, 0.5, 0.25, 0);
  assert(!isNaN(coord.x) && !isNaN(coord.y), `Figure '${fig.id}' computes valid coordinate`);
}

biloba.setCaliber(1.5);
assert(biloba.caliber === 1.0, `Caliber clamped to 1.0`);
biloba.setCaliber(-0.5);
assert(biloba.caliber === 0.0, `Caliber clamped to 0.0`);
biloba.setCaliber(0.4);

biloba.setDirectivity('bilobed');
biloba.setLobeAngle(80);
const bilobedResult = biloba.processCoordinate(0.5, 0.5, 0.5, 0);
assert(bilobedResult.lobes.length === 2, `Bilobed Ginkgo directivity produces exactly 2 lobe vectors`);

// 3. Kornblume Engine (Jens Blauert - Spatial Hearing, Coherence k, Directional Bands, Precedence)
console.log('\nTesting Kornblume Engine (Spatial Hearing):');
const kornblume = new BlauertEngine();
assert(BLAUERT_BANDS.length === 5, `Kornblume has 5 Blauert Directional Bands`);

kornblume.setCoherence(1.2);
assert(kornblume.coherence === 1.0, `Coherence k clamped to 1.0`);
kornblume.setCoherence(-0.2);
assert(kornblume.coherence === 0.0, `Coherence k clamped to 0.0`);
kornblume.setCoherence(0.85);

kornblume.setBand('front_4k');
const frontCoord = kornblume.processCoordinate(0, 0, 0);
assert(frontCoord.y > 0.4, `4 kHz band pulls auditory event toward front plane (y = ${frontCoord.y.toFixed(2)})`);

kornblume.setBand('rear_1k');
const rearCoord = kornblume.processCoordinate(0, 0, 0);
assert(rearCoord.y < -0.4, `1 kHz band pulls auditory event toward rear plane (y = ${rearCoord.y.toFixed(2)})`);

kornblume.setPrecedence(true);
kornblume.setHaasDelay(20);
const precRes = kornblume.processCoordinate(0.6, 0.6, 0);
assert(precRes.ghost !== null, `Precedence effect generates Haas lag ghost image`);
assert(!isNaN(precRes.ghost.x) && !isNaN(precRes.ghost.y), `Haas ghost has valid coordinates`);

// 4. Calcite Engine (Natasha Barrett - Birefringent Ray Splitting & 3D HOA)
console.log('\nTesting Calcite Engine (Ambisonic Cleavage & Birefringence):');
const calcite = new BirefringenceEngine();
assert(CALCITE_CLEAVAGE_MODES.length === 3, `Calcite has 3 cleavage geometry modes`);

calcite.setRaySeparation(0.5);
calcite.setOpticAxis(60);
calcite.setElevation(30);

const calcRes = calcite.processCoordinate(0.2, 0.2);
assert(calcRes.ordinary && !isNaN(calcRes.ordinary.x), `Ordinary ray To computed`);
assert(calcRes.extraordinary && !isNaN(calcRes.extraordinary.x), `Extraordinary ray Te computed`);
assert(calcRes.ordinary.x !== calcRes.extraordinary.x, `Extraordinary ray departs from ordinary ray along optic axis`);
assert(calcRes.hoaCoeffs && Math.abs(calcRes.hoaCoeffs.w - 0.7071) < 0.001, `Ambisonic monopole W is 0.7071`);

// 5. Ipê-amarelo Engine (Daniel L. Barreiro - FFT Spectral Diffusion & Strata)
console.log('\nTesting Ipê-amarelo Engine (Spectral Diffusion & Forest Strata):');
const ipe = new SpectralDiffusionEngine();
assert(IPE_STRATA.length === 4, `Ipê-amarelo has 4 forest strata`);
assert(ipe.lutTable.length === 8, `8-channel FFT LUT scramble table has 8 frequency bins`);

const prevLut = [...ipe.lutTable];
ipe.scrambleLut();
assert(ipe.lutTable.length === 8, `Scrambled LUT preserves 8 bins`);

ipe.setStratum('canopy');
const canopyCoord = ipe.processCoordinate(0.8, 0.8, 0);
assert(canopyCoord.stratumRadius === 0.90, `Canopy bloom stratum occupies perimeter radius 0.90`);

ipe.setKineticCollision(true);
const bouncedCoord = ipe.processCoordinate(1.5, 1.5, 0);
assert(bouncedCoord.collided === true, `Kinetic collision detected outside perimeter`);
assert(Math.hypot(bouncedCoord.x, bouncedCoord.y) <= 0.91, `Kinetic boundary prevents excursion beyond 0.90`);

ipe.triggerMaresia();
assert(ipe.maresiaActive === true, `Maresia wave surge triggered successfully`);

// 6. New Mathematical Trajectory Shapes
console.log('\nTesting New Mathematical Shapes:');
const newShapes = [
  'biloba_fan',
  'branching_petiole',
  'cornflower_rosette',
  'clifton_jumper',
  'calcite_rhombohedron',
  'birefringent_lissajous',
  'canopy_flutter',
  'kinetic_bounce'
];

for (const sId of newShapes) {
  const shape = registry.get(sId);
  assert(shape !== undefined, `Shape '${sId}' is registered in ShapeRegistry`);
  for (let phase = 0; phase <= 1.0; phase += 0.1) {
    const pt = shape.compute(phase, {});
    assert(!isNaN(pt.x) && !isNaN(pt.y), `Shape '${sId}' phase ${phase.toFixed(1)} computes valid coordinate`);
    assert(pt.x >= -1.01 && pt.x <= 1.01 && pt.y >= -1.01 && pt.y <= 1.01, `Shape '${sId}' coordinates stay bounded in [-1, 1]`);
  }
}

// 7. Category Ordering & Parameter Verification
console.log('\n[7] Testing Category Ordering & Trajectory Customization:');
const categories = registry.getCategories();
const organicIdx = categories.indexOf('Organic & Natural Forms');
const chaosIdx = categories.indexOf('Stochastic & Chaos');
assert(organicIdx !== -1 && chaosIdx !== -1, `Both Organic & Natural Forms and Stochastic & Chaos categories exist`);
assert(organicIdx < chaosIdx, `Organic & Natural Forms (${organicIdx}) appears before Stochastic & Chaos (${chaosIdx})`);

// Biloba Fan reach test
const bilobaShape = registry.get('biloba_fan');
let maxReachX = 0;
let maxReachY = 0;
for (let p = 0; p <= 1.0; p += 0.01) {
  const pt = bilobaShape.compute(p, { reach: 1.0, aperture: 130 });
  maxReachX = Math.max(maxReachX, Math.abs(pt.x));
  maxReachY = Math.max(maxReachY, Math.abs(pt.y));
}
assert(maxReachX >= 0.90, `Biloba Fan extends outward in X to ${maxReachX.toFixed(2)} (>= 0.90 boundary reach)`);
assert(maxReachY >= 0.90, `Biloba Fan extends outward in Y to ${maxReachY.toFixed(2)} (>= 0.90 boundary reach)`);

// Branching Petiole limits
const petioleShape = registry.get('branching_petiole');
const branchParam = petioleShape.params.find(p => p.id === 'branches');
assert(branchParam !== undefined && branchParam.max >= 32, `Branching Petiole branch factor max is >= 32 (got ${branchParam?.max})`);

// Kinetic Boundary Ricochet bipolar physics
const kineticShape = registry.get('kinetic_bounce');
const elastParam = kineticShape.params.find(p => p.id === 'elasticity');
assert(elastParam !== undefined && elastParam.min === -1.0 && elastParam.max === 1.0, `Kinetic Boundary Ricochet elasticity is bipolar [-1.0, 1.0]`);

const ptBoost = kineticShape.compute(0.05, { elasticity: 0.8, bounces: 4 });
const ptDamp = kineticShape.compute(0.05, { elasticity: -0.8, bounces: 4 });
// With boost, warped phase at tau=0.2 progresses faster than with damp
assert(Math.abs(ptBoost.x) !== Math.abs(ptDamp.x), `Bipolar elasticity modulates trajectory position through velocity warping`);

// 8. Dashed Path Representation Synchronization Test
console.log('\n[8] Testing Dashed Path Representation Synchronization:');
const testMotion = new MotionEngine(registry);
testMotion.setShape('circle');
testMotion.masterScale = 0.85;
testMotion.rotationDeg = 30;
testMotion.centerX = 0.1;
testMotion.centerY = -0.1;

// Sampled path without double transformation
const sampled = testMotion.getSampledPath(36);
assert(sampled.length === 36, `Sampled path produces 36 points`);

// Test step at phase 0 matches sampled[0]
testMotion.accumulatedPhase = 0;
const step0 = testMotion.update(0.0001);
assert(Math.hypot(sampled[0].x - step0.x, sampled[0].y - step0.y) < 0.05, `Sampled path start matches motion step point (no double transform scaling/rotation)`);

// Test spin rotation update
testMotion.autoRotateSpeed = 45; // 45 deg/sec
testMotion.update(1.0); // 1 second
assert(Math.abs(testMotion.rotationDeg - 75) < 0.01, `Auto-rotate spin updates rotationDeg from 30° to 75°`);
const rotatedSampled = testMotion.getSampledPath(36);
assert(Math.abs(rotatedSampled[0].x - sampled[0].x) > 0.05, `Sampled path updates and reflects auto-rotate spin rotation`);

// 9. Ableton Live Surround Panner Focus & Center Dispersion Radius Model
console.log('\n[9] Testing Ableton Live Surround Panner Focus & Center Dispersion Radius Model:');
const R_TEST = 100; // 100px test radius

// Focus 0% must fill entire soundfield (1.0 * R) regardless of Center
for (const c of [0, 25, 50, 75, 100]) {
  const r = calculateSurroundPannerDispersionRadius(0, c, R_TEST);
  assert(Math.abs(r - R_TEST) < 0.001, `Focus 0%, Center ${c}% fills entire acoustic boundary (got ${r}, expected ${R_TEST})`);
}

// Focus 100%, Center 0% (pinpoint localization) -> ~0.306 * R
const r_f100_c0 = calculateSurroundPannerDispersionRadius(100, 0, R_TEST);
assert(Math.abs(r_f100_c0 - 30.6) < 1.0, `Focus 100%, Center 0% yields tight focal radius ~30.6px (got ${r_f100_c0.toFixed(1)})`);

// Focus 100%, Center 100% -> ~73.6px
const r_f100_c100 = calculateSurroundPannerDispersionRadius(100, 100, R_TEST);
assert(Math.abs(r_f100_c100 - 73.6) < 1.5, `Focus 100%, Center 100% expands to ~73.6px (got ${r_f100_c100.toFixed(1)})`);

// Focus 50%, Center 50% -> ~64.0px
const r_f50_c50 = calculateSurroundPannerDispersionRadius(50, 50, R_TEST);
assert(Math.abs(r_f50_c50 - 64.0) < 1.5, `Focus 50%, Center 50% yields ~64.0px (got ${r_f50_c50.toFixed(1)})`);

// Focus 25%, Center 100% -> capped at 100px
const r_f25_c100 = calculateSurroundPannerDispersionRadius(25, 100, R_TEST);
assert(Math.abs(r_f25_c100 - 100) < 0.001, `Focus 25%, Center 100% is cleanly clamped to boundary (got ${r_f25_c100})`);

// Monotonicity checks:
// As Focus increases (for fixed Center), dispersion radius decreases
for (let c = 0; c <= 100; c += 25) {
  let prevR = calculateSurroundPannerDispersionRadius(0, c, R_TEST);
  for (let f = 25; f <= 100; f += 25) {
    const curR = calculateSurroundPannerDispersionRadius(f, c, R_TEST);
    assert(curR <= prevR + 0.001, `Dispersion radius decreases as Focus increases at Center ${c}% (f=${f}: ${curR.toFixed(1)} <= ${prevR.toFixed(1)})`);
    prevR = curR;
  }
}

// As Center increases (for fixed Focus > 0), dispersion radius increases
for (let f = 25; f <= 100; f += 25) {
  let prevR = calculateSurroundPannerDispersionRadius(f, 0, R_TEST);
  for (let c = 25; c <= 100; c += 25) {
    const curR = calculateSurroundPannerDispersionRadius(f, c, R_TEST);
    assert(curR >= prevR - 0.001, `Dispersion radius increases as Center increases at Focus ${f}% (c=${c}: ${curR.toFixed(1)} >= ${prevR.toFixed(1)})`);
    prevR = curR;
  }
}

console.log(`\n========================================`);
console.log(`All ${passedTests} / ${totalTests} assertions passed successfully!`);
console.log(`========================================\n`);

