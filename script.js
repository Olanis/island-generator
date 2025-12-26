// Einfacher Insel-Generator mit Three.js (WebGL) – Insel schwimmt halb im Wasser
// Nvidia PhysX.js für Physik integriert

let scene, camera, renderer, islandMesh, seaMesh, groundMesh, controls, isRotating = true, playerMesh, originalPlayerY;
let moveForward = false, moveBackward = false, moveLeft = false, moveRight = false;
const moveSpeed = 0.5;
let isFullscreen = false, rightMouseDown = false, lastMouseX = 0, cameraRotationY = 0;

// PhysX
let PhysX, physics, islandBody, playerBody, groundBody;

async function init() {
    console.log("DEBUG: init() aufgerufen – Three.js + PhysX Setup starten.");

    // PhysX.js laden
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/@playcanvas/physx@0.6.0/dist/PhysX.js';
    script.onload = async function() {
        PhysX = await PhysX();
        physics = await PhysX.Px.CreateFoundation(PhysX.PX_PHYSICS_VERSION, new PhysX.PxDefaultAllocator(), new PhysX.PxDefaultErrorCallback());
        const physics = await PhysX.Px.CreatePhysics(PhysX.PX_PHYSICS_VERSION, PhysX.Px.GetFoundation(), new PhysX.PxTolerancesScale());
        const sceneDesc = PhysX.Px.SceneDesc(PhysX.Px.GetTolerancesScale());
        sceneDesc.gravity = new PhysX.PxVec3(0, -9.82, 0);
        const cooking = PhysX.Px.CreateCooking(PhysX.PX_PHYSICS_VERSION, PhysX.Px.GetFoundation(), new PhysX.PxCookingParams(new PhysX.PxTolerancesScale()));
        const physxScene = physics.createScene(sceneDesc);

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
        const groundShape = PhysX.Px.BoxGeometry(2500, 0.1, 2500);
        groundBody = physics.createRigidStatic(new PhysX.PxTransform(new PhysX.PxVec3(0, -50.1, 0), new PhysX.PxQuat(0, 0, 0, 1)));
        groundBody.createShape(groundShape, physics.createMaterial(0.5, 0.5, 0.6));
        physxScene.addActor(groundBody);

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
        physxScene.removeActor(islandBody);
    }

    const shape = Math.random() > 0.5 ? 'quadrat' : 'rechteck';
    let geometry, shapePhysX;
    if (shape === 'quadrat') {
        geometry = new THREE.BoxGeometry(50, 50, 50);
        shapePhysX = PhysX.Px.BoxGeometry(25, 25, 25);
    } else {
        geometry = new THREE.BoxGeometry(100, 50, 50);
        shapePhysX = PhysX.Px.BoxGeometry(50, 25, 25);
    }

    const material = new THREE.MeshLambertMaterial({ color: 0x228b22 });
    islandMesh = new THREE.Mesh(geometry, material);
    islandMesh.position.y = 0;
    scene.add(islandMesh);

    // Insel-Body
    islandBody = physics.createRigidStatic(new PhysX.PxTransform(new PhysX.PxVec3(0, 0, 0), new PhysX.PxQuat(0, 0, 0, 1)));
    islandBody.createShape(shapePhysX, physics.createMaterial(0.5, 0.5, 0.6));
    physxScene.addActor(islandBody);

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
            const playerShape = PhysX.Px.BoxGeometry(0.5, 0.5, 0.25);
            playerBody = physics.createRigidDynamic(new PhysX.PxTransform(new PhysX.PxVec3(0, 26, 0), new PhysX.PxQuat(0, 0, 0, 1)));
            playerBody.createShape(playerShape, physics.createMaterial(0.5, 0.5, 0.6));
            playerBody.setMass(1);
            physxScene.addActor(playerBody);
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
            physxScene.removeActor(playerBody);
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
        const impulse = new PhysX.PxVec3(0, 2, 0);
        playerBody.addForce(impulse, PhysX.PxForceMode.eIMPULSE);
    }
}

function animate() {
    requestAnimationFrame(animate);
    if (controls && controls.enabled) controls.update();
    if (islandMesh && isRotating) islandMesh.rotation.y += 0.01;

    // Physik Schritt
    physxScene.simulate(1 / 60);
    physxScene.fetchResults(true);

    // Sync Meshes
    if (islandBody) {
        const transform = islandBody.getGlobalPose();
        islandMesh.position.set(transform.p.x, transform.p.y, transform.p.z);
        islandMesh.quaternion.set(transform.q.x, transform.q.y, transform.q.z, transform.q.w);
    }
    if (groundBody) {
        const transform = groundBody.getGlobalPose();
        groundMesh.position.set(transform.p.x, transform.p.y, transform.p.z);
        groundMesh.quaternion.set(transform.q.x, transform.q.y, transform.q.z, transform.q.w);
    }
    if (playerBody && playerMesh) {
        const transform = playerBody.getGlobalPose();
        playerMesh.position.set(transform.p.x, transform.p.y, transform.p.z);
        playerMesh.quaternion.set(transform.q.x, transform.q.y, transform.q.z, transform.q.w);

        // Bewegung
        if (moveForward) playerBody.setLinearVelocity(new PhysX.PxVec3(0, playerBody.getLinearVelocity().y, moveSpeed));
        if (moveBackward) playerBody.setLinearVelocity(new PhysX.PxVec3(0, playerBody.getLinearVelocity().y, -moveSpeed));
        if (moveLeft) playerBody.setLinearVelocity(new PhysX.PxVec3(moveSpeed, playerBody.getLinearVelocity().y, 0));
        if (moveRight) playerBody.setLinearVelocity(new PhysX.PxVec3(-moveSpeed, playerBody.getLinearVelocity().y, 0));

        // Kamera-Update
        if (isFullscreen) {
            updateCameraPosition();
            playerMesh.rotation.y = cameraRotationY + Math.PI;
        }

        // Wasser: Auf Oberfläche
        if (playerMesh.position.y < 0) {
            playerBody.setGlobalPose(new PhysX.PxTransform(new PhysX.PxVec3(transform.p.x, 0, transform.p.z), transform.q));
            playerBody.setLinearVelocity(new PhysX.PxVec3(0, 0, 0));
        }
    }

    renderer.render(scene, camera);
}

// Start
init();
