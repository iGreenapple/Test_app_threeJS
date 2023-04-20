import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass";
import { OutlinePass } from "three/examples/jsm/postprocessing/OutlinePass";

let camera, controls, scene, renderer;

const sceneMeshes = []; // array ukládající 3DObject pro raycaster
let objectsToOutline = []; // array ukládající 3DObject pro Outline Pass

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
camera.position.set(5, 10, 10);

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