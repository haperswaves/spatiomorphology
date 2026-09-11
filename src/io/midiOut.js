/**
 * Spatiomorphology - Web MIDI Output Controller
 * Sends real-time MIDI CC messages directly to Ableton Live / virtual MIDI ports
 * to modulate Surround Panner parameters (X, Y, Rotation, Focus, Center, Smooth).
 */

export class MidiOutputController {
  constructor() {
    this.midiAccess = null;
    this.selectedPort = null;
    this.channel = 0; // 0-indexed (Channel 1)
    this.enabled = false;

    // Default CC mappings
    this.ccMap = {
      x: 20,
      y: 21,
      rotation: 22,
      focus: 23,
      center: 24,
      smooth: 25
    };

    // Cache last sent values to avoid duplicate messages
    this.lastSent = {
      x: -1,
      y: -1,
      rotation: -1,
      focus: -1,
      center: -1,
      smooth: -1
    };

    this.onStateChangeCallback = null;
  }

  async init() {
    if (typeof navigator !== 'undefined' && navigator.requestMIDIAccess) {
      try {
        this.midiAccess = await navigator.requestMIDIAccess({ sysex: false });
        this.midiAccess.onstatechange = () => {
          if (this.onStateChangeCallback) this.onStateChangeCallback(this.getAvailablePorts());
        };
        // Auto-select first available port if present
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

  setChannel(chan1to16) {
    this.channel = Math.max(0, Math.min(15, (chan1to16 || 1) - 1));
  }

  sendCC(ccNumber, value7bit) {
    if (!this.enabled || !this.selectedPort) return;
    const val = Math.max(0, Math.min(127, Math.round(value7bit)));
    const statusByte = 0xB0 | (this.channel & 0x0F);
    try {
      this.selectedPort.send([statusByte, ccNumber, val]);
    } catch (e) {
      console.warn('Error sending MIDI CC:', e);
    }
  }

  update(engineState) {
    if (!this.enabled || !this.selectedPort) return;

    // Normalize X from [-1.0, 1.0] to [0, 127]
    const ccX = Math.round(((engineState.x + 1.0) / 2.0) * 127);
    if (ccX !== this.lastSent.x) {
      this.sendCC(this.ccMap.x, ccX);
      this.lastSent.x = ccX;
    }

    // Normalize Y from [-1.0, 1.0] to [0, 127]
    const ccY = Math.round(((engineState.y + 1.0) / 2.0) * 127);
    if (ccY !== this.lastSent.y) {
      this.sendCC(this.ccMap.y, ccY);
      this.lastSent.y = ccY;
    }

    // Rotation from [-180, 180] to [0, 127]
    const ccRot = Math.round(((engineState.rotationDeg + 180) / 360) * 127);
    if (ccRot !== this.lastSent.rotation) {
      this.sendCC(this.ccMap.rotation, ccRot);
      this.lastSent.rotation = ccRot;
    }

    // Focus from [0, 100] to [0, 127]
    const ccFocus = Math.round((engineState.focus / 100) * 127);
    if (ccFocus !== this.lastSent.focus) {
      this.sendCC(this.ccMap.focus, ccFocus);
      this.lastSent.focus = ccFocus;
    }

    // Center from [0, 100] to [0, 127]
    const ccCenter = Math.round((engineState.center / 100) * 127);
    if (ccCenter !== this.lastSent.center) {
      this.sendCC(this.ccMap.center, ccCenter);
      this.lastSent.center = ccCenter;
    }

    // Smooth from [0, 100] to [0, 127]
    const ccSmooth = Math.round((engineState.smooth / 100) * 127);
    if (ccSmooth !== this.lastSent.smooth) {
      this.sendCC(this.ccMap.smooth, ccSmooth);
      this.lastSent.smooth = ccSmooth;
    }
  }
}
