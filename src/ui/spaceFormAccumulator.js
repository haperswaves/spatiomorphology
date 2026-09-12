/**
 * Spatiomorphology - Space-Form Accumulator (Temporal Collapse Heatmap)
 * Implements Denis Smalley's core philosophical concept: collapsing temporal succession
 * into an accumulated, holistic spatial mental image.
 * Uses an offscreen persistence buffer to visualize inhabited spatial territories,
 * high-velocity vectors, and unvisited spatial voids.
 */

export class SpaceFormAccumulator {
  constructor() {
    this.enabled = true;
    this.decayMode = 'fast'; // 'fast' (5s) | 'medium' (15s) | 'slow' (60s) | 'infinite'
    this.intensity = 0.8;
    this.personality = 'pounamu'; // 'pounamu' | 'plaifolia'

    // Off-screen canvas buffer
    this.offscreenCanvas = document.createElement('canvas');
    this.offscreenCtx = this.offscreenCanvas.getContext('2d', { willReadFrequently: false });
    this.width = 600;
    this.height = 600;
    this.radiusPx = 250;
    this.centerX = 300;
    this.centerY = 300;

    this.resize(600, 600, 250);
  }

  resize(width, height, radiusPx) {
    this.width = width;
    this.height = height;
    this.radiusPx = radiusPx;
    this.centerX = width / 2;
    this.centerY = height / 2;

    const prev = document.createElement('canvas');
    prev.width = this.offscreenCanvas.width;
    prev.height = this.offscreenCanvas.height;
    const pCtx = prev.getContext('2d');
    pCtx.drawImage(this.offscreenCanvas, 0, 0);

    this.offscreenCanvas.width = width;
    this.offscreenCanvas.height = height;

    if (prev.width > 0 && prev.height > 0) {
      this.offscreenCtx.drawImage(prev, 0, 0, width, height);
    }
  }

  clear() {
    this.offscreenCtx.clearRect(0, 0, this.width, this.height);
  }

  toScreen(normX, normY) {
    return {
      x: this.centerX + normX * this.radiusPx,
      y: this.centerY - normY * this.radiusPx
    };
  }

  /**
   * Records active points from voices onto the persistence buffer.
   * @param {Array} activeVoices - Array of { x, y, audible, palette }
   * @param {number} dt - delta time in seconds
   */
  accumulate(activeVoices, dt) {
    if (!this.enabled || !activeVoices || activeVoices.length === 0) return;

    const ctx = this.offscreenCtx;

    // Apply temporal decay if not in infinite mode
    if (this.decayMode === 'fast') {
      // ~5s half-life
      ctx.save();
      ctx.globalCompositeOperation = 'destination-out';
      ctx.fillStyle = `rgba(0, 0, 0, ${Math.min(1.0, dt * 0.22)})`;
      ctx.fillRect(0, 0, this.width, this.height);
      ctx.restore();
    } else if (this.decayMode === 'medium') {
      // ~15s half-life: fade slightly each frame
      ctx.save();
      ctx.globalCompositeOperation = 'destination-out';
      ctx.fillStyle = `rgba(0, 0, 0, ${Math.min(1.0, dt * 0.08)})`;
      ctx.fillRect(0, 0, this.width, this.height);
      ctx.restore();
    } else if (this.decayMode === 'slow') {
      // ~60s half-life
      ctx.save();
      ctx.globalCompositeOperation = 'destination-out';
      ctx.fillStyle = `rgba(0, 0, 0, ${Math.min(1.0, dt * 0.02)})`;
      ctx.fillRect(0, 0, this.width, this.height);
      ctx.restore();
    }

    ctx.save();
    ctx.globalCompositeOperation = 'screen';

    for (const v of activeVoices) {
      if (!v.audible) continue;

      const pt = this.toScreen(v.x, v.y);
      const radius = 9;

      const glowColor = this.personality === 'smalley'
        ? (v.palette?.glow || 'rgba(82, 183, 136, 0.35)')
        : (v.palette?.glow || 'rgba(253, 230, 138, 0.35)');

      const grad = ctx.createRadialGradient(pt.x, pt.y, 0, pt.x, pt.y, radius);
      grad.addColorStop(0, glowColor);
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.beginPath();
      ctx.arc(pt.x, pt.y, radius, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();
    }

    ctx.restore();
  }

  /**
   * Render the accumulated heat/memory layer onto the main canvas.
   */
  renderTo(mainCtx) {
    if (!this.enabled) return;

    mainCtx.save();
    mainCtx.globalAlpha = this.intensity;
    mainCtx.drawImage(this.offscreenCanvas, 0, 0);
    mainCtx.restore();
  }

  exportScore() {
    const link = document.createElement('a');
    link.download = `spatiomorphology_space_form_${Date.now()}.png`;
    link.href = this.offscreenCanvas.toDataURL('image/png');
    link.click();
  }
}
