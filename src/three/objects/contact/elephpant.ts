import { Box3, Group, Vector3 } from "three";
import gsap from "gsap";
import { resources } from "../../../utils/resources";
import { raycast } from "../../utils/raycast";
import { sceneWeights } from "../../../animations/scenes";
import { prefersReducedMotion } from "../../../utils/motion";
import { playSound } from "../../../features/sounds/utils/sounds";
import { animateElephpant, createElephpant, type Elephpant } from "../room/elephpant";

import type { ClickableBox3 } from "../../types";

// The cartoon elePHPant (same one as on the desk) standing on the floor next to the
// laptop in the contact section. Same idle life; a click makes it hop and trumpet.

let wrapper: Group | null = null;
let rig: Elephpant | null = null;
let box3: ClickableBox3 | null = null;
let busy = false;
const pose = { trumpet: 0, earFlare: 0 };

// `height` in the contact group's units; `position` on its floor (y = 0).
const init = (parent: Group, position: Vector3, rotationY: number, height: number) => {
  if (wrapper) return;
  rig = createElephpant(resources.items["matcap-white"], resources.items["matcap-black"]);
  wrapper = new Group();
  wrapper.name = "contact-elephpant";
  wrapper.add(rig.group);

  const size = new Vector3();
  new Box3().setFromObject(rig.group).getSize(size);
  wrapper.scale.setScalar(height / size.y);
  wrapper.position.copy(position);
  wrapper.rotation.y = rotationY;
  parent.add(wrapper);

  box3 = new Box3();
  box3.onClick = handleClick;
  box3.hoverSound = "hover";
  raycast.boxesToCheck.push(box3);
};

const handleClick = () => {
  if (busy || !wrapper || !rig) return;
  busy = true;
  playSound("click");
  const baseY = wrapper.position.y;
  const hop = wrapper.scale.y * 0.35;
  const tl = gsap.timeline({ onComplete: () => (busy = false) });
  tl.to(wrapper.position, { y: baseY + hop, duration: 0.22, ease: "power2.out" }, 0);
  tl.to(wrapper.position, { y: baseY, duration: 0.2, ease: "power2.in" }, 0.22);
  tl.to(rig.group.scale, { y: 0.9, x: 1.06, z: 1.06, duration: 0.08 }, 0.42);
  tl.to(rig.group.scale, { y: 1, x: 1, z: 1, duration: 0.25, ease: "back.out(3)" }, 0.5);
  tl.to(rig.body.rotation, { z: 0.18, duration: 0.25, ease: "power2.out" }, 0);
  tl.to(rig.body.rotation, { z: 0, duration: 0.4, ease: "power2.inOut" }, 0.55);
  tl.to(pose, { trumpet: 1, earFlare: 1, duration: 0.25, ease: "power2.out" }, 0);
  tl.to(pose, { trumpet: 0, earFlare: 0, duration: 0.6, ease: "power2.inOut" }, 0.7);
};

const tick = () => {
  if (!wrapper || !rig || !box3) return;
  // Refreshed every frame: a box measured once at init is stale (see room/frame.ts).
  box3.setFromObject(wrapper);
  box3.expandByScalar(0.1);
  if (sceneWeights.contact > 0.001)
    animateElephpant(rig, gsap.ticker.time, prefersReducedMotion.value, pose.trumpet, pose.earFlare);
};

const destroy = () => {
  if (box3) {
    const index = raycast.boxesToCheck.indexOf(box3);
    if (index !== -1) raycast.boxesToCheck.splice(index, 1);
  }
  wrapper?.removeFromParent();
  wrapper = null;
  rig = null;
  box3 = null;
};

export const contactElephpant = { init, tick, destroy };
