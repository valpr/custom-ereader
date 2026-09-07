# Agent Instructions & Codebase Guidelines

Welcome to **custom-ereader** (an enhanced e-book reader based on ッツ Reader). This document outlines mandatory workflow rules, architectural patterns, and development guidelines for AI agents working in this repository.

---

## 1. Git Workflow & Branching Discipline

- **Never commit or push directly to `main`**:
  - All work must be conducted on a dedicated feature, fix, or chore branch.
  - All branches target `main` as their merge destination (open PRs against `main`).
  - Branch naming convention:
    - `feat/<feature-name>` (e.g., `feat/cloud-reconnect`)
    - `fix/<bug-name>` (e.g., `fix/bookmark-jump`)
    - `chore/<task-name>` (e.g., `chore/agent-guidelines`)
    - `refactor/<area>` (e.g., `refactor/storage-handler`)
- **Conventional Commits**:
  - Follow Conventional Commits format (`feat(scope): description`, `fix(scope): description`).
  - Enforced by `.commitlintrc.yaml` and Husky pre-commit hooks (`eslint --fix` and `prettier --write`).
- **Clean Git State**:
  - Always check `git status` before finishing. Never commit accidental temporary scripts, debug log statements, or untracked artifact dumps.

---

## 2. UI Component Library (`@custom-ereader/ui`)

- **Prefer Astryx Local Components**:
  - The monorepo contains a dedicated UI package: `packages/ui` (`@custom-ereader/ui`), based on the Astryx Design System.
  - Always prefer importing and using components from `@custom-ereader/ui` over writing custom ad-hoc HTML/CSS or duplicate Tailwind controls.
  - Available components in `@custom-ereader/ui`:
    - **Buttons**: `Button`, `IconButton`, `ButtonGroup`, `ToggleButton`, `ToggleButtonGroup`
    - **Controls**: `SegmentedControl`, `Slider`, `Switch`, `Input`, `Select`
    - **Surfaces & Overlays**: `Card`, `Dialog`, `Tooltip`
    - **Lists**: `List`, `ListItem`, `ListSection`
    - **Navigation & Layout**: `Tabs`, `TopBar`, `OverflowList`
- **Missing Components Policy**:
  - If a required component does not exist in `packages/ui`, investigate whether an equivalent Astryx design system component should be created or migrated into `packages/ui` first.
  - Implement the component in `packages/ui/src/`, export it in `packages/ui/src/index.ts`, and then consume it in `apps/web`.
- **Theme Tokens**:
  - Respect Astryx semantic theme tokens (`data-astryx-theme="neutral|stone|gothic"`).
  - Do not hardcode arbitrary hex colors when semantic variables (`var(--astryx-...)`) or theme options are available.

---

## 3. Tech Stack & State Architecture

- **Svelte 5 (Legacy Mode)**:
  - The workspace has been upgraded to **Svelte 5** (`^5.0.0`) with `@sveltejs/vite-plugin-svelte` v4.
  - All existing components still use Svelte 4 **legacy syntax** (stores, reactive declarations, `on:event` directives).
  - **Do NOT introduce Svelte 5 runes** (`$state`, `$derived`, `$props`, `$effect`, snippet syntax) — Svelte 5 is the runtime but the codebase runs in compatibility/legacy mode throughout.
- **RxJS State Management**:
  - Global application state resides in `apps/web/src/lib/data/store.ts` using RxJS `BehaviorSubject` stores suffixed with `$` (e.g., `$syncTarget$`, `$verticalMode$`, `$statisticsMergeMode$`).
  - In Svelte files, use reactive auto-subscription syntax: `$storeName$`.
  - In TypeScript / service files, read using `.getValue()` and update using `.next(...)`.
- **IndexedDB Schema Integrity (`books-db`)**:
  - IndexedDB schemas are strongly versioned (`apps/web/src/lib/data/database/books-db/versions/`).
  - Never mutate previous version interfaces (`books-db-v5.ts`, etc.).
  - Always follow the existing migration patterns in `database.service.ts` so users upgrading their browser data do not encounter corruption.

---

## 4. Reader Compatibility & Orientations

Every change to the book reader view (`apps/web/src/routes/b/+page.svelte` or reader components) must account for the reader's dual-mode matrix:

- **Layout Modes**:
  - **Paginated** (`book-reader-paginated.svelte`): Column-based paging with viewport snapping.
  - **Continuous** (`book-reader-continuous.svelte`): Smooth continuous scroll.
- **Text Orientations**:
  - **Horizontal** (`writing-mode: horizontal-tb`)
  - **Vertical Japanese** (`writing-mode: vertical-rl`): Reading direction is right-to-left, column progression is top-to-bottom.
  - Always check `$verticalMode$` when calculating coordinates, margins, gesture directions, and indicator placements.

---

## 5. Cloud Sync & Replication Boundaries

- **Local vs. Syncable Data**:
  - Checkpoints like rolling autosave history (`isAutosave: true`) are intentionally local-only.
  - Never dirty `lastModified` sync timestamps or export transient local records to Google Drive or OneDrive.
- **Account Collision Safeguard**:
  - Cloud storage sources (Google Drive, OneDrive) must never silently re-link to a different cloud account without explicit user confirmation.
  - Respect bidirectional merge modes (`MergeMode.MERGE`, `LOCAL`, `REMOTE`) and never assume remote or local is a unilateral dictator.

---

## 6. Verification & Quality Gates

- **Build Check**:
  - Run `pnpm -F web build` before finalizing any task. Svelte template syntax errors, dead imports, and broken bindings will be caught during chunk rendering.
- **Type Check**:
  - Ensure `pnpm -F web check` produces no new errors or regressions in modified files.
- **Formatting & Linting**:
  - Ensure ESLint and Prettier pass cleanly.
- **E2E Tests**:
  - Run `pnpm -F web exec playwright test` to execute the Playwright test suite.
  - Tests run against a dev server on port **5174** (see `apps/web/playwright.config.ts`).
  - The fixture (`apps/web/tests/fixtures/book-fixture.ts`) seeds IndexedDB directly via `page.evaluate`; do not bypass or stub it.
  - Test specs cover: reader loading, header responsiveness (OverflowList), dual-mode matrix (paginated/continuous × horizontal/vertical), navigation, bookmarks, TOC drawer, and header controls.
  - All 22 tests must remain passing. Do not disable tests without explicit justification in the PR description.

---

## 7. E2E Testing (Playwright)

- **Test Directory**: `apps/web/tests/`
- **Config**: `apps/web/playwright.config.ts` — Chromium only, `baseURL: http://localhost:5174`.
- **Fixture**: `book-fixture.ts` — seeds a complete EPUB into IndexedDB so tests start with a real book loaded. Use this fixture for any new reader-level tests.
- **Test Files**:
  - `app.spec.ts` — general app smoke tests
  - `reader-loading.spec.ts` — book load and parse flow
  - `reader-header.spec.ts` — header control interactions
  - `reader-header-responsive.spec.ts` — OverflowList collapse at narrow widths
  - `reader-modes.spec.ts` — paginated vs. continuous, horizontal vs. vertical
  - `reader-navigation.spec.ts` — page turns, scroll, keyboard shortcuts
  - `reader-bookmarks.spec.ts` — bookmark creation, drawer, color tags, autosaves
  - `reader-toc.spec.ts` — table of contents drawer
- **Adding New Tests**: Follow the existing `test.describe` / `test.beforeEach` pattern. Use the `bookFixture` helper to pre-seed state. Avoid hard-coded timeouts; use `waitFor` assertions instead.
