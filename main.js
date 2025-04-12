// === CONFIG ===
const BLOCK_SIZE = 1;
const WORLD_WIDTH = 16;
const WORLD_DEPTH = 16;
const WORLD_HEIGHT = 8;

const textures = [
  "textures/grass.png",
  "textures/dirt.png",
  "textures/stone.png",
  "textures/wood.png",
  "textures/sand.png",
  "textures/glass.png",
  "textures/water.png",
  "textures/lava.png",
  "textures/snow.png",
  "textures/leaves.png"
];

let selectedBlock = 0;

// === SETUP SCENE ===
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb); // Sky blue

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.y = 2;

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// === LIGHTING ===
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);
const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(100, 100, 50).normalize();
scene.add(directionalLight);

// === CONTROLS ===
const controls = new THREE.PointerLockControls(camera, document.body);
document.body.addEventListener("click", () => controls.lock());
scene.add(controls.getObject());

let velocity = new THREE.Vector3();
let direction = new THREE.Vector3();
const keys = {};

document.addEventListener("keydown", e => keys[e.code] = true);
document.addEventListener("keyup", e => keys[e.code] = false);

// === TEXTURES ===
const loader = new THREE.TextureLoader();
const materials = textures.map(path => new THREE.MeshLambertMaterial({ map: loader.load(path) }));

// === WORLD ===
const blocks = {};

function createBlock(x, y, z, type) {
  const geometry = new THREE.BoxGeometry(BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
  const block = new THREE.Mesh(geometry, materials[type]);
  block.position.set(x, y, z);
  block.userData = { x, y, z, type };
  scene.add(block);
  blocks[`${x},${y},${z}`] = block;
}

function removeBlock(x, y, z) {
  const key = `${x},${y},${z}`;
  const block = blocks[key];
  if (block) {
    scene.remove(block);
    delete blocks[key];
  }
}

function generateFlatWorld() {
  for (let x = 0; x < WORLD_WIDTH; x++) {
    for (let z = 0; z < WORLD_DEPTH; z++) {
      createBlock(x, 0, z, 1); // dirt
      createBlock(x, 1, z, 0); // grass
    }
  }
}

generateFlatWorld();

// === RAYCASTING ===
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2(0, 0);

window.addEventListener("mousedown", event => {
  raycaster.setFromCamera(pointer, camera);
  const intersects = raycaster.intersectObjects(Object.values(blocks));
  if (intersects.length > 0) {
    const hit = intersects[0].object;
    const pos = hit.position;

    if (event.button === 0) {
      removeBlock(pos.x, pos.y, pos.z); // Left click = break
    } else if (event.button === 2) {
      const normal = intersects[0].face.normal;
      const newPos = pos.clone().add(normal);
      createBlock(newPos.x, newPos.y, newPos.z, selectedBlock); // Right click = place
    }
  }
});

window.addEventListener("contextmenu", e => e.preventDefault());

// === INVENTORY SELECTION ===
document.querySelectorAll(".slot").forEach((slot, i) => {
  slot.addEventListener("click", () => {
    selectedBlock = i;
    document.querySelectorAll(".slot").forEach(s => s.classList.remove("selected"));
    slot.classList.add("selected");
  });
});

window.addEventListener("keydown", e => {
  if (e.key >= "1" && e.key <= "9") {
    const i = parseInt(e.key) - 1;
    selectedBlock = i;
    document.querySelectorAll(".slot").forEach(s => s.classList.remove("selected"));
    document.querySelector(`.slot[data-block="${i}"]`).classList.add("selected");
  }
});

// === ANIMATION LOOP ===
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);

  const delta = clock.getDelta();

  direction.z = Number(keys["KeyW"]) - Number(keys["KeyS"]);
  direction.x = Number(keys["KeyD"]) - Number(keys["KeyA"]);
  direction.normalize();

  velocity.x -= velocity.x * 10.0 * delta;
  velocity.z -= velocity.z * 10.0 * delta;

  velocity.x += direction.x * 50.0 * delta;
  velocity.z += direction.z * 50.0 * delta;

  controls.moveRight(velocity.x * delta);
  controls.moveForward(velocity.z * delta);

  renderer.render(scene, camera);
}

animate();
