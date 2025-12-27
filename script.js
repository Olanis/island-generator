// Einfacher Insel-Generator mit Three.js (WebGL) – Insel schwimmt halb im Wasser
// Rapier für Physik integriert

let scene, camera, renderer, islandMesh, seaMesh, groundMesh, controls, isRotating = true, playerMesh, originalPlayerY;
let moveForward = false, moveBackward = false, moveLeft = false, moveRight = false;
const moveSpeed = 6; // Doppelt so schnell
let isFullscreen = false, rightMouseDown = false, lastMouseX = 0, cameraRotationY = 0;
let jumpCount = 0; // Jump-Counter für max 2 Sprünge

// Rapier
let RAPIER, world, islandBody, playerBody, groundBody;

async function init() {
    console.log("DEBUG: init() aufgerufen – Three.js + Rapier Setup starten.");

    // Rapier laden als ES-Module
    const script = document.createElement('script');
    script.type = 'module';
    script.textContent = `
        import * as RAPIER from 'https://cdn.jsdelivr.net/npm/@dimforge/rapier3d-compat@0.12.0/rapier.es.js';
        await RAPIER.init();
        window.RAPIER = RAPIER;
        window.initThreeJS();
    `;
    document.head.appendChild(script);

    // Warte auf Rapier, dann Three.js starten
    window.initThreeJS = async function() {
        RAPIER = window.RAPIER;

        // Physik-Welt (stärkere Gravity für schnelleres Fallen)
        world = new RAPIER.World({ x: 0, y: -20, z: 0 });

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

        // Boden-Body (dünne Box als Plane)
        const groundRigidBodyDesc = RAPIER.RigidBodyDesc.fixed().setTranslation(0, -50.05, 0);
        groundBody = world.createRigidBody(groundRigidBodyDesc);
        const groundColliderDesc = RAPIER.ColliderDesc.cuboid(2500, 0.1, 2500);
        world.createCollider(groundColliderDesc, groundBody);

        // Insel generieren
        generateIsland();

        // Animate starten
        animate();
        console.log("DEBUG: Setup fertig.");
    };
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
    let geometry, hx, hy, hz;
    if (shape === 'quadrat') {
        geometry = new THREE.BoxGeometry(50, 50, 50);
        hx = 25; hy = 25; hz = 25;
    } else {
        geometry = new THREE.BoxGeometry(100, 50, 50);
        hx = 50; hy = 25; hz = 25;
    }

    const material = new THREE.MeshLambertMaterial({ color: 0x228b22 });
    islandMesh = new THREE.Mesh(geometry, material);
    islandMesh.position.y = 0;
    scene.add(islandMesh);

    // Insel-Body
    const islandRigidBodyDesc = RAPIER.RigidBodyDesc.fixed().setTranslation(0, 0, 0);
    islandBody = world.createRigidBody(islandRigidBodyDesc);
    const islandColliderDesc = RAPIER.ColliderDesc.cuboid(hx, hy, hz);
    world.createCollider(islandColliderDesc, islandBody);

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

            // Player-Body (dynamic mit locked Rotation und Damping)
            const playerRigidBodyDesc = RAPIER.RigidBodyDesc.dynamic().setTranslation(0, 26, 0);
            playerBody = world.createRigidBody(playerRigidBodyDesc);
            playerBody.lockRotations(true, false); // x und z locken, y frei für Camera
            playerBody.setAngularDamping(10);
            playerBody.setLinearDamping(0.5);
            const playerColliderDesc = RAPIER.ColliderDesc.cuboid(0.5, 0.5, 0.25);
            world.createCollider(playerColliderDesc, playerBody);
            jumpCount = 0; // Reset Jump-Count
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
            jumpCount = 0;
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
    if (playerBody && jumpCount < 2) { // Max 2 Sprünge
        const vel = playerBody.linvel();
        playerBody.setLinvel({ x: vel.x, y: 10, z: vel.z }); // Doppelt so hoch
        jumpCount++;
    }
}

function animate() {
    requestAnimationFrame(animate);
    if (controls && controls.enabled) controls.update();
    if (islandMesh && isRotating) islandMesh.rotation.y += 0.01;

    // Physik Schritt
    world.step();

    // Sync Meshes
    if (islandBody) {
        const pos = islandBody.translation();
        islandMesh.position.set(pos.x, pos.y, pos.z);
        const rot = islandBody.rotation();
        islandMesh.quaternion.set(rot.x, rot.y, rot.z, rot.w);
    }
    if (groundBody) {
        // Boden ist fixed, keine Sync nötig
    }
    if (playerBody && playerMesh) {
        const pos = playerBody.translation();
        playerMesh.position.set(pos.x, pos.y, pos.z);
        const rot = playerBody.rotation();
        playerMesh.quaternion.set(rot.x, rot.y, rot.z, rot.w);

        // Bewegung (gedreht nach Player-Rotation: cameraRotationY + Math.PI)
        let direction = new THREE.Vector3();
        if (moveForward) direction.z += moveSpeed;
        if (moveBackward) direction.z -= moveSpeed;
        if (moveLeft) direction.x += moveSpeed;
        if (moveRight) direction.x -= moveSpeed;

        if (direction.length() > 0) {
            direction.applyAxisAngle(new THREE.Vector3(0, 1, 0), cameraRotationY + Math.PI); // Korrigiert
            playerBody.setLinvel({ x: direction.x, y: playerBody.linvel().y, z: direction.z });
        }

        // Jump-Count reset, wenn auf Boden
        if (playerMesh.position.y >= 25) {
            jumpCount = 0;
        }

        // Kamera-Update
        if (isFullscreen) {
            updateCameraPosition();
            playerMesh.rotation.y = cameraRotationY + Math.PI;
        }
    }

    renderer.render(scene, camera);
}

// Start
init();
