"use client";

import { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { FiPlus, FiEdit2, FiTrash2, FiX, FiDownload, FiUser, FiPhone, FiEye } from "react-icons/fi";
import { exportToExcel } from "@/lib/excel";
import { useUIStore } from "@/store/ui.store";
import { useAuthStore } from "@/store/auth.store";
import dayjs from "dayjs";
import { DataTable } from "@/components/table";
import { useDataTable } from "@/hooks/useDataTable";

export default function CustomerPage() {
  const currentUser = useAuthStore(state => state.user);
  const role = (typeof currentUser?.role === 'object' ? currentUser.role.nama : currentUser?.role || "").toLowerCase();
  const isTopManagement = role === "top management";
  const canEditCustomer = !isTopManagement;
  const canDeleteCustomer = role === 'administrator' || role === 'branch manager';

  const [customers, setCustomers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const {
    tableState,
    tableHandlers,
    buildParams,
    applyPagination,
    clearAllFilters,
  } = useDataTable({
    defaultSortField: "id",
    defaultSortOrder: "desc",
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({ id: null, nama: "", telepon: "", alamat: "", catatan: "" });
  
  const [mounted, setMounted] = useState(false);
  const { showToast, showConfirm } = useUIStore();

  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchCustomers = async () => {
    setIsLoading(true);
    try {
      const params = buildParams();
      const res = await fetch(`/api/customer?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        setCustomers(json.data);
        if (json.pagination) {
          applyPagination(json.pagination);
        }
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCustomers();
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

  const handleOpenModal = (customer = null) => {
    if (customer) {
      setFormData({
        id: customer.id,
        nama: customer.nama,
        telepon: customer.telepon,
        alamat: customer.alamat || "",
        catatan: customer.catatan || ""
      });
    } else {
      setFormData({ id: null, nama: "", telepon: "", alamat: "", catatan: "" });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const url = formData.id ? `/api/customer/${formData.id}` : "/api/customer";
      const method = formData.id ? "PUT" : "POST";
      
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nama: formData.nama,
          telepon: formData.telepon,
          alamat: formData.alamat,
          catatan: formData.catatan
        })
      });
      
      const json = await res.json();
      
      if (res.ok && json.success) {
        setIsModalOpen(false);
        fetchCustomers();
        showToast(json.message, "success");
      } else {
        showToast(json.error ? `Error: ${json.error}` : (json.message || "Gagal menyimpan data"), "error");
      }
    } catch (error) {
      console.error(error);
      showToast("Terjadi kesalahan sistem", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = (id) => {
    showConfirm(
      "Konfirmasi Hapus",
      "Apakah Anda yakin ingin menghapus data Customer ini? Data tidak dapat dihapus jika sudah berelasi dengan transaksi.", 
      async () => {
      try {
        const res = await fetch(`/api/customer/${id}`, { method: "DELETE" });
        const json = await res.json();
        
        if (res.ok && json.success) {
          fetchCustomers();
          showToast(json.message, "success");
        } else {
          showToast(json.message || "Gagal menghapus data", "error");
        }
      } catch (error) {
        console.error(error);
        showToast("Terjadi kesalahan sistem", "error");
      }
    });
  };

  const handleExport = async () => {
    try {
      const res = await fetch(`/api/customer?limit=1000`);
      const json = await res.json();
      if (json.success) {
        const exportData = json.data.map(c => ({
          NAMA: c.nama,
          TELEPON: c.telepon,
          ALAMAT: c.alamat || "-",
          CATATAN: c.catatan || "-",
          TERDAFTAR: dayjs(c.dibuat_tanggal).format("DD/MM/YYYY")
        }));
        exportToExcel(exportData, "daftar_customer.xlsx");
      }
    } catch (error) {
      console.error(error);
    }
  };

  const formatWhatsAppUrl = (phone) => {
    if (!phone) return '#';
    let cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.startsWith('0')) {
      cleanPhone = '62' + cleanPhone.substring(1);
    }
    return `https://wa.me/${cleanPhone}`;
  };

  // Definisi kolom DataTable
  const columns = useMemo(() => [
    {
      key: "id",
      label: "No",
      sortable: true,
      width: 80,
      render: (row) => {
        const idx = customers.findIndex(c => c.id === row.id);
        return idx !== -1 ? (tableState.page - 1) * tableState.pageSize + idx + 1 : "—";
      }
    },
    {
      key: "nama",
      label: "Nama",
      sortable: true,
      filter: { type: "text" },
      render: (row) => (
        <div className="flex items-center">
          <div className="h-10 w-10 flex-shrink-0 rounded-full bg-gradient-to-br from-orange-100 to-orange-200 dark:from-orange-900/40 dark:to-orange-800/40 flex items-center justify-center">
            <FiUser className="h-5 w-5 text-orange-600 dark:text-orange-500" />
          </div>
          <div className="ml-4">
            <div className="text-sm font-medium text-neutral-900 dark:text-white">
              {row.nama}
            </div>
          </div>
        </div>
      )
    },
    {
      key: "telepon",
      label: "Telepon",
      sortable: true,
      filter: { type: "text" },
      render: (row) => (
        <a 
          href={formatWhatsAppUrl(row.telepon)} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-sm text-orange-600 hover:text-orange-700 dark:text-orange-500 dark:hover:text-orange-400 font-medium flex items-center gap-1.5 transition-colors"
          title="Chat via WhatsApp"
        >
          <FiPhone className="w-4 h-4" />
          {row.telepon}
        </a>
      )
    },
    {
      key: "alamat",
      label: "Alamat",
      sortable: true,
      filter: { type: "text" },
      render: (row) => (
        <div className="text-sm text-neutral-600 dark:text-neutral-300 max-w-xs truncate" title={row.alamat}>
          {row.alamat || "—"}
        </div>
      )
    },
    {
      key: "catatan",
      label: "Catatan",
      sortable: true,
      filter: { type: "text" },
      render: (row) => (
        <div className="text-sm text-neutral-600 dark:text-neutral-300 max-w-xs truncate" title={row.catatan}>
          {row.catatan || "—"}
        </div>
      )
    },
    {
      key: "dibuat_tanggal",
      label: "Dibuat Oleh",
      sortable: true,
      filter: { type: "date" },
      render: (row) => row.dibuat_oleh ? (
        <div>
          {row.dibuat_oleh}
          <br/>
          <span className="text-[10px] opacity-70">
            {dayjs(row.dibuat_tanggal).format('DD/MM/YY HH:mm')}
          </span>
        </div>
      ) : '—'
    },
    {
      key: "diubah_tanggal",
      label: "Diubah Oleh",
      sortable: true,
      filter: { type: "date" },
      render: (row) => row.diubah_oleh ? (
        <div>
          {row.diubah_oleh}
          <br/>
          <span className="text-[10px] opacity-70">
            {row.diubah_tanggal ? dayjs(row.diubah_tanggal).format('DD/MM/YY HH:mm') : '—'}
          </span>
        </div>
      ) : '—'
    }
  ], [customers, tableState.page, tableState.pageSize]);

  const actions = useMemo(() => [
    {
      label: "Lihat Detail",
      icon: FiEye,
      variant: "default",
      onClick: (row) => window.location.href = `/customer/${row.id}`
    },
    {
      label: "Edit",
      icon: FiEdit2,
      variant: "warning",
      onClick: (row) => handleOpenModal(row),
      show: () => canEditCustomer
    },
    {
      label: "Hapus",
      icon: FiTrash2,
      variant: "danger",
      onClick: (row) => handleDelete(row.id),
      show: () => canDeleteCustomer
    }
  ], [canEditCustomer, canDeleteCustomer]);

  return (
    <div className="space-y-6">
      {mounted && document.getElementById("header-actions-portal") && createPortal(
          <>
            {!isTopManagement && (
              <button 
                onClick={() => handleOpenModal()}
                className="bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-200 text-white dark:text-neutral-900 px-4 py-1.5 rounded-full font-medium flex items-center gap-2 transition-colors shadow-sm text-sm mr-1"
              >
                <FiPlus className="w-4 h-4" />
                <span className="hidden sm:inline">Tambah Customer</span>
              </button>
            )}
            <button 
              className="p-2 text-neutral-500 hover:text-neutral-900 bg-white hover:bg-neutral-100 dark:bg-neutral-900 dark:text-neutral-400 dark:hover:text-white dark:hover:bg-neutral-800 rounded-full transition-colors border border-neutral-200 dark:border-neutral-800"
              title="Export ke Excel"
              onClick={handleExport}
            >
              <FiDownload className="w-4 h-4" />
            </button>
          </>,
          document.getElementById("header-actions-portal")
        )}

      <DataTable
        columns={columns}
        data={customers}
        isLoading={isLoading}
        emptyText="Tidak ada data customer yang ditemukan."
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
        searchPlaceholder="Cari nama atau telepon..."
        // Filter
        columnFilters={tableState.columnFilters}
        onFilterChange={tableHandlers.onFilterChange}
        onResetFilters={() => { clearAllFilters(); tableHandlers.onSearchChange(""); }}
        // Actions
        actions={actions}
      />

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95">
            <div className="px-6 py-4 border-b border-neutral-100 dark:border-neutral-800 flex justify-between items-center">
              <h3 className="text-lg font-bold text-neutral-900 dark:text-white">
                {formData.id ? `Edit Customer` : `Tambah Customer`}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-neutral-400 hover:text-neutral-600 transition-colors">
                <FiX className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Nama Customer *</label>
                  <input 
                    type="text" 
                    required 
                    maxLength={150}
                    className="w-full px-4 py-2 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all dark:text-white"
                    value={formData.nama}
                    onChange={(e) => setFormData({...formData, nama: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Nomor Telepon / HP *</label>
                  <input 
                    type="text" 
                    required 
                    maxLength={20}
                    className="w-full px-4 py-2 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all dark:text-white"
                    value={formData.telepon}
                    onChange={(e) => setFormData({...formData, telepon: e.target.value.replace(/[^0-9+]/g, "")})}
                    placeholder="Contoh: 081234567890"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Alamat</label>
                  <textarea 
                    className="w-full px-4 py-2 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all dark:text-white resize-none h-24"
                    value={formData.alamat}
                    onChange={(e) => setFormData({...formData, alamat: e.target.value})}
                  ></textarea>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Catatan Tambahan</label>
                  <textarea 
                    className="w-full px-4 py-2 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all dark:text-white resize-none h-20"
                    value={formData.catatan}
                    onChange={(e) => setFormData({...formData, catatan: e.target.value})}
                  ></textarea>
                </div>
              </div>
              
              <div className="px-6 py-4 border-t border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50 flex justify-end gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-neutral-600 dark:text-neutral-400 font-medium hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl transition-colors"
                >
                  Batal
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="px-6 py-2 bg-orange-600 hover:bg-orange-700 text-white font-medium rounded-xl transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : null}
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
