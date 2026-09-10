/**
 * @license BSD-3-Clause
 * Copyright (c) 2026, ッツ Reader Authors
 * All rights reserved.
 */

import { error, redirect } from '@sveltejs/kit';
import type { PageLoad } from './$types';
import {
  DEFAULT_READER_SECTION,
  isReaderSection,
  settingsTabFromSlug,
  settingsTabToSlug,
  settingsUrl
} from '$lib/components/settings/settings-tabs';

// Dynamic tab/section params are served via the SPA fallback, not prerendered.
export const prerender = false;

export const load: PageLoad = ({ params }) => {
  const tab = settingsTabFromSlug(params.tab);

  if (!tab) {
    error(404, `Unknown settings tab: ${params.tab}`);
  }

  const rawSection = params.section;

  if (rawSection !== undefined && (tab !== 'Reader' || !isReaderSection(rawSection))) {
    error(404, `Unknown settings section: ${rawSection}`);
  }

  const section = rawSection?.toLowerCase() ?? (tab === 'Reader' ? DEFAULT_READER_SECTION : null);

  if (
    params.tab !== settingsTabToSlug(tab) ||
    (rawSection !== undefined && rawSection !== section)
  ) {
    redirect(308, settingsUrl(tab, section));
  }

  return { tab, section, sectionParam: rawSection ?? null };
};
