import type { ProjectContent } from "../../types";

export default {
  title: "Dark Forest Adventure",
  theme: "dark",
  tags: ["unity", "game"],
  live: "https://temepst-666.itch.io/darkforestadventure",
  description:
    "A Unity third-person 3D adventure game set in an occult, foggy forest and nearby village.<br/><br/>Players explore, gather resources, adapt terrain for combat strategy, and fight through enemy encounters hidden across the environment.",
  components: [
    {
      type: "media",
      props: {
        type: "image",
        src: "https://img.itch.zone/aW1hZ2UvMTgzMzgwNS8xMDc2NDAxMy5wbmc=/794x1000/U5dYyt.png",
        alt: "Dark Forest Adventure preview",
        caption: "Gameplay preview",
      },
    },
    {
      type: "text",
      props: {
        title: "World and gameplay",
        text:
          "This was one of the projects where I leaned into atmosphere and player feel. The game mixes exploration, combat, and environment interaction in a way that reflects my long-running interest in ambitious interfaces beyond standard CRUD apps.",
      },
    },
    {
      type: "list",
      props: {
        title: "Experience goals",
        items: [
          "Third-person exploration in a fantasy forest setting",
          "Combat that changes with terrain and resource choices",
          "A moody, occult aesthetic carried by environment design",
        ],
      },
    },
  ],
} as const satisfies ProjectContent;
