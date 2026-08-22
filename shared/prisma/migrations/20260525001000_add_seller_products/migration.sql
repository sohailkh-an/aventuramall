CREATE TABLE "seller_products" (
  "id" TEXT NOT NULL,
  "sellerId" TEXT NOT NULL,
  "sourceProductId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "description" TEXT,
  "price" DECIMAL(10,2) NOT NULL,
  "compareAtPrice" DECIMAL(10,2),
  "images" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "stock" INTEGER NOT NULL DEFAULT 0,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "categoryId" TEXT NOT NULL,
  "videoLink" TEXT,
  "descriptionImages" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "seller_products_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "seller_products_sellerId_sourceProductId_key" ON "seller_products"("sellerId", "sourceProductId");
CREATE INDEX "seller_products_sellerId_idx" ON "seller_products"("sellerId");
CREATE INDEX "seller_products_sourceProductId_idx" ON "seller_products"("sourceProductId");
CREATE INDEX "seller_products_categoryId_idx" ON "seller_products"("categoryId");

ALTER TABLE "seller_products" ADD CONSTRAINT "seller_products_sellerId_fkey"
  FOREIGN KEY ("sellerId") REFERENCES "sellers"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "seller_products" ADD CONSTRAINT "seller_products_sourceProductId_fkey"
  FOREIGN KEY ("sourceProductId") REFERENCES "products"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "seller_products" ADD CONSTRAINT "seller_products_categoryId_fkey"
  FOREIGN KEY ("categoryId") REFERENCES "categories"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
