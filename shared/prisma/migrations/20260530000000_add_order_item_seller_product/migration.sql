ALTER TABLE "order_items" ADD COLUMN "sellerProductId" TEXT;

CREATE INDEX "order_items_sellerProductId_idx" ON "order_items"("sellerProductId");

ALTER TABLE "order_items" ADD CONSTRAINT "order_items_sellerProductId_fkey"
  FOREIGN KEY ("sellerProductId") REFERENCES "seller_products"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
