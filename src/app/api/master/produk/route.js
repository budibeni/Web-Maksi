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
  aktif: z.number().int().min(0).max(1).default(1),
  upsert: z.boolean().optional()
});

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const kategori = searchParams.get('kategori'); // backward compatibility for string kode
    const kategori_id = searchParams.get('kategori_id');
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 10;
    const isExport = searchParams.get('export') === 'true';
    const sortBy = searchParams.get('sort_by') || 'id';
    const sortOrder = searchParams.get('sort_order') === 'asc' ? 'asc' : 'desc';
    
    let whereClause = {};
    
    if (kategori) {
      const kat = await prisma.kategoriProduk.findFirst({
        where: { kode: kategori.toUpperCase() }
      });
      if (kat) {
        whereClause.kategori_produk_id = kat.id;
      } else {
        return NextResponse.json({ success: true, message: "Data berhasil diambil.", data: [], pagination: { total: 0, page, limit, totalPages: 0 } });
      }
    }
    
    if (kategori_id && kategori_id !== "all") {
      whereClause.kategori_produk_id = BigInt(kategori_id);
    }
    
    if (search) {
      whereClause.OR = [
        { kode: { contains: search } },
        { nama: { contains: search } }
      ];
    }

    const totalData = await prisma.produk.count({
      where: whereClause
    });
    
    const skip = (page - 1) * limit;

    let orderByClause = {};
    if (sortBy === 'kategori') {
      orderByClause = { kategori: { nama: sortOrder } };
    } else {
      orderByClause[sortBy] = sortOrder;
    }

    const produks = await prisma.produk.findMany({
      where: whereClause,
      include: {
        kategori: true
      },
      orderBy: orderByClause,
      ...(isExport ? {} : { skip, take: limit })
    });

    const serializedData = JSON.parse(JSON.stringify(produks, (key, value) =>
      typeof value === 'bigint' ? value.toString() : value
    ));

    return NextResponse.json({
      success: true,
      message: "Data berhasil diambil.",
      data: serializedData,
      pagination: {
        total: totalData,
        page: page,
        limit: limit,
        totalPages: Math.ceil(totalData / limit)
      }
    });
  } catch (error) {
    console.error("GET Produk Error:", error);
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
    const result = produkSchema.safeParse(body);
    
    if (!result.success) {
      return NextResponse.json({
        success: false,
        message: "Validasi gagal.",
        errors: result.error.flatten().fieldErrors
      }, { status: 422 });
    }
    
    const { kategori_produk_id, kode, nama, satuan, harga_default, aktif, upsert } = result.data;
    
    // Check for unique kode
    const existing = await prisma.produk.findFirst({
      where: { kode }
    });

    if (existing) {
      if (upsert) {
        const currentUser = await getCurrentUsername(request);
        const updatedProduk = await prisma.produk.update({
          where: { id: existing.id },
          data: {
            kategori_produk_id: BigInt(kategori_produk_id),
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
        }, { status: 200 });
      }

      return NextResponse.json({
        success: false,
        message: "Kode Produk sudah digunakan."
      }, { status: 409 });
    }

    const currentUser = await getCurrentUsername(request);

    const newProduk = await prisma.produk.create({
      data: {
        kategori_produk_id: BigInt(kategori_produk_id),
        kode,
        nama,
        satuan,
        harga_default: !isNaN(parseFloat(harga_default)) ? parseFloat(harga_default) : 0,
        aktif,
        dibuat_oleh: currentUser
      },
      include: {
        kategori: true
      }
    });
    
    const serializedData = JSON.parse(JSON.stringify(newProduk, (key, value) =>
      typeof value === 'bigint' ? value.toString() : value
    ));
    
    return NextResponse.json({
      success: true,
      message: "Data Produk berhasil disimpan.",
      data: serializedData
    }, { status: 201 });
    
  } catch (error) {
    console.error("POST Produk Error:", error);
    return NextResponse.json({
      success: false,
      message: "Terjadi kesalahan pada server.",
      error: error.message || error.toString()
    }, { status: 500 });
  }
}
