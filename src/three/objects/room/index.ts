import { resources } from "../../../utils/resources";
import { scene } from "../../core/scene";
import { Euler, Group, Mesh } from "three";
import { getRoomMaterial } from "../../common/materials";
import { sceneWeights } from "../../../animations/scenes";
import gsap from "gsap";
import { shadow } from "./shadow";
import { desktops } from "./desktops";
import { mouse } from "./mouse";
import { messagePopup } from "./message-popup";
import { elephant } from "./elephant";
import { music } from "./music";
import { babyElephant } from "./baby-elephant";
import { rubik } from "./rubik";
import { books } from "./books";
import { plant } from "./plant";
import { frame } from "./frame";

import type { Object3D } from "three";

const group = new Group();
const chairScrollRotation = new Euler();

let objects: {
  blackboard: Mesh;
  carpet: Mesh;
  chair: Mesh;
  frame: Mesh;
  elephant: Mesh;
  "elephant-trunk": Mesh;
  mouse: Mesh;
  music: Mesh;
  plant: Mesh;
  room: Mesh;
  shelf: Mesh;
} | null = null;

const init = () => {
  gsap.ticker.add(tick);
  initObjects();
  shadow.init();
  desktops.init();
  messagePopup.init();
  if (objects?.mouse) mouse.init(objects.mouse);
  if (objects?.elephant) elephant.init(objects.elephant);

  if (objects?.music) music.init(objects.music);

  babyElephant.init(objects?.carpet ?? null, objects?.chair ?? null);
  if (objects?.room) rubik.init(group, objects.room);
  if (objects?.shelf) books.init(group, objects.shelf);
  if (objects?.plant) plant.init(objects.plant);
  if (objects?.frame) frame.init(objects.frame);
};

const initObjects = () => {
  if (objects) return;
  const resource = resources.items["room-model"];
  
  let elephantObject: any =
    resource.scene.children.find((child: Object3D) => child.name === "elephant") ??
    resource.scene.children.find((child: Object3D) => child.name === "penguin");

  if (!elephantObject) return;

  const elephantChildren = elephantObject.children || [];
  objects = {
    blackboard: resource.scene.children.find((child: Object3D) => child.name === "blackboard"),
    carpet: resource.scene.children.find((child: Object3D) => child.name === "carpet"),
    chair: resource.scene.children.find((child: Object3D) => child.name === "chair"),
    frame: resource.scene.children.find((child: Object3D) => child.name === "frame"),
    elephant: elephantObject,
    "elephant-trunk": elephantChildren.find((child: Object3D) => child.name === "elephant-trunk"),
    mouse: resource.scene.children.find((child: Object3D) => child.name === "mouse"),
    music: resource.scene.children.find((child: Object3D) => child.name === "music"),
    plant: resource.scene.children.find((child: Object3D) => child.name === "plant"),
    room: resource.scene.children.find((child: Object3D) => child.name === "room"),
    shelf: resource.scene.children.find((child: Object3D) => child.name === "shelf"),
  };

  Object.values(objects).forEach((object) => {
    if (!object) return;
    const mat = getRoomMaterial();
    
    if (object.type === "Group" || object.type === "Scene") {
      object.traverse((child: any) => {
        if (child.isMesh) child.material = mat;
      });
    } else {
      (object as any).material = mat;
    }

    group.add(object as any);

    if (object.name === "carpet") {
      object.renderOrder = -10;
      object.onBeforeRender = () => {
        mat.depthWrite = false;
      };

      object.onAfterRender = () => {
        mat.depthWrite = true;
      };
    }
  });

  scene.instance.add(group);
};

const tick = () => {
  group.visible = sceneWeights.hero > 0.001;

  if (objects?.chair) {
    objects.chair.rotation.copy(chairScrollRotation);
  }

  elephant.tick();
  music.tick();
  babyElephant.tick();
  rubik.tick();
  plant.tick();
  frame.tick();
};

const destroy = () => {
  gsap.ticker.remove(tick);
  shadow.destroy();
  //group.clear();
  //objects = null;
  desktops.destroy();
  mouse.destroy();
  elephant.destroy();
  music.destroy();
  babyElephant.destroy();
  rubik.destroy();
  books.destroy();
  frame.destroy();
};

export const room = { init, destroy, group, chairScrollRotation };
