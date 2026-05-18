import type { ProjectContent } from "../../types";

export default {
  title: "Influ Agent",
  theme: "light",
  tags: ["ai", "next", "react", "node"],
  live: "https://influagent.tempest.fun/",
  description:
    "一个面向创作者与社交增长场景的 24/7 自动化 AI multi-agent 系统。<br/><br/>它在探索的不是单次对话，而是持续运转的 Agent 如何帮助用户围绕内容和增长目标进行协作、执行与放大。",
  components: [
    {
      type: "media",
      props: {
        type: "image",
        src: "https://influagent.tempest.fun/Dashboard.png",
        alt: "Influ Agent dashboard",
        caption: "Dashboard",
      },
    },
    {
      type: "imageText",
      props: {
        imagePosition: "right",
        src: "https://influagent.tempest.fun/InfluAgentMobileDesign/MobileDesign/Login.png",
        alt: "Influ Agent mobile login",
        component: {
          type: "text",
          props: {
            title: "持续在线的 Agent 工作流",
            text:
              "Influ Agent 关心的不只是一次 prompt，而是一套会持续工作的 Agent 系统。产品界面也不应该让用户和自动化脱节，而应该帮助他们理解系统正在做什么、为什么这样做。",
          },
        },
      },
    },
    {
      type: "list",
      props: {
        title: "产品方向",
        items: [
          "面向创作者增长循环的多 Agent 自动化",
          "同时覆盖 dashboard 与移动端的高频工作流界面",
          "把重点放在执行系统，而不仅仅是聊天体验",
        ],
      },
    },
  ],
} as const satisfies ProjectContent;
