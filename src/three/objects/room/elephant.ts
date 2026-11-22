import {
  Box3,
  CanvasTexture,
  Group,
  LinearFilter,
  LinearSRGBColorSpace,
  Mesh,
  ShaderMaterial,
  Sprite,
  SpriteMaterial,
  Vector3,
} from "three";
import gsap from "gsap";
import { raycast } from "../../utils/raycast";
import { planeGeometry } from "../../common/geometries";
import { resources } from "../../../utils/resources";
import { room } from ".";
import { animateElephpant, createElephpant, type Elephpant } from "./elephpant";
import { sceneWeights } from "../../../animations/scenes";
import { prefersReducedMotion } from "../../../utils/motion";
import vertexShader from "../../shaders/heart/vertex.glsl";
import fragmentShader from "../../shaders/heart/fragment.glsl";
import { playSound } from "../../../features/sounds/utils/sounds";

import type { ClickableBox3 } from "../../types";

// The elePHPant on the desk: idles with small signs of life (trunk sway, ear flaps,
// blinks, tail wag) and, when clicked, hops, raises its trunk and puffs out code
// symbols along with the heart.

let mesh: Mesh | null = null; // placeholder from room.glb (hidden), gives the spot
let model: Group | null = null; // wrapper that is positioned/scaled on the desk
let rig: Elephpant | null = null;
let box3: ClickableBox3 | null = null;
let heart: Mesh | null = null;
let heartMaterial: ShaderMaterial | null = null;
let isJumping = false;
let initialized = false;
let trumpet = 0; // 0..1, how far the trunk is raised (click reaction)
let earFlare = 0; // 0..1, ears spread (click reaction)
const symbols: Sprite[] = [];

const init = (_mesh: Mesh) => {
  mesh = _mesh;
  if (initialized) return;
  initialized = true;

  mesh.visible = false;
  initModel();
  initHeart();
  initSymbols();

  box3 = new Box3().setFromObject(model ?? mesh);
  box3.onClick = handleClick;
  box3.hoverSound = "hover";
  raycast.boxesToCheck.push(box3);
};

const initModel = () => {
  if (!mesh) return;
  rig = createElephpant(resources.items["matcap-white"], resources.items["matcap-black"]);
  model = new Group();
  model.name = "elephpant-wrapper";
  model.add(rig.group);
  fitModelToPlaceholder();
  room.group.add(model);
};

const fitModelToPlaceholder = () => {
  if (!mesh || !model) return;
  const targetBox = new Box3().setFromObject(mesh);
  const targetSize = new Vector3();
  const targetCenter = new Vector3();
  targetBox.getSize(targetSize);
  targetBox.getCenter(targetCenter);

  // Three-quarter view: flank (with the logo) and face both towards the camera.
  model.rotation.set(0, -Math.PI * 0.12, 0);
  model.scale.setScalar(1);
  model.updateMatrixWorld(true);
  const modelSize = new Vector3();
  new Box3().setFromObject(model).getSize(modelSize);
  model.scale.setScalar((targetSize.y / modelSize.y) * 1.4);
  model.updateMatrixWorld(true);

  const fitted = new Box3().setFromObject(model);
  const fittedCenter = new Vector3();
  fitted.getCenter(fittedCenter);
  model.position.x += targetCenter.x - fittedCenter.x;
  model.position.y += targetBox.min.y - fitted.min.y;
  model.position.z += targetCenter.z - fittedCenter.z;
  // Brought forward, in front of the pencil holder with a gap, so the holder never
  // covers it at any viewport width.
  model.position.x -= 0.2;
  model.position.z += 0.55;
};

const initHeart = () => {
  if (!mesh) return;
  const texture = resources.items["icon-spritesheet"];
  texture.colorSpace = LinearSRGBColorSpace;
  texture.generateMipmaps = false;
  texture.minFilter = LinearFilter;
  texture.magFilter = LinearFilter;

  heartMaterial = new ShaderMaterial({
    vertexShader,
    fragmentShader,
    transparent: true,
    uniforms: { uTexture: { value: texture }, uProgress: { value: 0 } },
  });
  heart = new Mesh(planeGeometry, heartMaterial);
  heart.position.copy(mesh.position);
  heart.position.x += 0.1;
  heart.position.y += 0.4;
  heart.position.z += 0.1;
  heart.visible = false;
  room.group.add(heart);
};

// Small code glyphs puffed out of the trunk on click.
const SYMBOLS = ["<?php", "$", "{ }", "=>", ";"];
const initSymbols = () => {
  for (const text of SYMBOLS) {
    const canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 128;
    const ctx = canvas.getContext("2d")!;
    ctx.font = '700 64px "Fira Code", ui-monospace, monospace';
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.lineWidth = 16;
    ctx.strokeStyle = "#ffffff";
    ctx.strokeText(text, 128, 64);
    ctx.fillStyle = "#3d4780";
    ctx.fillText(text, 128, 64);
    const texture = new CanvasTexture(canvas);
    texture.colorSpace = LinearSRGBColorSpace;
    const sprite = new Sprite(new SpriteMaterial({ map: texture, transparent: true, depthTest: false }));
    sprite.renderOrder = 20;
    sprite.visible = false;
    room.group.add(sprite);
    symbols.push(sprite);
  }
};

