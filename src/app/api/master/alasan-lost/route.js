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
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 10;
    const isExport = searchParams.get('export') === 'true';
    const sortField = searchParams.get('sortField') || 'id';
    const sortOrder = (searchParams.get('sortOrder') || 'desc') === 'asc' ? 'asc' : 'desc';

    let whereClause = {};

    if (search) {
      whereClause.OR = [
        { kode: { contains: search } },
        { nama: { contains: search } }
      ];
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
      if (!operator || value === null || value === '') continue;

      let condition = null;
      if (operator === 'contains') condition = { [colKey]: { contains: value } };
      else if (operator === 'startsWith') condition = { [colKey]: { startsWith: value } };
      else if (operator === 'endsWith') condition = { [colKey]: { endsWith: value } };
      else if (operator === 'equals' || operator === 'eq') {
        condition = { [colKey]: colKey === 'aktif' ? parseInt(value) : value };
      }
      if (condition) filterConditions.push(condition);
    }
    if (filterConditions.length > 0) {
      whereClause = { AND: [whereClause, ...filterConditions] };
    }

    const totalData = await prisma.alasanLost.count({ where: whereClause });

    const orderByClause = { [sortField]: sortOrder };
    const take = isExport ? 1000 : limit;
    const skip = isExport ? 0 : (page - 1) * limit;

    const data = await prisma.alasanLost.findMany({
      where: whereClause,
      orderBy: orderByClause,
      take,
      skip
    });

    const serializedData = JSON.parse(JSON.stringify(data, (key, value) =>
      typeof value === 'bigint' ? value.toString() : value
    ));

    if (isExport) {
      return NextResponse.json({ success: true, message: "Data berhasil diambil.", data: serializedData });
    }

    return NextResponse.json({
      success: true,
      message: "Data berhasil diambil.",
      data: serializedData,
      pagination: {
        totalData,
        totalPages: Math.ceil(totalData / limit),
        page,
        limit
      }
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
    
    const existing = await prisma.alasanLost.findFirst({ where: { kode } });
    if (existing) {
      return NextResponse.json({
        success: false,
        message: "Kode Alasan Lost sudah digunakan."
      }, { status: 409 });
    }

    const existingNama = await prisma.alasanLost.findFirst({ where: { nama } });
    if (existingNama) {
      return NextResponse.json({
        success: false,
        message: "Nama Alasan Lost sudah digunakan."
      }, { status: 409 });
    }

    const currentUser = await getCurrentUsername(request);

    const newData = await prisma.alasanLost.create({
      data: { kode, nama, aktif, dibuat_oleh: currentUser }
    });
    
    const serializedData = JSON.parse(JSON.stringify(newData, (key, value) =>
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
