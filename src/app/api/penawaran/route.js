import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/jwt';
import { z } from 'zod';

const serialize = (data) => JSON.parse(JSON.stringify(data, (_, v) => typeof v === 'bigint' ? v.toString() : v));

// Generate nomor penawaran: QT-[KODE_CABANG]-[YY][MM]-[NNNN]
async function generateNomorPenawaran(cabangKode) {
  const now = new Date();
  const yy = String(now.getFullYear()).slice(2);
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const prefix = `QT-${cabangKode}-${yy}${mm}-`;
  
  const last = await prisma.versiPenawaran.findFirst({
    where: { nomor: { startsWith: prefix } },
    orderBy: { id: 'desc' },
  });
  
  let seq = 1;
  if (last) {
    const lastSeq = parseInt(last.nomor.split('-').pop(), 10);
    seq = lastSeq + 1;
  }
  return `${prefix}${String(seq).padStart(4, '0')}`;
}

const itemSchema = z.object({
  produk_id: z.string().or(z.number()),
  qty: z.number().min(1, 'Jumlah minimal 1.'),
  diskon_persen: z.number().min(0).max(100).optional().default(0),
  diskon_nominal: z.number().min(0).optional().default(0),
});

const quotationSchema = z.object({
  lead_id: z.string().or(z.number()),
  masa_berlaku: z.number().min(1).optional().default(30),
  diskon_persen: z.number().min(0).max(100).optional().default(0),
  diskon_nominal: z.number().min(0).optional().default(0),
  ppn_persen: z.number().min(0).max(100).optional().default(11),
  dp_persen: z.number().min(0).max(100).optional().default(0),
  dp_nominal: z.number().min(0).optional().default(0),
  catatan: z.string().optional(),
  items: z.array(itemSchema).min(1, 'Pilih minimal 1 produk.'),
});

