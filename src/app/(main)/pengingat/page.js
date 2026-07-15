"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  FiSearch, FiBell, FiCheckCircle, FiAlertCircle, FiEye, 
  FiRefreshCw, FiClock, FiCalendar, FiUser, FiMapPin, 
  FiFilter, FiInfo, FiChevronRight, FiPhoneCall, FiChevronDown
} from "react-icons/fi";
import { useAuthStore } from "@/store/auth.store";
import { useUIStore } from "@/store/ui.store";
import dayjs from "dayjs";
import 'dayjs/locale/id';

dayjs.locale('id');

const FASE_LABEL = { 1: 'Lead Baru', 2: 'Follow Up', 3: 'Penawaran' };
const STATUS_LABEL = { 1: 'OPEN', 2: 'DEAL', 3: 'LOST' };

export default function PengingatPage() {
  const user = useAuthStore((state) => state.user);
  const { showToast } = useUIStore();

  const [reminders, setReminders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState(""); // default empty for "Semua Status"
  const [cabangId, setCabangId] = useState("");
  const [salesId, setSalesId] = useState("");
  const [periode, setPeriode] = useState(""); // default empty for "Semua"
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [pagination, setPagination] = useState({ totalData: 0, totalPages: 1 });
  const [summary, setSummary] = useState({ totalHariIni: 0, totalTerlambat: 0, totalBesok: 0, totalSelesaiHariIni: 0 });

  // Master lists for filters
  const [cabangs, setCabangs] = useState([]);
  const [users, setUsers] = useState([]);

  // Check roles
  const isAdminOrTop = user?.role?.nama === "Administrator" || user?.role?.nama === "Top Management";
  const isBranchManager = user?.role?.nama === "Branch Manager";

  useEffect(() => {
    // Fetch master cabang
    fetch("/api/master/cabang")
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setCabangs(d.data || []);
      });

    // Fetch master user
    fetch("/api/master/user")
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          const salesOnly = (d.data || []).filter(
            (u) =>
              u.role?.nama === "Sales" &&
              (!isBranchManager || String(u.cabang_id) === String(user?.cabang_id))
          );
          setUsers(salesOnly);
        }
      });
  }, [isBranchManager, user]);

  const fetchReminders = async () => {
    setIsLoading(true);
    try {
      const queryParams = new URLSearchParams({
        search,
        status,
        periode,
        startDate,
        endDate,
        page: String(page),
        limit: String(limit),
        cabang_id: cabangId,
        sales_id: salesId,
      });

      const res = await fetch(`/api/pengingat?${queryParams.toString()}`);
      const json = await res.json();
      if (json.success) {
        setReminders(json.data || []);
        setSummary(json.summary || { totalHariIni: 0, totalTerlambat: 0, totalBesok: 0, totalSelesaiHariIni: 0 });
        setPagination(json.pagination || { totalData: 0, totalPages: 1 });
      } else {
        showToast(json.message || "Gagal mengambil data pengingat.", "error");
      }
    } catch (e) {
      console.error(e);
      showToast("Terjadi kesalahan koneksi sistem.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReminders();
  }, [page, status, cabangId, salesId, periode]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchReminders();
  };

  const handleResetFilters = () => {
    setSearch("");
    setStatus("");
    setCabangId("");
    setSalesId("");
    setPeriode("");
    setStartDate("");
    setEndDate("");
    setPage(1);
  };

  // Get Priority UI elements according to the mockup design criteria
  const getPriorityInfo = (rem) => {
    if (rem.status === "SELESAI") {
      return {
        label: "Selesai",
        colorClass: "text-green-600 bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800",
        icon: <FiCheckCircle className="w-3.5 h-3.5 text-green-600" />
      };
    }

    const targetTime = dayjs(rem.tanggal_pengingat);
    const now = dayjs();
    const startOfToday = dayjs().startOf('day');
    const endOfToday = dayjs().endOf('day');
    const startOfTomorrow = dayjs().add(1, 'day').startOf('day');
    const endOfTomorrow = dayjs().add(1, 'day').endOf('day');

    if (targetTime.isBefore(startOfToday)) {
      return {
        label: "Terlambat",
        colorClass: "text-red-600 bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800",
        icon: <FiClock className="w-3.5 h-3.5 text-red-600 animate-pulse" />
      };
    } else if (targetTime.isAfter(startOfToday) && targetTime.isBefore(endOfToday)) {
      return {
        label: "Hari Ini",
        colorClass: "text-orange-600 bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-800",
        icon: <FiClock className="w-3.5 h-3.5 text-orange-600" />
      };
    } else if (targetTime.isAfter(startOfTomorrow) && targetTime.isBefore(endOfTomorrow)) {
      return {
        label: "Besok",
        colorClass: "text-blue-600 bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800",
        icon: <FiClock className="w-3.5 h-3.5 text-blue-600" />
      };
    } else {
      return {
        label: "Lainnya",
        colorClass: "text-neutral-500 bg-neutral-50 dark:bg-neutral-800/40 border-neutral-200 dark:border-neutral-800",
        icon: <FiClock className="w-3.5 h-3.5 text-neutral-500" />
      };
    }
  };

  const getStatusLeadBadge = (status) => {
    switch (status) {
      case 2: // DEAL
        return "bg-green-100 text-green-800 dark:bg-green-950/40 dark:text-green-400 border border-green-200 dark:border-green-800";
      case 3: // LOST
        return "bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400 border border-red-200 dark:border-red-800";
      default: // OPEN
        return "bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400 border border-amber-200 dark:border-amber-800";
    }
  };

  // Find user's branch name to show in the header
  const userBranchName = user?.cabang?.nama || "Pusat";

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        {/* Breadcrumb & Description */}
        <div>
          <div className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
            <span>Lead</span>
            <FiChevronRight className="w-3 h-3" />
            <span className="font-semibold text-neutral-800 dark:text-neutral-200">Pengingat</span>
          </div>
          <h1 className="text-xl font-bold text-neutral-900 dark:text-white mt-1.5">
            Pengingat
          </h1>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            Kelola seluruh reminder follow up customer.
          </p>
        </div>

        {/* Action Widgets */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {/* Branch Indicator Dropdown */}
          <div className="relative">
            <button className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-neutral-700 dark:text-neutral-300 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-sm hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">
              <FiMapPin className="text-orange-500 w-4 h-4" />
              <span>{userBranchName}</span>
              <FiChevronDown className="text-neutral-400 w-3 h-3" />
            </button>
          </div>

          {/* Bell Notifications */}
          <button className="p-2.5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors relative shadow-sm">
            <FiBell className="w-4 h-4 text-neutral-600 dark:text-neutral-400" />
            {summary.totalHariIni > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[9px] font-black h-4 w-4 rounded-full flex items-center justify-center border border-white dark:border-neutral-900">
                {summary.totalHariIni}
              </span>
            )}
          </button>

          {/* Refresh Button */}
          <button 
            onClick={fetchReminders}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-neutral-700 dark:text-neutral-300 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-sm hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-all active:scale-95"
          >
            <FiRefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Rangkuman 4 Kartu */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* Card 1: Hari Ini */}
        <div 
          onClick={() => { setPeriode("hari_ini"); setPage(1); }}
          className="bg-white dark:bg-neutral-900 border border-neutral-200/50 dark:border-neutral-800 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all cursor-pointer flex items-center gap-4 relative overflow-hidden group"
        >
          <div className="p-3 bg-orange-100 dark:bg-orange-950/30 rounded-2xl group-hover:scale-110 transition-transform">
            <FiClock className="w-6 h-6 text-orange-500" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Hari Ini</span>
            <h2 className="text-2xl font-black text-neutral-900 dark:text-white mt-0.5">{summary.totalHariIni}</h2>
            <p className="text-[9px] text-neutral-500 dark:text-neutral-400">Belum dikerjakan</p>
          </div>
        </div>

        {/* Card 2: Terlambat */}
        <div 
          onClick={() => { setPeriode("terlambat"); setPage(1); }}
          className="bg-white dark:bg-neutral-900 border border-neutral-200/50 dark:border-neutral-800 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all cursor-pointer flex items-center gap-4 relative overflow-hidden group"
        >
          <div className="p-3 bg-red-100 dark:bg-red-950/30 rounded-2xl group-hover:scale-110 transition-transform">
            <FiAlertCircle className="w-6 h-6 text-red-600" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Terlambat</span>
            <h2 className="text-2xl font-black text-neutral-900 dark:text-white mt-0.5">{summary.totalTerlambat}</h2>
            <p className="text-[9px] text-neutral-500 dark:text-neutral-400">Lewat jadwal</p>
          </div>
        </div>

        {/* Card 3: Besok */}
        <div 
          onClick={() => { setPeriode("besok"); setPage(1); }}
          className="bg-white dark:bg-neutral-900 border border-neutral-200/50 dark:border-neutral-800 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all cursor-pointer flex items-center gap-4 relative overflow-hidden group"
        >
          <div className="p-3 bg-blue-100 dark:bg-blue-950/30 rounded-2xl group-hover:scale-110 transition-transform">
            <FiCalendar className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Besok</span>
            <h2 className="text-2xl font-black text-neutral-900 dark:text-white mt-0.5">{summary.totalBesok}</h2>
            <p className="text-[9px] text-neutral-500 dark:text-neutral-400">Akan datang</p>
          </div>
        </div>

        {/* Card 4: Selesai Hari Ini */}
        <div 
          onClick={() => { setPeriode("selesai_hari_ini"); setPage(1); }}
          className="bg-white dark:bg-neutral-900 border border-neutral-200/50 dark:border-neutral-800 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all cursor-pointer flex items-center gap-4 relative overflow-hidden group"
        >
          <div className="p-3 bg-green-100 dark:bg-green-950/30 rounded-2xl group-hover:scale-110 transition-transform">
            <FiCheckCircle className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Selesai Hari Ini</span>
            <h2 className="text-2xl font-black text-neutral-900 dark:text-white mt-0.5">{summary.totalSelesaiHariIni}</h2>
            <p className="text-[9px] text-neutral-500 dark:text-neutral-400">Selesai</p>
          </div>
        </div>
      </div>

      {/* Filter Panel Grid */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200/50 dark:border-neutral-800 rounded-2xl p-5 shadow-sm space-y-4">
        {/* Title */}
        <h2 className="text-xs font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5 uppercase tracking-wider">
          <FiFilter className="w-4 h-4 text-orange-500" />
          Filter
        </h2>

        <form onSubmit={handleSearchSubmit} className="space-y-3.5">
          {/* Row 1: Search, Sales, Cabang, Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            {/* Pencarian Customer */}
            <div>
              <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-1.5">
                Pencarian Customer
              </label>
              <div className="relative">
                <FiSearch className="absolute left-3 top-3 text-neutral-400 dark:text-neutral-600" />
                <input
                  type="text"
                  placeholder="Cari nama customer / perusahaan..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all dark:text-white text-xs font-semibold"
                />
              </div>
            </div>

            {/* Sales Dropdown */}
            <div>
              <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-1.5">
                Sales
              </label>
              <select
                value={salesId}
                onChange={(e) => { setSalesId(e.target.value); setPage(1); }}
                className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all dark:text-white text-xs font-semibold"
              >
                <option value="">Semua Sales</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.nama}
                  </option>
                ))}
              </select>
            </div>

            {/* Cabang Dropdown */}
            <div>
              <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-1.5">
                Cabang
              </label>
              <select
                value={cabangId}
                disabled={!isAdminOrTop}
                onChange={(e) => { setCabangId(e.target.value); setPage(1); }}
                className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all dark:text-white text-xs font-semibold disabled:opacity-65"
              >
                <option value="">Semua Cabang</option>
                {cabangs.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nama}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Reminder Dropdown */}
            <div>
              <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-1.5">
                Status Reminder
              </label>
              <select
                value={status}
                onChange={(e) => { setStatus(e.target.value); setPage(1); }}
                className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all dark:text-white text-xs font-semibold"
              >
                <option value="">Semua Status</option>
                <option value="AKTIF">Aktif</option>
                <option value="SELESAI">Selesai</option>
              </select>
            </div>
          </div>

          {/* Row 2: Periode, Tanggal Mulai, Tanggal Selesai, Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-5 gap-3 items-end">
            {/* Periode */}
            <div>
              <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-1.5">
                Periode
              </label>
              <select
                value={periode}
                onChange={(e) => {
                  setPeriode(e.target.value);
                  setPage(1);
                  if (e.target.value) {
                    setStartDate("");
                    setEndDate("");
                  }
                }}
                className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all dark:text-white text-xs font-semibold"
              >
                <option value="">Semua</option>
                <option value="hari_ini">Hari Ini</option>
                <option value="terlambat">Terlambat</option>
                <option value="besok">Besok</option>
                <option value="lainnya">Lainnya</option>
                <option value="selesai_hari_ini">Selesai Hari Ini</option>
              </select>
            </div>

            {/* Tanggal Mulai */}
            <div className="md:col-span-1">
              <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-1.5">
                Tanggal Mulai
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={startDate}
                  disabled={!!periode}
                  onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
                  className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all dark:text-white text-xs font-semibold disabled:opacity-60"
                />
              </div>
            </div>

            {/* Tanggal Selesai */}
            <div className="md:col-span-1">
              <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-1.5">
                Tanggal Selesai
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={endDate}
                  disabled={!!periode}
                  onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
                  className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all dark:text-white text-xs font-semibold disabled:opacity-60"
                />
              </div>
            </div>

            {/* Buttons Area */}
            <div className="flex gap-2 sm:col-span-3 md:col-span-2 justify-end w-full">
              <button
                type="button"
                onClick={handleResetFilters}
                className="bg-white hover:bg-neutral-50 dark:bg-neutral-900 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 px-5 py-2.5 border border-neutral-200 dark:border-neutral-800 rounded-xl text-xs font-bold transition-all w-1/2 sm:w-auto"
              >
                Reset
              </button>
              <button
                type="submit"
                className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm w-1/2 sm:w-auto"
              >
                Terapkan
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Daftar Pengingat Tabel */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200/50 dark:border-neutral-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50/30 dark:bg-neutral-900/10">
          <h3 className="text-sm font-bold text-neutral-800 dark:text-neutral-200">
            Daftar Pengingat ({pagination.totalData})
          </h3>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-xs text-neutral-500 font-medium">Memuat data pengingat...</span>
          </div>
        ) : reminders.length === 0 ? (
          <div className="text-center py-16">
            <FiBell className="w-10 h-10 text-neutral-300 dark:text-neutral-700 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-neutral-700 dark:text-neutral-300">Tidak Ada Pengingat</h3>
            <p className="text-xs text-neutral-400 mt-1">Tidak ada jadwal pengingat yang sesuai dengan filter.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-neutral-200 dark:divide-neutral-800 text-xs">
              <thead className="bg-neutral-50 dark:bg-neutral-950/50 text-[10px] font-bold text-neutral-500 uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3 text-left">Prioritas</th>
                  <th className="px-5 py-3 text-left">Jam Reminder</th>
                  <th className="px-5 py-3 text-left">Customer / Perusahaan</th>
                  <th className="px-5 py-3 text-left">Sales</th>
                  <th className="px-5 py-3 text-left">Reminder</th>
                  <th className="px-5 py-3 text-center">Status Lead</th>
                  <th className="px-5 py-3 text-left">Fase</th>
                  <th className="px-5 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800 text-neutral-600 dark:text-neutral-300 font-medium">
                {reminders.map((rem) => {
                  const prio = getPriorityInfo(rem);
                  const reminderTime = dayjs(rem.tanggal_pengingat);
                  const isLeadOpen = rem.lead?.status === 1;

                  return (
                    <tr key={rem.id} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-900/30 transition-colors">
                      {/* Prioritas */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${prio.colorClass}`}>
                          {prio.icon}
                          {prio.label}
                        </span>
                      </td>

                      {/* Jam Reminder */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="font-bold text-neutral-800 dark:text-neutral-100 text-xs">
                          {reminderTime.format("HH:mm")}
                        </div>
                        <div className="text-[10px] text-neutral-400 dark:text-neutral-500 font-normal mt-0.5">
                          {reminderTime.format("DD MMM YYYY")}
                        </div>
                      </td>

                      {/* Customer / Perusahaan */}
                      <td className="px-5 py-4 whitespace-nowrap font-bold text-neutral-900 dark:text-white">
                        {rem.lead?.customer?.nama}
                      </td>

                      {/* Sales */}
                      <td className="px-5 py-4 whitespace-nowrap text-neutral-500 font-normal">
                        {rem.lead?.user?.nama}
                      </td>

                      {/* Reminder Note */}
                      <td className="px-5 py-4 max-w-xs truncate-2-lines text-neutral-700 dark:text-neutral-300">
                        {rem.catatan || <span className="text-neutral-400 italic font-normal">Tanpa catatan</span>}
                      </td>

                      {/* Status Lead */}
                      <td className="px-5 py-4 text-center whitespace-nowrap">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${getStatusLeadBadge(rem.lead?.status)}`}>
                          {STATUS_LABEL[rem.lead?.status] || 'OPEN'}
                        </span>
                      </td>

                      {/* Fase */}
                      <td className="px-5 py-4 whitespace-nowrap text-neutral-500">
                        {FASE_LABEL[rem.lead?.fase] || 'Lead Baru'}
                      </td>

                      {/* Aksi */}
                      <td className="px-5 py-4 text-right whitespace-nowrap space-x-2">
                        {isLeadOpen ? (
                          <Link
                            href={`/lead/${rem.lead?.id}`}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-orange-200 text-orange-600 hover:bg-orange-50 dark:border-orange-900 dark:text-orange-400 dark:hover:bg-orange-950/20 rounded-xl text-xs font-bold transition-all"
                          >
                            <FiPhoneCall className="w-3.5 h-3.5" />
                            Follow Up
                          </Link>
                        ) : (
                          <Link
                            href={`/lead/${rem.lead?.id}`}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-green-200 text-green-600 hover:bg-green-50 dark:border-green-900 dark:text-green-400 dark:hover:bg-green-950/20 rounded-xl text-xs font-bold transition-all"
                          >
                            <FiEye className="w-3.5 h-3.5" />
                            Lihat Detail
                          </Link>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination & Limit */}
        {reminders.length > 0 && (
          <div className="px-5 py-4 border-t border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/20 flex flex-col sm:flex-row items-center justify-between gap-3">
            <span className="text-xs text-neutral-500 font-medium">
              Menampilkan {((page - 1) * limit) + 1} - {Math.min(page * limit, pagination.totalData)} dari {pagination.totalData} data
            </span>
            <div className="flex items-center gap-3">
              {/* Pagination controls */}
              <div className="flex items-center gap-2">
                <button
                  disabled={page === 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="px-3.5 py-1.5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-xs font-semibold rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 disabled:opacity-50 disabled:pointer-events-none transition-all shadow-sm"
                >
                  Sebelumnya
                </button>
                <div className="text-xs font-bold px-3 py-1 bg-orange-50 dark:bg-orange-950/30 text-orange-600 dark:text-orange-400 rounded-md">
                  {page} / {pagination.totalPages}
                </div>
                <button
                  disabled={page === pagination.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="px-3.5 py-1.5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-xs font-semibold rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 disabled:opacity-50 disabled:pointer-events-none transition-all shadow-sm"
                >
                  Berikutnya
                </button>
              </div>

              {/* Rows limit display mock */}
              <div className="text-xs text-neutral-500 border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-3 py-1.5 rounded-lg font-bold">
                10 / halaman
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Info Notice Box */}
      <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/50 rounded-2xl p-4 flex items-start gap-3 text-xs text-blue-700 dark:text-blue-400">
        <FiInfo className="w-5 h-5 flex-shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold">Informasi Pengingat:</p>
          <ul className="list-disc pl-4 space-y-0.5 font-medium">
            <li>Reminder akan otomatis selesai setelah Follow Up berikutnya berhasil disimpan.</li>
            <li>Reminder yang terlambat tetap muncul sampai Follow Up dilakukan.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
