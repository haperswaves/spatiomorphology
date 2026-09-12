# Spatiomorph: Electroacoustic Trajectory Suite for Ableton Live

An expandable spatial trajectory generator and visualizer designed for automated multi-channel modulation of **Ableton Live's Surround Panner (Max for Live)**, grounded in Denis Smalley's electroacoustic theory of **spectromorphology** and **spatiomorphology** (*"Space-form and the acousmatic image"*, 2007).

---

## Personality System

Spatiomorph features a dual-personality architecture:

### 1. 🌿 Pounamu (New Zealand Greenstone)
An advanced multi-agent spatial composition environment inspired by Denis Smalley's acousmatic space-form framework, styled in deep New Zealand nephrite and pounamu tones:
- **Polyphonic Trajectories (Up to 6)**: Coordinates up to 6 simultaneous spatial trajectories (T1–T6), each with independent mathematical shapes, timing, offsets, scale, and mute/solo controls.
- **Ableton Multi-Instance MIDI Streaming**: Outputs 6 concurrent parameter streams via **Per-Trajectory Channels (Ch 1..6)** or **Multi-CC Stacking (CC 20..67)** to control multiple instances of the Surround Panner across 6 audio tracks.
- **Ecological & Proxemic Spatial Model**: Concentric zones based on Edward Hall & Denis Smalley (*Intimate/Gestural* $r < 0.25$, *Personal/Reachable* $0.25 \le r < 0.55$, *Social/Ensemble* $0.55 \le r < 0.85$, and *Arena/Public Perimeter* $r \ge 0.85$), with behavioral zone locks (*Upper / Forward Zone*, *Lower / Deep Zone*).
- **Spectral Space Coupling (2D Plugin Compliant)**: Translates vertical spectral space and gravitational forces into Ableton Surround Panner parameters:
  - *Focus Coupling*: High $Y$ (treble canopy) tightens Focus to $100\%$ pinpoint; low $Y$ (bass ground plane) diffuses Focus into ambient mass.
  - *Center Coupling*: Lower $Y$ increases Center bleed to ground the sub/mono core.
  - *Gravitational Inertia*: Downward descents encounter higher `Smooth` lag filter damping (simulating mass and gravity); ascents float with agile levitation.
  - *Filter Cutoff CC 26*: Streams vertical spectral cutoff to automate track filters or synths.
- **Proximate Vectorial Wipes & Distal Interpolation**:
  - *Vectorial Wipe*: High-velocity sweep cutting through intimate space ($r < 0.25$), temporarily ducking track volume (CC 27) with three configurable aftermaths: **Restoration**, **Shift** (phase bump), or **Prolongation** (perimeter continuation).
  - *Distal Breach*: Momentary aperture pulse ducking proximate foreground volume (CC 27) to unveil deep distal soundscapes.
- **Snapshots (3x3 Numpad Matrix & Continuous Shape Crossfader)**:
  - 9 snapshot pads mapped to Numpad 1–9 with right-click/click context menu (`Recall`, `Morph`, `Store`, `Delete`).
  - Continuous shape crossfading that mathematically interpolates geometric vertex coordinates and chaotic attractor paths during morph transitions.
  - Dynamic duration: seconds in Free mode, inverted musical divisions (up to 128/1) in Synced mode.
  - 4 Morph Curves: `Linear`, `Logarithmic (Ease-Out)`, `Exponential (Ease-In)`, and `S-Curve (Smoothstep)`.
- **Space-Form Accumulator (Holistic Temporal Collapse)**:
  - Off-screen persistence canvas capturing the accumulated density of inhabited space over time.
  - Configurable decay: Infinite (score memory), Slow ($60\text{ s}$), Medium ($15\text{ s}$).
  - PNG score export for acousmatic analysis.

### 2. 🌼 Plaifolia (Vanilla Plant)
A streamlined, single-trajectory workflow focused on pure geometric and harmonic panning, styled in warm orchid creams, pollen amber, and rich cured vanilla-pod umber. Features a strict 1:1 square canvas aspect ratio and dedicated `DIRECTION` controls.

---

## Global Brightness Tiers

Spatiomorph includes 4 global brightness themes for both personalities:
1. **Dark** (Default studio contrast)
2. **Medium Dark** (Low-glare stage illumination)
3. **Medium Light** (Daylight balanced studio)
4. **Light** (Clean print & score analysis)

---

## Speaker Arrangements

Accurately simulates all 10 Ableton Live Surround Panner speaker layouts with constant-power energy preservation ($\sum g_i^2 = 1.0$):
- **2-CH**: Stereo with L & R vertically centered at $y = 0.0$
- **4-CH**: Room (square corners), Circle, Center (cardinal axes)
- **6-CH**: Room (corners + sides), Circle, Center (cardinal + diagonals)
- **8-CH**: Room, Circle, Center

---

## Clock & Temporal Control

