import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/jwt';

const serialize = (data) => JSON.parse(JSON.stringify(data, (_, v) => typeof v === 'bigint' ? v.toString() : v));

export async function GET(request) {
  try {
    const user = await getCurrentUser(request);
    if (!user) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const startDateStr = searchParams.get('startDate') || '';
    const endDateStr = searchParams.get('endDate') || '';
    const cabang_id = searchParams.get('cabang_id') || '';
    const sales_id = searchParams.get('sales_id') || '';

    // Role-based filtering
    const role = (user.role || '').toLowerCase();
    let userFilter = {};
    if (role === 'sales') {
      userFilter = { user_id: BigInt(user.id) };
    } else if (role === 'branch manager') {
      userFilter = { cabang_id: BigInt(user.cabang_id) };
    }

    // Date range filtering
    let dateFilter = {};
    if (startDateStr || endDateStr) {
      dateFilter = {
        dibuat_tanggal: {
          ...(startDateStr ? { gte: new Date(`${startDateStr}T00:00:00`) } : {}),
          ...(endDateStr ? { lte: new Date(`${endDateStr}T23:59:59.999`) } : {}),
        }
      };
    } else {
      // Default: current month
      const now = new Date();
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      dateFilter = {
        dibuat_tanggal: {
          gte: firstDay,
          lte: lastDay
        }
      };
    }

    // Base query filter
    const baseFilter = {
      ...userFilter,
      ...dateFilter,
      ...(cabang_id ? { cabang_id: BigInt(cabang_id) } : {}),
      ...(sales_id ? { user_id: BigInt(sales_id) } : {}),
    };

    // 1. Core Summary Metrics
    const [
      totalLead,
      totalOpen,
      totalDeal,
      totalLost,
      aggregateDeal
    ] = await Promise.all([
      prisma.lead.count({ where: baseFilter }),
      prisma.lead.count({ where: { ...baseFilter, status: 1 } }),
      prisma.lead.count({ where: { ...baseFilter, status: 2 } }),
      prisma.lead.count({ where: { ...baseFilter, status: 3 } }),
      prisma.lead.aggregate({
        where: { ...baseFilter, status: 2 },
        _sum: { nilai_deal: true }
      })
    ]);

    const nilaiDeal = Number(aggregateDeal._sum.nilai_deal || 0);
    const conversionRate = totalLead > 0 ? (totalDeal / totalLead) * 100 : 0;
    const closingRate = (totalDeal + totalLost) > 0 ? (totalDeal / (totalDeal + totalLost)) * 100 : 0;

    // 2. Trend Lead (Monthly for the Current Year)
    const currentYear = new Date().getFullYear();
    const startOfYear = new Date(currentYear, 0, 1);
    const endOfYear = new Date(currentYear, 11, 31, 23, 59, 59, 999);

    const trendFilter = {
      ...userFilter,
      ...(cabang_id ? { cabang_id: BigInt(cabang_id) } : {}),
      ...(sales_id ? { user_id: BigInt(sales_id) } : {}),
      dibuat_tanggal: {
        gte: startOfYear,
        lte: endOfYear
      }
    };

    const trendLeads = await prisma.lead.findMany({
      where: trendFilter,
      select: {
        dibuat_tanggal: true,
        status: true
      }
    });

    const monthNames = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
    const monthlyTrend = monthNames.map((name, index) => {
      const leadsInMonth = trendLeads.filter(l => new Date(l.dibuat_tanggal).getMonth() === index);
      return {
        name,
        total: leadsInMonth.length,
        deal: leadsInMonth.filter(l => l.status === 2).length,
        lost: leadsInMonth.filter(l => l.status === 3).length
      };
    });

    // 3. Distribusi Fase (Open Leads only)
    const [faseBaru, faseFollowUp, fasePenawaran] = await Promise.all([
      prisma.lead.count({ where: { ...baseFilter, status: 1, fase: 1 } }),
      prisma.lead.count({ where: { ...baseFilter, status: 1, fase: 2 } }),
      prisma.lead.count({ where: { ...baseFilter, status: 1, fase: 3 } })
    ]);

    const distribusiFase = [
      { name: "Lead Baru", count: faseBaru },
      { name: "Follow Up", count: faseFollowUp },
      { name: "Penawaran", count: fasePenawaran }
    ];

    // 4. Funnel Penjualan (Total Leads -> Penawaran -> Deal)
    // Leads in penawaran are those with some quotation generated
    const leadsWithQuotations = await prisma.lead.count({
      where: {
        ...baseFilter,
        versi_penawarans: {
          some: {}
        }
      }
    });

    const funnelPenjualan = [
      { step: "Total Leads", count: totalLead },
      { step: "Penawaran", count: leadsWithQuotations },
      { step: "Deal", count: totalDeal }
    ];

    // 5. Top Sales (Deals + Nilai)
    const salesDeals = await prisma.lead.findMany({
      where: {
        ...baseFilter,
        status: 2
      },
      select: {
        nilai_deal: true,
        user: {
          select: {
            id: true,
            nama: true
          }
        }
      }
    });

    const salesMap = {};
    salesDeals.forEach(l => {
      const key = l.user.id.toString();
      if (!salesMap[key]) {
        salesMap[key] = { name: l.user.nama, count: 0, nilai: 0 };
      }
      salesMap[key].count++;
      salesMap[key].nilai += l.nilai_deal ? Number(l.nilai_deal) : 0;
    });

    const topSales = Object.values(salesMap)
      .sort((a, b) => b.nilai - a.nilai)
      .slice(0, 5);

    // 6. Ringkasan Cabang (Leads, Deals, Nilai)
    const cabangLeads = await prisma.lead.findMany({
      where: baseFilter,
      select: {
        status: true,
        nilai_deal: true,
        cabang: {
          select: {
            id: true,
            nama: true
          }
        }
      }
    });

    const cabangMap = {};
    cabangLeads.forEach(l => {
      const key = l.cabang.id.toString();
      if (!cabangMap[key]) {
        cabangMap[key] = { name: l.cabang.nama, total: 0, deal: 0, nilai: 0 };
      }
      cabangMap[key].total++;
      if (l.status === 2) {
        cabangMap[key].deal++;
        cabangMap[key].nilai += l.nilai_deal ? Number(l.nilai_deal) : 0;
      }
    });

    const ringkasanCabang = Object.values(cabangMap)
      .sort((a, b) => b.nilai - a.nilai)
      .slice(0, 5);

    // 7. Active Reminders (5 closest)
    const reminders = await prisma.pengingat.findMany({
      where: {
        status: 'AKTIF',
        lead: {
          ...userFilter,
          ...(cabang_id ? { cabang_id: BigInt(cabang_id) } : {}),
          ...(sales_id ? { user_id: BigInt(sales_id) } : {}),
        }
      },
      include: {
        lead: {
          select: {
            nomor: true,
            customer: { select: { nama: true, telepon: true } },
            user: { select: { nama: true } }
          }
        }
      },
      orderBy: { tanggal_pengingat: 'asc' },
      take: 5
    });

    // 8. Recent Activities (5 latest)
    const recentActivities = await prisma.aktivitasLead.findMany({
      where: {
        lead: {
          ...userFilter,
          ...(cabang_id ? { cabang_id: BigInt(cabang_id) } : {}),
          ...(sales_id ? { user_id: BigInt(sales_id) } : {}),
        }
      },
      include: {
        lead: {
          select: {
            nomor: true,
            customer: { select: { nama: true } }
          }
        },
        hasil_interaksi_rel: { select: { warna: true } }
      },
      orderBy: { id: 'desc' },
      take: 5
    });

    // 9. Fetch Filter options if admin/top/bm
    let branches = [];
    let sales = [];

    if (role === 'administrator' || role === 'top management') {
      branches = await prisma.cabang.findMany({ where: { aktif: 1 }, select: { id: true, nama: true, kode: true } });
      sales = await prisma.user.findMany({ where: { aktif: 1 }, select: { id: true, nama: true, username: true, cabang_id: true } });
    } else if (role === 'branch manager') {
      sales = await prisma.user.findMany({
        where: { aktif: 1, cabang_id: BigInt(user.cabang_id) },
        select: { id: true, nama: true, username: true, cabang_id: true }
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Data dashboard berhasil diambil.',
      data: serialize({
        summary: {
          totalLead,
          totalOpen,
          totalDeal,
          totalLost,
          nilaiDeal,
          conversionRate: parseFloat(conversionRate.toFixed(2)),
          closingRate: parseFloat(closingRate.toFixed(2)),
        },
        monthlyTrend,
        distribusiFase,
        funnelPenjualan,
        topSales,
        ringkasanCabang,
        reminders,
        recentActivities,
        filters: {
          branches,
          sales
        }
      })
    });

  } catch (error) {
    console.error('GET Dashboard Error:', error);
    return NextResponse.json({
      success: false,
      message: 'Terjadi kesalahan pada server.',
      error: error.message || error.toString()
    }, { status: 500 });
  }
}
