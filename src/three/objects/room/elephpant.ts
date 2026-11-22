import {
  CanvasTexture,
  CapsuleGeometry,
  Group,
  LinearSRGBColorSpace,
  Mesh,
  MeshBasicMaterial,
  MeshMatcapMaterial,
  SphereGeometry,
  type Texture,
} from "three";

// A cartoon elePHPant (PHP's mascot) built from primitives, replacing the realistic
// AI-generated elephant GLB that clashed with the room's cartoon style. Chubby body,
// big round ears, a segmented trunk and stubby legs, in PHP's own #8892BF. Built from
// parts so it can move: ears flap, trunk sways and curls, eyes blink.
//
// Local space: head towards +X, up +Y, ~1.3 units tall; elephant.ts fits it to the
// room's placeholder.

export const PHP_BLUE = 0x8892bf;
const PHP_BLUE_DARK = 0x6c76a8;
const PHP_INK = 0x232531;

export type Elephpant = {
  group: Group;
  body: Group; // everything above the legs (bobs / rears up)
  ears: [Group, Group];
  trunk: Group[]; // joint chain, base first
  eyes: Group[];
  tail: Group;
};

const sphere = (radius: number, widthSegments = 28, heightSegments = 20) =>
  new SphereGeometry(radius, widthSegments, heightSegments);

// The official logo look: dark ink "php" in a light oval, drawn on a canvas and
// wrapped on a slice of sphere that hugs the body, so it follows the curve.
const logoTexture = () => {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext("2d")!;
  ctx.clearRect(0, 0, 512, 256);
  ctx.fillStyle = "#e9ebf5";
  ctx.beginPath();
  ctx.ellipse(256, 128, 236, 112, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.lineWidth = 10;
  ctx.strokeStyle = "#232531";
  ctx.stroke();
  ctx.fillStyle = "#232531";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = 'italic 900 150px "Urbanist", "Arial Black", sans-serif';
  ctx.fillText("php", 256, 120);
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = LinearSRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
};

export const createElephpant = (matcapWhite: Texture, matcapBlack: Texture): Elephpant => {
  const skin = new MeshMatcapMaterial({ color: PHP_BLUE, matcap: matcapWhite });
  const skinDark = new MeshMatcapMaterial({ color: PHP_BLUE_DARK, matcap: matcapWhite });
  const ink = new MeshMatcapMaterial({ color: PHP_INK, matcap: matcapBlack });
  const white = new MeshMatcapMaterial({ color: 0xffffff, matcap: matcapWhite });

  const group = new Group();
  group.name = "elephpant";

  // Legs: short and thick, with darker round "soles".
  const legGeometry = new CapsuleGeometry(0.15, 0.2, 6, 16);
  const soleGeometry = sphere(0.15, 16, 8);
  for (const [x, z] of [
    [0.3, 0.24],
    [0.3, -0.24],
    [-0.3, 0.24],
    [-0.3, -0.24],
  ] as const) {
    const leg = new Mesh(legGeometry, skin);
    leg.position.set(x, 0.24, z);
    group.add(leg);
    const sole = new Mesh(soleGeometry, skinDark);
    sole.scale.set(1, 0.25, 1);
    sole.position.set(x, 0.04, z);
    group.add(sole);
  }

  // Body pivots near the hips so rearing up lifts the front.
  const body = new Group();
  body.position.set(-0.2, 0.35, 0);
  group.add(body);

  const torso = new Mesh(sphere(0.5), skin);
  torso.scale.set(1.2, 0.92, 0.95);
  torso.position.set(0.2, 0.28, 0);
  body.add(torso);

  // Logo on both flanks: a sphere slice slightly larger than the torso.
  const logoMaterial = new MeshBasicMaterial({ map: logoTexture(), transparent: true, alphaTest: 0.1 });
  for (const side of [1, -1]) {
    const patch = new Mesh(new SphereGeometry(0.505, 32, 16, -0.55, 1.1, Math.PI * 0.36, Math.PI * 0.28), logoMaterial);
    patch.scale.copy(torso.scale);
    patch.position.copy(torso.position);
    // SphereGeometry's phi=0 faces -X; turn the slice to face ±Z (the flanks).
    patch.rotation.y = side === 1 ? -Math.PI / 2 : Math.PI / 2;
    body.add(patch);
  }

  const tail = new Group();
  tail.position.set(-0.38, 0.38, 0);
  body.add(tail);
  const tailMesh = new Mesh(new CapsuleGeometry(0.03, 0.18, 4, 8), skinDark);
  tailMesh.position.set(-0.04, -0.09, 0);
  tailMesh.rotation.z = -0.5;
  tail.add(tailMesh);

  const head = new Group();
  head.position.set(0.72, 0.58, 0);
  body.add(head);
  const skull = new Mesh(sphere(0.38), skin);
  skull.scale.set(1, 0.95, 1);
  head.add(skull);

  // Ears: big flat discs hinged at the back of the head.
  const earGeometry = sphere(0.36, 24, 16);
  const ears = [1, -1].map((side) => {
    const hinge = new Group();
    hinge.position.set(-0.08, 0.06, side * 0.26);
    head.add(hinge);
    const ear = new Mesh(earGeometry, skin);
    ear.scale.set(0.75, 1, 0.16);
    ear.position.set(-0.12, 0.02, side * 0.12);
    ear.rotation.y = side * 0.55;
    hinge.add(ear);
    const inner = new Mesh(earGeometry, skinDark);
    inner.scale.set(0.55, 0.78, 0.1);
    inner.position.set(-0.08, 0.02, side * 0.17);
    inner.rotation.y = side * 0.55;
    hinge.add(inner);
    return hinge;
  }) as [Group, Group];

  // Eyes: ink with a white glint; the group squashes on Y to blink.
  const eyes = [1, -1].map((side) => {
    const eye = new Group();
    eye.position.set(0.3, 0.1, side * 0.17);
    head.add(eye);
    const ball = new Mesh(sphere(0.06, 16, 12), ink);
    eye.add(ball);
    const glint = new Mesh(sphere(0.018, 8, 6), white);
    glint.position.set(0.04, 0.025, side * 0.02);
    eye.add(glint);
    return eye;
  });

  // Trunk: a chain of joints, each holding a tapering capsule and the next joint, so
  // rotating every joint a little bends the whole trunk smoothly.
  const trunk: Group[] = [];
  let parent: Group = head;
  const segments = 5;
  const segmentLength = 0.13;
  for (let i = 0; i < segments; i++) {
    const joint = new Group();
    // rotation.z > 0 swings a hanging segment towards +X (forward).
    if (i === 0) {
      joint.position.set(0.3, -0.06, 0);
      joint.rotation.z = 0.35; // leaves the face pointing down and a bit forward
    } else {
      joint.position.set(0, -segmentLength, 0);
      joint.rotation.z = 0.14; // each segment curls a little further forward
    }
    parent.add(joint);
    const radius = 0.1 - i * 0.012;
    const piece = new Mesh(new CapsuleGeometry(radius, segmentLength, 4, 14), skin);
    piece.position.set(0, -segmentLength / 2, 0);
    joint.add(piece);
    trunk.push(joint);
    parent = joint;
  }
  // Rest curl, saved so animations can offset from it.
  trunk.forEach((joint) => (joint.userData.rest = joint.rotation.z));

  return { group, body, ears, trunk, eyes, tail };
};
