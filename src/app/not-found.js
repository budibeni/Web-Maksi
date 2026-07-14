import Link from 'next/link';
import { FiAlertCircle } from 'react-icons/fi';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 transition-colors duration-300">
      <div className="max-w-md w-full space-y-8 text-center">
        <div className="flex justify-center">
          <div className="rounded-full bg-orange-100 dark:bg-orange-900/40 p-6">
            <FiAlertCircle className="h-16 w-16 text-orange-600 dark:text-orange-400" />
          </div>
        </div>
        <div>
          <h2 className="mt-6 text-3xl font-extrabold text-neutral-900 dark:text-white">
            Halaman Tidak Ditemukan
          </h2>
          <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
            Maaf, halaman yang Anda cari tidak ada atau telah dipindahkan.
          </p>
        </div>
        <Link 
          href="/"
          className="inline-block mt-8 rounded-lg bg-orange-600 px-5 py-3 text-sm font-medium text-white hover:bg-orange-700 focus:outline-none focus:ring transition-colors shadow-sm"
        >
          Kembali ke Dashboard
        </Link>
      </div>
    </div>
  );
}
