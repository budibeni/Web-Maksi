"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { FiSearch, FiFileText, FiPrinter, FiEye, FiFilter, FiRefreshCw } from "react-icons/fi";
import { useAuthStore } from "@/store/auth.store";
import { useUIStore } from "@/store/ui.store";
import PenawaranDetailModal from "../lead/[id]/components/PenawaranDetailModal";
import dayjs from "dayjs";
import 'dayjs/locale/id';

dayjs.locale('id');

export default function DaftarPenawaranPage() {
  const user = useAuthStore((state) => state.user);
  const { showToast } = useUIStore();

  const [quotations, setQuotations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [cabangId, setCabangId] = useState("");
  const [salesId, setSalesId] = useState("");
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [pagination, setPagination] = useState({ totalData: 0, totalPages: 1 });
  const [selectedQuotationId, setSelectedQuotationId] = useState(null);

  // Master lists for filters
  const [cabangs, setCabangs] = useState([]);
  const [users, setUsers] = useState([]);

  // Check roles
  const isAdminOrTop = user?.role?.nama === "Administrator" || user?.role?.nama === "Top Management";
  const isBranchManager = user?.role?.nama === "Branch Manager";

  useEffect(() => {
    // Fetch filter data
    if (isAdminOrTop) {
      fetch("/api/master/cabang")
        .then((r) => r.json())
        .then((d) => {
          if (d.success) setCabangs(d.data || []);
        });
    }

    if (isAdminOrTop || isBranchManager) {
      fetch("/api/master/user")
        .then((r) => r.json())
        .then((d) => {
          if (d.success) {
            // Filter sales role users
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

  const fetchQuotations = async () => {
    setIsLoading(true);
    try {
      const queryParams = new URLSearchParams({
        search,
        page: String(page),
        limit: String(limit),
        cabang_id: cabangId,
        sales_id: salesId,
      });

      const res = await fetch(`/api/penawaran?${queryParams.toString()}`);
      const json = await res.json();
      if (json.success) {
        setQuotations(json.data || []);
        setPagination(json.pagination || { totalData: 0, totalPages: 1 });
      } else {
        showToast(json.message || "Gagal mengambil data penawaran.", "error");
      }
    } catch (e) {
      console.error(e);
      showToast("Terjadi kesalahan koneksi sistem.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchQuotations();
  }, [page, cabangId, salesId]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchQuotations();
  };

  const handleResetFilters = () => {
    setSearch("");
    setCabangId("");
    setSalesId("");
    setPage(1);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-neutral-900 dark:text-white flex items-center gap-2">
            <FiFileText className="text-orange-500 w-6 h-6" />
            Daftar Penawaran Harga
          </h1>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
            Pantau dan cetak seluruh dokumen penawaran harga customer di perusahaan Anda.
          </p>
        </div>
      </div>

      {/* Filters Card */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200/50 dark:border-neutral-800 rounded-2xl p-5 shadow-sm space-y-4">
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
          {/* Search Input */}
          <div className="md:col-span-2 relative">
            <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-1.5 uppercase tracking-wider">
              Cari Penawaran
            </label>
            <div className="relative">
              <FiSearch className="absolute left-3.5 top-3 text-neutral-400 dark:text-neutral-600" />
              <input
                type="text"
                placeholder="Cari nomor penawaran, customer, atau sales..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all dark:text-white text-xs font-medium"
              />
            </div>
          </div>

          {/* Cabang Filter */}
          {isAdminOrTop && (
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
          )}

          {/* Sales Filter */}
          {(isAdminOrTop || isBranchManager) && (
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
          )}

          {/* Buttons Area */}
          <div className="flex gap-2 justify-end w-full md:w-auto">
            <button
              type="submit"
              className="bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-100 text-white dark:text-neutral-900 px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
            >
              Cari
            </button>
            {(search || cabangId || salesId) && (
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
            <span className="text-xs text-neutral-500 font-medium">Memuat data penawaran...</span>
          </div>
        ) : quotations.length === 0 ? (
          <div className="text-center py-16">
            <FiFileText className="w-10 h-10 text-neutral-300 dark:text-neutral-700 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-neutral-700 dark:text-neutral-300">Belum Ada Dokumen Penawaran</h3>
            <p className="text-xs text-neutral-400 mt-1">Tidak ada dokumen penawaran harga yang sesuai dengan filter.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-neutral-200 dark:divide-neutral-800">
              <thead className="bg-neutral-50 dark:bg-neutral-950/50">
                <tr className="text-neutral-500 uppercase tracking-wider text-[10px] font-bold">
                  <th className="px-5 py-4 text-left w-10">No</th>
                  <th className="px-5 py-4 text-left">No Penawaran</th>
                  <th className="px-5 py-4 text-center">Versi</th>
                  <th className="px-5 py-4 text-left">Customer</th>
                  <th className="px-5 py-4 text-left">Cabang</th>
                  <th className="px-5 py-4 text-left">Sales PIC</th>
                  <th className="px-5 py-4 text-right">Grand Total</th>
                  <th className="px-5 py-4 text-left">Tanggal</th>
                  <th className="px-5 py-4 text-center">Status</th>
                  <th className="px-5 py-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800 text-xs text-neutral-600 dark:text-neutral-300">
                {quotations.map((q, idx) => {
                  const isFinal = String(q.lead?.versi_penawaran_final_id) === String(q.id);
                  const isDeal = q.lead?.status === 2;
                  return (
                    <tr key={q.id} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-900/30 transition-colors">
                      <td className="px-5 py-3.5 font-medium text-neutral-400">{(page - 1) * limit + idx + 1}</td>
                      <td className="px-5 py-3.5 font-mono font-medium text-neutral-900 dark:text-white">{q.nomor}</td>
                      <td className="px-5 py-3.5 text-center font-bold text-neutral-800 dark:text-neutral-200">v{q.versi}</td>
                      <td className="px-5 py-3.5 font-medium text-neutral-900 dark:text-white">{q.customer_nama}</td>
                      <td className="px-5 py-3.5 font-medium">{q.cabang_nama}</td>
                      <td className="px-5 py-3.5 font-medium">{q.sales_nama}</td>
                      <td className="px-5 py-3.5 text-right font-bold text-neutral-900 dark:text-white">
                        Rp {Number(q.grand_total).toLocaleString("id-ID")}
                      </td>
                      <td className="px-5 py-3.5 text-neutral-500">
                        {dayjs(q.dibuat_tanggal).format("DD MMM YYYY")}
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        {isFinal ? (
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${isDeal ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"}`}>
                            {isDeal ? "Disetujui (DEAL)" : "Disetujui (OPEN)"}
                          </span>
                        ) : (
                          <span className="text-neutral-400 font-medium text-[10px]">-</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-right whitespace-nowrap space-x-2">
                        <button
                          onClick={() => setSelectedQuotationId(q.id)}
                          title="Cetak Penawaran"
                          className="p-1.5 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 rounded-lg transition-colors inline-flex items-center"
                        >
                          <FiPrinter className="w-4 h-4" />
                        </button>
                        {q.lead?.id && (
                          <Link
                            href={`/lead/${q.lead.id}`}
                            title="Lihat Detail Prospek"
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
        {quotations.length > 0 && (
          <div className="px-5 py-4 border-t border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/20 flex items-center justify-between">
            <span className="text-xs text-neutral-500 font-medium">
              Menampilkan {quotations.length} dari {pagination.totalData} data
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

      {/* Penawaran Detail Print Modal */}
      {selectedQuotationId && (
        <PenawaranDetailModal
          quotationId={selectedQuotationId}
          onClose={() => setSelectedQuotationId(null)}
        />
      )}
    </div>
  );
}
