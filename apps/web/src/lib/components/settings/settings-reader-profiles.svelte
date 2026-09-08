<script lang="ts">
  import {
    faArrowsRotate,
    faCheck,
    faClone,
    faComputer,
    faDownload,
    faEdit,
    faFileExport,
    faFileImport,
    faMobileScreen,
    faPlus,
    faRotate,
    faSave,
    faSliders,
    faTabletScreenButton,
    faTrash,
    faTriangleExclamation,
    faUpload
  } from '@fortawesome/free-solid-svg-icons';
  import ConfirmDialog from '$lib/components/confirm-dialog.svelte';
  import MessageDialog from '$lib/components/message-dialog.svelte';
  import {
    Button,
    ButtonGroup,
    Card,
    Dialog,
    IconButton,
    Input,
    ListItem,
    ListSection,
    Select,
    Tooltip
  } from '@custom-ereader/ui';
  import { dialogManager } from '$lib/data/dialog-manager';
  import {
    applyProfile,
    applyProfileById,
    createProfile,
    deleteProfile,
    duplicateProfile,
    exportProfilesAsJson,
    getActiveProfile,
    getCurrentReaderSettings,
    hasUnsavedChanges,
    importProfilesFromJson,
    revertActiveProfile,
    saveCurrentToActiveProfile,
    updateProfileMetadata
  } from '$lib/data/profiles/profile-manager';
  import {
    defaultDesktopSettings,
    defaultMobileSettings,
    defaultReaderProfiles,
    defaultTabletSettings,
    type ProfileIconType,
    type ReaderProfile,
    type ReaderProfileSettings
  } from '$lib/data/profiles/profile-types';
  import {
    activeProfileId$,
    appThemeMode$,
    autoBookmark$,
    autoBookmarkTime$,
    autoPositionOnResize$,
    autosaveHistoryEnabled$,
    autosaveHistoryInterval$,
    autosaveHistoryMaxCount$,
    avoidPageBreak$,
    confirmClose$,
    customReadingPointEnabled$,
    disableWheelNavigation$,
    enableFontVPAL$,
    enableReaderWakeLock$,
    enableTapEdgeToFlip$,
    enableTextJustification$,
    enableTextWrapPretty$,
    enableVerticalFontKerning$,
    firstDimensionMargin$,
    fontFamilyGroupOne$,
    fontFamilyGroupTwo$,
    fontSize$,
    fontWeight$,
    furiganaStyle$,
    hideFurigana$,
    hideSpoilerImage$,
    hideSpoilerImageMode$,
    isOnline$,
    lastProfilesModified$,
    lineHeight$,
    manualBookmark$,
    pageColumns$,
    pauseTrackerOnCustomPointChange$,
    prioritizeReaderStyles$,
    readerProfiles$,
    secondDimensionMaxValue$,
    selectionToBookmarkEnabled$,
    showCharacterCounter$,
    showFooterChapterCharacterCounter$,
    showFooterChapterPercentage$,
    showPercentage$,
    swipeThreshold$,
    textIndentation$,
    textMarginMode$,
    textMarginValue$,
    theme$,
    verticalTextOrientation$,
    viewMode$,
    writingMode$
  } from '$lib/data/store';
  import { createEventDispatcher } from 'svelte';
  import Fa from 'svelte-fa';

  const dispatch = createEventDispatcher<{
    spinner: boolean;
    profileChange: ReaderProfile;
  }>();

  // Dialog state for Creating a Profile
  let showCreateModal = false;
  let newProfileName = '';
  let newProfileIcon: ProfileIconType = 'custom';
  let newProfileTemplate = 'current';

  // Dialog state for Renaming a Profile
  let showRenameModal = false;
  let renamingProfileId = '';
  let renamingProfileName = '';
  let renamingProfileIcon: ProfileIconType = 'custom';

  // Hidden file input for JSON import
  let fileInputElement: HTMLInputElement;

  // Reactively track changes between current settings and the active profile
  $: profiles = $readerProfiles$ || [];
  $: currentActiveId = $activeProfileId$;
  $: activeProfile =
    profiles.find((p) => p.id === currentActiveId) || profiles[0] || defaultReaderProfiles[0];

  let baselineSettings: ReaderProfileSettings | null = null;
  let lastTrackedProfileId = '';
  let isModified = false;

  // Reactively track if current slider/switch values differ from the session baseline
  $: {
    // Reference any store to trigger reactivity when settings change
    $fontSize$;
    $lineHeight$;
    $fontFamilyGroupOne$;
    $fontFamilyGroupTwo$;
    $fontWeight$;
    $writingMode$;
    $viewMode$;
    $pageColumns$;
    $theme$;
    $appThemeMode$;
    $firstDimensionMargin$;
    $secondDimensionMaxValue$;
    $swipeThreshold$;
    $enableTapEdgeToFlip$;
    $textIndentation$;
    $textMarginValue$;
    $textMarginMode$;
    $hideFurigana$;
    $furiganaStyle$;
    $hideSpoilerImage$;
    $hideSpoilerImageMode$;
    $enableTextJustification$;
    $enableTextWrapPretty$;
    $enableVerticalFontKerning$;
    $enableFontVPAL$;
    $verticalTextOrientation$;
    $prioritizeReaderStyles$;
    $showCharacterCounter$;
    $showPercentage$;
    $showFooterChapterCharacterCounter$;
    $showFooterChapterPercentage$;
    $manualBookmark$;
    $autoBookmark$;
    $autoBookmarkTime$;
    $autosaveHistoryEnabled$;
    $autosaveHistoryInterval$;
    $autosaveHistoryMaxCount$;
    $enableReaderWakeLock$;
    $avoidPageBreak$;
    $selectionToBookmarkEnabled$;
    $autoPositionOnResize$;
    $customReadingPointEnabled$;
    $disableWheelNavigation$;
    $confirmClose$;
    $readerProfiles$;
    $activeProfileId$;

    if (activeProfile) {
      if (lastTrackedProfileId !== currentActiveId) {
        lastTrackedProfileId = currentActiveId;
        baselineSettings = activeProfile.settings ? { ...activeProfile.settings } : null;
        isModified = false;
      } else if (baselineSettings) {
        const current = getCurrentReaderSettings();
        let hasDiff = false;
        for (const key of Object.keys(current) as (keyof ReaderProfileSettings)[]) {
          if (current[key] !== baselineSettings[key]) {
            hasDiff = true;
            break;
          }
        }
        isModified = hasDiff;

        // Auto-save setting changes to the active profile locally
        if (hasDiff) {
          saveCurrentToActiveProfile();
        }
      }
    } else {
      isModified = false;
    }
  }

  function getIcon(icon?: ProfileIconType) {
    switch (icon) {
      case 'desktop':
        return faComputer;
      case 'mobile':
        return faMobileScreen;
      case 'tablet':
        return faTabletScreenButton;
      default:
        return faSliders;
    }
  }

  function handleSelectProfile(id: string) {
    if (id === currentActiveId) return;
    const target = profiles.find((p) => p.id === id);
    if (target) {
      lastTrackedProfileId = id;
      baselineSettings = target.settings ? { ...target.settings } : null;
      isModified = false;
    }
    const success = applyProfileById(id);
    if (success) {
      const updated = getActiveProfile();
      dispatch('profileChange', updated);
    }
  }

  function handleSaveCurrent() {
    saveCurrentToActiveProfile();
    const updated = getActiveProfile();
    if (updated?.settings) {
      baselineSettings = { ...updated.settings };
    }
    isModified = false;
  }

  function handleRevert() {
    if (baselineSettings && activeProfile) {
      applyProfile({ ...activeProfile, settings: baselineSettings });
      saveCurrentToActiveProfile();
      isModified = false;
      const updated = getActiveProfile();
      dispatch('profileChange', updated);
    } else {
      revertActiveProfile();
      isModified = false;
    }
  }

  function handleOpenCreate(fromCurrent = false) {
    newProfileName = fromCurrent && activeProfile ? `${activeProfile.name} (Custom)` : '';
    newProfileIcon = activeProfile?.icon || 'custom';
    newProfileTemplate = fromCurrent ? 'current' : 'desktop';
    showCreateModal = true;
  }

  function handleConfirmCreate() {
    if (!newProfileName.trim()) return;

    let templateSettings = defaultDesktopSettings;
    if (newProfileTemplate === 'mobile') {
      templateSettings = defaultMobileSettings;
    } else if (newProfileTemplate === 'tablet') {
      templateSettings = defaultTabletSettings;
    }

    const created = createProfile(
      newProfileName,
      newProfileIcon,
      newProfileTemplate === 'current',
      templateSettings
    );

    lastTrackedProfileId = created.id;
    baselineSettings = created.settings ? { ...created.settings } : null;
    isModified = false;
    showCreateModal = false;
    dispatch('profileChange', created);
  }

  function handleOpenRename(profile: ReaderProfile) {
    renamingProfileId = profile.id;
    renamingProfileName = profile.name;
    renamingProfileIcon = profile.icon || 'custom';
    showRenameModal = true;
  }

  function handleConfirmRename() {
    if (!renamingProfileName.trim() || !renamingProfileId) return;
    updateProfileMetadata(renamingProfileId, {
      name: renamingProfileName.trim(),
      icon: renamingProfileIcon
    });
    showRenameModal = false;
  }

  function handleDuplicate(profile: ReaderProfile) {
    const cloned = duplicateProfile(profile.id);
    if (cloned) {
      lastTrackedProfileId = cloned.id;
      baselineSettings = cloned.settings ? { ...cloned.settings } : null;
      isModified = false;
      dispatch('profileChange', cloned);
    }
  }

  async function handleDelete(profile: ReaderProfile) {
    if (profiles.length <= 1) return;

    const wasCanceled = await new Promise<boolean>((resolve) => {
      dialogManager.dialogs$.next([
        {
          component: ConfirmDialog,
          props: {
            dialogHeader: 'Delete Profile',
            dialogMessage: `Are you sure you want to delete the profile "${profile.name}"? This action cannot be undone.`,
            resolver: resolve
          },
          disableCloseOnClick: true
        }
      ]);
    });

    if (wasCanceled) {
      return;
    }

    deleteProfile(profile.id);
  }

  function handleExportFile() {
    exportProfilesAsJson();
  }

  function handleTriggerImport() {
    fileInputElement?.click();
  }

  async function handleImportFile(event: Event) {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const result = importProfilesFromJson(text);
      if (result.success) {
        dialogManager.dialogs$.next([
          {
            component: MessageDialog,
            props: {
              title: 'Profiles Imported',
              message: `Successfully imported ${result.count} profile(s).`
            }
          }
        ]);
      } else {
        throw new Error(result.error || 'Invalid file format');
      }
    } catch (err: any) {
      dialogManager.dialogs$.next([
        {
          component: MessageDialog,
          props: {
            title: 'Import Failed',
            message: `Could not import profile file: ${err?.message || err}`
          }
        }
      ]);
    } finally {
      target.value = '';
    }
  }

  function formatLastModified(timestamp: number) {
    if (!timestamp) return 'Never synced';
    const date = new Date(timestamp);
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
</script>

<ListSection
  title="Reader Profiles"
  description="Manage, load, and switch reading configurations tailored for different devices (PC, Phone, Tablet) with cloud synchronization"
>
  <!-- Section: Active Profile & Profile Switcher Chips -->
  <ListItem
    layout="stacked"
    headline="Active Device Profile"
    description="Select a saved configuration to apply its typography, layout, margins, and reading view preferences"
  >
    <div slot="suffix" class="flex items-center gap-1.5">
      <Button variant="ghost" size="sm" on:click={() => handleOpenCreate(false)}>
        <Fa icon={faPlus} class="mr-1 text-xs" />
        New Profile
      </Button>
    </div>

    <!-- Profile Selection Cards Grid -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-2.5 w-full mt-1">
      {#each profiles as profile (profile.id)}
        {@const isActive = profile.id === currentActiveId}
        <div
          role="button"
          tabindex="0"
          on:click={() => handleSelectProfile(profile.id)}
          on:keydown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleSelectProfile(profile.id);
            }
          }}
          class="relative flex flex-col items-start p-3 rounded-lg border text-left transition-all duration-150 cursor-pointer select-none"
          class:border-zinc-800={isActive}
          class:dark:border-zinc-200={isActive}
          class:bg-zinc-100={isActive}
          class:dark:bg-zinc-800={isActive}
          class:shadow-sm={isActive}
          class:border-zinc-200={!isActive}
          class:dark:border-zinc-700={!isActive}
          class:hover:border-zinc-400={!isActive}
          class:dark:hover:border-zinc-600={!isActive}
          style="background-color: {isActive
            ? 'var(--astryx-color-surface-selected, rgba(255, 255, 255, 0.08))'
            : 'var(--astryx-color-surface, transparent)'};"
        >
          <div class="flex items-center justify-between w-full mb-1">
            <div class="flex items-center gap-2">
              <span
                class="w-7 h-7 rounded-md flex items-center justify-center text-xs font-semibold"
                style="background-color: var(--astryx-color-surface-subtle, rgba(0, 0, 0, 0.05)); color: var(--astryx-color-fg-primary, inherit);"
              >
                <Fa icon={getIcon(profile.icon)} />
              </span>
              <span class="font-medium text-sm text-zinc-900 dark:text-zinc-100 truncate">
                {profile.name}
              </span>
            </div>

            {#if isActive}
              <span
                class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-semibold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800"
              >
                <Fa icon={faCheck} class="text-[9px]" />
                Active
              </span>
            {/if}
          </div>

          <p class="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2 mt-0.5 min-h-[1.75rem]">
            {profile.description ||
              `${profile.settings?.fontSize || 20}px font, ${profile.settings?.writingMode === 'vertical-rl' ? 'Vertical' : 'Horizontal'}, ${profile.settings?.viewMode === 'continuous' ? 'Continuous' : 'Paginated'}`}
          </p>

          <!-- Action buttons for individual profile -->
          <div
            role="toolbar"
            aria-label="Profile actions"
            tabindex="-1"
            class="flex items-center justify-end gap-1 w-full mt-2 pt-2 border-t border-zinc-200/60 dark:border-zinc-700/60"
            on:click|stopPropagation
            on:keydown|stopPropagation
          >
            <Tooltip text="Rename profile">
              <IconButton
                variant="ghost"
                size="sm"
                label="Rename profile"
                on:click={() => handleOpenRename(profile)}
              >
                <Fa
                  icon={faEdit}
                  class="text-xs text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
                />
              </IconButton>
            </Tooltip>

            <Tooltip text="Duplicate profile">
              <IconButton
                variant="ghost"
                size="sm"
                label="Duplicate profile"
                on:click={() => handleDuplicate(profile)}
              >
                <Fa
                  icon={faClone}
                  class="text-xs text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
                />
              </IconButton>
            </Tooltip>

            {#if profiles.length > 1}
              <Tooltip text="Delete profile">
                <IconButton
                  variant="ghost"
                  size="sm"
                  label="Delete profile"
                  on:click={() => handleDelete(profile)}
                >
                  <Fa
                    icon={faTrash}
                    class="text-xs text-red-500 hover:text-red-700 dark:hover:text-red-400"
                  />
                </IconButton>
              </Tooltip>
            {/if}
          </div>
        </div>
      {/each}
    </div>
  </ListItem>

  <!-- Unsaved Modifications Warning Bar -->
  {#if isModified}
    <ListItem layout="stacked">
      <Card
        data-testid="unsaved-changes-banner"
        variant="surface"
        padding="sm"
        radius="md"
        class="w-full border border-amber-300 dark:border-amber-800 bg-amber-50/80 dark:bg-amber-950/40 text-amber-950 dark:text-amber-100"
      >
        <div
          class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 w-full"
        >
          <div class="flex items-start sm:items-center gap-2.5 min-w-0 flex-1">
            <Fa
              icon={faTriangleExclamation}
              class="text-amber-600 dark:text-amber-400 shrink-0 text-base mt-0.5 sm:mt-0"
            />
            <div class="text-xs sm:text-sm min-w-0 break-words leading-snug">
              <span class="font-semibold">Unsaved Changes:</span> Current reader settings differ
              from saved profile
              <span class="font-semibold underline">"{activeProfile?.name}"</span>.
            </div>
          </div>

          <div class="w-full sm:w-auto shrink-0 flex justify-end">
            <ButtonGroup
              size="sm"
              attached={false}
              class="flex-wrap gap-2 w-full sm:w-auto justify-end"
            >
              <Button variant="ghost" size="sm" on:click={handleRevert}>
                <Fa icon={faRotate} class="mr-1 text-xs" />
                Revert
              </Button>

              <Button variant="ghost" size="sm" on:click={() => handleOpenCreate(true)}>
                Save as New...
              </Button>

              <Button variant="primary" size="sm" on:click={handleSaveCurrent}>
                <Fa icon={faSave} class="mr-1 text-xs" />
                Update Profile
              </Button>
            </ButtonGroup>
          </div>
        </div>
      </Card>
    </ListItem>
  {/if}

  <!-- Cloud Sync & JSON Backup Bar -->
  <ListItem
    layout="stacked"
    headline="Profile Backup & Transfer"
    description="Export or import reader profiles as a JSON file to transfer between devices or create a local backup"
  >
    <div slot="suffix">
      <ButtonGroup size="sm" attached={false} class="flex-wrap gap-2">
        <Tooltip text="Export profiles as a JSON file">
          <Button variant="outline" size="sm" on:click={handleExportFile}>
            <Fa icon={faFileExport} class="mr-1.5 text-xs" />
            Export
          </Button>
        </Tooltip>

        <Tooltip text="Import profiles from JSON file">
          <Button variant="ghost" size="sm" on:click={handleTriggerImport}>
            <Fa icon={faFileImport} class="mr-1.5 text-xs" />
            Import
          </Button>
        </Tooltip>
      </ButtonGroup>
    </div>
  </ListItem>
</ListSection>

<!-- Hidden File Input for JSON Import -->
<input
  bind:this={fileInputElement}
  type="file"
  accept=".json"
  class="hidden"
  on:change={handleImportFile}
/>

<!-- Modal: Create New Profile -->
<Dialog bind:open={showCreateModal} title="Create Reader Profile" size="sm">
  <div class="flex flex-col gap-4 py-2">
    <div>
      <label
        for="new-profile-name"
        class="block text-xs font-semibold text-zinc-600 dark:text-zinc-300 mb-1"
      >
        Profile Name
      </label>
      <Input
        id="new-profile-name"
        bind:value={newProfileName}
        placeholder="e.g. Phone, Living Room TV, iPad"
        size="sm"
      />
    </div>

    <div>
      <label
        for="new-profile-icon"
        class="block text-xs font-semibold text-zinc-600 dark:text-zinc-300 mb-1"
      >
        Device Icon
      </label>
      <Select
        id="new-profile-icon"
        bind:value={newProfileIcon}
        options={[
          { value: 'desktop', label: 'Desktop / PC' },
          { value: 'mobile', label: 'Mobile / Phone' },
          { value: 'tablet', label: 'Tablet / E-Reader' },
          { value: 'custom', label: 'Custom / Sliders' }
        ]}
        size="sm"
      />
    </div>

    <div>
      <label
        for="new-profile-template"
        class="block text-xs font-semibold text-zinc-600 dark:text-zinc-300 mb-1"
      >
        Starting Configuration
      </label>
      <Select
        id="new-profile-template"
        bind:value={newProfileTemplate}
        options={[
          { value: 'current', label: 'Current Reader Settings' },
          { value: 'desktop', label: 'Desktop Preset (20px, Auto Columns)' },
          { value: 'mobile', label: 'Mobile Preset (17px, 1 Column, Tap Edge)' },
          { value: 'tablet', label: 'Tablet Preset (22px, Balanced Margins)' }
        ]}
        size="sm"
      />
    </div>
  </div>

  <svelte:fragment slot="footer">
    <Button variant="ghost" size="sm" on:click={() => (showCreateModal = false)}>Cancel</Button>
    <Button
      variant="primary"
      size="sm"
      disabled={!newProfileName.trim()}
      on:click={handleConfirmCreate}
    >
      Create Profile
    </Button>
  </svelte:fragment>
</Dialog>

<!-- Modal: Rename Profile -->
<Dialog bind:open={showRenameModal} title="Edit Profile Details" size="sm">
  <div class="flex flex-col gap-4 py-2">
    <div>
      <label
        for="rename-profile-name"
        class="block text-xs font-semibold text-zinc-600 dark:text-zinc-300 mb-1"
      >
        Profile Name
      </label>
      <Input
        id="rename-profile-name"
        bind:value={renamingProfileName}
        placeholder="Profile Name"
        size="sm"
      />
    </div>

    <div>
      <label
        for="rename-profile-icon"
        class="block text-xs font-semibold text-zinc-600 dark:text-zinc-300 mb-1"
      >
        Device Icon
      </label>
      <Select
        id="rename-profile-icon"
        bind:value={renamingProfileIcon}
        options={[
          { value: 'desktop', label: 'Desktop / PC' },
          { value: 'mobile', label: 'Mobile / Phone' },
          { value: 'tablet', label: 'Tablet / E-Reader' },
          { value: 'custom', label: 'Custom / Sliders' }
        ]}
        size="sm"
      />
    </div>
  </div>

  <svelte:fragment slot="footer">
    <Button variant="ghost" size="sm" on:click={() => (showRenameModal = false)}>Cancel</Button>
    <Button
      variant="primary"
      size="sm"
      disabled={!renamingProfileName.trim()}
      on:click={handleConfirmRename}
    >
      Save Changes
    </Button>
  </svelte:fragment>
</Dialog>
