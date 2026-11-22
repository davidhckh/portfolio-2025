<script setup lang="ts">
import Github from "./icons/Github.vue";
import Linkedin from "./icons/Linkedin.vue";
import Instagram from "./icons/Instagram.vue";
import Mail from "./icons/Mail.vue";
import X from "./icons/X.vue";
import Link from "./Link.vue";
import { t } from "../i18n/utils/translate";
import ButtonRound from "./ButtonRound.vue";
import Tooltip from "./Tooltip.vue";

import { social } from "../content/social";

const props = defineProps<{
  variant?: "theme" | "background";
}>();

// map icon names to components
const icons = {
  mail: Mail,
  github: Github,
  linkedin: Linkedin,
  x: X,
  instagram: Instagram,
} as const;

// Display names, with each brand's own capitalisation.
const getName = (name: (typeof social)[number]["name"]) =>
  ({ mail: t("email"), github: "GitHub", linkedin: "LinkedIn", x: "X", instagram: "Instagram" })[name];

const getAriaLabel = (name: (typeof social)[number]["name"]) => `${t("go-to")} ${getName(name)}`;
</script>

<template>
  <div class="social">
    <Tooltip v-for="item in social" :key="item.name" :label="getName(item.name)" placement="top">
      <Link
        external
        :href="item.url"
        :aria-label="getAriaLabel(item.name)"
        class="social-link"
        data-cursor="circle-white"
      >
        <ButtonRound
          renderAs="div"
          :variant="props.variant ?? 'theme'"
          class="children-unclickable"
          data-hoversound="hover"
        >
          <component :is="icons[item.name]" :aria-label="getAriaLabel(item.name)" external />
        </ButtonRound>
      </Link>
    </Tooltip>
  </div>
</template>

<style scoped lang="scss">
.social {
  display: flex;
  gap: var(--space-md);
}
</style>
