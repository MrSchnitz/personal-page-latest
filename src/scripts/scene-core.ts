/**
 * Three.js scene shared by the Web Worker (OffscreenCanvas) and the
 * main-thread fallback. Deliberately DOM-free: sizes, theme and pointer state
 * arrive via options / the returned handle, so it can run inside a worker.
 *
 * Floating `</>` glyphs, single shared TextGeometry in one InstancedMesh
 * (1 draw call), theme-aware depth fog, camera clearance zone, slow drift and
 * pointer parallax, accent-tinted subset.
 */
import * as THREE from "three";
import { FontLoader, type Font } from "three/addons/loaders/FontLoader.js";
import { TextGeometry } from "three/addons/geometries/TextGeometry.js";

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

export interface SceneOptions {
  width: number;
  height: number;
  pixelRatio: number;
  glyphCount: number;
  dark: boolean;
}

export interface SceneHandle {
  /** normalized pointer position, -1..1 on both axes */
  setPointer(x: number, y: number): void;
  resize(width: number, height: number): void;
  setDark(dark: boolean): void;
}

export function createScene(canvas: HTMLCanvasElement | OffscreenCanvas, options: SceneOptions): SceneHandle {
  const renderer = new THREE.WebGLRenderer({ canvas: canvas as HTMLCanvasElement, antialias: true, alpha: true });
  renderer.setPixelRatio(options.pixelRatio);
  // updateStyle: false — an OffscreenCanvas has no style, and the element's CSS
  // size is owned by .scene-wrap canvas { width/height: 100% } anyway
  renderer.setSize(options.width, options.height, false);
  // R3F <Canvas> default — required for the same matcap contrast as the old site
  renderer.toneMapping = THREE.ACESFilmicToneMapping;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(90, options.width / options.height, 0.1, 2000);
  camera.position.set(-3, 1.5, 4);
  // OrbitControls used to aim the camera at the origin as a side effect of
  // update(); without it the camera stares down -Z and the field sits off-center
  camera.lookAt(0, 0, 0);

  // depth fog toward the page background; the color chases the active theme so
  // the 1s light↔dark background crossfade never leaves mismatched glyphs
  const fogTarget = new THREE.Color(options.dark ? FOG_DARK : FOG_LIGHT);
  scene.fog = new THREE.Fog(fogTarget.clone(), 5, 13);

  // ImageBitmapLoader works both in workers and on the main thread; flipY at
  // decode time because Texture.flipY is ignored for ImageBitmap sources
  new THREE.ImageBitmapLoader().setOptions({ imageOrientation: "flipY" }).load(MATCAP_URL, (bitmap) => {
    const matcap = new THREE.Texture(bitmap as unknown as HTMLImageElement);
    matcap.colorSpace = THREE.SRGBColorSpace;
    matcap.needsUpdate = true;
    material.matcap = matcap;
    material.needsUpdate = true;
  });
  const material = new THREE.MeshMatcapMaterial();

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

    const mesh = new THREE.InstancedMesh(geometry, material, options.glyphCount);
    const matrix = new THREE.Matrix4();
    const position = new THREE.Vector3();
    const rotation = new THREE.Quaternion();
    const euler = new THREE.Euler();
    const scale = new THREE.Vector3();
    const white = new THREE.Color(0xffffff);
    const accent = new THREE.Color(ACCENT_TINT);
    for (let i = 0; i < options.glyphCount; i++) {
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

  const pointer = { x: 0, y: 0 };
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
    renderer.render(scene, camera);
  };
  renderer.setAnimationLoop(renderFrame);

  // both canvas flavors are EventTargets and fire webgl context events
  canvas.addEventListener("webglcontextlost", (event) => event.preventDefault());
  canvas.addEventListener("webglcontextrestored", () => renderer.setAnimationLoop(renderFrame));

  return {
    setPointer(x, y) {
      pointer.x = x;
      pointer.y = y;
    },
    resize(width, height) {
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
    },
    setDark(dark) {
      fogTarget.set(dark ? FOG_DARK : FOG_LIGHT);
    },
  };
}
