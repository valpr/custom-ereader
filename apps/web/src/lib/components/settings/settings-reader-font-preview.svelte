<script lang="ts">
  import { faChevronDown, faChevronUp } from '@fortawesome/free-solid-svg-icons';
  import { IconButton, SegmentedControl, Slider, Tooltip } from '@custom-ereader/ui';
  import type { WritingMode } from '$lib/data/writing-mode';
  import Fa from 'svelte-fa';

  export let fontSize: number;
  export let lineHeight: number;
  export let fontFamilyGroupOne: string;
  export let fontWeight: number | null;
  export let enableFontKerning: boolean;
  export let enableFontVPAL: boolean;
  export let writingMode: WritingMode;
  export let currentThemeOption:
    | {
        backgroundColor?: string;
        fontColor?: string;
      }
    | undefined = undefined;

  const sampleJapanese =
    '吾輩は猫である。名前はまだ無い。どこで生れたかとんと見当がつかぬ。何でも薄暗いじめじめした所でニャーニャー泣いていた事だけは記憶している。';
  const sampleDialogue =
    '「本当に行くのかい？」「ええ、もう決めたの」風が木々を揺らし、二人の間に微かな沈黙が流れた。夜空には満天の星が瞬いていた。';
  const sampleEnglish =
    'The quick brown fox jumps over the lazy dog. Reading is to the mind what exercise is to the body. Books are a uniquely portable magic.';

  const segmentsForPreviewWritingMode = [
    { value: 'horizontal-tb', label: '横書き' },
    { value: 'vertical-rl', label: '縦書き' }
  ];

  let previewText = sampleJapanese;
  let previewWritingMode: WritingMode = writingMode;
  let previousWritingMode: WritingMode = writingMode;
  $: if (writingMode !== previousWritingMode) {
    previewWritingMode = writingMode;
    previousWritingMode = writingMode;
  }

  let isCollapsedMobile = false;
</script>

<div
  data-testid="reader-font-preview-card"
  class="sticky top-14 sm:top-16 z-20 w-full mb-6 rounded-xl border border-[var(--astryx-color-border-default,#e4e4e7)] bg-[var(--astryx-color-surface,#ffffff)] shadow-sm transition-all overflow-hidden"
