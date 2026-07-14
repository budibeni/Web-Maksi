import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/jwt';

// GET /api/customer/search?q=nama_atau_telepon
export async function GET(request) {
  try {
    const user = await getCurrentUser(request);
    if (!user) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q') || '';

    if (q.length < 2) {
      return NextResponse.json({ success: true, data: [] });
    }

    const customers = await prisma.customer.findMany({
      where: {
        OR: [
          { nama: { contains: q } },
          { telepon: { contains: q } },
        ],
      },
      select: {
        id: true,
        nama: true,
        telepon: true,
        alamat: true,
        leads: {
          select: { id: true, status: true },
        },
      },
      take: 10,
      orderBy: { nama: 'asc' },
    });

    // Serialize BigInt
    const data = JSON.parse(JSON.stringify(customers, (_, v) => typeof v === 'bigint' ? v.toString() : v));

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, message: 'Terjadi kesalahan sistem' }, { status: 500 });
  }
}
