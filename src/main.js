/**
 * Spatiomorphology - Main Application Logic
 * Integrates Trajectories, Motion Engine, Speaker Layout, Canvas Renderer,
 * Presets, and Web MIDI.
 */

import { ShapeRegistry } from './math/trajectories.js';
import { MotionEngine, NOTE_DIVISIONS } from './engine/motionEngine.js';
import { SpeakerSimulationEngine, SPEAKER_CONFIGS } from './engine/speakerLayout.js';
import { CanvasRenderer } from './ui/canvasRenderer.js';
import { MidiOutputController } from './io/midiOut.js';
import { PRESET_BANK, applyPreset, exportPresetsJSON, importPresetsJSON } from './io/presets.js';

// Instantiate Core Engines
const shapeRegistry = new ShapeRegistry();
const motionEngine = new MotionEngine(shapeRegistry);
const speakerEngine = new SpeakerSimulationEngine('quad');
const midiController = new MidiOutputController();

let canvasRenderer = null;
let lastTimestamp = performance.now();
let userPresets = [...PRESET_BANK];

// DOM Elements Cache
let elements = {};

window.addEventListener('DOMContentLoaded', () => {
  initDOMElements();
  initCanvas();
  populatePresets();
  populateShapes();
  populateNoteDivisions();
  initEventHandlers();
  initMidi();
  syncUIFromEngine();

  // Kick off animation loop
  requestAnimationFrame(animationLoop);
});

function initDOMElements() {
  elements = {
    canvas: document.getElementById('pannerCanvas'),
    // Transport
    playPauseBtn: document.getElementById('playPauseBtn'),
    resetBtn: document.getElementById('resetBtn'),
    timeDisplay: document.getElementById('timeDisplay'),
    phaseBar: document.getElementById('phaseBar'),
    // Presets
    presetSelect: document.getElementById('presetSelect'),
    presetDesc: document.getElementById('presetDesc'),
    exportPresetsBtn: document.getElementById('exportPresetsBtn'),
    importPresetsBtn: document.getElementById('importPresetsBtn'),
    presetFileInput: document.getElementById('presetFileInput'),
    // Layout
    layoutSelect: document.getElementById('layoutSelect'),
    // Shapes
    shapeSelect: document.getElementById('shapeSelect'),
    shapeCategory: document.getElementById('shapeCategory'),
    shapeDesc: document.getElementById('shapeDesc'),
    shapeParamsContainer: document.getElementById('shapeParamsContainer'),
    // Temporal & Motion
    rateModeSync: document.getElementById('rateModeSync'),
    rateModeFree: document.getElementById('rateModeFree'),
    syncControls: document.getElementById('syncControls'),
    freeControls: document.getElementById('freeControls'),
    bpmInput: document.getElementById('bpmInput'),
    bpmSlider: document.getElementById('bpmSlider'),
    noteDivSelect: document.getElementById('noteDivSelect'),
    freeHzInput: document.getElementById('freeHzInput'),
    freeHzSlider: document.getElementById('freeHzSlider'),
    directionSelect: document.getElementById('directionSelect'),
    phaseOffsetSlider: document.getElementById('phaseOffsetSlider'),
    phaseOffsetVal: document.getElementById('phaseOffsetVal'),
    startAngleSlider: document.getElementById('startAngleSlider'),
    startAngleVal: document.getElementById('startAngleVal'),
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
    // Surround Panner Target Parameters
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
    // Visual Options
    showTrailCheck: document.getElementById('showTrailCheck'),
    showTrajectoryCheck: document.getElementById('showTrajectoryCheck'),
    showGridCheck: document.getElementById('showGridCheck'),
    showMetersCheck: document.getElementById('showMetersCheck'),
    // Live Monitor Badges
    monX: document.getElementById('monX'),
    monY: document.getElementById('monY'),
    monRot: document.getElementById('monRot'),
    monFocus: document.getElementById('monFocus'),
    monCenter: document.getElementById('monCenter'),
    monSmooth: document.getElementById('monSmooth'),
    monVelocity: document.getElementById('monVelocity'),
    monFreq: document.getElementById('monFreq'),
    // MIDI
    midiToggle: document.getElementById('midiToggle'),
    midiPortSelect: document.getElementById('midiPortSelect'),
    midiChannelSelect: document.getElementById('midiChannelSelect'),
    midiLed: document.getElementById('midiLed'),
    ccInputX: document.getElementById('ccInputX'),
    ccInputY: document.getElementById('ccInputY'),
    ccInputRot: document.getElementById('ccInputRot'),
    ccInputFocus: document.getElementById('ccInputFocus'),
    ccInputCenter: document.getElementById('ccInputCenter'),
    ccInputSmooth: document.getElementById('ccInputSmooth')
  };
}

