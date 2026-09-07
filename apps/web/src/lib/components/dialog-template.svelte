<section
  class="astryx-dialog-surface mdc-elevation--z24 rounded-xl bg-[var(--astryx-color-surface-elevated,var(--astryx-color-surface,#ffffff))] text-[var(--astryx-color-fg-primary,#18181b)] border border-[var(--astryx-color-border-subtle,transparent)] p-6 transition-colors shadow-2xl"
>
  <h2 class="weight-medium mb-5 text-xl text-[var(--astryx-color-fg-primary,#18181b)]">
    <slot name="header" />
  </h2>
  <div class="text-[var(--astryx-color-fg-secondary,#52525b)]">
    <slot name="content" />
  </div>
  <footer class="flex flex-wrap items-center justify-end pt-5 gap-2">
    <slot name="footer" />
  </footer>
</section>
