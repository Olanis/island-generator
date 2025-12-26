// Einfacher Insel-Generator mit Three.js (WebGL) – Insel schwimmt halb im Wasser
// Kein Import nötig, THREE ist global geladen

let scene, camera, renderer, islandMesh, seaMesh, groundMesh, controls, isRotating = true, playerMesh, originalPlayerY, velocityY = 0, gravity = -0.005, jumpStrength = 0.1;
let moveForward = false, moveBackward = false, moveLeft = false, moveRight = false;
const moveSpeed = 0.5; // Geschwindigkeit der Bewegung
let isFullscreen = false, rightMouseDown = false, lastMouseX = 0, cameraRotationY = 0;

function init() {
    console.log("DEBUG: init() aufgerufen – Three.js Setup starten.");

    // Szene, Kamera, Renderer erstellen
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87ceeb); // Himmelblau für Meer-Hintergrund

    camera = new THREE.PerspectiveCamera(75, 800 / 600, 0.1, 1000);
    camera.position.set(250, 250, 250); // Weiter zurück für große Inseln
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
        // Maus-Buttons tauschen: Linke für Pannen/Zoomen, Rechte für Rotieren (aber nur außerhalb Vollbild)
        controls.mouseButtons = {
            LEFT: THREE.MOUSE.PAN,
            RIGHT: THREE.MOUSE.ROTATE
        };
        controls.enabled = true; // Aktiviert außerhalb Vollbild
        console.log("DEBUG: OrbitControls hinzugefügt – Maus zum Drehen/Zoomen verwenden (getauscht).");
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

    // Tasten-Events für Player-Bewegung und Springen
    document.addEventListener('keydown', function(event) {
        const key = event.key.toLowerCase();
        if (key === 'w') moveForward = true;
        else if (key === 's') moveBackward = true;
        else if (key === 'a') moveLeft = true;
        else if (key === 'd') moveRight = true;
        else if (key === ' ') jumpPlayer(); // Leertaste für Springen
        else if (key === 'escape') exitFullscreen();
    });

    document.addEventListener('keyup', function(event) {
        const key = event.key.toLowerCase();
        if (key === 'w') moveForward = false;
        else if (key === 's') moveBackward = false;
        else if (key === 'a') moveLeft = false;
        else if (key === 'd') moveRight = false;
    });

    // Maus-Events für manuelle Rotation im Vollbild
    document.addEventListener('mousedown', function(event) {
        if (event.button === 2 && isFullscreen) { // Rechtsklick im Vollbild
            rightMouseDown = true;
            lastMouseX = event.clientX;
        }
    });
    document.addEventListener('mouseup', function(event) {
        if (event.button === 2) rightMouseDown = false;
    });
    document.addEventListener('mousemove', function(event) {
        if (rightMouseDown && isFullscreen) {
            const deltaX = event.clientX - lastMouseX;
            cameraRotationY -= deltaX * 0.01; // Rotation-Geschwindigkeit
            lastMouseX = event.clientX;
        }
    });
    document.addEventListener('contextmenu', function(event) {
        event.preventDefault(); // Rechtsklick-Menü verhindern
    });

    // Vollbild-Änderungen überwachen
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange); // Safari
    document.addEventListener('msfullscreenchange', handleFullscreenChange); // IE/Edge

    // Meer-Ebene hinzufügen (größer für große Inseln)
    const seaGeometry = new THREE.PlaneGeometry(5000, 5000);
    const seaMaterial = new THREE.MeshLambertMaterial({ 
        color: 0x0077be,  // Dunkelblau für Meer
        transparent: true,  // Durchsichtig machen
        opacity: 0.6       // Leichte Durchsichtigkeit
    });
    seaMesh = new THREE.Mesh(seaGeometry, seaMaterial);
    seaMesh.rotation.x = -Math.PI / 2; // Flach legen
    scene.add(seaMesh);
    console.log("DEBUG: Durchsichtige Meer-Ebene hinzugefügt.");

    // Meeresgrund hinzufügen (bei y=-50, ca. Inselhöhe tief)
    const groundGeometry = new THREE.PlaneGeometry(5000, 5000);
    const groundMaterial = new THREE.MeshLambertMaterial({ color: 0xc2b280 }); // Sandfarbe für Boden
    groundMesh = new THREE.Mesh(groundGeometry, groundMaterial);
    groundMesh.rotation.x = -Math.PI / 2; // Flach legen
    groundMesh.position.y = -50; // Tief wie Insel dick
    scene.add(groundMesh);
    console.log("DEBUG: Meeresgrund hinzugefügt bei y=-50.");

    // Automatisch erste Insel generieren beim Start
    generateIsland();
    console.log("DEBUG: Erste Insel automatisch generiert.");
}

