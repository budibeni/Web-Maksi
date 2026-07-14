import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const kategoriProdukSchema = z.object({
  kode: z.string().min(1, "Kode wajib diisi.").max(20, "Maksimal 20 karakter."),
  nama: z.string().min(1, "Nama wajib diisi.").max(100, "Maksimal 100 karakter."),
  aktif: z.number().int().min(0).max(1).default(1)
});

export async function GET(request) {
  try {
    const kategoriProduks = await prisma.kategoriProduk.findMany({
      orderBy: { nama: 'asc' }
    });

    const serializedData = JSON.parse(JSON.stringify(kategoriProduks, (key, value) =>
      typeof value === 'bigint' ? value.toString() : value
    ));

    return NextResponse.json({
      success: true,
      message: "Data berhasil diambil.",
      data: serializedData
    });
  } catch (error) {
    console.error("GET Kategori Produk Error:", error);
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
    const result = kategoriProdukSchema.safeParse(body);
    
    if (!result.success) {
      return NextResponse.json({
        success: false,
        message: "Validasi gagal.",
        errors: result.error.flatten().fieldErrors
      }, { status: 422 });
    }
    
    const { kode, nama, aktif } = result.data;
    
    // Check for unique kode
    const existing = await prisma.kategoriProduk.findFirst({
      where: { kode }
    });

    if (existing) {
      return NextResponse.json({
        success: false,
        message: "Kode Kategori Produk sudah digunakan."
      }, { status: 409 });
    }

    // Check for unique nama
    const existingNama = await prisma.kategoriProduk.findFirst({
      where: { nama }
    });

    if (existingNama) {
      return NextResponse.json({
        success: false,
        message: "Nama Kategori Produk sudah digunakan."
      }, { status: 409 });
    }

    const newKategoriProduk = await prisma.kategoriProduk.create({
      data: {
        kode,
        nama,
        aktif
      }
    });
    
    const serializedData = JSON.parse(JSON.stringify(newKategoriProduk, (key, value) =>
      typeof value === 'bigint' ? value.toString() : value
    ));
    
    return NextResponse.json({
      success: true,
      message: "Data Kategori Produk berhasil disimpan.",
      data: serializedData
    }, { status: 201 });
    
  } catch (error) {
    console.error("POST Kategori Produk Error:", error);
    return NextResponse.json({
      success: false,
      message: "Terjadi kesalahan pada server.",
      error: error.message || error.toString()
    }, { status: 500 });
  }
}
