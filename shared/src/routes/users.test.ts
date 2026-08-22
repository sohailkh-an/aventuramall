import assert from 'node:assert/strict';
import { normalizeUserProfileUpdate } from './users.js';

assert.deepEqual(
  normalizeUserProfileUpdate({
    email: '  New.Customer@Example.COM  ',
    name: '  New Customer  ',
    phone: '  +1 555 0100  ',
    image: '',
    cashPayment: true,
    bankPayment: true,
    bankName: '  Metro Bank  ',
    bankAccountName: '  New Customer  ',
    bankAccountNumber: '  123456  ',
    bankRoutingNumber: '   ',
    usdtPayment: false,
    usdtLink: '',
    usdtAddress: '  TX123  ',
  }),
  {
    email: 'new.customer@example.com',
    name: 'New Customer',
    phone: '+1 555 0100',
    image: null,
    cashPayment: true,
    bankPayment: true,
    bankName: 'Metro Bank',
    bankAccountName: 'New Customer',
    bankAccountNumber: '123456',
    bankRoutingNumber: null,
    usdtPayment: false,
    usdtLink: null,
    usdtAddress: 'TX123',
  }
);

console.log('user route helper assertions passed');
