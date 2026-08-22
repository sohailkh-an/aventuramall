export interface BulkAddCandidateProduct {
  id: string;
}

interface SelectSellerProductsToAddInput<TProduct extends BulkAddCandidateProduct> {
  products: TProduct[];
  existingProductIds: Set<string>;
  remainingSlots: number;
}

export function getRemainingSellerProductSlots(currentCount: number, packageLimit: number) {
  return Math.max(packageLimit - currentCount, 0);
}

export function canSellerAddStorehouseProducts(status: string | null | undefined) {
  return status === 'APPROVED';
}

export function selectSellerProductsToAdd<TProduct extends BulkAddCandidateProduct>({
  products,
  existingProductIds,
  remainingSlots,
}: SelectSellerProductsToAddInput<TProduct>) {
  if (remainingSlots <= 0) {
    return [];
  }

  return products
    .filter((product) => !existingProductIds.has(product.id))
    .slice(0, remainingSlots);
}
