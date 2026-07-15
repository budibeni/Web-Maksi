import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/jwt';

const serialize = (data) => JSON.parse(JSON.stringify(data, (_, v) => typeof v === 'bigint' ? v.toString() : v));

// GET /api/audit-log
export async function GET(request) {
  try {
    const user = await getCurrentUser(request);
    if (!user) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

    // Only Admin can read all audit logs
    const roleNama = user.role?.toLowerCase() || '';
    if (roleNama !== 'administrator') {
      return NextResponse.json({ success: false, message: 'Forbidden. Hanya Administrator yang dapat mengakses riwayat audit.' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const modul = searchParams.get('modul') || '';
    const aksi = searchParams.get('aksi') || '';
    const user_id = searchParams.get('user_id') || '';
    const startDate = searchParams.get('startDate') || '';
    const endDate = searchParams.get('endDate') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '25');
    const skip = (page - 1) * limit;

    const where = {
      ...(search ? {
        OR: [
          { nama_user: { contains: search } },
          { deskripsi: { contains: search } },
        ]
      } : {}),
      ...(modul ? { modul } : {}),
      ...(aksi ? { aksi } : {}),
      ...(user_id ? { user_id: BigInt(user_id) } : {}),
      ...(startDate && endDate ? {
        dibuat_tanggal: {
          gte: new Date(`${startDate}T00:00:00`),
          lte: new Date(`${endDate}T23:59:59`)
        }
      } : {}),
    };

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: {
          user: {
            select: { id: true, nama: true, role: { select: { nama: true } } }
          }
        },
        orderBy: { dibuat_tanggal: 'desc' },
        skip,
        take: limit
      }),
      prisma.auditLog.count({ where })
    ]);

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      success: true,
      data: serialize(logs),
      pagination: { page, limit, total, totalPages }
    });
  } catch (error) {
    console.error('GET AuditLog Error:', error);
    return NextResponse.json({ success: false, message: 'Terjadi kesalahan sistem.' }, { status: 500 });
  }
}
