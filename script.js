import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

// Constants
// const MODEL_PATH = "assets/big_cargo_ships_with__1031095925_generate.glb";
const MODEL_PATH = "assets/cargo_ship_08.glb";
const CONTAINER_PATH = "assets/industrial_shipping_container.glb";

// Scroll sections configuration
const SCROLL_SECTIONS = [
  {
    progress: 0,
    camera: { x: -0.22, y: 9.71, z: -9.31 },
    target: { x: 0, y: 0, z: 0 },
    shipRotation: { x: 0, y: Math.PI * 0.2, z: 0 },
  },
  {
    progress: 0.09,
    camera: { x: 1.37, y: 6.71, z: 1.63 },
    target: { x: 0, y: 0, z: 0 },
    shipRotation: { x: 0, y: Math.PI * 0.2, z: 0 },
  },
  {
    progress: 0.14,
    camera: { x: 0.32, y: 1.87, z: 12.18 },
    target: { x: 0, y: 0, z: 0 },
    shipRotation: { x: 0, y: Math.PI * 0.8, z: 0 },
  },
  {
    progress: 0.28,
    camera: { x: 4.5, y: 1.33, z: 6 },
    target: { x: 0, y: 1, z: 0 },
    shipRotation: { x: 0, y: Math.PI * 1.2, z: 0 },
  },
  {
    progress: 0.42,
    camera: { x: 2.17, y: 1.37, z: 4.42 },
    target: { x: 0, y: 0.5, z: 0 },
    shipRotation: { x: 0, y: Math.PI * 1.8, z: 0 },
  },
  {
    progress: 0.56,
    camera: { x: 7.7, y: 2.9, z: 1.33 },
    target: { x: 4, y: 3, z: -1.5 },
    shipRotation: { x: 0, y: Math.PI * 2.3, z: 0 },
  },
  {
    progress: 0.7,
    camera: { x: 7.53, y: 1.94, z: -1.5 },
    target: { x: 2.86, y: 1.16, z: 0.39 },
    shipRotation: { x: 0, y: Math.PI * 2.8, z: 0 },
  },
  {
    progress: 0.84,
    camera: { x: -4, y: 3, z: 7 },
    target: { x: 0, y: 1, z: 0 },
    shipRotation: { x: 0, y: Math.PI * 3.5, z: 0 },
  },
  {
    progress: 1.0,
    camera: { x: 0, y: 8, z: 15 },
    target: { x: 0, y: 0, z: 0 },
    shipRotation: { x: 0, y: Math.PI * 4, z: 0 },
  },
];

// Scene variables
let scene, camera, renderer, shipModel, containerModel, controls;
let scrollProgress = 0;
let targetScrollProgress = 0;
let controlsEnabled = false; // Toggle between scroll animation and manual controls
let currentLookAtTarget = new THREE.Vector3(0, 0, 0); // Track current camera lookAt target
let oceanParticles; // Particle system for ocean
let oceanGeometry; // Geometry for ocean particles
let oceanMaterial; // Material for ocean particles
let currentTime = 0; // Shared time for ocean and ship synchronization

// Ocean configuration parameters (adjustable via UI)
const OCEAN_CONFIG = {
  // Particle properties
  particleSize: 0.1,
  particleSpacing: 0.1,
  particleOpacity: 0.5,

  // Ocean dimensions
  oceanWidth: 20,
  oceanDepth: 20,
  oceanLevel: -0.25,

  // Wave parameters
  waveSpeed: 0.7,
  waveAmplitude: 0.15,
  waveFrequency: 0.8,

  // Noise parameters
  noiseAmplitude: 0.1,
  noiseFrequency: 0.8,

  // Intensity multiplier for vigorous movement
  intensityMultiplier: 1.0,

  // Ship tilt
  shipTiltAmplitude: 0.1,
};

// Helper functions
function lerp(start, end, t) {
  return start + (end - start) * t;
}

