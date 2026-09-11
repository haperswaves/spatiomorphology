/**
 * Spatiomorphology - Presets & Spatial Gesture Bank
 * Curated spectromorphological spatial trajectories and export/import functionality.
 */

export const PRESET_BANK = [
  {
    id: 'centrifugal_vortex',
    name: 'Centrifugal Vortex',
    category: 'Vortex & Spiral',
    description: 'Spiral motion with progressive radial expansion, projecting sound outwards from listener to perimeter.',
    state: {
      shapeId: 'vortex',
      shapeParams: { turns: 4, suction: 1.6 },
      rateMode: 'sync',
      bpm: 120,
      noteDivision: '2/1',
      direction: 'cw',
      masterScale: 0.95,
      scaleX: 1.0,
      scaleY: 1.0,
      rotationDeg: 0,
      focus: 90,
      center: 30,
      smooth: 12
    }
  },
  {
    id: 'centripetal_suction',
    name: 'Centripetal Suction',
    category: 'Vortex & Spiral',
    description: 'Rapid spatial contraction spiraling from the outer perimeter into the gravitational acoustic center.',
    state: {
      shapeId: 'spiral_archimedean',
      shapeParams: { turns: 5, innerRadius: 0.05, cyclic: 1 },
      rateMode: 'sync',
      bpm: 120,
      noteDivision: '1/1',
      direction: 'ccw',
      masterScale: 0.92,
      scaleX: 1.0,
      scaleY: 1.0,
      rotationDeg: -45,
      focus: 85,
      center: 75,
      smooth: 15
    }
  },
  {
    id: 'panoramic_lemniscate',
    name: 'Panoramic Lemniscate (Figure 8)',
    category: 'Harmonic',
    description: 'Classic figure-eight Lissajous curve weaving dynamically across Left/Right and Front/Rear planes.',
    state: {
      shapeId: 'lissajous',
      shapeParams: { freqX: 1, freqY: 2, phaseShift: 90, damp: 0 },
      rateMode: 'sync',
      bpm: 120,
      noteDivision: '1/1',
      direction: 'cw',
      masterScale: 0.9,
      scaleX: 1.1,
      scaleY: 0.85,
      rotationDeg: 25,
      focus: 95,
      center: 40,
      smooth: 10
    }
  },
  {
    id: 'quad_perimeter_leap',
    name: 'Quadraphonic Corner Leap',
    category: 'Polygonal',
    description: 'Staccato polygon trajectory jumping between quad speaker corners with rapid transitions.',
    state: {
      shapeId: 'polygon',
      shapeParams: { sides: 4, roundness: 0.1, starRatio: 1.0 },
      rateMode: 'sync',
      bpm: 120,
      noteDivision: '1/2',
      direction: 'cw',
      masterScale: 0.9,
      scaleX: 1.0,
      scaleY: 1.0,
      rotationDeg: 45,
      focus: 100,
      center: 20,
      smooth: 8
    }
  },
  {
    id: 'diagonal_crossing_surge',
    name: 'Diagonal Crossing Surge',
    category: 'Linear & Crossing',
    description: 'Aggressive acoustic collision cutting diagonally straight through the central sweet spot.',
    state: {
      shapeId: 'criss_cross',
      shapeParams: { pattern: 0, centerDwell: 0.2 },
      rateMode: 'sync',
      bpm: 120,
      noteDivision: '1/2',
      direction: 'cw',
      masterScale: 0.92,
      scaleX: 1.0,
      scaleY: 1.0,
      rotationDeg: 0,
      focus: 95,
      center: 60,
      smooth: 5
    }
  },
  {
    id: 'octophonic_perimeter_flight',
    name: 'Octophonic Perimeter Flight',
    category: 'Geometric',
    description: 'Continuous circular orbit sweeping smoothly along the 8-channel speaker ring with wide dispersion.',
    state: {
      shapeId: 'circle',
      shapeParams: { eccentricity: 1.0, tilt: 0 },
      rateMode: 'sync',
      bpm: 120,
      noteDivision: '4/1',
      direction: 'cw',
      masterScale: 0.92,
      scaleX: 1.0,
      scaleY: 1.0,
      rotationDeg: 0,
      focus: 80,
      center: 25,
      smooth: 20
    }
  },
  {
    id: 'turbulent_cloud',
    name: 'Turbulent Acousmatic Cloud',
    category: 'Stochastic & Chaos',
    description: 'Multi-harmonic chaotic drift evoking spatial diffusion, turbulence, and organic wander.',
    state: {
      shapeId: 'brownian',
      shapeParams: { complexity: 4, speedRatio: 1.618 },
      rateMode: 'free',
      freeHz: 0.25,
      bpm: 120,
      direction: 'cw',
      masterScale: 0.88,
      scaleX: 1.0,
      scaleY: 1.0,
      rotationDeg: 0,
      focus: 60,
      center: 50,
      smooth: 25
    }
  },
  {
    id: 'serpentine_raster',
    name: 'Serpentine Raster Meander',
    category: 'Linear & Crossing',
    description: 'Stepped spatial scanning undulating back and forth while sweeping through the room.',
    state: {
      shapeId: 'zigzag',
      shapeParams: { lines: 5, orientation: 0, smoothness: 0.7 },
      rateMode: 'sync',
      bpm: 120,
      noteDivision: '2/1',
      direction: 'pingpong',
      masterScale: 0.9,
      scaleX: 1.0,
      scaleY: 1.0,
      rotationDeg: 0,
      focus: 90,
      center: 45,
      smooth: 15
    }
  },
  {
    id: 'rhodonea_petal_orbit',
    name: 'Rhodonea Petal Orbit',
    category: 'Harmonic',
    description: 'Multi-lobed floral epicycle tracing 5 distinct spatial lobes surrounding the listener.',
    state: {
      shapeId: 'rose',
      shapeParams: { petals: 5, offset: 0.15 },
      rateMode: 'sync',
      bpm: 120,
      noteDivision: '2/1',
      direction: 'cw',
      masterScale: 0.9,
      scaleX: 1.0,
      scaleY: 1.0,
      rotationDeg: 15,
      focus: 85,
      center: 35,
      smooth: 12
    }
  }
];

export function applyPreset(preset, engine) {
  const s = preset.state;
  if (!s) return;

  if (s.shapeId) engine.setShape(s.shapeId);
  if (s.shapeParams) {
    engine.shapeParams = { ...engine.shapeParams, ...s.shapeParams };
  }

  if (s.rateMode) engine.rateMode = s.rateMode;
  if (s.bpm) engine.bpm = s.bpm;
  if (s.noteDivision) engine.noteDivision = s.noteDivision;
  if (s.freeHz) engine.freeHz = s.freeHz;
  if (s.direction) engine.direction = s.direction;

  if (s.masterScale !== undefined) engine.masterScale = s.masterScale;
  if (s.scaleX !== undefined) engine.scaleX = s.scaleX;
  if (s.scaleY !== undefined) engine.scaleY = s.scaleY;
  if (s.rotationDeg !== undefined) engine.rotationDeg = s.rotationDeg;
  if (s.focus !== undefined) engine.focus = s.focus;
  if (s.center !== undefined) engine.center = s.center;
  if (s.smooth !== undefined) engine.smooth = s.smooth;
}

export function exportPresetsJSON(userPresets) {
  return JSON.stringify(userPresets, null, 2);
}

export function importPresetsJSON(jsonString) {
  try {
    const data = JSON.parse(jsonString);
    if (Array.isArray(data)) return data;
    return null;
  } catch (e) {
    console.error('Failed to parse preset JSON:', e);
    return null;
  }
}
