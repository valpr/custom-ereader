<script lang="ts">
  import { onDestroy, tick } from 'svelte';
  import type { TooltipPosition } from '../types';

  export let text: string = '';
  export let content: string = '';
  export let position: TooltipPosition = 'top';
  export let disabled: boolean = false;
  export let delay: number = 150;
  export let offset: number = 6;
  export let portal: boolean = true;
  export let maxWidth: number | string = 280;
  export let tooltipClass: string = '';
  let customClass: string = '';
  export { customClass as class };

  let isVisible = false;
  let timeoutId: any;
  let wrapperEl: HTMLElement;
  let tooltipEl: HTMLElement;

  const tooltipId = `astryx-tooltip-${Math.random().toString(36).substring(2, 9)}`;

  let coords = {
    top: 0,
    left: 0,
    actualPosition: position,
    arrowLeft: 0,
    arrowTop: 0
  };

  $: tooltipText = text || content;
  $: parsedMaxWidth = typeof maxWidth === 'number' ? `${maxWidth}px` : maxWidth;

  function portalAction(node: HTMLElement, enabled: boolean) {
    if (!enabled || typeof document === 'undefined') return;
    document.body.appendChild(node);
    return {
      update(newEnabled: boolean) {
        if (newEnabled && node.parentNode !== document.body) {
          document.body.appendChild(node);
        }
      },
      destroy() {
        if (node.parentNode) {
          node.parentNode.removeChild(node);
        }
      }
    };
  }

  function calculatePosition() {
    if (!wrapperEl || !tooltipEl || typeof window === 'undefined') return;

    const triggerRect = wrapperEl.getBoundingClientRect();
    const tooltipRect = tooltipEl.getBoundingClientRect();

    // If trigger is invisible or detached, hide tooltip
    if (triggerRect.width === 0 && triggerRect.height === 0) {
      isVisible = false;
      return;
    }

    const padding = 8;
    const arrowSize = 5;
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;

    let actualPosition = position;

    // Viewport flipping logic
    if (actualPosition === 'top') {
      const neededSpace = tooltipRect.height + offset + padding;
      if (triggerRect.top < neededSpace && windowHeight - triggerRect.bottom > triggerRect.top) {
        actualPosition = 'bottom';
      }
    } else if (actualPosition === 'bottom') {
      const neededSpace = tooltipRect.height + offset + padding;
      if (
        windowHeight - triggerRect.bottom < neededSpace &&
        triggerRect.top > windowHeight - triggerRect.bottom
      ) {
        actualPosition = 'top';
      }
    } else if (actualPosition === 'left') {
      const neededSpace = tooltipRect.width + offset + padding;
      if (triggerRect.left < neededSpace && windowWidth - triggerRect.right > triggerRect.left) {
        actualPosition = 'right';
      }
    } else if (actualPosition === 'right') {
      const neededSpace = tooltipRect.width + offset + padding;
      if (
        windowWidth - triggerRect.right < neededSpace &&
        triggerRect.left > windowWidth - triggerRect.right
      ) {
        actualPosition = 'left';
      }
    }

    let top = 0;
    let left = 0;
    let arrowLeft = 0;
    let arrowTop = 0;

    if (actualPosition === 'top' || actualPosition === 'bottom') {
      if (actualPosition === 'top') {
        top = triggerRect.top - tooltipRect.height - offset;
      } else {
        top = triggerRect.bottom + offset;
      }

      const triggerCenter = triggerRect.left + triggerRect.width / 2;
      const rawLeft = triggerCenter - tooltipRect.width / 2;

      // Clamp horizontal position so tooltip does not overflow viewport edges
      left = Math.max(padding, Math.min(rawLeft, windowWidth - tooltipRect.width - padding));

      // Arrow points at trigger center
      arrowLeft = triggerCenter - left;
      // Clamp arrow inside tooltip bounds
      arrowLeft = Math.max(arrowSize + 4, Math.min(arrowLeft, tooltipRect.width - arrowSize - 4));
    } else {
      if (actualPosition === 'left') {
        left = triggerRect.left - tooltipRect.width - offset;
      } else {
        left = triggerRect.right + offset;
      }

      const triggerMiddle = triggerRect.top + triggerRect.height / 2;
      const rawTop = triggerMiddle - tooltipRect.height / 2;

      // Clamp vertical position so tooltip does not overflow viewport top/bottom
      top = Math.max(padding, Math.min(rawTop, windowHeight - tooltipRect.height - padding));

      // Arrow points at trigger middle
      arrowTop = triggerMiddle - top;
      arrowTop = Math.max(arrowSize + 4, Math.min(arrowTop, tooltipRect.height - arrowSize - 4));
    }

    coords = {
      top: Math.round(top),
      left: Math.round(left),
      actualPosition,
      arrowLeft: Math.round(arrowLeft),
      arrowTop: Math.round(arrowTop)
    };
  }

  function handleWindowScroll() {
    if (!isVisible) return;
    calculatePosition();
  }

  function handleWindowResize() {
    if (!isVisible) return;
    calculatePosition();
  }

  function handleKeyDown(event: KeyboardEvent) {
    if (event.key === 'Escape' && isVisible) {
      hide();
    }
  }

  function addActiveListeners() {
    if (typeof window === 'undefined') return;
    window.addEventListener('scroll', handleWindowScroll, { capture: true, passive: true });
    window.addEventListener('resize', handleWindowResize, { passive: true });
    window.addEventListener('keydown', handleKeyDown);
  }

  function removeActiveListeners() {
    if (typeof window === 'undefined') return;
    window.removeEventListener('scroll', handleWindowScroll, { capture: true });
    window.removeEventListener('resize', handleWindowResize);
    window.removeEventListener('keydown', handleKeyDown);
  }

  async function show() {
    if (disabled) return;
    if (!tooltipText && !$$slots.content) return;
    clearTimeout(timeoutId);
    timeoutId = setTimeout(async () => {
      isVisible = true;
      addActiveListeners();
      await tick();
      calculatePosition();
    }, delay);
  }

  function hide() {
    clearTimeout(timeoutId);
    if (isVisible) {
      isVisible = false;
      removeActiveListeners();
    }
  }

  onDestroy(() => {
    clearTimeout(timeoutId);
    removeActiveListeners();
  });

  // Mirror native title behavior: any press or click dismisses the tooltip
  // (and cancels a pending show) so it can never linger over an open menu.
  // Window-level: pressing one control hides another control's tooltip
  // (e.g. cloud warning tooltip over the Import/Filter dropdowns).
  // Same-target clicks are covered too since the event bubbles to window.