function easeInOutQuad(t) {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

// Initialize Three.js scene
function init() {
  // Create scene
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0a1929);
  scene.fog = new THREE.Fog(0x0a1929, 10, 50);

  // Create camera
  camera = new THREE.PerspectiveCamera(
    15,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.set(-0.69, 0.71, -5.56);

  // Create renderer
  const canvas = document.getElementById("webgl");
  renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: false,
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.2;

  // Setup OrbitControls
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.minDistance = 5;
  controls.maxDistance = 30;
  controls.maxPolarAngle = Math.PI / 1.5;
  controls.enabled = controlsEnabled;

  // Initialize lookAt target with first section's target
  currentLookAtTarget.set(
    SCROLL_SECTIONS[0].target.x,
    SCROLL_SECTIONS[0].target.y,
    SCROLL_SECTIONS[0].target.z
  );

  setupLights();
  setupOcean();
  loadShipModel();
  loadContainerModel(); // Load container at position (3, 1, 4)
  setupScrollListener();
  setupIntersectionObserver();
  setupControlsToggle();
  setupOceanControls();
  animate();

  // Handle window resize
  window.addEventListener("resize", onWindowResize);
}

// Setup lighting
function setupLights() {
  // Ambient light
  const ambientLight = new THREE.AmbientLight(0x87ceeb, 1); // sky blue for ambient
  scene.add(ambientLight);

  // Hemisphere light for sky/ground
  const hemiLight = new THREE.HemisphereLight(0x7095c1, 0x0c2340, 1);
  hemiLight.position.set(0, 50, 0);
  scene.add(hemiLight);

  // Main directional light (moon/sun)
  const mainLight = new THREE.DirectionalLight(0xffffff, 1.5);
  mainLight.position.set(15, 25, 15);
  mainLight.castShadow = true;
  mainLight.shadow.camera.left = -25;
  mainLight.shadow.camera.right = 25;
  mainLight.shadow.camera.top = 25;
  mainLight.shadow.camera.bottom = -25;
  mainLight.shadow.camera.near = 0.1;
  mainLight.shadow.camera.far = 60;
  mainLight.shadow.mapSize.set(2048, 2048);
  mainLight.shadow.bias = -0.0001;
  scene.add(mainLight);

  // Fill light
  const fillLight = new THREE.DirectionalLight(0x4a7ba7, 0.6);
  fillLight.position.set(-10, 15, -10);
  scene.add(fillLight);

  // Accent light
  const accentLight = new THREE.PointLight(0xffa500, 0.8, 30);
  accentLight.position.set(5, 5, 5);
  scene.add(accentLight);
}

// Setup ocean with particle system
function setupOcean() {
  // Use configuration parameters
  const {
    oceanWidth,
    oceanDepth,
    particleSpacing,
    particleSize,
    particleOpacity,
    oceanLevel,
  } = OCEAN_CONFIG;

  const particlesX = Math.floor(oceanWidth / particleSpacing);
  const particlesZ = Math.floor(oceanDepth / particleSpacing);
  const particleCount = particlesX * particlesZ;

  // Create geometry and positions array
  oceanGeometry = new THREE.BufferGeometry();
  const positions = new Float32Array(particleCount * 3);
  const initialPositions = new Float32Array(particleCount * 3);
  const randomOffsets = new Float32Array(particleCount * 3);

  let index = 0;
  for (let i = 0; i < particlesX; i++) {
    for (let j = 0; j < particlesZ; j++) {
      const x = (i - particlesX / 2) * particleSpacing;
      const z = (j - particlesZ / 2) * particleSpacing;
      const y = oceanLevel;

      positions[index] = x;
      positions[index + 1] = y;
      positions[index + 2] = z;

      initialPositions[index] = x;
      initialPositions[index + 1] = y;
      initialPositions[index + 2] = z;

      randomOffsets[index] = Math.random() * Math.PI * 2;
      randomOffsets[index + 1] = Math.random() * Math.PI * 2;
      randomOffsets[index + 2] = Math.random() * Math.PI * 2;

      index += 3;
    }
  }

  oceanGeometry.setAttribute(
    "position",
    new THREE.BufferAttribute(positions, 3)
  );
  oceanGeometry.setAttribute(
    "initialPosition",
    new THREE.BufferAttribute(initialPositions, 3)
  );
  oceanGeometry.setAttribute(
    "randomOffset",
    new THREE.BufferAttribute(randomOffsets, 3)
  );

  // Create particle material with configurable properties
  oceanMaterial = new THREE.PointsMaterial({
    color: 0xffffff,
    size: particleSize,
    transparent: true,
    opacity: particleOpacity,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    sizeAttenuation: true,
  });

  // Create particle system
  oceanParticles = new THREE.Points(oceanGeometry, oceanMaterial);
  oceanParticles.position.y = oceanLevel;
  scene.add(oceanParticles);
}

// Rebuild ocean with new parameters
function rebuildOcean() {
  if (oceanParticles) {
    scene.remove(oceanParticles);
    oceanGeometry.dispose();
    oceanMaterial.dispose();
  }
  setupOcean();
}

// Update ocean material properties without rebuilding
function updateOceanMaterial() {
  if (oceanMaterial) {
    oceanMaterial.size = OCEAN_CONFIG.particleSize;
    oceanMaterial.opacity = OCEAN_CONFIG.particleOpacity;
    oceanMaterial.needsUpdate = true;
  }
}

// Calculate ocean wave height at a specific position
function calculateOceanWaveHeight(
  x,
  z,
  time,
  includeNoise = true,
  randomOffsetX = 0,
  randomOffsetZ = 0
) {
  // Use configuration parameters
  const {
    waveSpeed,
    waveAmplitude,
    waveFrequency,
    noiseAmplitude,
    noiseFrequency,
    intensityMultiplier,
  } = OCEAN_CONFIG;

  // Apply intensity multiplier to speed and amplitude for vigorous movement
  const speed = waveSpeed * intensityMultiplier;
  const amplitude = waveAmplitude * intensityMultiplier;
  const noiseAmp = noiseAmplitude * intensityMultiplier;

  // Primary sine wave (along X axis)
  const wave1 = Math.sin(x * waveFrequency + time * speed) * amplitude;

  // Secondary sine wave (along Z axis)
  const wave2 =
    Math.sin(z * waveFrequency * 0.8 + time * speed * 0.7) * amplitude * 0.7;

  // Diagonal wave for more complexity
  const wave3 =
    Math.sin((x + z) * waveFrequency * 0.5 + time * speed * 0.5) *
    amplitude *
    0.5;

  // Noise component (optional, can be disabled for ship for smoother motion)
  let noiseCombined = 0;
  if (includeNoise) {
    const noiseX =
      Math.sin(x * noiseFrequency + time * speed * 0.3 + randomOffsetX) *
      noiseAmp;
    const noiseZ =
      Math.cos(z * noiseFrequency + time * speed * 0.4 + randomOffsetZ) *
      noiseAmp;
    noiseCombined = (noiseX + noiseZ) * 0.5;
  }

  // Return combined wave height
  return wave1 + wave2 + wave3 + noiseCombined;
}

// Animate ocean particles with sine waves and noise
function animateOcean() {
  if (!oceanParticles || !oceanGeometry) return;

  currentTime = Date.now() * 0.001;
  const positions = oceanGeometry.attributes.position.array;
  const initialPositions = oceanGeometry.attributes.initialPosition.array;
  const randomOffsets = oceanGeometry.attributes.randomOffset.array;

  for (let i = 0; i < positions.length; i += 3) {
    const x = initialPositions[i];
    const z = initialPositions[i + 2];

    // Calculate wave height using shared function
    const waveHeight = calculateOceanWaveHeight(
      x,
      z,
      currentTime,
      true,
      randomOffsets[i],
      randomOffsets[i + 2]
    );

    // Apply wave height to particle
    positions[i + 1] = initialPositions[i + 1] + waveHeight;
  }

  // Update the geometry
  oceanGeometry.attributes.position.needsUpdate = true;
}

// Load ship model
function loadShipModel() {
  const loadingManager = new THREE.LoadingManager();
  const progressFill = document.getElementById("progress-fill");
  const progressText = document.getElementById("progress");
  const loadingScreen = document.getElementById("loading-screen");

  loadingManager.onProgress = (url, loaded, total) => {
    const percent = Math.floor((loaded / total) * 100);
    progressText.textContent = percent;
    progressFill.style.width = percent + "%";
  };

  loadingManager.onLoad = () => {
    setTimeout(() => {
      loadingScreen.style.opacity = "0";
      setTimeout(() => {
        loadingScreen.style.display = "none";
      }, 500);
    }, 500);
  };

  loadingManager.onError = (url) => {
    console.error("Error loading:", url);
    progressText.textContent = "Error loading model";
  };

  const gltfLoader = new GLTFLoader(loadingManager);

  gltfLoader.load(
    MODEL_PATH,
    (gltf) => {
      shipModel = gltf.scene;

      // Scale and position model
      scaleModelToViewport(shipModel);

      // Enable shadows
      shipModel.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;

          // Enhance materials
          if (child.material) {
            child.material.roughness = 0.5;
            child.material.metalness = 0.8;
          }
        }
      });

      scene.add(shipModel);
    },
    undefined,
    (error) => {
      console.error("Error loading GLTF model:", error);
    }
  );
}

