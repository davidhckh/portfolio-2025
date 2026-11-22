import { resources } from "../../../utils/resources";
import { BufferAttribute, LinearSRGBColorSpace, Mesh, RepeatWrapping, ShaderMaterial, Vector2, Vector4 } from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { room } from ".";
import fragmentShader from "../../shaders/desktops/fragment.glsl";
import vertexShader from "../../shaders/desktops/vertex.glsl";
import gsap from "gsap";
import { sceneWeights } from "../../../animations/scenes";
import { animations as avatarAnimations } from "../avatar/animations";
import { leftDesktop as avatarLeftDesktop } from "../avatar/left-desktop";
import { watch } from "vue";
import { codeEditor, createCodeEditor } from "./code-editor";
import { leftScreenSnippets } from "../../../content/code-snippets";
import { prefersReducedMotion } from "../../../utils/motion";

import type { Object3D, Material, BufferGeometry } from "three";

let mesh: Mesh | null = null;
let material: Material | null = null;
let geometry: BufferGeometry | null = null;

let messageTween: gsap.core.Tween | null = null;

// The left monitor (the one by the pencil holder) runs its own editor: silent, and
// typing whenever the room is on screen. Canvas height from that screen's UV rect
// (0.5 × 0.354 in the atlas ≈ 1.41:1).
const leftEditor = createCodeEditor(leftScreenSnippets, { height: 725, sound: false });
let stopMotionWatch: (() => void) | null = null;

const uniforms = {
  uMessageIntensity: { value: 0 },
};

// The developer only types while the hero is on screen and the avatar is seated at
// this keyboard (not waving, not turned to the left desktop) — same rule the old
// random code-scroll used.
const isTypingActive = () => {
  if (sceneWeights.hero < 0.95) return false;
  const idleAction = avatarAnimations.actions.get("desktop-idle");
  if (!idleAction || idleAction.weight < 0.95) return false;
  return !avatarLeftDesktop.getIsActive();
};

const init = () => {
  setupMesh();
  // Reduced motion: the finished file and test run, static. Otherwise live typing.
  stopMotionWatch = watch(
    prefersReducedMotion,
    (reduce) => {
      if (reduce) {
        codeEditor.showStill();
        leftEditor.showStill();
      } else {
        codeEditor.start();
        leftEditor.start();
      }
    },
    { immediate: true },
  );
};

const setupMesh = () => {
  const resource = resources.items["room-model"];

  const desktop1 = resource.scene.children.find((child: Object3D) => child.name === "desktop-plane-0");
  const desktop2 = resource.scene.children.find((child: Object3D) => child.name === "desktop-plane-1");

  desktop1.geometry.translate(desktop1.position);
  desktop2.geometry.translate(desktop2.position);

  // Add scrollIntensity attribute to geometries
  const scrollIntensity1 = new Float32Array(desktop1.geometry.attributes.position.count).fill(1);
  const scrollIntensity2 = new Float32Array(desktop2.geometry.attributes.position.count).fill(0);
  desktop1.geometry.setAttribute("scrollIntensity", new BufferAttribute(scrollIntensity1, 1));
  desktop2.geometry.setAttribute("scrollIntensity", new BufferAttribute(scrollIntensity2, 1));

  // add messageIntensity attribute to geometries
  const messageIntensity1 = new Float32Array(desktop1.geometry.attributes.position.count).fill(0);
  const messageIntensity2 = new Float32Array(desktop2.geometry.attributes.position.count).fill(1);
  desktop1.geometry.setAttribute("messageIntensity", new BufferAttribute(messageIntensity1, 1));
  desktop2.geometry.setAttribute("messageIntensity", new BufferAttribute(messageIntensity2, 1));

  geometry = mergeGeometries([desktop1.geometry, desktop2.geometry]);

  const texture = resources.items["desktops-texture"];
  texture.colorSpace = LinearSRGBColorSpace;
  texture.flipY = false;
  texture.wrapS = RepeatWrapping;
  texture.wrapT = RepeatWrapping;

  // The editor canvas covers the right monitor's rect in the atlas, which starts at
  // UV (0,0) — measure its far corner so the shader can stretch the canvas over it.
  const uv = desktop1.geometry.attributes.uv;
  const uvScale = new Vector2(0, 0);
  for (let i = 0; i < uv.count; i++) {
    uvScale.x = Math.max(uvScale.x, uv.getX(i));
    uvScale.y = Math.max(uvScale.y, uv.getY(i));
  }

  // The left monitor's rect in the atlas (doesn't start at 0,0): min corner + size.
  const uvLeft = desktop2.geometry.attributes.uv;
  const leftMin = new Vector2(Infinity, Infinity);
  const leftMax = new Vector2(-Infinity, -Infinity);
  for (let i = 0; i < uvLeft.count; i++) {
    leftMin.min(new Vector2(uvLeft.getX(i), uvLeft.getY(i)));
    leftMax.max(new Vector2(uvLeft.getX(i), uvLeft.getY(i)));
  }

  material = new ShaderMaterial({
    fragmentShader,
    vertexShader,
    uniforms: {
      uTexture: { value: texture },
      uEditor: { value: codeEditor.init(isTypingActive) },
      uEditorUvScale: { value: uvScale },
      uEditorLeft: { value: leftEditor.init(() => sceneWeights.hero >= 0.95) },
      uEditorLeftRect: { value: new Vector4(leftMin.x, leftMin.y, leftMax.x - leftMin.x, leftMax.y - leftMin.y) },
      ...uniforms,
    },
  });

  mesh = new Mesh(geometry, material);

  room.group.add(mesh);
};

const showMessage = () => {
  if (messageTween) messageTween.kill();
  messageTween = gsap.fromTo(uniforms.uMessageIntensity, { value: 1 }, { value: 0, duration: 1, delay: 2 });
};

const destroy = () => {
  material?.dispose();
  material = null;
  geometry?.dispose();
  geometry = null;
  mesh = null;
  stopMotionWatch?.();
  stopMotionWatch = null;
  codeEditor.destroy();
  leftEditor.destroy();
  messageTween?.kill();
  messageTween = null;
};

export const desktops = { init, destroy, showMessage };
