type SellerWalletBalanceMode = 'add' | 'deduct';

interface CalculateSellerWalletBalanceInput {
  currentBalance: number;
  amount: number;
  mode: SellerWalletBalanceMode;
}

type SellerWalletBalanceResult =
  | { ok: true; nextBalance: number }
  | { ok: false; error: string };

export function calculateSellerWalletBalance({
  currentBalance,
  amount,
  mode,
}: CalculateSellerWalletBalanceInput): SellerWalletBalanceResult {
  if (mode === 'add') {
    return { ok: true, nextBalance: currentBalance + amount };
  }

  if (amount > currentBalance) {
    return { ok: false, error: 'Cannot deduct more than the current wallet balance.' };
  }

  return { ok: true, nextBalance: currentBalance - amount };
}
