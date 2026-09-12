/**
 * Spatiomorph - Main Application Logic (v1.2)
 * Integrates Polyphonic Trajectories, Proxemics, Spectral Coupler with Filter CC,
 * Vectorial Wipe with Volume Ducking, 9-Pad Numpad Snapshot Morpher with True Shape Crossfading,
 * Free Rate Tri-Mode, Ableton Speaker Layouts, and Web MIDI Modal.
 */

import { ShapeRegistry } from './math/trajectories.js';
import { PolyphonicEngine } from './engine/polyEngine.js';
import { ProxemicsEngine } from './engine/proxemics.js';
import { SpectralCoupler } from './engine/spectralCoupler.js';
import { VectorialWipeEngine } from './engine/vectorialWipe.js';
import { SnapshotMorpher, NUMPAD_ORDER, MORPH_CURVES } from './engine/snapshotMorpher.js';
import { SpaceFormAccumulator } from './ui/spaceFormAccumulator.js';
import { SpeakerSimulationEngine } from './engine/speakerLayout.js';
import { CanvasRenderer } from './ui/canvasRenderer.js';
import { MidiOutputController } from './io/midiOut.js';
import { PRESET_BANK, applyPreset, exportPresetsJSON, importPresetsJSON } from './io/presets.js';
import { NOTE_DIVISIONS } from './engine/motionEngine.js';
import { FiguresEngine } from './engine/figuresEngine.js';
import { BlauertEngine } from './engine/blauertEngine.js';
import { BirefringenceEngine } from './engine/birefringenceEngine.js';
import { SpectralDiffusionEngine } from './engine/spectralDiffusionEngine.js';

// Core Subsystems
const shapeRegistry = new ShapeRegistry();
const polyEngine = new PolyphonicEngine(shapeRegistry, 6);
const proxemicsEngine = new ProxemicsEngine();
const spectralCoupler = new SpectralCoupler();
const vectorialWipe = new VectorialWipeEngine();
const snapshotMorpher = new SnapshotMorpher(polyEngine);
const spaceFormAccumulator = new SpaceFormAccumulator();
const speakerEngine = new SpeakerSimulationEngine('4ch_room');
const midiController = new MidiOutputController();

// Personality Specialized Subsystems
const figuresEngine = new FiguresEngine();
const blauertEngine = new BlauertEngine();
const birefringenceEngine = new BirefringenceEngine();
const spectralDiffusionEngine = new SpectralDiffusionEngine();

let canvasRenderer = null;
let lastTimestamp = performance.now();
let userPresets = [...PRESET_BANK];
let contextMenuSlotIndex = -1;

// DOM Elements Cache
let elements = {};

window.addEventListener('DOMContentLoaded', () => {
  initDOMElements();
  initCanvas();
  const defaultPers = (elements.personalitySelect && elements.personalitySelect.value) ? elements.personalitySelect.value : 'pounamu';
  setPersonality(defaultPers);
  setBrightnessTheme('med-dark');
  if (elements.brightnessThemeSelect) {
    elements.brightnessThemeSelect.value = 'med-dark';
  }
  populatePresets();
  populateNoteDivisions();
  populateMorphDivisions();
  populateShapes();
  buildTrajectoryTabs();
  buildSnapshotGrid();
  initEventHandlers();
  initKeyboardShortcuts();
  initMidi();
  syncUIFromActiveTrajectory();

  // Populate initial snapshots for demonstration
  initDefaultSnapshots();

  requestAnimationFrame(animationLoop);
});

