import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/jwt';
import { recordAuditLog } from '@/lib/audit';
import { z } from 'zod';

const serialize = (data) => JSON.parse(JSON.stringify(data, (_, v) => typeof v === 'bigint' ? v.toString() : v));

const dealSchema = z.object({
  lead_id: z.string().or(z.number()),
  versi_penawaran_id: z.string().or(z.number()),
});

// POST /api/lead/deal - Tandai Lead sebagai DEAL
export async function POST(request) {
  try {
    const user = await getCurrentUser(request);
    if (!user) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

    const role = (user.role || '').toLowerCase();
    if (role === 'top management') {
      return NextResponse.json({ success: false, message: 'Top Management tidak diperbolehkan melakukan modifikasi data.' }, { status: 403 });
    }

    const body = await request.json();
    const parsed = dealSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, message: 'Validasi gagal.', errors: parsed.error.flatten().fieldErrors }, { status: 422 });
    }

    const { lead_id, versi_penawaran_id } = parsed.data;
    const leadId = BigInt(lead_id);
    const quotationId = BigInt(versi_penawaran_id);

    // Fetch Lead
    const lead = await prisma.lead.findUnique({ where: { id: leadId } });
    if (!lead) return NextResponse.json({ success: false, message: 'Lead tidak ditemukan.' }, { status: 404 });
    if (lead.status !== 1) return NextResponse.json({ success: false, message: 'Lead sudah berstatus DEAL atau LOST.' }, { status: 400 });

    // Fetch quotation
    const quotation = await prisma.versiPenawaran.findUnique({ where: { id: quotationId } });
    if (!quotation) return NextResponse.json({ success: false, message: 'Penawaran tidak ditemukan.' }, { status: 404 });
    if (quotation.lead_id !== leadId) {
      return NextResponse.json({ success: false, message: 'Penawaran tidak sesuai dengan Lead ini.' }, { status: 400 });
    }

    const now = new Date();

    // Transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Update Lead to DEAL (2)
      const updatedLead = await tx.lead.update({
        where: { id: leadId },
        data: {
          status: 2, // DEAL
          versi_penawaran_final_id: quotationId,
          nilai_deal: quotation.grand_total,
          tanggal_deal: now,
          diubah_oleh: user.nama,
          diubah_tanggal: now,
        },
      });

      // 2. Complete all active reminders for this Lead
      await tx.pengingat.updateMany({
        where: { lead_id: leadId, status: 'AKTIF' },
        data: {
          status: 'SELESAI',
          diubah_oleh: user.nama,
          diubah_tanggal: now,
        },
      });

      // 3. Create AktivitasLead record for Deal
      // Find the "Hasil Interaksi" for "Siap membeli" (code SIAP)
      let hi = await tx.hasilInteraksi.findFirst({ where: { kode: 'SIAP', aktif: 1 } });
      if (!hi) {
        // Fallback to any active interaction to prevent foreign key violation
        hi = await tx.hasilInteraksi.findFirst({ where: { aktif: 1 } });
      }

      if (hi) {
        await tx.aktivitasLead.create({
          data: {
            lead_id: leadId,
            user_id: BigInt(user.id),
            hasil_interaksi_id: hi.id,
            hasil_interaksi: `Deal penjualan`,
            catatan: `Lead dinyatakan DEAL dengan menyetujui Penawaran ${quotation.nomor} Versi ${quotation.versi} senilai Rp ${Number(quotation.grand_total).toLocaleString('id-ID')}.`,
            dibuat_oleh: user.nama,
          },
        });
      }

      return updatedLead;
    });

    // Record Audit Log
    await recordAuditLog({
      user,
      modul: "LEAD",
      aksi: "DEAL",
      referensi_id: leadId,
      deskripsi: `Lead ${lead.nomor} dinyatakan DEAL dengan penawaran ${quotation.nomor} senilai Rp ${Number(quotation.grand_total).toLocaleString('id-ID')}`,
      request
    });

    return NextResponse.json({
      success: true,
      message: 'Lead berhasil diselesaikan sebagai DEAL.',
      data: serialize(result),
    });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, message: 'Terjadi kesalahan sistem' }, { status: 500 });
  }
}
