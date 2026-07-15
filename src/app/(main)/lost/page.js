"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  FiAlertCircle, FiTrendingDown, FiDollarSign, FiCalendar, 
  FiDownload, FiRefreshCw, FiChevronDown, FiFilter, 
  FiMapPin, FiBell, FiChevronRight, FiPieChart, FiBarChart2, FiActivity
} from "react-icons/fi";
import { useAuthStore } from "@/store/auth.store";
import { useUIStore } from "@/store/ui.store";

export default function LaporanLeadLostPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const { showToast } = useUIStore();

  useEffect(() => {
    if (user) {
      const role = (typeof user.role === 'object' ? user.role.nama : user.role || "").toLowerCase();
      if (role === 'sales') {
        router.replace("/forbidden");
      }
    }
  }, [user, router]);

  const [isLoading, setIsLoading] = useState(true);
  const [startDate, setStartDate] = useState("2026-07-01");
  const [endDate, setEndDate] = useState("2026-07-31");
  const [cabangId, setCabangId] = useState("");
  const [salesId, setSalesId] = useState("");
  const [tipeCustomer, setTipeCustomer] = useState("");
  const [tahapLost, setTahapLost] = useState("");
  const [alasanLostId, setAlasanLostId] = useState("");
  const [sumberLead, setSumberLead] = useState("");

  const [summary, setSummary] = useState({
    totalLost: 0, pctOfTotal: 0,
    lostDariAwal: 0, pctDariAwal: 0,
    lostSetelahFollowUp: 0, pctSetelahFollowUp: 0,
    totalNilaiPotensi: 0, rataRataNilaiLost: 0,
    maxNilai: 0, minNilai: 0, lostRate: 0,
    totalLeadBaru: 0, totalLeadExisting: 0,
    lostBaruCount: 0, lostExistingCount: 0,
    lostRateBaru: 0, lostRateExisting: 0,
  });

  const [charts, setCharts] = useState({
    customerType: [], salesList: [], cabangList: [],
    monthlyTrend: [], alasanListBaru: [], alasanListExisting: [],
    combinedAlasanTable: [],
  });

  const [cabangs, setCabangs] = useState([]);
  const [users, setUsers] = useState([]);
  const [alasanLosts, setAlasanLosts] = useState([]);

  const isAdminOrTop = user?.role?.nama === "Administrator" || user?.role?.nama === "Top Management";
  const isBranchManager = user?.role?.nama === "Branch Manager";

  useEffect(() => {
    fetch("/api/master/cabang").then(r => r.json()).then(d => { if (d.success) setCabangs(d.data || []); });
    fetch("/api/master/alasan-lost").then(r => r.json()).then(d => { if (d.success) setAlasanLosts(d.data || []); });
    fetch("/api/master/user").then(r => r.json()).then(d => {
      if (d.success) {
        setUsers((d.data || []).filter(u => u.role?.nama === "Sales" && (!isBranchManager || String(u.cabang_id) === String(user?.cabang_id))));
      }
    });
  }, [isBranchManager, user]);

  const fetchStats = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({ startDate, endDate, cabang_id: cabangId, sales_id: salesId, tipe_customer: tipeCustomer, tahap_lost: tahapLost, alasan_lost_id: alasanLostId });
      const res = await fetch(`/api/lead/lost-stats?${params}`);
      const json = await res.json();
      if (json.success && json.data) {
        setSummary(json.data.summary);
        setCharts(json.data.charts);
      } else {
        showToast(json.message || "Gagal memuat statistik.", "error");
      }
    } catch (e) {
      showToast("Terjadi kesalahan koneksi.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchStats(); }, [cabangId, salesId, tipeCustomer, tahapLost, alasanLostId]);

  const handleApply = (e) => { e.preventDefault(); fetchStats(); };

  const handleReset = () => {
    setStartDate("2026-07-01"); setEndDate("2026-07-31");
    setCabangId(""); setSalesId(""); setTipeCustomer("");
    setTahapLost(""); setAlasanLostId(""); setSumberLead("");
    setTimeout(fetchStats, 50);
  };

  // Mock sumber data (not in schema)
  const mockSumberData = [
    { name: "Referensi", count: Math.round(summary.totalLost * 0.286), pct: 28.57, color: "#6366f1" },
    { name: "Website", count: Math.round(summary.totalLost * 0.214), pct: 21.43, color: "#3b82f6" },
    { name: "Pameran", count: Math.round(summary.totalLost * 0.170), pct: 17.14, color: "#ec4899" },
    { name: "Telemarketing", count: Math.round(summary.totalLost * 0.143), pct: 14.29, color: "#f59e0b" },
    { name: "Media Sosial", count: Math.round(summary.totalLost * 0.115), pct: 11.43, color: "#8b5cf6" },
    { name: "Lainnya", count: Math.round(summary.totalLost * 0.072), pct: 7.14, color: "#64748b" },
  ];

  // Build donut segments from data
  const buildDonutSegments = (items, total, colorMap) => {
    let offset = 25;
    return items.map((item, idx) => {
      const pct = total > 0 ? (item.count / total) * 100 : 0;
      const seg = { pct, offset, color: colorMap[idx % colorMap.length] };
      offset -= pct;
      return seg;
    });
  };

  const donutColors = ["#ef4444", "#f59e0b", "#3b82f6", "#10b981", "#8b5cf6", "#64748b"];

  return (
    <div className="space-y-6 max-w-6xl mx-auto">


      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {/* Total Lost */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200/50 dark:border-neutral-800 rounded-2xl p-4 shadow-sm flex items-center gap-3">
          <div className="p-2.5 bg-red-100 dark:bg-red-950/40 rounded-xl">
            <FiAlertCircle className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <span className="text-[9px] font-bold uppercase tracking-wider text-neutral-400">Total Lost</span>
            <h2 className="text-xl font-black text-neutral-900 dark:text-white mt-0.5">{summary.totalLost}</h2>
            <p className="text-[9px] text-red-600 font-semibold mt-0.5">{summary.pctOfTotal}% dari Total Lead</p>
          </div>
        </div>

        {/* Lost dari Awal */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200/50 dark:border-neutral-800 rounded-2xl p-4 shadow-sm flex items-center gap-3">
          <div className="p-2.5 bg-orange-100 dark:bg-orange-950/40 rounded-xl">
            <FiTrendingDown className="w-5 h-5 text-orange-600" />
          </div>
          <div>
            <span className="text-[9px] font-bold uppercase tracking-wider text-neutral-400">Lost dari Awal</span>
            <h2 className="text-xl font-black text-neutral-900 dark:text-white mt-0.5">{summary.lostDariAwal}</h2>
            <p className="text-[9px] text-neutral-400 font-medium mt-0.5">{summary.pctDariAwal}%</p>
          </div>
        </div>

        {/* Lost setelah Follow Up */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200/50 dark:border-neutral-800 rounded-2xl p-4 shadow-sm flex items-center gap-3">
          <div className="p-2.5 bg-amber-100 dark:bg-amber-950/40 rounded-xl">
            <FiCalendar className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <span className="text-[9px] font-bold uppercase tracking-wider text-neutral-400">Lost setelah FU</span>
            <h2 className="text-xl font-black text-neutral-900 dark:text-white mt-0.5">{summary.lostSetelahFollowUp}</h2>
            <p className="text-[9px] text-neutral-400 font-medium mt-0.5">{summary.pctSetelahFollowUp}%</p>
          </div>
        </div>

        {/* Estimasi Nilai Potensi Lost */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200/50 dark:border-neutral-800 rounded-2xl p-4 shadow-sm flex items-center gap-3 col-span-1">
          <div className="p-2.5 bg-purple-100 dark:bg-purple-950/40 rounded-xl">
            <FiDollarSign className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <span className="text-[9px] font-bold uppercase tracking-wider text-neutral-400">Estimasi Nilai Potensi</span>
            <h2 className="text-sm font-black text-neutral-900 dark:text-white mt-0.5 truncate max-w-[130px]">
              Rp {summary.totalNilaiPotensi.toLocaleString("id-ID")}
            </h2>
            <p className="text-[8px] text-neutral-400 font-medium mt-0.5 truncate">
              Rata: Rp {summary.rataRataNilaiLost.toLocaleString("id-ID")}
            </p>
          </div>
        </div>

        {/* Lost Rate */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200/50 dark:border-neutral-800 rounded-2xl p-4 shadow-sm flex items-center gap-3">
          <div className="p-2.5 bg-rose-100 dark:bg-rose-950/40 rounded-xl">
            <FiTrendingDown className="w-5 h-5 text-rose-600" />
          </div>
          <div>
            <span className="text-[9px] font-bold uppercase tracking-wider text-neutral-400">Lost Rate</span>
            <h2 className="text-xl font-black text-neutral-900 dark:text-white mt-0.5">{summary.lostRate}%</h2>
            <p className="text-[9px] text-neutral-400 font-medium mt-0.5">dari Total Lead</p>
          </div>
        </div>
      </div>

      {/* Filter Panel */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200/50 dark:border-neutral-800 rounded-2xl p-5 shadow-sm space-y-4">
        <h2 className="text-xs font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5 uppercase tracking-wider">
          <FiFilter className="w-4 h-4 text-orange-500" />
          Filter Laporan
        </h2>
        <form onSubmit={handleApply} className="space-y-3.5">
          {/* Row 1 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            {/* Periode */}
            <div>
              <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-1.5">Periode Lead Lost</label>
              <div className="flex items-center gap-2">
                <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 dark:text-white text-xs font-semibold" />
                <span className="text-xs text-neutral-400">-</span>
                <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 dark:text-white text-xs font-semibold" />
              </div>
            </div>
            {/* Cabang */}
            <div>
              <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-1.5">Cabang</label>
              <select value={cabangId} disabled={!isAdminOrTop} onChange={e => setCabangId(e.target.value)}
                className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 dark:text-white text-xs font-semibold disabled:opacity-65">
                <option value="">Semua Cabang</option>
                {cabangs.map(c => <option key={c.id} value={c.id}>{c.nama}</option>)}
              </select>
            </div>
            {/* Sales */}
            <div>
              <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-1.5">Sales</label>
              <select value={salesId} onChange={e => setSalesId(e.target.value)}
                className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 dark:text-white text-xs font-semibold">
                <option value="">Semua Sales</option>
                {users.map(u => <option key={u.id} value={u.id}>{u.nama}</option>)}
              </select>
            </div>
            {/* Tahap Lost */}
            <div>
              <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-1.5">Tahap Lost</label>
              <select value={tahapLost} onChange={e => setTahapLost(e.target.value)}
                className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 dark:text-white text-xs font-semibold">
                <option value="">Semua Tahap</option>
                <option value="awal">Lost dari Awal</option>
                <option value="followup">Lost setelah Follow Up</option>
              </select>
            </div>
          </div>
          {/* Row 2 */}
          <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-5 gap-3 items-end">
            <div>
              <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-1.5">Alasan Lost</label>
              <select value={alasanLostId} onChange={e => setAlasanLostId(e.target.value)}
                className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 dark:text-white text-xs font-semibold">
                <option value="">Semua Alasan</option>
                {alasanLosts.map(a => <option key={a.id} value={a.id}>{a.nama}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-1.5">Sumber Lead</label>
              <select value={sumberLead} onChange={e => setSumberLead(e.target.value)}
                className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 dark:text-white text-xs font-semibold">
                <option value="">Semua Sumber</option>
                {["Referensi","Website","Pameran","Telemarketing","Media Sosial","Lainnya"].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-1.5">Tipe Customer</label>
              <select value={tipeCustomer} onChange={e => setTipeCustomer(e.target.value)}
                className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 dark:text-white text-xs font-semibold">
                <option value="">Semua (Baru & Existing)</option>
                <option value="BARU">Customer Baru</option>
                <option value="EXISTING">Customer Existing</option>
              </select>
            </div>
            <div className="flex gap-2 sm:col-span-3 md:col-span-2 justify-end w-full">
              <button type="button" onClick={handleReset}
                className="bg-white hover:bg-neutral-50 dark:bg-neutral-900 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 px-5 py-2.5 border border-neutral-200 dark:border-neutral-800 rounded-xl text-xs font-bold transition-all w-1/2 sm:w-auto">
                Reset Filter
              </button>
              <button type="submit"
                className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm w-1/2 sm:w-auto">
                Terapkan Filter
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Row 1: Donut Charts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Lost berdasarkan Tipe Customer */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200/50 dark:border-neutral-800 rounded-2xl p-5 shadow-sm flex flex-col justify-between min-h-[280px]">
          <h3 className="text-xs font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5 uppercase tracking-wider border-b border-neutral-100 dark:border-neutral-800 pb-3">
            <FiPieChart className="text-red-500" />Lost berdasarkan Tipe Customer
          </h3>
          <div className="flex items-center justify-center py-4 relative">
            <svg className="w-36 h-36" viewBox="0 0 36 36">
              <circle cx="18" cy="18" r="15.915" fill="none" stroke="#f3f4f6" strokeWidth="4" />
              {summary.totalLost > 0 && (<>
                <circle cx="18" cy="18" r="15.915" fill="none" stroke="#f97316"
                  strokeDasharray={`${charts.customerType[0]?.pct || 0} ${100 - (charts.customerType[0]?.pct || 0)}`}
                  strokeDashoffset="25" strokeWidth="4" />
                <circle cx="18" cy="18" r="15.915" fill="none" stroke="#22c55e"
                  strokeDasharray={`${charts.customerType[1]?.pct || 0} ${100 - (charts.customerType[1]?.pct || 0)}`}
                  strokeDashoffset={100 - (charts.customerType[0]?.pct || 0) + 25} strokeWidth="4" />
              </>)}
            </svg>
            <div className="absolute text-center">
              <h4 className="text-xl font-black text-neutral-900 dark:text-white">{summary.totalLost}</h4>
              <p className="text-[9px] text-neutral-400 font-bold uppercase">Total Lost</p>
            </div>
          </div>
          <div className="space-y-2 text-xs font-semibold">
            {charts.customerType.map((item, idx) => (
              <div key={idx} className="flex justify-between">
                <div className="flex items-center gap-2">
                  <span className={`w-3 h-3 rounded-full ${idx === 0 ? "bg-orange-500" : "bg-green-500"}`}></span>
                  <span className="text-neutral-600 dark:text-neutral-400">{item.name}</span>
                </div>
                <span>{item.count} ({item.pct}%)</span>
              </div>
            ))}
          </div>
        </div>

        {/* Lost Rate Customer Baru vs Existing */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200/50 dark:border-neutral-800 rounded-2xl p-5 shadow-sm min-h-[280px]">
          <h3 className="text-xs font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5 uppercase tracking-wider border-b border-neutral-100 dark:border-neutral-800 pb-3 mb-4">
            <FiBarChart2 className="text-red-500" />Lost Rate Customer Baru vs Existing
          </h3>
          <div className="grid grid-cols-2 gap-4 text-center">
            <div className="bg-orange-50 dark:bg-orange-950/20 rounded-2xl p-4 border border-orange-200/40 dark:border-orange-800/40">
              <span className="text-[10px] font-bold text-orange-600 uppercase tracking-wider">Customer Baru</span>
              <div className="mt-3 space-y-2 text-left text-xs">
                <div className="flex justify-between"><span className="text-neutral-500">Lead</span><span className="font-black text-neutral-900 dark:text-white">{summary.totalLeadBaru}</span></div>
                <div className="flex justify-between"><span className="text-neutral-500">Lost</span><span className="font-black text-red-600">{summary.lostBaruCount}</span></div>
                <div className="mt-2 pt-2 border-t border-orange-200/50 flex justify-between">
                  <span className="text-neutral-500 font-bold">Lost Rate</span>
                  <span className="font-black text-orange-600">{summary.lostRateBaru}%</span>
                </div>
              </div>
            </div>
            <div className="bg-green-50 dark:bg-green-950/20 rounded-2xl p-4 border border-green-200/40 dark:border-green-800/40">
              <span className="text-[10px] font-bold text-green-600 uppercase tracking-wider">Customer Existing</span>
              <div className="mt-3 space-y-2 text-left text-xs">
                <div className="flex justify-between"><span className="text-neutral-500">Lead</span><span className="font-black text-neutral-900 dark:text-white">{summary.totalLeadExisting}</span></div>
                <div className="flex justify-between"><span className="text-neutral-500">Lost</span><span className="font-black text-red-600">{summary.lostExistingCount}</span></div>
                <div className="mt-2 pt-2 border-t border-green-200/50 flex justify-between">
                  <span className="text-neutral-500 font-bold">Lost Rate</span>
                  <span className="font-black text-green-600">{summary.lostRateExisting}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Lost per Sales */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200/50 dark:border-neutral-800 rounded-2xl p-5 shadow-sm min-h-[280px]">
          <h3 className="text-xs font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5 uppercase tracking-wider border-b border-neutral-100 dark:border-neutral-800 pb-3 mb-4">
            <FiBarChart2 className="text-red-500" />Lost per Sales
          </h3>
          <div className="space-y-3.5">
            {charts.salesList.slice(0, 5).map((s, idx) => {
              const max = charts.salesList[0]?.count || 1;
              const barPct = (s.count / max) * 100;
              const colors = ["bg-red-500", "bg-orange-500", "bg-amber-500", "bg-rose-500", "bg-pink-500"];
              return (
                <div key={idx} className="space-y-1.5 text-xs font-semibold">
                  <div className="flex justify-between text-neutral-700 dark:text-neutral-300">
                    <span>{s.name}</span>
                    <span>{s.count} ({s.pct}%)</span>
                  </div>
                  <div className="w-full bg-neutral-100 dark:bg-neutral-800 h-2.5 rounded-full overflow-hidden">
                    <div className={`${colors[idx % colors.length]} h-full rounded-full transition-all duration-500`} style={{ width: `${barPct}%` }}></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Row 2: Alasan Lost & Tren */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Alasan Lost - Customer Baru */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200/50 dark:border-neutral-800 rounded-2xl p-5 shadow-sm flex flex-col min-h-[280px]">
          <h3 className="text-xs font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5 uppercase tracking-wider border-b border-neutral-100 dark:border-neutral-800 pb-3">
            <FiPieChart className="text-red-500" />Alasan Lost - Customer Baru ({summary.lostBaruCount})
          </h3>
          <div className="flex items-center justify-center py-3 relative">
            <svg className="w-28 h-28" viewBox="0 0 36 36">
              <circle cx="18" cy="18" r="15.915" fill="none" stroke="#f3f4f6" strokeWidth="4" />
              {buildDonutSegments(charts.alasanListBaru.slice(0, 6), summary.lostBaruCount, donutColors).map((seg, idx) => (
                <circle key={idx} cx="18" cy="18" r="15.915" fill="none" stroke={seg.color}
                  strokeDasharray={`${seg.pct} ${100 - seg.pct}`} strokeDashoffset={seg.offset} strokeWidth="4" />
              ))}
            </svg>
            <div className="absolute text-center">
              <h4 className="text-base font-black text-neutral-900 dark:text-white">{summary.lostBaruCount}</h4>
            </div>
          </div>
          <div className="space-y-1.5 text-[11px] font-semibold flex-1">
            {charts.alasanListBaru.slice(0, 5).map((a, idx) => (
              <div key={idx} className="flex justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: donutColors[idx % donutColors.length] }}></span>
                  <span className="text-neutral-600 dark:text-neutral-400 truncate max-w-[110px]">{a.nama}</span>
                </div>
                <span className="text-neutral-800 dark:text-neutral-200">{a.count} ({a.pct}%)</span>
              </div>
            ))}
          </div>
          <button className="mt-3 text-xs text-orange-500 font-bold text-center hover:text-orange-600 transition-colors">Lihat Detail</button>
        </div>

        {/* Alasan Lost - Customer Existing */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200/50 dark:border-neutral-800 rounded-2xl p-5 shadow-sm flex flex-col min-h-[280px]">
          <h3 className="text-xs font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5 uppercase tracking-wider border-b border-neutral-100 dark:border-neutral-800 pb-3">
            <FiPieChart className="text-red-500" />Alasan Lost - Customer Existing ({summary.lostExistingCount})
          </h3>
          <div className="flex items-center justify-center py-3 relative">
            <svg className="w-28 h-28" viewBox="0 0 36 36">
              <circle cx="18" cy="18" r="15.915" fill="none" stroke="#f3f4f6" strokeWidth="4" />
              {buildDonutSegments(charts.alasanListExisting.slice(0, 6), summary.lostExistingCount, donutColors).map((seg, idx) => (
                <circle key={idx} cx="18" cy="18" r="15.915" fill="none" stroke={seg.color}
                  strokeDasharray={`${seg.pct} ${100 - seg.pct}`} strokeDashoffset={seg.offset} strokeWidth="4" />
              ))}
            </svg>
            <div className="absolute text-center">
              <h4 className="text-base font-black text-neutral-900 dark:text-white">{summary.lostExistingCount}</h4>
            </div>
          </div>
          <div className="space-y-1.5 text-[11px] font-semibold flex-1">
            {charts.alasanListExisting.slice(0, 5).map((a, idx) => (
              <div key={idx} className="flex justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: donutColors[idx % donutColors.length] }}></span>
                  <span className="text-neutral-600 dark:text-neutral-400 truncate max-w-[110px]">{a.nama}</span>
                </div>
                <span className="text-neutral-800 dark:text-neutral-200">{a.count} ({a.pct}%)</span>
              </div>
            ))}
          </div>
          <button className="mt-3 text-xs text-orange-500 font-bold text-center hover:text-orange-600 transition-colors">Lihat Detail</button>
        </div>

        {/* Tren Lost per Bulan */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200/50 dark:border-neutral-800 rounded-2xl p-5 shadow-sm min-h-[280px]">
          <h3 className="text-xs font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5 uppercase tracking-wider border-b border-neutral-100 dark:border-neutral-800 pb-3 mb-4">
            <FiActivity className="text-red-500" />Tren Lost per Bulan (Semua Tipe Customer)
          </h3>
          <div className="h-44 relative pt-2">
            <div className="absolute inset-0 flex items-end justify-between px-1 pb-6">
              {charts.monthlyTrend.map((m, idx) => {
                const maxVal = Math.max(...charts.monthlyTrend.map(d => d.count), 1);
                const h = (m.count / maxVal) * 75;
                return (
                  <div key={idx} className="flex flex-col items-center gap-1 w-1/12 group cursor-pointer">
                    <span className="text-[8px] font-black text-neutral-800 dark:text-white opacity-0 group-hover:opacity-100 transition-opacity">{m.count}</span>
                    <div className="bg-red-500 group-hover:bg-red-600 w-full rounded-t-sm transition-all duration-500" style={{ height: `${h || 3}px` }}></div>
                    <span className="text-[9px] font-bold text-neutral-400 uppercase">{m.name}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Row 3: Lost per Cabang & Sumber Lead & Ringkasan Nilai */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Lost per Cabang */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200/50 dark:border-neutral-800 rounded-2xl p-5 shadow-sm min-h-[280px]">
          <h3 className="text-xs font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5 uppercase tracking-wider border-b border-neutral-100 dark:border-neutral-800 pb-3 mb-4">
            <FiBarChart2 className="text-red-500" />Lost per Cabang
          </h3>
          <div className="space-y-3">
            {charts.cabangList.map((c, idx) => {
              const max = charts.cabangList[0]?.count || 1;
              const pct = (c.count / max) * 100;
              const colors = ["bg-red-500", "bg-orange-500", "bg-amber-500", "bg-rose-400", "bg-pink-500"];
              return (
                <div key={idx} className="space-y-1 text-xs">
                  <div className="flex justify-between text-neutral-700 dark:text-neutral-300 font-semibold">
                    <span>{c.name}</span>
                    <span>{c.count} ({c.pct}%)</span>
                  </div>
                  <div className="w-full bg-neutral-100 dark:bg-neutral-800 h-2.5 rounded-full overflow-hidden">
                    <div className={`${colors[idx % colors.length]} h-full rounded-full transition-all duration-500`} style={{ width: `${pct}%` }}></div>
                  </div>
                </div>
              );
            })}
          </div>
          <button className="mt-4 text-xs text-orange-500 font-bold hover:text-orange-600 transition-colors">Lihat Detail</button>
        </div>

        {/* Lost per Sumber Lead */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200/50 dark:border-neutral-800 rounded-2xl p-5 shadow-sm flex flex-col justify-between min-h-[280px]">
          <h3 className="text-xs font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5 uppercase tracking-wider border-b border-neutral-100 dark:border-neutral-800 pb-3">
            <FiPieChart className="text-red-500" />Lost per Sumber Lead
          </h3>
          <div className="flex items-center justify-center py-3 relative">
            <svg className="w-28 h-28" viewBox="0 0 36 36">
              <circle cx="18" cy="18" r="15.915" fill="none" stroke="#f3f4f6" strokeWidth="4" />
              {buildDonutSegments(mockSumberData, summary.totalLost, mockSumberData.map(s => s.color)).map((seg, idx) => (
                <circle key={idx} cx="18" cy="18" r="15.915" fill="none" stroke={mockSumberData[idx]?.color || "#888"}
                  strokeDasharray={`${seg.pct} ${100 - seg.pct}`} strokeDashoffset={seg.offset} strokeWidth="4" />
              ))}
            </svg>
            <div className="absolute text-center">
              <h4 className="text-base font-black text-neutral-900 dark:text-white">{summary.totalLost}</h4>
              <p className="text-[8px] text-neutral-400 font-bold uppercase">Total</p>
            </div>
          </div>
          <div className="space-y-1.5 text-[11px] font-semibold">
            {mockSumberData.map((s, idx) => (
              <div key={idx} className="flex justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }}></span>
                  <span className="text-neutral-600 dark:text-neutral-400">{s.name}</span>
                </div>
                <span>{s.count} ({s.pct}%)</span>
              </div>
            ))}
          </div>
        </div>

        {/* Ringkasan Nilai Potensi Lost */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200/50 dark:border-neutral-800 rounded-2xl p-5 shadow-sm flex flex-col min-h-[280px]">
          <h3 className="text-xs font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5 uppercase tracking-wider border-b border-neutral-100 dark:border-neutral-800 pb-3 mb-4">
            <FiDollarSign className="text-red-500" />Ringkasan Nilai Potensi Lost
          </h3>
          <div className="space-y-4 flex-1 flex flex-col justify-center">
            <div className="flex items-center gap-3 bg-red-50 dark:bg-red-950/20 rounded-xl p-3 border border-red-100 dark:border-red-900/30">
              <FiTrendingDown className="w-5 h-5 text-red-500 flex-shrink-0" />
              <div>
                <span className="text-[9px] font-bold text-red-500 uppercase tracking-wider">Total Nilai Potensi Lost</span>
                <p className="font-black text-neutral-900 dark:text-white text-sm mt-0.5">Rp {summary.totalNilaiPotensi.toLocaleString("id-ID")}</p>
              </div>
            </div>
            {[
              { label: "Rata-rata Nilai per Lost", val: summary.rataRataNilaiLost },
              { label: "Nilai Tertinggi (1 Lead)", val: summary.maxNilai },
              { label: "Nilai Terendah (1 Lead)", val: summary.minNilai },
            ].map((item, idx) => (
              <div key={idx} className="flex justify-between text-xs border-b border-neutral-100 dark:border-neutral-800 pb-2">
                <span className="text-neutral-500 font-semibold">{item.label}</span>
                <span className="font-black text-neutral-900 dark:text-white">Rp {item.val.toLocaleString("id-ID")}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Ringkasan Alasan Lost Table */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200/50 dark:border-neutral-800 rounded-2xl p-5 shadow-sm">
        <h3 className="text-xs font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5 uppercase tracking-wider border-b border-neutral-100 dark:border-neutral-800 pb-3 mb-4">
          <FiActivity className="text-red-500" />Ringkasan Alasan Lost (Gabungan Baru &amp; Existing)
        </h3>
        <div className="overflow-x-auto">
          <table className="min-w-full text-xs">
            <thead>
              <tr className="text-neutral-400 font-bold border-b border-neutral-100 dark:border-neutral-800 text-[10px] uppercase tracking-wider">
                <th className="text-left py-2.5 pr-4">Alasan Lost</th>
                <th className="text-center py-2.5 px-3">Customer Baru</th>
                <th className="text-center py-2.5 px-3">%</th>
                <th className="text-center py-2.5 px-3">Customer Existing</th>
                <th className="text-center py-2.5 px-3">%</th>
                <th className="text-center py-2.5 px-3">Total Lost</th>
                <th className="text-center py-2.5 px-3">%</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800 font-semibold text-neutral-600 dark:text-neutral-300">
              {charts.combinedAlasanTable.map((row, idx) => (
                <tr key={idx} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/20">
                  <td className="py-2.5 pr-4 font-bold text-neutral-800 dark:text-neutral-100">{row.nama}</td>
                  <td className="py-2.5 px-3 text-center">{row.baru}</td>
                  <td className="py-2.5 px-3 text-center text-neutral-400">{row.pctBaru}%</td>
                  <td className="py-2.5 px-3 text-center">{row.existing}</td>
                  <td className="py-2.5 px-3 text-center text-neutral-400">{row.pctExisting}%</td>
                  <td className="py-2.5 px-3 text-center font-black text-red-600">{row.total}</td>
                  <td className="py-2.5 px-3 text-center text-neutral-400">{row.pctTotal}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Info Notice */}
      <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/50 rounded-2xl p-4 flex items-start gap-3 text-xs text-blue-700 dark:text-blue-400">
        <FiActivity className="w-5 h-5 flex-shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold">Informasi:</p>
          <p className="font-medium">Data pada laporan ini berdasarkan lead dengan status LOST pada periode dan filter yang dipilih.</p>
        </div>
      </div>
    </div>
  );
}
