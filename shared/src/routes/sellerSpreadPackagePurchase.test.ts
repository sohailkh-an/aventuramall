import assert from "node:assert/strict";
import {
  calculateSpreadPackageExpiry,
  evaluateSpreadPackagePurchase,
  isSpreadPurchaseExpired,
} from "./sellerSpreadPackagePurchase.js";

const NOW = new Date("2026-07-13T12:00:00.000Z");

assert.equal(
  isSpreadPurchaseExpired(new Date("2026-07-13T11:59:59.999Z"), NOW),
  true,
  "a past-due purchase should be expired",
);
assert.equal(
  isSpreadPurchaseExpired(new Date("2026-07-13T12:00:00.001Z"), NOW),
  false,
  "a future purchase should remain active",
);

assert.deepEqual(
  evaluateSpreadPackagePurchase({
    walletBalance: 499,
    packagePrice: 499,
    selectedPackageId: "overseas",
    currentPackageId: null,
  }),
  { ok: true, remainingBalance: 0 },
  "the full package price should be accepted when the wallet exactly covers it",
);

assert.deepEqual(
  evaluateSpreadPackagePurchase({
    walletBalance: 498.99,
    packagePrice: 499,
    selectedPackageId: "overseas",
    currentPackageId: null,
  }),
  { ok: false, code: "INSUFFICIENT_FUNDS" },
  "a wallet below the full package price should be rejected",
);

assert.deepEqual(
  evaluateSpreadPackagePurchase({
    walletBalance: 2_000,
    packagePrice: 999,
    selectedPackageId: "off-site",
    currentPackageId: "off-site",
  }),
  { ok: false, code: "ALREADY_CURRENT" },
  "the current package should not be purchased again before expiry",
);

assert.deepEqual(
  evaluateSpreadPackagePurchase({
    walletBalance: 1_000,
    packagePrice: 999,
    selectedPackageId: "off-site",
    currentPackageId: "standard",
  }),
  { ok: true, remainingBalance: 1 },
  "switching packages should charge the new package's full price",
);

assert.equal(
  calculateSpreadPackageExpiry(NOW, 7).toISOString(),
  "2026-07-20T12:00:00.000Z",
  "standard should expire exactly seven days after purchase",
);
assert.equal(
  calculateSpreadPackageExpiry(NOW, 15).toISOString(),
  "2026-07-28T12:00:00.000Z",
  "overseas should expire exactly fifteen days after purchase",
);
assert.equal(
  calculateSpreadPackageExpiry(NOW, 30).toISOString(),
  "2026-08-12T12:00:00.000Z",
  "off-site should expire exactly thirty days after purchase",
);

console.log("seller spread package purchase assertions passed");
