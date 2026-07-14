"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { FiSearch, FiPlus, FiEdit2, FiTrash2, FiX, FiDownload, FiUpload, FiFileText, FiChevronDown } from "react-icons/fi";
import { exportToExcel, parseExcel } from "@/lib/excel";
import { useUIStore } from "@/store/ui.store";
import dayjs from "dayjs";

export default function HargaProdukPage() {
  const [hargaProduks, setHargaProduks] = useState([]);
  const [produks, setProduks] = useState([]);
  const [cabangs, setCabangs] = useState([]);
  const [kategoris, setKategoris] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isImporting, setIsImporting] = useState(false);
  
  const [produkSearch, setProdukSearch] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCabangId, setSelectedCabangId] = useState("all");
  const [selectedKategoriId, setSelectedKategoriId] = useState("all");
  const [sortField, setSortField] = useState("id");
  const [sortOrder, setSortOrder] = useState("desc");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalData, setTotalData] = useState(0);

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
  const [formData, setFormData] = useState({ id: null, produk_id: "", cabang_id: "", harga: "" });
  const [mounted, setMounted] = useState(false);
  const fileInputRef = useRef(null);
  const { showToast, showConfirm } = useUIStore();

  const [isProdukDropdownOpen, setIsProdukDropdownOpen] = useState(false);
  const produkDropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (produkDropdownRef.current && !produkDropdownRef.current.contains(event.target)) {
        setIsProdukDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    setMounted(true);
    fetchDataDropdowns();
  }, []);

  const fetchDataDropdowns = async () => {
    try {
      const resCabang = await fetch("/api/master/cabang?limit=1000");
      const jsonCabang = await resCabang.json();
      if (jsonCabang.success) setCabangs(jsonCabang.data);
      
      const resKategori = await fetch("/api/master/kategori-produk?limit=1000");
      const jsonKategori = await resKategori.json();
      if (jsonKategori.success) setKategoris(jsonKategori.data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    const timer = setTimeout(async () => {
      try {
        const sortParams = produkSearch ? "&sort_by=nama&sort_order=asc" : "&sort_by=id&sort_order=desc";
        const res = await fetch(`/api/master/produk?search=${encodeURIComponent(produkSearch)}${sortParams}&limit=50`);
        const json = await res.json();
        if (json.success) setProduks(json.data);
      } catch (error) {
        console.error(error);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [produkSearch]);

  const fetchHargaProduk = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/master/harga-produk?search=${encodeURIComponent(searchTerm)}&cabang_id=${selectedCabangId}&kategori_id=${selectedKategoriId}&page=${page}&limit=${limit}&sortBy=${sortField}&sortOrder=${sortOrder}`);
      const json = await res.json();
      if (json.success) {
        setHargaProduks(json.data);
        if (json.pagination) {
          setTotalPages(json.pagination.totalPages);
          setTotalData(json.pagination.totalData);
        }
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // debounce search
    const timer = setTimeout(() => {
      fetchHargaProduk();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm, selectedCabangId, selectedKategoriId, page, limit, sortField, sortOrder]);

  const handleOpenModal = (hargaProduk = null) => {
    if (hargaProduk) {
      // Ensure the edited product exists in the produks array so select renders properly
      setProduks(prev => {
        if (hargaProduk.produk && !prev.find(p => p.id === hargaProduk.produk.id)) {
          return [hargaProduk.produk, ...prev];
        }
        return prev;
      });
      setFormData({
        id: hargaProduk.id,
        produk_id: hargaProduk.produk_id,
        cabang_id: hargaProduk.cabang_id,
        harga: hargaProduk.harga
      });
    } else {
      setFormData({ id: null, produk_id: "", cabang_id: "", harga: "" });
      setProdukSearch("");
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const url = formData.id ? `/api/master/harga-produk/${formData.id}` : "/api/master/harga-produk";
      const method = formData.id ? "PUT" : "POST";
      
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          produk_id: formData.produk_id,
          cabang_id: formData.cabang_id,
          harga: formData.harga
        })
      });
      
      const json = await res.json();
      
      if (res.ok && json.success) {
        setIsModalOpen(false);
        fetchHargaProduk();
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
    showConfirm(
      "Konfirmasi Hapus",
      "Apakah Anda yakin ingin menghapus harga khusus cabang ini? Sistem akan kembali menggunakan Harga Default produk.", 
      async () => {
      try {
        const res = await fetch(`/api/master/harga-produk/${id}`, { method: "DELETE" });
        const json = await res.json();
        
        if (res.ok && json.success) {
          fetchHargaProduk();
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
      const res = await fetch("/api/master/harga-produk?export=true");
      const json = await res.json();
      
      if (json.success) {
        const exportData = json.data.map(h => ({
          KODE_PRODUK: h.produk?.kode || "",
          NAMA_PRODUK: h.produk?.nama || "",
          KODE_CABANG: h.cabang?.kode || "",
          NAMA_CABANG: h.cabang?.nama || "",
          HARGA: parseFloat(h.harga || 0)
        }));
        exportToExcel(exportData, "master_harga_produk.xlsx");
      }
    } catch (error) {
      showToast("Gagal mengambil data untuk export", "error");
    }
  };

  const handleDownloadTemplate = () => {
    const templateData = [
      {
        KODE_PRODUK: "P001",
        KODE_CABANG: "CBG01",
        HARGA: 150000
      },
      {
        KODE_PRODUK: "P002",
        KODE_CABANG: "CBG02",
        HARGA: 250000
      }
    ];
    exportToExcel(templateData, "template_import_harga_produk.xlsx");
  };

  const handleImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    try {
      const data = await parseExcel(file);
      
      if (!data || data.length === 0) {
        showToast("File Excel kosong atau format tidak sesuai", "error");
        return;
      }

      let successCount = 0;
      let errorCount = 0;

      // Process sequentially to avoid overwhelming the server
      for (const row of data) {
        if (!row.KODE_PRODUK || !row.KODE_CABANG || row.HARGA === undefined) {
          errorCount++;
          continue;
        }

        try {
          const res = await fetch("/api/master/harga-produk", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              kode_produk: row.KODE_PRODUK,
              kode_cabang: row.KODE_CABANG,
              harga: row.HARGA,
              is_import: true
            })
          });
          
          if (res.ok) {
            successCount++;
          } else {
            errorCount++;
          }
        } catch (err) {
          errorCount++;
        }
      }

      fetchHargaProduk();
      showToast(`Import selesai. Berhasil: ${successCount}, Gagal: ${errorCount}`, successCount > 0 ? "success" : "error");
      
    } catch (error) {
      console.error(error);
      showToast("Gagal membaca file Excel", "error");
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  if (!mounted) return null;

  return (
    <div className="space-y-6">
      {mounted && document.getElementById("header-actions-portal") && createPortal(
        <>
          <button 
            onClick={() => handleOpenModal()}
            className="bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-200 text-white dark:text-neutral-900 px-4 py-1.5 rounded-full font-medium flex items-center gap-2 transition-colors shadow-sm text-sm mr-1"
          >
            <FiPlus className="w-4 h-4" />
            <span className="hidden sm:inline">Tambah Harga</span>
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

      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-neutral-100 dark:border-neutral-800 flex flex-col sm:flex-row gap-4 justify-between items-center bg-neutral-50/50 dark:bg-neutral-900/50">
          <div className="relative w-full sm:w-80">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 w-5 h-5" />
            <input 
              type="text" 
              placeholder="Cari produk atau cabang..." 
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              className="w-full pl-10 pr-4 py-2 bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all dark:text-white sm:text-sm"
            />
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <div className="relative w-full sm:w-48">
              <select
                value={selectedKategoriId}
                onChange={(e) => {
                  setSelectedKategoriId(e.target.value);
                  setPage(1);
                }}
                className="block w-full px-4 py-2 border border-neutral-200 dark:border-neutral-700 rounded-xl leading-5 bg-white dark:bg-neutral-950 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-colors sm:text-sm appearance-none dark:text-white"
              >
                <option value="all">Semua Kategori</option>
                {kategoris.map(k => (
                  <option key={k.id} value={k.id}>{k.kode} - {k.nama}</option>
                ))}
              </select>
            </div>
            
            <div className="relative w-full sm:w-56">
              <select
                value={selectedCabangId}
                onChange={(e) => {
                  setSelectedCabangId(e.target.value);
                  setPage(1);
                }}
                className="block w-full px-4 py-2 border border-neutral-200 dark:border-neutral-700 rounded-xl leading-5 bg-white dark:bg-neutral-950 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-colors sm:text-sm appearance-none dark:text-white"
              >
                <option value="all">Semua Cabang</option>
                {cabangs.map(c => (
                  <option key={c.id} value={c.id}>{c.kode} - {c.nama}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-neutral-50 dark:bg-neutral-900">
              <tr>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">No</th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors group select-none" onClick={() => handleSort('produk')}>
                  <div className="flex items-center gap-2">Produk {renderSortIcon('produk')}</div>
                </th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                  Kategori
                </th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors group select-none" onClick={() => handleSort('cabang')}>
                  <div className="flex items-center gap-2">Cabang {renderSortIcon('cabang')}</div>
                </th>
                <th scope="col" className="px-6 py-4 text-right text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                  Harga Pusat
                </th>
                <th scope="col" className="px-6 py-4 text-right text-xs font-semibold text-neutral-500 uppercase tracking-wider cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors group select-none" onClick={() => handleSort('harga')}>
                  <div className="flex items-center justify-end gap-2">Harga Cabang {renderSortIcon('harga')}</div>
                </th>
                <th scope="col" className="px-6 py-4 text-right text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                  Selisih Harga
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
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {isLoading ? (
                <tr>
                  <td colSpan="8" className="px-6 py-8 text-center text-neutral-500">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                      <span>Memuat data...</span>
                    </div>
                  </td>
                </tr>
              ) : hargaProduks.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-8 text-center text-neutral-500">
                    Tidak ada data harga khusus cabang yang ditemukan.
                  </td>
                </tr>
              ) : (
                hargaProduks.map((h, index) => (
                  <tr key={h.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">
                      {(page - 1) * limit + index + 1}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-neutral-900 dark:text-white">
                        {h.produk?.nama}
                      </div>
                      <div className="text-xs text-neutral-500">
                        {h.produk?.kode}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-neutral-900 dark:text-white">
                        {h.produk?.kategori?.nama || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-neutral-900 dark:text-white">
                        {h.cabang?.nama}
                      </div>
                      <div className="text-xs text-neutral-500">
                        {h.cabang?.kode}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-neutral-500 dark:text-neutral-400">
                      Rp {parseFloat(h.produk?.harga_default || 0).toLocaleString('id-ID')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-neutral-900 dark:text-white">
                      Rp {parseFloat(h.harga).toLocaleString('id-ID')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium">
                      {(() => {
                        const selisih = parseFloat(h.harga) - parseFloat(h.produk?.harga_default || 0);
                        return (
                          <span className={`${selisih > 0 ? 'text-green-600 dark:text-green-500' : selisih < 0 ? 'text-red-600 dark:text-red-500' : 'text-neutral-500'}`}>
                            {selisih > 0 ? '+' : ''}{selisih.toLocaleString('id-ID')}
                          </span>
                        );
                      })()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-neutral-500">
                      {h.dibuat_oleh ? <div>{h.dibuat_oleh} <br/><span className="text-[10px] opacity-70">{dayjs(h.dibuat_tanggal).format('DD/MM/YY HH:mm')}</span></div> : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-neutral-500">
                      {h.diubah_oleh ? <div>{h.diubah_oleh} <br/><span className="text-[10px] opacity-70">{dayjs(h.diubah_tanggal).format('DD/MM/YY HH:mm')}</span></div> : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => handleOpenModal(h)} className="p-2 text-neutral-400 hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-lg transition-colors">
                          <FiEdit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(h.id)} className="p-2 text-neutral-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
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
        {!isLoading && hargaProduks.length > 0 && (
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
      {isModalOpen && mounted && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-neutral-900/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-xl w-full max-w-md animate-in zoom-in-95 flex flex-col">
            <div className="px-6 py-4 border-b border-neutral-100 dark:border-neutral-800 flex justify-between items-center bg-white dark:bg-neutral-900 rounded-t-2xl">
              <h3 className="text-lg font-bold text-neutral-900 dark:text-white">
                {formData.id ? `Edit Harga Produk` : `Tambah Harga Produk`}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-neutral-400 hover:text-neutral-600 transition-colors">
                <FiX className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="flex flex-col bg-white dark:bg-neutral-900 rounded-b-2xl">
              <div className="p-6 space-y-4">
                
                <div ref={produkDropdownRef} className="relative">
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Produk *</label>
                  
                  <div 
                    className={`w-full px-4 py-2 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl outline-none transition-all dark:text-white flex justify-between items-center cursor-pointer ${formData.id !== null ? 'opacity-60 cursor-not-allowed' : 'focus-within:ring-2 focus-within:ring-orange-500/20 focus-within:border-orange-500'}`}
                    onClick={() => {
                      if (formData.id === null) setIsProdukDropdownOpen(!isProdukDropdownOpen);
                    }}
                  >
                    <span className={formData.produk_id ? "text-neutral-900 dark:text-white" : "text-neutral-500"}>
                      {formData.produk_id 
                        ? (produks.find(p => p.id.toString() === formData.produk_id.toString()) 
                            ? `${produks.find(p => p.id.toString() === formData.produk_id.toString()).kode} - ${produks.find(p => p.id.toString() === formData.produk_id.toString()).nama}` 
                            : 'Produk terpilih') 
                        : 'Pilih Produk...'}
                    </span>
                    <FiChevronDown className={`w-4 h-4 text-neutral-500 transition-transform ${isProdukDropdownOpen ? 'rotate-180' : ''}`} />
                  </div>

                  {isProdukDropdownOpen && (
                    <div className="absolute z-50 w-full mt-1 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-lg max-h-60 flex flex-col overflow-hidden">
                      <div className="p-2 border-b border-neutral-100 dark:border-neutral-800">
                        <div className="relative">
                          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 w-4 h-4" />
                          <input 
                            type="text" 
                            placeholder="Cari nama atau kode produk..." 
                            value={produkSearch}
                            onChange={(e) => setProdukSearch(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-lg focus:outline-none focus:border-orange-500 text-sm dark:text-white"
                            onClick={(e) => e.stopPropagation()}
                            autoFocus
                          />
                        </div>
                      </div>
                      <div className="overflow-y-auto p-1">
                        {produks.filter(p => p.nama.toLowerCase().includes(produkSearch.toLowerCase()) || p.kode.toLowerCase().includes(produkSearch.toLowerCase())).length === 0 ? (
                          <div className="px-3 py-4 text-sm text-neutral-500 text-center">Produk tidak ditemukan</div>
                        ) : (
                          <>
                            {produks.filter(p => p.nama.toLowerCase().includes(produkSearch.toLowerCase()) || p.kode.toLowerCase().includes(produkSearch.toLowerCase())).map(p => (
                              <div 
                                key={p.id} 
                                className={`px-3 py-2 text-sm rounded-lg cursor-pointer transition-colors ${formData.produk_id?.toString() === p.id.toString() ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 font-medium' : 'hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300'}`}
                                onClick={() => {
                                  setFormData({...formData, produk_id: p.id.toString()});
                                  setIsProdukDropdownOpen(false);
                                  setProdukSearch("");
                                }}
                              >
                                <div className="font-medium">{p.nama}</div>
                                <div className="text-xs opacity-70">{p.kode}</div>
                              </div>
                            ))}
                            {produks.length >= 50 && (
                              <div className="px-3 py-3 mt-1 text-xs text-center text-neutral-400 border-t border-neutral-100 dark:border-neutral-800">
                                Ketik nama/kode untuk mencari produk lainnya...
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Cabang *</label>
                  <select 
                    required
                    disabled={formData.id !== null}
                    className="w-full px-4 py-2 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all dark:text-white disabled:opacity-60"
                    value={formData.cabang_id}
                    onChange={(e) => setFormData({...formData, cabang_id: e.target.value})}
                  >
                    <option value="">Pilih Cabang...</option>
                    {cabangs.map(c => (
                      <option key={c.id} value={c.id}>{c.kode} - {c.nama}</option>
                    ))}
                  </select>
                </div>

                {formData.produk_id && (() => {
                  const selectedProduk = produks.find(p => p.id.toString() === formData.produk_id.toString());
                  const hargaPusat = selectedProduk ? parseFloat(selectedProduk.harga_default) : 0;
                  const hargaCabang = parseFloat(formData.harga) || 0;
                  const selisih = hargaCabang - hargaPusat;
                  
                  return (
                    <div className="bg-neutral-50 dark:bg-neutral-800/50 p-4 rounded-xl space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-neutral-500 dark:text-neutral-400">Harga Pusat</span>
                        <span className="font-semibold text-neutral-900 dark:text-white">Rp {hargaPusat.toLocaleString('id-ID')}</span>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Harga Cabang *</label>
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500 font-medium">Rp</span>
                          <input 
                            type="number"
                            min="0" 
                            required
                            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-700 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all dark:text-white font-medium"
                            placeholder="0"
                            value={formData.harga}
                            onChange={(e) => setFormData({...formData, harga: e.target.value})}
                          />
                        </div>
                      </div>

                      <div className="flex justify-between items-center pt-2 border-t border-neutral-200 dark:border-neutral-700">
                        <span className="text-sm text-neutral-500 dark:text-neutral-400">Selisih Harga</span>
                        <span className={`font-semibold ${selisih > 0 ? 'text-green-600 dark:text-green-500' : selisih < 0 ? 'text-red-600 dark:text-red-500' : 'text-neutral-500'}`}>
                          {selisih > 0 ? '+' : ''}{selisih.toLocaleString('id-ID')}
                        </span>
                      </div>
                    </div>
                  );
                })()}

              </div>
              
              <div className="px-6 py-4 border-t border-neutral-100 dark:border-neutral-800 flex justify-end gap-3 bg-neutral-50 dark:bg-neutral-900/50 rounded-b-2xl">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-800 rounded-xl transition-colors"
                >
                  Batal
                </button>
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 text-sm font-medium bg-orange-600 hover:bg-orange-700 text-white rounded-xl transition-colors disabled:opacity-50 flex items-center gap-2 shadow-sm shadow-orange-600/20"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                      Menyimpan...
                    </>
                  ) : (
                    'Simpan Data'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
