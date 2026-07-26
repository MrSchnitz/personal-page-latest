/**
 * Main-thread bootstrap for the three.js background. The scene itself runs in
 * a Web Worker rendering to an OffscreenCanvas, so three.js never parses or
 * executes on the main thread (this file stays dependency-free); browsers
 * without OffscreenCanvas fall back to the same scene on the main thread via
 * dynamic import. Pointer, resize and theme changes are forwarded as messages.
 *
 * Runs once per full page load; the canvas (and its context) is kept alive
 * across client-side navigations by transition:persist on the wrapper.
 */
import type { SceneMessage } from "./scene-worker";

/* fewer glyphs than the 2023 site's 300 — a calmer field, lighter on mobile GPUs */
const GLYPH_COUNT_DESKTOP = 250;
const GLYPH_COUNT_MOBILE = 100;

const wrap = document.getElementById("scene");
const canvas = document.getElementById("scene-canvas");

if (wrap instanceof HTMLElement && canvas instanceof HTMLCanvasElement) {
  initScene(wrap, canvas);
}

async function initScene(wrap: HTMLElement, canvas: HTMLCanvasElement) {
  const isDesktop = window.matchMedia("(min-width: 768px)").matches;
  const options = {
    width: window.innerWidth,
    height: window.innerHeight,
    pixelRatio: Math.min(window.devicePixelRatio, 2),
    glyphCount: isDesktop ? GLYPH_COUNT_DESKTOP : GLYPH_COUNT_MOBILE,
    dark: document.documentElement.classList.contains("dark"),
  };

  let post: (message: SceneMessage) => void;
  if (typeof canvas.transferControlToOffscreen === "function") {
    const worker = new Worker(new URL("./scene-worker.ts", import.meta.url), { type: "module" });
    const offscreen = canvas.transferControlToOffscreen();
    worker.postMessage({ type: "init", canvas: offscreen, ...options } satisfies SceneMessage, [offscreen]);
    post = (message) => worker.postMessage(message);
  } else {
    const { createScene } = await import("./scene-core");
    const handle = createScene(canvas, options);
    post = (message) => {
      if (message.type === "pointer") handle.setPointer(message.x, message.y);
      else if (message.type === "resize") handle.resize(message.width, message.height);
      else if (message.type === "theme") handle.setDark(message.dark);
    };
  }

  // pointer parallax: the glyph field leans gently toward the cursor
  window.addEventListener("pointermove", (event) => {
    post({
      type: "pointer",
      x: (event.clientX / window.innerWidth) * 2 - 1,
      y: (event.clientY / window.innerHeight) * 2 - 1,
    });
  });

  window.addEventListener("resize", () => {
    post({ type: "resize", width: window.innerWidth, height: window.innerHeight });
  });

  new MutationObserver(() => {
    post({ type: "theme", dark: document.documentElement.classList.contains("dark") });
  }).observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });

  // fade-in parity with the old `fadeOn 3s 2s|3s forwards` keyframes — done with a
  // class + transition so the persisted node keeps its state across navigations
  window.setTimeout(() => wrap.classList.add("scene-on"), isDesktop ? 3000 : 2000);
}
