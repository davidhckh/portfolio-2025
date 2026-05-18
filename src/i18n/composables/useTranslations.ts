import { watch } from "vue";
import { loadTranslations } from "../utils/load";
import { locale, translations } from "../store";
import { onMounted } from "vue";
import { LOCALES } from "../constants";

import type { Locale } from "../types";

export const useTranslations = () => {
  onMounted(() => {
    const storedLocale = window.localStorage.getItem("portfolio-locale");

    if (storedLocale === "de") {
      locale.value = "zh";
    } else if (storedLocale && storedLocale in LOCALES) {
      locale.value = storedLocale as Locale;
    } else {
      const preferredLocale = navigator.language.split("-")[0] as Locale;

      if (preferredLocale in LOCALES) {
        locale.value = preferredLocale;
      } else {
        locale.value = "en";
      }
    }
  });

  watch(locale, () => {
    if (!locale.value) return;
    window.localStorage.setItem("portfolio-locale", locale.value);
  });

  watch(
    locale,
    async (newLocale) => {
      if (!newLocale) return;
      translations.value = (await loadTranslations("common", newLocale)) ?? {};
    },
    { immediate: true },
  );
};
