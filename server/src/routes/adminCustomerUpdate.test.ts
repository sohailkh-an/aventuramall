import assert from 'node:assert/strict';
import { normalizeAdminCustomerUpdate } from './adminCustomerUpdate.js';

assert.deepEqual(
  normalizeAdminCustomerUpdate({
    email: '  ADA@Example.COM  ',
    name: '  Ada Lovelace  ',
    image: '',
    phone: '  +1 555 0100  ',
    package: '  Gold  ',
    cashPayment: true,
    bankPayment: false,
    bankName: '  Ada Bank  ',
    bankAccountName: '',
    bankAccountNumber: '  1234  ',
    bankRoutingNumber: '',
    usdtPayment: true,
    usdtLink: '  https://example.com/ada  ',
    usdtAddress: '  TX123  ',
    emailVerified: true,
    isBanned: false,
  }),
  {
    email: 'ada@example.com',
    name: 'Ada Lovelace',
    image: null,
    phone: '+1 555 0100',
    package: 'Gold',
    cashPayment: true,
    bankPayment: false,
    bankName: 'Ada Bank',
    bankAccountName: null,
    bankAccountNumber: '1234',
    bankRoutingNumber: null,
    usdtPayment: true,
    usdtLink: 'https://example.com/ada',
    usdtAddress: 'TX123',
    emailVerified: true,
    isBanned: false,
  }
);

console.log('admin customer update helper assertions passed');
