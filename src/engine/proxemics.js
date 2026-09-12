/**
 * Spatiomorph - Proxemic & Ecological Spatial Model
 * Implements Edward Hall's proxemic distance zones adapted for electroacoustic
 * space-form by Denis Smalley (Gestural, Personal/Reachable, Ensemble/Social, Arena/Public).
 */

export const PROXEMIC_ZONES = [
  {
    id: 'intimate',
    name: 'Intimate / Gestural Zone',
    minR: 0.0,
    maxR: 0.25,
    description: 'Arm\'s-length proximity; high perceptual intimacy and vulnerability to enclosure.',
    colorPounamu: 'rgba(224, 122, 95, 0.22)',
    borderPounamu: 'rgba(224, 122, 95, 0.6)',
    colorPlanifolia: 'rgba(245, 158, 11, 0.18)',
    borderPlanifolia: 'rgba(245, 158, 11, 0.5)'
  },
  {
    id: 'personal',
    name: 'Personal / Reachable Zone',
    minR: 0.25,
    maxR: 0.55,
    description: 'Reachable communicative space; solo instruments, immediate source actions.',
    colorPounamu: 'rgba(116, 198, 157, 0.12)',
    borderPounamu: 'rgba(116, 198, 157, 0.45)',
    colorPlanifolia: 'rgba(253, 230, 138, 0.1)',
    borderPlanifolia: 'rgba(253, 230, 138, 0.4)'
  },
  {
    id: 'social',
    name: 'Social / Ensemble Zone',
    minR: 0.55,
    maxR: 0.85,
    description: 'Ensemble polyphony, inter-agent dialogue, shared environmental territory.',
    colorPounamu: 'rgba(45, 106, 79, 0.15)',
    borderPounamu: 'rgba(45, 106, 79, 0.4)',
    colorPlanifolia: 'rgba(132, 169, 140, 0.12)',
    borderPlanifolia: 'rgba(132, 169, 140, 0.35)'
  },
  {
    id: 'arena',
    name: 'Arena / Public Horizon',
    minR: 0.85,
    maxR: 1.0,
    description: 'Distal acoustic boundary; prospective horizon and room enclosure limits.',
    colorPounamu: 'rgba(27, 67, 50, 0.2)',
    borderPounamu: 'rgba(56, 176, 0, 0.5)',
    colorPlanifolia: 'rgba(82, 121, 111, 0.16)',
    borderPlanifolia: 'rgba(82, 121, 111, 0.45)'
  }
];

export class ProxemicsEngine {
  constructor() {
    this.enabled = true;
    this.activeZoneLocks = new Map(); // trajectoryId -> 'none' | 'intimate' | 'personal' | 'social' | 'arena' | 'upper_field' | 'lower_field'
  }

  getZoneForRadius(r) {
    const absR = Math.abs(r);
    for (const z of PROXEMIC_ZONES) {
      if (absR >= z.minR && absR < z.maxR) {
        return z;
      }
    }
    return PROXEMIC_ZONES[PROXEMIC_ZONES.length - 1];
  }

  getZoneForPoint(x, y) {
    const r = Math.hypot(x, y);
    return this.getZoneForRadius(r);
  }

  applyBehavioralLock(x, y, lockMode) {
    if (!lockMode || lockMode === 'none') return { x, y };

    let r = Math.hypot(x, y);
    const theta = Math.atan2(y, x);

    switch (lockMode) {
      case 'intimate':
        r = Math.min(0.24, r);
        return { x: r * Math.cos(theta), y: r * Math.sin(theta) };

      case 'personal':
        r = Math.max(0.26, Math.min(0.54, r));
        return { x: r * Math.cos(theta), y: r * Math.sin(theta) };

      case 'social':
        r = Math.max(0.56, Math.min(0.84, r));
        return { x: r * Math.cos(theta), y: r * Math.sin(theta) };

      case 'arena':
        r = Math.max(0.86, Math.min(0.98, r));
        return { x: r * Math.cos(theta), y: r * Math.sin(theta) };

      case 'upper_field':
      case 'canopy':
        // Upper / Forward Field (Y > +0.25)
        return { x: Math.max(-0.95, Math.min(0.95, x)), y: Math.max(0.25, Math.min(0.95, y)) };

      case 'lower_field':
      case 'ground':
        // Lower / Deep Field (Y < -0.20)
        return { x: Math.max(-0.85, Math.min(0.85, x)), y: Math.max(-0.95, Math.min(-0.2, y)) };

      default:
        return { x, y };
    }
  }
}
