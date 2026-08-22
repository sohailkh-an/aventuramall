CREATE TYPE "SpreadPackagePurchaseStatus" AS ENUM ('ACTIVE', 'REPLACED', 'EXPIRED');

CREATE TABLE "spread_packages" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "durationDays" INTEGER NOT NULL,
    "promotionLimit" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "spread_packages_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "seller_spread_package_purchases" (
    "id" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    "spreadPackageId" TEXT NOT NULL,
    "packageName" TEXT NOT NULL,
    "pricePaid" DECIMAL(10,2) NOT NULL,
    "durationDays" INTEGER NOT NULL,
    "promotionLimit" INTEGER NOT NULL,
    "purchasedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "status" "SpreadPackagePurchaseStatus" NOT NULL DEFAULT 'ACTIVE',
    "replacedAt" TIMESTAMP(3),

    CONSTRAINT "seller_spread_package_purchases_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "spread_packages_code_key" ON "spread_packages"("code");
CREATE INDEX "seller_spread_package_purchases_sellerId_purchasedAt_idx" ON "seller_spread_package_purchases"("sellerId", "purchasedAt");
CREATE INDEX "seller_spread_package_purchases_sellerId_status_expiresAt_idx" ON "seller_spread_package_purchases"("sellerId", "status", "expiresAt");
CREATE INDEX "seller_spread_package_purchases_spreadPackageId_idx" ON "seller_spread_package_purchases"("spreadPackageId");
CREATE UNIQUE INDEX "seller_spread_package_purchases_one_active_per_seller_idx"
    ON "seller_spread_package_purchases"("sellerId")
    WHERE "status" = 'ACTIVE';

ALTER TABLE "seller_spread_package_purchases"
    ADD CONSTRAINT "seller_spread_package_purchases_sellerId_fkey"
    FOREIGN KEY ("sellerId") REFERENCES "sellers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "seller_spread_package_purchases"
    ADD CONSTRAINT "seller_spread_package_purchases_spreadPackageId_fkey"
    FOREIGN KEY ("spreadPackageId") REFERENCES "spread_packages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

INSERT INTO "spread_packages" (
    "id", "code", "name", "price", "durationDays", "promotionLimit", "description", "sortOrder", "isEnabled", "updatedAt"
) VALUES
    ('spread_pkg_standard', 'standard', 'Standard promotion', 199.00, 7, 100, 'Put it in the whole store, grab the traffic and earn it!', 1, true, CURRENT_TIMESTAMP),
    ('spread_pkg_overseas', 'overseas', 'Overseas promotion', 499.00, 15, 500, 'Traffic-focused promotion with expanded product exposure.', 2, true, CURRENT_TIMESTAMP),
    ('spread_pkg_off_site', 'off-site', 'Off-site promotion', 999.00, 30, 1000, 'Extended promotion for maximum product reach.', 3, true, CURRENT_TIMESTAMP);
