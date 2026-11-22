import { resources } from "../../../utils/resources";
import { Box3, Group, Mesh, MeshBasicMaterial, PlaneGeometry, SRGBColorSpace, Vector3 } from "three";
import { watch } from "vue";
import gsap from "gsap";
import { sceneWeights } from "../../../animations/scenes";
import { scene } from "../../core/scene";
import { getContactMaterial } from "../../common/materials";
import { shadow } from "./shadow";
import { createCodeEditor } from "../room/code-editor";
import { contactSnippets } from "../../../content/code-snippets";
import { prefersReducedMotion } from "../../../utils/motion";

import type { MeshStandardMaterial, Object3D } from "three";

const group = new Group();
group.position.set(1, -13, 0);
group.rotation.set(0, -0.8, 0);

let objects: {
  base: Mesh;
} | null = null;
let laptop: Group | null = null;
let stopMotionWatch: (() => void) | null = null;

// The laptop's screen face in the GLB's own space (normal +Z, measured from the mesh):
// x -1.271..1.278, y 0.269..1.747, at z -0.926. Aspect 1.725:1 → canvas 1024 × 594.
const SCREEN = { x: 0.0035, y: 1.008, z: -0.926 + 0.004, width: 2.549, height: 1.478 };
// Silent (nobody is at this keyboard) and only typing while the section is on screen.
const laptopEditor = createCodeEditor(contactSnippets, { height: 594, flipY: true, sound: false });

const init = () => {
  initObjects();
  initLaptop();
  shadow.init();
  gsap.ticker.add(tick);
};

const initObjects = () => {
  if (objects) return;
  const resource = resources.items["contact-model"];

  objects = {
    base: resource.scene.children.find((child: Object3D) => child.name === "base"),
  };

  Object.values(objects).forEach((object) => {
    const mat = getContactMaterial();
    object.material = mat;

    group.add(object);
  });

  scene.instance.add(group);
};

const initLaptop = () => {
  if (laptop) return;
  const resource = resources.items["laptop-model"];
  if (!resource) return;

  const model = resource.scene.clone(true) as Group;
  model.traverse((child) => {
    if (child instanceof Mesh) {
      child.frustumCulled = false;
      // This scene has no lights anywhere (everything else here uses unlit/matcap
      // materials for the same reason) — the model's authored MeshStandardMaterial
      // would render pure black without one, so swap in an unlit material that keeps
      // its diffuse texture/color but doesn't need a light to be visible.
      const standardMaterial = child.material as MeshStandardMaterial;
      child.material = new MeshBasicMaterial({
        map: standardMaterial.map,
        color: standardMaterial.color,
        transparent: standardMaterial.transparent,
        alphaTest: standardMaterial.alphaTest,
      });
    }
  });

  // Kept in its own group with the model re-centered at (0,0,0) inside it, so the
  // group's own .position below is a clean "where it sits on the ground" anchor
  // instead of being offset by wherever the model's own pivot happened to be authored.
  model.updateMatrixWorld(true);
  const box = new Box3().setFromObject(model);
  const size = new Vector3();
  const center = new Vector3();
  box.getSize(size);
  box.getCenter(center);
  model.position.x -= center.x;
  model.position.z -= center.z;
  model.position.y -= box.min.y;

  // Live code on the screen, as a plane over the screen face (child of the model, so
  // it shares its re-centring and scale).
  const screenTexture = laptopEditor.init(() => sceneWeights.contact > 0.5);
  screenTexture.colorSpace = SRGBColorSpace; // shown by an unlit material: true colours
  const screen = new Mesh(
    new PlaneGeometry(SCREEN.width, SCREEN.height),
    new MeshBasicMaterial({ map: screenTexture }),
  );
  screen.position.set(SCREEN.x, SCREEN.y, SCREEN.z);
  screen.frustumCulled = false;
  model.add(screen);
  stopMotionWatch = watch(
    prefersReducedMotion,
    (reduce) => (reduce ? laptopEditor.showStill() : laptopEditor.start()),
    { immediate: true },
  );

  laptop = new Group();
  laptop.name = "contact-laptop";
  laptop.add(model);

  // Sized relative to the "base" boxes/envelopes prop for a consistent scale, then
  // placed in the empty ground area to the left of the character (in this group's
  // rotated local space — verified visually, not derived from any named anchor).
  const baseSize = new Vector3();
  if (objects?.base) new Box3().setFromObject(objects.base).getSize(baseSize);
  const targetHeight = (baseSize.y || 1) * 0.55;
  const scale = targetHeight / (size.y || 1);
  laptop.scale.setScalar(scale);

  laptop.position.set(-3.2, 0, 1.6);
  laptop.rotation.y = Math.PI * 0.15;

  group.add(laptop);
};

const tick = () => {
  group.visible = sceneWeights.contact > 0.001;
};

const destroy = () => {
  gsap.ticker.remove(tick);
  shadow.destroy();
  stopMotionWatch?.();
  stopMotionWatch = null;
  laptopEditor.destroy();
};

export const contact = { init, tick, destroy, group };