function initCanvas() {
  canvasRenderer = new CanvasRenderer(elements.canvas);
  window.addEventListener('resize', () => {
    canvasRenderer.resize();
  });

  // Canvas interactive drag for Center Offset
  let isDragging = false;
  elements.canvas.addEventListener('mousedown', (e) => {
    isDragging = true;
    updateCenterFromMouse(e);
  });
  window.addEventListener('mousemove', (e) => {
    if (isDragging) {
      updateCenterFromMouse(e);
    }
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

  motionEngine.centerX = Math.max(-1, Math.min(1, norm.x));
  motionEngine.centerY = Math.max(-1, Math.min(1, norm.y));

  elements.centerXSlider.value = motionEngine.centerX;
  elements.centerXVal.textContent = motionEngine.centerX.toFixed(2);
  elements.centerYSlider.value = motionEngine.centerY;
  elements.centerYVal.textContent = motionEngine.centerY.toFixed(2);
}

function populatePresets() {
  elements.presetSelect.innerHTML = '<option value="">-- Select Spectromorphology Preset --</option>';
  for (const preset of userPresets) {
    const opt = document.createElement('option');
    opt.value = preset.id;
    opt.textContent = `${preset.name} (${preset.category})`;
    elements.presetSelect.appendChild(opt);
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

  elements.shapeSelect.value = motionEngine.activeShapeId;
  updateShapeInfo();
}

function populateNoteDivisions() {
  elements.noteDivSelect.innerHTML = '';
  for (const [div, beats] of Object.entries(NOTE_DIVISIONS)) {
    const opt = document.createElement('option');
    opt.value = div;
    opt.textContent = `${div} (${beats} beat${beats > 1 ? 's' : ''})`;
    elements.noteDivSelect.appendChild(opt);
  }
  elements.noteDivSelect.value = motionEngine.noteDivision;
}

function updateShapeInfo() {
  const shape = shapeRegistry.get(motionEngine.activeShapeId);
  if (!shape) return;

  elements.shapeCategory.textContent = shape.category;
  elements.shapeDesc.textContent = shape.description;

  // Render dynamic parameter sliders for this shape
  elements.shapeParamsContainer.innerHTML = '';
  if (!shape.params || shape.params.length === 0) {
    elements.shapeParamsContainer.innerHTML = '<p class="text-xs text-slate-500 italic">No shape-specific parameters.</p>';
    return;
  }

  for (const param of shape.params) {
    const row = document.createElement('div');
    row.className = 'flex flex-col gap-1';

    const currentVal = motionEngine.shapeParams[param.id] ?? param.default;

    row.innerHTML = `
      <div class="flex justify-between items-center text-xs">
        <label class="text-slate-300 font-medium">${param.name}</label>
        <span id="param_val_${param.id}" class="text-cyan-400 font-mono text-[11px]">${currentVal}</span>
      </div>
      <input type="range" id="param_input_${param.id}" min="${param.min}" max="${param.max}" step="${param.step}" value="${currentVal}" class="w-full">
    `;

    elements.shapeParamsContainer.appendChild(row);

    const input = row.querySelector(`#param_input_${param.id}`);
    const valDisplay = row.querySelector(`#param_val_${param.id}`);

    input.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      motionEngine.shapeParams[param.id] = val;
      valDisplay.textContent = Number.isInteger(val) ? val : val.toFixed(2);
    });
  }
}

function initEventHandlers() {
  // Transport
  elements.playPauseBtn.addEventListener('click', () => {
    motionEngine.isPlaying = !motionEngine.isPlaying;
    elements.playPauseBtn.textContent = motionEngine.isPlaying ? '⏸ Pause' : '▶ Play';
    elements.playPauseBtn.className = motionEngine.isPlaying
      ? 'px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold rounded-lg shadow transition'
      : 'px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg shadow transition';
  });

  elements.resetBtn.addEventListener('click', () => {
    motionEngine.accumulatedPhase = 0;
    motionEngine.currentTime = 0;
  });

  // Presets
  elements.presetSelect.addEventListener('change', (e) => {
    const pid = e.target.value;
    const preset = userPresets.find(p => p.id === pid);
    if (preset) {
      applyPreset(preset, motionEngine);
      elements.presetDesc.textContent = preset.description;
      syncUIFromEngine();
      updateShapeInfo();
    }
  });

  elements.exportPresetsBtn.addEventListener('click', () => {
    const json = exportPresetsJSON(userPresets);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'spatiomorphology_presets.json';
    a.click();
    URL.revokeObjectURL(url);
  });

  elements.importPresetsBtn.addEventListener('click', () => {
    elements.presetFileInput.click();
  });

  elements.presetFileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const imported = importPresetsJSON(evt.target.result);
      if (imported && Array.isArray(imported)) {
        userPresets = [...imported];
        populatePresets();
        alert(`Successfully imported ${imported.length} presets!`);
      } else {
        alert('Invalid preset file.');
      }
    };
    reader.readAsText(file);
  });

  // Speaker Layout
  elements.layoutSelect.addEventListener('change', (e) => {
    speakerEngine.setLayout(e.target.value);
  });

  // Shape Select
  elements.shapeSelect.addEventListener('change', (e) => {
    motionEngine.setShape(e.target.value);
    updateShapeInfo();
  });

  // Rate Mode
  elements.rateModeSync.addEventListener('change', () => {
    motionEngine.rateMode = 'sync';
    elements.syncControls.classList.remove('hidden');
    elements.freeControls.classList.add('hidden');
  });

  elements.rateModeFree.addEventListener('change', () => {
    motionEngine.rateMode = 'free';
    elements.syncControls.classList.add('hidden');
    elements.freeControls.classList.remove('hidden');
  });

  // BPM
  const updateBpm = (val) => {
    const bpm = Math.max(20, Math.min(300, parseFloat(val) || 120));
    motionEngine.bpm = bpm;
    elements.bpmInput.value = bpm;
    elements.bpmSlider.value = bpm;
  };
  elements.bpmInput.addEventListener('input', (e) => updateBpm(e.target.value));
  elements.bpmSlider.addEventListener('input', (e) => updateBpm(e.target.value));

  // Note Division
  elements.noteDivSelect.addEventListener('change', (e) => {
    motionEngine.noteDivision = e.target.value;
  });

  // Free Hz
  const updateHz = (val) => {
    const hz = Math.max(0.01, Math.min(20, parseFloat(val) || 0.5));
    motionEngine.freeHz = hz;
    elements.freeHzInput.value = hz.toFixed(2);
    elements.freeHzSlider.value = hz;
  };
  elements.freeHzInput.addEventListener('input', (e) => updateHz(e.target.value));
  elements.freeHzSlider.addEventListener('input', (e) => updateHz(e.target.value));

  // Direction
  elements.directionSelect.addEventListener('change', (e) => {
    motionEngine.direction = e.target.value;
  });

  // Phase Offset
  elements.phaseOffsetSlider.addEventListener('input', (e) => {
    const val = parseFloat(e.target.value);
    motionEngine.phaseOffsetDeg = val;
    elements.phaseOffsetVal.textContent = `${val}°`;
  });

  // Start Angle
  elements.startAngleSlider.addEventListener('input', (e) => {
    const val = parseFloat(e.target.value);
    motionEngine.startPointDeg = val;
    elements.startAngleVal.textContent = `${val}°`;
  });

  // Scale & Transform
  elements.masterScaleSlider.addEventListener('input', (e) => {
    const val = parseFloat(e.target.value);
    motionEngine.masterScale = val;
    elements.masterScaleVal.textContent = `${Math.round(val * 100)}%`;
  });

  elements.scaleXSlider.addEventListener('input', (e) => {
    const val = parseFloat(e.target.value);
    motionEngine.scaleX = val;
    elements.scaleXVal.textContent = `${Math.round(val * 100)}%`;
  });

  elements.scaleYSlider.addEventListener('input', (e) => {
    const val = parseFloat(e.target.value);
    motionEngine.scaleY = val;
    elements.scaleYVal.textContent = `${Math.round(val * 100)}%`;
  });

  elements.centerXSlider.addEventListener('input', (e) => {
    const val = parseFloat(e.target.value);
    motionEngine.centerX = val;
    elements.centerXVal.textContent = val.toFixed(2);
  });

  elements.centerYSlider.addEventListener('input', (e) => {
    const val = parseFloat(e.target.value);
    motionEngine.centerY = val;
    elements.centerYVal.textContent = val.toFixed(2);
  });

  elements.resetCenterBtn.addEventListener('click', () => {
    motionEngine.centerX = 0;
    motionEngine.centerY = 0;
    elements.centerXSlider.value = 0;
    elements.centerXVal.textContent = '0.00';
    elements.centerYSlider.value = 0;
    elements.centerYVal.textContent = '0.00';
  });

  // Surround Panner Target Parameters
  elements.rotationSlider.addEventListener('input', (e) => {
    const val = parseFloat(e.target.value);
    motionEngine.rotationDeg = val;
    elements.rotationVal.textContent = `${val}°`;
  });

  elements.autoRotateSlider.addEventListener('input', (e) => {
    const val = parseFloat(e.target.value);
    motionEngine.autoRotateSpeed = val;
    elements.autoRotateVal.textContent = `${val}°/s`;
  });

  elements.focusSlider.addEventListener('input', (e) => {
    const val = parseFloat(e.target.value);
    motionEngine.focus = val;
    elements.focusVal.textContent = `${val}%`;
  });

  elements.centerSlider.addEventListener('input', (e) => {
    const val = parseFloat(e.target.value);
    motionEngine.center = val;
    elements.centerVal.textContent = `${val}%`;
  });

  elements.smoothSlider.addEventListener('input', (e) => {
    const val = parseFloat(e.target.value);
    motionEngine.smooth = val;
    elements.smoothVal.textContent = `${val}%`;
  });

  // Visual toggles
  elements.showTrailCheck.addEventListener('change', (e) => {
    canvasRenderer.showTrail = e.target.checked;
  });
  elements.showTrajectoryCheck.addEventListener('change', (e) => {
    canvasRenderer.showTrajectory = e.target.checked;
  });
  elements.showGridCheck.addEventListener('change', (e) => {
    canvasRenderer.showGrid = e.target.checked;
  });
  elements.showMetersCheck.addEventListener('change', (e) => {
    canvasRenderer.showMeters = e.target.checked;
  });
}

