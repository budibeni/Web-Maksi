const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

const dataKebutuhan = [
  { kode: 'MESIN_MAKANAN',  nama: 'Mesin Makanan'  },
  { kode: 'MESIN_MINUMAN',  nama: 'Mesin Minuman'  },
  { kode: 'MESIN_BAKERY',   nama: 'Mesin Bakery'   },
  { kode: 'MESIN_ED',       nama: 'Mesin Ed'        },
  { kode: 'MESIN_PENGEMAS', nama: 'Mesin Pengemas' },
  { kode: 'MESIN_INDUSTRI', nama: 'Mesin Industri' },
  { kode: 'ALAT_DAPUR',     nama: 'Alat Dapur'     },
  { kode: 'LAINNYA',        nama: 'Lainnya'         },
];

async function main() {
  // Hapus semua data lama
  await prisma.$executeRaw`TRUNCATE TABLE tb_kebutuhan`;
  console.log('✓ Data lama dihapus.');

  // Insert data baru
  for (let i = 0; i < dataKebutuhan.length; i++) {
    const item = dataKebutuhan[i];
    await prisma.kebutuhan.create({
      data: {
        kode:           item.kode,
        nama:           item.nama,
        urutan:         i + 1,
        aktif:          1,
        dibuat_oleh:    'system',
        dibuat_tanggal: new Date(),
      },
    });
  }
  console.log(`✓ ${dataKebutuhan.length} data kebutuhan berhasil disimpan.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
