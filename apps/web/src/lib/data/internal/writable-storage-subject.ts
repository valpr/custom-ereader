/**
 * @license BSD-3-Clause
 * Copyright (c) 2026, ッツ Reader Authors
 * All rights reserved.
 */

import { skip } from 'rxjs';
import type { localStorage } from '../window/local-storage';
import { writableSubject } from '$lib/functions/svelte/store';

type Storage = typeof localStorage;

export function writableStorageSubject<T>(
  storage: Storage,
  mapFromString: (s: string) => T,
  mapToString: (t: T) => string
) {
  return (key: string, defaultValue: T) => {
    const initValue = getStoredOrDefault(storage)(key, defaultValue, mapFromString);
    const subject = writableSubject(initValue);
    subject.pipe(skip(1)).subscribe((updatedValue) => {
      storage.setItem(key, mapToString(updatedValue ?? defaultValue));
    });
    return subject;
  };
}

function getStoredOrDefault(storage: Storage) {
  return <T>(key: string, defaultVal: T, mapFn: (s: string) => T) => {
    const stored = storage.getItem(key);
    if (!stored) return defaultVal;
    // A corrupt value (hand-edited or written by an older schema) must not
    // throw during store init and break boot. Drop it and fall back.
    try {
      return mapFn(stored);
    } catch {
      storage.removeItem(key);
      return defaultVal;
    }
  };
}
