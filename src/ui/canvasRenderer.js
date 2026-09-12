/**
 * Spatiomorph - Canvas Visualizer & Multi-Trajectory Spatial Monitor
 * Renders strict 1:1 high-DPI coordinate space, proxemic zones, trajectory pucks & trails,
 * vectorial wipe surges, and the space-form heatmap accumulator.
 */

import { PROXEMIC_ZONES } from '../engine/proxemics.js';

export class CanvasRenderer {
  constructor(canvas, spaceFormAccumulator = null) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.accumulator = spaceFormAccumulator;

    // Multi-trajectory trail history buffers (one per trajectory: 0..5)
    this.maxTrailLength = 50;
    this.trails = Array.from({ length: 6 }, () => []);

    // Visual options
    this.showTrail = true;
    this.showTrajectory = true;
    this.showGrid = true;
    this.showMeters = true;
    this.showProxemics = true;
    this.showAccumulator = true;

    this.personality = 'pounamu'; // 'pounamu' | 'plaifolia' | 'biloba' | 'kornblume' | 'calcite' | 'ipe_amarelo'
    this.brightnessTheme = 'med-dark'; // 'dark' | 'med-dark' | 'med-light' | 'light'

    // Personality Engines
    this.figuresEngine = null;
    this.blauertEngine = null;
    this.birefringenceEngine = null;
    this.spectralDiffusionEngine = null;

    // Sizing
    this.width = 0;
    this.height = 0;
    this.centerX = 0;
    this.centerY = 0;
    this.radiusPx = 0;

