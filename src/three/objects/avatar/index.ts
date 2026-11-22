import { resources } from "../../../utils/resources";
import {
  Box3,
  Mesh,
  Vector3,
  Euler,
  Group,
  ShaderMaterial,
  LinearSRGBColorSpace,
  MeshBasicMaterial,
  MeshMatcapMaterial,
  Matrix4,
  AnimationMixer,
} from "three";
import { scene } from "../../core/scene";
import { animations } from "./animations";
import { sceneWeights, sceneWeightsInOut } from "../../../animations/scenes";
import { clone as cloneSkeleton } from "three/examples/jsm/utils/SkeletonUtils.js";
import { face } from "./face";
import { leftDesktop as avatarLeftDesktop } from "./left-desktop";
import { createGlasses } from "./glasses";
import { createAccessoryHologramMaterial } from "./accessory-hologram-material";
import { createSiteLogo } from "./site-logo";
import matcapVertexShader from "../../shaders/avatar-matcap/vertex.glsl";
import matcapFragmentShader from "../../shaders/avatar-matcap/fragment.glsl";
import headVertexShader from "../../shaders/avatar-head/vertex.glsl";
import headFragmentShader from "../../shaders/avatar-head/fragment.glsl";
import gsap from "gsap";
import { aboutProgress } from "../../../animations/transitions/about";
import { camera } from "../../core/camera";
//import { avatarHologram } from "./hologram";

import type { Material, Bone, Texture, AnimationClip, Object3D } from "three";

let mesh: Mesh | null = null;
let rightHandBone: Bone | null = null;
let phpLogo: Group | null = null;
let glasses: Group | null = null;
let glassesMaterial: MeshMatcapMaterial | null = null;
let glassesHologram: Group | null = null;
let glassesHologramMaterial: ShaderMaterial | null = null;
let phpLogoHologram: Group | null = null;
let phpLogoHologramMaterial: ShaderMaterial | null = null;
let contactLogo: Group | null = null;

const tIdleIntensity = { value: 0 };

const waypointsPosition = new Vector3();
const waypointsRotation = new Euler();
const transform = new Group();
const uniforms = { uProgress: { value: 0 }, uAmbientStrength: { value: 0 } };
const contactPosition = new Vector3(0, -13, 0);
const contactRotation = new Euler(0, -Math.PI, 0);
const phpLogoMaterial = new MeshBasicMaterial({ color: 0x1f88ff });

// Mirrors src/three/shaders/includes/avatar-progress/{vertex,fragment}.glsl: the
// avatar's own body materials dissolve bottom-to-top as `uniforms.uProgress` rises,
// by comparing a per-vertex world-Y-based "model progress" against it. Accessories
// like glasses/the chest logo use plain (non-shader) materials, so without this same
// math applied to their opacity they stayed fully solid while the body around them
// turned into a translucent hologram — this keeps them in sync.
const HOLOGRAM_SMOOTH_WIDTH = 0.002;

const getModelProgress = (worldY: number) => (worldY + 0.2) / 4.7;

const smoothstep = (edge0: number, edge1: number, x: number) => {
  const t = Math.min(Math.max((x - edge0) / (edge1 - edge0), 0), 1);
  return t * t * (3 - 2 * t);
};

const getHologramAlpha = (worldY: number) => {
  const progress = uniforms.uProgress.value;
  if (progress <= 0) return 1;
  return smoothstep(progress, progress + HOLOGRAM_SMOOTH_WIDTH, getModelProgress(worldY));
};

// Converts a one-off world-space nudge (e.g. "avatarSize.y * 0.095 above headBone")
// into a fixed position in headBone's own local space, using the bone's transform at
// the moment this runs (setupMesh, before any animation has played — i.e. bind pose).
// A world-space offset re-applied every frame doesn't rotate with the bone, so any
// animation that tilts the head (sleeping, wake-up, idle sway, ...) leaves it pointing
// the old way while the actual head has turned — the accessory drifts off the face.
// Parenting onto headBone with a local-space offset computed once, by contrast,
// tracks the bone rigidly forever after, the same way the skinned face/eyes do.
// Face accessories (glasses) need an offset scaled to the HEAD, not the
// whole body — using avatarSize (the full-body Box3 already computed for the chest
// logos) put them roughly 3 head-heights away from headBone's origin. That was hard
// to notice in the About pose specifically because headBone's rotation there is very
// close to identity, so the oversized offset still pointed "up" and happened to land
// near the face — but the same offset, rigidly rotated through any real head tilt
// (e.g. the sleeping pose), swings through a much wider arc than the small headBone
// pivot warrants and ends up floating well off the face.
const getHeadSize = (targetMesh: Mesh, avatarSize: Vector3): Vector3 => {
  const headMesh = targetMesh.getObjectByName("head") as Mesh | null;
  if (!headMesh) return new Vector3(avatarSize.x * 0.15, avatarSize.y * 0.1, avatarSize.z * 0.15);
  const headBox = new Box3().setFromObject(headMesh);
  const headSize = new Vector3();
  headBox.getSize(headSize);
  return headSize;
};

