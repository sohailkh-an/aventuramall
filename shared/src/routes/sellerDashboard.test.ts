import assert from 'node:assert/strict';
import { summarizeSellerDashboard } from './sellerDashboard.js';

const summary = summarizeSellerDashboard({
  now: new Date('2026-05-30T12:00:00.000Z'),
  packageLimit: 10,
  profitPercent: 15,
  products: [
    { stock: 4, price: '12.50', isActive: true },
    { stock: 2, price: '20.00', isActive: false },
    { stock: 0, price: '99.00', isActive: true },
  ],
  orders: [
    {
      id: 'order-today',
      status: 'DELIVERED',
      createdAt: new Date('2026-05-30T08:00:00.000Z'),
      items: [{ quantity: 2, price: '12.50' }],
    },
    {
      id: 'order-yesterday',
      status: 'SHIPPED',
      createdAt: new Date('2026-05-29T08:00:00.000Z'),
      items: [{ quantity: 1, price: '20.00' }],
    },
    {
      id: 'order-month',
      status: 'PROCESSING',
      createdAt: new Date('2026-05-10T08:00:00.000Z'),
      items: [{ quantity: 3, price: '10.00' }],
    },
    {
      id: 'order-last-month',
      status: 'CANCELLED',
      createdAt: new Date('2026-04-30T08:00:00.000Z'),
      items: [{ quantity: 1, price: '7.00' }],
    },
  ],
});

assert.deepEqual(summary.products, {
  total: 3,
  active: 2,
  hidden: 1,
  inventoryValue: 90,
  packageLimit: 10,
  remainingSlots: 7,
  usagePercent: 30,
});

assert.deepEqual(summary.orders, {
  totalOrders: 4,
  newOrders: 1,
  cancelledOrders: 1,
  onDeliveryOrders: 1,
  deliveredOrders: 1,
  totalTurnover: 82,
});

assert.deepEqual(summary.sales, {
  today: 25,
  yesterday: 20,
  thisMonth: 75,
  lastMonth: 7,
  profitPercent: 15,
  estimatedProfit: 12.3,
});

assert.deepEqual(summary.chart.map((point) => [point.label, point.sales, point.orders]), [
  ['May 24', 0, 0],
  ['May 25', 0, 0],
  ['May 26', 0, 0],
  ['May 27', 0, 0],
  ['May 28', 0, 0],
  ['May 29', 20, 1],
  ['May 30', 25, 1],
]);

console.log('seller dashboard helper assertions passed');
