"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { createPortal } from "react-dom";
import { FiPlus, FiEdit2, FiTrash2, FiX, FiDownload, FiUpload, FiFileText, FiTrendingUp, FiTrendingDown, FiMinus } from "react-icons/fi";
import { exportToExcel, parseExcel } from "@/lib/excel";
import { useUIStore } from "@/store/ui.store";
import dayjs from "dayjs";
import { DataTable } from "@/components/table";
import { useDataTable } from "@/hooks/useDataTable";

export default function HargaProdukPage() {
  const [hargaProduks, setHargaProduks] = useState([]);
  const [produks, setProduks] = useState([]);
  const [cabangs, setCabangs] = useState([]);
  const [kategoris, setKategoris] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isImporting, setIsImporting] = useState(false);
  
  const [produkSearch, setProdukSearch] = useState("");
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

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({ id: null, produk_id: "", cabang_id: "", harga: "" });
  const [mounted, setMounted] = useState(false);
  const [hargaDefault, setHargaDefault] = useState(null);
  const [isFetchingDefault, setIsFetchingDefault] = useState(false);
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
      const params = buildParams();
      const res = await fetch(`/api/master/harga-produk?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        setHargaProduks(json.data);
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
    if (mounted) {
      const timer = setTimeout(() => {
        fetchHargaProduk();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [
    tableState.searchValue,
    tableState.page,
    tableState.pageSize,
    tableState.sortField,
    tableState.sortOrder,
    tableState.columnFilters,
    mounted
  ]);

  const handleOpenModal = (hargaProduk = null) => {
    setHargaDefault(null);
    if (hargaProduk) {
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
      // Set harga default dari data produk yang sudah ada
      if (hargaProduk.produk?.harga_default !== undefined) {
        setHargaDefault(parseFloat(hargaProduk.produk.harga_default) || 0);
      }
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

  const handleExport = async (type) => {
    try {
      showToast("Sedang menyiapkan file export...", "info");
      let dataToExport = [];
      
      if (type === "page") {
        dataToExport = hargaProduks;
      } else {
        const res = await fetch("/api/master/harga-produk?export=true");
        const json = await res.json();
        if (json.success) {
          dataToExport = json.data;
        } else {
          showToast("Gagal mengambil data untuk export", "error");
          return;
        }
      }

      const exportData = dataToExport.map(h => ({
        KODE_PRODUK: h.produk?.kode || "",
        NAMA_PRODUK: h.produk?.nama || "",
        KODE_CABANG: h.cabang?.kode || "",
        NAMA_CABANG: h.cabang?.nama || "",
        HARGA: parseFloat(h.harga || 0)
      }));
      exportToExcel(exportData, "master_harga_produk.xlsx");
      showToast("Data harga produk berhasil diexport.", "success");
    } catch (error) {
      console.error(error);
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
          if (res.ok) successCount++;
          else errorCount++;
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

  const selectedProdukLabel = useMemo(() => {
    const p = produks.find(p => p.id === formData.produk_id);
    return p ? `${p.kode} - ${p.nama}` : "";
  }, [formData.produk_id, produks]);

  // Fetch harga default ketika produk dipilih
  useEffect(() => {
    if (!formData.produk_id || !isModalOpen) return;
    // Cek dulu dari data produks yang sudah diload
    const existing = produks.find(p => String(p.id) === String(formData.produk_id));
    if (existing?.harga_default !== undefined) {
      setHargaDefault(parseFloat(existing.harga_default) || 0);
      return;
    }
    // Jika tidak ada, fetch dari API
    const fetchDefault = async () => {
      setIsFetchingDefault(true);
      try {
        const res = await fetch(`/api/master/produk/${formData.produk_id}`);
        const json = await res.json();
        if (json.success && json.data) {
          setHargaDefault(parseFloat(json.data.harga_default) || 0);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsFetchingDefault(false);
      }
    };
    fetchDefault();
  }, [formData.produk_id, isModalOpen]);

  const selisihHarga = useMemo(() => {
    if (hargaDefault === null || formData.harga === "") return null;
    return parseFloat(formData.harga) - hargaDefault;
  }, [formData.harga, hargaDefault]);

  const filterCabangOptions = useMemo(() => {
    return cabangs.map(c => ({ value: String(c.id), label: c.nama }));
  }, [cabangs]);

  const columns = useMemo(() => [
    {
      key: "id",
      label: "No",
      sortable: true,
      width: 80,
      render: (row) => {
        const idx = hargaProduks.findIndex(hp => hp.id === row.id);
        return idx !== -1 ? (tableState.page - 1) * tableState.pageSize + idx + 1 : "—";
      }
    },
    {
      key: "produk.kode",
      label: "Kode Produk",
      sortable: true,
      filter: { type: "text" },
      render: (row) => row.produk?.kode
    },
    {
      key: "produk.nama",
      label: "Nama Produk",
      sortable: true,
      filter: { type: "text" },
      render: (row) => (
        <span className="font-semibold text-neutral-900 dark:text-neutral-200">
          {row.produk?.nama}
        </span>
      )
    },
    {
      key: "cabang_id",
      label: "Cabang",
      sortable: true,
      filter: { type: "select", options: filterCabangOptions },
      render: (row) => row.cabang?.nama
    },
    {
      key: "harga",
      label: "Harga Khusus",
      sortable: true,
      filter: { type: "number" },
      render: (row) => (
        <div className="text-right font-semibold text-orange-600 dark:text-orange-500">
          Rp {Number(row.harga).toLocaleString('id-ID')}
        </div>
      )
    },
    {
      key: "dibuat_oleh",
      label: "Dibuat Oleh",
      sortable: true,
      filter: {
        type: "composite",
        fields: [
          { key: "dibuat_oleh", label: "Nama Pembuat", type: "text" },
          { key: "dibuat_tanggal", label: "Tanggal Dibuat", type: "date_range" }
        ]
      },
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
      key: "diubah_oleh",
      label: "Diubah Oleh",
      sortable: true,
      filter: {
        type: "composite",
        fields: [
          { key: "diubah_oleh", label: "Nama Pengubah", type: "text" },
          { key: "diubah_tanggal", label: "Tanggal Diubah", type: "date_range" }
        ]
      },
      render: (row) => row.diubah_oleh ? (
        <div>
          {row.diubah_oleh}
          <br/>
          <span className="text-[10px] opacity-70">
            {dayjs(row.diubah_tanggal).format('DD/MM/YY HH:mm')}
          </span>
        </div>
      ) : '—'
    }
  ], [hargaProduks, tableState.page, tableState.pageSize, filterCabangOptions]);

  const actions = useMemo(() => [
    {
      label: "Edit",
      icon: FiEdit2,
      variant: "warning",
      onClick: (row) => handleOpenModal(row)
    },
    {
      label: "Hapus",
      icon: FiTrash2,
      variant: "danger",
      onClick: (row) => handleDelete(row.id)
    }
  ], []);

  if (!mounted) return null;

  return (
    <div className="space-y-6">
      <DataTable
        columns={columns}
        data={hargaProduks}
        isLoading={isLoading}
        emptyText="Tidak ada data harga khusus ditemukan."
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
        searchPlaceholder="Cari cabang, kode, nama produk, atau harga..."
        // Column Filters
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
              title="Tambah Harga"
            >
              <FiPlus className="w-3.5 h-3.5" />
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

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95">
            <div className="px-6 py-4 border-b border-neutral-100 dark:border-neutral-800 flex justify-between items-center">
              <h3 className="text-lg font-bold text-neutral-900 dark:text-white">
                {formData.id ? `Edit Harga Produk` : `Tambah Harga Produk`}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-neutral-400 hover:text-neutral-600 transition-colors">
                <FiX className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                {/* Cari & Pilih Produk */}
                <div className="relative" ref={produkDropdownRef}>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Cari Produk *</label>
                  <div className="relative">
                    <input 
                      type="text"
                      className="w-full px-4 py-2 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all dark:text-white"
                      placeholder="Ketik kode atau nama produk..."
                      value={formData.produk_id ? selectedProdukLabel : produkSearch}
                      onChange={(e) => {
                        setProdukSearch(e.target.value);
                        if (formData.produk_id) {
                          setFormData({ ...formData, produk_id: "" });
                        }
                        setIsProdukDropdownOpen(true);
                      }}
                      onFocus={() => setIsProdukDropdownOpen(true)}
                    />
                    {formData.produk_id && (
                      <button 
                        type="button"
                        onClick={() => {
                          setFormData({ ...formData, produk_id: "" });
                          setProdukSearch("");
                        }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                      >
                        <FiX className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  
                  {isProdukDropdownOpen && !formData.produk_id && (
                    <div className="absolute z-10 w-full mt-1 bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                      {produks.length === 0 ? (
                        <div className="px-4 py-2.5 text-xs text-neutral-500 text-center">Produk tidak ditemukan</div>
                      ) : (
                        produks.map(p => (
                          <button
                            key={p.id}
                            type="button"
                            className="w-full text-left px-4 py-2 hover:bg-neutral-50 dark:hover:bg-neutral-900 text-xs font-semibold text-neutral-700 dark:text-neutral-300 transition-colors"
                            onClick={() => {
                              setFormData({ ...formData, produk_id: p.id });
                              setIsProdukDropdownOpen(false);
                            }}
                          >
                            <span className="text-orange-600 dark:text-orange-500 font-bold">{p.kode}</span> - {p.nama}
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>

                {/* Pilih Cabang */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Pilih Cabang *</label>
                  <select 
                    required
                    className="w-full px-4 py-2 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all dark:text-white"
                    value={formData.cabang_id}
                    onChange={(e) => setFormData({...formData, cabang_id: e.target.value})}
                  >
                    <option value="" disabled>Pilih Cabang</option>
                    {cabangs.map(c => (
                      <option key={c.id} value={c.id}>{c.nama}</option>
                    ))}
                  </select>
                </div>

                {/* Info Harga Default/Pusat */}
                {formData.produk_id && (
                  <div className="rounded-xl border border-blue-200/70 dark:border-blue-900/40 bg-blue-50/60 dark:bg-blue-950/20 p-3">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-blue-500 dark:text-blue-400 mb-1.5">Harga Default / Pusat</p>
                    {isFetchingDefault ? (
                      <div className="flex items-center gap-2">
                        <div className="w-3.5 h-3.5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                        <span className="text-xs text-blue-500">Memuat harga default...</span>
                      </div>
                    ) : hargaDefault !== null ? (
                      <p className="text-lg font-bold text-blue-700 dark:text-blue-300">
                        Rp {hargaDefault.toLocaleString('id-ID')}
                      </p>
                    ) : (
                      <p className="text-xs text-blue-400">Pilih produk untuk melihat harga default</p>
                    )}
                  </div>
                )}

                {/* Nilai Harga Khusus */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Harga Cabang Khusus *</label>
                  <input 
                    type="number" 
                    required 
                    min="0"
                    className="w-full px-4 py-2 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all dark:text-white"
                    value={formData.harga}
                    onChange={(e) => setFormData({...formData, harga: e.target.value})}
                    placeholder="Contoh: 150000"
                  />
                </div>

                {/* Selisih Harga */}
                {selisihHarga !== null && (
                  <div className={`rounded-xl border p-3 flex items-center gap-3 ${
                    selisihHarga > 0
                      ? "bg-orange-50/60 dark:bg-orange-950/20 border-orange-200/70 dark:border-orange-900/40"
                      : selisihHarga < 0
                      ? "bg-green-50/60 dark:bg-green-950/20 border-green-200/70 dark:border-green-900/40"
                      : "bg-neutral-50 dark:bg-neutral-800/30 border-neutral-200 dark:border-neutral-700"
                  }`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      selisihHarga > 0
                        ? "bg-orange-100 dark:bg-orange-900/40 text-orange-600 dark:text-orange-400"
                        : selisihHarga < 0
                        ? "bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400"
                        : "bg-neutral-200 dark:bg-neutral-700 text-neutral-500"
                    }`}>
                      {selisihHarga > 0 ? <FiTrendingUp className="w-4 h-4" /> : selisihHarga < 0 ? <FiTrendingDown className="w-4 h-4" /> : <FiMinus className="w-4 h-4" />}
                    </div>
                    <div>
                      <p className={`text-[10px] font-semibold uppercase tracking-wider mb-0.5 ${
                        selisihHarga > 0 ? "text-orange-500 dark:text-orange-400" : selisihHarga < 0 ? "text-green-500 dark:text-green-400" : "text-neutral-500"
                      }`}>
                        {selisihHarga > 0 ? "Lebih Mahal dari Pusat" : selisihHarga < 0 ? "Lebih Murah dari Pusat" : "Sama dengan Harga Pusat"}
                      </p>
                      <p className={`text-base font-bold ${
                        selisihHarga > 0 ? "text-orange-700 dark:text-orange-300" : selisihHarga < 0 ? "text-green-700 dark:text-green-300" : "text-neutral-600 dark:text-neutral-400"
                      }`}>
                        {selisihHarga !== 0 ? `${selisihHarga > 0 ? '+' : ''}Rp ${selisihHarga.toLocaleString('id-ID')}` : "Tidak ada selisih"}
                      </p>
                    </div>
                  </div>
                )}
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
