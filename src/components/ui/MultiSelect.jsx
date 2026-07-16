"use client";

import { useState, useEffect, useRef } from "react";
import { FiChevronDown, FiCheck, FiX } from "react-icons/fi";

export default function MultiSelect({
  options = [],
  selectedValues = [],
  onChange,
  placeholder = "Pilih...",
  labelAll = "Semua",
  className = ""
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleToggleOption = (value) => {
    const nextSelected = [...selectedValues];
    const index = nextSelected.indexOf(value);
    if (index > -1) {
      nextSelected.splice(index, 1);
    } else {
      nextSelected.push(value);
    }
    onChange(nextSelected);
  };

  const handleSelectAll = () => {
    if (selectedValues.length === options.length) {
      onChange([]);
    } else {
      onChange(options.map(o => o.value));
    }
  };

  const getDisplayText = () => {
    if (selectedValues.length === 0) return placeholder;
    if (selectedValues.length === options.length) return labelAll;
    
    // Show selected labels
    const selectedLabels = options
      .filter(o => selectedValues.includes(o.value))
      .map(o => o.label);
    
    if (selectedLabels.length <= 2) {
      return selectedLabels.join(", ");
    }
    return `${selectedLabels.length} terpilih`;
  };

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3 py-2.5 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 dark:text-white text-xs font-semibold text-left transition-all cursor-pointer"
      >
        <span className="truncate pr-2">
          {getDisplayText()}
        </span>
        <FiChevronDown className={`w-3.5 h-3.5 text-neutral-400 transition-transform duration-200 ${isOpen ? "rotate-180 text-orange-500" : ""}`} />
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1.5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-lg max-h-60 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-150 p-1.5 space-y-0.5">
          {options.length > 0 && (
            <button
              type="button"
              onClick={handleSelectAll}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-neutral-800 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg text-left transition-colors cursor-pointer border-b border-neutral-100 dark:border-neutral-800 pb-2 mb-1"
            >
              <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${selectedValues.length === options.length ? "bg-orange-500 border-orange-500 text-white" : "border-neutral-300 dark:border-neutral-700 bg-transparent"}`}>
                {selectedValues.length === options.length && <FiCheck className="w-3 h-3 stroke-[3]" />}
              </div>
              <span>Pilih Semua</span>
            </button>
          )}

          {options.map((opt) => {
            const isChecked = selectedValues.includes(opt.value);
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => handleToggleOption(opt.value)}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 rounded-lg text-left transition-colors cursor-pointer"
              >
                <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${isChecked ? "bg-orange-500 border-orange-500 text-white" : "border-neutral-300 dark:border-neutral-700 bg-transparent"}`}>
                  {isChecked && <FiCheck className="w-3 h-3 stroke-[3]" />}
                </div>
                <span className="truncate">{opt.label}</span>
              </button>
            );
          })}

          {options.length === 0 && (
            <div className="px-3 py-4 text-xs text-neutral-400 text-center">Tidak ada pilihan</div>
          )}
        </div>
      )}
    </div>
  );
}
