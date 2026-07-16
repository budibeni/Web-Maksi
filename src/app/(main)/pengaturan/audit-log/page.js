"use client";

import { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { 
  FiClock, FiUser, FiShield, FiBox, FiTarget, FiUsers, FiInfo, FiRefreshCw, FiDownload 
} from "react-icons/fi";
import { exportToExcel } from "@/lib/excel";
import { useUIStore } from "@/store/ui.store";
import { DataTable } from "@/components/table";
import { useDataTable } from "@/hooks/useDataTable";

const MODUL_OPTIONS = [
  { value: "AUTH", label: "AUTH" },
  { value: "USER", label: "USER" },
  { value: "CUSTOMER", label: "CUSTOMER" },
  { value: "LEAD", label: "LEAD" },
  { value: "PENAWARAN", label: "PENAWARAN" }
];

const AKSI_OPTIONS = [
  { value: "LOGIN", label: "LOGIN" },
  { value: "LOGOUT", label: "LOGOUT" },
  { value: "CREATE", label: "CREATE" },
  { value: "UPDATE", label: "UPDATE" },
  { value: "DELETE", label: "DELETE" },
  { value: "FOLLOW_UP", label: "FOLLOW_UP" },
  { value: "DEAL", label: "DEAL" },
  { value: "LOST", label: "LOST" },
  { value: "DEACTIVATE", label: "DEACTIVATE" },
  { value: "CHANGE_PASSWORD", label: "CHANGE_PASSWORD" }
];

const AKSI_BADGE = {
  "LOGIN": "bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400",
  "LOGOUT": "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400",
  "CREATE": "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400",
  "UPDATE": "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400",
  "DELETE": "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400",
  "FOLLOW_UP": "bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-400",
  "DEAL": "bg-teal-100 text-teal-700 dark:bg-teal-950/40 dark:text-teal-400",
  "LOST": "bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400",
  "DEACTIVATE": "bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-400",
  "CHANGE_PASSWORD": "bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400",
};

const MODUL_ICON = {
  "AUTH": FiShield,
  "USER": FiUser,
  "CUSTOMER": FiUsers,
  "LEAD": FiTarget,
  "PENAWARAN": FiBox,
};

function formatDateTime(dt) {
  if (!dt) return "-";
  const d = new Date(dt);
  return d.toLocaleString("id-ID", { 
    day: "2-digit", month: "short", year: "numeric", 
    hour: "2-digit", minute: "2-digit", second: "2-digit" 
  });
}

export default function AuditLogPage() {
  const { showToast } = useUIStore();
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState(null);
  const [mounted, setMounted] = useState(false);

  const {
    tableState,
    tableHandlers,
    buildParams,
    applyPagination,
    clearAllFilters,
  } = useDataTable({
    defaultPageSize: 25,
    defaultSortField: "dibuat_tanggal",
    defaultSortOrder: "desc"
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const params = buildParams();
      const res = await fetch(`/api/audit-log?${params.toString()}`);
      const json = await res.json();
      
      if (json.success) {
        setLogs(json.data);
        if (json.pagination) {
          applyPagination({
            totalData: json.pagination.total,
            totalPages: json.pagination.totalPages
          });
        }
      } else {
        showToast(json.message || "Gagal memuat data.", "error");
      }
    } catch (err) {
      showToast("Terjadi kesalahan koneksi.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchLogs();
    }, 300);
    return () => clearTimeout(timer);
  }, [
    tableState.searchValue,
    tableState.page,
    tableState.pageSize,
    tableState.sortField,
    tableState.sortOrder,
    tableState.columnFilters
  ]);

  const handleExport = () => {
    if (!logs.length) { showToast("Tidak ada data untuk diexport.", "error"); return; }
    const exportData = logs.map(log => ({
      ID: log.id,
      WAKTU: formatDateTime(log.dibuat_tanggal),
      PENGGUNA: log.nama_user,
      MODUL: log.modul,
      AKSI: log.aksi,
      DESKRIPSI: log.deskripsi || "",
      IP_ADDRESS: log.ip_address || "",
    }));
    exportToExcel(exportData, `audit_log.xlsx`);
  };

  const columns = useMemo(() => [
    {
      key: "dibuat_tanggal",
      label: "Waktu",
      sortable: true,
      filter: { type: "date" },
      render: (row) => formatDateTime(row.dibuat_tanggal)
    },
    {
      key: "nama_user",
      label: "Pengguna",
      sortable: true,
      filter: { type: "text" },
      render: (row) => (
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-full bg-orange-50 dark:bg-orange-950/30 flex items-center justify-center text-orange-600 dark:text-orange-500 font-black text-[10px]">
            {row.nama_user?.charAt(0)?.toUpperCase() || "?"}
          </div>
          <span className="font-bold text-neutral-900 dark:text-white">{row.nama_user}</span>
        </div>
      )
    },
    {
      key: "modul",
      label: "Modul",
      sortable: true,
      filter: { type: "select", options: MODUL_OPTIONS },
      render: (row) => {
        const ModulIcon = MODUL_ICON[row.modul] || FiInfo;
        return (
          <div className="flex items-center gap-1.5">
            <ModulIcon className="w-3.5 h-3.5 text-neutral-400" />
            <span>{row.modul}</span>
          </div>
        );
      }
    },
    {
      key: "aksi",
      label: "Aksi",
      sortable: true,
      filter: { type: "select", options: AKSI_OPTIONS },
      render: (row) => (
        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase border-0 ${AKSI_BADGE[row.aksi] || "bg-neutral-100 text-neutral-500"}`}>
          {row.aksi}
        </span>
      )
    },
    {
      key: "deskripsi",
      label: "Deskripsi",
      sortable: true,
      filter: { type: "text" },
      render: (row) => (
        <p className="max-w-xs truncate" title={row.deskripsi || ""}>
          {row.deskripsi || "—"}
        </p>
      )
    },
    {
      key: "ip_address",
      label: "IP Address",
      sortable: true,
      filter: { type: "text" },
      render: (row) => row.ip_address || "—"
    }
  ], []);

  const actions = useMemo(() => [
    {
      label: "Lihat Detail Perubahan",
      icon: FiInfo,
      variant: "default",
      onClick: (row) => setSelectedLog(row),
      show: (row) => !!(row.data_sebelum || row.data_sesudah)
    }
  ], []);

  return (
    <div className="space-y-6">
      {mounted && document.getElementById("header-actions-portal") && createPortal(
        <div className="flex items-center gap-2">
          <button 
            className="p-2 text-neutral-500 hover:text-neutral-900 bg-white hover:bg-neutral-100 dark:bg-neutral-900 dark:text-neutral-400 dark:hover:text-white dark:hover:bg-neutral-800 rounded-full transition-colors border border-neutral-200 dark:border-neutral-800"
            title="Export ke Excel"
            onClick={handleExport}
          >
            <FiDownload className="w-4 h-4" />
          </button>
          <button 
            className="p-2 text-neutral-500 hover:text-neutral-900 bg-white hover:bg-neutral-100 dark:bg-neutral-900 dark:text-neutral-400 dark:hover:text-white dark:hover:bg-neutral-800 rounded-full transition-colors border border-neutral-200 dark:border-neutral-800"
            title="Refresh"
            onClick={fetchLogs}
          >
            <FiRefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>,
        document.getElementById("header-actions-portal")
      )}

      <DataTable
        columns={columns}
        data={logs}
        isLoading={isLoading}
        emptyText="Tidak ada riwayat audit ditemukan."
        rowKey="id"
        // Pagination
        page={tableState.page}
        pageSize={tableState.pageSize}
        totalData={tableState.totalData}
        totalPages={tableState.totalPages}
        onPageChange={tableHandlers.onPageChange}
        onLimitChange={tableHandlers.onLimitChange}
        limitOptions={[10, 25, 50, 100]}
        // Sorting
        sortField={tableState.sortField}
        sortOrder={tableState.sortOrder}
        onSortChange={tableHandlers.onSortChange}
        // Search
        searchValue={tableState.searchValue}
        onSearchChange={tableHandlers.onSearchChange}
        searchPlaceholder="Cari nama user atau deskripsi..."
        // Filter
        columnFilters={tableState.columnFilters}
        onFilterChange={tableHandlers.onFilterChange}
        onResetFilters={() => { clearAllFilters(); tableHandlers.onSearchChange(""); }}
        // Actions
        actions={actions}
      />

      {/* Detail Modal */}
      {selectedLog && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-sm animate-in fade-in"
          onClick={() => setSelectedLog(null)}
        >
          <div 
            className="bg-white dark:bg-neutral-900 rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95"
            onClick={e => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between bg-neutral-50/50 dark:bg-neutral-900/50">
              <h3 className="text-sm font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-2">
                <FiInfo className="w-4 h-4 text-orange-500" />
                Detail Perubahan Data
              </h3>
              <button 
                onClick={() => setSelectedLog(null)}
                className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <p className="text-neutral-400 font-medium mb-0.5">Pengguna</p>
                  <p className="font-bold text-neutral-900 dark:text-white">{selectedLog.nama_user}</p>
                </div>
                <div>
                  <p className="text-neutral-400 font-medium mb-0.5">Waktu</p>
                  <p className="font-bold text-neutral-900 dark:text-white">{formatDateTime(selectedLog.dibuat_tanggal)}</p>
                </div>
                <div>
                  <p className="text-neutral-400 font-medium mb-0.5">Modul</p>
                  <p className="font-bold text-neutral-900 dark:text-white">{selectedLog.modul}</p>
                </div>
                <div>
                  <p className="text-neutral-400 font-medium mb-0.5">Aksi</p>
                  <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${AKSI_BADGE[selectedLog.aksi] || "bg-neutral-100 text-neutral-500"}`}>
                    {selectedLog.aksi}
                  </span>
                </div>
              </div>

              {selectedLog.deskripsi && (
                <div className="bg-neutral-50 dark:bg-neutral-800/50 rounded-xl p-3">
                  <p className="text-[10px] text-neutral-400 font-medium mb-1">Deskripsi</p>
                  <p className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">{selectedLog.deskripsi}</p>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {selectedLog.data_sebelum && (
                  <div>
                    <p className="text-[10px] text-red-500 font-bold mb-1.5">DATA SEBELUM</p>
                    <pre className="text-[10px] bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/40 rounded-xl p-3 overflow-auto max-h-48 text-red-700 dark:text-red-400 font-mono whitespace-pre-wrap break-all">
                      {JSON.stringify(selectedLog.data_sebelum, null, 2)}
                    </pre>
                  </div>
                )}
                {selectedLog.data_sesudah && (
                  <div>
                    <p className="text-[10px] text-green-600 font-bold mb-1.5">DATA SESUDAH</p>
                    <pre className="text-[10px] bg-green-50 dark:bg-green-950/20 border border-green-100 dark:border-green-900/40 rounded-xl p-3 overflow-auto max-h-48 text-green-700 dark:text-green-400 font-mono whitespace-pre-wrap break-all">
                      {JSON.stringify(selectedLog.data_sesudah, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
