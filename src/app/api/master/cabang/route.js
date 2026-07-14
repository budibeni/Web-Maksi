import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const cabangSchema = z.object({
  kode: z.string().min(1, "Kode wajib diisi.").max(20, "Maksimal 20 karakter."),
  nama: z.string().min(1, "Nama wajib diisi.").max(150, "Maksimal 150 karakter."),
  alamat: z.string().optional(),
  telepon: z.string().max(30, "Maksimal 30 karakter.").optional(),
  aktif: z.number().int().min(0).max(1).default(1)
});

export async function GET(request) {
  try {
    const cabangs = await prisma.cabang.findMany({
      orderBy: { nama: 'asc' }
    });

    const serializedData = JSON.parse(JSON.stringify(cabangs, (key, value) =>
      typeof value === 'bigint' ? value.toString() : value
    ));

    return NextResponse.json({
      success: true,
      message: "Data berhasil diambil.",
      data: serializedData
    });
  } catch (error) {
    console.error("GET Cabang Error:", error);
    return NextResponse.json({
      success: false,
      message: "Terjadi kesalahan pada server."
    }, { status: 500 });
  }
}

export async function POST(request) {
  try {
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
    
    // Check for unique kode
    const existing = await prisma.cabang.findFirst({
      where: { kode }
    });

    if (existing) {
      return NextResponse.json({
        success: false,
        message: "Kode Cabang sudah digunakan."
      }, { status: 409 });
    }

    const newCabang = await prisma.cabang.create({
      data: {
        kode,
        nama,
        alamat,
        telepon,
        aktif
      }
    });
    
    const serializedData = JSON.parse(JSON.stringify(newCabang, (key, value) =>
      typeof value === 'bigint' ? value.toString() : value
    ));
    
    return NextResponse.json({
      success: true,
      message: "Data cabang berhasil disimpan.",
      data: serializedData
    }, { status: 201 });
    
  } catch (error) {
    console.error("POST Cabang Error:", error);
    return NextResponse.json({
      success: false,
      message: "Terjadi kesalahan pada server."
    }, { status: 500 });
  }
}
