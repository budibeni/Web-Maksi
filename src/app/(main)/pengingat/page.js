"use client";

import { useState, useEffect, useMemo } from "react";
import { 
  FiBell, FiCheckCircle, FiAlertCircle,
  FiClock, FiCalendar, FiInfo, FiPhoneCall
} from "react-icons/fi";
import { useAuthStore } from "@/store/auth.store";
import { useUIStore } from "@/store/ui.store";
import dayjs from "dayjs";
import 'dayjs/locale/id';
import { DataTable } from "@/components/table";
import { useDataTable } from "@/hooks/useDataTable";

dayjs.locale('id');

const FASE_LABEL = { 1: 'Lead Baru', 2: 'Follow Up', 3: 'Penawaran' };
const STATUS_LABEL = { 1: 'OPEN', 2: 'DEAL', 3: 'LOST' };

export default function PengingatPage() {
  const user = useAuthStore((state) => state.user);
  const { showToast } = useUIStore();

  const [reminders, setReminders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [summary, setSummary] = useState({ totalHariIni: 0, totalTerlambat: 0, totalBesok: 0, totalSelesaiHariIni: 0 });

  const {
    tableState,
    tableHandlers,
    buildParams,
    applyPagination
  } = useDataTable({
    defaultSortField: "tanggal_pengingat",
    defaultSortOrder: "asc"
  });

  // Periode filter state (terpisah, dikirim sebagai custom param)
  const [periode, setPeriode] = useState("");

  // Master lists for filters
  const [cabangs, setCabangs] = useState([]);
  const [users, setUsers] = useState([]);

  // Check roles
  const isAdminOrTop = user?.role?.nama === "Administrator" || user?.role?.nama === "Top Management";
  const isBranchManager = user?.role?.nama === "Branch Manager";

  useEffect(() => {
    // Fetch master cabang
    fetch("/api/master/cabang")
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setCabangs(d.data || []);
      });

    // Fetch master user
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
  }, [isBranchManager, user]);

  const fetchReminders = async () => {
    setIsLoading(true);
    try {
      const params = buildParams(periode ? { periode } : {});
      const res = await fetch(`/api/pengingat?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        setReminders(json.data || []);
        setSummary(json.summary || { totalHariIni: 0, totalTerlambat: 0, totalBesok: 0, totalSelesaiHariIni: 0 });
        if (json.pagination) {
          applyPagination(json.pagination);
        }
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
    const timer = setTimeout(() => {
      fetchReminders();
    }, 300);
    return () => clearTimeout(timer);
  }, [
    tableState.searchValue,
    tableState.page,
    tableState.pageSize,
    tableState.sortField,
    tableState.sortOrder,
    tableState.columnFilters,
    periode
  ]);

  const getPriorityInfo = (rem) => {
    if (rem.status === "SELESAI") {
      return {
        label: "Selesai",
        colorClass: "text-green-600 bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800",
        icon: <FiCheckCircle className="w-3.5 h-3.5 text-green-600" />
      };
    }

    const targetTime = dayjs(rem.tanggal_pengingat);
    const startOfToday = dayjs().startOf('day');
    const endOfToday = dayjs().endOf('day');
    const startOfTomorrow = dayjs().add(1, 'day').startOf('day');
    const endOfTomorrow = dayjs().add(1, 'day').endOf('day');

    if (targetTime.isBefore(startOfToday)) {
      return {
        label: "Terlambat",
        colorClass: "text-red-600 bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800",
        icon: <FiClock className="w-3.5 h-3.5 text-red-600 animate-pulse" />
      };
    } else if (targetTime.isAfter(startOfToday) && targetTime.isBefore(endOfToday)) {
      return {
        label: "Hari Ini",
        colorClass: "text-orange-600 bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-800",
        icon: <FiClock className="w-3.5 h-3.5 text-orange-600" />
      };
    } else if (targetTime.isAfter(startOfTomorrow) && targetTime.isBefore(endOfTomorrow)) {
      return {
        label: "Besok",
        colorClass: "text-blue-600 bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800",
        icon: <FiClock className="w-3.5 h-3.5 text-blue-600" />
      };
    } else {
      return {
        label: "Lainnya",
        colorClass: "text-neutral-500 bg-neutral-50 dark:bg-neutral-800/40 border-neutral-200 dark:border-neutral-800",
        icon: <FiClock className="w-3.5 h-3.5 text-neutral-500" />
      };
    }
  };

  const getStatusLeadBadge = (status) => {
    switch (status) {
      case 2:
        return "bg-green-100 text-green-800 dark:bg-green-950/40 dark:text-green-400 border border-green-200 dark:border-green-800";
      case 3:
        return "bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400 border border-red-200 dark:border-red-800";
      default:
        return "bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400 border border-amber-200 dark:border-amber-800";
    }
  };

  const filterCabangOptions = useMemo(() => {
    return cabangs.map(c => ({ value: String(c.id), label: c.nama }));
  }, [cabangs]);

  const filterSalesOptions = useMemo(() => {
    return users.map(u => ({ value: String(u.id), label: u.nama }));
  }, [users]);

  const columns = useMemo(() => [
    {
      key: "status",
      label: "Prioritas",
      sortable: true,
      filter: {
        type: "select",
        options: [
          { value: "AKTIF", label: "Aktif" },
          { value: "SELESAI", label: "Selesai" }
        ]
      },
      render: (row) => {
        const prio = getPriorityInfo(row);
        return (
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${prio.colorClass}`}>
            {prio.icon}
            {prio.label}
          </span>
        );
      }
    },
    {
      key: "tanggal_pengingat",
      label: "Jam Reminder",
      sortable: true,
      filter: { type: "date" },
      render: (row) => {
        const reminderTime = dayjs(row.tanggal_pengingat);
        return (
          <div>
            <div className="font-bold text-neutral-800 dark:text-neutral-100 text-xs">
              {reminderTime.format("HH:mm")}
            </div>
            <div className="text-[10px] text-neutral-400 dark:text-neutral-500 font-normal mt-0.5">
              {reminderTime.format("DD MMM YYYY")}
            </div>
          </div>
        );
      }
    },
    {
      key: "lead.customer.nama",
      label: "Customer / Perusahaan",
      sortable: true,
      filter: { type: "text" },
      render: (row) => (
        <span className="font-bold text-neutral-900 dark:text-white">
          {row.lead?.customer?.nama}
        </span>
      )
    },
    {
      key: "sales_id",
      label: "Sales",
      sortable: true,
      filter: isAdminOrTop || isBranchManager ? { type: "select", options: filterSalesOptions } : undefined,
      render: (row) => row.lead?.user?.nama
    },
    {
      key: "catatan",
      label: "Reminder",
      sortable: true,
      filter: { type: "text" },
      render: (row) => row.catatan || <span className="text-neutral-400 italic font-normal">Tanpa catatan</span>
    },
    {
      key: "lead.status",
      label: "Status Lead",
      sortable: true,
      render: (row) => (
        <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${getStatusLeadBadge(row.lead?.status)}`}>
          {STATUS_LABEL[row.lead?.status] || 'OPEN'}
        </span>
      )
    },
    {
      key: "lead.fase",
      label: "Fase",
      sortable: true,
      render: (row) => FASE_LABEL[row.lead?.fase] || 'Lead Baru'
    }
  ], [reminders, filterSalesOptions, isAdminOrTop, isBranchManager]);

  const actions = useMemo(() => [
    {
      label: "Follow Up",
      icon: FiPhoneCall,
      variant: "warning",
      onClick: (row) => {
        if (row.lead?.id) {
          window.location.href = `/lead/${row.lead.id}`;
        }
      }
    }
  ], []);

  const handleCardClick = (periodValue) => {
    setPeriode(periodValue);
    tableHandlers.onPageChange(1);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* Card 1: Hari Ini */}
        <div 
          onClick={() => handleCardClick("hari_ini")}
          className="bg-white dark:bg-neutral-900 border border-neutral-200/50 dark:border-neutral-800 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all cursor-pointer flex items-center gap-4 relative overflow-hidden group"
        >
          <div className="p-3 bg-orange-100 dark:bg-orange-950/30 rounded-2xl group-hover:scale-110 transition-transform">
            <FiClock className="w-6 h-6 text-orange-500" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Hari Ini</span>
            <h2 className="text-2xl font-black text-neutral-900 dark:text-white mt-0.5">{summary.totalHariIni}</h2>
            <p className="text-[9px] text-neutral-500 dark:text-neutral-400">Belum dikerjakan</p>
          </div>
        </div>

        {/* Card 2: Terlambat */}
        <div 
          onClick={() => handleCardClick("terlambat")}
          className="bg-white dark:bg-neutral-900 border border-neutral-200/50 dark:border-neutral-800 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all cursor-pointer flex items-center gap-4 relative overflow-hidden group"
        >
          <div className="p-3 bg-red-100 dark:bg-red-950/30 rounded-2xl group-hover:scale-110 transition-transform">
            <FiAlertCircle className="w-6 h-6 text-red-600" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Terlambat</span>
            <h2 className="text-2xl font-black text-neutral-900 dark:text-white mt-0.5">{summary.totalTerlambat}</h2>
            <p className="text-[9px] text-neutral-500 dark:text-neutral-400">Lewat jadwal</p>
          </div>
        </div>

        {/* Card 3: Besok */}
        <div 
          onClick={() => handleCardClick("besok")}
          className="bg-white dark:bg-neutral-900 border border-neutral-200/50 dark:border-neutral-800 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all cursor-pointer flex items-center gap-4 relative overflow-hidden group"
        >
          <div className="p-3 bg-blue-100 dark:bg-blue-950/30 rounded-2xl group-hover:scale-110 transition-transform">
            <FiCalendar className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Besok</span>
            <h2 className="text-2xl font-black text-neutral-900 dark:text-white mt-0.5">{summary.totalBesok}</h2>
            <p className="text-[9px] text-neutral-500 dark:text-neutral-400">Akan datang</p>
          </div>
        </div>

        {/* Card 4: Selesai Hari Ini */}
        <div 
          onClick={() => handleCardClick("selesai_hari_ini")}
          className="bg-white dark:bg-neutral-900 border border-neutral-200/50 dark:border-neutral-800 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all cursor-pointer flex items-center gap-4 relative overflow-hidden group"
        >
          <div className="p-3 bg-green-100 dark:bg-green-950/30 rounded-2xl group-hover:scale-110 transition-transform">
            <FiCheckCircle className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Selesai Hari Ini</span>
            <h2 className="text-2xl font-black text-neutral-900 dark:text-white mt-0.5">{summary.totalSelesaiHariIni}</h2>
            <p className="text-[9px] text-neutral-500 dark:text-neutral-400">Selesai</p>
          </div>
        </div>
      </div>

      {/* Reusable DataTable */}
      <DataTable
        columns={columns}
        data={reminders}
        isLoading={isLoading}
        emptyIcon={FiBell}
        emptyText="Tidak ada jadwal pengingat ditemukan."
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
        searchPlaceholder="Cari nama customer / perusahaan..."
        // Filter
        columnFilters={tableState.columnFilters}
        onFilterChange={tableHandlers.onFilterChange}
        // Actions
        actions={actions}
      />

      {/* Info Notice Box */}
      <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/50 rounded-2xl p-4 flex items-start gap-3 text-xs text-blue-700 dark:text-blue-400">
        <FiInfo className="w-5 h-5 flex-shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold">Informasi Pengingat:</p>
          <ul className="list-disc pl-4 space-y-0.5 font-medium">
            <li>Reminder akan otomatis selesai setelah Follow Up berikutnya berhasil disimpan.</li>
            <li>Reminder yang terlambat tetap muncul sampai Follow Up dilakukan.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
