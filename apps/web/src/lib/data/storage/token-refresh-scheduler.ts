/**
 * @license BSD-3-Clause
 * Copyright (c) 2026, ッツ Reader Authors
 * All rights reserved.
 */

import {
  scheduleProactiveRefresh,
  clearProactiveRefresh,
  storageOAuthTokens
} from '$lib/data/storage/storage-oauth-manager';

let started = false;

/**
 * Start proactive token refresh for all currently cached cloud sessions.
 * Steady-state scheduling is hook-driven (every token-store site reschedules),
 * so this is only a resync point for app start / layout remount (timers are
 * in-memory and don't survive reloads or HMR).
 */
export function startProactiveRefresh() {
  started = true;
  for (const sourceName of storageOAuthTokens.keys()) {
    scheduleProactiveRefresh(sourceName);
  }
}

export function stopProactiveRefresh() {
  if (!started) return;
  started = false;
  for (const sourceName of storageOAuthTokens.keys()) {
    clearProactiveRefresh(sourceName);
  }
}
