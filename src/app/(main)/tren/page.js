"use client";

import { useState, useEffect } from "react";
import {
  FiTrendingUp, FiBox, FiTag, FiPercent, FiDollarSign,
  FiTarget, FiCheckCircle, FiXCircle, FiRefreshCw, FiInfo, FiActivity
} from "react-icons/fi";
import { useAuthStore } from "@/store/auth.store";
import { useUIStore } from "@/store/ui.store";
import { formatCurrency } from "@/utils/format-currency";
import dayjs from "dayjs";
import FilterPanel from "@/components/ui/FilterPanel";

export default function LaporanTren() {
  const currentUser = useAuthStore((state) => state.user);
  const { showToast } = useUIStore();

  const [isLoading, setIsLoading] = useState(true);
  const [trenData, setTrenData] = useState(null);

  // Filter States
  const [datePreset, setDatePreset] = useState("thisMonth");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [cabangIds, setCabangIds] = useState([]);
  const [salesIds, setSalesIds] = useState([]);

  // Options for filters fetched from API
  const [filterOptions, setFilterOptions] = useState({ branches: [], sales: [] });

  // Handle Preset changes
  useEffect(() => {
    const now = dayjs();
    let start = "";
    let end = "";
    if (datePreset === "today") {
      start = now.format("YYYY-MM-DD");
      end = now.format("YYYY-MM-DD");
    } else if (datePreset === "thisWeek") {
      start = now.startOf("week").format("YYYY-MM-DD");
      end = now.endOf("week").format("YYYY-MM-DD");
    } else if (datePreset === "thisMonth") {
      start = now.startOf("month").format("YYYY-MM-DD");
      end = now.endOf("month").format("YYYY-MM-DD");
    } else if (datePreset === "thisYear") {
      start = now.startOf("year").format("YYYY-MM-DD");
      end = now.endOf("year").format("YYYY-MM-DD");
    }

    if (start && end) {
      setStartDate(start);
      setEndDate(end);
    }
  }, [datePreset]);

  const fetchTrenData = async () => {
    setIsLoading(true);
    try {
      let url = `/api/tren?`;
      if (startDate) url += `startDate=${startDate}&`;
      if (endDate) url += `endDate=${endDate}&`;
      if (cabangIds.length > 0) url += `cabang_id=${cabangIds.join(",")}&`;
      if (salesIds.length > 0) url += `sales_id=${salesIds.join(",")}&`;

      const res = await fetch(url);
      const json = await res.json();
      if (json.success) {
        setTrenData(json.data);
        if (json.data.filters) {
          setFilterOptions(json.data.filters);
        }
      } else {
        showToast(json.message || "Gagal mengambil data tren", "error");
      }
    } catch (error) {
      console.error(error);
      showToast("Terjadi kesalahan sistem", "error");
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch when applied filters change
  useEffect(() => {
    if (startDate && endDate) {
      fetchTrenData();
    }
  }, [startDate, endDate, cabangIds, salesIds]);

  const handleResetFilters = () => {
    setDatePreset("thisMonth");
    setCabangIds([]);
    setSalesIds([]);
  };

  if (!currentUser || !trenData) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm text-neutral-500 mt-4">Memuat analisis tren...</p>
      </div>
    );
  }

  const { summary, kategoriTrends, kebutuhanTrends, produkDealTrends, produkLostTrends = [] } = trenData;
  const role = (typeof currentUser.role === 'object' ? currentUser.role.nama : currentUser.role || "").toLowerCase();

  // Donut Chart Math for Kategori Produk
  const categoryChartColors = [
    "#f97316", // orange
    "#3b82f6", // blue
    "#10b981", // green
    "#a855f7", // purple
    "#eab308", // yellow
    "#ec4899", // pink
    "#6b7280", // gray
  ];

  const sumCategories = kategoriTrends.reduce((acc, curr) => acc + curr.totalLeads, 0);
  let accumulatedCatPercent = 0;
  const categoryDonutSectors = kategoriTrends.slice(0, 5).map((item, index) => {
    const percent = sumCategories > 0 ? (item.totalLeads / sumCategories) : 0;
    const dashArray = `${percent * 314.16} 314.16`;
    const dashOffset = -accumulatedCatPercent * 314.16;
    accumulatedCatPercent += percent;
    return {
      ...item,
      color: categoryChartColors[index % categoryChartColors.length],
      dashArray,
      dashOffset,
      percentVal: Math.round(percent * 100)
    };
  });

  // Calculate remaining category share
  const remainingCatLeads = sumCategories - kategoriTrends.slice(0, 5).reduce((acc, curr) => acc + curr.totalLeads, 0);
  const remainingCatPercent = sumCategories > 0 ? (remainingCatLeads / sumCategories) * 100 : 0;

  // Max value helper for Horizontal Bars
  const maxKebutuhanLeads = kebutuhanTrends.length > 0 ? Math.max(...kebutuhanTrends.map(k => k.totalLeads)) : 10;
  const maxProductQtySold = produkDealTrends.length > 0 ? Math.max(...produkDealTrends.map(p => p.qtySold)) : 1;
  const maxProductLostCount = produkLostTrends.length > 0 ? Math.max(...produkLostTrends.map(p => p.lostCount)) : 1;

  return (
    <div className="space-y-6">

      {/* Filter Laporan */}
      <FilterPanel
        title="Filter Tren"
        role={role}
        branches={filterOptions.branches}
        sales={filterOptions.sales}
        datePreset={datePreset}
        setDatePreset={setDatePreset}
        startDate={startDate}
        setStartDate={setStartDate}
        endDate={endDate}
        setEndDate={setEndDate}
        cabangIds={cabangIds}
        setCabangIds={setCabangIds}
        salesIds={salesIds}
        setSalesIds={setSalesIds}
        onReset={handleResetFilters}
      />

      {/* Main Charts: Category and Needs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* LEFT CHART: Kategori Produk */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200/50 dark:border-neutral-800 shadow-sm rounded-2xl p-6 flex flex-col justify-between transition-colors duration-300">
          <div>
            <div className="flex items-center gap-2.5 mb-1">
              <div className="p-1.5 bg-orange-100 dark:bg-orange-950/30 text-orange-600 rounded-lg"><FiBox className="w-4 h-4" /></div>
              <h3 className="font-bold text-neutral-800 dark:text-neutral-100">Distribusi Kategori Produk</h3>
            </div>
            <p className="text-xs text-neutral-400 dark:text-neutral-500 mb-4">Sebaran minat kategori produk dari seluruh leads yang masuk.</p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-around gap-6 py-4">
            {/* SVG Donut Chart */}
            <div className="relative w-36 h-36 flex-shrink-0">
              {kategoriTrends.length === 0 ? (
                <div className="absolute inset-0 flex items-center justify-center bg-neutral-50 dark:bg-neutral-950 rounded-full text-xs text-neutral-400 italic">No Data</div>
              ) : (
                <>
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
                    <circle cx="60" cy="60" r="50" className="stroke-neutral-100 dark:stroke-neutral-800 fill-none" strokeWidth="12" />
                    {categoryDonutSectors.map((sector, idx) => (
                      <circle
                        key={sector.id}
                        cx="60"
                        cy="60"
                        r="50"
                        className="fill-none transition-all duration-500"
                        stroke={sector.color}
                        strokeWidth="12"
                        strokeDasharray={sector.dashArray}
                        strokeDashoffset={sector.dashOffset}
                        strokeLinecap="round"
                      />
                    ))}
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-xs text-neutral-400 font-bold uppercase tracking-wider">Leads</span>
                    <span className="text-xl font-extrabold text-neutral-800 dark:text-neutral-100 font-mono">{summary.totalLead}</span>
                  </div>
                </>
              )}
            </div>

            {/* Chart Legend */}
            <div className="flex-1 space-y-2 w-full">
              {categoryDonutSectors.map(sector => (
                <div key={sector.id} className="flex items-center justify-between gap-4 text-xs">
                  <div className="flex items-center gap-2 truncate">
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: sector.color }}></span>
                    <span className="font-semibold text-neutral-700 dark:text-neutral-300 truncate">{sector.nama}</span>
                  </div>
                  <span className="font-mono font-bold text-neutral-800 dark:text-neutral-200 flex-shrink-0">
                    {sector.totalLeads} ({sector.percentVal}%)
                  </span>
                </div>
              ))}
              {remainingCatLeads > 0 && (
                <div className="flex items-center justify-between gap-4 text-xs border-t border-dashed border-neutral-100 dark:border-neutral-800 pt-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-neutral-300 dark:bg-neutral-700 flex-shrink-0"></span>
                    <span className="font-semibold text-neutral-500">Kategori Lainnya</span>
                  </div>
                  <span className="font-mono font-bold text-neutral-500">
                    {remainingCatLeads} ({Math.round(remainingCatPercent)}%)
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Table List of Kategori */}
          <div className="mt-4 border-t border-neutral-100 dark:border-neutral-800 pt-4 overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[360px]">
              <thead>
                <tr className="text-neutral-400 font-bold border-b border-neutral-100 dark:border-neutral-800 pb-2">
                  <th className="py-2">Kategori</th>
                  <th className="py-2 text-center">Total Lead</th>
                  <th className="py-2 text-center text-blue-500">Open</th>
                  <th className="py-2 text-center text-green-600 dark:text-green-400">Deal</th>
                  <th className="py-2 text-center text-red-500">Lost</th>
                  <th className="py-2 text-right">Rasio Konversi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800 text-neutral-700 dark:text-neutral-300">
                {kategoriTrends.map(stat => (
                  <tr key={stat.id} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/20">
                    <td className="py-2 font-bold text-neutral-900 dark:text-white">{stat.nama}</td>
                    <td className="py-2 text-center font-mono font-bold">{stat.totalLeads}</td>
                    <td className="py-2 text-center font-mono text-blue-500 font-semibold">{stat.openCount || 0}</td>
                    <td className="py-2 text-center font-mono font-semibold text-green-600 dark:text-green-400">{stat.dealCount}</td>
                    <td className="py-2 text-center font-mono text-red-500 font-semibold">{stat.lostCount}</td>
                    <td className="py-2 text-right font-mono font-bold text-orange-600 dark:text-orange-400">{stat.conversionRate}%</td>
                  </tr>
                ))}
                {kategoriTrends.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-4 text-center text-neutral-400 italic">Belum ada data leads masuk.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* RIGHT CHART: Kebutuhan Leads */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200/50 dark:border-neutral-800 shadow-sm rounded-2xl p-6 flex flex-col justify-between transition-colors duration-300">
          <div>
            <div className="flex items-center gap-2.5 mb-1">
              <div className="p-1.5 bg-blue-100 dark:bg-blue-950/30 text-blue-600 rounded-lg"><FiTag className="w-4 h-4" /></div>
              <h3 className="font-bold text-neutral-800 dark:text-neutral-100">Analisis Kebutuhan Leads</h3>
            </div>
            <p className="text-xs text-neutral-400 dark:text-neutral-500 mb-4">Jenis ketertarikan atau aksi yang paling sering dilakukan leads.</p>
          </div>

          {/* Horizontal Bar Chart */}
          <div className="space-y-4 py-2">
            {kebutuhanTrends.slice(0, 5).map(stat => {
              const fillPercent = maxKebutuhanLeads > 0 ? (stat.totalLeads / maxKebutuhanLeads) * 100 : 0;
              return (
                <div key={stat.id} className="space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-neutral-700 dark:text-neutral-300">{stat.nama}</span>
                    <span className="font-mono text-neutral-500">{stat.totalLeads} Leads ({stat.sharePercent}%)</span>
                  </div>
                  <div className="w-full h-2.5 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full transition-all duration-700"
                      style={{ width: `${fillPercent}%` }}
                    />
                  </div>
                </div>
              );
            })}
            {kebutuhanTrends.length === 0 && (
              <div className="text-center py-10 text-neutral-400 italic text-sm">Tidak ada data kebutuhan.</div>
            )}
          </div>

          {/* Table List of Kebutuhan */}
          <div className="mt-4 border-t border-neutral-100 dark:border-neutral-800 pt-4 overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[360px]">
              <thead>
                <tr className="text-neutral-400 font-bold border-b border-neutral-100 dark:border-neutral-800 pb-2">
                  <th className="py-2">Kebutuhan</th>
                  <th className="py-2 text-center">Total Lead</th>
                  <th className="py-2 text-center text-blue-500">Open</th>
                  <th className="py-2 text-center text-green-600 dark:text-green-400">Deal</th>
                  <th className="py-2 text-center text-red-500">Lost</th>
                  <th className="py-2 text-right">Rasio Konversi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800 text-neutral-700 dark:text-neutral-300">
                {kebutuhanTrends.map(stat => (
                  <tr key={stat.id} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/20">
                    <td className="py-2 font-bold text-neutral-900 dark:text-white">{stat.nama}</td>
                    <td className="py-2 text-center font-mono font-bold">{stat.totalLeads}</td>
                    <td className="py-2 text-center font-mono text-blue-500 font-semibold">{stat.openCount || 0}</td>
                    <td className="py-2 text-center font-mono font-semibold text-green-600 dark:text-green-400">{stat.dealCount}</td>
                    <td className="py-2 text-center font-mono text-red-500 font-semibold">{stat.lostCount}</td>
                    <td className="py-2 text-right font-mono font-bold text-blue-600 dark:text-blue-400">{stat.conversionRate}%</td>
                  </tr>
                ))}
                {kebutuhanTrends.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-4 text-center text-neutral-400 italic">Belum ada data leads masuk.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* Product Deals Performance: Tren Produk Deal */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200/50 dark:border-neutral-800 shadow-sm rounded-2xl p-6 transition-colors duration-300">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="p-1.5 bg-green-100 dark:bg-green-950/30 text-green-600 rounded-lg"><FiTrendingUp className="w-4 h-4" /></div>
            <h3 className="font-bold text-neutral-800 dark:text-neutral-100">Tren Produk Terlaris (Deal)</h3>
          </div>
          <p className="text-xs text-neutral-400 dark:text-neutral-500 mb-6">Peringkat 10 besar produk berdasarkan kuantitas unit yang berhasil terjual pada transaksi Deal.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Chart Section */}
          <div className="lg:col-span-2 space-y-4 flex flex-col justify-center">
            {produkDealTrends.slice(0, 5).map(prod => {
              const fillPercent = maxProductQtySold > 0 ? (prod.qtySold / maxProductQtySold) * 100 : 0;
              return (
                <div key={prod.id} className="space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-neutral-700 dark:text-neutral-300 truncate max-w-[180px]">{prod.nama}</span>
                    <span className="font-mono text-green-600 font-semibold">{prod.qtySold} Unit</span>
                  </div>
                  <div className="w-full h-2.5 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-green-500 to-emerald-600 rounded-full transition-all duration-700"
                      style={{ width: `${fillPercent}%` }}
                    />
                  </div>
                </div>
              );
            })}
            {produkDealTrends.length === 0 && (
              <div className="text-center py-10 text-neutral-400 italic text-sm">Belum ada produk deal tercatat.</div>
            )}
          </div>

          {/* Table Section */}
          <div className="lg:col-span-3 overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[400px]">
              <thead>
                <tr className="text-neutral-400 font-bold border-b border-neutral-100 dark:border-neutral-800 pb-2">
                  <th className="py-2">Kode</th>
                  <th className="py-2">Nama Produk</th>
                  <th className="py-2">Kategori</th>
                  <th className="py-2 text-center">Unit Terjual</th>
                  <th className="py-2 text-center">Deal Count</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800 text-neutral-700 dark:text-neutral-300">
                {produkDealTrends.map((prod, index) => (
                  <tr key={prod.id} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/20">
                    <td className="py-3 font-mono font-bold text-neutral-500">{prod.kode}</td>
                    <td className="py-3 font-bold text-neutral-900 dark:text-white">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-md bg-neutral-100 dark:bg-neutral-800 text-neutral-500 flex items-center justify-center font-mono font-bold text-[10px]">{index + 1}</span>
                        <span className="truncate max-w-[150px]">{prod.nama}</span>
                      </div>
                    </td>
                    <td className="py-3 text-neutral-500">{prod.kategori}</td>
                    <td className="py-3 text-center font-mono font-bold text-green-600 dark:text-green-400">{prod.qtySold}</td>
                    <td className="py-3 text-center font-mono">{prod.dealCount}x</td>
                  </tr>
                ))}
                {produkDealTrends.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-4 text-center text-neutral-400 italic">Belum ada transaksi deal.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Tren Produk Paling Sering Lost */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200/50 dark:border-neutral-800 shadow-sm rounded-2xl p-6 transition-colors duration-300">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="p-1.5 bg-red-100 dark:bg-red-950/30 text-red-600 rounded-lg"><FiXCircle className="w-4 h-4" /></div>
            <h3 className="font-bold text-neutral-800 dark:text-neutral-100">Tren Produk Paling Sering Lost</h3>
          </div>
          <p className="text-xs text-neutral-400 dark:text-neutral-500 mb-6">Peringkat 10 produk yang paling sering muncul di penawaran lead yang berakhir LOST — gambaran produk berpotensi tinggi namun gagal closing.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Chart Section */}
          <div className="lg:col-span-2 space-y-4 flex flex-col justify-center">
            {produkLostTrends.slice(0, 5).map(prod => {
              const fillPercent = maxProductLostCount > 0 ? (prod.lostCount / maxProductLostCount) * 100 : 0;
              return (
                <div key={prod.id} className="space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-neutral-700 dark:text-neutral-300 truncate max-w-[180px]">{prod.nama}</span>
                    <span className="font-mono text-red-500 font-semibold">{prod.lostCount}x Lost</span>
                  </div>
                  <div className="w-full h-2.5 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-red-500 to-rose-600 rounded-full transition-all duration-700"
                      style={{ width: `${fillPercent}%` }}
                    />
                  </div>
                </div>
              );
            })}
            {produkLostTrends.length === 0 && (
              <div className="text-center py-10 text-neutral-400 italic text-sm">Belum ada produk dari lead yang lost.</div>
            )}
          </div>

          {/* Table Section */}
          <div className="lg:col-span-3 overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[400px]">
              <thead>
                <tr className="text-neutral-400 font-bold border-b border-neutral-100 dark:border-neutral-800 pb-2">
                  <th className="py-2">Kode</th>
                  <th className="py-2">Nama Produk</th>
                  <th className="py-2">Kategori</th>
                  <th className="py-2 text-center">Unit Ditawarkan</th>
                  <th className="py-2 text-center text-red-500">Frek. Lost</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800 text-neutral-700 dark:text-neutral-300">
                {produkLostTrends.map((prod, index) => (
                  <tr key={prod.id} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/20">
                    <td className="py-3 font-mono font-bold text-neutral-500">{prod.kode}</td>
                    <td className="py-3 font-bold text-neutral-900 dark:text-white">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-md bg-red-50 dark:bg-red-950/30 text-red-500 flex items-center justify-center font-mono font-bold text-[10px]">{index + 1}</span>
                        <span className="truncate max-w-[150px]">{prod.nama}</span>
                      </div>
                    </td>
                    <td className="py-3 text-neutral-500">{prod.kategori}</td>
                    <td className="py-3 text-center font-mono font-bold text-neutral-800 dark:text-neutral-200">{prod.qtyLost}</td>
                    <td className="py-3 text-center font-mono font-bold text-red-500">{prod.lostCount}x</td>
                  </tr>
                ))}
                {produkLostTrends.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-4 text-center text-neutral-400 italic">Belum ada transaksi lead yang lost dengan penawaran tercatat.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
