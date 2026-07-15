import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/jwt';
import { z } from 'zod';

const serialize = (data) => JSON.parse(JSON.stringify(data, (_, v) => typeof v === 'bigint' ? v.toString() : v));

// GET /api/pengingat - Daftar Pengingat & Summary
export async function GET(request) {
  try {
    const user = await getCurrentUser(request);
    if (!user) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || 'AKTIF'; // AKTIF, SELESAI, atau 'ALL'
    const cabang_id = searchParams.get('cabang_id') || '';
    const sales_id = searchParams.get('sales_id') || '';
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

    const where = {
      ...userFilter,
      ...(status !== 'ALL' ? { status } : {}),
      ...(cabang_id ? { lead: { cabang_id: BigInt(cabang_id) } } : {}),
      ...(sales_id ? { lead: { user_id: BigInt(sales_id) } } : {}),
      ...(search ? {
        OR: [
          { catatan: { contains: search } },
          { lead: { nomor: { contains: search } } },
          { lead: { customer: { nama: { contains: search } } } },
          { lead: { customer: { telepon: { contains: search } } } },
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

    // Summary counts
    const now = new Date();
    const [totalAktif, totalTerlambat, totalSelesai] = await Promise.all([
      prisma.pengingat.count({
        where: { ...userFilter, status: 'AKTIF' }
      }),
      prisma.pengingat.count({
        where: { ...userFilter, status: 'AKTIF', tanggal_pengingat: { lt: now } }
      }),
      prisma.pengingat.count({
        where: { ...userFilter, status: 'SELESAI' }
      })
    ]);

    const totalData = await prisma.pengingat.count({ where });
    const totalPages = Math.ceil(totalData / limit);

    return NextResponse.json({
      success: true,
      data: serialize(reminders),
      summary: { totalAktif, totalTerlambat, totalSelesai },
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