// Auto-scale model to viewport
function scaleModelToViewport(model) {
  const box = new THREE.Box3().setFromObject(model);
  const size = box.getSize(new THREE.Vector3());
  const maxDim = Math.max(size.x, size.y, size.z);
  const scale = 4 / maxDim;
  model.scale.set(scale, scale, scale);

  // Center model horizontally
  const center = box.getCenter(new THREE.Vector3());
  model.position.x -= center.x * scale;
  model.position.y -= center.y * scale;
  model.position.z -= center.z * scale;

  // Initial Y position will be set by wave calculation
  // Set to 0 as baseline (ocean surface level relative to waves)
  model.position.y = 0;
}

// Load container model
function loadContainerModel() {
  const gltfLoader = new GLTFLoader();

  gltfLoader.load(
    CONTAINER_PATH,
    (gltf) => {
      containerModel = gltf.scene;

      // Calculate appropriate scale for container
      const box = new THREE.Box3().setFromObject(containerModel);
      const size = box.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z);
      const scale = 1 / maxDim; // Adjust scale as needed
      containerModel.scale.set(scale, scale, scale);

      // Position at specified location
      containerModel.position.set(4, 3, -2);

      // Enable shadows
      containerModel.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;

          // Enhance materials
          if (child.material) {
            child.material.roughness = 0.6;
            child.material.metalness = 0.7;
          }
        }
      });

      scene.add(containerModel);
      console.log(
        "Container model loaded at position:",
        containerModel.position
      );
    },
    undefined,
    (error) => {
      console.error("Error loading container model:", error);
    }
  );
}

