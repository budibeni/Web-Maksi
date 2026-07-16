"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { FiFilter, FiX } from "react-icons/fi";

const TEXT_OPERATORS = [
  { value: "contains", label: "Mengandung" },
  { value: "startsWith", label: "Diawali dengan" },
  { value: "endsWith", label: "Diakhiri dengan" },
  { value: "equals", label: "Sama persis" },
];

const NUMBER_OPERATORS = [
  { value: "eq", label: "= (Sama dengan)" },
  { value: "gt", label: "> (Lebih dari)" },
  { value: "lt", label: "< (Kurang dari)" },
  { value: "between", label: "Antara" },
];

const DATE_PRESETS = [
  { value: "today", label: "Hari ini" },
  { value: "thisWeek", label: "Minggu ini" },
  { value: "thisMonth", label: "Bulan ini" },
  { value: "custom", label: "Custom Range" },
];

const INPUT_CLASS =
  "w-full px-2.5 py-1.5 text-xs bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-700 rounded-lg outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 dark:text-white";

/**
 * ColumnFilter — popup filter untuk satu kolom.
 * Props:
 *   column     { key, label, filter: { type, options } }
 *   value      { operator, value, value2 } — nilai filter saat ini
 *   onChange   fn(newValue | null)  — null = clear filter
 */
