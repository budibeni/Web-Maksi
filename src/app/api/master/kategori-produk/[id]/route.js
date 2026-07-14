import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUsername } from "@/lib/jwt";
import { z } from "zod";

const kategoriProdukSchema = z.object({
  kode: z.string().min(1, "Kode wajib diisi.").max(20, "Maksimal 20 karakter."),
  nama: z.string().min(1, "Nama wajib diisi.").max(100, "Maksimal 100 karakter."),
  aktif: z.number().int().min(0).max(1).default(1)
});

export async function PUT(request, context) {
  try {
    const params = await context.params;
    const id = BigInt(params.id);
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
    
    // Check for unique kode excluding current record
    const existingKode = await prisma.kategoriProduk.findFirst({
      where: { 
        kode,
        id: { not: id }
      }
    });

    if (existingKode) {
      return NextResponse.json({
        success: false,
        message: "Kode Kategori Produk sudah digunakan."
      }, { status: 409 });
    }

    // Check for unique nama excluding current record
    const existingNama = await prisma.kategoriProduk.findFirst({
      where: { 
        nama,
        id: { not: id }
      }
    });

    if (existingNama) {
      return NextResponse.json({
        success: false,
        message: "Nama Kategori Produk sudah digunakan."
      }, { status: 409 });
    }

    const currentUser = await getCurrentUsername(request);

    const updatedKategoriProduk = await prisma.kategoriProduk.update({
      where: { id },
      data: {
        kode,
        nama,
        aktif,
        diubah_tanggal: new Date(),
        diubah_oleh: currentUser
      }
    });
    
    const serializedData = JSON.parse(JSON.stringify(updatedKategoriProduk, (key, value) =>
      typeof value === 'bigint' ? value.toString() : value
    ));
    
    return NextResponse.json({
      success: true,
      message: "Data Kategori Produk berhasil diperbarui.",
      data: serializedData
    });
    
  } catch (error) {
    console.error("PUT Kategori Produk Error:", error);
    
    if (error.code === 'P2025') {
      return NextResponse.json({
        success: false,
        message: "Data Kategori Produk tidak ditemukan."
      }, { status: 404 });
    }
    
    return NextResponse.json({
      success: false,
      message: "Terjadi kesalahan pada server.",
      error: error.message || error.toString()
    }, { status: 500 });
  }
}

export async function DELETE(request, context) {
  try {
    const params = await context.params;
    const id = BigInt(params.id);

    // Cek apakah kategori digunakan di produk
    const linkedProduk = await prisma.produk.findFirst({
      where: { kategori_produk_id: id }
    });

    if (linkedProduk) {
      return NextResponse.json({
        success: false,
        message: "Kategori Produk tidak dapat dihapus karena sedang digunakan di Master Produk."
      }, { status: 400 });
    }
    
    await prisma.kategoriProduk.delete({
      where: { id }
    });
    
    return NextResponse.json({
      success: true,
      message: "Data Kategori Produk berhasil dihapus."
    });
    
  } catch (error) {
    console.error("DELETE Kategori Produk Error:", error);
    
    if (error.code === 'P2025') {
      return NextResponse.json({
        success: false,
        message: "Data Kategori Produk tidak ditemukan."
      }, { status: 404 });
    }
    
    return NextResponse.json({
      success: false,
      message: "Terjadi kesalahan pada server.",
      error: error.message || error.toString()
    }, { status: 500 });
  }
}
