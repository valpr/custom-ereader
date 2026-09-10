<script lang="ts">
  import MergedHeaderIcon from '$lib/components/merged-header-icon/merged-header-icon.svelte';
  import { settingsUrl } from '$lib/components/settings/settings-tabs';
  import { TopBar, Tabs } from '@custom-ereader/ui';

  export let leavePageLink: string;
  export let activeSettings: string;

  // Anchor-backed tabs: native href navigation works before JS hydration
  // (full page load) and is SvelteKit-enhanced to SPA navigation after.
  $: settingItems = [
    {
      id: 'Reader',
      label: 'Reader',
      href: settingsUrl('Reader')
    },
    {
      id: 'Data',
      label: 'Data',
      href: settingsUrl('Data')
    },
    {
      id: 'Statistics',
      label: 'Statistics',
      href: settingsUrl('Statistics')
    }
  ];
</script>

<TopBar bordered={true} class="shadow-sm">
  <div slot="start" class="font-semibold text-sm tracking-tight hidden sm:block opacity-90 pl-1">
    Settings
  </div>

  <div class="flex items-center justify-center w-full max-w-xs sm:max-w-sm">
    <Tabs items={settingItems} activeId={activeSettings} variant="pill" size="sm" />
  </div>

  <div slot="end" class="flex items-center">
    <MergedHeaderIcon {leavePageLink} />
  </div>
</TopBar>
