// Einfacher Insel-Generator mit Three.js (WebGL) – Insel schwimmt halb im Wasser
// Kein Import nötig, THREE ist global geladen
// Rapier-Physik integriert

let scene, camera, renderer, islandMesh, seaMesh, groundMesh, controls, isRotating = true, playerMesh, originalPlayerY, velocityY = 0, gravity = -0.01, jumpStrength = 0.1414; // Schwerkraft verdoppelt, Sprunghöhe gleich
let moveForward = false, moveBackward = false, moveLeft = false, moveRight = false;
const moveSpeed = 0.5; // Geschwindigkeit der Bewegung
let isFullscreen = false, rightMouseDown = false, lastMouseX = 0, cameraRotationY = 0;

// Rapier-Physik
let RAPIER, world, islandBody, playerBody, groundBody;

async function init() {
    console.log("DEBUG: init() aufgerufen – Three.js + Rapier Setup starten.");

    // Rapier laden
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/@dimforge/rapier3d-compat@0.12.0/rapier.es.js';
    script.onload = async () => {
        RAPIER = await import('https://cdn.jsdelivr.net/npm/@dimforge/rapier3d-compat@0.12.0/rapier.es.js');
        await RAPIER.init(); // Initialisiere Rapier
        console.log("DEBUG: Rapier geladen und initialisiert.");

        // Physik-Welt erstellen
        world = new RAPIER.World({ x: 0, y: -9.82, z: 0 }); // Gravity
        console.log("DEBUG: Rapier-Welt erstellt mit Gravity.");

        // Szene, Kamera, Renderer
        scene = new THREE.Scene();
        scene.background = new THREE.Color(0x87ceeb);

        camera = new THREE.PerspectiveCamera(75, 800 / 600, 0.1, 1000);
        camera.position.set(250, 250, 250);
        camera.lookAt(0, 0, 0);

        renderer = new THREE.WebGLRenderer();
        renderer.setSize(800, 600);
        document.getElementById('container').appendChild(renderer.domElement);

        // OrbitControls
        const controlsScript = document.createElement('script');
        controlsScript.src = 'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/OrbitControls.js';
        controlsScript.onload = function() {
            controls = new THREE.OrbitControls(camera, renderer.domElement);
            controls.enableDamping = true;
            controls.dampingFactor = 0.05;
            controls.mouseButtons = { LEFT: THREE.MOUSE.PAN, RIGHT: THREE.MOUSE.ROTATE };
            controls.enabled = true;
            console.log("DEBUG: OrbitControls hinzugefügt.");
        };
        document.head.appendChild(controlsScript);

        // Beleuchtung
        const light = new THREE.DirectionalLight(0xffffff, 1);
        light.position.set(1, 1, 1).normalize();
        scene.add(light);

        // Button-Events
        document.getElementById('generateBtn').addEventListener('click', generateIsland);
        document.getElementById('playBtn').addEventListener('click', enterFullscreen);

        // Tasten-Events
        document.addEventListener('keydown', function(event) {
            const key = event.key.toLowerCase();
            if (key === 'w') moveForward = true;
            else if (key === 's') moveBackward = true;
            else if (key === 'a') moveLeft = true;
            else if (key === 'd') moveRight = true;
            else if (key === ' ') jumpPlayer();
            else if (key === 'escape') exitFullscreen();
        });

        document.addEventListener('keyup', function(event) {
            const key = event.key.toLowerCase();
            if (key === 'w') moveForward = false;
            else if (key === 's') moveBackward = false;
            else if (key === 'a') moveLeft = false;
            else if (key === 'd') moveRight = false;
        });

        // Maus-Events
        document.addEventListener('mousedown', function(event) {
            if (event.button === 2 && isFullscreen) {
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
                cameraRotationY -= deltaX * 0.01;
                lastMouseX = event.clientX;
            }
        });
        document.addEventListener('contextmenu', function(event) {
            event.preventDefault();
        });

        // Vollbild-Events
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        document.addEventListener('webkitfullscreenchange', handleFullscreenChange);

        // Meer und Boden
        const seaGeometry = new THREE.PlaneGeometry(5000, 5000);
        const seaMaterial = new THREE.MeshLambertMaterial({ color: 0x0077be, transparent: true, opacity: 0.6 });
        seaMesh = new THREE.Mesh(seaGeometry, seaMaterial);
        seaMesh.rotation.x = -Math.PI / 2;
        scene.add(seaMesh);

        const groundGeometry = new THREE.PlaneGeometry(5000, 5000);
        const groundMaterial = new THREE.MeshLambertMaterial({ color: 0xc2b280 });
        groundMesh = new THREE.Mesh(groundGeometry, groundMaterial);
        groundMesh.rotation.x = -Math.PI / 2;
        groundMesh.position.y = -50;
        scene.add(groundMesh);

        // Boden-Body (statisch)
        const groundShape = new RAPIER.Cuboid(2500, 0.1, 2500);
        groundBody = world.createRigidBody(RAPIER.RigidBodyDesc.fixed().setTranslation(0, -50.1, 0));
        world.createCollider(RAPIER.ColliderDesc.cuboid(2500, 0.1, 2500), groundBody);

        // Insel generieren
        generateIsland();

        // Animate starten
        animate();
        console.log("DEBUG: Setup fertig.");
    };
    document.head.appendChild(script);
}

