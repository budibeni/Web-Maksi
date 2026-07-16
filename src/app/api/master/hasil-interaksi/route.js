import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/jwt';
import { recordAuditLog } from '@/lib/audit';
import { z } from 'zod';

const serialize = (data) => JSON.parse(JSON.stringify(data, (_, v) => typeof v === 'bigint' ? v.toString() : v));

const hasilInteraksiSchema = z.object({
  kode: z.string().min(1, "Kode wajib diisi.").max(30, "Maksimal 30 karakter."),
  nama: z.string().min(1, "Nama wajib diisi.").max(150, "Maksimal 150 karakter."),
  fase_lead: z.enum(["LEAD_BARU", "FOLLOW_UP", "PENAWARAN"], {
    errorMap: () => ({ message: "Fase lead harus berupa LEAD_BARU, FOLLOW_UP, atau PENAWARAN." })
  }),
  urutan: z.number().int().default(0),
  warna: z.string().max(20).optional().nullable(),
  ikon: z.string().max(50).optional().nullable(),
  aktif: z.number().int().min(0).max(1).default(1)
});

// GET /api/master/hasil-interaksi
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const aktifOnly = searchParams.get('aktif') === '1';
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 10;
    const isExport = searchParams.get('export') === 'true';
    const sortField = searchParams.get('sortField') || 'urutan';
    const sortOrder = (searchParams.get('sortOrder') || 'asc') === 'asc' ? 'asc' : 'desc';

    // If called without pagination params (legacy usage for dropdowns etc.), return all aktif data
    const isPaginated = searchParams.has('page') || searchParams.has('limit') || searchParams.has('search') || isExport;

    if (!isPaginated) {
      const data = await prisma.hasilInteraksi.findMany({
        where: aktifOnly ? { aktif: 1 } : {},
        orderBy: { urutan: 'asc' },
      });
      return NextResponse.json({ success: true, message: 'Data berhasil diambil.', data: serialize(data) });
    }

    let whereClause = {};

    if (aktifOnly) {
      whereClause.aktif = 1;
    }

    if (search) {
      whereClause.OR = [
        { kode: { contains: search } },
        { nama: { contains: search } },
        { fase_lead: { contains: search } }
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
      else if (operator === 'equals' || operator === 'eq') {
        condition = { [colKey]: colKey === 'aktif' ? parseInt(value) : value };
      }
      if (condition) filterConditions.push(condition);
    }
    if (filterConditions.length > 0) {
      whereClause = { AND: [whereClause, ...filterConditions] };
    }

    const totalData = await prisma.hasilInteraksi.count({ where: whereClause });
    const orderByClause = { [sortField]: sortOrder };
    const take = isExport ? 1000 : limit;
    const skip = isExport ? 0 : (page - 1) * limit;

    const data = await prisma.hasilInteraksi.findMany({
      where: whereClause,
      orderBy: orderByClause,
      take,
      skip
    });

    if (isExport) {
      return NextResponse.json({ success: true, message: 'Data berhasil diambil.', data: serialize(data) });
    }

    return NextResponse.json({
      success: true,
      message: 'Data berhasil diambil.',
      data: serialize(data),
      pagination: {
        totalData,
        totalPages: Math.ceil(totalData / limit),
        page,
        limit
      }
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, message: 'Terjadi kesalahan sistem' }, { status: 500 });
  }
}


// POST /api/master/hasil-interaksi
export async function POST(request) {
  try {
    const currentUser = await getCurrentUser(request);
    if (!currentUser) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const result = hasilInteraksiSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({
        success: false,
        message: "Validasi gagal.",
        errors: result.error.flatten().fieldErrors
      }, { status: 422 });
    }

    const { kode, nama, fase_lead, urutan, warna, ikon, aktif } = result.data;

    // Check for unique kode
    const existingKode = await prisma.hasilInteraksi.findUnique({
      where: { kode }
    });

    if (existingKode) {
      return NextResponse.json({
        success: false,
        message: "Kode Hasil Interaksi sudah digunakan."
      }, { status: 409 });
    }

    // Check for unique nama
    const existingNama = await prisma.hasilInteraksi.findUnique({
      where: { nama }
    });

    if (existingNama) {
      return NextResponse.json({
        success: false,
        message: "Nama Hasil Interaksi sudah digunakan."
      }, { status: 409 });
    }

    const newHasil = await prisma.hasilInteraksi.create({
      data: {
        kode,
        nama,
        fase_lead,
        urutan,
        warna: warna || null,
        ikon: ikon || null,
        aktif,
        dibuat_oleh: currentUser.nama || currentUser.username
      }
    });

    // Record Audit Log
    await recordAuditLog({
      user: currentUser,
      modul: "HASIL_INTERAKSI",
      aksi: "CREATE",
      referensi_id: newHasil.id,
      deskripsi: `Membuat hasil interaksi baru: ${nama} (${kode})`,
      data_sesudah: newHasil,
      request
    });

    return NextResponse.json({
      success: true,
      message: "Data Hasil Interaksi berhasil disimpan.",
      data: serialize(newHasil)
    }, { status: 201 });

  } catch (error) {
    console.error("POST Hasil Interaksi Error:", error);
    return NextResponse.json({
      success: false,
      message: "Terjadi kesalahan pada server.",
      error: error.message || error.toString()
    }, { status: 500 });
  }
}

