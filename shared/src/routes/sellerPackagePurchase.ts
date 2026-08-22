export type SellerPackagePurchaseDecision =
  | { ok: true; remainingBalance: number }
  | {
      ok: false;
      code: "ALREADY_CURRENT" | "LOWER_TIER" | "FREE_TIER" | "INSUFFICIENT_FUNDS";
    };

interface EvaluateSellerPackagePurchaseInput {
  walletBalance: number | string;
  packagePrice: number | string;
  currentRank: number;
  selectedRank: number;
}

function toCents(value: number | string) {
  return Math.round(Number(value) * 100);
}

export function evaluateSellerPackagePurchase({
  walletBalance,
  packagePrice,
  currentRank,
  selectedRank,
}: EvaluateSellerPackagePurchaseInput): SellerPackagePurchaseDecision {
  if (selectedRank === currentRank) return { ok: false, code: "ALREADY_CURRENT" };
  if (selectedRank < currentRank) return { ok: false, code: "LOWER_TIER" };

  const priceCents = toCents(packagePrice);
  if (priceCents === 0) return { ok: false, code: "FREE_TIER" };

  const walletCents = toCents(walletBalance);
  if (walletCents < priceCents) return { ok: false, code: "INSUFFICIENT_FUNDS" };

  return { ok: true, remainingBalance: (walletCents - priceCents) / 100 };
}
