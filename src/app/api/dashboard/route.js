import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/jwt';
import dayjs from '@/lib/dayjs';

const serialize = (data) => JSON.parse(JSON.stringify(data, (_, v) => typeof v === 'bigint' ? v.toString() : v));

export async function GET(request) {
  try {
    const user = await getCurrentUser(request);
    if (!user) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const startDateStr = searchParams.get('startDate') || '';
    const endDateStr = searchParams.get('endDate') || '';
    const raw_cabang_id = searchParams.get('cabang_id') || '';
    const raw_sales_id = searchParams.get('sales_id') || '';

    // Support multiple IDs (comma-separated)
    let cabangIds = [];
    if (raw_cabang_id) {
      cabangIds = raw_cabang_id.split(',').map(id => BigInt(id));
    }
    let salesIds = [];
    if (raw_sales_id) {
      salesIds = raw_sales_id.split(',').map(id => BigInt(id));
    }

    // Role-based filtering and security enforcement
    const role = (user.role || '').toLowerCase();
    
    if (role === 'sales') {
      // Sales can only view their own leads
      salesIds = [BigInt(user.id)];
      cabangIds = [];
    } else if (role === 'branch manager' || role === 'bm') {
      // Branch Manager can only view their own branch
      cabangIds = [BigInt(user.cabang_id)];
      
      // Filter sales IDs to only those belonging to the BM's cabang
      if (salesIds.length > 0) {
        const branchSales = await prisma.user.findMany({
          where: {
            id: { in: salesIds },
            cabang_id: BigInt(user.cabang_id),
            aktif: 1
          },
          select: { id: true }
        });
        salesIds = branchSales.map(s => s.id);
        if (salesIds.length === 0) {
          salesIds = [0n];
        }
      }
    }

    // Date range filtering (Asia/Jakarta timezone)
    let dateFilter = {};
    if (startDateStr || endDateStr) {
      dateFilter = {
        dibuat_tanggal: {
          ...(startDateStr ? { gte: dayjs.tz(`${startDateStr} 00:00:00`, 'Asia/Jakarta').toDate() } : {}),
          ...(endDateStr ? { lte: dayjs.tz(`${endDateStr} 23:59:59.999`, 'Asia/Jakarta').toDate() } : {}),
        }
      };
    } else {
      // Default: current month
      const startOfMonth = dayjs().tz('Asia/Jakarta').startOf('month').toDate();
      const endOfMonth = dayjs().tz('Asia/Jakarta').endOf('month').toDate();
      dateFilter = {
        dibuat_tanggal: {
          gte: startOfMonth,
          lte: endOfMonth
        }
      };
    }

    // Base query filter
    const baseFilter = {
      ...dateFilter,
      ...(cabangIds.length > 0 ? { cabang_id: { in: cabangIds } } : {}),
      ...(salesIds.length > 0 ? { user_id: { in: salesIds } } : {}),
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

    // 2. Trend Lead (Harian atau Bulanan berdasarkan panjang rentang tanggal)
    const now = dayjs().tz('Asia/Jakarta');
    
    // Tentukan rentang aktif berdasarkan filter
    const filterStart = startDateStr ? dayjs.tz(startDateStr, 'Asia/Jakarta').startOf('day') : now.startOf('month');
    const filterEnd = endDateStr ? dayjs.tz(endDateStr, 'Asia/Jakarta').endOf('day') : now.endOf('month');
    const rangeDays = filterEnd.diff(filterStart, 'day') + 1;
    
    // Jika rentang <= 31 hari -> tampilkan tren HARIAN, else BULANAN
    const isDaily = rangeDays <= 31;
    let trendLabel = '';  // label untuk judul chart
    let trendData = [];

    if (isDaily) {
      // Untuk filter "Hari ini" (1 hari), gunakan 7 hari terakhir sebagai rentang tren
      let trendStart = filterStart;
      let trendEnd = filterEnd;
      if (rangeDays === 1) {
        trendStart = now.subtract(6, 'day').startOf('day');
        trendEnd = now.endOf('day');
        trendLabel = '7 Hari Terakhir';
      } else {
        trendLabel = `${filterStart.format('D MMM')} - ${filterEnd.format('D MMM YYYY')}`;
      }

      const trendFilter = {
        ...(cabangIds.length > 0 ? { cabang_id: { in: cabangIds } } : {}),
        ...(salesIds.length > 0 ? { user_id: { in: salesIds } } : {}),
        dibuat_tanggal: {
          gte: trendStart.toDate(),
          lte: trendEnd.toDate()
        }
      };

      const trendLeads = await prisma.lead.findMany({
        where: trendFilter,
        select: { dibuat_tanggal: true, status: true }
      });

      // Generate semua hari dalam rentang tren
      const totalDays = trendEnd.diff(trendStart, 'day') + 1;
      trendData = Array.from({ length: totalDays }, (_, i) => {
        const day = trendStart.add(i, 'day');
        const dayStr = day.format('YYYY-MM-DD');
        const leadsOnDay = trendLeads.filter(l => 
          dayjs(l.dibuat_tanggal).tz('Asia/Jakarta').format('YYYY-MM-DD') === dayStr
        );
        return {
          name: day.format('D/M'),  // label: "16/7"
          fullDate: dayStr,
          total: leadsOnDay.length,
          deal: leadsOnDay.filter(l => l.status === 2).length,
          lost: leadsOnDay.filter(l => l.status === 3).length
        };
      });

    } else {
      // Mode BULANAN: 12 bulan dari tahun filter aktif
      let trendYear = now.year();
      if (startDateStr) trendYear = dayjs(startDateStr).year();
      else if (endDateStr) trendYear = dayjs(endDateStr).year();

      trendLabel = `Tahun ${trendYear}`;
      
      const startOfYear = dayjs.tz(`${trendYear}-01-01 00:00:00`, 'Asia/Jakarta').toDate();
      const endOfYear = dayjs.tz(`${trendYear}-12-31 23:59:59.999`, 'Asia/Jakarta').toDate();

      const trendFilter = {
        ...(cabangIds.length > 0 ? { cabang_id: { in: cabangIds } } : {}),
        ...(salesIds.length > 0 ? { user_id: { in: salesIds } } : {}),
        dibuat_tanggal: { gte: startOfYear, lte: endOfYear }
      };

      const trendLeads = await prisma.lead.findMany({
        where: trendFilter,
        select: { dibuat_tanggal: true, status: true }
      });

      const monthNames = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
      trendData = monthNames.map((name, index) => {
        const leadsInMonth = trendLeads.filter(l =>
          dayjs(l.dibuat_tanggal).tz('Asia/Jakarta').month() === index
        );
        return {
          name,
          total: leadsInMonth.length,
          deal: leadsInMonth.filter(l => l.status === 2).length,
          lost: leadsInMonth.filter(l => l.status === 3).length
        };
      });
    }

    const monthlyTrend = trendData; // Alias agar tidak breaking pada response
    const trendYear = isDaily ? filterStart.year() : (startDateStr ? dayjs(startDateStr).year() : now.year());


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
          ...(cabangIds.length > 0 ? { cabang_id: { in: cabangIds } } : {}),
          ...(salesIds.length > 0 ? { user_id: { in: salesIds } } : {}),
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
          ...(cabangIds.length > 0 ? { cabang_id: { in: cabangIds } } : {}),
          ...(salesIds.length > 0 ? { user_id: { in: salesIds } } : {}),
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
        trendYear,
        trendLabel,
        isDaily,
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
