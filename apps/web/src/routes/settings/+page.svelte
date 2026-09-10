<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { settingsUrl } from '$lib/components/settings/settings-tabs';

  // Fallback for environments where the +page.ts redirect is not applied
  // (e.g. SPA fallback serving). The canonical redirect lives in +page.ts.
  onMount(() => {
    goto(settingsUrl('Reader'), { replaceState: true });
  });
</script>

<svelte:head>
  <meta http-equiv="refresh" content="0;url={settingsUrl('Reader')}" />
</svelte:head>

<p class="p-8 text-center text-sm opacity-70">Redirecting to settings…</p>
