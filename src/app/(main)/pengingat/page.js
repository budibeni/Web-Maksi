"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { FiSearch, FiBell, FiCheckCircle, FiAlertCircle, FiEye, FiRefreshCw, FiClock, FiCalendar, FiUser, FiMapPin, FiCheck } from "react-icons/fi";
import { useAuthStore } from "@/store/auth.store";
import { useUIStore } from "@/store/ui.store";
import dayjs from "dayjs";
import 'dayjs/locale/id';

dayjs.locale('id');

export default function PengingatPage() {
  const user = useAuthStore((state) => state.user);
  const { showToast } = useUIStore();

  const [reminders, setReminders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("AKTIF"); // default to AKTIF
  const [cabangId, setCabangId] = useState("");
  const [salesId, setSalesId] = useState("");
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [pagination, setPagination] = useState({ totalData: 0, totalPages: 1 });
  const [summary, setSummary] = useState({ totalAktif: 0, totalTerlambat: 0, totalSelesai: 0 });
  const [isSubmittingAction, setIsSubmittingAction] = useState(false);

  // Master lists for filters
  const [cabangs, setCabangs] = useState([]);
  const [users, setUsers] = useState([]);

  // Check roles
  const isAdminOrTop = user?.role?.nama === "Administrator" || user?.role?.nama === "Top Management";
  const isBranchManager = user?.role?.nama === "Branch Manager";

  useEffect(() => {
    // Fetch master cabang
    if (isAdminOrTop) {
      fetch("/api/master/cabang")
        .then((r) => r.json())
        .then((d) => {
          if (d.success) setCabangs(d.data || []);
        });
    }

    // Fetch master user
    if (isAdminOrTop || isBranchManager) {
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
    }
  }, [isAdminOrTop, isBranchManager, user]);

  const fetchReminders = async () => {
    setIsLoading(true);
    try {
      const queryParams = new URLSearchParams({
        search,
        status,
        page: String(page),
        limit: String(limit),
        cabang_id: cabangId,
        sales_id: salesId,
      });

      const res = await fetch(`/api/pengingat?${queryParams.toString()}`);
      const json = await res.json();
      if (json.success) {
        setReminders(json.data || []);
        setSummary(json.summary || { totalAktif: 0, totalTerlambat: 0, totalSelesai: 0 });
        setPagination(json.pagination || { totalData: 0, totalPages: 1 });
      } else {
        showToast(json.message || "Gagal mengambil data pengingat.", "error");
      }
    } catch (e) {
      console.error(e);
      showToast("Terjadi kesalahan koneksi sistem.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReminders();
  }, [page, status, cabangId, salesId]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchReminders();
  };

  const handleResetFilters = () => {
    setSearch("");
    setStatus("AKTIF");
    setCabangId("");
    setSalesId("");
    setPage(1);
  };

  const handleCompleteReminder = async (id) => {
    if (isSubmittingAction) return;
    setIsSubmittingAction(true);
    try {
      const res = await fetch("/api/pengingat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: String(id), status: "SELESAI" }),
      });
      const json = await res.json();
      if (json.success) {
        showToast("Pengingat berhasil ditandai selesai.", "success");
        fetchReminders();
      } else {
        showToast(json.message || "Terjadi kesalahan.", "error");
      }
    } catch (e) {
      console.error(e);
      showToast("Terjadi kesalahan koneksi.", "error");
    } finally {
      setIsSubmittingAction(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-neutral-900 dark:text-white flex items-center gap-2">
            <FiBell className="text-orange-500 w-6 h-6 animate-swing" />
            Daftar Pengingat Prospek
          </h1>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
            Pantau semua janji temu, jadwal follow up, dan pengingat aktivitas customer.
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Card 1: Total Aktif */}
        <div className="bg-gradient-to-br from-orange-500 to-amber-600 rounded-2xl p-5 text-white shadow-md flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider opacity-90">Total Aktif</span>
            <h2 className="text-3xl font-black mt-1">{summary.totalAktif}</h2>
            <p className="text-[10px] opacity-75 mt-1">Aktivitas belum diselesaikan</p>
          </div>
          <div className="p-3 bg-white/10 rounded-xl">
            <FiBell className="w-6 h-6 text-white" />
          </div>
        </div>

        {/* Card 2: Jatuh Tempo */}
        <div className="bg-gradient-to-br from-red-500 to-rose-600 rounded-2xl p-5 text-white shadow-md flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider opacity-90">Jatuh Tempo</span>
            <h2 className="text-3xl font-black mt-1 flex items-center gap-1.5">
              {summary.totalTerlambat}
              {summary.totalTerlambat > 0 && (
                <span className="w-2.5 h-2.5 rounded-full bg-white animate-ping"></span>
              )}
            </h2>
            <p className="text-[10px] opacity-75 mt-1">Melewati batas waktu jadwal</p>
          </div>
          <div className="p-3 bg-white/10 rounded-xl animate-pulse">
            <FiAlertCircle className="w-6 h-6 text-white" />
          </div>
        </div>

        {/* Card 3: Diselesaikan */}
        <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-5 text-white shadow-md flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider opacity-90">Diselesaikan</span>
            <h2 className="text-3xl font-black mt-1">{summary.totalSelesai}</h2>
            <p className="text-[10px] opacity-75 mt-1">Pengingat sudah ditutup</p>
          </div>
          <div className="p-3 bg-white/10 rounded-xl">
            <FiCheckCircle className="w-6 h-6 text-white" />
          </div>
        </div>
      </div>

      {/* Filters Card */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200/50 dark:border-neutral-800 rounded-2xl p-5 shadow-sm space-y-4">
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 items-end">
          {/* Search Input */}
          <div className="md:col-span-2 relative">
            <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-1.5 uppercase tracking-wider">
              Cari Pengingat
            </label>
            <div className="relative">
              <FiSearch className="absolute left-3.5 top-3 text-neutral-400 dark:text-neutral-600" />
              <input
                type="text"
                placeholder="Cari customer, no lead, atau catatan..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all dark:text-white text-xs font-medium"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-1.5 uppercase tracking-wider">
              Status
            </label>
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
              className="w-full px-3.5 py-2.5 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all dark:text-white text-xs font-medium"
            >
              <option value="ALL">Semua Status</option>
              <option value="AKTIF">Aktif</option>
              <option value="SELESAI">Selesai</option>
            </select>
          </div>

          {/* Cabang Filter */}
          {isAdminOrTop ? (
            <div>
              <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-1.5 uppercase tracking-wider">
                Cabang
              </label>
              <select
                value={cabangId}
                onChange={(e) => {
                  setCabangId(e.target.value);
                  setPage(1);
                }}
                className="w-full px-3.5 py-2.5 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all dark:text-white text-xs font-medium"
              >
                <option value="">Semua Cabang</option>
                {cabangs.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nama}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="hidden md:block"></div>
          )}

          {/* Sales Filter */}
          {isAdminOrTop || isBranchManager ? (
            <div>
              <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-1.5 uppercase tracking-wider">
                Sales PIC
              </label>
              <select
                value={salesId}
                onChange={(e) => {
                  setSalesId(e.target.value);
                  setPage(1);
                }}
                className="w-full px-3.5 py-2.5 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all dark:text-white text-xs font-medium"
              >
                <option value="">Semua Sales</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.nama}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="hidden md:block"></div>
          )}

          {/* Reset Button Area */}
          <div className="flex gap-2 justify-end sm:col-span-2 md:col-span-5 md:mt-2">
            <button
              type="submit"
              className="bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-100 text-white dark:text-neutral-900 px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
            >
              Cari
            </button>
            {(search || status !== "AKTIF" || cabangId || salesId) && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5"
              >
                <FiRefreshCw className="w-3.5 h-3.5" />
                Reset
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Table Data */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200/50 dark:border-neutral-800 rounded-2xl overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-xs text-neutral-500 font-medium">Memuat data pengingat...</span>
          </div>
        ) : reminders.length === 0 ? (
          <div className="text-center py-16">
            <FiBell className="w-10 h-10 text-neutral-300 dark:text-neutral-700 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-neutral-700 dark:text-neutral-300">Tidak Ada Pengingat</h3>
            <p className="text-xs text-neutral-400 mt-1">Tidak ada jadwal pengingat yang sesuai dengan filter.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-neutral-200 dark:divide-neutral-800">
              <thead className="bg-neutral-50 dark:bg-neutral-950/50">
                <tr className="text-neutral-500 uppercase tracking-wider text-[10px] font-bold">
                  <th className="px-5 py-4 text-left w-10">No</th>
                  <th className="px-5 py-4 text-left">Jadwal / Waktu</th>
                  <th className="px-5 py-4 text-left">Customer (Lead No)</th>
                  <th className="px-5 py-4 text-left">Sales PIC</th>
                  <th className="px-5 py-4 text-left">Cabang</th>
                  <th className="px-5 py-4 text-left">Catatan Pengingat</th>
                  <th className="px-5 py-4 text-center">Status</th>
                  <th className="px-5 py-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800 text-xs text-neutral-600 dark:text-neutral-300">
                {reminders.map((rem, idx) => {
                  const targetTime = dayjs(rem.tanggal_pengingat);
                  const isLate = rem.status === "AKTIF" && targetTime.isBefore(dayjs());
                  
                  return (
                    <tr key={rem.id} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-900/30 transition-colors">
                      <td className="px-5 py-4 font-medium text-neutral-400">{(page - 1) * limit + idx + 1}</td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="flex flex-col gap-0.5">
                          <div className="flex items-center gap-1 text-neutral-900 dark:text-white font-semibold">
                            <FiCalendar className="w-3.5 h-3.5 text-neutral-400" />
                            <span>{targetTime.format("DD MMM YYYY")}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-[10px] font-medium text-neutral-500">
                            <FiClock className="w-3 h-3 text-orange-500" />
                            <span>Pukul {targetTime.format("HH:mm")} WIB</span>
                          </div>
                          {isLate && (
                            <span className="inline-flex items-center gap-1 text-[9px] font-bold text-red-600 dark:text-red-400 mt-1 uppercase tracking-wider animate-pulse">
                              <span className="w-1.5 h-1.5 rounded-full bg-red-600"></span>
                              Terlambat
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div>
                          <p className="font-semibold text-neutral-900 dark:text-white">
                            {rem.lead?.customer?.nama}
                          </p>
                          <p className="text-[10px] font-mono text-neutral-400 mt-0.5">
                            {rem.lead?.nomor}
                          </p>
                        </div>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <FiUser className="w-3.5 h-3.5 text-neutral-400" />
                          <span className="font-medium">{rem.lead?.user?.nama}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap text-neutral-500">
                        <div className="flex items-center gap-1">
                          <FiMapPin className="w-3 h-3" />
                          <span>{rem.lead?.cabang?.nama}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 max-w-xs break-words font-medium text-neutral-700 dark:text-neutral-300">
                        {rem.catatan || <span className="text-neutral-400 italic">Tidak ada catatan</span>}
                      </td>
                      <td className="px-5 py-4 text-center">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                          rem.status === "AKTIF"
                            ? "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400"
                            : "bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400"
                        }`}>
                          {rem.status}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right whitespace-nowrap space-x-2">
                        {rem.status === "AKTIF" && (
                          <button
                            onClick={() => handleCompleteReminder(rem.id)}
                            disabled={isSubmittingAction}
                            title="Tandai Selesai"
                            className="p-1.5 bg-green-50 hover:bg-green-100 dark:bg-green-950/20 dark:hover:bg-green-950/40 text-green-700 dark:text-green-400 rounded-lg transition-colors inline-flex items-center"
                          >
                            <FiCheck className="w-4 h-4" />
                          </button>
                        )}
                        {rem.lead?.id && (
                          <Link
                            href={`/lead/${rem.lead.id}`}
                            title="Tindak Lanjut Prospek"
                            className="p-1.5 bg-orange-50 hover:bg-orange-100 dark:bg-orange-950/20 dark:hover:bg-orange-950/40 text-orange-700 dark:text-orange-400 rounded-lg transition-colors inline-flex items-center"
                          >
                            <FiEye className="w-4 h-4" />
                          </Link>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {reminders.length > 0 && (
          <div className="px-5 py-4 border-t border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/20 flex items-center justify-between">
            <span className="text-xs text-neutral-500 font-medium">
              Menampilkan {reminders.length} dari {pagination.totalData} data
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
                className="px-3.5 py-1.5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-xs font-semibold rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 disabled:opacity-50 disabled:pointer-events-none transition-all shadow-sm"
              >
                Sebelumnya
              </button>
              <div className="text-xs font-bold px-3 py-1 bg-orange-50 dark:bg-orange-950/30 text-orange-600 dark:text-orange-400 rounded-md">
                {page} / {pagination.totalPages}
              </div>
              <button
                disabled={page === pagination.totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="px-3.5 py-1.5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-xs font-semibold rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 disabled:opacity-50 disabled:pointer-events-none transition-all shadow-sm"
              >
                Berikutnya
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
