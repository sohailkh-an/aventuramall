import { prisma } from './db/client.js';
import { seedSellerPackages } from './lib/sellerPackages.js';

async function main() {
  console.log('Seeding seller packages...');
  const sellerPackages = await seedSellerPackages();
  console.log(`Seeded ${sellerPackages.length} seller packages.`);
}

main()
  .catch((error) => {
    console.error('Seller package seeding failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
