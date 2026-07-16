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
    const tipe_customer = searchParams.get('tipe_customer') || ''; // 'BARU', 'EXISTING'

    // Support multiple IDs (comma-separated)
    let cabangIds = [];
    if (cabang_id) {
      cabangIds = cabang_id.split(',').map(id => BigInt(id));
    }
    let salesIds = [];
    if (sales_id) {
      salesIds = sales_id.split(',').map(id => BigInt(id));
    }

    // Role-based filtering
    const role = user.role?.toLowerCase();
    let userFilter = {};
    if (role === 'sales') {
      userFilter = { user_id: BigInt(user.id) };
    } else if (role === 'branch manager') {
      userFilter = { cabang_id: BigInt(user.cabang_id) };
    }

    // Build base query filter
    const baseFilter = {
      ...userFilter,
      ...(cabangIds.length > 0 ? { cabang_id: { in: cabangIds } } : {}),
      ...(salesIds.length > 0 ? { user_id: { in: salesIds } } : {}),
      ...(tipe_customer ? { status_customer: tipe_customer } : {}),
      ...(startDateStr || endDateStr ? {
        tanggal_deal: {
          ...(startDateStr ? { gte: new Date(`${startDateStr}T00:00:00`) } : {}),
          ...(endDateStr ? { lte: new Date(`${endDateStr}T23:59:59.999`) } : {}),
        }
      } : {}),
    };

    // 1. Fetch DEAL leads
    const dealLeads = await prisma.lead.findMany({
      where: {
        status: 2, // DEAL
        ...baseFilter,
      },
      include: {
        user: { select: { nama: true } },
        cabang: { select: { nama: true } },
      },
      orderBy: { tanggal_deal: 'asc' },
    });

    const totalLeadsCount = await prisma.lead.count({
      where: {
        ...userFilter,
        ...(cabangIds.length > 0 ? { cabang_id: { in: cabangIds } } : {}),
        ...(salesIds.length > 0 ? { user_id: { in: salesIds } } : {}),
      }
    });

    const lostLeadsCount = await prisma.lead.count({
      where: {
        status: 3, // LOST
        ...baseFilter,
      }
    });

    const openLeadsCount = await prisma.lead.count({
      where: {
        status: 1, // OPEN
        ...baseFilter,
      }
    });

    const penawaranLeadsCount = await prisma.lead.count({
      where: {
        fase: 3, // PENAWARAN
        ...baseFilter,
      }
    });

    // 2. Compute Summary Metrics
    const totalDeal = dealLeads.length;
    const pctOfTotalLeads = totalLeadsCount > 0 ? (totalDeal / totalLeadsCount) * 100 : 0;

    let totalNilai = 0;
    let maxNilai = 0;
    let minNilai = totalDeal > 0 ? Infinity : 0;
    let totalProcessingTimeMs = 0;

    dealLeads.forEach(lead => {
      const val = lead.nilai_deal ? Number(lead.nilai_deal) : 0;
      totalNilai += val;
      if (val > maxNilai) maxNilai = val;
      if (val < minNilai) minNilai = val;

      if (lead.tanggal_deal && lead.dibuat_tanggal) {
        totalProcessingTimeMs += (new Date(lead.tanggal_deal) - new Date(lead.dibuat_tanggal));
      }
    });

    if (minNilai === Infinity) minNilai = 0;
    const rataRataNilai = totalDeal > 0 ? totalNilai / totalDeal : 0;
    const rataRataWaktuHari = totalDeal > 0 ? (totalProcessingTimeMs / totalDeal) / (1000 * 60 * 60 * 24) : 0;

    // Deal Bulan Ini
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const dealBulanIniList = dealLeads.filter(lead => lead.tanggal_deal && new Date(lead.tanggal_deal) >= startOfMonth);
    const countBulanIni = dealBulanIniList.length;
    const nilaiBulanIni = dealBulanIniList.reduce((acc, curr) => acc + (curr.nilai_deal ? Number(curr.nilai_deal) : 0), 0);

    // Win Rate
    const totalClosed = totalDeal + lostLeadsCount;
    const winRate = totalClosed > 0 ? (totalDeal / totalClosed) * 100 : 0;

    // 3. Groupings for Visualizations
    // Customer Type Grouping
    let customerBaruCount = 0;
    let customerExistingCount = 0;
    dealLeads.forEach(lead => {
      if (lead.status_customer === 'BARU') customerBaruCount++;
      else customerExistingCount++;
    });

    // Deal per Sales & Nilai per Sales
    const salesDataMap = {};
    dealLeads.forEach(lead => {
      const name = lead.user.nama;
      const val = lead.nilai_deal ? Number(lead.nilai_deal) : 0;
      if (!salesDataMap[name]) {
        salesDataMap[name] = { count: 0, nilai: 0 };
      }
      salesDataMap[name].count++;
      salesDataMap[name].nilai += val;
    });

    const salesList = Object.keys(salesDataMap).map(name => ({
      name,
      count: salesDataMap[name].count,
      nilai: salesDataMap[name].nilai,
    })).sort((a, b) => b.count - a.count);

    // Deal per Cabang
    const cabangDataMap = {};
    dealLeads.forEach(lead => {
      const name = lead.cabang.nama;
      if (!cabangDataMap[name]) {
        cabangDataMap[name] = 0;
      }
      cabangDataMap[name]++;
    });
    const cabangList = Object.keys(cabangDataMap).map(name => ({
      name,
      count: cabangDataMap[name],
    })).sort((a, b) => b.count - a.count);

    // Monthly Trend (Jan - Dec)
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
    const monthlyDataMap = {};
    monthNames.forEach(m => {
      monthlyDataMap[m] = { count: 0, nilai: 0 };
    });

    dealLeads.forEach(lead => {
      if (lead.tanggal_deal) {
        const mName = monthNames[new Date(lead.tanggal_deal).getMonth()];
        const val = lead.nilai_deal ? Number(lead.nilai_deal) : 0;
        monthlyDataMap[mName].count++;
        monthlyDataMap[mName].nilai += val;
      }
    });

    const monthlyTrend = monthNames.map(name => ({
      name,
      count: monthlyDataMap[name].count,
      nilai: monthlyDataMap[name].nilai,
    }));

    // Deal per Produk (Top 5)
    // Query DetailPenawaran of VersiPenawaran that is referenced as versi_penawaran_final_id in DEAL leads
    const finalQuotationIds = dealLeads
      .map(lead => lead.versi_penawaran_final_id)
      .filter(id => id !== null);

    const topProducts = await prisma.detailPenawaran.groupBy({
      by: ['nama_produk'],
      where: {
        versi_penawaran_id: { in: finalQuotationIds }
      },
      _count: {
        id: true,
      },
      _sum: {
        qty: true,
        subtotal: true,
      },
      orderBy: {
        _sum: {
          qty: 'desc'
        }
      },
      take: 5
    });

    const productList = topProducts.map(p => ({
      nama: p.nama_produk,
      jumlah: p._sum.qty || 0,
      nilai: Number(p._sum.subtotal) || 0,
    }));

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          totalDeal,
          pctOfTotalLeads: parseFloat(pctOfTotalLeads.toFixed(2)),
          totalNilai,
          rataRataNilai: Math.round(rataRataNilai),
          maxNilai,
          minNilai,
          countBulanIni,
          nilaiBulanIni,
          winRate: parseFloat(winRate.toFixed(2)),
          rataRataWaktuHari: parseFloat(rataRataWaktuHari.toFixed(1)),
        },
        charts: {
          customerType: [
            { name: "Customer Baru", count: customerBaruCount, pct: totalDeal > 0 ? parseFloat(((customerBaruCount / totalDeal) * 100).toFixed(2)) : 0 },
            { name: "Customer Existing", count: customerExistingCount, pct: totalDeal > 0 ? parseFloat(((customerExistingCount / totalDeal) * 100).toFixed(2)) : 0 },
          ],
          salesList: salesList.slice(0, 5),
          cabangList,
          monthlyTrend,
          productList,
          funnel: {
            total: totalLeadsCount,
            open: openLeadsCount,
            penawaran: penawaranLeadsCount + totalDeal, // penawaran phase leads includes deals
            deal: totalDeal,
          }
        }
      }
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, message: 'Terjadi kesalahan sistem' }, { status: 500 });
  }
}
