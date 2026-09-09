/**
 * @license BSD-3-Clause
 * Copyright (c) 2026, ッツ Reader Authors
 * All rights reserved.
 */

export function applyAppTheme(appThemeMode: string) {
  const mode =
    appThemeMode === 'stone' ? 'light' : appThemeMode === 'gothic' ? 'dark' : appThemeMode;
  const root = document.documentElement;

  if (mode === 'dark' || mode === 'light') {
    root.setAttribute('data-astryx-theme', 'neutral');
    root.setAttribute('data-theme', mode);
    return;
  }

  root.setAttribute('data-astryx-theme', 'neutral');
  root.removeAttribute('data-theme');
}
