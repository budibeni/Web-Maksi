"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { FiSearch, FiPlus, FiEdit2, FiTrash2, FiX, FiDownload, FiUpload, FiFilter, FiFileText, FiChevronUp, FiChevronDown } from "react-icons/fi";
import { exportToExcel, parseExcel } from "@/lib/excel";
import { useUIStore } from "@/store/ui.store";
import dayjs from "dayjs";

export default function ProdukPage() {
  const [produks, setProduks] = useState([]);
  const [kategoriList, setKategoriList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isImporting, setIsImporting] = useState(false);
  // Pagination & Data States
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalData, setTotalData] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [sortField, setSortField] = useState("id");
  const [sortOrder, setSortOrder] = useState("desc");
  
  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedKategoriId, setSelectedKategoriId] = useState("all");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({ id: null, kategori_produk_id: "", kode: "", nama: "", satuan: "", harga_default: 0, aktif: 1 });
  const [mounted, setMounted] = useState(false);
  const fileInputRef = useRef(null);
  const { showToast, showConfirm } = useUIStore();

  // Set mounted
  useEffect(() => {
    setMounted(true);
    fetchKategoriMaster();
  }, []);

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1); // Reset page on search
    }, 500);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  // Reset page on filter change
  useEffect(() => {
    setPage(1);
  }, [selectedKategoriId]);

  // Fetch data on dependencies change
  useEffect(() => {
    if (mounted) fetchProduks();
  }, [page, limit, debouncedSearch, selectedKategoriId, sortField, sortOrder, mounted]);

  const fetchKategoriMaster = async () => {
    try {
      const res = await fetch("/api/master/kategori-produk");
      const json = await res.json();
      if (json.success) {
        setKategoriList(json.data);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const fetchProduks = async () => {
    setIsLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page,
        limit,
        search: debouncedSearch,
        kategori_id: selectedKategoriId,
        sort_by: sortField,
        sort_order: sortOrder
      });
      
      const res = await fetch(`/api/master/produk?${queryParams}`);
      const json = await res.json();
      if (json.success) {
        setProduks(json.data);
        if (json.pagination) {
          setTotalData(json.pagination.total);
          setTotalPages(json.pagination.totalPages);
        }
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenModal = (produk = null) => {
    if (produk) {
      setFormData({
        id: produk.id,
        kategori_produk_id: produk.kategori_produk_id,
        kode: produk.kode,
        nama: produk.nama,
        satuan: produk.satuan || "",
        harga_default: produk.harga_default || 0,
        aktif: produk.aktif
      });
    } else {
      // Default ke kategori yang sedang dipilih di filter jika ada
      const defaultKategori = selectedKategoriId !== "all" 
        ? selectedKategoriId 
        : (kategoriList.length > 0 ? kategoriList[0].id : "");
        
      setFormData({ 
        id: null, 
        kategori_produk_id: defaultKategori, 
        kode: "", 
        nama: "", 
        satuan: "", 
        harga_default: 0, 
        aktif: 1 
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.kategori_produk_id) {
      showToast("Silakan pilih Kategori Produk", "error");
      return;
    }

    setIsSubmitting(true);
    
    try {
      const url = formData.id ? `/api/master/produk/${formData.id}` : "/api/master/produk";
      const method = formData.id ? "PUT" : "POST";
      
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kategori_produk_id: formData.kategori_produk_id,
          kode: formData.kode,
          nama: formData.nama,
          satuan: formData.satuan,
          harga_default: formData.harga_default,
          aktif: parseInt(formData.aktif)
        })
      });
      
      const json = await res.json();
      
      if (res.ok && json.success) {
        setIsModalOpen(false);
        fetchProduks();
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
      "Apakah Anda yakin ingin menghapus data Produk ini?", 
      async () => {
      try {
        const res = await fetch(`/api/master/produk/${id}`, { method: "DELETE" });
        const json = await res.json();
        
        if (res.ok && json.success) {
          fetchProduks();
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
      showToast("Sedang menyiapkan file export...", "info");
      const queryParams = new URLSearchParams({
        search: debouncedSearch,
        kategori_id: selectedKategoriId,
        sort_by: sortField,
        sort_order: sortOrder,
        export: "true"
      });
      
      const res = await fetch(`/api/master/produk?${queryParams}`);
      const json = await res.json();
      
      if (json.success) {
        const exportData = json.data.map(p => ({
          KODE: p.kode,
          NAMA: p.nama,
          KATEGORI: p.kategori?.nama || "-",
          SATUAN: p.satuan,
          HARGA_PUSAT: p.harga_default,
          STATUS: p.aktif === 1 ? "Aktif" : "Nonaktif"
        }));
        exportToExcel(exportData, `master_produk.xlsx`);
      } else {
        showToast("Gagal mengambil data untuk export", "error");
      }
    } catch (error) {
      console.error(error);
      showToast("Terjadi kesalahan sistem", "error");
    }
  };

  const handleDownloadTemplate = () => {
    const templateData = [
      {
        KODE: "PRD-001",
        NAMA: "Produk Contoh 1",
        KATEGORI: "Mesin",
        SATUAN: "UNIT",
        HARGA_PUSAT: 1500000,
        STATUS: "Aktif"
      },
      {
        KODE: "PRD-002",
        NAMA: "Produk Contoh 2",
        KATEGORI: "Sparepart",
        SATUAN: "PCS",
        HARGA_PUSAT: 50000,
        STATUS: "Aktif"
      }
    ];
    exportToExcel(templateData, "template_master_produk.xlsx");
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
        // Skip empty rows
        if (!row.KODE || !row.NAMA || !row.KATEGORI) {
          continue; 
        }

        // Cari kategori berdasarkan nama
        const kat = kategoriList.find(k => k.nama.toLowerCase() === row.KATEGORI.toString().toLowerCase());
        
        if (!kat) {
          errorCount++;
          errorMessages.push(`Baris ${i + 2} (${row.KODE}): Kategori '${row.KATEGORI}' tidak ditemukan`);
          continue; // Lewati jika kategori tidak ditemukan
        }

        const payload = {
          kategori_produk_id: kat.id,
          kode: row.KODE.toString(),
          nama: row.NAMA.toString(),
          satuan: (row.SATUAN || "PCS").toString(),
          harga_default: row.HARGA_PUSAT || 0,
          aktif: row.STATUS?.toLowerCase() === 'nonaktif' ? 0 : 1,
          upsert: true
        };

        const res = await fetch("/api/master/produk", {
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

      fetchProduks();
      
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
      // Reset input file
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };


  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const renderSortIcon = (field) => {
    if (sortField !== field) return <FiChevronDown className="w-4 h-4 opacity-20 group-hover:opacity-100 transition-opacity" />;
    return sortOrder === "asc" 
      ? <FiChevronUp className="w-4 h-4 text-orange-500" />
      : <FiChevronDown className="w-4 h-4 text-orange-500" />;
  };

  return (
    <div className="space-y-6">
      {mounted && document.getElementById("header-actions-portal") && createPortal(
          <>
            <button 
              onClick={() => handleOpenModal()}
              className="bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-200 text-white dark:text-neutral-900 px-4 py-1.5 rounded-full font-medium flex items-center gap-2 transition-colors shadow-sm text-sm mr-1"
            >
              <FiPlus className="w-4 h-4" />
              <span className="hidden sm:inline">Tambah Produk</span>
            </button>
            
            <input 
              type="file" 
              accept=".xlsx, .xls" 
              ref={fileInputRef} 
              className="hidden" 
              onChange={handleImport} 
            />
            
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

      {/* Filter & Table Container */}
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
              placeholder="Cari kode atau nama produk..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="relative w-full sm:w-64">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FiFilter className="text-neutral-400" />
            </div>
            <select
              value={selectedKategoriId}
              onChange={(e) => setSelectedKategoriId(e.target.value)}
              className="block w-full pl-10 pr-10 py-2 border border-neutral-200 dark:border-neutral-700 rounded-xl leading-5 bg-white dark:bg-neutral-950 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-colors sm:text-sm appearance-none dark:text-white"
            >
              <option value="all">Semua Kategori</option>
              {kategoriList.map(kat => (
                <option key={kat.id} value={kat.id}>{kat.nama}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-neutral-200 dark:divide-neutral-800">
            <thead className="bg-neutral-50 dark:bg-neutral-900">
              <tr>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">No</th>
                <th 
                  scope="col" 
                  className="px-6 py-4 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors group select-none"
                  onClick={() => handleSort('kode')}
                >
                  <div className="flex items-center gap-2">Kode {renderSortIcon('kode')}</div>
                </th>
                <th 
                  scope="col" 
                  className="px-6 py-4 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors group select-none"
                  onClick={() => handleSort('kategori')}
                >
                  <div className="flex items-center gap-2">Kategori {renderSortIcon('kategori')}</div>
                </th>
                <th 
                  scope="col" 
                  className="px-6 py-4 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors group select-none"
                  onClick={() => handleSort('nama')}
                >
                  <div className="flex items-center gap-2">Nama Produk {renderSortIcon('nama')}</div>
                </th>
                <th 
                  scope="col" 
                  className="px-6 py-4 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors group select-none"
                  onClick={() => handleSort('satuan')}
                >
                  <div className="flex items-center gap-2">Satuan {renderSortIcon('satuan')}</div>
                </th>
                <th 
                  scope="col" 
                  className="px-6 py-4 text-right text-xs font-semibold text-neutral-500 uppercase tracking-wider cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors group select-none"
                  onClick={() => handleSort('harga_default')}
                >
                  <div className="flex items-center justify-end gap-2">{renderSortIcon('harga_default')} Harga Default</div>
                </th>
                <th 
                  scope="col" 
                  className="px-6 py-4 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors group select-none"
                  onClick={() => handleSort('aktif')}
                >
                  <div className="flex items-center gap-2">Status {renderSortIcon('aktif')}</div>
                </th>
                <th 
                  scope="col" 
                  className="px-6 py-4 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors group select-none"
                  onClick={() => handleSort('dibuat_tanggal')}
                >
                  <div className="flex items-center gap-2">Dibuat Oleh {renderSortIcon('dibuat_tanggal')}</div>
                </th>
                <th 
                  scope="col" 
                  className="px-6 py-4 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors group select-none"
                  onClick={() => handleSort('diubah_tanggal')}
                >
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
              ) : produks.length === 0 ? (
                <tr>
                  <td colSpan="10" className="px-6 py-10 text-center text-neutral-500">
                    Tidak ada data ditemukan.
                  </td>
                </tr>
              ) : (
                produks.map((produk, index) => (
                  <tr key={produk.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
                    <td className="px-6 py-3 whitespace-nowrap text-sm text-neutral-500">{(page - 1) * limit + index + 1}</td>
                    <td className="px-6 py-3 whitespace-nowrap text-sm font-medium text-neutral-900 dark:text-white">{produk.kode}</td>
                    <td className="px-6 py-3 whitespace-nowrap text-sm text-neutral-500">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200">
                        {produk.kategori?.nama}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-sm text-neutral-900 dark:text-neutral-200 min-w-[200px]">{produk.nama}</td>
                    <td className="px-6 py-3 whitespace-nowrap text-sm text-neutral-500">{produk.satuan}</td>
                    <td className="px-6 py-3 whitespace-nowrap text-sm text-right text-neutral-900 dark:text-white font-medium">
                      Rp {Number(produk.harga_default).toLocaleString('id-ID')}
                    </td>
                    <td className="px-6 py-3 whitespace-nowrap text-sm">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${produk.aktif === 1 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400'}`}>
                        {produk.aktif === 1 ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </td>
                    <td className="px-6 py-3 whitespace-nowrap text-xs text-neutral-500">
                      {produk.dibuat_oleh ? <div>{produk.dibuat_oleh} <br/><span className="text-[10px] opacity-70">{dayjs(produk.dibuat_tanggal).format('DD/MM/YY HH:mm')}</span></div> : '-'}
                    </td>
                    <td className="px-6 py-3 whitespace-nowrap text-xs text-neutral-500">
                      {produk.diubah_oleh ? <div>{produk.diubah_oleh} <br/><span className="text-[10px] opacity-70">{dayjs(produk.diubah_tanggal).format('DD/MM/YY HH:mm')}</span></div> : '-'}
                    </td>
                    <td className="px-6 py-3 whitespace-nowrap text-sm text-right font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => handleOpenModal(produk)} className="p-2 text-neutral-400 hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-lg transition-colors">
                          <FiEdit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(produk.id)} className="p-2 text-neutral-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
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

        {/* Pagination */}
        {!isLoading && produks.length > 0 && (
          <div className="px-6 py-4 border-t border-neutral-100 dark:border-neutral-800 flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-neutral-900">
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-neutral-500 dark:text-neutral-400">Baris:</span>
                <select 
                  value={limit} 
                  onChange={(e) => {
                    setLimit(Number(e.target.value));
                    setPage(1);
                  }}
                  className="bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 text-sm rounded-lg focus:ring-orange-500 focus:border-orange-500 block px-2.5 py-1.5 outline-none cursor-pointer"
                >
                  <option value="10">10</option>
                  <option value="25">25</option>
                  <option value="50">50</option>
                  <option value="100">100</option>
                </select>
              </div>
              <div className="text-sm text-neutral-500 dark:text-neutral-400">
                Menampilkan <span className="font-medium text-neutral-900 dark:text-white">{(page - 1) * limit + 1}</span> - <span className="font-medium text-neutral-900 dark:text-white">{Math.min(page * limit, totalData)}</span> dari <span className="font-medium text-neutral-900 dark:text-white">{totalData}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 text-sm font-medium rounded-lg border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-neutral-700 dark:text-neutral-300"
              >
                Sebelumnya
              </button>
              
              <div className="text-sm font-medium text-neutral-700 dark:text-neutral-300 px-2 flex items-center gap-2">
                Hal 
                <select 
                  value={page}
                  onChange={(e) => setPage(Number(e.target.value))}
                  className="bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 text-sm rounded-lg focus:ring-orange-500 focus:border-orange-500 block px-2 py-1 outline-none cursor-pointer text-center min-w-[3rem]"
                >
                  {Array.from({length: Math.max(1, totalPages)}, (_, i) => i + 1).map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select> 
                dari {totalPages}
              </div>

              <button 
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="px-3 py-1.5 text-sm font-medium rounded-lg border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-neutral-700 dark:text-neutral-300"
              >
                Selanjutnya
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95">
            <div className="px-6 py-4 border-b border-neutral-100 dark:border-neutral-800 flex justify-between items-center">
              <h3 className="text-lg font-bold text-neutral-900 dark:text-white">
                {formData.id ? `Edit Produk` : `Tambah Produk`}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-neutral-400 hover:text-neutral-600 transition-colors">
                <FiX className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Kategori Produk *</label>
                  <select 
                    required
                    className="w-full px-4 py-2 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all dark:text-white"
                    value={formData.kategori_produk_id}
                    onChange={(e) => setFormData({...formData, kategori_produk_id: e.target.value})}
                  >
                    <option value="" disabled>Pilih Kategori</option>
                    {kategoriList.map(kat => (
                      <option key={kat.id} value={kat.id}>{kat.nama}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Kode Produk *</label>
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
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Nama Produk *</label>
                  <input 
                    type="text" 
                    required 
                    maxLength={200}
                    className="w-full px-4 py-2 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all dark:text-white"
                    value={formData.nama}
                    onChange={(e) => setFormData({...formData, nama: e.target.value})}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Satuan *</label>
                    <input 
                      type="text" 
                      required 
                      maxLength={30}
                      className="w-full px-4 py-2 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all dark:text-white"
                      value={formData.satuan}
                      onChange={(e) => setFormData({...formData, satuan: e.target.value})}
                      placeholder="Pcs, Unit, dll"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Harga Default</label>
                    <input 
                      type="number" 
                      min="0"
                      className="w-full px-4 py-2 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all dark:text-white"
                      value={formData.harga_default}
                      onChange={(e) => setFormData({...formData, harga_default: e.target.value})}
                    />
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
                  className="px-4 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-xl hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
                >
                  Batal
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="px-4 py-2 text-sm font-medium text-white bg-orange-600 rounded-xl hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm flex items-center gap-2"
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
