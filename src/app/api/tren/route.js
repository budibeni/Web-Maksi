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

    // Role-based filtering
    const role = (user.role || '').toLowerCase();
    
    if (role === 'sales') {
      salesIds = [BigInt(user.id)];
      cabangIds = [];
    } else if (role === 'branch manager' || role === 'bm') {
      cabangIds = [BigInt(user.cabang_id)];
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

    // Date range filtering
    let dateFilter = {};
    if (startDateStr || endDateStr) {
      dateFilter = {
        dibuat_tanggal: {
          ...(startDateStr ? { gte: dayjs.tz(`${startDateStr} 00:00:00`, 'Asia/Jakarta').toDate() } : {}),
          ...(endDateStr ? { lte: dayjs.tz(`${endDateStr} 23:59:59.999`, 'Asia/Jakarta').toDate() } : {}),
        }
      };
    } else {
      const startOfMonth = dayjs().tz('Asia/Jakarta').startOf('month').toDate();
      const endOfMonth = dayjs().tz('Asia/Jakarta').endOf('month').toDate();
      dateFilter = {
        dibuat_tanggal: {
          gte: startOfMonth,
          lte: endOfMonth
        }
      };
    }

    const baseFilter = {
      ...dateFilter,
      ...(cabangIds.length > 0 ? { cabang_id: { in: cabangIds } } : {}),
      ...(salesIds.length > 0 ? { user_id: { in: salesIds } } : {}),
    };

    // Load master references to map names
    const [allCategories, allNeeds, allLeads] = await Promise.all([
      prisma.kategoriProduk.findMany({ select: { id: true, nama: true } }),
      prisma.kebutuhan.findMany({ select: { id: true, nama: true } }),
      prisma.lead.findMany({
        where: baseFilter,
        select: {
          id: true,
          status: true,
          kategori: true,
          kebutuhan: true,
          nilai_deal: true,
        }
      })
    ]);

    // Create lookup maps
    const categoryMap = {};
    allCategories.forEach(c => { categoryMap[c.id.toString()] = c.nama; });

    const needMap = {};
    allNeeds.forEach(n => { needMap[n.id.toString()] = n.nama; });

    // Aggregators
    const categoryStats = {};
    const needStats = {};

    allLeads.forEach(lead => {
      // 1. Process Kategori
      let kats = [];
      try {
        if (lead.kategori) {
          kats = JSON.parse(lead.kategori);
          if (!Array.isArray(kats)) kats = [];
        }
      } catch (e) {
        kats = [];
      }

      kats.forEach(kId => {
        const key = kId.toString();
        const nama = categoryMap[key] || `Kategori #${key}`;
        if (!categoryStats[key]) {
          categoryStats[key] = { id: key, nama, totalLeads: 0, openCount: 0, dealCount: 0, lostCount: 0, revenue: 0 };
        }
        categoryStats[key].totalLeads++;
        if (lead.status === 1) {
          categoryStats[key].openCount++;
        } else if (lead.status === 2) {
          categoryStats[key].dealCount++;
          categoryStats[key].revenue += lead.nilai_deal ? Number(lead.nilai_deal) : 0;
        } else if (lead.status === 3) {
          categoryStats[key].lostCount++;
        }
      });

      // 2. Process Kebutuhan
      let kebs = [];
      try {
        if (lead.kebutuhan) {
          kebs = JSON.parse(lead.kebutuhan);
          if (!Array.isArray(kebs)) kebs = [];
        }
      } catch (e) {
        kebs = [];
      }

      kebs.forEach(kId => {
        const key = kId.toString();
        const nama = needMap[key] || `Kebutuhan #${key}`;
        if (!needStats[key]) {
          needStats[key] = { id: key, nama, totalLeads: 0, openCount: 0, dealCount: 0, lostCount: 0, revenue: 0 };
        }
        needStats[key].totalLeads++;
        if (lead.status === 1) {
          needStats[key].openCount++;
        } else if (lead.status === 2) {
          needStats[key].dealCount++;
          needStats[key].revenue += lead.nilai_deal ? Number(lead.nilai_deal) : 0;
        } else if (lead.status === 3) {
          needStats[key].lostCount++;
        }
      });
    });

    // Calculate percentages & conversion rates
    const totalLeadsCount = allLeads.length;

    const kategoriTrends = Object.values(categoryStats).map(stat => {
      const sharePercent = totalLeadsCount > 0 ? (stat.totalLeads / totalLeadsCount) * 100 : 0;
      const conversionRate = stat.totalLeads > 0 ? (stat.dealCount / stat.totalLeads) * 100 : 0;
      return {
        ...stat,
        sharePercent: parseFloat(sharePercent.toFixed(1)),
        conversionRate: parseFloat(conversionRate.toFixed(1))
      };
    }).sort((a, b) => b.totalLeads - a.totalLeads);

    const kebutuhanTrends = Object.values(needStats).map(stat => {
      const sharePercent = totalLeadsCount > 0 ? (stat.totalLeads / totalLeadsCount) * 100 : 0;
      const conversionRate = stat.totalLeads > 0 ? (stat.dealCount / stat.totalLeads) * 100 : 0;
      return {
        ...stat,
        sharePercent: parseFloat(sharePercent.toFixed(1)),
        conversionRate: parseFloat(conversionRate.toFixed(1))
      };
    }).sort((a, b) => b.totalLeads - a.totalLeads);

    // 3. Process Product Deals (Tren Produk Deal)
    // Fetch deal leads with final penawaran details
    const dealLeadsWithDetails = await prisma.lead.findMany({
      where: {
        ...baseFilter,
        status: 2,
        versi_penawaran_final_id: { not: null }
      },
      include: {
        versi_penawaran_final: {
          include: {
            details: true
          }
        }
      }
    });

    const productStats = {};
    dealLeadsWithDetails.forEach(lead => {
      const details = lead.versi_penawaran_final?.details || [];
      details.forEach(det => {
        const key = det.produk_id.toString();
        if (!productStats[key]) {
          productStats[key] = {
            id: key,
            nama: det.nama_produk,
            kode: det.kode_produk,
            kategori: det.kategori_produk_nama,
            qtySold: 0,
            revenue: 0,
            dealCount: 0
          };
        }
        productStats[key].qtySold += Number(det.qty || 0);
        productStats[key].revenue += Number(det.subtotal || 0);
        productStats[key].dealCount++;
      });
    });

    const produkDealTrends = Object.values(productStats)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10); // Top 10 deal products

    // 4. Process Product Lost (Tren Produk Paling Sering Lost)
    // Fetch lost leads yang memiliki minimal satu versi penawaran
    const lostLeadsWithPenawarans = await prisma.lead.findMany({
      where: {
        ...baseFilter,
        status: 3, // LOST
      },
      include: {
        versi_penawarans: {
          orderBy: { versi: 'desc' },
          take: 1, // hanya ambil versi terakhir/tertinggi
          include: {
            details: true
          }
        }
      }
    });

    const productLostStats = {};
    lostLeadsWithPenawarans.forEach(lead => {
      // Ambil versi penawaran terakhir (sudah diurutkan desc, take 1)
      const lastVersi = lead.versi_penawarans?.[0];
      if (!lastVersi) return; // skip lead yang tidak punya penawaran sama sekali

      const details = lastVersi.details || [];
      details.forEach(det => {
        const key = det.produk_id.toString();
        if (!productLostStats[key]) {
          productLostStats[key] = {
            id: key,
            nama: det.nama_produk,
            kode: det.kode_produk,
            kategori: det.kategori_produk_nama,
            qtyLost: 0,
            potensiOmzet: 0,
            lostCount: 0
          };
        }
        productLostStats[key].qtyLost += Number(det.qty || 0);
        productLostStats[key].potensiOmzet += Number(det.subtotal || 0);
        productLostStats[key].lostCount++;
      });
    });

    const produkLostTrends = Object.values(productLostStats)
      .sort((a, b) => b.lostCount - a.lostCount)
      .slice(0, 10); // Top 10 produk ter-lost

    // Fetch filters for branches/sales
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
      message: 'Data laporan tren berhasil diambil.',
      data: serialize({
        summary: {
          totalLead: totalLeadsCount,
          totalDeal: dealLeadsWithDetails.length,
          totalCategories: allCategories.length,
          totalNeeds: allNeeds.length
        },
        kategoriTrends,
        kebutuhanTrends,
        produkDealTrends,
        produkLostTrends,
        filters: {
          branches,
          sales
        }
      })
    });

  } catch (error) {
    console.error('GET Laporan Tren Error:', error);
    return NextResponse.json({
      success: false,
      message: 'Terjadi kesalahan pada server saat memproses laporan tren.',
      error: error.message || error.toString()
    }, { status: 500 });
  }
}
