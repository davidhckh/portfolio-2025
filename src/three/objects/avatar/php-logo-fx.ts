import {
  AdditiveBlending,
  Box3,
  CanvasTexture,
  SRGBColorSpace,
  Sprite,
  SpriteMaterial,
  Vector3,
  type Camera,
  type MeshBasicMaterial,
  type Object3D,
} from "three";
import { prefersReducedMotion } from "../../../utils/motion";

// Makes the "php" logo on the avatar's shirt stand out in the About section:
// - a light sweep that crosses it diagonally every few seconds (a glossy shine),
// - a soft blue halo behind it that slowly "breathes".
// Both are still under reduced motion, and follow the logo's own opacity, so they
// fade with it during the desk -> About turn and the hologram dissolve.

const SHINE_EVERY = 3.6; // seconds between sweeps
const SHINE_DURATION = 0.9;

const uniforms = {
  uShine: { value: -10 }, // band position across the logo, -2..2 while sweeping
  uCenter: { value: new Vector3() }, // logo centre in view space
  uHalf: { value: 0.3 }, // logo half-width, world units
  uGlow: { value: 0 },
};

let halo: Sprite | null = null;
const viewCenter = new Vector3();
const worldCenter = new Vector3();
// The logo's visual centre in its own local space. Not its origin: the GLB declares
// stale accessor min/max, so the centring done from that box is off; measured here
// from the actual vertices instead.
const localCenter = new Vector3();

const haloTexture = () => {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 128;
  const ctx = canvas.getContext("2d")!;
  // Radial gradient squashed into the logo's oval shape.
  ctx.setTransform(1, 0, 0, 0.5, 0, 0);
  const gradient = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
  // Clear in the middle so it rings the oval instead of washing out the letters.
  gradient.addColorStop(0, "rgba(60, 150, 255, 0)");
  gradient.addColorStop(0.4, "rgba(60, 150, 255, 0)");
  gradient.addColorStop(0.55, "rgba(70, 165, 255, 0.85)");
  gradient.addColorStop(0.75, "rgba(40, 130, 255, 0.3)");
  gradient.addColorStop(1, "rgba(20, 100, 255, 0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 256, 256);
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
};

// Patches the logo's material with the sweep. The band is measured in view space
// around the logo's centre, so it works whatever the logo mesh's own axes are.
const init = (material: MeshBasicMaterial, parent: Object3D, logo: Object3D, logoHalfWidth: number) => {
  uniforms.uHalf.value = logoHalfWidth;
  logo.updateMatrixWorld(true);
  new Box3().setFromObject(logo, true).getCenter(localCenter);
  logo.worldToLocal(localCenter);
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "#include <common>\nvarying vec3 vViewPos;")
      .replace("#include <project_vertex>", "#include <project_vertex>\nvViewPos = mvPosition.xyz;");
    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        `#include <common>
        varying vec3 vViewPos;
        uniform float uShine;
        uniform vec3 uCenter;
        uniform float uHalf;
        uniform float uGlow;`,
      )
      .replace(
        "#include <color_fragment>",
        `#include <color_fragment>
        vec2 p = (vViewPos.xy - uCenter.xy) / uHalf;
        float t = p.x + p.y * 0.6; // slanted band
        float band = 1.0 - smoothstep(0.0, 0.32, abs(t - uShine));
        diffuseColor.rgb *= 1.0 + uGlow * 0.18;
        diffuseColor.rgb = mix(diffuseColor.rgb, vec3(1.0), band * 0.8);`,
      );
  };
  material.needsUpdate = true;

  halo = new Sprite(
    new SpriteMaterial({ map: haloTexture(), transparent: true, depthTest: false, depthWrite: false, blending: AdditiveBlending }),
  );
  halo.renderOrder = 39; // just under the logo (40)
  halo.frustumCulled = false;
  halo.scale.set(logoHalfWidth * 4.4, logoHalfWidth * 2.6, 1);
  halo.visible = false;
  parent.add(halo);
};

const update = (logo: Object3D, camera: Camera, opacity: number, time: number) => {
  const still = prefersReducedMotion.value;

  logo.updateMatrixWorld();
  worldCenter.copy(localCenter);
  logo.localToWorld(worldCenter);
  viewCenter.copy(worldCenter).applyMatrix4(camera.matrixWorldInverse);
  uniforms.uCenter.value.copy(viewCenter);

  const cycle = time % SHINE_EVERY;
  uniforms.uShine.value = still || cycle > SHINE_DURATION ? -10 : -2.2 + (cycle / SHINE_DURATION) * 4.4;
  const breath = still ? 0.5 : 0.5 + 0.5 * Math.sin(time * 2.4);
  uniforms.uGlow.value = breath;

  if (halo) {
    halo.visible = logo.visible && opacity > 0.01;
    halo.position.copy(worldCenter);
    (halo.material as SpriteMaterial).opacity = opacity * (0.38 + 0.27 * breath);
    halo.scale.y = uniforms.uHalf.value * (2.5 + 0.2 * breath);
    halo.scale.x = uniforms.uHalf.value * (4.3 + 0.35 * breath);
  }
};

const hide = () => {
  if (halo) halo.visible = false;
};

export const phpLogoFx = { init, update, hide };
