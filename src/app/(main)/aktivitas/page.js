"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { FiActivity, FiEye, FiClock, FiUser, FiMapPin } from "react-icons/fi";
import { useAuthStore } from "@/store/auth.store";
import { useUIStore } from "@/store/ui.store";
import dayjs from "dayjs";
import 'dayjs/locale/id';
import { DataTable } from "@/components/table";
import { useDataTable } from "@/hooks/useDataTable";

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

  const {
    tableState,
    tableHandlers,
    buildParams,
    applyPagination
  } = useDataTable({
    defaultSortField: "id",
    defaultSortOrder: "desc"
  });

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
      const params = buildParams();
      const res = await fetch(`/api/aktivitas?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        setActivities(json.data || []);
        if (json.pagination) {
          applyPagination(json.pagination);
        }
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
    const timer = setTimeout(() => {
      fetchActivities();
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

  const getBadgeColor = (warna) => {
    if (!warna) return "bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300";
    if (warna.startsWith("bg-")) return warna;
    
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

  const filterHasilOptions = useMemo(() => {
    return hasilList.map(h => ({ value: String(h.id), label: h.nama }));
  }, [hasilList]);

  const filterCabangOptions = useMemo(() => {
    return cabangs.map(c => ({ value: String(c.id), label: c.nama }));
  }, [cabangs]);

  const filterSalesOptions = useMemo(() => {
    return users.map(u => ({ value: String(u.id), label: u.nama }));
  }, [users]);

  const columns = useMemo(() => [
    {
      key: "dibuat_tanggal",
      label: "Waktu & Tanggal",
      sortable: true,
      filter: { type: "date" },
      render: (row) => (
        <div className="flex items-center gap-1.5 text-neutral-500 font-normal">
          <FiClock className="w-3.5 h-3.5 text-orange-500" />
          <span>{dayjs(row.dibuat_tanggal).format("DD MMM YYYY, HH:mm")}</span>
        </div>
      )
    },
    {
      key: "user_id",
      label: "Sales PIC",
      sortable: true,
      filter: isAdminOrTop || isBranchManager ? { type: "select", options: filterSalesOptions } : undefined,
      render: (row) => (
        <div className="flex items-center gap-1.5">
          <FiUser className="w-3.5 h-3.5 text-neutral-400" />
          <span className="font-semibold text-neutral-800 dark:text-neutral-200">{row.dibuat_oleh}</span>
        </div>
      )
    },
    {
      key: "cabang_id",
      label: "Cabang",
      sortable: true,
      filter: isAdminOrTop ? { type: "select", options: filterCabangOptions } : undefined,
      render: (row) => (
        <div className="flex items-center gap-1">
          <FiMapPin className="w-3 h-3" />
          <span>{row.lead?.cabang?.nama}</span>
        </div>
      )
    },
    {
      key: "lead.customer.nama",
      label: "Customer (Lead No)",
      sortable: true,
      filter: { type: "text" },
      render: (row) => (
        <div>
          <p className="font-semibold text-neutral-900 dark:text-white">
            {row.lead?.customer?.nama}
          </p>
          <p className="text-[10px] font-mono text-neutral-400 mt-0.5">
            {row.lead?.nomor}
          </p>
        </div>
      )
    },
    {
      key: "hasil_interaksi_id",
      label: "Hasil Interaksi",
      sortable: true,
      filter: { type: "select", options: filterHasilOptions },
      render: (row) => {
        const badgeColor = getBadgeColor(row.hasil_interaksi_rel?.warna || row.hasil_interaksi);
        return (
          <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${badgeColor}`}>
            {row.hasil_interaksi}
          </span>
        );
      }
    },
    {
      key: "catatan",
      label: "Catatan Follow Up",
      sortable: true,
      filter: { type: "text" },
      render: (row) => (
        <span className="max-w-xs break-words text-neutral-700 dark:text-neutral-300 font-medium block">
          {row.catatan}
        </span>
      )
    }
  ], [activities, filterHasilOptions, filterCabangOptions, filterSalesOptions, isAdminOrTop, isBranchManager]);

  const actions = useMemo(() => [
    {
      label: "Detail",
      icon: FiEye,
      variant: "primary",
      onClick: (row) => {
        if (row.lead?.id) {
          window.location.href = `/lead/${row.lead.id}`;
        }
      }
    }
  ], []);

  return (
    <div className="space-y-6">
      <DataTable
        columns={columns}
        data={activities}
        isLoading={isLoading}
        emptyIcon={FiActivity}
        emptyText="Belum ada aktivitas prospek."
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
        searchPlaceholder="Cari catatan atau nama customer..."
        // Filter
        columnFilters={tableState.columnFilters}
        onFilterChange={tableHandlers.onFilterChange}
        // Actions
        actions={actions}
      />
    </div>
  );
}