    this.resize();
  }

  getAuraColor() {
    switch (this.personality) {
      case 'plaifolia': return '245, 158, 11';
      case 'biloba': return '229, 169, 60';
      case 'kornblume': return '58, 134, 255';
      case 'calcite': return '72, 202, 228';
      case 'ipe_amarelo': return '255, 190, 11';
      case 'pounamu':
      default:
        return '82, 183, 136';
    }
  }

  resize() {
    const parent = this.canvas.parentElement;
    const rect = parent ? parent.getBoundingClientRect() : this.canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    const w = Math.floor(rect.width || 500);
    const h = Math.floor(rect.height || 500);
    this.width = w;
    this.height = h;

    this.canvas.width = Math.floor(w * dpr);
    this.canvas.height = Math.floor(h * dpr);
    this.canvas.style.width = `${w}px`;
    this.canvas.style.height = `${h}px`;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    this.centerX = w / 2;
    this.centerY = h / 2;
    // Exactly 90% of the internal display size (diameter = 0.90 * minDim, radius = 0.45 * minDim)
    const minDim = Math.min(w, h);
    this.radiusPx = (minDim / 2) * 0.90;

    if (this.accumulator) {
      this.accumulator.resize(w, h, this.radiusPx);
    }
  }

  toScreen(normX, normY) {
    return {
      x: this.centerX + normX * this.radiusPx,
      y: this.centerY - normY * this.radiusPx
    };
  }

  toNormalized(screenX, screenY) {
    return {
      x: (screenX - this.centerX) / this.radiusPx,
      y: -(screenY - this.centerY) / this.radiusPx
    };
  }

  render(polyStates, sampledPathsByTrajectory, speakerGains, wipeState = null, selectedTrajectoryIdx = 0) {
    // Dynamic resize check in case flex layout resolved after initial DOM load
    const parent = this.canvas.parentElement;
    if (parent) {
      const pRect = parent.getBoundingClientRect();
      const pw = Math.floor(pRect.width);
      const ph = Math.floor(pRect.height);
      if (pw > 0 && ph > 0 && (Math.abs(pw - this.width) > 2 || Math.abs(ph - this.height) > 2)) {
        this.resize();
      }
    }

    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);

    // 1. Proxemic Zones or Personality Stratum / Median Bands
    if (this.showProxemics && this.personality === 'pounamu') {
      this.drawProxemicZones();
    } else if (this.personality === 'ipe_amarelo') {
      this.drawIpeAmareloStrata();
    } else if (this.personality === 'kornblume') {
      this.drawBlauertMedianBands();
    } else if (this.personality === 'calcite') {
      this.drawCalciteCleavageGrid();
    }

    // 2. Coordinate Grid & Distance Rings
    if (this.showGrid) {
      this.drawGrid();
    }

    // 3. Space-Form Heatmap Accumulator Layer
    if (this.showAccumulator && this.accumulator) {
      this.accumulator.renderTo(ctx);
    }

    // 4. Trajectory Paths (Dotted previews)
    if (this.showTrajectory && sampledPathsByTrajectory) {
      for (const t of polyStates) {
        if (!t.active) continue;
        const path = sampledPathsByTrajectory[t.index];
        if (path && path.length > 1) {
          const isSelected = t.index === selectedTrajectoryIdx;
          this.drawTrajectoryPath(path, t.palette, isSelected);
        }
      }
    }

    // 5. Multi-Trajectory Motion Trails
    if (this.showTrail) {
      for (const t of polyStates) {
        if (!t.active) {
          this.trails[t.index] = [];
          continue;
        }
        this.updateAndDrawTrail(t.index, t.state.x, t.state.y, t.palette, t.audible);
      }
    }

    // 6. Virtual Speakers & Radiation Halos
    if (speakerGains) {
      this.drawSpeakers(speakerGains);
    }

    // 7. Vectorial Wipe Surge Indicator
    if (wipeState && wipeState.wipeActive) {
      this.drawVectorialWipe(wipeState);
    }

    // 8. Personality Specialized Overlays
    if (this.personality === 'biloba' && this.figuresEngine) {
      this.drawBilobaDirectivityLobes(polyStates[selectedTrajectoryIdx]);
    } else if (this.personality === 'kornblume' && this.blauertEngine) {
      this.drawKornblumeGhosts(polyStates);
    } else if (this.personality === 'calcite' && this.birefringenceEngine) {
      this.drawCalciteBirefringentRays(polyStates);
    } else if (this.personality === 'ipe_amarelo' && this.spectralDiffusionEngine) {
      this.drawIpeAmareloMaresiaSurge();
    }

    // 9. Trajectory Pucks (T1..T6)
    for (const t of polyStates) {
      if (!t.active) continue;
      const isSelected = t.index === selectedTrajectoryIdx;
      this.drawTrajectoryPuck(t, isSelected);
    }
  }

  drawProxemicZones() {
    const ctx = this.ctx;
    ctx.save();

    for (const zone of PROXEMIC_ZONES) {
      const rPx = zone.maxR * this.radiusPx;
      const isLight = this.brightnessTheme === 'light' || this.brightnessTheme === 'med-light';
      const fillColor = isLight ? 'rgba(45, 106, 79, 0.06)' : zone.colorPounamu;
      const borderColor = isLight ? 'rgba(45, 106, 79, 0.35)' : zone.borderPounamu;

      ctx.beginPath();
      ctx.arc(this.centerX, this.centerY, rPx, 0, Math.PI * 2);
      ctx.fillStyle = fillColor;
      ctx.fill();
      ctx.strokeStyle = borderColor;
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 5]);
      ctx.stroke();

      // Zone label
      ctx.fillStyle = borderColor;
      ctx.font = '9px Inter, system-ui, sans-serif';
      ctx.textAlign = 'left';
      ctx.setLineDash([]);
      const labelAngle = -Math.PI * 0.75;
      const lx = this.centerX + Math.cos(labelAngle) * (rPx - 6);
      const ly = this.centerY + Math.sin(labelAngle) * (rPx - 6);
      ctx.fillText(zone.name.split('/')[0].trim(), lx, ly);
    }

    ctx.restore();
  }

  drawGrid() {
    const ctx = this.ctx;
    ctx.save();

    const isLight = this.brightnessTheme === 'light' || this.brightnessTheme === 'med-light';
    const axisColor = isLight ? 'rgba(70, 90, 80, 0.25)' : 'rgba(45, 106, 79, 0.35)';
    const labelColor = isLight ? 'rgba(50, 70, 60, 0.75)' : 'rgba(116, 198, 157, 0.65)';

    // Polar Rings
    const rings = [0.25, 0.5, 0.75, 1.0];
    for (const r of rings) {
      ctx.beginPath();
      ctx.arc(this.centerX, this.centerY, r * this.radiusPx, 0, Math.PI * 2);
      ctx.strokeStyle = r === 1.0 ? axisColor : (isLight ? 'rgba(70, 90, 80, 0.15)' : 'rgba(45, 106, 79, 0.2)');
      ctx.lineWidth = r === 1.0 ? 1.5 : 1;
      ctx.setLineDash(r === 1.0 ? [] : [4, 6]);
      ctx.stroke();
    }

    // Axes
    ctx.setLineDash([2, 4]);
    ctx.strokeStyle = axisColor;
    ctx.lineWidth = 1;

    // X Axis
    ctx.beginPath();
    ctx.moveTo(this.centerX - this.radiusPx * 1.08, this.centerY);
    ctx.lineTo(this.centerX + this.radiusPx * 1.08, this.centerY);
    ctx.stroke();

    // Y Axis
    ctx.beginPath();
    ctx.moveTo(this.centerX, this.centerY - this.radiusPx * 1.08);
    ctx.lineTo(this.centerX, this.centerY + this.radiusPx * 1.08);
    ctx.stroke();

    // Cardinal Labels
    ctx.fillStyle = labelColor;
    ctx.font = '10px Inter, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('FRONT (+Y)', this.centerX, this.centerY - this.radiusPx * 1.05);
    ctx.fillText('REAR (-Y)', this.centerX, this.centerY + this.radiusPx * 1.11);
    ctx.textAlign = 'left';
    ctx.fillText('RIGHT (+X)', this.centerX + this.radiusPx * 1.04, this.centerY + 3);
    ctx.textAlign = 'right';
    ctx.fillText('LEFT (-X)', this.centerX - this.radiusPx * 1.04, this.centerY + 3);

    // Center Crosshair
    ctx.setLineDash([]);
    ctx.strokeStyle = isLight ? 'rgba(45, 106, 79, 0.6)' : 'rgba(82, 183, 136, 0.5)';
    ctx.beginPath();
    ctx.moveTo(this.centerX - 6, this.centerY);
    ctx.lineTo(this.centerX + 6, this.centerY);
    ctx.moveTo(this.centerX, this.centerY - 6);
    ctx.lineTo(this.centerX, this.centerY + 6);
    ctx.stroke();

    ctx.restore();
  }

  drawTrajectoryPath(sampledPath, palette, isSelected) {
    if (!sampledPath || sampledPath.length < 2) return;
    const ctx = this.ctx;
    ctx.save();
    ctx.beginPath();

    const startPt = this.toScreen(sampledPath[0].x, sampledPath[0].y);
    if (!Number.isFinite(startPt.x) || !Number.isFinite(startPt.y)) {
      ctx.restore();
      return;
    }
    ctx.moveTo(startPt.x, startPt.y);

    for (let i = 1; i < sampledPath.length; i++) {
      const pt = this.toScreen(sampledPath[i].x, sampledPath[i].y);
      if (Number.isFinite(pt.x) && Number.isFinite(pt.y)) {
        ctx.lineTo(pt.x, pt.y);
      }
    }

    const endPt = sampledPath[sampledPath.length - 1];
    const dist = Math.hypot(endPt.x - sampledPath[0].x, endPt.y - sampledPath[0].y);
    if (dist < 0.08 && ctx.closePath) {
      ctx.closePath();
    }

    ctx.strokeStyle = isSelected ? (palette.secondary || '#52b788') : 'rgba(100, 116, 139, 0.25)';
    ctx.lineWidth = isSelected ? 2.0 : 1.0;
    ctx.setLineDash(isSelected ? [5, 4] : [2, 6]);
    ctx.stroke();

    ctx.restore();
  }

  updateAndDrawTrail(trajectoryIndex, currX, currY, palette, isAudible) {
    const trail = this.trails[trajectoryIndex];
    trail.push({ x: currX, y: currY });
    if (trail.length > this.maxTrailLength) {
      trail.shift();
    }

    if (!isAudible) return;

    const ctx = this.ctx;
    ctx.save();
    const len = trail.length;

    for (let i = 1; i < len; i++) {
      const prev = this.toScreen(trail[i - 1].x, trail[i - 1].y);
      const curr = this.toScreen(trail[i].x, trail[i].y);
      const alpha = (i / len) * 0.7;

      ctx.beginPath();
      ctx.moveTo(prev.x, prev.y);
      ctx.lineTo(curr.x, curr.y);
      ctx.strokeStyle = palette.primary;
      ctx.globalAlpha = alpha;
      ctx.lineWidth = 1 + (i / len) * 3;
      ctx.stroke();
    }

    ctx.restore();
  }

  drawSpeakers(speakerGains) {
    const ctx = this.ctx;
    ctx.save();
    const isLight = this.brightnessTheme === 'light' || this.brightnessTheme === 'med-light';

    for (const spk of speakerGains) {
      const pos = this.toScreen(spk.x, spk.y);
      const gain = spk.gain;
      const db = spk.db;

      if (gain > 0.05) {
        const auraRadius = 16 + gain * 36;
        const grad = ctx.createRadialGradient(pos.x, pos.y, 4, pos.x, pos.y, auraRadius);
        const auraColor = this.getAuraColor();
        grad.addColorStop(0, `rgba(${auraColor}, ${gain * 0.6})`);
        grad.addColorStop(0.6, `rgba(${auraColor}, ${gain * 0.2})`);
        grad.addColorStop(1, `rgba(${auraColor}, 0)`);

        ctx.beginPath();
        ctx.arc(pos.x, pos.y, auraRadius, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();
      }

      // Speaker Monitor Body
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, 13, 0, Math.PI * 2);
      ctx.fillStyle = isLight ? '#e2e8f0' : '#041f14';
      ctx.fill();
      const auraColor = this.getAuraColor();
      ctx.strokeStyle = gain > 0.3
        ? `rgba(${auraColor}, 0.95)`
        : (isLight ? 'rgba(100, 116, 139, 0.5)' : 'rgba(80, 95, 85, 0.5)');
      ctx.lineWidth = 2;
      ctx.stroke();

      // Cone Inner Accent
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, 7, 0, Math.PI * 2);
      ctx.fillStyle = gain > 0.1
        ? `rgba(${auraColor}, ${0.3 + gain * 0.7})`
        : (isLight ? '#cbd5e1' : '#102219');
      ctx.fill();

      // Speaker Label (1, 2, 3...)
      ctx.fillStyle = isLight ? '#0f172a' : '#f8fafc';
      ctx.font = 'bold 9px Inter, system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(spk.id, pos.x, pos.y);

      // dB badge
      if (this.showMeters) {
        const angle = Math.atan2(pos.y - this.centerY, pos.x - this.centerX);
        const offset = 22;
        const meterX = pos.x - Math.cos(angle) * offset;
        const meterY = pos.y - Math.sin(angle) * offset;

        ctx.fillStyle = isLight ? 'rgba(241, 245, 249, 0.92)' : 'rgba(7, 17, 12, 0.88)';
        ctx.fillRect(meterX - 17, meterY - 6, 34, 13);
        ctx.strokeStyle = gain > 0.4
          ? `rgba(${auraColor}, 0.7)`
          : (isLight ? 'rgba(148, 163, 184, 0.5)' : 'rgba(50, 70, 60, 0.5)');
        ctx.lineWidth = 1;
        ctx.strokeRect(meterX - 17, meterY - 6, 34, 13);

        ctx.fillStyle = gain > 0.5
          ? (this.personality === 'pounamu' ? '#2d6a4f' : '#b45309')
          : (isLight ? '#64748b' : '#94a3b8');
        ctx.font = '8px monospace';
        ctx.fillText(`${db > -60 ? db.toFixed(1) : '-∞'}dB`, meterX, meterY);
      }
    }

    ctx.restore();
  }

  drawVectorialWipe(wipeState) {
    const ctx = this.ctx;
    const pos = this.toScreen(wipeState.wipeX, wipeState.wipeY);

    ctx.save();
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, 28, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(239, 68, 68, 0.35)';
    ctx.shadowColor = '#ef4444';
    ctx.shadowBlur = 18;
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(this.centerX - this.radiusPx, pos.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.strokeStyle = 'rgba(248, 113, 113, 0.6)';
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(pos.x, pos.y, 8, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.restore();
  }

  drawIpeAmareloStrata() {
    const ctx = this.ctx;
    ctx.save();
    const strata = [
      { r: 0.90, name: 'CANOPY (HIGH)', color: 'rgba(255, 190, 11, 0.45)', fill: 'rgba(255, 190, 11, 0.04)' },
      { r: 0.60, name: 'UNDERSTORY (MID)', color: 'rgba(251, 86, 7, 0.45)', fill: 'rgba(251, 86, 7, 0.04)' },
      { r: 0.28, name: 'TERRA ROXA (LOW)', color: 'rgba(128, 14, 19, 0.55)', fill: 'rgba(128, 14, 19, 0.06)' }
    ];

    for (const s of strata) {
      const rPx = s.r * this.radiusPx;
      ctx.beginPath();
      ctx.arc(this.centerX, this.centerY, rPx, 0, Math.PI * 2);
      ctx.fillStyle = s.fill;
      ctx.fill();
      ctx.strokeStyle = s.color;
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 6]);
      ctx.stroke();

      ctx.fillStyle = s.color;
      ctx.font = '8px Inter, system-ui, sans-serif';
      ctx.textAlign = 'left';
      ctx.setLineDash([]);
      ctx.fillText(s.name, this.centerX + 12, this.centerY - rPx + 10);
    }
    ctx.restore();
  }

  drawBlauertMedianBands() {
    const ctx = this.ctx;
    ctx.save();
    // 4 kHz Front Plane Highlight
    const frontGrad = ctx.createLinearGradient(this.centerX, this.centerY - this.radiusPx, this.centerX, this.centerY);
    frontGrad.addColorStop(0, 'rgba(58, 134, 255, 0.08)');
    frontGrad.addColorStop(1, 'rgba(58, 134, 255, 0)');
    ctx.fillStyle = frontGrad;
    ctx.fillRect(this.centerX - this.radiusPx, this.centerY - this.radiusPx, this.radiusPx * 2, this.radiusPx);

    // 1 kHz Rear Plane Highlight
    const rearGrad = ctx.createLinearGradient(this.centerX, this.centerY, this.centerX, this.centerY + this.radiusPx);
    rearGrad.addColorStop(0, 'rgba(114, 9, 183, 0)');
    rearGrad.addColorStop(1, 'rgba(114, 9, 183, 0.08)');
    ctx.fillStyle = rearGrad;
    ctx.fillRect(this.centerX - this.radiusPx, this.centerY, this.radiusPx * 2, this.radiusPx);

    // 8 kHz Overhead Core Circle
    ctx.beginPath();
    ctx.arc(this.centerX, this.centerY, this.radiusPx * 0.35, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(0, 245, 212, 0.25)';
    ctx.setLineDash([3, 4]);
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = 'rgba(0, 245, 212, 0.5)';
    ctx.font = '8px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('8 kHz Overhead', this.centerX, this.centerY - 4);
    ctx.restore();
  }

  drawCalciteCleavageGrid() {
    const ctx = this.ctx;
    ctx.save();
    ctx.strokeStyle = 'rgba(72, 202, 228, 0.2)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 6]);

    const a1 = (78 * Math.PI) / 180;
    const a2 = (101 * Math.PI) / 180;
    const r = this.radiusPx * 1.05;

    ctx.beginPath();
    ctx.moveTo(this.centerX - r * Math.cos(a1), this.centerY - r * Math.sin(a1));
    ctx.lineTo(this.centerX + r * Math.cos(a1), this.centerY + r * Math.sin(a1));
    ctx.moveTo(this.centerX - r * Math.cos(a2), this.centerY - r * Math.sin(a2));
    ctx.lineTo(this.centerX + r * Math.cos(a2), this.centerY + r * Math.sin(a2));
    ctx.stroke();

    ctx.restore();
  }

  drawBilobaDirectivityLobes(t) {
    if (!t || !t.active || !this.figuresEngine || !t.state) return;
    if (!Number.isFinite(t.state.x) || !Number.isFinite(t.state.y)) return;
    const ctx = this.ctx;
    const pos = this.toScreen(t.state.x, t.state.y);
    if (!Number.isFinite(pos.x) || !Number.isFinite(pos.y)) return;
    const caliber = Number.isFinite(this.figuresEngine.caliber) ? this.figuresEngine.caliber : 0.35;
    const calPx = Math.max(1, 15 + caliber * 55);

    ctx.save();
    const grad = ctx.createRadialGradient(pos.x, pos.y, 4, pos.x, pos.y, calPx);
    grad.addColorStop(0, 'rgba(229, 169, 60, 0.25)');
    grad.addColorStop(1, 'rgba(229, 169, 60, 0)');
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, calPx, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();

    if (this.figuresEngine.directivity === 'bilobed') {
      const baseHeading = Math.atan2(t.state.y, t.state.x);
      const halfLobe = (this.figuresEngine.lobeAngleDeg * Math.PI) / 360;
      const lobeLen = 22 + caliber * 30;

      [-halfLobe, halfLobe].forEach(offset => {
        const lx = pos.x + lobeLen * Math.cos(baseHeading + offset);
        const ly = pos.y - lobeLen * Math.sin(baseHeading + offset);
        ctx.beginPath();
        ctx.arc(lx, ly, 5, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(244, 162, 97, 0.8)';
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(pos.x, pos.y);
        ctx.lineTo(lx, ly);
        ctx.strokeStyle = 'rgba(229, 169, 60, 0.5)';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      });
    }
    ctx.restore();
  }

  drawKornblumeGhosts(polyStates) {
    if (!this.blauertEngine || !this.blauertEngine.precedenceEnabled) return;
    const ctx = this.ctx;
    ctx.save();

    for (const t of polyStates) {
      if (!t.active) continue;
      const res = this.blauertEngine.processCoordinate(t.state.x, t.state.y, t.index);
      if (res.ghost) {
        const gPos = this.toScreen(res.ghost.x, res.ghost.y);
        const mPos = this.toScreen(t.state.x, t.state.y);

        ctx.beginPath();
        ctx.moveTo(mPos.x, mPos.y);
        ctx.lineTo(gPos.x, gPos.y);
        ctx.strokeStyle = 'rgba(58, 134, 255, 0.35)';
        ctx.setLineDash([2, 3]);
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(gPos.x, gPos.y, 5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0, 245, 212, ${res.ghost.alpha})`;
        ctx.shadowColor = '#00f5d4';
        ctx.shadowBlur = 6;
        ctx.fill();
      }
    }
    ctx.restore();
  }

  drawCalciteBirefringentRays(polyStates) {
    if (!this.birefringenceEngine) return;
    const ctx = this.ctx;
    ctx.save();

    for (const t of polyStates) {
      if (!t.active) continue;
      const res = this.birefringenceEngine.processCoordinate(t.state.x, t.state.y);
      const ordPos = this.toScreen(res.ordinary.x, res.ordinary.y);
      const extPos = this.toScreen(res.extraordinary.x, res.extraordinary.y);

      ctx.beginPath();
      ctx.moveTo(ordPos.x, ordPos.y);
      ctx.lineTo(extPos.x, extPos.y);
      ctx.strokeStyle = 'rgba(72, 202, 228, 0.45)';
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      ctx.stroke();

      ctx.beginPath();
      const dSize = 6;
      ctx.moveTo(extPos.x, extPos.y - dSize);
      ctx.lineTo(extPos.x + dSize, extPos.y);
      ctx.lineTo(extPos.x, extPos.y + dSize);
      ctx.lineTo(extPos.x - dSize, extPos.y);
      ctx.closePath();
      ctx.fillStyle = '#ade8f4';
      ctx.shadowColor = '#48cae4';
      ctx.shadowBlur = 8;
      ctx.fill();

      ctx.fillStyle = '#caf0f8';
      ctx.font = 'bold 8px monospace';
      ctx.fillText('Te', extPos.x + 8, extPos.y - 4);
    }
    ctx.restore();
  }

  drawIpeAmareloMaresiaSurge() {
    if (!this.spectralDiffusionEngine || !this.spectralDiffusionEngine.maresiaActive) return;
    const ctx = this.ctx;
    ctx.save();
    const prog = this.spectralDiffusionEngine.maresiaProgress;
    const r = prog * this.radiusPx * 1.1;

    ctx.beginPath();
    ctx.arc(this.centerX, this.centerY, r, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(255, 190, 11, ${0.8 * (1 - prog)})`;
    ctx.lineWidth = 4;
    ctx.shadowColor = '#ffbe0b';
    ctx.shadowBlur = 12;
    ctx.stroke();

    ctx.restore();
  }

  drawTrajectoryPuck(t, isSelected) {
    if (!t || !t.state || !Number.isFinite(t.state.x) || !Number.isFinite(t.state.y)) return;
    const ctx = this.ctx;
    const s = t.state;
    const pal = t.palette;
    const pos = this.toScreen(s.x, s.y);
    if (!Number.isFinite(pos.x) || !Number.isFinite(pos.y)) return;

    ctx.save();

    // Focus & Center dispersion radius matching Ableton Live Surround Panner
    const focusVal = t.spectralState?.focus !== undefined ? t.spectralState.focus : s.focus;
    const centerVal = t.spectralState?.center !== undefined ? t.spectralState.center : s.center;
    const dispersionRadius = calculateSurroundPannerDispersionRadius(focusVal, centerVal, this.radiusPx);

    // Clip dispersion disc to the acoustic surround sound field boundary (speaker perimeter)
    ctx.save();
    ctx.beginPath();
    ctx.arc(this.centerX, this.centerY, this.radiusPx, 0, Math.PI * 2);
    ctx.clip();

    // 1. Shaded Dispersion Disc (Ableton Surround Panner representation)
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, dispersionRadius, 0, Math.PI * 2);
    const discFillAlpha = isSelected ? 0.24 : 0.18;
    ctx.fillStyle = getAlphaColor(pal.glow || pal.primary, discFillAlpha);
    ctx.fill();

    // 2. Defined boundary perimeter ring
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, dispersionRadius, 0, Math.PI * 2);
    ctx.strokeStyle = pal.primary;
    ctx.globalAlpha = isSelected ? 0.65 : 0.40;
    ctx.lineWidth = 1.2;
    ctx.stroke();
    ctx.restore();

    // 3. Core Focal Puck (Ableton ring with center crosshair & trajectory glow)
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, 7, 0, Math.PI * 2);
    ctx.fillStyle = pal.secondary || '#ffffff';
    ctx.shadowColor = pal.primary;
    ctx.shadowBlur = isSelected ? 16 : 8;
    ctx.fill();

    if (isSelected) {
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, 12, 0, Math.PI * 2);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    ctx.beginPath();
    ctx.arc(pos.x, pos.y, 8, 0, Math.PI * 2);
    ctx.strokeStyle = pal.primary;
    ctx.lineWidth = 2;
    ctx.stroke();

    // Subtle crosshair at focal center (Ableton Surround Panner style)
    ctx.beginPath();
    ctx.moveTo(pos.x - 4, pos.y);
    ctx.lineTo(pos.x + 4, pos.y);
    ctx.moveTo(pos.x, pos.y - 4);
    ctx.lineTo(pos.x, pos.y + 4);
    ctx.strokeStyle = pal.primary;
    ctx.lineWidth = 1.2;
    ctx.stroke();

    // Clean Trajectory Badge Tag (T1, T2, etc.)
    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(7, 17, 12, 0.9)';
    ctx.fillRect(pos.x + 10, pos.y - 14, 24, 14);
    ctx.strokeStyle = pal.primary;
    ctx.strokeRect(pos.x + 10, pos.y - 14, 24, 14);

    ctx.fillStyle = pal.primary;
    ctx.font = 'bold 9px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`T${t.id}`, pos.x + 22, pos.y - 7);

    ctx.restore();
  }
}

