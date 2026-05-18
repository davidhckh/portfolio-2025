export const LOCALES = {
  en: {
    iso: "en-US",
    name: "English",
  },
  zh: {
    iso: "zh-CN",
    name: "中文",
  },
} as const satisfies Record<
  string,
  {
    name: string;
    iso: string;
  }
>;

export const LOCALE_DEFAULT: keyof typeof LOCALES = "en";
