# 🚢 Cargo Ship Three.js Experience

A beautiful, scroll-driven storytelling website featuring a 3D cargo ship model with cinematic camera animations and smooth transitions.

## 🎯 Features

- **Scroll-Based Animations**: Camera moves dynamically as you scroll through the page
- **Cinematic Camera Movements**: Zoom in, zoom out, rotate around the ship
- **Alternating Content Layout**: Content sections appear on left and right alternately
- **Smooth Transitions**: All animations use easing functions for natural motion
- **Loading Screen**: Beautiful progress indicator while the 3D model loads
- **Responsive Design**: Fully optimized for desktop, tablet, and mobile devices
- **Particle Ocean System**: Animated white particles with sine waves and noise for realistic water
- **Dynamic Lighting**: Multiple light sources for dramatic visuals
- **Ship Animations**: Subtle bobbing and rocking motion for realism
- **Interactive Camera Controls**: Toggle between scroll mode and manual camera controls (press C)
- **Ocean Control Panel**: Real-time adjustable ocean parameters with intuitive sliders (press O)

## 🚀 Getting Started

### Prerequisites

You need a local web server to run this project (due to CORS restrictions with loading 3D models).

### Quick Start

#### Option 1: Using Python (if installed)

```bash
# Python 3
python -m http.server 8000

# Python 2
python -m SimpleHTTPServer 8000
```

#### Option 2: Using Node.js

```bash
# Install http-server globally
npm install -g http-server

# Run server
http-server -p 8000
```

#### Option 3: Using VS Code Live Server

1. Install the "Live Server" extension in VS Code
2. Right-click on `index.html`
3. Select "Open with Live Server"

#### Option 4: Using npx (Node.js)

```bash
npx serve
```

### Access the Website

Open your browser and navigate to:
```
http://localhost:8000
```

## 🎛️ Interactive Controls

### Camera Controls (Press **C**)
Toggle between scroll animation mode and manual camera control:
- **Scroll Mode** (default): Camera follows predefined scroll-based animations
- **Manual Mode**: Use OrbitControls to freely explore the scene
  - Left click + drag: Rotate camera
  - Right click + drag: Pan camera
  - Scroll wheel: Zoom in/out

### Ocean Settings Panel (Press **O**)
Real-time control over ocean appearance and behavior with organized sections:

**Particle Properties:**
- Particle Size (0.1 - 1.0): Adjust individual particle size
- Particle Spacing (0.2 - 1.5): Control density of particles ⚠️ *Rebuilds ocean*
- Particle Opacity (0.1 - 1.0): Change transparency

**Ocean Dimensions:**
- Ocean Width (50 - 400): Adjust horizontal extent ⚠️ *Rebuilds ocean*
- Ocean Depth (50 - 400): Adjust vertical extent ⚠️ *Rebuilds ocean*

**Wave Parameters:**
- Wave Speed (0.1 - 2.0): Animation speed
- Wave Amplitude (0.1 - 1.0): Height of waves
- Wave Frequency (0.1 - 2.0): Density of wave patterns
- Noise Amplitude (0.0 - 0.5): Randomness/turbulence amount
- Noise Frequency (0.5 - 3.0): Detail level of noise

**⚡ Intensity Multiplier (0.1 - 3.0):**
Master control that amplifies all wave movements for vigorous/stormy seas

**Ship Behavior:**
- Ship Tilt (0.0 - 0.15): How much the ship rocks with waves

**Reset Button:** Restore all parameters to default values

> **Performance Note:** Parameters marked with ⚠️ require rebuilding the ocean geometry, which may cause a brief pause on slower systems.

## 📁 Project Structure

```
ship3js/
├── index.html          # Main HTML structure with scroll sections
├── script.js          # Three.js scene and scroll animations
├── style.css          # Modern styling and responsive design
├── .cursorrules       # Development guidelines and patterns
├── README.md          # This file
└── assets/
    └── big_cargo_ships_with__1031095925_generate.glb  # 3D ship model
```

## 🎨 Customization

### Modifying Camera Animations

Edit the `SCROLL_SECTIONS` array in `script.js`:

```javascript
const SCROLL_SECTIONS = [
  {
    progress: 0,                          // Scroll position (0 to 1)
    camera: { x: 8, y: 3, z: 12 },       // Camera position
    target: { x: 0, y: 1, z: 0 },        // Where camera looks
    shipRotation: { x: 0, y: Math.PI * 0.2, z: 0 }  // Ship rotation
  },
  // Add more sections...
];
```

### Adding New Content Sections

In `index.html`, add a new section:

```html
<section class="content-section section-N" data-section="N">
  <div class="content-left">  <!-- or content-right -->
    <h2>Your Title</h2>
    <p>Your content...</p>
  </div>
</section>
```

### Changing Colors

Update colors in `style.css`:

- Background: `#0a1929`
- Primary accent: `#4a9eff`
- Secondary accent: `#00d4ff`

Update scene colors in `script.js`:

```javascript
scene.background = new THREE.Color(0x0a1929);
scene.fog = new THREE.Fog(0x0a1929, 10, 50);
```

### Customizing Ocean Particles

The ocean uses a particle system with animated sine waves. Adjust these parameters in `script.js`:

```javascript
// In setupOcean() function
const particleSpacing = 0.5;    // Distance between particles (smaller = more dense)
const oceanMaterial = new THREE.PointsMaterial({
  color: 0xffffff,              // Particle color (white)
  size: 0.3,                    // Particle size
  opacity: 0.6                  // Transparency (0-1)
});

// In animateOcean() function
const waveSpeed = 0.5;          // Animation speed
const waveAmplitude = 0.3;      // Wave height
const waveFrequency = 0.5;      // Wave density
const noiseAmplitude = 0.15;    // Randomness amount
const noiseFrequency = 1.5;     // Noise detail level
```

