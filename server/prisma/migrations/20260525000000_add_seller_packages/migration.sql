CREATE TABLE "seller_packages" (
  "id" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "productLimit" INTEGER NOT NULL,
  "profitPercent" DECIMAL(5,2) NOT NULL,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "seller_packages_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "seller_packages_code_key" ON "seller_packages"("code");

ALTER TABLE "sellers" ADD COLUMN "sellerPackageId" TEXT;

CREATE INDEX "sellers_sellerPackageId_idx" ON "sellers"("sellerPackageId");

ALTER TABLE "sellers" ADD CONSTRAINT "sellers_sellerPackageId_fkey"
  FOREIGN KEY ("sellerPackageId") REFERENCES "seller_packages"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
