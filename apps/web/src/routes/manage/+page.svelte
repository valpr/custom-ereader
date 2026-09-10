<script lang="ts">
  import { goto } from '$app/navigation';
  import { faUpload } from '@fortawesome/free-solid-svg-icons';
  import BookCardDetailsDialog from '$lib/components/book-card/book-card-details-dialog.svelte';
  import BookCardList from '$lib/components/book-card/book-card-list.svelte';
  import type { BookCardProps } from '$lib/components/book-card/book-card-props';
  import BookManagerHeader from '$lib/components/book-card/book-manager-header.svelte';
  import BookExportDialog from '$lib/components/book-export/book-export-dialog.svelte';
  import CloudReconnectBanner from '$lib/components/cloud/cloud-reconnect-banner.svelte';
  import ConfirmDialog from '$lib/components/confirm-dialog.svelte';
  import DeleteBooksDialog from '$lib/components/delete-books-dialog.svelte';
  import ExternalReadDialog from '$lib/components/external-read-dialog.svelte';
  import LogReportDialog from '$lib/components/log-report-dialog.svelte';
  import { mergeEntries } from '$lib/components/merged-header-icon/merged-entries';
  import MessageDialog from '$lib/components/message-dialog.svelte';
  import { preFilteredTitlesForStatistics$ } from '$lib/components/statistics/statistics-types';
  import { pxScreen } from '$lib/css-classes';
  import type { BooksDbBookmarkData } from '$lib/data/database/books-db/versions/books-db';
  import { dialogManager } from '$lib/data/dialog-manager';
  import { pagePath } from '$lib/data/env';
  import { logger } from '$lib/data/logger';
  import { SortDirection, type SortOption } from '$lib/data/sort-types';
  import { ApiStorageHandler } from '$lib/data/storage/handler/api-handler';
  import { getStorageHandler } from '$lib/data/storage/storage-handler-factory';
  import {
    StorageOAuthManager,
    getExpiredSyncTargets,
    storageConnectionStates$
  } from '$lib/data/storage/storage-oauth-manager';
  import {
    StorageDataType,
    StorageKey,
    StorageSourceDefault
  } from '$lib/data/storage/storage-types';
  import {
    fetchUnifiedBookListsStream,
    mergeBookLists,
    normalizeTitle
  } from '$lib/data/storage/unified-library';
  import { storageSource$ } from '$lib/data/storage/storage-view';
  import {
    cacheStorageData$,
    confirmStatisticsDeletion$,
    database,
    externalReadAction$,
    fileCountData$,
    gDriveStorageSource$,
    isOnline$,
    keepLocalStatisticsOnDeletion$,
    lastExportedTarget$,
    lastExportedTypes$,
    librarySortOption$,
    librarySourceFilter$,
    oneDriveStorageSource$,
    pendingCloudSync$,
    readingGoalsMergeMode$,
    replicationSaveBehavior$,
    showExternalPlaceholder$,
    statisticsMergeMode$,
    syncTarget$
  } from '$lib/data/store';
  import { reconnectAndSyncNow } from '$lib/functions/replication/cloud-reauth';
  import { cloneMutateSet } from '$lib/functions/clone-mutate-set';
  import { getDropEventFiles } from '$lib/functions/file-dom/get-drop-event-files';
  import { inputFile } from '$lib/functions/file-dom/input-file';
  import { formatPageTitle } from '$lib/functions/format-page-title';
  import { keyBy } from '$lib/functions/key-by';
  import { handleErrorDuringReplication } from '$lib/functions/replication/error-handler';
  import { importBackup, importData, replicateData } from '$lib/functions/replication/replicator';
  import { throwIfAborted } from '$lib/functions/replication/replication-error';
  import {
    replicationProgress$,
    executeReplicate$,
    type ReplicationProgress
  } from '$lib/functions/replication/replication-progress';
  import { pluralize } from '$lib/functions/utils';
  import { reduceToEmptyString } from '$lib/functions/rxjs/reduce-to-empty-string';
  import pLimit from 'p-limit';
  import { browser } from '$app/environment';
  import {
    combineLatest,
    catchError,
    finalize,
    from,
    map,
    Observable,
    share,
    startWith,
    Subject,
    switchMap,
    takeUntil
  } from 'rxjs';
  import { onDestroy, tick } from 'svelte';
  import Fa from 'svelte-fa';

  // Local-first loading: the stream emits the Browser list immediately and
  // re-emits as each cloud list arrives, so a slow cloud never holds up the
  // page. booksAreLoading$ only covers the local load; the template keeps
  // rendering once local books arrive and merges cloud extras in place.
  // The shared database.listLoading$ is poked (true) by every handler
  // getBookList call with the matching reset (false) emitted only by
  // database.dataList$'s own pipeline, so direct reads must not drive the
  // template from it.
  const unifiedLoading$ = new Subject<boolean>();
  const booksAreLoading$ = unifiedLoading$.pipe(startWith(false), share());

  function resolveReadSource(card: BookCardProps | undefined): StorageKey {
    if (!card?.sources?.length) return $storageSource$;
    if (card.sources.includes(StorageKey.BROWSER)) return StorageKey.BROWSER;
    if (card.sources.includes(StorageKey.GDRIVE)) return StorageKey.GDRIVE;
    if (card.sources.includes(StorageKey.ONEDRIVE)) return StorageKey.ONEDRIVE;
    return card.sources[0];
  }

  const unifiedLists$ = combineLatest([
    database.dataListChanged$.pipe(startWith(undefined)),
    database.dataList$,
    gDriveStorageSource$,
    oneDriveStorageSource$
  ]).pipe(
    switchMap(([, , gDriveSource, oneDriveSource]) => {
      if (!browser || typeof window === 'undefined') return from([[]]);
      unifiedLoading$.next(true);
      // The first stream emission is always the local Browser list; later
      // emissions merge cloud extras in. Loading clears on that first emit.
      let localLoaded = false;
      return fetchUnifiedBookListsStream(window, {
        gDriveSourceName: gDriveSource,
        oneDriveSourceName: oneDriveSource,
        includeClouds: true
      }).pipe(
        map((lists) => {
          if (!localLoaded) {
            localLoaded = true;
            unifiedLoading$.next(false);
          }
          return lists;
        }),
        catchError(() => {
          unifiedLoading$.next(false);
          return from([[]]);
        }),
        finalize(() => unifiedLoading$.next(false))
      );
    }),
    share()
  );

  const bookCards$: Observable<BookCardProps[]> = combineLatest([
    unifiedLists$,
    database.bookmarks$,
    librarySortOption$,
    librarySourceFilter$
  ]).pipe(
    map(([lists, bookmarks, sortProp]) => {
      const isTitleSort = sortProp.property === 'title';
      const merged = mergeBookLists(
        (lists as { source: StorageKey; cards: BookCardProps[] }[]) || []
      );
      const filter = librarySourceFilter$.getValue();
      const filtered =
        !filter || filter.size === 0
          ? merged
          : merged.filter((card) => (card.sources || []).some((s) => filter.has(s)));

      const bookmarkMap = keyBy(bookmarks, 'dataId');

      return [
        ...filtered
          .filter((d) => $showExternalPlaceholder$ || !d.isPlaceholder)
          .map((d) => ({
            ...d,
            ...((d.sources || []).includes(StorageKey.BROWSER)
              ? bookmarkToProgress(bookmarkMap.get(d.id))
              : { progress: d.progress || 0 })
          }))
          .sort((card1: BookCardProps, card2: BookCardProps) =>
            sortBookCards(card1, card2, sortProp, isTitleSort)
          )
      ];
    }),
    share()
  );

  const currentBookId$ = database.lastItem$.pipe(
    map((item) => item?.dataId),
    share()
  );

  let selectedBookIds: ReadonlySet<number> = new Set();
  let selectMode = false;
  let cancelToken = new AbortController();
  let cancelSignal = cancelToken.signal;
  let cancelTooltip = '';
  let replicationProgress = 0;
  let replicationToProgress = 0;
  let replicationProgressRemaining = '~ ??:??:??';
  let replicationDone = new Subject<void>();
  let progressBase = 0;
  let executionStart: number;
  let cloudReconnecting = false;

  $: expiredSyncTarget =
    getExpiredSyncTargets($syncTarget$, $storageConnectionStates$, $pendingCloudSync$)[0] || '';
  $: expiredFailedOps =
    (expiredSyncTarget && $pendingCloudSync$[expiredSyncTarget]?.failedOps) || 0;

  async function handleCloudReconnect() {
    if (!expiredSyncTarget || cloudReconnecting) return;
    // Open synchronously in the click handler so mobile browsers don't block it.
    const preOpened = StorageOAuthManager.openAuthWindowSync(window);
    cloudReconnecting = true;
    try {
      await reconnectAndSyncNow(window, expiredSyncTarget, preOpened);
    } finally {
      cloudReconnecting = false;
    }
  }

  $: {
    if (!selectMode) {
      selectedBookIds = new Set();
    }
  }

  onDestroy(() => dialogManager.dialogs$.next([]));

  function bookmarkToProgress(b: BooksDbBookmarkData | undefined) {
    return b?.progress
      ? {
          progress: typeof b.progress === 'string' ? +b.progress.slice(0, -1) : b.progress,
          lastBookmarkModified: b.lastBookmarkModified || 0
        }
      : { progress: 0, lastBookmarkModified: 0 };
  }

  function sortBookCards(
    card1: BookCardProps,
    card2: BookCardProps,
    sortProp: SortOption,
    isTitleSort: boolean
  ) {
    const card1Prop = card1[sortProp.property] || (isTitleSort ? '' : 0);
    const card2Prop = card2[sortProp.property] || (isTitleSort ? '' : 0);

    let sortDiff = 0;

    if (sortProp.direction === SortDirection.ASC) {
      sortDiff = isTitleSort
        ? card1.title.localeCompare(card2.title, 'ja-JP', { numeric: true })
        : +card1Prop - +card2Prop;
    } else {
      sortDiff = isTitleSort
        ? card2.title.localeCompare(card1.title, 'ja-JP', { numeric: true })
        : +card2Prop - +card1Prop;
    }

    if (!sortDiff) {
      sortDiff = card1.title.localeCompare(card2.title, 'ja-JP', { numeric: true });
    }

    return sortDiff;
  }

  function sourceLabelFor(source: StorageKey): string {
    if (source === StorageKey.GDRIVE) return 'GDrive';
    if (source === StorageKey.ONEDRIVE) return 'OneDrive';
    if (source === StorageKey.FS) return 'Filesystem';
    return 'Browser';
  }

  async function downloadCloudBookToBrowser(
    sourceHandler: ApiStorageHandler,
    title: string,
    imagePath: BookCardProps['imagePath']
  ): Promise<number> {
    const browserHandler = getStorageHandler(
      window,
      StorageKey.BROWSER,
      '',
      true,
      $cacheStorageData$,
      $replicationSaveBehavior$,
      $statisticsMergeMode$,
      $readingGoalsMergeMode$
    );

    const error = await replicateData(
      sourceHandler,
      browserHandler,
      false,
      [{ title, imagePath }],
      [StorageDataType.DATA, StorageDataType.PROGRESS, StorageDataType.USER_BOOKMARKS],
      cancelSignal
    ).catch((err) => err.message);

    if (error) {
      throw new Error(error);
    }

    database.dataListChanged$.next(browserHandler);

    const local = await database.getDataByTitle(title);

    if (!local?.id) {
      throw new Error('Download finished but no local copy was found');
    }

    return local.id;
  }

  async function onBookClick(bookId: number) {
    if (!operationAllowed()) {
      return;
    }

    if (!selectMode) {
      dialogManager.dialogs$.next([
        {
          component: '<div/>',
          disableCloseOnClick: true
        }
      ]);

      let idToOpen = bookId;

      try {
        const bookItem = $bookCards$.find((book) => book.id === bookId);

        if (!bookItem) {
          throw new Error('Book title not found');
        }

        const readSource = resolveReadSource(bookItem);

        if (!operationAllowed(readSource)) {
          dialogManager.dialogs$.next([]);
          return;
        }

        const isForBrowser = readSource === StorageKey.BROWSER;
        const handler = getStorageHandler(
          window,
          readSource,
          readSource === StorageKey.GDRIVE
            ? $gDriveStorageSource$
            : readSource === StorageKey.ONEDRIVE
              ? $oneDriveStorageSource$
              : '',
          isForBrowser,
          $cacheStorageData$,
          $replicationSaveBehavior$,
          $statisticsMergeMode$,
          $readingGoalsMergeMode$
        );

        if (!cacheStorageData$) {
          handler.clearData(false);
        }

        handler.startContext({
          id: isForBrowser ? bookItem.id : 0,
          title: bookItem.title,
          imagePath: bookItem.imagePath
        });

        idToOpen = await handler.prepareBookForReading();

        if (handler instanceof ApiStorageHandler) {
          const remembered = externalReadAction$.getValue();
          const hasLocalCopy = (bookItem.sources || []).includes(StorageKey.BROWSER);

          if (remembered === 'download') {
            idToOpen = await downloadCloudBookToBrowser(
              handler,
              bookItem.title,
              bookItem.imagePath
            );
          } else if (remembered !== 'stream') {
            const nextAction = await new Promise<'download' | 'continue' | 'cancel'>((resolver) => {
              dialogManager.dialogs$.next([
                {
                  component: ExternalReadDialog,
                  props: {
                    resolver,
                    bookTitle: bookItem.title,
                    sourceLabel: sourceLabelFor(readSource),
                    hasLocalCopy
                  },
                  disableCloseOnClick: true
                }
              ]);
            });

            if (nextAction === 'cancel') {
              return;
            }

            if (nextAction === 'download') {
              idToOpen = await downloadCloudBookToBrowser(
                handler,
                bookItem.title,
                bookItem.imagePath
              );
            }
          }
        }

        dialogManager.dialogs$.next([]);
      } catch (error: any) {
        const message = `Error opening book: ${error.message}`;

        logger.warn(message);

        dialogManager.dialogs$.next([
          {
            component: MessageDialog,
            props: {
              title: 'Error',
              message
            }
          }
        ]);

        return;
      }

      openBook(idToOpen);
      return;
    }

    selectedBookIds = cloneMutateSet(selectedBookIds, (set) => {
      if (set.has(bookId)) {
        set.delete(bookId);
        return;
      }
      set.add(bookId);
    });
  }

  function operationAllowed(source?: StorageKey) {
    const effective = source ?? $storageSource$;
    const connectivityPass = !(
      (effective === StorageKey.GDRIVE || effective === StorageKey.ONEDRIVE) &&
      !$isOnline$
    );

    if (!connectivityPass && !replicationToProgress) {
      const message = 'You have to be online for this operation';

      logger.warn(message);

      dialogManager.dialogs$.next([
        {
          component: MessageDialog,
          props: {
            title: 'Failure',
            message
          }
        }
      ]);
    }

    return !replicationToProgress && connectivityPass;
  }

  function openBook(bookId: number) {
    if (!bookId) {
      return;
    }

    database.putLastItem(bookId);
    gotoBook(bookId);
  }

  async function gotoBook(id: number) {
    await goto(`${pagePath}/b?id=${id}`);
  }

  async function onFilesChange(fileList: FileList | File[]) {
    if (!operationAllowed()) {
      return;
    }

    cancelTooltip = `Cancels the current Import\nAlready imported data will not be deleted`;

    initializeReplicationProgressData();

    const supportedExtRegex = /\.(?:htmlz|epub|txt)$/;
    const files = Array.from(fileList).filter((f) => supportedExtRegex.test(f.name));
    const errorTitle = 'Bookimport failed';

    if (!files.length) {
      resetProgress();

      showError(errorTitle, 'File(s) must be HTMLZ, TXT or EPUB', '');
      return;
    }

    const error = await importData(
      document,
      getStorageHandler(
        window,
        StorageKey.BROWSER,
        '',
        true,
        $cacheStorageData$,
        $replicationSaveBehavior$,
        $statisticsMergeMode$,
        $readingGoalsMergeMode$
      ),
      files,
      cancelSignal,
      $fileCountData$
    ).catch((catchedError) => catchedError.message);

    resetProgress();

    if (error) {
      showError(errorTitle, error, 'Error(s) occurred during bookimport');
    }
  }

  function showError(title: string, message: string, fallbackMessage: string) {
    const showReport = logger.errorCount > 1;

    logger.warn(message);

    dialogManager.dialogs$.next([
      {
        component: showReport ? LogReportDialog : MessageDialog,
        props: {
          title,
          message: showReport ? fallbackMessage : message
        }
      }
    ]);
  }

  function initializeReplicationProgressData() {
    replicationDone = new Subject<void>();
    replicationProgress$.pipe(takeUntil(replicationDone)).subscribe(updateProgress);
    replicationProgressRemaining = '~ ??:??:??';
    replicationProgress = 0;
    replicationToProgress = 1;
    executionStart = Date.now();

    logger.clearHistory();

    cancelToken = new AbortController();
    cancelSignal = cancelToken.signal;
  }

  function resetProgress() {
    replicationDone.next();
    replicationDone.complete();
    replicationToProgress = 0;
    replicationProgress = 0;
    cancelTooltip = '';
  }

  function onSelectAllBooks() {
    const bookCards = $bookCards$;
    selectedBookIds = cloneMutateSet(selectedBookIds, (set) => {
      bookCards.forEach((x) => set.add(x.id));
    });
  }

  function backToCurrentBook() {
    const currentBookId = $currentBookId$;
    if (!currentBookId) return;
    gotoBook(currentBookId);
  }

  async function removeBooks(bookIds: number[]) {
    if (!operationAllowed()) {
      return;
    }

    const cardsToDelete = $bookCards$.filter((card) => bookIds.includes(card.id));
    const titlesToDelete = cardsToDelete.map((card) => card.title);

    if (!titlesToDelete.length) {
      return;
    }

    const hasSources = cardsToDelete.some((card) => (card.sources || []).length > 0);
    const localTitles = hasSources
      ? cardsToDelete
          .filter((card) => (card.sources || []).includes(StorageKey.BROWSER))
          .map((card) => card.title)
      : [...titlesToDelete];
    const gDriveTitles = cardsToDelete
      .filter((card) => (card.sources || []).includes(StorageKey.GDRIVE))
      .map((card) => card.title);
    const oneDriveTitles = cardsToDelete
      .filter((card) => (card.sources || []).includes(StorageKey.ONEDRIVE))
      .map((card) => card.title);
    const cloudParts: string[] = [];
    if (gDriveTitles.length) cloudParts.push(`GDrive (${gDriveTitles.length})`);
    if (oneDriveTitles.length) cloudParts.push(`OneDrive (${oneDriveTitles.length})`);
    const cloudSummary = cloudParts.join(', ');
    const hasLocalCopy = localTitles.length > 0;

    const { canceled, deleteFromCloud } = await new Promise<{
      canceled: boolean;
      deleteFromCloud: boolean;
    }>((resolver) => {
      dialogManager.dialogs$.next([
        {
          component: DeleteBooksDialog,
          props: {
            titles: titlesToDelete,
            cloudSummary,
            hasLocalCopy,
            // Cloud-only books have no local copy to delete, so default to
            // cloud deletion instead of forcing a second confirmation round.
            initialDeleteFromCloud: !hasLocalCopy && cloudSummary.length > 0,
            resolver
          },
          disableCloseOnClick: true
        }
      ]);
    });

    if (canceled) {
      return;
    }

    if (!operationAllowed()) {
      return;
    }

    const effectiveDeleteFromCloud = deleteFromCloud && cloudSummary.length > 0;

    if (effectiveDeleteFromCloud && !operationAllowed(StorageKey.GDRIVE) && gDriveTitles.length) {
      return;
    }

    if (localTitles.length === 0 && !effectiveDeleteFromCloud) {
      dialogManager.dialogs$.next([
        {
          component: MessageDialog,
          props: {
            title: 'Nothing to delete',
            message:
              'These books have no local copy. Check “Also delete from cloud” to remove them.'
          }
        }
      ]);
      return;
    }

    cancelTooltip = `Cancels the Deletion\nAlready deleted data will not be restored`;

    initializeReplicationProgressData();

    const currentBookCount = $bookCards$.length;
    const deletedTitles = new Set<string>();
    let error = '';

    if (localTitles.length) {
      const browserHandler = getStorageHandler(window, StorageKey.BROWSER, '');
      const result = await browserHandler.deleteBookData(
        localTitles,
        cancelSignal,
        $keepLocalStatisticsOnDeletion$
      );
      result.deleted.forEach((deletedId) => {
        const match = $bookCards$.find((card) => card.id === deletedId);
        if (match) deletedTitles.add(match.title);
      });
      localTitles.forEach((title) => {
        if (!result.error) deletedTitles.add(title);
      });
      if (result.error) error += result.error;
    }

    if (effectiveDeleteFromCloud) {
      const clouds: { source: StorageKey; titles: string[]; sourceName: string }[] = [
        { source: StorageKey.GDRIVE, titles: gDriveTitles, sourceName: $gDriveStorageSource$ },
        { source: StorageKey.ONEDRIVE, titles: oneDriveTitles, sourceName: $oneDriveStorageSource$ }
      ];

      for (const cloud of clouds) {
        if (!cloud.titles.length) continue;
        if (!operationAllowed(cloud.source)) continue;
        const cloudHandler = getStorageHandler(window, cloud.source, cloud.sourceName);
        const result = await cloudHandler.deleteBookData(
          cloud.titles,
          cancelSignal,
          $keepLocalStatisticsOnDeletion$
        );
        if (!result.error) {
          cloud.titles.forEach((title) => deletedTitles.add(title));
        } else {
          error += (error ? '\n' : '') + result.error;
        }
      }
    }

    database.dataListChanged$.next(undefined);

    resetProgress();

    await tick();

    const deletedBookIds = cardsToDelete
      .filter((card) => deletedTitles.has(card.title))
      .map((card) => card.id);

    if (deletedTitles.size >= currentBookCount || $bookCards$.length === 0) {
      selectMode = false;
    } else {
      selectedBookIds = cloneMutateSet(selectedBookIds, (set) => {
        deletedBookIds.forEach((deletedBookId) => set.delete(deletedBookId));
      });
    }

    if (error) {
      showError('Deletion failed', error, 'Error(s) occurred during deletion');
    }
  }

  async function resolvePrimaryCloud(): Promise<{ type: StorageKey; name: string } | null> {
    const primaryName = syncTarget$.getValue();

    if (!primaryName) {
      return null;
    }

    if (
      primaryName === $gDriveStorageSource$ ||
      primaryName === StorageSourceDefault.GDRIVE_DEFAULT
    ) {
      return { type: StorageKey.GDRIVE, name: primaryName };
    }

    if (
      primaryName === $oneDriveStorageSource$ ||
      primaryName === StorageSourceDefault.ONEDRIVE_DEFAULT
    ) {
      return { type: StorageKey.ONEDRIVE, name: primaryName };
    }

    const sources = await database.getStorageSources().catch(() => []);
    const found = (sources || []).find((source) => source.name === primaryName);

    if (found && (found.type === StorageKey.GDRIVE || found.type === StorageKey.ONEDRIVE)) {
      return { type: found.type, name: primaryName };
    }

    return null;
  }

  async function onUploadBookToPrimary(bookId: number) {
    const card = $bookCards$.find((book) => book.id === bookId);

    if (!card) {
      return;
    }

    const primary = await resolvePrimaryCloud();

    if (!primary) {
      dialogManager.dialogs$.next([
        {
          component: MessageDialog,
          props: {
            title: 'No primary cloud',
            message: 'Set a primary cloud sync target in Settings to upload books.'
          }
        }
      ]);
      return;
    }

    if (!operationAllowed(primary.type)) {
      return;
    }

    if (!(card.sources || []).includes(StorageKey.BROWSER)) {
      dialogManager.dialogs$.next([
        {
          component: MessageDialog,
          props: {
            title: 'Nothing to upload',
            message: `“${card.title}” has no local browser copy to upload.`
          }
        }
      ]);
      return;
    }

    cancelTooltip = `Cancels the current Upload\nAlready uploaded data will not be removed`;

    initializeReplicationProgressData();

    const sourceHandler = getStorageHandler(
      window,
      StorageKey.BROWSER,
      '',
      true,
      $cacheStorageData$,
      $replicationSaveBehavior$,
      $statisticsMergeMode$,
      $readingGoalsMergeMode$
    );
    const targetHandler = getStorageHandler(
      window,
      primary.type,
      primary.name,
      false,
      $cacheStorageData$,
      $replicationSaveBehavior$,
      $statisticsMergeMode$,
      $readingGoalsMergeMode$
    );
    const error = await replicateData(
      sourceHandler,
      targetHandler,
      false,
      [{ title: card.title, imagePath: card.imagePath }],
      [StorageDataType.DATA, StorageDataType.PROGRESS, StorageDataType.USER_BOOKMARKS],
      cancelSignal
    ).catch((err) => err.message);

    resetProgress();

    database.dataListChanged$.next(undefined);

    if (error) {
      showError('Upload failed', error, 'Error(s) occurred during upload');
      return;
    }

    dialogManager.dialogs$.next([
      {
        component: MessageDialog,
        props: {
          title: 'Upload complete',
            message: `“${card.title}” was uploaded to your primary cloud (${primary.name}).`
        }
      }
    ]);
  }

  function onShowBookDetails(bookId: number) {
    const card = $bookCards$.find((book) => book.id === bookId);

    if (!card) {
      return;
    }

    dialogManager.dialogs$.next([
      {
        component: BookCardDetailsDialog,
        props: {
          title: card.title,
          characters: card.characters,
          progress: card.progress,
          lastBookOpen: card.lastBookOpen,
          lastBookmarkModified: card.lastBookmarkModified,
          lastBookModified: card.lastBookModified,
          sources: card.sources || []
        }
      }
    ]);
  }

  async function onImportBackup(file: File) {
    if (!operationAllowed()) {
      return;
    }

    const errorTitle = 'Import failed';

    cancelTooltip = `Cancels the current Import\nAlready imported data will not be deleted`;

    initializeReplicationProgressData();

    if (!file.name.endsWith('.zip')) {
      resetProgress();

      showError(errorTitle, 'Invalid file - expected zip archive', '');
      return;
    }

    const error = await importBackup(
      getStorageHandler(
        window,
        StorageKey.BACKUP,
        undefined,
        true,
        $cacheStorageData$,
        $replicationSaveBehavior$,
        $statisticsMergeMode$,
        $readingGoalsMergeMode$
      ),
      getStorageHandler(
        window,
        StorageKey.BROWSER,
        '',
        true,
        $cacheStorageData$,
        $replicationSaveBehavior$,
        $statisticsMergeMode$,
        $readingGoalsMergeMode$
      ),
      file,
      cancelSignal
    ).catch((err) => err.message);

    resetProgress();

    if (error) {
      showError(errorTitle, error, 'Error(s) occurred during import');
    }
  }

  function onDomainHintClick() {
    dialogManager.dialogs$.next([
      {
        component: MessageDialog,
        props: {
          title: 'Old Domain',
          message:
            'You are currently using the old domain of ッツ Reader - consider switching to https://reader.ttsu.app to prevent issues and to ensure full features'
        },
        disableCloseOnClick: true
      }
    ]);
  }

  function onBugReportClick() {
    dialogManager.dialogs$.next([
      {
        component: LogReportDialog,
        props: {
          title: 'Bug Report',
          message: 'Please include the attached file for your report'
        }
      }
    ]);
  }

  function onReplicateData() {
    dialogManager.dialogs$.next([{ component: BookExportDialog, disableCloseOnClick: true }]);
  }

  async function onDeleteStatistics() {
    const titles = $bookCards$
      .filter((card) => selectedBookIds.has(card.id))
      .map((book) => book.title);

    let wasCanceled = false;

    if ($confirmStatisticsDeletion$) {
      wasCanceled = await new Promise((resolver) => {
        dialogManager.dialogs$.next([
          {
            component: ConfirmDialog,
            props: {
              dialogHeader: 'Delete Data',
              dialogMessage: `This will delete all Statistics for the selected ${pluralize(
                titles.length,
                'Title',
                false
              )} (which may include start and/or completion Data)\n\nExecute a one time Sync with an export behavior of "replace" and/or statistics merge mode of "replace" to apply deletions to other devices`,
              contentStyles: 'white-space: pre-line;',
              resolver
            }
          }
        ]);
      });
    }

    if (wasCanceled) {
      return;
    }

    cancelTooltip = `Cancels the current Process`;

    initializeReplicationProgressData();

    const limiter = pLimit(1);
    const tasks: Promise<void>[] = [];

    let failed = 0;

    replicationProgress$.next({ progressBase: 1, maxProgress: titles.length });

    titles.forEach((title) => {
      tasks.push(
        limiter(async () => {
          try {
            throwIfAborted(cancelSignal);
            await database.deleteStatisticEntries([title], true);

            replicationProgress$.next({ progressToAdd: 1 });
          } catch (error) {
            handleErrorDuringReplication(error, `Error on deleting statistics for ${title}: `, [
              limiter
            ]);

            failed += 1;
          }
        })
      );
    });

    await Promise.all(tasks).catch(() => {});

    resetProgress();

    if (failed) {
      const errorMessage = `Unable to delete statistics of ${pluralize(failed, 'Title')}`;

      showError('Deletion Failed', errorMessage, errorMessage);
    }
  }

  function updateProgress(replicationProgressData: ReplicationProgress) {
    if (cancelSignal.aborted) {
      return;
    }

    progressBase = replicationProgressData.progressBase || progressBase || 0;
    replicationToProgress = replicationProgressData.maxProgress || replicationToProgress || 0;

    if (replicationProgressData.skipStep) {
      const progressDiffToAdd =
        Math.ceil(replicationProgress / progressBase) * progressBase - replicationProgress;

      replicationProgress =
        Math.floor(
          (replicationProgress + (progressDiffToAdd || progressBase) + Number.EPSILON) * 1000
        ) / 1000;
    } else if (replicationProgressData.completeStep) {
      const progressDiffToAdd = Math.ceil(replicationProgress) - replicationProgress;

      replicationProgress =
        Math.floor((replicationProgress + progressDiffToAdd + Number.EPSILON) * 1000) / 1000;
    } else if (replicationProgressData.progressToAdd && replicationProgressData.progressToAdd > 0) {
      replicationProgress =
        Math.floor(
          (replicationProgress + replicationProgressData.progressToAdd + Number.EPSILON) * 1000
        ) / 1000;
    }

    if (replicationProgressData.progressToAdd) {
      const duration = (Date.now() - executionStart) / 1000;
      const processPerSecond = replicationProgress / duration;
      const remainingTime = (replicationToProgress - replicationProgress) / processPerSecond;

      replicationProgressRemaining =
        replicationToProgress > replicationProgress
          ? `~ ${getTimestamp(Math.ceil(remainingTime))}`
          : '~ 00:00:01';
    }
  }

  const replicator$ = executeReplicate$.pipe(
    switchMap(async () => {
      if (!operationAllowed()) {
        return;
      }

      cancelTooltip = 'Cancels the current export';

      initializeReplicationProgressData();

      const books = $bookCards$.filter((card) => selectedBookIds.has(card.id));
      const exportSource = books.length > 0 ? resolveReadSource(books[0]) : $storageSource$;
      const handlers = [exportSource, $lastExportedTarget$].map((storageType) =>
        getStorageHandler(
          window,
          storageType,
          storageType === StorageKey.GDRIVE
            ? $gDriveStorageSource$
            : storageType === StorageKey.ONEDRIVE
              ? $oneDriveStorageSource$
              : '',
          $lastExportedTarget$ === StorageKey.BROWSER,
          $cacheStorageData$,
          $replicationSaveBehavior$,
          $statisticsMergeMode$,
          $readingGoalsMergeMode$
        )
      );
      const error = await replicateData(
        handlers[0],
        handlers[1],
        false,
        books.map((book) => ({ title: book.title, imagePath: book.imagePath })),
        $lastExportedTypes$,
        cancelSignal
      ).catch((err) => err.message);

      resetProgress();

      if (error) {
        showError('Export failed', error, 'Error(s) occurred during export');
      }
    }),
    reduceToEmptyString()
  );

  function getTimestamp(seconds: number) {
    return seconds && Number.isFinite(seconds)
      ? new Date(seconds * 1000).toISOString().substr(11, 8)
      : '??:??:??';
  }
