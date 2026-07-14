"use client";

import { useUIStore } from "@/store/ui.store";
import { FiAlertCircle, FiCheckCircle, FiInfo, FiX } from "react-icons/fi";

export default function GlobalDialogs() {
  const { toast, hideToast, confirm, hideConfirm } = useUIStore();

  const handleConfirm = () => {
    if (confirm.onConfirm) confirm.onConfirm();
    hideConfirm();
  };

  const handleCancel = () => {
    if (confirm.onCancel) confirm.onCancel();
    hideConfirm();
  };

  return (
    <>
      {/* Toast Notification */}
      <div 
        className={`fixed top-4 right-4 z-[9999] transition-all duration-300 transform ${toast.open ? "translate-x-0 opacity-100" : "translate-x-full opacity-0 pointer-events-none"}`}
      >
        <div className="bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 px-4 py-3 rounded-xl shadow-xl flex items-center gap-3 min-w-[300px]">
          {toast.type === 'success' && <FiCheckCircle className="w-5 h-5 text-green-400 dark:text-green-600" />}
          {toast.type === 'error' && <FiAlertCircle className="w-5 h-5 text-red-400 dark:text-red-600" />}
          {toast.type === 'info' && <FiInfo className="w-5 h-5 text-blue-400 dark:text-blue-600" />}
          
          <div className="flex-1 text-sm font-medium">
            {toast.message}
          </div>
          
          <button onClick={hideToast} className="text-neutral-400 hover:text-white dark:hover:text-neutral-900 transition-colors">
            <FiX className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Confirm Dialog Modal */}
      {confirm.open && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-neutral-900/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 scale-100">
            <div className="p-6">
              <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-2">
                Konfirmasi
              </h3>
              <p className="text-neutral-600 dark:text-neutral-400 text-sm">
                {confirm.message}
              </p>
            </div>
            <div className="px-6 py-4 bg-neutral-50 dark:bg-neutral-950 border-t border-neutral-100 dark:border-neutral-800 flex justify-end gap-3 rounded-b-2xl">
              <button 
                onClick={handleCancel}
                className="px-4 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-xl hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
              >
                Batal
              </button>
              <button 
                onClick={handleConfirm}
                className={`px-4 py-2 text-sm font-medium rounded-xl transition-colors shadow-sm ${
                  confirm.type === 'danger' 
                    ? 'text-white bg-red-600 hover:bg-red-700' 
                    : 'text-white bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-200 dark:text-neutral-900'
                }`}
              >
                Oke
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
