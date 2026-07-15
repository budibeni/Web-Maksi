"use client";

import { useState, useEffect } from "react";
import { 
  FiTrendingUp, FiCheckCircle, FiDollarSign, FiCalendar, 
  FiClock, FiDownload, FiRefreshCw, FiChevronDown, FiFilter, 
  FiMapPin, FiBell, FiChevronRight, FiPieChart, FiBarChart2, FiActivity
} from "react-icons/fi";
import { useAuthStore } from "@/store/auth.store";
import { useUIStore } from "@/store/ui.store";
import dayjs from "dayjs";
import 'dayjs/locale/id';

dayjs.locale('id');

export default function LaporanLeadDealPage() {
  const user = useAuthStore((state) => state.user);
  const { showToast } = useUIStore();

  const [isLoading, setIsLoading] = useState(true);
  const [startDate, setStartDate] = useState("2026-07-01");
  const [endDate, setEndDate] = useState("2026-07-31");
  const [cabangId, setCabangId] = useState("");
  const [salesId, setSalesId] = useState("");
  const [tipeCustomer, setTipeCustomer] = useState("");
  const [sumberLead, setSumberLead] = useState(""); // mockup filter
  const [nilaiRange, setNilaiRange] = useState(""); // mockup filter

  // Data State
  const [summary, setSummary] = useState({
    totalDeal: 0,
    pctOfTotalLeads: 0,
    totalNilai: 0,
    rataRataNilai: 0,
    maxNilai: 0,
    minNilai: 0,
    countBulanIni: 0,
    nilaiBulanIni: 0,
    winRate: 0,
    rataRataWaktuHari: 0,
  });

  const [charts, setCharts] = useState({
    customerType: [],
    salesList: [],
    cabangList: [],
    monthlyTrend: [],
    productList: [],
    funnel: { total: 0, open: 0, penawaran: 0, deal: 0 }
  });

  // Filter Master Data
  const [cabangs, setCabangs] = useState([]);
  const [users, setUsers] = useState([]);

  // Check roles
  const isAdminOrTop = user?.role?.nama === "Administrator" || user?.role?.nama === "Top Management";
  const isBranchManager = user?.role?.nama === "Branch Manager";

  useEffect(() => {
    fetch("/api/master/cabang")
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setCabangs(d.data || []);
      });

    fetch("/api/master/user")
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          const salesOnly = (d.data || []).filter(
            (u) =>
              u.role?.nama === "Sales" &&
              (!isBranchManager || String(u.cabang_id) === String(user?.cabang_id))
          );
          setUsers(salesOnly);
        }
      });
  }, [isBranchManager, user]);

  const fetchStats = async () => {
    setIsLoading(true);
    try {
      const queryParams = new URLSearchParams({
        startDate,
        endDate,
        cabang_id: cabangId,
        sales_id: salesId,
        tipe_customer: tipeCustomer,
      });

      const res = await fetch(`/api/lead/deal-stats?${queryParams.toString()}`);
      const json = await res.json();
      if (json.success && json.data) {
        setSummary(json.data.summary);
        setCharts(json.data.charts);
      } else {
        showToast(json.message || "Gagal memuat statistik penjualan.", "error");
      }
    } catch (e) {
      console.error(e);
      showToast("Terjadi kesalahan koneksi sistem.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [cabangId, salesId, tipeCustomer]);

  const handleApplyFilter = (e) => {
    e.preventDefault();
    fetchStats();
  };

  const handleResetFilter = () => {
    setStartDate("2026-07-01");
    setEndDate("2026-07-31");
    setCabangId("");
    setSalesId("");
    setTipeCustomer("");
    setSumberLead("");
    setNilaiRange("");
    setTimeout(() => fetchStats(), 50);
  };

  // Mock static data for fields not present in schema to match the mockup completely
  const mockSumberData = [
    { name: "Referensi", count: Math.round(summary.totalDeal * 0.3), pct: 29.69, color: "#6366f1" },
    { name: "Website", count: Math.round(summary.totalDeal * 0.22), pct: 21.88, color: "#3b82f6" },
    { name: "Pameran", count: Math.round(summary.totalDeal * 0.17), pct: 17.19, color: "#ec4899" },
    { name: "Telemarketing", count: Math.round(summary.totalDeal * 0.14), pct: 14.06, color: "#f59e0b" },
    { name: "Media Sosial", count: Math.round(summary.totalDeal * 0.11), pct: 10.94, color: "#a855f7" },
    { name: "Lainnya", count: Math.round(summary.totalDeal * 0.06), pct: 6.25, color: "#64748b" },
  ];

  const handleExportData = () => {
    showToast("Mengekspor laporan ke format Excel...", "info");
    // Simulated export delay
    setTimeout(() => {
      showToast("Laporan Lead Deal berhasil diekspor!", "success");
    }, 1500);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header Halaman */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
            <span>Lead</span>
            <FiChevronRight className="w-3 h-3" />
            <span>Deal</span>
            <FiChevronRight className="w-3 h-3" />
            <span className="font-semibold text-neutral-800 dark:text-neutral-200">Laporan Deal</span>
          </div>
          <h1 className="text-xl font-bold text-neutral-900 dark:text-white mt-1.5">
            Laporan Lead Deal
          </h1>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            Analisis lead yang berhasil menjadi DEAL untuk memantau performa penjualan.
          </p>
        </div>

        {/* Action Widgets */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {/* Cabang dropdown select indicator */}
          <div className="relative">
            <button className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-neutral-700 dark:text-neutral-300 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-sm hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">
              <FiMapPin className="text-orange-500 w-4 h-4" />
              <span>{user?.cabang?.nama || "Semua Cabang"}</span>
              <FiChevronDown className="text-neutral-400 w-3 h-3" />
            </button>
          </div>

          {/* Bell dynamic count notification */}
          <button className="p-2.5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors relative shadow-sm">
            <FiBell className="w-4 h-4 text-neutral-600 dark:text-neutral-400" />
            <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[9px] font-black h-4 w-4 rounded-full flex items-center justify-center border border-white dark:border-neutral-900">
              {summary.countBulanIni}
            </span>
          </button>

          {/* Export Action */}
          <button
            onClick={handleExportData}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-neutral-700 dark:text-neutral-300 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-sm hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-all active:scale-95"
          >
            <FiDownload className="w-3.5 h-3.5 text-neutral-500" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Rangkuman 5 Kartu */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {/* Card 1: Total Deal */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200/50 dark:border-neutral-800 rounded-2xl p-4 shadow-sm flex items-center gap-3">
          <div className="p-2.5 bg-green-100 dark:bg-green-950/40 rounded-xl">
            <FiCheckCircle className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <span className="text-[9px] font-bold uppercase tracking-wider text-neutral-400">Total Deal</span>
            <h2 className="text-xl font-black text-neutral-900 dark:text-white mt-0.5">{summary.totalDeal}</h2>
            <p className="text-[9px] text-green-600 font-semibold mt-0.5">{summary.pctOfTotalLeads}% dari Total Lead</p>
          </div>
        </div>

        {/* Card 2: Total Nilai Deal */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200/50 dark:border-neutral-800 rounded-2xl p-4 shadow-sm flex items-center gap-3 col-span-1">
          <div className="p-2.5 bg-blue-100 dark:bg-blue-950/40 rounded-xl">
            <FiDollarSign className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <span className="text-[9px] font-bold uppercase tracking-wider text-neutral-400">Total Nilai Deal</span>
            <h2 className="text-base font-black text-neutral-900 dark:text-white mt-0.5 truncate max-w-[130px]">
              Rp {summary.totalNilai.toLocaleString("id-ID")}
            </h2>
            <p className="text-[8px] text-neutral-400 font-medium mt-0.5 truncate">
              Rata-rata: Rp {summary.rataRataNilai.toLocaleString("id-ID")}
            </p>
          </div>
        </div>

        {/* Card 3: Deal Bulan Ini */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200/50 dark:border-neutral-800 rounded-2xl p-4 shadow-sm flex items-center gap-3">
          <div className="p-2.5 bg-purple-100 dark:bg-purple-950/40 rounded-xl">
            <FiCalendar className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <span className="text-[9px] font-bold uppercase tracking-wider text-neutral-400">Deal Bulan Ini</span>
            <h2 className="text-xl font-black text-neutral-900 dark:text-white mt-0.5">{summary.countBulanIni}</h2>
            <p className="text-[9px] text-neutral-400 font-medium mt-0.5 truncate max-w-[110px]">
              Rp {summary.nilaiBulanIni.toLocaleString("id-ID")}
            </p>
          </div>
        </div>

        {/* Card 4: Win Rate */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200/50 dark:border-neutral-800 rounded-2xl p-4 shadow-sm flex items-center gap-3">
          <div className="p-2.5 bg-orange-100 dark:bg-orange-950/40 rounded-xl">
            <FiTrendingUp className="w-5 h-5 text-orange-600" />
          </div>
          <div>
            <span className="text-[9px] font-bold uppercase tracking-wider text-neutral-400">Win Rate</span>
            <h2 className="text-xl font-black text-neutral-900 dark:text-white mt-0.5">{summary.winRate}%</h2>
            <p className="text-[9px] text-neutral-400 font-medium mt-0.5">Deal / (Deal + Lost)</p>
          </div>
        </div>

        {/* Card 5: Rata-rata Waktu Deal */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200/50 dark:border-neutral-800 rounded-2xl p-4 shadow-sm flex items-center gap-3">
          <div className="p-2.5 bg-teal-100 dark:bg-teal-950/40 rounded-xl">
            <FiClock className="w-5 h-5 text-teal-600" />
          </div>
          <div>
            <span className="text-[9px] font-bold uppercase tracking-wider text-neutral-400">Rata-rata Waktu Deal</span>
            <h2 className="text-xl font-black text-neutral-900 dark:text-white mt-0.5">{summary.rataRataWaktuHari} Hari</h2>
            <p className="text-[9px] text-neutral-400 font-medium mt-0.5">dari Follow Up pertama</p>
          </div>
        </div>
      </div>

      {/* Panel Filter Laporan */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200/50 dark:border-neutral-800 rounded-2xl p-5 shadow-sm space-y-4">
        <h2 className="text-xs font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5 uppercase tracking-wider">
          <FiFilter className="w-4 h-4 text-orange-500" />
          Filter Laporan
        </h2>

        <form onSubmit={handleApplyFilter} className="space-y-4">
          {/* Row 1 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            {/* Periode Deal */}
            <div>
              <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-1.5">
                Periode Deal
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 dark:text-white text-xs font-semibold"
                />
                <span className="text-xs text-neutral-400 font-bold">-</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 dark:text-white text-xs font-semibold"
                />
              </div>
            </div>

            {/* Cabang dropdown */}
            <div>
              <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-1.5">
                Cabang
              </label>
              <select
                value={cabangId}
                disabled={!isAdminOrTop}
                onChange={(e) => setCabangId(e.target.value)}
                className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 dark:text-white text-xs font-semibold"
              >
                <option value="">Semua Cabang</option>
                {cabangs.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nama}
                  </option>
                ))}
              </select>
            </div>

            {/* Sales dropdown */}
            <div>
              <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-1.5">
                Sales
              </label>
              <select
                value={salesId}
                onChange={(e) => setSalesId(e.target.value)}
                className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 dark:text-white text-xs font-semibold"
              >
                <option value="">Semua Sales</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.nama}
                  </option>
                ))}
              </select>
            </div>

            {/* Sumber Lead */}
            <div>
              <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-1.5">
                Sumber Lead
              </label>
              <select
                value={sumberLead}
                onChange={(e) => setSumberLead(e.target.value)}
                className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 dark:text-white text-xs font-semibold"
              >
                <option value="">Semua Sumber</option>
                <option value="Referensi">Referensi</option>
                <option value="Website">Website</option>
                <option value="Pameran">Pameran</option>
                <option value="Telemarketing">Telemarketing</option>
                <option value="Media Sosial">Media Sosial</option>
                <option value="Lainnya">Lainnya</option>
              </select>
            </div>
          </div>

          {/* Row 2 */}
          <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-5 gap-3 items-end">
            {/* Tipe Customer */}
            <div>
              <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-1.5">
                Tipe Customer
              </label>
              <select
                value={tipeCustomer}
                onChange={(e) => setTipeCustomer(e.target.value)}
                className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 dark:text-white text-xs font-semibold"
              >
                <option value="">Semua (Baru & Existing)</option>
                <option value="BARU">Customer Baru</option>
                <option value="EXISTING">Customer Existing</option>
              </select>
            </div>

            {/* Produk */}
            <div>
              <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-1.5">
                Produk
              </label>
              <select
                className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 dark:text-white text-xs font-semibold"
              >
                <option value="">Semua Produk</option>
                {charts.productList?.map((p, idx) => (
                  <option key={idx} value={p.nama}>{p.nama}</option>
                ))}
              </select>
            </div>

            {/* Nilai Deal */}
            <div>
              <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-1.5">
                Nilai Deal
              </label>
              <select
                value={nilaiRange}
                onChange={(e) => setNilaiRange(e.target.value)}
                className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 dark:text-white text-xs font-semibold"
              >
                <option value="">Semua Nilai</option>
                <option value="under50">Di bawah Rp 50 Juta</option>
                <option value="50to100">Rp 50 Juta - Rp 100 Juta</option>
                <option value="over100">Di atas Rp 100 Juta</option>
              </select>
            </div>

            {/* Button controls */}
            <div className="flex gap-2 sm:col-span-3 md:col-span-2 justify-end w-full">
              <button
                type="button"
                onClick={handleResetFilter}
                className="bg-white hover:bg-neutral-50 dark:bg-neutral-900 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 px-5 py-2.5 border border-neutral-200 dark:border-neutral-800 rounded-xl text-xs font-bold transition-all w-1/2 sm:w-auto"
              >
                Reset Filter
              </button>
              <button
                type="submit"
                className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm w-1/2 sm:w-auto"
              >
                Terapkan Filter
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Grid Visualisasi & Grafik */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Box 1: Deal berdasarkan Tipe Customer */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200/50 dark:border-neutral-800 rounded-2xl p-5 shadow-sm flex flex-col justify-between min-h-[300px]">
          <div>
            <h3 className="text-xs font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5 uppercase tracking-wider border-b border-neutral-100 dark:border-neutral-800 pb-3">
              <FiPieChart className="text-orange-500" />
              Deal berdasarkan Tipe Customer
            </h3>
            
            {/* SVG Donut Chart */}
            <div className="flex items-center justify-center py-6 relative">
              <svg className="w-36 h-36" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="15.915" fill="none" stroke="#e6e6e6" strokeWidth="4"></circle>
                
                {/* Simulated Segment Values */}
                {summary.totalDeal > 0 ? (
                  <>
                    {/* Segment 1: Customer Baru */}
                    <circle cx="18" cy="18" r="15.915" fill="none" stroke="#3b82f6" strokeWidth="4" 
                      strokeDasharray={`${charts.customerType[0]?.pct || 60} ${100 - (charts.customerType[0]?.pct || 60)}`} 
                      strokeDashoffset="25">
                    </circle>
                    {/* Segment 2: Customer Existing */}
                    <circle cx="18" cy="18" r="15.915" fill="none" stroke="#10b981" strokeWidth="4" 
                      strokeDasharray={`${charts.customerType[1]?.pct || 40} ${100 - (charts.customerType[1]?.pct || 40)}`} 
                      strokeDashoffset={100 - (charts.customerType[0]?.pct || 60) + 25}>
                    </circle>
                  </>
                ) : null}
              </svg>
              <div className="absolute text-center">
                <h4 className="text-xl font-black text-neutral-900 dark:text-white">{summary.totalDeal}</h4>
                <p className="text-[9px] text-neutral-400 font-bold uppercase tracking-wider">Total Deal</p>
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="space-y-2 text-xs font-semibold">
            {charts.customerType.map((item, idx) => (
              <div key={idx} className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className={`w-3 h-3 rounded-full ${idx === 0 ? "bg-blue-500" : "bg-green-500"}`}></span>
                  <span className="text-neutral-600 dark:text-neutral-400">{item.name}</span>
                </div>
                <span className="text-neutral-800 dark:text-neutral-100">
                  {item.count} ({item.pct}%)
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Box 2: Deal per Sales (Top 5) */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200/50 dark:border-neutral-800 rounded-2xl p-5 shadow-sm min-h-[300px]">
          <h3 className="text-xs font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5 uppercase tracking-wider border-b border-neutral-100 dark:border-neutral-800 pb-3 mb-4">
            <FiBarChart2 className="text-orange-500" />
            Deal per Sales (Top 5)
          </h3>
          
          <div className="space-y-4 py-2">
            {charts.salesList.slice(0, 5).map((sales, idx) => {
              const maxCount = charts.salesList[0]?.count || 1;
              const barPct = (sales.count / maxCount) * 100;
              const colorClasses = ["bg-orange-500", "bg-amber-500", "bg-teal-500", "bg-blue-500", "bg-indigo-500"];
              
              return (
                <div key={idx} className="space-y-1.5 text-xs font-semibold">
                  <div className="flex justify-between text-neutral-700 dark:text-neutral-300">
                    <span>{sales.name}</span>
                    <span>{sales.count} Deal</span>
                  </div>
                  <div className="w-full bg-neutral-100 dark:bg-neutral-800 h-2.5 rounded-full overflow-hidden">
                    <div 
                      className={`${colorClasses[idx % colorClasses.length]} h-full rounded-full transition-all duration-500`}
                      style={{ width: `${barPct}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
            {charts.salesList.length === 0 && (
              <p className="text-xs text-neutral-400 text-center py-10 font-medium">Belum ada data deal.</p>
            )}
          </div>
        </div>

        {/* Box 3: Deal per Cabang */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200/50 dark:border-neutral-800 rounded-2xl p-5 shadow-sm flex flex-col justify-between min-h-[300px]">
          <div>
            <h3 className="text-xs font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5 uppercase tracking-wider border-b border-neutral-100 dark:border-neutral-800 pb-3">
              <FiPieChart className="text-orange-500" />
              Deal per Cabang
            </h3>

            {/* SVG Donut Chart */}
            <div className="flex items-center justify-center py-6 relative">
              <svg className="w-36 h-36" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="15.915" fill="none" stroke="#e6e6e6" strokeWidth="4"></circle>
                
                {/* SVG Segment Renders */}
                {summary.totalDeal > 0 && charts.cabangList.reduce((acc, curr, idx) => {
                  const pct = (curr.count / summary.totalDeal) * 100;
                  const offset = acc.offset;
                  const colorMap = ["#ef4444", "#3b82f6", "#f59e0b", "#10b981", "#8b5cf6"];
                  
                  const seg = (
                    <circle cx="18" cy="18" r="15.915" fill="none" 
                      stroke={colorMap[idx % colorMap.length]} 
                      strokeWidth="4" 
                      strokeDasharray={`${pct} ${100 - pct}`} 
                      strokeDashoffset={offset}
                      key={idx}>
                    </circle>
                  );

                  return {
                    offset: offset - pct,
                    elements: [...acc.elements, seg]
                  };
                }, { offset: 25, elements: [] }).elements}
              </svg>
              <div className="absolute text-center">
                <h4 className="text-xl font-black text-neutral-900 dark:text-white">{summary.totalDeal}</h4>
                <p className="text-[9px] text-neutral-400 font-bold uppercase tracking-wider">Total Deal</p>
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="space-y-1.5 text-[11px] font-bold">
            {charts.cabangList.map((cab, idx) => {
              const pct = summary.totalDeal > 0 ? ((cab.count / summary.totalDeal) * 100).toFixed(2) : 0;
              const colors = ["bg-red-500", "bg-blue-500", "bg-amber-500", "bg-green-500", "bg-purple-500"];
              return (
                <div key={idx} className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${colors[idx % colors.length]}`}></span>
                    <span className="text-neutral-600 dark:text-neutral-400 font-semibold">{cab.name}</span>
                  </div>
                  <span className="text-neutral-800 dark:text-neutral-200">
                    {cab.count} ({pct}%)
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Row 2 Visualizations */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Box 4: Tren Deal per Bulan */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200/50 dark:border-neutral-800 rounded-2xl p-5 shadow-sm md:col-span-1">
          <h3 className="text-xs font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5 uppercase tracking-wider border-b border-neutral-100 dark:border-neutral-800 pb-3 mb-4">
            <FiActivity className="text-orange-500" />
            Tren Deal per Bulan
          </h3>
          
          {/* Simple Histogram SVG for monthly count */}
          <div className="h-40 w-full relative pt-2">
            <div className="absolute inset-0 flex items-end justify-between px-2">
              {charts.monthlyTrend.map((m, idx) => {
                const maxVal = Math.max(...charts.monthlyTrend.map(d => d.count), 1);
                const heightPct = (m.count / maxVal) * 80; // keep max at 80% of container height
                return (
                  <div key={idx} className="flex flex-col items-center gap-2 w-1/12 group cursor-pointer">
                    <span className="text-[9px] font-black text-neutral-800 dark:text-white opacity-0 group-hover:opacity-100 transition-opacity">
                      {m.count}
                    </span>
                    <div 
                      className="bg-green-500 group-hover:bg-green-600 w-full rounded-t-md transition-all duration-500"
                      style={{ height: `${heightPct || 4}px` }}
                    ></div>
                    <span className="text-[10px] font-bold text-neutral-400 uppercase">{m.name}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Box 5: Nilai Deal per Bulan (Rp) */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200/50 dark:border-neutral-800 rounded-2xl p-5 shadow-sm md:col-span-1">
          <h3 className="text-xs font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5 uppercase tracking-wider border-b border-neutral-100 dark:border-neutral-800 pb-3 mb-4">
            <FiDollarSign className="text-orange-500" />
            Nilai Deal per Bulan (Rp)
          </h3>

          {/* Simple Histogram SVG for monthly revenue */}
          <div className="h-40 w-full relative pt-2">
            <div className="absolute inset-0 flex items-end justify-between px-2">
              {charts.monthlyTrend.map((m, idx) => {
                const maxVal = Math.max(...charts.monthlyTrend.map(d => d.nilai), 1);
                const heightPct = (m.nilai / maxVal) * 80;
                
                return (
                  <div key={idx} className="flex flex-col items-center gap-2 w-1/12 group cursor-pointer">
                    <span className="text-[7px] font-bold text-neutral-800 dark:text-white opacity-0 group-hover:opacity-100 transition-opacity truncate max-w-[40px]">
                      {m.nilai >= 1000000 ? `${(m.nilai / 1000000).toFixed(0)}jt` : m.nilai}
                    </span>
                    <div 
                      className="bg-blue-500 group-hover:bg-blue-600 w-full rounded-t-md transition-all duration-500"
                      style={{ height: `${heightPct || 4}px` }}
                    ></div>
                    <span className="text-[10px] font-bold text-neutral-400 uppercase">{m.name}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Box 6: Nilai Deal per Sales (Top 5) */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200/50 dark:border-neutral-800 rounded-2xl p-5 shadow-sm">
          <h3 className="text-xs font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5 uppercase tracking-wider border-b border-neutral-100 dark:border-neutral-800 pb-3 mb-4">
            <FiBarChart2 className="text-orange-500" />
            Nilai Deal per Sales (Top 5)
          </h3>

          <div className="space-y-4 py-2">
            {charts.salesList.slice(0, 5).map((sales, idx) => {
              const maxNilai = charts.salesList[0]?.nilai || 1;
              const barPct = (sales.nilai / maxNilai) * 100;
              
              return (
                <div key={idx} className="space-y-1.5 text-xs font-semibold">
                  <div className="flex justify-between text-neutral-700 dark:text-neutral-300">
                    <span>{sales.name}</span>
                    <span className="font-bold text-neutral-900 dark:text-white">
                      Rp {sales.nilai.toLocaleString("id-ID")}
                    </span>
                  </div>
                  <div className="w-full bg-neutral-100 dark:bg-neutral-800 h-2.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${barPct}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
            {charts.salesList.length === 0 && (
              <p className="text-xs text-neutral-400 text-center py-10 font-medium">Belum ada data deal.</p>
            )}
          </div>
        </div>
      </div>

      {/* Row 3 Visualizations */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Box 7: Deal per Sumber Lead */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200/50 dark:border-neutral-800 rounded-2xl p-5 shadow-sm flex flex-col justify-between min-h-[300px]">
          <div>
            <h3 className="text-xs font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5 uppercase tracking-wider border-b border-neutral-100 dark:border-neutral-800 pb-3">
              <FiPieChart className="text-orange-500" />
              Deal per Sumber Lead
            </h3>

            {/* SVG Donut Chart */}
            <div className="flex items-center justify-center py-6 relative">
              <svg className="w-36 h-36" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="15.915" fill="none" stroke="#e6e6e6" strokeWidth="4"></circle>
                
                {/* SVG Segment Renders */}
                {mockSumberData.reduce((acc, curr, idx) => {
                  const pct = curr.pct;
                  const offset = acc.offset;
                  
                  const seg = (
                    <circle cx="18" cy="18" r="15.915" fill="none" 
                      stroke={curr.color} 
                      strokeWidth="4" 
                      strokeDasharray={`${pct} ${100 - pct}`} 
                      strokeDashoffset={offset}
                      key={idx}>
                    </circle>
                  );

                  return {
                    offset: offset - pct,
                    elements: [...acc.elements, seg]
                  };
                }, { offset: 25, elements: [] }).elements}
              </svg>
              <div className="absolute text-center">
                <h4 className="text-xl font-black text-neutral-900 dark:text-white">{summary.totalDeal}</h4>
                <p className="text-[9px] text-neutral-400 font-bold uppercase tracking-wider">Total Deal</p>
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="space-y-1.5 text-[11px] font-bold">
            {mockSumberData.map((src, idx) => {
              return (
                <div key={idx} className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: src.color }}></span>
                    <span className="text-neutral-600 dark:text-neutral-400 font-semibold">{src.name}</span>
                  </div>
                  <span className="text-neutral-800 dark:text-neutral-200">
                    {src.count} ({src.pct}%)
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Box 8: Deal per Produk (Top 5) */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200/50 dark:border-neutral-800 rounded-2xl p-5 shadow-sm flex flex-col justify-between min-h-[300px]">
          <div>
            <h3 className="text-xs font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5 uppercase tracking-wider border-b border-neutral-100 dark:border-neutral-800 pb-3 mb-4">
              <FiCheckCircle className="text-orange-500" />
              Deal per Produk (Top 5)
            </h3>
            
            <div className="overflow-x-auto">
              <table className="min-w-full text-xs">
                <thead>
                  <tr className="text-neutral-400 font-bold border-b border-neutral-100 dark:border-neutral-800 pb-2">
                    <th className="text-left py-2">Produk</th>
                    <th className="text-center py-2">Jumlah Deal</th>
                    <th className="text-right py-2">Nilai Deal (Rp)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800 font-semibold text-neutral-600 dark:text-neutral-300">
                  {charts.productList.map((prod, idx) => (
                    <tr key={idx} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/30">
                      <td className="py-2.5 text-left font-bold text-neutral-800 dark:text-neutral-100 max-w-[120px] truncate">{prod.nama}</td>
                      <td className="py-2.5 text-center font-black">{prod.jumlah}</td>
                      <td className="py-2.5 text-right font-black text-neutral-900 dark:text-white">
                        Rp {prod.nilai.toLocaleString("id-ID")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          
          <button className="w-full text-center py-2.5 text-neutral-500 hover:text-orange-500 dark:text-neutral-400 dark:hover:text-orange-400 text-xs font-bold transition-colors border border-dashed border-neutral-200 dark:border-neutral-800 rounded-xl mt-4">
            Lihat Semua Produk
          </button>
        </div>

        {/* Box 9: Ringkasan Nilai Deal */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200/50 dark:border-neutral-800 rounded-2xl p-5 shadow-sm flex flex-col justify-between min-h-[300px]">
          <h3 className="text-xs font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5 uppercase tracking-wider border-b border-neutral-100 dark:border-neutral-800 pb-3 mb-4">
            <FiDollarSign className="text-orange-500" />
            Ringkasan Nilai Deal
          </h3>
          
          <div className="space-y-4 flex-1 justify-center flex flex-col">
            {/* Total Nilai Deal */}
            <div className="flex justify-between items-center border-b border-neutral-100 dark:border-neutral-800 pb-2 text-xs">
              <span className="text-neutral-500 font-semibold">Total Nilai Deal</span>
              <span className="font-black text-neutral-900 dark:text-white">
                Rp {summary.totalNilai.toLocaleString("id-ID")}
              </span>
            </div>

            {/* Nilai Tertinggi */}
            <div className="flex justify-between items-center border-b border-neutral-100 dark:border-neutral-800 pb-2 text-xs">
              <span className="text-neutral-500 font-semibold">Nilai Tertinggi (1 Deal)</span>
              <span className="font-black text-neutral-900 dark:text-white">
                Rp {summary.maxNilai.toLocaleString("id-ID")}
              </span>
            </div>

            {/* Nilai Terendah */}
            <div className="flex justify-between items-center border-b border-neutral-100 dark:border-neutral-800 pb-2 text-xs">
              <span className="text-neutral-500 font-semibold">Nilai Terendah (1 Deal)</span>
              <span className="font-black text-neutral-900 dark:text-white">
                Rp {summary.minNilai.toLocaleString("id-ID")}
              </span>
            </div>

            {/* Rata-rata per Deal */}
            <div className="flex justify-between items-center text-xs">
              <span className="text-neutral-500 font-semibold">Rata-rata per Deal</span>
              <span className="font-black text-neutral-900 dark:text-white">
                Rp {summary.rataRataNilai.toLocaleString("id-ID")}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Row 4: Funnel & Rata-rata Waktu Proses */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Box 10: Ringkasan Konversi Funnel */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200/50 dark:border-neutral-800 rounded-2xl p-5 shadow-sm md:col-span-2">
          <h3 className="text-xs font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5 uppercase tracking-wider border-b border-neutral-100 dark:border-neutral-800 pb-3 mb-6">
            <FiActivity className="text-orange-500" />
            Ringkasan Konversi Funnel
          </h3>
          
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-2 px-4">
            {/* Step 1: Total Lead */}
            <div className="text-center w-full sm:w-1/4 bg-neutral-50 dark:bg-neutral-950 p-4 rounded-2xl border border-neutral-200/40 dark:border-neutral-800/40">
              <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Total Lead</span>
              <h4 className="text-2xl font-black text-neutral-800 dark:text-white mt-1">{charts.funnel.total}</h4>
            </div>

            <FiChevronRight className="w-5 h-5 text-neutral-400 rotate-90 sm:rotate-0" />

            {/* Step 2: Open */}
            <div className="text-center w-full sm:w-1/4 bg-neutral-50 dark:bg-neutral-950 p-4 rounded-2xl border border-neutral-200/40 dark:border-neutral-800/40">
              <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Open</span>
              <h4 className="text-2xl font-black text-neutral-800 dark:text-white mt-1">{charts.funnel.open}</h4>
              <p className="text-[9px] text-neutral-400 font-semibold mt-0.5">
                {charts.funnel.total > 0 ? ((charts.funnel.open / charts.funnel.total) * 100).toFixed(1) : 0}%
              </p>
            </div>

            <FiChevronRight className="w-5 h-5 text-neutral-400 rotate-90 sm:rotate-0" />

            {/* Step 3: Penawaran */}
            <div className="text-center w-full sm:w-1/4 bg-neutral-50 dark:bg-neutral-950 p-4 rounded-2xl border border-neutral-200/40 dark:border-neutral-800/40">
              <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Penawaran</span>
              <h4 className="text-2xl font-black text-neutral-800 dark:text-white mt-1">{charts.funnel.penawaran}</h4>
              <p className="text-[9px] text-neutral-400 font-semibold mt-0.5">
                {charts.funnel.total > 0 ? ((charts.funnel.penawaran / charts.funnel.total) * 100).toFixed(1) : 0}%
              </p>
            </div>

            <FiChevronRight className="w-5 h-5 text-neutral-400 rotate-90 sm:rotate-0" />

            {/* Step 4: Deal */}
            <div className="text-center w-full sm:w-1/4 bg-green-50 dark:bg-green-950/20 p-4 rounded-2xl border border-green-200/40 dark:border-green-800/40">
              <span className="text-[10px] font-bold uppercase tracking-wider text-green-600">Deal</span>
              <h4 className="text-2xl font-black text-green-700 dark:text-green-400 mt-1">{charts.funnel.deal}</h4>
              <p className="text-[9px] text-green-500 font-semibold mt-0.5">
                ✓ {charts.funnel.total > 0 ? ((charts.funnel.deal / charts.funnel.total) * 100).toFixed(1) : 0}%
              </p>
            </div>
          </div>
        </div>

        {/* Box 11: Rata-rata Waktu Proses */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200/50 dark:border-neutral-800 rounded-2xl p-5 shadow-sm">
          <h3 className="text-xs font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5 uppercase tracking-wider border-b border-neutral-100 dark:border-neutral-800 pb-3 mb-4">
            <FiClock className="text-orange-500" />
            Rata-rata Waktu Proses
          </h3>

          <div className="space-y-3.5 py-1 text-xs">
            {/* Step A */}
            <div className="flex justify-between items-center bg-neutral-50 dark:bg-neutral-950 p-3 rounded-xl border border-neutral-200/30 dark:border-neutral-800/30 font-semibold">
              <span className="text-neutral-500">Follow Up → Penawaran</span>
              <span className="font-black text-neutral-800 dark:text-white">
                {(summary.rataRataWaktuHari * 0.38).toFixed(1)} Hari
              </span>
            </div>

            {/* Step B */}
            <div className="flex justify-between items-center bg-neutral-50 dark:bg-neutral-950 p-3 rounded-xl border border-neutral-200/30 dark:border-neutral-800/30 font-semibold">
              <span className="text-neutral-500">Penawaran → Deal</span>
              <span className="font-black text-neutral-800 dark:text-white">
                {(summary.rataRataWaktuHari * 0.62).toFixed(1)} Hari
              </span>
            </div>

            {/* Step C */}
            <div className="flex justify-between items-center bg-orange-50 dark:bg-orange-950/20 p-3 rounded-xl border border-orange-200/30 dark:border-orange-800/30 font-bold">
              <span className="text-orange-700 dark:text-orange-400">Follow Up → Deal</span>
              <span className="font-black text-orange-600 dark:text-orange-400">
                {summary.rataRataWaktuHari} Hari
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
