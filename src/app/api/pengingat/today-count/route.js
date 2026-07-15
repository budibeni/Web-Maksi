import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/jwt';

// GET /api/pengingat/today-count - Menghitung jumlah pengingat aktif yang jatuh tempo hari ini atau sebelumnya
export async function GET(request) {
  try {
    const user = await getCurrentUser(request);
    if (!user) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

    // Role-based filtering
    const role = user.role?.toLowerCase();
    let userFilter = {};
    if (role === 'sales') {
      userFilter = { lead: { user_id: BigInt(user.id) } };
    } else if (role === 'branch manager') {
      userFilter = { lead: { cabang_id: BigInt(user.cabang_id) } };
    }

    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    const count = await prisma.pengingat.count({
      where: {
        ...userFilter,
        status: 'AKTIF',
        tanggal_pengingat: {
          lte: endOfToday,
        },
      },
    });

    return NextResponse.json({
      success: true,
      count,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, message: 'Terjadi kesalahan sistem' }, { status: 500 });
  }
}
