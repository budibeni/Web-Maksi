"use client";

const LIMIT_OPTIONS = [10, 25, 50, 100];

/**
 * TablePagination
 * Props:
 *   page           number
 *   pageSize       number (limit)
 *   totalData      number
 *   totalPages     number
 *   onPageChange   fn(newPage)
 *   onLimitChange  fn(newLimit)
 *   limitOptions   number[]
 */
export default function TablePagination({
  page = 1,
  pageSize = 10,
  totalData = 0,
  totalPages = 1,
  onPageChange,
  onLimitChange,
  limitOptions = LIMIT_OPTIONS,
}) {
  if (totalData === 0) return null;

  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, totalData);

  const btnClass =
    "px-3 py-1.5 text-xs font-semibold rounded-lg border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-neutral-600 dark:text-neutral-300";

  return (
    <div className="px-5 py-3.5 border-t border-neutral-100 dark:border-neutral-800 flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-neutral-900">
      {/* Left: rows per page + info */}
      <div className="flex items-center gap-4 text-xs text-neutral-500 dark:text-neutral-400">
        <div className="flex items-center gap-2">
          <span>Baris:</span>
          <select
            value={pageSize}
            onChange={(e) => {
              onLimitChange?.(Number(e.target.value));
            }}
            className="bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 text-xs rounded-lg focus:ring-orange-500 focus:border-orange-500 px-2 py-1 outline-none cursor-pointer"
          >
            {limitOptions.map((l) => (
              <option key={l} value={l}>{l}</option>
            ))}
          </select>
        </div>
        <span>
          Menampilkan{" "}
          <span className="font-semibold text-neutral-800 dark:text-neutral-200">{from}</span>
          {" – "}
          <span className="font-semibold text-neutral-800 dark:text-neutral-200">{to}</span>
          {" dari "}
          <span className="font-semibold text-neutral-800 dark:text-neutral-200">{totalData}</span>
          {" data"}
        </span>
      </div>

      {/* Right: prev / page select / next */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange?.(page - 1)}
          disabled={page <= 1}
          className={btnClass}
        >
          ‹ Sebelumnya
        </button>

        <div className="flex items-center gap-1.5 text-xs text-neutral-600 dark:text-neutral-300 font-medium">
          <span>Hal</span>
          <select
            value={page}
            onChange={(e) => onPageChange?.(Number(e.target.value))}
            className="bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 text-xs rounded-lg focus:ring-orange-500 focus:border-orange-500 px-2 py-1 outline-none cursor-pointer text-center min-w-[3rem]"
          >
            {Array.from({ length: Math.max(1, totalPages) }, (_, i) => i + 1).map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
          <span>dari {totalPages}</span>
        </div>

        <button
          onClick={() => onPageChange?.(page + 1)}
          disabled={page >= totalPages}
          className={btnClass}
        >
          Selanjutnya ›
        </button>
      </div>
    </div>
  );
}
