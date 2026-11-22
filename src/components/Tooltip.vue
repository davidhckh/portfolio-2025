<script setup lang="ts">
// A small modern tooltip: a dark bubble with an arrow that fades and slides in on
// hover and on keyboard focus (focus-within), for icon-only buttons. The bubble is
// aria-hidden and never takes pointer events; the wrapped control keeps its own
// aria-label for screen readers.
withDefaults(defineProps<{ label: string; placement?: "top" | "bottom" }>(), { placement: "top" });
</script>

<template>
  <span class="tooltip" :class="`tooltip-${placement}`">
    <slot />
    <span class="tooltip-bubble" aria-hidden="true">{{ label }}</span>
  </span>
</template>

<style scoped lang="scss">
.tooltip {
  position: relative;
  display: inline-flex;

  &-bubble {
    position: absolute;
    left: 50%;
    z-index: 50;
    padding: 6px 10px;
    border-radius: 8px;
    background: #1f1e1d;
    border: 1px solid rgba(255, 255, 255, 0.12);
    box-shadow: 0 6px 18px rgba(0, 0, 0, 0.18);
    color: #fff;
    font-size: 12.5px;
    font-weight: 700;
    letter-spacing: 0.01em;
    line-height: 1.2;
    white-space: nowrap;
    pointer-events: none;
    opacity: 0;
    transition:
      opacity 0.16s ease-out,
      transform 0.16s ease-out;

    // Arrow.
    &::after {
      content: "";
      position: absolute;
      left: 50%;
      width: 8px;
      height: 8px;
      background: inherit;
      border: inherit;
      transform: translateX(-50%) rotate(45deg);
    }
  }

  &-top &-bubble {
    bottom: calc(100% + 10px);
    transform: translate(-50%, 4px) scale(0.96);

    &::after {
      top: calc(100% - 4px);
      border-top: none;
      border-left: none;
    }
  }

  &-bottom &-bubble {
    top: calc(100% + 10px);
    transform: translate(-50%, -4px) scale(0.96);

    &::after {
      bottom: calc(100% - 4px);
      border-bottom: none;
      border-right: none;
    }
  }

  // Hover (pointer devices only, so a tap doesn't leave it stuck open) or keyboard focus.
  @media (hover: hover) {
    &:hover .tooltip-bubble {
      opacity: 1;
      transform: translate(-50%, 0) scale(1);
      transition-delay: 0.08s;
    }
  }

  &:has(:focus-visible) .tooltip-bubble {
    opacity: 1;
    transform: translate(-50%, 0) scale(1);
  }

  @media (prefers-reduced-motion: reduce) {
    &-bubble,
    &-top &-bubble,
    &-bottom &-bubble {
      transition: opacity 0.12s linear;
      transform: translate(-50%, 0);
    }
  }
}
</style>
