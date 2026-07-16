"use client";

import { useState, useRef, useEffect } from "react";
import { FiSearch, FiColumns, FiCheck, FiX, FiDownload } from "react-icons/fi";

/**
 * TableToolbar — toolbar di atas tabel.
 * Props:
 *   searchValue        string
 *   onSearchChange     fn(value)  — debounce ditangani di dalam
 *   searchPlaceholder  string
 *   columns            array of { key, label, hideable? }
 *   hiddenColumns      Set<string>
 *   onToggleColumn     fn(key)
 *   debounceMs         number (default 400)
 *   columnFilters      object  — { [key]: filterValue }
 *   onResetFilters     fn()    — dipanggil saat tombol reset diklik
 *   onExport           fn()    — dipanggil saat tombol export diklik
 */
export default function TableToolbar({
  searchValue = "",
  onSearchChange,
  searchPlaceholder = "Cari...",
  columns = [],
  hiddenColumns = new Set(),
  onToggleColumn,
  debounceMs = 400,
  columnFilters = {},
  onResetFilters,
  onExport,
  headerActions,
}) {
  const [inputValue, setInputValue] = useState(searchValue);
  const [colPanelOpen, setColPanelOpen] = useState(false);
  const [exportPanelOpen, setExportPanelOpen] = useState(false);
  const colPanelRef = useRef(null);
  const exportPanelRef = useRef(null);
  const debounceRef = useRef(null);

  // Sync input if searchValue cleared externally
  useEffect(() => {
    setInputValue(searchValue);
  }, [searchValue]);

  const handleInput = (e) => {
    const val = e.target.value;
    setInputValue(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      onSearchChange?.(val);
    }, debounceMs);
  };

  const handleReset = () => {
    setInputValue("");
    onResetFilters?.();
  };

  // Close panels on outside click
  useEffect(() => {
    const handler = (e) => {
      if (colPanelRef.current && !colPanelRef.current.contains(e.target)) {
        setColPanelOpen(false);
      }
      if (exportPanelRef.current && !exportPanelRef.current.contains(e.target)) {
        setExportPanelOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const hideableColumns = columns.filter((c) => c.hideable !== false);
  const hasActiveFilters =
    searchValue !== "" || Object.keys(columnFilters).length > 0;

  return (
    <div className="px-4 py-3 border-b border-neutral-100 dark:border-neutral-800 flex flex-col md:flex-row gap-3 justify-between items-center bg-neutral-50/50 dark:bg-neutral-900/50">
      {/* Kelompok 1: Sisi Kiri (tambah, template, import, cari) */}
      <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
        {headerActions && (
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            {headerActions}
          </div>
        )}
        
        {/* Global Search */}
        <div className="relative w-full sm:w-80">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FiSearch className="text-neutral-400 w-4 h-4" />
          </div>
          <input
            type="text"
            value={inputValue}
            onChange={handleInput}
            placeholder={searchPlaceholder}
            className="block w-full pl-10 pr-8 py-2 border border-neutral-200 dark:border-neutral-700 rounded-xl leading-5 bg-white dark:bg-neutral-950 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-colors text-sm dark:text-white font-medium"
          />
          {inputValue && (
            <button
              onClick={() => { setInputValue(""); onSearchChange?.(""); }}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
            >
              <FiX className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Kelompok 2: Sisi Kanan (Reset, Kolom, Export) */}
      <div className="flex items-center gap-2 self-end md:self-auto">
        {/* Reset All Filters */}
        {hasActiveFilters && (
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-xl hover:bg-red-100 dark:hover:bg-red-950/50 transition-colors"
            title="Reset semua filter"
          >
            <FiX className="w-3.5 h-3.5" />
            <span>Reset Filter</span>
          </button>
        )}

        {/* Column Visibility */}
        {hideableColumns.length > 0 && (
          <div className="relative" ref={colPanelRef}>
            <button
              onClick={() => setColPanelOpen((o) => !o)}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-neutral-600 dark:text-neutral-400 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
              title="Atur kolom yang ditampilkan"
            >
              <FiColumns className="w-3.5 h-3.5" />
              <span>Kolom</span>
            </button>

            {colPanelOpen && (
              <div className="absolute right-0 top-full mt-1 z-50 w-52 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl shadow-xl py-1.5">
                <div className="px-3 py-1.5 text-[10px] font-bold text-neutral-400 uppercase tracking-wider border-b border-neutral-100 dark:border-neutral-800 mb-1">
                  Tampilkan / Sembunyikan
                </div>
                {hideableColumns.map((col) => {
                  const isHidden = hiddenColumns.has(col.key);
                  return (
                    <button
                      key={col.key}
                      onClick={() => onToggleColumn?.(col.key)}
                      className="w-full flex items-center justify-between px-3 py-2 text-xs text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
                    >
                      <span>{col.label}</span>
                      {!isHidden && <FiCheck className="w-3.5 h-3.5 text-orange-500" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Export Button (with Dropdown choices) */}
        {onExport && (
          <div className="relative" ref={exportPanelRef}>
            <button
              onClick={() => setExportPanelOpen((o) => !o)}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-neutral-600 dark:text-neutral-400 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
              title="Export ke Excel"
            >
              <FiDownload className="w-3.5 h-3.5" />
              <span>Export</span>
            </button>

            {exportPanelOpen && (
              <div className="absolute right-0 top-full mt-1 z-50 w-56 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl shadow-xl py-1.5">
                <div className="px-3 py-1.5 text-[10px] font-bold text-neutral-400 uppercase tracking-wider border-b border-neutral-100 dark:border-neutral-800 mb-1">
                  Pilih Data Ekspor
                </div>
                <button
                  onClick={() => {
                    onExport?.("page");
                    setExportPanelOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 text-xs text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors flex flex-col gap-0.5"
                >
                  <span className="font-bold">Halaman Ini</span>
                  <span className="text-[10px] text-neutral-400 dark:text-neutral-500 font-medium">Hanya baris yang tampil saat ini</span>
                </button>
                <button
                  onClick={() => {
                    onExport?.("all");
                    setExportPanelOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 text-xs text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors border-t border-neutral-100 dark:border-neutral-800 flex flex-col gap-0.5"
                >
                  <span className="font-bold text-orange-600 dark:text-orange-400">Semua Terfilter</span>
                  <span className="text-[10px] text-neutral-400 dark:text-neutral-500 font-medium">Maksimal 1000 data terfilter</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
