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
        this.camera.position.set(30, 30, 30);

        // Create renderer
        const canvas = document.getElementById('canvas');
        this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;

        // Add orbit controls
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.minDistance = 10;
        this.controls.maxDistance = 100;

        // Add lights
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(50, 50, 25);
        directionalLight.castShadow = true;
        this.scene.add(directionalLight);

        // Add water plane
        const waterGeometry = new THREE.PlaneGeometry(100, 100);
        const waterMaterial = new THREE.MeshPhongMaterial({
            color: 0x006994,
            transparent: true,
            opacity: 0.6,
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
        // Remove old island if exists
        if (this.island) {
            this.scene.remove(this.island);
            this.island.geometry.dispose();
            this.island.material.dispose();
        }

        // Create new noise generator with random seed
        this.noiseGenerator = new PerlinNoise(Math.random() * 10000);

        // Island parameters
        const size = 50;
        const resolution = 64;
        const maxHeight = 15;

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
            
            // Multiple octaves of noise for detail
            let height = 0;
            let amplitude = 1;
            let frequency = 1;
            
            for (let octave = 0; octave < 4; octave++) {
                const sampleX = nx * frequency * 4;
                const sampleZ = nz * frequency * 4;
                height += this.noiseGenerator.noise2D(sampleX, sampleZ) * amplitude;
                amplitude *= 0.5;
                frequency *= 2;
            }

            // Apply island mask (radial gradient)
            const islandMask = Math.max(0, 1 - distanceFromCenter * 1.5);
            height *= islandMask;

            // Scale height
            height *= maxHeight;

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
            let color;

            if (height < 1) {
                // Sand
                color = new THREE.Color(0xC2B280);
            } else if (height < 5) {
                // Grass
                color = new THREE.Color(0x3A9B3A);
            } else if (height < 10) {
                // Dark grass/rock
                color = new THREE.Color(0x2D7A2D);
            } else {
                // Mountain peak/rock
                color = new THREE.Color(0x8B7355);
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

        this.island = new THREE.Mesh(geometry, material);
        this.island.castShadow = true;
        this.island.receiveShadow = true;
        this.scene.add(this.island);
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
