# Agent Instructions & Codebase Guidelines

Guidelines and architectural constraints for working in **custom-ereader** (based on ッツ Reader).

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
- **IndexedDB (`books-db`)**: Schemas are append-only. Never modify historical versions (`books-db-v*.ts`); add migrations via `database.service.ts`.
- **Reader Matrix**: Reader changes must support both layout modes (paginated, continuous) and orientations (horizontal, vertical-rl). Always check `$verticalMode$` for coordinates, margins, and gesture math.
- **Cloud Sync**: Local items (e.g., `isAutosave: true`) must never dirty `lastModified` sync timestamps or sync to Drive/OneDrive.

---

## 4. Verification & Testing
Run these quality gates before finishing any task:
- **Typecheck & Build**: `pnpm -F web check` and `pnpm -F web build`.
- **Formatting/Linting**: `pnpm -F web lint` (or ensure Prettier/ESLint pass).
- **E2E Tests**: `pnpm -F web exec playwright test` (runs against port 5174).
  - All tests must pass.
  - When writing new reader tests, always use `apps/web/tests/fixtures/book-fixture.ts` to seed IndexedDB. Avoid hardcoded timeouts; use Playwright `waitFor` assertions.
