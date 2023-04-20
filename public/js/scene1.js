import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass";
import { OutlinePass } from "three/examples/jsm/postprocessing/OutlinePass";

let camera, controls, scene, renderer;

const sceneMeshes = []; // array ukládající 3DObject pro raycaster
let objectsToOutline = []; // array ukládající 3DObject pro Outline Pass

/// initialization of some data ///

// let startTime = new Date().getTime();
// console.log(startTime);
// let endTime
// setTimeout(() => {
//   endTime = new Date().getTime();
//   console.log(endTime - startTime);
// }, 5000);

// const screenWidth = window.screen.width;
// const screenHeight = window.screen.height;
// console.log("Šířka obrazovky:", screenWidth, "px");
// console.log("Výška obrazovky:", screenHeight, "px");

// const mediaQuery = window.matchMedia("(orientation: landscape)"); // nebo "(orientation: portrait)" pro výšku
// const isLandscape = mediaQuery.matches;
// console.log("Orientace obrazovky:", isLandscape ? "landscape" : "portrait");


/// SCENE ///
scene = new THREE.Scene();
scene.background = new THREE.Color(0xcccccc);

/// RENDERER ///
renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setAnimationLoop(animation); // A built in function that can be used instead of requestAnimationFrame.
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

/// CAMERA ///
camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 1000);
camera.position.set(5,10,10);

/// CONTROLS ///
controls = new OrbitControls(camera, renderer.domElement);
controls.addEventListener("change", render)

/// LIGHTS ///
const light = new THREE.SpotLight()
light.position.set(10, 20, 10)
light.castShadow = true;
light.shadow.mapSize.width = 4096;
light.shadow.mapSize.height = 4096;
scene.add(light)

// CUBE
const geometry = new THREE.BoxGeometry(1, 1, 1);
const material = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
const cube = new THREE.Mesh(geometry, material);
sceneMeshes.push(cube)
scene.add(cube);

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
  "models/test_model.glb",
  (gltf) => {
    const model = gltf.scene;
    scene.add(model);
    // addOutlineObject(model)
    gltf.scene.traverse((child) => {
      
      
      if (child.name === "Plane") {
        child.receiveShadow = true;
        child.position.y = -0.5;
      }
      else {
        child.castShadow = true;
        sceneMeshes.push(child)
        // child.material.flatShading = true;
      }
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
    console.log(intersects[0].object.name);
    const selectedObject = intersects[0].object;
    addOutlineObject(selectedObject);
    outlinePass.selectedObjects = objectsToOutline;
    console.log(objectsToOutline[0].name);
  }
}

/// track visualisation /// 
let lineVertex = [
  { x: 5, y: 10, z: 10 },
  { x: 10.145626164945142, y: 9.400139826323175, z: 5.805483697914693 },
  { x: 8.826167144218266, y: 7.991878746582728, z: -9.122973618411978 },
  { x: 5.919266028318319, y: 7.588538066794117, z: -11.505493457249594 },
  { x: 3.2050181549728953, y: 7.039132165404173, z: -12.852177908209425 },
  { x: 0.6067518140023622, y: 6.618892888804147, z: -13.447011160951064 },
  { x: -2.5100902821093496, y: 6.335066372226949, z: -13.362873225288762 },
  { x: -4.03184308080803, y: 6.335066372226951, z: -12.985036597222958 },
  { x: -5.395191637478228, y: 6.192099737783953, z: -12.551884640651412},
  { x: -6.3014636635577235, y: 6.192099737783953, z: -12.122271096382786 },
];
let track = [];

function createLineFromCoordinates(coordinates) {
  track = []
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(coordinates.length * 3);

  for (let i = 0; i < coordinates.length; i++) {
    positions[i * 3] = coordinates[i].x;
    positions[i * 3 + 1] = coordinates[i].y;
    positions[i * 3 + 2] = coordinates[i].z;
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  const material = new THREE.LineBasicMaterial({ color: 0x000000 });
  const line = new THREE.Line(geometry, material);

  scene.add(line)
}


// controls.addEventListener("change", (render => {
//   let {x,y,z} = camera.position;
//   track.push({ x, y, z })
// }))

document.querySelector("#line-button").onclick = function () {
  createLineFromCoordinates(track)
}


/// Animate function ///

function animation() {
  composer.render();
  controls.update();
  // console.log({x: camera.position.x,
  //   y: camera.position.y,
  //   z: camera.position.z});
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


/// DATA COMPILATION ///

function createData() {
  let data = {
    scene: "scene_1",
    entryTime: Date(),
    exitTime: Date(),
    testTime: data.entryTime, 
    selectedObject: objectsToOutline[0].name,
    cameraPosition: cameraTracker
  }
  return data
}

const cameraTracker = [];

//   let cameraPosition = {
//   x: camera.position.x,
//   y: camera.position.y,
//   z:camera.position.z
//   };
//   cameraTracker.push(cameraPosition);
//   // console.log(cameraTracker);







document.querySelector(".post").onclick = function sendData() {
  createData()
  fetch("/data", {
      method: 'POST',
      headers: new Headers({
        'Content-Type': 'application/json'
      }),
      body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(data =>
        console.log(data)
      )
    .catch(error => 
        console.log(error)
    );
}

