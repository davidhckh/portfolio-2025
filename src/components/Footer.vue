<script setup lang="ts">
import Social from "./Social.vue";
import Link from "./Link.vue";
import Clickable from "./Clickable.vue";
import LangSwitch from "./LangSwitch.vue";
import NotchSection from "./NotchSection.vue";
import { t } from "../i18n/utils/translate";
import ButtonRound from "./ButtonRound.vue";
import { lenis } from "../composables/useScroll";
import ArrowRightLong from "./icons/ArrowRightLong.vue";
import Github from "./icons/Github.vue";
import { profile } from "../content/profile";

interface Props {
  withSocial?: boolean;
}

const handleBackToTop = () => {
  if (!lenis.value) return;
  lenis.value.scrollTo(0);
};

const { withSocial = true } = defineProps<Props>();
</script>

<template>
  <footer class="footer">
    <NotchSection class="footer-notch" />
    <div class="footer-content">
      <div class="footer-top-row">
        <div aria-hidden="true" class="footer-top-row-spacer"></div>
        <div
          class="footer-back-to-top"
          tabindex="0"
          @click="handleBackToTop"
          @keydown.enter="handleBackToTop"
          data-cursor="circle-white"
          data-sound="click"
        >
          <ButtonRound renderAs="div" variant="border" class="children-unclickable" data-hoversound="hover">
            <ArrowRightLong class="footer-back-to-top-icon" />
          </ButtonRound>
        </div>
        <div class="footer-lang-switch">
          <LangSwitch />
        </div>
      </div>
      <Social v-if="withSocial" class="footer-social" />
      <div class="footer-credits">
        <div class="footer-credits-music">
          <p>
            {{ t("music-produced-by") }}
          </p>
          <Clickable renderAs="div">
            <Link
              href="https://soundcloud.com/hmsurf"
              class="footer-link children-unclickable"
              external
              data-cursor="circle-white"
              data-hoversound="hover"
              >HM Surf</Link
            >
          </Clickable>
        </div>
        <Clickable renderAs="div">
          <Link
            :href="profile.portfolioRepository.url"
            class="footer-repo"
            :external="true"
            data-cursor="circle-white"
            data-sound="click"
            data-hoversound="hover"
          >
            <Github class="footer-repo-icon" />
            <span class="footer-repo-label children-unclickable">{{ profile.portfolioRepository.label }}</span>
          </Link>
        </Clickable>
      </div>
    </div>
  </footer>
</template>

<style scoped lang="scss">
.footer {
  background: var(--color-background-300, var(--color-beige-400));
  width: 100%;
  display: flex;
  justify-content: center;
  position: relative;

  &-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-md);
    width: 100%;
    max-width: calc(var(--breakpoint-xxxl));
    padding: calc(var(--space-outer) + var(--space-sm)) var(--space-outer) var(--space-outer);
    position: relative;

    @include mixins.mq("md") {
      gap: var(--space-sm);
    }
  }

  &-top-row {
    width: 100%;
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    align-items: center;
    min-height: 44px;

    &-spacer {
      min-width: 0;
    }
  }

  &-back-to-top {
    cursor: pointer;
    justify-self: center;

    &-icon {
      transform: rotate(-90deg);
    }
  }

  &-social {
    width: 100%;
    justify-content: center;
  }

  &-link {
    font-weight: 700;
  }

  &-repo {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-xs);
    font-weight: 700;
    text-align: center;
    overflow-wrap: anywhere;
    max-width: 100%;
    color: var(--color-text-400);
    --icon-color: var(--color-text-400);
    transition:
      color 0.1s ease-in-out,
      opacity 0.1s ease-in-out;

    @include mixins.hover {
      &:hover {
        color: var(--color-white-400);
        --icon-color: var(--color-white-400);
      }
    }

    &:focus-visible,
    &:active {
      color: var(--color-white-400);
      --icon-color: var(--color-white-400);
    }

    &-icon {
      width: 1.15rem;
      min-width: 1.15rem;
    }

    &-label {
      overflow-wrap: anywhere;
    }
  }

  &-credits {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    gap: var(--space-sm);
    width: 100%;
    font-size: var(--font-size-sm);
    text-align: center;

    &-music {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      align-items: center;
      column-gap: var(--space-xs);
      row-gap: var(--space-xxs);
    }
  }

  &-lang-switch {
    justify-self: end;
  }

  &-notch {
    position: absolute;
    top: 0;
    left: 0;
    transform: translateY(-100%);
    color: var(--color-background-300, var(--color-beige-400));
    --icon-color: var(--color-background-300, var(--color-beige-400));
  }
}
</style>
