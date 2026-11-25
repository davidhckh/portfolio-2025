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
// of confetti. The pictures cycle through the official Laravel, Symfony and
// FrankenPHP logos, then back to the original mountains.
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

// The official logos (Laravel mark + wordmark, Symfony's stacked logo, FrankenPHP's
// logo), served from public/frame/ and drawn onto each picture's canvas once loaded.
const loadImage = (src: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });

// Draws `img` fitted (contain) inside the box, centred in it.
const drawFit = (ctx: CanvasRenderingContext2D, img: HTMLImageElement, x: number, y: number, w: number, h: number) => {
  const k = Math.min(w / img.naturalWidth, h / img.naturalHeight);
  const dw = img.naturalWidth * k, dh = img.naturalHeight * k;
  ctx.drawImage(img, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
};

const base = import.meta.env.BASE_URL;
const ART = [
  {
    bg: "#ffffff",
    srcs: ["frame/laravel-mark.svg", "frame/laravel-wordmark.svg"],
    paint: (ctx: CanvasRenderingContext2D, [mark, word]: HTMLImageElement[]) => {
      drawFit(ctx, mark!, 0, 40, ART_W, 230);
      drawFit(ctx, word!, 96, 300, ART_W - 192, 80);
    },
  },
  {
    bg: "#ffffff",
    srcs: ["frame/symfony.svg"],
    paint: (ctx: CanvasRenderingContext2D, [logo]: HTMLImageElement[]) => drawFit(ctx, logo!, 0, 36, ART_W, ART_H - 72),
  },
  {
    bg: "#ffffff",
    srcs: ["frame/frankenphp.png"],
    paint: (ctx: CanvasRenderingContext2D, [logo]: HTMLImageElement[]) => drawFit(ctx, logo!, 24, 24, ART_W - 48, ART_H - 48),
  },
];

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
  ART.forEach(({ bg, srcs, paint }) => {
    const texture = canvasArt((ctx) => {
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, ART_W, ART_H);
    });
    artTextures.push(texture);
    Promise.all(srcs.map((src) => loadImage(base + src)))
      .then((imgs) => {
        paint((texture.image as HTMLCanvasElement).getContext("2d")!, imgs);
        texture.needsUpdate = true;
      })
      .catch(() => {});
  });
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