function generateIsland() {
    console.log("DEBUG: generateIsland() aufgerufen – Große Insel generieren, die halb im Wasser schwimmt.");

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
        // Großer 3D-Würfel (50x50x50)
        geometry = new THREE.BoxGeometry(50, 50, 50);
        console.log("DEBUG: Großer Würfel-Geometrie erstellt.");
    } else {
        // Großes dreidimensionales Kästchen/Rechteck (100x50x50)
        geometry = new THREE.BoxGeometry(100, 50, 50);
        console.log("DEBUG: Großes Kästchen-Geometrie erstellt.");
    }

    // Material und Mesh
    const material = new THREE.MeshLambertMaterial({ color: 0x228b22 }); // Grün für Insel
    islandMesh = new THREE.Mesh(geometry, material);
    islandMesh.position.y = 0; // Mitte auf Wasseroberfläche – untere Hälfte unter Wasser
    scene.add(islandMesh);

    console.log("DEBUG: Große Insel-Mesh zur Szene hinzugefügt (halb im Wasser).");

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
    console.log("DEBUG: handleFullscreenChange() aufgerufen – Größe, Rotation und Player anpassen.");
    if (document.fullscreenElement || document.webkitFullscreenElement || document.msFullscreenElement) {
        isFullscreen = true;
        // Im Vollbild: Rotation stoppen, Player hinzufügen, Kamera hinter Player, Controls deaktivieren
        isRotating = false;
        if (islandMesh && !playerMesh) {
            // Sichtbarer orangener Player (größer gemacht)
            const playerGeometry = new THREE.BoxGeometry(1, 1, 0.5); // Größer für Sichtbarkeit
            const playerMaterial = new THREE.MeshLambertMaterial({ color: 0xffa500 }); // Orange
            playerMesh = new THREE.Mesh(playerGeometry, playerMaterial);
            playerMesh.position.set(0, 25.5, 0); // Genau auf der Insel-Oberfläche (y=25, +0.5)
            originalPlayerY = 25.5; // Ursprüngliche Höhe speichern
            velocityY = 0; // Geschwindigkeit zurücksetzen
            scene.add(playerMesh);
            console.log("DEBUG: Sichtbarer orangener Player auf Insel-Oberfläche hinzugefügt bei y=" + originalPlayerY);
        }
        if (playerMesh && controls) {
            // Kamera hinter Player setzen und Position bestätigen
            updateCameraPosition();
            playerMesh.position.set(0, 25.5, 0); // Sicherstellen, dass er auf der Insel startet
        }
        if (controls) controls.enabled = false; // OrbitControls deaktivieren im Vollbild
        renderer.setSize(window.innerWidth, window.innerHeight);
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        console.log(`DEBUG: Vollbild-Größe gesetzt: ${window.innerWidth}x${window.innerHeight}.`);
    } else {
        isFullscreen = false;
        // Vollbild beendet: Rotation starten, Player entfernen, alles resetten
        isRotating = true;
        if (playerMesh) {
            scene.remove(playerMesh);
            playerMesh.geometry.dispose();
            playerMesh.material.dispose();
            playerMesh = null;
            console.log("DEBUG: Sichtbarer orangener Player entfernt.");
        }
        if (controls) controls.enabled = true; // OrbitControls wieder aktivieren
        // Vollständiges Reset: Kamera, Rotation, etc.
        camera.position.set(250, 250, 250); // Zurück zur normalen Position
        camera.lookAt(0, 0, 0);
        cameraRotationY = 0; // Reset Kamerarotation
        velocityY = 0; // Reset Geschwindigkeit
        renderer.setSize(800, 600);
        camera.aspect = 800 / 600;
        camera.updateProjectionMatrix();
        console.log("DEBUG: Vollständiges Reset beim Exit aus Vollbild.");
    }
}

