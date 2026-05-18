import type { ProjectContent } from "../../types";

export default {
  title: "Tira AI",
  theme: "light",
  tags: ["ai", "next", "node", "typescript"],
  live: "https://tira.tempest.fun/",
  description:
    "我在 2025 年夏天联合创办的一个 AI-native execution 创业项目。<br/><br/>我们一边快速打磨产品与融资叙事，一边验证执行工作流方向，最终获得了 YC S25 top 10% 的反馈，以及来自早期投资人和 founder program 的持续兴趣。",
  components: [
    {
      type: "imageText",
      props: {
        imagePosition: "left",
        src: "https://tira.tempest.fun/logos/tira-logo-512x512.png",
        alt: "Tira AI logo",
        component: {
          type: "text",
          props: {
            title: "Founder-driven 产品执行",
            text:
              "Tira AI 是一个必须让 founder 速度、产品架构和 GTM narrative 同步推进的项目。重点不只是把 demo 做漂亮，而是快速学习、快速收敛，并建立大家对 AI-native execution 产品的判断和信心。",
          },
        },
      },
    },
    {
      type: "list",
      props: {
        title: "亮点",
        items: [
          "于 2025 年夏天与 Sam Liu 共同创立",
          "从产品想法到 narrative 全面探索 AI-native execution workflow",
          "获得 YC S25 top 10% 反馈与早期投资兴趣",
        ],
      },
    },
  ],
} as const satisfies ProjectContent;
