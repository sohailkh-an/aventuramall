import { prisma } from './db/client.js';
import { seedSellerPackages } from './lib/sellerPackages.js';

async function seed() {
  console.log('🌱 Seeding database...\n');

  // ─── Categories ─────────────────────────────────────────────────────────
  console.log('Creating seller packages...');
  const sellerPackages = await seedSellerPackages();
  console.log(`  Created ${sellerPackages.length} seller packages\n`);

  console.log('Creating categories...');

  const electronics = await prisma.category.upsert({
    where: { slug: 'electronics' },
    update: {},
    create: {
      name: 'Electronics',
      slug: 'electronics',
      description: 'Gadgets, devices, and electronic accessories',
      image: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=400',
    },
  });

  const fashion = await prisma.category.upsert({
    where: { slug: 'fashion' },
    update: {},
    create: {
      name: 'Fashion',
      slug: 'fashion',
      description: 'Trendy clothing and fashion accessories',
      image: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=400',
    },
  });

  const homeGarden = await prisma.category.upsert({
    where: { slug: 'home-garden' },
    update: {},
    create: {
      name: 'Home & Garden',
      slug: 'home-garden',
      description: 'Home decor, furniture, and garden supplies',
      image: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400',
    },
  });

  const beauty = await prisma.category.upsert({
    where: { slug: 'beauty' },
    update: {},
    create: {
      name: 'Beauty & Personal Care',
      slug: 'beauty',
      description: 'Skincare, makeup, and personal care products',
      image: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400',
    },
  });

  const sports = await prisma.category.upsert({
    where: { slug: 'sports' },
    update: {},
    create: {
      name: 'Sports & Outdoors',
      slug: 'sports',
      description: 'Athletic gear, outdoor equipment, and sportswear',
      image: 'https://images.unsplash.com/photo-1461896836934-bd45ba8fcf9b?w=400',
    },
  });

  console.log(`  ✅ Created ${5} categories\n`);

  // ─── Products ───────────────────────────────────────────────────────────
  console.log('Creating products...');

  const products = [
    // Electronics
    {
      name: 'Wireless Bluetooth Earbuds Pro',
      slug: 'wireless-bluetooth-earbuds-pro',
      description: 'Premium noise-cancelling earbuds with 30-hour battery life and crystal-clear audio.',
      price: 49.99,
      compareAtPrice: 79.99,
      images: ['https://images.unsplash.com/photo-1590658268037-6bf12f032f55?w=400'],
      stock: 150,
      isActive: true,
      categoryId: electronics.id,
    },
    {
      name: 'Smart Watch Fitness Tracker',
      slug: 'smart-watch-fitness-tracker',
      description: 'Track your health and fitness with heart rate monitoring, GPS, and water resistance.',
      price: 34.99,
      compareAtPrice: 59.99,
      images: ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400'],
      stock: 200,
      isActive: true,
      categoryId: electronics.id,
    },
    {
      name: 'USB-C Hub Multiport Adapter',
      slug: 'usb-c-hub-multiport-adapter',
      description: '7-in-1 USB-C hub with HDMI, USB 3.0, SD card reader, and PD charging.',
      price: 24.99,
      compareAtPrice: null,
      images: ['https://images.unsplash.com/photo-1625842268584-8f3296236761?w=400'],
      stock: 300,
      isActive: true,
      categoryId: electronics.id,
    },
    // Fashion
    {
      name: 'Oversized Vintage Graphic Tee',
      slug: 'oversized-vintage-graphic-tee',
      description: 'Trendy oversized t-shirt with retro graphic print. 100% cotton.',
      price: 18.99,
      compareAtPrice: 29.99,
      images: ['https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400'],
      stock: 500,
      isActive: true,
      categoryId: fashion.id,
    },
    {
      name: 'High-Waist Wide Leg Jeans',
      slug: 'high-waist-wide-leg-jeans',
      description: 'Flattering high-waist fit with wide leg silhouette. Stretchy denim.',
      price: 32.99,
      compareAtPrice: 49.99,
      images: ['https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=400'],
      stock: 250,
      isActive: true,
      categoryId: fashion.id,
    },
    // Home & Garden
    {
      name: 'LED Strip Lights RGB',
      slug: 'led-strip-lights-rgb',
      description: '32.8ft LED strip lights with remote control. 16 million colors and music sync.',
      price: 12.99,
      compareAtPrice: 24.99,
      images: ['https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=400'],
      stock: 400,
      isActive: true,
      categoryId: homeGarden.id,
    },
    {
      name: 'Ceramic Plant Pot Set',
      slug: 'ceramic-plant-pot-set',
      description: 'Set of 3 minimalist ceramic pots with drainage holes. Modern matte finish.',
      price: 22.99,
      compareAtPrice: null,
      images: ['https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=400'],
      stock: 180,
      isActive: true,
      categoryId: homeGarden.id,
    },
    // Beauty
    {
      name: 'Vitamin C Glow Serum',
      slug: 'vitamin-c-glow-serum',
      description: 'Brightening serum with 20% Vitamin C, Hyaluronic Acid, and Niacinamide.',
      price: 15.99,
      compareAtPrice: 28.99,
      images: ['https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=400'],
      stock: 350,
      isActive: true,
      categoryId: beauty.id,
    },
    {
      name: 'Jade Roller & Gua Sha Set',
      slug: 'jade-roller-gua-sha-set',
      description: 'Natural jade stone face roller and gua sha tool for facial massage.',
      price: 9.99,
      compareAtPrice: 19.99,
      images: ['https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=400'],
      stock: 275,
      isActive: true,
      categoryId: beauty.id,
    },
    // Sports
    {
      name: 'Resistance Bands Set',
      slug: 'resistance-bands-set',
      description: '5 resistance levels with carry bag, door anchor, and exercise guide.',
      price: 14.99,
      compareAtPrice: 29.99,
      images: ['https://images.unsplash.com/photo-1598289431512-b97b0917affc?w=400'],
      stock: 600,
      isActive: true,
      categoryId: sports.id,
    },
    {
      name: 'Insulated Water Bottle 32oz',
      slug: 'insulated-water-bottle-32oz',
      description: 'Double-wall vacuum insulated stainless steel water bottle. Keeps drinks cold 24h.',
      price: 19.99,
      compareAtPrice: null,
      images: ['https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=400'],
      stock: 450,
      isActive: true,
      categoryId: sports.id,
    },
    {
      name: 'Yoga Mat with Alignment Lines',
      slug: 'yoga-mat-alignment-lines',
      description: 'Extra thick 6mm eco-friendly TPE yoga mat with body alignment lines.',
      price: 26.99,
      compareAtPrice: 39.99,
      images: ['https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=400'],
      stock: 320,
      isActive: true,
      categoryId: sports.id,
    },
  ];

  for (const product of products) {
    await prisma.product.upsert({
      where: { slug: product.slug },
      update: {},
      create: product,
    });
  }

  console.log(`  ✅ Created ${products.length} products\n`);

  console.log('✨ Seeding complete!');
}

seed()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

