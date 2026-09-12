/**
 * Spatiomorphology - Presets & Spatial Gesture Bank
 * Curated spectromorphological spatial trajectories and export/import functionality.
 */

export const PRESET_BANK = [
  {
    id: 'biloba_fan_sweep',
    name: 'Biloba Ginkgo Fan',
    category: 'Organic & Natural Forms',
    description: 'Dual-lobed Ginkgo Biloba leaf trajectory extending across full boundaries of the acoustic field.',
    state: {
      shapeId: 'biloba_fan',
      shapeParams: { aperture: 130, notch: 0.45, reach: 1.0 },
      rateMode: 'sync',
      bpm: 120,
      noteDivision: '2/1',
      direction: 'cw',
      masterScale: 1.0,
      scaleX: 1.0,
      scaleY: 1.0,
      rotationDeg: 0,
      autoRotateSpeed: 0,
      focus: 85,
      center: 50,
      smooth: 0
    }
  },
  {
    id: 'branching_petiole_flurry',
    name: 'Branching Petiole Flurry',
    category: 'Organic & Natural Forms',
    description: 'Dense dichotomous venation radiating outward with high branch factor complexity.',
    state: {
      shapeId: 'branching_petiole',
      shapeParams: { branches: 16, curvature: 0.65 },
      rateMode: 'sync',
      bpm: 120,
      noteDivision: '1/1',
      direction: 'cw',
      masterScale: 1.0,
      scaleX: 1.0,
      scaleY: 1.0,
      rotationDeg: 0,
      autoRotateSpeed: 0,
      focus: 80,
      center: 45,
      smooth: 5
    }
  },
  {
    id: 'cornflower_rosette_orbit',
    name: 'Cornflower Rosette Orbit',
    category: 'Organic & Natural Forms',
    description: 'Blauert acoustic cornflower phyllotaxis rosette with golden-ratio ray florets and rotation spin.',
    state: {
      shapeId: 'cornflower_rosette',
      shapeParams: { florets: 24, spread: 0.85 },
      rateMode: 'sync',
      bpm: 120,
      noteDivision: '4/1',
      direction: 'cw',
      masterScale: 1.0,
      scaleX: 1.0,
      scaleY: 1.0,
      rotationDeg: 0,
      autoRotateSpeed: 15,
      focus: 90,
      center: 35,
      smooth: 8
    }
  },
  {
    id: 'ipe_canopy_flutter',
    name: 'Ipê-amarelo Canopy Flutter',
    category: 'Organic & Natural Forms',
    description: 'Golden trumpet floral canopy flutter with 5 petal lobes undulating along perimeter.',
    state: {
      shapeId: 'canopy_flutter',
      shapeParams: { petals: 5, flutterAmp: 0.25, flutterFreq: 3 },
      rateMode: 'sync',
      bpm: 120,
      noteDivision: '2/1',
      direction: 'cw',
      masterScale: 1.0,
      scaleX: 1.0,
      scaleY: 1.0,
      rotationDeg: 0,
      autoRotateSpeed: 0,
      focus: 85,
      center: 40,
      smooth: 10
    }
  },
  {
    id: 'kinetic_ricochet_surge',
    name: 'Kinetic Boundary Ricochet',
    category: 'Organic & Natural Forms',
    description: 'Bipolar elastic collision trajectory reflecting off acoustic boundary walls with post-bounce acceleration.',
    state: {
      shapeId: 'kinetic_bounce',
      shapeParams: { bounces: 5, elasticity: 0.6 },
      rateMode: 'sync',
      bpm: 120,
      noteDivision: '1/1',
      direction: 'cw',
      masterScale: 1.0,
      scaleX: 1.0,
      scaleY: 1.0,
      rotationDeg: 0,
      autoRotateSpeed: 0,
      focus: 95,
      center: 50,
      smooth: 0
    }
  },
  {
    id: 'calcite_cleavage_facet',
    name: 'Calcite Rhombohedral Cleavage',
    category: 'Crystalline & Cleavage',
    description: 'Barrett optical calcite crystal cleavage facets splitting sound into double refracted pairs.',
    state: {
      shapeId: 'calcite_rhombohedron',
      shapeParams: { shear: 0.35, tilt: 25 },
      rateMode: 'sync',
      bpm: 120,
      noteDivision: '2/1',
      direction: 'cw',
      masterScale: 1.0,
      scaleX: 1.0,
      scaleY: 1.0,
      rotationDeg: 15,
      autoRotateSpeed: 0,
      focus: 90,
      center: 40,
      smooth: 6
    }
  },
  {
    id: 'birefringent_harmonic_rays',
    name: 'Birefringent Double Refraction',
    category: 'Crystalline & Cleavage',
    description: 'Dual-ray Lissajous harmonic orbit reflecting ordinary and extraordinary polarizations.',
    state: {
      shapeId: 'birefringent_lissajous',
      shapeParams: { birefringence: 0.35, axisDeg: 45 },
      rateMode: 'sync',
      bpm: 120,
      noteDivision: '2/1',
      direction: 'cw',
      masterScale: 1.0,
      scaleX: 1.0,
      scaleY: 1.0,
      rotationDeg: 0,
      autoRotateSpeed: 0,
      focus: 85,
      center: 50,
      smooth: 8
    }
  },
  {
    id: 'blauert_elevation_drift',
    name: 'Blauert Vertical Elevation',
    category: 'Acoustic & Perceptual',
    description: 'Perceptual elevation trajectory utilizing directional bands between front, overhead, and rear.',
    state: {
      shapeId: 'blauert_elevation',
      shapeParams: { bandBias: 1, overheadBoost: 0.7 },
      rateMode: 'sync',
      bpm: 120,
      noteDivision: '4/1',
      direction: 'cw',
      masterScale: 1.0,
      scaleX: 1.0,
      scaleY: 1.0,
      rotationDeg: 0,
      autoRotateSpeed: 0,
      focus: 90,
      center: 60,
      smooth: 12
    }
  },
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
      masterScale: 1.0,
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
      masterScale: 1.0,
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
      masterScale: 1.0,
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
      masterScale: 1.0,
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
      masterScale: 1.0,
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
      masterScale: 1.0,
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
      masterScale: 1.0,
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
      masterScale: 1.0,
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
      masterScale: 1.0,
      scaleX: 1.0,
      scaleY: 1.0,
      rotationDeg: 15,
      focus: 85,
      center: 35,
      smooth: 12
    }
  },
  {
    id: 'orbieu_soundscape',
    name: 'Orbieu Dusk Soundscape',
    category: 'Acousmatic Case Studies',
    description: 'Denis Smalley\'s Orbieu model: grounded riverbed anchor, localized frog clusters, and elevated aerial swifts.',
    state: {
      shapeId: 'brownian',
      shapeParams: { complexity: 3, speedRatio: 1.2 },
      rateMode: 'free',
      freeHz: 0.15,
      direction: 'cw',
      masterScale: 1.0,
      scaleX: 1.2,
      scaleY: 0.6,
      rotationDeg: 0,
      focus: 65,
      center: 60,
      smooth: 30
    }
  },
  {
    id: 'geologie_sonore',
    name: 'Parmegiani: Géologie Sonore',
    category: 'Acousmatic Case Studies',
    description: 'Grounding bass drone plane with cumulative diagonal forces, upward surges, and sudden clearing.',
    state: {
      shapeId: 'criss_cross',
      shapeParams: { pattern: 1, centerDwell: 0.4 },
      rateMode: 'sync',
      bpm: 120,
      noteDivision: '4/1',
      direction: 'pingpong',
      masterScale: 1.0,
      scaleX: 1.0,
      scaleY: 1.1,
      rotationDeg: -30,
      focus: 80,
      center: 70,
      smooth: 22
    }
  },
  {
    id: 'empty_vessels',
    name: 'Smalley: Empty Vessels',
    category: 'Acousmatic Case Studies',
    description: 'Attack-resonance opening that shifts from intimate object vibrations into an expansive distal outdoor vista.',
    state: {
      shapeId: 'vortex',
      shapeParams: { turns: 3, suction: 2.2 },
      rateMode: 'sync',
      bpm: 120,
      noteDivision: '8/1',
      direction: 'cw',
      masterScale: 1.0,
      scaleX: 1.0,
      scaleY: 1.0,
      rotationDeg: 45,
      focus: 90,
      center: 20,
      smooth: 18
    }
  },
  {
    id: 'presque_rien',
    name: 'Luc Ferrari: Presque Rien No. 1',
    category: 'Acousmatic Case Studies',
    description: 'Naturalist environmental space with subtle distal/proximate relational shifts and cicada enclosure.',
    state: {
      shapeId: 'zigzag',
      shapeParams: { lines: 6, orientation: 0, smoothness: 0.8 },
      rateMode: 'sync',
      bpm: 120,
      noteDivision: '4/1',
      direction: 'pingpong',
      masterScale: 1.0,
      scaleX: 1.1,
      scaleY: 0.7,
      rotationDeg: 0,
      focus: 75,
      center: 40,
      smooth: 25
    }
  },
  {
    id: 'levitating_spectral_cloud',
    name: 'Levitating Spectral Cloud',
    category: 'Acousmatic Case Studies',
    description: 'Anti-gravitational ascent freeing sound from bass grounding into high-register circumspace and upper canopy.',
    state: {
      shapeId: 'circle',
      shapeParams: { eccentricity: 1.4, tilt: 25 },
      rateMode: 'free',
      freeHz: 0.08,
      direction: 'ccw',
      masterScale: 1.0,
      scaleX: 1.0,
      scaleY: 0.8,
      rotationDeg: 0,
      focus: 95,
      center: 15,
      smooth: 8
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
  if (s.freeSubMode) engine.freeSubMode = s.freeSubMode;
  if (s.freeTimeSec) engine.freeTimeSec = s.freeTimeSec;
  if (s.freeLfoHz) engine.freeLfoHz = s.freeLfoHz;
  if (s.freeVcoHz) engine.freeVcoHz = s.freeVcoHz;
  if (s.direction) engine.direction = s.direction;
  if (s.directionRate !== undefined) engine.directionRate = s.directionRate;

  engine.phaseOffsetDeg = s.phaseOffsetDeg !== undefined ? s.phaseOffsetDeg : 0.0;
  engine.startPointDeg = s.startPointDeg !== undefined ? s.startPointDeg : 0.0;

  engine.masterScale = s.masterScale !== undefined ? s.masterScale : 1.0;
  engine.scaleX = s.scaleX !== undefined ? s.scaleX : 1.0;
  engine.scaleY = s.scaleY !== undefined ? s.scaleY : 1.0;
  engine.centerX = s.centerX !== undefined ? s.centerX : 0.0;
  engine.centerY = s.centerY !== undefined ? s.centerY : 0.0;
  engine.rotationDeg = s.rotationDeg !== undefined ? s.rotationDeg : 0;
  engine.autoRotateSpeed = s.autoRotateSpeed !== undefined ? s.autoRotateSpeed : 0;
  engine.focus = s.focus !== undefined ? s.focus : 50;
  engine.center = s.center !== undefined ? s.center : 50;
  engine.smooth = s.smooth !== undefined ? s.smooth : 0;
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
