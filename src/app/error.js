"use client";

import { useEffect } from 'react';
import Link from 'next/link';

export default function Error({ error, reset }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center bg-neutral-50 dark:bg-neutral-950 px-4 transition-colors duration-300">
      <div className="text-center bg-white dark:bg-neutral-900 p-8 rounded-2xl shadow-sm border border-neutral-100 dark:border-neutral-800 max-w-md w-full">
        <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900/40 rounded-full flex items-center justify-center mb-6">
          <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
          </svg>
        </div>
        
        <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-2">Terjadi Kesalahan Sistem</h2>
        <p className="text-neutral-500 dark:text-neutral-400 mb-6 text-sm">
          Sistem mendeteksi adanya gangguan teknis. Tim kami telah dicatat mengenai hal ini.
        </p>
        
        <div className="flex space-x-3 justify-center">
          <button
            onClick={() => reset()}
            className="px-4 py-2 bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 transition-colors text-sm font-medium"
          >
            Coba Lagi
          </button>
          <Link
            href="/"
            className="px-4 py-2 border border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-50 transition-colors text-sm font-medium"
          >
            Ke Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
