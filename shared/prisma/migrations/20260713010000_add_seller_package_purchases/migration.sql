ALTER TABLE "seller_packages"
    ADD COLUMN "price" DECIMAL(10,2) NOT NULL DEFAULT 0;

UPDATE "seller_packages" SET "price" = 0 WHERE "code" = 'silver';
UPDATE "seller_packages" SET "price" = 499 WHERE "code" = 'platinum';
UPDATE "seller_packages" SET "price" = 999 WHERE "code" = 'diamond';

CREATE TABLE "seller_package_purchases" (
    "id" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    "sellerPackageId" TEXT NOT NULL,
    "packageName" TEXT NOT NULL,
    "pricePaid" DECIMAL(10,2) NOT NULL,
    "productLimit" INTEGER NOT NULL,
    "profitPercent" DECIMAL(5,2) NOT NULL,
    "paymentType" TEXT NOT NULL DEFAULT 'WALLET',
    "purchasedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "seller_package_purchases_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "seller_package_purchases_sellerId_purchasedAt_idx"
    ON "seller_package_purchases"("sellerId", "purchasedAt");
CREATE INDEX "seller_package_purchases_sellerPackageId_idx"
    ON "seller_package_purchases"("sellerPackageId");

ALTER TABLE "seller_package_purchases"
    ADD CONSTRAINT "seller_package_purchases_sellerId_fkey"
    FOREIGN KEY ("sellerId") REFERENCES "sellers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "seller_package_purchases"
    ADD CONSTRAINT "seller_package_purchases_sellerPackageId_fkey"
    FOREIGN KEY ("sellerPackageId") REFERENCES "seller_packages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