function initDOMElements() {
  elements = {
    body: document.body,
    canvas: document.getElementById('pannerCanvas'),
    // Personalities & Theme
    personalitySelect: document.getElementById('personalitySelect'),
    personalityPounamuBtn: document.getElementById('personalityPounamuBtn'),
    personalityPlaifoliaBtn: document.getElementById('personalityPlaifoliaBtn'),
    personalityLogo: document.getElementById('personalityLogo'),
    appTitle: document.getElementById('appTitle'),
    appSubtitle: document.getElementById('appSubtitle'),
    brightnessThemeSelect: document.getElementById('brightnessThemeSelect'),
    // Speaker Arrangement
    speakerLayoutSelect: document.getElementById('speakerLayoutSelect'),
    // Trajectory Tabs
    trajectoriesCard: document.getElementById('trajectoriesCard'),
    trajectoryTabsContainer: document.getElementById('trajectoryTabsContainer'),
    activeTrajectoryBadge: document.getElementById('activeTrajectoryBadge'),
    trajectoryActiveToggle: document.getElementById('trajectoryActiveToggle'),
    trajectorySyncFromSelect: document.getElementById('trajectorySyncFromSelect'),
    trajectoryMuteBtn: document.getElementById('trajectoryMuteBtn'),
    trajectorySoloBtn: document.getElementById('trajectorySoloBtn'),
    // Transport
    playPauseBtn: document.getElementById('playPauseBtn'),
    resetBtn: document.getElementById('resetBtn'),
    timeDisplay: document.getElementById('timeDisplay'),
    phaseBar: document.getElementById('phaseBar'),
    // Presets
    presetSelect: document.getElementById('presetSelect'),
    exportPresetsBtn: document.getElementById('exportPresetsBtn'),
    importPresetsBtn: document.getElementById('importPresetsBtn'),
    presetFileInput: document.getElementById('presetFileInput'),
    // Shapes
    shapeSelect: document.getElementById('shapeSelect'),
    shapeCategory: document.getElementById('shapeCategory'),
    shapeDesc: document.getElementById('shapeDesc'),
    shapeParamsContainer: document.getElementById('shapeParamsContainer'),
    // Spatial Transform
    masterScaleSlider: document.getElementById('masterScaleSlider'),
    masterScaleVal: document.getElementById('masterScaleVal'),
    scaleXSlider: document.getElementById('scaleXSlider'),
    scaleXVal: document.getElementById('scaleXVal'),
    scaleYSlider: document.getElementById('scaleYSlider'),
    scaleYVal: document.getElementById('scaleYVal'),
    centerXSlider: document.getElementById('centerXSlider'),
    centerXVal: document.getElementById('centerXVal'),
    centerYSlider: document.getElementById('centerYSlider'),
    centerYVal: document.getElementById('centerYVal'),
    resetCenterBtn: document.getElementById('resetCenterBtn'),
    // Direction & Behavioral Lock
    directionSectionHeader: document.getElementById('directionSectionHeader'),
    directionSelect: document.getElementById('directionSelect'),
    directionRateContainer: document.getElementById('directionRateContainer'),
    directionRateLabel: document.getElementById('directionRateLabel'),
    directionRateSlider: document.getElementById('directionRateSlider'),
    directionRateVal: document.getElementById('directionRateVal'),
    behavioralLockSelect: document.getElementById('behavioralLockSelect'),
    ecologicalLockContainer: document.getElementById('ecologicalLockContainer'),
    phaseOffsetSlider: document.getElementById('phaseOffsetSlider'),
    phaseOffsetVal: document.getElementById('phaseOffsetVal'),
    startAngleSlider: document.getElementById('startAngleSlider'),
    startAngleVal: document.getElementById('startAngleVal'),
    // Visual Options
    showTrailCheck: document.getElementById('showTrailCheck'),
    showTrajectoryCheck: document.getElementById('showTrajectoryCheck'),
    showProxemicsCheck: document.getElementById('showProxemicsCheck'),
    proxemicsCheckLabel: document.getElementById('proxemicsCheckLabel'),
    showAccumulatorCheck: document.getElementById('showAccumulatorCheck'),
    showMetersCheck: document.getElementById('showMetersCheck'),
    showGridCheck: document.getElementById('showGridCheck'),
    decayModeSelect: document.getElementById('decayModeSelect'),
    clearAccumulatorBtn: document.getElementById('clearAccumulatorBtn'),
    exportScoreBtn: document.getElementById('exportScoreBtn'),
    // Vectorial Events
    vectorialSectionCard: document.getElementById('vectorialSectionCard'),
    vectorialControlBar: document.getElementById('vectorialControlBar'),
    wipeModeSelect: document.getElementById('wipeModeSelect'),
    triggerWipeBtn: document.getElementById('triggerWipeBtn'),
    triggerBreachBtn: document.getElementById('triggerBreachBtn'),
    // Monitors
    monX: document.getElementById('monX'),
    monY: document.getElementById('monY'),
    monRot: document.getElementById('monRot'),
    monFocus: document.getElementById('monFocus'),
    monCenter: document.getElementById('monCenter'),
    monSmooth: document.getElementById('monSmooth'),
    monVelocity: document.getElementById('monVelocity'),
    monZone: document.getElementById('monZone'),
    // Temporal Clock (Column 3 Top)
    rateModeSync: document.getElementById('rateModeSync'),
    rateModeFree: document.getElementById('rateModeFree'),
    syncControls: document.getElementById('syncControls'),
    freeControls: document.getElementById('freeControls'),
    bpmInput: document.getElementById('bpmInput'),
    bpmSlider: document.getElementById('bpmSlider'),
    noteDivSelect: document.getElementById('noteDivSelect'),
    clockSyncContainer: document.getElementById('clockSyncContainer'),
    clockSyncRadioGroup: document.getElementById('clockSyncRadioGroup'),
    // Free Tri-Mode
    freeSubTimeBtn: document.getElementById('freeSubTimeBtn'),
    freeSubLfoBtn: document.getElementById('freeSubLfoBtn'),
    freeSubVcoBtn: document.getElementById('freeSubVcoBtn'),
    freeSubTimePanel: document.getElementById('freeSubTimePanel'),
    freeSubLfoPanel: document.getElementById('freeSubLfoPanel'),
    freeSubVcoPanel: document.getElementById('freeSubVcoPanel'),
    freeTimeSlider: document.getElementById('freeTimeSlider'),
    freeTimeInput: document.getElementById('freeTimeInput'),
    freeTimeVal: document.getElementById('freeTimeVal'),
    freeLfoSlider: document.getElementById('freeLfoSlider'),
    freeLfoInput: document.getElementById('freeLfoInput'),
    freeLfoVal: document.getElementById('freeLfoVal'),
    freeVcoSlider: document.getElementById('freeVcoSlider'),
    freeVcoInput: document.getElementById('freeVcoInput'),
    freeVcoVal: document.getElementById('freeVcoVal'),
    // Snapshots (Column 3 Second)
    snapshotsCard: document.getElementById('snapshotsCard'),
    morphStatusBadge: document.getElementById('morphStatusBadge'),
    snapshotGrid3x3: document.getElementById('snapshotGrid3x3'),
    morphCurveSelect: document.getElementById('morphCurveSelect'),
    morphDurationSecContainer: document.getElementById('morphDurationSecContainer'),
    morphDurationSyncContainer: document.getElementById('morphDurationSyncContainer'),
    morphDurationSlider: document.getElementById('morphDurationSlider'),
    morphDurationVal: document.getElementById('morphDurationVal'),
    morphDivisionSelect: document.getElementById('morphDivisionSelect'),
    morphProgressBar: document.getElementById('morphProgressBar'),
    // Surround Panner Controls (Column 3 Third)
    rotationSlider: document.getElementById('rotationSlider'),
    rotationVal: document.getElementById('rotationVal'),
    autoRotateSlider: document.getElementById('autoRotateSlider'),
    autoRotateVal: document.getElementById('autoRotateVal'),
    focusSlider: document.getElementById('focusSlider'),
    focusVal: document.getElementById('focusVal'),
    centerSlider: document.getElementById('centerSlider'),
    centerVal: document.getElementById('centerVal'),
    smoothSlider: document.getElementById('smoothSlider'),
    smoothVal: document.getElementById('smoothVal'),
    // Spectral Coupler (Column 3 Fourth)
    spectralCouplingCard: document.getElementById('spectralCouplingCard'),
    spectralCouplingCheck: document.getElementById('spectralCouplingCheck'),
    specFocusCheck: document.getElementById('specFocusCheck'),
    specCenterCheck: document.getElementById('specCenterCheck'),
    specGravSmoothCheck: document.getElementById('specGravSmoothCheck'),
    // MIDI Trigger & Modal
    openMidiModalBtn: document.getElementById('openMidiModalBtn'),
    closeMidiModalBtn: document.getElementById('closeMidiModalBtn'),
    midiModal: document.getElementById('midiModal'),
    midiMainLed: document.getElementById('midiMainLed'),
    midiModalLed: document.getElementById('midiModalLed'),
    midiStatusSummary: document.getElementById('midiStatusSummary'),
    midiToggle: document.getElementById('midiToggle'),
    midiPortSelect: document.getElementById('midiPortSelect'),
    midiRoutingModeSelect: document.getElementById('midiRoutingModeSelect'),
    midiChannelSelect: document.getElementById('midiChannelSelect'),
    midiTrajectoryTabs: document.querySelectorAll('#midiTrajectoryTabs button'),
    midiRoutingSummaryLabel: document.getElementById('midiRoutingSummaryLabel'),
    ccMapX: document.getElementById('ccMapX'),
    ccMapY: document.getElementById('ccMapY'),
    ccMapRot: document.getElementById('ccMapRot'),
    ccMapFocus: document.getElementById('ccMapFocus'),
    ccMapCenter: document.getElementById('ccMapCenter'),
    ccMapSmooth: document.getElementById('ccMapSmooth'),
    ccMapFilter: document.getElementById('ccMapFilter'),
    ccMapVol: document.getElementById('ccMapVol'),
    // Context Menu
    snapshotContextMenu: document.getElementById('snapshotContextMenu'),
    ctxRecallBtn: document.getElementById('ctxRecallBtn'),
    ctxMorphBtn: document.getElementById('ctxMorphBtn'),
    ctxStoreBtn: document.getElementById('ctxStoreBtn'),
    ctxDeleteBtn: document.getElementById('ctxDeleteBtn'),
    // Biloba Card Elements
    bilobaSectionCard: document.getElementById('bilobaSectionCard'),
    bilobaFigureSelect: document.getElementById('bilobaFigureSelect'),
    bilobaCaliberSlider: document.getElementById('bilobaCaliberSlider'),
    bilobaCaliberVal: document.getElementById('bilobaCaliberVal'),
    bilobaDirectivitySelect: document.getElementById('bilobaDirectivitySelect'),
    bilobaLobeAngleSlider: document.getElementById('bilobaLobeAngleSlider'),
    bilobaLobeAngleVal: document.getElementById('bilobaLobeAngleVal'),
    // Kornblume Card Elements
    kornblumeSectionCard: document.getElementById('kornblumeSectionCard'),
    kornblumeCoherenceSlider: document.getElementById('kornblumeCoherenceSlider'),
    kornblumeCoherenceVal: document.getElementById('kornblumeCoherenceVal'),
    kornblumeBandsSelect: document.getElementById('kornblumeBandsSelect'),
    kornblumePrecedenceToggle: document.getElementById('kornblumePrecedenceToggle'),
    kornblumeHaasDelaySlider: document.getElementById('kornblumeHaasDelaySlider'),
    kornblumeHaasDelayVal: document.getElementById('kornblumeHaasDelayVal'),
    kornblumeFranssenToggle: document.getElementById('kornblumeFranssenToggle'),
    // Calcite Card Elements
    calciteSectionCard: document.getElementById('calciteSectionCard'),
    calciteRaySeparationSlider: document.getElementById('calciteRaySeparationSlider'),
    calciteRaySeparationVal: document.getElementById('calciteRaySeparationVal'),
    calciteOpticAxisSlider: document.getElementById('calciteOpticAxisSlider'),
    calciteOpticAxisVal: document.getElementById('calciteOpticAxisVal'),
    calciteCleavageSelect: document.getElementById('calciteCleavageSelect'),
    calciteElevationSlider: document.getElementById('calciteElevationSlider'),
    calciteElevationVal: document.getElementById('calciteElevationVal'),
    // Ipê-amarelo Card Elements
    ipeAmareloSectionCard: document.getElementById('ipeAmareloSectionCard'),
    ipeStratumSelect: document.getElementById('ipeStratumSelect'),
    ipeLutRateSlider: document.getElementById('ipeLutRateSlider'),
    ipeLutRateVal: document.getElementById('ipeLutRateVal'),
    ipeKineticCollisionToggle: document.getElementById('ipeKineticCollisionToggle'),
    ipeMaresiaBtn: document.getElementById('ipeMaresiaBtn')
  };
}

function initCanvas() {
  canvasRenderer = new CanvasRenderer(elements.canvas, spaceFormAccumulator);
  canvasRenderer.figuresEngine = figuresEngine;
  canvasRenderer.blauertEngine = blauertEngine;
  canvasRenderer.birefringenceEngine = birefringenceEngine;
  canvasRenderer.spectralDiffusionEngine = spectralDiffusionEngine;
  window.addEventListener('resize', () => canvasRenderer.resize());

  let isDragging = false;
  elements.canvas.addEventListener('mousedown', (e) => {
    isDragging = true;
    updateCenterFromMouse(e);
  });
  window.addEventListener('mousemove', (e) => {
    if (isDragging) updateCenterFromMouse(e);
  });
  window.addEventListener('mouseup', () => {
    isDragging = false;
  });
}

function updateCenterFromMouse(e) {
  const rect = elements.canvas.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  const mouseY = e.clientY - rect.top;
  const norm = canvasRenderer.toNormalized(mouseX, mouseY);

  const curTraj = polyEngine.getSelectedTrajectory();
  curTraj.engine.centerX = Math.max(-1, Math.min(1, norm.x));
  curTraj.engine.centerY = Math.max(-1, Math.min(1, norm.y));

  elements.centerXSlider.value = curTraj.engine.centerX;
  elements.centerXVal.textContent = curTraj.engine.centerX.toFixed(2);
  elements.centerYSlider.value = curTraj.engine.centerY;
  elements.centerYVal.textContent = curTraj.engine.centerY.toFixed(2);
}

function buildTrajectoryTabs() {
  elements.trajectoryTabsContainer.innerHTML = '';
  const palettes = polyEngine.getPalettes();

  polyEngine.voices.forEach((v, idx) => {
    const pal = palettes[idx];
    const btn = document.createElement('button');
    btn.className = `trajectory-tab-btn ${idx === polyEngine.selectedTrajectoryIndex ? 'active-tab' : ''}`;
    btn.id = `trajTab_${idx}`;
    btn.innerHTML = `
      <span class="w-2 h-2 rounded-full" style="background-color: ${pal.primary};"></span>
      <span>${pal.label}</span>
      <span id="trajTabActiveDot_${idx}" class="w-1.5 h-1.5 rounded-full ${v.active ? 'bg-emerald-400' : 'bg-slate-600'}"></span>
    `;

    btn.addEventListener('click', () => {
      polyEngine.selectTrajectory(idx);
      updateTrajectoryTabsUI();
      syncUIFromActiveTrajectory();
    });

    elements.trajectoryTabsContainer.appendChild(btn);
  });
}

