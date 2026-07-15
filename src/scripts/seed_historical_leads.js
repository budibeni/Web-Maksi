const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Starting seed: data bulan Juni 2026 (1 bulan lalu) dan Mei 2026 (2 bulan lalu)...');

  // Get existing sales users
  const salesUsers = await prisma.user.findMany({
    where: { role: { nama: 'Sales' } },
    include: { cabang: true }
  });

  if (salesUsers.length === 0) {
    console.error('Tidak ada user Sales. Jalankan seed utama dulu.');
    return;
  }

  const products = await prisma.produk.findMany({ include: { kategori: true } });
  const alasanLosts = await prisma.alasanLost.findMany();
  const hasilInteraksis = await prisma.hasilInteraksi.findMany();

  const companyPrefixes = ['CV', 'PT', 'UD', 'Toko', 'Bpk', 'Ibu'];
  const companyNames = [
    'Agro Lestari', 'Sinar Perkasa', 'Mitra Sukses', 'Karya Unggul', 'Duta Makmur',
    'Nusa Indah', 'Prima Teknik', 'Surya Jaya', 'Multi Karya', 'Anugerah Abadi',
    'Bumi Persada', 'Gemilang Nusantara', 'Harapan Baru', 'Fajar Industri', 'Wira Usaha',
    'Sakti Mandiri', 'Citra Niaga', 'Delta Makmur', 'Elang Perkasa', 'Fortuna Jaya'
  ];

  const productNotes = [
    'Butuh mesin vacuum sealer kapasitas besar',
    'Tanya harga mesin pengering biji-bijian',
    'Tertarik mesin mixer industrial stainless',
    'Minta demo mesin sealer otomatis',
    'Survey harga mesin pengemas produk pertanian',
    'Butuh penawaran mesin box dryer indirect',
    'Konfirmasi ketersediaan mesin killer cone',
    'Minta spesifikasi mesin penanam sayur',
  ];

  // Months to seed: May 2026 (2 months ago) and June 2026 (1 month ago)
  const targetMonths = [
    { year: 2026, month: 4, label: 'Mei 2026', startIndex: 101 },   // month 4 = May (0-indexed)
    { year: 2026, month: 5, label: 'Juni 2026', startIndex: 151 },  // month 5 = June (0-indexed)
  ];

  let totalCreated = 0;

  for (const target of targetMonths) {
    console.log(`\n--- Membuat data untuk ${target.label} ---`);

    for (let i = 0; i < 50; i++) {
      const globalIndex = target.startIndex + i;

      // Random status: 50% Deal, 25% Lost, 25% Open
      const rand = Math.random();
      let status = 1; // Open
      if (rand < 0.50) status = 2; // Deal
      else if (rand < 0.75) status = 3; // Lost

      // Random Sales & Cabang
      const sales = salesUsers[Math.floor(Math.random() * salesUsers.length)];
      const cabang = sales.cabang;

      // Customer data
      const companyPref = companyPrefixes[Math.floor(Math.random() * companyPrefixes.length)];
      const companyBase = companyNames[Math.floor(Math.random() * companyNames.length)];
      const customerNama = `${companyPref} ${companyBase} ${String(globalIndex).padStart(3, '0')}`;
      const customerTelepon = `0813${String(Math.floor(10000000 + Math.random() * 90000000))}`;
      const customerAlamat = `Jl. Industri Raya No. ${globalIndex}, Jawa Barat`;

      const customer = await prisma.customer.create({
        data: {
          nama: customerNama,
          telepon: customerTelepon,
          alamat: customerAlamat,
          catatan: `Customer seed ${target.label} ke-${i + 1}`,
          dibuat_oleh: 'System Seed'
        }
      });

      // Date spread within the month
      const day = Math.floor(1 + Math.random() * 27);
      const hour = Math.floor(8 + Math.random() * 8);
      const dateCreated = new Date(target.year, target.month, day, hour, 0, 0);

      // Lead number
      const yy = String(target.year).slice(2);
      const mm = String(target.month + 1).padStart(2, '0');
      const leadNomor = `LD-${yy}${mm}-${String(globalIndex).padStart(4, '0')}`;

      const lead = await prisma.lead.create({
        data: {
          nomor: leadNomor,
          customer_id: customer.id,
          cabang_id: cabang.id,
          user_id: sales.id,
          status_customer: Math.random() > 0.4 ? 'BARU' : 'EXISTING',
          status,
          fase: status === 2 ? 3 : (status === 3 ? 2 : Math.floor(1 + Math.random() * 3)),
          catatan_awal: productNotes[Math.floor(Math.random() * productNotes.length)],
          dibuat_oleh: sales.nama,
          dibuat_tanggal: dateCreated
        }
      });

      // Timeline activities (1-4 records)
      const actCount = Math.floor(1 + Math.random() * 4);
      let lastActDate = new Date(dateCreated);

      for (let k = 1; k <= actCount; k++) {
        lastActDate = new Date(lastActDate);
        lastActDate.setDate(lastActDate.getDate() + Math.floor(1 + Math.random() * 5));

        const hi = hasilInteraksis[Math.floor(Math.random() * hasilInteraksis.length)];

        await prisma.aktivitasLead.create({
          data: {
            lead_id: lead.id,
            user_id: sales.id,
            hasil_interaksi_id: hi.id,
            hasil_interaksi: hi.nama,
            catatan: `Follow up ke-${k} (${target.label}): ${hi.nama}, tindak lanjut segera diproses.`,
            dibuat_oleh: sales.nama,
            dibuat_tanggal: lastActDate
          }
        });
      }

      // Penawaran (Quotation)
      if (status === 2 || Math.random() > 0.25) {
        const qNomor = `QT-${cabang.kode}-${yy}${mm}-${String(globalIndex).padStart(4, '0')}`;
        const qDate = new Date(lastActDate);
        qDate.setHours(qDate.getHours() + 1);

        const numProducts = Math.floor(1 + Math.random() * 2);
        let subtotalVal = 0;
        const itemDetails = [];
        const usedIds = new Set();

        for (let pIdx = 0; pIdx < numProducts; pIdx++) {
          let prod;
          let tries = 0;
          do {
            prod = products[Math.floor(Math.random() * products.length)];
            tries++;
          } while (usedIds.has(String(prod.id)) && tries < 10);

          usedIds.add(String(prod.id));
          const qty = Math.floor(1 + Math.random() * 3);
          const price = Number(prod.harga_default || 5000000);
          const itemSub = qty * price;
          subtotalVal += itemSub;

          itemDetails.push({
            produk_id: prod.id,
            kategori_produk_nama: prod.kategori.nama,
            kode_produk: prod.kode,
            nama_produk: prod.nama,
            satuan: prod.satuan,
            qty,
            harga: price,
            subtotal: itemSub
          });
        }

        const ppnNominal = subtotalVal * 0.11;
        const grandTotal = subtotalVal + ppnNominal;
        const dpNominal = grandTotal * 0.3;

        const quotation = await prisma.versiPenawaran.create({
          data: {
            nomor: qNomor,
            lead_id: lead.id,
            versi: 1,
            customer_nama: customerNama,
            customer_telepon: customerTelepon,
            customer_alamat: customerAlamat,
            sales_nama: sales.nama,
            cabang_nama: cabang.nama,
            catatan: `Penawaran harga mesin untuk ${customerNama} - ${target.label}`,
            masa_berlaku: 30,
            subtotal: subtotalVal,
            diskon_persen: 0,
            diskon_nominal: 0,
            ppn_persen: 11,
            ppn_nominal: ppnNominal,
            grand_total: grandTotal,
            dp_persen: 30,
            dp_nominal: dpNominal,
            dibuat_oleh: sales.nama,
            dibuat_tanggal: qDate
          }
        });

        for (const item of itemDetails) {
          await prisma.detailPenawaran.create({
            data: {
              versi_penawaran_id: quotation.id,
              produk_id: item.produk_id,
              kategori_produk_nama: item.kategori_produk_nama,
              kode_produk: item.kode_produk,
              nama_produk: item.nama_produk,
              satuan: item.satuan,
              qty: item.qty,
              harga: item.harga,
              diskon_persen: 0,
              diskon_nominal: 0,
              subtotal: item.subtotal,
              dibuat_oleh: sales.nama,
              dibuat_tanggal: qDate
            }
          });
        }

        let updateData = { versi_penawaran_final_id: quotation.id };

        if (status === 2) {
          const dealDate = new Date(qDate);
          dealDate.setDate(dealDate.getDate() + Math.floor(2 + Math.random() * 7));

          updateData.nilai_deal = grandTotal;
          updateData.tanggal_deal = dealDate;
          updateData.diubah_oleh = sales.nama;
          updateData.diubah_tanggal = dealDate;

          await prisma.aktivitasLead.create({
            data: {
              lead_id: lead.id,
              user_id: sales.id,
              hasil_interaksi_id: BigInt(4),
              hasil_interaksi: 'Siap membeli',
              catatan: `Deal berhasil! Nilai: Rp ${grandTotal.toLocaleString('id-ID')}`,
              dibuat_oleh: sales.nama,
              dibuat_tanggal: dealDate
            }
          });
        } else if (status === 3) {
          const lostDate = new Date(qDate);
          lostDate.setDate(lostDate.getDate() + Math.floor(1 + Math.random() * 5));
          const al = alasanLosts[Math.floor(Math.random() * alasanLosts.length)];

          updateData.alasan_lost_id = al.id;
          updateData.nama_alasan_lost = al.nama;
          updateData.nilai_lost = grandTotal;
          updateData.tanggal_lost = lostDate;
          updateData.catatan_lost = 'Customer memutuskan tidak jadi membeli bulan ini.';
          updateData.diubah_oleh = sales.nama;
          updateData.diubah_tanggal = lostDate;
        }

        await prisma.lead.update({ where: { id: lead.id }, data: updateData });
      } else if (status === 3) {
        const lostDate = new Date(lastActDate);
        lostDate.setDate(lostDate.getDate() + 2);
        const al = alasanLosts[Math.floor(Math.random() * alasanLosts.length)];

        await prisma.lead.update({
          where: { id: lead.id },
          data: {
            alasan_lost_id: al.id,
            nama_alasan_lost: al.nama,
            tanggal_lost: lostDate,
            catatan_lost: 'Customer tidak ada respons setelah beberapa kali follow up.',
            diubah_oleh: sales.nama,
            diubah_tanggal: lostDate
          }
        });
      }

      // Reminder untuk OPEN leads
      if (status === 1) {
        const remDate = new Date();
        const dateType = Math.random();
        if (dateType < 0.3) remDate.setDate(remDate.getDate() - Math.floor(1 + Math.random() * 3));
        else if (dateType < 0.6) remDate.setHours(10 + Math.floor(Math.random() * 5), 0, 0, 0);
        else remDate.setDate(remDate.getDate() + Math.floor(1 + Math.random() * 4));

        const lastAct = await prisma.aktivitasLead.findFirst({
          where: { lead_id: lead.id },
          orderBy: { id: 'desc' }
        });

        if (lastAct) {
          await prisma.pengingat.create({
            data: {
              lead_id: lead.id,
              aktivitas_lead_id: lastAct.id,
              tanggal_pengingat: remDate,
              catatan: `Follow up lanjutan customer ${customerNama} - keputusan pembelian mesin.`,
              status: 'AKTIF',
              dibuat_oleh: sales.nama,
              dibuat_tanggal: new Date()
            }
          });
        }
      }

      totalCreated++;
    }

    console.log(`  ✓ Selesai ${target.label}: 50 lead dibuat`);
  }

  console.log(`\n✅ Total ${totalCreated} lead berhasil dibuat (50 Mei + 50 Juni 2026)!`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
