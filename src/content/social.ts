import { profile } from "./profile";

export const social = [
  { url: `mailto:${profile.email}`, name: "mail" },
  { url: "https://github.com/tempest2023", name: "github" },
  { url: "https://www.linkedin.com/in/taoren-pitt/", name: "linkedin" },
] as const satisfies { url: string; name: "mail" | "github" | "instagram" | "linkedin" | "x" }[];
