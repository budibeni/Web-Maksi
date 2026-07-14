"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { FiSearch, FiPlus, FiEdit2, FiTrash2, FiX, FiDownload, FiUser, FiPhone, FiMapPin, FiEye } from "react-icons/fi";
import { exportToExcel } from "@/lib/excel";
import { useUIStore } from "@/store/ui.store";
import dayjs from "dayjs";

export default function CustomerPage() {
  const [customers, setCustomers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const formatWhatsAppUrl = (phone) => {
    if (!phone) return '#';
    let cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.startsWith('0')) {
      cleanPhone = '62' + cleanPhone.substring(1);
    }
    return `https://wa.me/${cleanPhone}`;
  };

  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalData, setTotalData] = useState(0);
  
  const [sortField, setSortField] = useState("id");
  const [sortOrder, setSortOrder] = useState("desc");

  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
    setPage(1);
  };

  const renderSortIcon = (field) => {
    if (sortField !== field) return <span className="text-neutral-300 dark:text-neutral-700 opacity-0 group-hover:opacity-100">↑↓</span>;
    return sortOrder === 'asc' 
      ? <span className="text-orange-500">↑</span> 
      : <span className="text-orange-500">↓</span>;
  };

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
      const res = await fetch(`/api/customer?search=${encodeURIComponent(searchTerm)}&page=${page}&limit=${limit}&sortField=${sortField}&sortOrder=${sortOrder}`);
      const json = await res.json();
      if (json.success) {
        setCustomers(json.data);
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
    const timer = setTimeout(() => {
      fetchCustomers();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm, page, limit, sortField, sortOrder]);

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
    // Export 1000 latest data
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

  return (
    <div className="space-y-6">
      {mounted && document.getElementById("header-actions-portal") && createPortal(
          <>
            <button 
              onClick={() => handleOpenModal()}
              className="bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-200 text-white dark:text-neutral-900 px-4 py-1.5 rounded-full font-medium flex items-center gap-2 transition-colors shadow-sm text-sm mr-1"
            >
              <FiPlus className="w-4 h-4" />
              <span className="hidden sm:inline">Tambah Customer</span>
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
              placeholder="Cari nama atau telepon..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-neutral-200 dark:divide-neutral-800">
            <thead className="bg-neutral-50 dark:bg-neutral-900">
              <tr>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider cursor-pointer group" onClick={() => handleSort('id')}>
                  <div className="flex items-center gap-1">No {renderSortIcon('id')}</div>
                </th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider cursor-pointer group" onClick={() => handleSort('nama')}>
                  <div className="flex items-center gap-1">Nama {renderSortIcon('nama')}</div>
                </th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider cursor-pointer group" onClick={() => handleSort('telepon')}>
                  <div className="flex items-center gap-1">Telepon {renderSortIcon('telepon')}</div>
                </th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider hidden md:table-cell cursor-pointer group" onClick={() => handleSort('alamat')}>
                  <div className="flex items-center gap-1">Alamat {renderSortIcon('alamat')}</div>
                </th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider hidden lg:table-cell cursor-pointer group" onClick={() => handleSort('catatan')}>
                  <div className="flex items-center gap-1">Catatan {renderSortIcon('catatan')}</div>
                </th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider cursor-pointer group" onClick={() => handleSort('dibuat_tanggal')}>
                  <div className="flex items-center gap-1">Dibuat Oleh {renderSortIcon('dibuat_tanggal')}</div>
                </th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider cursor-pointer group" onClick={() => handleSort('diubah_tanggal')}>
                  <div className="flex items-center gap-1">Diubah Oleh {renderSortIcon('diubah_tanggal')}</div>
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
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-8 text-center text-neutral-500">
                    Tidak ada data customer yang ditemukan.
                  </td>
                </tr>
              ) : (
                customers.map((c, i) => (
                  <tr key={c.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors group">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">
                      {(page - 1) * limit + i + 1}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 flex-shrink-0 rounded-full bg-gradient-to-br from-orange-100 to-orange-200 dark:from-orange-900/40 dark:to-orange-800/40 flex items-center justify-center">
                          <FiUser className="h-5 w-5 text-orange-600 dark:text-orange-500" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-neutral-900 dark:text-white">
                            {c.nama}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <a 
                        href={formatWhatsAppUrl(c.telepon)} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-sm text-orange-600 hover:text-orange-700 dark:text-orange-500 dark:hover:text-orange-400 font-medium flex items-center gap-1.5 transition-colors"
                        title="Chat via WhatsApp"
                      >
                        <FiPhone className="w-4 h-4" />
                        {c.telepon}
                      </a>
                    </td>
                    <td className="px-6 py-4 hidden md:table-cell">
                      <div className="text-sm text-neutral-600 dark:text-neutral-300 max-w-xs truncate" title={c.alamat}>
                        {c.alamat || ""}
                      </div>
                    </td>
                    <td className="px-6 py-4 hidden lg:table-cell">
                      <div className="text-sm text-neutral-600 dark:text-neutral-300 max-w-xs truncate" title={c.catatan}>
                        {c.catatan || ""}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-neutral-500">
                      {c.dibuat_oleh ? <div>{c.dibuat_oleh} <br/><span className="text-[10px] opacity-70">{dayjs(c.dibuat_tanggal).format('DD/MM/YY HH:mm')}</span></div> : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-neutral-500">
                      {c.diubah_oleh ? <div>{c.diubah_oleh} <br/><span className="text-[10px] opacity-70">{c.diubah_tanggal ? dayjs(c.diubah_tanggal).format('DD/MM/YY HH:mm') : '-'}</span></div> : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <Link 
                          href={`/customer/${c.id}`}
                          className="p-2 text-neutral-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                          title="Lihat Detail"
                        >
                          <FiEye className="w-4 h-4" />
                        </Link>
                        <button 
                          onClick={() => handleOpenModal(c)}
                          className="p-2 text-neutral-400 hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/30 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <FiEdit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(c.id)}
                          className="p-2 text-neutral-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                          title="Hapus"
                        >
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
        {!isLoading && customers.length > 0 && (
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