function generateIsland() {
    console.log("DEBUG: generateIsland() aufgerufen.");

    if (islandMesh) {
        scene.remove(islandMesh);
        islandMesh.geometry.dispose();
        islandMesh.material.dispose();
        world.removeRigidBody(islandBody);
    }

    const shape = Math.random() > 0.5 ? 'quadrat' : 'rechteck';
    let geometry, colliderShape;
    if (shape === 'quadrat') {
        geometry = new THREE.BoxGeometry(50, 50, 50);
        colliderShape = new RAPIER.Cuboid(25, 25, 25);
    } else {
        geometry = new THREE.BoxGeometry(100, 50, 50);
        colliderShape = new RAPIER.Cuboid(50, 25, 25);
    }

    const material = new THREE.MeshLambertMaterial({ color: 0x228b22 });
    islandMesh = new THREE.Mesh(geometry, material);
    islandMesh.position.y = 0;
    scene.add(islandMesh);

    // Insel-Body (statisch)
    islandBody = world.createRigidBody(RAPIER.RigidBodyDesc.fixed().setTranslation(0, 0, 0));
    world.createCollider(colliderShape, islandBody);

    renderer.render(scene, camera);
}

function enterFullscreen() {
    const container = document.getElementById('container');
    if (container.requestFullscreen) container.requestFullscreen();
    else if (container.webkitRequestFullscreen) container.webkitRequestFullscreen();
}

function exitFullscreen() {
    if (document.exitFullscreen) document.exitFullscreen();
    else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
}

function handleFullscreenChange() {
    if (document.fullscreenElement || document.webkitFullscreenElement) {
        isFullscreen = true;
        isRotating = false;
        if (!playerMesh) {
            const playerGeometry = new THREE.BoxGeometry(1, 1, 0.5);
            const playerMaterial = new THREE.MeshLambertMaterial({ color: 0xffa500 });
            playerMesh = new THREE.Mesh(playerGeometry, playerMaterial);
            playerMesh.position.set(0, 26, 0);
            scene.add(playerMesh);

            // Player-Body (dynamisch)
            const playerShape = new RAPIER.Cuboid(0.5, 0.5, 0.25);
            playerBody = world.createRigidBody(RAPIER.RigidBodyDesc.dynamic().setTranslation(0, 26, 0));
            world.createCollider(RAPIER.ColliderDesc.cuboid(0.5, 0.5, 0.25), playerBody);
        }
        if (controls) controls.enabled = false;
        renderer.setSize(window.innerWidth, window.innerHeight);
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
    } else {
        isFullscreen = false;
        isRotating = true;
        if (playerMesh) {
            scene.remove(playerMesh);
            playerMesh.geometry.dispose();
            playerMesh.material.dispose();
            playerMesh = null;
            world.removeRigidBody(playerBody);
            playerBody = null;
        }
        if (controls) controls.enabled = true;
        camera.position.set(250, 250, 250);
        camera.lookAt(0, 0, 0);
        cameraRotationY = 0;
        renderer.setSize(800, 600);
        camera.aspect = 800 / 600;
        camera.updateProjectionMatrix();
    }
}

function updateCameraPosition() {
    if (playerMesh) {
        const offset = new THREE.Vector3(0, 20, 30);
        offset.applyAxisAngle(new THREE.Vector3(0, 1, 0), cameraRotationY);
        camera.position.copy(playerMesh.position).add(offset);
        camera.lookAt(playerMesh.position);
    }
}

function jumpPlayer() {
    if (playerBody) {
        playerBody.applyImpulse({ x: 0, y: 0.2, z: 0 }, true); // Sprung-Impuls
    }
}

function animate() {
    requestAnimationFrame(animate);
    if (controls && controls.enabled) controls.update();
    if (islandMesh && isRotating) islandMesh.rotation.y += 0.01;

    // Physik Schritt
    world.step();

    // Sync Meshes mit Bodies
    if (islandBody) {
        const pos = islandBody.translation();
        islandMesh.position.set(pos.x, pos.y, pos.z);
        const rot = islandBody.rotation();
        islandMesh.quaternion.set(rot.x, rot.y, rot.z, rot.w);
    }
    if (groundBody) {
        const pos = groundBody.translation();
        groundMesh.position.set(pos.x, pos.y, pos.z);
    }
    if (playerBody && playerMesh) {
        const pos = playerBody.translation();
        playerMesh.position.set(pos.x, pos.y, pos.z);
        const rot = playerBody.rotation();
        playerMesh.quaternion.set(rot.x, rot.y, rot.z, rot.w);

        // Bewegung
        let impulse = { x: 0, y: 0, z: 0 };
        if (moveForward) impulse.z += moveSpeed;
        if (moveBackward) impulse.z -= moveSpeed;
        if (moveLeft) impulse.x += moveSpeed;
        if (moveRight) impulse.x -= moveSpeed;
        if (impulse.x || impulse.z) {
            playerBody.applyImpulse(impulse, true);
        }

        // Kamera-Update
        if (isFullscreen) {
            updateCameraPosition();
            playerMesh.rotation.y = cameraRotationY + Math.PI;
        }

        // Wasser-"Kollision": Wenn unter Wasser, auf Oberfläche
        if (playerMesh.position.y < 0) {
            playerBody.setTranslation({ x: pos.x, y: 0, z: pos.z }, true);
            playerBody.setLinvel({ x: 0, y: 0, z: 0 }, true);
        }
    }

    renderer.render(scene, camera);
}

// Start
init();
