<script lang="ts">
  import DialogTemplate from '$lib/components/dialog-template.svelte';
  import Ripple from '$lib/components/ripple.svelte';
  import { getCardDateInfo, getSourceLabel } from '$lib/components/book-card/book-card-info';
  import type { StorageKey } from '$lib/data/storage/storage-types';
  import { normalizeTag, normalizeTagList } from '$lib/data/book-tags';
  import { buttonClasses } from '$lib/css-classes';
  import { createEventDispatcher } from 'svelte';

  export let title = '';
  export let characters = 0;
  export let progress = 0;
  export let lastBookOpen = 0;
  export let lastBookmarkModified = 0;
  export let lastBookModified = 0;
  export let sources: StorageKey[] = [];
  export let initialTags: string[] = [];
  export let allTags: string[] = [];
  export let isCloudOnly = false;
  export let onSaveTags: ((tags: string[]) => Promise<void>) | undefined = undefined;

  const dispatch = createEventDispatcher<{
    close: void;
  }>();

  let tags: string[] = normalizeTagList(initialTags);
  let inputValue = '';
  let suggestionsOpen = false;
  let highlightedIndex = -1;
  let saving = false;
  let saveError = '';

  $: sourceLabels = (sources || []).map(getSourceLabel);
  $: progressLabel = `${Math.round((progress || 0) * 100)}%`;
  $: suggestions = (allTags || [])
    .filter((tag) => {
      const query = inputValue.trim().toLowerCase();
      return tag && !tags.includes(tag) && (!query || tag.includes(query));
    })
    .slice(0, 8);
  $: if (!suggestionsOpen) {
    highlightedIndex = -1;
  }
  $: dirty =
    JSON.stringify([...tags].sort()) !== JSON.stringify(normalizeTagList(initialTags)) ||
    !!normalizeTag(inputValue);

  function addTag(raw: string) {
    const normalized = normalizeTag(raw);
    if (!normalized || tags.includes(normalized)) {
      inputValue = '';
      suggestionsOpen = false;
      return;
    }
    tags = normalizeTagList([...tags, normalized]);
    inputValue = '';
    suggestionsOpen = false;
    saveError = '';
  }

  function removeTag(tag: string) {
    tags = tags.filter((t) => t !== tag);
    saveError = '';
  }

  function onInputKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault();
      if (suggestionsOpen && highlightedIndex >= 0 && suggestions[highlightedIndex]) {
        addTag(suggestions[highlightedIndex]);
      } else {
        addTag(inputValue);
      }
    } else if (event.key === 'Backspace' && !inputValue && tags.length) {
      removeTag(tags[tags.length - 1]);
    } else if (event.key === 'ArrowDown' && suggestionsOpen && suggestions.length) {
      event.preventDefault();
      highlightedIndex = (highlightedIndex + 1) % suggestions.length;
    } else if (event.key === 'ArrowUp' && suggestionsOpen && suggestions.length) {
      event.preventDefault();
      highlightedIndex = (highlightedIndex - 1 + suggestions.length) % suggestions.length;
    } else if (event.key === 'Escape') {
      suggestionsOpen = false;
    }
  }

  async function save() {
    if (!onSaveTags || saving || isCloudOnly) return;
    // Commit any pending input so typing a tag then clicking Save directly works.
    if (normalizeTag(inputValue)) {
      addTag(inputValue);
    }
    saving = true;
    saveError = '';
    try {
      await onSaveTags(tags);
      dispatch('close');
    } catch (error: any) {
      saveError = error?.message || 'Failed to save tags';
    } finally {
      saving = false;
    }
  }
</script>