const puffSymbols = (tl: gsap.core.Timeline) => {
  if (!rig) return;
  const tip = new Vector3();
  rig.trunk[rig.trunk.length - 1]!.getWorldPosition(tip);
  room.group.worldToLocal(tip);
  // Three random glyphs, fanned out and floating up while fading.
  const picks = [...symbols].sort(() => Math.random() - 0.5).slice(0, 3);
  picks.forEach((sprite, i) => {
    const material = sprite.material as SpriteMaterial;
    const spread = (i - 1) * 0.22;
    tl.set(sprite, { visible: true }, 0.15 + i * 0.07);
    tl.fromTo(
      sprite.position,
      { x: tip.x, y: tip.y + 0.1, z: tip.z },
      { x: tip.x + spread, y: tip.y + 0.55 + Math.random() * 0.15, z: tip.z + spread * 0.5, duration: 1.1, ease: "power2.out" },
      0.15 + i * 0.07,
    );
    tl.fromTo(sprite.scale, { x: 0.08, y: 0.04 }, { x: 0.46, y: 0.23, duration: 0.35, ease: "back.out(2)" }, 0.15 + i * 0.07);
    tl.fromTo(material, { opacity: 1 }, { opacity: 0, duration: 0.45, ease: "power1.in" }, 0.85 + i * 0.07);
    tl.set(sprite, { visible: false }, 1.35 + i * 0.07);
  });
};

const handleClick = () => {
  if (isJumping || !model || !rig) return;
  isJumping = true;
  playSound("click");

  const tl = gsap.timeline({ onComplete: () => (isJumping = false) });
  const baseY = model.position.y;

  // Hop with a squash on landing.
  tl.to(model.position, { y: baseY + 0.18, duration: 0.22, ease: "power2.out" }, 0);
  tl.to(model.position, { y: baseY, duration: 0.2, ease: "power2.in" }, 0.22);
  tl.to(rig.group.scale, { y: 0.9, x: 1.06, z: 1.06, duration: 0.08, ease: "power1.out" }, 0.42);
  tl.to(rig.group.scale, { y: 1, x: 1, z: 1, duration: 0.25, ease: "back.out(3)" }, 0.5);
  // Rear up a little, trunk raised and ears spread: the trumpet pose.
  tl.to(rig.body.rotation, { z: 0.18, duration: 0.25, ease: "power2.out" }, 0);
  tl.to(rig.body.rotation, { z: 0, duration: 0.4, ease: "power2.inOut" }, 0.55);
  const pose = { trumpet, earFlare };
  tl.to(pose, {
    trumpet: 1,
    earFlare: 1,
    duration: 0.25,
    ease: "power2.out",
    onUpdate: () => ({ trumpet, earFlare } = pose),
  }, 0);
  tl.to(pose, {
    trumpet: 0,
    earFlare: 0,
    duration: 0.6,
    ease: "power2.inOut",
    onUpdate: () => ({ trumpet, earFlare } = pose),
  }, 0.7);

  puffSymbols(tl);

  if (heart && heartMaterial?.uniforms.uProgress) {
    tl.set(heartMaterial.uniforms.uProgress, { value: 0 }, 0);
    tl.set(heart, { visible: true }, 0);
    tl.to(heartMaterial.uniforms.uProgress, { value: 1, duration: 0.8, ease: "power2.out" }, 0);
  }
};

const tick = () => {
  if (!mesh || !box3) return;
  box3.setFromObject(model ?? mesh);
  box3.expandByScalar(0.15);

  if (heart && heartMaterial?.uniforms.uProgress) {
    const progress = heartMaterial.uniforms.uProgress.value;
    heart.visible = progress > 0.001 && progress < 0.999;
  }

  if (rig && sceneWeights.hero > 0.001)
    animateElephpant(rig, gsap.ticker.time, prefersReducedMotion.value, trumpet, earFlare);
};

const destroy = () => {
  if (box3) {
    const index = raycast.boxesToCheck.indexOf(box3);
    if (index !== -1) raycast.boxesToCheck.splice(index, 1);
  }
  if (model) room.group.remove(model);
  if (heart) room.group.remove(heart);
  symbols.forEach((sprite) => room.group.remove(sprite));
  symbols.length = 0;
  model = null;
  rig = null;
  heart = null;
  heartMaterial = null;
  box3 = null;
  mesh = null;
  initialized = false;
};

export const elephant = { init, tick, destroy };
