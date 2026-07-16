"use client";

import { useState, useCallback } from "react";

/**
 * useDataTable — custom hook untuk mengelola seluruh state DataTable.
 *
 * Options:
 *   defaultPageSize   number  (default 10)
 *   defaultSortField  string  (default "id")
 *   defaultSortOrder  string  (default "desc")
 *
 * Returns:
 *   tableState    — semua nilai state
 *   tableHandlers — semua handler callback
 *   resetPage     — fn() reset halaman ke 1
 */
export function useDataTable({
  defaultPageSize = 10,
  defaultSortField = "id",
  defaultSortOrder = "desc",
} = {}) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(defaultPageSize);
  const [totalData, setTotalData] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [searchValue, setSearchValue] = useState("");
  const [sortField, setSortField] = useState(defaultSortField);
  const [sortOrder, setSortOrder] = useState(defaultSortOrder);
  const [columnFilters, setColumnFilters] = useState({});

  const resetPage = useCallback(() => setPage(1), []);

  // Handlers
  const handlePageChange = useCallback((newPage) => {
    setPage(newPage);
  }, []);

  const handleLimitChange = useCallback((newLimit) => {
    setPageSize(newLimit);
    setPage(1);
  }, []);

  const handleSortChange = useCallback((field, order) => {
    setSortField(field);
    setSortOrder(order);
    setPage(1);
  }, []);

  const handleSearchChange = useCallback((value) => {
    setSearchValue(value);
    setPage(1);
  }, []);

  const handleFilterChange = useCallback((key, value) => {
    setColumnFilters((prev) => {
      const next = { ...prev };
      if (value === null || value === undefined) {
        delete next[key];
      } else {
        next[key] = value;
      }
      return next;
    });
    setPage(1);
  }, []);

  /**
   * Bangun URLSearchParams dari semua state untuk dikirim ke API.
   * Tambahkan parameter lain via `extra` object jika perlu.
   */
  const buildParams = useCallback(
    (extra = {}) => {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(pageSize),
        search: searchValue,
        sortField,
        sortOrder,
        ...extra,
      });

      // Append column filters
      Object.entries(columnFilters).forEach(([colKey, filterVal]) => {
        if (!filterVal) return;
        params.set(`filter[${colKey}][operator]`, filterVal.operator || "");
        if (filterVal.value !== undefined && filterVal.value !== null && filterVal.value !== "") {
          if (Array.isArray(filterVal.value)) {
            params.set(`filter[${colKey}][value]`, filterVal.value.join(","));
          } else {
            params.set(`filter[${colKey}][value]`, String(filterVal.value));
          }
        }
        if (filterVal.value2 !== undefined && filterVal.value2 !== "") {
          params.set(`filter[${colKey}][value2]`, String(filterVal.value2));
        }
      });

      return params;
    },
    [page, pageSize, searchValue, sortField, sortOrder, columnFilters]
  );

  /**
   * Setelah fetch berhasil, panggil ini untuk update pagination.
   * Mendukung format: { totalData, totalPages } atau { total, totalPages }
   */
  const applyPagination = useCallback((pagination) => {
    setTotalData(pagination?.totalData ?? pagination?.total ?? 0);
    setTotalPages(pagination?.totalPages ?? 1);
  }, []);

  /**
   * Programmatic filter setter — berguna untuk tombol/card di luar DataTable.
   * setFilterValue("fase", "equals", "1") — pasang filter
   * setFilterValue("fase", "equals", "")  — hapus filter
   */
  const setFilterValue = useCallback((field, operator, value) => {
    setColumnFilters((prev) => {
      const next = { ...prev };
      if (value === null || value === undefined || value === "") {
        delete next[field];
      } else {
        next[field] = { operator, value };
      }
      return next;
    });
    setPage(1);
  }, []);

  /**
   * Clear semua column filters sekaligus.
   */
  const clearAllFilters = useCallback(() => {
    setColumnFilters({});
    setPage(1);
  }, []);

  return {
    // State
    tableState: {
      page,
      pageSize,
      totalData,
      totalPages,
      searchValue,
      sortField,
      sortOrder,
      columnFilters,
    },
    // Handlers (pass directly ke DataTable props)
    tableHandlers: {
      onPageChange: handlePageChange,
      onLimitChange: handleLimitChange,
      onSortChange: handleSortChange,
      onSearchChange: handleSearchChange,
      onFilterChange: handleFilterChange,
    },
    // Utilities
    buildParams,
    applyPagination,
    resetPage,
    setFilterValue,
    clearAllFilters,
  };
}
