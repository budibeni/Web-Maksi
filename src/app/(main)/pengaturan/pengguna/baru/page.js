"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  FiUser, FiMail, FiPhone, FiLock, FiSave, FiX,
  FiEye, FiEyeOff, FiChevronRight, FiUsers, FiInfo,
  FiShield, FiMapPin
} from "react-icons/fi";
import { useUIStore } from "@/store/ui.store";
import { useAuthStore } from "@/store/auth.store";

export default function TambahUserPage() {
  const router = useRouter();
  const { showToast } = useUIStore();
  const user = useAuthStore(state => state.user);

  const [roles, setRoles] = useState([]);
  const [cabangs, setCabangs] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

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
    Promise.all([
      fetch("/api/master/role").then(r => r.json()),
      fetch("/api/master/cabang").then(r => r.json())
    ]).then(([rRoles, rCabangs]) => {
      if (rRoles.success) setRoles(rRoles.data || []);
      if (rCabangs.success) setCabangs(rCabangs.data || []);
    });
  }, []);

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
  }, [form.role_id, cabangs]);

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
    if (!form.password) errs.password = "Password wajib diisi.";
    else if (form.password.length < 6) errs.password = "Password minimal 6 karakter.";
    if (!form.konfirmasi_password) errs.konfirmasi_password = "Konfirmasi password wajib diisi.";
    else if (form.password !== form.konfirmasi_password) errs.konfirmasi_password = "Konfirmasi password tidak cocok.";
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

    setIsLoading(true);
    try {
      const payload = {
        nama: form.nama,
        email: form.email,
        username: form.username,
        password: form.password,
        telepon: form.telepon || null,
        cabang_id: form.cabang_id,
        role_id: form.role_id,
        aktif: form.aktif
      };

      const res = await fetch("/api/master/user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const json = await res.json();

      if (json.success) {
        showToast(json.message || "User berhasil ditambahkan.", "success");
        router.push("/pengaturan/pengguna");
      } else {
        showToast(json.message || "Gagal menyimpan user.", "error");
      }
    } catch (error) {
      showToast("Terjadi kesalahan koneksi.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const InputField = ({ label, name, type = "text", placeholder, required, disabled, children, suffix }) => (
    <div className="space-y-1.5">
      <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className="relative">
        {children}
        {suffix}
      </div>
      {errors[name] && <p className="text-[10px] text-red-500 font-semibold mt-0.5">{errors[name]}</p>}
    </div>
  );

  const inputClass = (name) => `w-full pl-10 pr-4 py-2.5 bg-neutral-50 dark:bg-neutral-950 border rounded-xl outline-none focus:ring-2 text-sm font-semibold dark:text-white placeholder:text-neutral-400 transition-all ${
    errors[name]
      ? "border-red-400 focus:border-red-500 focus:ring-red-500/20"
      : "border-neutral-200 dark:border-neutral-800 focus:border-orange-500 focus:ring-orange-500/20"
  }`;

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
          <span>Pengguna</span>
          <FiChevronRight className="w-3 h-3" />
          <Link href="/pengaturan/pengguna" className="hover:text-orange-500 transition-colors">Daftar User</Link>
          <FiChevronRight className="w-3 h-3" />
          <span className="font-semibold text-neutral-800 dark:text-neutral-200">Tambah User</span>
        </div>
        <h1 className="text-xl font-bold text-neutral-900 dark:text-white mt-1.5">Tambah User Baru</h1>
        <p className="text-xs text-neutral-500 dark:text-neutral-400">
          Buat akun pengguna baru untuk sistem Maksindo.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
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
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300">
                Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><FiLock className="w-4 h-4 text-neutral-400" /></span>
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  required
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Masukkan password"
                  className={`${inputClass("password")} pr-10`}
                />
                <button type="button" onClick={() => setShowPassword(v => !v)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-neutral-400 hover:text-neutral-600">
                  {showPassword ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-[10px] text-red-500 font-semibold">{errors.password}</p>}
            </div>

            {/* Konfirmasi Password */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300">
                Konfirmasi Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><FiLock className="w-4 h-4 text-neutral-400" /></span>
                <input
                  type={showKonfirmasi ? "text" : "password"}
                  name="konfirmasi_password"
                  required
                  value={form.konfirmasi_password}
                  onChange={handleChange}
                  placeholder="Masukkan ulang password"
                  className={`${inputClass("konfirmasi_password")} pr-10`}
                />
                <button type="button" onClick={() => setShowKonfirmasi(v => !v)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-neutral-400 hover:text-neutral-600">
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

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3">
          <Link
            href="/pengaturan/pengguna"
            className="flex items-center gap-2 px-6 py-2.5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 font-bold rounded-xl text-sm hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-all active:scale-95"
          >
            <FiX className="w-4 h-4" />
            Batal
          </Link>
          <button
            type="submit"
            disabled={isLoading}
            className="flex items-center gap-2 px-6 py-2.5 bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-bold rounded-xl text-sm transition-all duration-150 active:scale-95 shadow-sm shadow-orange-200 dark:shadow-orange-900/30"
          >
            <FiSave className="w-4 h-4" />
            {isLoading ? "Menyimpan..." : "Simpan User"}
          </button>
        </div>
      </form>
    </div>
  );
}
