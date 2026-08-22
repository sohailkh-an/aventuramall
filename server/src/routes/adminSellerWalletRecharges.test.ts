import assert from 'node:assert/strict';
import {
  assertRechargeCanBeDeleted,
  assertRechargeCanBeResolved,
  normalizeRechargeApproval,
  normalizeRechargeRejection,
} from './adminSellerWalletRecharges.js';

assert.deepEqual(normalizeRechargeApproval({ approvedAmount: 125.5 }), {
  approvedAmount: 125.5,
  adminMessage: null,
});

assert.deepEqual(normalizeRechargeApproval({ approvedAmount: ' 200.25 ', adminMessage: '  paid in full  ' }), {
  approvedAmount: 200.25,
  adminMessage: 'paid in full',
});

assert.throws(
  () => normalizeRechargeApproval({ approvedAmount: 0 }),
  /approvedAmount/i
);

assert.deepEqual(normalizeRechargeRejection({ adminMessage: '  blurry receipt  ' }), {
  adminMessage: 'blurry receipt',
});

assert.equal(assertRechargeCanBeResolved({ status: 'PENDING' }), undefined);
assert.throws(
  () => assertRechargeCanBeResolved({ status: 'APPROVED' }),
  /already resolved/i
);
assert.throws(
  () => assertRechargeCanBeResolved({ status: 'REJECTED' }),
  /already resolved/i
);

assert.equal(assertRechargeCanBeDeleted({ status: 'PENDING' }), undefined);
assert.equal(assertRechargeCanBeDeleted({ status: 'REJECTED' }), undefined);
assert.equal(assertRechargeCanBeDeleted({ status: 'APPROVED' }), undefined);

console.log('admin seller wallet recharge helper assertions passed');
