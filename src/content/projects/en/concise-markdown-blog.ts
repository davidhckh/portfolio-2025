import type { ProjectContent } from "../../types";

export default {
  title: "Concise MarkDown Blog",
  theme: "light",
  tags: ["react", "javascript", "markdown", "css"],
  source: "https://github.com/tempest2023/ConciseMarkDownBlog",
  description:
    "A markdown-driven personal website framework built with React and designed for quick authoring, easy deployment, and content-first presentation.<br/><br/>The goal was to make a site that stays easy to maintain over time without requiring a custom CMS or server-side content pipeline.",
  components: [
    {
      type: "imageText",
      props: {
        imagePosition: "left",
        src: "https://github-readme-stats-623059008.vercel.app/api/pin/?username=tempest2023&repo=ConciseMarkDownBlog",
        alt: "Concise MarkDown Blog repository card",
        border: true,
        component: {
          type: "text",
          props: {
            title: "Content-first by design",
            text:
              "I built this project because I wanted a personal website that was simple to update. Markdown became the authoring interface, React handled rendering, and GitHub Pages gave it a fast, low-maintenance deployment path.",
          },
        },
      },
    },
    {
      type: "list",
      props: {
        title: "Core ideas",
        items: [
          "Dynamic loading of Markdown documents under a configurable article structure",
          "A lightweight blogging model focused on writing rather than CMS administration",
          "Easy deployment through GitHub Pages and version-controlled content updates",
        ],
      },
    },
    {
      type: "text",
      props: {
        title: "Why it matters",
        text:
          "This project says a lot about how I like to build: remove friction, keep the workflow legible, and make the tool disappear so the content or product can do the talking.",
      },
    },
  ],
} as const satisfies ProjectContent;
