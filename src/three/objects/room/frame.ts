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

const paintNight = (ctx: CanvasRenderingContext2D) => {
  const sky = ctx.createLinearGradient(0, 0, 0, ART_H);
  sky.addColorStop(0, "#1b2a6b");
  sky.addColorStop(1, "#3d4fa8");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, ART_W, ART_H);
  ctx.fillStyle = "#ffffff";
  for (let i = 0; i < 40; i++) {
    const x = (i * 97) % ART_W;
    const y = (i * 53) % (ART_H * 0.6);
    ctx.globalAlpha = 0.5 + ((i * 7) % 5) / 10;
    ctx.beginPath();
    ctx.arc(x, y, 1.5 + (i % 3), 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  // Crescent moon.
  ctx.fillStyle = "#ffe9a8";
  ctx.beginPath();
  ctx.arc(380, 110, 52, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#22327a";
  ctx.beginPath();
  ctx.arc(402, 96, 46, 0, Math.PI * 2);
  ctx.fill();
  // Hills.
  ctx.fillStyle = "#6c63c9";
  ctx.beginPath();
  ctx.moveTo(0, ART_H);
  ctx.lineTo(0, 300);
  ctx.quadraticCurveTo(150, 210, 300, 310);
  ctx.quadraticCurveTo(420, 250, ART_W, 290);
  ctx.lineTo(ART_W, ART_H);
  ctx.fill();
  ctx.fillStyle = "#4b43a3";
  ctx.beginPath();
  ctx.moveTo(0, ART_H);
  ctx.lineTo(0, 360);
  ctx.quadraticCurveTo(220, 290, ART_W, 370);
  ctx.lineTo(ART_W, ART_H);
  ctx.fill();
};

const paintElephpant = (ctx: CanvasRenderingContext2D) => {
  ctx.fillStyle = "#e9ebf7";
  ctx.fillRect(0, 0, ART_W, ART_H);
  const blue = "#8892bf";
  const dark = "#6c76a8";
  ctx.fillStyle = blue;
  // Legs, body, head, trunk, ear.
  for (const x of [170, 215, 300, 345]) {
    ctx.beginPath();
    ctx.roundRect(x, 255, 42, 85, 18);
    ctx.fill();
  }
  ctx.beginPath();
  ctx.ellipse(255, 220, 130, 92, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(375, 170, 72, 0, Math.PI * 2);
  ctx.fill();
  ctx.lineWidth = 30;
  ctx.lineCap = "round";
  ctx.strokeStyle = blue;
  ctx.beginPath();
  ctx.moveTo(430, 195);
  ctx.quadraticCurveTo(470, 270, 440, 320);
  ctx.stroke();
  ctx.fillStyle = dark;
  ctx.beginPath();
  ctx.ellipse(340, 165, 40, 58, -0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#232531";
  ctx.beginPath();
  ctx.arc(405, 150, 9, 0, Math.PI * 2);
  ctx.fill();
  // "php" logo on the flank.
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.ellipse(225, 222, 70, 38, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#232531";
  ctx.font = 'italic 900 50px "Urbanist", "Arial Black", sans-serif';
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("php", 225, 220);
  ctx.font = '700 34px "Fira Code", monospace';
  ctx.fillStyle = "#4f5b93";
  ctx.fillText("elePHPant", ART_W / 2, 385);
};

const paintHello = (ctx: CanvasRenderingContext2D) => {
  const sky = ctx.createLinearGradient(0, 0, 0, ART_H);
  sky.addColorStop(0, "#ff9a5a");
  sky.addColorStop(0.6, "#ffcf7a");
  sky.addColorStop(1, "#fff1c9");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, ART_W, ART_H);
  ctx.fillStyle = "#ffffff";
  ctx.globalAlpha = 0.85;
  ctx.beginPath();
  ctx.arc(ART_W / 2, 250, 95, Math.PI, 0);
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.fillStyle = "#e8743b";
  ctx.fillRect(0, 250, ART_W, ART_H - 250);
  ctx.fillStyle = "#2b2d33";
  ctx.beginPath();
  ctx.roundRect(46, 70, ART_W - 92, 92, 18);
  ctx.fill();
  // Laid out word by word from measured widths, centred as a whole.
  ctx.font = '700 32px "Fira Code", monospace';
  ctx.textBaseline = "middle";
  ctx.textAlign = "left";
  const words: [string, string][] = [
    ["<?php ", "#c678dd"],
    ["echo ", "#61afef"],
    ["'¡Hola!';", "#98c379"],
  ];
  let x = (ART_W - words.reduce((sum, [word]) => sum + ctx.measureText(word).width, 0)) / 2;
  for (const [word, color] of words) {
    ctx.fillStyle = color;
    ctx.fillText(word, x, 116);
    x += ctx.measureText(word).width;
  }
  ctx.textAlign = "center";
  ctx.font = '800 40px "Urbanist", sans-serif';
  ctx.fillStyle = "#ffffff";
  ctx.fillText("¿Tomamos un café?", ART_W / 2, 330);
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
  const painters = [paintNight, paintElephpant, paintHello];
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
