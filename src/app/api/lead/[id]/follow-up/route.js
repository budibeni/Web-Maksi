import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/jwt';
import { recordAuditLog } from '@/lib/audit';
import { z } from 'zod';

const serialize = (data) => JSON.parse(JSON.stringify(data, (_, v) => typeof v === 'bigint' ? v.toString() : v));

const followUpSchema = z.object({
  hasil_interaksi_id: z.string().min(1, 'Hasil interaksi wajib dipilih.'),
  catatan: z.string().min(1, 'Catatan wajib diisi.'),
  buat_pengingat: z.boolean().optional().default(false),
  tanggal_pengingat: z.string().optional(),
  waktu_pengingat: z.string().optional(),
  catatan_pengingat: z.string().optional(),
});

// POST /api/lead/[id]/follow-up
export async function POST(request, context) {
  try {
    const user = await getCurrentUser(request);
    if (!user) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

    const role = (user.role || '').toLowerCase();
    if (role === 'top management') {
      return NextResponse.json({ success: false, message: 'Top Management tidak diperbolehkan melakukan modifikasi data.' }, { status: 403 });
    }

    const params = await context.params;
    const leadId = BigInt(params.id);

    const lead = await prisma.lead.findUnique({ where: { id: leadId } });
    if (!lead) return NextResponse.json({ success: false, message: 'Lead tidak ditemukan.' }, { status: 404 });
    if (lead.status !== 1) return NextResponse.json({ success: false, message: 'Lead sudah berstatus DEAL atau LOST.' }, { status: 400 });

    const body = await request.json();
    const parsed = followUpSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, message: 'Validasi gagal.', errors: parsed.error.flatten().fieldErrors }, { status: 422 });
    }

    const { hasil_interaksi_id, catatan, buat_pengingat, tanggal_pengingat, waktu_pengingat, catatan_pengingat } = parsed.data;

    const hasilInteraksi = await prisma.hasilInteraksi.findUnique({ where: { id: BigInt(hasil_interaksi_id) } });
    if (!hasilInteraksi) return NextResponse.json({ success: false, message: 'Hasil interaksi tidak ditemukan.' }, { status: 404 });

    const faseMap = { LEAD_BARU: 1, FOLLOW_UP: 2, PENAWARAN: 3 };
    const faseBaru = faseMap[hasilInteraksi.fase_lead] || lead.fase;

    // Simpan aktivitas
    const aktivitas = await prisma.aktivitasLead.create({
      data: {
        lead_id: leadId,
        user_id: BigInt(user.id),
        hasil_interaksi_id: BigInt(hasil_interaksi_id),
        hasil_interaksi: hasilInteraksi.nama,
        catatan,
        dibuat_oleh: user.nama,
      },
    });

    // Selesaikan pengingat AKTIF sebelumnya
    await prisma.pengingat.updateMany({
      where: { lead_id: leadId, status: 'AKTIF' },
      data: { status: 'SELESAI', diubah_oleh: user.nama, diubah_tanggal: new Date() },
    });

    // Buat pengingat baru jika diminta
    if (buat_pengingat && tanggal_pengingat) {
      const dtStr = `${tanggal_pengingat}T${waktu_pengingat || '08:00'}:00`;
      await prisma.pengingat.create({
        data: {
          lead_id: leadId,
          aktivitas_lead_id: aktivitas.id,
          tanggal_pengingat: new Date(dtStr),
          catatan: catatan_pengingat || null,
          status: 'AKTIF',
          dibuat_oleh: user.nama,
        },
      });
    }

    // Update fase lead
    await prisma.lead.update({
      where: { id: leadId },
      data: { fase: faseBaru, diubah_oleh: user.nama, diubah_tanggal: new Date() },
    });

    // Record Audit Log
    await recordAuditLog({
      user,
      modul: "LEAD",
      aksi: "FOLLOW_UP",
      referensi_id: leadId,
      deskripsi: `Follow up lead ${lead.nomor}: ${hasilInteraksi.nama}`,
      request
    });

    return NextResponse.json({ success: true, message: 'Follow up berhasil disimpan.' });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, message: 'Terjadi kesalahan sistem' }, { status: 500 });
  }
}
