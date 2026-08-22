import assert from 'node:assert/strict';
import { canSellerLogin } from './sellerLogin.js';

assert.equal(canSellerLogin('PENDING'), true);
assert.equal(canSellerLogin('APPROVED'), true);
assert.equal(canSellerLogin('REJECTED'), true);
assert.equal(canSellerLogin('SUSPENDED'), false);

console.log('seller login helper assertions passed');