const worldOffsetToLocalPosition = (bone: Bone, worldOffset: Vector3): Vector3 => {
  const boneWorldPosition = new Vector3();
  bone.getWorldPosition(boneWorldPosition);
  const desiredWorldPosition = boneWorldPosition.add(worldOffset);
  const inverseBoneMatrix = new Matrix4().copy(bone.matrixWorld).invert();
  return desiredWorldPosition.applyMatrix4(inverseBoneMatrix);
};

const init = () => {
  setupMesh();
  animations.init();
  face.init();
  avatarLeftDesktop.init();
  gsap.ticker.add(tick);
};

const getMaterial = (name: string): Material | null => {
  if (name === "face") return face.getMaterial();
  if (name === "head") {
    const texture = resources.items["head-texture"];
    texture.flipY = false;
    texture.colorSpace = LinearSRGBColorSpace;
    texture.generateMipmaps = false;
    return new ShaderMaterial({
      vertexShader: headVertexShader,
      fragmentShader: headFragmentShader,
      transparent: true,
      uniforms: {
        uHeadTexture: { value: texture },
        ...uniforms,
      },
    });
  }

  const tex = resources.items["matcap-black"];
  tex.colorSpace = LinearSRGBColorSpace;
  tex.generateMipmaps = false;

  return new ShaderMaterial({
    vertexShader: matcapVertexShader,
    fragmentShader: matcapFragmentShader,
    transparent: true,
    uniforms: {
      uMatcap: { value: tex },
      ...uniforms,
    },
  });
};

const assignMatcap = (child: Mesh): boolean => {
  let tex: Texture | null = null;

  if (child.name === "black") {
    tex = resources.items["matcap-black"];
  } else if (child.name === "gray") {
    tex = resources.items["matcap-gray"];
  } else if (child.name === "skin") {
    tex = resources.items["matcap-skin"];
  } else if (child.name === "white") {
    tex = resources.items["matcap-white"];
  }

  if (tex) {
    tex.colorSpace = LinearSRGBColorSpace;
    child.userData.matcap = tex;
    return true;
  }

  return false;
};

const setupMesh = () => {
  if (mesh) return;
  const resource = resources.items["avatar-model"];
  mesh = cloneSkeleton(resource.scene.children[0]) as Mesh;

  mesh.frustumCulled = false;

  mesh.traverse((child) => {
    if (child instanceof Mesh) {
      const mat = getMaterial(child.name);
      if (!mat) return;
      child.material = mat;
      child.frustumCulled = false;
      child.renderOrder = child.name === "face" ? 25 : 24;

      const hasMatcap = assignMatcap(child);
      if (hasMatcap) {
        child.onBeforeRender = () => {
          child.material.uniforms.uMatcap.value = child.userData.matcap;
        };
      }
    }
  });

  const brain = mesh.getObjectByName("brain") as Mesh;
  if (brain) {
    mesh.remove(brain);
  }

  const avatarSize = attachPhpLogo();

  // Reset before the headBone-parented accessories below capture their local offset
  // (worldOffsetToLocalPosition) — they need mesh's final resting rotation, not
  // whatever the cloned skeleton's rotation.z happened to be beforehand.
  mesh.rotation.z = 0;
  mesh.updateMatrixWorld(true);

  if (avatarSize) {
    attachGlasses(avatarSize);
    attachContactLogo(avatarSize);
  }

  transform.add(mesh);

  rightHandBone = mesh.getObjectByName("bone-right-hand") as Bone;

  scene.instance.add(transform);
};

