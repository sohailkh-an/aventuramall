import { prisma } from './db/client.js';
import bcrypt from 'bcryptjs';

async function seedAdmin() {
  console.log('🌱 Seeding Admin User...\n');

  const adminEmail = process.env.ADMIN_EMAIL || 'admin@aventuramall.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123456';
  const adminName = 'System Admin';

  const hashedPassword = await bcrypt.hash(adminPassword, 12);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      password: hashedPassword,
      role: 'ADMIN',
    },
    create: {
      email: adminEmail,
      name: adminName,
      password: hashedPassword,
      role: 'ADMIN',
      emailVerified: true,
    },
  });

  console.log('✅ Admin user created/updated:');
  console.log(`   Email: ${admin.email}`);
  console.log(`   Name:  ${admin.name}`);
  console.log(`   Role:  ${admin.role}`);
  console.log('\n✨ Admin seeding complete!');
}

seedAdmin()
  .catch((e) => {
    console.error('❌ Admin seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
