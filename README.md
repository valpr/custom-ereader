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

### Reading & Bookmarks

- **Multi-Bookmark Support**: Create and manage unlimited bookmarks per book without overwriting your current reading position.
- **Smart Auto-Naming & Notes**: Bookmark titles suggest the chapter name and progress percentage (e.g., `Chapter 3 (42%)`), with support for custom labels and personal notes.
- **Color Tags & Margin Indicators**: Organize bookmarks with color tags and jump back from markers in the margin.
- **Slide-Out Bookmark Drawer**: View, edit, sort, and jump between bookmarks from a dedicated panel (`Shift+B` to create, `Shift+R` to open).
- **Automatic Place Saving**: Your place is saved as you read, so you can pick up where you left off even after an accidental scroll or reload.

### Library Management

- **All Books in One Place**: See books from this device and the cloud together. Local books show up right away.
- **Per-Book Menu**: Check details, upload, download, or delete right from each book.
- **Safer Deleting**: Clear confirmations explain what will be removed, and your reading stats are kept.
- **Filter by Source**: Quickly narrow the library to one storage location.

### Cloud Sync

- **Sync Across Devices**: Your settings, place, bookmarks, and reading stats follow you between devices.
- **Quiet Background Sync**: Syncing happens in the background, including when you close a book.
- **Simple Reconnects**: An expired login shows a small banner instead of a pop-up, so you can reconnect without losing your spot.
- **Clear Status Messages**: Short messages confirm what just synced and where.

### Settings & Profiles

- **Tabbed Settings with Live Preview**: Settings are organized in tabs with a preview of how your text will look.
- **Shareable Settings Links**: Each settings page has its own link so you can jump straight to what you need.
- **Self-Saving Profiles**: Reading profiles save automatically as you change them.
- **Factory Reset**: Start fresh with one option that clears local data and restores defaults. Cloud files stay safe and come back when you reconnect.

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
## Acknowledgements & License

- Original project and architecture by [ttu-ttu](https://github.com/ttu-ttu/ebook-reader).
- Distributed under the [BSD-3-Clause License](LICENSE).
