import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/jwt';

const serialize = (data) => JSON.parse(JSON.stringify(data, (_, v) => typeof v === 'bigint' ? v.toString() : v));

// GET /api/lead/[id]
export async function GET(request, context) {
  try {
    const user = await getCurrentUser(request);
    if (!user) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

    const params = await context.params;
    const id = BigInt(params.id);

    const lead = await prisma.lead.findUnique({
      where: { id },
      include: {
        customer: true,
        cabang: { select: { id: true, nama: true, kode: true } },
        user: { select: { id: true, nama: true } },
        aktivitas_leads: {
          orderBy: { dibuat_tanggal: 'desc' },
          include: {
            pengingat: true,
          },
        },
        pengingats: {
          where: { status: 'AKTIF' },
          orderBy: { tanggal_pengingat: 'asc' },
          take: 1,
        },
      },
    });

    if (!lead) {
      return NextResponse.json({ success: false, message: 'Lead tidak ditemukan.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: serialize(lead) });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, message: 'Terjadi kesalahan sistem' }, { status: 500 });
  }
}

// DELETE /api/lead/[id]
export async function DELETE(request, context) {
  try {
    const user = await getCurrentUser(request);
    if (!user) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

    const params = await context.params;
    const id = BigInt(params.id);

    const lead = await prisma.lead.findUnique({
      where: { id },
      include: { aktivitas_leads: { take: 1 } },
    });

    if (!lead) return NextResponse.json({ success: false, message: 'Lead tidak ditemukan.' }, { status: 404 });
    if (lead.aktivitas_leads.length > 0) {
      return NextResponse.json({ success: false, message: 'Lead yang sudah memiliki aktivitas tidak dapat dihapus.' }, { status: 400 });
    }

    await prisma.lead.delete({ where: { id } });

    return NextResponse.json({ success: true, message: 'Lead berhasil dihapus.' });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, message: 'Terjadi kesalahan sistem' }, { status: 500 });
  }
}
