<script lang="ts">
  export let items: any[] = [];
  export let minVisibleItems: number = 0;
  export let collapseFrom: 'start' | 'end' = 'end';
  export let itemWidth: number = 36;
  export let overflowWidth: number = 36;
  export let gap: number = 4;
  export let availableWidth: number | undefined = undefined;
  let customClass: string = '';
  export { customClass as class };

  let containerWidth: number = 0;

  $: effectiveSpace = availableWidth !== undefined ? availableWidth : containerWidth;
  $: totalItems = items.length;

  $: visibleCount = (() => {
    if (totalItems === 0) return 0;
    if (effectiveSpace <= 0) return minVisibleItems;

    // Check if all items fit without needing an overflow trigger button
    const fullSpaceNeeded = totalItems * itemWidth + Math.max(0, totalItems - 1) * gap;
    if (effectiveSpace >= fullSpaceNeeded) {
      return totalItems;
    }

    // When space is constrained, reserve space for the overflow button and gap
    const unitWidth = itemWidth + gap;
    const spaceForItems = Math.max(0, effectiveSpace - overflowWidth - gap);
    const count = Math.floor((spaceForItems + gap) / unitWidth);

    return Math.max(minVisibleItems, Math.min(totalItems - 1, count));
  })();

  export let visibleItems: any[] = [];
  export let overflowItems: any[] = [];

  $: visibleItems =
    collapseFrom === 'end' ? items.slice(0, visibleCount) : items.slice(totalItems - visibleCount);

  $: overflowItems =
    collapseFrom === 'end' ? items.slice(visibleCount) : items.slice(0, totalItems - visibleCount);
</script>

<div
  class="astryx-overflow-list {customClass}"
  style:gap={`${gap}px`}
  bind:clientWidth={containerWidth}
  {...$$restProps}
>
  {#each visibleItems as item, index (item.id ?? index)}
    <slot name="item" {item} {index}>
      <slot {item} {index} />
    </slot>
  {/each}

  {#if overflowItems.length > 0}
    <slot name="overflow" {overflowItems} />
  {/if}
</div>

<style>
  .astryx-overflow-list {
    display: inline-flex;
    align-items: center;
    box-sizing: border-box;
  }
</style>
