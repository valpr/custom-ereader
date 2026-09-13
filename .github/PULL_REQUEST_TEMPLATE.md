## What changed

<!-- Brief description of the fix/feature. Link any related issues. -->

## Verification (required)

- [ ] `pnpm -F web check` passes
- [ ] `pnpm -F web build` passes
- [ ] `pnpm -F web lint` passes (Prettier/ESLint)
- [ ] `pnpm -F web test:smoke` passes (blocking CI `smoke` job)
  - Command/result:
- [ ] Full E2E run, if needed (`pnpm -F web exec playwright test` / nightly `e2e.yml`)
  - Command/result (or N/A + reason):

## UI changes (if any)

- [ ] Toggle/filter change asserts the control's own state (`aria-checked`/`aria-selected`, active-filter count, checked classes), not just downstream results
- [ ] Multi-select popovers assert they stay open after each toggle
- [ ] Mobile gate (Pixel 9, `mobile` project) considered: dialog/new page/responsive change has a case under `apps/web/tests/mobile/` reusing `helpers/mobile-assertions.ts`, or N/A + reason
