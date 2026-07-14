"use client";

import Link from "next/link";
import { FiLock, FiArrowLeft } from "react-icons/fi";
import { useAuthStore } from "@/store/auth.store";

export default function ForbiddenPage() {
  const { user } = useAuthStore();

  return (
    <div className="min-h-screen bg-neutral-100 dark:bg-neutral-950 flex flex-col items-center justify-center p-4">
      <div className="bg-white dark:bg-neutral-900 p-8 md:p-12 rounded-3xl shadow-xl w-full max-w-lg text-center animate-in zoom-in-95 duration-300">
        <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
          <FiLock className="w-10 h-10 text-red-600 dark:text-red-500" />
        </div>
        <h1 className="text-3xl font-bold text-neutral-900 dark:text-white mb-3">403 Forbidden</h1>
        <p className="text-neutral-500 dark:text-neutral-400 mb-8 leading-relaxed">
          Maaf, Anda tidak memiliki hak akses (*permission*) untuk membuka halaman ini. Silakan hubungi Administrator jika Anda merasa ini adalah sebuah kesalahan.
        </p>
        
        <div className="flex flex-col gap-3">
          <Link 
            href={user ? "/dashboard" : "/login"} 
            className="w-full inline-flex justify-center items-center gap-2 px-6 py-3.5 bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-200 text-white dark:text-neutral-900 font-medium rounded-xl transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:ring-offset-2 dark:focus:ring-offset-neutral-900"
          >
            <FiArrowLeft className="w-4 h-4" />
            Kembali ke {user ? "Dashboard" : "Login"}
          </Link>
        </div>
      </div>
    </div>
  );
}
