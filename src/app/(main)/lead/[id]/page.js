"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  FiArrowLeft, FiUser, FiPhone, FiMapPin, FiCalendar, FiClock,
  FiCheckCircle, FiXCircle, FiFileText, FiEdit3, FiBell, FiActivity,
  FiAlertCircle, FiChevronRight
} from "react-icons/fi";
import dayjs from "dayjs";
import 'dayjs/locale/id';
import { useUIStore } from "@/store/ui.store";

dayjs.locale('id');

const FASE_LABEL = { 1: 'Lead Baru', 2: 'Follow Up', 3: 'Penawaran' };
const FASE_COLOR_BG = {
  1: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  2: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  3: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
};
const STATUS_LABEL = { 1: 'OPEN', 2: 'DEAL', 3: 'LOST' };

// Modal Lost
function ModalLost({ leadId, onClose, onSaved }) {
  const [alasanList, setAlasanList] = useState([]);
  const [alasanId, setAlasanId] = useState("");
  const [catatan, setCatatan] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showToast } = useUIStore();

  useEffect(() => {
    fetch('/api/master/alasan-lost').then(r => r.json()).then(d => {
      if (d.success) setAlasanList(d.data || []);
    });
  }, []);

  const handleSubmit = async () => {
    if (!alasanId) { showToast('Alasan lost wajib dipilih.', 'error'); return; }
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/lead/lost', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lead_id: String(leadId), alasan_lost_id: alasanId, catatan_lost: catatan }),
      });
      const json = await res.json();
      if (json.success) {
        showToast('Lead berhasil ditandai sebagai Lost.', 'success');
        onSaved();
      } else {
        showToast(json.message || 'Terjadi kesalahan.', 'error');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-xl w-full max-w-md">
        <div className="p-5 border-b border-neutral-100 dark:border-neutral-800 flex items-center gap-3">
          <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-xl">
            <FiXCircle className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <h3 className="text-base font-bold text-neutral-900 dark:text-white">Tandai sebagai Lost</h3>
            <p className="text-xs text-neutral-500">Lead ini akan ditandai sebagai Lost.</p>
          </div>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Alasan Lost *</label>
            <select value={alasanId} onChange={(e) => setAlasanId(e.target.value)} className="w-full px-4 py-2.5 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl outline-none dark:text-white text-sm">
              <option value="">Pilih alasan lost...</option>
              {alasanList.map(a => <option key={a.id} value={a.id}>{a.nama}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Catatan (Opsional)</label>
            <textarea value={catatan} onChange={(e) => setCatatan(e.target.value)} rows={3} placeholder="Catatan tambahan..." className="w-full px-4 py-2.5 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl outline-none dark:text-white text-sm resize-none" />
          </div>
        </div>
        <div className="px-5 pb-5 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium rounded-xl border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors text-neutral-700 dark:text-neutral-300">Batal</button>
          <button onClick={handleSubmit} disabled={isSubmitting} className="px-4 py-2 text-sm font-medium rounded-xl bg-red-600 hover:bg-red-700 text-white transition-colors disabled:opacity-60">
            {isSubmitting ? 'Menyimpan...' : 'Simpan sebagai Lost'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function LeadDetailPage({ params }) {
  const router = useRouter();
  const { showToast, setBreadcrumb } = useUIStore();
  const unwrapped = use(params);
  const id = unwrapped.id;

  const [lead, setLead] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showModalLost, setShowModalLost] = useState(false);

  // Follow Up form
  const [hasilInteraksiList, setHasilInteraksiList] = useState([]);
  const [hasilId, setHasilId] = useState("");
  const [catatan, setCatatan] = useState("");
  const [buatPengingat, setBuatPengingat] = useState(false);
  const [tanggalPengingat, setTanggalPengingat] = useState(dayjs().add(3, 'day').format('YYYY-MM-DD'));
  const [waktuPengingat, setWaktuPengingat] = useState("09:00");
  const [isSubmittingFU, setIsSubmittingFU] = useState(false);

  const fetchLead = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/lead/${id}`);
      const json = await res.json();
      if (json.success) {
        setLead(json.data);
        if (json.data?.nomor) {
          setBreadcrumb(String(id), json.data.nomor);
        }
      }
      else router.push('/lead');
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchLead();
      fetch('/api/master/hasil-interaksi').then(r => r.json()).then(d => {
        if (d.success) setHasilInteraksiList(d.data || []);
      });
    }
  }, [id]);

  const handleFollowUp = async (e) => {
    e.preventDefault();
    if (!hasilId) { showToast('Pilih hasil follow up.', 'error'); return; }
    if (!catatan.trim()) { showToast('Catatan wajib diisi.', 'error'); return; }

    setIsSubmittingFU(true);
    try {
      const res = await fetch(`/api/lead/${id}/follow-up`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hasil_interaksi_id: hasilId,
          catatan,
          buat_pengingat: buatPengingat,
          tanggal_pengingat: buatPengingat ? tanggalPengingat : undefined,
          waktu_pengingat: buatPengingat ? waktuPengingat : undefined,
        }),
      });
      const json = await res.json();
      if (json.success) {
        showToast('Follow up berhasil disimpan!', 'success');
        setHasilId(""); setCatatan(""); setBuatPengingat(false);
        fetchLead();
      } else {
        showToast(json.message || 'Terjadi kesalahan.', 'error');
      }
    } finally {
      setIsSubmittingFU(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!lead) return null;

  const isOpen = lead.status === 1;
  const activeReminder = lead.pengingats?.[0];
  const reminderLate = activeReminder && dayjs(activeReminder.tanggal_pengingat).isBefore(dayjs());

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link href="/lead" className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-neutral-600 hover:text-neutral-900 bg-white hover:bg-neutral-50 dark:bg-neutral-900 dark:text-neutral-400 dark:hover:text-white dark:hover:bg-neutral-800 rounded-xl transition-colors border border-neutral-200 dark:border-neutral-800 shadow-sm">
          <FiArrowLeft className="w-4 h-4" />
          Kembali ke Daftar
        </Link>
        {isOpen && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowModalLost(true)}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl border border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20 transition-colors"
            >
              <FiXCircle className="w-4 h-4" />
              Tandai Lost
            </button>
          </div>
        )}
      </div>

      {/* Info Lead */}
      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/50 dark:border-neutral-800 shadow-sm p-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h2 className="text-xl font-bold text-neutral-900 dark:text-white">{lead.customer?.nama}</h2>
              {lead.status_customer === 'EXISTING' && (
                <span className="text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 px-2.5 py-0.5 rounded-full font-semibold">Customer Existing</span>
              )}
              {lead.status_customer === 'BARU' && (
                <span className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 px-2.5 py-0.5 rounded-full font-semibold">Customer Baru</span>
              )}
            </div>
            <div className="text-sm text-neutral-500 dark:text-neutral-400 font-mono mb-3">{lead.nomor}</div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-neutral-600 dark:text-neutral-400">
              <span className="flex items-center gap-1.5"><FiPhone className="w-3.5 h-3.5" /> {lead.customer?.telepon}</span>
              <span className="flex items-center gap-1.5"><FiUser className="w-3.5 h-3.5" /> {lead.user?.nama}</span>
              <span className="flex items-center gap-1.5"><FiMapPin className="w-3.5 h-3.5" /> {lead.cabang?.nama}</span>
              <span className="flex items-center gap-1.5"><FiCalendar className="w-3.5 h-3.5" /> {dayjs(lead.dibuat_tanggal).format('DD MMM YYYY')}</span>
            </div>
          </div>
          <div className="flex flex-col items-start sm:items-end gap-2">
            <span className={`inline-flex px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide ${FASE_COLOR_BG[lead.fase]}`}>
              {FASE_LABEL[lead.fase]}
            </span>
            {activeReminder && (
              <div className={`text-xs flex items-center gap-1 ${reminderLate ? 'text-red-500' : 'text-orange-600 dark:text-orange-400'}`}>
                <FiBell className="w-3.5 h-3.5" />
                Reminder: {dayjs(activeReminder.tanggal_pengingat).format('DD MMM YYYY HH:mm')}
                {reminderLate && <span className="bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full text-[10px] font-bold ml-1">Terlambat</span>}
              </div>
            )}
          </div>
        </div>

        {lead.catatan_awal && (
          <div className="mt-4 p-3 bg-neutral-50 dark:bg-neutral-950 rounded-xl text-sm text-neutral-600 dark:text-neutral-400 border border-neutral-100 dark:border-neutral-800">
            <span className="font-medium text-neutral-700 dark:text-neutral-300">Catatan Awal:</span> {lead.catatan_awal}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left: Follow Up Form */}
        {isOpen && (
          <div className="lg:col-span-3">
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/50 dark:border-neutral-800 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-neutral-100 dark:border-neutral-800 flex items-center gap-3">
                <FiEdit3 className="w-5 h-5 text-orange-500" />
                <h3 className="text-base font-bold text-neutral-900 dark:text-white">Catat Follow Up</h3>
              </div>
              <form onSubmit={handleFollowUp} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">Hasil Follow Up *</label>
                  <div className="space-y-2">
                    {hasilInteraksiList.map(hi => (
                      <label key={hi.id} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${hasilId === hi.id ? 'border-orange-400 bg-orange-50 dark:bg-orange-900/20' : 'border-neutral-200 dark:border-neutral-700 hover:border-neutral-300 dark:hover:border-neutral-600'}`}>
                        <input type="radio" name="hasil_fu" value={hi.id} checked={hasilId === hi.id} onChange={() => setHasilId(hi.id)} />
                        <span className="text-sm font-medium text-neutral-900 dark:text-white">{hi.nama}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Catatan Follow Up *</label>
                  <textarea
                    rows={4}
                    value={catatan}
                    onChange={(e) => setCatatan(e.target.value)}
                    placeholder="Tulis catatan hasil pembicaraan dengan customer..."
                    className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl outline-none dark:text-white text-sm resize-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                    maxLength={1000}
                  />
                  <div className="text-xs text-right text-neutral-400">{catatan.length}/1000</div>
                </div>

                {/* Pengingat */}
                <div className="border border-neutral-200 dark:border-neutral-700 rounded-xl p-4 space-y-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={buatPengingat} onChange={(e) => setBuatPengingat(e.target.checked)} className="rounded" />
                    <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300 flex items-center gap-2">
                      <FiBell className="w-4 h-4 text-orange-500" /> Buat Pengingat Follow Up Berikutnya
                    </span>
                  </label>

                  {buatPengingat && (
                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <div>
                        <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">Tanggal</label>
                        <input type="date" value={tanggalPengingat} onChange={(e) => setTanggalPengingat(e.target.value)} min={dayjs().format('YYYY-MM-DD')} className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-700 rounded-lg outline-none dark:text-white text-sm" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">Waktu</label>
                        <input type="time" value={waktuPengingat} onChange={(e) => setWaktuPengingat(e.target.value)} className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-700 rounded-lg outline-none dark:text-white text-sm" />
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowModalLost(true)}
                    className="px-4 py-2.5 text-sm font-medium rounded-xl border border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20 transition-colors"
                  >
                    <FiXCircle className="w-4 h-4 inline mr-1" />
                    Tandai Lost
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingFU}
                    className="px-5 py-2.5 text-sm font-medium rounded-xl bg-orange-600 hover:bg-orange-700 text-white transition-colors disabled:opacity-60 flex items-center gap-2"
                  >
                    {isSubmittingFU ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> Menyimpan...</> : 'Simpan Follow Up'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Right / Full: Timeline Riwayat Aktivitas */}
        <div className={isOpen ? 'lg:col-span-2' : 'lg:col-span-5'}>
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/50 dark:border-neutral-800 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-neutral-100 dark:border-neutral-800 flex items-center gap-3">
              <FiActivity className="w-5 h-5 text-orange-500" />
              <h3 className="text-base font-bold text-neutral-900 dark:text-white">Riwayat Aktivitas</h3>
              <span className="ml-auto text-xs bg-neutral-100 dark:bg-neutral-800 text-neutral-500 px-2.5 py-1 rounded-full font-medium">{lead.aktivitas_leads?.length || 0} aktivitas</span>
            </div>
            <div className="p-6">
              {lead.aktivitas_leads?.length === 0 ? (
                <div className="text-center py-6 text-neutral-400 text-sm">Belum ada aktivitas.</div>
              ) : (
                <div className="space-y-4 relative before:absolute before:left-3.5 before:top-4 before:bottom-0 before:w-0.5 before:bg-neutral-200 dark:before:bg-neutral-800">
                  {lead.aktivitas_leads.map((act, i) => (
                    <div key={act.id} className="flex gap-4 relative">
                      <div className="w-7 h-7 flex-shrink-0 rounded-full bg-orange-100 dark:bg-orange-900/30 border-2 border-white dark:border-neutral-900 flex items-center justify-center z-10">
                        <FiActivity className="w-3.5 h-3.5 text-orange-600" />
                      </div>
                      <div className="flex-1 min-w-0 pb-4">
                        <div className="text-xs text-neutral-400 mb-1">{dayjs(act.dibuat_tanggal).format('DD MMM YYYY HH:mm')}</div>
                        <div className="text-sm font-semibold text-neutral-900 dark:text-white">{act.hasil_interaksi}</div>
                        {act.catatan && (
                          <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1 leading-relaxed">{act.catatan}</p>
                        )}
                        {act.pengingat && (
                          <div className="mt-2 flex items-center gap-1.5 text-xs text-orange-600 dark:text-orange-400">
                            <FiBell className="w-3.5 h-3.5" />
                            Reminder: {dayjs(act.pengingat.tanggal_pengingat).format('DD MMM YYYY HH:mm')}
                            <span className={`px-1.5 py-0.5 rounded-full font-bold ${act.pengingat.status === 'AKTIF' ? 'bg-green-100 text-green-600' : 'bg-neutral-100 text-neutral-500'}`}>
                              {act.pengingat.status}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Status DEAL / LOST info */}
      {!isOpen && (
        <div className={`rounded-2xl border p-6 ${lead.status === 2 ? 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800' : 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800'}`}>
          <div className="flex items-center gap-3">
            {lead.status === 2 ? <FiCheckCircle className="w-6 h-6 text-green-600" /> : <FiXCircle className="w-6 h-6 text-red-600" />}
            <div>
              <div className={`text-base font-bold ${lead.status === 2 ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}>
                Lead {lead.status === 2 ? 'DEAL' : 'LOST'}
              </div>
              {lead.status === 3 && lead.nama_alasan_lost && (
                <div className="text-sm text-neutral-600 dark:text-neutral-400 mt-0.5">Alasan: {lead.nama_alasan_lost}</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal Lost */}
      {showModalLost && (
        <ModalLost
          leadId={id}
          onClose={() => setShowModalLost(false)}
          onSaved={() => { setShowModalLost(false); fetchLead(); }}
        />
      )}
    </div>
  );
}
