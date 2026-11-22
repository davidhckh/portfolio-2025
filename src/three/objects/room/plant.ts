import type { Mesh, MeshBasicMaterial } from "three";
import gsap from "gsap";
import { sceneWeights } from "../../../animations/scenes";
import { prefersReducedMotion } from "../../../utils/motion";

// The big plant by the desk sways gently, as if in a breeze. Only the leaves move:
// the bend grows with height above the pot's rim (y ≈ 0.88 in the mesh's space), so
// the pot stays put. Done in the vertex shader of its own copy of the room material.

const uniforms = { uTime: { value: 0 } };
let time = 0;

const init = (plant: Mesh) => {
  const material = (plant.material as MeshBasicMaterial).clone();
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = uniforms.uTime;
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "#include <common>\nuniform float uTime;")
      .replace(
        "#include <begin_vertex>",
        `#include <begin_vertex>
        float bend = smoothstep(0.88, 2.3, position.y);
        bend *= bend;
        // Slow sway plus a faster, smaller flutter that differs from leaf to leaf.
        transformed.x += (sin(uTime * 1.1 + position.y * 1.3) * 0.06
          + sin(uTime * 2.7 + position.z * 4.0) * 0.012) * bend;
        transformed.z += (cos(uTime * 0.9 + position.y * 1.1) * 0.045
          + sin(uTime * 3.1 + position.x * 4.0) * 0.01) * bend;`,
      );
  };
  plant.material = material;
};

const tick = () => {
  // Frozen (not reset) under reduced motion or while the room is off screen.
  if (sceneWeights.hero < 0.001 || prefersReducedMotion.value) return;
  time += gsap.ticker.deltaRatio(60) / 60;
  uniforms.uTime.value = time;
};

export const plant = { init, tick };
