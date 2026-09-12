/**
 * @license BSD-3-Clause
 * Copyright (c) 2026, ッツ Reader Authors
 * All rights reserved.
 */

import type BooksDbV7 from '$lib/data/database/books-db/versions/v7/books-db-v7';

export interface BooksDbV8BookData {
  tags?: string[];
}

export default interface BooksDbV8 extends BooksDbV7 {
  data: {
    key: number;
    value: BooksDbV7['data']['value'] & BooksDbV8BookData;
    indexes: {
      title: string;
    };
  };
}
