import type { ProjectContent } from "../../types";

export default {
  title: "AgentShelf",
  theme: "dark",
  tags: ["ai", "next", "react", "typescript"],
  source: "https://github.com/tempest2023/AgentShelf",
  description:
    "一个面向商业团队的 GEO Readiness Console，让 Agent 与用户之间的交互变得可见、可检查、可运营。<br/><br/>这个项目探索的是：当 AI 行为不再只是黑盒输出时，Generative UI 能否把它变成一个真正值得信任和调试的产品界面。",
  components: [
    {
      type: "imageText",
      props: {
        imagePosition: "left",
        src: "https://github-readme-stats-623059008.vercel.app/api/pin/?username=tempest2023&repo=AgentShelf",
        alt: "AgentShelf 仓库卡片",
        border: true,
        component: {
          type: "text",
          props: {
            title: "面向运营系统的 Generative UI",
            text:
              "我在一次 hackathon 中做了 AgentShelf，想回答一个很实际的问题：如果一套 AI 原生运营控制台的核心交互发生在 Agent 和人之间，而不是表单和数据库之间，那它应该长什么样？",
          },
        },
      },
    },
    {
      type: "list",
      props: {
        title: "它关注的核心问题",
        items: [
          "让 Agent 的动作可追踪，而不是被聊天结果掩盖",
          "为商业团队提供可审查的工作流操作界面",
          "把 AI 交互历史转化成真正可复盘、可运营的系统表面",
        ],
      },
    },
    {
      type: "text",
      props: {
        title: "为什么它重要",
        text: "AgentShelf 很代表我现在最在意的方向：高可信 AI 产品，必须让界面设计、系统行为和人工监督一起协同工作。",
      },
    },
  ],
} as const satisfies ProjectContent;