- **Synced Mode**: Master BPM (20–300) with inverted musical divisions (shorter divisions at top, up to $128/1$) with thousandths precision (`X.XXX`).
- **Free Rate Tri-Mode**:
  - **Time**: Direct period duration ($1\text{ ms}$ to $300\text{ s}$).
  - **LFO**: Sub-audio modulation ($0.001\text{ Hz}$ to $2.000\text{ Hz}$).
  - **VCO**: Audio-rate spatial timbre modulation ($1\text{ Hz}$ to $600\text{ Hz}$).

---

## Mathematical Trajectory Bank (26 Shapes)

1. **Geometric Trajectories**:
   - Circle / Ellipse (eccentricity, ratio, tilt)
   - Morphable Polygon (3 to 8 vertices, bipolar corner roundness from $-1$ to $+1$, star inset)
   - Rhodonea Rose Curves (multi-lobed epicycles)
2. **Spiral & Vortex Trajectories**:
   - Archimedean Spiral (linear radial expansion)
   - Logarithmic Spiral (golden ratio vortex)
   - Centripetal / Centrifugal Vortex (exponential gravitational curvature)
3. **Harmonic Lissajous**:
   - Lissajous Harmonograph (harmonic integer frequency ratios $f_x : f_y$, phase shift, damping)
4. **Acousmatic Gestures**:
   - Diagonal Criss-Cross (central sweet-spot crossing with controllable dwell & perimeter return)
   - Meander Zig-Zag (continuous smooth raster scan)
5. **Stochastic & Chaos (17 Strange Attractors + Drift)**:
   - Stochastic Drift (seed control, 8-harmonic complexity, spatial warp rate)
   - Lorenz Attractor
   - Rössler Attractor
   - Bouali Attractor
   - Thomas Cyclically Symmetric Attractor
   - Aizawa Attractor
   - Chen Attractor
   - Halvorsen Attractor
   - Liu-Chen Attractor
   - Nosé-Hoover Attractor
   - Sprott Attractor
   - Four-Wing Attractor
   - Chua Double-Scroll Attractor
   - Arneodo Attractor
   - Dequan Li Five-Wing Attractor
   - Rabinovich-Fabrikant Attractor
   - Rikitake Dynamo Attractor
   - Dadras Attractor

---

## MIDI CC Map Reference

| Parameter | Base CC (Trajectory 1) | Channel Routing | Stacked Mode CCs |
|---|---|---|---|
| **Traj X** | CC 20 | Ch 1..6 | CC 20, 28, 36, 44, 52, 60 |
| **Traj Y** | CC 21 | Ch 1..6 | CC 21, 29, 37, 45, 53, 61 |
| **Rotation** | CC 22 | Ch 1..6 | CC 22, 30, 38, 46, 54, 62 |
| **Focus** | CC 23 (Default 50%) | Ch 1..6 | CC 23, 31, 39, 47, 55, 63 |
| **Center** | CC 24 (Default 50%) | Ch 1..6 | CC 24, 32, 40, 48, 56, 64 |
| **Smooth** | CC 25 (Default 0%) | Ch 1..6 | CC 25, 33, 41, 49, 57, 65 |
| **Filter Cutoff** | CC 26 | Ch 1..6 | CC 26, 34, 42, 50, 58, 66 |
| **Track Volume** | CC 27 (Starts at 127) | Ch 1..6 | CC 27, 35, 43, 51, 59, 67 |

---

## Quick Start

### 1. Run Development Server
```powershell
python serve.py
```
Open `http://localhost:8080/index.html` in Chrome, Edge, or any Web MIDI supported browser.

### 2. Run Test Suite
```powershell
node tests/trajectories.test.mjs
```

---

## Connecting to Ableton Live's Surround Panner

1. **Virtual MIDI Port**:
   - Windows: Open [loopMIDI](https://www.tobias-erichsen.de/software/loopmidi.html) and create a virtual port named `Spatiomorph`.
   - macOS: Enable the built-in `IAC Driver` in *Audio MIDI Setup*.
2. **Configure Spatiomorph Web MIDI**:
   - Click **⚙️ Configure Web MIDI** in the main interface.
   - Toggle **Enable MIDI Stream** to ON.
   - Select your virtual MIDI port in the dropdown.
   - Select your routing mode:
     - **Per-Trajectory Channels (Recommended)**: Tracks 1 to 6 listen to MIDI Channels 1 to 6 on CCs 20–27.
     - **Multi-CC Stacking**: All trajectories share MIDI Channel 1 using CC blocks (T1: CC 20–27, T2: CC 28–35, etc.).
3. **Map to Surround Panners in Ableton Live**:
   - In Ableton Live preferences (*Link / Tempo / MIDI*), turn ON **Remote** for the virtual input port.
   - Insert the **Surround Panner** (Max for Live) on each of your audio tracks.
   - Enter MIDI Map Mode (`Ctrl + M` / `Cmd + M`), click each Surround Panner control ($X, Y$, Rotation, Focus, Center, Smooth), and send a test movement from Spatiomorph.
   - Optionally map CC 26 to your track's Auto Filter cutoff frequency, and CC 27 to the track mixer volume fader.