const attachGlasses = (avatarSize: Vector3) => {
  if (!mesh || glasses) return;

  const headBone = mesh.getObjectByName("headBone") as Bone | null;
  if (!headBone) return;

  // Plain (non-skinned) accessory: use the built-in matcap material instead of the
  // avatar's custom shader, which hard-requires a SkinnedMesh (boneMatX/skinWeight).
  const matcapTexture = resources.items["matcap-black"];
  matcapTexture.colorSpace = LinearSRGBColorSpace;
  matcapTexture.generateMipmaps = false;
  const material = new MeshMatcapMaterial({ matcap: matcapTexture });
  // dark-plane (the About-section vignette) is `transparent: true`, and three.js
  // always renders the whole transparent pass after the whole opaque pass regardless
  // of renderOrder — an opaque material here would get silently painted over by it
  // no matter how high renderOrder is set. attachPhpLogo hits the same thing below.
  material.transparent = true;
  // Head-scaled local offsets sit close to the actual skull surface, so ordinary
  // depth-testing against the head geometry hid most of this behind it, like
  // attachPhpLogo's chest logo needed for the shirt. Drawing it as a "decal" on top
  // regardless of depth is far more robust than chasing an exact-enough offset.
  material.depthTest = false;
  material.depthWrite = false;

  // Skinned meshes don't move with their bones as far as Object3D.matrixWorld is
  // concerned (that's a GPU-side vertex deformation) — a sub-mesh's own bounding box
  // reflects the bind pose only, not where it actually ends up on screen. headBone
  // is a real scene-graph node, so its matrixWorld is reliable; use its world
  // position as the anchor. `avatarSize` is passed in from attachPhpLogo's own
  // Box3 measurement instead of computing a second one here — an extra
  // Box3().setFromObject(mesh) at this point (mesh still parentless, skeleton not
  // yet posed) was throwing off every *later* measurement of mesh too, including
  // the PHP logo's, in a way that isn't obviously connected to this function at all.
  glasses = createGlasses(avatarSize, material);
  glassesMaterial = material;
  // Parented directly onto headBone instead of living at scene-level with a
  // world-space position recomputed every tick — see worldOffsetToLocalPosition's
  // comment. This is what makes it track the head rigidly through every animation,
  // exactly like the skinned eyes/face do. The actual local offset isn't set here —
  // see positionFaceAccessories, called once the skeleton has struck its first real
  // pose, which this runs well before (setupMesh, still in bind/rest pose).
  headBone.add(glasses);

  // A second, identically-shaped copy in the same additive-blended "hologram" shader
  // the avatar's own body uses underneath itself (see avatarHologram/hologram.ts) —
  // revealed by that shader's own math as the solid copy above dissolves, instead of
  // just fading to nothing. Parented alongside the solid copy so the two automatically
  // stay in sync with no per-frame position copying needed.
  glassesHologramMaterial = createAccessoryHologramMaterial();
  glassesHologram = createGlasses(avatarSize, glassesHologramMaterial);
  headBone.add(glassesHologram);
};

const worldPositionScratch = new Vector3();
const toCameraScratch = new Vector3();

// The avatar faces the camera in the About pose at transform.rotation.y = -PI; on the
// way there from the desk (hero -> about) it turns through ~130°. This is how far it
// still is from that pose.
const ABOUT_ROTATION_Y = -Math.PI;
const getTurnFromAbout = () => transform.rotation.y - ABOUT_ROTATION_Y;

// 0..1, how squarely the front of the body faces the camera from `worldPosition`.
// The glasses and chest logo draw with depthTest off (decals, see attachGlasses), so
// nothing hides them when the avatar turns away: mid-turn the glasses showed through
// the back of the head and the logo floated off the arm. They fade with this instead,
// and are fully shown once the avatar faces the camera (unchanged About/contact look).
const getFrontFacing = (worldPosition: Vector3, from = 0.55, to = 0.85) => {
  const turn = getTurnFromAbout();
  camera.instance.getWorldPosition(toCameraScratch).sub(worldPosition);
  toCameraScratch.y = 0;
  toCameraScratch.normalize();
  // Body forward in world space at this turn: +Z in the About pose, rotated by `turn`.
  const dot = Math.sin(turn) * toCameraScratch.x + Math.cos(turn) * toCameraScratch.z;
  return smoothstep(from, to, dot);
};