function updateTrajectoryTabsUI() {
  const curIdx = polyEngine.selectedTrajectoryIndex;
  const curTraj = polyEngine.getSelectedTrajectory();
  const palettes = polyEngine.getPalettes();

  polyEngine.voices.forEach((v, idx) => {
    const btn = document.getElementById(`trajTab_${idx}`);
    const dot = document.getElementById(`trajTabActiveDot_${idx}`);
    if (btn) {
      if (idx === curIdx) btn.classList.add('active-tab');
      else btn.classList.remove('active-tab');
    }
    if (dot) {
      dot.className = `w-1.5 h-1.5 rounded-full ${v.active ? 'bg-emerald-400' : 'bg-slate-600'}`;
    }
  });

  const pal = palettes[curIdx];
  elements.activeTrajectoryBadge.textContent = `${pal.label}`;
  elements.trajectoryActiveToggle.checked = curTraj.active;

  elements.trajectoryMuteBtn.className = curTraj.muted
    ? 'px-2 py-0.5 text-[10px] font-bold rounded bg-red-800 text-white border border-red-600'
    : 'px-2 py-0.5 text-[10px] font-bold rounded bg-slate-800 text-slate-300 border border-slate-700 hover:border-slate-500';

  elements.trajectorySoloBtn.className = curTraj.solo
    ? 'px-2 py-0.5 text-[10px] font-bold rounded bg-amber-600 text-white border border-amber-500'
    : 'px-2 py-0.5 text-[10px] font-bold rounded bg-slate-800 text-slate-300 border border-slate-700 hover:border-slate-500';
}

function buildSnapshotGrid() {
  elements.snapshotGrid3x3.innerHTML = '';

  // Render 9 pads in Numpad ordering (7 8 9, 4 5 6, 1 2 3)
  NUMPAD_ORDER.forEach((numpadKey) => {
    const slotIndex = numpadKey - 1;
    const pad = document.createElement('div');
    pad.className = 'snapshot-pad-3x3';
    pad.id = `snapPad_${slotIndex}`;
    pad.textContent = numpadKey;

    pad.addEventListener('click', (e) => {
      e.stopPropagation();
      openSnapshotContextMenu(slotIndex, e.clientX, e.clientY);
    });

    elements.snapshotGrid3x3.appendChild(pad);
  });

  updateSnapshotPadsUI();
}

function updateSnapshotPadsUI() {
  for (let i = 0; i < 9; i++) {
    const pad = document.getElementById(`snapPad_${i}`);
    if (!pad) continue;

    pad.className = 'snapshot-pad-3x3';
    if (snapshotMorpher.hasSnapshot(i)) {
      pad.classList.add('has-data');
    }
    if (snapshotMorpher.activeSlot === i) {
      pad.classList.add('active-pad');
    }
    if (snapshotMorpher.targetSlot === i && snapshotMorpher.isMorphing) {
      pad.classList.add('morphing-target');
    }
  }
}

function openSnapshotContextMenu(slotIndex, clientX, clientY) {
  contextMenuSlotIndex = slotIndex;
  const menu = elements.snapshotContextMenu;

  menu.style.left = `${Math.min(window.innerWidth - 130, clientX + 4)}px`;
  menu.style.top = `${Math.min(window.innerHeight - 150, clientY + 4)}px`;
  menu.classList.remove('hidden');

  // Disable recall/morph/delete if empty
  const hasData = snapshotMorpher.hasSnapshot(slotIndex);
  elements.ctxRecallBtn.style.opacity = hasData ? '1' : '0.4';
  elements.ctxMorphBtn.style.opacity = hasData ? '1' : '0.4';
  elements.ctxDeleteBtn.style.opacity = hasData ? '1' : '0.4';
}

function closeSnapshotContextMenu() {
  elements.snapshotContextMenu.classList.add('hidden');
  contextMenuSlotIndex = -1;
}

function initDefaultSnapshots() {
  // Pad 1 (Index 0): Ambient Expansive State
  polyEngine.voices[0].engine.masterScale = 1.0;
  polyEngine.voices[0].engine.focus = 40;
  polyEngine.voices[0].engine.center = 60;
  snapshotMorpher.storeSnapshot(0);

  // Pad 3 (Index 2): Pinpoint Perimeter Orbit
  polyEngine.voices[0].engine.masterScale = 0.9;
  polyEngine.voices[0].engine.focus = 90;
  polyEngine.voices[0].engine.center = 20;
  snapshotMorpher.storeSnapshot(2);

  // Pad 7 (Index 6): Grounded Center Core
  polyEngine.voices[0].engine.masterScale = 0.5;
  polyEngine.voices[0].engine.focus = 50;
  polyEngine.voices[0].engine.center = 80;
  snapshotMorpher.storeSnapshot(6);

  // Reset to default
  polyEngine.voices[0].engine.masterScale = 0.85;
  polyEngine.voices[0].engine.focus = 50;
  polyEngine.voices[0].engine.center = 50;
  snapshotMorpher.activeSlot = 0;
  updateSnapshotPadsUI();
}

function populatePresets() {
  elements.presetSelect.innerHTML = '<option value="">-- Preset --</option>';

  // Group presets by category
  const categories = [];
  const byCat = new Map();
  for (const preset of userPresets) {
    const cat = preset.category || 'Other';
    if (!byCat.has(cat)) {
      byCat.set(cat, []);
      categories.push(cat);
    }
    byCat.get(cat).push(preset);
  }

  // Priority ordering: Organic & Natural Forms before Stochastic & Chaos
  const priorityOrder = [
    'Organic & Natural Forms',
    'Crystalline & Cleavage',
    'Acoustic & Perceptual',
    'Vortex & Spiral',
    'Harmonic',
    'Polygonal',
    'Linear & Crossing',
    'Geometric',
    'Stochastic & Chaos',
    'Acousmatic Case Studies'
  ];

  categories.sort((a, b) => {
    const idxA = priorityOrder.indexOf(a);
    const idxB = priorityOrder.indexOf(b);
    if (idxA !== -1 && idxB !== -1) return idxA - idxB;
    if (idxA !== -1) return -1;
    if (idxB !== -1) return 1;
    return a.localeCompare(b);
  });

  for (const cat of categories) {
    const group = document.createElement('optgroup');
    group.label = cat;
    for (const preset of byCat.get(cat)) {
      const opt = document.createElement('option');
      opt.value = preset.id;
      opt.textContent = preset.name;
      group.appendChild(opt);
    }
    elements.presetSelect.appendChild(group);
  }
}

function populateShapes() {
  const shapes = shapeRegistry.getAll();
  elements.shapeSelect.innerHTML = '';
  const cats = shapeRegistry.getCategories();

  for (const cat of cats) {
    const group = document.createElement('optgroup');
    group.label = cat;
    for (const shape of shapes.filter(s => s.category === cat)) {
      const opt = document.createElement('option');
      opt.value = shape.id;
      opt.textContent = shape.name;
      group.appendChild(opt);
    }
    elements.shapeSelect.appendChild(group);
  }

  const curTraj = polyEngine.getSelectedTrajectory();
  elements.shapeSelect.value = curTraj.engine.activeShapeId;
  updateShapeInfo();
}

function populateNoteDivisions() {
  elements.noteDivSelect.innerHTML = '';
  // Inverted: Shorter divisions at top! Precision formatted to thousandths
  for (const [div, beats] of Object.entries(NOTE_DIVISIONS)) {
    const opt = document.createElement('option');
    opt.value = div;
    const beatFormatted = beats < 1 ? beats.toFixed(3) : beats.toFixed(1);
    opt.textContent = `${div} (${beatFormatted} beat${beats > 1 ? 's' : ''})`;
    elements.noteDivSelect.appendChild(opt);
  }
}

function populateMorphDivisions() {
  elements.morphDivisionSelect.innerHTML = '';
  for (const [div, beats] of Object.entries(NOTE_DIVISIONS)) {
    const opt = document.createElement('option');
    opt.value = div;
    const beatFormatted = beats < 1 ? beats.toFixed(3) : beats.toFixed(1);
    opt.textContent = `${div} (${beatFormatted} beats)`;
    elements.morphDivisionSelect.appendChild(opt);
  }
  elements.morphDivisionSelect.value = snapshotMorpher.morphDivision;
}

function updateShapeInfo() {
  const curTraj = polyEngine.getSelectedTrajectory();
  const shape = shapeRegistry.get(curTraj.engine.activeShapeId);
  if (!shape) return;

  elements.shapeCategory.textContent = shape.category;
  elements.shapeDesc.textContent = shape.description;

  elements.shapeParamsContainer.innerHTML = '';
  if (!shape.params || shape.params.length === 0) {
    elements.shapeParamsContainer.innerHTML = '<p class="text-[10px] text-slate-500 italic">No trajectory-specific parameters.</p>';
    return;
  }

  for (const param of shape.params) {
    const row = document.createElement('div');
    row.className = 'flex flex-col gap-0.5';

    const currentVal = curTraj.engine.shapeParams[param.id] ?? param.default;

    row.innerHTML = `
      <div class="flex justify-between items-center text-xs">
        <label class="text-slate-300 font-medium text-[11px]">${param.name}</label>
        <span id="param_val_${param.id}" class="text-accent-themed font-mono text-[11px]">${currentVal}</span>
      </div>
      <input type="range" id="param_input_${param.id}" min="${param.min}" max="${param.max}" step="${param.step}" value="${currentVal}" class="w-full">
    `;

    elements.shapeParamsContainer.appendChild(row);

    const input = row.querySelector(`#param_input_${param.id}`);
    const valDisplay = row.querySelector(`#param_val_${param.id}`);

    input.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      curTraj.engine.shapeParams[param.id] = val;
      valDisplay.textContent = Number.isInteger(val) ? val : val.toFixed(2);
    });
  }
}

