/**
 * @license BSD-3-Clause
 * Copyright (c) 2026, ッツ Reader Authors
 * All rights reserved.
 */

/**
 * Shared helpers for per-book text tags (e.g. 'fantasy', 'science-fiction').
 *
 * Local truth lives on the book record (`BooksDbBookData.tags`). For sync,
 * the whole library's tags travel as a single root-file dictionary
 * (`title key -> tags`), mirroring the reading-goals / profiles pattern, so
 * cloud-only books can display tags without downloading every book.
 */

export const MAX_TAGS_PER_BOOK = 10;

export const MAX_TAG_LENGTH = 20;

/** Normalized-title key used by the tags dictionary. Keep in sync with `normalizeTitle`. */
export function normalizeTagTitle(title: string): string {
  return (title || '').trim().toLowerCase();
}

export type BookTagsDict = Record<string, string[]>;

export interface BookTagsSyncPayload {
  version: 1;
  lastModified: number;
  tagsByTitle: BookTagsDict;
  /** Normalized-title key -> display title (first seen casing). */
  titles?: Record<string, string>;
}

/** Trim, lowercase, collapse inner whitespace to '-', drop empties, cap length. */
export function normalizeTag(input: string): string {
  const cleaned = (input || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, MAX_TAG_LENGTH);

  return cleaned;
}

/** Normalize a tag list: normalize each entry, drop empties, dedupe, sort, cap count. */
export function normalizeTagList(tags: string[] | undefined | null): string[] {
  if (!Array.isArray(tags)) return [];

  const seen = new Set<string>();

  for (const tag of tags) {
    const normalized = normalizeTag(tag);
    if (normalized) seen.add(normalized);
    if (seen.size >= MAX_TAGS_PER_BOOK) break;
  }

  return [...seen].sort((a, b) => a.localeCompare(b));
}

/** Per-title union of two dictionaries. Used for MERGE sync and card overlays. */
export function mergeTagsDicts(
  local: BookTagsDict | undefined,
  remote: BookTagsDict | undefined
): BookTagsDict {
  const merged: BookTagsDict = {};
  const keys = new Set([...Object.keys(local || {}), ...Object.keys(remote || {})]);

  for (const key of keys) {
    merged[key] = normalizeTagList([...(local?.[key] || []), ...(remote?.[key] || [])]);
    if (!merged[key].length) delete merged[key];
  }

  return merged;
}

/** Unique sorted union of every tag in a dictionary. Feeds the editor suggestions. */
export function getAllTagsFromDict(dict: BookTagsDict | undefined): string[] {
  const seen = new Set<string>();

  for (const tags of Object.values(dict || {})) {
    for (const tag of tags || []) {
      const normalized = normalizeTag(tag);
      if (normalized) seen.add(normalized);
    }
  }

  return [...seen].sort((a, b) => a.localeCompare(b));
}

/** Merge display-title maps, preferring existing entries. */
export function mergeTagsTitles(
  local: Record<string, string> | undefined,
  remote: Record<string, string> | undefined
): Record<string, string> {
  return { ...(remote || {}), ...(local || {}) };
}
