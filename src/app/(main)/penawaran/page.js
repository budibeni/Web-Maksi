"use client";

import { useState, useEffect, useMemo } from "react";
import { FiFileText, FiPrinter, FiEye } from "react-icons/fi";
import { useAuthStore } from "@/store/auth.store";
import { useUIStore } from "@/store/ui.store";
import PenawaranDetailModal from "../lead/[id]/components/PenawaranDetailModal";
import dayjs from "dayjs";
import 'dayjs/locale/id';
import { DataTable } from "@/components/table";
import { useDataTable } from "@/hooks/useDataTable";

dayjs.locale('id');

export default function DaftarPenawaranPage() {
  const user = useAuthStore((state) => state.user);
  const { showToast } = useUIStore();

  const [quotations, setQuotations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedQuotationId, setSelectedQuotationId] = useState(null);

  const {
    tableState,
    tableHandlers,
    buildParams,
    applyPagination,
    clearAllFilters,
  } = useDataTable({
    defaultSortField: "id",
    defaultSortOrder: "desc"
  });

  // Master lists for filters
  const [cabangs, setCabangs] = useState([]);
  const [users, setUsers] = useState([]);

  // Check roles
  const isAdminOrTop = user?.role?.nama === "Administrator" || user?.role?.nama === "Top Management";
  const isBranchManager = user?.role?.nama === "Branch Manager";

  useEffect(() => {
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
      const params = buildParams();
      const res = await fetch(`/api/penawaran?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        setQuotations(json.data || []);
        if (json.pagination) {
          applyPagination(json.pagination);
        }
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
    const timer = setTimeout(() => {
      fetchQuotations();
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

  const filterCabangOptions = useMemo(() => {
    return cabangs.map(c => ({ value: String(c.id), label: c.nama }));
  }, [cabangs]);

  const filterSalesOptions = useMemo(() => {
    return users.map(u => ({ value: String(u.id), label: u.nama }));
  }, [users]);

  const columns = useMemo(() => [
    {
      key: "id",
      label: "No",
      sortable: true,
      width: 80,
      render: (row) => {
        const idx = quotations.findIndex(q => q.id === row.id);
        return idx !== -1 ? (tableState.page - 1) * tableState.pageSize + idx + 1 : "—";
      }
    },
    {
      key: "nomor",
      label: "No Penawaran",
      sortable: true,
      filter: { type: "text" },
      render: (row) => <span className="font-mono font-medium text-neutral-900 dark:text-white">{row.nomor}</span>
    },
    {
      key: "versi",
      label: "Versi",
      sortable: true,
      render: (row) => <span className="font-bold text-neutral-800 dark:text-neutral-200">v{row.versi}</span>
    },
    {
      key: "customer_nama",
      label: "Customer",
      sortable: true,
      filter: { type: "text" },
      render: (row) => <span className="font-medium text-neutral-900 dark:text-white">{row.customer_nama}</span>
    },
    {
      key: "cabang_id",
      label: "Cabang",
      sortable: true,
      filter: isAdminOrTop ? { type: "select", options: filterCabangOptions } : undefined,
      render: (row) => row.cabang_nama
    },
    {
      key: "sales_id",
      label: "Sales PIC",
      sortable: true,
      filter: isAdminOrTop || isBranchManager ? { type: "select", options: filterSalesOptions } : undefined,
      render: (row) => row.sales_nama
    },
    {
      key: "grand_total",
      label: "Grand Total",
      sortable: true,
      filter: { type: "number" },
      render: (row) => (
        <div className="text-right font-bold text-neutral-900 dark:text-white">
          Rp {Number(row.grand_total).toLocaleString("id-ID")}
        </div>
      )
    },
    {
      key: "dibuat_tanggal",
      label: "Tanggal",
      sortable: true,
      filter: { type: "date" },
      render: (row) => dayjs(row.dibuat_tanggal).format("DD MMM YYYY")
    },
    {
      key: "status",
      label: "Status",
      sortable: true,
      render: (row) => {
        const isFinal = String(row.lead?.versi_penawaran_final_id) === String(row.id);
        const isDeal = row.lead?.status === 2;
        return isFinal ? (
          <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${isDeal ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"}`}>
            {isDeal ? "Disetujui (DEAL)" : "Disetujui (OPEN)"}
          </span>
        ) : (
          <span className="text-neutral-400 font-medium text-[10px]">—</span>
        );
      }
    }
  ], [quotations, tableState.page, tableState.pageSize, isAdminOrTop, isBranchManager, filterCabangOptions, filterSalesOptions]);

  const actions = useMemo(() => [
    {
      label: "Cetak",
      icon: FiPrinter,
      variant: "secondary",
      onClick: (row) => setSelectedQuotationId(row.id)
    },
    {
      label: "Lihat Prospek",
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
        data={quotations}
        isLoading={isLoading}
        emptyIcon={FiFileText}
        emptyText="Belum ada dokumen penawaran harga."
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
        searchPlaceholder="Cari nomor penawaran, customer, atau sales..."
        // Filter
        columnFilters={tableState.columnFilters}
        onFilterChange={tableHandlers.onFilterChange}
        onResetFilters={() => { clearAllFilters(); tableHandlers.onSearchChange(""); }}
        // Actions
        actions={actions}
      />

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
