import {
  Box3,
  CanvasTexture,
  Group,
  LinearFilter,
  LinearSRGBColorSpace,
  Mesh,
  MeshBasicMaterial,
  MeshMatcapMaterial,
  PlaneGeometry,
  ShaderMaterial,
  Vector3,
} from "three";
import { raycast } from "../../utils/raycast";
import { planeGeometry } from "../../common/geometries";
import { resources } from "../../../utils/resources";
import { room } from ".";
import gsap from "gsap";
import { watch } from "vue";
import { prefersReducedMotion } from "../../../utils/motion";
import vertexShader from "../../shaders/heart/vertex.glsl";
import fragmentShader from "../../shaders/heart/fragment.glsl";
import { playSound } from "../../../features/sounds/utils/sounds";

import type { ClickableBox3 } from "../../types";
import type { GLTF } from "three/examples/jsm/loaders/GLTFLoader.js";

let mesh: Mesh | null = null;
let model: Group | null = null;
let box3: ClickableBox3 | null = null;
let heart: Mesh | null = null;
let heartMaterial: ShaderMaterial | null = null;
let elephantShader: any = null;
let isJumping = false;
let initialized = false;
let textPulse: gsap.core.Tween | null = null;
let stopPulseWatch: (() => void) | null = null;
const targetSize = new Vector3();
const modelSize = new Vector3();
const targetCenter = new Vector3();
const modelCenter = new Vector3();

const init = (_mesh: Mesh) => {
  mesh = _mesh;

  if (initialized) return;
  initialized = true;

  mesh.visible = false;

  initModel();
  initHeart();

  box3 = new Box3().setFromObject(model ?? mesh);
  box3.onClick = handleClick;
  box3.hoverSound = "hover";

  raycast.boxesToCheck.push(box3);
};

const initModel = () => {
  if (!mesh) return;

  model = createElephantModel();
  if (!model) {
    mesh.visible = true;
    return;
  }

  model.name = "elephant-model";

  fitModelToPlaceholder();
  room.group.add(model);
};

const createElephantModel = () => {
  const resource = resources.items["elephant-model"] as GLTF | undefined;
  if (!resource) return null;

  const elephant = new Group();
  const scene = resource.scene.clone(true);

  // We use a Matcap material to reveal the model's geometry details (wrinkles, contours) 
  // even without lights in the scene.
  const matcapTexture = resources.items["matcap-white"];
  const customMaterial = new MeshMatcapMaterial({ 
    color: 0x8f7af2, 
    matcap: matcapTexture 
  });

  customMaterial.onBeforeCompile = (shader) => {
    shader.uniforms.uBend = { value: 0 };
    elephantShader = shader;

    shader.vertexShader = shader.vertexShader.replace(
      '#include <common>',
      `#include <common>
      uniform float uBend;`
    );
    shader.vertexShader = shader.vertexShader.replace(
      '#include <begin_vertex>',
      `#include <begin_vertex>
      // Apply a smooth bend using a curved mathematical function.
      // - mask restricts the bend mainly to the front (where the trunk is) and higher up.
      // - The bend affects the Y (up) and Z (backwards) axes more prominently for the trunk.
      float distXZ = length(position.xz);
      
      // Calculate a localized mask specifically for the "front" (trunk/face area):
      // X < -0.3 is roughly where the trunk starts out front.
      float trunkMask = smoothstep(-0.2, -0.6, position.x) * smoothstep(0.4, 1.8, position.y);
      
      // Lift the trunk up (Y axis) and curl it back towards the head (X axis)
      transformed.y += uBend * trunkMask * 1.5;
      transformed.x += uBend * trunkMask * 0.8; 
      
      // A tiny bit of side-shake or ear wiggle from the general mask
      float headMask = smoothstep(0.5, 1.5, position.y);
      transformed.z += sin(position.y * 10.0 + uBend * 5.0) * (uBend * 0.1) * headMask;`
    );
  };

  scene.traverse((child) => {
    if (!(child as Mesh).isMesh) return;
    (child as Mesh).castShadow = true;
    (child as Mesh).receiveShadow = true;
    (child as Mesh).material = customMaterial;
  });

  // Create "PHP" texture dynamically
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext("2d")!;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = "900 160px Arial, sans-serif";
  ctx.fillStyle = "#ffffff";
  ctx.shadowColor = "rgba(0,0,0,0.5)";
  ctx.shadowBlur = 10;
  ctx.shadowOffsetX = 4;
  ctx.shadowOffsetY = 4;
  ctx.fillText("PHP", 256, 128);

  const textTexture = new CanvasTexture(canvas);
  textTexture.colorSpace = LinearSRGBColorSpace;
  const textMaterial = new MeshBasicMaterial({ 
    map: textTexture, 
    transparent: true,
    alphaTest: 0.05,
    depthTest: false // Ensures it renders on top of the curved body
  });

  scene.updateMatrixWorld(true);
  const box = new Box3().setFromObject(scene);
  const size = new Vector3();
  const center = new Vector3();
  box.getSize(size);
  box.getCenter(center);

  const isXLong = size.x > size.z;
  const length = isXLong ? size.x : size.z;
  const width = isXLong ? size.z : size.x;
  
  const textGeom = new PlaneGeometry(length * 0.55, length * 0.25);
  const textMesh1 = new Mesh(textGeom, textMaterial);
  const textMesh2 = new Mesh(textGeom, textMaterial);

  // Put text on both flanks so it's visible regardless of side, repositioned to the upper back (lomo)
  const yPos = center.y + size.y * 0.25; // moved up from 0.05 to 0.25 to sit high on the belly/lower back
  if (isXLong) {
    textMesh1.position.set(center.x, yPos, center.z + width * 0.5 + 0.05);
    textMesh1.rotation.y = 0;
    
    textMesh2.position.set(center.x, yPos, center.z - width * 0.5 - 0.05);
    textMesh2.rotation.y = Math.PI;
  } else {
    textMesh1.position.set(center.x + width * 0.5 + 0.05, yPos, center.z);
    textMesh1.rotation.y = Math.PI / 2;
    
    textMesh2.position.set(center.x - width * 0.5 - 0.05, yPos, center.z);
    textMesh2.rotation.y = -Math.PI / 2;
  }
  
  // High renderOrder so it draws after the body if depthTest is false
  textMesh2.renderOrder = 10;

  // Efecto de pálpito (respiración) continuo en los textos para invitar a la interacción
  textPulse = gsap.to([textMesh1.scale, textMesh2.scale], {
    x: 1.15,
    y: 1.15,
    duration: 1.2,
    ease: "sine.inOut",
    yoyo: true,
    repeat: -1,
  });
  // Reduced motion: no endless pulse; the text rests at its normal size.
  stopPulseWatch = watch(
    prefersReducedMotion,
    (reduce) => {
      if (!textPulse) return;
      if (reduce) textPulse.pause(0);
      else textPulse.resume();
    },
    { immediate: true },
  );

  scene.add(textMesh1);
  scene.add(textMesh2);

  elephant.add(scene);
  normalizeModel(scene);

  return elephant;
};

