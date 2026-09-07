# Reader

> A customized, browser-based e-book reader optimized for Japanese language reading, EPUBs, and popup dictionary extensions (Yomitan, etc.).

[![Deploy to GitHub Pages](https://github.com/valpr/reader/actions/workflows/pages.yml/badge.svg)](https://github.com/valpr/reader/actions/workflows/pages.yml)
[![License: BSD-3-Clause](https://img.shields.io/badge/License-BSD--3--Clause-blue.svg)](LICENSE)

**Live Reader:** [https://valpr.github.io/reader/](https://valpr.github.io/reader/)

This repository is a personalized fork of the excellent [ttu-ttu/ebook-reader](https://github.com/ttu-ttu/ebook-reader).

---

## Why Does This Exist?

1. **Keep Improving ttu-reader**: While the original [ttu-reader](https://github.com/ttu-ttu/ebook-reader) is an outstanding reading platform, upstream updates have slowed down.
2. **Open to the Community**: Kept completely open so anyone can benefit from these enhancements, borrow features, or fork and adapt it for their own workflows.
3. **Better Daily Reading Experience**: Building my personal wish list and fixing other problems/glitches that I've had during my reading experience.

---

## Changelog: Changes from Base ttu-reader

- **Multi-Bookmark Support**: Create and manage unlimited bookmarks per book without overwriting your current reading position.
- **Smart Auto-Naming & Notes**: Automatically suggests bookmark titles with the chapter name and progress percentage (e.g., `Chapter 3 (42%)`), with full support for custom labels and personal notes per bookmark.
- **Color Tags & Margin Indicators**: Categorize bookmarks with 6 distinct color tags and view interactive ribbon markers directly in the margin across both horizontal and vertical layouts.
- **Slide-Out Bookmark Drawer**: Dedicated panel matching the Table of Contents drawer to view, edit, sort, and jump between bookmarks, with keyboard navigation support (`Shift+B` to create, `Shift+R` to open, `Shift+N`/`Shift+P` to cycle).
- **Glitch Recovery & Rolling Auto saves**: Automatically logs position checkpoints and guards against abnormal scroll jumps, allowing you to instantly restore your place after accidental gestures or trackpad flings with one-click bookmark promotion.
- **Opinionated Sync**: Simplified syncing pattern that allows settings/books to be automatically synced across platforms.
- **Responsive Reader Header**: Icon toolbar progressively collapses lower-priority controls into an overflow menu (`⋯`) on narrow screens, keeping essential controls reachable on mobile.
- **Refreshed UI & Settings**: Modernized layout featuring tabbed configuration panels, live typography sample previews, and new theme styling.

---

## Live Deployment

The reader is automatically built and deployed to GitHub Pages on every push to `main`:

**URL:** [https://valpr.github.io/reader/](https://valpr.github.io/reader/)

---

## Local Development

### Prerequisites

- **Node.js**: v20 or higher (v24 recommended)
- **pnpm**: v9 or higher

### Getting Started

1. **Clone the repository:**

   ```bash
   git clone [https://github.com/valpr/reader.git](https://github.com/valpr/reader.git)
   cd reader
   ```

2. **Install dependencies:**

   ```bash
   pnpm install
   ```

3. **Start the local development server:**

   ```bash
   pnpm dev
   ```

   Open [http://localhost:5173](http://localhost:5173) in your browser.

4. **Build for production:**

   ```bash
   pnpm build
   ```

   The static production output will be generated in `apps/web/build/`.

---

## Upstream Synchronization

To pull latest improvements and fixes from upstream:

```bash
git fetch upstream
git merge upstream/main
git push origin main
```

---

## Acknowledgements & License

- Original project and architecture by [ttu-ttu](https://github.com/ttu-ttu/ebook-reader).
- Distributed under the [BSD-3-Clause License](LICENSE).
