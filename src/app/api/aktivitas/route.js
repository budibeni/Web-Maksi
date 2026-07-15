import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/jwt';

const serialize = (data) => JSON.parse(JSON.stringify(data, (_, v) => typeof v === 'bigint' ? v.toString() : v));

// GET /api/aktivitas - Riwayat Aktivitas Lead
export async function GET(request) {
  try {
    const user = await getCurrentUser(request);
    if (!user) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const cabang_id = searchParams.get('cabang_id') || '';
    const sales_id = searchParams.get('sales_id') || '';
    const hasil_interaksi_id = searchParams.get('hasil_interaksi_id') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    // Role-based filtering
    const role = user.role?.toLowerCase();
    let userFilter = {};
    if (role === 'sales') {
      userFilter = { user_id: BigInt(user.id) };
    } else if (role === 'branch manager') {
      userFilter = { lead: { cabang_id: BigInt(user.cabang_id) } };
    }

    const where = {
      ...userFilter,
      ...(cabang_id ? { lead: { cabang_id: BigInt(cabang_id) } } : {}),
      ...(sales_id ? { user_id: BigInt(sales_id) } : {}),
      ...(hasil_interaksi_id ? { hasil_interaksi_id: BigInt(hasil_interaksi_id) } : {}),
      ...(search ? {
        OR: [
          { catatan: { contains: search } },
          { hasil_interaksi: { contains: search } },
          { lead: { nomor: { contains: search } } },
          { lead: { customer: { nama: { contains: search } } } },
        ]
      } : {}),
    };

    const activities = await prisma.aktivitasLead.findMany({
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
              }
            },
            cabang: {
              select: {
                id: true,
                nama: true,
              }
            }
          }
        },
        hasil_interaksi_rel: {
          select: {
            id: true,
            nama: true,
            warna: true,
            ikon: true,
          }
        }
      },
      orderBy: { id: 'desc' },
      skip,
      take: limit,
    });

    const totalData = await prisma.aktivitasLead.count({ where });
    const totalPages = Math.ceil(totalData / limit);

    return NextResponse.json({
      success: true,
      data: serialize(activities),
      pagination: { page, limit, totalData, totalPages },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, message: 'Terjadi kesalahan sistem' }, { status: 500 });
  }
}
