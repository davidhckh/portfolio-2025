import type { Locale } from "../../i18n/types";

export const projectIds = [
  "agentshelf",
  "tira-ai",
  "influ-agent",
  "concise-markdown-blog",
  "dark-forest-adventure",
] as const;

function simplifyModules(glob: Record<string, any>) {
  const result: Record<string, any> = {};
  const allowedProjectIds = new Set(projectIds);
  for (const [path, mod] of Object.entries(glob)) {
    const match = path.match(/\/([a-z0-9_-]+)\.ts$/i);
    if (match && allowedProjectIds.has(match[1] as (typeof projectIds)[number])) {
      result[match[1] as string] = mod;
    }
  }
  return result;
}

export const projectModules = {
  en: simplifyModules(import.meta.glob("./en/*.ts", { eager: true })),
  zh: simplifyModules(import.meta.glob("./zh/*.ts", { eager: true })),
} as const satisfies Record<Locale, Record<string, any>>;
