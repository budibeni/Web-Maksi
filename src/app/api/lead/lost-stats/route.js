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
    const endDateStr   = searchParams.get('endDate')   || '';
    const cabang_id       = searchParams.get('cabang_id')       || '';
    const sales_id        = searchParams.get('sales_id')        || '';
    const tipe_customer   = searchParams.get('tipe_customer')   || '';
    const tahap_lost      = searchParams.get('tahap_lost')      || '';
    const alasan_lost_id  = searchParams.get('alasan_lost_id')  || '';

    // Support multiple IDs (comma-separated)
    let cabangIds = [];
    if (cabang_id) {
      cabangIds = cabang_id.split(',').map(id => BigInt(id));
    }
    let salesIds = [];
    if (sales_id) {
      salesIds = sales_id.split(',').map(id => BigInt(id));
    }

    // Role-based base filter
    const roleNama = (user.role || '').toLowerCase();
    let userFilter = {};
    if (roleNama === 'sales') {
      userFilter = { user_id: BigInt(user.id) };
    } else if (roleNama === 'branch manager') {
      userFilter = { cabang_id: BigInt(user.cabang_id) };
    }

    // Date range filter (applied only when dates are provided)
    let dateFilter = {};
    if (startDateStr || endDateStr) {
      dateFilter = {
        tanggal_lost: {
          ...(startDateStr ? { gte: new Date(`${startDateStr}T00:00:00`) } : {}),
          ...(endDateStr   ? { lte: new Date(`${endDateStr}T23:59:59.999`) } : {}),
        }
      };
    }

    const baseFilter = {
      ...userFilter,
      status: 3, // LOST
      ...(cabangIds.length > 0   ? { cabang_id:      { in: cabangIds }      } : {}),
      ...(salesIds.length > 0    ? { user_id:        { in: salesIds }       } : {}),
      ...(tipe_customer  ? { status_customer: tipe_customer         } : {}),
      ...(alasan_lost_id ? { alasan_lost_id: BigInt(alasan_lost_id) } : {}),
      ...(tahap_lost === 'awal'      ? { fase: { lte: 2 } } : {}),
      ...(tahap_lost === 'followup'  ? { fase: 3 }          : {}),
      ...dateFilter,
    };

    // Fetch all LOST leads (no pagination — analytics)
    const lostLeads = await prisma.lead.findMany({
      where: baseFilter,
      include: {
        user:   { select: { nama: true } },
        cabang: { select: { nama: true } },
      },
      orderBy: { tanggal_lost: 'desc' },
    });

    const totalLost = lostLeads.length;

    // Total lead and deal counts (same role/cabang/sales filter, no date/status filter)
    const totalAllFilter = {
      ...userFilter,
      ...(cabangIds.length > 0 ? { cabang_id: { in: cabangIds } } : {}),
      ...(salesIds.length > 0  ? { user_id:   { in: salesIds }   } : {}),
    };

    const [totalLeads, totalDeal, totalLeadBaru, totalLeadExisting] = await Promise.all([
      prisma.lead.count({ where: totalAllFilter }),
      prisma.lead.count({ where: { ...totalAllFilter, status: 2 } }),
      prisma.lead.count({ where: { ...totalAllFilter, status_customer: 'BARU'     } }),
      prisma.lead.count({ where: { ...totalAllFilter, status_customer: 'EXISTING' } }),
    ]);

    const lostRate    = (totalLost + totalDeal) > 0 ? (totalLost / (totalLost + totalDeal)) * 100 : 0;
    const pctOfTotal  = totalLeads > 0 ? (totalLost / totalLeads) * 100 : 0;

    // Breakdown
    const lostBaru     = lostLeads.filter(l => l.status_customer === 'BARU');
    const lostExisting = lostLeads.filter(l => l.status_customer !== 'BARU');
    const lostDariAwal        = lostLeads.filter(l => l.fase <= 2);
    const lostSetelahFollowUp = lostLeads.filter(l => l.fase >= 3);

    // Nilai potensi
    let totalNilaiPotensi = 0;
    let maxNilai = 0;
    let minNilai = totalLost > 0 ? Infinity : 0;
    lostLeads.forEach(l => {
      const v = l.nilai_lost ? Number(l.nilai_lost) : 0;
      totalNilaiPotensi += v;
      if (v > maxNilai) maxNilai = v;
      if (v > 0 && v < minNilai) minNilai = v;
    });
    if (minNilai === Infinity) minNilai = 0;
    const rataRataNilaiLost = totalLost > 0 ? Math.round(totalNilaiPotensi / totalLost) : 0;

    // Lost rate per tipe
    const lostRateBaru     = totalLeadBaru     > 0 ? (lostBaru.length     / totalLeadBaru)     * 100 : 0;
    const lostRateExisting = totalLeadExisting > 0 ? (lostExisting.length / totalLeadExisting) * 100 : 0;

    // === Charts ===

    // Lost per Sales
    const salesMap = {};
    lostLeads.forEach(l => {
      const name = l.user?.nama || 'Unknown';
      salesMap[name] = (salesMap[name] || 0) + 1;
    });
    const salesList = Object.entries(salesMap)
      .map(([name, count]) => ({ name, count, pct: totalLost > 0 ? +((count / totalLost) * 100).toFixed(2) : 0 }))
      .sort((a, b) => b.count - a.count);

    // Lost per Cabang
    const cabangMap = {};
    lostLeads.forEach(l => {
      const name = l.cabang?.nama || 'Unknown';
      cabangMap[name] = (cabangMap[name] || 0) + 1;
    });
    const cabangList = Object.entries(cabangMap)
      .map(([name, count]) => ({ name, count, pct: totalLost > 0 ? +((count / totalLost) * 100).toFixed(2) : 0 }))
      .sort((a, b) => b.count - a.count);

    // Monthly Trend
    const monthNames = ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Agu","Sep","Okt","Nov","Des"];
    const monthlyMap = {};
    monthNames.forEach(m => { monthlyMap[m] = { count: 0, baru: 0, existing: 0 }; });
    lostLeads.forEach(l => {
      if (l.tanggal_lost) {
        const mn = monthNames[new Date(l.tanggal_lost).getMonth()];
        if (monthlyMap[mn]) {
          monthlyMap[mn].count++;
          if (l.status_customer === 'BARU') monthlyMap[mn].baru++;
          else monthlyMap[mn].existing++;
        }
      }
    });
    const monthlyTrend = monthNames.map(name => ({ name, ...monthlyMap[name] }));

    // Alasan Lost breakdown
    const alasanMapBaru     = {};
    const alasanMapExisting = {};
    lostLeads.forEach(l => {
      const nama = l.nama_alasan_lost || 'Lainnya';
      if (l.status_customer === 'BARU') {
        alasanMapBaru[nama] = (alasanMapBaru[nama] || 0) + 1;
      } else {
        alasanMapExisting[nama] = (alasanMapExisting[nama] || 0) + 1;
      }
    });

    const alasanListBaru = Object.entries(alasanMapBaru)
      .map(([nama, count]) => ({ nama, count, pct: lostBaru.length > 0 ? +((count / lostBaru.length) * 100).toFixed(2) : 0 }))
      .sort((a, b) => b.count - a.count);

    const alasanListExisting = Object.entries(alasanMapExisting)
      .map(([nama, count]) => ({ nama, count, pct: lostExisting.length > 0 ? +((count / lostExisting.length) * 100).toFixed(2) : 0 }))
      .sort((a, b) => b.count - a.count);

    // Combined alasan table
    const combinedMap = {};
    lostLeads.forEach(l => {
      const nama = l.nama_alasan_lost || 'Lainnya';
      if (!combinedMap[nama]) combinedMap[nama] = { baru: 0, existing: 0 };
      if (l.status_customer === 'BARU') combinedMap[nama].baru++;
      else combinedMap[nama].existing++;
    });
    const combinedAlasanTable = Object.entries(combinedMap)
      .map(([nama, v]) => ({
        nama,
        baru:        v.baru,
        pctBaru:     lostBaru.length     > 0 ? +((v.baru     / lostBaru.length)     * 100).toFixed(2) : 0,
        existing:    v.existing,
        pctExisting: lostExisting.length > 0 ? +((v.existing / lostExisting.length) * 100).toFixed(2) : 0,
        total:       v.baru + v.existing,
        pctTotal:    totalLost > 0 ? +(((v.baru + v.existing) / totalLost) * 100).toFixed(2) : 0,
      }))
      .sort((a, b) => b.total - a.total);

    return NextResponse.json(serialize({
      success: true,
      data: {
        summary: {
          totalLost,
          pctOfTotal:           +pctOfTotal.toFixed(2),
          lostDariAwal:         lostDariAwal.length,
          pctDariAwal:          totalLost > 0 ? +((lostDariAwal.length        / totalLost) * 100).toFixed(2) : 0,
          lostSetelahFollowUp:  lostSetelahFollowUp.length,
          pctSetelahFollowUp:   totalLost > 0 ? +((lostSetelahFollowUp.length / totalLost) * 100).toFixed(2) : 0,
          totalNilaiPotensi,
          rataRataNilaiLost,
          maxNilai,
          minNilai,
          lostRate:             +lostRate.toFixed(2),
          totalLeadBaru,
          totalLeadExisting,
          lostBaruCount:        lostBaru.length,
          lostExistingCount:    lostExisting.length,
          lostRateBaru:         +lostRateBaru.toFixed(2),
          lostRateExisting:     +lostRateExisting.toFixed(2),
        },
        charts: {
          customerType: [
            { name: 'Customer Baru',     count: lostBaru.length,     pct: totalLost > 0 ? +((lostBaru.length     / totalLost) * 100).toFixed(2) : 0 },
            { name: 'Customer Existing', count: lostExisting.length, pct: totalLost > 0 ? +((lostExisting.length / totalLost) * 100).toFixed(2) : 0 },
          ],
          salesList,
          cabangList,
          monthlyTrend,
          alasanListBaru,
          alasanListExisting,
          combinedAlasanTable,
        }
      }
    }));

  } catch (error) {
    console.error('GET /api/lead/lost-stats Error:', error);
    return NextResponse.json({ success: false, message: 'Terjadi kesalahan sistem.', error: error.message }, { status: 500 });
  }
}
