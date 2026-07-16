"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import { FiPlus, FiEdit2, FiTrash2, FiX, FiUpload, FiFileText, FiActivity } from "react-icons/fi";
import { exportToExcel, parseExcel } from "@/lib/excel";
import { useUIStore } from "@/store/ui.store";
import { DataTable } from "@/components/table";
import { useDataTable } from "@/hooks/useDataTable";
import dayjs from "dayjs";

const getFaseBadgeColor = (fase) => {
  switch (fase) {
    case "LEAD_BARU": return "bg-sky-50 text-sky-700 dark:bg-sky-950/20 dark:text-sky-400 border border-sky-200/50 dark:border-sky-900/30";
    case "FOLLOW_UP": return "bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400 border border-amber-200/50 dark:border-amber-900/30";
    case "PENAWARAN": return "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/20 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-900/30";
    default: return "bg-neutral-50 text-neutral-700 dark:bg-neutral-900 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-800";
  }
};

const getFaseName = (fase) => {
  switch (fase) {
    case "LEAD_BARU": return "Lead Baru";
    case "FOLLOW_UP": return "Follow Up";
    case "PENAWARAN": return "Penawaran";
    default: return fase;
  }
};

const getVisualBadgeColor = (warna) => {
  if (!warna) return "bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300";
  switch (warna.toLowerCase()) {
    case "green": case "success": return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
    case "blue": case "info": return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
    case "yellow": case "warning": return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400";
    case "red": case "danger": return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
    case "purple": return "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400";
    default: return "bg-orange-100 text-orange-700 dark:bg-orange-950/30 dark:text-orange-400";
  }
};

