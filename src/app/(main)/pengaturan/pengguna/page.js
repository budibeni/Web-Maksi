"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { 
  FiPlus, FiEdit2, FiTrash2, FiUpload, 
  FiUser, FiMail, FiPhone, FiMapPin, FiShield
} from "react-icons/fi";
import { exportToExcel, parseExcel } from "@/lib/excel";
import { useUIStore } from "@/store/ui.store";
import { DataTable } from "@/components/table";
import { useDataTable } from "@/hooks/useDataTable";

export default function PenggunaPage() {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [cabangs, setCabangs] = useState([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const fileInputRef = useRef(null);
  const { showToast, showConfirm } = useUIStore();

  const {
    tableState,
    tableHandlers,
    buildParams,
    applyPagination,
    clearAllFilters
  } = useDataTable({
    defaultSortField: "nama",
    defaultSortOrder: "asc"
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchFiltersData = async () => {
    try {
      const [resRoles, resCabangs] = await Promise.all([
        fetch("/api/master/role"),
        fetch("/api/master/cabang")
      ]);
      const [jsonRoles, jsonCabangs] = await Promise.all([
        resRoles.json(),
        resCabangs.json()
      ]);
      if (jsonRoles.success) setRoles(jsonRoles.data);
      if (jsonCabangs.success) setCabangs(jsonCabangs.data);
    } catch (error) {
      console.error("Gagal memuat filter role/cabang", error);
    }
  };

  useEffect(() => {
    fetchFiltersData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const params = buildParams();
      const res = await fetch(`/api/master/user?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        setUsers(json.data || []);
        if (json.pagination) applyPagination(json.pagination);
      }
    } catch (error) {
      console.error(error);
      showToast("Gagal mengambil data pengguna.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => fetchData(), 300);
    return () => clearTimeout(timer);
  }, [
    tableState.searchValue,
    tableState.page,
    tableState.pageSize,
    tableState.sortField,
    tableState.sortOrder,
    tableState.columnFilters
  ]);

  const handleDelete = (id) => {
    showConfirm(
      "Konfirmasi Hapus",
      "Apakah Anda yakin ingin menghapus pengguna ini? Pengguna yang sudah memiliki transaksi tidak dapat dihapus, melainkan dinonaktifkan.", 
      async () => {
        try {
          const res = await fetch(`/api/master/user/${id}`, { method: "DELETE" });
          const json = await res.json();
          
          if (res.ok && json.success) {
            fetchData();
            showToast(json.message || "Pengguna berhasil dihapus.", "success");
          } else {
            showToast(json.message || "Gagal menghapus pengguna.", "error");
          }
        } catch (error) {
          console.error(error);
          showToast("Terjadi kesalahan sistem", "error");
        }
      }
    );
  };

  const handleExport = async (type) => {
    try {
      showToast("Sedang menyiapkan file export...", "info");
      let dataToExport = [];
      if (type === "page") {
        dataToExport = users;
      } else {
        const params = buildParams({ export: "true" });
        const res = await fetch(`/api/master/user?${params.toString()}`);
        const json = await res.json();
        if (json.success) {
          dataToExport = json.data;
        } else {
          showToast("Gagal mengambil data untuk export", "error");
          return;
        }
      }
      const exportData = dataToExport.map(u => ({
        NAMA: u.nama,
        EMAIL: u.email,
        USERNAME: u.username,
        TELEPON: u.telepon || "",
        ROLE: u.role?.nama || "",
        CABANG: u.cabang?.nama || "",
        STATUS: u.aktif === 1 ? "Aktif" : "Nonaktif"
      }));
      exportToExcel(exportData, "master_pengguna.xlsx");
      showToast("Data berhasil diexport.", "success");
    } catch (error) {
      console.error(error);
      showToast("Terjadi kesalahan saat export", "error");
    }
  };

  const handleImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    try {
      setIsLoading(true);
      const data = await parseExcel(file);
      
      let successCount = 0;
      let errorCount = 0;

      for (const row of data) {
        if (!row.NAMA || !row.EMAIL || !row.USERNAME || !row.ROLE_ID || !row.CABANG_ID) continue;

        const payload = {
          nama: row.NAMA,
          email: row.EMAIL,
          username: row.USERNAME,
          password: "password123", // default password for imported users
          telepon: row.TELEPON || "",
          role_id: row.ROLE_ID,
          cabang_id: row.CABANG_ID,
          aktif: row.STATUS?.toLowerCase() === 'nonaktif' ? 0 : 1
        };

        const res = await fetch("/api/master/user", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });

        if (res.ok) successCount++;
        else errorCount++;
      }

      fetchData();
      showToast(`Import Selesai. Berhasil: ${successCount}, Gagal: ${errorCount}`, successCount > 0 ? "success" : "error");
    } catch (err) {
      console.error(err);
      showToast("Gagal memproses file import", "error");
    } finally {
      setIsLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const columns = useMemo(() => [
    {
      key: "id",
      label: "No",
      sortable: true,
      width: 60,
      render: (row) => {
        const idx = users.findIndex(u => u.id === row.id);
        return idx !== -1 ? (tableState.page - 1) * tableState.pageSize + idx + 1 : "—";
      }
    },
    {
      key: "nama",
      label: "Nama Lengkap",
      sortable: true,
      filter: { type: "text" },
      render: (row) => (
        <div className="flex items-center">
          <div className="h-8 w-8 rounded-full bg-orange-50 dark:bg-orange-950/40 flex items-center justify-center text-orange-600 dark:text-orange-500 font-black text-xs shrink-0">
            {row.nama.charAt(0).toUpperCase()}
          </div>
          <div className="ml-3">
            <p className="font-bold text-neutral-900 dark:text-white">{row.nama}</p>
            <p className="text-[10px] text-neutral-400 mt-0.5 flex items-center gap-1">
              <FiMail className="w-3 h-3 shrink-0" /> {row.email}
              {row.telepon && (
                <>
                  <span className="text-neutral-300 dark:text-neutral-700">•</span>
                  <FiPhone className="w-3 h-3 shrink-0" /> {row.telepon}
                </>
              )}
            </p>
          </div>
        </div>
      )
    },
    {
      key: "username",
      label: "Username",
      sortable: true,
      filter: { type: "text" },
      render: (row) => <span className="font-mono text-neutral-900 dark:text-neutral-200">{row.username}</span>
    },
    {
      key: "role.nama",
      label: "Role",
      sortable: true,
      filter: {
        type: "select",
        options: roles.map(r => ({ value: r.nama, label: r.nama }))
      },
      render: (row) => (
        <span className="flex items-center gap-1.5 font-semibold text-xs text-neutral-700 dark:text-neutral-300">
          <FiShield className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
          {row.role?.nama || "-"}
        </span>
      )
    },
    {
      key: "cabang.nama",
      label: "Cabang",
      sortable: true,
      filter: {
        type: "select",
        options: cabangs.map(c => ({ value: c.nama, label: c.nama }))
      },
      render: (row) => (
        <span className="flex items-center gap-1.5 font-semibold text-xs text-neutral-700 dark:text-neutral-300">
          <FiMapPin className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
          {row.cabang?.nama || "-"}
        </span>
      )
    },
    {
      key: "aktif",
      label: "Status",
      sortable: true,
      filter: {
        type: "select",
        options: [
          { value: "1", label: "Aktif" },
          { value: "0", label: "Nonaktif" }
        ]
      },
      render: (row) => (
        <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-black uppercase border ${
          row.aktif === 1 
            ? "bg-green-50 text-green-700 border-green-200 dark:bg-green-950/30 dark:text-green-400 dark:border-green-900/50" 
            : "bg-neutral-50 text-neutral-500 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:border-neutral-700/50"
        }`}>
          {row.aktif === 1 ? "Aktif" : "Nonaktif"}
        </span>
      )
    }
  ], [users, roles, cabangs, tableState.page, tableState.pageSize]);

  const actions = useMemo(() => [
    {
      label: "Edit",
      icon: FiEdit2,
      variant: "default",
      onClick: (row) => {
        window.location.href = `/pengaturan/pengguna/${row.id}`;
      }
    },
    {
      label: "Hapus",
      icon: FiTrash2,
      variant: "danger",
      onClick: (row) => handleDelete(row.id)
    }
  ], []);

  return (
    <div className="space-y-6">
      {mounted && document.getElementById("header-actions-portal") && createPortal(
        <>
          <Link 
            href="/pengaturan/pengguna/baru"
            className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-1.5 rounded-full font-medium flex items-center gap-2 transition-all active:scale-95 shadow-sm text-sm mr-1"
          >
            <FiPlus className="w-4 h-4" />
            <span className="hidden sm:inline">Tambah Pengguna</span>
          </Link>
          
          <input 
            type="file" 
            accept=".xlsx, .xls" 
            ref={fileInputRef} 
            className="hidden" 
            onChange={handleImport} 
          />
          
          <button 
            className="p-2 text-neutral-500 hover:text-neutral-900 bg-white hover:bg-neutral-100 dark:bg-neutral-900 dark:text-neutral-400 dark:hover:text-white dark:hover:bg-neutral-800 rounded-full transition-colors border border-neutral-200 dark:border-neutral-800"
            title="Import dari Excel"
            onClick={() => fileInputRef.current?.click()}
          >
            <FiUpload className="w-4 h-4" />
          </button>
        </>,
        document.getElementById("header-actions-portal")
      )}

      {/* Reusable DataTable */}
      <DataTable
        columns={columns}
        data={users}
        isLoading={isLoading}
        emptyIcon={FiUser}
        emptyText="Belum ada data Pengguna."
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
        searchPlaceholder="Cari nama, email, atau username..."
        // Filter
        columnFilters={tableState.columnFilters}
        onFilterChange={tableHandlers.onFilterChange}
        onResetFilters={() => { clearAllFilters(); tableHandlers.onSearchChange(""); }}
        // Export
        onExport={handleExport}
        // Actions
        actions={actions}
      />
    </div>
  );
}
