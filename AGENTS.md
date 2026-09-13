# Agent Instructions & Codebase Guidelines

Guidelines and architectural constraints for working in **reader** (based on ッツ Reader).

---

## 1. Git Workflow

- **Never push directly to `main`**: Open PRs from dedicated branches (`feat/*`, `fix/*`, `chore/*`, `refactor/*`).
- **Commits**: Follow Conventional Commits (enforced by Husky and commitlint).

---

## 2. UI Component Library (`@custom-ereader/ui`)

- Check `packages/ui/src/index.ts` for existing Astryx components before building ad-hoc UI or Tailwind controls.
- If a missing design-system element is needed, implement and export it in `packages/ui` first, then import into `apps/web`.
- Use semantic theme tokens (`var(--astryx-...)` / `data-astryx-theme`) rather than arbitrary hex values.

---

## 3. Architecture & State Pitfalls

- **Svelte 5 Legacy Mode**: Run-time is Svelte 5, but the codebase uses Svelte 4 legacy syntax. **Never use Svelte 5 runes** (`$state`, `$derived`, `$props`, `$effect`, snippets).
- **RxJS Stores**: Global state lives in `apps/web/src/lib/data/store.ts` using `$` suffixed `BehaviorSubject` stores.
  - Svelte templates: auto-subscribe via `$storeName$`.
  - TS/Services: read with `.getValue()`, write with `.next(...)`.
  - **Store reads must be lexically visible in markup**: never hide a `$store$` read inside an `isX()` helper called from `{#if}`/`{@const}`/`{#each}` (e.g. `{@const selected = isTagSelected(tag)}` with the store read inside the function will not re-evaluate). Pass store values as explicit args instead (e.g. `isTagSelected($libraryFilters$?.tags, tag)`).
- **IndexedDB (`books-db`)**: Schemas are append-only. Never modify historical versions (`books-db-v*.ts`); add migrations via `database.service.ts`.
- **Reader Matrix**: Reader changes must support both layout modes (paginated, continuous) and orientations (horizontal, vertical-rl). Always check `$verticalMode$` for coordinates, margins, and gesture math.
- **Cloud Sync**: Local items (e.g., `isAutosave: true`) must never dirty `lastModified` sync timestamps or sync to Drive/OneDrive.

---

## 4. Verification & Testing

Required pre-submit gate (blocking in CI via the `smoke` job in `.github/workflows/ci.yml`):

- **Typecheck & Build**: `pnpm -F web check` and `pnpm -F web build`.
- **Formatting/Linting**: `pnpm -F web lint` (or ensure Prettier/ESLint pass).
- **Smoke E2E**: `pnpm -F web test:smoke` (curated subset, runs against port 5174; `chromium` desktop specs + `mobile` Pixel 9 specs). Must pass before opening a PR. Full suite (`pnpm -F web exec playwright test`) runs nightly via `.github/workflows/e2e.yml` and on demand.
  - Smoke subset (basic functionality + icon visibility): `app`, `library-filters`, `book-tags`, `book-card-menu`, `reader-header`, `tooltips`, `manage-storage-sources` (chromium) + `mobile/manage-cards`, `mobile/manage-dialog`, `mobile/manage-header`, `mobile/reader-header` (mobile).
  - Targeted mapping: header/search/filter change → `library-filters`; tags → `book-tags`; book menu/cards → `book-card-menu` (+ `mobile/manage-*`); reader header/controls → `reader-header` (+ `mobile/reader-header`); icon buttons/tooltips → `tooltips`; source filter/cloud entry → `manage-storage-sources`.
  - **Visual-state assertions**: toggle/filter PRs must assert the control's own state (`aria-checked`/`aria-selected`, active-filter count, checked classes), not just downstream results; multi-select popovers must assert they stay open after each toggle.
  - When writing new reader tests, always use `apps/web/tests/fixtures/book-fixture.ts` to seed IndexedDB. Avoid hardcoded timeouts; use Playwright `waitFor` assertions.
  - Use `--project=chromium` or `--project=mobile` to run a single project locally during iteration.

### 4.1 Mobile gate (Pixel 9, 412x915)

Every dialog, new page, or responsive change needs a case in `apps/web/tests/mobile/` (Pixel 9 `mobile` project) reusing the shared helpers in `apps/web/tests/helpers/mobile-assertions.ts`:

- Assert no horizontal overflow (`scrollWidth <= innerWidth`) at 412px and at narrow 360px width.
- Assert dialogs fit fully inside the viewport and the primary footer action is visible, enabled, and tappable.
- Prefer `tap()` over `click()` where touch semantics matter; keep footer actions reachable with the keyboard open.

Mobile CSS rules:

- Use dynamic viewport units with a fallback (`max-h-[90vh] max-h-[90dvh]`), never bare `100vh`.
- Every dialog surface/wrapper needs `max-h` + `overflow-y-auto`; use fluid widths (`w-full max-w-...`), never fixed widths like `w-64`.
- Honor `env(safe-area-inset-*)` padding, keep touch targets >= 44px, and keep suggestions/dropdowns reachable inside scrolling containers.
