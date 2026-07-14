"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { FiSearch, FiPlus, FiEdit2, FiTrash2, FiX, FiDownload, FiUpload } from "react-icons/fi";
import { exportToExcel, parseExcel } from "@/lib/excel";
import { useUIStore } from "@/store/ui.store";

export default function PenggunaPage() {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [cabangs, setCabangs] = useState([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({ 
    id: null, 
    nama: "", 
    username: "", 
    password: "", 
    telepon: "", 
    cabang_id: "", 
    role_id: "", 
    aktif: 1 
  });
  const [mounted, setMounted] = useState(false);
  const fileInputRef = useRef(null);
  const { showToast, showConfirm } = useUIStore();

  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [resUsers, resRoles, resCabangs] = await Promise.all([
        fetch("/api/master/user"),
        fetch("/api/master/role"),
        fetch("/api/master/cabang")
      ]);
      
      const [jsonUsers, jsonRoles, jsonCabangs] = await Promise.all([
        resUsers.json(),
        resRoles.json(),
        resCabangs.json()
      ]);

      if (jsonUsers.success) setUsers(jsonUsers.data);
      if (jsonRoles.success) setRoles(jsonRoles.data);
      if (jsonCabangs.success) setCabangs(jsonCabangs.data);

    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenModal = (user = null) => {
    if (user) {
      setFormData({
        id: user.id,
        nama: user.nama,
        username: user.username,
        password: "", // Leave blank on edit unless they want to change
        telepon: user.telepon || "",
        cabang_id: user.cabang_id,
        role_id: user.role_id,
        aktif: user.aktif
      });
    } else {
      setFormData({ 
        id: null, 
        nama: "", 
        username: "", 
        password: "", 
        telepon: "", 
        cabang_id: cabangs.length > 0 ? cabangs[0].id : "", 
        role_id: roles.length > 0 ? roles[0].id : "", 
        aktif: 1 
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const url = formData.id ? `/api/master/user/${formData.id}` : "/api/master/user";
      const method = formData.id ? "PUT" : "POST";
      
      const payload = {
        nama: formData.nama,
        username: formData.username,
        telepon: formData.telepon,
        cabang_id: formData.cabang_id,
        role_id: formData.role_id,
        aktif: parseInt(formData.aktif)
      };

      if (!formData.id || (formData.password && formData.password.trim() !== "")) {
        payload.password = formData.password;
      }
      
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
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
    showConfirm(
      "Konfirmasi Hapus",
      "Apakah Anda yakin ingin menghapus pengguna ini?", 
      async () => {
      try {
        const res = await fetch(`/api/master/user/${id}`, { method: "DELETE" });
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
    });
  };

  const handleExport = () => {
    const exportData = users.map(u => ({
      NAMA: u.nama,
      USERNAME: u.username,
      TELEPON: u.telepon || "",
      ROLE_ID: u.role_id || "",
      CABANG_ID: u.cabang_id || "",
      STATUS: u.aktif === 1 ? "Aktif" : "Nonaktif"
    }));
    exportToExcel(exportData, "master_pengguna.xlsx");
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
        if (!row.NAMA || !row.USERNAME || !row.ROLE_ID || !row.CABANG_ID) continue;

        const payload = {
          nama: row.NAMA,
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

  const filteredData = users.filter(u => 
    u.nama.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {mounted && document.getElementById("header-actions-portal") && createPortal(
          <>
            <button 
              onClick={() => handleOpenModal()}
              className="bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-200 text-white dark:text-neutral-900 px-4 py-1.5 rounded-full font-medium flex items-center gap-2 transition-colors shadow-sm text-sm mr-1"
            >
              <FiPlus className="w-4 h-4" />
              <span className="hidden sm:inline">Tambah Pengguna</span>
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
              placeholder="Cari nama atau username..."
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
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">Nama Lengkap</th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">Username</th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">Role</th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">Cabang</th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">Status</th>
                <th scope="col" className="px-6 py-4 text-right text-xs font-semibold text-neutral-500 uppercase tracking-wider">Aksi</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-neutral-900 divide-y divide-neutral-100 dark:divide-neutral-800">
              {isLoading ? (
                <tr>
                  <td colSpan="7" className="px-6 py-10 text-center text-neutral-500">
                    <div className="flex justify-center items-center gap-2">
                      <div className="w-5 h-5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                      <span>Memuat data...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredData.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-10 text-center text-neutral-500">
                    Tidak ada data ditemukan.
                  </td>
                </tr>
              ) : (
                filteredData.map((user, index) => (
                  <tr key={user.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
                    <td className="px-6 py-3 whitespace-nowrap text-sm text-neutral-500">{index + 1}</td>
                    <td className="px-6 py-3 whitespace-nowrap text-sm font-medium text-neutral-900 dark:text-white">{user.nama}</td>
                    <td className="px-6 py-3 whitespace-nowrap text-sm text-neutral-900 dark:text-neutral-200">{user.username}</td>
                    <td className="px-6 py-3 whitespace-nowrap text-sm text-neutral-500">{user.role?.nama || "-"}</td>
                    <td className="px-6 py-3 whitespace-nowrap text-sm text-neutral-500">{user.cabang?.nama || "-"}</td>
                    <td className="px-6 py-3 whitespace-nowrap text-sm">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${user.aktif === 1 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400'}`}>
                        {user.aktif === 1 ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </td>
                    <td className="px-6 py-3 whitespace-nowrap text-sm text-right font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => handleOpenModal(user)} className="p-2 text-neutral-400 hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-lg transition-colors">
                          <FiEdit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(user.id)} className="p-2 text-neutral-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/50 backdrop-blur-sm animate-in fade-in overflow-y-auto pt-10 pb-10">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 my-auto">
            <div className="px-6 py-4 border-b border-neutral-100 dark:border-neutral-800 flex justify-between items-center sticky top-0 bg-white dark:bg-neutral-900 z-10">
              <h3 className="text-lg font-bold text-neutral-900 dark:text-white">
                {formData.id ? "Edit Pengguna" : "Tambah Pengguna"}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-neutral-400 hover:text-neutral-600 transition-colors">
                <FiX className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Nama Lengkap *</label>
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
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Username *</label>
                  <input 
                    type="text" 
                    required 
                    maxLength={50}
                    className="w-full px-4 py-2 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all dark:text-white"
                    value={formData.username}
                    onChange={(e) => setFormData({...formData, username: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                    Password {formData.id ? "(Kosongkan jika tidak diubah)" : "*"}
                  </label>
                  <input 
                    type="password" 
                    required={!formData.id}
                    minLength={6}
                    className="w-full px-4 py-2 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all dark:text-white"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Telepon</label>
                  <input 
                    type="text" 
                    maxLength={30}
                    className="w-full px-4 py-2 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all dark:text-white"
                    value={formData.telepon}
                    onChange={(e) => setFormData({...formData, telepon: e.target.value})}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Role *</label>
                    <select 
                      required
                      className="w-full px-4 py-2 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all dark:text-white"
                      value={formData.role_id}
                      onChange={(e) => setFormData({...formData, role_id: e.target.value})}
                    >
                      <option value="">-- Pilih Role --</option>
                      {roles.map(role => (
                        <option key={role.id} value={role.id}>{role.nama}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Cabang *</label>
                    <select 
                      required
                      className="w-full px-4 py-2 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all dark:text-white"
                      value={formData.cabang_id}
                      onChange={(e) => setFormData({...formData, cabang_id: e.target.value})}
                    >
                      <option value="">-- Pilih Cabang --</option>
                      {cabangs.map(cabang => (
                        <option key={cabang.id} value={cabang.id}>{cabang.nama}</option>
                      ))}
                    </select>
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
    </div>
  );
}
