import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/jwt';
import { z } from 'zod';

const serialize = (data) => JSON.parse(JSON.stringify(data, (_, v) => typeof v === 'bigint' ? v.toString() : v));

const lostSchema = z.object({
  lead_id: z.string().min(1),
  alasan_lost_id: z.string().min(1, 'Alasan Lost wajib dipilih.'),
  catatan_lost: z.string().optional(),
});

// POST /api/lead/lost
export async function POST(request) {
  try {
    const user = await getCurrentUser(request);
    if (!user) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const parsed = lostSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, message: 'Validasi gagal.', errors: parsed.error.flatten().fieldErrors }, { status: 422 });
    }

    const { lead_id, alasan_lost_id, catatan_lost } = parsed.data;
    const leadId = BigInt(lead_id);

    const lead = await prisma.lead.findUnique({ where: { id: leadId } });
    if (!lead) return NextResponse.json({ success: false, message: 'Lead tidak ditemukan.' }, { status: 404 });
    if (lead.status !== 1) return NextResponse.json({ success: false, message: 'Lead sudah berstatus DEAL atau LOST.' }, { status: 400 });

    const alasanLost = await prisma.alasanLost.findUnique({ where: { id: BigInt(alasan_lost_id) } });
    if (!alasanLost) return NextResponse.json({ success: false, message: 'Alasan lost tidak ditemukan.' }, { status: 404 });

    // Validasi: jika alasan "Lainnya", catatan wajib
    if (alasanLost.kode === 'LAINNYA' && (!catatan_lost || catatan_lost.trim().length < 10)) {
      return NextResponse.json({ success: false, message: 'Catatan wajib diisi minimal 10 karakter untuk alasan Lainnya.' }, { status: 422 });
    }

    const now = new Date();

    // Update lead menjadi LOST
    await prisma.lead.update({
      where: { id: leadId },
      data: {
        status: 3, // LOST
        alasan_lost_id: BigInt(alasan_lost_id),
        nama_alasan_lost: alasanLost.nama,
        catatan_lost: catatan_lost || null,
        tanggal_lost: now,
        diubah_oleh: user.nama,
        diubah_tanggal: now,
      },
    });

    // Selesaikan semua pengingat AKTIF
    await prisma.pengingat.updateMany({
      where: { lead_id: leadId, status: 'AKTIF' },
      data: { status: 'SELESAI', diubah_oleh: user.nama, diubah_tanggal: now },
    });

    return NextResponse.json({ success: true, message: 'Lead berhasil ditandai sebagai Lost.' });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, message: 'Terjadi kesalahan sistem' }, { status: 500 });
  }
}