function syncUIFromActiveTrajectory() {
  const curTraj = polyEngine.getSelectedTrajectory();
  const e = curTraj.engine;

  if (elements.shapeSelect.value !== e.activeShapeId) {
    elements.shapeSelect.value = e.activeShapeId;
    updateShapeInfo();
  } else {
    const shape = shapeRegistry.get(e.activeShapeId);
    if (shape && shape.params) {
      for (const param of shape.params) {
        const input = document.getElementById(`param_input_${param.id}`);
        const valDisplay = document.getElementById(`param_val_${param.id}`);
        const currentVal = e.shapeParams[param.id] ?? param.default;
        if (input && document.activeElement !== input) {
          input.value = currentVal;
        }
        if (valDisplay) {
          valDisplay.textContent = Number.isInteger(currentVal) ? currentVal : currentVal.toFixed(2);
        }
      }
    }
  }

  // Rate Mode & Clock
  if (e.rateMode === 'sync') {
    elements.rateModeSync.checked = true;
    elements.syncControls.classList.remove('hidden');
    elements.freeControls.classList.add('hidden');
    elements.morphDurationSyncContainer.classList.remove('hidden');
    elements.morphDurationSecContainer.classList.add('hidden');
  } else {
    elements.rateModeFree.checked = true;
    elements.syncControls.classList.add('hidden');
    elements.freeControls.classList.remove('hidden');
    elements.morphDurationSyncContainer.classList.add('hidden');
    elements.morphDurationSecContainer.classList.remove('hidden');
  }

  elements.bpmInput.value = e.bpm;
  elements.bpmSlider.value = e.bpm;
  elements.noteDivSelect.value = e.noteDivision;

  // Free Tri-Mode
  updateFreeTriModeUI(e.freeSubMode || 'lfo');
  elements.freeTimeSlider.value = e.freeTimeSec || 2.0;
  if (elements.freeTimeInput) elements.freeTimeInput.value = (e.freeTimeSec || 2.0).toFixed(3);
  if (elements.freeTimeVal) elements.freeTimeVal.textContent = `${(e.freeTimeSec || 2.0).toFixed(3)}s`;
  elements.freeLfoSlider.value = e.freeLfoHz || 0.5;
  if (elements.freeLfoInput) elements.freeLfoInput.value = (e.freeLfoHz || 0.5).toFixed(3);
  if (elements.freeLfoVal) elements.freeLfoVal.textContent = `${(e.freeLfoHz || 0.5).toFixed(3)} Hz`;
  elements.freeVcoSlider.value = e.freeVcoHz || 30.0;
  if (elements.freeVcoInput) elements.freeVcoInput.value = (e.freeVcoHz || 30.0).toFixed(1);
  if (elements.freeVcoVal) elements.freeVcoVal.textContent = `${(e.freeVcoHz || 30.0).toFixed(1)} Hz`;

  elements.directionSelect.value = e.direction;
  if (elements.directionRateContainer) {
    if (e.direction === 'drunk') {
      elements.directionRateContainer.classList.remove('hidden');
      if (elements.directionRateLabel) elements.directionRateLabel.textContent = 'Drunkenness';
      elements.directionRateSlider.value = e.directionRate || 1.0;
      elements.directionRateVal.textContent = `${(e.directionRate || 1.0).toFixed(2)}x`;
    } else if (e.direction === 'random_smooth') {
      elements.directionRateContainer.classList.remove('hidden');
      if (elements.directionRateLabel) elements.directionRateLabel.textContent = 'Teleportation Rate';
      elements.directionRateSlider.value = e.directionRate || 1.0;
      elements.directionRateVal.textContent = `${(e.directionRate || 1.0).toFixed(2)}x`;
    } else {
      elements.directionRateContainer.classList.add('hidden');
    }
  }

  // Populate Trajectory Sync From select options (T1..T6 excluding active)
  if (elements.trajectorySyncFromSelect) {
    elements.trajectorySyncFromSelect.innerHTML = '<option value="" disabled selected>Select...</option>';
    for (let i = 0; i < polyEngine.maxVoices; i++) {
      if (i === polyEngine.selectedTrajectoryIndex) continue;
      const opt = document.createElement('option');
      opt.value = i;
      opt.textContent = `T${i + 1}`;
      elements.trajectorySyncFromSelect.appendChild(opt);
    }
  }

  // Populate Clock Sync From radio buttons (T1..T6 excluding active)
  if (elements.clockSyncRadioGroup) {
    elements.clockSyncRadioGroup.innerHTML = '';
    for (let i = 0; i < polyEngine.maxVoices; i++) {
      if (i === polyEngine.selectedTrajectoryIndex) continue;
      const radioId = `clockSync_t${i + 1}`;
      const wrapper = document.createElement('label');
      wrapper.className = 'flex items-center gap-1 cursor-pointer px-1.5 py-0.5 rounded bg-card-themed hover:bg-slate-700 text-slate-300 text-[10px] border border-themed transition';
      wrapper.htmlFor = radioId;

      const radio = document.createElement('input');
      radio.type = 'radio';
      radio.name = 'clockSyncTarget';
      radio.id = radioId;
      radio.value = i;
      radio.className = 'accent-emerald-500 w-2.5 h-2.5 cursor-pointer';

      const text = document.createElement('span');
      text.textContent = `T${i + 1}`;
      text.className = 'font-semibold font-mono';

      wrapper.appendChild(radio);
      wrapper.appendChild(text);

      radio.addEventListener('change', () => {
        if (radio.checked) {
          polyEngine.copyClockSettings(i, polyEngine.selectedTrajectoryIndex);
          syncUIFromActiveTrajectory();
        }
      });

      elements.clockSyncRadioGroup.appendChild(wrapper);
    }
  }

  elements.phaseOffsetSlider.value = Math.round(e.phaseOffsetDeg);
  elements.phaseOffsetVal.textContent = `${Math.round(e.phaseOffsetDeg)}°`;
  elements.startAngleSlider.value = Math.round(e.startPointDeg);
  elements.startAngleVal.textContent = `${Math.round(e.startPointDeg)}°`;

  elements.masterScaleSlider.value = e.masterScale;
  elements.masterScaleVal.textContent = `${Math.round(e.masterScale * 100)}%`;
  elements.scaleXSlider.value = e.scaleX;
  elements.scaleXVal.textContent = `${Math.round(e.scaleX * 100)}%`;
  elements.scaleYSlider.value = e.scaleY;
  elements.scaleYVal.textContent = `${Math.round(e.scaleY * 100)}%`;
  elements.centerXSlider.value = e.centerX;
  elements.centerXVal.textContent = e.centerX.toFixed(2);
  elements.centerYSlider.value = e.centerY;
  elements.centerYVal.textContent = e.centerY.toFixed(2);

  // Surround Panner Target Parameters (enforcing integer rounding during morphs)
  elements.rotationSlider.value = Math.round(e.rotationDeg);
  elements.rotationVal.textContent = `${Math.round(e.rotationDeg)}°`;
  elements.autoRotateSlider.value = Math.round(e.autoRotateSpeed);
  elements.autoRotateVal.textContent = `${Math.round(e.autoRotateSpeed)}°/s`;
  elements.focusSlider.value = Math.round(e.focus);
  elements.focusVal.textContent = `${Math.round(e.focus)}%`;
  elements.centerSlider.value = Math.round(e.center);
  elements.centerVal.textContent = `${Math.round(e.center)}%`;
  elements.smoothSlider.value = Math.round(e.smooth);
  elements.smoothVal.textContent = `${Math.round(e.smooth)}%`;

  const lock = proxemicsEngine.activeZoneLocks.get(curTraj.id) || 'none';
  elements.behavioralLockSelect.value = lock;

  updateTrajectoryTabsUI();
}

function updateFreeTriModeUI(subMode) {
  const curTraj = polyEngine.getSelectedTrajectory();
  curTraj.engine.freeSubMode = subMode;

  const btnClassesActive = 'flex-1 py-0.5 rounded font-bold transition-all bg-emerald-700 text-white';
  const btnClassesInactive = 'flex-1 py-0.5 rounded font-bold transition-all bg-card-themed text-slate-300';

  elements.freeSubTimeBtn.className = subMode === 'time' ? btnClassesActive : btnClassesInactive;
  elements.freeSubLfoBtn.className = subMode === 'lfo' ? btnClassesActive : btnClassesInactive;
  elements.freeSubVcoBtn.className = subMode === 'vco' ? btnClassesActive : btnClassesInactive;

  elements.freeSubTimePanel.classList.toggle('hidden', subMode !== 'time');
  elements.freeSubLfoPanel.classList.toggle('hidden', subMode !== 'lfo');
  elements.freeSubVcoPanel.classList.toggle('hidden', subMode !== 'vco');
}

