import * as THREE from 'https://cdn.skypack.dev/three@0.154.0';
import { WebGPURenderer } from 'https://cdn.skypack.dev/three@0.154.0/examples/jsm/renderers/webgpu/WebGPURenderer.js';

const container = document.getElementById('container');
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, 800 / 600, 0.1, 1000);
camera.position.set(2, 2, 2);
camera.lookAt(0, 0, 0);

let renderer;

async function initRenderer() {
    if ('gpu' in navigator) {
        try {
            renderer = new WebGPURenderer({ antialias: true });
            await renderer.init();
            document.getElementById('rendererInfo').textContent = 'Renderer: WebGPU';
        } catch (error) {
            console.warn('WebGPU init failed:', error);
            renderer = new THREE.WebGLRenderer({ antialias: true });
            document.getElementById('rendererInfo').textContent = 'Renderer: WebGL';
        }
    } else {
        renderer = new THREE.WebGLRenderer({ antialias: true });
        document.getElementById('rendererInfo').textContent = 'Renderer: WebGL';
    }
    renderer.setSize(800, 600);
    container.appendChild(renderer.domElement);
}

await initRenderer();

function generateIsland() {
    // Entferne vorherige Insel
    scene.children.forEach(child => {
        if (child.type === 'Mesh') {
            scene.remove(child);
            child.geometry.dispose();
            child.material.dispose();
        }
    });

    // Zufällige Form wählen
    const shape = Math.random() < 0.5 ? 'quadrat' : 'rechteck';
    let vertices;
    if (shape === 'quadrat') {
        vertices = [
            0, 0, 0,
            1, 0, 0,
            1, 1, 0,
            0, 1, 0
        ];
    } else {
        vertices = [
            0, 0, 0,
            2, 0, 0,
            2, 1, 0,
            0, 1, 0
        ];
    }
    const indices = [0, 1, 2, 0, 2, 3];

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setIndex(indices);
    const material = new THREE.MeshBasicMaterial({ color: 0x00ff00, side: THREE.DoubleSide }); // Grün wie Insel
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    renderer.render(scene, camera);
}

// Button-Event
document.getElementById('generateBtn').addEventListener('click', generateIsland);

// Initiales Rendering
renderer.render(scene, camera);