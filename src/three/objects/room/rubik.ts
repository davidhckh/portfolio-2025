import { Box3, Group, Mesh, MeshMatcapMaterial, Object3D, PlaneGeometry, Vector3 } from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import gsap from "gsap";
import { raycast } from "../../utils/raycast";
import { resources } from "../../../utils/resources";
import { sceneWeights } from "../../../animations/scenes";
import { prefersReducedMotion } from "../../../utils/motion";
import { playSound } from "../../../features/sounds/utils/sounds";

import type { ClickableBox3 } from "../../types";

// A real 3×3 Rubik's cube on the desk, drawn over the baked one in the room texture
// (same spot, a hair larger so it covers it). Every few seconds one layer twists on
// its own, as if someone were solving it; a click makes it hop and scramble.

// Where the baked cube sits, in the room mesh's local space (from room.glb).
const CENTER = new Vector3(-1.6835, 1.6405, 0.897);
const SIZE = 0.281 * 1.06;
const ROTATION_Y = 0.18;

// Sticker colours, softened to the room's palette. Order: +X, -X, +Y, -Y, +Z, -Z.
const FACE_COLORS = [0xff8a3d, 0xe8505b, 0xf6f3ec, 0xffd23f, 0x3f7fdc, 0x4cbb6c];
const FACE_DIRS = [
  new Vector3(1, 0, 0),
  new Vector3(-1, 0, 0),
  new Vector3(0, 1, 0),
  new Vector3(0, -1, 0),
  new Vector3(0, 0, 1),
  new Vector3(0, 0, -1),
];
const AXES = ["x", "y", "z"] as const;

let root: Group | null = null; // positioned on the desk
let cube: Group | null = null; // holds the 27 cubies, hops / squashes
let pivot: Group | null = null; // temporary parent for the layer being twisted
let box3: ClickableBox3 | null = null;
let twisting = false;
let nextTwist = 0;
let scrambling = false;
const cubies: Object3D[] = [];

const init = (parent: Group, roomMesh: Object3D) => {
  if (root) return;
  const matcap = resources.items["matcap-white"];
  const body = new MeshMatcapMaterial({ color: 0x2a2a33, matcap });
  const stickers = FACE_COLORS.map((color) => new MeshMatcapMaterial({ color, matcap }));

  const step = 1 / 3;
  const cubieGeometry = new RoundedBoxGeometry(step * 0.98, step * 0.98, step * 0.98, 2, step * 0.14);
  const stickerGeometry = new PlaneGeometry(step * 0.8, step * 0.8);

  root = new Group();
  root.name = "rubik";
  root.position.copy(CENTER).add(roomMesh.position);
  root.rotation.y = ROTATION_Y;
  root.scale.setScalar(SIZE);
  parent.add(root);

  cube = new Group();
  root.add(cube);
  pivot = new Group();
  cube.add(pivot);

  for (let x = -1; x <= 1; x++)
    for (let y = -1; y <= 1; y++)
      for (let z = -1; z <= 1; z++) {
        const cubie = new Group();
        cubie.position.set(x * step, y * step, z * step);
        cubie.add(new Mesh(cubieGeometry, body));
        const cell = [x, y, z];
        FACE_DIRS.forEach((dir, face) => {
          // A sticker only on the cubie faces that are on the outside of the cube.
          const axis = face >> 1;
          if (cell[axis] !== dir.getComponent(axis)) return;
          const sticker = new Mesh(stickerGeometry, stickers[face]);
          sticker.position.copy(dir).multiplyScalar(step * 0.505); // proud of the body, no z-fighting
          sticker.lookAt(dir.clone().multiplyScalar(2));
          cubie.add(sticker);
        });
        cube.add(cubie);
        cubies.push(cubie);
      }

  root.updateMatrixWorld(true);
  box3 = new Box3().setFromObject(root);
  box3.expandByScalar(0.08);
  box3.onClick = handleClick;
  box3.hoverSound = "hover";
  raycast.boxesToCheck.push(box3);
};

// Turns one layer a quarter turn: the layer's cubies move under the pivot, the pivot
// rotates, then they go back to the cube with their new transform, snapped to the grid.
const twist = (duration: number, ease = "power2.inOut") =>
  new Promise<void>((resolve) => {
    if (!cube || !pivot) return resolve();
    const axis = AXES[Math.floor(Math.random() * 3)]!;
    const layer = Math.floor(Math.random() * 3) - 1;
    const step = 1 / 3;
    const layerCubies = cubies.filter((c) => Math.round(c.position[axis] / step) === layer);

    pivot.rotation.set(0, 0, 0);
    pivot.updateMatrixWorld(true);
    layerCubies.forEach((c) => pivot!.attach(c));
    twisting = true;
    gsap.to(pivot.rotation, {
      [axis]: (Math.random() < 0.5 ? 1 : -1) * (Math.PI / 2),
      duration,
      ease,
      onComplete: () => {
        pivot!.updateMatrixWorld(true);
        layerCubies.forEach((c) => {
          cube!.attach(c);
          c.position.set(
            Math.round(c.position.x / step) * step,
            Math.round(c.position.y / step) * step,
            Math.round(c.position.z / step) * step,
          );
          // Snap the rotation too, so float error never builds up over many turns.
          const r = c.rotation;
          r.set(
            Math.round(r.x / (Math.PI / 2)) * (Math.PI / 2),
            Math.round(r.y / (Math.PI / 2)) * (Math.PI / 2),
            Math.round(r.z / (Math.PI / 2)) * (Math.PI / 2),
          );
        });
        twisting = false;
        resolve();
      },
    });
  });

const handleClick = async () => {
  if (!cube || scrambling) return;
  scrambling = true;
  playSound("click");
  // Hop with a little spin, and scramble with quick twists while it is in the air.
  const tl = gsap.timeline();
  tl.to(cube.position, { y: 0.55, duration: 0.25, ease: "power2.out" });
  tl.to(cube.rotation, { y: `+=${Math.PI / 2}`, duration: 0.5, ease: "power2.inOut" }, 0);
  tl.to(cube.position, { y: 0, duration: 0.22, ease: "power2.in" }, 0.25);
  tl.to(cube.scale, { y: 0.88, x: 1.06, z: 1.06, duration: 0.07 }, 0.47);
  tl.to(cube.scale, { y: 1, x: 1, z: 1, duration: 0.25, ease: "back.out(3)" }, 0.54);
  while (twisting) await new Promise((r) => setTimeout(r, 30));
  for (let i = 0; i < 5; i++) await twist(0.13, "power1.inOut");
  scrambling = false;
  nextTwist = gsap.ticker.time + 2;
};

const tick = () => {
  if (!root || sceneWeights.hero < 0.5 || prefersReducedMotion.value) return;
  const time = gsap.ticker.time;
  if (twisting || scrambling || time < nextTwist) return;
  nextTwist = time + 2.2 + Math.random() * 2.5;
  twist(0.45);
};

const destroy = () => {
  if (box3) {
    const index = raycast.boxesToCheck.indexOf(box3);
    if (index !== -1) raycast.boxesToCheck.splice(index, 1);
  }
  root?.removeFromParent();
  root = cube = pivot = null;
  box3 = null;
  cubies.length = 0;
};

export const rubik = { init, tick, destroy };
