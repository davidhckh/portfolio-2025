import type { ProjectContent } from "../../types";

export default {
  title: "Dark Forest Adventure",
  theme: "dark",
  tags: ["unity", "game"],
  live: "https://temepst-666.itch.io/darkforestadventure",
  description:
    "一个发生在迷雾森林与村庄中的 Unity 第三人称 3D 冒险游戏。<br/><br/>玩家需要探索、收集资源、利用地形组织战斗策略，并在环境中隐藏的敌人遭遇中不断推进。",
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
        title: "世界观与玩法",
        text:
          "这是一个我更强调氛围感和手感的项目。它把探索、战斗和环境交互放在一起，也体现了我对传统 CRUD 之外、更有野心的交互体验一直以来的兴趣。",
      },
    },
    {
      type: "list",
      props: {
        title: "体验目标",
        items: [
          "在奇幻森林场景中的第三人称探索体验",
          "会被地形和资源选择影响的战斗节奏",
          "通过环境设计传达神秘、阴郁的世界氛围",
        ],
      },
    },
  ],
} as const satisfies ProjectContent;
