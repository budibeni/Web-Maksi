import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/jwt';
import { recordAuditLog } from '@/lib/audit';
import { z } from 'zod';

const serialize = (data) => JSON.parse(JSON.stringify(data, (_, v) => typeof v === 'bigint' ? v.toString() : v));

// GET /api/penawaran - Daftar Seluruh Penawaran Harga
export async function GET(request) {
  try {
    const user = await getCurrentUser(request);
    if (!user) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const sales_id = searchParams.get('sales_id') || '';
    const cabang_id = searchParams.get('cabang_id') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    const sortField = searchParams.get('sortField') || 'id';
    const sortOrder = (searchParams.get('sortOrder') || 'desc') === 'asc' ? 'asc' : 'desc';

    // Role-based access restriction
    const role = user.role?.toLowerCase();
    let userFilter = {};
    if (role === 'sales') {
      userFilter = { lead: { user_id: BigInt(user.id) } };
    } else if (role === 'branch manager') {
      userFilter = { lead: { cabang_id: BigInt(user.cabang_id) } };
    }

    let where = {
      ...userFilter,
      ...(sales_id ? { lead: { user_id: BigInt(sales_id) } } : {}),
      ...(cabang_id ? { lead: { cabang_id: BigInt(cabang_id) } } : {}),
      ...(search ? {
        OR: [
          { nomor: { contains: search } },
          { customer_nama: { contains: search } },
          { sales_nama: { contains: search } },
        ]
      } : {}),
    };

    // Parse column filters
    const filterConditions = [];
    const filterKeys = new Set();
    for (const [paramKey] of searchParams.entries()) {
      const match = paramKey.match(/^filter\[(.+?)\]\[operator\]$/);
      if (match) filterKeys.add(match[1]);
    }
    for (const colKey of filterKeys) {
      const operator = searchParams.get(`filter[${colKey}][operator]`);
      const value = searchParams.get(`filter[${colKey}][value]`);
      const value2 = searchParams.get(`filter[${colKey}][value2]`);
      if (!operator || value === null || value === '') continue;
      
      let condition = null;
      if (operator === 'contains') condition = { [colKey]: { contains: value } };
      else if (operator === 'startsWith') condition = { [colKey]: { startsWith: value } };
      else if (operator === 'endsWith') condition = { [colKey]: { endsWith: value } };
      else if (operator === 'equals' || operator === 'eq') {
        condition = { [colKey]: colKey === 'id' || colKey === 'lead_id' ? BigInt(value) : value };
      } else if (operator === 'gt') condition = { [colKey]: { gt: isNaN(Number(value)) ? value : Number(value) } };
      else if (operator === 'lt') condition = { [colKey]: { lt: isNaN(Number(value)) ? value : Number(value) } };
      else if (operator === 'between' && value2) condition = { [colKey]: { gte: Number(value), lte: Number(value2) } };
      else if (operator === 'in') {
        const parsedVals = value.split(',').map(v => isNaN(Number(v)) ? v : BigInt(v));
        condition = { [colKey]: { in: parsedVals } };
      } else if (operator === 'today') {
        const start = new Date(); start.setHours(0,0,0,0);
        const end = new Date(); end.setHours(23,59,59,999);
        condition = { [colKey]: { gte: start, lte: end } };
      } else if (operator === 'thisWeek') {
        const now = new Date();
        const start = new Date(now); start.setDate(now.getDate() - now.getDay()); start.setHours(0,0,0,0);
        const end = new Date(start); end.setDate(start.getDate() + 6); end.setHours(23,59,59,999);
        condition = { [colKey]: { gte: start, lte: end } };
      } else if (operator === 'thisMonth') {
        const now = new Date();
        const start = new Date(now.getFullYear(), now.getMonth(), 1);
        const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        condition = { [colKey]: { gte: start, lte: end } };
      } else if (operator === 'custom' && value && value2) {
        condition = { [colKey]: { gte: new Date(value), lte: new Date(value2 + 'T23:59:59') } };
      }
      if (condition) filterConditions.push(condition);
    }
    if (filterConditions.length > 0) {
      where = { AND: [where, ...filterConditions] };
    }

    const quotations = await prisma.versiPenawaran.findMany({
      where,
      include: {
        lead: {
          select: {
            id: true,
            nomor: true,
            status: true,
            versi_penawaran_final_id: true,
          }
        }
      },
      orderBy: { [sortField]: sortOrder },
      skip,
      take: limit,
    });

    const totalData = await prisma.versiPenawaran.count({ where });
    const totalPages = Math.ceil(totalData / limit);

    return NextResponse.json({
      success: true,
      data: serialize(quotations),
      pagination: { page, limit, totalData, totalPages },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, message: 'Terjadi kesalahan sistem' }, { status: 500 });
  }
}

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

    // Cek apakah lead sudah memiliki penawaran — jika ya, gunakan fitur Revisi
    const existingPenawaran = await prisma.versiPenawaran.findFirst({ where: { lead_id: leadId } });
    if (existingPenawaran) {
      return NextResponse.json({
        success: false,
        message: 'Lead ini sudah memiliki penawaran. Gunakan fitur Revisi untuk membuat penawaran baru.',
      }, { status: 400 });
    }

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
      // Cari HasilInteraksi dengan kode MINTA_PENAWARAN
      const hi = await tx.hasilInteraksi.findFirst({ where: { kode: 'MINTA_PENAWARAN', aktif: 1 } });
      if (hi) {
        await tx.aktivitasLead.create({
          data: {
            lead_id: leadId,
            user_id: BigInt(user.id),
            hasil_interaksi_id: hi.id,
            hasil_interaksi: hi.nama,
            catatan: `Membuat Penawaran Baru ${nomor} (v1). Nilai Penawaran: Rp ${Number(grandTotal).toLocaleString('id-ID')}. ${catatan || ''}`,
            dibuat_oleh: user.nama,
          },
        });
      }

      return q;
    });

    // Record Audit Log
    await recordAuditLog({
      user,
      modul: "PENAWARAN",
      aksi: "CREATE",
      referensi_id: result.id,
      deskripsi: `Membuat penawaran baru ${nomor} untuk lead ID ${leadId}`,
      data_sesudah: result,
      request
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
