const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // First, add email column with a default value using raw SQL
  try {
    await prisma.$executeRawUnsafe(`ALTER TABLE tb_user ADD COLUMN email VARCHAR(150) NOT NULL DEFAULT '' AFTER nama`);
    console.log('Column email added.');
  } catch (e) {
    if (e.message.includes('Duplicate column')) {
      console.log('Column email already exists, skipping.');
    } else {
      throw e;
    }
  }
  
  // Add unique index on email
  try {
    await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX idx_user_email ON tb_user(email)`);
    console.log('Unique index on email created.');
  } catch (e) {
    if (e.message.includes('already exists') || e.message.includes('Duplicate')) {
      console.log('Index idx_user_email already exists, skipping.');
    } else {
      throw e;
    }
  }
  
  // Make telepon nullable (if needed)
  try {
    await prisma.$executeRawUnsafe(`ALTER TABLE tb_user MODIFY COLUMN telepon VARCHAR(20) NULL`);
    console.log('Column telepon made nullable.');
  } catch (e) {
    console.log('Could not make telepon nullable:', e.message);
  }

  // Now set default emails for existing users
  const users = await prisma.$queryRaw`SELECT id, username FROM tb_user WHERE email = ''`;
  for (const u of users) {
    await prisma.$executeRawUnsafe(
      `UPDATE tb_user SET email = ? WHERE id = ?`,
      `${u.username}@maksindo.com`,
      u.id
    );
    console.log(`Set email for user ${u.username}`);
  }
  
  console.log('Migration complete!');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
