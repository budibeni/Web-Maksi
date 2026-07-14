import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUsername } from "@/lib/jwt";
import { z } from "zod";

const produkSchema = z.object({
  kategori_produk_id: z.string().or(z.number()).or(z.bigint()),
  kode: z.string().min(1, "Kode wajib diisi.").max(30, "Maksimal 30 karakter."),
  nama: z.string().min(1, "Nama wajib diisi.").max(200, "Maksimal 200 karakter."),
  satuan: z.string().min(1, "Satuan wajib diisi.").max(30, "Maksimal 30 karakter."),
  harga_default: z.string().or(z.number()),
  aktif: z.number().int().min(0).max(1).default(1)
});

export async function PUT(request, context) {
  try {
    const params = await context.params;
    const id = BigInt(params.id);
    const body = await request.json();
    const result = produkSchema.safeParse(body);
    
    if (!result.success) {
      return NextResponse.json({
        success: false,
        message: "Validasi gagal.",
        errors: result.error.flatten().fieldErrors
      }, { status: 422 });
    }
    
    const { kategori_produk_id, kode, nama, satuan, harga_default, aktif } = result.data;
    
    // Check for unique kode excluding current record
    const existingKode = await prisma.produk.findFirst({
      where: { 
        kode,
        id: { not: id }
      }
    });

    if (existingKode) {
      return NextResponse.json({
        success: false,
        message: "Kode Produk sudah digunakan."
      }, { status: 409 });
    }

    const currentUser = await getCurrentUsername(request);

    const updatedProduk = await prisma.produk.update({
      where: { id },
      data: {
        kategori_produk_id: BigInt(kategori_produk_id),
        kode,
        nama,
        satuan,
        harga_default: !isNaN(parseFloat(harga_default)) ? parseFloat(harga_default) : 0,
        aktif,
        diubah_tanggal: new Date(),
        diubah_oleh: currentUser
      },
      include: {
        kategori: true
      }
    });
    
    const serializedData = JSON.parse(JSON.stringify(updatedProduk, (key, value) =>
      typeof value === 'bigint' ? value.toString() : value
    ));
    
    return NextResponse.json({
      success: true,
      message: "Data Produk berhasil diperbarui.",
      data: serializedData
    });
    
  } catch (error) {
    console.error("PUT Produk Error:", error);
    
    if (error.code === 'P2025') {
      return NextResponse.json({
        success: false,
        message: "Data Produk tidak ditemukan."
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

    // Cek apakah produk digunakan di HargaProduk
    const linkedHarga = await prisma.hargaProduk.findFirst({
      where: { produk_id: id }
    });

    if (linkedHarga) {
      return NextResponse.json({
        success: false,
        message: "Produk tidak dapat dihapus karena sudah memiliki data Harga per Cabang."
      }, { status: 400 });
    }
    
    // TODO: Nanti tambahkan cek ke tabel Penawaran / Detail Penawaran
    
    await prisma.produk.delete({
      where: { id }
    });
    
    return NextResponse.json({
      success: true,
      message: "Data Produk berhasil dihapus."
    });
    
  } catch (error) {
    console.error("DELETE Produk Error:", error);
    
    if (error.code === 'P2025') {
      return NextResponse.json({
        success: false,
        message: "Data Produk tidak ditemukan."
      }, { status: 404 });
    }
    
    return NextResponse.json({
      success: false,
      message: "Terjadi kesalahan pada server.",
      error: error.message || error.toString()
    }, { status: 500 });
  }
}
