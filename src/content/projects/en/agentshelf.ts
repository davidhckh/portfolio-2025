import type { ProjectContent } from "../../types";

export default {
  title: "AgentShelf",
  theme: "dark",
  tags: ["ai", "next", "react", "typescript"],
  source: "https://github.com/tempest2023/AgentShelf",
  description:
    "A GEO Readiness Console built to make agent-user interaction visible, inspectable, and operational for commerce teams.<br/><br/>It explores how Generative UI can turn opaque AI behavior into a product surface that humans can actually monitor, debug, and trust.",
  components: [
    {
      type: "imageText",
      props: {
        imagePosition: "left",
        src: "https://github-readme-stats-623059008.vercel.app/api/pin/?username=tempest2023&repo=AgentShelf",
        alt: "AgentShelf repository card",
        border: true,
        component: {
          type: "text",
          props: {
            title: "Generative UI for ops",
            text:
              "I built AgentShelf during a recent hackathon to ask a practical question: what should an AI-native operations console feel like when the core interaction is between an agent and a human, not just a form and a database?",
          },
        },
      },
    },
    {
      type: "list",
      props: {
        title: "What it focuses on",
        items: [
          "Making agent actions legible instead of hidden behind chat output",
          "Providing an inspectable workflow surface for commerce teams",
          "Turning AI interaction history into something operational and reviewable",
        ],
      },
    },
    {
      type: "text",
      props: {
        title: "Why it belongs here",
        text:
          "AgentShelf captures the direction I care about most right now: high-trust AI products where interface design, system behavior, and human oversight all need to work together.",
      },
    },
  ],
} as const satisfies ProjectContent;
