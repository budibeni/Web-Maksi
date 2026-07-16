"use client";

import { useState, useMemo } from "react";
import { FiX } from "react-icons/fi";
import TableToolbar from "./TableToolbar";
import TableHeader from "./TableHeader";
import TableBody from "./TableBody";
import TablePagination from "./TablePagination";

/**
 * DataTable — komponen tabel universal MAKSI.
 *
 * Props:
 *   columns            ColumnDef[]
 *   data               object[]
 *   isLoading          boolean
 *   emptyText          string
 *   emptyIcon          ReactComponent
 *   rowKey             string
 *
 *   // Pagination
 *   page, pageSize, totalData, totalPages
 *   onPageChange, onLimitChange, limitOptions
 *
 *   // Sorting
 *   sortField, sortOrder, onSortChange
 *
 *   // Search
 *   searchValue, onSearchChange, searchPlaceholder, debounceMs
 *
 *   // Column Filters
 *   columnFilters      object   — { [key]: { operator, value, value2 } }
 *   onFilterChange     fn(key, value | null)
 *   onResetFilters     fn()     — reset semua filter + search sekaligus
 *
 *   // Actions
 *   actions            ActionDef[]
 *
 *   // Visibility
 *   defaultHiddenColumns string[]
 *
 *   // Extra
 *   className          string
 */
