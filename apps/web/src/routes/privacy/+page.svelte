<script lang="ts">
  import { goto } from '$app/navigation';
  import { pagePath } from '$lib/data/env';
  import { formatPageTitle } from '$lib/functions/format-page-title';
  import { IconButton, Tooltip, TopBar } from '@custom-ereader/ui';
  import {
    faArrowLeft,
    faBookOpen,
    faCloud,
    faFileContract,
    faLock,
    faShieldHalved,
    faTrash
  } from '@fortawesome/free-solid-svg-icons';
  import Fa from 'svelte-fa';

  function goBack() {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      window.history.back();
    } else {
      goto(`${pagePath}/manage`);
    }
  }
</script>

<svelte:head>
  <title>{formatPageTitle('Privacy Policy')}</title>
  <meta
    name="description"
    content="Privacy Policy for Valpr Reader detailing local-first data processing, Google Drive integration, and data retention rights."
  />
</svelte:head>

<div
  class="min-h-screen bg-[var(--astryx-color-bg,#ffffff)] text-[var(--astryx-color-fg-primary,#18181b)]"
>
  <div class="fixed inset-x-0 top-0 z-20">
    <TopBar bordered={true} density="compact">
      <div slot="start" class="flex items-center gap-2">
        <Tooltip text="Go back">
          <IconButton
            nativeTooltip={false}
            label="Go back"
            size="md"
            variant="ghost"
            on:click={goBack}
          >
            <Fa icon={faArrowLeft} />
          </IconButton>
        </Tooltip>
        <span
          class="text-sm font-semibold tracking-tight text-[var(--astryx-color-fg-primary,#18181b)]"
        >
          Valpr Reader
        </span>
      </div>

      <div class="text-sm font-medium text-[var(--astryx-color-fg-muted,#71717a)]">
        Privacy Policy
      </div>

      <div slot="end" class="flex items-center gap-1.5">
        <a
          href="{pagePath}/terms"
          class="inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-medium text-[var(--astryx-color-fg-muted,#71717a)] hover:bg-[var(--astryx-color-surface-hover,#f4f4f5)] hover:text-[var(--astryx-color-fg-primary,#18181b)] transition-colors"
        >
          <Fa icon={faFileContract} class="text-xs opacity-70" />
          <span>Terms</span>
        </a>
        <a
          href="{pagePath}/manage"
          class="inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-medium text-[var(--astryx-color-primary,#6366f1)] hover:bg-[var(--astryx-color-surface-hover,#f4f4f5)] transition-colors"
        >
          <Fa icon={faBookOpen} class="text-xs opacity-70" />
          <span>Library</span>
        </a>
      </div>
    </TopBar>
  </div>

  <main class="mx-auto max-w-4xl px-4 pt-20 pb-24 sm:px-6 lg:px-8">
    <!-- Header -->
    <header class="border-b border-[var(--astryx-color-border-subtle,#e4e4e7)] pb-8 mb-8">
      <div
        class="inline-flex items-center gap-2 rounded-full bg-[var(--astryx-color-primary-subtle,rgba(99,102,241,0.12))] px-3 py-1 text-xs font-semibold text-[var(--astryx-color-primary,#6366f1)] mb-4"
      >
        <Fa icon={faShieldHalved} class="text-xs" />
        <span>User Privacy &amp; Data Protection</span>
      </div>
      <h1
        class="text-3xl font-bold tracking-tight text-[var(--astryx-color-fg-primary,#18181b)] sm:text-4xl"
      >
        Valpr Reader Privacy Policy
      </h1>
      <p class="mt-2 text-sm text-[var(--astryx-color-fg-muted,#71717a)]">
        Last Updated: September 8, 2026 &bull; Effective Date: September 8, 2026
      </p>
    </header>

    <!-- Key Principles Callout -->
    <div
      class="mb-10 rounded-xl border border-[var(--astryx-color-border-subtle,#e4e4e7)] bg-[var(--astryx-color-surface,#ffffff)] p-6 shadow-sm"
    >
      <h2
        class="text-base font-semibold text-[var(--astryx-color-fg-primary,#18181b)] flex items-center gap-2"
      >
        <Fa icon={faLock} class="text-[var(--astryx-color-primary,#6366f1)] text-sm" />
        <span>Core Privacy Summary</span>
      </h2>
      <ul
        class="mt-3 space-y-2 text-sm text-[var(--astryx-color-fg-secondary,#52525b)] leading-relaxed"
      >
        <li class="flex items-start gap-2">
          <span class="text-[var(--astryx-color-primary,#6366f1)] font-bold">&bull;</span>
          <span
            ><strong>Local-First Architecture:</strong> Valpr Reader runs entirely in your web browser.
            All book processing, reading progress, and statistics are stored locally on your device.</span
          >
        </li>
        <li class="flex items-start gap-2">
          <span class="text-[var(--astryx-color-primary,#6366f1)] font-bold">&bull;</span>
          <span
            ><strong>No Proprietary Backend Servers:</strong> Valpr Reader operates no backend application
            servers, databases, or analytics services. We never collect, track, or sell your personal
            data.</span
          >
        </li>
        <li class="flex items-start gap-2">
          <span class="text-[var(--astryx-color-primary,#6366f1)] font-bold">&bull;</span>
          <span
            ><strong>Direct Cloud Connections:</strong> When optional Google Drive or OneDrive sync is
            enabled, your browser communicates directly with Google/Microsoft APIs via encrypted HTTPS
            connections.</span
          >
        </li>
      </ul>
    </div>

    <!-- Main Content Sections -->
    <div class="space-y-10 text-sm leading-relaxed text-[var(--astryx-color-fg-secondary,#52525b)]">
      <!-- Section 1 -->
      <section class="space-y-3">
        <h2 class="text-xl font-bold text-[var(--astryx-color-fg-primary,#18181b)]">
          1. Overview of Valpr Reader
        </h2>
        <p>
          <strong>Valpr Reader</strong> is a free, open-source, web-based e-book reader designed specifically
          for Japanese language learning and immersion (supporting EPUB, HTMLZ, and TXT formats), Yomitan
          dictionary popups, and reading statistics.
        </p>
        <p>
          This Privacy Policy explains how Valpr Reader handles your information when you access or
          use the application hosted at <a
            href="https://valpr.github.io/"
            class="text-[var(--astryx-color-primary,#6366f1)] underline">https://valpr.github.io/</a
          >
          or
          <a
            href="https://valpr.github.io/reader"
            class="text-[var(--astryx-color-primary,#6366f1)] underline"
            >https://valpr.github.io/reader</a
          >, or self-host your own instance.
        </p>
      </section>

      <!-- Section 2 -->
      <section class="space-y-3">
        <h2 class="text-xl font-bold text-[var(--astryx-color-fg-primary,#18181b)]">
          2. Information We Process &amp; How It Is Used
        </h2>
        <p>
          Valpr Reader processes the following types of information strictly to provide reader
          functionality:
        </p>
        <div class="grid gap-4 sm:grid-cols-2 pt-2">
          <div
            class="rounded-lg border border-[var(--astryx-color-border-subtle,#e4e4e7)] p-4 bg-[var(--astryx-color-surface,#ffffff)]"
          >
            <h3 class="font-semibold text-[var(--astryx-color-fg-primary,#18181b)] mb-1">
              Book &amp; Library Data
            </h3>
            <p class="text-xs text-[var(--astryx-color-fg-muted,#71717a)]">
              E-book files (EPUB, HTMLZ, TXT) and cover images imported by you are stored in your
              browser's IndexedDB. They never leave your device unless you choose to sync them to
              your personal cloud storage.
            </p>
          </div>
          <div
            class="rounded-lg border border-[var(--astryx-color-border-subtle,#e4e4e7)] p-4 bg-[var(--astryx-color-surface,#ffffff)]"
          >
            <h3 class="font-semibold text-[var(--astryx-color-fg-primary,#18181b)] mb-1">
              Reading Progress &amp; Stats
            </h3>
            <p class="text-xs text-[var(--astryx-color-fg-muted,#71717a)]">
              Reading positions, bookmarks, character counts, reading speed, and session times are
              calculated and stored locally in your browser to resume reading and display personal
              statistics.
            </p>
          </div>
          <div
            class="rounded-lg border border-[var(--astryx-color-border-subtle,#e4e4e7)] p-4 bg-[var(--astryx-color-surface,#ffffff)]"
          >
            <h3 class="font-semibold text-[var(--astryx-color-fg-primary,#18181b)] mb-1">
              Reader Preferences
            </h3>
            <p class="text-xs text-[var(--astryx-color-fg-muted,#71717a)]">
              Fonts, colors, themes, margins, reading orientation (horizontal or vertical-rl), and
              reader profiles are stored locally in your browser's LocalStorage and IndexedDB.
            </p>
          </div>
          <div
            class="rounded-lg border border-[var(--astryx-color-border-subtle,#e4e4e7)] p-4 bg-[var(--astryx-color-surface,#ffffff)]"
          >
            <h3 class="font-semibold text-[var(--astryx-color-fg-primary,#18181b)] mb-1">
              Cloud Authentication Tokens
            </h3>
            <p class="text-xs text-[var(--astryx-color-fg-muted,#71717a)]">
              When you connect Google Drive or OneDrive, OAuth access and refresh tokens are stored
              locally in your browser. Tokens may optionally be encrypted with a password of your
              choice.
            </p>
          </div>
        </div>
      </section>

      <!-- Section 3: Google User Data -->
      <section
        class="space-y-4 rounded-xl border-2 border-[var(--astryx-color-primary-subtle,rgba(99,102,241,0.25))] bg-[var(--astryx-color-surface,#ffffff)] p-6 shadow-sm"
      >
        <div class="flex items-center gap-2">
          <Fa icon={faCloud} class="text-[var(--astryx-color-primary,#6366f1)] text-lg" />
          <h2 class="text-xl font-bold text-[var(--astryx-color-fg-primary,#18181b)]">
            3. Google API Services &amp; Google Drive User Data
          </h2>
        </div>

        <p>
          Valpr Reader provides an optional cloud synchronization feature powered by Google Drive.
          Connecting Google Drive is entirely optional; Valpr Reader functions with full feature
          parity locally without signing in to Google.
        </p>

        <div class="space-y-3 pt-2">
          <h3 class="font-semibold text-[var(--astryx-color-fg-primary,#18181b)]">
            A. Requested Google OAuth Scopes
          </h3>
          <p>
            When you choose to connect Google Drive in Valpr Reader Settings, the application
            requests the following scope:
          </p>
          <div
            class="rounded-lg bg-[var(--astryx-color-surface-hover,#f4f4f5)] p-3.5 font-mono text-xs text-[var(--astryx-color-fg-primary,#18181b)]"
          >
            https://www.googleapis.com/auth/drive.file
          </div>
          <p class="text-xs text-[var(--astryx-color-fg-muted,#71717a)]">
            <strong>What this scope allows:</strong> Per Google's official scope definition, this scope
            only grants access to files and folders that were created by or opened with Valpr Reader.
          </p>
        </div>

        <div class="space-y-2 pt-2">
          <h3 class="font-semibold text-[var(--astryx-color-fg-primary,#18181b)]">
            B. What Google Data We Access
          </h3>
          <ul
            class="list-disc pl-5 space-y-1.5 text-xs text-[var(--astryx-color-fg-secondary,#52525b)]"
          >
            <li>
              Valpr Reader only reads and writes files within the designated application folder (by
              default named <code>valpr-reader-data</code>) created by the app in your Google Drive.
            </li>
            <li>
              These files include synced reading progress, bookmarks, reading statistics, user
              settings/profiles, and optional book archives uploaded by you.
            </li>
            <li>
              <strong>What we DO NOT access:</strong> Valpr Reader cannot access, view, modify, or delete
              any other files, documents, photos, spreadsheets, emails, or personal information in your
              Google Drive or Google Account. We do not request or store your Google profile, contact
              lists, or personal identity information.
            </li>
          </ul>
        </div>

        <div class="space-y-2 pt-2">
          <h3 class="font-semibold text-[var(--astryx-color-fg-primary,#18181b)]">
            C. How Google Data Is Handled and Transferred
          </h3>
          <ul
            class="list-disc pl-5 space-y-1.5 text-xs text-[var(--astryx-color-fg-secondary,#52525b)]"
          >
            <li>
              All communication with Google APIs is initiated directly from your web browser to
              Google endpoints (<code>https://accounts.google.com</code>,
              <code>https://oauth2.googleapis.com</code>, and
              <code>https://www.googleapis.com</code>) via secure Transport Layer Security
              (TLS/HTTPS).
            </li>
            <li>
              No intermediary server is used. Data is never routed through, processed by, or cached
              on any server operated by Valpr Reader.
            </li>
            <li>
              Google user data is never used for advertising, marketing, analytics, or profiling.
            </li>
            <li>Google user data is never sold, rented, or transferred to any third party.</li>
          </ul>
        </div>

        <!-- Google Limited Use Disclosure Callout -->
        <div
          class="mt-4 rounded-lg border border-[var(--astryx-color-primary,#6366f1)] bg-[var(--astryx-color-primary-subtle,rgba(99,102,241,0.08))] p-4"
        >
          <h4
            class="font-bold text-xs uppercase tracking-wider text-[var(--astryx-color-primary,#6366f1)] mb-1"
          >
            Google API Services User Data Policy Compliance
          </h4>
          <p class="text-sm font-medium text-[var(--astryx-color-fg-primary,#18181b)] italic">
            "Valpr Reader's use and transfer of information received from Google APIs to any other
            app will adhere to the <a
              href="https://developers.google.com/terms/api-services-user-data-policy#additional_requirements_for_specific_api_scopes"
              target="_blank"
              rel="noopener noreferrer"
              class="underline text-[var(--astryx-color-primary,#6366f1)] font-semibold"
              >Google API Services User Data Policy</a
            >, including the Limited Use requirements."
          </p>
        </div>
      </section>

      <!-- Section 4: Microsoft OneDrive -->
      <section class="space-y-3">
        <h2 class="text-xl font-bold text-[var(--astryx-color-fg-primary,#18181b)]">
          4. Microsoft OneDrive Integration
        </h2>
        <p>
          Similar to Google Drive, Valpr Reader optionally supports synchronizing reading progress
          and books with Microsoft OneDrive using the <code>Files.ReadWrite.AppFolder</code> and
          <code>User.Read</code> scopes. Access is strictly confined to Valpr Reader's sandboxed application
          folder on your OneDrive account. Transfers occur directly from your browser to Microsoft Graph
          APIs via HTTPS.
        </p>
      </section>

      <!-- Section 5: Data Security -->
      <section class="space-y-3">
        <h2 class="text-xl font-bold text-[var(--astryx-color-fg-primary,#18181b)]">
          5. Data Security &amp; Encryption
        </h2>
        <p>We implement strong client-side security measures to safeguard your data:</p>
        <ul class="list-disc pl-5 space-y-1.5">
          <li>
            <strong>Local Storage Isolation:</strong> All reading data is stored within your browser's
            origin sandbox (IndexedDB, LocalStorage) and cannot be accessed by other websites.
          </li>
          <li>
            <strong>Encrypted Connections:</strong> All API communications with Google and Microsoft
            use standard HTTPS/TLS encryption in transit.
          </li>
          <li>
            <strong>Optional Token &amp; Profile Encryption:</strong> You can configure Valpr Reader
            with a master password to encrypt OAuth tokens and profiles using AES encryption before persisting
            them in IndexedDB.
          </li>
          <li>
            <strong>No Server Vulnerabilities:</strong> Because Valpr Reader has no central database
            or backend server, there is no centralized database to breach.
          </li>
        </ul>
      </section>

      <!-- Section 6: Data Retention & User Deletion Rights -->
      <section
        class="space-y-4 rounded-xl border border-[var(--astryx-color-border-subtle,#e4e4e7)] bg-[var(--astryx-color-surface,#ffffff)] p-6"
      >
        <div class="flex items-center gap-2">
          <Fa icon={faTrash} class="text-[var(--astryx-color-danger,#ef4444)] text-base" />
          <h2 class="text-xl font-bold text-[var(--astryx-color-fg-primary,#18181b)]">
            6. Data Retention &amp; User Deletion Rights
          </h2>
        </div>

        <p>
          You have absolute control over your data at all times. Here is how you can manage, delete,
          or revoke access:
        </p>

        <div class="space-y-3 pt-1">
          <div class="flex items-start gap-3">
            <span
              class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--astryx-color-surface-hover,#f4f4f5)] text-xs font-bold text-[var(--astryx-color-fg-primary,#18181b)]"
              >1</span
            >
            <div>
              <p class="font-semibold text-[var(--astryx-color-fg-primary,#18181b)]">
                Delete Books &amp; Reading Data In-App
              </p>
              <p class="text-xs text-[var(--astryx-color-fg-muted,#71717a)] mt-0.5">
                In the Book Manager, select books and click the Delete icon to permanently delete
                books, reading progress, and bookmarks. In Settings &gt; Data &gt; Danger Zone,
                “Reset everything” wipes all local books, data, and settings, disconnects all
                clouds, and restores factory defaults.
              </p>
            </div>
          </div>

          <div class="flex items-start gap-3">
            <span
              class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--astryx-color-surface-hover,#f4f4f5)] text-xs font-bold text-[var(--astryx-color-fg-primary,#18181b)]"
              >2</span
            >
            <div>
              <p class="font-semibold text-[var(--astryx-color-fg-primary,#18181b)]">
                Delete Synced Files in Google Drive
              </p>
              <p class="text-xs text-[var(--astryx-color-fg-muted,#71717a)] mt-0.5">
                Open your Google Drive at <a
                  href="https://drive.google.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="text-[var(--astryx-color-primary,#6366f1)] underline">drive.google.com</a
                >
                and simply delete the <code>valpr-reader-data</code> folder. This permanently wipes all
                synced data from Google servers.
              </p>
            </div>
          </div>

          <div class="flex items-start gap-3">
            <span
              class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--astryx-color-surface-hover,#f4f4f5)] text-xs font-bold text-[var(--astryx-color-fg-primary,#18181b)]"
              >3</span
            >
            <div>
              <p class="font-semibold text-[var(--astryx-color-fg-primary,#18181b)]">
                Disconnect &amp; Revoke Google Access
              </p>
              <p class="text-xs text-[var(--astryx-color-fg-muted,#71717a)] mt-0.5">
                You can disconnect Google Drive at any time under Settings &gt; Storage Sources in
                Valpr Reader. You may also immediately revoke Valpr Reader's authorization at any
                time by visiting <a
                  href="https://myaccount.google.com/permissions"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="text-[var(--astryx-color-primary,#6366f1)] underline"
                  >Google Account Security Permissions</a
                >.
              </p>
            </div>
          </div>

          <div class="flex items-start gap-3">
            <span
              class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--astryx-color-surface-hover,#f4f4f5)] text-xs font-bold text-[var(--astryx-color-fg-primary,#18181b)]"
              >4</span
            >
            <div>
              <p class="font-semibold text-[var(--astryx-color-fg-primary,#18181b)]">
                Browser Storage Deletion
              </p>
              <p class="text-xs text-[var(--astryx-color-fg-muted,#71717a)] mt-0.5">
                Clearing your browser's cookies and site data for the application's domain will
                immediately erase all local application state, cached books, and stored tokens.
              </p>
            </div>
          </div>
        </div>
      </section>

      <!-- Section 7: Children's Privacy -->
      <section class="space-y-3">
        <h2 class="text-xl font-bold text-[var(--astryx-color-fg-primary,#18181b)]">
          7. Children's Privacy
        </h2>
        <p>
          Valpr Reader does not knowingly collect or solicit any personal information from children
          under the age of 13. Since Valpr Reader collects no personal information on remote
          servers, no child data is ever stored.
        </p>
      </section>

      <!-- Section 8: Changes to this Policy -->
      <section class="space-y-3">
        <h2 class="text-xl font-bold text-[var(--astryx-color-fg-primary,#18181b)]">
          8. Changes to this Privacy Policy
        </h2>
        <p>
          We may occasionally update this Privacy Policy to reflect changes in functionality,
          third-party API requirements, or legal compliance. Any changes will be posted on this page
          with an updated revision date.
        </p>
      </section>

      <!-- Section 9: Contact Information -->
      <section
        class="space-y-3 rounded-xl border border-[var(--astryx-color-border-subtle,#e4e4e7)] bg-[var(--astryx-color-surface,#ffffff)] p-6"
      >
        <h2 class="text-xl font-bold text-[var(--astryx-color-fg-primary,#18181b)]">
          9. Contact Us &amp; Open Source Repository
        </h2>
        <p>
          Valpr Reader is developed as an open-source project. If you have any questions, feedback,
          or concerns regarding this Privacy Policy or our privacy practices, please contact us or
          open an issue on our GitHub repository:
        </p>
        <div class="pt-2 text-xs space-y-1">
          <p>
            <strong>Application Name:</strong> Valpr Reader
          </p>
          <p>
            <strong>GitHub Repository:</strong>{' '}
            <a
              href="https://github.com/valpr/reader"
              target="_blank"
              rel="noopener noreferrer"
              class="text-[var(--astryx-color-primary,#6366f1)] underline font-medium"
            >
              https://github.com/valpr/reader
            </a>
          </p>
          <p>
            <strong>Issue Tracker:</strong>{' '}
            <a
              href="https://github.com/valpr/reader/issues"
              target="_blank"
              rel="noopener noreferrer"
              class="text-[var(--astryx-color-primary,#6366f1)] underline font-medium"
            >
              https://github.com/valpr/reader/issues
            </a>
          </p>
        </div>
      </section>
    </div>
  </main>
</div>
