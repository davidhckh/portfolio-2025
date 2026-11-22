<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import { transitions } from "../../../animations";
import { t } from "../../../i18n/utils/translate";
import Social from "../../../components/Social.vue";

const contactElement = ref<HTMLElement | null>(null);

onMounted(() => {
  if (contactElement.value) {
    transitions.contact.setup(contactElement.value);
  }
});

onUnmounted(() => {
  transitions.contact.destroy();
});
</script>

<template>
  <div class="contact grid" ref="contactElement">
    <div class="contact-content">
      <h2 class="contact-title" v-html="t('lets-work-together')"></h2>
      <Social variant="background" />
    </div>
  </div>
</template>

<style scoped lang="scss">
.contact {
  width: 100%;
  max-width: calc(var(--svw) * 100);
  overflow: hidden;
  min-height: calc(var(--lvh) * 100);
  padding: var(--space-outer);
  padding-top: var(--space-lg);

  @include mixins.mq("md") {
    padding-top: var(--space-xxl);
  }

  &-content {
    position: relative;
    padding-top: var(--space-md);
    grid-column: 1 / 13;
    display: flex;
    flex-direction: column;
    gap: var(--space-md);
    // Lets the title size against this column (cqi), see below.
    container-type: inline-size;

    @include mixins.mq("sm") {
      grid-column: 1 / 8;
    }

    @include mixins.mq("md") {
      gap: var(--space-xl);
      grid-column: 1 / 6;
      padding-top: var(--space-lg);
    }

    @include mixins.mq("lg") {
      grid-column: 2 / 6;
    }
  }

  // Capped at 16cqi so the longest word ("Trabajemos" is ~5.6em wide) always fits
  // the column; without it, at 1024/1280 px the last letter wrapped to its own line.
  &-title {
    font-weight: 900;
    letter-spacing: 0.02em;
    overflow-wrap: normal;
    font-size: min(var(--font-size-title-md), 16cqi);

    @include mixins.mq("sm") {
      font-size: min(var(--font-size-title-lg), 16cqi);
    }

    @include mixins.mq("xl") {
      font-size: min(var(--font-size-title-xl), 16cqi);
    }
  }
}
</style>
