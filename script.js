// Insel-Generator mit Three.js (WebGL)
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.158.0/build/three.module.js';

let scene, camera, renderer, islandMesh;

function init() {
    console.log("DEBUG: init() aufgerufen – Three.js Setup starten.");

    // Szene, Kamera, Renderer erstellen
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87ceeb); // Himmelblau für Meer-Hintergrund

    camera = new THREE.PerspectiveCamera(75, 800 / 600, 0.1, 1000);
    camera.position.set(3, 3, 3);
    camera.lookAt(0, 0, 0);

    renderer = new THREE.WebGLRenderer();
    renderer.setSize(800, 600);
    document.getElementById('container').appendChild(renderer.domElement);

    console.log("DEBUG: Szene, Kamera und Renderer erstellt.");

    // Beleuchtung hinzufügen
    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(1, 1, 1).normalize();
    scene.add(light);

    console.log("DEBUG: Beleuchtung hinzugefügt.");

    // Button-Event hinzufügen
    document.getElementById('generateBtn').addEventListener('click', generateIsland);
    console.log("DEBUG: Button-Event gebunden.");

    // Erste Insel generieren
    generateIsland();
}

function generateIsland() {
    console.log("DEBUG: generateIsland() aufgerufen – Insel generieren.");

    // Alte Insel entfernen, falls vorhanden
    if (islandMesh) {
        scene.remove(islandMesh);
        islandMesh.geometry.dispose();
        islandMesh.material.dispose();
        console.log("DEBUG: Alte Insel entfernt.");
    }

    const shape = Math.random() > 0.5 ? 'quadrat' : 'rechteck';
    console.log(`DEBUG: Ausgewählte Form: ${shape}`);

    let geometry;
    if (shape === 'quadrat') {
        // Quadrat: 1x1, mit zufälliger Höhe
        const positions = new Float32Array([
            0, 0, Math.random() * 0.5 + 0.1,  // Ecke 1
            1, 0, Math.random() * 0.5 + 0.1,  // Ecke 2
            1, 1, Math.random() * 0.5 + 0.1,  // Ecke 3
            0, 1, Math.random() * 0.5 + 0.1   // Ecke 4
        ]);
        const indices = [0, 1, 2, 0, 2, 3]; // Zwei Dreiecke
        geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setIndex(indices);
    } else {
        // Rechteck: 2x1, mit zufälliger Höhe
        const positions = new Float32Array([
            0, 0, Math.random() * 0.5 + 0.1,
            2, 0, Math.random() * 0.5 + 0.1,
            2, 1, Math.random() * 0.5 + 0.1,
            0, 1, Math.random() * 0.5 + 0.1
        ]);
        const indices = [0, 1, 2, 0, 2, 3];
        geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setIndex(indices);
    }

    console.log("DEBUG: Geometrie erstellt.");

    // Material und Mesh
    const material = new THREE.MeshLambertMaterial({ color: 0x228b22 }); // Grün für Insel
    islandMesh = new THREE.Mesh(geometry, material);
    scene.add(islandMesh);

    console.log("DEBUG: Insel-Mesh zur Szene hinzugefügt.");

    // Rendern
    renderer.render(scene, camera);
    console.log("DEBUG: Szene gerendert.");
}

function animate() {
    requestAnimationFrame(animate);
    // Insel leicht drehen für bessere Sicht
    if (islandMesh) {
        islandMesh.rotation.y += 0.01;
    }
    renderer.render(scene, camera);
}

// Initialisierung starten
init();
animate();
console.log("DEBUG: Script geladen und init/animate gestartet.");