const updateGlasses = () => {
  if (!glasses) return;

  // Same reveal condition as the chest logos, so everything appears together instead
  // of the glasses popping in early during the hero -> about transition. Shown in
  // both the about and contact poses.
  const shouldShow = sceneWeights.about > 0.15 || sceneWeights.contact > 0.15;
  glasses.visible = shouldShow;
  if (glassesHologram) glassesHologram.visible = shouldShow;
  if (!shouldShow) return;

  if (glassesMaterial) {
    glasses.getWorldPosition(worldPositionScratch);
    // The contact pose has its own fixed rotation (not the About one), facing camera.
    // Later than the logo: while the body finishes turning, the head lags behind and
    // the frame read off the face, so they also wait for the About pose to settle.
    const facing =
      sceneWeights.contact > 0.001
        ? 1
        : getFrontFacing(worldPositionScratch, 0.8, 0.95) * smoothstep(0.62, 0.74, sceneWeights.about);
    glassesMaterial.opacity = getHologramAlpha(worldPositionScratch.y) * facing;
    glasses.visible = facing > 0.001;
  }

  if (glassesHologramMaterial) {
    glassesHologramMaterial.uniforms.uProgress!.value = uniforms.uProgress.value;
    glassesHologramMaterial.uniforms.uTime!.value = gsap.ticker.time;
  }
};

// A throwaway clone of the rig, posed to frame 0 of the "idle" clip and never added
// to any scene — used only to compute a deterministic reference pose for
// positionFaceAccessories below. See its comment for why this exists: measuring off
// the live, currently-rendering mesh/mixer instead (bind pose, "whichever pose the
// first tick happens to land on", or even "the resting idle pose" sampled at an
// arbitrary moment) all turned out to give a different, wrong-looking offset on
// every reload — desktop-idle loops continuously (LoopPingPong), so "settled into
// idle" still means "at some arbitrary, unrepeatable point in that loop" unless a
// specific frame of it is pinned down explicitly, as this does.
const buildCalibrationHead = (): { headBone: Bone; mesh: Object3D } | null => {
  const resource = resources.items["avatar-model"];
  const calibrationMesh = cloneSkeleton(resource.scene.children[0]) as Object3D;
  calibrationMesh.rotation.z = 0;

  const idleClip = resource.animations.find((clip: AnimationClip) => clip.name === "idle");
  if (idleClip) {
    const calibrationMixer = new AnimationMixer(calibrationMesh);
    calibrationMixer.clipAction(idleClip).play();
    calibrationMixer.setTime(0);
  }

  calibrationMesh.updateMatrixWorld(true);
  const headBone = calibrationMesh.getObjectByName("headBone") as Bone | null;
  return headBone ? { headBone, mesh: calibrationMesh } : null;
};

let faceAccessoriesPositioned = false;

// glasses are parented onto headBone in attachGlasses (during setupMesh), but its
// local offset is computed here instead — against buildCalibrationHead's isolated,
// deterministic pose rather than the live mesh/mixer, and so no longer
// timing-dependent at all. A *local* offset, once computed, is valid regardless of
// which posed instance of the rig it's measured against (that's the whole point of
// local space) — so calibrating against a throwaway clone and applying the result
// to the live headBone is exactly correct, not an approximation.
const positionFaceAccessories = () => {
  if (faceAccessoriesPositioned || !glasses) return;

  const calibration = buildCalibrationHead();
  if (!calibration) return;

  faceAccessoriesPositioned = true;

  const avatarBox = new Box3().setFromObject(calibration.mesh);
  const avatarSize = new Vector3();
  avatarBox.getSize(avatarSize);
  const headSize = getHeadSize(calibration.mesh as Mesh, avatarSize);

  glasses.position.copy(
    worldOffsetToLocalPosition(calibration.headBone, new Vector3(0, headSize.y * 0.2, headSize.z * 0.3)),
  );
  glassesHologram?.position.copy(glasses.position);
};

