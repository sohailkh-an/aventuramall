import assert from 'node:assert/strict';
import { getImpersonationSellerPayload } from './adminSellerImpersonation.js';

const seller = {
  id: 'seller-1',
  email: 'seller@example.com',
  name: 'Seller Name',
  shopName: 'Seller Shop',
  status: 'APPROVED',
  sellerPackageId: 'package-1',
};

assert.deepEqual(getImpersonationSellerPayload(seller), {
  tokenPayload: {
    userId: 'seller-1',
    email: 'seller@example.com',
    role: 'SELLER',
  },
  seller: {
    id: 'seller-1',
    email: 'seller@example.com',
    name: 'Seller Name',
    shopName: 'Seller Shop',
    status: 'APPROVED',
    sellerPackageId: 'package-1',
  },
});

console.log('admin seller impersonation assertions passed');
