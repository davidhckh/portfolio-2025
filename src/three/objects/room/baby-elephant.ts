import { resources } from "../../../utils/resources";
import {
  AnimationAction,
  AnimationMixer,
  AnimationUtils,
  Box3,
  Group,
  LoopRepeat,
  Mesh,
  MeshBasicMaterial,
  Object3D,
  PropertyBinding,
  Vector3,
} from "three";
import { clone as cloneSkeleton } from "three/examples/jsm/utils/SkeletonUtils.js";
import gsap from "gsap";
import { sceneWeights } from "../../../animations/scenes";
import { room } from ".";
import { prefersReducedMotion } from "../../../utils/motion";
import { sizes } from "../../../utils/sizes";

import type { MeshStandardMaterial } from "three";

// The GLB ships a single 18.2 s "performance" clip, not a loopable walk cycle:
//   0–1.3 s idle · 1.3–6.8 s walks forward · 6.8–8.2 s stops ·
//   8.2–14 s walks back WITHOUT turning around · 14–18.2 s idle.
// Playing it whole while GSAP moves the model at a constant speed made the elephant
// glide with still legs (~7 s of every 18) and moonwalk during the backwards phase.
// Instead we cut two seamless loops out of it (frame numbers at the clip's 30 fps;
// keys sit at 0.075 + k/30 s, hence the fractional offsets):
// - WALK: exactly one stride at cruise speed (5.175 → 6.108 s). First and last pose
//   match (summed per-bone quaternion error 0.007) and hip height matches too, so it
//   loops without a pop. The hip advances HIP_STRIDE units during that stride.
// - IDLE: the closing rest pose (14.975 → 18.208 s), which also loops cleanly.
const CLIP_FPS = 30;
const WALK_FRAMES = { start: 155, end: 184 } as const;
const IDLE_FRAMES = { start: 449, end: 547 } as const;
const HIP_STRIDE = 103.67;

// Patrol timings (seconds).
const RAMP = 0.5; // accelerate / decelerate at each end instead of starting at full speed
const PAUSE = 1.2; // rest at each end of the carpet
const TURN = 1.1; // 180° turn, always via facing the camera

// `root` is what GSAP moves/turns; `model` (the rig) sits inside it, offset so the
// hip lands on root's origin. The rig's mesh is authored ~258 units away from its own
// origin (the hip's rest translation), so rotating the rig directly swung the body
// around a far-off pivot: it jumped sideways at every turn and sat on opposite sides
// of the walk line depending on heading (off the rug one way, off-screen the other).
let root: Group | null = null;
let model: Group | null = null;
let mixer: AnimationMixer | null = null;
let walkAction: AnimationAction | null = null;
let idleAction: AnimationAction | null = null;
let walkTimeline: gsap.core.Timeline | null = null;

// The clip bakes forward locomotion into the hip's Z translation (a ~520-unit swing).
// GSAP already drives the forward motion, so only Z is pinned back to rest after each
// mixer update — X/Y stay live to keep the natural side sway and bob of the gait.
let hipBone: Object3D | null = null;
let hipRestZ = 0;

// Model-space walking speed (room.group units/s) that matches the stride, so feet
// don't slide; and the previous frame's transform, to derive actual velocity.
let walkSpeed = 0;
let prevX = 0;
let prevRotY = 0;
let gait = 0; // smoothed 0..1 "how much is it walking" factor

