import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/jwt';
import { z } from 'zod';

const serialize = (data) => JSON.parse(JSON.stringify(data, (_, v) => typeof v === 'bigint' ? v.toString() : v));

// GET /api/pengingat - Daftar Pengingat & Summary sesuai Mockup
export async function GET(request) {
  try {
    const user = await getCurrentUser(request);
    if (!user) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || ''; // 'AKTIF', 'SELESAI', or empty for all
    const cabang_id = searchParams.get('cabang_id') || '';
    const sales_id = searchParams.get('sales_id') || '';
    const periode = searchParams.get('periode') || ''; // 'hari_ini', 'terlambat', 'besok', 'lainnya', 'selesai_hari_ini'
    const startDateStr = searchParams.get('startDate') || '';
    const endDateStr = searchParams.get('endDate') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    // Role-based filtering
    const role = user.role?.toLowerCase();
    let userFilter = {};
    if (role === 'sales') {
      userFilter = { lead: { user_id: BigInt(user.id) } };
    } else if (role === 'branch manager') {
      userFilter = { lead: { cabang_id: BigInt(user.cabang_id) } };
    }

    // Time boundaries (local date handling)
    const now = new Date();
    
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);
    
    const endOfToday = new Date(now);
    endOfToday.setHours(23, 59, 59, 999);

    const startOfTomorrow = new Date(now);
    startOfTomorrow.setDate(startOfTomorrow.getDate() + 1);
    startOfTomorrow.setHours(0, 0, 0, 0);

    const endOfTomorrow = new Date(now);
    endOfTomorrow.setDate(endOfTomorrow.getDate() + 1);
    endOfTomorrow.setHours(23, 59, 59, 999);

    // Sort configuration
    const sortField = searchParams.get('sortField') || 'tanggal_pengingat';
    const sortOrder = (searchParams.get('sortOrder') || 'asc') === 'asc' ? 'asc' : 'desc';

    // Build the dynamic where object
    let dateFilter = {};
    let statusFilter = status ? { status } : {};

    // Apply period filters
    if (periode === 'hari_ini') {
      statusFilter = { status: 'AKTIF' };
      dateFilter = { tanggal_pengingat: { gte: startOfToday, lte: endOfToday } };
    } else if (periode === 'terlambat') {
      statusFilter = { status: 'AKTIF' };
      dateFilter = { tanggal_pengingat: { lt: startOfToday } };
    } else if (periode === 'besok') {
      statusFilter = { status: 'AKTIF' };
      dateFilter = { tanggal_pengingat: { gte: startOfTomorrow, lte: endOfTomorrow } };
    } else if (periode === 'lainnya') {
      statusFilter = { status: 'AKTIF' };
      dateFilter = { tanggal_pengingat: { gt: endOfTomorrow } };
    } else if (periode === 'selesai_hari_ini') {
      statusFilter = { status: 'SELESAI' };
      // For completed today, we look at the modified date of the reminder
      dateFilter = { diubah_tanggal: { gte: startOfToday, lte: endOfToday } };
    } else if (startDateStr || endDateStr) {
      const gte = startDateStr ? new Date(`${startDateStr}T00:00:00`) : undefined;
      const lte = endDateStr ? new Date(`${endDateStr}T23:59:59.999`) : undefined;
      dateFilter = {
        tanggal_pengingat: {
          ...(gte ? { gte } : {}),
          ...(lte ? { lte } : {}),
        }
      };
    }

    let where = {
      ...userFilter,
      ...statusFilter,
      ...dateFilter,
      ...(cabang_id ? { lead: { cabang_id: BigInt(cabang_id) } } : {}),
      ...(sales_id ? { lead: { user_id: BigInt(sales_id) } } : {}),
      ...(search ? {
        OR: [
          { catatan: { contains: search } },
          { lead: { nomor: { contains: search } } },
          { lead: { customer: { nama: { contains: search } } } },
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
      if (colKey === 'lead.nomor') {
        if (operator === 'contains') condition = { lead: { nomor: { contains: value } } };
        else if (operator === 'equals') condition = { lead: { nomor: value } };
      } else if (colKey === 'lead.customer.nama') {
        if (operator === 'contains') condition = { lead: { customer: { nama: { contains: value } } } };
        else if (operator === 'equals') condition = { lead: { customer: { nama: value } } };
      } else if (operator === 'contains') condition = { [colKey]: { contains: value } };
      else if (operator === 'startsWith') condition = { [colKey]: { startsWith: value } };
      else if (operator === 'endsWith') condition = { [colKey]: { endsWith: value } };
      else if (operator === 'equals' || operator === 'eq') {
        condition = { [colKey]: colKey === 'cabang_id' || colKey === 'sales_id' ? BigInt(value) : value };
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
    if (sortField === 'lead.nomor') {
      orderByClause = { lead: { nomor: sortOrder } };
    } else if (sortField === 'lead.customer.nama') {
      orderByClause = { lead: { customer: { nama: sortOrder } } };
    } else {
      orderByClause[sortField] = sortOrder;
    }

    const reminders = await prisma.pengingat.findMany({
      where,
      include: {
        lead: {
          select: {
            id: true,
            nomor: true,
            status: true,
            fase: true,
            customer: {
              select: {
                id: true,
                nama: true,
                telepon: true,
                alamat: true,
              }
            },
            cabang: {
              select: {
                id: true,
                nama: true,
              }
            },
            user: {
              select: {
                id: true,
                nama: true,
              }
            }
          }
        }
      },
      orderBy: orderByClause,
      skip,
      take: limit,
    });

    // Summary counts for Mockup cards (regardless of page-level query filters, but obeying role-based userFilter)
    const [totalHariIni, totalTerlambat, totalBesok, totalSelesaiHariIni] = await Promise.all([
      // Hari Ini (AKTIF & today)
      prisma.pengingat.count({
        where: { ...userFilter, status: 'AKTIF', tanggal_pengingat: { gte: startOfToday, lte: endOfToday } }
      }),
      // Terlambat (AKTIF & < today)
      prisma.pengingat.count({
        where: { ...userFilter, status: 'AKTIF', tanggal_pengingat: { lt: startOfToday } }
      }),
      // Besok (AKTIF & tomorrow)
      prisma.pengingat.count({
        where: { ...userFilter, status: 'AKTIF', tanggal_pengingat: { gte: startOfTomorrow, lte: endOfTomorrow } }
      }),
      // Selesai Hari Ini (SELESAI & diubah_tanggal is today)
      prisma.pengingat.count({
        where: { ...userFilter, status: 'SELESAI', diubah_tanggal: { gte: startOfToday, lte: endOfToday } }
      })
    ]);

    const totalData = await prisma.pengingat.count({ where });
    const totalPages = Math.ceil(totalData / limit);

    return NextResponse.json({
      success: true,
      data: serialize(reminders),
      summary: { totalHariIni, totalTerlambat, totalBesok, totalSelesaiHariIni },
      pagination: { page, limit, totalData, totalPages },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, message: 'Terjadi kesalahan sistem' }, { status: 500 });
  }
}

const updateStatusSchema = z.object({
  id: z.string().min(1, 'ID pengingat wajib diisi.'),
  status: z.enum(['AKTIF', 'SELESAI']),
});

// POST /api/pengingat - Update status pengingat secara manual
export async function POST(request) {
  try {
    const user = await getCurrentUser(request);
    if (!user) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const parsed = updateStatusSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, message: 'Validasi gagal.', errors: parsed.error.flatten().fieldErrors }, { status: 422 });
    }

    const { id, status } = parsed.data;
    const pengingatId = BigInt(id);

    const pengingat = await prisma.pengingat.findUnique({
      where: { id: pengingatId },
      include: { lead: true }
    });

    if (!pengingat) return NextResponse.json({ success: false, message: 'Pengingat tidak ditemukan.' }, { status: 404 });

    // Access control
    const role = user.role?.toLowerCase();
    if (role === 'sales' && pengingat.lead.user_id !== BigInt(user.id)) {
      return NextResponse.json({ success: false, message: 'Forbidden.' }, { status: 403 });
    }
    if (role === 'branch manager' && pengingat.lead.cabang_id !== BigInt(user.cabang_id)) {
      return NextResponse.json({ success: false, message: 'Forbidden.' }, { status: 403 });
    }

    const updated = await prisma.pengingat.update({
      where: { id: pengingatId },
      data: {
        status,
        diubah_oleh: user.nama,
        diubah_tanggal: new Date(),
      }
    });

    return NextResponse.json({
      success: true,
      message: `Status pengingat berhasil diubah menjadi ${status}.`,
      data: serialize(updated)
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, message: 'Terjadi kesalahan sistem' }, { status: 500 });
  }
}