function updateCameraPosition() {
    if (playerMesh) {
        // Kamera hinter Player positionieren (schräg oben)
        const offset = new THREE.Vector3(0, 20, 30); // Höhe 20, Distanz 30 hinter
        // Offset drehen basierend auf cameraRotationY
        offset.applyAxisAngle(new THREE.Vector3(0, 1, 0), cameraRotationY);
        camera.position.copy(playerMesh.position).add(offset);
        camera.lookAt(playerMesh.position);
    }
}

function jumpPlayer() {
    if (playerMesh && isFullscreen && playerMesh.position.y <= originalPlayerY + 0.01) {
        console.log("DEBUG: jumpPlayer() aufgerufen – Player springt mit Schwerkraft.");
        velocityY = jumpStrength; // Aufwärtsgeschwindigkeit setzen
    }
}

function animate() {
    requestAnimationFrame(animate);
    if (controls && controls.enabled) controls.update(); // Nur wenn aktiviert
    if (islandMesh && isRotating) islandMesh.rotation.y += 0.01; // Drehung nur wenn nicht im Vollbild

    // Player-Bewegung mit WASD (relativ zur Player-Rotation, invertiert)
    if (playerMesh) {
        let direction = new THREE.Vector3();
        if (moveForward) direction.add(new THREE.Vector3(0, 0, 1)); // W: Vorwärts (invertiert)
        if (moveBackward) direction.add(new THREE.Vector3(0, 0, -1)); // S: Rückwärts (invertiert)
        if (moveLeft) direction.add(new THREE.Vector3(1, 0, 0)); // A: Links (invertiert)
        if (moveRight) direction.add(new THREE.Vector3(-1, 0, 0)); // D: Rechts (invertiert)

        // Richtung drehen basierend auf Player-Rotation
        direction.applyAxisAngle(new THREE.Vector3(0, 1, 0), playerMesh.rotation.y);
        // Position aktualisieren
        playerMesh.position.add(direction.multiplyScalar(moveSpeed));

        // Horizontale Kollisionen mit Insel: Bewegung rückgängig machen, wenn außerhalb (immer, auch im Wasser)
        if (islandMesh) {
            const x = Math.abs(playerMesh.position.x);
            const z = Math.abs(playerMesh.position.z);
            let outOfBounds = false;
            if (islandMesh.geometry.parameters.width === 50) { // Quadrat
                if (x > 25 || z > 25) outOfBounds = true;
            } else if (islandMesh.geometry.parameters.width === 100) { // Rechteck
                if (x > 50 || z > 25) outOfBounds = true;
            }
            if (outOfBounds) {
                // Bewegung rückgängig machen
                playerMesh.position.sub(direction.multiplyScalar(moveSpeed));
            }
        }

        // Kamera-Position und Player-Drehung aktualisieren im Vollbild
        if (isFullscreen) {
            updateCameraPosition();
            // Player dreht sich, um der Kamera den Rücken zuzukehren
            playerMesh.rotation.y = cameraRotationY + Math.PI;
        }

        // Schwerkraft
        velocityY += gravity;
        playerMesh.position.y += velocityY;

        // Kollisionen: Insel mit Raycast (nur nahe der Oberfläche), Wasser und Boden mit einfachen Checks
        if (velocityY < 0 && playerMesh.position.y < originalPlayerY + 2) { // Smoother, nicht zu früh stoppen
            const raycaster = new THREE.Raycaster();
            raycaster.set(playerMesh.position.clone(), new THREE.Vector3(0, -1, 0));

            // Insel-Kollision
            const islandIntersects = raycaster.intersectObject(islandMesh);
            if (islandIntersects.length > 0) {
                playerMesh.position.y = islandIntersects[0].point.y + 0.5;
                velocityY = 0;
            }
        }

        // Wasser-Kollision (einfach: wenn unter Wasser, auf Oberfläche)
        if (playerMesh.position.y < 0) {
            playerMesh.position.y = 0;
            velocityY = 0;
        }

        // Boden-Kollision (einfach: wenn unter Boden, auf Boden)
        if (playerMesh.position.y < -50) {
            playerMesh.position.y = -50;
            velocityY = 0;
        }
    }

    renderer.render(scene, camera);
}

// Initialisierung starten
init();
animate();
console.log("DEBUG: Script geladen und init/animate gestartet.");
