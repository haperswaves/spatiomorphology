/**
 * Spatiomorphology - Canvas Visualizer & Spatial Monitor
 * Renders high-DPI coordinate space, trajectory paths, motion trails,
 * virtual speakers with gain halos, and sound puck with Focus dispersion.
 */

export class CanvasRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');

    // Trail history buffer
    this.trailPoints = [];
    this.maxTrailLength = 50;
    this.showTrail = true;
    this.showTrajectory = true;
    this.showGrid = true;
    this.showMeters = true;

    // Canvas sizing
    this.width = 0;
    this.height = 0;
    this.centerX = 0;
    this.centerY = 0;
    this.radiusPx = 0;

    this.resize();
  }

  resize() {
    const rect = this.canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    this.width = rect.width || 600;
    this.height = rect.height || 600;

    this.canvas.width = Math.floor(this.width * dpr);
    this.canvas.height = Math.floor(this.height * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    this.centerX = this.width / 2;
    this.centerY = this.height / 2;
    // Leave margin for speaker badges
    this.radiusPx = Math.min(this.width, this.height) * 0.42;
  }

  toScreen(normX, normY) {
    // In audio/panning: +Y is Front (Up), +X is Right
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

  render(engineState, sampledPath, speakerGains) {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);

    // 1. Coordinate Grid & Distance Rings
    if (this.showGrid) {
      this.drawGrid();
    }

    // 2. Trajectory Path
    if (this.showTrajectory && sampledPath && sampledPath.length > 1) {
      this.drawTrajectoryPath(sampledPath);
    }

    // 3. Motion Trail
    if (this.showTrail) {
      this.updateAndDrawTrail(engineState.x, engineState.y);
    }

    // 4. Virtual Speakers & Radiation Halos
    if (speakerGains) {
      this.drawSpeakers(speakerGains);
    }

    // 5. Raw Target Marker (if smoothed lag is notable)
    const rawDist = Math.hypot(engineState.x - engineState.rawX, engineState.y - engineState.rawY);
    if (rawDist > 0.02 && engineState.smooth > 5) {
      this.drawRawLagIndicator(engineState);
    }

    // 6. Sound Puck & Focus Dispersion Aura
    this.drawSoundPuck(engineState);
  }

  drawGrid() {
    const ctx = this.ctx;
    ctx.save();

    // Concentric polar rings
    const rings = [0.25, 0.5, 0.75, 1.0];
    for (const r of rings) {
      ctx.beginPath();
      ctx.arc(this.centerX, this.centerY, r * this.radiusPx, 0, Math.PI * 2);
      ctx.strokeStyle = r === 1.0 ? 'rgba(80, 100, 130, 0.35)' : 'rgba(50, 70, 95, 0.2)';
      ctx.lineWidth = r === 1.0 ? 1.5 : 1;
      ctx.setLineDash(r === 1.0 ? [] : [4, 6]);
      ctx.stroke();

      // Distance labels
      if (r === 1.0 || r === 0.5) {
        ctx.fillStyle = 'rgba(120, 145, 175, 0.5)';
        ctx.font = '10px Inter, system-ui, sans-serif';
        ctx.fillText(`${(r * 100).toFixed(0)}%`, this.centerX + 4, this.centerY - r * this.radiusPx + 12);
      }
    }

    // Cartesian Axes
    ctx.setLineDash([2, 4]);
    ctx.strokeStyle = 'rgba(70, 90, 120, 0.3)';
    ctx.lineWidth = 1;

    // X Axis (L <-> R)
    ctx.beginPath();
    ctx.moveTo(this.centerX - this.radiusPx * 1.1, this.centerY);
    ctx.lineTo(this.centerX + this.radiusPx * 1.1, this.centerY);
    ctx.stroke();

    // Y Axis (Rear <-> Front)
    ctx.beginPath();
    ctx.moveTo(this.centerX, this.centerY - this.radiusPx * 1.1);
    ctx.lineTo(this.centerX, this.centerY + this.radiusPx * 1.1);
    ctx.stroke();

    // Cardinal Labels
    ctx.fillStyle = 'rgba(130, 160, 195, 0.65)';
    ctx.font = '11px Inter, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('FRONT (+Y)', this.centerX, this.centerY - this.radiusPx * 1.06);
    ctx.fillText('REAR (-Y)', this.centerX, this.centerY + this.radiusPx * 1.12);
    ctx.textAlign = 'left';
    ctx.fillText('RIGHT (+X)', this.centerX + this.radiusPx * 1.06, this.centerY + 4);
    ctx.textAlign = 'right';
    ctx.fillText('LEFT (-X)', this.centerX - this.radiusPx * 1.06, this.centerY + 4);

    // Center cross
    ctx.setLineDash([]);
    ctx.strokeStyle = 'rgba(100, 210, 255, 0.4)';
    ctx.beginPath();
    ctx.moveTo(this.centerX - 6, this.centerY);
    ctx.lineTo(this.centerX + 6, this.centerY);
    ctx.moveTo(this.centerX, this.centerY - 6);
    ctx.lineTo(this.centerX, this.centerY + 6);
    ctx.stroke();

    ctx.restore();
  }

  drawTrajectoryPath(sampledPath) {
    const ctx = this.ctx;
    ctx.save();
    ctx.beginPath();

    const startPt = this.toScreen(sampledPath[0].x, sampledPath[0].y);
    ctx.moveTo(startPt.x, startPt.y);

    for (let i = 1; i < sampledPath.length; i++) {
      const pt = this.toScreen(sampledPath[i].x, sampledPath[i].y);
      ctx.lineTo(pt.x, pt.y);
    }

    ctx.strokeStyle = 'rgba(45, 212, 191, 0.45)'; // Soft teal
    ctx.lineWidth = 2.0;
    ctx.setLineDash([6, 5]);
    ctx.stroke();

    // Start point indicator
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.arc(startPt.x, startPt.y, 4, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(52, 211, 153, 0.9)'; // Emerald
    ctx.fill();

    ctx.restore();
  }

  updateAndDrawTrail(currX, currY) {
    this.trailPoints.push({ x: currX, y: currY });
    if (this.trailPoints.length > this.maxTrailLength) {
      this.trailPoints.shift();
    }

    const ctx = this.ctx;
    ctx.save();

    const len = this.trailPoints.length;
    for (let i = 1; i < len; i++) {
      const prev = this.toScreen(this.trailPoints[i - 1].x, this.trailPoints[i - 1].y);
      const curr = this.toScreen(this.trailPoints[i].x, this.trailPoints[i].y);
      const alpha = (i / len) * 0.7;

      ctx.beginPath();
      ctx.moveTo(prev.x, prev.y);
      ctx.lineTo(curr.x, curr.y);
      ctx.strokeStyle = `rgba(34, 211, 238, ${alpha})`;
      ctx.lineWidth = 1 + (i / len) * 3;
      ctx.stroke();
    }

    ctx.restore();
  }

  drawSpeakers(speakerGains) {
    const ctx = this.ctx;
    ctx.save();

    for (const spk of speakerGains) {
      const pos = this.toScreen(spk.x, spk.y);
      const gain = spk.gain; // 0.0 to 1.0+
      const db = spk.db;

      // 1. Acoustic Radiation Aura (proportional to gain)
      if (gain > 0.05) {
        const auraRadius = 18 + gain * 38;
        const grad = ctx.createRadialGradient(pos.x, pos.y, 4, pos.x, pos.y, auraRadius);
        grad.addColorStop(0, `rgba(56, 189, 248, ${gain * 0.6})`);
        grad.addColorStop(0.6, `rgba(14, 165, 233, ${gain * 0.25})`);
        grad.addColorStop(1, 'rgba(14, 165, 233, 0)');

        ctx.beginPath();
        ctx.arc(pos.x, pos.y, auraRadius, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();
      }

      // 2. Speaker Monitor Body
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, 14, 0, Math.PI * 2);
      ctx.fillStyle = '#0f172a'; // Deep navy
      ctx.fill();
      ctx.strokeStyle = gain > 0.3 ? 'rgba(56, 189, 248, 0.9)' : 'rgba(100, 116, 139, 0.6)';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Speaker Cone Inner Accent
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, 8, 0, Math.PI * 2);
      ctx.fillStyle = gain > 0.1 ? `rgba(56, 189, 248, ${0.3 + gain * 0.7})` : '#1e293b';
      ctx.fill();

      // Speaker Label / Channel
      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 9px Inter, system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(spk.id, pos.x, pos.y);

      // Meter Bar & dB readout next to speaker
      if (this.showMeters) {
        // Compute position outward from speaker
        const angle = Math.atan2(pos.y - this.centerY, pos.x - this.centerX);
        const offset = 26;
        const meterX = pos.x + Math.cos(angle) * offset;
        const meterY = pos.y + Math.sin(angle) * offset;

        // dB badge
        ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
        ctx.fillRect(meterX - 18, meterY - 7, 36, 14);
        ctx.strokeStyle = gain > 0.4 ? 'rgba(56, 189, 248, 0.7)' : 'rgba(71, 85, 105, 0.5)';
        ctx.lineWidth = 1;
        ctx.strokeRect(meterX - 18, meterY - 7, 36, 14);

        ctx.fillStyle = gain > 0.5 ? '#38bdf8' : '#94a3b8';
        ctx.font = '9px monospace';
        ctx.fillText(`${db > -60 ? db.toFixed(1) : '-∞'}dB`, meterX, meterY);
      }
    }

    ctx.restore();
  }

  drawRawLagIndicator(engineState) {
    const ctx = this.ctx;
    const rawPos = this.toScreen(engineState.rawX, engineState.rawY);
    const smoothPos = this.toScreen(engineState.x, engineState.y);

    ctx.save();
    // Connecting lead line
    ctx.beginPath();
    ctx.moveTo(smoothPos.x, smoothPos.y);
    ctx.lineTo(rawPos.x, rawPos.y);
    ctx.strokeStyle = 'rgba(244, 114, 182, 0.5)'; // Pink target lead
    ctx.setLineDash([3, 3]);
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Target ghost crosshair
    ctx.setLineDash([]);
    ctx.strokeStyle = 'rgba(244, 114, 182, 0.7)';
    ctx.strokeRect(rawPos.x - 4, rawPos.y - 4, 8, 8);
    ctx.restore();
  }

  drawSoundPuck(engineState) {
    const ctx = this.ctx;
    const pos = this.toScreen(engineState.x, engineState.y);

    ctx.save();

    // Focus dispersion ring
    // Focus 100% = small concentrated circle; Focus 0% = large dispersed field
    const focusNorm = engineState.focus / 100;
    const dispersionRadius = 14 + (1 - focusNorm) * 55;

    const focusGrad = ctx.createRadialGradient(pos.x, pos.y, 4, pos.x, pos.y, dispersionRadius);
    focusGrad.addColorStop(0, 'rgba(52, 211, 153, 0.75)'); // Emerald core
    focusGrad.addColorStop(0.5, `rgba(45, 212, 191, ${(1 - focusNorm) * 0.35 + 0.15})`);
    focusGrad.addColorStop(1, 'rgba(45, 212, 191, 0)');

    ctx.beginPath();
    ctx.arc(pos.x, pos.y, dispersionRadius, 0, Math.PI * 2);
    ctx.fillStyle = focusGrad;
    ctx.fill();

    // Focus boundary ring
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, dispersionRadius, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(52, 211, 153, ${0.2 + focusNorm * 0.4})`;
    ctx.lineWidth = 1.5;
    ctx.setLineDash([3, 4]);
    ctx.stroke();

    // Core Glowing Puck
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, 7, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = '#34d399';
    ctx.shadowBlur = 12;
    ctx.fill();

    // Puck outer rim
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, 8, 0, Math.PI * 2);
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Sound Position Tooltip Readout
    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
    ctx.fillRect(pos.x + 12, pos.y - 18, 88, 20);
    ctx.strokeStyle = 'rgba(52, 211, 153, 0.5)';
    ctx.strokeRect(pos.x + 12, pos.y - 18, 88, 20);

    ctx.fillStyle = '#34d399';
    ctx.font = '10px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`X:${engineState.x.toFixed(2)} Y:${engineState.y.toFixed(2)}`, pos.x + 16, pos.y - 4);

    ctx.restore();
  }
}
