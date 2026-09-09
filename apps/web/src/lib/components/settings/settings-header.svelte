<script lang="ts">
  import { goto } from '$app/navigation';
  import MergedHeaderIcon from '$lib/components/merged-header-icon/merged-header-icon.svelte';
  import { settingsUrl } from '$lib/components/settings/settings-tabs';
  import { TopBar, Tabs } from '@custom-ereader/ui';

  export let leavePageLink: string;
  export let activeSettings: string;

  const settingItems = [
    {
      id: 'Reader',
      label: 'Reader'
    },
    {
      id: 'Data',
      label: 'Data'
    },
    {
      id: 'Statistics',
      label: 'Statistics'
    }
  ];
</script>

<TopBar bordered={true} class="shadow-sm">
  <div slot="start" class="font-semibold text-sm tracking-tight hidden sm:block opacity-90 pl-1">
    Settings
  </div>

  <div class="flex items-center justify-center w-full max-w-xs sm:max-w-sm">
    <Tabs
      items={settingItems}
      activeId={activeSettings}
      on:change={(e) => goto(settingsUrl(e.detail.id))}
      variant="pill"
      size="sm"
    />
  </div>

  <div slot="end" class="flex items-center">
    <MergedHeaderIcon {leavePageLink} />
  </div>
</TopBar>
