import assert from 'node:assert/strict';
import {
  buildPosOrderItems,
  calculatePosOrderTotal,
  validatePosStock,
} from './adminPos.js';

const products = [
  {
    id: 'seller-product-1',
    sourceProductId: 'product-1',
    price: '12.50',
    stock: 5,
  },
  {
    id: 'seller-product-2',
    sourceProductId: 'product-2',
    price: '3.25',
    stock: 2,
  },
];

const items = [
  { sellerProductId: 'seller-product-1', quantity: 2 },
  { sellerProductId: 'seller-product-2', quantity: 1 },
];

assert.equal(calculatePosOrderTotal(products, items), 28.25);
assert.deepEqual(buildPosOrderItems(products, items), [
  {
    productId: 'product-1',
    sellerProductId: 'seller-product-1',
    quantity: 2,
    price: 12.5,
  },
  {
    productId: 'product-2',
    sellerProductId: 'seller-product-2',
    quantity: 1,
    price: 3.25,
  },
]);
assert.deepEqual(validatePosStock(products, items), []);
assert.deepEqual(validatePosStock(products, [{ sellerProductId: 'seller-product-2', quantity: 3 }]), [
  'seller-product-2',
]);

console.log('admin POS helper assertions passed');