const attachPhpLogo = (): Vector3 | null => {
  if (!mesh || phpLogo) return null;

  const resource = resources.items["php-logo-model"];
  if (!resource) return null;

  const avatarBox = new Box3().setFromObject(mesh);
  const avatarSize = new Vector3();
  avatarBox.getSize(avatarSize);

  const frontLogo = new Group();
  const logoScene = resource.scene.clone(true) as Group;
  frontLogo.name = "php-logo-front";

  // This particular GLB (an auto-generated "image to STL" export, per its own
  // asset.generator metadata) doesn't follow glTF's Y-up convention: its raw vertex
  // data runs the "php" wordmark's height along Z and its thin extrusion depth along
  // Y — confirmed by inspecting the actual buffer, not just the (as it turns out,
  // stale/wrong) min/max the file declares for those accessors. Loaded as-is it lies
  // flat, thin-side up, instead of standing upright facing the camera. Rotating 90°
  // around X swaps those two axes back to the expected "tall in Y, thin in Z".
  // Doing this *before* measuring the box below matters — measuring first and
  // rotating the group after fits the scale to the wrong (still-flat) footprint.
  logoScene.rotation.x = Math.PI / 2;
  logoScene.updateMatrixWorld(true);

  const logoBox = new Box3().setFromObject(logoScene);
  const logoSize = new Vector3();
  const logoCenter = new Vector3();
  logoBox.getSize(logoSize);
  logoBox.getCenter(logoCenter);
  logoScene.position.sub(logoCenter);
  frontLogo.add(logoScene);

  // Uniform: a single scale factor keeps the model's own proportions intact, sized
  // by whichever dimension (width or height) is tighter relative to the chest target.
  const chestWidth = avatarSize.x * 0.22;
  const chestHeight = avatarSize.y * 0.1;
  const scale = Math.min(chestWidth / Math.max(logoSize.x, 0.0001), chestHeight / Math.max(logoSize.y, 0.0001)) * 0.55;

  const styleLogo = (object: Group) => {
    object.traverse((child) => {
      if (!(child instanceof Mesh)) return;

      child.frustumCulled = false;
      child.renderOrder = 40;
      child.material = phpLogoMaterial;

      const material = child.material as any;
      if (material) {
        material.transparent = true;
        material.depthTest = false;
        material.depthWrite = false;
        material.side = 2;
      }
    });
  };

  styleLogo(frontLogo);

  frontLogo.scale.setScalar(scale);

  scene.instance.add(frontLogo);
  phpLogo = frontLogo;

  // Same "revealed by the hologram shader as the solid copy dissolves" double used
  // for the glasses above, built from a second clone of the same logo model.
  const hologramLogoScene = resource.scene.clone(true) as Group;
  hologramLogoScene.rotation.x = Math.PI / 2;
  hologramLogoScene.updateMatrixWorld(true);
  hologramLogoScene.position.sub(logoCenter);
  phpLogoHologramMaterial = createAccessoryHologramMaterial();

  const frontLogoHologram = new Group();
  frontLogoHologram.name = "php-logo-front-hologram";
  frontLogoHologram.add(hologramLogoScene);
  frontLogoHologram.traverse((child) => {
    if (!(child instanceof Mesh)) return;
    child.frustumCulled = false;
    child.material = phpLogoHologramMaterial;
  });
  frontLogoHologram.scale.setScalar(scale);

  scene.instance.add(frontLogoHologram);
  phpLogoHologram = frontLogoHologram;

  return avatarSize;
};

const tick = () => {
  animations.update();
  positionFaceAccessories();

  const isContact = sceneWeights.contact > 0.001;

  if (isContact) {
    transform.position.copy(contactPosition);
    transform.rotation.copy(contactRotation);
    uniforms.uProgress.value = 0;
    uniforms.uAmbientStrength.value = 0;
    transform.visible = true;
    updatePhpLogo();
    updateGlasses();
    updateContactLogo();
    return;
  }

  transform.position.copy(waypointsPosition);
  transform.rotation.copy(waypointsRotation);
  updatePhpLogo();
  updateGlasses();
  updateContactLogo();

  //uniforms.uProgress.value = sceneWeightsInOut.about.in * 1.1 - 0.1;
  uniforms.uProgress.value = aboutProgress.value * 1.1 - 0.1;
  uniforms.uAmbientStrength.value = sceneWeightsInOut.about.in;

  if (!mesh) return;
  if (uniforms.uProgress.value > 0.999 && sceneWeights.contact > 0.99) {
    mesh.visible = false;
  } else {
    mesh.visible = true;
  }
};

const contactLogoMaterial = new MeshBasicMaterial({ color: 0xffffff });

