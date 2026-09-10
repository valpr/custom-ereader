/**
 * @license BSD-3-Clause
 * Copyright (c) 2026, ッツ Reader Authors
 * All rights reserved.
 */

/**
 * Shared formatting helpers for book-card metadata. Used by the card list
 * (info popover, details dialog trigger) and the book details dialog so both
 * surfaces stay consistent.
 */
export function getCardDateInfo(dateTime: number): string {
  return dateTime ? new Date(dateTime).toLocaleString() : 'No Data';
}

export function getSourceLabel(source: string): string {
  if (source === 'browser') return 'Browser';
  if (source === 'gdrive') return 'GDrive';
  if (source === 'onedrive') return 'OneDrive';
  if (source === 'fs') return 'FS';
  return source;
}
