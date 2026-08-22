import 'dotenv/config';
import { PrismaClient } from '../../shared/src/generated/prisma/index.js';
import { PrismaNeon } from '@prisma/adapter-neon';

async function migrate() {
  if (!process.env.OLD_DATABASE_URL) {
    console.error("Please provide OLD_DATABASE_URL in server/.env");
    process.exit(1);
  }

  console.log("Connecting to Old Database...");
  const oldAdapter = new PrismaNeon({ connectionString: process.env.OLD_DATABASE_URL! });
  const oldDb = new PrismaClient({ adapter: oldAdapter });

  console.log("Connecting to New Database...");
  const newAdapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
  const newDb = new PrismaClient({ adapter: newAdapter });

  try {
    // 1. Fetch from Old DB
    console.log("?? Fetching Categories from old store...");
    const categories = await oldDb.category.findMany();
    
    console.log("?? Fetching Products (Storehouse) from old store...");
    const products = await oldDb.product.findMany();

    console.log(`Found ${categories.length} categories and ${products.length} products to migrate.`);

    if (categories.length === 0 && products.length === 0) {
      console.log("?? No data found to migrate.");
      return;
    }

    // Sort categories: parent categories first to avoid foreign key constraints
    const rootCategories = categories.filter(c => !c.parentId);
    const subCategories = categories.filter(c => c.parentId);
    const sortedCategories = [...rootCategories, ...subCategories];

    // 2. Insert to New DB
    console.log("?? Migrating Categories...");
    let categoryCount = 0;
    for (const category of sortedCategories) {
      try {
        await newDb.category.upsert({
          where: { id: category.id },
          update: category,
          create: category,
        });
        categoryCount++;
      } catch (err: any) {
        console.error(`Error migrating category ${category.name}: ${err.message}`);
      }
    }
    console.log(`? Successfully migrated ${categoryCount} categories.`);

    console.log("?? Migrating Products (Storehouse)...");
    let productCount = 0;
    for (const product of products) {
      try {
        await newDb.product.upsert({
          where: { id: product.id },
          update: product,
          create: product,
        });
        productCount++;
      } catch (err: any) {
        console.error(`Error migrating product ${product.name}: ${err.message}`);
      }
    }
    console.log(`? Successfully migrated ${productCount} products (Storehouse).`);

    console.log("?? Migration Complete!");

  } catch (error) {
    console.error("? Migration failed:", error);
  } finally {
    await oldDb.$disconnect();
    await newDb.$disconnect();
  }
}

migrate();
