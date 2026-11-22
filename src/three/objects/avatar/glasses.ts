import { CylinderGeometry, Group, Mesh, TorusGeometry, Vector3 } from "three";

import type { Material } from "three";

const CYLINDER_UP = new Vector3(0, 1, 0);

// Orients a Y-aligned cylinder mesh along an arbitrary direction, centered between
// `from` and `from + direction * length`.
const alignCylinder = (mesh: Mesh, from: Vector3, direction: Vector3, length: number) => {
  mesh.position.copy(from).addScaledVector(direction, length / 2);
  mesh.quaternion.setFromUnitVectors(CYLINDER_UP, direction);
};

const LENS_SEGMENTS = 24;
const TUBE_SEGMENTS = 10;

const createRing = (radius: number, tube: number, material: Material) => {
  const mesh = new Mesh(new TorusGeometry(radius, tube, TUBE_SEGMENTS, LENS_SEGMENTS), material);
  mesh.frustumCulled = false;
  mesh.renderOrder = 26;
  return mesh;
};

// Builds a simple round-frame accessory sized off the whole avatar's world-space
// bounding box (standard X=left-right, Y=up-down, Z=depth). Children are positioned
// relative to local (0,0,0) so the returned group only needs its `.position` updated
// each frame (see updateGlasses in avatar/index.ts) to track the head bone.
// `lensScale` grows the rims around each eye without moving the eyes apart (the
// spacing already matches the face texture's eyes).
export const createGlasses = (avatarSize: Vector3, material: Material, lensScale = 1): Group => {
  const lensRadius = avatarSize.x * 0.028 * lensScale;
  const tube = avatarSize.x * 0.028 * 0.22 * Math.sqrt(lensScale);
  const eyeOffsetX = avatarSize.x * 0.05;

  const group = new Group();
  group.name = "glasses";

  const leftLens = createRing(lensRadius, tube, material);
  leftLens.position.set(-eyeOffsetX, 0, 0);
  group.add(leftLens);

  const rightLens = createRing(lensRadius, tube, material);
  rightLens.position.set(eyeOffsetX, 0, 0);
  group.add(rightLens);

  const bridgeLength = eyeOffsetX * 2 - lensRadius * 1.7;
  const bridge = new Mesh(new CylinderGeometry(tube, tube, Math.max(bridgeLength, tube), 8), material);
  bridge.rotation.z = Math.PI / 2;
  bridge.frustumCulled = false;
  bridge.renderOrder = 26;
  group.add(bridge);

  // Temple arms: from the outer rim of each lens, flaring outward and back toward
  // the ears — angled diagonally rather than running straight back (depth-aligned,
  // i.e. straight at the camera) so they actually read as a line from this angle
  // instead of foreshortening down to a dot.
  const armLength = lensRadius * 2.2;
  const armStartX = eyeOffsetX + lensRadius - tube * 0.4;
  const armGeometry = new CylinderGeometry(tube * 0.75, tube * 0.75, armLength, 8);

  const leftArm = new Mesh(armGeometry, material);
  alignCylinder(leftArm, new Vector3(-armStartX, 0, 0), new Vector3(-0.6, 0, -1).normalize(), armLength);
  leftArm.frustumCulled = false;
  leftArm.renderOrder = 26;
  group.add(leftArm);

  const rightArm = new Mesh(armGeometry, material);
  alignCylinder(rightArm, new Vector3(armStartX, 0, 0), new Vector3(0.6, 0, -1).normalize(), armLength);
  rightArm.frustumCulled = false;
  rightArm.renderOrder = 26;
  group.add(rightArm);

  return group;
};
