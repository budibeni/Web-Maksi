export const metadata = {
  title: "Dashboard - MAKSI",
};

export default function Dashboard() {
  return (
    <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-sm p-8 text-center min-h-[60vh] flex flex-col items-center justify-center transition-colors duration-300">
      <div className="w-16 h-16 bg-orange-100 dark:bg-orange-900/40 rounded-full flex items-center justify-center mb-4">
        <svg className="w-8 h-8 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path>
        </svg>
      </div>
      <h2 className="text-2xl font-bold text-neutral-800 dark:text-neutral-100 mb-2">Selamat Datang di MAKSI</h2>
      <p className="text-neutral-500 dark:text-neutral-400 max-w-md mx-auto">
        Anda telah berhasil login. Fitur Dashboard dan modul lainnya akan tersedia pada tahap pengembangan berikutnya.
      </p>
    </div>
  );
}
