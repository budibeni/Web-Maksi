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

    const where = {
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
      orderBy: { tanggal_pengingat: 'asc' },
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
