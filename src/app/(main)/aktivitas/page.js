"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FiSearch, FiActivity, FiEye, FiRefreshCw, FiClock, FiUser, FiMapPin } from "react-icons/fi";
import { useAuthStore } from "@/store/auth.store";
import { useUIStore } from "@/store/ui.store";
import dayjs from "dayjs";
import 'dayjs/locale/id';

dayjs.locale('id');

export default function RiwayatAktivitasPage() {
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

  const [activities, setActivities] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [cabangId, setCabangId] = useState("");
  const [salesId, setSalesId] = useState("");
  const [hasilInteraksiId, setHasilInteraksiId] = useState("");
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [pagination, setPagination] = useState({ totalData: 0, totalPages: 1 });

  // Master lists for filters
  const [cabangs, setCabangs] = useState([]);
  const [users, setUsers] = useState([]);
  const [hasilList, setHasilList] = useState([]);

  // Check roles
  const isAdminOrTop = user?.role?.nama === "Administrator" || user?.role?.nama === "Top Management";
  const isBranchManager = user?.role?.nama === "Branch Manager";

  useEffect(() => {
    // Fetch master hasil interaksi
    fetch("/api/master/hasil-interaksi")
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setHasilList(d.data || []);
      });

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

  const fetchActivities = async () => {
    setIsLoading(true);
    try {
      const queryParams = new URLSearchParams({
        search,
        page: String(page),
        limit: String(limit),
        cabang_id: cabangId,
        sales_id: salesId,
        hasil_interaksi_id: hasilInteraksiId,
      });

      const res = await fetch(`/api/aktivitas?${queryParams.toString()}`);
      const json = await res.json();
      if (json.success) {
        setActivities(json.data || []);
        setPagination(json.pagination || { totalData: 0, totalPages: 1 });
      } else {
        showToast(json.message || "Gagal mengambil data aktivitas.", "error");
      }
    } catch (e) {
      console.error(e);
      showToast("Terjadi kesalahan koneksi sistem.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, [page, cabangId, salesId, hasilInteraksiId]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchActivities();
  };

  const handleResetFilters = () => {
    setSearch("");
    setCabangId("");
    setSalesId("");
    setHasilInteraksiId("");
    setPage(1);
  };

  const getBadgeColor = (warna) => {
    // Custom HSL mapping or Tailwind class based on database warna or fallback
    if (!warna) return "bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300";
    if (warna.startsWith("bg-")) return warna;
    
    // Switch-case fallback for custom codes
    switch (warna.toLowerCase()) {
      case "green":
      case "success":
        return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
      case "blue":
      case "info":
        return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
      case "yellow":
      case "warning":
        return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400";
      case "red":
      case "danger":
        return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
      case "purple":
        return "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400";
      default:
        return "bg-orange-100 text-orange-700 dark:bg-orange-950/30 dark:text-orange-400";
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-neutral-900 dark:text-white flex items-center gap-2">
            <FiActivity className="text-orange-500 w-6 h-6 animate-pulse" />
            Riwayat Aktivitas Sales
          </h1>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
            Pantau seluruh log follow up, negosiasi, dan aktivitas prospek penjualan secara real-time.
          </p>
        </div>
      </div>

      {/* Filters Card */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200/50 dark:border-neutral-800 rounded-2xl p-5 shadow-sm space-y-4">
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 items-end">
          {/* Search Input */}
          <div className="md:col-span-2 relative">
            <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-1.5 uppercase tracking-wider">
              Cari Aktivitas
            </label>
            <div className="relative">
              <FiSearch className="absolute left-3.5 top-3 text-neutral-400 dark:text-neutral-600" />
              <input
                type="text"
                placeholder="Cari catatan atau nama customer..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all dark:text-white text-xs font-medium"
              />
            </div>
          </div>

          {/* Hasil Interaksi Filter */}
          <div>
            <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-1.5 uppercase tracking-wider">
              Hasil Interaksi
            </label>
            <select
              value={hasilInteraksiId}
              onChange={(e) => {
                setHasilInteraksiId(e.target.value);
                setPage(1);
              }}
              className="w-full px-3.5 py-2.5 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all dark:text-white text-xs font-medium"
            >
              <option value="">Semua Hasil</option>
              {hasilList.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.nama}
                </option>
              ))}
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
              Terapkan Cari
            </button>
            {(search || cabangId || salesId || hasilInteraksiId) && (
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

      {/* Table / Timeline Data */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200/50 dark:border-neutral-800 rounded-2xl overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-xs text-neutral-500 font-medium">Memuat data aktivitas...</span>
          </div>
        ) : activities.length === 0 ? (
          <div className="text-center py-16">
            <FiActivity className="w-10 h-10 text-neutral-300 dark:text-neutral-700 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-neutral-700 dark:text-neutral-300">Belum Ada Aktivitas</h3>
            <p className="text-xs text-neutral-400 mt-1">Tidak ada riwayat aktivitas yang sesuai dengan filter.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-neutral-200 dark:divide-neutral-800">
              <thead className="bg-neutral-50 dark:bg-neutral-950/50">
                <tr className="text-neutral-500 uppercase tracking-wider text-[10px] font-bold">
                  <th className="px-5 py-4 text-left">Waktu & Tanggal</th>
                  <th className="px-5 py-4 text-left">Sales PIC</th>
                  <th className="px-5 py-4 text-left">Cabang</th>
                  <th className="px-5 py-4 text-left">Customer (Lead No)</th>
                  <th className="px-5 py-4 text-left">Hasil Interaksi</th>
                  <th className="px-5 py-4 text-left">Catatan Follow Up</th>
                  <th className="px-5 py-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800 text-xs text-neutral-600 dark:text-neutral-300">
                {activities.map((act) => {
                  const badgeColor = getBadgeColor(act.hasil_interaksi_rel?.warna || act.hasil_interaksi);
                  return (
                    <tr key={act.id} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-900/30 transition-colors">
                      <td className="px-5 py-4 whitespace-nowrap font-medium text-neutral-900 dark:text-white">
                        <div className="flex items-center gap-1.5 text-neutral-500 font-normal">
                          <FiClock className="w-3.5 h-3.5 text-orange-500" />
                          <span>{dayjs(act.dibuat_tanggal).format("DD MMM YYYY, HH:mm")}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <FiUser className="w-3.5 h-3.5 text-neutral-400" />
                          <span className="font-semibold text-neutral-800 dark:text-neutral-200">{act.dibuat_oleh}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap text-neutral-500">
                        <div className="flex items-center gap-1">
                          <FiMapPin className="w-3 h-3" />
                          <span>{act.lead?.cabang?.nama}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div>
                          <p className="font-semibold text-neutral-900 dark:text-white">
                            {act.lead?.customer?.nama}
                          </p>
                          <p className="text-[10px] font-mono text-neutral-400 mt-0.5">
                            {act.lead?.nomor}
                          </p>
                        </div>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${badgeColor}`}>
                          {act.hasil_interaksi}
                        </span>
                      </td>
                      <td className="px-5 py-4 max-w-xs break-words text-neutral-700 dark:text-neutral-300 font-medium">
                        {act.catatan}
                      </td>
                      <td className="px-5 py-4 text-right whitespace-nowrap">
                        {act.lead?.id && (
                          <Link
                            href={`/lead/${act.lead.id}`}
                            title="Lihat Detail Prospek"
                            className="px-3 py-1.5 bg-orange-50 hover:bg-orange-100 dark:bg-orange-950/20 dark:hover:bg-orange-950/40 text-orange-700 dark:text-orange-400 rounded-lg transition-colors inline-flex items-center gap-1 text-xs font-bold"
                          >
                            <FiEye className="w-3.5 h-3.5" />
                            <span>Detail</span>
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
        {activities.length > 0 && (
          <div className="px-5 py-4 border-t border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/20 flex items-center justify-between">
            <span className="text-xs text-neutral-500 font-medium">
              Menampilkan {activities.length} dari {pagination.totalData} data
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
