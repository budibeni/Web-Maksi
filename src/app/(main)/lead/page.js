"use client";

import { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FiPlus, FiDownload, FiEye, FiRefreshCw,
  FiUsers, FiTrendingUp, FiTarget, FiZap
} from "react-icons/fi";
import dayjs from "dayjs";
import 'dayjs/locale/id';
import { exportToExcel } from "@/lib/excel";
import { useUIStore } from "@/store/ui.store";
import { useAuthStore } from "@/store/auth.store";
import { DataTable } from "@/components/table";
import { useDataTable } from "@/hooks/useDataTable";

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

  const {
    tableState,
    tableHandlers,
    buildParams,
    applyPagination,
    setFilterValue
  } = useDataTable({
    defaultSortField: "id",
    defaultSortOrder: "desc"
  });

  useEffect(() => setMounted(true), []);

  const fetchLeads = async () => {
    setIsLoading(true);
    try {
      const params = buildParams();
      const res = await fetch(`/api/lead?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        setLeads(json.data || []);
        setSummary(json.summary || {});
        if (json.pagination) {
          applyPagination(json.pagination);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchLeads();
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

  const handleCardClick = (faseValue) => {
    if (faseValue) {
      setFilterValue("fase", "equals", faseValue);
    } else {
      setFilterValue("fase", "equals", "");
    }
  };

  const currentFaseFilter = useMemo(() => {
    return tableState.columnFilters["fase"]?.value || "";
  }, [tableState.columnFilters]);

  const columns = useMemo(() => [
    {
      key: "id",
      label: "No",
      sortable: true,
      width: 80,
      render: (row) => {
        const idx = leads.findIndex(l => l.id === row.id);
        return idx !== -1 ? (tableState.page - 1) * tableState.pageSize + idx + 1 : "—";
      }
    },
    {
      key: "nomor",
      label: "Kode Lead",
      sortable: true,
      filter: { type: "text" },
      render: (row) => (
        <div>
          <span className="font-mono font-medium text-neutral-900 dark:text-white">{row.nomor}</span>
          <div className="text-[10px] text-neutral-400 mt-0.5">{row.status_customer}</div>
        </div>
      )
    },
    {
      key: "customer.nama",
      label: "Customer",
      sortable: true,
      filter: { type: "text" },
      render: (row) => (
        <div>
          <div className="font-medium text-neutral-900 dark:text-white">{row.customer?.nama}</div>
          <div className="text-xs text-neutral-500">{row.customer?.telepon}</div>
        </div>
      )
    },
    {
      key: "user.nama",
      label: "Sales",
      sortable: true,
      filter: { type: "text" },
      render: (row) => (
        <div>
          <div className="font-medium text-neutral-900 dark:text-white">{row.user?.nama}</div>
          <div className="text-xs text-neutral-500">{row.cabang?.nama}</div>
        </div>
      )
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
        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide ${FASE_COLOR[row.fase]}`}>
          {FASE_LABEL[row.fase] || '-'}
        </span>
      )
    },
    {
      key: "dibuat_tanggal",
      label: "Tanggal Lead",
      sortable: true,
      filter: { type: "date" },
      render: (row) => dayjs(row.dibuat_tanggal).format('DD MMM YYYY')
    },
    {
      key: "pengingat",
      label: "Reminder Berikutnya",
      render: (row) => {
        const reminder = row.pengingats?.[0];
        const reminderInfo = reminderStatus(reminder);
        return reminderInfo ? (
          <span className={`font-medium ${reminderInfo.late ? 'text-red-500' : 'text-orange-600 dark:text-orange-400'}`}>
            {reminderInfo.text}
            {reminderInfo.late && <span className="ml-1 text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full font-bold">Terlambat</span>}
          </span>
        ) : (
          <span className="text-neutral-400">-</span>
        );
      }
    }
  ], [leads, tableState.page, tableState.pageSize]);

  const actions = useMemo(() => [
    {
      label: "Lihat Detail",
      icon: FiEye,
      variant: "primary",
      onClick: (row) => {
        router.push(`/lead/${row.id}`);
      }
    }
  ], [router]);

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
          className={`bg-white dark:bg-neutral-900 rounded-2xl border p-5 shadow-sm cursor-pointer transition-all ${currentFaseFilter === '' ? 'border-orange-500 ring-1 ring-orange-500/30' : 'border-neutral-200/50 dark:border-neutral-800 hover:border-orange-300'}`}
          onClick={() => handleCardClick('')}
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
          className={`bg-white dark:bg-neutral-900 rounded-2xl border p-5 shadow-sm cursor-pointer transition-all ${currentFaseFilter === '1' ? 'border-blue-500 ring-1 ring-blue-500/30' : 'border-neutral-200/50 dark:border-neutral-800 hover:border-blue-300'}`}
          onClick={() => handleCardClick('1')}
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
          className={`bg-white dark:bg-neutral-900 rounded-2xl border p-5 shadow-sm cursor-pointer transition-all ${currentFaseFilter === '2' ? 'border-yellow-500 ring-1 ring-yellow-500/30' : 'border-neutral-200/50 dark:border-neutral-800 hover:border-yellow-300'}`}
          onClick={() => handleCardClick('2')}
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
          className={`bg-white dark:bg-neutral-900 rounded-2xl border p-5 shadow-sm cursor-pointer transition-all ${currentFaseFilter === '3' ? 'border-purple-500 ring-1 ring-purple-500/30' : 'border-neutral-200/50 dark:border-neutral-800 hover:border-purple-300'}`}
          onClick={() => handleCardClick('3')}
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

      {/* Reusable DataTable */}
      <DataTable
        columns={columns}
        data={leads}
        isLoading={isLoading}
        emptyIcon={FiTarget}
        emptyText="Belum ada Lead."
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
        searchPlaceholder="Cari nama customer, kode lead, HP..."
        // Filter
        columnFilters={tableState.columnFilters}
        onFilterChange={tableHandlers.onFilterChange}
        // Actions
        actions={actions}
      />

      {/* Info note */}
      <div className="flex items-start gap-2 text-xs text-neutral-500 dark:text-neutral-400 bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-xl p-3">
        <FiTarget className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
        <span>Daftar ini hanya menampilkan lead dengan status <strong>OPEN</strong>. Lead yang sudah DEAL dapat dilihat pada menu <strong>Deal</strong>, dan Lead yang LOST pada menu <strong>Lost</strong>.</span>
      </div>
    </div>
  );
}
