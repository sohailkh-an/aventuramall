ALTER TABLE "orders"
    ADD COLUMN "sellerBalanceSellerId" TEXT,
    ADD COLUMN "sellerWalletDelta" DECIMAL(10,2) NOT NULL DEFAULT 0,
    ADD COLUMN "sellerPendingDelta" DECIMAL(10,2) NOT NULL DEFAULT 0,
    ADD COLUMN "financialMovementsRecorded" BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN "frozenFundsReleasedAt" TIMESTAMP(3);