</script>

<svelte:head>
  <title>{formatPageTitle('Book Manager')}</title>
</svelte:head>

{$replicator$ ?? ''}

<div class="elevation-4 fixed inset-x-0 top-0 z-10">
  <BookManagerHeader
    hasBookOpened={!!$currentBookId$}
    selectedCount={selectedBookIds.size}
    hasBooks={!!$bookCards$?.length}
    {cancelTooltip}
    {replicationProgress}
    {replicationToProgress}
    {replicationProgressRemaining}
    showCloudWarning={!!expiredSyncTarget}
    cloudWarningLabel={expiredSyncTarget
      ? `Cloud session expired for ${expiredSyncTarget}. Reconnect to resume syncing.`
      : 'Cloud session expired. Reconnect to resume syncing.'}
    bind:selectMode
    on:selectAllClick={onSelectAllBooks}
    on:backToBookClick={backToCurrentBook}
    on:removeClick={() => removeBooks(Array.from(selectedBookIds))}
    on:filesChange={(ev) => onFilesChange(ev.detail)}
    on:domainHintClick={onDomainHintClick}
    on:bugReportClick={onBugReportClick}
    on:cancelReplication={() => {
      if (!cancelSignal.aborted) {
        cancelToken.abort();
        replicationProgressRemaining = 'Canceling ...';
      }
    }}
    on:selectionToStatistics={() => {
      $preFilteredTitlesForStatistics$ = new Set(
        $bookCards$.filter((card) => selectedBookIds.has(card.id)).map((book) => book.title)
      );

      goto(`${pagePath}${mergeEntries.STATISTICS.routeId}`);
    }}
    on:deleteStatistics={onDeleteStatistics}
    on:replicateData={onReplicateData}
    on:cloudReconnectClick={handleCloudReconnect}
    on:importBackup={(ev) => onImportBackup(ev.detail)}
  />