function setPersonality(personality) {
  polyEngine.setPersonality(personality);
  canvasRenderer.personality = personality;
  spaceFormAccumulator.personality = personality;

  const curBrightness = elements.brightnessThemeSelect ? (elements.brightnessThemeSelect.value || 'med-dark') : 'med-dark';
  elements.body.className = `personality-${personality} brightness-${curBrightness} min-h-screen flex flex-col`;

  if (elements.personalitySelect) {
    elements.personalitySelect.value = personality;
  }

  if (elements.personalityPounamuBtn) {
    elements.personalityPounamuBtn.className = personality === 'pounamu'
      ? 'px-2 py-0.5 text-xs font-bold rounded transition-all bg-emerald-700/80 text-white shadow'
      : 'px-2 py-0.5 text-xs font-semibold rounded transition-all text-slate-400 hover:text-emerald-300';
  }
  if (elements.personalityPlaifoliaBtn) {
    elements.personalityPlaifoliaBtn.className = personality === 'plaifolia'
      ? 'px-2 py-0.5 text-xs font-bold rounded transition-all bg-amber-700/80 text-white shadow'
      : 'px-2 py-0.5 text-xs font-semibold rounded transition-all text-slate-400 hover:text-amber-300';
  }

  switch (personality) {
    case 'plaifolia':
      elements.appSubtitle.textContent = 'Plaifolia Suite (Single Trajectory)';
      elements.personalityLogo.textContent = 'P';
      break;
    case 'biloba':
      elements.appSubtitle.textContent = "L'Espace du Son (Annette Vande Gorne)";
      elements.personalityLogo.textContent = 'B';
      break;
    case 'kornblume':
      elements.appSubtitle.textContent = 'Spatial Hearing & Median Plane (Jens Blauert)';
      elements.personalityLogo.textContent = 'K';
      break;
    case 'calcite':
      elements.appSubtitle.textContent = '3D Ambisonics & Birefringence (Natasha Barrett)';
      elements.personalityLogo.textContent = 'C';
      break;
    case 'ipe_amarelo':
      elements.appSubtitle.textContent = '8-CH Spectral Diffusion (Daniel L. Barreiro)';
      elements.personalityLogo.textContent = 'I';
      break;
    case 'pounamu':
    default:
      elements.appSubtitle.textContent = 'Electroacoustic Trajectory Suite';
      elements.personalityLogo.textContent = 'S';
      break;
  }

  // Show / Hide Personality Signature Cards
  if (elements.vectorialSectionCard) {
    elements.vectorialSectionCard.classList.toggle('hidden', personality !== 'pounamu');
  }
  if (elements.bilobaSectionCard) {
    elements.bilobaSectionCard.classList.toggle('hidden', personality !== 'biloba');
  }
  if (elements.kornblumeSectionCard) {
    elements.kornblumeSectionCard.classList.toggle('hidden', personality !== 'kornblume');
  }
  if (elements.calciteSectionCard) {
    elements.calciteSectionCard.classList.toggle('hidden', personality !== 'calcite');
  }
  if (elements.ipeAmareloSectionCard) {
    elements.ipeAmareloSectionCard.classList.toggle('hidden', personality !== 'ipe_amarelo');
  }

  // Direction Header & Multi-Voice Layout adjustments
  if (personality === 'plaifolia') {
    elements.directionSectionHeader.textContent = 'Direction';
    elements.ecologicalLockContainer.classList.add('hidden');
    elements.trajectoriesCard.classList.add('hidden');
    if (elements.clockSyncContainer) elements.clockSyncContainer.classList.add('hidden');
    elements.proxemicsCheckLabel.classList.add('hidden');
  } else {
    elements.directionSectionHeader.textContent = personality === 'pounamu' ? 'Direction & Proxemic Zone' : 'Direction';
    elements.ecologicalLockContainer.classList.toggle('hidden', personality !== 'pounamu');
    elements.trajectoriesCard.classList.remove('hidden');
    if (elements.clockSyncContainer) elements.clockSyncContainer.classList.remove('hidden');
    elements.proxemicsCheckLabel.classList.toggle('hidden', personality !== 'pounamu');
  }

  buildTrajectoryTabs();
  syncUIFromActiveTrajectory();
}

function setBrightnessTheme(theme) {
  canvasRenderer.brightnessTheme = theme;
  const pers = polyEngine.personality || 'pounamu';
  elements.body.className = `personality-${pers} brightness-${theme} min-h-screen flex flex-col`;
}

