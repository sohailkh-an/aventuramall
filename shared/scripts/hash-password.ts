import bcrypt from 'bcryptjs';

async function generateHash(password: string) {
  const hash = await bcrypt.hash(password, 12);
  console.log('Password Hash:', hash);
  console.log('\nSQL to update admin:');
  console.log(`UPDATE users SET password = '${hash}' WHERE email = 'your-admin-email@example.com' AND role = 'ADMIN';`);
}

const password = process.argv[2] || 'admin123';
generateHash(password);
