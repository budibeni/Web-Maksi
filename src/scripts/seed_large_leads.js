const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  console.log('Starting seed of 100 leads with varied conditions...');

  // 1. Get or Create Sales Role
  let roleSales = await prisma.role.findFirst({ where: { nama: 'Sales' } });
  if (!roleSales) {
    roleSales = await prisma.role.create({
      data: { nama: 'Sales', keterangan: 'Hak akses Sales' }
    });
    console.log('Created Sales role');
  }

  // 2. Get Branches
  const cabangs = await prisma.cabang.findMany();
  if (cabangs.length === 0) {
    console.error('No branches found in DB. Please run standard seed first.');
    return;
  }

  // 3. Create 5 Mockup Sales Users if they don't exist
  const mockSalesNames = [
    { nama: 'Andi Setiawan', username: 'andi', telp: '085111222331', cabIndex: 0 },
    { nama: 'Budi Santoso', username: 'budi', telp: '085111222332', cabIndex: 1 % cabangs.length },
    { nama: 'Siti Aisyah', username: 'siti', telp: '085111222333', cabIndex: 2 % cabangs.length },
    { nama: 'Rizky Maulana', username: 'rizky', telp: '085111222334', cabIndex: 3 % cabangs.length },
    { nama: 'Dewi Lestari', username: 'dewi', telp: '085111222335', cabIndex: 4 % cabangs.length }
  ];

  const salesUsers = [];
  const passwordHash = await bcrypt.hash('password123', 10);

  for (const mock of mockSalesNames) {
    let u = await prisma.user.findUnique({ where: { username: mock.username } });
    if (!u) {
      u = await prisma.user.create({
        data: {
          cabang_id: cabangs[mock.cabIndex].id,
          role_id: roleSales.id,
          nama: mock.nama,
          username: mock.username,
          telepon: mock.telp,
          password: passwordHash
        }
      });
      console.log(`Created user ${mock.nama}`);
    }
    salesUsers.push(u);
  }

  // Add Administrator as fallback user
  const adminUser = await prisma.user.findFirst({ where: { role: { nama: 'Administrator' } } });
  if (adminUser) salesUsers.push(adminUser);

  // 4. Get Products and Alasan Lost
  const products = await prisma.produk.findMany({ include: { kategori: true } });
  const alasanLosts = await prisma.alasanLost.findMany();
  const hasilInteraksis = await prisma.hasilInteraksi.findMany();

  if (products.length === 0 || alasanLosts.length === 0 || hasilInteraksis.length === 0) {
    console.error('Products, Alasan Lost, or Hasil Interaksi table is empty. Seeding failed.');
    return;
  }

  // 5. Generate 100 Leads
  const companyPrefixes = ['CV', 'PT', 'UD', 'Toko', 'Bpk', 'Ibu'];
  const companyNames = [
    'Maju Jaya', 'Berkah Abadi', 'Mandiri Perkasa', 'Sumber Rejeki', 'Sejahtera Teknik',
    'Cahaya Abadi', 'Karya Bersama', 'Indo Makmur', 'Sentosa Jaya', 'Mega Perkasa',
    'Bintang Mulia', 'Makmur Sentosa', 'Tunas Harapan', 'Sinar Mas', 'Jaya Abadi',
    'Agro Industri', 'Pangan Lestari', 'Karya Mandiri', 'Bumi Raya', 'Duta Niaga'
  ];

  const productNotes = [
    'Tanya spesifikasi mesin box dryer',
    'Ingin nego harga continuous sealer',
    'Minta brosur mesin packing otomatis',
    'Tanya garansi gilingan limbah',
    'Butuh penawaran mixer abon stainless'
  ];

  const months = [0, 1, 2, 3, 4, 5, 6]; // Jan to Jul 2026

  for (let i = 1; i <= 100; i++) {
    // Random status: 55% Deal (2), 25% Lost (3), 20% Open (1)
    const rand = Math.random();
    let status = 1; // Open
    if (rand < 0.55) status = 2; // Deal
    else if (rand < 0.80) status = 3; // Lost

    // Random Cabang and Sales
    const sales = salesUsers[Math.floor(Math.random() * salesUsers.length)];
    const cabang = cabangs.find(c => c.id === sales.cabang_id) || cabangs[0];

    // Customer
    const companyPref = companyPrefixes[Math.floor(Math.random() * companyPrefixes.length)];
    const companyBase = companyNames[Math.floor(Math.random() * companyNames.length)];
    const customerNama = `${companyPref} ${companyBase} ${String(i).padStart(3, '0')}`;
    const customerTelepon = `0812${String(Math.floor(10000000 + Math.random() * 90000000))}`;
    const customerAlamat = `Jl. Sukses Makmur No. ${i}, Jawa Timur`;

    const customer = await prisma.customer.create({
      data: {
        nama: customerNama,
        telepon: customerTelepon,
        alamat: customerAlamat,
        catatan: `Customer prospek ke-${i}`,
        dibuat_oleh: 'System Seed'
      }
    });

    // Lead Dates (spread between Jan 2026 and Jul 2026)
    const month = months[Math.floor(Math.random() * months.length)];
    const day = Math.floor(1 + Math.random() * 27);
    const dateCreated = new Date(2026, month, day, 9 + Math.floor(Math.random() * 8), 0, 0);

    // Document Numbering
    const yy = '26';
    const mm = String(month + 1).padStart(2, '0');
    const leadNomor = `LD-${yy}${mm}-${String(i).padStart(4, '0')}`;

    // Create Lead
    const lead = await prisma.lead.create({
      data: {
        nomor: leadNomor,
        customer_id: customer.id,
        cabang_id: cabang.id,
        user_id: sales.id,
        status_customer: Math.random() > 0.4 ? 'BARU' : 'EXISTING',
        status: status,
        fase: status === 2 ? 3 : (status === 3 ? 2 : Math.floor(1 + Math.random() * 3)),
        catatan_awal: productNotes[Math.floor(Math.random() * productNotes.length)],
        dibuat_oleh: sales.nama,
        dibuat_tanggal: dateCreated
      }
    });

    // Create follow up timeline activities (1 to 4 items)
    const actCount = Math.floor(1 + Math.random() * 4);
    let lastActDate = new Date(dateCreated);

    for (let k = 1; k <= actCount; k++) {
      lastActDate = new Date(lastActDate);
      lastActDate.setDate(lastActDate.getDate() + Math.floor(1 + Math.random() * 4));
      
      const hi = hasilInteraksis[Math.floor(Math.random() * hasilInteraksis.length)];

      await prisma.aktivitasLead.create({
        data: {
          lead_id: lead.id,
          user_id: sales.id,
          hasil_interaksi_id: hi.id,
          hasil_interaksi: hi.nama,
          catatan: `Follow up ke-${k}: Diskusi mengenai kebutuhan unit. Customer respon ${hi.nama.toLowerCase()}.`,
          dibuat_oleh: sales.nama,
          dibuat_tanggal: lastActDate
        }
      });
    }

    // Handle Quotation (Penawaran)
    // Create a VersiPenawaran for ALL deal leads, and 75% of lost/open leads
    if (status === 2 || Math.random() > 0.25) {
      const qNomor = `QT-${cabang.kode}-${yy}${mm}-${String(i).padStart(4, '0')}`;
      const qDate = new Date(lastActDate);
      qDate.setHours(qDate.getHours() + 1);

      // Select random products
      const itemDetails = [];
      let subtotalVal = 0;
      const numProducts = Math.floor(1 + Math.random() * 2);
      const selectedProducts = [];
      
      for (let pIdx = 0; pIdx < numProducts; pIdx++) {
        const prod = products[Math.floor(Math.random() * products.length)];
        if (!selectedProducts.includes(prod.id)) {
          selectedProducts.push(prod.id);
          const qty = Math.floor(1 + Math.random() * 3);
          const price = Number(prod.harga_default);
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
      }

      const ppnNominal = subtotalVal * 0.11;
      const grandTotal = subtotalVal + ppnNominal;
      const dpNominal = grandTotal * 0.3; // 30% DP

      // Save VersiPenawaran
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
          catatan: `Penawaran harga untuk mesin Maksindo ke-${i}`,
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

      // Save DetailPenawaran
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

      // Update Lead with final penawaran link
      let updateData = {
        versi_penawaran_final_id: quotation.id
      };

      if (status === 2) { // DEAL
        const dealDate = new Date(qDate);
        dealDate.setDate(dealDate.getDate() + Math.floor(2 + Math.random() * 8));
        
        updateData.status = 2;
        updateData.nilai_deal = grandTotal;
        updateData.tanggal_deal = dealDate;
        updateData.diubah_oleh = sales.nama;
        updateData.diubah_tanggal = dealDate;

        // Save activity deal
        await prisma.aktivitasLead.create({
          data: {
            lead_id: lead.id,
            user_id: sales.id,
            hasil_interaksi_id: 4n, // Siap membeli
            hasil_interaksi: 'Siap membeli',
            catatan: `Lead Deal disetujui. Nilai closing deal: Rp ${grandTotal.toLocaleString('id-ID')}`,
            dibuat_oleh: sales.nama,
            dibuat_tanggal: dealDate
          }
        });
      } else if (status === 3) { // LOST
        const lostDate = new Date(qDate);
        lostDate.setDate(lostDate.getDate() + Math.floor(1 + Math.random() * 5));
        const al = alasanLosts[Math.floor(Math.random() * alasanLosts.length)];

        updateData.status = 3;
        updateData.alasan_lost_id = al.id;
        updateData.nama_alasan_lost = al.nama;
        updateData.nilai_lost = grandTotal;
        updateData.tanggal_lost = lostDate;
        updateData.catatan_lost = 'Batal membeli karena budget dialokasikan ke kebutuhan lain.';
        updateData.diubah_oleh = sales.nama;
        updateData.diubah_tanggal = lostDate;
      }

      await prisma.lead.update({
        where: { id: lead.id },
        data: updateData
      });
    } else if (status === 3) { // Lost but no Penawaran (lost in early follow up)
      const lostDate = new Date(lastActDate);
      lostDate.setDate(lostDate.getDate() + Math.floor(1 + Math.random() * 3));
      const al = alasanLosts[Math.floor(Math.random() * alasanLosts.length)];

      await prisma.lead.update({
        where: { id: lead.id },
        data: {
          status: 3,
          alasan_lost_id: al.id,
          nama_alasan_lost: al.nama,
          tanggal_lost: lostDate,
          catatan_lost: 'Customer tidak merespon follow up berkali-kali.',
          diubah_oleh: sales.nama,
          diubah_tanggal: lostDate
        }
      });
    }

    // For OPEN leads (status === 1), create an active Pengingat (Reminder)
    if (status === 1) {
      const remDate = new Date();
      // Distribute reminder dates: some in the past (overdue), some today, some tomorrow/future
      const dateType = Math.random();
      if (dateType < 0.3) {
        // Overdue (e.g. 2 to 5 days ago)
        remDate.setDate(remDate.getDate() - Math.floor(2 + Math.random() * 3));
      } else if (dateType < 0.6) {
        // Today (at a random hour)
        remDate.setHours(9 + Math.floor(Math.random() * 6), 0, 0, 0);
      } else {
        // Tomorrow or future (2 to 4 days ahead)
        remDate.setDate(remDate.getDate() + Math.floor(1 + Math.random() * 3));
      }

      // Find the last activity of this lead to link
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
            catatan: `Jadwalkan follow up kembali dengan customer ${customerNama} untuk menanyakan keputusan pembelian.`,
            status: 'AKTIF',
            dibuat_oleh: sales.nama,
            dibuat_tanggal: new Date()
          }
        });
      }
    }
  }

  console.log('Successfully seeded 100 leads with full activities, quotations, and reminders!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
