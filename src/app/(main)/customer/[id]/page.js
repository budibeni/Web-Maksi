"use client";

import { useState, useEffect, use } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FiArrowLeft, FiUser, FiPhone, FiMapPin, FiClock, FiEdit2, FiActivity } from "react-icons/fi";
import { FaWhatsapp } from "react-icons/fa";
import dayjs from "dayjs";
import 'dayjs/locale/id';
import { useUIStore } from "@/store/ui.store";
import { useAuthStore } from "@/store/auth.store";
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
  const currentUser = useAuthStore((state) => state.user);
  const role = (typeof currentUser?.role === 'object' ? currentUser.role.nama : currentUser?.role || "").toLowerCase();
  const isTopManagement = role === "top management";

  // In Next.js 15, params is a Promise, so we must unwrap it using React.use()
  const unwrappedParams = use(params);
  const id = unwrappedParams.id;

  const [customer, setCustomer] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
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
      {mounted && document.getElementById("header-actions-portal") && createPortal(
        <>
          {!isTopManagement && (
            <button
              className="inline-flex items-center gap-2 px-4 py-1.5 text-sm font-semibold text-white bg-orange-600 hover:bg-orange-700 rounded-full transition-colors shadow-sm mr-2"
              onClick={() => {
                alert("Fitur edit detail dalam pengembangan. Silakan edit melalui daftar customer.");
              }}
            >
              <FiEdit2 className="w-4 h-4" />
              <span>Edit Profil</span>
            </button>
          )}
          <Link
            href="/customer"
            className="inline-flex items-center gap-2 px-4 py-1.5 text-sm font-semibold text-neutral-600 hover:text-neutral-900 bg-white hover:bg-neutral-100 dark:bg-neutral-900 dark:text-neutral-400 dark:hover:text-white dark:hover:bg-neutral-800 rounded-full transition-colors border border-neutral-200 dark:border-neutral-800 shadow-sm"
          >
            <FiArrowLeft className="w-4 h-4" />
            <span>Kembali</span>
          </Link>
        </>,
        document.getElementById("header-actions-portal")
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Profile Card */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200/50 dark:border-neutral-800 shadow-sm overflow-hidden relative">
            <div className="h-32 bg-gradient-to-br from-orange-500 to-orange-700"></div>

            <div className="px-6 pb-6 pt-0 relative flex flex-col items-start">
              <div className="w-24 h-24 rounded-2xl bg-white dark:bg-neutral-950 p-1.5 -mt-12 shadow-md relative z-10 mb-4">
                <div className="w-full h-full rounded-xl bg-gradient-to-br from-orange-100 to-orange-200 dark:from-orange-900/40 dark:to-orange-800/40 flex items-center justify-center">
                  <FiUser className="w-10 h-10 text-orange-600 dark:text-orange-500" />
                </div>
              </div>

              <div>
                <h2 className="text-xl font-bold text-neutral-900 dark:text-white truncate max-w-full" title={customer.nama}>
                  {customer.nama}
                </h2>
                <div className="text-sm font-medium text-orange-600 dark:text-orange-500 mt-1">
                  Customer
                </div>
              </div>

              <div className="mt-6 space-y-4">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 p-2 bg-neutral-50 dark:bg-neutral-950 rounded-lg text-neutral-500 dark:text-neutral-400">
                    <FaWhatsapp className="w-4 h-4 text-emerald-500" />
                  </div>
                  <div>
                    <div className="text-xs text-neutral-500 dark:text-neutral-500 font-medium mb-0.5">Nomor Telepon</div>
                    <a 
                      href={formatWhatsAppUrl(customer.telepon)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-emerald-600 hover:text-emerald-700 dark:text-emerald-500 dark:hover:text-emerald-400 font-semibold transition-colors flex items-center gap-1"
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

        {/* Right Column: Lead History */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200/50 dark:border-neutral-800 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
              <h3 className="text-lg font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                <FiActivity className="w-5 h-5 text-orange-500" />
                Histori Lead ({customer.leads?.length || 0})
              </h3>
            </div>

            {!customer.leads || customer.leads.length === 0 ? (
              <div className="p-10 flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 bg-neutral-50 dark:bg-neutral-950 rounded-full flex items-center justify-center mb-4 border border-neutral-100 dark:border-neutral-800">
                  <FiActivity className="w-7 h-7 text-neutral-300 dark:text-neutral-700" />
                </div>
                <h4 className="text-base font-bold text-neutral-900 dark:text-white mb-1">Belum Ada Histori Lead</h4>
                <p className="text-sm text-neutral-500">Customer ini belum pernah terlibat dalam transaksi Lead.</p>
              </div>
            ) : (
              <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
                {customer.leads.map((lead) => {
                  const statusMap = {
                    1: { label: 'Open', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
                    2: { label: 'Deal', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
                    3: { label: 'Lost', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
                  };
                  const statusInfo = statusMap[lead.status] || statusMap[1];

                  const nilai = lead.status === 2
                    ? lead.nilai_deal
                    : lead.status === 3
                      ? lead.nilai_lost
                      : lead.versi_penawaran_final?.grand_total;

                  return (
                    <Link
                      key={lead.id}
                      href={`/lead/${lead.id}`}
                      className="flex items-center justify-between gap-4 px-6 py-4 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors group"
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="mt-1 flex-shrink-0">
                          <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${statusInfo.color}`}>
                            {statusInfo.label}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-neutral-900 dark:text-white group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
                            {lead.nomor}
                          </div>
                          <div className="text-xs text-neutral-500 mt-0.5">
                            {lead.user?.nama} · {lead.cabang?.nama}
                          </div>
                          {lead.catatan_awal && (
                            <div className="text-xs text-neutral-400 mt-0.5 truncate max-w-xs">{lead.catatan_awal}</div>
                          )}
                        </div>
                      </div>

                      <div className="text-right flex-shrink-0">
                        {nilai ? (
                          <div className="text-sm font-bold text-neutral-900 dark:text-white">
                            Rp {Number(nilai).toLocaleString('id-ID')}
                          </div>
                        ) : (
                          <div className="text-xs text-neutral-400 italic">—</div>
                        )}
                        <div className="text-xs text-neutral-400 mt-0.5">
                          {dayjs(lead.dibuat_tanggal).format('DD MMM YYYY')}
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
