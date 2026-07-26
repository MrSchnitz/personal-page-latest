/**
 * Three.js background: floating `</>` glyphs with a matcap material (single
 * shared TextGeometry in one InstancedMesh — 1 draw call). Evolved from the
 * 2023 scene: fewer glyphs (fewer still on mobile), theme-aware depth fog, a
 * camera clearance zone, slow drift and pointer parallax, accent-tinted subset.
 *
 * Runs once per full page load; the canvas (and WebGL context) is kept alive
 * across client-side navigations by transition:persist on the wrapper.
 */
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { FontLoader, type Font } from "three/addons/loaders/FontLoader.js";
import { TextGeometry } from "three/addons/geometries/TextGeometry.js";

/* fewer glyphs than the 2023 site's 300 — a calmer field, lighter on mobile GPUs */
const GLYPH_COUNT_DESKTOP = 250;
const GLYPH_COUNT_MOBILE = 100;
/* glyphs never spawn closer than this to the camera — a near glyph fills half
   the viewport as a huge blurry shape and washes out the content behind it */
const CAMERA_CLEARANCE = 2.75;
const MATCAP_URL = "/matcaps/7A7A7A_D9D9D9_BCBCBC_B4B4B4-256px.png";
const FONT_URL = "/fonts/source-code-pro-subset.typeface.json";
/* brand emerald, kept light so the multiply with the chrome matcap stays metallic */
const ACCENT_TINT = "#7dedc4";
/* fog colors match the page backgrounds so distant glyphs fade away into depth */
const FOG_DARK = "#0b1017";
const FOG_LIGHT = "#d9e1e5";
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

  // depth fog toward the page background; the color chases the active theme so
  // the 1s light↔dark background crossfade never leaves mismatched glyphs
  const isDark = () => document.documentElement.classList.contains("dark");
  const fogTarget = new THREE.Color(isDark() ? FOG_DARK : FOG_LIGHT);
  scene.fog = new THREE.Fog(fogTarget.clone(), 5, 13);
  new MutationObserver(() => fogTarget.set(isDark() ? FOG_DARK : FOG_LIGHT)).observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["class"],
  });

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

    const glyphCount = window.matchMedia("(min-width: 768px)").matches
      ? GLYPH_COUNT_DESKTOP
      : GLYPH_COUNT_MOBILE;
    const mesh = new THREE.InstancedMesh(geometry, material, glyphCount);
    const matrix = new THREE.Matrix4();
    const position = new THREE.Vector3();
    const rotation = new THREE.Quaternion();
    const euler = new THREE.Euler();
    const scale = new THREE.Vector3();
    const white = new THREE.Color(0xffffff);
    const accent = new THREE.Color(ACCENT_TINT);
    for (let i = 0; i < glyphCount; i++) {
      // resample until the glyph is clear of the camera (and of the small orbit
      // the drift/parallax sweeps it through)
      do {
        position.set((Math.random() - 0.5) * 10, (Math.random() - 0.5) * 8, (Math.random() - 0.5) * 10);
      } while (position.distanceTo(camera.position) < CAMERA_CLEARANCE);
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
    (scene.fog as THREE.Fog).color.lerp(fogTarget, Math.min(delta * 3, 1));
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