// POST /api/penawaran - Buat Penawaran Pertama (Versi 1)
export async function POST(request) {
  try {
    const user = await getCurrentUser(request);
    if (!user) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const parsed = quotationSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, message: 'Validasi gagal.', errors: parsed.error.flatten().fieldErrors }, { status: 422 });
    }

    const { lead_id, masa_berlaku, diskon_persen, diskon_nominal, ppn_persen, dp_persen, dp_nominal, catatan, items } = parsed.data;
    const leadId = BigInt(lead_id);

    // Get Lead
    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      include: {
        cabang: true,
        customer: true,
        user: true,
      },
    });

    if (!lead) return NextResponse.json({ success: false, message: 'Lead tidak ditemukan.' }, { status: 404 });
    if (lead.status !== 1) return NextResponse.json({ success: false, message: 'Lead sudah berstatus DEAL atau LOST.' }, { status: 400 });

    // Fetch product details and prices
    const itemDetails = [];
    let subtotalQuotation = 0;

    for (const item of items) {
      const pId = BigInt(item.produk_id);
      const produk = await prisma.produk.findUnique({
        where: { id: pId },
        include: { kategori: true, harga_cabangs: { where: { cabang_id: lead.cabang_id } } },
      });

      if (!produk) return NextResponse.json({ success: false, message: `Produk dengan ID ${item.produk_id} tidak ditemukan.` }, { status: 404 });
      if (produk.aktif !== 1) return NextResponse.json({ success: false, message: `Produk ${produk.nama} sudah tidak aktif.` }, { status: 400 });

      // Determine price (Branch price vs Default price)
      const hargaCabang = produk.harga_cabangs[0]?.harga;
      const hargaFinal = hargaCabang !== undefined ? Number(hargaCabang) : Number(produk.harga_default);

      // Calculations for item
      const bruto = item.qty * hargaFinal;
      let discNominal = item.diskon_nominal;
      if (item.diskon_persen > 0) {
        discNominal = bruto * (item.diskon_persen / 100);
      }
      const subtotalItem = bruto - discNominal;

      subtotalQuotation += subtotalItem;

      itemDetails.push({
        produk_id: pId,
        kategori_produk_nama: produk.kategori.nama,
        kode_produk: produk.kode,
        nama_produk: produk.nama,
        satuan: produk.satuan,
        qty: item.qty,
        harga: hargaFinal,
        diskon_persen: item.diskon_persen,
        diskon_nominal: discNominal,
        subtotal: subtotalItem,
      });
    }

    // Header level discounts & totals
    let discHeaderNominal = diskon_nominal;
    if (diskon_persen > 0) {
      discHeaderNominal = subtotalQuotation * (diskon_persen / 100);
    }
    const dpp = subtotalQuotation - discHeaderNominal;
    const ppnNominal = dpp * (ppn_persen / 100);
    const grandTotal = dpp + ppnNominal;

    let dpHeaderNominal = dp_nominal;
    if (dp_persen > 0) {
      dpHeaderNominal = grandTotal * (dp_persen / 100);
    }

    // Generate quotation number
    const nomor = await generateNomorPenawaran(lead.cabang.kode);

    // Save using Transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create VersiPenawaran
      const q = await tx.versiPenawaran.create({
        data: {
          nomor,
          lead_id: leadId,
          versi: 1,
          customer_nama: lead.customer.nama,
          customer_telepon: lead.customer.telepon,
          customer_alamat: lead.customer.alamat,
          sales_nama: lead.user.nama,
          cabang_nama: lead.cabang.nama,
          catatan: catatan || null,
          masa_berlaku,
          subtotal: subtotalQuotation,
          diskon_persen,
          diskon_nominal: discHeaderNominal,
          ppn_persen,
          ppn_nominal: ppnNominal,
          grand_total: grandTotal,
          dp_persen,
          dp_nominal: dpHeaderNominal,
          dibuat_oleh: user.nama,
        },
      });

      // 2. Create DetailPenawarans
      for (const item of itemDetails) {
        await tx.detailPenawaran.create({
          data: {
            versi_penawaran_id: q.id,
            produk_id: item.produk_id,
            kategori_produk_nama: item.kategori_produk_nama,
            kode_produk: item.kode_produk,
            nama_produk: item.nama_produk,
            satuan: item.satuan,
            qty: item.qty,
            harga: item.harga,
            diskon_persen: item.diskon_persen,
            diskon_nominal: item.diskon_nominal,
            subtotal: item.subtotal,
            dibuat_oleh: user.nama,
          },
        });
      }

      // 3. Update Lead (Fase to PENAWARAN (3), and versi_penawaran_final_id)
      await tx.lead.update({
        where: { id: leadId },
        data: {
          fase: 3, // PENAWARAN
          versi_penawaran_final_id: q.id,
          diubah_oleh: user.nama,
          diubah_tanggal: new Date(),
        },
      });

      // 4. Create AktivitasLead record
      // Find the "Hasil Interaksi" for "Minta Penawaran" (code PENAWARAN) to get proper hasil_interaksi_id
      const hi = await tx.hasilInteraksi.findFirst({ where: { kode: 'PENAWARAN' } });
      const hiId = hi ? hi.id : 3n; // fallback to 3n if not found

      await tx.aktivitasLead.create({
        data: {
          lead_id: leadId,
          user_id: BigInt(user.id),
          hasil_interaksi_id: hiId,
          hasil_interaksi: `Minta penawaran`,
          catatan: `Membuat Penawaran Baru ${nomor} (v1). Nilai Penawaran: Rp ${Number(grandTotal).toLocaleString('id-ID')}. ${catatan || ''}`,
          dibuat_oleh: user.nama,
        },
      });

      return q;
    });

    return NextResponse.json({
      success: true,
      message: 'Penawaran berhasil dibuat.',
      data: serialize(result),
    }, { status: 201 });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, message: 'Terjadi kesalahan sistem' }, { status: 500 });
  }
}
