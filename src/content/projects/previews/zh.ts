import type { ProjectPreview } from "../../types";
import agentshelfCover from "../../../assets/thumbnails/generated/agentshelf-cover.jpg";
import tiraAiCover from "../../../assets/thumbnails/generated/tira-ai-cover.jpg";
import influAgentCover from "../../../assets/thumbnails/generated/influ-agent-cover.jpg";
import conciseMarkdownBlogCover from "../../../assets/thumbnails/generated/concise-markdown-blog-cover.jpg";
import darkForestAdventureCover from "../../../assets/thumbnails/generated/dark-forest-adventure-cover.jpg";

export default [
  {
    title: "AgentShelf",
    slug: "agentshelf",
    thumbnail: agentshelfCover,
    description: "让 AI 可见、可查、可运营的 GEO 控制台",
  },
  {
    title: "Tira AI",
    slug: "tira-ai",
    thumbnail: tiraAiCover,
    description: "AI 原生执行力创业项目",
  },
  {
    title: "Influ Agent",
    slug: "influ-agent",
    thumbnail: influAgentCover,
    description: "24/7 多 Agent 增长系统",
  },
  {
    title: "Concise MarkDown Blog",
    slug: "concise-markdown-blog",
    thumbnail: conciseMarkdownBlogCover,
    description: "基于 Markdown 的个人站框架",
  },
  {
    title: "Dark Forest Adventure",
    slug: "dark-forest-adventure",
    thumbnail: darkForestAdventureCover,
    description: "Unity 第三人称奇幻冒险游戏",
  },
] as const satisfies ProjectPreview[];
