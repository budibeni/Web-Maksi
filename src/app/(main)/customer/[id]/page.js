"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FiArrowLeft, FiUser, FiPhone, FiMapPin, FiClock, FiEdit2, FiActivity } from "react-icons/fi";
import dayjs from "dayjs";
import 'dayjs/locale/id';
import { useUIStore } from "@/store/ui.store";
dayjs.locale('id');

const formatWhatsAppUrl = (phone) => {
  if (!phone) return '#';
  let cleanPhone = phone.replace(/\D/g, '');
  if (cleanPhone.startsWith('0')) {
    cleanPhone = '62' + cleanPhone.substring(1);
  }
  return `https://wa.me/${cleanPhone}`;
};

export default function CustomerDetailPage({ params }) {
  const router = useRouter();
  const setBreadcrumb = useUIStore((state) => state.setBreadcrumb);
  // In Next.js 15, params is a Promise, so we must unwrap it using React.use()
  const unwrappedParams = use(params);
  const id = unwrappedParams.id;

  const [customer, setCustomer] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCustomer = async () => {
      try {
        const res = await fetch(`/api/customer/${id}`);
        const json = await res.json();
        if (json.success) {
          setCustomer(json.data);
          if (json.data?.nama) {
            setBreadcrumb(String(id), json.data.nama);
          }
        } else {
          // Redirect if not found
          router.push("/customer");
        }
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };
    
    if (id) {
      fetchCustomer();
    }
  }, [id, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!customer) return null;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <Link 
          href="/customer" 
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-neutral-600 hover:text-neutral-900 bg-white hover:bg-neutral-50 dark:bg-neutral-900 dark:text-neutral-400 dark:hover:text-white dark:hover:bg-neutral-800 rounded-xl transition-colors border border-neutral-200 dark:border-neutral-800 shadow-sm"
        >
          <FiArrowLeft className="w-4 h-4" />
          Kembali ke Daftar
        </Link>
        <button 
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 rounded-xl transition-colors shadow-sm"
          onClick={() => {
            // Ideally this would open the edit modal, but for now it can just alert or we could implement a full edit page.
            // Since edit is in the main list, we can direct users back there or implement it here later.
            alert("Fitur edit detail dalam pengembangan. Silakan edit melalui daftar customer.");
          }}
        >
          <FiEdit2 className="w-4 h-4" />
          Edit Profil
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Profile Card */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200/50 dark:border-neutral-800 shadow-sm overflow-hidden relative">
            <div className="h-32 bg-gradient-to-br from-orange-500 to-orange-700"></div>
            
            <div className="px-6 pb-6 pt-0 relative">
              <div className="w-24 h-24 rounded-2xl bg-white dark:bg-neutral-950 p-1.5 absolute -top-12 shadow-md">
                <div className="w-full h-full rounded-xl bg-gradient-to-br from-orange-100 to-orange-200 dark:from-orange-900/40 dark:to-orange-800/40 flex items-center justify-center">
                  <FiUser className="w-10 h-10 text-orange-600 dark:text-orange-500" />
                </div>
              </div>

              <div className="mt-14">
                <h2 className="text-xl font-bold text-neutral-900 dark:text-white truncate" title={customer.nama}>
                  {customer.nama}
                </h2>
                <div className="text-sm font-medium text-orange-600 dark:text-orange-500 mt-1">
                  Customer
                </div>
              </div>

              <div className="mt-6 space-y-4">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 p-2 bg-neutral-50 dark:bg-neutral-950 rounded-lg text-neutral-500 dark:text-neutral-400">
                    <FiPhone className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs text-neutral-500 dark:text-neutral-500 font-medium mb-0.5">Nomor Telepon</div>
                    <a 
                      href={formatWhatsAppUrl(customer.telepon)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-orange-600 hover:text-orange-700 dark:text-orange-500 dark:hover:text-orange-400 font-medium transition-colors"
                      title="Chat via WhatsApp"
                    >
                      {customer.telepon}
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="mt-0.5 p-2 bg-neutral-50 dark:bg-neutral-950 rounded-lg text-neutral-500 dark:text-neutral-400">
                    <FiMapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs text-neutral-500 dark:text-neutral-500 font-medium mb-0.5">Alamat</div>
                    <div className="text-sm text-neutral-900 dark:text-white leading-relaxed">
                      {customer.alamat || <span className="text-neutral-400 italic">Belum diisi</span>}
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="mt-0.5 p-2 bg-neutral-50 dark:bg-neutral-950 rounded-lg text-neutral-500 dark:text-neutral-400">
                    <FiClock className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs text-neutral-500 dark:text-neutral-500 font-medium mb-0.5">Terdaftar Sejak</div>
                    <div className="text-sm text-neutral-900 dark:text-white">
                      {dayjs(customer.dibuat_tanggal).format("DD MMMM YYYY")}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200/50 dark:border-neutral-800 shadow-sm p-6">
            <h3 className="text-sm font-bold text-neutral-900 dark:text-white mb-4 uppercase tracking-wider">Catatan Tambahan</h3>
            <div className="text-sm text-neutral-600 dark:text-neutral-400 bg-neutral-50 dark:bg-neutral-950 p-4 rounded-2xl whitespace-pre-wrap leading-relaxed">
              {customer.catatan || <span className="italic">Tidak ada catatan untuk customer ini.</span>}
            </div>
          </div>
        </div>

        {/* Right Column: Interaction / Lead History Placeholder */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200/50 dark:border-neutral-800 shadow-sm overflow-hidden flex flex-col h-full min-h-[400px]">
            <div className="p-6 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
              <h3 className="text-lg font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                <FiActivity className="w-5 h-5 text-orange-500" />
                Histori Transaksi / Lead
              </h3>
            </div>
            <div className="flex-1 p-6 flex flex-col items-center justify-center text-center">
              <div className="w-20 h-20 bg-neutral-50 dark:bg-neutral-950 rounded-full flex items-center justify-center mb-4 border border-neutral-100 dark:border-neutral-800">
                <FiActivity className="w-8 h-8 text-neutral-300 dark:text-neutral-700" />
              </div>
              <h4 className="text-base font-bold text-neutral-900 dark:text-white mb-2">Belum Ada Histori</h4>
              <p className="text-sm text-neutral-500 max-w-sm mx-auto leading-relaxed">
                Modul Lead / Transaksi belum sepenuhnya tersedia. Riwayat interaksi dengan customer ini akan tampil di sini.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
