import { prisma } from './db/client.js';

async function updateImageUrls() {
  console.log('🔄 Starting high-speed image URL update (.co ➔ .top)...\n');

  const oldDomain = 'apexmallstore.co';
  const newDomain = 'apexmallstore.top';

  // 1. Update Product images & descriptionImages
  const products = await prisma.product.findMany({});
  console.log(`📦 Found ${products.length} products in database.`);

  const productsToUpdate: Array<{ id: string; images: string[]; descriptionImages: string[] }> = [];
  let totalProductUrlsReplaced = 0;

  for (const product of products) {
    let modified = false;

    const newImages = product.images.map((url) => {
      if (url.includes(oldDomain) || url.includes('.co/public/uploads')) {
        modified = true;
        totalProductUrlsReplaced++;
        return url.replace('apexmallstore.co', newDomain).replace('.co/public/uploads', '.top/public/uploads');
      }
      return url;
    });

    const newDescImages = product.descriptionImages.map((url) => {
      if (url.includes(oldDomain) || url.includes('.co/public/uploads')) {
        modified = true;
        totalProductUrlsReplaced++;
        return url.replace('apexmallstore.co', newDomain).replace('.co/public/uploads', '.top/public/uploads');
      }
      return url;
    });

    if (modified) {
      productsToUpdate.push({
        id: product.id,
        images: newImages,
        descriptionImages: newDescImages,
      });
    }
  }

  console.log(`⚡ ${productsToUpdate.length} products require update (${totalProductUrlsReplaced} URLs changed). Batching updates...`);

  const CHUNK_SIZE = 50;
  for (let i = 0; i < productsToUpdate.length; i += CHUNK_SIZE) {
    const chunk = productsToUpdate.slice(i, i + CHUNK_SIZE);
    await Promise.all(
      chunk.map((item) =>
        prisma.product.update({
          where: { id: item.id },
          data: {
            images: item.images,
            descriptionImages: item.descriptionImages,
          },
        })
      )
    );
    console.log(`   Updated ${Math.min(i + CHUNK_SIZE, productsToUpdate.length)} / ${productsToUpdate.length} products...`);
  }

  console.log(`✅ Successfully updated ${productsToUpdate.length} Product records.`);

  // 2. Update SellerProduct images & descriptionImages
  const sellerProducts = await prisma.sellerProduct.findMany({});
  const sellerProductsToUpdate: Array<{ id: string; images: string[]; descriptionImages: string[] }> = [];

  for (const sp of sellerProducts) {
    let modified = false;

    const newImages = sp.images.map((url) => {
      if (url.includes(oldDomain) || url.includes('.co/public/uploads')) {
        modified = true;
        return url.replace('apexmallstore.co', newDomain).replace('.co/public/uploads', '.top/public/uploads');
      }
      return url;
    });

    const newDescImages = sp.descriptionImages.map((url) => {
      if (url.includes(oldDomain) || url.includes('.co/public/uploads')) {
        modified = true;
        return url.replace('apexmallstore.co', newDomain).replace('.co/public/uploads', '.top/public/uploads');
      }
      return url;
    });

    if (modified) {
      sellerProductsToUpdate.push({
        id: sp.id,
        images: newImages,
        descriptionImages: newDescImages,
      });
    }
  }

  for (let i = 0; i < sellerProductsToUpdate.length; i += CHUNK_SIZE) {
    const chunk = sellerProductsToUpdate.slice(i, i + CHUNK_SIZE);
    await Promise.all(
      chunk.map((item) =>
        prisma.sellerProduct.update({
          where: { id: item.id },
          data: {
            images: item.images,
            descriptionImages: item.descriptionImages,
          },
        })
      )
    );
  }

  console.log(`✅ Successfully updated ${sellerProductsToUpdate.length} SellerProduct records.`);

  // 3. Update Category images
  const categories = await prisma.category.findMany({});
  let updatedCatCount = 0;

  for (const cat of categories) {
    if (cat.image && (cat.image.includes(oldDomain) || cat.image.includes('.co/public/uploads'))) {
      const newImg = cat.image.replace('apexmallstore.co', newDomain).replace('.co/public/uploads', '.top/public/uploads');
      await prisma.category.update({
        where: { id: cat.id },
        data: { image: newImg },
      });
      updatedCatCount++;
    }
  }

  console.log(`✅ Updated ${updatedCatCount} Category records.`);
  console.log('\n🎉 Image URL migration completed successfully!');
}

updateImageUrls()
  .catch((e) => {
    console.error('❌ Update script failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
