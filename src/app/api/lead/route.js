import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/jwt';
import { recordAuditLog } from '@/lib/audit';
import { z } from 'zod';

const serialize = (data) => JSON.parse(JSON.stringify(data, (_, v) => typeof v === 'bigint' ? v.toString() : v));

// Generate nomor lead: LD-YYMM-XXXX
async function generateNomorLead() {
  const now = new Date();
  const yy = String(now.getFullYear()).slice(2);
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const prefix = `LD-${yy}${mm}-`;
  
  const last = await prisma.lead.findFirst({
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

const leadSchema = z.object({
  customer_id: z.string().optional(), // jika undefined, buat customer baru
  nama_customer: z.string().min(1, 'Nama customer wajib diisi.'),
  telepon_customer: z.string().min(1, 'Nomor HP wajib diisi.'),
  alamat_customer: z.string().optional(),
  kebutuhan: z.array(z.string()).optional(),
  hasil_interaksi_pertama_id: z.string().min(1, 'Hasil interaksi wajib dipilih.'),
  catatan_awal: z.string().optional(),
});

// GET /api/lead — Daftar Lead OPEN
export async function GET(request) {
  try {
    const user = await getCurrentUser(request);
    if (!user) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const fase = searchParams.get('fase') || ''; // 1=LEAD_BARU, 2=FOLLOW_UP, 3=PENAWARAN
    const sales_id = searchParams.get('sales_id') || '';
    const cabang_id = searchParams.get('cabang_id') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const sortField = searchParams.get('sortField') || 'id';
    const sortOrder = (searchParams.get('sortOrder') || 'desc') === 'asc' ? 'asc' : 'desc';
    const skip = (page - 1) * limit;

    // Role-based filter
    const role = user.role?.toLowerCase();
    let userFilter = {};
    if (role === 'sales') {
      userFilter = { user_id: BigInt(user.id) };
    } else if (role === 'branch manager') {
      userFilter = { cabang_id: BigInt(user.cabang_id) };
    }

    let where = {
      status: 1, // OPEN only
      ...userFilter,
      ...(fase ? { fase: parseInt(fase) } : {}),
      ...(sales_id ? { user_id: BigInt(sales_id) } : {}),
      ...(cabang_id ? { cabang_id: BigInt(cabang_id) } : {}),
      ...(search ? {
        OR: [
          { nomor: { contains: search } },
          { customer: { nama: { contains: search } } },
          { customer: { telepon: { contains: search } } },
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
      if (colKey === 'customer.nama') {
        if (operator === 'contains') condition = { customer: { nama: { contains: value } } };
        else if (operator === 'equals') condition = { customer: { nama: value } };
      } else if (colKey === 'user.nama') {
        if (operator === 'contains') condition = { user: { nama: { contains: value } } };
        else if (operator === 'equals') condition = { user: { nama: value } };
      } else if (colKey === 'cabang.nama') {
        if (operator === 'contains') condition = { cabang: { nama: { contains: value } } };
        else if (operator === 'equals') condition = { cabang: { nama: value } };
      } else if (colKey === 'fase') {
        condition = { fase: parseInt(value) };
      } else if (operator === 'contains') condition = { [colKey]: { contains: value } };
      else if (operator === 'startsWith') condition = { [colKey]: { startsWith: value } };
      else if (operator === 'endsWith') condition = { [colKey]: { endsWith: value } };
      else if (operator === 'equals' || operator === 'eq') {
        condition = { [colKey]: colKey === 'cabang_id' || colKey === 'user_id' ? BigInt(value) : value };
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

    let orderByClause = {};
    if (sortField === 'customer.nama') {
      orderByClause = { customer: { nama: sortOrder } };
    } else if (sortField === 'user.nama') {
      orderByClause = { user: { nama: sortOrder } };
    } else if (sortField === 'cabang.nama') {
      orderByClause = { cabang: { nama: sortOrder } };
    } else {
      orderByClause[sortField] = sortOrder;
    }

    const leads = await prisma.lead.findMany({
      where,
      include: {
        customer: { select: { id: true, nama: true, telepon: true } },
        cabang: { select: { id: true, nama: true } },
        user: { select: { id: true, nama: true } },
        pengingats: {
          where: { status: 'AKTIF' },
          orderBy: { tanggal_pengingat: 'asc' },
          take: 1,
        },
      },
      orderBy: orderByClause,
      skip,
      take: limit,
    });

    // Summary count per fase (open only)
    const [totalOpen, totalLeadBaru, totalFollowUp, totalPenawaran] = await Promise.all([
      prisma.lead.count({ where: { status: 1, ...userFilter } }),
      prisma.lead.count({ where: { status: 1, fase: 1, ...userFilter } }),
      prisma.lead.count({ where: { status: 1, fase: 2, ...userFilter } }),
      prisma.lead.count({ where: { status: 1, fase: 3, ...userFilter } }),
    ]);

    const totalData = await prisma.lead.count({ where });
    const totalPages = Math.ceil(totalData / limit);

    return NextResponse.json({
      success: true,
      data: serialize(leads),
      summary: { totalOpen, totalLeadBaru, totalFollowUp, totalPenawaran },
      pagination: { page, limit, totalData, totalPages },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, message: 'Terjadi kesalahan sistem' }, { status: 500 });
  }
}

// POST /api/lead — Tambah Lead Baru
export async function POST(request) {
  try {
    const user = await getCurrentUser(request);
    if (!user) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

    const role = (user.role || '').toLowerCase();
    if (role === 'top management') {
      return NextResponse.json({ success: false, message: 'Top Management tidak diperbolehkan melakukan modifikasi data.' }, { status: 403 });
    }

    const body = await request.json();
    const parsed = leadSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, message: 'Validasi gagal.', errors: parsed.error.flatten().fieldErrors }, { status: 422 });
    }

    const { customer_id, nama_customer, telepon_customer, alamat_customer, kebutuhan, hasil_interaksi_pertama_id, catatan_awal } = parsed.data;

    // Cek hasil interaksi
    const hasilInteraksi = await prisma.hasilInteraksi.findUnique({ where: { id: BigInt(hasil_interaksi_pertama_id) } });
    if (!hasilInteraksi) {
      return NextResponse.json({ success: false, message: 'Hasil interaksi tidak ditemukan.' }, { status: 404 });
    }

    // Tentukan fase awal berdasarkan hasil interaksi
    const faseMap = { LEAD_BARU: 1, FOLLOW_UP: 2, PENAWARAN: 3 };
    const faseAwal = faseMap[hasilInteraksi.fase_lead] || 1;

    // Resolve customer
    let customerId;
    let statusCustomer = 'BARU';

    if (customer_id) {
      // Customer existing dipilih
      customerId = BigInt(customer_id);
      statusCustomer = 'EXISTING';
    } else {
      // Cek apakah customer dengan nama + telepon sudah ada
      const existing = await prisma.customer.findFirst({
        where: { telepon: telepon_customer },
      });
      if (existing) {
        customerId = existing.id;
        statusCustomer = 'EXISTING';
      } else {
        // Buat customer baru
        const newCustomer = await prisma.customer.create({
          data: {
            nama: nama_customer,
            telepon: telepon_customer,
            alamat: alamat_customer || null,
            dibuat_oleh: user.nama,
          },
        });
        customerId = newCustomer.id;
        statusCustomer = 'BARU';
      }
    }

    const nomor = await generateNomorLead();
    
    let cabangId;
    if (user.cabang_id) {
      cabangId = BigInt(user.cabang_id);
    } else {
      const dbUser = await prisma.user.findUnique({
        where: { id: BigInt(user.id) },
        select: { cabang_id: true }
      });
      if (!dbUser) return NextResponse.json({ success: false, message: 'User tidak valid.' }, { status: 400 });
      cabangId = dbUser.cabang_id;
    }

    const userId = BigInt(user.id);

    const lead = await prisma.lead.create({
      data: {
        nomor,
        customer_id: customerId,
        cabang_id: cabangId,
        user_id: userId,
        status_customer: statusCustomer,
        status: 1, // OPEN
        fase: faseAwal,
        kebutuhan: kebutuhan && kebutuhan.length > 0 ? JSON.stringify(kebutuhan) : null,
        catatan_awal: catatan_awal || null,
        dibuat_oleh: user.nama,
      },
    });

    // Simpan aktivitas pertama
    await prisma.aktivitasLead.create({
      data: {
        lead_id: lead.id,
        user_id: userId,
        hasil_interaksi_id: BigInt(hasil_interaksi_pertama_id),
        hasil_interaksi: hasilInteraksi.nama,
        catatan: catatan_awal || null,
        dibuat_oleh: user.nama,
      },
    });

    // Record Audit Log
    await recordAuditLog({
      user,
      modul: "LEAD",
      aksi: "CREATE",
      referensi_id: lead.id,
      deskripsi: `Membuat lead baru: ${nomor} untuk customer ID ${customerId}`,
      data_sesudah: lead,
      request
    });

    return NextResponse.json({
      success: true,
      message: 'Lead berhasil dibuat.',
      data: serialize(lead),
    }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, message: 'Terjadi kesalahan sistem' }, { status: 500 });
  }
}
