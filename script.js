// Einfacher Insel-Generator mit Three.js (WebGL) – Insel schwimmt halb im Wasser
// Kein Import nötig, THREE ist global geladen

let scene, camera, renderer, islandMesh, seaMesh, controls, isRotating = true, markerMesh;

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

    // Maus-Steuerung für Kamera (OrbitControls) – separat laden
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/OrbitControls.js';
    script.onload = function() {
        controls = new THREE.OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        console.log("DEBUG: OrbitControls hinzugefügt – Maus zum Drehen/Zoomen verwenden.");
    };
    document.head.appendChild(script);

    console.log("DEBUG: Szene, Kamera und Renderer erstellt.");

    // Beleuchtung hinzufügen
    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(1, 1, 1).normalize();
    scene.add(light);

    console.log("DEBUG: Beleuchtung hinzugefügt.");

    // Button-Events hinzufügen
    document.getElementById('generateBtn').addEventListener('click', generateIsland);
    document.getElementById('playBtn').addEventListener('click', enterFullscreen);
    console.log("DEBUG: Button-Events gebunden.");

    // ESC für Vollbild-Exit
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape') {
            exitFullscreen();
        }
    });

    // Vollbild-Änderungen überwachen
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange); // Safari
    document.addEventListener('msfullscreenchange', handleFullscreenChange); // IE/Edge

    // Meer-Ebene hinzufügen (durchsichtig)
    const seaGeometry = new THREE.PlaneGeometry(50, 50);
    const seaMaterial = new THREE.MeshLambertMaterial({ 
        color: 0x0077be,  // Dunkelblau für Meer
        transparent: true,  // Durchsichtig machen
        opacity: 0.6       // Leichte Durchsichtigkeit
    });
    seaMesh = new THREE.Mesh(seaGeometry, seaMaterial);
    seaMesh.rotation.x = -Math.PI / 2; // Flach legen
    scene.add(seaMesh);
    console.log("DEBUG: Durchsichtige Meer-Ebene hinzugefügt.");
}

function generateIsland() {
    console.log("DEBUG: generateIsland() aufgerufen – Insel generieren, die halb im Wasser schwimmt.");

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
        // Normaler 3D-Würfel
        geometry = new THREE.BoxGeometry(1, 1, 1);
        console.log("DEBUG: Würfel-Geometrie erstellt.");
    } else {
        // Dreidimensionales Kästchen/Rechteck (2x1x1)
        geometry = new THREE.BoxGeometry(2, 1, 1);
        console.log("DEBUG: Kästchen-Geometrie erstellt.");
    }

    // Material und Mesh
    const material = new THREE.MeshLambertMaterial({ color: 0x228b22 }); // Grün für Insel
    islandMesh = new THREE.Mesh(geometry, material);
    islandMesh.position.y = 0; // Mitte auf Wasseroberfläche – untere Hälfte unter Wasser
    scene.add(islandMesh);

    console.log("DEBUG: Insel-Mesh zur Szene hinzugefügt (halb im Wasser).");

    // Rendern
    renderer.render(scene, camera);
    console.log("DEBUG: Szene gerendert.");
}

function enterFullscreen() {
    console.log("DEBUG: enterFullscreen() aufgerufen – Vollbild aktivieren.");
    const container = document.getElementById('container');
    if (container.requestFullscreen) {
        container.requestFullscreen();
    } else if (container.webkitRequestFullscreen) { // Safari
        container.webkitRequestFullscreen();
    } else if (container.msRequestFullscreen) { // IE/Edge
        container.msRequestFullscreen();
    }
    console.log("DEBUG: Vollbild angefordert.");
}

function exitFullscreen() {
    console.log("DEBUG: exitFullscreen() aufgerufen – Vollbild beenden.");
    if (document.exitFullscreen) {
        document.exitFullscreen();
    } else if (document.webkitExitFullscreen) { // Safari
        document.webkitExitFullscreen();
    } else if (document.msExitFullscreen) { // IE/Edge
        document.msExitFullscreen();
    }
    console.log("DEBUG: Vollbild beendet.");
}

function handleFullscreenChange() {
    console.log("DEBUG: handleFullscreenChange() aufgerufen – Größe, Rotation und Marker anpassen.");
    if (document.fullscreenElement || document.webkitFullscreenElement || document.msFullscreenElement) {
        // Im Vollbild: Rotation stoppen und Marker hinzufügen
        isRotating = false;
        if (islandMesh && !markerMesh) {
            // Kleines oranges Quadrat als Marker
            const markerGeometry = new THREE.BoxGeometry(0.1, 0.1, 0.05); // Sehr klein
            const markerMaterial = new THREE.MeshLambertMaterial({ color: 0xffa500 }); // Orange
            markerMesh = new THREE.Mesh(markerGeometry, markerMaterial);
            markerMesh.position.set(0, 0.6, 0); // Oben auf der Insel-Mitte
            scene.add(markerMesh);
            console.log("DEBUG: Oranges Marker-Quadrat hinzugefügt.");
        }
        renderer.setSize(window.innerWidth, window.innerHeight);
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        console.log(`DEBUG: Vollbild-Größe gesetzt: ${window.innerWidth}x${window.innerHeight}.`);
    } else {
        // Vollbild beendet: Rotation starten und Marker entfernen
        isRotating = true;
        if (markerMesh) {
            scene.remove(markerMesh);
            markerMesh.geometry.dispose();
            markerMesh.material.dispose();
            markerMesh = null;
            console.log("DEBUG: Oranges Marker-Quadrat entfernt.");
        }
        renderer.setSize(800, 600);
        camera.aspect = 800 / 600;
        camera.updateProjectionMatrix();
        console.log("DEBUG: Normale Größe wiederhergestellt: 800x600.");
    }
}

function animate() {
    requestAnimationFrame(animate);
    if (controls) controls.update(); // Für Maus-Steuerung
    if (islandMesh && isRotating) islandMesh.rotation.y += 0.01; // Drehung nur wenn nicht im Vollbild
    renderer.render(scene, camera);
}

// Initialisierung starten
init();
animate();
console.log("DEBUG: Script geladen und init/animate gestartet.");
