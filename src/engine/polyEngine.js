/**
 * Spatiomorph - Polyphonic Trajectory Engine
 * Coordinates up to 6 simultaneous spatial trajectories (T1..T6),
 * each with independent math shapes, clocking, and Surround Panner parameters.
 */

import { MotionEngine } from './motionEngine.js';

export const POUNAMU_PALETTES = [
  { id: 1, name: 'Trajectory 1', primary: '#38b000', secondary: '#70e000', glow: 'rgba(56, 176, 0, 0.45)', label: 'T1' },
  { id: 2, name: 'Trajectory 2', primary: '#74c69d', secondary: '#b7efc5', glow: 'rgba(116, 198, 157, 0.45)', label: 'T2' },
  { id: 3, name: 'Trajectory 3', primary: '#1b4332', secondary: '#2d6a4f', glow: 'rgba(45, 106, 79, 0.5)', label: 'T3' },
  { id: 4, name: 'Trajectory 4', primary: '#2ec4b6', secondary: '#cbf3f0', glow: 'rgba(46, 196, 182, 0.45)', label: 'T4' },
  { id: 5, name: 'Trajectory 5', primary: '#e07a5f', secondary: '#f4a261', glow: 'rgba(224, 122, 95, 0.45)', label: 'T5' },
  { id: 6, name: 'Trajectory 6', primary: '#d4a373', secondary: '#faedcd', glow: 'rgba(212, 163, 115, 0.45)', label: 'T6' }
];

export const PLAIFOLIA_PALETTES = [
  { id: 1, name: 'Trajectory 1', primary: '#fde68a', secondary: '#fef3c7', glow: 'rgba(253, 230, 138, 0.5)', label: 'T1' },
  { id: 2, name: 'Trajectory 2', primary: '#84a98c', secondary: '#cad2c5', glow: 'rgba(132, 169, 140, 0.45)', label: 'T2' },
  { id: 3, name: 'Trajectory 3', primary: '#b08968', secondary: '#ddb892', glow: 'rgba(176, 137, 104, 0.45)', label: 'T3' },
  { id: 4, name: 'Trajectory 4', primary: '#f59e0b', secondary: '#fbbf24', glow: 'rgba(245, 158, 11, 0.45)', label: 'T4' },
  { id: 5, name: 'Trajectory 5', primary: '#52796f', secondary: '#84a98c', glow: 'rgba(82, 121, 111, 0.45)', label: 'T5' },
  { id: 6, name: 'Trajectory 6', primary: '#e9d8a6', secondary: '#ee9b00', glow: 'rgba(233, 216, 166, 0.45)', label: 'T6' }
];

export const BILOBA_PALETTES = [
  { id: 1, name: 'Trajectory 1', primary: '#e5a93c', secondary: '#fde047', glow: 'rgba(229, 169, 60, 0.45)', label: 'T1' },
  { id: 2, name: 'Trajectory 2', primary: '#e76f51', secondary: '#f4a261', glow: 'rgba(231, 111, 81, 0.45)', label: 'T2' },
  { id: 3, name: 'Trajectory 3', primary: '#8ab17d', secondary: '#b7efc5', glow: 'rgba(138, 177, 125, 0.45)', label: 'T3' },
  { id: 4, name: 'Trajectory 4', primary: '#cb997e', secondary: '#ddbea9', glow: 'rgba(203, 153, 126, 0.45)', label: 'T4' },
  { id: 5, name: 'Trajectory 5', primary: '#d4a373', secondary: '#faedcd', glow: 'rgba(212, 163, 115, 0.45)', label: 'T5' },
  { id: 6, name: 'Trajectory 6', primary: '#b5838d', secondary: '#e5989b', glow: 'rgba(181, 131, 141, 0.45)', label: 'T6' }
];

export const KORNBLUME_PALETTES = [
  { id: 1, name: 'Trajectory 1', primary: '#3a86ff', secondary: '#90e0ef', glow: 'rgba(58, 134, 255, 0.45)', label: 'T1' },
  { id: 2, name: 'Trajectory 2', primary: '#00f5d4', secondary: '#7bf1a8', glow: 'rgba(0, 245, 212, 0.45)', label: 'T2' },
  { id: 3, name: 'Trajectory 3', primary: '#4361ee', secondary: '#4895ef', glow: 'rgba(67, 97, 238, 0.45)', label: 'T3' },
  { id: 4, name: 'Trajectory 4', primary: '#7209b7', secondary: '#b5179e', glow: 'rgba(114, 9, 183, 0.45)', label: 'T4' },
  { id: 5, name: 'Trajectory 5', primary: '#4cc9f0', secondary: '#caf0f8', glow: 'rgba(76, 201, 240, 0.45)', label: 'T5' },
  { id: 6, name: 'Trajectory 6', primary: '#5e60ce', secondary: '#6930c3', glow: 'rgba(94, 96, 206, 0.45)', label: 'T6' }
];

