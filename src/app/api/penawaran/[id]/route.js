import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/jwt';

const serialize = (data) => JSON.parse(JSON.stringify(data, (_, v) => typeof v === 'bigint' ? v.toString() : v));

// GET /api/penawaran/[id]
export async function GET(request, context) {
  try {
    const user = await getCurrentUser(request);
    if (!user) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

    const params = await context.params;
    const id = BigInt(params.id);

    const quotation = await prisma.versiPenawaran.findUnique({
      where: { id },
      include: {
        details: true,
        lead: {
          include: {
            customer: true,
            user: true,
            cabang: true,
          }
        }
      }
    });

    if (!quotation) {
      return NextResponse.json({ success: false, message: 'Penawaran tidak ditemukan.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: serialize(quotation) });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, message: 'Terjadi kesalahan sistem' }, { status: 500 });
  }
}
