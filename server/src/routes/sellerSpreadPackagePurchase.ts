export type SpreadPackagePurchaseDecision =
  | { ok: true; remainingBalance: number }
  | { ok: false; code: "ALREADY_CURRENT" | "INSUFFICIENT_FUNDS" };

interface EvaluateSpreadPackagePurchaseInput {
  walletBalance: number | string;
  packagePrice: number | string;
  selectedPackageId: string;
  currentPackageId: string | null;
}

const DAY_IN_MILLISECONDS = 24 * 60 * 60 * 1_000;

function toCents(value: number | string) {
  return Math.round(Number(value) * 100);
}

export function isSpreadPurchaseExpired(expiresAt: Date, now = new Date()) {
  return expiresAt.getTime() <= now.getTime();
}

export function calculateSpreadPackageExpiry(
  purchasedAt: Date,
  durationDays: number,
) {
  return new Date(purchasedAt.getTime() + durationDays * DAY_IN_MILLISECONDS);
}

export function evaluateSpreadPackagePurchase({
  walletBalance,
  packagePrice,
  selectedPackageId,
  currentPackageId,
}: EvaluateSpreadPackagePurchaseInput): SpreadPackagePurchaseDecision {
  if (currentPackageId === selectedPackageId) {
    return { ok: false, code: "ALREADY_CURRENT" };
  }

  const walletCents = toCents(walletBalance);
  const priceCents = toCents(packagePrice);

  if (walletCents < priceCents) {
    return { ok: false, code: "INSUFFICIENT_FUNDS" };
  }

  return {
    ok: true,
    remainingBalance: (walletCents - priceCents) / 100,
  };
}
