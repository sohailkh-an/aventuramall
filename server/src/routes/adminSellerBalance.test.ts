import assert from 'node:assert/strict';
import { calculateSellerWalletBalance } from './adminSellerBalance.js';

assert.deepEqual(
  calculateSellerWalletBalance({ currentBalance: 125, amount: 25, mode: 'add' }),
  { ok: true, nextBalance: 150 }
);

assert.deepEqual(
  calculateSellerWalletBalance({ currentBalance: 125, amount: 25, mode: 'deduct' }),
  { ok: true, nextBalance: 100 }
);

assert.deepEqual(
  calculateSellerWalletBalance({ currentBalance: 25, amount: 50, mode: 'deduct' }),
  { ok: false, error: 'Cannot deduct more than the current wallet balance.' }
);

console.log('admin seller balance helper assertions passed');
