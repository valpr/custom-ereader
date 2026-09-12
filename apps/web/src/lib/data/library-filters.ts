/**
 * @license BSD-3-Clause
 * Copyright (c) 2026, ッツ Reader Authors
 * All rights reserved.
 */

import type { BookCardProps } from '$lib/components/book-card/book-card-props';
import { normalizeTag } from '$lib/data/book-tags';

/**
 * Reading-progress filter. Thresholds operate on the card's normalized
 * `progress` fraction (0-1):
 * - `unread`: never opened (`p <= 0`)
 * - `in-progress`: started but unfinished (`0 < p < 1`)
 * - `completed`: finished (`p >= 1`)
 */
export type ProgressFilter = 'all' | 'unread' | 'in-progress' | 'completed';

export const PROGRESS_FILTER_OPTIONS: { value: ProgressFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'unread', label: 'Unread' },
  { value: 'in-progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' }
];

export interface LibraryFilters {
  /** Free-text title query (substring, case-insensitive). */
  query: string;
  /** Selected tags — a card must carry ALL of them (AND semantics). */
  tags: string[];
  progress: ProgressFilter;
}

export const DEFAULT_LIBRARY_FILTERS: LibraryFilters = {
  query: '',
  tags: [],
  progress: 'all'
};

/**
 * Normalize a raw card progress value to a 0-1 fraction.
 * Modern bookmarks store 0-1; legacy string bookmarks ('42%') were coerced
 * to 0-100 by `bookmarkToProgress`, so values > 1 are scaled down.
 */
export function normalizeProgress(progress: number | undefined | null): number {
  const p = Number(progress) || 0;
  if (!Number.isFinite(p) || p <= 0) return 0;
  return p > 1 ? Math.min(p / 100, 1) : Math.min(p, 1);
}

export function matchesProgressFilter(
  progress: number | undefined | null,
  filter: ProgressFilter
): boolean {
  if (filter === 'all') return true;
  const p = normalizeProgress(progress);
  if (filter === 'unread') return p <= 0;
  if (filter === 'in-progress') return p > 0 && p < 1;
  return p >= 1;
}

export function matchesTitleQuery(title: string, query: string): boolean {
  const q = (query || '').trim().toLowerCase();
  if (!q) return true;
  return (title || '').toLowerCase().includes(q);
}

/** AND semantics: every selected tag must be present on the card. */
export function matchesTagsFilter(cardTags: string[] | undefined, selectedTags: string[]): boolean {
  if (!selectedTags.length) return true;
  const cardSet = new Set((cardTags || []).map((t) => normalizeTag(t)).filter(Boolean));
  return selectedTags.every((t) => cardSet.has(normalizeTag(t)));
}

export function filterBookCards(
  cards: BookCardProps[],
  filters: LibraryFilters | undefined | null
): BookCardProps[] {
  if (!filters) return cards;
  const query = (filters.query || '').trim();
  const tags = filters.tags || [];
  const progress = filters.progress || 'all';
  if (!query && tags.length === 0 && progress === 'all') return cards;

  return cards.filter(
    (card) =>
      matchesTitleQuery(card.title, query) &&
      matchesTagsFilter(card.tags, tags) &&
      matchesProgressFilter(card.progress, progress)
  );
}

export function getActiveFilterCount(filters: LibraryFilters | undefined | null): number {
  if (!filters) return 0;
  let count = 0;
  if ((filters.query || '').trim()) count += 1;
  if ((filters.tags || []).length) count += filters.tags.length;
  if (filters.progress && filters.progress !== 'all') count += 1;
  return count;
}

export function isLibraryFilterActive(filters: LibraryFilters | undefined | null): boolean {
  return getActiveFilterCount(filters) > 0;
}
