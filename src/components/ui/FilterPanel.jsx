"use client";

import { FiCalendar, FiRefreshCw } from "react-icons/fi";
import MultiSelect from "./MultiSelect";

export default function FilterPanel({
  title = "Filter Data",
  role = "",
  branches = [],
  sales = [],
  datePreset = "thisMonth",
  setDatePreset,
  startDate = "",
  setStartDate,
  endDate = "",
  setEndDate,
  cabangIds = [],
  setCabangIds,
  salesIds = [],
  setSalesIds,
  onReset
}) {
  const roleStr = typeof role === "string" ? role.toLowerCase() : "";
  const isAdminOrTop = roleStr === "administrator" || roleStr === "top management";
  const isBranchManager = roleStr === "branch manager" || roleStr === "bm";
  const isSalesRole = roleStr === "sales";

  return (
    <div className="bg-white dark:bg-neutral-900 border border-neutral-200/50 dark:border-neutral-800 rounded-2xl p-5 shadow-sm space-y-4">
      {/* Header Panel */}
      <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800/60 pb-3">
        <h2 className="text-xs font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5 uppercase tracking-wider">
          <FiCalendar className="w-4 h-4 text-orange-500" />
          {title}
        </h2>
        {onReset && (
          <button 
            type="button"
            onClick={onReset}
            className="text-neutral-500 hover:text-orange-500 dark:text-neutral-400 dark:hover:text-orange-400 text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
            title="Reset Filters"
          >
            <FiRefreshCw className="w-3 h-3.5" />
            <span>Reset Filter</span>
          </button>
        )}
      </div>
      
      {/* Grid Inputs */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 items-start">
        {/* Filter Tanggal */}
        <div className="lg:col-span-2 space-y-2.5">
          <label className="block text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">Rentang Waktu</label>
          <div className="flex flex-wrap gap-1 bg-neutral-50 dark:bg-neutral-950 p-1 rounded-xl w-fit border border-neutral-200/50 dark:border-neutral-800">
            {[
              { key: "today", label: "Hari ini" },
              { key: "thisWeek", label: "Minggu ini" },
              { key: "thisMonth", label: "Bulan ini" },
              { key: "thisYear", label: "Tahun ini" },
              { key: "custom", label: "Pilih Tanggal" },
            ].map((p) => (
              <button
                key={p.key}
                type="button"
                onClick={() => setDatePreset(p.key)}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all duration-200 cursor-pointer ${
                  datePreset === p.key
                    ? "bg-white dark:bg-neutral-900 text-orange-600 dark:text-orange-400 shadow-sm border border-neutral-200/30 dark:border-neutral-800"
                    : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Input tanggal custom */}
          {datePreset === "custom" && (
            <div className="flex items-center gap-2 animate-in fade-in slide-in-from-top-1 duration-200 max-w-xs">
              <input 
                type="date" 
                className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 dark:text-white text-xs font-semibold" 
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
              <span className="text-xs text-neutral-400 font-bold">-</span>
              <input 
                type="date" 
                className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 dark:text-white text-xs font-semibold"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          )}
        </div>

        {/* Cabang dropdown (Hanya tampil untuk Administrator & Top Management) */}
        {isAdminOrTop && branches.length > 0 && (
          <div className="space-y-2.5">
            <label className="block text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">Cabang</label>
            <MultiSelect
              options={branches.map(b => ({ value: b.id.toString(), label: b.nama }))}
              selectedValues={cabangIds}
              onChange={(vals) => {
                setCabangIds(vals);
                setSalesIds([]); // Reset sales when branch changes
              }}
              placeholder="Semua Cabang"
              labelAll="Semua Cabang"
            />
          </div>
        )}

        {/* Sales dropdown (Tampil untuk Admin, Top Management, & Branch Manager) */}
        {(isAdminOrTop || isBranchManager) && sales.length > 0 && (
          <div className="space-y-2.5">
            <label className="block text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">Sales</label>
            <MultiSelect
              options={sales
                .filter(s => cabangIds.length === 0 || cabangIds.includes(s.cabang_id.toString()))
                .map(s => ({ value: s.id.toString(), label: s.nama }))}
              selectedValues={salesIds}
              onChange={setSalesIds}
              placeholder="Semua Sales"
              labelAll="Semua Sales"
            />
          </div>
        )}
      </div>
    </div>
  );
}
