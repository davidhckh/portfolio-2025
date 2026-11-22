<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref } from "vue";
import ButtonRound from "./ButtonRound.vue";
import { t } from "../i18n/utils/translate";
import { lenis } from "../composables/useScroll";
import { activeSection, sections, type Section } from "../composables/useActiveSection";
import { social } from "../content/social";

// Section navigation for < lg, where the desktop pill nav (HeaderHome) is hidden —
// before this, phones and tablets had no way to jump between sections at all, and
// below md the "Get in touch" CTA disappeared too, so it lives here as well.
const props = defineProps<{
  isDarkTheme: boolean;
}>();

const open = ref(false);
const rootRef = ref<HTMLElement | null>(null);
const toggleRef = ref<InstanceType<typeof ButtonRound> | null>(null);
const mailUrl = social.find((item) => item.name === "mail")?.url ?? "";

const toggleButton = () => (toggleRef.value?.$el as HTMLElement | undefined) ?? null;

const close = (returnFocus = false) => {
  if (!open.value) return;
  open.value = false;
  if (returnFocus) toggleButton()?.focus();
};

const toggle = async () => {
  open.value = !open.value;
  if (open.value) {
    await nextTick();
    rootRef.value?.querySelector<HTMLButtonElement>(".mobile-menu-link")?.focus({ preventScroll: true });
  }
};

const goTo = (section: Section) => {
  activeSection.value = section;
  close();
  lenis.value?.scrollTo("#" + section);
};

const onKeydown = (event: KeyboardEvent) => {
  if (event.key === "Escape") close(true);
};

// Close on any press outside the menu (button + panel).
const onPointerDown = (event: PointerEvent) => {
  if (open.value && rootRef.value && !rootRef.value.contains(event.target as Node)) close();
};

// Close when keyboard focus leaves the menu, so it never lingers behind the user.
const onFocusOut = (event: FocusEvent) => {
  const next = event.relatedTarget as Node | null;
  if (next && rootRef.value && !rootRef.value.contains(next)) close();
};

// Crossing into lg hands navigation back to the desktop nav.
const desktopQuery = window.matchMedia("(min-width: 1024px)");
const onBreakpoint = (event: MediaQueryListEvent) => {
  if (event.matches) close();
};

onMounted(() => {
  document.addEventListener("keydown", onKeydown);
  document.addEventListener("pointerdown", onPointerDown);
  desktopQuery.addEventListener("change", onBreakpoint);
});

onBeforeUnmount(() => {
  document.removeEventListener("keydown", onKeydown);
  document.removeEventListener("pointerdown", onPointerDown);
  desktopQuery.removeEventListener("change", onBreakpoint);
});
</script>

<template>
  <div ref="rootRef" :class="['mobile-menu', { 'mobile-menu-dark': props.isDarkTheme }]" @focusout="onFocusOut">
    <ButtonRound
      ref="toggleRef"
      variant="theme"
      :class="['mobile-menu-toggle', { 'mobile-menu-toggle-open': open }]"
      :aria-label="open ? t('close-menu') : t('menu')"
      :aria-expanded="open"
      aria-controls="mobile-menu-panel"
      data-cursor="circle-white"
      data-sound="click"
      data-hoversound="hover"
      @click="toggle"
    >
      <span class="mobile-menu-icon" aria-hidden="true">
        <span class="mobile-menu-icon-line"></span>
        <span class="mobile-menu-icon-line"></span>
      </span>
    </ButtonRound>

    <Transition name="mobile-menu-panel">
      <nav v-show="open" id="mobile-menu-panel" class="mobile-menu-panel" :aria-label="t('main-navigation')">
        <ul class="mobile-menu-list">
          <li v-for="(section, index) in sections" :key="section" class="mobile-menu-item" :style="{ '--i': index }">
            <button
              :class="['mobile-menu-link', { 'mobile-menu-link-active': activeSection === section }]"
              :aria-current="activeSection === section ? 'location' : undefined"
              data-sound="click"
              @click="goTo(section)"
            >
              <span class="mobile-menu-link-index" aria-hidden="true">0{{ index + 1 }}</span>
              <span>{{ t(section) }}</span>
            </button>
          </li>
        </ul>
        <a
          class="mobile-menu-cta"
          :href="mailUrl"
          target="_blank"
          rel="noopener noreferrer"
          data-sound="click"
          @click="close()"
          >{{ t("get-in-touch") }}</a
        >
      </nav>
    </Transition>
  </div>
</template>

