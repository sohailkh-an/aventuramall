import assert from 'node:assert/strict';
import {
  buildPublicStoreSummary,
  buildPublicStoreSearchResults,
  calculateStoreRatingStats,
  filterProductsByStoreSlug,
  slugifyStoreName,
} from './publicStores.js';

const products = [
  {
    id: 'product-1',
    soldBy: 'All Royal Collection',
    isActive: true,
    category: { name: 'Fashion' },
    reviews: [
      { rating: 5 },
      { rating: 4 },
    ],
  },
  {
    id: 'product-2',
    soldBy: 'all royal collection',
    isActive: true,
    category: { name: 'Accessories' },
    reviews: [{ rating: 3 }],
  },
  {
    id: 'product-3',
    soldBy: 'Other Seller',
    isActive: true,
    category: { name: 'Fashion' },
  },
  {
    id: 'product-4',
    soldBy: 'All Royal Collection',
    isActive: false,
    category: { name: 'Hidden' },
  },
  {
    id: 'product-5',
    soldBy: null,
    isActive: true,
    category: { name: 'Fashion' },
  },
];

assert.equal(slugifyStoreName('All Royal Collection'), 'all-royal-collection');
assert.equal(slugifyStoreName('  A&B   Fashion!!  '), 'a-b-fashion');

assert.deepEqual(
  filterProductsByStoreSlug(products, 'all-royal-collection').map((product) => product.id),
  ['product-1', 'product-2']
);

assert.deepEqual(buildPublicStoreSummary('all-royal-collection', products), {
  name: 'All Royal Collection',
  slug: 'all-royal-collection',
  productCount: 2,
  categories: ['Accessories', 'Fashion'],
  ratingStats: {
    averageRating: 4,
    reviewCount: 3,
    distribution: {
      5: 1,
      4: 1,
      3: 1,
      2: 0,
      1: 0,
    },
  },
});

assert.deepEqual(calculateStoreRatingStats([{ reviews: [] }, { reviews: [{ rating: 5 }] }]), {
  averageRating: 5,
  reviewCount: 1,
  distribution: {
    5: 1,
    4: 0,
    3: 0,
    2: 0,
    1: 0,
  },
});

assert.equal(buildPublicStoreSummary('missing-store', products), null);

assert.deepEqual(
  buildPublicStoreSearchResults(products, 'royal').map((store) => ({
    name: store.name,
    slug: store.slug,
    productCount: store.productCount,
  })),
  [
    {
      name: 'All Royal Collection',
      slug: 'all-royal-collection',
      productCount: 2,
    },
  ]
);

assert.deepEqual(
  buildPublicStoreSearchResults(products, '').map((store) => store.name),
  ['All Royal Collection', 'Other Seller']
);

console.log('public store helper assertions passed');
