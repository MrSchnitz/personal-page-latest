/**
 * Web Worker wrapper around the shared scene: receives the OffscreenCanvas and
 * all subsequent pointer/resize/theme updates from scene.ts via postMessage.
 * Running three.js here keeps its startup and per-frame cost off the main
 * thread entirely.
 */
import { createScene, type SceneHandle, type SceneOptions } from "./scene-core";

export type SceneMessage =
  | ({ type: "init"; canvas: OffscreenCanvas } & SceneOptions)
  | { type: "pointer"; x: number; y: number }
  | { type: "resize"; width: number; height: number }
  | { type: "theme"; dark: boolean };

let handle: SceneHandle | undefined;

addEventListener("message", (event: MessageEvent<SceneMessage>) => {
  const message = event.data;
  if (message.type === "init") handle = createScene(message.canvas, message);
  else if (message.type === "pointer") handle?.setPointer(message.x, message.y);
  else if (message.type === "resize") handle?.resize(message.width, message.height);
  else if (message.type === "theme") handle?.setDark(message.dark);
});