function syncUIFromEngine() {
  elements.shapeSelect.value = motionEngine.activeShapeId;
  if (motionEngine.rateMode === 'sync') {
    elements.rateModeSync.checked = true;
    elements.syncControls.classList.remove('hidden');
    elements.freeControls.classList.add('hidden');
  } else {
    elements.rateModeFree.checked = true;
    elements.syncControls.classList.add('hidden');
    elements.freeControls.classList.remove('hidden');
  }

  elements.bpmInput.value = motionEngine.bpm;
  elements.bpmSlider.value = motionEngine.bpm;
  elements.noteDivSelect.value = motionEngine.noteDivision;
  elements.freeHzInput.value = motionEngine.freeHz.toFixed(2);
  elements.freeHzSlider.value = motionEngine.freeHz;
  elements.directionSelect.value = motionEngine.direction;

  elements.phaseOffsetSlider.value = motionEngine.phaseOffsetDeg;
  elements.phaseOffsetVal.textContent = `${motionEngine.phaseOffsetDeg}°`;
  elements.startAngleSlider.value = motionEngine.startPointDeg;
  elements.startAngleVal.textContent = `${motionEngine.startPointDeg}°`;

  elements.masterScaleSlider.value = motionEngine.masterScale;
  elements.masterScaleVal.textContent = `${Math.round(motionEngine.masterScale * 100)}%`;
  elements.scaleXSlider.value = motionEngine.scaleX;
  elements.scaleXVal.textContent = `${Math.round(motionEngine.scaleX * 100)}%`;
  elements.scaleYSlider.value = motionEngine.scaleY;
  elements.scaleYVal.textContent = `${Math.round(motionEngine.scaleY * 100)}%`;
  elements.centerXSlider.value = motionEngine.centerX;
  elements.centerXVal.textContent = motionEngine.centerX.toFixed(2);
  elements.centerYSlider.value = motionEngine.centerY;
  elements.centerYVal.textContent = motionEngine.centerY.toFixed(2);

  elements.rotationSlider.value = motionEngine.rotationDeg;
  elements.rotationVal.textContent = `${motionEngine.rotationDeg}°`;
  elements.autoRotateSlider.value = motionEngine.autoRotateSpeed;
  elements.autoRotateVal.textContent = `${motionEngine.autoRotateSpeed}°/s`;
  elements.focusSlider.value = motionEngine.focus;
  elements.focusVal.textContent = `${motionEngine.focus}%`;
  elements.centerSlider.value = motionEngine.center;
  elements.centerVal.textContent = `${motionEngine.center}%`;
  elements.smoothSlider.value = motionEngine.smooth;
  elements.smoothVal.textContent = `${motionEngine.smooth}%`;
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
    elements.midiLed.style.backgroundColor = e.target.checked ? '#34d399' : '#475569';
  });

  elements.midiPortSelect.addEventListener('change', (e) => {
    midiController.setPort(e.target.value);
  });

  elements.midiChannelSelect.addEventListener('change', (e) => {
    midiController.setChannel(parseInt(e.target.value, 10));
  });

  // CC Assignments
  elements.ccInputX.addEventListener('change', (e) => midiController.ccMap.x = parseInt(e.target.value, 10));
  elements.ccInputY.addEventListener('change', (e) => midiController.ccMap.y = parseInt(e.target.value, 10));
  elements.ccInputRot.addEventListener('change', (e) => midiController.ccMap.rotation = parseInt(e.target.value, 10));
  elements.ccInputFocus.addEventListener('change', (e) => midiController.ccMap.focus = parseInt(e.target.value, 10));
  elements.ccInputCenter.addEventListener('change', (e) => midiController.ccMap.center = parseInt(e.target.value, 10));
  elements.ccInputSmooth.addEventListener('change', (e) => midiController.ccMap.smooth = parseInt(e.target.value, 10));
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

  // 1. Update Motion Engine
  const engineState = motionEngine.update(dt);

  // 2. Sample Path for visual trajectory preview
  const shape = shapeRegistry.get(engineState.activeShapeId);
  let transformedPath = [];
  if (shape) {
    const rawPath = shape.getSampledPath(engineState.shapeParams, 240);
    transformedPath = motionEngine.transformPoints(rawPath);
  }

  // 3. Compute Speaker Gains & Meters
  const speakerGains = speakerEngine.calculateGains(
    engineState.x,
    engineState.y,
    engineState.focus,
    engineState.center
  );

  // 4. Render Canvas Frame
  canvasRenderer.render(engineState, transformedPath, speakerGains);

  // 5. Stream Web MIDI CCs
  midiController.update(engineState);

  // 6. Update Live Monitors
  updateLiveMonitors(engineState);

  requestAnimationFrame(animationLoop);
}

function updateLiveMonitors(state) {
  elements.monX.textContent = state.x.toFixed(3);
  elements.monY.textContent = state.y.toFixed(3);
  elements.monRot.textContent = `${state.rotationDeg.toFixed(1)}°`;
  elements.monFocus.textContent = `${state.focus}%`;
  elements.monCenter.textContent = `${state.center}%`;
  elements.monSmooth.textContent = `${state.smooth}%`;
  elements.monVelocity.textContent = `${state.velocity.toFixed(2)} u/s`;
  elements.monFreq.textContent = `${state.frequencyHz.toFixed(3)} Hz`;

  // Update phase bar & time
  elements.phaseBar.style.width = `${(state.effectivePhase * 100).toFixed(1)}%`;
  const mins = Math.floor(motionEngine.currentTime / 60);
  const secs = (motionEngine.currentTime % 60).toFixed(1);
  elements.timeDisplay.textContent = `${mins}:${secs < 10 ? '0' : ''}${secs}`;

  // Sync rotation slider visual if auto-rotating
  if (motionEngine.autoRotateSpeed !== 0) {
    elements.rotationSlider.value = state.rotationDeg;
    elements.rotationVal.textContent = `${state.rotationDeg.toFixed(0)}°`;
  }
}