// Setup scroll listener
function setupScrollListener() {
  window.addEventListener(
    "scroll",
    () => {
      // Only update scroll progress when controls are disabled
      if (!controlsEnabled) {
        const maxScroll = document.body.scrollHeight - window.innerHeight;
        targetScrollProgress = maxScroll > 0 ? window.scrollY / maxScroll : 0;
      }
    },
    { passive: true }
  );
}

// Setup intersection observer for content visibility
function setupIntersectionObserver() {
  const options = {
    threshold: 0.25,
    rootMargin: "0px 0px -15% 0px",
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
      } else {
        entry.target.classList.remove("visible");
      }
    });
  }, options);

  document.querySelectorAll(".content-section").forEach((section) => {
    observer.observe(section);
  });
}

// Setup controls toggle with keyboard shortcut
function setupControlsToggle() {
  // Create UI toggle button
  const toggleButton = document.createElement("button");
  toggleButton.id = "controls-toggle";
  toggleButton.innerHTML = "🎮 Enable Controls (C)";
  toggleButton.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 1000;
    padding: 12px 20px;
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(10px);
    border: 2px solid rgba(255, 255, 255, 0.2);
    border-radius: 8px;
    color: white;
    font-family: Arial, sans-serif;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
  `;

  toggleButton.addEventListener("mouseenter", () => {
    toggleButton.style.background = "rgba(255, 255, 255, 0.2)";
    toggleButton.style.transform = "translateY(-2px)";
  });

  toggleButton.addEventListener("mouseleave", () => {
    toggleButton.style.background = "rgba(255, 255, 255, 0.1)";
    toggleButton.style.transform = "translateY(0)";
  });

  document.body.appendChild(toggleButton);

  // Create info panel
  const infoPanel = document.createElement("div");
  infoPanel.id = "camera-info";
  infoPanel.style.cssText = `
    position: fixed;
    top: 80px;
    right: 20px;
    z-index: 1000;
    padding: 16px;
    background: rgba(0, 0, 0, 0.7);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 8px;
    color: white;
    font-family: 'Courier New', monospace;
    font-size: 12px;
    display: none;
    min-width: 250px;
  `;
  document.body.appendChild(infoPanel);

  // Toggle function
  function toggleControls() {
    controlsEnabled = !controlsEnabled;
    controls.enabled = controlsEnabled;

    if (controlsEnabled) {
      // Sync OrbitControls target with current camera lookAt to prevent camera jump
      controls.target.copy(currentLookAtTarget);
      controls.update();

      toggleButton.innerHTML = "📜 Enable Scroll (C)";
      toggleButton.style.background = "rgba(100, 200, 255, 0.3)";
      toggleButton.style.borderColor = "rgba(100, 200, 255, 0.5)";
      infoPanel.style.display = "block";
      document.body.style.overflow = "hidden"; // Disable scrolling
    } else {
      toggleButton.innerHTML = "🎮 Enable Controls (C)";
      toggleButton.style.background = "rgba(255, 255, 255, 0.1)";
      toggleButton.style.borderColor = "rgba(255, 255, 255, 0.2)";
      infoPanel.style.display = "none";
      document.body.style.overflow = "auto"; // Enable scrolling
    }
  }

  // Button click handler
  toggleButton.addEventListener("click", toggleControls);

  // Keyboard shortcut (C key)
  window.addEventListener("keydown", (event) => {
    if (event.key === "c" || event.key === "C") {
      toggleControls();
    }
  });
}

// Setup ocean control panel
function setupOceanControls() {
  // Create control panel container
  const controlPanel = document.createElement("div");
  controlPanel.id = "ocean-controls";
  controlPanel.style.cssText = `
    position: fixed;
    top: 20px;
    left: 20px;
    z-index: 1000;
    padding: 20px;
    background: rgba(0, 0, 0, 0.8);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 12px;
    color: white;
    font-family: 'Courier New', monospace;
    font-size: 12px;
    max-width: 320px;
    max-height: 80vh;
    overflow-y: auto;
    display: none;
  `;

  // Custom scrollbar for control panel
  const style = document.createElement("style");
  style.textContent = `
    #ocean-controls::-webkit-scrollbar {
      width: 8px;
    }
    #ocean-controls::-webkit-scrollbar-track {
      background: rgba(255, 255, 255, 0.1);
      border-radius: 4px;
    }
    #ocean-controls::-webkit-scrollbar-thumb {
      background: rgba(74, 158, 255, 0.5);
      border-radius: 4px;
    }
    #ocean-controls::-webkit-scrollbar-thumb:hover {
      background: rgba(74, 158, 255, 0.7);
    }
  `;
  document.head.appendChild(style);

  // Title
  const title = document.createElement("div");
  title.innerHTML = "🌊 Ocean Controls";
  title.style.cssText = `
    font-size: 16px;
    font-weight: bold;
    margin-bottom: 15px;
    color: #64c8ff;
    text-align: center;
  `;
  controlPanel.appendChild(title);

  // Helper function to create a slider control
  function createSlider(
    label,
    config,
    min,
    max,
    step,
    onChange,
    requiresRebuild = false
  ) {
    const container = document.createElement("div");
    container.style.cssText = "margin-bottom: 15px;";

    const labelDiv = document.createElement("div");
    labelDiv.style.cssText =
      "margin-bottom: 5px; display: flex; justify-content: space-between;";

    const labelText = document.createElement("span");
    labelText.textContent = label;

    const valueDisplay = document.createElement("span");
    valueDisplay.style.cssText = "color: #64c8ff; font-weight: bold;";
    valueDisplay.textContent = config.toFixed(step < 0.1 ? 2 : 1);

    labelDiv.appendChild(labelText);
    labelDiv.appendChild(valueDisplay);

    const slider = document.createElement("input");
    slider.type = "range";
    slider.min = min;
    slider.max = max;
    slider.step = step;
    slider.value = config;
    slider.style.cssText = "width: 100%; cursor: pointer;";

    slider.addEventListener("input", (e) => {
      const value = parseFloat(e.target.value);
      valueDisplay.textContent = value.toFixed(step < 0.1 ? 2 : 1);
      onChange(value);
      if (requiresRebuild) {
        rebuildOcean();
      } else {
        updateOceanMaterial();
      }
    });

    container.appendChild(labelDiv);
    container.appendChild(slider);
    return container;
  }

  // Create sliders for each parameter

  // Particle Properties Section
  const particleSection = document.createElement("div");
  particleSection.innerHTML =
    "<div style='color: #ffa500; font-weight: bold; margin: 10px 0 5px 0; border-bottom: 1px solid rgba(255,255,255,0.2); padding-bottom: 5px;'>Particle Properties</div>";
  controlPanel.appendChild(particleSection);

  controlPanel.appendChild(
    createSlider(
      "Particle Size",
      OCEAN_CONFIG.particleSize,
      0.1,
      1.0,
      0.05,
      (value) => (OCEAN_CONFIG.particleSize = value),
      false
    )
  );

  controlPanel.appendChild(
    createSlider(
      "Particle Spacing",
      OCEAN_CONFIG.particleSpacing,
      0.2,
      1.5,
      0.1,
      (value) => (OCEAN_CONFIG.particleSpacing = value),
      true
    )
  );

  controlPanel.appendChild(
    createSlider(
      "Particle Opacity",
      OCEAN_CONFIG.particleOpacity,
      0.1,
      1.0,
      0.05,
      (value) => (OCEAN_CONFIG.particleOpacity = value),
      false
    )
  );

  // Ocean Dimensions Section
  const dimensionsSection = document.createElement("div");
  dimensionsSection.innerHTML =
    "<div style='color: #ffa500; font-weight: bold; margin: 15px 0 5px 0; border-bottom: 1px solid rgba(255,255,255,0.2); padding-bottom: 5px;'>Ocean Dimensions</div>";
  controlPanel.appendChild(dimensionsSection);

  controlPanel.appendChild(
    createSlider(
      "Ocean Width",
      OCEAN_CONFIG.oceanWidth,
      50,
      400,
      10,
      (value) => (OCEAN_CONFIG.oceanWidth = value),
      true
    )
  );

  controlPanel.appendChild(
    createSlider(
      "Ocean Depth",
      OCEAN_CONFIG.oceanDepth,
      50,
      400,
      10,
      (value) => (OCEAN_CONFIG.oceanDepth = value),
      true
    )
  );

  // Wave Parameters Section
  const waveSection = document.createElement("div");
  waveSection.innerHTML =
    "<div style='color: #ffa500; font-weight: bold; margin: 15px 0 5px 0; border-bottom: 1px solid rgba(255,255,255,0.2); padding-bottom: 5px;'>Wave Parameters</div>";
  controlPanel.appendChild(waveSection);

  controlPanel.appendChild(
    createSlider(
      "Wave Speed",
      OCEAN_CONFIG.waveSpeed,
      0.1,
      2.0,
      0.1,
      (value) => (OCEAN_CONFIG.waveSpeed = value),
      false
    )
  );

  controlPanel.appendChild(
    createSlider(
      "Wave Amplitude",
      OCEAN_CONFIG.waveAmplitude,
      0.1,
      1.0,
      0.05,
      (value) => (OCEAN_CONFIG.waveAmplitude = value),
      false
    )
  );

  controlPanel.appendChild(
    createSlider(
      "Wave Frequency",
      OCEAN_CONFIG.waveFrequency,
      0.1,
      2.0,
      0.1,
      (value) => (OCEAN_CONFIG.waveFrequency = value),
      false
    )
  );

  controlPanel.appendChild(
    createSlider(
      "Noise Amplitude",
      OCEAN_CONFIG.noiseAmplitude,
      0.0,
      0.5,
      0.05,
      (value) => (OCEAN_CONFIG.noiseAmplitude = value),
      false
    )
  );

  controlPanel.appendChild(
    createSlider(
      "Noise Frequency",
      OCEAN_CONFIG.noiseFrequency,
      0.5,
      3.0,
      0.1,
      (value) => (OCEAN_CONFIG.noiseFrequency = value),
      false
    )
  );

  // Intensity Section
  const intensitySection = document.createElement("div");
  intensitySection.innerHTML =
    "<div style='color: #ff4444; font-weight: bold; margin: 15px 0 5px 0; border-bottom: 1px solid rgba(255,255,255,0.2); padding-bottom: 5px;'>⚡ Intensity Multiplier</div>";
  controlPanel.appendChild(intensitySection);

  controlPanel.appendChild(
    createSlider(
      "Vigor / Intensity",
      OCEAN_CONFIG.intensityMultiplier,
      0.1,
      3.0,
      0.1,
      (value) => (OCEAN_CONFIG.intensityMultiplier = value),
      false
    )
  );

  // Ship Section
  const shipSection = document.createElement("div");
  shipSection.innerHTML =
    "<div style='color: #ffa500; font-weight: bold; margin: 15px 0 5px 0; border-bottom: 1px solid rgba(255,255,255,0.2); padding-bottom: 5px;'>Ship Behavior</div>";
  controlPanel.appendChild(shipSection);

  controlPanel.appendChild(
    createSlider(
      "Ship Tilt",
      OCEAN_CONFIG.shipTiltAmplitude,
      0.0,
      0.15,
      0.01,
      (value) => (OCEAN_CONFIG.shipTiltAmplitude = value),
      false
    )
  );

  // Reset button
  const resetButton = document.createElement("button");
  resetButton.textContent = "Reset to Defaults";
  resetButton.style.cssText = `
    width: 100%;
    padding: 10px;
    margin-top: 15px;
    background: rgba(74, 158, 255, 0.3);
    border: 1px solid rgba(74, 158, 255, 0.5);
    border-radius: 6px;
    color: white;
    font-family: 'Courier New', monospace;
    cursor: pointer;
    font-weight: bold;
  `;
  resetButton.addEventListener("click", () => {
    OCEAN_CONFIG.particleSize = 0.3;
    OCEAN_CONFIG.particleSpacing = 0.5;
    OCEAN_CONFIG.particleOpacity = 0.6;
    OCEAN_CONFIG.oceanWidth = 200;
    OCEAN_CONFIG.oceanDepth = 200;
    OCEAN_CONFIG.waveSpeed = 0.5;
    OCEAN_CONFIG.waveAmplitude = 0.3;
    OCEAN_CONFIG.waveFrequency = 0.5;
    OCEAN_CONFIG.noiseAmplitude = 0.15;
    OCEAN_CONFIG.noiseFrequency = 1.5;
    OCEAN_CONFIG.intensityMultiplier = 1.0;
    OCEAN_CONFIG.shipTiltAmplitude = 0.03;
    rebuildOcean();
    // Refresh the control panel
    document.body.removeChild(controlPanel);
    document.body.removeChild(toggleButton);
    setupOceanControls();
  });
  controlPanel.appendChild(resetButton);

  document.body.appendChild(controlPanel);

  // Toggle button for control panel
  const toggleButton = document.createElement("button");
  toggleButton.id = "ocean-controls-toggle";
  toggleButton.innerHTML = "🌊 Ocean Settings (O)";
  toggleButton.style.cssText = `
    position: fixed;
    top: 20px;
    left: 50%;
    z-index: 1000;
    padding: 12px 20px;
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(10px);
    border: 2px solid rgba(255, 255, 255, 0.2);
    border-radius: 8px;
    color: white;
    font-family: Arial, sans-serif;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
  `;

  toggleButton.addEventListener("mouseenter", () => {
    toggleButton.style.background = "rgba(255, 255, 255, 0.2)";
    toggleButton.style.transform = "translateY(-2px)";
  });

  toggleButton.addEventListener("mouseleave", () => {
    toggleButton.style.background = "rgba(255, 255, 255, 0.1)";
    toggleButton.style.transform = "translateY(0)";
  });

  let controlsVisible = false;
  function toggleControlPanel() {
    controlsVisible = !controlsVisible;
    controlPanel.style.display = controlsVisible ? "block" : "none";
    toggleButton.style.background = controlsVisible
      ? "rgba(74, 158, 255, 0.3)"
      : "rgba(255, 255, 255, 0.1)";
    toggleButton.style.borderColor = controlsVisible
      ? "rgba(74, 158, 255, 0.5)"
      : "rgba(255, 255, 255, 0.2)";
  }

  toggleButton.addEventListener("click", toggleControlPanel);

  // Keyboard shortcut (O key)
  window.addEventListener("keydown", (event) => {
    if (event.key === "o" || event.key === "O") {
      toggleControlPanel();
    }
  });

  document.body.appendChild(toggleButton);
}

// Update camera position based on scroll
function updateCameraPosition() {
  // Only run scroll-based animation when controls are disabled
  if (!controlsEnabled) {
    // Smooth scroll progress
    scrollProgress += (targetScrollProgress - scrollProgress) * 0.05;

    // Find current and next sections
    let currentSection = 0;
    let nextSection = 1;

    for (let i = 0; i < SCROLL_SECTIONS.length - 1; i++) {
      if (
        scrollProgress >= SCROLL_SECTIONS[i].progress &&
        scrollProgress <= SCROLL_SECTIONS[i + 1].progress
      ) {
        currentSection = i;
        nextSection = i + 1;
        break;
      }
    }

    if (
      scrollProgress >= SCROLL_SECTIONS[SCROLL_SECTIONS.length - 1].progress
    ) {
      currentSection = SCROLL_SECTIONS.length - 2;
      nextSection = SCROLL_SECTIONS.length - 1;
    }

    // Calculate interpolation factor
    const sectionStart = SCROLL_SECTIONS[currentSection].progress;
    const sectionEnd = SCROLL_SECTIONS[nextSection].progress;
    const sectionProgress =
      sectionEnd > sectionStart
        ? (scrollProgress - sectionStart) / (sectionEnd - sectionStart)
        : 0;
    const t = easeInOutQuad(Math.min(Math.max(sectionProgress, 0), 1));

    // Interpolate camera position
    camera.position.x = lerp(
      SCROLL_SECTIONS[currentSection].camera.x,
      SCROLL_SECTIONS[nextSection].camera.x,
      t
    );
    camera.position.y = lerp(
      SCROLL_SECTIONS[currentSection].camera.y,
      SCROLL_SECTIONS[nextSection].camera.y,
      t
    );
    camera.position.z = lerp(
      SCROLL_SECTIONS[currentSection].camera.z,
      SCROLL_SECTIONS[nextSection].camera.z,
      t
    );

    // Interpolate look-at target
    const targetX = lerp(
      SCROLL_SECTIONS[currentSection].target.x,
      SCROLL_SECTIONS[nextSection].target.x,
      t
    );
    const targetY = lerp(
      SCROLL_SECTIONS[currentSection].target.y,
      SCROLL_SECTIONS[nextSection].target.y,
      t
    );
    const targetZ = lerp(
      SCROLL_SECTIONS[currentSection].target.z,
      SCROLL_SECTIONS[nextSection].target.z,
      t
    );

    // Store current lookAt target for OrbitControls sync
    currentLookAtTarget.set(targetX, targetY, targetZ);
    camera.lookAt(currentLookAtTarget);

    // Rotate ship
    if (shipModel) {
      shipModel.rotation.y = lerp(
        SCROLL_SECTIONS[currentSection].shipRotation.y,
        SCROLL_SECTIONS[nextSection].shipRotation.y,
        t
      );
    }
  }

  // Ship floating animation synchronized with ocean waves (always active)
  if (shipModel) {
    // Get ship's current position
    const shipX = shipModel.position.x;
    const shipZ = shipModel.position.z;

    // Calculate ocean wave height at ship's position (without noise for smoother motion)
    const oceanWaveHeight = calculateOceanWaveHeight(
      shipX,
      shipZ,
      currentTime || Date.now() * 0.001,
      false // Disable noise for smoother ship motion
    );

    // Set ship Y position to float on ocean waves
    // Base height is 0 (ocean level at -1, adjusted) + wave height
    shipModel.position.y = oceanWaveHeight;

    // Add subtle rocking motion based on wave derivatives for realistic tilting
    const tiltAmplitude =
      OCEAN_CONFIG.shipTiltAmplitude * OCEAN_CONFIG.intensityMultiplier;
    const time = currentTime || Date.now() * 0.001;

    // Calculate slight derivatives for tilting (simulating wave slope)
    const tiltX = Math.sin(shipX * 0.5 + time * 0.5) * tiltAmplitude;
    const tiltZ = Math.cos(shipZ * 0.5 + time * 0.5) * tiltAmplitude;

    shipModel.rotation.x = tiltX;
    shipModel.rotation.z = tiltZ;
  }
}

// Update camera info display
function updateCameraInfo() {
  if (controlsEnabled) {
    const infoPanel = document.getElementById("camera-info");
    if (infoPanel) {
      const pos = camera.position;
      const target = controls.target;

      // Check if inputs already exist, only update values
      const existingInputX = document.getElementById("target-input-x");
      if (existingInputX) {
        // Just update the camera position display (not target inputs)
        const cameraPosDisplay = document.getElementById("camera-pos-display");
        if (cameraPosDisplay) {
          cameraPosDisplay.innerHTML = `
            <span style="color: #ff6b6b;">x:</span> ${pos.x.toFixed(2)}<br>
            <span style="color: #4ecdc4;">y:</span> ${pos.y.toFixed(2)}<br>
            <span style="color: #95e1d3;">z:</span> ${pos.z.toFixed(2)}
          `;
        }
        return; // Don't recreate the entire panel
      }

      // Initial creation of panel with input fields
      infoPanel.innerHTML = `
        <div style="margin-bottom: 8px; font-weight: bold; color: #64c8ff;">📷 Camera Position:</div>
        <div id="camera-pos-display" style="line-height: 1.6;">
          <span style="color: #ff6b6b;">x:</span> ${pos.x.toFixed(2)}<br>
          <span style="color: #4ecdc4;">y:</span> ${pos.y.toFixed(2)}<br>
          <span style="color: #95e1d3;">z:</span> ${pos.z.toFixed(2)}
        </div>
        <div style="margin-top: 12px; margin-bottom: 8px; font-weight: bold; color: #64c8ff;">🎯 Look At Target:</div>
        <div style="line-height: 1.6;">
          <div style="margin-bottom: 8px;">
            <label style="color: #ff6b6b; display: inline-block; width: 20px;">x:</label>
            <input type="number" id="target-input-x" value="${target.x.toFixed(
              2
            )}" step="0.1" 
              style="width: 80px; padding: 4px; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.3); 
              border-radius: 4px; color: white; font-family: 'Courier New', monospace; font-size: 12px;">
          </div>
          <div style="margin-bottom: 8px;">
            <label style="color: #4ecdc4; display: inline-block; width: 20px;">y:</label>
            <input type="number" id="target-input-y" value="${target.y.toFixed(
              2
            )}" step="0.1"
              style="width: 80px; padding: 4px; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.3); 
              border-radius: 4px; color: white; font-family: 'Courier New', monospace; font-size: 12px;">
          </div>
          <div style="margin-bottom: 8px;">
            <label style="color: #95e1d3; display: inline-block; width: 20px;">z:</label>
            <input type="number" id="target-input-z" value="${target.z.toFixed(
              2
            )}" step="0.1"
              style="width: 80px; padding: 4px; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.3); 
              border-radius: 4px; color: white; font-family: 'Courier New', monospace; font-size: 12px;">
          </div>
        </div>
        <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid rgba(255,255,255,0.2); font-size: 11px; color: #aaa;">
          🖱️ Left click: Rotate<br>
          🖱️ Right click: Pan<br>
          🖱️ Scroll: Zoom<br>
          ⌨️ Press C to toggle
        </div>
      `;

      // Add event listeners to update target when inputs change
      const inputX = document.getElementById("target-input-x");
      const inputY = document.getElementById("target-input-y");
      const inputZ = document.getElementById("target-input-z");

      inputX.addEventListener("input", (e) => {
        controls.target.x = parseFloat(e.target.value) || 0;
        controls.update();
      });

      inputY.addEventListener("input", (e) => {
        controls.target.y = parseFloat(e.target.value) || 0;
        controls.update();
      });

      inputZ.addEventListener("input", (e) => {
        controls.target.z = parseFloat(e.target.value) || 0;
        controls.update();
      });
    }
  }
}

// Handle window resize
function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
}

// Animation loop
function animate() {
  requestAnimationFrame(animate);

  // Update controls if enabled
  if (controlsEnabled && controls) {
    controls.update();
    updateCameraInfo();
  }

  updateCameraPosition();
  animateOcean(); // Animate ocean particles

  renderer.render(scene, camera);
}

// Initialize when DOM is loaded
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
