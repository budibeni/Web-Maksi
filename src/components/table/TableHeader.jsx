"use client";

import { FiArrowUp, FiArrowDown } from "react-icons/fi";
import ColumnFilter from "./ColumnFilter";

const UnsortedIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="w-3.5 h-3.5 opacity-0 group-hover:opacity-50 transition-opacity"
  >
    <path d="m21 16-4 4-4-4"/>
    <path d="M17 20V4"/>
    <path d="m3 8 4-4 4 4"/>
    <path d="M7 4v16"/>
  </svg>
);

/**
 * TableHeader
 * Props:
 *   columns        array of column defs (visible only)
 *   sortField      string
 *   sortOrder      "asc" | "desc"
 *   onSortChange   fn(field, order)
 *   hasActions     boolean
 *   columnFilters  { [key]: filterValue }
 *   onFilterChange fn(key, value | null)
 */
export default function TableHeader({
  columns,
  sortField,
  sortOrder,
  onSortChange,
  hasActions = false,
  columnFilters = {},
  onFilterChange,
}) {
  const handleSort = (col) => {
    if (!col.sortable) return;
    const newOrder = sortField === col.key && sortOrder === "asc" ? "desc" : "asc";
    onSortChange?.(col.key, newOrder);
  };

  const SortIcon = ({ colKey }) => {
    if (sortField !== colKey) return <UnsortedIcon />;
    return sortOrder === "asc"
      ? <FiArrowUp className="w-3 h-3 text-orange-500" />
      : <FiArrowDown className="w-3 h-3 text-orange-500" />;
  };

  return (
    <thead className="sticky top-0 z-10 bg-neutral-50 dark:bg-neutral-900/95 backdrop-blur-sm">
      <tr>
        {columns.map((col) => (
          <th
            key={col.key}
            scope="col"
            style={col.width ? { width: col.width, minWidth: col.width } : {}}
            className={`px-5 py-3.5 text-left text-[11px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider border-b border-neutral-200 dark:border-neutral-800 whitespace-nowrap ${col.sortable ? "cursor-pointer select-none group" : ""
              }`}
            onClick={() => handleSort(col)}
          >
            <div className="flex items-center gap-1">
              <span>{col.label}</span>
              {col.sortable && <SortIcon colKey={col.key} />}
              {col.filter && (
                <div onClick={(e) => e.stopPropagation()}>
                  <ColumnFilter
                    column={col}
                    value={columnFilters[col.key]}
                    onChange={(val) => onFilterChange?.(col.key, val)}
                  />
                </div>
              )}
            </div>
          </th>
        ))}
        {hasActions && (
          <th
            scope="col"
            className="px-5 py-3.5 text-right text-[11px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider border-b border-neutral-200 dark:border-neutral-800"
          >
            Aksi
          </th>
        )}
      </tr>
    </thead>
  );
}
