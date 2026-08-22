import assert from "node:assert/strict";
import { getOrderDeletionReversal, type OrderFinancialSnapshot } from "./orderFinancials.js";

const base: OrderFinancialSnapshot = {
  status: "PICKED_UP",
  total: 100,
  sellerId: "seller-1",
  walletDelta: -85,
  pendingDelta: 100,
  hasRecordedMovements: true,
};

assert.deepEqual(getOrderDeletionReversal(base), {
  sellerId: "seller-1",
  walletAdjustment: 85,
  pendingAdjustment: -100,
  source: "recorded",
});

assert.deepEqual(
  getOrderDeletionReversal({ ...base, status: "DELIVERED", walletDelta: 15, pendingDelta: 0 }),
  { sellerId: "seller-1", walletAdjustment: -15, pendingAdjustment: 0, source: "recorded" },
);

assert.deepEqual(
  getOrderDeletionReversal({ ...base, hasRecordedMovements: false, walletDelta: 0, pendingDelta: 0 }),
  { sellerId: "seller-1", walletAdjustment: 85, pendingAdjustment: -100, source: "derived" },
);

assert.deepEqual(
  getOrderDeletionReversal({ ...base, status: "DELIVERED", hasRecordedMovements: false, walletDelta: 0, pendingDelta: 0 }),
  { sellerId: "seller-1", walletAdjustment: -15, pendingAdjustment: 0, source: "derived" },
);

assert.equal(getOrderDeletionReversal({ ...base, sellerId: null }), null);

console.log("order financial reversal assertions passed");