function initEventHandlers() {
  // Personality Select Dropdown & Legacy Buttons
  if (elements.personalitySelect) {
    elements.personalitySelect.addEventListener('change', (e) => setPersonality(e.target.value));
  }
  if (elements.personalityPounamuBtn) {
    elements.personalityPounamuBtn.addEventListener('click', () => setPersonality('pounamu'));
  }
  if (elements.personalityPlaifoliaBtn) {
    elements.personalityPlaifoliaBtn.addEventListener('click', () => setPersonality('plaifolia'));
  }

  // Biloba Controls
  if (elements.bilobaFigureSelect) {
    elements.bilobaFigureSelect.addEventListener('change', (e) => figuresEngine.setFigure(e.target.value));
  }
  if (elements.bilobaCaliberSlider) {
    elements.bilobaCaliberSlider.addEventListener('input', (e) => {
      const val = parseInt(e.target.value, 10);
      figuresEngine.setCaliber(val / 100);
      if (elements.bilobaCaliberVal) elements.bilobaCaliberVal.textContent = `${val}%`;
    });
  }
  if (elements.bilobaDirectivitySelect) {
    elements.bilobaDirectivitySelect.addEventListener('change', (e) => figuresEngine.setDirectivity(e.target.value));
  }
  if (elements.bilobaLobeAngleSlider) {
    elements.bilobaLobeAngleSlider.addEventListener('input', (e) => {
      const val = parseInt(e.target.value, 10);
      figuresEngine.setLobeAngle(val);
      if (elements.bilobaLobeAngleVal) elements.bilobaLobeAngleVal.textContent = `${val}°`;
    });
  }

  // Kornblume Controls
  if (elements.kornblumeCoherenceSlider) {
    elements.kornblumeCoherenceSlider.addEventListener('input', (e) => {
      const val = parseInt(e.target.value, 10);
      blauertEngine.setCoherence(val / 100);
      if (elements.kornblumeCoherenceVal) elements.kornblumeCoherenceVal.textContent = (val / 100).toFixed(2);
    });
  }
  if (elements.kornblumeBandsSelect) {
    elements.kornblumeBandsSelect.addEventListener('change', (e) => blauertEngine.setBand(e.target.value));
  }
  if (elements.kornblumePrecedenceToggle) {
    elements.kornblumePrecedenceToggle.addEventListener('change', (e) => blauertEngine.setPrecedence(e.target.checked));
  }
  if (elements.kornblumeHaasDelaySlider) {
    elements.kornblumeHaasDelaySlider.addEventListener('input', (e) => {
      const val = parseInt(e.target.value, 10);
      blauertEngine.setHaasDelay(val);
      if (elements.kornblumeHaasDelayVal) elements.kornblumeHaasDelayVal.textContent = `${val} ms`;
    });
  }
  if (elements.kornblumeFranssenToggle) {
    elements.kornblumeFranssenToggle.addEventListener('change', (e) => blauertEngine.setFranssen(e.target.checked));
  }

  // Calcite Controls
  if (elements.calciteRaySeparationSlider) {
    elements.calciteRaySeparationSlider.addEventListener('input', (e) => {
      const val = parseInt(e.target.value, 10);
      birefringenceEngine.setRaySeparation(val / 100);
      if (elements.calciteRaySeparationVal) elements.calciteRaySeparationVal.textContent = `${val}%`;
    });
  }
  if (elements.calciteOpticAxisSlider) {
    elements.calciteOpticAxisSlider.addEventListener('input', (e) => {
      const val = parseInt(e.target.value, 10);
      birefringenceEngine.setOpticAxis(val);
      if (elements.calciteOpticAxisVal) elements.calciteOpticAxisVal.textContent = `${val}°`;
    });
  }
  if (elements.calciteCleavageSelect) {
    elements.calciteCleavageSelect.addEventListener('change', (e) => birefringenceEngine.setCleavageMode(e.target.value));
  }
  if (elements.calciteElevationSlider) {
    elements.calciteElevationSlider.addEventListener('input', (e) => {
      const val = parseInt(e.target.value, 10);
      birefringenceEngine.setElevation(val);
      if (elements.calciteElevationVal) elements.calciteElevationVal.textContent = `${val}°`;
    });
  }

  // Ipê-amarelo Controls
  if (elements.ipeStratumSelect) {
    elements.ipeStratumSelect.addEventListener('change', (e) => spectralDiffusionEngine.setStratum(e.target.value));
  }
  if (elements.ipeLutRateSlider) {
    elements.ipeLutRateSlider.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      spectralDiffusionEngine.setLutRate(val);
      if (elements.ipeLutRateVal) elements.ipeLutRateVal.textContent = `${val.toFixed(2)} Hz`;
    });
  }
  if (elements.ipeKineticCollisionToggle) {
    elements.ipeKineticCollisionToggle.addEventListener('change', (e) => spectralDiffusionEngine.setKineticCollision(e.target.checked));
  }
  if (elements.ipeMaresiaBtn) {
    elements.ipeMaresiaBtn.addEventListener('click', () => spectralDiffusionEngine.triggerMaresia());
  }

  // Theme Brightness
  elements.brightnessThemeSelect.addEventListener('change', (e) => setBrightnessTheme(e.target.value));

  // Speaker Layout
  elements.speakerLayoutSelect.addEventListener('change', (e) => {
    speakerEngine.setLayout(e.target.value);
  });

  // Trajectory Active / Mute / Solo
  elements.trajectoryActiveToggle.addEventListener('change', () => {
    polyEngine.toggleTrajectoryActive(polyEngine.selectedTrajectoryIndex);
    updateTrajectoryTabsUI();
  });

  elements.trajectoryMuteBtn.addEventListener('click', () => {
    polyEngine.toggleTrajectoryMute(polyEngine.selectedTrajectoryIndex);
    updateTrajectoryTabsUI();
  });

  elements.trajectorySoloBtn.addEventListener('click', () => {
    polyEngine.toggleTrajectorySolo(polyEngine.selectedTrajectoryIndex);
    updateTrajectoryTabsUI();
  });

  if (elements.trajectorySyncFromSelect) {
    elements.trajectorySyncFromSelect.addEventListener('change', (e) => {
      const fromIdx = parseInt(e.target.value, 10);
      if (!isNaN(fromIdx)) {
        polyEngine.copyTrajectorySettings(fromIdx, polyEngine.selectedTrajectoryIndex, proxemicsEngine);
        syncUIFromActiveTrajectory();
      }
    });
  }

  // Transport
  elements.playPauseBtn.addEventListener('click', () => {
    const curTraj = polyEngine.getSelectedTrajectory();
    const isPlaying = !curTraj.engine.isPlaying;
    polyEngine.setAllPlaying(isPlaying);
    elements.playPauseBtn.textContent = isPlaying ? '⏸ Pause' : '▶ Play';
  });

  elements.resetBtn.addEventListener('click', () => polyEngine.resetAllPhase());

  // Presets
  elements.presetSelect.addEventListener('change', (e) => {
    const pid = e.target.value;
    const preset = userPresets.find(p => p.id === pid);
    if (preset) {
      const curTraj = polyEngine.getSelectedTrajectory();
      applyPreset(preset, curTraj.engine);
      syncUIFromActiveTrajectory();
    }
  });

  elements.exportPresetsBtn.addEventListener('click', () => {
    const json = exportPresetsJSON(userPresets);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'spatiomorph_presets.json';
    a.click();
    URL.revokeObjectURL(url);
  });

  elements.importPresetsBtn.addEventListener('click', () => elements.presetFileInput.click());
  elements.presetFileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const imported = importPresetsJSON(evt.target.result);
      if (imported && Array.isArray(imported)) {
        userPresets = [...imported];
        populatePresets();
        alert(`Imported ${imported.length} presets successfully!`);
      }
    };
    reader.readAsText(file);
  });

  // Shape Select
  elements.shapeSelect.addEventListener('change', (e) => {
    const curTraj = polyEngine.getSelectedTrajectory();
    curTraj.engine.setShape(e.target.value);
    updateShapeInfo();
  });

  // Clock Rate Mode (Sync vs Free)
  elements.rateModeSync.addEventListener('change', () => {
    const curTraj = polyEngine.getSelectedTrajectory();
    curTraj.engine.rateMode = 'sync';
    syncUIFromActiveTrajectory();
  });

  elements.rateModeFree.addEventListener('change', () => {
    const curTraj = polyEngine.getSelectedTrajectory();
    curTraj.engine.rateMode = 'free';
    syncUIFromActiveTrajectory();
  });

  // BPM
  const updateBpm = (val) => {
    const bpm = Math.max(20, Math.min(300, parseFloat(val) || 120));
    polyEngine.setMasterBpm(bpm);
    elements.bpmInput.value = bpm;
    elements.bpmSlider.value = bpm;
  };
  elements.bpmInput.addEventListener('input', (e) => updateBpm(e.target.value));
  elements.bpmSlider.addEventListener('input', (e) => updateBpm(e.target.value));

  // Note Division
  elements.noteDivSelect.addEventListener('change', (e) => {
    const curTraj = polyEngine.getSelectedTrajectory();
    curTraj.engine.noteDivision = e.target.value;
  });

  // Free Tri-Mode Sub-Buttons
  elements.freeSubTimeBtn.addEventListener('click', () => updateFreeTriModeUI('time'));
  elements.freeSubLfoBtn.addEventListener('click', () => updateFreeTriModeUI('lfo'));
  elements.freeSubVcoBtn.addEventListener('click', () => updateFreeTriModeUI('vco'));

  // Free Tri-Mode Sliders & Direct Numeric Inputs (Two-Way Synced)
  elements.freeTimeSlider.addEventListener('input', (e) => {
    const curTraj = polyEngine.getSelectedTrajectory();
    const val = parseFloat(e.target.value);
    curTraj.engine.freeTimeSec = val;
    if (elements.freeTimeInput) elements.freeTimeInput.value = val.toFixed(3);
    if (elements.freeTimeVal) elements.freeTimeVal.textContent = val < 1 ? `${(val * 1000).toFixed(0)}ms` : `${val.toFixed(2)}s`;
  });
  if (elements.freeTimeInput) {
    elements.freeTimeInput.addEventListener('input', (e) => {
      const curTraj = polyEngine.getSelectedTrajectory();
      const val = Math.max(0.001, Math.min(300, parseFloat(e.target.value) || 0.001));
      curTraj.engine.freeTimeSec = val;
      elements.freeTimeSlider.value = val;
      if (elements.freeTimeVal) elements.freeTimeVal.textContent = val < 1 ? `${(val * 1000).toFixed(0)}ms` : `${val.toFixed(2)}s`;
    });
  }

  elements.freeLfoSlider.addEventListener('input', (e) => {
    const curTraj = polyEngine.getSelectedTrajectory();
    const val = parseFloat(e.target.value);
    curTraj.engine.freeLfoHz = val;
    if (elements.freeLfoInput) elements.freeLfoInput.value = val.toFixed(3);
    if (elements.freeLfoVal) elements.freeLfoVal.textContent = `${val.toFixed(3)} Hz`;
  });
  if (elements.freeLfoInput) {
    elements.freeLfoInput.addEventListener('input', (e) => {
      const curTraj = polyEngine.getSelectedTrajectory();
      const val = Math.max(0.001, Math.min(2.0, parseFloat(e.target.value) || 0.001));
      curTraj.engine.freeLfoHz = val;
      elements.freeLfoSlider.value = val;
      if (elements.freeLfoVal) elements.freeLfoVal.textContent = `${val.toFixed(3)} Hz`;
    });
  }

  elements.freeVcoSlider.addEventListener('input', (e) => {
    const curTraj = polyEngine.getSelectedTrajectory();
    const val = parseFloat(e.target.value);
    curTraj.engine.freeVcoHz = val;
    if (elements.freeVcoInput) elements.freeVcoInput.value = val.toFixed(1);
    if (elements.freeVcoVal) elements.freeVcoVal.textContent = `${val.toFixed(1)} Hz`;
  });
  if (elements.freeVcoInput) {
    elements.freeVcoInput.addEventListener('input', (e) => {
      const curTraj = polyEngine.getSelectedTrajectory();
      const val = Math.max(1.0, Math.min(600.0, parseFloat(e.target.value) || 1.0));
      curTraj.engine.freeVcoHz = val;
      elements.freeVcoSlider.value = val;
      if (elements.freeVcoVal) elements.freeVcoVal.textContent = `${val.toFixed(1)} Hz`;
    });
  }

  // Direction & Behavioral Lock
  elements.directionSelect.addEventListener('change', (e) => {
    const curTraj = polyEngine.getSelectedTrajectory();
    curTraj.engine.direction = e.target.value;
    if (elements.directionRateContainer) {
      if (e.target.value === 'drunk') {
        elements.directionRateContainer.classList.remove('hidden');
        if (elements.directionRateLabel) elements.directionRateLabel.textContent = 'Drunkenness';
        elements.directionRateSlider.value = curTraj.engine.directionRate || 1.0;
        if (elements.directionRateVal) elements.directionRateVal.textContent = `${(curTraj.engine.directionRate || 1.0).toFixed(2)}x`;
      } else if (e.target.value === 'random_smooth') {
        elements.directionRateContainer.classList.remove('hidden');
        if (elements.directionRateLabel) elements.directionRateLabel.textContent = 'Teleportation Rate';
        elements.directionRateSlider.value = curTraj.engine.directionRate || 1.0;
        if (elements.directionRateVal) elements.directionRateVal.textContent = `${(curTraj.engine.directionRate || 1.0).toFixed(2)}x`;
      } else {
        elements.directionRateContainer.classList.add('hidden');
      }
    }
  });

  if (elements.directionRateSlider) {
    elements.directionRateSlider.addEventListener('input', (e) => {
      const curTraj = polyEngine.getSelectedTrajectory();
      const val = parseFloat(e.target.value);
      curTraj.engine.directionRate = val;
      if (elements.directionRateVal) elements.directionRateVal.textContent = `${val.toFixed(2)}x`;
    });
  }

  elements.behavioralLockSelect.addEventListener('change', (e) => {
    const curTraj = polyEngine.getSelectedTrajectory();
    proxemicsEngine.activeZoneLocks.set(curTraj.id, e.target.value);
  });

  // Phase & Start Angle
  elements.phaseOffsetSlider.addEventListener('input', (e) => {
    const val = parseFloat(e.target.value);
    const curTraj = polyEngine.getSelectedTrajectory();
    curTraj.engine.phaseOffsetDeg = val;
    elements.phaseOffsetVal.textContent = `${val}°`;
  });

  elements.startAngleSlider.addEventListener('input', (e) => {
    const val = parseFloat(e.target.value);
    const curTraj = polyEngine.getSelectedTrajectory();
    curTraj.engine.startPointDeg = val;
    elements.startAngleVal.textContent = `${val}°`;
  });

  // Scale & Transform
  elements.masterScaleSlider.addEventListener('input', (e) => {
    const val = parseFloat(e.target.value);
    const curTraj = polyEngine.getSelectedTrajectory();
    curTraj.engine.masterScale = val;
    elements.masterScaleVal.textContent = `${Math.round(val * 100)}%`;
  });

  elements.scaleXSlider.addEventListener('input', (e) => {
    const val = parseFloat(e.target.value);
    const curTraj = polyEngine.getSelectedTrajectory();
    curTraj.engine.scaleX = val;
    elements.scaleXVal.textContent = `${Math.round(val * 100)}%`;
  });

  elements.scaleYSlider.addEventListener('input', (e) => {
    const val = parseFloat(e.target.value);
    const curTraj = polyEngine.getSelectedTrajectory();
    curTraj.engine.scaleY = val;
    elements.scaleYVal.textContent = `${Math.round(val * 100)}%`;
  });

  elements.centerXSlider.addEventListener('input', (e) => {
    const val = parseFloat(e.target.value);
    const curTraj = polyEngine.getSelectedTrajectory();
    curTraj.engine.centerX = val;
    elements.centerXVal.textContent = val.toFixed(2);
  });

  elements.centerYSlider.addEventListener('input', (e) => {
    const val = parseFloat(e.target.value);
    const curTraj = polyEngine.getSelectedTrajectory();
    curTraj.engine.centerY = val;
    elements.centerYVal.textContent = val.toFixed(2);
  });

  elements.resetCenterBtn.addEventListener('click', () => {
    const curTraj = polyEngine.getSelectedTrajectory();
    curTraj.engine.centerX = 0;
    curTraj.engine.centerY = 0;
    elements.centerXSlider.value = 0;
    elements.centerXVal.textContent = '0.00';
    elements.centerYSlider.value = 0;
    elements.centerYVal.textContent = '0.00';
  });

  // Surround Panner Target Parameters
  elements.rotationSlider.addEventListener('input', (e) => {
    const val = parseFloat(e.target.value);
    const curTraj = polyEngine.getSelectedTrajectory();
    curTraj.engine.rotationDeg = val;
    elements.rotationVal.textContent = `${val}°`;
  });

  elements.autoRotateSlider.addEventListener('input', (e) => {
    const val = parseFloat(e.target.value);
    const curTraj = polyEngine.getSelectedTrajectory();
    curTraj.engine.autoRotateSpeed = val;
    elements.autoRotateVal.textContent = `${val}°/s`;
  });

  elements.focusSlider.addEventListener('input', (e) => {
    const val = parseFloat(e.target.value);
    const curTraj = polyEngine.getSelectedTrajectory();
    curTraj.engine.focus = val;
    elements.focusVal.textContent = `${val}%`;
  });

  elements.centerSlider.addEventListener('input', (e) => {
    const val = parseFloat(e.target.value);
    const curTraj = polyEngine.getSelectedTrajectory();
    curTraj.engine.center = val;
    elements.centerVal.textContent = `${val}%`;
  });

  elements.smoothSlider.addEventListener('input', (e) => {
    const val = parseFloat(e.target.value);
    const curTraj = polyEngine.getSelectedTrajectory();
    curTraj.engine.smooth = val;
    elements.smoothVal.textContent = `${val}%`;
  });

  // Spectral Coupler
  if (elements.spectralCouplingCheck) {
    elements.spectralCouplingCheck.addEventListener('change', (e) => spectralCoupler.enabled = e.target.checked);
  }
  elements.specFocusCheck.addEventListener('change', (e) => spectralCoupler.focusCoupling = e.target.checked);
  elements.specCenterCheck.addEventListener('change', (e) => spectralCoupler.centerCoupling = e.target.checked);
  elements.specGravSmoothCheck.addEventListener('change', (e) => spectralCoupler.gravitationalSmooth = e.target.checked);

  // Vectorial Events
  elements.triggerWipeBtn.addEventListener('click', () => {
    const mode = elements.wipeModeSelect.value;
    vectorialWipe.triggerWipe(mode, 2.0);
  });

  vectorialWipe.onShiftCallback = () => {
    polyEngine.voices.forEach(v => {
      v.engine.phaseOffsetDeg = (v.engine.phaseOffsetDeg + 90) % 360;
    });
    syncUIFromActiveTrajectory();
  };

  elements.triggerBreachBtn.addEventListener('click', () => {
    vectorialWipe.triggerDistalBreach(1.2);
  });

  // Snapshots Morpher Controls
  elements.morphCurveSelect.addEventListener('change', (e) => snapshotMorpher.morphCurve = e.target.value);
  elements.morphDurationSlider.addEventListener('input', (e) => {
    const val = parseFloat(e.target.value);
    snapshotMorpher.morphDurationSec = val;
    elements.morphDurationVal.textContent = `${val.toFixed(1)}s`;
  });
  elements.morphDivisionSelect.addEventListener('change', (e) => {
    snapshotMorpher.morphDivision = e.target.value;
  });

  // Context Menu Actions
  elements.ctxRecallBtn.addEventListener('click', () => {
    if (contextMenuSlotIndex >= 0) {
      snapshotMorpher.recallSnapshot(contextMenuSlotIndex);
      updateSnapshotPadsUI();
      syncUIFromActiveTrajectory();
    }
    closeSnapshotContextMenu();
  });

  elements.ctxMorphBtn.addEventListener('click', () => {
    if (contextMenuSlotIndex >= 0) {
      snapshotMorpher.morphToSlot(contextMenuSlotIndex);
      updateSnapshotPadsUI();
    }
    closeSnapshotContextMenu();
  });

  elements.ctxStoreBtn.addEventListener('click', () => {
    if (contextMenuSlotIndex >= 0) {
      snapshotMorpher.storeSnapshot(contextMenuSlotIndex);
      updateSnapshotPadsUI();
    }
    closeSnapshotContextMenu();
  });

  elements.ctxDeleteBtn.addEventListener('click', () => {
    if (contextMenuSlotIndex >= 0) {
      snapshotMorpher.deleteSnapshot(contextMenuSlotIndex);
      updateSnapshotPadsUI();
    }
    closeSnapshotContextMenu();
  });

  document.addEventListener('click', (e) => {
    if (!elements.snapshotContextMenu.contains(e.target)) {
      closeSnapshotContextMenu();
    }
  });

  // Space-Form Accumulator controls
  elements.decayModeSelect.addEventListener('change', (e) => spaceFormAccumulator.decayMode = e.target.value);
  elements.clearAccumulatorBtn.addEventListener('click', () => spaceFormAccumulator.clear());
  elements.exportScoreBtn.addEventListener('click', () => spaceFormAccumulator.exportScore());

  // Visual toggles
  elements.showTrailCheck.addEventListener('change', (e) => canvasRenderer.showTrail = e.target.checked);
  elements.showTrajectoryCheck.addEventListener('change', (e) => canvasRenderer.showTrajectory = e.target.checked);
  elements.showProxemicsCheck.addEventListener('change', (e) => canvasRenderer.showProxemics = e.target.checked);
  elements.showAccumulatorCheck.addEventListener('change', (e) => canvasRenderer.showAccumulator = e.target.checked);
  elements.showMetersCheck.addEventListener('change', (e) => canvasRenderer.showMeters = e.target.checked);
  elements.showGridCheck.addEventListener('change', (e) => canvasRenderer.showGrid = e.target.checked);

  // Web MIDI Modal Pop-up
  elements.openMidiModalBtn.addEventListener('click', () => elements.midiModal.classList.remove('hidden'));
  elements.closeMidiModalBtn.addEventListener('click', () => elements.midiModal.classList.add('hidden'));
  elements.midiModal.addEventListener('click', (e) => {
    if (e.target === elements.midiModal) elements.midiModal.classList.add('hidden');
  });
}

