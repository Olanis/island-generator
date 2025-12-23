// Insel-Generator mit Three.js (WebGL) – Jetzt mit richtiger 3D-Heightmap
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.158.0/build/three.module.js';

let scene, camera, renderer, islandMesh, seaMesh, controls;

function init() {
    console.log("DEBUG: init() aufgerufen – Three.js Setup starten.");

    // Szene, Kamera, Renderer erstellen
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87ceeb); // Himmelblau für Meer-Hintergrund

    camera = new THREE.PerspectiveCamera(75, 800 / 600, 0.1, 1000);
    camera.position.set(5, 5, 5);
    camera.lookAt(0, 0, 0);

    renderer = new THREE.WebGLRenderer();
    renderer.setSize(800, 600);
    document.getElementById('container').appendChild(renderer.domElement);

    // Maus-Steuerung für Kamera (OrbitControls)
    import('https://cdn.jsdelivr.net/npm/three@0.158.0/examples/jsm/controls/OrbitControls.js').then(({ OrbitControls }) => {
        controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        console.log("DEBUG: OrbitControls hinzugefügt – Maus zum Drehen/Zoomen verwenden.");
    });

    console.log("DEBUG: Szene, Kamera und Renderer erstellt.");

    // Beleuchtung hinzufügen
    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(1, 1, 1).normalize();
    scene.add(light);

    console.log("DEBUG: Beleuchtung hinzugefügt.");

    // Button-Event hinzufügen
    document.getElementById('generateBtn').addEventListener('click', generateIsland);
    console.log("DEBUG: Button-Event gebunden.");

    // Meer-Ebene hinzufügen (bleibt statisch)
    const seaGeometry = new THREE.PlaneGeometry(50, 50);
    const seaMaterial = new THREE.MeshLambertMaterial({ color: 0x0077be }); // Dunkelblau für Meer
    seaMesh = new THREE.Mesh(seaGeometry, seaMaterial);
    seaMesh.rotation.x = -Math.PI / 2; // Flach legen
    scene.add(seaMesh);
    console.log("DEBUG: Meer-Ebene hinzugefügt.");

    // Erste Insel generieren
    generateIsland();
}

function generateIsland() {
    console.log("DEBUG: generateIsland() aufgerufen – 3D-Insel generieren.");

    // Alte Insel entfernen, falls vorhanden
    if (islandMesh) {
        scene.remove(islandMesh);
        islandMesh.geometry.dispose();
        islandMesh.material.dispose();
        console.log("DEBUG: Alte Insel entfernt.");
    }

    const shape = Math.random() > 0.5 ? 'quadrat' : 'rechteck';
    console.log(`DEBUG: Ausgewählte Form: ${shape}`);

    let width, height, widthSegments, heightSegments;
    if (shape === 'quadrat') {
        width = 10; // Größe der Insel
        height = 10;
        widthSegments = 10; // Grid-Auflösung für Heightmap
        heightSegments = 10;
    } else {
        width = 20;
        height = 10;
        widthSegments = 20;
        heightSegments = 10;
    }

    // PlaneGeometry mit Subdivisionen erstellen
    const geometry = new THREE.PlaneGeometry(width, height, widthSegments, heightSegments);
    geometry.rotateX(-Math.PI / 2); // Aufrecht stellen

    // Vertices modifizieren für Heightmap (zufällige Höhen)
    const positions = geometry.attributes.position.array;
    for (let i = 0; i < positions.length; i += 3) {
        const x = positions[i];
        const y = positions[i + 1];
        // Zufällige Höhe: Sinus-Welle + Rauschen für Hügel-artig
        const heightValue = Math.sin(x * 0.5) * Math.cos(y * 0.5) * 2 + Math.random() * 1.5;
        positions[i + 2] = Math.max(heightValue, 0.1); // Mindesthöhe 0.1, um nicht flach zu sein
    }
    geometry.attributes.position.needsUpdate = true;
    geometry.computeVertexNormals(); // Normals neu berechnen für richtiges Lighting

    console.log("DEBUG: Heightmap-Geometrie erstellt mit zufälligen Höhen.");

    // Material und Mesh
    const material = new THREE.MeshLambertMaterial({ color: 0x228b22 }); // Grün für Insel
    islandMesh = new THREE.Mesh(geometry, material);
    scene.add(islandMesh);

    console.log("DEBUG: 3D-Insel-Mesh zur Szene hinzugefügt.");

    // Rendern
    renderer.render(scene, camera);
    console.log("DEBUG: Szene gerendert.");
}

function animate() {
    requestAnimationFrame(animate);
    if (controls) controls.update(); // Für Maus-Steuerung
    renderer.render(scene, camera);
}

// Initialisierung starten
init();
animate();
console.log("DEBUG: Script geladen und init/animate gestartet.");