const startWalking = (bounds: { min: number; max: number }, z: number, y: number) => {
  if (!root) return;

  const distance = bounds.max - bounds.min;
  // A power1 ramp covering `rampDistance` ends exactly at walkSpeed, then cruises.
  const rampDistance = Math.min((walkSpeed * RAMP) / 2, distance / 3);
  const cruise = (distance - rampDistance * 2) / walkSpeed;

  const leg = (from: number, to: number) => {
    const dir = Math.sign(to - from);
    const tl = gsap.timeline();
    tl.to(root!.position, { x: from + dir * rampDistance, duration: RAMP, ease: "power1.in" });
    tl.to(root!.position, { x: to - dir * rampDistance, duration: cruise, ease: "none" });
    tl.to(root!.position, { x: to, duration: RAMP, ease: "power1.out" });
    return tl;
  };

  // Both turns pass through rotation.y = π (facing the camera; 0 shows its back), so
  // the elephant always turns towards the viewer: π/2 → 3π/2 and back.
  walkTimeline = gsap.timeline({ repeat: -1 });
  walkTimeline.set(root.position, { x: bounds.min, y, z });
  walkTimeline.set(root.rotation, { y: Math.PI / 2 });
  walkTimeline.add(leg(bounds.min, bounds.max));
  walkTimeline.to(root.rotation, { y: (3 * Math.PI) / 2, duration: TURN, ease: "power1.inOut" }, `+=${PAUSE / 2}`);
  walkTimeline.add(leg(bounds.max, bounds.min), `+=${PAUSE / 2}`);
  walkTimeline.to(root.rotation, { y: Math.PI / 2, duration: TURN, ease: "power1.inOut" }, `+=${PAUSE / 2}`);
  walkTimeline.to({}, { duration: PAUSE / 2 });

  prevX = bounds.min;
  prevRotY = Math.PI / 2;
};

// Converts the clip's hip stride into room.group units by pushing it through the
// bone's parent transform while the model is still unparented at the origin.
const measureWalkSpeed = (walkDuration: number) => {
  if (!model || !hipBone?.parent) return 0;
  model.updateMatrixWorld(true);
  const a = hipBone.position.clone().applyMatrix4(hipBone.parent.matrixWorld);
  const b = hipBone.position
    .clone()
    .add(new Vector3(0, 0, HIP_STRIDE))
    .applyMatrix4(hipBone.parent.matrixWorld);
  return a.distanceTo(b) / walkDuration;
};

const init = (carpet: Mesh | null, chair: Mesh | null) => {
  if (root) return;
  const resource = resources.items["baby-elephant-model"];
  if (!resource || !carpet) return;

  // Rigged model: a plain .clone(true) leaves the skinning bound to the original
  // skeleton and renders invisible — SkeletonUtils.clone relinks the bones.
  model = cloneSkeleton(resource.scene) as Group;
  model.name = "baby-elephant";

  // No lights in this scene: swap the PBR material for an unlit one keeping its map.
  model.traverse((child) => {
    if (!(child instanceof Mesh)) return;
    child.frustumCulled = false;
    const standardMaterial = child.material as MeshStandardMaterial;
    child.material = new MeshBasicMaterial({ map: standardMaterial.map });
  });

  const carpetBox = new Box3().setFromObject(carpet);
  const carpetSize = new Vector3();
  carpetBox.getSize(carpetSize);

  // Scaled relative to the carpet's footprint so it stays proportionate.
  model.updateMatrixWorld(true);
  const modelSize = new Vector3();
  new Box3().setFromObject(model).getSize(modelSize);
  model.scale.setScalar((carpetSize.x * 0.22) / (modelSize.y || 1));

  model.updateMatrixWorld(true);
  const scaledBox = new Box3().setFromObject(model);
  const scaledSize = new Vector3();
  scaledBox.getSize(scaledSize);

  // Walk along the visible near-camera edge of the rug (the middle is hidden behind
  // the desk). The desk-side end stops at 18% of the rug: closer than that it parks
  // under the desk, half hidden behind a leg (checked with headless screenshots). The
  // span is kept at least 2.2 body widths so it takes real strides instead of flipping
  // every second.
  const nearEdge = carpetBox.min.x + carpetSize.x * 0.18;
  let farEdge = carpetBox.min.x + carpetSize.x * 0.42;
  if (chair) {
    const chairBox = new Box3().setFromObject(chair);
    farEdge = Math.min(farEdge, chairBox.min.x - scaledSize.x * 0.6);
  }
  const bounds = {
    min: nearEdge,
    // Portrait gets a shorter span: on 360 px-wide phones the far end left the frame.
    max: sizes.isLandscape ? Math.max(farEdge, nearEdge + scaledSize.x * 2.2) : nearEdge + scaledSize.x * 1.8,
  };
  // Landscape: the near-camera edge of the rug. Portrait (phones): that edge runs off
  // the bottom-left of the frame, so walk through the middle of the rug instead — the
  // part the portrait hero camera actually shows (mapped with marker spheres).
  const walkZ = sizes.isLandscape
    ? carpetBox.max.z - carpetSize.z * 0.12
    : carpetBox.min.z + carpetSize.z * 0.5;
  // Rest the feet on the carpet's top surface (model is still at the origin here).
  const groundY = carpetBox.max.y - scaledBox.min.y;

  // GLTFLoader runs node names through PropertyBinding.sanitizeNodeName, which strips
  // ":" — the file's "Elephant_Baby:Mesh:Hip" is "Elephant_BabyMeshHip" at runtime.
  hipBone = model.getObjectByName(PropertyBinding.sanitizeNodeName("Elephant_Baby:Mesh:Hip")) ?? null;
  hipRestZ = hipBone?.position.z ?? 0;

  const clip = resource.animations[0];
  if (clip) {
    mixer = new AnimationMixer(model);
    const walkClip = AnimationUtils.subclip(clip, "walk", WALK_FRAMES.start, WALK_FRAMES.end, CLIP_FPS);
    const idleClip = AnimationUtils.subclip(clip, "idle", IDLE_FRAMES.start, IDLE_FRAMES.end, CLIP_FPS);
    walkAction = mixer.clipAction(walkClip);
    idleAction = mixer.clipAction(idleClip);
    for (const action of [walkAction, idleAction]) {
      action.setLoop(LoopRepeat, Infinity);
      action.play();
    }
    walkAction.setEffectiveWeight(1);
    idleAction.setEffectiveWeight(0);
    walkSpeed = measureWalkSpeed(walkClip.duration);
  }
  // Fallback if the rig changes and the stride can't be measured.
  if (!(walkSpeed > 0)) walkSpeed = scaledSize.x * 0.6;

  root = new Group();
  root.name = "baby-elephant-root";
  root.add(model);
  if (hipBone) {
    model.updateMatrixWorld(true);
    const hipWorld = hipBone.getWorldPosition(new Vector3());
    model.position.set(-hipWorld.x, 0, -hipWorld.z);
  }
  room.group.add(root);
  startWalking(bounds, walkZ, groundY);
};

