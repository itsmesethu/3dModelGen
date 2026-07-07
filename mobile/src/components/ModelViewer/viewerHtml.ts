/**
 * Self-contained three.js viewer that runs inside a WebView.
 * Models are streamed in as base64 via postMessage, so no network access
 * is needed for the model itself (three.js is loaded from a CDN once and
 * cached by the WebView).
 *
 * RN -> WebView messages:
 *   { type: 'load', format: 'glb'|'gltf'|'obj', base64: string }
 *   { type: 'reset' }
 *   { type: 'autorotate', enabled: boolean }
 * WebView -> RN messages:
 *   { type: 'ready' } | { type: 'loaded' } | { type: 'error', message }
 */
export const VIEWER_HTML = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
<style>
  html, body { margin: 0; padding: 0; height: 100%; overflow: hidden; background: #0B0D12; }
  #canvas { width: 100%; height: 100%; display: block; touch-action: none; }
</style>
<script type="importmap">
{
  "imports": {
    "three": "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js",
    "three/addons/": "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/"
  }
}
</script>
</head>
<body>
<canvas id="canvas"></canvas>
<script type="module">
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';

const send = (payload) => {
  if (window.ReactNativeWebView) {
    window.ReactNativeWebView.postMessage(JSON.stringify(payload));
  }
};

const canvas = document.getElementById('canvas');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0B0D12);

const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.01, 1000);
const HOME = new THREE.Vector3(1.6, 1.1, 1.6);
camera.position.copy(HOME);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.autoRotateSpeed = 2.2;

scene.add(new THREE.HemisphereLight(0xffffff, 0x334155, 1.1));
const key = new THREE.DirectionalLight(0xffffff, 1.4);
key.position.set(3, 5, 2);
scene.add(key);
const rim = new THREE.DirectionalLight(0x99aaff, 0.6);
rim.position.set(-3, 2, -3);
scene.add(rim);

const grid = new THREE.GridHelper(4, 20, 0x2A3342, 0x1D2430);
grid.position.y = -0.55;
scene.add(grid);

let model = null;

function disposeModel() {
  if (!model) return;
  scene.remove(model);
  model.traverse((node) => {
    if (node.geometry) node.geometry.dispose();
    if (node.material) {
      const materials = Array.isArray(node.material) ? node.material : [node.material];
      materials.forEach((m) => { if (m.map) m.map.dispose(); m.dispose(); });
    }
  });
  model = null;
}

function frameModel(object) {
  const box = new THREE.Box3().setFromObject(object);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  const maxSide = Math.max(size.x, size.y, size.z) || 1;
  const scale = 1.0 / maxSide;
  object.scale.setScalar(scale);
  object.position.copy(center).multiplyScalar(-scale);
  controls.target.set(0, 0, 0);
  camera.position.copy(HOME);
  controls.update();
}

function addModel(object) {
  disposeModel();
  model = object;
  scene.add(model);
  frameModel(model);
  send({ type: 'loaded' });
}

function base64ToArrayBuffer(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

function loadModel(format, base64) {
  try {
    if (format === 'glb' || format === 'gltf') {
      const loader = new GLTFLoader();
      const data = format === 'glb'
        ? base64ToArrayBuffer(base64)
        : new TextDecoder().decode(base64ToArrayBuffer(base64));
      loader.parse(data, '', (gltf) => addModel(gltf.scene), (error) => {
        send({ type: 'error', message: 'Could not parse the model file.' });
      });
    } else if (format === 'obj') {
      const text = new TextDecoder().decode(base64ToArrayBuffer(base64));
      const object = new OBJLoader().parse(text);
      object.traverse((node) => {
        if (node.isMesh) {
          node.material = new THREE.MeshStandardMaterial({
            color: 0xB8BEC9, metalness: 0.1, roughness: 0.75,
          });
        }
      });
      addModel(object);
    } else {
      send({ type: 'error', message: 'Unsupported model format: ' + format });
    }
  } catch (error) {
    send({ type: 'error', message: 'Failed to load model: ' + error.message });
  }
}

function handleMessage(event) {
  let message;
  try { message = JSON.parse(event.data); } catch { return; }
  if (message.type === 'load') loadModel(message.format, message.base64);
  else if (message.type === 'reset') { camera.position.copy(HOME); controls.target.set(0,0,0); controls.update(); }
  else if (message.type === 'autorotate') controls.autoRotate = !!message.enabled;
}
// Android fires on document, iOS on window.
document.addEventListener('message', handleMessage);
window.addEventListener('message', handleMessage);

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

renderer.setAnimationLoop(() => {
  controls.update();
  renderer.render(scene, camera);
});

send({ type: 'ready' });
</script>
</body>
</html>`;