</div>

<div
  tabindex="0"
  role="button"
  class="{pxScreen} flex min-h-screen flex-col justify-between pt-16 xl:pt-14"
  on:dragenter={(ev) => ev.preventDefault()}
  on:dragover={(ev) => ev.preventDefault()}
  on:dragend={(ev) => ev.preventDefault()}
  on:drop={(ev) => ev.preventDefault()}
  on:drop={(ev) => getDropEventFiles(ev).then(onFilesChange)}
>
  <div class="flex-1">
    {#if expiredSyncTarget}
      <CloudReconnectBanner
        sourceName={expiredSyncTarget}
        busy={cloudReconnecting}
        failedOps={expiredFailedOps}
        on:reconnect={handleCloudReconnect}
      />
    {/if}
    {#if !$bookCards$ || $booksAreLoading$}
      <div class="flex justify-center pt-28 text-sm opacity-60">Loading...</div>
    {:else if $bookCards$.length}
      <BookCardList
        currentBookId={$currentBookId$}
        {selectedBookIds}
        bookCards={$bookCards$}
        on:bookClick={(ev) => onBookClick(ev.detail.id)}
        on:removeBookClick={(ev) => removeBooks([ev.detail.id])}
        on:uploadBookClick={(ev) => onUploadBookToPrimary(ev.detail.id)}
        on:detailsClick={(ev) => onShowBookDetails(ev.detail.id)}
      />
    {:else}
      <div
        class="relative z-10 flex flex-col items-center justify-center pt-28 text-center pointer-events-none"
      >
        <div
          class="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--astryx-color-primary-subtle,rgba(99,102,241,0.12))] text-[var(--astryx-color-primary,#6366f1)] shadow-sm"
        >
          <svg class="h-9 w-9 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M21 5c-1.11-.35-2.33-.5-3.5-.5-1.95 0-4.05.4-5.5 1.5-1.45-1.1-3.55-1.5-5.5-1.5S2.45 4.9 1 6v14.65c0 .25.25.5.5.5.1 0 .15-.05.25-.05C3.1 20.45 5.05 20 6.5 20c1.95 0 4.05.4 5.5 1.5 1.35-.85 3.8-1.5 5.5-1.5 1.65 0 3.35.3 4.75 1.05.1.05.15.05.25.05.25 0 .5-.25.5-.5V6c-.6-.45-1.25-.75-2-1zm0 13.5c-1.1-.35-2.3-.5-3.5-.5-1.7 0-4.15.65-5.5 1.5V8c1.35-.85 3.8-1.5 5.5-1.5 1.2 0 2.4.15 3.5.5v11.5z"
            />
          </svg>
        </div>
        <h1 class="text-2xl font-bold tracking-tight text-[var(--astryx-color-fg-primary,#18181b)]">
          Valpr Reader
        </h1>
        <p class="mt-1 max-w-sm text-sm text-[var(--astryx-color-fg-muted,#71717a)]">
          Drop EPUB, HTMLZ, or TXT files anywhere on this page to start reading, or click to browse
          files.
        </p>
        <div class="mt-4 pointer-events-auto">
          <span
            class="inline-flex items-center gap-1.5 rounded-lg border border-[var(--astryx-color-border-subtle,#e4e4e7)] bg-[var(--astryx-color-surface,#ffffff)] px-4 py-2 text-sm font-medium text-[var(--astryx-color-fg-primary,#18181b)] shadow-sm hover:bg-[var(--astryx-color-surface-hover,#f4f4f5)] transition-colors cursor-pointer"
          >
            <Fa icon={faUpload} class="text-sm opacity-70" />
            <span>Upload Books</span>
          </span>
        </div>
      </div>
      <label class="fixed inset-0 z-0">
        <input
          type="file"
          accept="application/epub+zip,.epub,.htmlz,plain/text,.txt"
          multiple
          hidden
          use:inputFile={onFilesChange}
        />
      </label>
    {/if}
  </div>

  <footer
    class="relative z-10 py-6 text-center text-xs text-[var(--astryx-color-fg-muted,#71717a)]"
  >
    <a
      href="{pagePath}/privacy"
      class="underline hover:text-[var(--astryx-color-fg-primary,#18181b)] transition-colors"
    >
      Privacy Policy
    </a>
    <span class="mx-2">&bull;</span>
    <a
      href="{pagePath}/terms"
      class="underline hover:text-[var(--astryx-color-fg-primary,#18181b)] transition-colors"
    >
      Terms of Service
    </a>
    <span class="mx-2">&bull;</span>
    <a
      href="https://github.com/valpr/reader"
      target="_blank"
      rel="noopener noreferrer"
      class="hover:text-[var(--astryx-color-fg-primary,#18181b)] transition-colors"
    >
      GitHub
    </a>
  </footer>
</div>
