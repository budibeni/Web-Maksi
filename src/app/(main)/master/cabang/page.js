"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import { FiPlus, FiEdit2, FiTrash2, FiX, FiUpload, FiFileText, FiMapPin } from "react-icons/fi";
import { exportToExcel, parseExcel } from "@/lib/excel";
import { useUIStore } from "@/store/ui.store";
import { DataTable } from "@/components/table";
import { useDataTable } from "@/hooks/useDataTable";
import dayjs from "dayjs";

export default function CabangPage() {
  const [cabangs, setCabangs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isImporting, setIsImporting] = useState(false);
  const [mounted, setMounted] = useState(false);
  const fileInputRef = useRef(null);
  const { showToast, showConfirm } = useUIStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({ id: null, kode: "", nama: "", alamat: "", telepon: "", aktif: 1 });

  const {
    tableState,
    tableHandlers,
    buildParams,
    applyPagination,
    clearAllFilters
  } = useDataTable({
    defaultSortField: "id",
    defaultSortOrder: "desc"
  });

  useEffect(() => setMounted(true), []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const params = buildParams();
      const res = await fetch(`/api/master/cabang?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        setCabangs(json.data || []);
        if (json.pagination) applyPagination(json.pagination);
      }
    } catch (error) {
      console.error(error);
      showToast("Gagal mengambil data", "error");
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

  const handleOpenModal = (cabang = null) => {
    if (cabang) {
      setFormData({
        id: cabang.id, kode: cabang.kode, nama: cabang.nama,
        alamat: cabang.alamat || "", telepon: cabang.telepon || "", aktif: cabang.aktif
      });
    } else {
      setFormData({ id: null, kode: "", nama: "", alamat: "", telepon: "", aktif: 1 });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const url = formData.id ? `/api/master/cabang/${formData.id}` : "/api/master/cabang";
      const method = formData.id ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kode: formData.kode, nama: formData.nama,
          alamat: formData.alamat, telepon: formData.telepon,
          aktif: parseInt(formData.aktif)
        })
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setIsModalOpen(false);
        fetchData();
        showToast(json.message, "success");
      } else {
        showToast(json.message || "Gagal menyimpan data", "error");
      }
    } catch (error) {
      console.error(error);
      showToast("Terjadi kesalahan sistem", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = (id) => {
    showConfirm("Konfirmasi Hapus", "Apakah Anda yakin ingin menghapus data cabang ini?",
      async () => {
        try {
          const res = await fetch(`/api/master/cabang/${id}`, { method: "DELETE" });
          const json = await res.json();
          if (res.ok && json.success) {
            fetchData();
            showToast(json.message, "success");
          } else {
            showToast(json.message || "Gagal menghapus data", "error");
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
        dataToExport = cabangs;
      } else {
        const params = buildParams({ export: "true" });
        const res = await fetch(`/api/master/cabang?${params.toString()}`);
        const json = await res.json();
        if (json.success) {
          dataToExport = json.data;
        } else {
          showToast("Gagal mengambil data untuk export", "error");
          return;
        }
      }
      const exportData = dataToExport.map(c => ({
        KODE: c.kode,
        NAMA_CABANG: c.nama,
        ALAMAT: c.alamat || "",
        TELEPON: c.telepon || "",
        STATUS: c.aktif === 1 ? "Aktif" : "Nonaktif"
      }));
      exportToExcel(exportData, "master_cabang.xlsx");
      showToast("Data berhasil diexport.", "success");
    } catch (error) {
      console.error(error);
      showToast("Terjadi kesalahan saat export", "error");
    }
  };

  const handleDownloadTemplate = () => {
    const templateData = [
      { KODE: "C001", NAMA_CABANG: "Cabang Jakarta", ALAMAT: "Jl. Sudirman No. 1", TELEPON: "021-123456", STATUS: "Aktif" },
      { KODE: "C002", NAMA_CABANG: "Cabang Surabaya", ALAMAT: "Jl. Pemuda No. 2", TELEPON: "031-123456", STATUS: "Aktif" }
    ];
    exportToExcel(templateData, "template_master_cabang.xlsx");
  };

  const handleImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsImporting(true);
      const data = await parseExcel(file);
      let successCount = 0, errorCount = 0, errorMessages = [];
      for (let i = 0; i < data.length; i++) {
        const row = data[i];
        if (!row.KODE || !row.NAMA_CABANG) continue;
        const payload = {
          kode: row.KODE.toString(),
          nama: row.NAMA_CABANG.toString(),
          alamat: row.ALAMAT || "",
          telepon: row.TELEPON || "",
          aktif: row.STATUS?.toLowerCase() === 'nonaktif' ? 0 : 1
        };
        try {
          const res = await fetch("/api/master/cabang", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
          });
          if (res.ok) successCount++;
          else {
            errorCount++;
            const json = await res.json();
            errorMessages.push(`Baris ${i + 2} (${row.KODE}): ${json.message || 'Gagal tersimpan'}`);
          }
        } catch {
          errorCount++;
          errorMessages.push(`Baris ${i + 2} (${row.KODE}): Terjadi kesalahan koneksi`);
        }
      }
      fetchData();
      if (errorCount > 0) {
        const errorDetails = errorMessages.slice(0, 5).join('\n');
        const moreErrors = errorMessages.length > 5 ? `\n...dan ${errorMessages.length - 5} error lainnya.` : '';
        showConfirm("Import Selesai dengan Catatan",
          `Berhasil: ${successCount}\nGagal: ${errorCount}\n\nRincian Error:\n${errorDetails}${moreErrors}`,
          () => {}, null, "info");
      } else if (successCount > 0) {
        showToast(`Import Selesai. Berhasil: ${successCount}`, "success");
      } else {
        showToast(`Tidak ada data valid untuk diimport`, "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Gagal memproses file import", "error");
    } finally {
      setIsImporting(false);
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
        const idx = cabangs.findIndex(c => c.id === row.id);
        return idx !== -1 ? (tableState.page - 1) * tableState.pageSize + idx + 1 : "—";
      }
    },
    {
      key: "kode",
      label: "Kode",
      sortable: true,
      filter: { type: "text" },
      render: (row) => <span className="font-mono font-medium text-neutral-900 dark:text-white">{row.kode}</span>
    },
    {
      key: "nama",
      label: "Nama Cabang",
      sortable: true,
      filter: { type: "text" },
      render: (row) => <span className="font-medium text-neutral-900 dark:text-neutral-200">{row.nama}</span>
    },
    {
      key: "alamat",
      label: "Alamat",
      render: (row) => (
        <span className="text-sm text-neutral-600 dark:text-neutral-400 line-clamp-2">{row.alamat || '-'}</span>
      )
    },
    {
      key: "telepon",
      label: "Telepon",
      filter: { type: "text" },
      render: (row) => <span className="text-sm text-neutral-700 dark:text-neutral-300">{row.telepon || '-'}</span>
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
        <span className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${row.aktif === 1 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400'}`}>
          {row.aktif === 1 ? 'Aktif' : 'Nonaktif'}
        </span>
      )
    },
    {
      key: "dibuat_oleh",
      label: "Dibuat Oleh",
      render: (row) => row.dibuat_oleh ? (
        <div className="text-xs text-neutral-500">
          {row.dibuat_oleh}
          <div className="text-[10px] opacity-70">{dayjs(row.dibuat_tanggal).format('DD/MM/YY HH:mm')}</div>
        </div>
      ) : '-'
    },
    {
      key: "diubah_oleh",
      label: "Diubah Oleh",
      render: (row) => row.diubah_oleh ? (
        <div className="text-xs text-neutral-500">
          {row.diubah_oleh}
          <div className="text-[10px] opacity-70">{dayjs(row.diubah_tanggal).format('DD/MM/YY HH:mm')}</div>
        </div>
      ) : '-'
    }
  ], [cabangs, tableState.page, tableState.pageSize]);

  const actions = useMemo(() => [
    { label: "Edit", icon: FiEdit2, variant: "default", onClick: (row) => handleOpenModal(row) },
    { label: "Hapus", icon: FiTrash2, variant: "danger", onClick: (row) => handleDelete(row.id) }
  ], []);

  return (
    <div className="space-y-6">
      {/* Portal: Header Actions */}
      {mounted && document.getElementById("header-actions-portal") && createPortal(
        <>
          <button
            onClick={() => handleOpenModal()}
            className="bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-200 text-white dark:text-neutral-900 px-4 py-1.5 rounded-full font-medium flex items-center gap-2 transition-colors shadow-sm text-sm mr-1"
          >
            <FiPlus className="w-4 h-4" />
            <span className="hidden sm:inline">Tambah Cabang</span>
          </button>

          <input type="file" accept=".xlsx, .xls" ref={fileInputRef} className="hidden" onChange={handleImport} />

          <button
            className="p-2 text-neutral-500 hover:text-neutral-900 bg-white hover:bg-neutral-100 dark:bg-neutral-900 dark:text-neutral-400 dark:hover:text-white dark:hover:bg-neutral-800 rounded-full transition-colors border border-neutral-200 dark:border-neutral-800"
            title="Download Template Import"
            onClick={handleDownloadTemplate}
          >
            <FiFileText className="w-4 h-4" />
          </button>
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

      {/* DataTable */}
      <DataTable
        columns={columns}
        data={cabangs}
        isLoading={isLoading}
        emptyIcon={FiMapPin}
        emptyText="Belum ada data Cabang."
        rowKey="id"
        page={tableState.page}
        pageSize={tableState.pageSize}
        totalData={tableState.totalData}
        totalPages={tableState.totalPages}
        onPageChange={tableHandlers.onPageChange}
        onLimitChange={tableHandlers.onLimitChange}
        sortField={tableState.sortField}
        sortOrder={tableState.sortOrder}
        onSortChange={tableHandlers.onSortChange}
        searchValue={tableState.searchValue}
        onSearchChange={tableHandlers.onSearchChange}
        searchPlaceholder="Cari kode, nama, alamat, atau telepon cabang..."
        columnFilters={tableState.columnFilters}
        onFilterChange={tableHandlers.onFilterChange}
        onResetFilters={() => { clearAllFilters(); tableHandlers.onSearchChange(""); }}
        onExport={handleExport}
        actions={actions}
      />

      {/* Modal Tambah / Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95">
            <div className="px-6 py-4 border-b border-neutral-100 dark:border-neutral-800 flex justify-between items-center">
              <h3 className="text-lg font-bold text-neutral-900 dark:text-white">
                {formData.id ? "Edit Cabang" : "Tambah Cabang"}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-neutral-400 hover:text-neutral-600 transition-colors">
                <FiX className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Kode Cabang *</label>
                  <input
                    type="text" required maxLength={20}
                    className="w-full px-4 py-2 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all dark:text-white"
                    value={formData.kode}
                    onChange={(e) => setFormData({ ...formData, kode: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Nama Cabang *</label>
                  <input
                    type="text" required maxLength={150}
                    className="w-full px-4 py-2 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all dark:text-white"
                    value={formData.nama}
                    onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Alamat</label>
                  <textarea
                    rows={3}
                    className="w-full px-4 py-2 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all dark:text-white resize-none"
                    value={formData.alamat}
                    onChange={(e) => setFormData({ ...formData, alamat: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Telepon</label>
                  <input
                    type="text" maxLength={30}
                    className="w-full px-4 py-2 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all dark:text-white"
                    value={formData.telepon}
                    onChange={(e) => setFormData({ ...formData, telepon: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">Status</label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="aktif" value={1} checked={formData.aktif === 1} onChange={() => setFormData({ ...formData, aktif: 1 })} className="text-orange-600 focus:ring-orange-500" />
                      <span className="text-sm dark:text-neutral-300">Aktif</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="aktif" value={0} checked={formData.aktif === 0} onChange={() => setFormData({ ...formData, aktif: 0 })} className="text-orange-600 focus:ring-orange-500" />
                      <span className="text-sm dark:text-neutral-300">Nonaktif</span>
                    </label>
                  </div>
                </div>
              </div>
              <div className="px-6 py-4 bg-neutral-50 dark:bg-neutral-950 border-t border-neutral-100 dark:border-neutral-800 flex justify-end gap-3 rounded-b-2xl">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-xl hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">
                  Batal
                </button>
                <button type="submit" disabled={isSubmitting} className="px-4 py-2 text-sm font-medium text-white bg-orange-600 rounded-xl hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm flex items-center gap-2">
                  {isSubmitting && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
                  Simpan Data
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Import Loading Overlay */}
      {isImporting && (
        <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white/80 dark:bg-neutral-900/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-lg font-semibold text-neutral-900 dark:text-white">Memproses Import Data...</p>
          <p className="text-sm text-neutral-500 mt-1">Mohon tunggu, jangan tutup atau refresh halaman ini.</p>
        </div>
      )}
    </div>
  );
}
