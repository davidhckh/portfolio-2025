import { ref } from "vue";

export type Section = "about" | "projects" | "contact";

export const sections: Section[] = ["about", "projects", "contact"];

// Which home section is currently in view. Written by HeaderHome's ScrollTriggers
// (it stays mounted on every breakpoint, only hidden below lg) and read by both the
// desktop pill nav and the mobile menu, so they always agree.
export const activeSection = ref<Section | null>(null);