const normalizeModel = (object: Group) => {
  object.updateMatrixWorld(true);

  const box = new Box3().setFromObject(object);
  box.getCenter(modelCenter);

  object.position.x -= modelCenter.x;
  object.position.z -= modelCenter.z;
  object.position.y -= box.min.y;
};

const fitModelToPlaceholder = () => {
  if (!mesh || !model) return;

  const targetBox = new Box3().setFromObject(mesh);

  // Perfil inclinado para que se vea el lomo y el texto PHP
  model.rotation.set(0, Math.PI * 0.6, 0);
  model.scale.setScalar(1);
  model.updateMatrixWorld(true);

  const modelBox = new Box3().setFromObject(model);

  targetBox.getSize(targetSize);
  targetBox.getCenter(targetCenter);
  modelBox.getSize(modelSize);

  const scale = targetSize.y / modelSize.y;

  model.scale.setScalar(scale * 1.5);
  model.position.copy(mesh.position);

  const fittedBox = new Box3().setFromObject(model);
  fittedBox.getCenter(modelCenter);

  model.position.x += targetCenter.x - modelCenter.x;
  model.position.y += targetBox.min.y - fittedBox.min.y;
  model.position.z += targetCenter.z - modelCenter.z;
  
  // Bring it forward and slightly left so it doesn't clip into the pencil holder
  model.position.x -= 0.25;
  model.position.z += 0.20;
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
    uniforms: {
      uTexture: { value: texture },
      uProgress: { value: 0 },
    },
  });

  heart = new Mesh(planeGeometry, heartMaterial);
  heart.position.copy(mesh.position);
  heart.position.x += 0.1;
  heart.position.y += 0.4;
  heart.position.z += 0.1;
  heart.visible = false;

  room.group.add(heart);
};

const handleClick = () => {
  const target = model ?? mesh;
  if (isJumping || !target) return;
  isJumping = true;

  const tl = gsap.timeline();

  playSound("click");

  tl.add(() => {
    isJumping = false;
  }, 0.8);

  tl.to(
    target.position,
    {
      y: target.position.y + 0.18,
      duration: 0.2,
      ease: "power2.out",
      yoyo: true,
      repeat: 1,
    },
    0,
  );

  tl.to(
    target.scale,
    {
      y: target.scale.y * 1.05,
      duration: 0.2,
      ease: "power2.out",
      yoyo: true,
      repeat: 1,
    },
    0,
  );

  // Simulate trunk movement and trumpeting (barritar)
  tl.to(
    target.rotation,
    {
      x: target.rotation.x - 0.2, // Rears up slightly
      duration: 0.3,
      ease: "power2.out",
      yoyo: true,
      repeat: 1,
    },
    0,
  );

  // Shader animation to bend the trunk up like a trumpet!
  if (elephantShader) {
    tl.to(
      elephantShader.uniforms.uBend,
      {
        value: 1.0, // Flex intensity
        duration: 0.3,
        ease: "power2.out",
        yoyo: true,
        repeat: 1,
      },
      0
    );
  }

  if (heart && heartMaterial && heartMaterial.uniforms.uProgress) {
    tl.set(heartMaterial.uniforms.uProgress, { value: 0 }, 0);
    tl.set(heart, { visible: true }, 0);
    tl.to(
      heartMaterial.uniforms.uProgress,
      {
        value: 1,
        duration: 0.8,
        ease: "power2.out",
      },
      0,
    );
    tl.set(heartMaterial.uniforms.uProgress, { value: 1 });
  }
};

const tick = () => {
  if (!mesh || !box3) return;

  box3.setFromObject(model ?? mesh);
  box3.expandByScalar(0.15);

  if (heart && heartMaterial && heartMaterial.uniforms.uProgress) {
    const progress = heartMaterial.uniforms.uProgress.value;
    heart.visible = progress > 0.001 && progress < 0.999;
  }
};

const destroy = () => {
  if (box3) {
    const index = raycast.boxesToCheck.indexOf(box3);
    if (index !== -1) raycast.boxesToCheck.splice(index, 1);
  }
  if (model) room.group.remove(model);
  if (heart) room.group.remove(heart);

  stopPulseWatch?.();
  stopPulseWatch = null;
  textPulse?.kill();
  textPulse = null;
  model = null;
  heart = null;
  heartMaterial = null;
  elephantShader = null;
  box3 = null;
  mesh = null;
};

export const elephant = { init, tick, destroy };
