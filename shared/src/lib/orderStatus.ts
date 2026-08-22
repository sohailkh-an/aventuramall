import { prisma } from '../db/client.js';

export async function updateOrderStatusWithFinancials(orderId: string, newStatus: string) {
  return await prisma.$transaction(async (tx) => {
    // 1. Fetch the existing order
    const existingOrder = await tx.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            sellerProduct: true,
          }
        }
      }
    });

    if (!existingOrder) {
      throw new Error('Order not found');
    }

    // 2. Perform the financial transaction if transitioning to DELIVERED
    let deliveredSellerId: string | null = null;
    let profitAmount = 0;
    let walletIncrementAmount = 0;
    
    if (newStatus === 'DELIVERED' && existingOrder.status !== 'DELIVERED') {
      // Find the seller ID (assuming all items belong to a single seller)
      const sellerId = existingOrder.items.find((item: any) => item.sellerProduct?.sellerId)?.sellerProduct?.sellerId;
      
      if (sellerId) {
        deliveredSellerId = sellerId;

        // Fetch the seller to get profitPercent
        const seller = await tx.seller.findUnique({
          where: { id: sellerId },
          include: { sellerPackage: true },
        });

        const profitPercent = Number(seller?.sellerPackage?.profitPercent ?? 15);
        const orderTotal = Number(existingOrder.total);
        profitAmount = Math.round((orderTotal * (profitPercent / 100)) * 100) / 100;
        walletIncrementAmount = orderTotal + profitAmount;

        // Transfer the total amount from pendingBalance to walletMoney and add profit
        await tx.seller.update({
          where: { id: sellerId },
          data: {
            pendingBalance: {
              decrement: existingOrder.total,
            },
            walletMoney: {
              increment: walletIncrementAmount,
            },
          },
        });
      }
    }

    const financialData = deliveredSellerId
      ? existingOrder.financialMovementsRecorded
        ? {
            sellerBalanceSellerId: deliveredSellerId,
            sellerWalletDelta: { increment: walletIncrementAmount },
            sellerPendingDelta: { decrement: existingOrder.total },
          }
        : {
            sellerBalanceSellerId: deliveredSellerId,
            sellerWalletDelta: walletIncrementAmount,
            sellerPendingDelta: -Number(existingOrder.total),
            financialMovementsRecorded: true,
          }
      : {};

    // 3. Update the order status and its exact seller balance movement totals
    return await tx.order.update({
      where: { id: orderId },
      data: { status: newStatus as any, ...financialData },
      include: {
        user: true,
        shippingAddress: true,
        items: {
          include: {
            product: true,
            sellerProduct: {
              include: {
                seller: {
                  select: {
                    id: true,
                    email: true,
                    shopName: true,
                  },
                },
              },
            },
          },
        },
      },
    });
  });
}
