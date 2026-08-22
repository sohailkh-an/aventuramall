import assert from 'node:assert/strict';
import {
  calculateSellerOrderProfit,
  calculateSellerOrderAmount,
  formatSellerOrderCode,
  maskCustomerAddress,
  maskCustomerEmail,
  maskCustomerPhone,
  normalizeSellerOrderDeliveryUpdate,
  summarizeSellerOrders,
} from './sellerOrders.js';

const orders = [
  {
    id: 'order-abcdef1234567',
    status: 'PROCESSING',
    createdAt: new Date('2026-05-29T12:00:00.000Z'),
    items: [
      { quantity: 2, price: '10.50' },
      { quantity: 1, price: '5.00' },
    ],
  },
  {
    id: 'order-cancelled9876543',
    status: 'CANCELLED',
    createdAt: new Date('2026-05-29T13:00:00.000Z'),
    items: [{ quantity: 1, price: '7.25' }],
  },
];

assert.equal(formatSellerOrderCode(orders[0]), '20260529-1234567');
assert.equal(calculateSellerOrderAmount(orders[0].items), 26);
assert.equal(calculateSellerOrderProfit(100, 15), 15);
assert.equal(calculateSellerOrderProfit(26, 15), 3.9);
assert.equal(maskCustomerEmail('randomcustomer@example.com'), 'ran************com');
assert.equal(maskCustomerPhone('+19123456815'), '+19********815');
assert.deepEqual(
  maskCustomerAddress({
    street: '123 Private Street',
    city: 'Austin',
    state: 'TX',
    zip: '78701',
    country: 'United States',
    phone: '+19123456815',
  }),
  {
    city: 'aus************tes',
    state: '',
    country: '',
  }
);
assert.deepEqual(
  normalizeSellerOrderDeliveryUpdate({
    deliveryStatus: 'ON_THE_WAY',
  }),
  {
    status: 'ON_THE_WAY',
  }
);
assert.deepEqual(
  normalizeSellerOrderDeliveryUpdate({
    deliveryStatus: 'DELIVERED',
  }),
  {
    status: 'DELIVERED',
  }
);
assert.deepEqual(summarizeSellerOrders(orders), {
  totalOrders: 2,
  newOrders: 1,
  cancelledOrders: 1,
  onDeliveryOrders: 0,
  deliveredOrders: 0,
  totalTurnover: 33.25,
});

console.log('seller orders helper assertions passed');