const attachContactLogo = (avatarSize: Vector3) => {
  if (!mesh || contactLogo) return;

  const logo = createSiteLogo(contactLogoMaterial);
  contactLogoMaterial.transparent = true;
  contactLogoMaterial.depthTest = false;
  contactLogoMaterial.depthWrite = false;
  contactLogoMaterial.side = 2;

  const logoBox = new Box3().setFromObject(logo);
  const logoSize = new Vector3();
  const logoCenter = new Vector3();
  logoBox.getSize(logoSize);
  logoBox.getCenter(logoCenter);
  logo.position.sub(logoCenter);

  const frontLogo = new Group();
  frontLogo.name = "contact-logo-front";
  frontLogo.add(logo);

  const chestWidth = avatarSize.x * 0.16;
  const chestHeight = avatarSize.y * 0.07;
  const scale = Math.min(chestWidth / Math.max(logoSize.x, 0.0001), chestHeight / Math.max(logoSize.y, 0.0001));
  frontLogo.scale.setScalar(scale);

  scene.instance.add(frontLogo);
  contactLogo = frontLogo;
};

const updateContactLogo = () => {
  if (!mesh || !contactLogo) return;

  const showLogo = sceneWeights.contact > 0.15;
  contactLogo.visible = showLogo;
  if (!showLogo) return;

  // Anchored to the upper-spine bone instead of mesh's own Box3 (as it was
  // originally, matching attachPhpLogo/updatePhpLogo's approach) — that box recomputes
  // from the current pose every tick, and it turned out not to be as stable as it
  // looked in a single static screenshot: it visibly drifted while scrolling within
  // the contact section. A bone position doesn't have that problem (same reasoning
  // that already applies to the glasses' headBone anchor).
  const chestBone = mesh.getObjectByName("spine2Bone") as Bone | null;
  if (!chestBone) return;

  transform.updateMatrixWorld(true);
  mesh.updateMatrixWorld(true);

  chestBone.getWorldPosition(contactLogo.position);
  contactLogo.position.z += 0.5;
};

const updatePhpLogo = () => {
  if (!mesh || !phpLogo) return;

  const showLogo = sceneWeights.about > 0.15 && sceneWeights.contact < 0.001;
  phpLogo.visible = showLogo;
  if (phpLogoHologram) phpLogoHologram.visible = showLogo;
  if (!showLogo) return;

  // Anchored to the chest bone instead of avatarBox.max-based math (same fix as
  // updateContactLogo below needed for the same reason): a box-extent-derived offset
  // is fragile — it silently broke at some point, ending up positioned well above the
  // head — where a bone anchor is a stable, direct reference to the actual chest.
  const chestBone = mesh.getObjectByName("spine2Bone") as Bone | null;
  if (!chestBone) return;

  transform.updateMatrixWorld(true);
  mesh.updateMatrixWorld(true);

  // The offset in front of the chest turns with the body: it used to be a fixed world
  // +Z nudge, which only lines up in the About pose — mid-turn it left the logo
  // floating beside the arm. Unchanged in the About pose itself (turn = 0).
  const turn = getTurnFromAbout();
  chestBone.getWorldPosition(phpLogo.position);
  phpLogo.position.y -= 0.3;
  phpLogo.position.x += Math.sin(turn) * 0.5;
  phpLogo.position.z += Math.cos(turn) * 0.5;
  phpLogo.rotation.y = turn;
  const facing = getFrontFacing(phpLogo.position);
  phpLogoMaterial.opacity = getHologramAlpha(phpLogo.position.y) * facing;
  phpLogo.visible = facing > 0.001;

  if (phpLogoHologram && phpLogoHologramMaterial) {
    phpLogoHologram.position.copy(phpLogo.position);
    phpLogoHologram.rotation.copy(phpLogo.rotation);
    phpLogoHologramMaterial.uniforms.uProgress!.value = uniforms.uProgress.value;
    phpLogoHologramMaterial.uniforms.uTime!.value = gsap.ticker.time;
  }
};

const destroy = () => {
  //mesh = null;
  //transform.clear();
  face.destroy();
  gsap.ticker.remove(tick);

  phpLogo = null;
  phpLogoHologram = null;
  glasses = null;
  glassesHologram = null;
  contactLogo = null;
};

export const avatar = {
  init,
  destroy,
  getMesh: () => mesh,
  getRightHandBone: () => rightHandBone,
  tIdleIntensity,
  waypointsPosition,
  waypointsRotation,
  uniforms,
  transform,
};
