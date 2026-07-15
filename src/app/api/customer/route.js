import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/jwt';
import { recordAuditLog } from '@/lib/audit';
import { z } from 'zod';

// Validasi input
const customerSchema = z.object({
  nama: z.string().min(1, "Nama wajib diisi.").max(150, "Maksimal 150 karakter."),
  telepon: z.string().min(1, "Nomor HP wajib diisi.").max(20, "Maksimal 20 karakter."),
  alamat: z.string().nullable().optional(),
  catatan: z.string().nullable().optional(),
});

// JSON Serializer untuk BigInt
function serializeData(data) {
  return JSON.parse(JSON.stringify(data, (key, value) =>
    typeof value === 'bigint' ? value.toString() : value
  ));
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;
    
    const sortField = searchParams.get('sortField') || 'id';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    let whereClause = search ? {
      OR: [
        { nama: { contains: search } },
        { telepon: { contains: search } }
      ]
    } : {};

    const customers = await prisma.customer.findMany({
      where: whereClause,
      orderBy: {
        [sortField]: sortOrder
      },
      skip,
      take: limit
    });

    const serializedData = serializeData(customers);

    const totalData = await prisma.customer.count({ where: whereClause });
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
    console.error('Error fetching customers:', error);
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan sistem' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const user = await getCurrentUser(request);
    if (!user) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

    const role = (user.role || '').toLowerCase();
    if (role === 'top management') {
      return NextResponse.json({ success: false, message: 'Top Management tidak diperbolehkan melakukan modifikasi data.' }, { status: 403 });
    }

    const body = await request.json();
    
    const result = customerSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.error.errors[0].message },
        { status: 400 }
      );
    }

    const { nama, telepon, alamat, catatan } = result.data;

    const newCustomer = await prisma.customer.create({
      data: {
        nama,
        telepon,
        alamat: alamat || null,
        catatan: catatan || null,
        dibuat_oleh: user.nama,
        diubah_oleh: user.nama,
      }
    });

    // Record Audit Log
    await recordAuditLog({
      user,
      modul: "CUSTOMER",
      aksi: "CREATE",
      referensi_id: newCustomer.id,
      deskripsi: `Membuat customer baru: ${nama} (${telepon})`,
      data_sesudah: newCustomer,
      request
    });

    return NextResponse.json({
      success: true,
      message: 'Data customer berhasil disimpan.',
      data: serializeData(newCustomer)
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating customer:', error);
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan sistem' },
      { status: 500 }
    );
  }
}
