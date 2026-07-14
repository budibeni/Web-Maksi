import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUsername } from "@/lib/jwt";
import { z } from "zod";

const alasanLostSchema = z.object({
  kode: z.string().min(1, "Kode wajib diisi.").max(20, "Maksimal 20 karakter."),
  nama: z.string().min(1, "Nama wajib diisi.").max(150, "Maksimal 150 karakter."),
  aktif: z.number().int().min(0).max(1).default(1)
});

export async function GET(request) {
  try {
    const alasanLosts = await prisma.alasanLost.findMany({
      orderBy: { id: 'desc' }
    });

    const serializedData = JSON.parse(JSON.stringify(alasanLosts, (key, value) =>
      typeof value === 'bigint' ? value.toString() : value
    ));

    return NextResponse.json({
      success: true,
      message: "Data berhasil diambil.",
      data: serializedData
    });
  } catch (error) {
    console.error("GET Alasan Lost Error:", error);
    return NextResponse.json({
      success: false,
      message: "Terjadi kesalahan pada server.",
      error: error.message || error.toString()
    }, { status: 500 });
  }
}

export async function POST(request) {
  try {
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
    
    // Check for unique kode
    const existing = await prisma.alasanLost.findFirst({
      where: { kode }
    });

    if (existing) {
      return NextResponse.json({
        success: false,
        message: "Kode Alasan Lost sudah digunakan."
      }, { status: 409 });
    }

    // Check for unique nama
    const existingNama = await prisma.alasanLost.findFirst({
      where: { nama }
    });

    if (existingNama) {
      return NextResponse.json({
        success: false,
        message: "Nama Alasan Lost sudah digunakan."
      }, { status: 409 });
    }

    const currentUser = await getCurrentUsername(request);

    const newAlasanLost = await prisma.alasanLost.create({
      data: {
        kode,
        nama,
        aktif,
        dibuat_oleh: currentUser
      }
    });
    
    const serializedData = JSON.parse(JSON.stringify(newAlasanLost, (key, value) =>
      typeof value === 'bigint' ? value.toString() : value
    ));
    
    return NextResponse.json({
      success: true,
      message: "Data Alasan Lost berhasil disimpan.",
      data: serializedData
    }, { status: 201 });
    
  } catch (error) {
    console.error("POST Alasan Lost Error:", error);
    return NextResponse.json({
      success: false,
      message: "Terjadi kesalahan pada server.",
      error: error.message || error.toString()
    }, { status: 500 });
  }
}
