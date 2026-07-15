"use client";

import { useState, useEffect } from "react";
import { 
  FiSearch, FiFilter, FiRefreshCw, FiDownload, FiChevronLeft, FiChevronRight, 
  FiClock, FiUser, FiShield, FiBox, FiTarget, FiUsers, FiInfo, FiChevronRight as FiCr
} from "react-icons/fi";
import { exportToExcel } from "@/lib/excel";
import { useUIStore } from "@/store/ui.store";

const MODUL_OPTIONS = ["", "AUTH", "USER", "CUSTOMER", "LEAD", "PENAWARAN"];
const AKSI_OPTIONS = ["", "LOGIN", "LOGOUT", "CREATE", "UPDATE", "DELETE", "FOLLOW_UP", "DEAL", "LOST", "DEACTIVATE", "CHANGE_PASSWORD"];

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
  const [pagination, setPagination] = useState({ page: 1, limit: 25, total: 0, totalPages: 1 });

  const [selectedLog, setSelectedLog] = useState(null);

  const [filters, setFilters] = useState({
    search: "",
    modul: "",
    aksi: "",
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10),
    endDate: new Date().toISOString().slice(0, 10),
  });

  const fetchLogs = async (page = 1) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        search: filters.search,
        modul: filters.modul,
        aksi: filters.aksi,
        startDate: filters.startDate,
        endDate: filters.endDate,
        page: String(page),
        limit: String(pagination.limit),
      });

      const res = await fetch(`/api/audit-log?${params}`);
      const json = await res.json();
      
      if (json.success) {
        setLogs(json.data);
        setPagination(p => ({ ...p, ...json.pagination }));
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
    fetchLogs(1);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchLogs(1);
  };

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
    exportToExcel(exportData, `audit_log_${filters.startDate}_${filters.endDate}.xlsx`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
          <span>Pengaturan</span>
          <FiCr className="w-3 h-3" />
          <span className="font-semibold text-neutral-800 dark:text-neutral-200">Audit Log</span>
        </div>
        <h1 className="text-xl font-bold text-neutral-900 dark:text-white mt-1.5">Riwayat Aktivitas Sistem</h1>
        <p className="text-xs text-neutral-500 dark:text-neutral-400">
          Monitoring seluruh aktivitas pengguna dalam sistem Maksindo.
        </p>
      </div>

      {/* Filter Card */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200/50 dark:border-neutral-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50 flex items-center gap-2">
          <FiFilter className="w-4 h-4 text-orange-500" />
          <span className="text-xs font-bold text-neutral-700 dark:text-neutral-300">Filter</span>
        </div>
        <form onSubmit={handleSearch} className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search */}
          <div className="relative lg:col-span-2">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FiSearch className="w-4 h-4 text-neutral-400" />
            </span>
            <input
              type="text"
              value={filters.search}
              onChange={e => setFilters(p => ({ ...p, search: e.target.value }))}
              placeholder="Cari nama user atau deskripsi..."
              className="w-full pl-10 pr-3 py-2 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-xs font-semibold dark:text-white placeholder:text-neutral-400 transition-all"
            />
          </div>

          {/* Modul */}
          <select
            value={filters.modul}
            onChange={e => setFilters(p => ({ ...p, modul: e.target.value }))}
            className="py-2 px-3 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-xs font-semibold dark:text-white transition-all appearance-none"
          >
            {MODUL_OPTIONS.map(m => <option key={m} value={m}>{m || "Semua Modul"}</option>)}
          </select>

          {/* Aksi */}
          <select
            value={filters.aksi}
            onChange={e => setFilters(p => ({ ...p, aksi: e.target.value }))}
            className="py-2 px-3 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-xs font-semibold dark:text-white transition-all appearance-none"
          >
            {AKSI_OPTIONS.map(a => <option key={a} value={a}>{a || "Semua Aksi"}</option>)}
          </select>

          {/* Tanggal Awal */}
          <input
            type="date"
            value={filters.startDate}
            onChange={e => setFilters(p => ({ ...p, startDate: e.target.value }))}
            className="py-2 px-3 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-xs font-semibold dark:text-white transition-all"
          />

          {/* Tanggal Akhir */}
          <input
            type="date"
            value={filters.endDate}
            onChange={e => setFilters(p => ({ ...p, endDate: e.target.value }))}
            className="py-2 px-3 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-xs font-semibold dark:text-white transition-all"
          />

          <div className="sm:col-span-2 lg:col-span-5 flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 font-bold rounded-xl text-xs hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-all active:scale-95"
            >
              <FiDownload className="w-4 h-4" />
              Export Excel
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-5 py-2 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl text-xs transition-all active:scale-95 shadow-sm"
            >
              <FiSearch className="w-4 h-4" />
              Tampilkan
            </button>
          </div>
        </form>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200/50 dark:border-neutral-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FiClock className="w-4 h-4 text-orange-500" />
            <span className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
              Ditemukan {pagination.total.toLocaleString('id-ID')} data
            </span>
          </div>
          <button 
            onClick={() => fetchLogs(pagination.page)} 
            className="p-2 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
            title="Refresh"
          >
            <FiRefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-neutral-200 dark:divide-neutral-800">
            <thead className="bg-neutral-50 dark:bg-neutral-900 text-neutral-400 text-[10px] uppercase font-bold tracking-wider">
              <tr>
                <th className="px-5 py-4 text-left">Waktu</th>
                <th className="px-5 py-4 text-left">Pengguna</th>
                <th className="px-5 py-4 text-left">Modul</th>
                <th className="px-5 py-4 text-left">Aksi</th>
                <th className="px-5 py-4 text-left">Deskripsi</th>
                <th className="px-5 py-4 text-left">IP Address</th>
                <th className="px-5 py-4 text-center">Detail</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800 text-xs font-semibold text-neutral-700 dark:text-neutral-300">
              {isLoading ? (
                <tr>
                  <td colSpan="7" className="px-5 py-10 text-center text-neutral-400">
                    <div className="flex justify-center items-center gap-2">
                      <div className="w-5 h-5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                      <span>Memuat data...</span>
                    </div>
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-5 py-10 text-center">
                    <div className="flex flex-col items-center gap-2 text-neutral-400">
                      <FiClock className="w-8 h-8 opacity-30" />
                      <span className="font-medium">Tidak ada data ditemukan.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                logs.map(log => {
                  const ModulIcon = MODUL_ICON[log.modul] || FiInfo;
                  return (
                    <tr key={log.id} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-850/20 transition-colors">
                      <td className="px-5 py-4 whitespace-nowrap text-neutral-500 dark:text-neutral-400">
                        {formatDateTime(log.dibuat_tanggal)}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="h-7 w-7 rounded-full bg-orange-50 dark:bg-orange-950/30 flex items-center justify-center text-orange-600 dark:text-orange-500 font-black text-[10px]">
                            {log.nama_user?.charAt(0)?.toUpperCase() || "?"}
                          </div>
                          <span className="font-bold text-neutral-900 dark:text-white">{log.nama_user}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <ModulIcon className="w-3.5 h-3.5 text-neutral-400" />
                          <span>{log.modul}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase border-0 ${AKSI_BADGE[log.aksi] || "bg-neutral-100 text-neutral-500"}`}>
                          {log.aksi}
                        </span>
                      </td>
                      <td className="px-5 py-4 max-w-xs">
                        <p className="truncate" title={log.deskripsi || ""}>{log.deskripsi || "-"}</p>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap text-neutral-400">
                        {log.ip_address || "-"}
                      </td>
                      <td className="px-5 py-4 text-center">
                        {(log.data_sebelum || log.data_sesudah) && (
                          <button
                            onClick={() => setSelectedLog(log)}
                            className="p-1.5 text-neutral-400 hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-lg transition-colors"
                            title="Lihat Detail Perubahan"
                          >
                            <FiInfo className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="p-4 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
            <span className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">
              Halaman {pagination.page} dari {pagination.totalPages}
            </span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => fetchLogs(pagination.page - 1)}
                disabled={pagination.page <= 1}
                className="p-2 rounded-lg border border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <FiChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                const page = Math.max(1, Math.min(pagination.page - 2, pagination.totalPages - 4)) + i;
                return (
                  <button
                    key={page}
                    onClick={() => fetchLogs(page)}
                    className={`w-8 h-8 rounded-lg text-xs font-bold transition-colors ${
                      page === pagination.page 
                        ? "bg-orange-500 text-white shadow-sm" 
                        : "border border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800"
                    }`}
                  >
                    {page}
                  </button>
                );
              })}
              <button
                onClick={() => fetchLogs(pagination.page + 1)}
                disabled={pagination.page >= pagination.totalPages}
                className="p-2 rounded-lg border border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <FiChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedLog && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-sm"
          onClick={() => setSelectedLog(null)}
        >
          <div 
            className="bg-white dark:bg-neutral-900 rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between bg-neutral-50/50 dark:bg-neutral-900/50">
              <h3 className="text-sm font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-2">
                <FiInfo className="w-4 h-4 text-orange-500" />
                Detail Perubahan Data
              </h3>
              <button 
                onClick={() => setSelectedLog(null)}
                className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4">
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
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${AKSI_BADGE[selectedLog.aksi] || "bg-neutral-100 text-neutral-500"}`}>
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
