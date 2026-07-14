import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUsername } from '@/lib/jwt';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 10;
    const isExport = searchParams.get('export') === 'true';
    const sortBy = searchParams.get('sortBy') || 'id';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    
    const skip = (page - 1) * limit;

    const cabang_id = searchParams.get('cabang_id');
    const kategori_id = searchParams.get('kategori_id');
    
    let whereClause = search ? {
      OR: [
        { produk: { nama: { contains: search } } },
        { produk: { kode: { contains: search } } },
        { cabang: { nama: { contains: search } } }
      ]
    } : {};

    if (cabang_id && cabang_id !== "all") {
      whereClause.cabang_id = BigInt(cabang_id);
    }
    
    if (kategori_id && kategori_id !== "all") {
      whereClause.produk = {
        kategori_produk_id: BigInt(kategori_id)
      };
      if (search) {
        whereClause.produk.OR = [
          { nama: { contains: search } },
          { kode: { contains: search } }
        ];
        delete whereClause.OR;
      }
    }

    let orderByClause = {};
    if (sortBy === 'produk') {
      orderByClause = { produk: { kode: sortOrder } };
    } else if (sortBy === 'cabang') {
      orderByClause = { cabang: { nama: sortOrder } };
    } else {
      orderByClause[sortBy] = sortOrder;
    }

    const hargaProduks = await prisma.hargaProduk.findMany({
      where: whereClause,
      include: {
        produk: {
          include: {
            kategori: true
          }
        },
        cabang: true
      },
      orderBy: orderByClause,
      ...(isExport ? {} : { skip, take: limit })
    });

    const serializedData = JSON.parse(JSON.stringify(hargaProduks, (key, value) =>
      typeof value === 'bigint' ? value.toString() : value
    ));

    if (isExport) {
      return NextResponse.json({
        success: true,
        data: serializedData
      });
    }

    const totalData = await prisma.hargaProduk.count({ where: whereClause });
    const totalPages = Math.ceil(totalData / limit);

    return NextResponse.json({
      success: true,
      data: serializedData,
      pagination: {
        page,
        limit,
        totalData,
        totalPages
      }
    });

  } catch (error) {
    console.error('Error fetching harga produk:', error);
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan sistem' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { produk_id, cabang_id, harga, is_import } = body;

    // Handle imports which might pass codes instead of IDs
    let finalProdukId = produk_id;
    let finalCabangId = cabang_id;

    if (is_import) {
      const { kode_produk, kode_cabang } = body;
      
      const produk = await prisma.produk.findUnique({ where: { kode: kode_produk } });
      const cabang = await prisma.cabang.findUnique({ where: { kode: kode_cabang } });

      if (!produk || !cabang) {
        return NextResponse.json(
          { success: false, message: 'Kode produk atau cabang tidak ditemukan' },
          { status: 400 }
        );
      }
      
      finalProdukId = produk.id;
      finalCabangId = cabang.id;
    }

    if (!finalProdukId || !finalCabangId || harga === undefined || isNaN(harga)) {
      return NextResponse.json(
        { success: false, message: 'Data tidak lengkap atau tidak valid' },
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

    const existing = await prisma.hargaProduk.findFirst({
      where: {
        produk_id: BigInt(finalProdukId),
        cabang_id: BigInt(finalCabangId)
      }
    });

    const currentUser = await getCurrentUsername(request);

    if (existing) {
      // If it's an import and exists, we update it instead of rejecting
      if (is_import) {
         const updated = await prisma.hargaProduk.update({
           where: { id: existing.id },
           data: {
             harga: numericHarga,
             diubah_oleh: currentUser,
             diubah_tanggal: new Date()
           }
         });
         return NextResponse.json({
          success: true,
          message: 'Harga Produk berhasil diperbarui',
          data: JSON.parse(JSON.stringify(updated, (key, value) => typeof value === 'bigint' ? value.toString() : value))
        }, { status: 200 });
      }

      return NextResponse.json(
        { success: false, message: 'Harga untuk produk dan cabang ini sudah ada' },
        { status: 400 }
      );
    }

    const newHargaProduk = await prisma.hargaProduk.create({
      data: {
        produk_id: BigInt(finalProdukId),
        cabang_id: BigInt(finalCabangId),
        harga: numericHarga,
        dibuat_oleh: currentUser,
        diubah_oleh: currentUser,
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Harga Produk berhasil ditambahkan',
      data: JSON.parse(JSON.stringify(newHargaProduk, (key, value) => typeof value === 'bigint' ? value.toString() : value))
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating harga produk:', error);
    if (error.code === 'P2002') {
      return NextResponse.json(
        { success: false, message: 'Kombinasi produk dan cabang ini sudah ada' },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan sistem' },
      { status: 500 }
    );
  }
}
