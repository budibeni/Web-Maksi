"use client";

import Link from "next/link";
import { FiAlertCircle, FiArrowLeft } from "react-icons/fi";
import { useAuthStore } from "@/store/auth.store";

export default function UnauthorizedPage() {
  const { user } = useAuthStore();

  return (
    <div className="min-h-screen bg-neutral-100 dark:bg-neutral-950 flex flex-col items-center justify-center p-4">
      <div className="bg-white dark:bg-neutral-900 p-8 md:p-12 rounded-3xl shadow-xl w-full max-w-lg text-center animate-in zoom-in-95 duration-300">
        <div className="w-20 h-20 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
          <FiAlertCircle className="w-10 h-10 text-orange-600 dark:text-orange-500" />
        </div>
        <h1 className="text-3xl font-bold text-neutral-900 dark:text-white mb-3">401 Unauthorized</h1>
        <p className="text-neutral-500 dark:text-neutral-400 mb-8 leading-relaxed">
          Sesi Anda telah berakhir atau Anda belum masuk. Silakan login kembali untuk melanjutkan akses ke aplikasi.
        </p>
        
        <div className="flex flex-col gap-3">
          <Link 
            href="/login" 
            className="w-full inline-flex justify-center items-center gap-2 px-6 py-3.5 bg-orange-600 hover:bg-orange-700 text-white font-medium rounded-xl transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 dark:focus:ring-offset-neutral-900"
          >
            Halaman Login
          </Link>
        </div>
      </div>
    </div>
  );
}
