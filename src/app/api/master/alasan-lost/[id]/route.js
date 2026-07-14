import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUsername } from "@/lib/jwt";
import { z } from "zod";

const alasanLostSchema = z.object({
  kode: z.string().min(1, "Kode wajib diisi.").max(20, "Maksimal 20 karakter."),
  nama: z.string().min(1, "Nama wajib diisi.").max(150, "Maksimal 150 karakter."),
  aktif: z.number().int().min(0).max(1)
});

export async function PUT(request, context) {
  try {
    const params = await context.params;
    const id = BigInt(params.id);
    const body = await request.json();
    const result = alasanLostSchema.safeParse(body);
    
    if (!result.success) {
      return NextResponse.json({
        success: false,
        message: "Validasi gagal.",
        errors: result.error.flatten().fieldErrors
      }, { status: 422 });
    }
    
    const { kode, nama, aktif } = result.data;
    
    // Check for unique kode excluding current record
    const existing = await prisma.alasanLost.findFirst({
      where: { 
        kode,
        id: { not: id }
      }
    });

    if (existing) {
      return NextResponse.json({
        success: false,
        message: "Kode Alasan Lost sudah digunakan."
      }, { status: 409 });
    }

    const existingNama = await prisma.alasanLost.findFirst({
      where: { 
        nama,
        id: { not: id }
      }
    });

    if (existingNama) {
      return NextResponse.json({
        success: false,
        message: "Nama Alasan Lost sudah digunakan."
      }, { status: 409 });
    }

    const currentUser = await getCurrentUsername(request);

    const updatedAlasanLost = await prisma.alasanLost.update({
      where: { id },
      data: {
        kode,
        nama,
        aktif,
        diubah_tanggal: new Date(),
        diubah_oleh: currentUser
      }
    });
    
    const serializedData = JSON.parse(JSON.stringify(updatedAlasanLost, (key, value) =>
      typeof value === 'bigint' ? value.toString() : value
    ));
    
    return NextResponse.json({
      success: true,
      message: "Data Alasan Lost berhasil diubah.",
      data: serializedData
    });
    
  } catch (error) {
    console.error("PUT Alasan Lost Error:", error);
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
    const params = await context.params;
    const id = BigInt(params.id);
    
    // In actual implementation, we might check if this reason is used in leads before deleting
    // Since there's no Lead model defined with this relation yet in schema, we allow delete.

    await prisma.alasanLost.delete({
      where: { id }
    });
    
    return NextResponse.json({
      success: true,
      message: "Data Alasan Lost berhasil dihapus."
    });
    
  } catch (error) {
    console.error("DELETE Alasan Lost Error:", error);
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
