import assert from 'node:assert/strict';
import {
  getRemainingSellerProductSlots,
  canSellerAddStorehouseProducts,
  selectSellerProductsToAdd,
} from './sellerProductBulkAdd.js';

assert.equal(getRemainingSellerProductSlots(125, 300), 175);
assert.equal(getRemainingSellerProductSlots(325, 300), 0);
assert.equal(canSellerAddStorehouseProducts('APPROVED'), true);
assert.equal(canSellerAddStorehouseProducts('PENDING'), false);
assert.equal(canSellerAddStorehouseProducts('REJECTED'), false);

const selected = selectSellerProductsToAdd({
  products: [
    { id: 'already-added' },
    { id: 'catalog-1' },
    { id: 'catalog-2' },
    { id: 'catalog-3' },
  ],
  existingProductIds: new Set(['already-added']),
  remainingSlots: 2,
});

assert.deepEqual(
  selected.map((product) => product.id),
  ['catalog-1', 'catalog-2']
);

assert.deepEqual(
  selectSellerProductsToAdd({
    products: [{ id: 'catalog-1' }],
    existingProductIds: new Set<string>(),
    remainingSlots: 0,
  }),
  []
);

console.log('seller product bulk-add helper assertions passed');
