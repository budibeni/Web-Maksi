import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/jwt";
import { recordAuditLog } from "@/lib/audit";
import { z } from "zod";

const serialize = (data) => JSON.parse(JSON.stringify(data, (_, v) => typeof v === 'bigint' ? v.toString() : v));

const hasilInteraksiSchema = z.object({
  kode: z.string().min(1, "Kode wajib diisi.").max(30, "Maksimal 30 karakter."),
  nama: z.string().min(1, "Nama wajib diisi.").max(150, "Maksimal 150 karakter."),
  fase_lead: z.enum(["LEAD_BARU", "FOLLOW_UP", "PENAWARAN"], {
    errorMap: () => ({ message: "Fase lead harus berupa LEAD_BARU, FOLLOW_UP, atau PENAWARAN." })
  }),
  urutan: z.number().int().default(0),
  warna: z.string().max(20).optional().nullable(),
  ikon: z.string().max(50).optional().nullable(),
  aktif: z.number().int().min(0).max(1)
});

export async function PUT(request, context) {
  try {
    const currentUser = await getCurrentUser(request);
    if (!currentUser) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const params = await context.params;
    const id = BigInt(params.id);
    const body = await request.json();
    const result = hasilInteraksiSchema.safeParse(body);
    
    if (!result.success) {
      return NextResponse.json({
        success: false,
        message: "Validasi gagal.",
        errors: result.error.flatten().fieldErrors
      }, { status: 422 });
    }
    
    const { kode, nama, fase_lead, urutan, warna, ikon, aktif } = result.data;
    
    // Check for unique kode excluding current record
    const existing = await prisma.hasilInteraksi.findFirst({
      where: { 
        kode,
        id: { not: id }
      }
    });

    if (existing) {
      return NextResponse.json({
        success: false,
        message: "Kode Hasil Interaksi sudah digunakan."
      }, { status: 409 });
    }

    const existingNama = await prisma.hasilInteraksi.findFirst({
      where: { 
        nama,
        id: { not: id }
      }
    });

    if (existingNama) {
      return NextResponse.json({
        success: false,
        message: "Nama Hasil Interaksi sudah digunakan."
      }, { status: 409 });
    }

    const dataSebelum = await prisma.hasilInteraksi.findUnique({
      where: { id }
    });

    if (!dataSebelum) {
      return NextResponse.json({
        success: false,
        message: "Data tidak ditemukan."
      }, { status: 404 });
    }

    const updatedHasil = await prisma.hasilInteraksi.update({
      where: { id },
      data: {
        kode,
        nama,
        fase_lead,
        urutan,
        warna: warna || null,
        ikon: ikon || null,
        aktif,
        diubah_tanggal: new Date(),
        diubah_oleh: currentUser.nama || currentUser.username
      }
    });

    // Record Audit Log
    await recordAuditLog({
      user: currentUser,
      modul: "HASIL_INTERAKSI",
      aksi: "UPDATE",
      referensi_id: updatedHasil.id,
      deskripsi: `Mengubah hasil interaksi: ${nama} (${kode})`,
      data_sebelum: dataSebelum,
      data_sesudah: updatedHasil,
      request
    });
    
    return NextResponse.json({
      success: true,
      message: "Data Hasil Interaksi berhasil diubah.",
      data: serialize(updatedHasil)
    });
    
  } catch (error) {
    console.error("PUT Hasil Interaksi Error:", error);
    if (error.code === 'P2025') {
      return NextResponse.json({
        success: false,
        message: "Data tidak ditemukan."
      }, { status: 404 });
    }
    return NextResponse.json({
      success: false,
      message: "Terjadi kesalahan pada server."
    }, { status: 500 });
  }
}

export async function DELETE(request, context) {
  try {
    const currentUser = await getCurrentUser(request);
    if (!currentUser) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const params = await context.params;
    const id = BigInt(params.id);
    
    // Check if this interaction result has been used in leads' activities
    const inUse = await prisma.aktivitasLead.findFirst({
      where: { hasil_interaksi_id: id }
    });

    if (inUse) {
      return NextResponse.json({
        success: false,
        message: "Hasil Interaksi yang sudah digunakan pada transaksi tidak boleh dihapus."
      }, { status: 400 });
    }

    const dataSebelum = await prisma.hasilInteraksi.findUnique({
      where: { id }
    });

    if (!dataSebelum) {
      return NextResponse.json({
        success: false,
        message: "Data tidak ditemukan."
      }, { status: 404 });
    }

    await prisma.hasilInteraksi.delete({
      where: { id }
    });

    // Record Audit Log
    await recordAuditLog({
      user: currentUser,
      modul: "HASIL_INTERAKSI",
      aksi: "DELETE",
      referensi_id: id,
      deskripsi: `Menghapus hasil interaksi: ${dataSebelum.nama} (${dataSebelum.kode})`,
      data_sebelum: dataSebelum,
      request
    });
    
    return NextResponse.json({
      success: true,
      message: "Data Hasil Interaksi berhasil dihapus."
    });
    
  } catch (error) {
    console.error("DELETE Hasil Interaksi Error:", error);
    if (error.code === 'P2025') {
      return NextResponse.json({
        success: false,
        message: "Data tidak ditemukan."
      }, { status: 404 });
    }
    return NextResponse.json({
      success: false,
      message: "Terjadi kesalahan pada server."
    }, { status: 500 });
  }
}
