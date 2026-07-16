"use client";

import { useState, useEffect } from "react";
import {
  FiUser, FiMail, FiPhone, FiLock, FiSave, FiShield,
  FiEye, FiEyeOff, FiCheckCircle, FiSettings, FiChevronRight,
  FiEdit2, FiKey, FiSliders, FiHelpCircle
} from "react-icons/fi";
import { useAuthStore } from "@/store/auth.store";
import { useUIStore } from "@/store/ui.store";

export default function SettingPage() {
  const { user, checkAuth } = useAuthStore();
  const { showToast } = useUIStore();

  const [activeTab, setActiveTab] = useState("profil");

  // Profile form state
  const [profileForm, setProfileForm] = useState({ nama: "", email: "", telepon: "" });
  const [profileLoading, setProfileLoading] = useState(false);

  // Password form state
  const [passwordForm, setPasswordForm] = useState({ password_lama: "", password_baru: "", konfirmasi_password: "" });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [showLama, setShowLama] = useState(false);
  const [showBaru, setShowBaru] = useState(false);
  const [showKonfirmasi, setShowKonfirmasi] = useState(false);

  // App settings state (stored in localStorage)
  const [appForm, setAppForm] = useState({
    appName: "MAKSI - Maksindo Sales Information System",
    defaultPpn: 11,
    defaultDp: 30,
    defaultMasaBerlaku: 30,
    compactView: "true",
    primaryColor: "orange"
  });
  const [appLoading, setAppLoading] = useState(false);

  // Populate profile form when user data is available
  useEffect(() => {
    if (user) {
      setProfileForm({
        nama: user.nama || "",
        email: user.email || "",
        telepon: user.telepon || ""
      });
    }

    // Load App settings from localStorage
    if (typeof window !== "undefined") {
      const storedName = localStorage.getItem("maksi_app_name");
      const storedPpn = localStorage.getItem("maksi_default_ppn");
      const storedDp = localStorage.getItem("maksi_default_dp");
      const storedMasa = localStorage.getItem("maksi_default_masa");
      const storedCompact = localStorage.getItem("maksi_compact_view");
      const storedColor = localStorage.getItem("maksi_primary_color");

      setAppForm({
        appName: storedName || "MAKSI - Maksindo Sales Information System",
        defaultPpn: storedPpn ? Number(storedPpn) : 11,
        defaultDp: storedDp ? Number(storedDp) : 30,
        defaultMasaBerlaku: storedMasa ? Number(storedMasa) : 30,
        compactView: storedCompact !== null ? storedCompact : "true",
        primaryColor: storedColor || "orange"
      });
    }
  }, [user]);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileLoading(true);
    try {
      const res = await fetch("/api/auth/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "update_profile", ...profileForm })
      });
      const json = await res.json();
      if (json.success) {
        showToast(json.message || "Profil berhasil diperbarui.", "success");
        await checkAuth(); // Refresh user data in store
      } else {
        showToast(json.message || "Gagal memperbarui profil.", "error");
      }
    } catch (error) {
      showToast("Terjadi kesalahan koneksi.", "error");
    } finale: {
      setProfileLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (passwordForm.password_baru !== passwordForm.konfirmasi_password) {
      showToast("Konfirmasi password tidak cocok.", "error");
      return;
    }
    if (passwordForm.password_baru.length < 6) {
      showToast("Password baru minimal 6 karakter.", "error");
      return;
    }
    setPasswordLoading(true);
    try {
      const res = await fetch("/api/auth/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "change_password", ...passwordForm })
      });
      const json = await res.json();
      if (json.success) {
        showToast(json.message || "Password berhasil diubah.", "success");
        setPasswordForm({ password_lama: "", password_baru: "", konfirmasi_password: "" });
      } else {
        showToast(json.message || "Gagal mengubah password.", "error");
      }
    } catch (error) {
      showToast("Terjadi kesalahan koneksi.", "error");
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleAppSubmit = (e) => {
    e.preventDefault();
    setAppLoading(true);
    try {
      localStorage.setItem("maksi_app_name", appForm.appName);
      localStorage.setItem("maksi_default_ppn", String(appForm.defaultPpn));
      localStorage.setItem("maksi_default_dp", String(appForm.defaultDp));
      localStorage.setItem("maksi_default_masa", String(appForm.defaultMasaBerlaku));
      localStorage.setItem("maksi_compact_view", appForm.compactView);
      localStorage.setItem("maksi_primary_color", appForm.primaryColor);

      showToast("Pengaturan aplikasi berhasil disimpan.", "success");
    } catch (error) {
      showToast("Gagal menyimpan pengaturan.", "error");
    } finally {
      setAppLoading(false);
    }
  };

  const getRoleColor = (roleName) => {
    switch (roleName?.toLowerCase()) {
      case "administrator": return "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400";
      case "top management": return "bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-400";
      case "branch manager": return "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400";
      case "sales": return "bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400";
      default: return "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400";
    }
  };

  const tabs = [
    { key: "profil", label: "Profil Saya", icon: FiUser },
    { key: "password", label: "Ubah Password", icon: FiLock },
  ];

  if (user?.role?.nama === "Administrator") {
    tabs.push({ key: "aplikasi", label: "Pengaturan Aplikasi", icon: FiSliders });
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">


      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left: Profile Card */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200/50 dark:border-neutral-800 rounded-2xl p-6 shadow-sm flex flex-col items-center text-center gap-4">
            {/* Avatar */}
            <div className="relative">
              <div className="h-20 w-20 rounded-full bg-gradient-to-br from-orange-400 via-orange-500 to-orange-600 flex items-center justify-center text-white font-black text-3xl shadow-lg shadow-orange-500/30">
                {user?.nama?.charAt(0)?.toUpperCase() || "U"}
              </div>
              <div className="absolute -bottom-1 -right-1 h-6 w-6 bg-green-500 rounded-full border-2 border-white dark:border-neutral-900 flex items-center justify-center">
                <FiCheckCircle className="w-3 h-3 text-white" />
              </div>
            </div>

            <div className="space-y-1.5">
              <h2 className="text-base font-black text-neutral-900 dark:text-white">{user?.nama || "Memuat..."}</h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">{user?.email || user?.username || ""}</p>
              {user?.role?.nama && (
                <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${getRoleColor(user.role.nama)}`}>
                  {user.role.nama}
                </span>
              )}
            </div>

            <div className="w-full pt-3 border-t border-neutral-100 dark:border-neutral-800 space-y-2 text-xs">
              {user?.cabang?.nama && (
                <div className="flex items-center gap-2 text-neutral-500 dark:text-neutral-400">
                  <div className="w-6 h-6 rounded-lg bg-orange-50 dark:bg-orange-950/30 flex items-center justify-center">
                    <FiSettings className="w-3 h-3 text-orange-500" />
                  </div>
                  <span className="font-medium">{user.cabang.nama}</span>
                </div>
              )}
              {user?.telepon && (
                <div className="flex items-center gap-2 text-neutral-500 dark:text-neutral-400">
                  <div className="w-6 h-6 rounded-lg bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center">
                    <FiPhone className="w-3 h-3 text-blue-500" />
                  </div>
                  <span className="font-medium">{user.telepon}</span>
                </div>
              )}
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="mt-4 bg-white dark:bg-neutral-900 border border-neutral-200/50 dark:border-neutral-800 rounded-2xl p-2 shadow-sm space-y-1">
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 ${activeTab === tab.key
                      ? "bg-orange-500 text-white shadow-sm shadow-orange-200 dark:shadow-orange-900/30"
                      : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800"
                    }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Tab Content */}
        <div className="lg:col-span-3">
          {/* Profil Tab */}
          {activeTab === "profil" && (
            <div className="bg-white dark:bg-neutral-900 border border-neutral-200/50 dark:border-neutral-800 rounded-2xl shadow-sm overflow-hidden">
              <div className="p-5 border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50">
                <h2 className="text-sm font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-2">
                  <FiEdit2 className="w-4 h-4 text-orange-500" />
                  Informasi Profil
                </h2>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                  Perbarui nama, email, dan nomor handphone Anda.
                </p>
              </div>

              <form onSubmit={handleProfileSubmit} className="p-6 space-y-5">
                {/* Nama Lengkap */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300">
                    Nama Lengkap <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FiUser className="w-4 h-4 text-neutral-400" />
                    </span>
                    <input
                      type="text"
                      required
                      value={profileForm.nama}
                      onChange={e => setProfileForm(p => ({ ...p, nama: e.target.value }))}
                      placeholder="Masukkan nama lengkap"
                      className="w-full pl-10 pr-4 py-2.5 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-sm font-semibold dark:text-white placeholder:text-neutral-400 transition-all"
                    />
                  </div>
                </div>

                {/* Email */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FiMail className="w-4 h-4 text-neutral-400" />
                    </span>
                    <input
                      type="email"
                      required
                      value={profileForm.email}
                      onChange={e => setProfileForm(p => ({ ...p, email: e.target.value }))}
                      placeholder="Masukkan email"
                      className="w-full pl-10 pr-4 py-2.5 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-sm font-semibold dark:text-white placeholder:text-neutral-400 transition-all"
                    />
                  </div>
                </div>

                {/* No. Handphone */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300">
                    No. Handphone <span className="text-neutral-400 font-medium">(Opsional)</span>
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FiPhone className="w-4 h-4 text-neutral-400" />
                    </span>
                    <input
                      type="tel"
                      value={profileForm.telepon}
                      onChange={e => setProfileForm(p => ({ ...p, telepon: e.target.value }))}
                      placeholder="Masukkan nomor handphone"
                      maxLength={20}
                      className="w-full pl-10 pr-4 py-2.5 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-sm font-semibold dark:text-white placeholder:text-neutral-400 transition-all"
                    />
                  </div>
                </div>

                {/* Read-only info */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300">
                      Username
                    </label>
                    <div className="flex items-center gap-2 px-3 py-2.5 bg-neutral-100 dark:bg-neutral-850 border border-neutral-200 dark:border-neutral-800 rounded-xl">
                      <FiUser className="w-4 h-4 text-neutral-400 flex-shrink-0" />
                      <span className="text-sm font-semibold text-neutral-500 dark:text-neutral-500">{user?.username || "-"}</span>
                    </div>
                    <p className="text-[10px] text-neutral-400">Username tidak dapat diubah.</p>
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300">
                      Role
                    </label>
                    <div className="flex items-center gap-2 px-3 py-2.5 bg-neutral-100 dark:bg-neutral-850 border border-neutral-200 dark:border-neutral-800 rounded-xl">
                      <FiShield className="w-4 h-4 text-neutral-400 flex-shrink-0" />
                      <span className="text-sm font-semibold text-neutral-500 dark:text-neutral-500">{user?.role?.nama || "-"}</span>
                    </div>
                    <p className="text-[10px] text-neutral-400">Role ditentukan oleh Administrator.</p>
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    disabled={profileLoading}
                    className="flex items-center gap-2 px-6 py-2.5 bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-bold rounded-xl text-sm transition-all duration-150 active:scale-95 shadow-sm shadow-orange-200 dark:shadow-orange-900/30"
                  >
                    <FiSave className="w-4 h-4" />
                    {profileLoading ? "Menyimpan..." : "Simpan Perubahan"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Password Tab */}
          {activeTab === "password" && (
            <div className="bg-white dark:bg-neutral-900 border border-neutral-200/50 dark:border-neutral-800 rounded-2xl shadow-sm overflow-hidden">
              <div className="p-5 border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50">
                <h2 className="text-sm font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-2">
                  <FiKey className="w-4 h-4 text-orange-500" />
                  Ubah Password
                </h2>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                  Gunakan password yang kuat dan belum pernah digunakan sebelumnya.
                </p>
              </div>

              <form onSubmit={handlePasswordSubmit} className="p-6 space-y-5">
                {/* Password Lama */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300">
                    Password Lama <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FiLock className="w-4 h-4 text-neutral-400" />
                    </span>
                    <input
                      type={showLama ? "text" : "password"}
                      required
                      value={passwordForm.password_lama}
                      onChange={e => setPasswordForm(p => ({ ...p, password_lama: e.target.value }))}
                      placeholder="Masukkan password lama"
                      className="w-full pl-10 pr-10 py-2.5 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-sm font-semibold dark:text-white placeholder:text-neutral-400 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowLama(v => !v)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
                    >
                      {showLama ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Password Baru */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300">
                    Password Baru <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FiLock className="w-4 h-4 text-neutral-400" />
                    </span>
                    <input
                      type={showBaru ? "text" : "password"}
                      required
                      value={passwordForm.password_baru}
                      onChange={e => setPasswordForm(p => ({ ...p, password_baru: e.target.value }))}
                      placeholder="Masukkan password baru (min. 6 karakter)"
                      className="w-full pl-10 pr-10 py-2.5 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-sm font-semibold dark:text-white placeholder:text-neutral-400 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowBaru(v => !v)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
                    >
                      {showBaru ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
                    </button>
                  </div>
                  {/* Password Strength */}
                  {passwordForm.password_baru && (
                    <div className="flex items-center gap-2">
                      {[1, 2, 3, 4].map(level => (
                        <div
                          key={level}
                          className={`h-1 flex-1 rounded-full transition-colors ${passwordForm.password_baru.length >= level * 3
                              ? level <= 1 ? "bg-red-400" : level <= 2 ? "bg-amber-400" : level <= 3 ? "bg-blue-400" : "bg-green-500"
                              : "bg-neutral-200 dark:bg-neutral-700"
                            }`}
                        />
                      ))}
                      <span className="text-[10px] font-semibold text-neutral-400 w-12 text-right">
                        {passwordForm.password_baru.length < 4 ? "Lemah" : passwordForm.password_baru.length < 7 ? "Sedang" : passwordForm.password_baru.length < 10 ? "Kuat" : "Sangat Kuat"}
                      </span>
                    </div>
                  )}
                </div>

                {/* Konfirmasi Password */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300">
                    Konfirmasi Password Baru <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FiLock className="w-4 h-4 text-neutral-400" />
                    </span>
                    <input
                      type={showKonfirmasi ? "text" : "password"}
                      required
                      value={passwordForm.konfirmasi_password}
                      onChange={e => setPasswordForm(p => ({ ...p, konfirmasi_password: e.target.value }))}
                      placeholder="Ulangi password baru"
                      className={`w-full pl-10 pr-10 py-2.5 bg-neutral-50 dark:bg-neutral-950 border rounded-xl outline-none focus:ring-2 text-sm font-semibold dark:text-white placeholder:text-neutral-400 transition-all ${passwordForm.konfirmasi_password && passwordForm.password_baru !== passwordForm.konfirmasi_password
                          ? "border-red-400 focus:border-red-500 focus:ring-red-500/20"
                          : "border-neutral-200 dark:border-neutral-800 focus:border-orange-500 focus:ring-orange-500/20"
                        }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowKonfirmasi(v => !v)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
                    >
                      {showKonfirmasi ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
                    </button>
                  </div>
                  {passwordForm.konfirmasi_password && passwordForm.password_baru !== passwordForm.konfirmasi_password && (
                    <p className="text-[10px] text-red-500 font-semibold">Password tidak cocok.</p>
                  )}
                </div>

                {/* Info */}
                <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40 rounded-xl p-4 text-xs text-blue-700 dark:text-blue-400 font-medium">
                  <p className="font-bold mb-1">Tips keamanan password:</p>
                  <ul className="list-disc list-inside space-y-0.5 opacity-80">
                    <li>Minimal 6 karakter</li>
                    <li>Kombinasikan huruf besar, kecil, angka, dan simbol</li>
                    <li>Jangan gunakan tanggal lahir atau nama sendiri</li>
                  </ul>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    disabled={passwordLoading || (passwordForm.konfirmasi_password !== "" && passwordForm.password_baru !== passwordForm.konfirmasi_password)}
                    className="flex items-center gap-2 px-6 py-2.5 bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-bold rounded-xl text-sm transition-all duration-150 active:scale-95 shadow-sm shadow-orange-200 dark:shadow-orange-900/30"
                  >
                    <FiKey className="w-4 h-4" />
                    {passwordLoading ? "Mengubah..." : "Ubah Password"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Pengaturan Aplikasi Tab */}
          {activeTab === "aplikasi" && (
            <div className="bg-white dark:bg-neutral-900 border border-neutral-200/50 dark:border-neutral-800 rounded-2xl shadow-sm overflow-hidden">
              <div className="p-5 border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50">
                <h2 className="text-sm font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-2">
                  <FiSliders className="w-4 h-4 text-orange-500" />
                  Pengaturan Aplikasi
                </h2>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                  Konfigurasikan preferensi sistem default untuk seluruh aplikasi (Admin saja).
                </p>
              </div>

              <form onSubmit={handleAppSubmit} className="p-6 space-y-5">
                {/* Nama Aplikasi */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300">
                    Nama Sistem / Aplikasi
                  </label>
                  <input
                    type="text"
                    required
                    value={appForm.appName}
                    onChange={e => setAppForm(p => ({ ...p, appName: e.target.value }))}
                    placeholder="Masukkan nama aplikasi"
                    className="w-full px-4 py-2.5 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-sm font-semibold dark:text-white placeholder:text-neutral-400 transition-all"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Default PPN */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300">
                      Default PPN (%)
                    </label>
                    <input
                      type="number"
                      required
                      min={0}
                      max={100}
                      value={appForm.defaultPpn}
                      onChange={e => setAppForm(p => ({ ...p, defaultPpn: Number(e.target.value) }))}
                      className="w-full px-4 py-2.5 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-sm font-semibold dark:text-white placeholder:text-neutral-400 transition-all"
                    />
                  </div>

                  {/* Default DP */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300">
                      Default Minimal DP (%)
                    </label>
                    <input
                      type="number"
                      required
                      min={0}
                      max={100}
                      value={appForm.defaultDp}
                      onChange={e => setAppForm(p => ({ ...p, defaultDp: Number(e.target.value) }))}
                      className="w-full px-4 py-2.5 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-sm font-semibold dark:text-white placeholder:text-neutral-400 transition-all"
                    />
                  </div>

                  {/* Default Masa Berlaku */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300">
                      Masa Berlaku Penawaran (Hari)
                    </label>
                    <input
                      type="number"
                      required
                      min={1}
                      max={365}
                      value={appForm.defaultMasaBerlaku}
                      onChange={e => setAppForm(p => ({ ...p, defaultMasaBerlaku: Number(e.target.value) }))}
                      className="w-full px-4 py-2.5 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-sm font-semibold dark:text-white placeholder:text-neutral-400 transition-all"
                    />
                  </div>
                </div>


                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    disabled={appLoading}
                    className="flex items-center gap-2 px-6 py-2.5 bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-bold rounded-xl text-sm transition-all duration-150 active:scale-95 shadow-sm shadow-orange-200 dark:shadow-orange-900/30"
                  >
                    <FiSave className="w-4 h-4" />
                    {appLoading ? "Menyimpan..." : "Simpan Pengaturan"}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
