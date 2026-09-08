<script lang="ts">
  import { goto } from '$app/navigation';
  import { pagePath } from '$lib/data/env';
  import { formatPageTitle } from '$lib/functions/format-page-title';
  import { IconButton, TopBar } from '@custom-ereader/ui';
  import {
    faArrowLeft,
    faBookOpen,
    faFileContract,
    faScaleBalanced,
    faShieldHalved
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
  <title>{formatPageTitle('Terms of Service')}</title>
  <meta
    name="description"
    content="Terms of Service for Valpr Reader governing usage, user responsibilities, third-party services, and open-source licensing."
  />
</svelte:head>

<div
  class="min-h-screen bg-[var(--astryx-color-bg,#ffffff)] text-[var(--astryx-color-fg-primary,#18181b)]"
>
  <div class="fixed inset-x-0 top-0 z-20">
    <TopBar bordered={true} density="compact">
      <div slot="start" class="flex items-center gap-2">
        <IconButton label="Go back" size="md" variant="ghost" on:click={goBack}>
          <Fa icon={faArrowLeft} />
        </IconButton>
        <span
          class="text-sm font-semibold tracking-tight text-[var(--astryx-color-fg-primary,#18181b)]"
        >
          Valpr Reader
        </span>
      </div>

      <div class="text-sm font-medium text-[var(--astryx-color-fg-muted,#71717a)]">
        Terms of Service
      </div>

      <div slot="end" class="flex items-center gap-1.5">
        <a
          href="{pagePath}/privacy"
          class="inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-medium text-[var(--astryx-color-fg-muted,#71717a)] hover:bg-[var(--astryx-color-surface-hover,#f4f4f5)] hover:text-[var(--astryx-color-fg-primary,#18181b)] transition-colors"
        >
          <Fa icon={faShieldHalved} class="text-xs opacity-70" />
          <span>Privacy</span>
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
        <Fa icon={faScaleBalanced} class="text-xs" />
        <span>Legal Terms &amp; Conditions</span>
      </div>
      <h1
        class="text-3xl font-bold tracking-tight text-[var(--astryx-color-fg-primary,#18181b)] sm:text-4xl"
      >
        Valpr Reader Terms of Service
      </h1>
      <p class="mt-2 text-sm text-[var(--astryx-color-fg-muted,#71717a)]">
        Last Updated: September 8, 2026 &bull; Effective Date: September 8, 2026
      </p>
    </header>

    <div class="space-y-10 text-sm leading-relaxed text-[var(--astryx-color-fg-secondary,#52525b)]">
      <!-- Section 1 -->
      <section class="space-y-3">
        <h2 class="text-xl font-bold text-[var(--astryx-color-fg-primary,#18181b)]">
          1. Acceptance of Terms
        </h2>
        <p>
          By accessing or using <strong>Valpr Reader</strong> (available at
          <a
            href="https://valpr.github.io/"
            class="text-[var(--astryx-color-primary,#6366f1)] underline">https://valpr.github.io/</a
          >
          or
          <a
            href="https://valpr.github.io/reader"
            class="text-[var(--astryx-color-primary,#6366f1)] underline"
            >https://valpr.github.io/reader</a
          >), you agree to be bound by these Terms of Service. If you do not agree to these terms,
          please do not use the application.
        </p>
      </section>

      <!-- Section 2 -->
      <section class="space-y-3">
        <h2 class="text-xl font-bold text-[var(--astryx-color-fg-primary,#18181b)]">
          2. Description of the Service
        </h2>
        <p>
          Valpr Reader is a free, open-source, client-side web e-book reader optimized for Japanese
          text immersion and learning. Features include reading Japanese e-books (EPUB, HTMLZ, and
          TXT), support for popup dictionary extensions (e.g., Yomitan), reading progress tracking,
          personal reading statistics, and optional synchronization through third-party cloud
          storage providers (Google Drive, Microsoft OneDrive) or local filesystems.
        </p>
        <p>
          Valpr Reader operates primarily as a client-side application executing in your local web
          browser environment without proprietary remote application servers.
        </p>
      </section>

      <!-- Section 3 -->
      <section class="space-y-3">
        <h2 class="text-xl font-bold text-[var(--astryx-color-fg-primary,#18181b)]">
          3. User Responsibilities &amp; Content Ownership
        </h2>
        <ul class="list-disc pl-5 space-y-1.5">
          <li>
            <strong>Your Content:</strong> You retain complete ownership and intellectual property rights
            in any books, text, images, or documents you load into Valpr Reader.
          </li>
          <li>
            <strong>Legal Compliance:</strong> You are solely responsible for ensuring that any material
            or books you import or synchronize comply with applicable copyright laws and intellectual
            property regulations in your jurisdiction.
          </li>
          <li>
            <strong>Local Data Management:</strong> Because Valpr Reader stores your books and reading
            progress locally within your browser's IndexedDB, you are responsible for maintaining backups
            (e.g., via the built-in Export Backup feature or cloud sync).
          </li>
        </ul>
      </section>

      <!-- Section 4 -->
      <section class="space-y-3">
        <h2 class="text-xl font-bold text-[var(--astryx-color-fg-primary,#18181b)]">
          4. Third-Party Services &amp; Cloud Integrations
        </h2>
        <p>
          Valpr Reader optionally integrates with third-party platforms for cloud storage and
          synchronization:
        </p>
        <ul class="list-disc pl-5 space-y-1.5">
          <li>
            <strong>Google Drive:</strong> If you connect Google Drive, Valpr Reader interacts with
            Google APIs using the <code>https://www.googleapis.com/auth/drive.file</code> scope.
            Your use is subject to the
            <a
              href="https://policies.google.com/terms"
              target="_blank"
              rel="noopener noreferrer"
              class="text-[var(--astryx-color-primary,#6366f1)] underline"
              >Google Terms of Service</a
            >
            and our
            <a
              href="{pagePath}/privacy"
              class="text-[var(--astryx-color-primary,#6366f1)] underline">Privacy Policy</a
            >.
          </li>
          <li>
            <strong>Microsoft OneDrive:</strong> If you connect OneDrive, usage is subject to the
            <a
              href="https://www.microsoft.com/servicesagreement"
              target="_blank"
              rel="noopener noreferrer"
              class="text-[var(--astryx-color-primary,#6366f1)] underline"
              >Microsoft Services Agreement</a
            >.
          </li>
          <li>
            <strong>GitHub Pages:</strong> The public web instance of Valpr Reader is hosted on GitHub
            Pages and is subject to GitHub's terms and privacy statements.
          </li>
        </ul>
      </section>

      <!-- Section 5 -->
      <section class="space-y-3">
        <h2 class="text-xl font-bold text-[var(--astryx-color-fg-primary,#18181b)]">
          5. Open Source License &amp; Intellectual Property
        </h2>
        <p>
          Valpr Reader is open-source software licensed under the <strong
            >BSD 3-Clause License</strong
          >. You are free to inspect, fork, modify, and distribute the software in accordance with
          the terms of the license located in the project's repository at
          <a
            href="https://github.com/valpr/reader"
            target="_blank"
            rel="noopener noreferrer"
            class="text-[var(--astryx-color-primary,#6366f1)] underline"
            >https://github.com/valpr/reader</a
          >.
        </p>
      </section>

      <!-- Section 6 -->
      <section class="space-y-3">
        <h2 class="text-xl font-bold text-[var(--astryx-color-fg-primary,#18181b)]">
          6. Disclaimer of Warranties
        </h2>
        <p class="uppercase text-xs font-semibold text-[var(--astryx-color-fg-muted,#71717a)]">
          Provided "As Is" and "As Available"
        </p>
        <p>
          Valpr Reader is provided free of charge on an "as is" and "as available" basis, without
          warranty of any kind, either express or implied, including but not limited to the implied
          warranties of merchantability, fitness for a particular purpose, and non-infringement. We
          do not warrant that the application will be uninterrupted, error-free, or completely free
          of data loss.
        </p>
      </section>

      <!-- Section 7 -->
      <section class="space-y-3">
        <h2 class="text-xl font-bold text-[var(--astryx-color-fg-primary,#18181b)]">
          7. Limitation of Liability
        </h2>
        <p>
          To the fullest extent permitted by applicable law, neither the developers, authors, nor
          contributors of Valpr Reader shall be liable for any direct, indirect, incidental,
          special, consequential, or punitive damages, including loss of data, loss of profits, or
          business interruption, arising out of or related to your use of or inability to use Valpr
          Reader.
        </p>
      </section>

      <!-- Section 8 -->
      <section class="space-y-3">
        <h2 class="text-xl font-bold text-[var(--astryx-color-fg-primary,#18181b)]">
          8. Changes to These Terms
        </h2>
        <p>
          We reserve the right to revise these Terms of Service at any time. Any revisions will be
          published directly on this page with an updated "Last Updated" timestamp. Continued use of
          Valpr Reader following any changes constitutes acceptance of the new terms.
        </p>
      </section>

      <!-- Section 9 -->
      <section
        class="space-y-3 rounded-xl border border-[var(--astryx-color-border-subtle,#e4e4e7)] bg-[var(--astryx-color-surface,#ffffff)] p-6"
      >
        <h2 class="text-xl font-bold text-[var(--astryx-color-fg-primary,#18181b)]">
          9. Contact Information
        </h2>
        <p>If you have questions regarding these Terms of Service, please reach out via GitHub:</p>
        <div class="pt-2 text-xs space-y-1">
          <p>
            <strong>Application:</strong> Valpr Reader
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
