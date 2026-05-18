import type { ProjectContent } from "../../types";

export default {
  title: "Concise MarkDown Blog",
  theme: "light",
  tags: ["react", "javascript", "markdown", "css"],
  source: "https://github.com/tempest2023/ConciseMarkDownBlog",
  description:
    "一个由 Markdown 驱动的个人网站框架，使用 React 构建，强调快速写作、轻松部署和内容优先。<br/><br/>我想做的是一套长期维护成本很低的网站方案，不依赖复杂 CMS，也不需要额外的服务端内容管线。",
  components: [
    {
      type: "imageText",
      props: {
        imagePosition: "left",
        src: "https://github-readme-stats-623059008.vercel.app/api/pin/?username=tempest2023&repo=ConciseMarkDownBlog",
        alt: "Concise MarkDown Blog 仓库卡片",
        border: true,
        component: {
          type: "text",
          props: {
            title: "以内容为先的设计",
            text:
              "我做这个项目，是因为我想要一个更新足够简单的个人站。Markdown 负责写作体验，React 负责渲染，GitHub Pages 负责部署，让整套流程保持轻量、清晰、可持续。",
          },
        },
      },
    },
    {
      type: "list",
      props: {
        title: "核心想法",
        items: [
          "按可配置的文章结构动态加载 Markdown 内容",
          "让写作而不是 CMS 管理成为博客系统的中心",
          "通过 GitHub Pages 和版本化内容实现低成本部署",
        ],
      },
    },
    {
      type: "text",
      props: {
        title: "为什么它值得展示",
        text: "这个项目很能说明我的产品偏好：减少摩擦、保持工作流清晰，让工具退到幕后，让内容本身说话。",
      },
    },
  ],
} as const satisfies ProjectContent;
