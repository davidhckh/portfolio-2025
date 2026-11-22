import { ref } from "vue";

// Live "prefers-reduced-motion: reduce" flag. Updates if the user flips the OS setting
// while the page is open, so 3D modules can watch it instead of reading it once.
// Covers motion that runs on its own (patrols, ambient loops, cursor parallax);
// motion the user triggers directly (scroll-driven camera, click jumps) stays.
const query = window.matchMedia("(prefers-reduced-motion: reduce)");

export const prefersReducedMotion = ref(query.matches);

query.addEventListener("change", (event) => {
  prefersReducedMotion.value = event.matches;
});
