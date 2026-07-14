import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUsername } from "@/lib/jwt";
import { z } from "zod";

const cabangSchema = z.object({
  kode: z.string().min(1, "Kode wajib diisi.").max(20, "Maksimal 20 karakter."),
  nama: z.string().min(1, "Nama wajib diisi.").max(150, "Maksimal 150 karakter."),
  alamat: z.string().optional(),
  telepon: z.string().max(30, "Maksimal 30 karakter.").optional(),
  aktif: z.number().int().min(0).max(1)
});

export async function PUT(request, context) {
  try {
    const params = await context.params;
    const id = BigInt(params.id);
    const body = await request.json();
    const result = cabangSchema.safeParse(body);
    
    if (!result.success) {
      return NextResponse.json({
        success: false,
        message: "Validasi gagal.",
        errors: result.error.flatten().fieldErrors
      }, { status: 422 });
    }
    
    const { kode, nama, alamat, telepon, aktif } = result.data;
    
    // Check for unique kode excluding current record
    const existing = await prisma.cabang.findFirst({
      where: { 
        kode,
        id: { not: id }
      }
    });

    if (existing) {
      return NextResponse.json({
        success: false,
        message: "Kode Cabang sudah digunakan."
      }, { status: 409 });
    }

    const currentUser = await getCurrentUsername(request);

    const updatedCabang = await prisma.cabang.update({
      where: { id },
      data: {
        kode,
        nama,
        alamat,
        telepon,
        aktif,
        diubah_tanggal: new Date(),
        diubah_oleh: currentUser
      }
    });
    
    const serializedData = JSON.parse(JSON.stringify(updatedCabang, (key, value) =>
      typeof value === 'bigint' ? value.toString() : value
    ));
    
    return NextResponse.json({
      success: true,
      message: "Data cabang berhasil diubah.",
      data: serializedData
    });
    
  } catch (error) {
    console.error("PUT Cabang Error:", error);
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
    
    // Check if cabang is used by any user
    const usersCount = await prisma.user.count({
      where: { cabang_id: id }
    });
    
    if (usersCount > 0) {
      return NextResponse.json({
        success: false,
        message: "Cabang tidak dapat dihapus karena masih digunakan oleh Pengguna."
      }, { status: 400 });
    }

    await prisma.cabang.delete({
      where: { id }
    });
    
    return NextResponse.json({
      success: true,
      message: "Data cabang berhasil dihapus."
    });
    
  } catch (error) {
    console.error("DELETE Cabang Error:", error);
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
