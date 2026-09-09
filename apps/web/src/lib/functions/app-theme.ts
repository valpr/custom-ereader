/**
 * @license BSD-3-Clause
 * Copyright (c) 2026, ッツ Reader Authors
 * All rights reserved.
 */

export function applyAppTheme(appThemeMode: string) {
  const mode =
    appThemeMode === 'stone' ? 'light' : appThemeMode === 'gothic' ? 'dark' : appThemeMode;
  const root = document.documentElement;

  root.setAttribute('data-astryx-theme', 'neutral');

  if (mode === 'dark' || mode === 'light') {
    root.setAttribute('data-theme', mode);
    root.classList.toggle('dark', mode === 'dark');
    return;
  }

  root.removeAttribute('data-theme');
  root.classList.toggle(
    'dark',
    window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false
  );
}
