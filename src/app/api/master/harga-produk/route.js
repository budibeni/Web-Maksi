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
    const sortField = searchParams.get('sortField') || searchParams.get('sortBy') || 'id';
    const sortOrder = (searchParams.get('sortOrder') || searchParams.get('sortOrder') || 'desc') === 'asc' ? 'asc' : 'desc';
    
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
        ...whereClause.produk,
        kategori_produk_id: BigInt(kategori_id)
      };
    }

    // Parse column filters
    const filterConditions = [];
    const filterKeys = new Set();
    for (const [paramKey] of searchParams.entries()) {
      const match = paramKey.match(/^filter\[(.+?)\]\[operator\]$/);
      if (match) filterKeys.add(match[1]);
    }
    for (const colKey of filterKeys) {
      const operator = searchParams.get(`filter[${colKey}][operator]`);
      const value = searchParams.get(`filter[${colKey}][value]`);
      const value2 = searchParams.get(`filter[${colKey}][value2]`);
      if (!operator || value === null || value === '') continue;
      
      let condition = null;
      if (colKey === 'produk.kode') {
        if (operator === 'contains') condition = { produk: { kode: { contains: value } } };
        else if (operator === 'equals') condition = { produk: { kode: value } };
      } else if (colKey === 'produk.nama') {
        if (operator === 'contains') condition = { produk: { nama: { contains: value } } };
        else if (operator === 'equals') condition = { produk: { nama: value } };
      } else if (colKey === 'cabang.nama') {
        if (operator === 'contains') condition = { cabang: { nama: { contains: value } } };
        else if (operator === 'equals') condition = { cabang: { nama: value } };
      } else if (operator === 'contains') condition = { [colKey]: { contains: value } };
      else if (operator === 'startsWith') condition = { [colKey]: { startsWith: value } };
      else if (operator === 'endsWith') condition = { [colKey]: { endsWith: value } };
      else if (operator === 'equals' || operator === 'eq') {
        condition = { [colKey]: colKey === 'cabang_id' || colKey === 'produk_id' ? BigInt(value) : value };
      } else if (operator === 'gt') condition = { [colKey]: { gt: isNaN(Number(value)) ? value : Number(value) } };
      else if (operator === 'lt') condition = { [colKey]: { lt: isNaN(Number(value)) ? value : Number(value) } };
      else if (operator === 'between' && value2) condition = { [colKey]: { gte: Number(value), lte: Number(value2) } };
      else if (operator === 'in') {
        const parsedVals = value.split(',').map(v => isNaN(Number(v)) ? v : BigInt(v));
        condition = { [colKey]: { in: parsedVals } };
      } else if (operator === 'today') {
        const start = new Date(); start.setHours(0,0,0,0);
        const end = new Date(); end.setHours(23,59,59,999);
        condition = { [colKey]: { gte: start, lte: end } };
      } else if (operator === 'thisWeek') {
        const now = new Date();
        const start = new Date(now); start.setDate(now.getDate() - now.getDay()); start.setHours(0,0,0,0);
        const end = new Date(start); end.setDate(start.getDate() + 6); end.setHours(23,59,59,999);
        condition = { [colKey]: { gte: start, lte: end } };
      } else if (operator === 'thisMonth') {
        const now = new Date();
        const start = new Date(now.getFullYear(), now.getMonth(), 1);
        const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        condition = { [colKey]: { gte: start, lte: end } };
      } else if (operator === 'custom' && value && value2) {
        condition = { [colKey]: { gte: new Date(value), lte: new Date(value2 + 'T23:59:59') } };
      }
      if (condition) filterConditions.push(condition);
    }
    if (filterConditions.length > 0) {
      whereClause = { AND: [whereClause, ...filterConditions] };
    }

    let orderByClause = {};
    if (sortField === 'produk' || sortField === 'produk.kode') {
      orderByClause = { produk: { kode: sortOrder } };
    } else if (sortField === 'produk.nama') {
      orderByClause = { produk: { nama: sortOrder } };
    } else if (sortField === 'cabang' || sortField === 'cabang.nama') {
      orderByClause = { cabang: { nama: sortOrder } };
    } else {
      orderByClause[sortField] = sortOrder;
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
      ...(isExport ? { take: 1000 } : { skip, take: limit })
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