<DialogTemplate>
  <svelte:fragment slot="header">
    <span class="break-words">{title}</span>
  </svelte:fragment>
  <svelte:fragment slot="content">
    <div data-testid="book-details-dialog" class="w-full max-w-sm">
      <div>Sources:</div>
      <div class="w-full break-words">
        {sourceLabels.length ? sourceLabels.join(', ') : 'No Data'}
      </div>
      <div class="mt-4">Progress:</div>
      <div class="w-full">{progressLabel}</div>
      <div class="mt-4">Characters:</div>
      <div class="w-full">{characters || 'No Data'}</div>
      <div class="mt-4">Last Read:</div>
      <div class="w-full">{getCardDateInfo(lastBookOpen)}</div>
      <div class="mt-4">Bookmarked:</div>
      <div class="w-full">{getCardDateInfo(lastBookmarkModified)}</div>
      <div class="mt-4">Last Update:</div>
      <div class="w-full">{getCardDateInfo(lastBookModified)}</div>

      <div class="mt-4" data-testid="book-tags-editor">
        <label for="book-tags-input" class="mb-1 block">Tags:</label>
        {#if isCloudOnly}
          <div class="text-sm opacity-70">
            {#if tags.length}
              <div class="flex flex-wrap gap-1">
                {#each tags as tag (tag)}
                  <span
                    class="rounded-full bg-[var(--astryx-color-surface,#ffffff)] px-1.5 py-0.5 text-[10px] font-semibold text-[var(--astryx-color-fg-secondary,#52525b)] shadow"
                  >
                    {tag}
                  </span>
                {/each}
              </div>
            {:else}
              <span>No tags yet.</span>
            {/if}
            <div class="mt-1">Download this book to edit its tags.</div>
          </div>
        {:else}
          <div class="flex flex-wrap gap-1">
            {#each tags as tag (tag)}
              <span
                class="inline-flex items-center gap-1 rounded-full bg-[var(--astryx-color-primary-subtle,rgba(99,102,241,0.15))] px-1.5 py-0.5 text-[10px] font-semibold text-[var(--astryx-color-primary,#6366f1)]"
              >
                {tag}
                <button
                  type="button"
                  data-testid="remove-tag-{tag}"
                  aria-label="Remove tag {tag}"
                  class="cursor-pointer font-bold opacity-70 hover:opacity-100"
                  on:click={() => removeTag(tag)}>×</button
                >
              </span>
            {/each}
          </div>
          <div class="relative mt-1">
            <input
              id="book-tags-input"
              data-testid="book-tags-input"
              type="text"
              class="w-full rounded border border-gray-300 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none"
              placeholder="Add a tag, e.g. fantasy"
              autocomplete="off"
              bind:value={inputValue}
              on:focus={() => (suggestionsOpen = true)}
              on:blur={() => {
                setTimeout(() => (suggestionsOpen = false), 150);
              }}
              on:input={() => {
                suggestionsOpen = true;
                highlightedIndex = -1;
              }}
              on:keydown={onInputKeydown}
            />
            {#if suggestionsOpen && suggestions.length}
              <div
                data-testid="book-tags-suggestions"
                role="listbox"
                class="absolute z-10 mt-1 max-h-40 w-full overflow-auto rounded border border-gray-300 bg-white shadow-lg"
              >
                {#each suggestions as suggestion, index (suggestion)}
                  <button
                    type="button"
                    role="option"
                    aria-selected={index === highlightedIndex}
                    data-testid="tag-suggestion-{suggestion}"
                    class="block w-full px-2 py-1 text-left text-sm hover:bg-gray-100"
                    class:bg-gray-100={index === highlightedIndex}
                    on:mousedown={(event) => {
                      event.preventDefault();
                      addTag(suggestion);
                    }}
                  >
                    {suggestion}
                  </button>
                {/each}
              </div>
            {/if}
          </div>
          {#if saveError}
            <div class="mt-1 text-sm text-red-600" role="alert">{saveError}</div>
          {/if}
        {/if}
      </div>
    </div>
  </svelte:fragment>
  <div class="flex grow justify-end gap-2" slot="footer">
    {#if !isCloudOnly && onSaveTags}
      <button
        class={buttonClasses}
        data-testid="save-tags"
        disabled={saving || !dirty}
        on:click={save}
      >
        {saving ? 'Saving...' : 'Save tags'}
        <Ripple />
      </button>
    {/if}
    <button class={buttonClasses} on:click={() => dispatch('close')}>
      Close
      <Ripple />
    </button>
  </div>
</DialogTemplate>