export default function HasilInteraksiPage() {
  const [hasilInteraksis, setHasilInteraksis] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isImporting, setIsImporting] = useState(false);
  const [mounted, setMounted] = useState(false);
  const fileInputRef = useRef(null);
  const { showToast, showConfirm } = useUIStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    id: null, kode: "", nama: "", fase_lead: "FOLLOW_UP", urutan: 0, warna: "orange", aktif: 1
  });

  const {
    tableState,
    tableHandlers,
    buildParams,
    applyPagination,
    clearAllFilters
  } = useDataTable({
    defaultSortField: "urutan",
    defaultSortOrder: "asc"
  });

  useEffect(() => setMounted(true), []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const params = buildParams();
      const res = await fetch(`/api/master/hasil-interaksi?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        setHasilInteraksis(json.data || []);
        if (json.pagination) applyPagination(json.pagination);
      }
    } catch (error) {
      console.error(error);
      showToast("Gagal mengambil data hasil interaksi", "error");
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

  const handleOpenModal = (hasil = null) => {
    if (hasil) {
      setFormData({
        id: hasil.id, kode: hasil.kode, nama: hasil.nama, fase_lead: hasil.fase_lead,
        urutan: parseInt(hasil.urutan) || 0, warna: hasil.warna || "orange", aktif: hasil.aktif
      });
    } else {
      setFormData({
        id: null, kode: "", nama: "", fase_lead: "FOLLOW_UP",
        urutan: hasilInteraksis.length + 1, warna: "orange", aktif: 1
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const url = formData.id ? `/api/master/hasil-interaksi/${formData.id}` : "/api/master/hasil-interaksi";
      const method = formData.id ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kode: formData.kode, nama: formData.nama, fase_lead: formData.fase_lead,
          urutan: parseInt(formData.urutan) || 0, warna: formData.warna, aktif: parseInt(formData.aktif)
        })
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setIsModalOpen(false);
        fetchData();
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
    showConfirm("Konfirmasi Hapus", "Apakah Anda yakin ingin menghapus data hasil interaksi ini? Data yang sudah terikat transaksi tidak akan bisa dihapus.",
      async () => {
        try {
          const res = await fetch(`/api/master/hasil-interaksi/${id}`, { method: "DELETE" });
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
        dataToExport = hasilInteraksis;
      } else {
        const params = buildParams({ export: "true" });
        const res = await fetch(`/api/master/hasil-interaksi?${params.toString()}`);
        const json = await res.json();
        if (json.success) {
          dataToExport = json.data;
        } else {
          showToast("Gagal mengambil data untuk export", "error");
          return;
        }
      }
      const exportData = dataToExport.map(h => ({
        KODE: h.kode,
        NAMA_HASIL_INTERAKSI: h.nama,
        FASE_LEAD: h.fase_lead,
        URUTAN: h.urutan,
        WARNA: h.warna || "orange",
        STATUS: h.aktif === 1 ? "Aktif" : "Nonaktif"
      }));
      exportToExcel(exportData, "master_hasil_interaksi.xlsx");
      showToast("Data berhasil diexport.", "success");
    } catch (error) {
      console.error(error);
      showToast("Terjadi kesalahan saat export", "error");
    }
  };

  const handleDownloadTemplate = () => {
    const templateData = [
      { KODE: "HI01", NAMA_HASIL_INTERAKSI: "Tanya-tanya Produk Baru", FASE_LEAD: "LEAD_BARU", URUTAN: 1, WARNA: "blue", STATUS: "Aktif" },
      { KODE: "HI02", NAMA_HASIL_INTERAKSI: "Menunggu Acc Bos", FASE_LEAD: "FOLLOW_UP", URUTAN: 2, WARNA: "yellow", STATUS: "Aktif" },
      { KODE: "HI03", NAMA_HASIL_INTERAKSI: "Minta Invoice Penawaran", FASE_LEAD: "PENAWARAN", URUTAN: 3, WARNA: "purple", STATUS: "Aktif" }
    ];
    exportToExcel(templateData, "template_hasil_interaksi.xlsx");
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
        if (!row.KODE || !row.NAMA_HASIL_INTERAKSI || !row.FASE_LEAD) continue;
        let faseLead = row.FASE_LEAD.toString().toUpperCase().trim();
        if (!["LEAD_BARU", "FOLLOW_UP", "PENAWARAN"].includes(faseLead)) {
          errorCount++;
          errorMessages.push(`Baris ${i + 2} (${row.KODE}): Fase Lead '${faseLead}' tidak valid.`);
          continue;
        }
        const payload = {
          kode: row.KODE.toString().trim(), nama: row.NAMA_HASIL_INTERAKSI.toString().trim(),
          fase_lead: faseLead, urutan: parseInt(row.URUTAN) || 0,
          warna: row.WARNA?.toString().trim() || "orange",
          aktif: row.STATUS?.toLowerCase() === 'nonaktif' ? 0 : 1
        };
        const res = await fetch("/api/master/hasil-interaksi", {
          method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload)
        });
        if (res.ok) successCount++;
        else {
          errorCount++;
          const json = await res.json();
          errorMessages.push(`Baris ${i + 2} (${row.KODE}): ${json.message || 'Gagal tersimpan'}`);
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
      sortable: false,
      width: 60,
      render: (row) => {
        const idx = hasilInteraksis.findIndex(h => h.id === row.id);
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
      label: "Nama Hasil Interaksi",
      sortable: true,
      filter: { type: "text" },
      render: (row) => <span className="text-neutral-900 dark:text-neutral-200">{row.nama}</span>
    },
    {
      key: "fase_lead",
      label: "Fase Lead",
      sortable: true,
      filter: {
        type: "select",
        options: [
          { value: "LEAD_BARU", label: "Lead Baru" },
          { value: "FOLLOW_UP", label: "Follow Up" },
          { value: "PENAWARAN", label: "Penawaran" }
        ]
      },
      render: (row) => (
        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${getFaseBadgeColor(row.fase_lead)}`}>
          {getFaseName(row.fase_lead)}
        </span>
      )
    },
    {
      key: "urutan",
      label: "Urutan",
      sortable: true,
      width: 80,
      render: (row) => <span className="font-mono text-sm text-neutral-700 dark:text-neutral-300">{row.urutan}</span>
    },
    {
      key: "warna",
      label: "Warna",
      render: (row) => (
        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold border ${getVisualBadgeColor(row.warna)}`}>
          {row.warna}
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
        <span className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${row.aktif === 1 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400'}`}>
          {row.aktif === 1 ? 'Aktif' : 'Nonaktif'}
        </span>
      )
    },
    {
      key: "dibuat_oleh",
      label: "Dibuat Oleh",
      filter: {
        type: "composite",
        fields: [
          { key: "dibuat_oleh", label: "Nama Pembuat", type: "text" },
          { key: "dibuat_tanggal", label: "Tanggal Dibuat", type: "date_range" }
        ]
      },
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
      filter: {
        type: "composite",
        fields: [
          { key: "diubah_oleh", label: "Nama Pengubah", type: "text" },
          { key: "diubah_tanggal", label: "Tanggal Diubah", type: "date_range" }
        ]
      },
      render: (row) => row.diubah_oleh ? (
        <div className="text-xs text-neutral-500">
          {row.diubah_oleh}
          <div className="text-[10px] opacity-70">{dayjs(row.diubah_tanggal).format('DD/MM/YY HH:mm')}</div>
        </div>
      ) : '-'
    }
  ], [hasilInteraksis, tableState.page, tableState.pageSize]);

  const actions = useMemo(() => [
    { label: "Edit", icon: FiEdit2, variant: "default", onClick: (row) => handleOpenModal(row) },
    { label: "Hapus", icon: FiTrash2, variant: "danger", onClick: (row) => handleDelete(row.id) }
  ], []);

  return (
    <div className="space-y-6">
      {/* DataTable */}
      <DataTable
        columns={columns}
        data={hasilInteraksis}
        isLoading={isLoading}
        emptyIcon={FiActivity}
        emptyText="Belum ada Hasil Interaksi."
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
        searchPlaceholder="Cari kode, nama, atau fase..."
        columnFilters={tableState.columnFilters}
        onFilterChange={tableHandlers.onFilterChange}
        onResetFilters={() => { clearAllFilters(); tableHandlers.onSearchChange(""); }}
        onExport={handleExport}
        actions={actions}
        headerActions={
          <>
            <button
              onClick={() => handleOpenModal()}
              className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-orange-600 hover:bg-orange-700 rounded-xl transition-all duration-200 cursor-pointer shadow-sm hover:shadow"
              title="Tambah Hasil"
            >
              <FiPlus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Tambah Hasil</span>
            </button>

            <input type="file" accept=".xlsx, .xls" ref={fileInputRef} className="hidden" onChange={handleImport} />

            <button
              className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-neutral-600 dark:text-neutral-400 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
              title="Download Template Import"
              onClick={handleDownloadTemplate}
            >
              <FiFileText className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Template</span>
            </button>
            <button
              className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-neutral-600 dark:text-neutral-400 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
              title="Import dari Excel"
              onClick={() => fileInputRef.current?.click()}
            >
              <FiUpload className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Import</span>
            </button>
          </>
        }
      />

      {/* Modal Tambah / Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95">
            <div className="px-6 py-4 border-b border-neutral-100 dark:border-neutral-800 flex justify-between items-center">
              <h3 className="text-lg font-bold text-neutral-900 dark:text-white">
                {formData.id ? "Edit Hasil Interaksi" : "Tambah Hasil Interaksi"}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-neutral-400 hover:text-neutral-600 transition-colors cursor-pointer">
                <FiX className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Kode *</label>
                  <input type="text" required maxLength={30}
                    className="w-full px-4 py-2 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all dark:text-white"
                    value={formData.kode} onChange={(e) => setFormData({ ...formData, kode: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Nama Hasil Interaksi *</label>
                  <input type="text" required maxLength={150}
                    className="w-full px-4 py-2 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all dark:text-white"
                    value={formData.nama} onChange={(e) => setFormData({ ...formData, nama: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Fase Lead *</label>
                  <select className="w-full px-4 py-2 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all dark:text-white"
                    value={formData.fase_lead} onChange={(e) => setFormData({ ...formData, fase_lead: e.target.value })}>
                    <option value="LEAD_BARU">Lead Baru</option>
                    <option value="FOLLOW_UP">Follow Up</option>
                    <option value="PENAWARAN">Penawaran</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Urutan *</label>
                  <input type="number" required min={0}
                    className="w-full px-4 py-2 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all dark:text-white font-mono"
                    value={formData.urutan} onChange={(e) => setFormData({ ...formData, urutan: parseInt(e.target.value) || 0 })} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Warna Badge</label>
                  <select className="w-full px-4 py-2 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all dark:text-white"
                    value={formData.warna} onChange={(e) => setFormData({ ...formData, warna: e.target.value })}>
                    <option value="orange">Orange (Default)</option>
                    <option value="blue">Biru (Info)</option>
                    <option value="yellow">Kuning (Warning)</option>
                    <option value="green">Hijau (Success)</option>
                    <option value="red">Merah (Danger)</option>
                    <option value="purple">Ungu</option>
                  </select>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-xs text-neutral-500">Preview:</span>
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold border ${getVisualBadgeColor(formData.warna)}`}>
                      {formData.nama || "Badge Text"}
                    </span>
                  </div>
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
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-xl hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors cursor-pointer">
                  Batal
                </button>
                <button type="submit" disabled={isSubmitting} className="px-4 py-2 text-sm font-medium text-white bg-orange-600 rounded-xl hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm flex items-center gap-2 cursor-pointer">
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
