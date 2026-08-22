-- CreateEnum
CREATE TYPE "SellerWalletRechargeStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "seller_wallet_recharges" (
    "id" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    "paymentMethodId" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "receiptImage" TEXT NOT NULL,
    "remark" TEXT,
    "status" "SellerWalletRechargeStatus" NOT NULL DEFAULT 'PENDING',
    "adminMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "seller_wallet_recharges_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "seller_wallet_recharges_sellerId_createdAt_idx" ON "seller_wallet_recharges"("sellerId", "createdAt");

-- CreateIndex
CREATE INDEX "seller_wallet_recharges_paymentMethodId_idx" ON "seller_wallet_recharges"("paymentMethodId");

-- AddForeignKey
ALTER TABLE "seller_wallet_recharges" ADD CONSTRAINT "seller_wallet_recharges_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "sellers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seller_wallet_recharges" ADD CONSTRAINT "seller_wallet_recharges_paymentMethodId_fkey" FOREIGN KEY ("paymentMethodId") REFERENCES "payment_methods"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