>
  <!-- Card Header -->
  <div
    class="flex items-center justify-between px-3.5 py-2.5 sm:px-4 sm:py-3 border-b border-[var(--astryx-color-border-subtle,#f4f4f5)] bg-[var(--astryx-color-surface-subtle,#fafafa)]"
  >
    <div class="flex items-center gap-2 min-w-0">
      <span
        class="text-xs sm:text-sm font-semibold text-[var(--astryx-color-fg-primary,#18181b)] tracking-tight"
      >
        Example Font Preview
      </span>
      <span
        class="text-xs font-semibold px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 tabular-nums shrink-0"
      >
        {fontSize}px
      </span>
      <span
        class="hidden sm:inline-block text-xs font-semibold px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 tabular-nums shrink-0"
      >
        {Number(lineHeight).toFixed(2)}x
      </span>
    </div>

    <div class="flex items-center gap-1.5 sm:gap-2 shrink-0">
      <div class="scale-90 sm:scale-100 origin-right">
        <SegmentedControl
          size="sm"
          options={segmentsForPreviewWritingMode}
          bind:value={previewWritingMode}
        />
      </div>

      <!-- Mobile Collapse/Expand Toggle -->
      <div class="sm:hidden">
        <Tooltip text={isCollapsedMobile ? 'Expand Preview' : 'Collapse Preview'}>
          <IconButton
            variant="ghost"
            size="sm"
            label={isCollapsedMobile ? 'Expand Preview' : 'Collapse Preview'}
            on:click={() => (isCollapsedMobile = !isCollapsedMobile)}
          >
            <Fa icon={isCollapsedMobile ? faChevronDown : faChevronUp} />
          </IconButton>
        </Tooltip>
      </div>
    </div>
  </div>

  <!-- Body Content -->
  {#if !isCollapsedMobile}
    <div class="p-3 sm:p-4 flex flex-col gap-3">
      <!-- Quick slider controls for fast typography adjustment -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-4 items-center">
        <div class="flex items-center gap-2 w-full">
          <span
            class="text-xs text-[var(--astryx-color-fg-secondary,#71717a)] shrink-0 w-16 sm:w-14"
          >
            Size:
          </span>
          <div class="flex-1 min-w-0">
            <Slider min={10} max={48} step={1} bind:value={fontSize} showValue={false} />
          </div>
        </div>

        <div class="flex items-center gap-2 w-full">
          <span
            class="text-xs text-[var(--astryx-color-fg-secondary,#71717a)] shrink-0 w-16 sm:w-14"
          >
            Height:
          </span>
          <div class="flex-1 min-w-0">
            <Slider min={1.0} max={2.5} step={0.05} bind:value={lineHeight} showValue={false} />
          </div>
        </div>
      </div>

      <!-- Live Preview Area -->
      <div
        contenteditable="true"
        role="textbox"
        tabindex="0"
        aria-multiline="true"
        aria-label="Editable font preview text"
        bind:textContent={previewText}
        class="live-font-preview w-full rounded-lg border border-dashed border-zinc-300 dark:border-zinc-700 p-3 sm:p-4 transition-[font-size,line-height] outline-none focus:ring-1 focus:ring-zinc-400 dark:focus:ring-zinc-600 select-text cursor-text box-border"
        style:font-size={`${fontSize}px`}
        style:line-height={`${lineHeight}`}
        style:font-family={fontFamilyGroupOne ? `"${fontFamilyGroupOne}", serif` : 'serif'}
        style:font-weight={fontWeight ? `${fontWeight}` : 'inherit'}
        style:font-kerning={enableFontKerning ? 'normal' : 'none'}
        style:font-feature-settings={enableFontVPAL ? '"vpal"' : 'normal'}
        style:writing-mode={previewWritingMode}
        style:height={previewWritingMode === 'vertical-rl' ? '140px' : 'auto'}
        style:min-height={previewWritingMode === 'vertical-rl' ? '140px' : '64px'}
        style:max-height={previewWritingMode === 'vertical-rl' ? '180px' : '140px'}
        style:overflow-x={previewWritingMode === 'vertical-rl' ? 'auto' : 'hidden'}
        style:overflow-y={previewWritingMode === 'vertical-rl' ? 'hidden' : 'auto'}
        style:background-color={currentThemeOption?.backgroundColor ??
          'var(--astryx-color-surface-subtle, rgba(0, 0, 0, 0.03))'}
        style:color={currentThemeOption?.fontColor ?? 'var(--astryx-color-fg-primary, inherit)'}
      />

      <!-- Quick sample text buttons -->
      <div
        class="flex flex-wrap items-center justify-between gap-1.5 text-xs text-zinc-500 dark:text-zinc-400 px-0.5"
      >
        <span class="text-[11px] sm:text-xs">Click text above to test custom words</span>
        <div class="flex items-center gap-1.5">
          <button
            type="button"
            class="hover:underline hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors text-[11px] sm:text-xs"
            on:click={() => (previewText = sampleJapanese)}
          >
            吾輩は猫 (JA)
          </button>
          <span>•</span>
          <button
            type="button"
            class="hover:underline hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors text-[11px] sm:text-xs"
            on:click={() => (previewText = sampleDialogue)}
          >
            Dialogue
          </button>
          <span>•</span>
          <button
            type="button"
            class="hover:underline hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors text-[11px] sm:text-xs"
            on:click={() => (previewText = sampleEnglish)}
          >
            English
          </button>
        </div>
      </div>
    </div>
  {/if}
</div>
