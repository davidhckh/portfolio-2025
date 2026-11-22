import {
  Box3,
  CanvasTexture,
  DoubleSide,
  Group,
  Mesh,
  MeshBasicMaterial,
  PlaneGeometry,
  SRGBColorSpace,
  Vector3,
} from "three";
import gsap from "gsap";
import { raycast } from "../../utils/raycast";
import { playSound } from "../../../features/sounds/utils/sounds";
import { prefersReducedMotion } from "../../../utils/motion";

import type { ClickableBox3 } from "../../types";

// The picture frame on the wall hides a surprise: each click spins it a full turn on
// the wall, popping out a little, swaps the picture halfway through and throws a puff
// of confetti. The pictures cycle: a starry night, the elePHPant, a "<?php echo
// '¡Hola!'; ?>" sunset, then back to the original mountains.
//
// The frame hangs on the wall at x ≈ -2.69 (room-mesh space) and faces +X.

const ART_W = 512;
const ART_H = 424;
const CONFETTI_COLORS = [0xff8400, 0x4f8cff, 0xffd23f, 0xe8505b, 0x4cbb6c, 0x8892bf];
const CONFETTI_COUNT = 28;

let pivot: Group | null = null;
let art: Mesh | null = null;
let artMaterial: MeshBasicMaterial | null = null;
let box3: ClickableBox3 | null = null;
let busy = false;
let artIndex = 0; // 0 = the original picture (overlay hidden)
const artTextures: CanvasTexture[] = [];

type Piece = { mesh: Mesh; velocity: Vector3; spin: Vector3; age: number };
const confetti: Piece[] = [];
let confettiGroup: Group | null = null;

const canvasArt = (paint: (ctx: CanvasRenderingContext2D) => void) => {
  const canvas = document.createElement("canvas");
  canvas.width = ART_W;
  canvas.height = ART_H;
  const ctx = canvas.getContext("2d")!;
  paint(ctx);
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
};

// Laravel: the red isometric "L-blocks" mark (simplified outline) and wordmark.
const paintLaravel = (ctx: CanvasRenderingContext2D) => {
  ctx.fillStyle = "#fff5f4"; ctx.fillRect(0, 0, ART_W, ART_H);
  const red = "#ff2d20";
  ctx.strokeStyle = red; ctx.lineWidth = 9; ctx.lineJoin = "round"; ctx.lineCap = "round";
  // Isometric helper: unit vectors for x (right-down), y (left-down), z (up).
  const o = { x: 200, y: 250 }, s = 22;
  const P = (x: number, y: number, z: number): [number, number] => [o.x + (x - y) * s * 0.87, o.y + (x + y) * s * 0.5 - z * s];
  const poly = (pts: [number, number, number][]) => { ctx.beginPath(); pts.forEach((p, i) => (i ? ctx.lineTo(...P(...p)) : ctx.moveTo(...P(...p)))); ctx.closePath(); ctx.stroke(); };
  // Tall column (the "L" stem).
  poly([[0,0,0],[2,0,0],[2,0,6],[0,0,6]]);
  poly([[0,0,6],[2,0,6],[2,-2,6],[0,-2,6]]);
  poly([[2,0,0],[2,-2,0],[2,-2,6],[2,0,6]]);
  // Foot block to the right, and the box riding on it.
  poly([[2,0,0],[5,0,0],[5,0,2],[2,0,2]]);
  poly([[5,0,0],[5,-2,0],[5,-2,2],[5,0,2]]);
  poly([[2,0,2],[5,0,2],[5,-2,2],[2,-2,2]]);
  poly([[3,0,2],[5,0,2],[5,0,4],[3,0,4]]);
  poly([[5,0,2],[5,-2,2],[5,-2,4],[5,0,4]]);
  poly([[3,0,4],[5,0,4],[5,-2,4],[3,-2,4]]);
  ctx.fillStyle = red; ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.font = '700 64px "Space Grotesk", sans-serif';
  ctx.fillText("Laravel", ART_W / 2 + 40, 365);
};

