"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  FiSearch, FiCalendar, FiUser, FiMapPin, FiChevronDown, FiChevronRight,
  FiBell, FiDownload, FiRefreshCw, FiEye, FiGrid, FiCheckCircle, 
  FiAlertCircle, FiInbox, FiTrendingUp, FiFolderMinus, FiFolderPlus, FiLayers
} from "react-icons/fi";
import { useAuthStore } from "@/store/auth.store";
import { useUIStore } from "@/store/ui.store";
import { exportToExcel } from "@/lib/excel";
import dayjs from "dayjs";

export default function LaporanSemuaLeadPage() {
  const user = useAuthStore((state) => state.user);
  const { showToast } = useUIStore();

  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  // Filters State
  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState("2026-07-01");
  const [endDate, setEndDate] = useState("2026-07-31");
  const [cabangId, setCabangId] = useState("");
  const [salesId, setSalesId] = useState("");
  const [fase, setFase] = useState("");
  const [status, setStatus] = useState("");

  // Search/Filters to be applied on submit
  const [appliedFilters, setAppliedFilters] = useState({
    search: "",
    startDate: "2026-07-01",
    endDate: "2026-07-31",
    cabangId: "",
    salesId: "",
    fase: "",
    status: "",
  });

  // Data State
  const [summary, setSummary] = useState({
    totalLeads: 0,
    totalBaru: 0,
    totalFollowUp: 0,
    totalPenawaran: 0,
    totalDeal: 0,
    totalLost: 0
  });
  const [leads, setLeads] = useState([]);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
  });

  // Masters
  const [cabangs, setCabangs] = useState([]);
  const [salesUsers, setSalesUsers] = useState([]);

  const isAdminOrTop = user?.role?.nama === "Administrator" || user?.role?.nama === "Top Management";
  const isBranchManager = user?.role?.nama === "Branch Manager";

  // Initial load of master options
  useEffect(() => {
    // Fetch Cabang Options
    fetch("/api/master/cabang")
      .then(r => r.json())
      .then(d => { if (d.success) setCabangs(d.data || []); });

    // Fetch Sales Users
    fetch("/api/master/user")
      .then(r => r.json())
      .then(d => {
        if (d.success) {
          // Filter sales users:
          // Admin/Top Management sees all sales
          // Branch manager only sees sales of their branch
          const list = (d.data || []).filter(u => 
            u.role?.nama === "Sales" && 
            (!isBranchManager || String(u.cabang_id) === String(user?.cabang_id))
          );
          setSalesUsers(list);
        }
      });
  }, [isBranchManager, user]);

  // Fetch Report Data
  const fetchReportData = async (page = 1, limit = 10, filters = appliedFilters) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        search: filters.search,
        startDate: filters.startDate,
        endDate: filters.endDate,
        cabang_id: filters.cabangId,
        sales_id: filters.salesId,
        fase: filters.fase,
        status: filters.status,
        page: String(page),
        limit: String(limit),
      });

      const res = await fetch(`/api/lead/report?${params}`);
      const json = await res.json();

      if (json.success && json.data) {
        setSummary(json.data.summary);
        setLeads(json.data.leads || []);
        setPagination(json.data.pagination || { total: 0, page: 1, limit: 10, totalPages: 1 });
      } else {
        showToast(json.message || "Gagal memuat laporan lead.", "error");
      }
    } catch (error) {
      console.error(error);
      showToast("Terjadi kesalahan koneksi database.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch whenever pagination or applied filters change
  useEffect(() => {
    fetchReportData(pagination.page, pagination.limit, appliedFilters);
  }, [pagination.page, pagination.limit, appliedFilters]);

  // Handle filter submit
  const handleApplyFilter = (e) => {
    if (e) e.preventDefault();
    setPagination(prev => ({ ...prev, page: 1 }));
    setAppliedFilters({
      search,
      startDate,
      endDate,
      cabangId,
      salesId,
      fase,
      status
    });
  };

  // Reset Filters
  const handleResetFilter = () => {
    setSearch("");
    setStartDate("2026-07-01");
    setEndDate("2026-07-31");
    setCabangId("");
    setSalesId("");
    setFase("");
    setStatus("");
    
    const cleared = {
      search: "",
      startDate: "2026-07-01",
      endDate: "2026-07-31",
      cabangId: "",
      salesId: "",
      fase: "",
      status: "",
    };
    setAppliedFilters(cleared);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  // Export to Excel handler
  const handleExportExcel = async () => {
    setIsExporting(true);
    try {
      const params = new URLSearchParams({
        search: appliedFilters.search,
        startDate: appliedFilters.startDate,
        endDate: appliedFilters.endDate,
        cabang_id: appliedFilters.cabangId,
        sales_id: appliedFilters.salesId,
        fase: appliedFilters.fase,
        status: appliedFilters.status,
        page: "1",
        limit: "100000", // retrieve all without paging
      });

      const res = await fetch(`/api/lead/report?${params}`);
      const json = await res.json();

      if (json.success && json.data?.leads) {
        const rawData = json.data.leads;
        const formattedExport = rawData.map((l, idx) => ({
          "No": idx + 1,
          "Kode Lead": l.nomor,
          "Nama Customer/Perusahaan": l.customer_nama,
          "Telepon Customer": l.customer_telepon,
          "Sales PIC": l.sales_nama,
          "Cabang": l.cabang_nama,
          "Fase": l.fase === 1 ? "Lead Baru" : l.fase === 2 ? "Follow Up" : "Penawaran",
          "Status": l.status === 1 ? "Open" : l.status === 2 ? "Deal" : "Lost",
          "Tanggal Lead Dibuat": l.dibuat_tanggal ? dayjs(l.dibuat_tanggal).format("DD/MM/YYYY") : "-",
          "Terakhir Follow Up": l.terakhir_follow_up ? dayjs(l.terakhir_follow_up).format("DD/MM/YYYY HH:mm") : "-",
          "Nilai Potensi (Rp)": l.nilai_potensi ? l.nilai_potensi : "-"
        }));

        await exportToExcel(formattedExport, "Laporan_Semua_Lead");
        showToast("Laporan berhasil diexport ke Excel.", "success");
      } else {
        showToast("Gagal mengunduh data laporan untuk diexport.", "error");
      }
    } catch (error) {
      console.error(error);
      showToast("Terjadi kesalahan saat mengeksport data.", "error");
    } finally {
      setIsExporting(false);
    }
  };

  const getFaseBadgeClass = (faseVal) => {
    switch (faseVal) {
      case 1:
        return "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/30 dark:text-purple-400 dark:border-purple-900/50";
      case 2:
        return "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900/50";
      case 3:
        return "bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/30 dark:text-teal-400 dark:border-teal-900/50";
      default:
        return "bg-neutral-50 text-neutral-600 border-neutral-200";
    }
  };

  const getFaseLabel = (faseVal) => {
    switch (faseVal) {
      case 1: return "Lead Baru";
      case 2: return "Follow Up";
      case 3: return "Penawaran";
      default: return "Unknown";
    }
  };

  const getStatusBadgeClass = (statusVal) => {
    switch (statusVal) {
      case 1:
        return "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900/50";
      case 2:
        return "bg-green-50 text-green-700 border-green-200 dark:bg-green-950/30 dark:text-green-400 dark:border-green-900/50";
      case 3:
        return "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-900/50";
      default:
        return "bg-neutral-50 text-neutral-600 border-neutral-200";
    }
  };

  const getStatusLabel = (statusVal) => {
    switch (statusVal) {
      case 1: return "Open";
      case 2: return "Deal";
      case 3: return "Lost";
      default: return "Unknown";
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header breadcrumb & actions */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
            <span>Laporan</span><FiChevronRight className="w-3 h-3" />
            <span className="font-semibold text-neutral-800 dark:text-neutral-200">Semua Lead</span>
          </div>
          <h1 className="text-xl font-bold text-neutral-900 dark:text-white mt-1.5">Laporan Semua Lead</h1>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            Menampilkan semua lead dari seluruh status (Lead Baru, Follow Up, Penawaran, Deal, Lost).
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-neutral-700 dark:text-neutral-300 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-sm hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">
            <FiMapPin className="text-orange-500 w-4 h-4" />
            <span>{user?.cabang?.nama || "Semua Cabang"}</span>
            <FiChevronDown className="text-neutral-400 w-3 h-3" />
          </button>
          
          <button className="p-2.5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors relative shadow-sm">
            <FiBell className="w-4 h-4 text-neutral-600 dark:text-neutral-400" />
            {summary.totalLeads > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[9px] font-black h-4 w-4 rounded-full flex items-center justify-center border border-white dark:border-neutral-900">
                {Math.min(summary.totalLeads, 9)}
              </span>
            )}
          </button>

          <button 
            onClick={handleExportExcel}
            disabled={isExporting || leads.length === 0}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-neutral-700 dark:text-neutral-300 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-sm hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-all active:scale-95 disabled:opacity-50"
          >
            <FiDownload className="w-3.5 h-3.5 text-neutral-500" />
            <span>{isExporting ? "Exporting..." : "Export"}</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3.5">
        {/* Semua Lead */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200/50 dark:border-neutral-800 rounded-2xl p-4 shadow-sm flex items-center gap-3">
          <div className="p-2.5 bg-blue-50 dark:bg-blue-950/40 rounded-xl">
            <FiLayers className="w-5 h-5 text-blue-600 dark:text-blue-500" />
          </div>
          <div>
            <span className="text-[9px] font-bold uppercase tracking-wider text-neutral-400">Semua Lead</span>
            <h2 className="text-lg font-black text-neutral-900 dark:text-white mt-0.5">{summary.totalLeads}</h2>
          </div>
        </div>

        {/* Lead Baru */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200/50 dark:border-neutral-800 rounded-2xl p-4 shadow-sm flex items-center gap-3">
          <div className="p-2.5 bg-purple-50 dark:bg-purple-950/40 rounded-xl">
            <FiInbox className="w-5 h-5 text-purple-600 dark:text-purple-500" />
          </div>
          <div>
            <span className="text-[9px] font-bold uppercase tracking-wider text-neutral-400">Lead Baru</span>
            <h2 className="text-lg font-black text-neutral-900 dark:text-white mt-0.5">{summary.totalBaru}</h2>
          </div>
        </div>

        {/* Follow Up */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200/50 dark:border-neutral-800 rounded-2xl p-4 shadow-sm flex items-center gap-3">
          <div className="p-2.5 bg-blue-50 dark:bg-blue-950/40 rounded-xl">
            <FiRefreshCw className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <span className="text-[9px] font-bold uppercase tracking-wider text-neutral-400">Follow Up</span>
            <h2 className="text-lg font-black text-neutral-900 dark:text-white mt-0.5">{summary.totalFollowUp}</h2>
          </div>
        </div>

        {/* Penawaran */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200/50 dark:border-neutral-800 rounded-2xl p-4 shadow-sm flex items-center gap-3">
          <div className="p-2.5 bg-teal-50 dark:bg-teal-950/40 rounded-xl">
            <FiTrendingUp className="w-5 h-5 text-teal-600 dark:text-teal-400" />
          </div>
          <div>
            <span className="text-[9px] font-bold uppercase tracking-wider text-neutral-400">Penawaran</span>
            <h2 className="text-lg font-black text-neutral-900 dark:text-white mt-0.5">{summary.totalPenawaran}</h2>
          </div>
        </div>

        {/* Deal */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200/50 dark:border-neutral-800 rounded-2xl p-4 shadow-sm flex items-center gap-3">
          <div className="p-2.5 bg-green-50 dark:bg-green-950/40 rounded-xl">
            <FiCheckCircle className="w-5 h-5 text-green-600 dark:text-green-500" />
          </div>
          <div>
            <span className="text-[9px] font-bold uppercase tracking-wider text-neutral-400">Deal</span>
            <h2 className="text-lg font-black text-neutral-900 dark:text-white mt-0.5">{summary.totalDeal}</h2>
          </div>
        </div>

        {/* Lost */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200/50 dark:border-neutral-800 rounded-2xl p-4 shadow-sm flex items-center gap-3">
          <div className="p-2.5 bg-red-50 dark:bg-red-950/40 rounded-xl">
            <FiAlertCircle className="w-5 h-5 text-red-600 dark:text-red-500" />
          </div>
          <div>
            <span className="text-[9px] font-bold uppercase tracking-wider text-neutral-400">Lost</span>
            <h2 className="text-lg font-black text-neutral-900 dark:text-white mt-0.5">{summary.totalLost}</h2>
          </div>
        </div>
      </div>

      {/* Filter Panel */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200/50 dark:border-neutral-800 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5 uppercase tracking-wider">
            <FiGrid className="w-4 h-4 text-orange-500" />
            Filter Laporan
          </h2>
        </div>

        <form onSubmit={handleApplyFilter} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Pencarian */}
            <div>
              <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-1.5">Pencarian</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiSearch className="text-neutral-400 w-4 h-4" />
                </span>
                <input 
                  type="text" 
                  value={search} 
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Nama customer, perusahaan, no. HP, atau kode lead..."
                  className="w-full pl-9 pr-3 py-2 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 dark:text-white text-xs font-semibold placeholder:text-neutral-400" 
                />
              </div>
            </div>

            {/* Periode Lead Dibuat */}
            <div>
              <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-1.5">Periode Lead Dibuat</label>
              <div className="flex items-center gap-2">
                <input 
                  type="date" 
                  value={startDate} 
                  onChange={e => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 dark:text-white text-xs font-semibold" 
                />
                <span className="text-xs text-neutral-400">-</span>
                <input 
                  type="date" 
                  value={endDate} 
                  onChange={e => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 dark:text-white text-xs font-semibold" 
                />
              </div>
            </div>

            {/* Sales */}
            <div>
              <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-1.5">Sales</label>
              <select 
                value={salesId} 
                onChange={e => setSalesId(e.target.value)}
                className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 dark:text-white text-xs font-semibold"
              >
                <option value="">Semua Sales</option>
                {salesUsers.map(s => <option key={s.id} value={s.id}>{s.nama}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end">
            {/* Cabang */}
            <div>
              <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-1.5">Cabang</label>
              <select 
                value={cabangId} 
                disabled={!isAdminOrTop}
                onChange={e => setCabangId(e.target.value)}
                className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 dark:text-white text-xs font-semibold disabled:opacity-65"
              >
                <option value="">Semua Cabang</option>
                {cabangs.map(c => <option key={c.id} value={c.id}>{c.nama}</option>)}
              </select>
            </div>

            {/* Fase */}
            <div>
              <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-1.5">Fase</label>
              <select 
                value={fase} 
                onChange={e => setFase(e.target.value)}
                className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 dark:text-white text-xs font-semibold"
              >
                <option value="">Semua Fase</option>
                <option value="1">Lead Baru</option>
                <option value="2">Follow Up</option>
                <option value="3">Penawaran</option>
              </select>
            </div>

            {/* Status */}
            <div>
              <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-1.5">Status</label>
              <select 
                value={status} 
                onChange={e => setStatus(e.target.value)}
                className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 dark:text-white text-xs font-semibold"
              >
                <option value="">Semua Status</option>
                <option value="1">Open</option>
                <option value="2">Deal</option>
                <option value="3">Lost</option>
              </select>
            </div>

            {/* Actions */}
            <div className="flex gap-2 justify-end w-full">
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

      {/* Leads Table Container */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200/50 dark:border-neutral-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50">
          <h3 className="text-xs font-bold text-neutral-800 dark:text-neutral-200 uppercase tracking-wider">
            Data Semua Lead ({pagination.total})
          </h3>
        </div>

        {/* Table view */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-neutral-200 dark:divide-neutral-800">
            <thead className="bg-neutral-50 dark:bg-neutral-900 text-neutral-400 text-[10px] uppercase font-bold tracking-wider">
              <tr>
                <th scope="col" className="px-5 py-3 text-left">No</th>
                <th scope="col" className="px-5 py-3 text-left">Kode Lead</th>
                <th scope="col" className="px-5 py-3 text-left">Nama Customer / Perusahaan</th>
                <th scope="col" className="px-5 py-3 text-left">Sales</th>
                <th scope="col" className="px-5 py-3 text-left">Cabang</th>
                <th scope="col" className="px-5 py-3 text-center">Fase</th>
                <th scope="col" className="px-5 py-3 text-center">Status</th>
                <th scope="col" className="px-5 py-3 text-left">Tanggal Lead</th>
                <th scope="col" className="px-5 py-3 text-left">Terakhir Follow Up</th>
                <th scope="col" className="px-5 py-3 text-right">Nilai Potensi (Rp)</th>
                <th scope="col" className="px-5 py-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800 font-semibold text-xs text-neutral-700 dark:text-neutral-300">
              {isLoading ? (
                <tr>
                  <td colSpan="11" className="px-5 py-8 text-center text-neutral-400">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                      <span>Memuat data...</span>
                    </div>
                  </td>
                </tr>
              ) : leads.length === 0 ? (
                <tr>
                  <td colSpan="11" className="px-5 py-8 text-center text-neutral-400">
                    Tidak ada data lead yang ditemukan.
                  </td>
                </tr>
              ) : (
                leads.map((lead, idx) => (
                  <tr key={lead.id} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-850/20 transition-colors">
                    <td className="px-5 py-3.5 text-neutral-400 font-medium">
                      {(pagination.page - 1) * pagination.limit + idx + 1}
                    </td>
                    <td className="px-5 py-3.5 text-neutral-900 dark:text-white font-bold">
                      {lead.nomor}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="max-w-[200px]">
                        <p className="font-bold text-neutral-900 dark:text-white truncate">{lead.customer_nama}</p>
                        <p className="text-[10px] text-neutral-400 mt-0.5">{lead.customer_telepon}</p>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      {lead.sales_nama}
                    </td>
                    <td className="px-5 py-3.5">
                      {lead.cabang_nama}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase border ${getFaseBadgeClass(lead.fase)}`}>
                        {getFaseLabel(lead.fase)}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase border ${getStatusBadgeClass(lead.status)}`}>
                        {getStatusLabel(lead.status)}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 font-medium text-neutral-500">
                      {lead.dibuat_tanggal ? dayjs(lead.dibuat_tanggal).format("DD MMM YYYY") : "-"}
                    </td>
                    <td className="px-5 py-3.5 font-medium text-neutral-500">
                      {lead.terakhir_follow_up ? (
                        <div>
                          <p>{dayjs(lead.terakhir_follow_up).format("DD MMM YYYY")}</p>
                          <p className="text-[9px] text-neutral-400 mt-0.5">{dayjs(lead.terakhir_follow_up).format("HH:mm")}</p>
                        </div>
                      ) : "-"}
                    </td>
                    <td className="px-5 py-3.5 text-right font-black text-neutral-950 dark:text-white">
                      {lead.nilai_potensi !== null ? `Rp ${lead.nilai_potensi.toLocaleString("id-ID")}` : "-"}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <Link 
                        href={`/lead/${lead.id}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 font-bold rounded-lg transition-colors duration-150"
                      >
                        <FiEye className="w-3.5 h-3.5" />
                        <span>Lihat</span>
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination element */}
        {!isLoading && leads.length > 0 && (
          <div className="px-6 py-4 border-t border-neutral-100 dark:border-neutral-800 flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-neutral-900">
            <div className="text-xs font-semibold text-neutral-500">
              Menampilkan {Math.min((pagination.page - 1) * pagination.limit + 1, pagination.total)} - {Math.min(pagination.page * pagination.limit, pagination.total)} dari {pagination.total} data
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4">
              {/* Limit per page */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-neutral-500">Baris:</span>
                <select 
                  value={pagination.limit} 
                  onChange={e => {
                    const newLimit = parseInt(e.target.value);
                    setPagination(prev => ({ ...prev, limit: newLimit, page: 1 }));
                  }}
                  className="px-2 py-1 border border-neutral-200 dark:border-neutral-800 rounded-lg bg-neutral-50 dark:bg-neutral-950 text-neutral-750 dark:text-white text-xs font-bold"
                >
                  <option value="10">10 / halaman</option>
                  <option value="25">25 / halaman</option>
                  <option value="50">50 / halaman</option>
                  <option value="100">100 / halaman</option>
                </select>
              </div>

              {/* Page navigation */}
              <div className="flex items-center gap-1">
                <button 
                  disabled={pagination.page <= 1}
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                  className="px-2 py-1.5 border border-neutral-200 dark:border-neutral-800 rounded-lg text-xs font-semibold text-neutral-600 hover:bg-neutral-50 dark:text-neutral-400 dark:hover:bg-neutral-850 disabled:opacity-40 transition-colors"
                >
                  Sebelumnya
                </button>
                {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                  let pageNum = pagination.page;
                  if (pagination.page <= 3) {
                    pageNum = i + 1;
                  } else if (pagination.page >= pagination.totalPages - 2) {
                    pageNum = pagination.totalPages - 4 + i;
                  } else {
                    pageNum = pagination.page - 2 + i;
                  }
                  
                  if (pageNum <= 0 || pageNum > pagination.totalPages) return null;

                  return (
                    <button 
                      key={pageNum}
                      onClick={() => setPagination(prev => ({ ...prev, page: pageNum }))}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${pagination.page === pageNum ? "bg-orange-500 text-white shadow-sm" : "border border-neutral-200 dark:border-neutral-800 text-neutral-600 hover:bg-neutral-50 dark:text-neutral-400 dark:hover:bg-neutral-850"}`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                <button 
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                  className="px-2 py-1.5 border border-neutral-200 dark:border-neutral-800 rounded-lg text-xs font-semibold text-neutral-600 hover:bg-neutral-50 dark:text-neutral-400 dark:hover:bg-neutral-850 disabled:opacity-40 transition-colors"
                >
                  Berikutnya
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Info notice block at bottom */}
      <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/50 rounded-2xl p-4 flex items-start gap-3 text-xs text-blue-700 dark:text-blue-400">
        <FiGrid className="w-5 h-5 flex-shrink-0 mt-0.5 text-blue-600 dark:text-blue-500" />
        <div className="space-y-1">
          <p className="font-semibold">Informasi:</p>
          <p className="font-medium">Laporan ini menampilkan semua lead dari seluruh status. Gunakan filter untuk mempersempit pencarian data sesuai kebutuhan Anda.</p>
          <p className="font-medium opacity-80">Data nilai potensi adalah estimasi dari penawaran terakhir, jika ada.</p>
        </div>
      </div>
    </div>
  );
}
