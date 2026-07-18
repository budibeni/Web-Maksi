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
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;
    
    const sortField = searchParams.get('sortField') || 'id';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    // Build base where clause from global search
    let whereClause = search ? {
      OR: [
        { nama: { contains: search } },
        { telepon: { contains: search } }
      ]
    } : {};

    const roleName = (typeof user.role === 'object' ? user.role.nama : user.role || '').toLowerCase();

    // Terapkan filter hak akses data customer
    if (roleName === 'branch manager') {
      whereClause = {
        ...whereClause,
        OR: [
          {
            leads: {
              some: {
                cabang_id: BigInt(user.cabang_id)
              }
            }
          },
          { dibuat_oleh: user.nama },
          { diubah_oleh: user.nama }
        ]
      };
    } else if (roleName === 'sales') {
      whereClause = {
        ...whereClause,
        OR: [
          {
            leads: {
              some: {
                user_id: BigInt(user.id)
              }
            }
          },
          { dibuat_oleh: user.nama },
          { diubah_oleh: user.nama }
        ]
      };
    }

    // Parse column filters: filter[colKey][operator] & filter[colKey][value]
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
      if (operator === 'contains') condition = { [colKey]: { contains: value } };
      else if (operator === 'startsWith') condition = { [colKey]: { startsWith: value } };
      else if (operator === 'endsWith') condition = { [colKey]: { endsWith: value } };
      else if (operator === 'equals' || operator === 'eq') condition = { [colKey]: value };
      else if (operator === 'gt') condition = { [colKey]: { gt: isNaN(Number(value)) ? value : Number(value) } };
      else if (operator === 'lt') condition = { [colKey]: { lt: isNaN(Number(value)) ? value : Number(value) } };
      else if (operator === 'between' && value2) condition = { [colKey]: { gte: Number(value), lte: Number(value2) } };
      else if (operator === 'in') condition = { [colKey]: { in: value.split(',') } };
      else if (operator === 'today') {
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

    const customers = await prisma.customer.findMany({
      where: whereClause,
      orderBy: {
        [sortField]: sortOrder
      },
      skip,
      take: limit,
      include: {
        leads: {
          select: {
            status: true,
            nilai_deal: true,
            cabang: {
              select: {
                nama: true
              }
            }
          }
        }
      }
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
