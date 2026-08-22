import assert from 'node:assert/strict';
import test from 'node:test';

import { getNextPosProductsPageParam } from './productsPagination';

test('getNextPosProductsPageParam advances while more pages remain', () => {
  const nextPage = getNextPosProductsPageParam({
    page: 1,
    totalPages: 3,
  });

  assert.equal(nextPage, 2);
});

test('getNextPosProductsPageParam stops at the last page', () => {
  const nextPage = getNextPosProductsPageParam({
    page: 3,
    totalPages: 3,
  });

  assert.equal(nextPage, undefined);
});
