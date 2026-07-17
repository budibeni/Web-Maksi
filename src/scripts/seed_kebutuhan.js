const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Mengambil data dari tb_hasil_interaksi...');
  const hasilInteraksis = await prisma.hasilInteraksi.findMany();
  console.log(`Ditemukan ${hasilInteraksis.length} baris di tb_hasil_interaksi.`);

  console.log('Menyalin data ke tb_kebutuhan...');
  for (const h of hasilInteraksis) {
    const data = {
      id: h.id,
      kode: h.kode,
      nama: h.nama,
      fase_lead: h.fase_lead,
      urutan: h.urutan,
      warna: h.warna,
      ikon: h.ikon,
      aktif: h.aktif,
      dibuat_oleh: h.dibuat_oleh,
      dibuat_tanggal: h.dibuat_tanggal,
      diubah_oleh: h.diubah_oleh,
      diubah_tanggal: h.diubah_tanggal
    };
    await prisma.kebutuhan.upsert({
      where: { id: h.id },
      update: data,
      create: data
    });
  }
  console.log('Proses seeding tb_kebutuhan berhasil diselesaikan.');
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