/**
 * Calculates the sound object trajectory dispersion radius matching
 * Ableton Live's Max For Live Surround Panner device.
 * Focus [0, 100] (diffuse to pinpoint focus)
 * Center [0, 100] (center bleed / spread)
 * Returns radius in pixels scaled to radiusPx (boundary speaker perimeter).
 */
export function calculateSurroundPannerDispersionRadius(focus, center, radiusPx) {
  const focusNorm = Math.max(0, Math.min(100, focus !== undefined ? focus : 50)) / 100;
  const centerNorm = Math.max(0, Math.min(100, center !== undefined ? center : 50)) / 100;

  // Empirical function fitted from Ableton Live Surround Panner 5x5 control grid:
  // r_norm = min(1.0, 1.0 / (1.0 + 2.27 * Focus) + 0.26 * Center + 0.17 * Center^2)
  const normRadius = Math.min(
    1.0,
    (1.0 / (1.0 + 2.27 * focusNorm)) + 0.26 * centerNorm + 0.17 * centerNorm * centerNorm
  );

  return normRadius * radiusPx;
}

function getAlphaColor(colorStr, alpha) {
  if (!colorStr) return `rgba(180, 200, 220, ${alpha})`;
  if (colorStr.startsWith('rgba')) {
    return colorStr.replace(/[\d\.]+\)$/, `${alpha})`);
  }
  if (colorStr.startsWith('rgb')) {
    return colorStr.replace('rgb', 'rgba').replace(')', `, ${alpha})`);
  }
  if (colorStr.startsWith('#')) {
    const hex = colorStr.slice(1);
    if (hex.length === 6) {
      const r = parseInt(hex.slice(0, 2), 16);
      const g = parseInt(hex.slice(2, 4), 16);
      const b = parseInt(hex.slice(4, 6), 16);
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
  }
  return colorStr;
}

