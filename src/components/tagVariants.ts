export type TagVariant =
  | "ai"
  | "three"
  | "websockets"
  | "react"
  | "redis"
  | "gray"
  | "html"
  | "css"
  | "javascript"
  | "node"
  | "next"
  | "typescript"
  | "kubernetes"
  | "postgresql"
  | "unity"
  | "game"
  | "markdown"
  | "ogl"
  | "glsl";

export const tagLabels = {
  ai: "AI",
  three: "Three.js",
  websockets: "WebSockets",
  react: "React",
  redis: "Redis",
  gray: "Gray",
  html: "HTML",
  css: "CSS",
  javascript: "JavaScript",
  node: "Node.js",
  next: "Next.js",
  typescript: "TypeScript",
  kubernetes: "Kubernetes",
  postgresql: "PostgreSQL",
  unity: "Unity",
  game: "Game",
  markdown: "Markdown",
  ogl: "OGL.js",
  glsl: "GLSL",
} as const satisfies Record<TagVariant, string>;
