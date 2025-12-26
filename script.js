// Einfacher Insel-Generator mit Three.js (WebGL) – Insel schwimmt halb im Wasser
// Cannon.js für Physik integriert

let scene, camera, renderer, islandMesh, seaMesh, groundMesh, controls, isRotating = true, playerMesh, originalPlayerY;
let moveForward = false, moveBackward = false, moveLeft = false, moveRight = false;
const moveSpeed = 0.5;
let isFullscreen = false, rightMouseDown = false, lastMouseX = 0, cameraRotationY = 0;

// Cannon.js Physik
let world, islandBody, playerBody, groundBody;

function init() {
    console.log("DEBUG: init() aufgerufen – Three.js + Cannon.js Setup starten.");

    // Cannon.js laden
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/cannon@0.6.2/build/cannon.min.js';
    script.onload = function() {
        // Physik-Welt
        world = new CANNON.World();
        world.gravity.set(0, -9.82, 0);
        world.broadphase = new CANNON.NaiveBroadphase();
        world.solver.iterations = 10;

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

        // Boden-Body
        groundBody = new CANNON.Body({ mass: 0, type: CANNON.Body.KINEMATIC });
        groundBody.addShape(new CANNON.Plane());
        groundBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
        groundBody.position.set(0, -50, 0);
        world.addBody(groundBody);

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
        world.removeBody(islandBody);
    }

    const shape = Math.random() > 0.5 ? 'quadrat' : 'rechteck';
    let geometry, shapeCannon;
    if (shape === 'quadrat') {
        geometry = new THREE.BoxGeometry(50, 50, 50);
        shapeCannon = new CANNON.Box(new CANNON.Vec3(25, 25, 25));
    } else {
        geometry = new THREE.BoxGeometry(100, 50, 50);
        shapeCannon = new CANNON.Box(new CANNON.Vec3(50, 25, 25));
    }

    const material = new THREE.MeshLambertMaterial({ color: 0x228b22 });
    islandMesh = new THREE.Mesh(geometry, material);
    islandMesh.position.y = 0;
    scene.add(islandMesh);

    // Insel-Body
    islandBody = new CANNON.Body({ mass: 0, type: CANNON.Body.KINEMATIC });
    islandBody.addShape(shapeCannon);
    islandBody.position.set(0, 0, 0);
    world.addBody(islandBody);

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

            // Player-Body
            playerBody = new CANNON.Body({ mass: 1 });
            playerBody.addShape(new CANNON.Box(new CANNON.Vec3(0.5, 0.5, 0.25)));
            playerBody.position.set(0, 26, 0);
            world.addBody(playerBody);
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
            world.removeBody(playerBody);
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
        playerBody.velocity.y = 2; // Sprung
    }
}

function animate() {
    requestAnimationFrame(animate);
    if (controls && controls.enabled) controls.update();
    if (islandMesh && isRotating) islandMesh.rotation.y += 0.01;

    // Physik Schritt
    world.step(1 / 60);

    // Sync Meshes
    if (islandBody) {
        islandMesh.position.copy(islandBody.position);
        islandMesh.quaternion.copy(islandBody.quaternion);
    }
    if (groundBody) {
        groundMesh.position.copy(groundBody.position);
        groundMesh.quaternion.copy(groundBody.quaternion);
    }
    if (playerBody && playerMesh) {
        playerMesh.position.copy(playerBody.position);
        playerMesh.quaternion.copy(playerBody.quaternion);

        // Bewegung
        if (moveForward) playerBody.velocity.z = moveSpeed;
        if (moveBackward) playerBody.velocity.z = -moveSpeed;
        if (moveLeft) playerBody.velocity.x = moveSpeed;
        if (moveRight) playerBody.velocity.x = -moveSpeed;

        // Kamera-Update
        if (isFullscreen) {
            updateCameraPosition();
            playerMesh.rotation.y = cameraRotationY + Math.PI;
        }

        // Wasser: Auf Oberfläche
        if (playerMesh.position.y < 0) {
            playerBody.position.y = 0;
            playerBody.velocity.y = 0;
        }
    }

    renderer.render(scene, camera);
}

// Start
init();
