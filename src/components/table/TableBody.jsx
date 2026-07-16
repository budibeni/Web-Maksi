"use client";

import { FiInbox } from "react-icons/fi";

const ACTION_STYLES = {
  default: "text-neutral-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30",
  warning: "text-neutral-400 hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-950/30",
  danger: "text-neutral-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30",
  success: "text-neutral-400 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-950/30",
};

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
          {columns.map((col) => (
            <td
              key={col.key}
              className="px-5 py-3.5 text-sm text-neutral-700 dark:text-neutral-300 whitespace-nowrap"
              style={col.width ? { width: col.width, maxWidth: col.width } : {}}
            >
              {col.render ? col.render(row) : (row[col.key] ?? "—")}
            </td>
          ))}

          {/* Action column */}
          {actions.length > 0 && (
            <td className="px-5 py-3.5 whitespace-nowrap text-right">
              <div className="flex items-center justify-end gap-1">
                {actions.map((action, ai) => {
                  if (action.show && !action.show(row)) return null;
                  const Icon = action.icon;
                  const style = ACTION_STYLES[action.variant || "default"];
                  return (
                    <button
                      key={ai}
                      onClick={(e) => { e.stopPropagation(); action.onClick(row); }}
                      title={action.label}
                      className={`p-2 rounded-lg transition-colors ${style}`}
                    >
                      {Icon ? <Icon className="w-4 h-4" /> : <span className="text-xs font-medium">{action.label}</span>}
                    </button>
                  );
                })}
              </div>
            </td>
          )}
        </tr>
      ))}
    </tbody>
  );
}
