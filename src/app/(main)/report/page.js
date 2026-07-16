"use client";

import { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { 
  FiDownload, FiEye, FiRefreshCw,
  FiCheckCircle, FiAlertCircle, FiInbox, FiTrendingUp, FiLayers, FiGrid
} from "react-icons/fi";
import { useAuthStore } from "@/store/auth.store";
import { useUIStore } from "@/store/ui.store";
import { exportToExcel } from "@/lib/excel";
import dayjs from "dayjs";
import { DataTable } from "@/components/table";
import { useDataTable } from "@/hooks/useDataTable";

export default function LaporanSemuaLeadPage() {
  const user = useAuthStore((state) => state.user);
  const { showToast } = useUIStore();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  // Summary cards state
  const [summary, setSummary] = useState({
    totalLeads: 0, totalBaru: 0, totalFollowUp: 0,
    totalPenawaran: 0, totalDeal: 0, totalLost: 0
  });
  const [leads, setLeads] = useState([]);

  // Date range filter (terpisah dari DataTable, dikirim via buildParams extra)
  const todayDate = new Date();
  const firstDay = new Date(todayDate.getFullYear(), todayDate.getMonth(), 1);
  const [startDate, setStartDate] = useState(dayjs(firstDay).format("YYYY-MM-DD"));
  const [endDate, setEndDate] = useState(dayjs(todayDate).format("YYYY-MM-DD"));
  const [pendingStart, setPendingStart] = useState(dayjs(firstDay).format("YYYY-MM-DD"));
  const [pendingEnd, setPendingEnd] = useState(dayjs(todayDate).format("YYYY-MM-DD"));

  const {
    tableState,
    tableHandlers,
    buildParams,
    applyPagination,
    clearAllFilters
  } = useDataTable({
    defaultSortField: "dibuat_tanggal",
    defaultSortOrder: "desc"
  });

  // Masters
  const [cabangs, setCabangs] = useState([]);
  const [salesUsers, setSalesUsers] = useState([]);

  const isAdminOrTop = user?.role?.nama === "Administrator" || user?.role?.nama === "Top Management";
  const isBranchManager = user?.role?.nama === "Branch Manager";

  useEffect(() => {
    fetch("/api/master/cabang")
      .then(r => r.json())
      .then(d => { if (d.success) setCabangs(d.data || []); });
    fetch("/api/master/user")
      .then(r => r.json())
      .then(d => {
        if (d.success) {
          const list = (d.data || []).filter(u =>
            u.role?.nama === "Sales" &&
            (!isBranchManager || String(u.cabang_id) === String(user?.cabang_id))
          );
          setSalesUsers(list);
        }
      });
  }, [isBranchManager, user]);

  const fetchReport = async () => {
    setIsLoading(true);
    try {
      const params = buildParams({ startDate, endDate });
      const res = await fetch(`/api/lead/report?${params.toString()}`);
      const json = await res.json();
      if (json.success && json.data) {
        setSummary(json.data.summary || {});
        setLeads(json.data.leads || []);
        if (json.data.pagination) {
          applyPagination({
            totalData: json.data.pagination.total,
            totalPages: json.data.pagination.totalPages
          });
        }
      } else {
        showToast(json.message || "Gagal memuat riwayat lead.", "error");
      }
    } catch (error) {
      console.error(error);
      showToast("Terjadi kesalahan koneksi database.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchReport();
    }, 300);
    return () => clearTimeout(timer);
  }, [
    tableState.searchValue,
    tableState.page,
    tableState.pageSize,
    tableState.sortField,
    tableState.sortOrder,
    tableState.columnFilters,
    startDate,
    endDate
  ]);

  const handleApplyDateFilter = () => {
    setStartDate(pendingStart);
    setEndDate(pendingEnd);
  };

  const handleExport = async (type) => {
    setIsExporting(true);
    try {
      showToast("Sedang menyiapkan file export...", "info");
      let dataToExport = [];
      
      if (type === "page") {
        dataToExport = leads;
      } else {
        const params = new URLSearchParams({ startDate, endDate, page: "1", limit: "1000" });
        const res = await fetch(`/api/lead/report?${params}`);
        const json = await res.json();
        if (json.success && json.data?.leads) {
          dataToExport = json.data.leads;
        } else {
          showToast("Gagal mengunduh data untuk diexport.", "error");
          return;
        }
      }

      const formattedExport = dataToExport.map((l, idx) => ({
        "No": idx + 1,
        "Kode Lead": l.nomor || l.kode_lead || "-",
        "Nama Customer": l.customer_nama || l.customer?.nama || "-",
        "Telepon": l.customer_telepon || l.customer?.telepon || "-",
        "Sales PIC": l.sales_nama || l.sales?.nama || "-",
        "Cabang": l.cabang_nama || l.cabang?.nama || "-",
        "Fase": l.fase === 1 ? "Lead Baru" : l.fase === 2 ? "Follow Up" : "Penawaran",
        "Status": l.status === 1 ? "Open" : l.status === 2 ? "Deal" : "Lost",
        "Tanggal Lead": l.dibuat_tanggal ? dayjs(l.dibuat_tanggal).format("DD/MM/YYYY") : "-",
        "Terakhir Follow Up": l.terakhir_follow_up ? dayjs(l.terakhir_follow_up).format("DD/MM/YYYY HH:mm") : "-",
        "Nilai Potensi (Rp)": l.nilai_potensi ?? "-"
      }));
      await exportToExcel(formattedExport, "Laporan_Semua_Lead");
      showToast("Laporan berhasil diexport ke Excel.", "success");
    } catch (error) {
      console.error(error);
      showToast("Terjadi kesalahan saat mengeksport data.", "error");
    } finally {
      setIsExporting(false);
    }
  };

  const getFaseBadgeClass = (faseVal) => {
    switch (faseVal) {
      case 1: return "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/30 dark:text-purple-400 dark:border-purple-900/50";
      case 2: return "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900/50";
      case 3: return "bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/30 dark:text-teal-400 dark:border-teal-900/50";
      default: return "bg-neutral-50 text-neutral-600 border-neutral-200";
    }
  };

  const getFaseLabel = (faseVal) => {
    switch (faseVal) {
      case 1: return "Lead Baru";
      case 2: return "Follow Up";
      case 3: return "Penawaran";
      default: return "-";
    }
  };

  const getStatusBadgeClass = (statusVal) => {
    switch (statusVal) {
      case 1: return "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900/50";
      case 2: return "bg-green-50 text-green-700 border-green-200 dark:bg-green-950/30 dark:text-green-400 dark:border-green-900/50";
      case 3: return "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-900/50";
      default: return "bg-neutral-50 text-neutral-600 border-neutral-200";
    }
  };

  const getStatusLabel = (statusVal) => {
    switch (statusVal) {
      case 1: return "Open";
      case 2: return "Deal";
      case 3: return "Lost";
      default: return "-";
    }
  };

  const filterCabangOptions = useMemo(() => cabangs.map(c => ({ value: String(c.id), label: c.nama })), [cabangs]);
  const filterSalesOptions = useMemo(() => salesUsers.map(u => ({ value: String(u.id), label: u.nama })), [salesUsers]);

  const columns = useMemo(() => [
    {
      key: "nomor",
      label: "Kode Lead",
      sortable: true,
      filter: { type: "text" },
      render: (row) => (
        <span className="font-bold text-neutral-900 dark:text-white font-mono">{row.nomor}</span>
      )
    },
    {
      key: "customer_nama",
      label: "Customer",
      sortable: true,
      filter: { type: "text" },
      render: (row) => (
        <div>
          <p className="font-bold text-neutral-900 dark:text-white">{row.customer_nama}</p>
          <p className="text-[10px] text-neutral-400 mt-0.5">{row.customer_telepon}</p>
        </div>
      )
    },
    {
      key: "sales_nama",
      label: "Sales",
      sortable: true,
      filter: isAdminOrTop || isBranchManager ? { type: "select", options: filterSalesOptions } : undefined,
      render: (row) => row.sales_nama
    },
    {
      key: "cabang_nama",
      label: "Cabang",
      sortable: true,
      filter: isAdminOrTop ? { type: "select", options: filterCabangOptions } : undefined,
      render: (row) => row.cabang_nama
    },
    {
      key: "fase",
      label: "Fase",
      sortable: true,
      filter: {
        type: "select",
        options: [
          { value: "1", label: "Lead Baru" },
          { value: "2", label: "Follow Up" },
          { value: "3", label: "Penawaran" }
        ]
      },
      render: (row) => (
        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase border ${getFaseBadgeClass(row.fase)}`}>
          {getFaseLabel(row.fase)}
        </span>
      )
    },
    {
      key: "status",
      label: "Status",
      sortable: true,
      filter: {
        type: "select",
        options: [
          { value: "1", label: "Open" },
          { value: "2", label: "Deal" },
          { value: "3", label: "Lost" }
        ]
      },
      render: (row) => (
        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase border ${getStatusBadgeClass(row.status)}`}>
          {getStatusLabel(row.status)}
        </span>
      )
    },
    {
      key: "dibuat_tanggal",
      label: "Tanggal Lead",
      sortable: true,
      filter: { type: "date" },
      render: (row) => row.dibuat_tanggal ? dayjs(row.dibuat_tanggal).format("DD MMM YYYY") : "-"
    },
    {
      key: "terakhir_follow_up",
      label: "Terakhir Follow Up",
      sortable: true,
      filter: { type: "date" },
      render: (row) => row.terakhir_follow_up ? (
        <div>
          <p>{dayjs(row.terakhir_follow_up).format("DD MMM YYYY")}</p>
          <p className="text-[9px] text-neutral-400 mt-0.5">{dayjs(row.terakhir_follow_up).format("HH:mm")}</p>
        </div>
      ) : "-"
    },
    {
      key: "nilai_potensi",
      label: "Nilai Potensi (Rp)",
      sortable: true,
      filter: { type: "number" },
      render: (row) => row.nilai_potensi !== null && row.nilai_potensi !== undefined
        ? <span className="font-black text-neutral-900 dark:text-white">Rp {row.nilai_potensi.toLocaleString("id-ID")}</span>
        : <span className="text-neutral-400">-</span>
    }
  ], [leads, isAdminOrTop, isBranchManager, filterSalesOptions, filterCabangOptions]);

  const actions = useMemo(() => [
    {
      label: "Lihat",
      icon: FiEye,
      variant: "default",
      onClick: (row) => { window.location.href = `/lead/${row.id}`; }
    }
  ], []);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">

      {/* Portal: Header Actions */}
      {mounted && document.getElementById("header-actions-portal") && createPortal(
        <>
          <button
            onClick={fetchReport}
            className="p-2 text-neutral-500 hover:text-neutral-900 bg-white hover:bg-neutral-100 dark:bg-neutral-900 dark:text-neutral-400 dark:hover:text-white dark:hover:bg-neutral-800 rounded-full transition-colors border border-neutral-200 dark:border-neutral-800"
            title="Refresh"
          >
            <FiRefreshCw className="w-4 h-4" />
          </button>
        </>,
        document.getElementById("header-actions-portal")
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3.5">
        {[
          { label: "Semua Lead", value: summary.totalLeads, icon: FiLayers, color: "blue" },
          { label: "Lead Baru", value: summary.totalBaru, icon: FiInbox, color: "purple" },
          { label: "Follow Up", value: summary.totalFollowUp, icon: FiRefreshCw, color: "blue" },
          { label: "Penawaran", value: summary.totalPenawaran, icon: FiTrendingUp, color: "teal" },
          { label: "Deal", value: summary.totalDeal, icon: FiCheckCircle, color: "green" },
          { label: "Lost", value: summary.totalLost, icon: FiAlertCircle, color: "red" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white dark:bg-neutral-900 border border-neutral-200/50 dark:border-neutral-800 rounded-2xl p-4 shadow-sm flex items-center gap-3">
            <div className={`p-2.5 bg-${color}-50 dark:bg-${color}-950/40 rounded-xl`}>
              <Icon className={`w-5 h-5 text-${color}-600 dark:text-${color}-500`} />
            </div>
            <div>
              <span className="text-[9px] font-bold uppercase tracking-wider text-neutral-400">{label}</span>
              <h2 className="text-lg font-black text-neutral-900 dark:text-white mt-0.5">{value}</h2>
            </div>
          </div>
        ))}
      </div>

      {/* Date Range Filter Panel */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200/50 dark:border-neutral-800 rounded-2xl p-4 shadow-sm">
        <div className="flex flex-col sm:flex-row items-end gap-3">
          <div className="flex-1">
            <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-1.5">Periode Lead Dibuat</label>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={pendingStart}
                onChange={e => setPendingStart(e.target.value)}
                className="flex-1 px-3 py-2 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 dark:text-white text-xs font-semibold"
              />
              <span className="text-xs text-neutral-400">—</span>
              <input
                type="date"
                value={pendingEnd}
                onChange={e => setPendingEnd(e.target.value)}
                className="flex-1 px-3 py-2 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 dark:text-white text-xs font-semibold"
              />
            </div>
          </div>
          <button
            onClick={handleApplyDateFilter}
            className="px-5 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold transition-all shadow-sm whitespace-nowrap"
          >
            Terapkan Periode
          </button>
          <button
            onClick={() => { clearAllFilters(); setPendingStart(dayjs(firstDay).format("YYYY-MM-DD")); setPendingEnd(dayjs(today).format("YYYY-MM-DD")); setStartDate(dayjs(firstDay).format("YYYY-MM-DD")); setEndDate(dayjs(today).format("YYYY-MM-DD")); }}
            className="px-4 py-2 bg-white dark:bg-neutral-900 hover:bg-neutral-50 dark:hover:bg-neutral-800 border border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 rounded-xl text-xs font-bold transition-all whitespace-nowrap"
          >
            Reset Filter
          </button>
        </div>
      </div>

      {/* DataTable */}
      <DataTable
        columns={columns}
        data={leads}
        isLoading={isLoading}
        emptyIcon={FiGrid}
        emptyText="Tidak ada data lead yang ditemukan."
        rowKey="id"
        // Pagination
        page={tableState.page}
        pageSize={tableState.pageSize}
        totalData={tableState.totalData}
        totalPages={tableState.totalPages}
        onPageChange={tableHandlers.onPageChange}
        onLimitChange={tableHandlers.onLimitChange}
        // Sorting
        sortField={tableState.sortField}
        sortOrder={tableState.sortOrder}
        onSortChange={tableHandlers.onSortChange}
        // Search
        searchValue={tableState.searchValue}
        onSearchChange={tableHandlers.onSearchChange}
        searchPlaceholder="Cari kode lead, nama customer, telepon..."
        // Filter
        columnFilters={tableState.columnFilters}
        onFilterChange={tableHandlers.onFilterChange}
        // Export
        onExport={handleExport}
        // Actions
        actions={actions}
      />

      {/* Info notice */}
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
