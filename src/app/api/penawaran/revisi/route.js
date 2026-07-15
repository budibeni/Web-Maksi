import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/jwt';
import { z } from 'zod';

const serialize = (data) => JSON.parse(JSON.stringify(data, (_, v) => typeof v === 'bigint' ? v.toString() : v));

const itemSchema = z.object({
  produk_id: z.string().or(z.number()),
  qty: z.number().min(1, 'Jumlah minimal 1.'),
  diskon_persen: z.number().min(0).max(100).optional().default(0),
  diskon_nominal: z.number().min(0).optional().default(0),
});

const revisionSchema = z.object({
  versi_penawaran_id: z.string().or(z.number()),
  masa_berlaku: z.number().min(1).optional().default(30),
  diskon_persen: z.number().min(0).max(100).optional().default(0),
  diskon_nominal: z.number().min(0).optional().default(0),
  ppn_persen: z.number().min(0).max(100).optional().default(11),
  dp_persen: z.number().min(0).max(100).optional().default(0),
  dp_nominal: z.number().min(0).optional().default(0),
  catatan: z.string().optional(),
  items: z.array(itemSchema).min(1, 'Pilih minimal 1 produk.'),
});

// POST /api/penawaran/revisi - Buat Revisi Penawaran
export async function POST(request) {
  try {
    const user = await getCurrentUser(request);
    if (!user) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const parsed = revisionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, message: 'Validasi gagal.', errors: parsed.error.flatten().fieldErrors }, { status: 422 });
    }

    const { versi_penawaran_id, masa_berlaku, diskon_persen, diskon_nominal, ppn_persen, dp_persen, dp_nominal, catatan, items } = parsed.data;
    const oldQuotationId = BigInt(versi_penawaran_id);

    // Fetch old quotation
    const oldQuotation = await prisma.versiPenawaran.findUnique({
      where: { id: oldQuotationId },
      include: {
        lead: {
          include: {
            cabang: true,
            customer: true,
            user: true,
          }
        }
      }
    });

    if (!oldQuotation) return NextResponse.json({ success: false, message: 'Penawaran sebelumnya tidak ditemukan.' }, { status: 404 });
    
    const lead = oldQuotation.lead;
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

      // Determine price
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

    // Find the next version number
    const maxVersi = await prisma.versiPenawaran.aggregate({
      where: { nomor: oldQuotation.nomor },
      _max: { versi: true },
    });
    const nextVersi = (maxVersi._max.versi || oldQuotation.versi) + 1;

    // Save using Transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create new VersiPenawaran
      const q = await tx.versiPenawaran.create({
        data: {
          nomor: oldQuotation.nomor,
          lead_id: lead.id,
          versi: nextVersi,
          customer_nama: lead.customer.nama,
          customer_telepon: lead.customer.telepon,
          customer_alamat: lead.customer.alamat,
          sales_nama: lead.user.nama,
          cabang_nama: lead.cabang.nama,
          masa_berlaku,
          subtotal: subtotalQuotation,
          diskon_persen,
          diskon_nominal: discHeaderNominal,
          ppn_persen,
          ppn_nominal: ppnNominal,
          grand_total: grandTotal,
          dp_persen,
          dp_nominal: dpHeaderNominal,
          catatan: catatan || null,
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

      // 3. Update Lead (versi_penawaran_final_id points to the new revision)
      await tx.lead.update({
        where: { id: lead.id },
        data: {
          versi_penawaran_final_id: q.id,
          diubah_oleh: user.nama,
          diubah_tanggal: new Date(),
        },
      });

      // 4. Create AktivitasLead record for revision
      const hi = await tx.hasilInteraksi.findFirst({ where: { kode: 'PENAWARAN' } });
      const hiId = hi ? hi.id : 3n;

      await tx.aktivitasLead.create({
        data: {
          lead_id: lead.id,
          user_id: BigInt(user.id),
          hasil_interaksi_id: hiId,
          hasil_interaksi: `Revisi penawaran`,
          catatan: `Merevisi Penawaran ${oldQuotation.nomor} menjadi Versi ${nextVersi}. Nilai Penawaran Baru: Rp ${Number(grandTotal).toLocaleString('id-ID')}. ${catatan || ''}`,
          dibuat_oleh: user.nama,
        },
      });

      return q;
    });

    return NextResponse.json({
      success: true,
      message: 'Revisi penawaran berhasil dibuat.',
      data: serialize(result),
    }, { status: 201 });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, message: 'Terjadi kesalahan sistem' }, { status: 500 });
  }
}
