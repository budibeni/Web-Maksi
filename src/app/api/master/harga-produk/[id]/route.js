import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUsername } from '@/lib/jwt';

export async function PUT(request, context) {
  try {
    const params = await context.params;
    const id = BigInt(params.id);
    const body = await request.json();
    const { harga } = body;

    if (harga === undefined || isNaN(harga)) {
      return NextResponse.json(
        { success: false, message: 'Harga tidak valid' },
        { status: 400 }
      );
    }

    const numericHarga = parseFloat(harga) || 0;
    if (numericHarga < 0) {
      return NextResponse.json(
        { success: false, message: 'Harga tidak boleh negatif' },
        { status: 400 }
      );
    }

    const existingHargaProduk = await prisma.hargaProduk.findUnique({
      where: { id }
    });

    if (!existingHargaProduk) {
      return NextResponse.json(
        { success: false, message: 'Data tidak ditemukan' },
        { status: 404 }
      );
    }

    const currentUser = await getCurrentUsername(request);

    const updatedHargaProduk = await prisma.hargaProduk.update({
      where: { id },
      data: {
        harga: numericHarga,
        diubah_oleh: currentUser,
        diubah_tanggal: new Date(),
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Harga Produk berhasil diperbarui',
      data: JSON.parse(JSON.stringify(updatedHargaProduk, (key, value) => typeof value === 'bigint' ? value.toString() : value))
    });

  } catch (error) {
    console.error('Error updating harga produk:', error);
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan sistem' },
      { status: 500 }
    );
  }
}

export async function DELETE(request, context) {
  try {
    const params = await context.params;
    const id = BigInt(params.id);

    const existingHargaProduk = await prisma.hargaProduk.findUnique({
      where: { id }
    });

    if (!existingHargaProduk) {
      return NextResponse.json(
        { success: false, message: 'Data tidak ditemukan' },
        { status: 404 }
      );
    }

    await prisma.hargaProduk.delete({
      where: { id }
    });

    return NextResponse.json({
      success: true,
      message: 'Harga Produk berhasil dihapus'
    });

  } catch (error) {
    console.error('Error deleting harga produk:', error);
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan sistem' },
      { status: 500 }
    );
  }
}
