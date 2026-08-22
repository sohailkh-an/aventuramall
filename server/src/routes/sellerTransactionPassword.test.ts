import assert from 'node:assert/strict';
import {
  validateSellerTransactionPasswordChange,
  validateSellerTransactionPasswordReset,
} from './sellerTransactionPassword.js';

const comparePassword = async (plain: string, hashed: string) => plain === `plain:${hashed}`;

assert.deepEqual(
  await validateSellerTransactionPasswordChange({
    storedTransactionPassword: 'current-secret',
    currentPassword: 'plain:current-secret',
    newPassword: 'new-secret',
    confirmPassword: 'new-secret',
    comparePassword,
  }),
  { ok: true }
);

assert.deepEqual(
  await validateSellerTransactionPasswordChange({
    storedTransactionPassword: 'current-secret',
    currentPassword: 'wrong-secret',
    newPassword: 'new-secret',
    confirmPassword: 'new-secret',
    comparePassword,
  }),
  { ok: false, statusCode: 400, error: 'Invalid current transaction password.' }
);

assert.deepEqual(
  await validateSellerTransactionPasswordChange({
    storedTransactionPassword: 'current-secret',
    currentPassword: 'plain:current-secret',
    newPassword: 'new-secret',
    confirmPassword: 'different-secret',
    comparePassword,
  }),
  { ok: false, statusCode: 400, error: 'New transaction passwords do not match.' }
);

assert.deepEqual(
  await validateSellerTransactionPasswordChange({
    storedTransactionPassword: null,
    currentPassword: 'plain:current-secret',
    newPassword: 'new-secret',
    confirmPassword: 'new-secret',
    comparePassword,
  }),
  { ok: false, statusCode: 400, error: 'Current transaction password is not set.' }
);

assert.deepEqual(
  await validateSellerTransactionPasswordReset({
    newPassword: 'new-secret',
    confirmPassword: 'new-secret',
  }),
  { ok: true }
);

assert.deepEqual(
  await validateSellerTransactionPasswordReset({
    newPassword: 'new-secret',
    confirmPassword: 'different-secret',
  }),
  { ok: false, statusCode: 400, error: 'New transaction passwords do not match.' }
);

console.log('seller transaction password helper assertions passed');
