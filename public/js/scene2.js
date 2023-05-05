import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass";
import { OutlinePass } from "three/examples/jsm/postprocessing/OutlinePass";
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader";

let camera, controls, scene, renderer;

const sceneMeshes = []; // array ukládající 3DObject pro raycaster
let objectsToOutline = []; // array ukládající 3DObject pro Outline Pass

// proměnné kontrolující splnění úkolů
let check = {
  selectDone: false
}

/// SCENE ///
scene = new THREE.Scene();
scene.background = new THREE.Color(0xcccccc);

/// RENDERER ///
renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setAnimationLoop(animation); // A built in function that can be used instead of requestAnimationFrame.

renderer.outputEncoding = THREE.sRGBEncoding;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.8;
renderer.setPixelRatio( window.devicePixelRatio );
renderer.shadowMap.enabled = true;

document.body.appendChild(renderer.domElement);

/// CAMERA ///
camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 1000);
camera.position.set(5, 10, 10);

/// CONTROLS ///
controls = new OrbitControls(camera, renderer.domElement);
controls.addEventListener("change", render)

/// LIGHTS ///
const light1 = new THREE.SpotLight(0xffffff)
const helper1 = new THREE.SpotLightHelper( light1);
light1.position.set(10, 10, 10)
// light1.target
// light.castShadow = true;
// light.shadow.mapSize.width = 4096;
// light.shadow.mapSize.height = 4096;
const light2 = new THREE.SpotLight(0xffffff);
const helper2 = new THREE.SpotLightHelper( light2);
light2.position.set(-10,10,-10)
// light2.target

scene.add(light1, light2, helper1, helper2)

/// HDR background ///
const hdrTextureURL = new URL("images/mud_road_puresky_1k.hdr", import.meta.url)

const RGBE = new RGBELoader();
RGBE.load(hdrTextureURL, (texture) => {
  texture.mapping = THREE.EquirectangularReflectionMapping;
  scene.background = texture;
  scene.enviroment = texture; 
}) 

/// OUTLINEPASS ///
const composer = new EffectComposer(renderer);
const renderPass = new RenderPass(scene, camera);
const outlinePass = new OutlinePass(new THREE.Vector2(window.innerWidth, window.innerHeight), scene, camera);

outlinePass.visibleEdgeColor.set("#F3FF00"); // Nastavení barvy obrysu
outlinePass.hiddenEdgeColor = "none";
outlinePass.edgeThickness = 1; // Nastavení tloušťky obrysu
outlinePass.edgeStrength = 3; // Nastavení síly obrysu
outlinePass.edgeGlow = 3;

composer.addPass(renderPass);
composer.addPass(outlinePass);

function addOutlineObject(object) {
  objectsToOutline = [];
  objectsToOutline.push(object);
}

/// GLTF Loaders ///
const loader = new GLTFLoader()

loader.load(
  "models/Plate_motions.gltf",
  (gltf) => {
    const model = gltf.scene;
    scene.add(model);
    // addOutlineObject(model)
    gltf.scene.traverse((child) => {
      // child.castShadow = true;
      sceneMeshes.push(child)
      // child.material.flatShading = true;
      
    })
  },
  (xhr) => {
    const progressBar = document.getElementById("progress-bar");
    progressBar.value = (xhr.loaded / xhr.total) * 100;
    if (progressBar.value === 100) {
      document.querySelector(".progress-bar-container").style.display = "none"
    }
  }
)

/// RAYCASTER ///
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

renderer.domElement.style.touchAction = 'none';
renderer.domElement.addEventListener('dblclick', onMouseMove, false)

function onMouseMove(event) {
  mouse.set(
    (event.clientX / renderer.domElement.clientWidth) * 2 - 1,
    -(event.clientY / renderer.domElement.clientHeight) * 2 + 1
  )
  raycaster.setFromCamera(mouse, camera)

  const intersects = raycaster.intersectObjects(sceneMeshes, true)

  if (intersects.length > 0) {
    const selectedObject = intersects[0].object;
    addOutlineObject(selectedObject);
    outlinePass.selectedObjects = objectsToOutline;
    console.log(objectsToOutline[0].name);
    checkMovement()
  }
}


/// Animate function ///

function animation() {
  composer.render();
  controls.update();
}

function render() {
  renderer.render(scene, camera);
}

animation()

/// Resize eventListener ///
function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix(); // Updates the camera projection matrix. Must be called after any change of parameters.
  renderer.setSize(window.innerWidth, window.innerHeight);
}
window.addEventListener('resize', onWindowResize, false);

function writeTime() {
  let d = new Date();
  return `${d.toLocaleDateString()}, ${d.getHours()}:${d.getMinutes()}:${d.getSeconds()}:${d.getMilliseconds()}`
}

// function to create object of single coordinate record
function addCameraCoordinates(position) {
  let singleCoordinateRecord = {
    time: writeTime(),
    movement: controls.movement, 
    x: position.x,
    y: position.y,
    z: position.z
  }
  return singleCoordinateRecord;
}

let track = [];

// upravená eventListener ovládání, kdy je zachycená změna každých 25 milisekund 
let lastUpdateTime = 0;
controls.addEventListener('change', function () {
  var now = Date.now();
  if (now - lastUpdateTime > 25) {
    let { x, y, z } = camera.position;
    track.push(addCameraCoordinates({ x, y, z }))
    lastUpdateTime = now;
  }
});

/// DATA COMPILATION ///
let entryTime = new Date().toLocaleTimeString();

function createData() {
  let data = {
    scene: "scene_2",
    entryTime: entryTime,
    exitTime: new Date().toLocaleTimeString(),
    selectedObject: objectsToOutline[0].name,
    cameraMovement: track
  }
  return data;
};

document.querySelector("#post-button").onclick = function () {
  let dataToPost = createData();
  fetch("/scene_data", {
      method: 'POST',
      headers: new Headers({
        'Content-Type': 'application/json'
      }),
      body: JSON.stringify(dataToPost)
    })
    .then(response => response.json())
    .then(data =>
        console.log(data)
      )
    .catch(error => 
        console.log(error)
    );
};

// Funkce pro aktualizaci stavu tlačítka Odeslat
function updateSubmitButton() {
  if (Object.values(check).every(Boolean)) {
    document.getElementById("post-button").classList.remove('btn-secondary');
    document.getElementById("post-button").classList.add('btn-success');
    document.getElementById('post-button').disabled = false;
  } else {
    document.getElementById('post-button').disabled = true;
  }
}

/// Controlling user actions /// 

// Funkce pro zvýraznění divu a aktualizaci proměnné
function highlightDiv(divId, variable, value) {
  check[variable] = true;
  updateSubmitButton();
}

function checkMovement() {
  console.log(objectsToOutline);
  if (objectsToOutline.length > 0) {
    highlightDiv('select', 'selectDone', 'lightgreen')
  } 
}