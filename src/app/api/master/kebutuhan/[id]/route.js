import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/jwt";
import { recordAuditLog } from "@/lib/audit";
import { z } from "zod";

const serialize = (data) => JSON.parse(JSON.stringify(data, (_, v) => typeof v === 'bigint' ? v.toString() : v));

const kebutuhanSchema = z.object({
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
    const result = kebutuhanSchema.safeParse(body);
    
    if (!result.success) {
      return NextResponse.json({
        success: false,
        message: "Validasi gagal.",
        errors: result.error.flatten().fieldErrors
      }, { status: 422 });
    }
    
    const { kode, nama, fase_lead, urutan, warna, ikon, aktif } = result.data;
    
    // Check for unique kode excluding current record
    const existing = await prisma.kebutuhan.findFirst({
      where: { 
        kode,
        id: { not: id }
      }
    });

    if (existing) {
      return NextResponse.json({
        success: false,
        message: "Kode Kebutuhan sudah digunakan."
      }, { status: 409 });
    }

    const existingNama = await prisma.kebutuhan.findFirst({
      where: { 
        nama,
        id: { not: id }
      }
    });

    if (existingNama) {
      return NextResponse.json({
        success: false,
        message: "Nama Kebutuhan sudah digunakan."
      }, { status: 409 });
    }

    const dataSebelum = await prisma.kebutuhan.findUnique({
      where: { id }
    });

    if (!dataSebelum) {
      return NextResponse.json({
        success: false,
        message: "Data tidak ditemukan."
      }, { status: 404 });
    }

    const updatedKebutuhan = await prisma.kebutuhan.update({
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
      modul: "KEBUTUHAN",
      aksi: "UPDATE",
      referensi_id: updatedKebutuhan.id,
      deskripsi: `Mengubah kebutuhan: ${nama} (${kode})`,
      data_sebelum: dataSebelum,
      data_sesudah: updatedKebutuhan,
      request
    });
    
    return NextResponse.json({
      success: true,
      message: "Data Kebutuhan berhasil diubah.",
      data: serialize(updatedKebutuhan)
    });
    
  } catch (error) {
    console.error("PUT Kebutuhan Error:", error);
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

    const dataSebelum = await prisma.kebutuhan.findUnique({
      where: { id }
    });

    if (!dataSebelum) {
      return NextResponse.json({
        success: false,
        message: "Data tidak ditemukan."
      }, { status: 404 });
    }

    await prisma.kebutuhan.delete({
      where: { id }
    });

    // Record Audit Log
    await recordAuditLog({
      user: currentUser,
      modul: "KEBUTUHAN",
      aksi: "DELETE",
      referensi_id: id,
      deskripsi: `Menghapus kebutuhan: ${dataSebelum.nama} (${dataSebelum.kode})`,
      data_sebelum: dataSebelum,
      request
    });
    
    return NextResponse.json({
      success: true,
      message: "Data Kebutuhan berhasil dihapus."
    });
    
  } catch (error) {
    console.error("DELETE Kebutuhan Error:", error);
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
