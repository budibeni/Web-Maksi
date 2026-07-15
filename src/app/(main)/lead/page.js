"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FiSearch, FiPlus, FiDownload, FiFilter, FiEye, FiX,
  FiUsers, FiTrendingUp, FiTarget, FiZap, FiRefreshCw,
  FiChevronDown
} from "react-icons/fi";
import dayjs from "dayjs";
import 'dayjs/locale/id';
import { exportToExcel } from "@/lib/excel";
import { useUIStore } from "@/store/ui.store";
import { useAuthStore } from "@/store/auth.store";

dayjs.locale('id');

const FASE_LABEL = { 1: 'Lead Baru', 2: 'Follow Up', 3: 'Penawaran' };
const FASE_COLOR = {
  1: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  2: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  3: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
};

export default function LeadPage() {
  const router = useRouter();
  const currentUser = useAuthStore(state => state.user);
  const role = (typeof currentUser?.role === 'object' ? currentUser.role.nama : currentUser?.role || "").toLowerCase();
  const isTopManagement = role === "top management";

  const [leads, setLeads] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [summary, setSummary] = useState({ totalOpen: 0, totalLeadBaru: 0, totalFollowUp: 0, totalPenawaran: 0 });
  const [mounted, setMounted] = useState(false);
  const { showToast } = useUIStore();

  // Filter
  const [searchTerm, setSearchTerm] = useState("");
  const [filterFase, setFilterFase] = useState("");
  const [showFilter, setShowFilter] = useState(false);

  // Pagination
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalData, setTotalData] = useState(0);

  // Sort
  const [sortField, setSortField] = useState("id");
  const [sortOrder, setSortOrder] = useState("desc");

  const handleSort = (field) => {
    if (sortField === field) setSortOrder(o => o === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortOrder('asc'); }
    setPage(1);
  };

  const renderSortIcon = (field) => {
    if (sortField !== field) return <span className="opacity-0 group-hover:opacity-100 text-neutral-400 ml-1">↑↓</span>;
    return sortOrder === 'asc'
      ? <span className="text-orange-500 ml-1">↑</span>
      : <span className="text-orange-500 ml-1">↓</span>;
  };

  useEffect(() => setMounted(true), []);

  const fetchLeads = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        search: searchTerm,
        page: String(page),
        limit: String(limit),
        sortField,
        sortOrder,
        ...(filterFase ? { fase: filterFase } : {}),
      });
      const res = await fetch(`/api/lead?${params}`);
      const json = await res.json();
      if (json.success) {
        setLeads(json.data);
        setSummary(json.summary || {});
        setTotalPages(json.pagination.totalPages);
        setTotalData(json.pagination.totalData);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const t = setTimeout(fetchLeads, 300);
    return () => clearTimeout(t);
  }, [searchTerm, page, limit, sortField, sortOrder, filterFase]);

  const handleExport = async () => {
    const data = leads.map((l, i) => ({
      No: i + 1,
      "Kode Lead": l.nomor,
      Customer: l.customer?.nama,
      Telepon: l.customer?.telepon,
      Sales: l.user?.nama,
      Cabang: l.cabang?.nama,
      Fase: FASE_LABEL[l.fase] || '-',
      "Tanggal Lead": dayjs(l.dibuat_tanggal).format('DD/MM/YYYY'),
      "Reminder Berikutnya": l.pengingats?.[0] ? dayjs(l.pengingats[0].tanggal_pengingat).format('DD/MM/YYYY HH:mm') : '-',
    }));
    exportToExcel(data, 'daftar-lead');
    showToast('Export berhasil!', 'success');
  };

  const reminderStatus = (pengingat) => {
    if (!pengingat) return null;
    const isLate = dayjs(pengingat.tanggal_pengingat).isBefore(dayjs());
    return {
      text: dayjs(pengingat.tanggal_pengingat).format('DD MMM YYYY HH:mm'),
      late: isLate,
    };
  };

  return (
    <div className="space-y-6">
      {/* Portal: Header Actions */}
      {mounted && document.getElementById("header-actions-portal") && createPortal(
        <>
          {!isTopManagement && (
            <button
              onClick={() => router.push('/lead/baru')}
              className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-1.5 rounded-full font-medium flex items-center gap-2 transition-colors shadow-sm text-sm mr-1"
            >
              <FiPlus className="w-4 h-4" />
              <span className="hidden sm:inline">Lead Baru</span>
            </button>
          )}
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
            onClick={fetchLeads}
          >
            <FiRefreshCw className="w-4 h-4" />
          </button>
        </>,
        document.getElementById("header-actions-portal")
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          className={`bg-white dark:bg-neutral-900 rounded-2xl border p-5 shadow-sm cursor-pointer transition-all ${filterFase === '' ? 'border-orange-500 ring-1 ring-orange-500/30' : 'border-neutral-200/50 dark:border-neutral-800 hover:border-orange-300'}`}
          onClick={() => { setFilterFase(''); setPage(1); }}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-xl"><FiTarget className="w-5 h-5 text-orange-600 dark:text-orange-400" /></div>
            <div>
              <div className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">OPEN (Dalam Proses)</div>
              <div className="text-2xl font-bold text-neutral-900 dark:text-white">{summary.totalOpen}</div>
            </div>
          </div>
        </div>
        <div
          className={`bg-white dark:bg-neutral-900 rounded-2xl border p-5 shadow-sm cursor-pointer transition-all ${filterFase === '1' ? 'border-blue-500 ring-1 ring-blue-500/30' : 'border-neutral-200/50 dark:border-neutral-800 hover:border-blue-300'}`}
          onClick={() => { setFilterFase('1'); setPage(1); }}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-xl"><FiUsers className="w-5 h-5 text-blue-600 dark:text-blue-400" /></div>
            <div>
              <div className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">Lead Baru</div>
              <div className="text-2xl font-bold text-neutral-900 dark:text-white">{summary.totalLeadBaru}</div>
            </div>
          </div>
        </div>
        <div
          className={`bg-white dark:bg-neutral-900 rounded-2xl border p-5 shadow-sm cursor-pointer transition-all ${filterFase === '2' ? 'border-yellow-500 ring-1 ring-yellow-500/30' : 'border-neutral-200/50 dark:border-neutral-800 hover:border-yellow-300'}`}
          onClick={() => { setFilterFase('2'); setPage(1); }}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-xl"><FiTrendingUp className="w-5 h-5 text-yellow-600 dark:text-yellow-400" /></div>
            <div>
              <div className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">Follow Up</div>
              <div className="text-2xl font-bold text-neutral-900 dark:text-white">{summary.totalFollowUp}</div>
            </div>
          </div>
        </div>
        <div
          className={`bg-white dark:bg-neutral-900 rounded-2xl border p-5 shadow-sm cursor-pointer transition-all ${filterFase === '3' ? 'border-purple-500 ring-1 ring-purple-500/30' : 'border-neutral-200/50 dark:border-neutral-800 hover:border-purple-300'}`}
          onClick={() => { setFilterFase('3'); setPage(1); }}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-xl"><FiZap className="w-5 h-5 text-purple-600 dark:text-purple-400" /></div>
            <div>
              <div className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">Penawaran</div>
              <div className="text-2xl font-bold text-neutral-900 dark:text-white">{summary.totalPenawaran}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter & Table */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200/50 dark:border-neutral-800 rounded-2xl shadow-sm overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-neutral-100 dark:border-neutral-800 flex flex-col sm:flex-row gap-3 justify-between items-center bg-neutral-50/50 dark:bg-neutral-900/50">
          <div className="relative w-full sm:w-80">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FiSearch className="text-neutral-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-neutral-200 dark:border-neutral-700 rounded-xl leading-5 bg-white dark:bg-neutral-950 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-colors sm:text-sm"
              placeholder="Cari nama customer, kode lead, HP..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
            />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {filterFase && (
              <span className="flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">
                {FASE_LABEL[parseInt(filterFase)]}
                <button onClick={() => { setFilterFase(''); setPage(1); }}>
                  <FiX className="w-3.5 h-3.5 ml-1" />
                </button>
              </span>
            )}
            <select
              value={filterFase}
              onChange={(e) => { setFilterFase(e.target.value); setPage(1); }}
              className="ml-auto bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 text-sm rounded-xl focus:ring-orange-500 focus:border-orange-500 block px-3 py-2 outline-none cursor-pointer"
            >
              <option value="">Semua Fase</option>
              <option value="1">Lead Baru</option>
              <option value="2">Follow Up</option>
              <option value="3">Penawaran</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-neutral-200 dark:divide-neutral-800">
            <thead className="bg-neutral-50 dark:bg-neutral-900">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">No</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider cursor-pointer group select-none" onClick={() => handleSort('nomor')}>
                  <div className="flex items-center">Kode Lead {renderSortIcon('nomor')}</div>
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider cursor-pointer group select-none" onClick={() => handleSort('customer_id')}>
                  <div className="flex items-center">Customer {renderSortIcon('customer_id')}</div>
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider hidden md:table-cell">Sales</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider cursor-pointer group select-none" onClick={() => handleSort('fase')}>
                  <div className="flex items-center">Fase {renderSortIcon('fase')}</div>
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider cursor-pointer group select-none hidden lg:table-cell" onClick={() => handleSort('dibuat_tanggal')}>
                  <div className="flex items-center">Tanggal Lead {renderSortIcon('dibuat_tanggal')}</div>
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">Reminder Berikutnya</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-neutral-500 uppercase tracking-wider">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {isLoading ? (
                <tr>
                  <td colSpan="8" className="px-6 py-10 text-center text-neutral-500">
                    <div className="flex justify-center items-center gap-2">
                      <div className="w-5 h-5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                      <span>Memuat data...</span>
                    </div>
                  </td>
                </tr>
              ) : leads.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <FiTarget className="w-10 h-10 text-neutral-300 dark:text-neutral-700" />
                      <p className="text-neutral-500 font-medium">Belum ada Lead</p>
                      <p className="text-sm text-neutral-400">Klik tombol "Lead Baru" untuk menambahkan lead pertama.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                leads.map((lead, i) => {
                  const reminder = lead.pengingats?.[0];
                  const reminderInfo = reminderStatus(reminder);
                  return (
                    <tr key={lead.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors group">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">{(page - 1) * limit + i + 1}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-mono font-medium text-neutral-900 dark:text-white">{lead.nomor}</span>
                        <div className="text-xs text-neutral-400 mt-0.5">{lead.status_customer}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-neutral-900 dark:text-white">{lead.customer?.nama}</div>
                        <div className="text-xs text-neutral-500">{lead.customer?.telepon}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-600 dark:text-neutral-400 hidden md:table-cell">
                        {lead.user?.nama}
                        <div className="text-xs text-neutral-400">{lead.cabang?.nama}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide ${FASE_COLOR[lead.fase]}`}>
                          {FASE_LABEL[lead.fase] || '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500 hidden lg:table-cell">
                        {dayjs(lead.dibuat_tanggal).format('DD MMM YYYY')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {reminderInfo ? (
                          <span className={`font-medium ${reminderInfo.late ? 'text-red-500' : 'text-orange-600 dark:text-orange-400'}`}>
                            {reminderInfo.text}
                            {reminderInfo.late && <span className="ml-1 text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full font-bold">Terlambat</span>}
                          </span>
                        ) : (
                          <span className="text-neutral-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <Link
                          href={`/lead/${lead.id}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-orange-50 hover:bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:hover:bg-orange-900/40 dark:text-orange-400 transition-colors"
                        >
                          <FiEye className="w-3.5 h-3.5" />
                          Lihat Detail
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!isLoading && leads.length > 0 && (
          <div className="px-6 py-4 border-t border-neutral-100 dark:border-neutral-800 flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-neutral-900">
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-neutral-500 dark:text-neutral-400">Baris:</span>
                <select
                  value={limit}
                  onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }}
                  className="bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 text-sm rounded-lg focus:ring-orange-500 focus:border-orange-500 block px-2.5 py-1.5 outline-none cursor-pointer"
                >
                  <option value="10">10</option>
                  <option value="25">25</option>
                  <option value="50">50</option>
                </select>
              </div>
              <div className="text-sm text-neutral-500 dark:text-neutral-400">
                Menampilkan <span className="font-medium text-neutral-900 dark:text-white">{(page - 1) * limit + 1}</span> - <span className="font-medium text-neutral-900 dark:text-white">{Math.min(page * limit, totalData)}</span> dari <span className="font-medium text-neutral-900 dark:text-white">{totalData}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1.5 text-sm font-medium rounded-lg border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-neutral-700 dark:text-neutral-300">Sebelumnya</button>
              <div className="text-sm font-medium text-neutral-700 dark:text-neutral-300 px-2 flex items-center gap-2">
                Hal
                <select value={page} onChange={(e) => setPage(Number(e.target.value))} className="bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 text-sm rounded-lg block px-2 py-1 outline-none cursor-pointer min-w-[3rem] text-center">
                  {Array.from({ length: Math.max(1, totalPages) }, (_, i) => i + 1).map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
                dari {totalPages}
              </div>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="px-3 py-1.5 text-sm font-medium rounded-lg border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-neutral-700 dark:text-neutral-300">Selanjutnya</button>
            </div>
          </div>
        )}
      </div>

      {/* Info note */}
      <div className="flex items-start gap-2 text-xs text-neutral-500 dark:text-neutral-400 bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-xl p-3">
        <FiTarget className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
        <span>Daftar ini hanya menampilkan lead dengan status <strong>OPEN</strong>. Lead yang sudah DEAL dapat dilihat pada menu <strong>Deal</strong>, dan Lead yang LOST pada menu <strong>Lost</strong>.</span>
      </div>
    </div>
  );
}