function initKeyboardShortcuts() {
  window.addEventListener('keydown', (e) => {
    // Ignore if user is typing in an input or select
    if (['INPUT', 'SELECT', 'TEXTAREA'].includes(e.target.tagName)) return;

    // Numpad 1..9 or Digit 1..9 triggers Morph to snapshot
    let padNumber = null;
    if (e.code.startsWith('Numpad') && e.code.length === 7) {
      padNumber = parseInt(e.code.slice(6), 10);
    } else if (e.code.startsWith('Digit') && e.code.length === 6) {
      padNumber = parseInt(e.code.slice(5), 10);
    }

    if (padNumber >= 1 && padNumber <= 9) {
      const slotIndex = padNumber - 1;
      if (snapshotMorpher.hasSnapshot(slotIndex)) {
        snapshotMorpher.morphToSlot(slotIndex);
        updateSnapshotPadsUI();
      }
    }
  });
}

async function initMidi() {
  const available = await midiController.init();
  if (available) {
    updateMidiPorts(midiController.getAvailablePorts());
    midiController.onStateChangeCallback = (ports) => updateMidiPorts(ports);
  } else {
    elements.midiPortSelect.innerHTML = '<option value="">Web MIDI unavailable in this browser</option>';
  }

  elements.midiToggle.addEventListener('change', (e) => {
    midiController.enabled = e.target.checked;
    const color = e.target.checked ? '#52b788' : '#475569';
    elements.midiMainLed.style.backgroundColor = color;
    elements.midiModalLed.style.backgroundColor = color;
    elements.midiStatusSummary.textContent = e.target.checked
      ? `Streaming on ${midiController.selectedPort?.name || 'Virtual MIDI Port'}`
      : 'Status: Disabled';
  });

  elements.midiPortSelect.addEventListener('change', (e) => midiController.setPort(e.target.value));
  elements.midiRoutingModeSelect.addEventListener('change', (e) => {
    midiController.routingMode = e.target.value;
    updateMidiCcMapUI();
  });
  elements.midiChannelSelect.addEventListener('change', (e) => {
    midiController.setBaseChannel(parseInt(e.target.value, 10));
    updateMidiCcMapUI();
  });

  if (elements.midiTrajectoryTabs) {
    elements.midiTrajectoryTabs.forEach(btn => {
      btn.addEventListener('click', () => {
        midiViewTrajectoryIdx = parseInt(btn.getAttribute('data-traj') || '0', 10);
        updateMidiCcMapUI();
      });
    });
  }
  updateMidiCcMapUI();
}

let midiViewTrajectoryIdx = 0;

function updateMidiCcMapUI() {
  const mode = midiController.routingMode;
  const baseChan = midiController.baseChannel + 1;

  if (elements.midiTrajectoryTabs) {
    elements.midiTrajectoryTabs.forEach((btn, idx) => {
      const isSelected = idx === midiViewTrajectoryIdx;
      btn.className = isSelected
        ? 'midi-tab-btn px-1.5 py-1 text-[10px] font-bold rounded bg-emerald-700 text-white border border-emerald-500 transition'
        : 'midi-tab-btn px-1.5 py-1 text-[10px] font-bold rounded bg-card-themed border border-themed text-slate-400 hover:border-accent-themed transition';
    });
  }

  let targetChan = baseChan;
  let ccOffset = 0;

  if (mode === 'channels') {
    targetChan = ((midiController.baseChannel + midiViewTrajectoryIdx) % 16) + 1;
    ccOffset = 0;
    if (elements.midiRoutingSummaryLabel) {
      elements.midiRoutingSummaryLabel.textContent = `T${midiViewTrajectoryIdx + 1} (Ch ${targetChan}, CC 20–27)`;
    }
  } else {
    targetChan = baseChan;
    ccOffset = midiViewTrajectoryIdx * 8;
    if (elements.midiRoutingSummaryLabel) {
      elements.midiRoutingSummaryLabel.textContent = `T${midiViewTrajectoryIdx + 1} (Ch ${targetChan}, CC ${20 + ccOffset}–${27 + ccOffset})`;
    }
  }

  if (elements.ccMapX) elements.ccMapX.textContent = `CC ${20 + ccOffset}`;
  if (elements.ccMapY) elements.ccMapY.textContent = `CC ${21 + ccOffset}`;
  if (elements.ccMapRot) elements.ccMapRot.textContent = `CC ${22 + ccOffset}`;
  if (elements.ccMapFocus) elements.ccMapFocus.textContent = `CC ${23 + ccOffset}`;
  if (elements.ccMapCenter) elements.ccMapCenter.textContent = `CC ${24 + ccOffset}`;
  if (elements.ccMapSmooth) elements.ccMapSmooth.textContent = `CC ${25 + ccOffset}`;
  if (elements.ccMapFilter) elements.ccMapFilter.textContent = `CC ${26 + ccOffset}`;
  if (elements.ccMapVol) elements.ccMapVol.textContent = `CC ${27 + ccOffset}`;
}

