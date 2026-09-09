<script lang="ts">
  import DialogTemplate from '$lib/components/dialog-template.svelte';
  import Ripple from '$lib/components/ripple.svelte';
  import { buttonClasses } from '$lib/css-classes';
  import { externalReadAction$ } from '$lib/data/store';
  import { createEventDispatcher } from 'svelte';

  export let resolver: (action: 'download' | 'continue' | 'cancel') => void;
  export let bookTitle = '';
  export let sourceLabel = '';
  export let hasLocalCopy = false;

  let rememberChoice = true;

  const dispatch = createEventDispatcher<{
    close: void;
  }>();

  function closeDialog(action: 'download' | 'continue' | 'cancel') {
    if (rememberChoice && action !== 'cancel') {
      externalReadAction$.next(action === 'download' ? 'download' : 'stream');
    }
    resolver(action);
    dispatch('close');
  }
</script>

<DialogTemplate>
  <svelte:fragment slot="header">External Read</svelte:fragment>
  <svelte:fragment slot="content">
    {#if bookTitle}
      <p class="my-2">
        “{bookTitle}” is stored on {sourceLabel || 'an external source'}{hasLocalCopy
          ? ' (a newer version is available there)'
          : ''}.
      </p>
    {:else}
      <p class="my-2">You are opening a book from an external storage source.</p>
    {/if}
    <p class="my-2">
      Download to this browser for fastest reading. This saves the book content, reading progress,
      and your manual bookmarks here.
    </p>
    <p class="my-2">Continue without downloading re-downloads the book every time.</p>
    <p class="my-2 text-sm opacity-70">
      History/autosaves always stay on this device and are never uploaded.
    </p>
    <p class="flex items-center mt-4">
      <input id="ext-remember" type="checkbox" bind:checked={rememberChoice} />
      <label class="ml-2" for="ext-remember">Remember my choice</label>
    </p>
  </svelte:fragment>
  <div class="flex flex-col sm:flex-row grow sm:justify-between" slot="footer">
    <button class={buttonClasses} on:click={() => closeDialog('cancel')}>
      Cancel
      <Ripple />
    </button>
    <button class={buttonClasses} on:click={() => closeDialog('continue')}>
      No, just continue
      <Ripple />
    </button>
    <button class={buttonClasses} on:click={() => closeDialog('download')}>
      Download to browser
      <Ripple />
    </button>
  </div>
</DialogTemplate>
