/**
 * @license BSD-3-Clause
 * Copyright (c) 2026, ッツ Reader Authors
 * All rights reserved.
 */

import { redirect } from '@sveltejs/kit';
import type { PageLoad } from './$types';
import { settingsUrl } from '$lib/components/settings/settings-tabs';

export const load: PageLoad = () => {
  redirect(308, settingsUrl('Reader'));
};