// Symfony: the black circle with the white "sf" and the wordmark.
const paintSymfony = (ctx: CanvasRenderingContext2D) => {
  ctx.fillStyle = "#f4f4f4"; ctx.fillRect(0, 0, ART_W, ART_H);
  ctx.fillStyle = "#000000";
  ctx.beginPath(); ctx.arc(ART_W / 2, 165, 112, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#ffffff"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.font = 'italic 700 120px "Urbanist", "Arial Black", sans-serif';
  ctx.fillText("sf", ART_W / 2 - 4, 158);
  ctx.fillStyle = "#000000";
  ctx.font = '700 62px "Space Grotesk", sans-serif';
  ctx.fillText("Symfony", ART_W / 2, 355);
};

// FrankenPHP: a playful Franken-elePHPant (flat-top head, stitches, neck bolts)
// in the project's dark/teal look, and the wordmark.
const paintFrankenphp = (ctx: CanvasRenderingContext2D) => {
  const bg = ctx.createLinearGradient(0, 0, 0, ART_H);
  bg.addColorStop(0, "#1d2433"); bg.addColorStop(1, "#283246");
  ctx.fillStyle = bg; ctx.fillRect(0, 0, ART_W, ART_H);
  const skin = "#7fc8a9", dark = "#4f9c80";
  // Ears.
  ctx.fillStyle = dark;
  ctx.beginPath(); ctx.ellipse(160, 175, 58, 74, -0.2, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(352, 175, 58, 74, 0.2, 0, Math.PI * 2); ctx.fill();
  // Bolts.
  ctx.fillStyle = "#c9ced8";
  ctx.beginPath(); ctx.roundRect(170, 238, 34, 22, 5); ctx.fill();
  ctx.beginPath(); ctx.roundRect(308, 238, 34, 22, 5); ctx.fill();
  // Head with a flat top.
  ctx.fillStyle = skin;
  ctx.beginPath(); ctx.roundRect(196, 82, 120, 170, [14, 14, 60, 60]); ctx.fill();
  // Hair fringe.
  ctx.fillStyle = "#1b1f2a";
  ctx.beginPath(); ctx.moveTo(196, 82); ctx.lineTo(316, 82); ctx.lineTo(316, 108);
  for (let x = 316; x > 196; x -= 20) ctx.lineTo(x - 10, 122), ctx.lineTo(x - 20, 108);
  ctx.closePath(); ctx.fill();
  // Trunk.
  ctx.strokeStyle = skin; ctx.lineWidth = 34; ctx.lineCap = "round";
  ctx.beginPath(); ctx.moveTo(256, 230); ctx.quadraticCurveTo(262, 300, 296, 312); ctx.stroke();
  // Eyes and stitches.
  ctx.fillStyle = "#1b1f2a";
  ctx.beginPath(); ctx.arc(232, 165, 10, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(282, 165, 10, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = "#1b1f2a"; ctx.lineWidth = 4; ctx.lineCap = "round";
  ctx.beginPath(); ctx.moveTo(214, 135); ctx.lineTo(262, 128); ctx.stroke();
  for (let x = 220; x <= 256; x += 12) { ctx.beginPath(); ctx.moveTo(x, 124); ctx.lineTo(x + 2, 140); ctx.stroke(); }
  // "Franken" white + "PHP" teal, measured so they read as one word, centred.
  ctx.font = '700 54px "Space Grotesk", sans-serif';
  ctx.textAlign = "left"; ctx.textBaseline = "middle";
  const wF = ctx.measureText("Franken").width, wP = ctx.measureText("PHP").width;
  const x0 = (ART_W - wF - wP) / 2;
  ctx.fillStyle = "#ffffff"; ctx.fillText("Franken", x0, 372);
  ctx.fillStyle = skin; ctx.fillText("PHP", x0 + wF, 372);
};

const init = (frame: Mesh) => {
  if (pivot || !frame.parent) return;
  const parent = frame.parent;

  // Re-pivot the frame around its own centre so it can spin in place on the wall.
  frame.geometry.computeBoundingBox();
  const bounds = frame.geometry.boundingBox!;
  const center = bounds.getCenter(new Vector3());
  const size = bounds.getSize(new Vector3());
  pivot = new Group();
  pivot.name = "frame-pivot";
  pivot.position.copy(frame.position).add(center);
  parent.add(pivot);
  frame.position.copy(center).negate();
  pivot.add(frame);

  // The surprise picture: a plane over the frame's picture area, just in front of
  // the mountains, facing +X like the frame.
  const painters = [paintLaravel, paintSymfony, paintFrankenphp];
  artTextures.push(...painters.map(canvasArt));
  // Repaint once the site fonts are in (canvas text can't wait for CSS on its own).
  document.fonts?.ready.then(() =>
    painters.forEach((paint, i) => {
      const texture = artTextures[i];
      if (!texture) return;
      paint((texture.image as HTMLCanvasElement).getContext("2d")!);
      texture.needsUpdate = true;
    }),
  );
  artMaterial = new MeshBasicMaterial({ map: artTextures[0]! });
  art = new Mesh(new PlaneGeometry(size.z * 0.76, size.y * 0.72), artMaterial);
  art.rotation.y = Math.PI / 2;
  art.position.set(bounds.max.x - center.x - 0.012, 0, 0);
  art.visible = false;
  pivot.add(art);

  confettiGroup = new Group();
  parent.add(confettiGroup);

  pivot.updateMatrixWorld(true);
  box3 = new Box3().setFromObject(pivot);
  box3.expandByScalar(0.05);
  box3.onClick = handleClick;
  box3.hoverSound = "hover";
  raycast.boxesToCheck.push(box3);
};

const showArt = (index: number) => {
  if (!art || !artMaterial) return;
  art.visible = index > 0;
  if (index > 0) {
    artMaterial.map = artTextures[index - 1]!;
    artMaterial.needsUpdate = true;
  }
};

const burstConfetti = () => {
  if (!confettiGroup || !pivot) return;
  const origin = pivot.position.clone();
  origin.x += 0.15;
  for (let i = 0; i < CONFETTI_COUNT; i++) {
    let piece = confetti[i];
    if (!piece) {
      const mesh = new Mesh(
        new PlaneGeometry(0.07, 0.04),
        new MeshBasicMaterial({ color: CONFETTI_COLORS[i % CONFETTI_COLORS.length], side: DoubleSide, transparent: true }),
      );
      confettiGroup.add(mesh);
      piece = { mesh, velocity: new Vector3(), spin: new Vector3(), age: 0 };
      confetti.push(piece);
    }
    piece.mesh.position.copy(origin);
    piece.mesh.visible = true;
    // Out of the wall (+X) and fanned up/sideways, then gravity takes over.
    piece.velocity.set(1.2 + Math.random() * 1.6, 1.4 + Math.random() * 2.2, (Math.random() - 0.5) * 3.2);
    piece.spin.set(Math.random() * 12, Math.random() * 12, Math.random() * 12);
    piece.age = 0;
  }
};

const handleClick = () => {
  if (busy || !pivot) return;
  busy = true;
  playSound("click");
  artIndex = (artIndex + 1) % (artTextures.length + 1);

  if (prefersReducedMotion.value) {
    // No spin or confetti, just the next picture.
    showArt(artIndex);
    busy = false;
    return;
  }

  const baseX = pivot.position.x;
  const tl = gsap.timeline({ onComplete: () => (busy = false) });
  // Pop off the wall, spin a full turn around the wall's normal, settle back.
  tl.to(pivot.position, { x: baseX + 0.25, duration: 0.25, ease: "power2.out" }, 0);
  tl.to(pivot.rotation, { x: `+=${Math.PI * 2}`, duration: 0.9, ease: "power2.inOut" }, 0.05);
  tl.call(() => showArt(artIndex), [], 0.5);
  tl.to(pivot.position, { x: baseX, duration: 0.4, ease: "back.out(2)" }, 0.9);
  tl.fromTo(pivot.scale, { x: 1, y: 1, z: 1 }, { x: 1, y: 1.08, z: 1.08, duration: 0.15, yoyo: true, repeat: 1 }, 0.95);
  tl.call(burstConfetti, [], 0.55);
};

const tick = () => {
  // Refreshed every frame, like the desk elephant's: measured once at init, the box
  // was computed before the room group had its final transform, so it ended up off
  // screen and clicks never reached the frame.
  if (box3 && pivot) {
    box3.setFromObject(pivot);
    box3.expandByScalar(0.05);
  }
  if (!confetti.length) return;
  const dt = Math.min(gsap.ticker.deltaRatio(60) / 60, 0.05);
  for (const piece of confetti) {
    if (!piece.mesh.visible) continue;
    piece.age += dt;
    piece.velocity.y -= 5.5 * dt;
    piece.velocity.multiplyScalar(0.985);
    piece.mesh.position.addScaledVector(piece.velocity, dt);
    piece.mesh.rotation.x += piece.spin.x * dt;
    piece.mesh.rotation.y += piece.spin.y * dt;
    piece.mesh.rotation.z += piece.spin.z * dt;
    const material = piece.mesh.material as MeshBasicMaterial;
    material.opacity = Math.min(1, Math.max(0, (1.8 - piece.age) / 0.5));
    if (piece.age > 1.8) piece.mesh.visible = false;
  }
};

const destroy = () => {
  if (box3) {
    const index = raycast.boxesToCheck.indexOf(box3);
    if (index !== -1) raycast.boxesToCheck.splice(index, 1);
  }
  confettiGroup?.removeFromParent();
  confetti.length = 0;
  artTextures.forEach((t) => t.dispose());
  artTextures.length = 0;
  box3 = null;
  art = null;
  artMaterial = null;
  pivot = null;
  confettiGroup = null;
};

export const frame = { init, tick, destroy };