</script>

<svelte:window on:pointerdown={hide} on:click={hide} />

<div
  bind:this={wrapperEl}
  role="group"
  aria-describedby={isVisible ? tooltipId : undefined}
  class="astryx-tooltip-wrapper {customClass}"
  on:mouseenter={show}
  on:mouseleave={hide}
  on:focusin={show}
  on:focusout={hide}
  {...$$restProps}
>
  <slot />

  {#if isVisible && (tooltipText || $$slots.content)}
    <div
      use:portalAction={portal}
      id={tooltipId}
      bind:this={tooltipEl}
      role="tooltip"
      class="astryx-tooltip {tooltipClass}"
      data-position={coords.actualPosition}
      style="
        position: fixed;
        top: {coords.top}px;
        left: {coords.left}px;
        max-width: min({parsedMaxWidth}, calc(100vw - 16px));
        writing-mode: horizontal-tb;
      "
    >
      {#if $$slots.content}
        <slot name="content" />
      {:else}
        {tooltipText}
      {/if}

      <div
        class="astryx-tooltip-arrow"
        data-arrow-position={coords.actualPosition}
        style="
          {coords.actualPosition === 'top' || coords.actualPosition === 'bottom'
          ? `left: ${coords.arrowLeft}px;`
          : `top: ${coords.arrowTop}px;`}
        "
      ></div>
    </div>
  {/if}
</div>

<style>
  .astryx-tooltip-wrapper {
    position: relative;
    display: inline-flex;
    align-items: center;
    vertical-align: middle;
    writing-mode: horizontal-tb;
  }

  .astryx-tooltip {
    z-index: 10000;
    display: block;
    width: max-content;
    box-sizing: border-box;
    writing-mode: horizontal-tb;
    padding: var(--astryx-space-1, 4px) var(--astryx-space-2-5, 9px);
    font-family: var(
      --astryx-font-family-sans,
      -apple-system,
      BlinkMacSystemFont,
      'Segoe UI',
      Roboto,
      sans-serif
    );
    font-size: var(--astryx-font-size-xs, 0.75rem);
    font-weight: var(--astryx-font-weight-medium, 500);
    line-height: 1.35;
    color: #ffffff;
    background-color: #18181b;
    border-radius: var(--astryx-radius-sm, 4px);
    box-shadow:
      0 4px 6px -1px rgba(0, 0, 0, 0.2),
      0 2px 4px -2px rgba(0, 0, 0, 0.2);
    white-space: normal;
    word-break: normal;
    overflow-wrap: break-word;
    text-align: center;
    pointer-events: none;
    animation: astryx-tooltip-fade var(--astryx-duration-fast, 120ms) ease forwards;
  }

  /* Transform origins for smooth pop */
  [data-position='top'] {
    transform-origin: bottom center;
  }
  [data-position='bottom'] {
    transform-origin: top center;
  }
  [data-position='left'] {
    transform-origin: right center;
  }
  [data-position='right'] {
    transform-origin: left center;
  }

  /* Arrows */
  .astryx-tooltip-arrow {
    position: absolute;
    width: 0;
    height: 0;
  }

  [data-arrow-position='top'] {
    top: 100%;
    transform: translateX(-50%);
    border-left: 5px solid transparent;
    border-right: 5px solid transparent;
    border-top: 5px solid #18181b;
  }

  [data-arrow-position='bottom'] {
    bottom: 100%;
    transform: translateX(-50%);
    border-left: 5px solid transparent;
    border-right: 5px solid transparent;
    border-bottom: 5px solid #18181b;
  }

  [data-arrow-position='left'] {
    left: 100%;
    transform: translateY(-50%);
    border-top: 5px solid transparent;
    border-bottom: 5px solid transparent;
    border-left: 5px solid #18181b;
  }

  [data-arrow-position='right'] {
    right: 100%;
    transform: translateY(-50%);
    border-top: 5px solid transparent;
    border-bottom: 5px solid transparent;
    border-right: 5px solid #18181b;
  }

  @keyframes astryx-tooltip-fade {
    from {
      opacity: 0;
      transform: scale(0.96);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }
</style>