export default function DataTable({
  columns = [],
  data = [],
  isLoading = false,
  emptyText = "Tidak ada data ditemukan.",
  emptyIcon,
  rowKey = "id",

  // Pagination
  page = 1,
  pageSize = 10,
  totalData = 0,
  totalPages = 1,
  onPageChange,
  onLimitChange,
  limitOptions,

  // Sorting
  sortField,
  sortOrder,
  onSortChange,

  // Search
  searchValue = "",
  onSearchChange,
  searchPlaceholder = "Cari...",
  debounceMs = 400,

  // Column Filters
  columnFilters = {},
  onFilterChange,
  onResetFilters,

  // Actions
  actions = [],

  // Export
  onExport,

  // Visibility
  defaultHiddenColumns = [],

  // Extra
  className = "",

  // Header actions (Tambah, Import, etc.)
  headerActions,
}) {
  const [hiddenColumns, setHiddenColumns] = useState(new Set(defaultHiddenColumns));

  const toggleColumn = (key) => {
    setHiddenColumns((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  // Visible columns only
  const visibleColumns = useMemo(
    () => columns.filter((c) => !hiddenColumns.has(c.key)),
    [columns, hiddenColumns]
  );

  // Build active filter summary for display
  const activeFilterSummary = useMemo(() => {
    const items = [];

    if (searchValue) {
      items.push({ key: "__search__", label: `Pencarian: "${searchValue}"` });
    }

    Object.entries(columnFilters).forEach(([colKey, filterVal]) => {
      if (!filterVal || filterVal.value === undefined || filterVal.value === "" || filterVal.value === null) return;
      if (Array.isArray(filterVal.value) && filterVal.value.length === 0) return;

      const colDef = columns.find((c) => c.key === colKey);
      const colLabel = colDef?.label || colKey;

      if (filterVal.operator === "composite") {
        const subFilters = Object.entries(filterVal.value)
          .filter(([_, subVal]) => subVal && subVal.value !== undefined && subVal.value !== null && subVal.value !== "")
          .map(([subKey, subVal]) => {
            const fieldDef = colDef?.filter?.fields?.find((f) => f.key === subKey);
            const fieldLabel = fieldDef?.label || subKey;
            
            let displayVal = String(subVal.value);
            if (fieldDef?.type === "select") {
              const opts = fieldDef.options || [];
              displayVal = opts.find((o) => o.value === subVal.value)?.label || subVal.value;
            }

            const opText = {
              contains: "mengandung",
              startsWith: "diawali",
              endsWith: "diakhiri",
              equals: "=",
              eq: "="
            }[subVal.operator] || subVal.operator;

            return `${fieldLabel} ${opText} "${displayVal}"`;
          });

        if (subFilters.length > 0) {
          items.push({
            key: colKey,
            label: `${colLabel} (${subFilters.join(" & ")})`,
          });
        }
        return;
      }

      let valueLabel = "";
      if (filterVal.operator === "in" && Array.isArray(filterVal.value)) {
        // For select multi, try to map values to labels
        const opts = colDef?.filter?.options || [];
        valueLabel = filterVal.value
          .map((v) => opts.find((o) => o.value === v)?.label || v)
          .join(", ");
      } else if (filterVal.operator === "between") {
        valueLabel = `${filterVal.value} — ${filterVal.value2 || ""}`;
      } else if (filterVal.operator === "eq") {
        // For select single, try to map value to label
        const opts = colDef?.filter?.options || [];
        valueLabel = opts.find((o) => o.value === filterVal.value)?.label || filterVal.value;
      } else if (filterVal.operator === "today") {
        valueLabel = "Hari ini";
      } else if (filterVal.operator === "thisWeek") {
        valueLabel = "Minggu ini";
      } else if (filterVal.operator === "thisMonth") {
        valueLabel = "Bulan ini";
      } else if (filterVal.operator === "custom") {
        valueLabel = `${filterVal.value || ""} s/d ${filterVal.value2 || ""}`;
      } else {
        valueLabel = String(filterVal.value);
      }

      const opLabel = {
        contains: "mengandung",
        startsWith: "diawali",
        endsWith: "diakhiri",
        equals: "=",
        eq: "=",
        gt: ">",
        lt: "<",
      }[filterVal.operator] || filterVal.operator;

      items.push({
        key: colKey,
        label: `${colLabel}: ${["contains","startsWith","endsWith","equals"].includes(filterVal.operator) ? opLabel + " " : ""}${valueLabel}`,
      });
    });

    return items;
  }, [searchValue, columnFilters, columns]);

  const handleRemoveFilter = (key) => {
    if (key === "__search__") {
      onSearchChange?.("");
    } else {
      onFilterChange?.(key, null);
    }
  };

  return (
    <div className={`bg-white dark:bg-neutral-900 border border-neutral-200/50 dark:border-neutral-800 rounded-2xl shadow-sm overflow-hidden ${className}`}>
      {/* Toolbar: search + reset + column toggle */}
      <TableToolbar
        searchValue={searchValue}
        onSearchChange={onSearchChange}
        searchPlaceholder={searchPlaceholder}
        columns={columns}
        hiddenColumns={hiddenColumns}
        onToggleColumn={toggleColumn}
        debounceMs={debounceMs}
        columnFilters={columnFilters}
        onResetFilters={onResetFilters}
        onExport={onExport}
        headerActions={headerActions}
      />

      {/* Active Filter Summary — ditampilkan hanya jika ada filter aktif */}
      {!isLoading && activeFilterSummary.length > 0 && (
        <div className="px-4 py-2.5 border-b border-neutral-100 dark:border-neutral-800 bg-orange-50/60 dark:bg-orange-950/10 flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-bold text-orange-600/70 dark:text-orange-400/60 uppercase tracking-wider shrink-0">
            Filter aktif:
          </span>
          {activeFilterSummary.map((item) => (
            <span
              key={item.key}
              className="inline-flex items-center gap-1 pl-2.5 pr-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 border border-orange-200 dark:border-orange-800/50"
            >
              {item.label}
              <button
                onClick={() => handleRemoveFilter(item.key)}
                className="ml-0.5 rounded-full p-0.5 hover:bg-orange-200 dark:hover:bg-orange-800/50 transition-colors"
                title="Hapus filter ini"
              >
                <FiX className="w-2.5 h-2.5" />
              </button>
            </span>
          ))}
          {activeFilterSummary.length > 1 && (
            <button
              onClick={onResetFilters}
              className="text-[10px] font-semibold text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 ml-1 transition-colors underline underline-offset-2"
            >
              Hapus semua
            </button>
          )}
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <TableHeader
            columns={visibleColumns}
            sortField={sortField}
            sortOrder={sortOrder}
            onSortChange={onSortChange}
            hasActions={actions.length > 0}
            columnFilters={columnFilters}
            onFilterChange={onFilterChange}
          />
          <TableBody
            columns={visibleColumns}
            data={data}
            isLoading={isLoading}
            emptyText={emptyText}
            emptyIcon={emptyIcon}
            actions={actions}
            rowKey={rowKey}
          />
        </table>
      </div>

      {/* Pagination */}
      <TablePagination
        page={page}
        pageSize={pageSize}
        totalData={totalData}
        totalPages={totalPages}
        onPageChange={onPageChange}
        onLimitChange={onLimitChange}
        limitOptions={limitOptions}
      />
    </div>
  );
}
