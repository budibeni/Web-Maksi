const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

async function main() {
  console.log('=== Reseed tb_hasil_interaksi ===');

  // Hapus pengingat yang terikat aktivitas lead dulu
  await prisma.$executeRawUnsafe(`DELETE FROM tb_pengingat WHERE aktivitas_lead_id IS NOT NULL`);
  console.log('Deleted pengingat terkait aktivitas lead.');

  // Hapus semua aktivitas lead (karena hasil_interaksi_id NOT NULL)
  await prisma.aktivitasLead.deleteMany({});
  console.log('Deleted semua aktivitas lead.');

  // Hapus semua data lama
  await prisma.hasilInteraksi.deleteMany({});
  console.log('Data lama dihapus.');

  const data = [
    // Fase LEAD_BARU (ditampilkan saat buat lead baru)
    { kode: 'HANYA_BERTANYA',   nama: 'Hanya Bertanya',      fase_lead: 'LEAD_BARU', urutan: 1,  warna: 'gray',   ikon: null },
    { kode: 'TERTARIK',         nama: 'Tertarik',             fase_lead: 'LEAD_BARU', urutan: 2,  warna: 'green',  ikon: null },
    { kode: 'MINTA_PENAWARAN',  nama: 'Minta Penawaran',      fase_lead: 'LEAD_BARU', urutan: 3,  warna: 'blue',   ikon: null },
    { kode: 'MINTA_DEMO',       nama: 'Minta Demo',           fase_lead: 'LEAD_BARU', urutan: 4,  warna: 'purple', ikon: null },
    { kode: 'MINTA_FOLLOW_UP',  nama: 'Minta Follow Up',      fase_lead: 'LEAD_BARU', urutan: 5,  warna: 'orange', ikon: null },
    { kode: 'BELUM_MEMUTUSKAN', nama: 'Belum Memutuskan',     fase_lead: 'LEAD_BARU', urutan: 6,  warna: 'yellow', ikon: null },
    { kode: 'TIDAK_TERTARIK',   nama: 'Tidak Tertarik',       fase_lead: 'LEAD_BARU', urutan: 7,  warna: 'red',    ikon: null },
    { kode: 'STOCK_TIDAK_ADA',  nama: 'Stock Tidak Ada',      fase_lead: 'LEAD_BARU', urutan: 8,  warna: 'red',    ikon: null },

    // Fase FOLLOW_UP (ditampilkan saat follow up lead)
    { kode: 'MASIH_TERTARIK',       nama: 'Masih Tertarik',         fase_lead: 'FOLLOW_UP',  urutan: 9,  warna: 'green',  ikon: null },
    { kode: 'MENUNGGU_KEPUTUSAN',   nama: 'Menunggu Keputusan',     fase_lead: 'FOLLOW_UP',  urutan: 10, warna: 'yellow', ikon: null },
    { kode: 'MENUNGGU_ANGGARAN',    nama: 'Menunggu Anggaran',      fase_lead: 'FOLLOW_UP',  urutan: 11, warna: 'yellow', ikon: null },
    { kode: 'MENUNGGU_STOK',        nama: 'Menunggu Stok',          fase_lead: 'FOLLOW_UP',  urutan: 12, warna: 'orange', ikon: null },
    { kode: 'MINTA_REVISI_PENAWARAN', nama: 'Minta Revisi Penawaran', fase_lead: 'PENAWARAN', urutan: 13, warna: 'blue',   ikon: null },
    { kode: 'MINTA_FOLLOW_UP_LAGI', nama: 'Minta Follow Up Lagi',   fase_lead: 'FOLLOW_UP',  urutan: 14, warna: 'orange', ikon: null },
    { kode: 'SULIT_DIHUBUNGI',      nama: 'Sulit Dihubungi',        fase_lead: 'FOLLOW_UP',  urutan: 15, warna: 'red',    ikon: null },
    { kode: 'TIDAK_TERTARIK_LAGI',  nama: 'Tidak Tertarik Lagi',    fase_lead: 'FOLLOW_UP',  urutan: 16, warna: 'red',    ikon: null },
  ];

  for (const item of data) {
    await prisma.hasilInteraksi.create({
      data: {
        ...item,
        aktif: 1,
        dibuat_oleh: 'System Seed',
        dibuat_tanggal: new Date(),
      },
    });
    console.log(`  ✓ ${item.nama} (${item.fase_lead})`);
  }

  console.log(`\nSelesai. Total ${data.length} data berhasil di-seed.`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
