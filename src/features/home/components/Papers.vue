<script setup lang="ts">
import { computed } from "vue";
import Banner from "../../../components/Banner.vue";
import Link from "../../../components/Link.vue";
import { papers } from "../../../content/papers";
import { locale } from "../../../i18n/store";
import { t } from "../../../i18n/utils/translate";

import type { PaperContent } from "../../../content/types";

const localizedPapers = computed<readonly PaperContent[]>(() => {
  return papers[locale.value ?? "en"];
});

const getStatusVariant = (status: string) => {
  const normalized = status.toLowerCase();

  if (normalized.includes("accepted") || normalized.includes("已接收")) {
    return "accepted";
  }

  if (normalized.includes("published") || normalized.includes("已发表")) {
    return "published";
  }

  if (normalized.includes("review") || normalized.includes("审稿")) {
    return "review";
  }

  if (normalized.includes("preprint") || normalized.includes("预印本")) {
    return "preprint";
  }

  return "neutral";
};
</script>

<template>
  <section class="papers">
    <div class="grid">
      <div class="papers-intro">
        <Banner class="papers-intro-banner" :copy="t('research')" size="sm" animated />
        <h2 class="papers-intro-title">{{ t("papers") }}</h2>
        <p class="papers-intro-copy">{{ t("papers-intro") }}</p>
      </div>
    </div>
    <div class="grid">
      <div class="papers-cards">
        <article
          v-for="paper in localizedPapers"
          :key="paper.title"
          :class="['papers-card', { 'papers-card-featured': paper.featured }]"
        >
          <div class="papers-card-meta">
            <p class="papers-card-venue">{{ paper.venue }}</p>
            <div class="papers-card-badges">
              <span
                :class="[
                  'papers-card-badge',
                  'papers-card-badge-status',
                  `papers-card-badge-status-${getStatusVariant(paper.status)}`,
                ]"
                >{{ paper.status }}</span
              >
              <span class="papers-card-badge">{{ paper.year }}</span>
            </div>
          </div>
          <h3 class="papers-card-title">{{ paper.title }}</h3>
          <p class="papers-card-summary">{{ paper.summary }}</p>
          <div class="papers-card-footer">
            <Link
              v-if="paper.href"
              :href="paper.href"
              external
              class="papers-card-link"
              data-cursor="arrow-external"
              data-hoversound="hover"
              >{{ t("read-paper") }}</Link
            >
          </div>
        </article>
      </div>
    </div>
  </section>
</template>

<style scoped lang="scss">
.papers {
  --papers-status-accepted-bg: oklch(0.93 0.03 150);
  --papers-status-accepted-text: oklch(0.46 0.05 150);
  --papers-status-published-bg: oklch(0.94 0.02 175);
  --papers-status-published-text: oklch(0.44 0.04 175);
  --papers-status-review-bg: oklch(0.95 0.03 95);
  --papers-status-review-text: oklch(0.5 0.05 90);
  --papers-status-preprint-bg: oklch(0.94 0.025 315);
  --papers-status-preprint-text: oklch(0.48 0.045 310);

  width: 100%;
  display: flex;
  flex-direction: column;
  gap: var(--space-xl);
  padding: 104px var(--space-outer);
  background: var(--color-beige-600);

  @include mixins.mq("md") {
    gap: var(--space-xxl);
    padding-top: 136px;
    padding-bottom: 136px;
  }

  &-intro {
    position: relative;
    grid-column: 1 / 13;
    padding-top: var(--space-md);
    display: flex;
    flex-direction: column;
    gap: var(--space-sm);

    @include mixins.mq("md") {
      grid-column: 1 / 9;
    }

    @include mixins.mq("lg") {
      grid-column: 3 / 8;
    }

    &-title {
      font-weight: 900;
      letter-spacing: 0.02em;
      font-size: var(--font-size-title-md);

      @include mixins.mq("sm") {
        font-size: var(--font-size-title-lg);
      }

      @include mixins.mq("xl") {
        font-size: var(--font-size-title-xl);
      }
    }

    &-copy {
      max-width: 44ch;
      line-height: var(--line-height-copy);
      color: var(--color-text-300);
    }

    &-banner {
      position: absolute;
      top: 0;
      left: -8px;
      transform: translate(0, -20%) rotate(-4deg);

      @include mixins.mq("lg") {
        left: -16px;
        transform: translate(0, -20%) rotate(-6deg);
      }
    }
  }

  &-cards {
    grid-column: 1 / span 12;
    display: grid;
    gap: var(--space-lg);
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));

    @include mixins.mq("lg") {
      grid-column: 3 / span 8;
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }

  &-card {
    min-height: 100%;
    display: flex;
    flex-direction: column;
    gap: var(--space-lg);
    padding: var(--space-lg);
    border-radius: var(--radius-xl);
    background: linear-gradient(180deg, var(--color-beige-400) 0%, var(--color-beige-500) 100%);
    border: 1px solid var(--color-grayscale-500);

    @include mixins.mq("md") {
      padding: var(--space-xl);
    }

    &:nth-child(3n + 1) {
      border-top: 3px solid var(--color-text-300);
    }

    &:nth-child(3n + 2) {
      border-top: 3px solid var(--color-cyan-400);
    }

    &:nth-child(3n + 3) {
      border-top: 3px solid var(--color-grayscale-700);
    }

    &-featured {
      @include mixins.mq("lg") {
        grid-column: span 2;
      }
    }

    &-meta {
      display: flex;
      flex-direction: column;
      gap: var(--space-sm);

      @include mixins.mq("sm") {
        flex-direction: row;
        justify-content: space-between;
        align-items: flex-start;
      }
    }

    &-venue {
      font-size: var(--font-size-sm);
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--color-text-300);
    }

    &-badges {
      display: flex;
      flex-wrap: wrap;
      gap: var(--space-xs);
    }

    &-badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 0.45rem 0.75rem;
      border-radius: 999px;
      font-size: var(--font-size-sm);
      background: var(--color-grayscale-400);
      color: var(--color-text-300);

      &-status {
        &-accepted {
          background: var(--papers-status-accepted-bg);
          color: var(--papers-status-accepted-text);
        }

        &-published {
          background: var(--papers-status-published-bg);
          color: var(--papers-status-published-text);
        }

        &-review {
          background: var(--papers-status-review-bg);
          color: var(--papers-status-review-text);
        }

        &-preprint {
          background: var(--papers-status-preprint-bg);
          color: var(--papers-status-preprint-text);
        }

        &-neutral {
          background: var(--color-text-300);
          color: var(--color-beige-400);
        }
      }
    }

    &-title {
      font-size: clamp(1.6rem, 3vw, 2.4rem);
      line-height: 1.05;
      text-wrap: balance;
    }

    &-summary {
      line-height: var(--line-height-copy);
      color: var(--color-text-300);
      max-width: 56ch;
    }

    &-footer {
      margin-top: auto;
    }

    &-link {
      font-weight: 700;
      text-decoration: underline;
      text-decoration-thickness: 0.12em;
      text-underline-offset: 0.2em;
    }
  }
}
</style>
