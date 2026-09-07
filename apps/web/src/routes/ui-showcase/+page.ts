/**
 * @license BSD-3-Clause
 * Copyright (c) 2026, ッツ Reader Authors
 * All rights reserved.
 */

import { dev } from '$app/environment';
import { error } from '@sveltejs/kit';

export const ssr = false;
export const prerender = false;

export const load = () => {
  if (!dev) {
    error(404, 'Not Found');
  }
};
