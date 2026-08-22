import { prisma } from './db/client.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PRODUCTS_JSON = path.join(__dirname, '../../scraper/output/products.json');

async function seedScraped() {
  console.log('🌱 Seeding scraped products...\n');

  if (!fs.existsSync(PRODUCTS_JSON)) {
    console.error(`❌ Products file not found: ${PRODUCTS_JSON}`);
    return;
  }

  const productsData = JSON.parse(fs.readFileSync(PRODUCTS_JSON, 'utf-8'));
  console.log(`📦 Found ${productsData.length} products in JSON file.`);

  // Cache to store category IDs by name
  const categoryCache = new Map<string, string>();

  let count = 0;
  for (const item of productsData) {
    try {
      // Determine category name from item, fallback to 'Scraped Products'
      const catName = item.categoryName || 'Scraped Products';
      const catSlug = catName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

      let categoryId = categoryCache.get(catName);
      if (!categoryId) {
        const category = await prisma.category.upsert({
          where: { slug: catSlug },
          update: {},
          create: {
            name: catName,
            slug: catSlug,
            description: `Products for ${catName}`,
          },
        });
        categoryId = category.id;
        categoryCache.set(catName, categoryId);
      }

      if (!categoryId) continue;

      // Clean up price (ensure it's a valid number)
      const price = item.price || 0;
      
      await prisma.product.upsert({
        where: { slug: item.slug },
        update: {
          name: item.name,
          description: item.description,
          price: price,
          images: item.imagesArray || [],
          soldBy: item.soldBy,
          videoLink: item.videoLink,
          descriptionImages: item.descriptionImagesArray || [],
          categoryId: categoryId,
        },
        create: {
          name: item.name,
          slug: item.slug,
          description: item.description,
          price: price,
          images: item.imagesArray || [],
          categoryId: categoryId,
          soldBy: item.soldBy,
          videoLink: item.videoLink,
          descriptionImages: item.descriptionImagesArray || [],
          stock: 100, // Default stock
          isActive: true,
        },
      });
      count++;
      if (count % 10 === 0) {
        process.stdout.write('.');
      }
    } catch (err) {
      console.error(`\n❌ Failed to seed product: ${item.name}`, err);
    }
  }

  console.log(`\n\n✅ Successfully seeded ${count} products!`);
}

seedScraped()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
