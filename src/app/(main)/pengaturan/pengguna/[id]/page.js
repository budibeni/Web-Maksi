"use client";

import { useState, useEffect, use, useRef } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  FiUser, FiMail, FiPhone, FiLock, FiSave, FiX,
  FiEye, FiEyeOff, FiChevronRight, FiShield, FiMapPin, FiInfo
} from "react-icons/fi";
import { useUIStore } from "@/store/ui.store";

export default function EditUserPage({ params }) {
  const router = useRouter();
  const { showToast } = useUIStore();
  const unwrappedParams = use(params);
  const userId = unwrappedParams.id;

  const [roles, setRoles] = useState([]);
  const [cabangs, setCabangs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [mounted, setMounted] = useState(false);
  const submitBtnRef = useRef(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const [showPassword, setShowPassword] = useState(false);
  const [showKonfirmasi, setShowKonfirmasi] = useState(false);

  const [form, setForm] = useState({
    nama: "",
    email: "",
    telepon: "",
    username: "",
    password: "",
    konfirmasi_password: "",
    role_id: "",
    cabang_id: "",
    aktif: 1
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    // Load Masters & User Data
    Promise.all([
      fetch("/api/master/role").then(r => r.json()),
      fetch("/api/master/cabang").then(r => r.json()),
      fetch(`/api/master/user/${userId}`).then(r => r.json())
    ]).then(([rRoles, rCabangs, rUser]) => {
      if (rRoles.success) setRoles(rRoles.data || []);
      if (rCabangs.success) setCabangs(rCabangs.data || []);
      
      if (rUser.success && rUser.data) {
        const u = rUser.data;
        setForm({
          nama: u.nama || "",
          email: u.email || "",
          telepon: u.telepon || "",
          username: u.username || "",
          password: "", // blank by default on edit
          konfirmasi_password: "",
          role_id: String(u.role_id),
          cabang_id: String(u.cabang_id),
          aktif: u.aktif
        });
      } else {
        showToast("Pengguna tidak ditemukan.", "error");
        router.push("/pengaturan/pengguna");
      }
    }).catch(() => {
      showToast("Gagal memuat data.", "error");
    }).finally(() => {
      setIsLoading(false);
    });
  }, [userId]);

  const selectedRole = roles.find(r => String(r.id) === String(form.role_id));
  const roleNama = selectedRole?.nama?.toLowerCase() || "";

  // Determine cabang visibility based on role
  const showCabang = roleNama !== "administrator";
  const cabangDisabled = roleNama === "top management";

  // When role changes, auto-set cabang if Top Management (Kantor Pusat)
  useEffect(() => {
    if (roleNama === "top management" || roleNama === "administrator") {
      const kantorPusat = cabangs.find(c => c.kode === "PST");
      if (kantorPusat) {
        setForm(prev => ({ ...prev, cabang_id: String(kantorPusat.id) }));
      }
    }
  }, [form.role_id, cabangs, roleNama]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({ ...prev, [name]: type === "checkbox" ? (checked ? 1 : 0) : value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: undefined }));
  };

  const validate = () => {
    const errs = {};
    if (!form.nama.trim()) errs.nama = "Nama lengkap wajib diisi.";
    if (!form.email.trim()) errs.email = "Email wajib diisi.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = "Format email tidak valid.";
    if (!form.username.trim()) errs.username = "Username wajib diisi.";
    
    // Only validate password if they filled it
    if (form.password) {
      if (form.password.length < 6) errs.password = "Password baru minimal 6 karakter.";
      if (!form.konfirmasi_password) errs.konfirmasi_password = "Konfirmasi password wajib diisi.";
      else if (form.password !== form.konfirmasi_password) errs.konfirmasi_password = "Konfirmasi password tidak cocok.";
    }
    
    if (!form.role_id) errs.role_id = "Role wajib dipilih.";
    if (showCabang && !cabangDisabled && !form.cabang_id) errs.cabang_id = "Cabang wajib dipilih.";
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      showToast("Periksa kembali data yang Anda masukkan.", "error");
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        nama: form.nama,
        email: form.email,
        username: form.username,
        telepon: form.telepon || null,
        cabang_id: form.cabang_id,
        role_id: form.role_id,
        aktif: form.aktif
      };

      if (form.password) {
        payload.password = form.password;
      }

      const res = await fetch(`/api/master/user/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const json = await res.json();

      if (json.success) {
        showToast(json.message || "Data user berhasil diperbarui.", "success");
        router.push("/pengaturan/pengguna");
      } else {
        showToast(json.message || "Gagal memperbarui user.", "error");
      }
    } catch (error) {
      showToast("Terjadi kesalahan koneksi.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const inputClass = (name) => `w-full pl-10 pr-4 py-2.5 bg-neutral-50 dark:bg-neutral-950 border rounded-xl outline-none focus:ring-2 text-sm font-semibold dark:text-white placeholder:text-neutral-400 transition-all ${
    errors[name]
      ? "border-red-400 focus:border-red-500 focus:ring-red-500/20"
      : "border-neutral-200 dark:border-neutral-800 focus:border-orange-500 focus:ring-orange-500/20"
  }`;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-2">
          <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs text-neutral-500 dark:text-neutral-400 font-bold">Memuat data user...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">


      {mounted && document.getElementById("header-actions-portal") && createPortal(
        <>
          <button
            onClick={() => submitBtnRef.current?.click()}
            disabled={isSaving}
            className="flex items-center gap-2 px-4 py-1.5 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-full text-sm transition-colors shadow-sm mr-2"
          >
            {isSaving ? "Menyimpan..." : "Simpan"}
          </button>
          <Link
            href="/pengaturan/pengguna"
            className="flex items-center gap-2 px-4 py-1.5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 font-bold rounded-full text-sm hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
          >
            Batal
          </Link>
        </>,
        document.getElementById("header-actions-portal")
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <button type="submit" ref={submitBtnRef} className="hidden" />
        {/* Section: Informasi Akun */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200/50 dark:border-neutral-800 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-5 border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50">
            <h2 className="text-sm font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-2">
              <FiUser className="w-4 h-4 text-orange-500" />
              Informasi Akun
            </h2>
          </div>

          <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Nama Lengkap */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300">
                Nama Lengkap <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><FiUser className="w-4 h-4 text-neutral-400" /></span>
                <input type="text" name="nama" required value={form.nama} onChange={handleChange} placeholder="Masukkan nama lengkap" className={inputClass("nama")} />
              </div>
              {errors.nama && <p className="text-[10px] text-red-500 font-semibold">{errors.nama}</p>}
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300">
                Email <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><FiMail className="w-4 h-4 text-neutral-400" /></span>
                <input type="email" name="email" required value={form.email} onChange={handleChange} placeholder="Masukkan email" className={inputClass("email")} />
              </div>
              {errors.email && <p className="text-[10px] text-red-500 font-semibold">{errors.email}</p>}
            </div>

            {/* No. Handphone */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300">
                No. Handphone <span className="text-neutral-400 font-medium">(Opsional)</span>
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><FiPhone className="w-4 h-4 text-neutral-400" /></span>
                <input type="tel" name="telepon" value={form.telepon} onChange={handleChange} placeholder="Masukkan nomor handphone" maxLength={20} className={inputClass("telepon")} />
              </div>
            </div>

            {/* Username */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300">
                Username <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><FiUser className="w-4 h-4 text-neutral-400" /></span>
                <input type="text" name="username" required value={form.username} onChange={handleChange} placeholder="Masukkan username" className={inputClass("username")} />
              </div>
              {errors.username && <p className="text-[10px] text-red-500 font-semibold">{errors.username}</p>}
            </div>

            {/* Password */}
            <div className="space-y-1.5 col-span-1">
              <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300">
                Password Baru <span className="text-neutral-400 font-medium">(Isi hanya jika ingin diganti)</span>
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><FiLock className="w-4 h-4 text-neutral-400" /></span>
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Masukkan password baru"
                  className={`${inputClass("password")} pr-10`}
                />
                <button type="button" onClick={() => setShowPassword(v => !v)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-neutral-400 hover:text-neutral-600">
                  {showPassword ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-[10px] text-red-500 font-semibold">{errors.password}</p>}
            </div>

            {/* Konfirmasi Password */}
            <div className="space-y-1.5 col-span-1">
              <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300">
                Konfirmasi Password Baru
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><FiLock className="w-4 h-4 text-neutral-400" /></span>
                <input
                  type={showKonfirmasi ? "text" : "password"}
                  name="konfirmasi_password"
                  value={form.konfirmasi_password}
                  onChange={handleChange}
                  placeholder="Masukkan ulang password baru"
                  disabled={!form.password}
                  className={`${inputClass("konfirmasi_password")} pr-10 disabled:opacity-50`}
                />
                <button type="button" onClick={() => setShowKonfirmasi(v => !v)} disabled={!form.password} className="absolute inset-y-0 right-0 pr-3 flex items-center text-neutral-400 hover:text-neutral-600 disabled:opacity-50">
                  {showKonfirmasi ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
                </button>
              </div>
              {errors.konfirmasi_password && <p className="text-[10px] text-red-500 font-semibold">{errors.konfirmasi_password}</p>}
            </div>
          </div>
        </div>

        {/* Section: Informasi Penugasan */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200/50 dark:border-neutral-800 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-5 border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50">
            <h2 className="text-sm font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-2">
              <FiShield className="w-4 h-4 text-orange-500" />
              Informasi Penugasan
            </h2>
          </div>

          <div className="p-6 space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Role */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300">
                  Role <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><FiShield className="w-4 h-4 text-neutral-400" /></span>
                  <select
                    name="role_id"
                    value={form.role_id}
                    onChange={handleChange}
                    className={`${inputClass("role_id")} appearance-none`}
                  >
                    <option value="">Pilih role</option>
                    {roles.map(r => <option key={r.id} value={r.id}>{r.nama}</option>)}
                  </select>
                </div>
                {errors.role_id && <p className="text-[10px] text-red-500 font-semibold">{errors.role_id}</p>}
              </div>

              {/* Cabang */}
              {showCabang && (
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300">
                    Cabang <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><FiMapPin className="w-4 h-4 text-neutral-400" /></span>
                    <select
                      name="cabang_id"
                      value={form.cabang_id}
                      onChange={handleChange}
                      disabled={cabangDisabled}
                      className={`${inputClass("cabang_id")} appearance-none disabled:opacity-60 disabled:cursor-not-allowed`}
                    >
                      <option value="">Pilih cabang</option>
                      {cabangs.map(c => <option key={c.id} value={c.id}>{c.nama}</option>)}
                    </select>
                  </div>
                  {errors.cabang_id && <p className="text-[10px] text-red-500 font-semibold">{errors.cabang_id}</p>}
                </div>
              )}
            </div>

            {/* Info Otomatis */}
            {form.role_id && (
              <div className="flex items-start gap-3 bg-orange-50 dark:bg-orange-950/20 border border-orange-200/60 dark:border-orange-900/40 rounded-xl p-4">
                <FiInfo className="w-4 h-4 text-orange-500 flex-shrink-0 mt-0.5" />
                <div className="text-xs font-medium text-orange-700 dark:text-orange-400">
                  <p className="font-bold">Informasi Otomatis</p>
                  <p className="mt-0.5">
                    {roleNama === "branch manager" && "Atasan langsung akan otomatis ditetapkan sebagai Top Management."}
                    {roleNama === "sales" && "Atasan langsung akan otomatis ditetapkan sebagai Branch Manager pada cabang yang dipilih."}
                    {roleNama === "top management" && "Cabang otomatis ditetapkan ke Kantor Pusat."}
                    {roleNama === "administrator" && "Administrator memiliki akses penuh terhadap seluruh sistem."}
                    {!roleNama && "Atasan langsung akan ditentukan otomatis berdasarkan role dan cabang yang Anda pilih."}
                  </p>
                </div>
              </div>
            )}

            {/* Status Akun */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300">
                Status Akun <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="radio"
                    name="aktif"
                    value={1}
                    checked={form.aktif === 1}
                    onChange={() => setForm(p => ({ ...p, aktif: 1 }))}
                    className="w-4 h-4 accent-orange-500"
                  />
                  <span className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">Aktif</span>
                </label>
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="radio"
                    name="aktif"
                    value={0}
                    checked={form.aktif === 0}
                    onChange={() => setForm(p => ({ ...p, aktif: 0 }))}
                    className="w-4 h-4 accent-orange-500"
                  />
                  <span className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">Non Aktif</span>
                </label>
              </div>
            </div>
          </div>
        </div>


      </form>
    </div>
  );
}