**Performance Note:** Lower `particleSpacing` creates more particles but impacts performance. Recommended values: 0.3-0.8

### Adjusting Ship Float Behavior

Control how the ship floats on the waves in the `updateCameraPosition()` function:

```javascript
// Ship tilt intensity
const tiltAmplitude = 0.03;  // How much the ship rocks (increase for more dramatic)

// Wave calculation for ship
const oceanWaveHeight = calculateOceanWaveHeight(
  shipX,
  shipZ,
  currentTime,
  false  // Set to true to include noise (more chaotic motion)
);

// Tilt calculation (simulates wave slopes)
const tiltX = Math.sin(shipX * 0.5 + time * 0.5) * tiltAmplitude;
const tiltZ = Math.cos(shipZ * 0.5 + time * 0.5) * tiltAmplitude;
```

**Adjustment Tips:**
- Increase `tiltAmplitude` (try 0.05-0.08) for a ship in stormy seas
- Enable noise (`true`) for more chaotic, turbulent floating
- Decrease frequency multipliers (0.5) for slower, gentler rocking

## 🎯 Scroll Sections Overview

1. **Hero** - Wide introductory shot
2. **Global Reach** - Side view with rotation
3. **Technology** - Close-up detail shot
4. **Sustainability** - High angle overview
5. **Capacity** - Front close-up view
6. **Safety** - Wide dramatic angle
7. **Innovation** - Side profile view
8. **Call to Action** - Final overview shot

## 🔧 Technical Details

### Three.js Configuration

- **Version**: 0.160.0 (loaded via CDN)
- **Renderer**: WebGL with antialiasing
- **Tone Mapping**: ACES Filmic
- **Shadow Maps**: PCF Soft Shadows
- **Pixel Ratio**: Capped at 2x for performance

### Performance Optimizations

- Smooth scroll interpolation with lerp
- Easing functions for natural motion
- Debounced resize handling
- Efficient shadow map size (2048x2048)
- Pixel ratio capping for high-DPI displays
- Intersection Observer for content visibility

### Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers with WebGL support

## 📱 Responsive Breakpoints

- **Desktop**: 1024px and above
- **Tablet**: 768px to 1023px
- **Mobile**: Below 768px
- **Small Mobile**: Below 480px

## 🎬 Animation Details

### Camera Movement Types

1. **Orbital** - Circling around the ship
2. **Zoom In/Out** - Moving closer or further away
3. **Height Variation** - Changing elevation for different perspectives
4. **Look-At Targeting** - Focusing on different parts of the ship

### Ship Animations

- **Wave-Synchronized Floating**: Ship Y-position matches ocean wave height in real-time
- **Realistic Tilting**: Ship rocks based on wave slopes for natural motion
- **Smooth Motion**: Uses wave calculation without noise for fluid movement
- **Rotation**: Smooth spinning based on scroll position (during scroll animations)

### Ocean Particle Animation

The ocean uses ~160,000 particles in a grid formation with:

- **Multiple Sine Waves**: 3 overlapping sine waves for natural water movement
- **Procedural Noise**: Random offsets create organic turbulence
- **Real-time Updates**: BufferGeometry attributes update each frame
- **Wave Composition**:
  - Primary wave (X-axis): Main forward motion
  - Secondary wave (Z-axis): Side-to-side movement
  - Diagonal wave: Creates crosshatch pattern
  - Noise layer: Adds randomness and detail

### Ship-Ocean Wave Synchronization

The ship floats realistically on the ocean waves using a shared wave calculation:

```javascript
// Shared function calculates wave height at any position
calculateOceanWaveHeight(x, z, time, includeNoise)

// Ocean particles use full calculation with noise
oceanWaveHeight = calculateOceanWaveHeight(x, z, time, true)

// Ship uses smooth calculation without noise
shipWaveHeight = calculateOceanWaveHeight(shipX, shipZ, time, false)
```

**Why disable noise for the ship?**
- Ocean particles need randomness for realistic turbulence
- Ship needs smooth, predictable motion for visual stability
- Result: Ship floats naturally without jittery movement

## 🛠️ Troubleshooting

### Model Not Loading

- Ensure you're using a local web server (not file://)
- Check browser console for errors
- Verify the model path in `script.js`
- Confirm the GLB file exists in `assets/` folder

### Jerky Animations

- Check browser performance
- Reduce shadow quality in `script.js`
- Lower pixel ratio for better performance
- Close other tabs/applications

### Content Not Visible

- Check browser console for JavaScript errors
- Ensure scroll container is properly positioned
- Verify content has enough contrast against background

## 📝 Development Tips

See `.cursorrules` file for comprehensive development guidelines including:

- Code style and structure
- Three.js patterns
- Scroll animation techniques
- Performance optimization strategies
- Common issues and solutions

## 🎨 Design Philosophy

This project demonstrates:

- **Storytelling through scroll**: Each section reveals more about the ship
- **Cinematic presentation**: Professional camera movements and lighting
- **Modern web design**: Glass-morphism, gradients, and smooth animations
- **Performance first**: Optimized for smooth 60fps experience
- **Accessibility**: Reduced motion support and keyboard navigation

## 📄 License

Free to use for learning and demonstration purposes.

## 🙏 Acknowledgments

- Three.js community for excellent documentation
- 3D model from provided GLB file
- Modern web design patterns and best practices

## 🚀 Future Enhancements

Potential additions:
- Interactive hotspots on the ship
- Animated ocean waves with shaders
- Particle effects (fog, smoke)
- Day/night cycle transition
- Sound effects triggered by scroll
- WebXR support for VR/AR
- Physics-based ship movement

---

**Happy Exploring! 🌊**

