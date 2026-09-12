/**
 * Spatiomorph - Web MIDI Output Controller
 * Streams real-time MIDI CC messages to Ableton Live / virtual MIDI ports
 * for up to 6 polyphonic trajectories simultaneously.
 * Supports Per-Trajectory Channels (Ch 1..6) and Multi-CC Stacking modes.
 * Includes CC 26 (Filter Cutoff) and CC 27 (Track Volume for Vectorial ducking).
 */

export class MidiOutputController {
  constructor() {
    this.midiAccess = null;
    this.selectedPort = null;
    this.enabled = false;

    // Routing Mode: 'channels' (Ch 1..6) | 'stacked_ccs' (Ch X, CC 20..55)
    this.routingMode = 'channels';
    this.baseChannel = 0; // 0-indexed (Channel 1)

    // Base CC assignment
    this.ccMap = {
      x: 20,
      y: 21,
      rotation: 22,
      focus: 23,
      center: 24,
      smooth: 25,
      spectral: 26, // Filter Cutoff
      volume: 27    // Track Volume (starts at 127)
    };

    // Cache last sent values for all 6 trajectories
    this.lastSent = Array.from({ length: 6 }, () => ({
      x: -1,
      y: -1,
      rotation: -1,
      focus: -1,
      center: -1,
      smooth: -1,
      spectral: -1,
      volume: -1
    }));

    this.onStateChangeCallback = null;
  }

  async init() {
    if (typeof navigator !== 'undefined' && navigator.requestMIDIAccess) {
      try {
        this.midiAccess = await navigator.requestMIDIAccess({ sysex: false });
        this.midiAccess.onstatechange = () => {
          if (this.onStateChangeCallback) this.onStateChangeCallback(this.getAvailablePorts());
        };
        const ports = this.getAvailablePorts();
        if (ports.length > 0 && !this.selectedPort) {
          this.setPort(ports[0].id);
        }
        return true;
      } catch (err) {
        console.warn('Web MIDI API not available or permission denied:', err);
        return false;
      }
    }
    return false;
  }

  getAvailablePorts() {
    if (!this.midiAccess) return [];
    const ports = [];
    for (const output of this.midiAccess.outputs.values()) {
      ports.push({
        id: output.id,
        name: output.name || `MIDI Port ${output.id}`,
        manufacturer: output.manufacturer || ''
      });
    }
    return ports;
  }

  setPort(portId) {
    if (!this.midiAccess) return;
    this.selectedPort = this.midiAccess.outputs.get(portId) || null;
  }

  setBaseChannel(chan1to16) {
    this.baseChannel = Math.max(0, Math.min(15, (chan1to16 || 1) - 1));
  }

  sendCC(channel0to15, ccNumber, value7bit) {
    if (!this.enabled || !this.selectedPort) return;
    const val = Math.max(0, Math.min(127, Math.round(value7bit)));
    const statusByte = 0xB0 | (channel0to15 & 0x0F);
    try {
      this.selectedPort.send([statusByte, ccNumber, val]);
    } catch (e) {
      console.warn('Error sending MIDI CC:', e);
    }
  }

  /**
   * Updates MIDI output for all active trajectories.
   * @param {Array} trajectoryStates - Array of { id, index, active, audible, state, spectralState, volume }
   */
  updateTrajectories(trajectoryStates) {
    if (!this.enabled || !this.selectedPort || !trajectoryStates) return;

    for (const t of trajectoryStates) {
      const idx = t.index;
      if (!t.active || !t.audible) continue;

      const s = t.state;
      const spec = t.spectralState || { focus: s.focus, center: s.center, smooth: s.smooth, spectralCc: 64 };
      const vol = t.volume !== undefined ? t.volume : 127;
      const cache = this.lastSent[idx];

      let targetChannel = this.baseChannel;
      let ccOffset = 0;

      if (this.routingMode === 'channels') {
        targetChannel = (this.baseChannel + idx) % 16;
      } else {
        targetChannel = this.baseChannel;
        ccOffset = idx * 8;
      }

      // 1. X-Axis [-1.0, 1.0] -> [0, 127]
      const ccX = Math.round(((s.x + 1.0) / 2.0) * 127);
      if (ccX !== cache.x) {
        this.sendCC(targetChannel, this.ccMap.x + ccOffset, ccX);
        cache.x = ccX;
      }

      // 2. Y-Axis [-1.0, 1.0] -> [0, 127]
      const ccY = Math.round(((s.y + 1.0) / 2.0) * 127);
      if (ccY !== cache.y) {
        this.sendCC(targetChannel, this.ccMap.y + ccOffset, ccY);
        cache.y = ccY;
      }

      // 3. Rotation [-180, 180] -> [0, 127]
      const ccRot = Math.round(((s.rotationDeg + 180) / 360) * 127);
      if (ccRot !== cache.rotation) {
        this.sendCC(targetChannel, this.ccMap.rotation + ccOffset, ccRot);
        cache.rotation = ccRot;
      }

      // 4. Focus [0, 100] -> [0, 127]
      const ccFocus = Math.round((spec.focus / 100) * 127);
      if (ccFocus !== cache.focus) {
        this.sendCC(targetChannel, this.ccMap.focus + ccOffset, ccFocus);
        cache.focus = ccFocus;
      }

      // 5. Center [0, 100] -> [0, 127]
      const ccCenter = Math.round((spec.center / 100) * 127);
      if (ccCenter !== cache.center) {
        this.sendCC(targetChannel, this.ccMap.center + ccOffset, ccCenter);
        cache.center = ccCenter;
      }

      // 6. Smooth [0, 100] -> [0, 127]
      const ccSmooth = Math.round((spec.smooth / 100) * 127);
      if (ccSmooth !== cache.smooth) {
        this.sendCC(targetChannel, this.ccMap.smooth + ccOffset, ccSmooth);
        cache.smooth = ccSmooth;
      }

      // 7. Spectral Filter Cutoff [0, 127]
      if (spec.spectralCc !== undefined) {
        const ccSpec = Math.round(spec.spectralCc);
        if (ccSpec !== cache.spectral) {
          this.sendCC(targetChannel, this.ccMap.spectral + ccOffset, ccSpec);
          cache.spectral = ccSpec;
        }
      }

      // 8. Track Volume [0, 127]
      const ccVol = Math.round(vol);
      if (ccVol !== cache.volume) {
        this.sendCC(targetChannel, this.ccMap.volume + ccOffset, ccVol);
        cache.volume = ccVol;
      }
    }
  }
}
