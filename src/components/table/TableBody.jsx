"use client";

import { useState, useRef, useEffect } from "react";
import { FiInbox, FiMoreVertical } from "react-icons/fi";

const ACTION_STYLES = {
  default: "text-neutral-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30",
  warning: "text-neutral-400 hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-950/30",
  danger: "text-neutral-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30",
  success: "text-neutral-400 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-950/30",
};

const ACTION_DROPDOWN_STYLES = {
  default: "text-neutral-700 hover:bg-blue-50 hover:text-blue-600 dark:text-neutral-300 dark:hover:bg-blue-950/30",
  warning: "text-neutral-700 hover:bg-orange-50 hover:text-orange-600 dark:text-neutral-300 dark:hover:bg-orange-950/30",
  danger: "text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30",
  success: "text-neutral-700 hover:bg-green-50 hover:text-green-600 dark:text-neutral-300 dark:hover:bg-green-950/30",
};

function ActionCellMenu({ row, actions }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const activeActions = actions.filter(action => !action.show || action.show(row));

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  if (activeActions.length === 0) return null;

  if (activeActions.length === 1) {
    const action = activeActions[0];
    const Icon = action.icon;
    const style = ACTION_STYLES[action.variant || "default"];
    return (
      <button
        onClick={(e) => {
          e.stopPropagation();
          action.onClick(row);
        }}
        title={action.label}
        className={`p-2 rounded-lg transition-colors ${style}`}
      >
        {Icon ? <Icon className="w-4 h-4" /> : <span className="text-xs font-medium">{action.label}</span>}
      </button>
    );
  }

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className="p-2 rounded-lg text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
        title="Pilihan Aksi"
      >
        <FiMoreVertical className="w-4 h-4" />
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-1 w-36 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-lg z-50 py-1 animate-in fade-in slide-in-from-top-1 duration-150">
          {activeActions.map((action, ai) => {
            const Icon = action.icon;
            const style = ACTION_DROPDOWN_STYLES[action.variant || "default"];
            return (
              <button
                key={ai}
                onClick={(e) => {
                  e.stopPropagation();
                  setIsOpen(false);
                  action.onClick(row);
                }}
                className={`flex w-full items-center gap-2 px-3 py-2 text-xs font-medium transition-colors ${style}`}
              >
                {Icon && <Icon className="w-3.5 h-3.5" />}
                <span>{action.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/**
 * TableBody
 * Props:
 *   columns        array of visible column defs
 *   data           array of row objects
 *   isLoading      boolean
 *   emptyText      string
 *   actions        array of { label, icon: Icon, variant, onClick, show }
 *   rowKey         string (default "id")
 */
export default function TableBody({
  columns,
  data = [],
  isLoading = false,
  emptyText = "Tidak ada data ditemukan.",
  emptyIcon: EmptyIcon = FiInbox,
  actions = [],
  rowKey = "id",
}) {
  const colSpan = columns.length + (actions.length > 0 ? 1 : 0);

  /* ---- Loading skeleton ---- */
  if (isLoading) {
    return (
      <tbody>
        {Array.from({ length: 5 }).map((_, ri) => (
          <tr key={ri} className="border-b border-neutral-100 dark:border-neutral-800">
            {Array.from({ length: colSpan }).map((__, ci) => (
              <td key={ci} className="px-5 py-4">
                <div className="h-3.5 bg-neutral-200 dark:bg-neutral-700 rounded-full animate-pulse" style={{ width: `${60 + Math.random() * 30}%` }} />
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    );
  }

  /* ---- Empty state ---- */
  if (data.length === 0) {
    return (
      <tbody>
        <tr>
          <td colSpan={colSpan} className="px-6 py-16 text-center">
            <div className="flex flex-col items-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
                <EmptyIcon className="w-7 h-7 text-neutral-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-neutral-600 dark:text-neutral-400">Tidak Ada Data</p>
                <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-0.5">{emptyText}</p>
              </div>
            </div>
          </td>
        </tr>
      </tbody>
    );
  }

  /* ---- Data rows ---- */
  return (
    <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
      {data.map((row) => (
        <tr
          key={row[rowKey]}
          className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors group"
        >
          {actions.length > 0 && (
            <td style={{ width: "50px", minWidth: "50px" }} className="px-5 py-3.5 whitespace-nowrap">
              <ActionCellMenu row={row} actions={actions} />
            </td>
          )}
          {columns.map((col) => (
            <td
              key={col.key}
              className="px-5 py-3.5 text-sm text-neutral-700 dark:text-neutral-300 whitespace-nowrap"
              style={col.width ? { width: col.width, maxWidth: col.width } : {}}
            >
              {col.render ? col.render(row) : (row[col.key] ?? "—")}
            </td>
          ))}
        </tr>
      ))}
    </tbody>
  );
}
