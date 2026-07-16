"use client";

import { useState, useEffect } from "react";
import { 
  FiSearch, FiCalendar, FiUser, FiMapPin, FiRefreshCw, FiTrendingUp,
  FiTarget, FiCheckCircle, FiXCircle, FiActivity, FiBell, FiChevronRight, FiGrid
} from "react-icons/fi";
import { useAuthStore } from "@/store/auth.store";
import { useUIStore } from "@/store/ui.store";
import { formatCurrency } from "@/utils/format-currency";
import dayjs from "dayjs";
import FilterPanel from "@/components/ui/FilterPanel";

export default function Dashboard() {
  const currentUser = useAuthStore((state) => state.user);
  const { showToast } = useUIStore();

  const [isLoading, setIsLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  
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

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      let url = `/api/dashboard?`;
      if (startDate) url += `startDate=${startDate}&`;
      if (endDate) url += `endDate=${endDate}&`;
      if (cabangIds.length > 0) url += `cabang_id=${cabangIds.join(",")}&`;
      if (salesIds.length > 0) url += `sales_id=${salesIds.join(",")}&`;

      const res = await fetch(url);
      const json = await res.json();
      if (json.success) {
        setDashboardData(json.data);
        if (json.data.filters) {
          setFilterOptions(json.data.filters);
        }
      } else {
        showToast(json.message || "Gagal mengambil data dashboard", "error");
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
      fetchDashboardData();
    }
  }, [startDate, endDate, cabangIds, salesIds]);

  const handleResetFilters = () => {
    setDatePreset("thisMonth");
    setCabangIds([]);
    setSalesIds([]);
  };

  if (!currentUser || !dashboardData) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm text-neutral-500 mt-4">Memuat data dashboard...</p>
      </div>
    );
  }

  const { summary, monthlyTrend, distribusiFase, funnelPenjualan, topSales, ringkasanCabang, reminders, recentActivities } = dashboardData;
  const role = (typeof currentUser.role === 'object' ? currentUser.role.nama : currentUser.role || "").toLowerCase();
  const currentYear = new Date().getFullYear();

  // Helper for phase donut chart math
  const sumFase = distribusiFase.reduce((acc, curr) => acc + curr.count, 0);
  let accumulatedPercent = 0;
  const donutSectors = distribusiFase.map(item => {
    const percent = sumFase > 0 ? (item.count / sumFase) : 0;
    const dashArray = `${percent * 314.16} 314.16`;
    const dashOffset = -accumulatedPercent * 314.16;
    accumulatedPercent += percent;
    return {
      ...item,
      dashArray,
      dashOffset,
      percentVal: Math.round(percent * 100)
    };
  });

  // Helper for trend line chart math
  const maxTrendVal = Math.max(...monthlyTrend.map(t => Math.max(t.total, t.deal, t.lost)), 10);
  const roundedMaxTrend = Math.ceil(maxTrendVal / 5) * 5;
  
  // Coordinate calculations for monthly trend lines (Plot size: 440 x 160)
  const getPoints = (key) => {
    return monthlyTrend.map((t, index) => {
      const x = 40 + (index * (400 / 11));
      const val = t[key];
      const y = 180 - ((val / roundedMaxTrend) * 150);
      return `${x},${y}`;
    }).join(" ");
  };

  const getAreaPoints = (key) => {
    const points = getPoints(key);
    if (!points) return "";
    const firstX = 40;
    const lastX = 40 + (11 * (400 / 11));
    return `${firstX},180 ${points} ${lastX},180`;
  };

  return (
    <div className="space-y-6">
      {/* Top Welcome Header */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200/50 dark:border-neutral-800/60 rounded-3xl p-6 shadow-sm flex flex-col xl:flex-row xl:items-center justify-between gap-6 transition-colors duration-300">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-neutral-800 dark:text-neutral-100 flex items-center gap-2">
            Selamat Datang, <span className="text-orange-600 dark:text-orange-400">{currentUser.nama}</span>
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            Maksi Sales Information System - Peran Anda: <span className="font-semibold uppercase">{typeof currentUser.role === 'object' ? currentUser.role.nama : currentUser.role}</span>
          </p>
        </div>
      </div>

      {/* Panel Filter Laporan (Segmen Reusable) */}
      <FilterPanel 
        title="Filter Data"
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

      {/* Summary Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {/* Total Lead Card */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200/50 dark:border-neutral-800/60 rounded-3xl p-5 shadow-sm relative overflow-hidden group hover:border-orange-500/30 transition-all duration-300">
          <div className="absolute top-0 right-0 w-24 h-24 bg-orange-50 dark:bg-orange-950/10 rounded-bl-[100px] flex items-center justify-center transition-all duration-300 group-hover:scale-110">
            <FiTrendingUp className="w-6 h-6 text-orange-500 dark:text-orange-400/80 translate-x-3 -translate-y-3" />
          </div>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-wider font-semibold">Total Lead</p>
          <h3 className="text-3xl font-extrabold text-neutral-800 dark:text-neutral-100 mt-2 font-mono">{summary.totalLead}</h3>
          <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-1">Leads dibuat dalam periode ini</p>
        </div>

        {/* Open Leads Card */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200/50 dark:border-neutral-800/60 rounded-3xl p-5 shadow-sm relative overflow-hidden group hover:border-sky-500/30 transition-all duration-300">
          <div className="absolute top-0 right-0 w-24 h-24 bg-sky-50 dark:bg-sky-950/10 rounded-bl-[100px] flex items-center justify-center transition-all duration-300 group-hover:scale-110">
            <FiTarget className="w-6 h-6 text-sky-500 dark:text-sky-400/80 translate-x-3 -translate-y-3" />
          </div>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-wider font-semibold">Open Leads</p>
          <h3 className="text-3xl font-extrabold text-neutral-800 dark:text-neutral-100 mt-2 font-mono">{summary.totalOpen}</h3>
          <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-1">Leads aktif dalam progres</p>
        </div>

        {/* Deal Leads Card */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200/50 dark:border-neutral-800/60 rounded-3xl p-5 shadow-sm relative overflow-hidden group hover:border-green-500/30 transition-all duration-300">
          <div className="absolute top-0 right-0 w-24 h-24 bg-green-50 dark:bg-green-950/10 rounded-bl-[100px] flex items-center justify-center transition-all duration-300 group-hover:scale-110">
            <FiCheckCircle className="w-6 h-6 text-green-500 dark:text-green-400/80 translate-x-3 -translate-y-3" />
          </div>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-wider font-semibold">Deal Leads</p>
          <h3 className="text-3xl font-extrabold text-neutral-800 dark:text-neutral-100 mt-2 font-mono">{summary.totalDeal}</h3>
          <p className="text-xs text-green-600 dark:text-green-400 font-semibold mt-1 font-mono truncate">{formatCurrency(summary.nilaiDeal)}</p>
        </div>

        {/* Lost Leads Card */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200/50 dark:border-neutral-800/60 rounded-3xl p-5 shadow-sm relative overflow-hidden group hover:border-red-500/30 transition-all duration-300">
          <div className="absolute top-0 right-0 w-24 h-24 bg-red-50 dark:bg-red-950/10 rounded-bl-[100px] flex items-center justify-center transition-all duration-300 group-hover:scale-110">
            <FiXCircle className="w-6 h-6 text-red-500 dark:text-red-400/80 translate-x-3 -translate-y-3" />
          </div>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-wider font-semibold">Lost Leads</p>
          <h3 className="text-3xl font-extrabold text-neutral-800 dark:text-neutral-100 mt-2 font-mono">{summary.totalLost}</h3>
          <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-1">Leads gagal / batal transaksi</p>
        </div>

        {/* Conversion & Closing Rates Card */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200/50 dark:border-neutral-800/60 rounded-3xl p-5 shadow-sm col-span-1 sm:col-span-2 lg:col-span-4 xl:col-span-1 flex flex-row xl:flex-col justify-around xl:justify-between gap-4 transition-colors duration-300">
          <div className="text-center xl:text-left">
            <span className="text-[10px] text-neutral-500 dark:text-neutral-400 uppercase tracking-wider font-semibold">Conversion Rate</span>
            <h4 className="text-2xl font-extrabold text-orange-600 dark:text-orange-400 mt-1 font-mono">{summary.conversionRate}%</h4>
          </div>
          <hr className="hidden xl:block border-neutral-100 dark:border-neutral-800" />
          <div className="text-center xl:text-left">
            <span className="text-[10px] text-neutral-500 dark:text-neutral-400 uppercase tracking-wider font-semibold">Closing Rate</span>
            <h4 className="text-2xl font-extrabold text-green-600 dark:text-green-400 mt-1 font-mono">{summary.closingRate}%</h4>
          </div>
        </div>
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trend Leads Chart (SVG Line Chart) - Col span 2 */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200/50 dark:border-neutral-800/60 rounded-3xl p-6 shadow-sm lg:col-span-2 flex flex-col justify-between transition-colors duration-300">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="font-bold text-neutral-800 dark:text-neutral-100">Tren Lead {currentYear}</h3>
              <p className="text-xs text-neutral-400 mt-0.5">Grafik sebaran bulanan volume lead tahun berjalan</p>
            </div>
            
            {/* Chart Legends */}
            <div className="flex items-center gap-3 text-[10px] font-semibold text-neutral-500">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-orange-500 rounded-full"></span>Total</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-green-500 rounded-full"></span>Deal</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-red-500 rounded-full"></span>Lost</span>
            </div>
          </div>

          {/* SVG Container */}
          <div className="relative w-full h-52 mt-2">
            <svg viewBox="0 0 460 200" className="w-full h-full" preserveAspectRatio="none">
              {/* Y Gridlines and Labels */}
              {[0, 0.25, 0.5, 0.75, 1].map((p, idx) => {
                const y = 180 - (p * 150);
                const label = Math.round(p * roundedMaxTrend);
                return (
                  <g key={idx}>
                    <line x1="40" y1={y} x2="440" y2={y} stroke="#f3f4f6" className="dark:stroke-neutral-800/40" strokeDasharray="4 4" />
                    <text x="30" y={y + 4} textAnchor="end" className="text-[10px] font-mono fill-neutral-400">{label}</text>
                  </g>
                );
              })}

              {/* X Labels (Months) */}
              {monthlyTrend.map((t, index) => {
                const x = 40 + (index * (400 / 11));
                return (
                  <text key={index} x={x} y="195" textAnchor="middle" className="text-[10px] font-semibold fill-neutral-400">{t.name}</text>
                );
              })}

              {/* Area Fills for smooth look */}
              <polygon points={getAreaPoints("total")} fill="url(#orangeGradient)" className="opacity-10" />
              <polygon points={getAreaPoints("deal")} fill="url(#greenGradient)" className="opacity-10" />
              <polygon points={getAreaPoints("lost")} fill="url(#redGradient)" className="opacity-10" />

              {/* Lines */}
              <polyline points={getPoints("total")} fill="none" stroke="#ea580c" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              <polyline points={getPoints("deal")} fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <polyline points={getPoints("lost")} fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

              {/* Node Circles */}
              {monthlyTrend.map((t, index) => {
                const x = 40 + (index * (400 / 11));
                const yTotal = 180 - ((t.total / roundedMaxTrend) * 150);
                const yDeal = 180 - ((t.deal / roundedMaxTrend) * 150);
                return (
                  <g key={index}>
                    {t.total > 0 && <circle cx={x} cy={yTotal} r="3" fill="#ea580c" stroke="#fff" strokeWidth="1" className="dark:stroke-neutral-900" />}
                    {t.deal > 0 && <circle cx={x} cy={yDeal} r="3" fill="#22c55e" stroke="#fff" strokeWidth="1" className="dark:stroke-neutral-900" />}
                  </g>
                );
              })}

              {/* Gradients Definitions */}
              <defs>
                <linearGradient id="orangeGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ea580c" />
                  <stop offset="100%" stopColor="#ea580c" stopOpacity="0" />
                </linearGradient>
                <linearGradient id="greenGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#22c55e" />
                  <stop offset="100%" stopColor="#22c55e" stopOpacity="0" />
                </linearGradient>
                <linearGradient id="redGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ef4444" />
                  <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>

        {/* Donut Chart (Distribusi Fase) - Col span 1 */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200/50 dark:border-neutral-800/60 rounded-3xl p-6 shadow-sm flex flex-col justify-between transition-colors duration-300">
          <div>
            <h3 className="font-bold text-neutral-800 dark:text-neutral-100">Sebaran Fase Lead</h3>
            <p className="text-xs text-neutral-400 mt-0.5">Persentase sebaran fase untuk Open Lead</p>
          </div>

          <div className="flex flex-col items-center justify-center my-4 relative">
            <svg width="150" height="150" viewBox="0 0 120 120" className="transform -rotate-90">
              <circle cx="60" cy="60" r="50" fill="transparent" stroke="#f3f4f6" strokeWidth="12" className="dark:stroke-neutral-850" />
              {sumFase === 0 ? (
                <circle cx="60" cy="60" r="50" fill="transparent" stroke="#e5e7eb" strokeWidth="12" className="dark:stroke-neutral-800" />
              ) : (
                donutSectors.map((sector, i) => {
                  let color = "#38bdf8"; // Lead Baru (sky-400)
                  if (sector.name === "Follow Up") color = "#f59e0b"; // Follow Up (amber-500)
                  if (sector.name === "Penawaran") color = "#6366f1"; // Penawaran (indigo-500)
                  return (
                    <circle
                      key={i}
                      cx="60"
                      cy="60"
                      r="50"
                      fill="transparent"
                      stroke={color}
                      strokeWidth="12"
                      strokeDasharray={sector.dashArray}
                      strokeDashoffset={sector.dashOffset}
                      strokeLinecap="round"
                      className="transition-all duration-500 ease-out"
                    />
                  );
                })
              )}
            </svg>
            <div className="absolute text-center">
              <span className="text-2xl font-extrabold text-neutral-800 dark:text-neutral-100 font-mono">{sumFase}</span>
              <p className="text-[10px] text-neutral-400 uppercase tracking-wide">Total Open</p>
            </div>
          </div>

          {/* Custom Labels List */}
          <div className="grid grid-cols-3 gap-2 border-t border-neutral-100 dark:border-neutral-800/80 pt-4">
            {distribusiFase.map((item, idx) => {
              const percent = sumFase > 0 ? Math.round((item.count / sumFase) * 100) : 0;
              let dotColor = "bg-sky-400";
              if (item.name === "Follow Up") dotColor = "bg-amber-500";
              if (item.name === "Penawaran") dotColor = "bg-indigo-500";
              return (
                <div key={idx} className="text-center">
                  <div className="flex items-center justify-center gap-1.5">
                    <span className={`w-2 h-2 ${dotColor} rounded-full`}></span>
                    <span className="text-[10px] font-semibold text-neutral-500 dark:text-neutral-400 truncate">{item.name}</span>
                  </div>
                  <h4 className="text-sm font-bold text-neutral-800 dark:text-neutral-100 mt-1 font-mono">{item.count} <span className="text-[10px] text-neutral-400">({percent}%)</span></h4>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Rankings Row (Top Sales, Funnel, and Cabang summary) */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {/* Funnel Penjualan */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200/50 dark:border-neutral-800/60 rounded-3xl p-6 shadow-sm flex flex-col justify-between transition-colors duration-300">
          <div>
            <h3 className="font-bold text-neutral-800 dark:text-neutral-100">Funnel Penjualan</h3>
            <p className="text-xs text-neutral-400 mt-0.5">Konversi alur proses lead hingga disetujui (Deal)</p>
          </div>

          <div className="space-y-4 my-6">
            {funnelPenjualan.map((f, i) => {
              const maxCount = funnelPenjualan[0].count || 1;
              const widthPct = maxCount > 0 ? (f.count / maxCount) * 100 : 0;
              
              let barColor = "from-orange-500 to-amber-500";
              if (i === 1) barColor = "from-indigo-500 to-purple-500";
              if (i === 2) barColor = "from-green-500 to-emerald-500";
              
              return (
                <div key={i} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-neutral-600 dark:text-neutral-400">{f.step}</span>
                    <span className="text-neutral-800 dark:text-neutral-100 font-mono">{f.count} Lead</span>
                  </div>
                  <div className="w-full bg-neutral-100 dark:bg-neutral-850 h-6 rounded-2xl overflow-hidden relative border border-neutral-200/20 dark:border-neutral-800/50">
                    <div 
                      className={`h-full bg-gradient-to-r ${barColor} rounded-2xl transition-all duration-1000 ease-out`}
                      style={{ width: `${Math.max(widthPct, 6)}%` }}
                    ></div>
                    {i > 0 && maxCount > 0 && (
                      <span className="absolute inset-y-0 right-3 flex items-center text-[10px] font-bold text-neutral-500 dark:text-neutral-400">
                        {Math.round((f.count / maxCount) * 100)}%
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <p className="text-[10px] text-neutral-400 text-center italic">
            Persentase menunjukkan rasio konversi terhadap total Lead yang masuk.
          </p>
        </div>

        {/* Top Sales Performance (Only meaningful/visible for Admins/BM/Top Management) */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200/50 dark:border-neutral-800/60 rounded-3xl p-6 shadow-sm flex flex-col justify-between transition-colors duration-300">
          <div>
            <h3 className="font-bold text-neutral-800 dark:text-neutral-100">Top 5 Performa Sales</h3>
            <p className="text-xs text-neutral-400 mt-0.5">Rangking sales berdasarkan nominal transaksi Deal</p>
          </div>

          <div className="space-y-4 my-4 flex-1 flex flex-col justify-center">
            {topSales.length === 0 ? (
              <p className="text-center text-sm text-neutral-400 my-10">Belum ada transaksi Deal pada periode ini.</p>
            ) : (
              topSales.map((s, idx) => {
                const maxVal = topSales[0].nilai || 1;
                const progressWidth = (s.nilai / maxVal) * 100;
                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between items-center text-xs font-semibold">
                      <span className="text-neutral-700 dark:text-neutral-300 truncate max-w-[150px]">{s.name}</span>
                      <span className="text-green-600 dark:text-green-400 font-mono">{formatCurrency(s.nilai)} <span className="text-neutral-400 text-[10px]">({s.count} Deal)</span></span>
                    </div>
                    <div className="w-full bg-neutral-100 dark:bg-neutral-850 h-2.5 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-orange-500 to-amber-500 rounded-full transition-all duration-1000 ease-out"
                        style={{ width: `${Math.max(progressWidth, 3)}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <p className="text-[10px] text-neutral-400 text-center italic border-t border-neutral-100 dark:border-neutral-850 pt-3">
            Hanya menghitung nominal deal pada rentang tanggal yang difilter.
          </p>
        </div>

        {/* Performa Cabang (Ringkasan Cabang) */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200/50 dark:border-neutral-800/60 rounded-3xl p-6 shadow-sm md:col-span-2 xl:col-span-1 flex flex-col justify-between transition-colors duration-300">
          <div>
            <h3 className="font-bold text-neutral-800 dark:text-neutral-100">Performa Cabang</h3>
            <p className="text-xs text-neutral-400 mt-0.5">Sebaran transaksi Deal per Kantor Cabang</p>
          </div>

          <div className="space-y-4 my-4 flex-1 flex flex-col justify-center">
            {ringkasanCabang.length === 0 ? (
              <p className="text-center text-sm text-neutral-400 my-10">Belum ada transaksi di cabang pada periode ini.</p>
            ) : (
              ringkasanCabang.map((c, idx) => {
                const maxVal = ringkasanCabang[0].nilai || 1;
                const progressWidth = (c.nilai / maxVal) * 100;
                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between items-center text-xs font-semibold">
                      <span className="text-neutral-700 dark:text-neutral-300 truncate max-w-[150px]">{c.name}</span>
                      <span className="text-neutral-800 dark:text-neutral-200 font-mono">{formatCurrency(c.nilai)} <span className="text-neutral-400 text-[10px]">({c.deal}/{c.total} Deal)</span></span>
                    </div>
                    <div className="w-full bg-neutral-100 dark:bg-neutral-850 h-2.5 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-sky-500 to-indigo-500 rounded-full transition-all duration-1000 ease-out"
                        style={{ width: `${Math.max(progressWidth, 3)}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <p className="text-[10px] text-neutral-400 text-center italic border-t border-neutral-100 dark:border-neutral-850 pt-3">
            Format: (Deal / Total Lead Dibuat).
          </p>
        </div>
      </div>

      {/* Reminders & Recent Activities Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Reminders List */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200/50 dark:border-neutral-800/60 rounded-3xl p-6 shadow-sm transition-colors duration-300">
          <div className="flex justify-between items-center border-b border-neutral-100 dark:border-neutral-850 pb-4 mb-4">
            <h3 className="font-bold text-neutral-800 dark:text-neutral-100 flex items-center gap-2">
              <FiBell className="text-orange-500 w-5 h-5 animate-swing" />
              Pengingat Aktif
            </h3>
            <span className="text-[10px] bg-orange-100 text-orange-700 dark:bg-orange-950/30 dark:text-orange-400 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
              Segera Di-Follow Up
            </span>
          </div>

          <div className="divide-y divide-neutral-100 dark:divide-neutral-850">
            {reminders.length === 0 ? (
              <div className="py-12 text-center text-neutral-400 text-sm">
                Tidak ada pengingat aktif terdekat.
              </div>
            ) : (
              reminders.map((rem) => {
                const isOverdue = new Date(rem.tanggal_pengingat) < new Date();
                return (
                  <div key={rem.id} className="py-3 flex justify-between items-start gap-4 hover:bg-neutral-50 dark:hover:bg-neutral-800/20 px-2 rounded-xl transition-colors">
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-xs font-bold text-neutral-800 dark:text-neutral-200 truncate">{rem.lead.customer.nama}</h4>
                        <span className="text-[9px] text-neutral-400 font-mono truncate">{rem.lead.nomor}</span>
                      </div>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 line-clamp-1 italic">{rem.catatan || "(Tidak ada catatan pengingat)"}</p>
                      {role !== 'sales' && (
                        <p className="text-[9px] text-neutral-400">Sales: {rem.lead.user.nama}</p>
                      )}
                    </div>
                    
                    <div className="text-right shrink-0">
                      <span className="text-[10px] font-mono font-bold text-neutral-600 dark:text-neutral-300">
                        {dayjs(rem.tanggal_pengingat).format("DD/MM/YY HH:mm")}
                      </span>
                      {isOverdue && (
                        <div className="mt-1">
                          <span className="inline-flex px-1.5 py-0.2 bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400 rounded text-[8px] font-extrabold tracking-wide uppercase">
                            Terlambat
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Latest Activities */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200/50 dark:border-neutral-800/60 rounded-3xl p-6 shadow-sm transition-colors duration-300">
          <div className="flex justify-between items-center border-b border-neutral-100 dark:border-neutral-850 pb-4 mb-4">
            <h3 className="font-bold text-neutral-800 dark:text-neutral-100 flex items-center gap-2">
              <FiActivity className="text-orange-500 w-5 h-5" />
              Aktivitas Lead Terbaru
            </h3>
            <span className="text-[10px] bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
              Histori Sales
            </span>
          </div>

          <div className="divide-y divide-neutral-100 dark:divide-neutral-850">
            {recentActivities.length === 0 ? (
              <div className="py-12 text-center text-neutral-400 text-sm">
                Belum ada aktivitas yang dicatat.
              </div>
            ) : (
              recentActivities.map((act) => {
                // Color mapping for activities badge
                let colorClass = "bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-400";
                const warna = act.hasil_interaksi_rel?.warna || "";
                if (warna === "green" || warna === "success") {
                  colorClass = "bg-green-100 text-green-700 dark:bg-green-950/20 dark:text-green-400 border border-green-200/20";
                } else if (warna === "blue" || warna === "info") {
                  colorClass = "bg-blue-100 text-blue-700 dark:bg-blue-950/20 dark:text-blue-400 border border-blue-200/20";
                } else if (warna === "yellow" || warna === "warning") {
                  colorClass = "bg-yellow-100 text-yellow-700 dark:bg-yellow-950/20 dark:text-yellow-400 border border-yellow-200/20";
                } else if (warna === "red" || warna === "danger") {
                  colorClass = "bg-red-100 text-red-700 dark:bg-red-950/20 dark:text-red-400 border border-red-200/20";
                } else if (warna === "purple") {
                  colorClass = "bg-purple-100 text-purple-700 dark:bg-purple-950/20 dark:text-purple-400 border border-purple-200/20";
                } else if (warna === "orange") {
                  colorClass = "bg-orange-100 text-orange-700 dark:bg-orange-950/20 dark:text-orange-400 border border-orange-200/20";
                }

                return (
                  <div key={act.id} className="py-3 flex justify-between items-start gap-4 hover:bg-neutral-50 dark:hover:bg-neutral-800/20 px-2 rounded-xl transition-colors">
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-xs font-bold text-neutral-850 dark:text-neutral-200 truncate">{act.lead.customer.nama}</h4>
                        <span className="text-[9px] text-neutral-400 font-mono truncate">{act.lead.nomor}</span>
                      </div>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 line-clamp-1 italic">{act.catatan || "(Tanpa catatan)"}</p>
                      <p className="text-[9px] text-neutral-400">Dicatat oleh: <span className="font-semibold">{act.dibuat_oleh}</span></p>
                    </div>
                    
                    <div className="text-right shrink-0">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold ${colorClass}`}>
                        {act.hasil_interaksi}
                      </span>
                      <div className="text-[9px] font-mono text-neutral-400 mt-1">
                        {dayjs(act.dibuat_tanggal).format("DD/MM/YY HH:mm")}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
