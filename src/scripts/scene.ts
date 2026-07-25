/**
 * Vanilla three.js port of the 2023 SceneBackground (react-three-fiber + drei):
 * 300 floating `</>` glyphs with a matcap material, gently drifting in z.
 * Scene parameters are copied 1:1 from the old component; the perf upgrade is a
 * single shared TextGeometry rendered via InstancedMesh (1 draw call instead of
 * 300 meshes).
 *
 * Runs once per full page load; the canvas (and WebGL context) is kept alive
 * across client-side navigations by transition:persist on the wrapper.
 */
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { FontLoader, type Font } from "three/addons/loaders/FontLoader.js";
import { TextGeometry } from "three/addons/geometries/TextGeometry.js";

const GLYPH_COUNT = 300;
const MATCAP_URL = "/matcaps/7A7A7A_D9D9D9_BCBCBC_B4B4B4-256px.png";
const FONT_URL = "/fonts/source-code-pro-subset.typeface.json";
/* brand emerald, kept light so the multiply with the chrome matcap stays metallic */
const ACCENT_TINT = "#7dedc4";
/* radians of extra group rotation at full pointer deflection */
const PARALLAX_X = 0.12;
const PARALLAX_Y = 0.08;

const wrap = document.getElementById("scene");
const canvas = document.getElementById("scene-canvas");

if (wrap instanceof HTMLElement && canvas instanceof HTMLCanvasElement) {
  initScene(wrap, canvas);
}

function initScene(wrap: HTMLElement, canvas: HTMLCanvasElement) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  // R3F <Canvas> default — required for the same matcap contrast as the old site
  renderer.toneMapping = THREE.ACESFilmicToneMapping;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(90, window.innerWidth / window.innerHeight, 0.1, 2000);
  camera.position.set(-3, 1.5, 4);

  const controls = new OrbitControls(camera, canvas);
  controls.enablePan = false;
  controls.enableZoom = false;
  controls.enableDamping = true;

  const matcap = new THREE.TextureLoader().load(MATCAP_URL);
  matcap.colorSpace = THREE.SRGBColorSpace;
  const material = new THREE.MeshMatcapMaterial({ matcap });

  // every glyph drifts identically, so the whole set is animated via one group
  const group = new THREE.Group();
  scene.add(group);

  new FontLoader().load(FONT_URL, (font: Font) => {
    const geometry = new TextGeometry("</>", {
      font,
      size: 1,
      depth: 0.2, // drei's `height` prop
      curveSegments: 15,
      bevelEnabled: true,
      bevelThickness: 0.02,
      bevelSize: 0.02,
      bevelOffset: 0,
      bevelSegments: 5,
    });

    const mesh = new THREE.InstancedMesh(geometry, material, GLYPH_COUNT);
    const matrix = new THREE.Matrix4();
    const position = new THREE.Vector3();
    const rotation = new THREE.Quaternion();
    const euler = new THREE.Euler();
    const scale = new THREE.Vector3();
    const white = new THREE.Color(0xffffff);
    const accent = new THREE.Color(ACCENT_TINT);
    for (let i = 0; i < GLYPH_COUNT; i++) {
      position.set((Math.random() - 0.5) * 10, (Math.random() - 0.5) * 8, (Math.random() - 0.5) * 10);
      rotation.setFromEuler(euler.set(Math.random() * Math.PI, Math.random() * Math.PI, 0));
      scale.setScalar(0.2 + Math.random() * 0.2);
      mesh.setMatrixAt(i, matrix.compose(position, rotation, scale));
      // brand accent: ~1 in 8 glyphs gets the emerald tint (multiplies the matcap)
      mesh.setColorAt(i, Math.random() < 0.125 ? accent : white);
    }
    group.add(mesh);
  });

  // pointer parallax: the glyph field leans gently toward the cursor
  const pointer = { x: 0, y: 0 };
  window.addEventListener("pointermove", (event) => {
    pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
    pointer.y = (event.clientY / window.innerHeight) * 2 - 1;
  });

  let previousTime: number | undefined;
  let driftAngle = 0;
  const parallax = { x: 0, y: 0 };
  const renderFrame = (time: number) => {
    // delta from the loop timestamp (THREE.Clock is deprecated); clamped so a
    // backgrounded tab or a restored context doesn't cause a position jump
    const delta = previousTime === undefined ? 0 : Math.min((time - previousTime) / 1000, 0.1);
    previousTime = time;
    group.position.z += delta * Math.sin((time / 1000) * 0.5) * 0.1;
    // slow constant drift + smoothed pointer parallax
    driftAngle += delta * 0.012;
    parallax.x += (pointer.x * PARALLAX_X - parallax.x) * Math.min(delta * 2.5, 1);
    parallax.y += (pointer.y * PARALLAX_Y - parallax.y) * Math.min(delta * 2.5, 1);
    group.rotation.y = driftAngle + parallax.x;
    group.rotation.x = parallax.y;
    controls.update(); // required: damping is enabled
    renderer.render(scene, camera);
  };
  renderer.setAnimationLoop(renderFrame);

  window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  canvas.addEventListener("webglcontextlost", (event) => event.preventDefault());
  canvas.addEventListener("webglcontextrestored", () => renderer.setAnimationLoop(renderFrame));

  // fade-in parity with the old `fadeOn 3s 2s|3s forwards` keyframes — done with a
  // class + transition so the persisted node keeps its state across navigations
  window.setTimeout(
    () => wrap.classList.add("scene-on"),
    window.matchMedia("(min-width: 768px)").matches ? 3000 : 2000,
  );
}
