import { prisma } from '../db/client.js';

export const SELLER_PACKAGES = [
  { code: 'silver', name: 'Silver', productLimit: 300, profitPercent: 15, price: 0, sortOrder: 1 },
  { code: 'platinum', name: 'Platinum', productLimit: 1000, profitPercent: 18, price: 499, sortOrder: 2 },
  { code: 'diamond', name: 'Diamond', productLimit: 5000, profitPercent: 25, price: 999, sortOrder: 3 },
] as const;

export async function seedSellerPackages() {
  const packages = [];

  for (const pkg of SELLER_PACKAGES) {
    packages.push(
      await prisma.sellerPackage.upsert({
        where: { code: pkg.code },
        update: {
          name: pkg.name,
          productLimit: pkg.productLimit,
          profitPercent: pkg.profitPercent,
          price: pkg.price,
          sortOrder: pkg.sortOrder,
        },
        create: pkg,
      })
    );
  }

  const silver = packages.find((pkg) => pkg.code === 'silver');
  if (silver) {
    await prisma.seller.updateMany({
      where: { sellerPackageId: null },
      data: { sellerPackageId: silver.id },
    });
  }

  return packages;
}

export async function ensureDefaultSellerPackage() {
  return prisma.sellerPackage.upsert({
    where: { code: 'silver' },
    update: {
      name: 'Silver',
      productLimit: 300,
      profitPercent: 15,
      price: 0,
      sortOrder: 1,
    },
    create: {
      code: 'silver',
      name: 'Silver',
      productLimit: 300,
      profitPercent: 15,
      price: 0,
      sortOrder: 1,
    },
  });
}
