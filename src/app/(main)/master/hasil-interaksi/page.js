"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { FiSearch, FiPlus, FiEdit2, FiTrash2, FiX, FiDownload, FiUpload, FiFileText, FiActivity } from "react-icons/fi";
import { exportToExcel, parseExcel } from "@/lib/excel";
import { useUIStore } from "@/store/ui.store";
import dayjs from "dayjs";

export default function HasilInteraksiPage() {
  const [hasilInteraksis, setHasilInteraksis] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isImporting, setIsImporting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState("urutan");
  const [sortOrder, setSortOrder] = useState("asc");

  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const renderSortIcon = (field) => {
    if (sortField !== field) return <span className="text-neutral-300 dark:text-neutral-700 opacity-0 group-hover:opacity-100">↑↓</span>;
    return sortOrder === 'asc' 
      ? <span className="text-orange-500">↑</span> 
      : <span className="text-orange-500">↓</span>;
  };

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({ 
    id: null, 
    kode: "", 
    nama: "", 
    fase_lead: "FOLLOW_UP", 
    urutan: 0, 
    warna: "orange",
    aktif: 1 
  });
  const [mounted, setMounted] = useState(false);
  const fileInputRef = useRef(null);
  const { showToast, showConfirm } = useUIStore();

  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchHasilInteraksi = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/master/hasil-interaksi");
      const json = await res.json();
      if (json.success) {
        setHasilInteraksis(json.data);
      }
    } catch (error) {
      console.error(error);
      showToast("Gagal mengambil data hasil interaksi", "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHasilInteraksi();
  }, []);

  const handleOpenModal = (hasil = null) => {
    if (hasil) {
      setFormData({
        id: hasil.id,
        kode: hasil.kode,
        nama: hasil.nama,
        fase_lead: hasil.fase_lead,
        urutan: parseInt(hasil.urutan) || 0,
        warna: hasil.warna || "orange",
        aktif: hasil.aktif
      });
    } else {
      setFormData({ 
        id: null, 
        kode: "", 
        nama: "", 
        fase_lead: "FOLLOW_UP", 
        urutan: hasilInteraksis.length + 1, 
        warna: "orange",
        aktif: 1 
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
          kode: formData.kode,
          nama: formData.nama,
          fase_lead: formData.fase_lead,
          urutan: parseInt(formData.urutan) || 0,
          warna: formData.warna,
          aktif: parseInt(formData.aktif)
        })
      });
      
      const json = await res.json();
      
      if (res.ok && json.success) {
        setIsModalOpen(false);
        fetchHasilInteraksi();
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
      "Apakah Anda yakin ingin menghapus data hasil interaksi ini? Data yang sudah terikat transaksi tidak akan bisa dihapus.", 
      async () => {
        try {
          const res = await fetch(`/api/master/hasil-interaksi/${id}`, { method: "DELETE" });
          const json = await res.json();
          
          if (res.ok && json.success) {
            fetchHasilInteraksi();
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

  const handleExport = () => {
    const exportData = hasilInteraksis.map(h => ({
      KODE: h.kode,
      NAMA_HASIL_INTERAKSI: h.nama,
      FASE_LEAD: h.fase_lead,
      URUTAN: h.urutan,
      WARNA: h.warna || "orange",
      STATUS: h.aktif === 1 ? "Aktif" : "Nonaktif"
    }));
    exportToExcel(exportData, "master_hasil_interaksi.xlsx");
  };

  const handleDownloadTemplate = () => {
    const templateData = [
      {
        KODE: "HI01",
        NAMA_HASIL_INTERAKSI: "Tanya-tanya Produk Baru",
        FASE_LEAD: "LEAD_BARU",
        URUTAN: 1,
        WARNA: "blue",
        STATUS: "Aktif"
      },
      {
        KODE: "HI02",
        NAMA_HASIL_INTERAKSI: "Menunggu Acc Bos",
        FASE_LEAD: "FOLLOW_UP",
        URUTAN: 2,
        WARNA: "yellow",
        STATUS: "Aktif"
      },
      {
        KODE: "HI03",
        NAMA_HASIL_INTERAKSI: "Minta Invoice Penawaran",
        FASE_LEAD: "PENAWARAN",
        URUTAN: 3,
        WARNA: "purple",
        STATUS: "Aktif"
      }
    ];
    exportToExcel(templateData, "template_hasil_interaksi.xlsx");
  };

  const handleImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    try {
      setIsImporting(true);
      const data = await parseExcel(file);
      
      let successCount = 0;
      let errorCount = 0;
      let errorMessages = [];

      for (let i = 0; i < data.length; i++) {
        const row = data[i];
        if (!row.KODE || !row.NAMA_HASIL_INTERAKSI || !row.FASE_LEAD) continue;

        // Validasi fase_lead
        let faseLead = row.FASE_LEAD.toString().toUpperCase().trim();
        if (!["LEAD_BARU", "FOLLOW_UP", "PENAWARAN"].includes(faseLead)) {
          errorCount++;
          errorMessages.push(`Baris ${i + 2} (${row.KODE}): Fase Lead '${faseLead}' tidak valid.`);
          continue;
        }

        const payload = {
          kode: row.KODE.toString().trim(),
          nama: row.NAMA_HASIL_INTERAKSI.toString().trim(),
          fase_lead: faseLead,
          urutan: parseInt(row.URUTAN) || 0,
          warna: row.WARNA?.toString().trim() || "orange",
          aktif: row.STATUS?.toLowerCase() === 'nonaktif' ? 0 : 1
        };

        const res = await fetch("/api/master/hasil-interaksi", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });

        if (res.ok) {
          successCount++;
        } else {
          errorCount++;
          const json = await res.json();
          errorMessages.push(`Baris ${i + 2} (${row.KODE}): ${json.message || 'Gagal tersimpan'}`);
        }
      }

      fetchHasilInteraksi();
      
      if (errorCount > 0) {
        const errorDetails = errorMessages.slice(0, 5).join('\n');
        const moreErrors = errorMessages.length > 5 ? `\n...dan ${errorMessages.length - 5} error lainnya.` : '';
        showConfirm(
          "Import Selesai dengan Catatan",
          `Berhasil: ${successCount}\nGagal: ${errorCount}\n\nRincian Error:\n${errorDetails}${moreErrors}`,
          () => {},
          null,
          "info"
        );
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

  const getFaseBadgeColor = (fase) => {
    switch (fase) {
      case "LEAD_BARU":
        return "bg-sky-50 text-sky-700 dark:bg-sky-950/20 dark:text-sky-400 border border-sky-200/50 dark:border-sky-900/30";
      case "FOLLOW_UP":
        return "bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400 border border-amber-200/50 dark:border-amber-900/30";
      case "PENAWARAN":
        return "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/20 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-900/30";
      default:
        return "bg-neutral-50 text-neutral-700 dark:bg-neutral-900 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-800";
    }
  };

  const getFaseName = (fase) => {
    switch (fase) {
      case "LEAD_BARU":
        return "Lead Baru";
      case "FOLLOW_UP":
        return "Follow Up";
      case "PENAWARAN":
        return "Penawaran";
      default:
        return fase;
    }
  };

  const getVisualBadgeColor = (warna) => {
    if (!warna) return "bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300";
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

  const filteredData = hasilInteraksis.filter(h => 
    h.nama.toLowerCase().includes(searchTerm.toLowerCase()) || 
    h.kode.toLowerCase().includes(searchTerm.toLowerCase()) ||
    h.fase_lead.toLowerCase().includes(searchTerm.toLowerCase())
  ).sort((a, b) => {
    let aVal = a[sortField];
    let bVal = b[sortField];
    if (typeof aVal === 'string') aVal = aVal.toLowerCase();
    if (typeof bVal === 'string') bVal = bVal.toLowerCase();
    if (aVal === null || aVal === undefined) aVal = "";
    if (bVal === null || bVal === undefined) bVal = "";
    if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  return (
    <div className="space-y-6">
      {mounted && document.getElementById("header-actions-portal") && createPortal(
        <>
          <button 
            onClick={() => handleOpenModal()}
            className="bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-200 text-white dark:text-neutral-900 px-4 py-1.5 rounded-full font-medium flex items-center gap-2 transition-colors shadow-sm text-sm mr-1 cursor-pointer"
          >
            <FiPlus className="w-4 h-4" />
            <span className="hidden sm:inline">Tambah Hasil</span>
          </button>
          
          <input 
            type="file" 
            accept=".xlsx, .xls" 
            ref={fileInputRef} 
            className="hidden" 
            onChange={handleImport} 
          />
          
          <button 
            className="p-2 text-neutral-500 hover:text-neutral-900 bg-white hover:bg-neutral-100 dark:bg-neutral-900 dark:text-neutral-400 dark:hover:text-white dark:hover:bg-neutral-800 rounded-full transition-colors border border-neutral-200 dark:border-neutral-800 cursor-pointer"
            title="Download Template Import"
            onClick={handleDownloadTemplate}
          >
            <FiFileText className="w-4 h-4" />
          </button>
          <button 
            className="p-2 text-neutral-500 hover:text-neutral-900 bg-white hover:bg-neutral-100 dark:bg-neutral-900 dark:text-neutral-400 dark:hover:text-white dark:hover:bg-neutral-800 rounded-full transition-colors border border-neutral-200 dark:border-neutral-800 cursor-pointer"
            title="Import dari Excel"
            onClick={() => fileInputRef.current?.click()}
          >
            <FiUpload className="w-4 h-4" />
          </button>
          <button 
            className="p-2 text-neutral-500 hover:text-neutral-900 bg-white hover:bg-neutral-100 dark:bg-neutral-900 dark:text-neutral-400 dark:hover:text-white dark:hover:bg-neutral-800 rounded-full transition-colors border border-neutral-200 dark:border-neutral-800 cursor-pointer"
            title="Export ke Excel"
            onClick={handleExport}
          >
            <FiDownload className="w-4 h-4" />
          </button>
        </>,
        document.getElementById("header-actions-portal")
      )}

      {/* Table Container */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200/50 dark:border-neutral-800 rounded-2xl shadow-sm overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-neutral-100 dark:border-neutral-800 flex flex-col sm:flex-row gap-4 justify-between items-center bg-neutral-50/50 dark:bg-neutral-900/50">
          <div className="relative w-full sm:w-80">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FiSearch className="text-neutral-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-neutral-200 dark:border-neutral-700 rounded-xl leading-5 bg-white dark:bg-neutral-950 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-colors sm:text-sm"
              placeholder="Cari kode, nama, atau fase..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-neutral-200 dark:divide-neutral-800">
            <thead className="bg-neutral-50 dark:bg-neutral-900">
              <tr>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">No</th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors group select-none" onClick={() => handleSort('kode')}>
                  <div className="flex items-center gap-2">Kode {renderSortIcon('kode')}</div>
                </th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors group select-none" onClick={() => handleSort('nama')}>
                  <div className="flex items-center gap-2">Nama Hasil Interaksi {renderSortIcon('nama')}</div>
                </th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors group select-none" onClick={() => handleSort('fase_lead')}>
                  <div className="flex items-center gap-2">Fase Lead {renderSortIcon('fase_lead')}</div>
                </th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors group select-none" onClick={() => handleSort('urutan')}>
                  <div className="flex items-center gap-2">Urutan {renderSortIcon('urutan')}</div>
                </th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors group select-none" onClick={() => handleSort('warna')}>
                  <div className="flex items-center gap-2">Warna {renderSortIcon('warna')}</div>
                </th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors group select-none" onClick={() => handleSort('aktif')}>
                  <div className="flex items-center gap-2">Status {renderSortIcon('aktif')}</div>
                </th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors group select-none" onClick={() => handleSort('dibuat_tanggal')}>
                  <div className="flex items-center gap-2">Dibuat Oleh {renderSortIcon('dibuat_tanggal')}</div>
                </th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors group select-none" onClick={() => handleSort('diubah_tanggal')}>
                  <div className="flex items-center gap-2">Diubah Oleh {renderSortIcon('diubah_tanggal')}</div>
                </th>
                <th scope="col" className="px-6 py-4 text-right text-xs font-semibold text-neutral-500 uppercase tracking-wider">Aksi</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-neutral-900 divide-y divide-neutral-100 dark:divide-neutral-800">
              {isLoading ? (
                <tr>
                  <td colSpan="10" className="px-6 py-10 text-center text-neutral-500">
                    <div className="flex justify-center items-center gap-2">
                      <div className="w-5 h-5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                      <span>Memuat data...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredData.length === 0 ? (
                <tr>
                  <td colSpan="10" className="px-6 py-10 text-center text-neutral-500">
                    Tidak ada data ditemukan.
                  </td>
                </tr>
              ) : (
                filteredData.map((hasil, index) => (
                  <tr key={hasil.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
                    <td className="px-6 py-3 whitespace-nowrap text-sm text-neutral-500">{index + 1}</td>
                    <td className="px-6 py-3 whitespace-nowrap text-sm font-medium text-neutral-900 dark:text-white">{hasil.kode}</td>
                    <td className="px-6 py-3 whitespace-nowrap text-sm text-neutral-900 dark:text-neutral-200">{hasil.nama}</td>
                    <td className="px-6 py-3 whitespace-nowrap text-sm">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${getFaseBadgeColor(hasil.fase_lead)}`}>
                        {getFaseName(hasil.fase_lead)}
                      </span>
                    </td>
                    <td className="px-6 py-3 whitespace-nowrap text-sm text-neutral-700 dark:text-neutral-300 font-mono">{hasil.urutan}</td>
                    <td className="px-6 py-3 whitespace-nowrap text-sm">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold border ${getVisualBadgeColor(hasil.warna)}`}>
                        {hasil.warna}
                      </span>
                    </td>
                    <td className="px-6 py-3 whitespace-nowrap text-sm">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${hasil.aktif === 1 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400'}`}>
                        {hasil.aktif === 1 ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </td>
                    <td className="px-6 py-3 whitespace-nowrap text-xs text-neutral-500">
                      {hasil.dibuat_oleh ? <div>{hasil.dibuat_oleh} <br/><span className="text-[10px] opacity-70">{dayjs(hasil.dibuat_tanggal).format('DD/MM/YY HH:mm')}</span></div> : '-'}
                    </td>
                    <td className="px-6 py-3 whitespace-nowrap text-xs text-neutral-500">
                      {hasil.diubah_oleh ? <div>{hasil.diubah_oleh} <br/><span className="text-[10px] opacity-70">{dayjs(hasil.diubah_tanggal).format('DD/MM/YY HH:mm')}</span></div> : '-'}
                    </td>
                    <td className="px-6 py-3 whitespace-nowrap text-sm text-right font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => handleOpenModal(hasil)} className="p-2 text-neutral-400 hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-lg transition-colors cursor-pointer">
                          <FiEdit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(hasil.id)} className="p-2 text-neutral-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors cursor-pointer">
                          <FiTrash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
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
                  <input 
                    type="text" 
                    required 
                    maxLength={30}
                    className="w-full px-4 py-2 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all dark:text-white"
                    value={formData.kode}
                    onChange={(e) => setFormData({...formData, kode: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Nama Hasil Interaksi *</label>
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
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Fase Lead *</label>
                  <select
                    className="w-full px-4 py-2 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all dark:text-white"
                    value={formData.fase_lead}
                    onChange={(e) => setFormData({...formData, fase_lead: e.target.value})}
                  >
                    <option value="LEAD_BARU">Lead Baru</option>
                    <option value="FOLLOW_UP">Follow Up</option>
                    <option value="PENAWARAN">Penawaran</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Urutan *</label>
                  <input 
                    type="number" 
                    required
                    min={0}
                    className="w-full px-4 py-2 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all dark:text-white font-mono"
                    value={formData.urutan}
                    onChange={(e) => setFormData({...formData, urutan: parseInt(e.target.value) || 0})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Warna Badge</label>
                  <select
                    className="w-full px-4 py-2 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all dark:text-white"
                    value={formData.warna}
                    onChange={(e) => setFormData({...formData, warna: e.target.value})}
                  >
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
                      <input 
                        type="radio" 
                        name="aktif" 
                        value={1} 
                        checked={formData.aktif === 1} 
                        onChange={() => setFormData({...formData, aktif: 1})}
                        className="text-orange-600 focus:ring-orange-500"
                      />
                      <span className="text-sm dark:text-neutral-300">Aktif</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="radio" 
                        name="aktif" 
                        value={0} 
                        checked={formData.aktif === 0} 
                        onChange={() => setFormData({...formData, aktif: 0})}
                        className="text-orange-600 focus:ring-orange-500"
                      />
                      <span className="text-sm dark:text-neutral-300">Nonaktif</span>
                    </label>
                  </div>
                </div>
              </div>
              <div className="px-6 py-4 bg-neutral-50 dark:bg-neutral-950 border-t border-neutral-100 dark:border-neutral-800 flex justify-end gap-3 rounded-b-2xl">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-xl hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="px-4 py-2 text-sm font-medium text-white bg-orange-600 rounded-xl hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm flex items-center gap-2 cursor-pointer"
                >
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
          <p className="text-sm text-neutral-500 mt-1">Mohon tunggu, jangan tutup atau *refresh* halaman ini.</p>
        </div>
      )}
    </div>
  );
}