function updateMidiPorts(ports) {
  elements.midiPortSelect.innerHTML = '';
  if (ports.length === 0) {
    elements.midiPortSelect.innerHTML = '<option value="">No MIDI output ports found</option>';
    return;
  }
  for (const p of ports) {
    const opt = document.createElement('option');
    opt.value = p.id;
    opt.textContent = p.name;
    elements.midiPortSelect.appendChild(opt);
  }
  if (midiController.selectedPort) {
    elements.midiPortSelect.value = midiController.selectedPort.id;
  }
}

function animationLoop(timestamp) {
  const dt = Math.min((timestamp - lastTimestamp) / 1000, 0.1);
  lastTimestamp = timestamp;

  const curTraj = polyEngine.getSelectedTrajectory();
  const clockRateMode = curTraj.engine.rateMode;
  const masterBpm = curTraj.engine.bpm;

  // 1. Update Snapshot Morpher (Interpolates parameters & crossfades shapes in real time)
  const morphStatus = snapshotMorpher.update(dt, clockRateMode, masterBpm);
  if (morphStatus.isMorphing) {
    elements.morphStatusBadge.textContent = `Morphing (${Math.round(morphStatus.progress * 100)}%)`;
    elements.morphProgressBar.style.width = `${Math.round(morphStatus.progress * 100)}%`;
    updateSnapshotPadsUI();
    syncUIFromActiveTrajectory();
  } else {
    elements.morphStatusBadge.textContent = morphStatus.activeSlot >= 0 ? `Pad ${snapshotMorpher.getNumpadKey(morphStatus.activeSlot)}` : 'Idle';
    elements.morphProgressBar.style.width = '0%';
  }

  // 2. Update Vectorial Wipe & Distal Breach
  const wipeState = vectorialWipe.update(dt);

  // 3. Update Polyphonic Trajectories Engine
  const rawTrajectoryStates = polyEngine.update(dt);

  // Update Ipê-amarelo spectral diffusion time-dependent state (LUT scramble timer & Maresia)
  spectralDiffusionEngine.update(timestamp);

  // 4. Post-process Trajectories through Proxemics, Personality processing, Spectral Coupler, and Volume Ducking
  const processedTrajectoryStates = rawTrajectoryStates.map(t => {
    const eState = { ...t.state };
    const vEngine = polyEngine.voices[t.index].engine;

    // Apply Proxemic Behavioral Lock (Pounamu mode)
    if (polyEngine.personality === 'pounamu') {
      const lockMode = proxemicsEngine.activeZoneLocks.get(t.id) || 'none';
      const lockedCoord = proxemicsEngine.applyBehavioralLock(eState.x, eState.y, lockMode);
      eState.x = lockedCoord.x;
      eState.y = lockedCoord.y;
    } else if (polyEngine.personality === 'biloba') {
      const bRes = figuresEngine.processCoordinate(eState.x, eState.y, vEngine.phase, t.index);
      eState.x = bRes.x;
      eState.y = bRes.y;
    } else if (polyEngine.personality === 'kornblume') {
      const kRes = blauertEngine.processCoordinate(eState.x, eState.y, t.index);
      eState.x = kRes.x;
      eState.y = kRes.y;
    } else if (polyEngine.personality === 'calcite') {
      const cRes = birefringenceEngine.processCoordinate(eState.x, eState.y);
      eState.x = cRes.ordinary.x;
      eState.y = cRes.ordinary.y;
    } else if (polyEngine.personality === 'ipe_amarelo') {
      const iRes = spectralDiffusionEngine.processCoordinate(eState.x, eState.y, t.index);
      eState.x = iRes.x;
      eState.y = iRes.y;
    }

    // Apply Vectorial Volume Ducking (starts at 127, ducks during wipes & breaches)
    const voiceVolume = vectorialWipe.computeVoiceVolume(eState.x, eState.y);

    // Apply Spectral Space Coupling (Focus, Center, Smooth gravitation, Filter CC 26)
    const spectralResult = spectralCoupler.process(eState);

    return {
      ...t,
      state: eState,
      spectralState: spectralResult,
      volume: voiceVolume
    };
  });

  // 5. Accumulate into Space-Form Memory Buffer
  const activeForAccumulator = processedTrajectoryStates.map(t => ({
    x: t.state.x,
    y: t.state.y,
    audible: t.audible,
    palette: t.palette
  }));
  spaceFormAccumulator.accumulate(activeForAccumulator, dt);

  // 6. Sample Paths for Active Trajectories (Synchronized with Spatial Transformation & Personality)
  const sampledPaths = {};
  for (const t of processedTrajectoryStates) {
    if (!t.active) continue;
    const vEngine = polyEngine.voices[t.index].engine;
    const rawPath = vEngine.getSampledPath(180);
    let transformedPoints = rawPath;

    if (polyEngine.personality === 'pounamu') {
      const lockMode = proxemicsEngine.activeZoneLocks.get(t.id) || 'none';
      transformedPoints = rawPath.map(pt => proxemicsEngine.applyBehavioralLock(pt.x, pt.y, lockMode));
    } else if (polyEngine.personality === 'biloba') {
      transformedPoints = rawPath.map(pt => {
        const bRes = figuresEngine.processCoordinate(pt.x, pt.y, vEngine.phase, t.index);
        return { x: bRes.x, y: bRes.y };
      });
    } else if (polyEngine.personality === 'kornblume') {
      transformedPoints = rawPath.map(pt => {
        const kRes = blauertEngine.processCoordinate(pt.x, pt.y, t.index);
        return { x: kRes.x, y: kRes.y };
      });
    } else if (polyEngine.personality === 'calcite') {
      transformedPoints = rawPath.map(pt => {
        const cRes = birefringenceEngine.processCoordinate(pt.x, pt.y);
        return { x: cRes.ordinary.x, y: cRes.ordinary.y };
      });
    } else if (polyEngine.personality === 'ipe_amarelo') {
      transformedPoints = rawPath.map(pt => {
        const iRes = spectralDiffusionEngine.processCoordinate(pt.x, pt.y, t.index);
        return { x: iRes.x, y: iRes.y };
      });
    }
    sampledPaths[t.index] = transformedPoints;
  }

  // 7. Calculate Speaker Gains for Selected Trajectory
  const selTraj = processedTrajectoryStates[polyEngine.selectedTrajectoryIndex] || processedTrajectoryStates[0];
  let speakerGains = speakerEngine.calculateGains(
    selTraj.state.x,
    selTraj.state.y,
    selTraj.spectralState.focus,
    selTraj.spectralState.center
  );

  // Modulate speaker gains with Personality engine
  if (polyEngine.personality === 'biloba') {
    speakerGains = figuresEngine.applyToSpeakerGains(speakerGains, selTraj.state.x, selTraj.state.y);
  } else if (polyEngine.personality === 'kornblume') {
    speakerGains = blauertEngine.applyToSpeakerGains(speakerGains);
  } else if (polyEngine.personality === 'calcite') {
    const cRes = birefringenceEngine.processCoordinate(selTraj.state.x, selTraj.state.y);
    speakerGains = birefringenceEngine.applyToSpeakerGains(speakerGains, cRes.ordinary, cRes.extraordinary);
  } else if (polyEngine.personality === 'ipe_amarelo') {
    speakerGains = spectralDiffusionEngine.applyToSpeakerGains(speakerGains);
  }

  // 8. Render Canvas
  canvasRenderer.render(
    processedTrajectoryStates,
    sampledPaths,
    speakerGains,
    wipeState,
    polyEngine.selectedTrajectoryIndex
  );

  // 9. Stream Web MIDI Output (CC 20..25, CC 26 Filter, CC 27 Volume)
  midiController.updateTrajectories(processedTrajectoryStates);

  // 10. Update Live Monitors
  updateLiveMonitors(selTraj);

  requestAnimationFrame(animationLoop);
}

function updateLiveMonitors(curTraj) {
  const s = curTraj.state;
  const spec = curTraj.spectralState;

  elements.monX.textContent = s.x.toFixed(3);
  elements.monY.textContent = s.y.toFixed(3);
  elements.monRot.textContent = `${Math.round(s.rotationDeg)}°`;
  elements.monFocus.textContent = `${Math.round(spec.focus)}%`;
  elements.monCenter.textContent = `${Math.round(spec.center)}%`;
  elements.monSmooth.textContent = `${Math.round(spec.smooth)}%`;
  elements.monVelocity.textContent = `${s.velocity.toFixed(2)} u/s`;

  // Dynamically update rotation slider when auto-rotate spin is active
  const voiceEngine = polyEngine.voices[curTraj.index !== undefined ? curTraj.index : polyEngine.selectedTrajectoryIndex]?.engine;
  if (voiceEngine && voiceEngine.autoRotateSpeed !== 0 && elements.rotationSlider) {
    elements.rotationSlider.value = Math.round(s.rotationDeg);
    if (elements.rotationVal) elements.rotationVal.textContent = `${Math.round(s.rotationDeg)}°`;
  }

  const zone = proxemicsEngine.getZoneForPoint(s.x, s.y);
  elements.monZone.textContent = zone.name.split('/')[0].trim();

  // Phase bar of selected trajectory
  elements.phaseBar.style.width = `${(s.effectivePhase * 100).toFixed(1)}%`;
  const mins = Math.floor(polyEngine.voices[0].engine.currentTime / 60);
  const secs = (polyEngine.voices[0].engine.currentTime % 60).toFixed(1);
  elements.timeDisplay.textContent = `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}
