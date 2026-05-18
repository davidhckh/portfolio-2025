import type { Locale } from "../i18n/types";

export const profile = {
  firstName: "Tempest",
  lastName: "Ren",
  shortName: "Tempest",
  fullName: "Tempest Ren",
  website: "https://tempest.fun",
  email: "tar118@pitt.edu",
  portfolioRepository: {
    label: "tempest2023/portfolio-3d",
    url: "https://github.com/tempest2023/portfolio-3d",
  },
  location: {
    en: "Los Angeles",
    zh: "洛杉矶",
  } as const satisfies Record<Locale, string>,
  services: {
    en: [
      "AI Agents & Generative UI",
      "React, Next.js & Vue",
      "Node.js, Python & APIs",
      "PostgreSQL, Redis & Docker",
      "Research-Driven Product Systems",
    ],
    zh: [
      "AI Agents 与 Generative UI",
      "React、Next.js 与 Vue",
      "Node.js、Python 与 API",
      "PostgreSQL、Redis 与 Docker",
      "研究驱动的产品系统",
    ],
  } as const satisfies Record<Locale, readonly string[]>,
} as const;