export const CALCITE_PALETTES = [
  { id: 1, name: 'Trajectory 1', primary: '#48cae4', secondary: '#ade8f4', glow: 'rgba(72, 202, 228, 0.45)', label: 'T1' },
  { id: 2, name: 'Trajectory 2', primary: '#e0e1dd', secondary: '#ffffff', glow: 'rgba(224, 225, 221, 0.45)', label: 'T2' },
  { id: 3, name: 'Trajectory 3', primary: '#778da9', secondary: '#a9d6e5', glow: 'rgba(119, 141, 169, 0.45)', label: 'T3' },
  { id: 4, name: 'Trajectory 4', primary: '#9d4edd', secondary: '#c77dff', glow: 'rgba(157, 78, 221, 0.45)', label: 'T4' },
  { id: 5, name: 'Trajectory 5', primary: '#00b4d8', secondary: '#90e0ef', glow: 'rgba(0, 180, 216, 0.45)', label: 'T5' },
  { id: 6, name: 'Trajectory 6', primary: '#64dfdf', secondary: '#caf0f8', glow: 'rgba(100, 223, 223, 0.45)', label: 'T6' }
];

export const IPE_AMARELO_PALETTES = [
  { id: 1, name: 'Trajectory 1', primary: '#ffbe0b', secondary: '#ffd166', glow: 'rgba(255, 190, 11, 0.45)', label: 'T1' },
  { id: 2, name: 'Trajectory 2', primary: '#fb5607', secondary: '#ff9770', glow: 'rgba(251, 86, 7, 0.45)', label: 'T2' },
  { id: 3, name: 'Trajectory 3', primary: '#588157', secondary: '#a3b18a', glow: 'rgba(88, 129, 87, 0.45)', label: 'T3' },
  { id: 4, name: 'Trajectory 4', primary: '#bc6c25', secondary: '#dda15e', glow: 'rgba(188, 108, 37, 0.45)', label: 'T4' },
  { id: 5, name: 'Trajectory 5', primary: '#800e13', secondary: '#ad2831', glow: 'rgba(128, 14, 19, 0.45)', label: 'T5' },
  { id: 6, name: 'Trajectory 6', primary: '#f4a261', secondary: '#e76f51', glow: 'rgba(244, 162, 97, 0.45)', label: 'T6' }
];

export class PolyphonicEngine {
  constructor(shapeRegistry, maxVoices = 6) {
    this.shapeRegistry = shapeRegistry;
    this.maxVoices = maxVoices;
    this.selectedTrajectoryIndex = 0; // 0..5
    this.personality = 'pounamu'; // 'pounamu' | 'plaifolia' | 'biloba' | 'kornblume' | 'calcite' | 'ipe_amarelo'

    this.voices = [];
    for (let i = 0; i < maxVoices; i++) {
      const engine = new MotionEngine(shapeRegistry);
      if (i > 0) {
        engine.phaseOffsetDeg = (i * 60) % 360;
        engine.masterScale = 1.0;
      }
      this.voices.push({
        id: i + 1,
        active: i === 0,
        muted: false,
        solo: false,
        engine: engine
      });
    }

    if (this.voices[1]) this.voices[1].engine.setShape('lissajous');
    if (this.voices[2]) this.voices[2].engine.setShape('spiral_archimedean');
    if (this.voices[3]) this.voices[3].engine.setShape('vortex');
    if (this.voices[4]) this.voices[4].engine.setShape('criss_cross');
    if (this.voices[5]) this.voices[5].engine.setShape('stochastic_drift');
  }

  getPalettes() {
    switch (this.personality) {
      case 'plaifolia': return PLAIFOLIA_PALETTES;
      case 'biloba': return BILOBA_PALETTES;
      case 'kornblume': return KORNBLUME_PALETTES;
      case 'calcite': return CALCITE_PALETTES;
      case 'ipe_amarelo': return IPE_AMARELO_PALETTES;
      case 'pounamu':
      default:
        return POUNAMU_PALETTES;
    }
  }

  getSelectedTrajectory() {
    return this.voices[this.selectedTrajectoryIndex];
  }

  selectTrajectory(index) {
    if (index >= 0 && index < this.maxVoices) {
      this.selectedTrajectoryIndex = index;
    }
  }

  setPersonality(personality) {
    this.personality = personality;
    if (personality === 'plaifolia') {
      this.voices[0].active = true;
      for (let i = 1; i < this.maxVoices; i++) {
        this.voices[i].active = false;
      }
      this.selectedTrajectoryIndex = 0;
    }
  }

  toggleTrajectoryActive(index) {
    if (index >= 0 && index < this.maxVoices) {
      const activeCount = this.voices.filter(v => v.active).length;
      if (this.voices[index].active && activeCount <= 1) return;
      this.voices[index].active = !this.voices[index].active;
    }
  }