export default function ColumnFilter({ column, value, onChange }) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(value || {});
  const [panelPos, setPanelPos] = useState({ top: 0, left: 0 });
  const btnRef = useRef(null);
  const panelRef = useRef(null);
  const filterDef = column.filter;

  // Sync draft when value changes externally (e.g., clear all)
  useEffect(() => {
    setDraft(value || {});
  }, [value]);

  // Calculate panel position relative to trigger button
  const updatePosition = useCallback(() => {
    if (!btnRef.current) return;
    const rect = btnRef.current.getBoundingClientRect();
    const panelWidth = 264;
    const windowWidth = window.innerWidth;

    // Default: open to the right of button
    let left = rect.left;
    // If would overflow right edge, flip to left-aligned
    if (left + panelWidth > windowWidth - 16) {
      left = rect.right - panelWidth;
    }
    // Make sure it doesn't go off left edge
    if (left < 8) left = 8;

    setPanelPos({
      top: rect.bottom + window.scrollY + 4,
      left: left + window.scrollX,
    });
  }, []);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (
        panelRef.current &&
        !panelRef.current.contains(e.target) &&
        btnRef.current &&
        !btnRef.current.contains(e.target)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // Recalculate position on scroll / resize
  useEffect(() => {
    if (!open) return;
    updatePosition();
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);
    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [open, updatePosition]);

  const hasValue =
    value &&
    value.value !== undefined &&
    value.value !== "" &&
    value.value !== null &&
    !(Array.isArray(value.value) && value.value.length === 0);

  const handleApply = () => {
    onChange(draft);
    setOpen(false);
  };

  const handleClear = () => {
    setDraft({});
    onChange(null);
    setOpen(false);
  };

  if (!filterDef) return null;

  const panel = open && (
    <div
      ref={panelRef}
      onClick={(e) => e.stopPropagation()}
      style={{
        position: "fixed",
        top: panelPos.top,
        left: panelPos.left,
        width: 264,
        zIndex: 99999,
      }}
      className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl shadow-2xl p-3 space-y-2.5"
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-1.5 border-b border-neutral-100 dark:border-neutral-800">
        <span className="text-[10px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-widest">
          Filter: {column.label}
        </span>
        <button
          onClick={(e) => { e.stopPropagation(); setOpen(false); }}
          className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors p-0.5 rounded"
        >
          <FiX className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* ---- TEXT ---- */}
      {filterDef.type === "text" && (
        <div className="space-y-2">
          <select
            value={draft.operator || "contains"}
            onChange={(e) => setDraft((d) => ({ ...d, operator: e.target.value }))}
            className={INPUT_CLASS}
          >
            {TEXT_OPERATORS.map((op) => (
              <option key={op.value} value={op.value}>{op.label}</option>
            ))}
          </select>
          <input
            type="text"
            placeholder="Nilai..."
            value={draft.value || ""}
            onChange={(e) => setDraft((d) => ({ ...d, value: e.target.value }))}
            className={INPUT_CLASS}
            onKeyDown={(e) => e.key === "Enter" && handleApply()}
            autoFocus
          />
        </div>
      )}

      {/* ---- COMPOSITE (Multi Field) ---- */}
      {filterDef.type === "composite" && (
        <div className="space-y-3">
          {(filterDef.fields || []).map((field) => {
            const fieldDraft = (draft.value && draft.value[field.key]) || { operator: "contains", value: "" };
            return (
              <div key={field.key} className="space-y-1">
                <label className="text-[10px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">
                  {field.label}
                </label>
                <div className="flex gap-1">
                  {field.type === "select" ? (
                    <select
                      value={fieldDraft.value || ""}
                      onChange={(e) => {
                        const val = e.target.value;
                        setDraft((d) => {
                          const nextVal = { ...(d.value || {}) };
                          if (val === "") {
                            delete nextVal[field.key];
                          } else {
                            nextVal[field.key] = { operator: "equals", value: val };
                          }
                          return { ...d, operator: "composite", value: nextVal };
                        });
                      }}
                      className={INPUT_CLASS}
                    >
                      <option value="">Semua</option>
                      {(field.options || []).map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  ) : (
                    <>
                      <select
                        value={fieldDraft.operator || "contains"}
                        onChange={(e) => {
                          const op = e.target.value;
                          setDraft((d) => {
                            const nextVal = { ...(d.value || {}) };
                            nextVal[field.key] = { ...fieldDraft, operator: op };
                            return { ...d, operator: "composite", value: nextVal };
                          });
                        }}
                        className="w-24 px-1.5 py-1.5 text-[10px] bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-700 rounded-lg outline-none"
                      >
                        {TEXT_OPERATORS.map((op) => (
                          <option key={op.value} value={op.value}>{op.label}</option>
                        ))}
                      </select>
                      <input
                        type="text"
                        placeholder="Nilai..."
                        value={fieldDraft.value || ""}
                        onChange={(e) => {
                          const val = e.target.value;
                          setDraft((d) => {
                            const nextVal = { ...(d.value || {}) };
                            nextVal[field.key] = { ...fieldDraft, value: val };
                            return { ...d, operator: "composite", value: nextVal };
                          });
                        }}
                        className="flex-1 px-2 py-1.5 text-xs bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-700 rounded-lg outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 dark:text-white"
                        onKeyDown={(e) => e.key === "Enter" && handleApply()}
                      />
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ---- NUMBER ---- */}
      {filterDef.type === "number" && (
        <div className="space-y-2">
          <select
            value={draft.operator || "eq"}
            onChange={(e) => setDraft((d) => ({ ...d, operator: e.target.value, value2: undefined }))}
            className={INPUT_CLASS}
          >
            {NUMBER_OPERATORS.map((op) => (
              <option key={op.value} value={op.value}>{op.label}</option>
            ))}
          </select>
          <input
            type="number"
            placeholder={draft.operator === "between" ? "Dari..." : "Nilai..."}
            value={draft.value || ""}
            onChange={(e) => setDraft((d) => ({ ...d, value: e.target.value }))}
            className={INPUT_CLASS}
            autoFocus
          />
          {draft.operator === "between" && (
            <input
              type="number"
              placeholder="Sampai..."
              value={draft.value2 || ""}
              onChange={(e) => setDraft((d) => ({ ...d, value2: e.target.value }))}
              className={INPUT_CLASS}
            />
          )}
        </div>
      )}

      {/* ---- DATE ---- */}
      {filterDef.type === "date" && (
        <div className="space-y-2">
          <div className="flex flex-wrap gap-1.5">
            {DATE_PRESETS.map((op) => (
              <button
                key={op.value}
                onClick={(e) => {
                  e.stopPropagation();
                  setDraft((d) => ({ ...d, operator: op.value, value: "", value2: "" }));
                }}
                className={`flex-1 min-w-[5rem] px-2 py-1.5 text-[10px] font-semibold rounded-lg border transition-colors ${
                  (draft.operator || "today") === op.value
                    ? "bg-orange-500 text-white border-orange-500"
                    : "bg-neutral-50 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700 hover:border-orange-300"
                }`}
              >
                {op.label}
              </button>
            ))}
          </div>
          {(draft.operator === "custom" || !draft.operator) && draft.operator === "custom" && (
            <div className="space-y-1.5">
              <label className="text-[10px] font-medium text-neutral-500 dark:text-neutral-400">Dari tanggal</label>
              <input
                type="date"
                value={draft.value || ""}
                onChange={(e) => setDraft((d) => ({ ...d, value: e.target.value }))}
                className={INPUT_CLASS}
              />
              <label className="text-[10px] font-medium text-neutral-500 dark:text-neutral-400">Sampai tanggal</label>
              <input
                type="date"
                value={draft.value2 || ""}
                onChange={(e) => setDraft((d) => ({ ...d, value2: e.target.value }))}
                className={INPUT_CLASS}
              />
            </div>
          )}
        </div>
      )}

      {/* ---- SELECT ---- */}
      {filterDef.type === "select" && (
        <div className="space-y-0.5 max-h-48 overflow-y-auto pr-0.5">
          {(filterDef.options || []).map((opt) => {
            const selected = Array.isArray(draft.value)
              ? draft.value.includes(opt.value)
              : draft.value === opt.value;
            return (
              <label
                key={opt.value}
                className={`flex items-center gap-2 px-2.5 py-2 rounded-lg cursor-pointer text-xs transition-colors ${
                  selected
                    ? "bg-orange-50 dark:bg-orange-950/30 text-orange-700 dark:text-orange-400 font-semibold"
                    : "text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800"
                }`}
              >
                <input
                  type={filterDef.multi ? "checkbox" : "radio"}
                  name={`filter_${column.key}`}
                  value={opt.value}
                  checked={selected}
                  onChange={() => {
                    if (filterDef.multi) {
                      const current = Array.isArray(draft.value) ? draft.value : [];
                      const next = selected
                        ? current.filter((v) => v !== opt.value)
                        : [...current, opt.value];
                      setDraft((d) => ({ ...d, operator: "in", value: next }));
                    } else {
                      setDraft((d) => ({ ...d, operator: "eq", value: opt.value }));
                    }
                  }}
                  className="accent-orange-500 w-3.5 h-3.5 flex-shrink-0"
                />
                {opt.label}
              </label>
            );
          })}
        </div>
      )}

      {/* ---- BOOLEAN ---- */}
      {filterDef.type === "boolean" && (
        <div className="flex gap-2">
          {[{ value: "true", label: "Ya" }, { value: "false", label: "Tidak" }].map((opt) => (
            <label
              key={opt.value}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg cursor-pointer border text-xs font-semibold transition-colors ${
                draft.value === opt.value
                  ? "bg-orange-50 dark:bg-orange-950/30 border-orange-500 text-orange-600 dark:text-orange-400"
                  : "border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:border-orange-300"
              }`}
            >
              <input
                type="radio"
                name={`filter_bool_${column.key}`}
                value={opt.value}
                checked={draft.value === opt.value}
                onChange={() => setDraft((d) => ({ ...d, operator: "eq", value: opt.value }))}
                className="sr-only"
              />
              {opt.label}
            </label>
          ))}
        </div>
      )}

      {/* Action buttons */}
      <div className="flex items-center justify-between pt-2 border-t border-neutral-100 dark:border-neutral-800">
        <button
          onClick={(e) => { e.stopPropagation(); handleClear(); }}
          className="text-xs text-neutral-500 hover:text-red-500 dark:hover:text-red-400 transition-colors font-medium"
        >
          Hapus Filter
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); handleApply(); }}
          className="px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold rounded-lg transition-colors shadow-sm"
        >
          Terapkan
        </button>
      </div>
    </div>
  );

  return (
    <div className="relative inline-flex" onClick={(e) => e.stopPropagation()}>
      {/* Trigger button */}
      <button
        ref={btnRef}
        onClick={(e) => {
          e.stopPropagation();
          if (!open) updatePosition();
          setOpen((o) => !o);
        }}
        title={`Filter ${column.label}`}
        className={`ml-1 p-0.5 rounded transition-colors ${
          hasValue
            ? "text-orange-500 bg-orange-50 dark:bg-orange-950/40"
            : "text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
        }`}
      >
        <FiFilter className="w-3 h-3" />
      </button>

      {/* Portal: render panel directly to body, above everything */}
      {typeof document !== "undefined" && createPortal(panel, document.body)}
    </div>
  );
}
