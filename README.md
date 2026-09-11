# Spatiomorphology: Spatial Trajectory Generator for Ableton Live

An expandable spatial panning generator and visualizer designed for automated control of **Ableton Live's Surround Panner (Max for Live)**, drawing on Denis Smalley's electroacoustic tradition of **spectromorphology** and **spatiomorphology**.

---

## Features

- **Multi-Channel Speaker Simulation**:
  - **Stereo (2.0)**: Front monitor pair ($L, R$).
  - **Quadraphonic (4.0)**: Studio quad format ($FL, FR, RL, RR$).
  - **Octophonic Ring (8.0)**: Standard electroacoustic circular concert array ($C, FR, R, RR, B, RL, L, FL$).
  - Constant-power acoustic energy preservation ($\sum g_i^2 = 1.0$) with real-time dB peak meters and radiation halos.

- **Ableton Surround Panner Target Parameters**:
  - **$X$-Axis** ($-1.0$ to $+1.0$ / Left $\leftrightarrow$ Right)
  - **$Y$-Axis** ($-1.0$ to $+1.0$ / Rear $\leftrightarrow$ Front)
  - **Rotation** ($-180^\circ$ to $+180^\circ$, with static angle offset and auto-rotate spin)
  - **Focus** ($0\%$ diffuse ambient field to $100\%$ pinpoint point-source)
  - **Center** ($0\%$ center divergence to $100\%$ center bleed/presence)
  - **Smooth** ($0\%$ instantaneous to $100\%$ inertial lag, modeled via exponential moving-average low-pass filter)

- **Expandable Shape Bank**:
  - **Circles & Ellipses**: Variable eccentricity, aspect ratio, and angular tilt.
  - **Morphable Polygons**: Dynamic vertex count (Triangle, Square, Pentagon, Hexagon, Octagon, etc.), corner roundness blending, and star insets.
  - **Archimedean & Logarithmic Spirals**: Configurable turns, inner radius, and cyclic ping-pong expansion/contraction.
  - **Centrifugal & Centripetal Vortices**: Exponential radial suction and expulsion profiles.
  - **Lissajous Harmonographs**: Independent harmonic integer ratios ($f_x : f_y$), phase shift $\delta$, and orbital damping.
  - **Diagonal Criss-Crosses**: High-velocity crossings cutting through the central sweet spot, followed by perimeter sweeps.
  - **Zig-Zag & Meanders**: Serpentine raster scanning across the multi-channel space.
  - **Rhodonea Rose Curves**: Floral multi-lobed epicycles ($k$-petals).
  - **Turbulent Acousmatic Drift**: Multi-harmonic pseudo-stochastic Brownian spatial wandering.

- **Temporal & Transport Engine**:
  - **Beat Sync**: Synchronized to musical divisions ($32/1, 16/1, 8/1, 4/1, 2/1, 1/1, 1/2, 1/4, 1/8, 1/16, 1/32, 1/64$, dotted, triplets) at selectable BPM.
  - **Free Run (Hz)**: Precision frequency from $0.01\text{ Hz}$ (ultra-slow $100$-second drift) to $20\text{ Hz}$.
  - **Direction Modes**: Clockwise (CW), Counter-Clockwise (CCW), and Ping-Pong / Alternating bounce.
  - **Phase & Starting Point**: Independent $0^\circ \text{--} 360^\circ$ phase offset and starting angle.

- **Web MIDI Output Controller**:
  - Direct live control into Ableton Live or virtual MIDI ports (loopMIDI on Windows, IAC Bus on macOS).
  - Continuous 7-bit CC streaming with deduplication to prevent bus flooding.
  - Default CC Assignments:
    - `CC 20`: $X$-Axis
    - `CC 21`: $Y$-Axis
    - `CC 22`: Rotation
    - `CC 23`: Focus
    - `CC 24`: Center
    - `CC 25`: Smooth

---

## Quick Start

### 1. Run via Python (Recommended)
Launch the built-in development server with auto-browser launch:
```powershell
python serve.py
```
This serves the application at `http://localhost:8080/index.html`.

### 2. Run via Node.js
Run the automated mathematical and acoustic test suite:
```powershell
npm test
```

---

## Connecting to Ableton Live's Surround Panner

1. **Virtual MIDI Port**:
   - On Windows: Open [loopMIDI](https://www.tobias-erichsen.de/software/loopmidi.html) and create a port named `Spatiomorphology`.
   - On macOS: Enable the built-in `IAC Driver` in *Audio MIDI Setup*.
2. **Configure Spatiomorphology**:
   - In the **Web MIDI Output** panel (bottom-right), toggle the switch **ON**.
   - Select your virtual MIDI port (`Spatiomorphology` or `IAC Driver`).
   - Choose your MIDI Channel (default `Channel 1`).
3. **Map to Surround Panner in Live**:
   - In Ableton Live, open **Preferences $\to$ Link, Tempo & MIDI** and check **Remote** for the virtual input port.
   - Insert the **Surround Panner** (Max for Live) on your audio track.
   - Enter MIDI Map Mode (`Ctrl + M` / `Cmd + M`).
   - Click each parameter in Surround Panner ($X$, $Y$, Rotation, Focus, Center, Smooth) and send a test value from Spatiomorphology.
   - Exit MIDI Map Mode. The Surround Panner will now follow the spectromorphological trajectories in real time!

---

## How to Add Custom Shapes (Expandable Registry)

Adding a new spatial trajectory is as simple as registering a shape definition in `src/math/trajectories.js`:

```javascript
registry.register({
  id: 'my_custom_shape',
  name: 'My Custom Gesture',
  category: 'Geometric',
  description: 'Custom mathematical spatial gesture.',
  params: [
    { id: 'lobes', name: 'Lobes', type: 'number', min: 2, max: 8, step: 1, default: 3 }
  ],
  // phase: normalized [0.0, 1.0)
  // returns: { x: [-1.0, 1.0], y: [-1.0, 1.0] }
  compute: (phase, params = {}) => {
    const lobes = params.lobes ?? 3;
    const theta = 2 * Math.PI * phase;
    const r = Math.sin(lobes * theta);
    return {
      x: r * Math.cos(theta),
      y: r * Math.sin(theta)
    };
  }
});
```
The application will automatically:
1. Add the shape into the UI dropdown categorized under its category.
2. Render reactive parameter sliders for each parameter defined in `params`.
3. Calculate preview paths and sample coordinates for the spatial audio engine.

---

## Future Porting Architecture (VST3 & Live 12 Extensions)

The mathematical modules are written with zero DOM dependencies:
- `src/math/trajectories.js`: Pure mathematical mapping functions.
- `src/engine/motionEngine.js`: Clocking, phase accumulation, and smoothing filters.
- `src/engine/speakerLayout.js`: Energy-normalized multi-channel panning laws.

This separation makes it straightforward to:
1. **Port to C++ / JUCE (VST3)**: The functions map directly to standard C++ float DSP loops.
2. **Port to Ableton Live 12 Extensions**: Use Ableton's Python Remote Script API or WebSockets to stream trajectories directly into Live Object Model (`live.path live_set tracks N devices M parameters`).