const tick = () => {
  if (!root) return;

  const visible = sceneWeights.hero > 0.001;
  root.visible = visible;
  // Don't keep patrolling while off-screen, nor at all under reduced motion (it then
  // stands where it is and the gait blends to idle); resume where it left off.
  if (walkTimeline) {
    const shouldWalk = visible && !prefersReducedMotion.value;
    if (!shouldWalk && !walkTimeline.paused()) walkTimeline.pause();
    else if (shouldWalk && walkTimeline.paused()) walkTimeline.resume();
  }
  if (!visible || !mixer) return;

  const dt = gsap.ticker.deltaRatio(60) / 60;
  if (dt <= 0) return;

  // Drive the gait from the model's real motion: legs play at the rate it actually
  // moves (no sliding on the ramps) and blend into idle while paused. A turn in place
  // gets a slow shuffle so it doesn't spin on frozen feet.
  const linear = Math.abs(root.position.x - prevX) / dt / walkSpeed;
  const angular = Math.abs(root.rotation.y - prevRotY) / dt / ((2 * Math.PI) / TURN);
  prevX = root.position.x;
  prevRotY = root.rotation.y;
  const target = Math.min(1, Math.max(linear, Math.min(0.5, angular)));
  gait += (target - gait) * Math.min(1, dt * 12);

  if (walkAction && idleAction) {
    walkAction.setEffectiveWeight(gait);
    idleAction.setEffectiveWeight(1 - gait);
    walkAction.setEffectiveTimeScale(Math.max(gait, 0.05));
  }

  mixer.update(dt);
  if (hipBone) hipBone.position.z = hipRestZ;
};

const destroy = () => {
  walkTimeline?.kill();
  walkTimeline = null;
  mixer?.stopAllAction();
  mixer = null;
  walkAction = null;
  idleAction = null;
  root = null;
  model = null;
  hipBone = null;
  gait = 0;
};

export const babyElephant = { init, tick, destroy };
