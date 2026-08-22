export interface OrderFinancialSnapshot {
  status: string;
  total: number;
  sellerId: string | null;
  walletDelta: number;
  pendingDelta: number;
  hasRecordedMovements: boolean;
}

export interface OrderDeletionReversal {
  sellerId: string;
  walletAdjustment: number;
  pendingAdjustment: number;
  source: "recorded" | "derived";
}

function money(value: number) {
  const rounded = Math.round(value * 100) / 100;
  return Object.is(rounded, -0) ? 0 : rounded;
}

export function getOrderDeletionReversal(
  snapshot: OrderFinancialSnapshot,
): OrderDeletionReversal | null {
  if (!snapshot.sellerId) return null;

  if (snapshot.hasRecordedMovements) {
    return {
      sellerId: snapshot.sellerId,
      walletAdjustment: money(-snapshot.walletDelta),
      pendingAdjustment: money(-snapshot.pendingDelta),
      source: "recorded",
    };
  }

  if (["PICKED_UP", "ON_THE_WAY", "SHIPPED"].includes(snapshot.status)) {
    return {
      sellerId: snapshot.sellerId,
      walletAdjustment: money(snapshot.total * 0.85),
      pendingAdjustment: money(-snapshot.total),
      source: "derived",
    };
  }

  if (snapshot.status === "DELIVERED") {
    return {
      sellerId: snapshot.sellerId,
      walletAdjustment: money(-snapshot.total * 0.15),
      pendingAdjustment: 0,
      source: "derived",
    };
  }

  return {
    sellerId: snapshot.sellerId,
    walletAdjustment: 0,
    pendingAdjustment: 0,
    source: "derived",
  };
}
