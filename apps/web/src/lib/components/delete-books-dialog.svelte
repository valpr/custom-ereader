<script lang="ts">
  import DialogTemplate from '$lib/components/dialog-template.svelte';
  import Ripple from '$lib/components/ripple.svelte';
  import { buttonClasses } from '$lib/css-classes';
  import { pluralize } from '$lib/functions/utils';
  import { createEventDispatcher } from 'svelte';

  export let titles: string[] = [];
  export let cloudSummary = '';
  export let hasLocalCopy = true;
  export let initialDeleteFromCloud = false;
  export let resolver: (result: { canceled: boolean; deleteFromCloud: boolean }) => void;

  let deleteFromCloud = initialDeleteFromCloud;

  const dispatch = createEventDispatcher<{
    close: void;
  }>();

  function closeDialog(canceled: boolean) {
    resolver({ canceled, deleteFromCloud });
    dispatch('close');
  }

  $: singleTitle = titles.length === 1 ? titles[0] : '';
</script>

<DialogTemplate>
  <svelte:fragment slot="header">
    {#if titles.length === 1}
      Delete “{singleTitle}”?
    {:else}
      Delete {titles.length} {pluralize(titles.length, 'Book', false)}?
    {/if}
  </svelte:fragment>
  <svelte:fragment slot="content">
    <p style="white-space: pre-line; word-break: break-word;">
      {#if titles.length === 1}
        {#if hasLocalCopy}
          This removes the local browser copy, reading progress, and manual bookmarks for “{singleTitle}”.
        {:else}
          “{singleTitle}” has no local browser copy. This removes it from the cloud source(s) below.
        {/if}
      {:else}
        {#if hasLocalCopy}
          This removes the local browser copies, reading progress, and manual bookmarks for the
          selected books.
        {:else}
          The selected books have no local browser copies. This removes them from the cloud
          source(s) below.
        {/if}
      {/if}
      {#if cloudSummary}
        <br /><br />Also on: {cloudSummary}.
      {/if}
    </p>
    {#if cloudSummary}
      <p class="flex items-center mt-4">
        <input id="del-cloud" type="checkbox" bind:checked={deleteFromCloud} />
        <label class="ml-2" for="del-cloud"
          >Also delete from cloud sources where these books exist</label
        >
      </p>
    {/if}
    <p class="mt-3 text-sm opacity-70">
      Reading statistics on this device are kept per Settings → Keep Local Data on Deletion.
    </p>
  </svelte:fragment>
  <div class="flex grow justify-between" slot="footer">
    <button class={buttonClasses} on:click={() => closeDialog(true)}>
      Cancel
      <Ripple />
    </button>
    <button class={buttonClasses} on:click={() => closeDialog(false)}>
      {deleteFromCloud
        ? 'Delete everywhere'
        : hasLocalCopy
          ? 'Delete local copy'
          : 'Delete from cloud'}
      <Ripple />
    </button>
  </div>
</DialogTemplate>
