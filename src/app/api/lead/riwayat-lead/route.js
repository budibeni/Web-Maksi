import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/jwt';

const serialize = (data) => JSON.parse(JSON.stringify(data, (_, v) => typeof v === 'bigint' ? v.toString() : v));

export async function GET(request) {
  try {
    const user = await getCurrentUser(request);
    if (!user) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const startDateStr = searchParams.get('startDate') || '';
    const endDateStr = searchParams.get('endDate') || '';
    const sales_id = searchParams.get('sales_id') || '';
    const cabang_id = searchParams.get('cabang_id') || '';
    const fase = searchParams.get('fase') || '';
    const status = searchParams.get('status') || '';
    
    // Pagination params
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    // Role-based filtering
    const role = (user.role || '').toLowerCase();
    let userFilter = {};
    if (role === 'sales') {
      userFilter = { user_id: BigInt(user.id) };
    } else if (role === 'branch manager') {
      userFilter = { cabang_id: BigInt(user.cabang_id) };
    }

    // Base filters based on user role + date + sales/cabang filters
    // This forms the filter set for the summary cards
    const baseFilters = {
      ...userFilter,
      ...(sales_id ? { user_id: BigInt(sales_id) } : {}),
      ...(cabang_id ? { cabang_id: BigInt(cabang_id) } : {}),
      ...(startDateStr || endDateStr ? {
        dibuat_tanggal: {
          ...(startDateStr ? { gte: new Date(`${startDateStr}T00:00:00`) } : {}),
          ...(endDateStr ? { lte: new Date(`${endDateStr}T23:59:59.999`) } : {}),
        }
      } : {}),
      ...(search ? {
        OR: [
          { nomor: { contains: search } },
          { customer: { nama: { contains: search } } },
          { customer: { telepon: { contains: search } } },
          { customer: { alamat: { contains: search } } },
          { catatan_awal: { contains: search } },
        ]
      } : {}),
    };

    // Calculate dynamic summary stats using the base filters (ignoring fase and status filters)
    const [
      totalLeads,
      totalBaru,
      totalFollowUp,
      totalPenawaran,
      totalDeal,
      totalLost
    ] = await Promise.all([
      prisma.lead.count({ where: baseFilters }),
      prisma.lead.count({ where: { ...baseFilters, fase: 1 } }),
      prisma.lead.count({ where: { ...baseFilters, fase: 2 } }),
      prisma.lead.count({ where: { ...baseFilters, fase: 3 } }),
      prisma.lead.count({ where: { ...baseFilters, status: 2 } }),
      prisma.lead.count({ where: { ...baseFilters, status: 3 } }),
    ]);

    // Apply the specific fase and status filters to query the actual list
    let listFilters = {
      ...baseFilters,
      ...(fase ? { fase: parseInt(fase) } : {}),
      ...(status ? { status: parseInt(status) } : {}),
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
      if (colKey === 'customer_nama') {
        if (operator === 'contains') condition = { customer: { nama: { contains: value } } };
        else if (operator === 'equals') condition = { customer: { nama: value } };
        else if (operator === 'startsWith') condition = { customer: { nama: { startsWith: value } } };
        else if (operator === 'endsWith') condition = { customer: { nama: { endsWith: value } } };
      } else if (colKey === 'sales_nama') {
        if (operator === 'contains') condition = { user: { nama: { contains: value } } };
        else if (operator === 'equals') condition = { user: { nama: value } };
      } else if (colKey === 'cabang_nama') {
        if (operator === 'contains') condition = { cabang: { nama: { contains: value } } };
        else if (operator === 'equals') condition = { cabang: { nama: value } };
      } else if (colKey === 'fase') {
        condition = { fase: parseInt(value) };
      } else if (colKey === 'status') {
        condition = { status: parseInt(value) };
      } else if (operator === 'contains') condition = { [colKey]: { contains: value } };
      else if (operator === 'startsWith') condition = { [colKey]: { startsWith: value } };
      else if (operator === 'endsWith') condition = { [colKey]: { endsWith: value } };
      else if (operator === 'equals' || operator === 'eq') {
        condition = { [colKey]: value };
      } else if (operator === 'today') {
        const start = new Date(); start.setHours(0,0,0,0);
        const end = new Date(); end.setHours(23,59,59,999);
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
      listFilters = { AND: [listFilters, ...filterConditions] };
    }

    // Sorting
    const sortField = searchParams.get('sortField') || 'dibuat_tanggal';
    const sortOrder = (searchParams.get('sortOrder') || 'desc') === 'asc' ? 'asc' : 'desc';
    let orderByClause = {};
    if (sortField === 'customer_nama') {
      orderByClause = { customer: { nama: sortOrder } };
    } else if (sortField === 'sales_nama') {
      orderByClause = { user: { nama: sortOrder } };
    } else if (sortField === 'cabang_nama') {
      orderByClause = { cabang: { nama: sortOrder } };
    } else {
      orderByClause[sortField] = sortOrder;
    }

    // Query list count
    const filteredCount = await prisma.lead.count({ where: listFilters });

    // Fetch leads data
    const leads = await prisma.lead.findMany({
      where: listFilters,
      include: {
        customer: { select: { nama: true, telepon: true, catatan: true } },
        user: { select: { nama: true } },
        cabang: { select: { nama: true } },
        versi_penawaran_final: { select: { grand_total: true } },
        aktivitas_leads: {
          select: { dibuat_tanggal: true },
          orderBy: { id: 'desc' },
          take: 1
        }
      },
      orderBy: orderByClause,
      skip,
      take: limit,
    });

    // Format final list items
    const data = leads.map(lead => {
      // Find latest follow up date
      const latestFollowUp = lead.aktivitas_leads && lead.aktivitas_leads.length > 0
        ? lead.aktivitas_leads[0].dibuat_tanggal
        : null;

      // Determine Nilai Potensi: Use final quotation's grand_total if present
      let nilaiPotensi = null;
      if (lead.versi_penawaran_final) {
        nilaiPotensi = Number(lead.versi_penawaran_final.grand_total);
      } else if (lead.status === 2 && lead.nilai_deal) {
        nilaiPotensi = Number(lead.nilai_deal);
      } else if (lead.status === 3 && lead.nilai_lost) {
        nilaiPotensi = Number(lead.nilai_lost);
      }

      return {
        id: lead.id,
        nomor: lead.nomor,
        customer_nama: lead.customer.nama,
        customer_telepon: lead.customer.telepon,
        sales_nama: lead.user?.nama || 'Unknown',
        cabang_nama: lead.cabang?.nama || 'Unknown',
        fase: lead.fase, // 1=LEAD_BARU, 2=FOLLOW_UP, 3=PENAWARAN
        status: lead.status, // 1=OPEN, 2=DEAL, 3=LOST
        dibuat_tanggal: lead.dibuat_tanggal,
        terakhir_follow_up: latestFollowUp,
        nilai_potensi: nilaiPotensi,
      };
    });

    return NextResponse.json(serialize({
      success: true,
      data: {
        summary: {
          totalLeads,
          totalBaru,
          totalFollowUp,
          totalPenawaran,
          totalDeal,
          totalLost
        },
        pagination: {
          total: filteredCount,
          page,
          limit,
          totalPages: Math.ceil(filteredCount / limit),
        },
        leads: data
      }
    }));
  } catch (error) {
    console.error('GET /api/lead/riwayat-lead Error:', error);
    return NextResponse.json({ success: false, message: 'Terjadi kesalahan sistem.', error: error.message }, { status: 500 });
  }
}
