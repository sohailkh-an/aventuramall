import assert from 'node:assert/strict';
import {
  adminDeliveryStatusSchema,
  adminPaymentStatusSchema,
  formatAdminOrderCode,
  getAdminOrderSellerSummary,
  mapAdminSalesOrder,
  normalizeAdminOrderUpdate,
} from './adminSales.js';

const createdAt = new Date('2026-05-29T13:05:00.000Z');

assert.equal(formatAdminOrderCode({ id: 'clwxyz987654321', createdAt }), '20260529-7654321');
assert.equal(
  getAdminOrderSellerSummary([
    {
      product: { soldBy: 'Global Shop' },
      sellerProduct: {
        seller: {
          email: 'seller@example.com',
          shopName: 'Seller Shop',
        },
      },
    },
    {
      product: { soldBy: 'Global Shop' },
      sellerProduct: null,
    },
  ]),
  'Seller Shop, Global Shop'
);

assert.equal(
  getAdminOrderSellerSummary([
    {
      product: { soldBy: 'Global Shop' },
      sellerProduct: null,
    },
  ]),
  'Global Shop'
);

assert.equal(adminPaymentStatusSchema.parse('PAID'), 'PAID');
assert.equal(adminPaymentStatusSchema.parse('UNPAID'), 'UNPAID');
assert.throws(() => adminPaymentStatusSchema.parse('PENDING'));

assert.equal(adminDeliveryStatusSchema.parse('CONFIRMED'), 'CONFIRMED');
assert.equal(adminDeliveryStatusSchema.parse('PICKED_UP'), 'PICKED_UP');
assert.equal(adminDeliveryStatusSchema.parse('ON_THE_WAY'), 'ON_THE_WAY');
assert.throws(() => adminDeliveryStatusSchema.parse('SHIPPED'));

assert.deepEqual(
  normalizeAdminOrderUpdate({
    paymentStatus: 'PAID',
    deliveryStatus: 'ON_THE_WAY',
    trackingCode: '  1Z999  ',
    logisticsCompany: '  UPS  ',
    logisticsNotes: '  Leave at front desk  ',
  }),
  {
    paymentStatus: 'PAID',
    status: 'ON_THE_WAY',
    trackingCode: '1Z999',
    logisticsCompany: 'UPS',
    logisticsNotes: 'Leave at front desk',
  }
);

assert.deepEqual(
  normalizeAdminOrderUpdate({
    paymentStatus: 'UNPAID',
    deliveryStatus: 'PENDING',
    trackingCode: '',
    logisticsCompany: '   ',
    logisticsNotes: '',
  }),
  {
    paymentStatus: 'UNPAID',
    status: 'PENDING',
    trackingCode: null,
    logisticsCompany: null,
    logisticsNotes: null,
  }
);

const mapped = mapAdminSalesOrder({
  id: 'order-123456789',
  status: 'CONFIRMED',
  paymentStatus: 'UNPAID',
  trackingCode: 'TRACK-1',
  logisticsCompany: 'FedEx',
  logisticsNotes: 'Signature required',
  total: '182.83',
  createdAt,
  paymentMethod: 'Cash',
  deliveryType: 'Home delivery',
  user: {
    id: 'user-1',
    name: 'Dr. Kareem Krajcik Jr.',
    email: 'ilegros@gmail.com',
    phone: '14154224200',
  },
  shippingAddress: {
    street: '1295 28th Ave',
    city: 'San Francisco',
    state: 'California',
    zip: '94122',
    country: 'United States',
    phone: null,
  },
  items: [
    {
      id: 'item-1',
      productId: 'product-1',
      sellerProductId: null,
      quantity: 1,
      price: '182.83',
      product: {
        name: 'Straight Talk Samsung Galaxy A23',
        images: ['phone.jpg'],
        soldBy: 'Global Shop',
      },
      sellerProduct: null,
    },
  ],
});

assert.equal(mapped.code, '20260529-3456789');
assert.equal(mapped.paymentStatus, 'UNPAID');
assert.equal(mapped.deliveryStatus, 'CONFIRMED');
assert.equal(mapped.trackingCode, 'TRACK-1');
assert.equal(mapped.items[0].image, 'phone.jpg');
assert.equal(mapped.items[0].lineTotal, 182.83);

console.log('admin sales helper assertions passed');
