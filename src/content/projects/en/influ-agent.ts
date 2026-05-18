import type { ProjectContent } from "../../types";

export default {
  title: "Influ Agent",
  theme: "light",
  tags: ["ai", "next", "react", "node"],
  live: "https://influagent.tempest.fun/",
  description:
    "An autonomous 24/7 AI multi-agent system for creator and social growth workflows.<br/><br/>The product explores how persistent agents can help users grow, coordinate, and execute across always-on content and social tasks.",
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
            title: "Always-on agent workflows",
            text:
              "Influ Agent pushes beyond a single chat prompt. The idea is a persistent agent system that keeps working across social goals, with product surfaces that help users understand the automation instead of feeling disconnected from it.",
          },
        },
      },
    },
    {
      type: "list",
      props: {
        title: "Product themes",
        items: [
          "Multi-agent automation for creator growth loops",
          "Dashboard and mobile surfaces for high-frequency workflows",
          "A product direction centered on execution, not just conversation",
        ],
      },
    },
  ],
} as const satisfies ProjectContent;
