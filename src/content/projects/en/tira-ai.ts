import type { ProjectContent } from "../../types";

export default {
  title: "Tira AI",
  theme: "light",
  tags: ["ai", "next", "node", "typescript"],
  live: "https://tira.tempest.fun/",
  description:
    "An AI-native execution startup I co-founded in summer 2025.<br/><br/>We explored execution workflows, shaped the product and fundraising narrative quickly, and received top-10% feedback in YC S25 while building traction with early-stage investors and founder programs.",
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
            title: "Founder-led product execution",
            text:
              "Tira AI was where founder speed, product architecture, and GTM storytelling had to move together. It was less about polishing a static demo and more about learning fast, tightening the narrative, and building conviction around AI-native execution products.",
          },
        },
      },
    },
    {
      type: "list",
      props: {
        title: "Highlights",
        items: [
          "Co-founded with Sam Liu in summer 2025",
          "Explored AI-native execution workflows from product idea to narrative",
          "Earned top-10% feedback in YC S25 and early investor interest",
        ],
      },
    },
  ],
} as const satisfies ProjectContent;