<style scoped lang="scss">
.mobile-menu {
  position: relative;
  display: flex;

  @include mixins.mq("lg") {
    display: none;
  }

  // Same theme switch as the sounds toggle: beige on light sections, blue on dark.
  --menu-bg: var(--color-beige-400);
  --menu-text: var(--color-text-400);
  --menu-muted: var(--color-text-300);
  --menu-hover: var(--color-beige-500);
  --menu-active-bg: var(--color-orange-400);
  --menu-active-text: var(--color-white-400);
  --menu-focus: var(--color-orange-400);

  &-dark {
    --menu-bg: var(--color-dark-blue-500);
    --menu-text: var(--color-white-400);
    --menu-muted: var(--color-text-cyan-300);
    --menu-hover: var(--color-dark-blue-600);
    --menu-active-bg: var(--color-cyan-500);
    --menu-focus: var(--color-cyan-400);

    .mobile-menu-toggle {
      background-color: var(--color-dark-blue-500);
      --icon-color: var(--color-white-400);
    }
  }

  &-toggle:focus-visible,
  &-link:focus-visible,
  &-cta:focus-visible {
    outline: 2px solid var(--menu-focus);
    outline-offset: 2px;
  }

  // Two lines that fold into an X — a hamburger with fewer, chunkier strokes fits the
  // rounded cartoon style better than three thin ones.
  &-icon {
    position: relative;
    width: 18px;
    height: 12px;

    &-line {
      position: absolute;
      left: 0;
      width: 100%;
      height: 2.5px;
      border-radius: 2px;
      background-color: var(--icon-color, currentColor);
      transition: transform 0.25s var(--ease-smooth);

      &:first-child {
        top: 0;
      }

      &:last-child {
        bottom: 0;
      }
    }
  }

  &-toggle-open &-icon-line {
    &:first-child {
      transform: translateY(4.75px) rotate(45deg);
    }

    &:last-child {
      transform: translateY(-4.75px) rotate(-45deg);
    }
  }

  &-panel {
    position: absolute;
    top: calc(100% + var(--space-xs));
    right: 0;
    width: min(280px, calc(100vw - var(--space-outer) * 2));
    padding: var(--space-xs);
    border-radius: 24px;
    background-color: var(--menu-bg);
    color: var(--menu-text);
    box-shadow:
      0 12px 32px rgba(45, 42, 36, 0.18),
      0 2px 6px rgba(45, 42, 36, 0.08);
    transform-origin: calc(100% - 22px) 0;
  }

  &-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  &-link {
    display: flex;
    align-items: baseline;
    gap: var(--space-sm);
    width: 100%;
    min-height: 52px;
    padding: var(--space-sm) var(--space-md);
    border: none;
    border-radius: 16px;
    background: none;
    color: inherit;
    font-size: var(--font-size-xl);
    font-weight: 700;
    letter-spacing: 0.02em;
    text-transform: uppercase;
    text-align: left;
    cursor: pointer;
    touch-action: manipulation;
    transition:
      background-color 0.15s ease-out,
      color 0.15s ease-out;

    &:active {
      background-color: var(--menu-hover);
    }

    @include mixins.hover {
      &:hover {
        background-color: var(--menu-hover);
      }
    }

    &-index {
      font-family: var(--font-mono);
      font-size: var(--font-size-sm);
      color: var(--menu-muted);
      transition: color 0.15s ease-out;
    }

    &-active,
    &-active:hover {
      background-color: var(--menu-active-bg);
      color: var(--menu-active-text);

      .mobile-menu-link-index {
        color: inherit;
      }
    }
  }

  &-cta {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 48px;
    margin-top: var(--space-xs);
    border-radius: 100px;
    background-color: var(--color-orange-400);
    color: var(--color-white-400);
    font-size: var(--font-size-md);
    font-weight: 800;
    letter-spacing: 0.02em;
    text-transform: uppercase;
    text-decoration: none;
    touch-action: manipulation;
    transition: background-color 0.15s ease-out;

    // From md up the header already shows its own "Get in touch" button.
    @include mixins.mq("md") {
      display: none;
    }

    @include mixins.hover {
      &:hover {
        background-color: var(--color-black-400);
      }
    }
  }
}

// Grows out of the toggle (scale + fade from its corner), items stagger in; exit is
// faster than enter. Reduced motion keeps only a short fade.
.mobile-menu-panel-enter-active {
  transition:
    opacity 0.2s ease-out,
    transform 0.28s var(--ease-power2-in);

  .mobile-menu-item {
    transition:
      opacity 0.25s ease-out,
      transform 0.3s var(--ease-power2-in);
    transition-delay: calc(0.04s + var(--i) * 0.04s);
  }
}

.mobile-menu-panel-leave-active {
  transition:
    opacity 0.15s ease-in,
    transform 0.15s ease-in;
}

.mobile-menu-panel-enter-from,
.mobile-menu-panel-leave-to {
  opacity: 0;
  transform: scale(0.92) translateY(-6px);
}

.mobile-menu-panel-enter-from .mobile-menu-item {
  opacity: 0;
  transform: translateY(-6px);
}

@media (prefers-reduced-motion: reduce) {
  .mobile-menu-panel-enter-from,
  .mobile-menu-panel-leave-to,
  .mobile-menu-panel-enter-from .mobile-menu-item {
    transform: none;
  }

  .mobile-menu-icon-line {
    transition: none;
  }
}
</style>
