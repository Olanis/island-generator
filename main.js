import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import PerlinNoise from './perlin.js';

class IslandGenerator {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.island = null;
        this.noiseGenerator = null;
        
        this.init();
        this.animate();
        this.setupEventListeners();
        this.generateIsland();
    }

    init() {
        // Create scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x87CEEB); // Sky blue

        // Create camera
        this.camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        this.camera.position.set(50, 50, 50);

        // Create renderer
        const canvas = document.getElementById('canvas');
        this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;

        // Add orbit controls
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.minDistance = 5; // Allow much closer zoom
        this.controls.maxDistance = 400; // Allow zoom out to see large islands
        this.controls.maxPolarAngle = Math.PI / 2; // Don't let camera go below ground

        // Add lights
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(50, 50, 25);
        directionalLight.castShadow = true;
        this.scene.add(directionalLight);

        // Add water plane (larger to accommodate bigger islands)
        const waterGeometry = new THREE.PlaneGeometry(600, 600);
        const waterMaterial = new THREE.MeshPhongMaterial({
            color: 0x1E88E5, // More vibrant blue (Wind Waker style)
            transparent: true,
            opacity: 0.7,
            shininess: 100
        });
        const water = new THREE.Mesh(waterGeometry, waterMaterial);
        water.rotation.x = -Math.PI / 2;
        water.position.y = 0;
        water.receiveShadow = true;
        this.scene.add(water);

        // Handle window resize
        window.addEventListener('resize', () => this.onWindowResize(), false);
    }

    generateIsland() {
        // Remove old islands if exist
        if (this.island) {
            if (Array.isArray(this.island)) {
                this.island.forEach(mesh => {
                    this.scene.remove(mesh);
                    mesh.geometry.dispose();
                    mesh.material.dispose();
                });
            } else {
                this.scene.remove(this.island);
                this.island.geometry.dispose();
                this.island.material.dispose();
            }
        }

        // Create new noise generator with random seed
        this.noiseGenerator = new PerlinNoise(Math.random() * 10000);

        // Random island size: small (30-60), medium (60-120), or large (120-250)
        const sizeType = Math.random();
        let size;
        if (sizeType < 0.3) {
            size = 30 + Math.random() * 30; // Small islands
        } else if (sizeType < 0.7) {
            size = 60 + Math.random() * 60; // Medium islands
        } else {
            size = 120 + Math.random() * 130; // Large islands
        }

        // Higher resolution for more detail and smoother terrain
        const resolution = Math.floor(size * 2); // 2 vertices per unit
        const maxHeight = size * 0.15; // Height scales with size, but relatively flatter

        // Create islands array
        this.island = [];

        // Generate main island
        const mainIsland = this.createSingleIsland(size, resolution, maxHeight, 0, 0);
        this.island.push(mainIsland);

        // Occasionally add 1-3 smaller satellite islands
        const satelliteCount = Math.random() < 0.4 ? Math.floor(Math.random() * 3) + 1 : 0;
        for (let i = 0; i < satelliteCount; i++) {
            const satelliteSize = size * (0.15 + Math.random() * 0.25); // 15-40% of main island
            const satelliteResolution = Math.floor(satelliteSize * 2);
            const satelliteHeight = satelliteSize * 0.12;
            
            // Position satellites around main island
            const angle = (Math.PI * 2 / satelliteCount) * i + Math.random() * 0.5;
            const distance = size * 0.6 + Math.random() * size * 0.3;
            const offsetX = Math.cos(angle) * distance;
            const offsetZ = Math.sin(angle) * distance;
            
            const satellite = this.createSingleIsland(satelliteSize, satelliteResolution, satelliteHeight, offsetX, offsetZ);
            this.island.push(satellite);
        }
    }

    createSingleIsland(size, resolution, maxHeight, offsetX, offsetZ) {
        // Create geometry
        const geometry = new THREE.PlaneGeometry(size, size, resolution - 1, resolution - 1);
        geometry.rotateX(-Math.PI / 2);

        // Get position attribute
        const positions = geometry.attributes.position;

        // Generate heightmap using Perlin noise
        for (let i = 0; i < positions.count; i++) {
            const x = positions.getX(i);
            const z = positions.getZ(i);

            // Normalize coordinates
            const nx = x / size;
            const nz = z / size;

            // Calculate distance from center (for island shape)
            const distanceFromCenter = Math.sqrt(nx * nx + nz * nz);
            
            // Multiple octaves of noise for detail, but less aggressive
            let height = 0;
            let amplitude = 1;
            let frequency = 0.8; // Lower frequency for smoother, less rugged terrain
            
            for (let octave = 0; octave < 3; octave++) { // Reduced octaves for flatter terrain
                const sampleX = nx * frequency * 3;
                const sampleZ = nz * frequency * 3;
                height += this.noiseGenerator.noise2D(sampleX, sampleZ) * amplitude;
                amplitude *= 0.6; // Less dramatic height variation
                frequency *= 1.8;
            }

            // Apply island mask with smoother falloff for more playable edges
            const islandMask = Math.max(0, 1 - Math.pow(distanceFromCenter * 1.3, 2.5));
            height *= islandMask;

            // Add some flatter plateaus for playable areas (Wind Waker style)
            const plateau = Math.abs(height) < 0.3 ? 0.25 : 1.0;
            height *= plateau;

            // Scale height - much flatter than before
            height *= maxHeight;

            // Create beaches - gradual slope near water
            if (height < maxHeight * 0.15) {
                height *= 0.5; // Flatten beaches
            }

            // Clamp below water level
            height = Math.max(height, 0);

            positions.setY(i, height);
        }

        // Update normals for proper lighting
        geometry.computeVertexNormals();

        // Create material with vertex colors based on height
        const colors = new Float32Array(positions.count * 3);
        for (let i = 0; i < positions.count; i++) {
            const height = positions.getY(i);
            const heightRatio = height / maxHeight;
            let color;

            // More vibrant, game-like colors (Wind Waker inspired)
            if (heightRatio < 0.15) {
                // Sand/Beach
                color = new THREE.Color(0xE8D4A0);
            } else if (heightRatio < 0.5) {
                // Grass - vibrant green
                color = new THREE.Color(0x4CAF50);
            } else if (heightRatio < 0.75) {
                // Dark grass
                color = new THREE.Color(0x388E3C);
            } else {
                // Rocky peaks
                color = new THREE.Color(0x8D6E63);
            }

            colors[i * 3] = color.r;
            colors[i * 3 + 1] = color.g;
            colors[i * 3 + 2] = color.b;
        }

        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        const material = new THREE.MeshPhongMaterial({
            vertexColors: true,
            flatShading: false,
            shininess: 30
        });

        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.x = offsetX;
        mesh.position.z = offsetZ;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        this.scene.add(mesh);

        return mesh;
    }

    setupEventListeners() {
        const generateButton = document.getElementById('generateButton');
        generateButton.addEventListener('click', () => this.generateIsland());
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        this.controls.update();
        this.renderer.render(this.scene, this.camera);
    }
}

// Initialize the application
new IslandGenerator();