  toggleTrajectoryMute(index) {
    if (index >= 0 && index < this.maxVoices) {
      this.voices[index].muted = !this.voices[index].muted;
    }
  }

  toggleTrajectorySolo(index) {
    if (index >= 0 && index < this.maxVoices) {
      const wasSolo = this.voices[index].solo;
      this.voices.forEach(v => v.solo = false);
      this.voices[index].solo = !wasSolo;
    }
  }

  hasSolo() {
    return this.voices.some(v => v.solo);
  }

  isTrajectoryAudible(index) {
    const v = this.voices[index];
    if (!v.active) return false;
    if (this.hasSolo()) return v.solo;
    return !v.muted;
  }

  update(dt) {
    const states = [];
    const palettes = this.getPalettes();

    for (let i = 0; i < this.maxVoices; i++) {
      const v = this.voices[i];
      const state = v.engine.update(dt);
      const palette = palettes[i];

      states.push({
        id: v.id,
        index: i,
        active: v.active,
        muted: v.muted,
        solo: v.solo,
        audible: this.isTrajectoryAudible(i),
        palette: palette,
        state: state
      });
    }

    return states;
  }

  setAllPlaying(isPlaying) {
    for (const v of this.voices) {
      v.engine.isPlaying = isPlaying;
    }
  }

  resetAllPhase() {
    for (const v of this.voices) {
      v.engine.accumulatedPhase = 0;
      v.engine.currentTime = 0;
    }
  }

  setMasterBpm(bpm) {
    for (const v of this.voices) {
      v.engine.bpm = bpm;
    }
  }

  /**
   * Immediately copy Trajectory bank type, parameters, spatial transformation
   * parameters, and direction & zone parameters from one voice to another.
   */
  copyTrajectorySettings(fromIndex, toIndex, proxemicsEngine = null) {
    if (fromIndex < 0 || fromIndex >= this.maxVoices || toIndex < 0 || toIndex >= this.maxVoices) return;
    const fromVoice = this.voices[fromIndex];
    const toVoice = this.voices[toIndex];
    if (!fromVoice || !toVoice) return;

    const fromE = fromVoice.engine;
    const toE = toVoice.engine;

    // 1. Bank shape & params
    toE.activeShapeId = fromE.activeShapeId;
    toE.shapeParams = JSON.parse(JSON.stringify(fromE.shapeParams));

    // 2. Spatial transformation parameters
    toE.masterScale = fromE.masterScale;
    toE.scaleX = fromE.scaleX;
    toE.scaleY = fromE.scaleY;
    toE.centerX = fromE.centerX;
    toE.centerY = fromE.centerY;
    toE.rotationDeg = fromE.rotationDeg;
    toE.autoRotateSpeed = fromE.autoRotateSpeed;
    toE.focus = fromE.focus;
    toE.center = fromE.center;
    toE.smooth = fromE.smooth;

    // 3. Direction & zone parameters
    toE.direction = fromE.direction;
    toE.directionRate = fromE.directionRate;
    toE.phaseOffsetDeg = fromE.phaseOffsetDeg;
    toE.startPointDeg = fromE.startPointDeg;

    if (proxemicsEngine && proxemicsEngine.activeZoneLocks) {
      const lock = proxemicsEngine.activeZoneLocks.get(fromVoice.id) || 'none';
      proxemicsEngine.activeZoneLocks.set(toVoice.id, lock);
    }
  }

  /**
   * Copy Temporal Clock & Rate from one voice to another AND synchronize start point.
   */
  copyClockSettings(fromIndex, toIndex) {
    if (fromIndex < 0 || fromIndex >= this.maxVoices || toIndex < 0 || toIndex >= this.maxVoices) return;
    const fromVoice = this.voices[fromIndex];
    const toVoice = this.voices[toIndex];
    if (!fromVoice || !toVoice) return;

    const fromE = fromVoice.engine;
    const toE = toVoice.engine;

    toE.rateMode = fromE.rateMode;
    toE.bpm = fromE.bpm;
    toE.noteDivision = fromE.noteDivision;
    toE.freeSubMode = fromE.freeSubMode;
    toE.freeTimeSec = fromE.freeTimeSec;
    toE.freeLfoHz = fromE.freeLfoHz;
    toE.freeVcoHz = fromE.freeVcoHz;

    // Synchronize start point & accumulated phase
    toE.startPointDeg = fromE.startPointDeg;
    toE.phaseOffsetDeg = fromE.phaseOffsetDeg;
    toE.accumulatedPhase = fromE.accumulatedPhase;
    toE.currentTime = fromE.currentTime;
    toE.drunkPhase = fromE.drunkPhase;
    toE.randomSmoothPhase = fromE.randomSmoothPhase;
    toE.randomSteppedPhase = fromE.randomSteppedPhase;
  }
}
