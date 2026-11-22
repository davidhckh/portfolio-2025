import type { SceneKey } from "./types";

export const points = {
  landscape: {
    hero: {
      position: { x: 0, y: 6, z: 10 },
      focus: { x: 0, y: 3, z: 0 },
    },
    "about-1": {
      /**      position: { x: 0, y: 4.7, z: 14.5 },
      position: { x: 0, y: 4.3, z: 11 },
      focus: { x: 0, y: 2.5, z: 6 },
      focus: { x: 0, y: 3.25, z: 6 }, */
      position: { x: 0, y: 4.5, z: 15.5 },
      focus: { x: 0, y: 2.2, z: 6 },
    },
    "about-2": {
      //position: { x: 0, y: 4.7, z: 14.5 },
      //position: { x: 0, y: 3, z: 15.5 },
      //focus: { x: 0, y: 2.5, z: 6 },
      //focus: { x: 0, y: 1.2, z: 6 },

      position: { x: 0, y: 4.5, z: 15.5 },
      focus: { x: 0, y: 2.2, z: 6 },
    },
  },
  portrait: {
    hero: {
      // Lowered 0.9 (camera and focus together, same angle) from y 8.2 / 5.2: shifts
      // the room ~65 px up on phones into the empty band under the title, so the rug —
      // and the baby elephant walking on it — is no longer cut off by the bottom edge.
      // More than ~0.9 makes the corkboard touch the title banner at 360×740.
      position: { x: 0, y: 7.3, z: 16 },
      focus: { x: 0, y: 4.3, z: 0 },
    },
    "about-1": {
      //position: { x: 0, y: 5.5, z: 20 },
      //focus: { x: 0, y: 1.8, z: 6 },
      position: { x: 0, y: 4.75, z: 19.5 },
      focus: { x: 0, y: 0.8, z: 6 },
    },
    "about-2": {
      //position: { x: 0, y: 5.5, z: 20 },
      //focus: { x: 0, y: 1.8, z: 6 },
      position: { x: 0, y: 4.75, z: 19.5 },
      focus: { x: 0, y: 0.8, z: 6 },
    },
  },
} as const satisfies Record<
  "landscape" | "portrait",
  Partial<
    Record<
      SceneKey,
      {
        position: { x: number; y: number; z: number };
        focus: { x: number; y: number; z: number };
      }
    >
  >
>;
