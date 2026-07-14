const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding data...');

  // Create Branch
  const cabang = await prisma.cabang.create({
    data: {
      kode: 'PST',
      nama: 'Kantor Pusat',
      alamat: 'Jl. Pusat Maksindo No 1',
      telepon: '02112345678',
    }
  });
  console.log(`Cabang ${cabang.nama} created.`);

  // Create Role
  const roleAdmin = await prisma.role.create({
    data: {
      nama: 'Administrator',
      keterangan: 'Hak akses penuh',
    }
  });
  console.log(`Role ${roleAdmin.nama} created.`);

  // Create User
  const passwordHash = await bcrypt.hash('password123', 10);
  const user = await prisma.user.create({
    data: {
      cabang_id: cabang.id,
      role_id: roleAdmin.id,
      nama: 'Administrator',
      username: 'admin',
      telepon: '081234567890',
      password: passwordHash,
    }
  });
  console.log(`User ${user.username} created.`);

  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
