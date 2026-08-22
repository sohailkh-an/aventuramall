import assert from "node:assert/strict";
import { evaluateSellerPackagePurchase } from "./sellerPackagePurchase.js";

assert.deepEqual(
  evaluateSellerPackagePurchase({ walletBalance: 499, packagePrice: 499, currentRank: 1, selectedRank: 2 }),
  { ok: true, remainingBalance: 0 },
  "an exact wallet balance should purchase the upgrade",
);

assert.deepEqual(
  evaluateSellerPackagePurchase({ walletBalance: 1_000, packagePrice: 999, currentRank: 1, selectedRank: 3 }),
  { ok: true, remainingBalance: 1 },
  "skipping directly to Diamond should charge its full price",
);

assert.deepEqual(
  evaluateSellerPackagePurchase({ walletBalance: 498.99, packagePrice: 499, currentRank: 1, selectedRank: 2 }),
  { ok: false, code: "INSUFFICIENT_FUNDS" },
  "a partial wallet balance should be rejected",
);

assert.deepEqual(
  evaluateSellerPackagePurchase({ walletBalance: 2_000, packagePrice: 499, currentRank: 2, selectedRank: 2 }),
  { ok: false, code: "ALREADY_CURRENT" },
  "the current tier cannot be repurchased",
);

assert.deepEqual(
  evaluateSellerPackagePurchase({ walletBalance: 2_000, packagePrice: 499, currentRank: 3, selectedRank: 2 }),
  { ok: false, code: "LOWER_TIER" },
  "a seller cannot downgrade to a lower tier",
);

assert.deepEqual(
  evaluateSellerPackagePurchase({ walletBalance: 2_000, packagePrice: 0, currentRank: 0, selectedRank: 1 }),
  { ok: false, code: "FREE_TIER" },
  "the free default package is not purchased through the wallet",
);

console.log("seller package purchase assertions passed");
