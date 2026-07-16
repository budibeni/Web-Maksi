import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/jwt';

const serialize = (data) => JSON.parse(JSON.stringify(data, (_, v) => typeof v === 'bigint' ? v.toString() : v));

// GET /api/aktivitas - Riwayat Aktivitas Lead
export async function GET(request) {
  try {
    const user = await getCurrentUser(request);
    if (!user) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const cabang_id = searchParams.get('cabang_id') || '';
    const sales_id = searchParams.get('sales_id') || '';
    const hasil_interaksi_id = searchParams.get('hasil_interaksi_id') || '';
    const sortField = searchParams.get('sortField') || 'id';
    const sortOrder = (searchParams.get('sortOrder') || 'desc') === 'asc' ? 'asc' : 'desc';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    // Role-based filtering
    const role = user.role?.toLowerCase();
    let userFilter = {};
    if (role === 'sales') {
      userFilter = { user_id: BigInt(user.id) };
    } else if (role === 'branch manager') {
      userFilter = { lead: { cabang_id: BigInt(user.cabang_id) } };
    }

    let where = {
      ...userFilter,
      ...(cabang_id ? { lead: { cabang_id: BigInt(cabang_id) } } : {}),
      ...(sales_id ? { user_id: BigInt(sales_id) } : {}),
      ...(hasil_interaksi_id ? { hasil_interaksi_id: BigInt(hasil_interaksi_id) } : {}),
      ...(search ? {
        OR: [
          { catatan: { contains: search } },
          { hasil_interaksi: { contains: search } },
          { lead: { nomor: { contains: search } } },
          { lead: { customer: { nama: { contains: search } } } },
        ]
      } : {}),
    };

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
      if (colKey === 'lead.nomor') {
        if (operator === 'contains') condition = { lead: { nomor: { contains: value } } };
        else if (operator === 'equals') condition = { lead: { nomor: value } };
      } else if (colKey === 'lead.customer.nama') {
        if (operator === 'contains') condition = { lead: { customer: { nama: { contains: value } } } };
        else if (operator === 'equals') condition = { lead: { customer: { nama: value } } };
      } else if (operator === 'contains') condition = { [colKey]: { contains: value } };
      else if (operator === 'startsWith') condition = { [colKey]: { startsWith: value } };
      else if (operator === 'endsWith') condition = { [colKey]: { endsWith: value } };
      else if (operator === 'equals' || operator === 'eq') {
        condition = { [colKey]: colKey === 'cabang_id' || colKey === 'user_id' || colKey === 'hasil_interaksi_id' ? BigInt(value) : value };
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
      where = { AND: [where, ...filterConditions] };
    }

    let orderByClause = {};
    if (sortField === 'lead.nomor') {
      orderByClause = { lead: { nomor: sortOrder } };
    } else if (sortField === 'lead.customer.nama') {
      orderByClause = { lead: { customer: { nama: sortOrder } } };
    } else {
      orderByClause[sortField] = sortOrder;
    }

    const activities = await prisma.aktivitasLead.findMany({
      where,
      include: {
        lead: {
          select: {
            id: true,
            nomor: true,
            status: true,
            fase: true,
            customer: {
              select: {
                id: true,
                nama: true,
                telepon: true,
              }
            },
            cabang: {
              select: {
                id: true,
                nama: true,
              }
            }
          }
        },
        hasil_interaksi_rel: {
          select: {
            id: true,
            nama: true,
            warna: true,
            ikon: true,
          }
        }
      },
      orderBy: orderByClause,
      skip,
      take: limit,
    });

    const totalData = await prisma.aktivitasLead.count({ where });
    const totalPages = Math.ceil(totalData / limit);

    return NextResponse.json({
      success: true,
      data: serialize(activities),
      pagination: { page, limit, totalData, totalPages },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, message: 'Terjadi kesalahan sistem' }, { status: 500 });
  }
}
