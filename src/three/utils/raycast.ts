import gsap from "gsap";
import { Ray, Vector2, Vector3 } from "three";
import { camera } from "../core/camera";
import { threeSizes } from "./sizes";
import { playSound } from "../../features/sounds/utils/sounds";

import type { ClickableBox3 } from "../types";

let hoveringBox: ClickableBox3 | null = null;
let previousHoveringBox: ClickableBox3 | null = null;
const boxesToCheck: ClickableBox3[] = [];
const pointer = new Vector2();
const ndcPointer = new Vector3();
const ray = new Ray();
const target = new Vector3();
const isTouchDevice = "ontouchstart" in window || navigator.maxTouchPoints > 0;

let clientX = -1e6;
let clientY = -1e6;

const updatePointer = (x: number, y: number) => {
  clientX = x;
  clientY = y;
};

// Normalized device coordinates (-1 to 1) relative to the canvas' actual rect, read
// at raycast time. The canvas isn't always at the viewport's top-left: at the bottom
// of the page the footer pushes it up ~150 px, and computing against the viewport
// put every click box that far below its object (unnoticed until the contact
// section got a clickable elePHPant). Read each time so scrolling with a still
// mouse stays right too.
const updateNdc = () => {
  const rect = threeSizes.canvas?.getBoundingClientRect();
  const left = rect?.left ?? 0;
  const top = rect?.top ?? 0;
  const width = rect?.width || threeSizes.width;
  const height = rect?.height || threeSizes.height;
  pointer.x = ((clientX - left) / width) * 2 - 1;
  pointer.y = -((clientY - top) / height) * 2 + 1;
};

const performRaycast = () => {
  if (!boxesToCheck.length) return;
  updateNdc();

  // Ensure camera's world matrix is current
  camera.instance.updateWorldMatrix(true, false);

  // Get camera world position
  camera.instance.getWorldPosition(ray.origin);

  // Get world-space ray direction from NDC
  ndcPointer.set(pointer.x, pointer.y, 0.5).unproject(camera.instance);
  ray.direction.copy(ndcPointer).sub(ray.origin).normalize();

  hoveringBox = null;

  let closestBox: ClickableBox3 | null = null;
  let closestDistance = Infinity;

  for (const box of boxesToCheck) {
    if (!ray.intersectBox(box, target)) continue;

    const distance = ray.origin.distanceTo(target);
    if (distance < closestDistance) {
      closestDistance = distance;
      closestBox = box;
    }
  }

  if (closestBox) {
    hoveringBox = closestBox;
  }
};

const handleClick = (e: MouseEvent) => {
  updatePointer(e.clientX, e.clientY);
  performRaycast();
  if (!hoveringBox || !hoveringBox.onClick) return;
  hoveringBox.onClick();
};

const handleMouseMove = (event: MouseEvent) => {
  updatePointer(event.clientX, event.clientY);
};

const tick = () => {
  // Only perform continuous raycast for non-touch devices
  if (!isTouchDevice) {
    performRaycast();

    // Check for hover state changes and play sounds
    if (hoveringBox !== previousHoveringBox) {
      // If we started hovering over a new box with a hover sound
      if (hoveringBox && hoveringBox.hoverSound && !previousHoveringBox) {
        playSound(hoveringBox.hoverSound as any);
      }
      previousHoveringBox = hoveringBox;
    }
  }
};

const init = () => {
  if (!isTouchDevice) {
    gsap.ticker.add(tick);
  }
  window.addEventListener("mousemove", handleMouseMove);
  window.addEventListener("click", handleClick);
};

const destroy = () => {
  if (!isTouchDevice) {
    gsap.ticker.remove(tick);
  }
  window.removeEventListener("mousemove", handleMouseMove);
  window.removeEventListener("click", handleClick);
};

export const raycast = {
  init,
  destroy,
  boxesToCheck,
  getHoveringBox: () => hoveringBox,
};
