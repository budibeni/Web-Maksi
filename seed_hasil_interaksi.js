const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const seeds = [
    { kode: 'TANYA', nama: 'Hanya tanya-tanya', fase_lead: 'LEAD_BARU', urutan: 1, warna: 'blue' },
    { kode: 'TUNGGU', nama: 'Menunggu keputusan', fase_lead: 'FOLLOW_UP', urutan: 2, warna: 'yellow' },
    { kode: 'PENAWARAN', nama: 'Minta penawaran', fase_lead: 'PENAWARAN', urutan: 3, warna: 'purple' },
    { kode: 'SIAP', nama: 'Siap membeli', fase_lead: 'PENAWARAN', urutan: 4, warna: 'green' },
    { kode: 'TIDAK_MINAT', nama: 'Tidak berminat', fase_lead: 'FOLLOW_UP', urutan: 5, warna: 'red' },
    { kode: 'KOMPETITOR', nama: 'Membeli di kompetitor', fase_lead: 'FOLLOW_UP', urutan: 6, warna: 'orange' },
  ];
  for (const s of seeds) {
    await prisma.hasilInteraksi.upsert({ where: { kode: s.kode }, update: {}, create: s });
  }
  console.log('Seed berhasil!');
}

main().catch(console.error).finally(() => process.exit());
