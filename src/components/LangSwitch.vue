<script setup lang="ts">
import ButtonRound from "./ButtonRound.vue";
import { locale } from "../i18n/store";
import { changeLocale } from "../i18n/utils/locale";
import { t } from "../i18n/utils/translate";
import esFlag from "../assets/images/lang/es.svg";
import usFlag from "../assets/images/lang/us.svg";

const handleLangSwitch = () => {
  changeLocale(locale.value === "es" ? "en" : "es");
};
</script>

<template>
  <ButtonRound
    size="md"
    class="lang-switch children-unclickable"
    @click="handleLangSwitch"
    :aria-label="`${t('switch-language')}: ${locale === 'es' ? 'English' : 'Español'}`"
    :title="locale === 'es' ? 'English' : 'Español'"
    data-cursor="circle-white"
    data-sound="click"
    data-hoversound="hover"
  >
    <img
      :src="locale === 'es' ? usFlag : esFlag"
      alt=""
      class="lang-switch-flag"
    />
  </ButtonRound>
</template>

<style scoped lang="scss">
.lang-switch {
  // No variant prop on ButtonRound/ButtonWrapper here — the flag art is the whole
  // button, not an icon sitting on a themed background circle, so no bg/border.
  // ButtonRound's own size-variant padding still needs to go regardless of style-
  // injection order — :deep() + !important beats it reliably instead of hoping a
  // same-specificity class wins on source order (it wasn't, in practice).
  &:deep(.button-round) {
    padding: 0 !important;
    background: none;
    overflow: hidden;
  }

  &-flag {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 50%;
  }
}
</style>
