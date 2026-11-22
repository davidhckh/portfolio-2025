import { BufferGeometry, Points, ShaderMaterial, BufferAttribute, Color } from "three";
import vertexShader from "../../shaders/lab-particles/vertex.glsl";
import fragmentShader from "../../shaders/lab-particles/fragment.glsl";
import gsap from "gsap";
import { renderTarget } from "../../core/renderTarget";
import { lab } from ".";
import { aboutProgress } from "../../../animations/transitions/about";
import { prefersReducedMotion } from "../../../utils/motion";

let points: Points | null = null;
let material: ShaderMaterial | null = null;

const uniforms = {
  uTime: { value: 0 },
  uScaleMultiplier: { value: 1.0 },
};

const PARTICLE_COUNT = 50;

const init = () => {
  if (points) return;

  // Create geometry
  const geometry = new BufferGeometry();

  // Generate initial positions at bottom of cone
  const positions = new Float32Array(PARTICLE_COUNT * 3);
  const colors = new Float32Array(PARTICLE_COUNT * 3);
  const offsets = new Float32Array(PARTICLE_COUNT); // Offset for animation timing
  const angles = new Float32Array(PARTICLE_COUNT); // Initial angle
  const radii = new Float32Array(PARTICLE_COUNT); // Initial radius at bottom
  const speeds = new Float32Array(PARTICLE_COUNT); // Individual speed multiplier
  const drifts = new Float32Array(PARTICLE_COUNT * 2); // Horizontal drift (x, z)
  const noiseOffsets = new Float32Array(PARTICLE_COUNT * 3); // Noise offsets for organic movement
  const sizes = new Float32Array(PARTICLE_COUNT); // Individual size multiplier

  const blueColor = new Color(0.1, 0.808, 1.0); // Blue (similar to lab-shine color)

  const BOTTOM_RADIUS = 1.0;

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const i3 = i * 3;

    // Random angle and radius for circular distribution at bottom
    const angle = Math.random() * Math.PI * 2;
    const radius = Math.random() * BOTTOM_RADIUS;

    // Store initial angle and radius
    angles[i] = angle;
    radii[i] = radius;

    // Start at bottom of cone
    positions[i3] = Math.cos(angle) * radius; // x
    positions[i3 + 1] = 0.0; // y (start at bottom)
    positions[i3 + 2] = Math.sin(angle) * radius; // z

    // Random offset for animation timing (so particles don't all start together)
    offsets[i] = Math.random() * 4.0; // Wider range for more variation

    // Individual speed multiplier (0.7 to 1.3 for variation)
    speeds[i] = 0.7 + Math.random() * 0.6;

    // Horizontal drift (small random offsets)
    const driftAmount = 0.3;
    drifts[i * 2] = (Math.random() - 0.5) * driftAmount; // x drift
    drifts[i * 2 + 1] = (Math.random() - 0.5) * driftAmount; // z drift

    // Noise offsets for organic movement variation
    noiseOffsets[i * 3] = Math.random() * 100.0; // x noise offset
    noiseOffsets[i * 3 + 1] = Math.random() * 100.0; // y noise offset
    noiseOffsets[i * 3 + 2] = Math.random() * 100.0; // z noise offset

    // Individual size multiplier (0.6 to 1.4 for organic variation)
    sizes[i] = 0.6 + Math.random() * 0.8;

    // Blue with varying intensities
    const intensity = 0.5 + Math.random() * 0.5; // 0.5 to 1.0 for intensity variation
    const color = blueColor.clone().multiplyScalar(intensity);

    // Add slight hue variation for more organic feel
    const hueVariation = 0.05;
    color.r += (Math.random() - 0.5) * hueVariation;
    color.g += (Math.random() - 0.5) * hueVariation;
    color.b += (Math.random() - 0.5) * hueVariation;
    color.r = Math.max(0.0, Math.min(1.0, color.r));
    color.g = Math.max(0.0, Math.min(1.0, color.g));
    color.b = Math.max(0.0, Math.min(1.0, color.b));

    colors[i3] = color.r;
    colors[i3 + 1] = color.g;
    colors[i3 + 2] = color.b;
  }

  geometry.setAttribute("position", new BufferAttribute(positions, 3));
  geometry.setAttribute("color", new BufferAttribute(colors, 3));
  geometry.setAttribute("offset", new BufferAttribute(offsets, 1));
  geometry.setAttribute("angle", new BufferAttribute(angles, 1));
  geometry.setAttribute("radius", new BufferAttribute(radii, 1));
  geometry.setAttribute("speed", new BufferAttribute(speeds, 1));
  geometry.setAttribute("drift", new BufferAttribute(drifts, 2));
  geometry.setAttribute("noiseOffset", new BufferAttribute(noiseOffsets, 3));
  geometry.setAttribute("size", new BufferAttribute(sizes, 1));

  // Create material
  material = new ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms,
    transparent: true,
    depthWrite: false,
    vertexColors: true,
  });

  // Create points
  points = new Points(geometry, material);
  points.renderOrder = 22;
  points.frustumCulled = false;

  // Add to lab group
  renderTarget.scene.add(points);

  // Start animation
  gsap.ticker.add(tick);
};

const tick = () => {
  if (!material) return;
  // Reduced motion: hold the particles still (time stops advancing).
  if (!prefersReducedMotion.value) material.uniforms.uTime!.value = gsap.ticker.time;
  material.uniforms.uScaleMultiplier!.value = 0.75 + 0.25 * aboutProgress.value;

  points?.position.copy(lab.group.position);
};

const destroy = () => {
  gsap.ticker.remove(tick);
};

export const labParticles = { init, destroy };
