"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { 
  FiSearch, FiPlus, FiEdit2, FiTrash2, FiDownload, FiUpload, 
  FiUser, FiMail, FiPhone, FiMapPin, FiShield, FiCheckCircle,
  FiXCircle, FiSettings
} from "react-icons/fi";
import { exportToExcel, parseExcel } from "@/lib/excel";
import { useUIStore } from "@/store/ui.store";

export default function PenggunaPage() {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [cabangs, setCabangs] = useState([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
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
      showToast("Gagal mengambil data pengguna.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

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

  const handleExport = () => {
    const exportData = users.map(u => ({
      NAMA: u.nama,
      EMAIL: u.email,
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

  const filteredData = users.filter(u => 
    u.nama.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {mounted && document.getElementById("header-actions-portal") && createPortal(
        <>
          <Link 
            href="/pengaturan/pengguna/baru"
            className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition-all active:scale-95 shadow-sm text-xs mr-1"
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
            className="p-2.5 text-neutral-500 hover:text-neutral-900 bg-white hover:bg-neutral-100 dark:bg-neutral-900 dark:text-neutral-400 dark:hover:text-white dark:hover:bg-neutral-800 rounded-xl transition-colors border border-neutral-200 dark:border-neutral-800"
            title="Import dari Excel"
            onClick={() => fileInputRef.current?.click()}
          >
            <FiUpload className="w-4 h-4" />
          </button>
          <button 
            className="p-2.5 text-neutral-500 hover:text-neutral-900 bg-white hover:bg-neutral-100 dark:bg-neutral-900 dark:text-neutral-400 dark:hover:text-white dark:hover:bg-neutral-800 rounded-xl transition-colors border border-neutral-200 dark:border-neutral-800"
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
              className="block w-full pl-10 pr-3 py-2 border border-neutral-200 dark:border-neutral-700 rounded-xl leading-5 bg-white dark:bg-neutral-950 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-colors sm:text-sm font-semibold dark:text-white"
              placeholder="Cari nama, email, atau username..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-neutral-200 dark:divide-neutral-800">
            <thead className="bg-neutral-50 dark:bg-neutral-900 text-neutral-400 text-[10px] uppercase font-bold tracking-wider">
              <tr>
                <th scope="col" className="px-6 py-4 text-left">No</th>
                <th scope="col" className="px-6 py-4 text-left">Nama Lengkap</th>
                <th scope="col" className="px-6 py-4 text-left">Username</th>
                <th scope="col" className="px-6 py-4 text-left">Role</th>
                <th scope="col" className="px-6 py-4 text-left">Cabang</th>
                <th scope="col" className="px-6 py-4 text-center">Status</th>
                <th scope="col" className="px-6 py-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800 font-semibold text-xs text-neutral-700 dark:text-neutral-300">
              {isLoading ? (
                <tr>
                  <td colSpan="7" className="px-6 py-10 text-center text-neutral-400">
                    <div className="flex justify-center items-center gap-2">
                      <div className="w-5 h-5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                      <span>Memuat data...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredData.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-10 text-center text-neutral-400">
                    Tidak ada data ditemukan.
                  </td>
                </tr>
              ) : (
                filteredData.map((userItem, index) => (
                  <tr key={userItem.id} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-850/20 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-neutral-400 font-medium">{index + 1}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-8 w-8 rounded-full bg-orange-50 dark:bg-orange-950/40 flex items-center justify-center text-orange-600 dark:text-orange-500 font-black text-xs">
                          {userItem.nama.charAt(0).toUpperCase()}
                        </div>
                        <div className="ml-3">
                          <p className="font-bold text-neutral-900 dark:text-white">{userItem.nama}</p>
                          <p className="text-[10px] text-neutral-400 mt-0.5 flex items-center gap-1">
                            <FiMail className="w-3 h-3" /> {userItem.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-neutral-900 dark:text-neutral-200">
                      {userItem.username}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="flex items-center gap-1.5">
                        <FiShield className="w-3.5 h-3.5 text-neutral-400" />
                        {userItem.role?.nama || "-"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="flex items-center gap-1.5">
                        <FiMapPin className="w-3.5 h-3.5 text-neutral-400" />
                        {userItem.cabang?.nama || "-"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-black uppercase border ${
                        userItem.aktif === 1 
                          ? "bg-green-50 text-green-700 border-green-200 dark:bg-green-950/30 dark:text-green-400 dark:border-green-900/50" 
                          : "bg-neutral-50 text-neutral-500 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:border-neutral-700/50"
                      }`}>
                        {userItem.aktif === 1 ? "Aktif" : "Nonaktif"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right font-medium">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link 
                          href={`/pengaturan/pengguna/${userItem.id}`} 
                          className="p-2 text-neutral-400 hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-lg transition-colors"
                          title="Edit Pengguna"
                        >
                          <FiEdit2 className="w-4 h-4" />
                        </Link>
                        <button 
                          onClick={() => handleDelete(userItem.id)} 
                          className="p-2 text-neutral-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                          title="Hapus Pengguna"
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
      </div>
    </div>
  );
}
