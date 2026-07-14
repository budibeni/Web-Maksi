"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  FiArrowLeft, FiSearch, FiUser, FiPhone, FiMapPin,
  FiCheckSquare, FiAlertCircle, FiChevronRight
} from "react-icons/fi";
import { useUIStore } from "@/store/ui.store";

// Modal Lost sederhana (inline)
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
      <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="p-5 border-b border-neutral-100 dark:border-neutral-800 flex items-center gap-3">
          <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-xl">
            <FiAlertCircle className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <h3 className="text-base font-bold text-neutral-900 dark:text-white">Tandai sebagai Lost</h3>
            <p className="text-xs text-neutral-500">Lead ini akan ditandai sebagai Lost.</p>
          </div>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Alasan Lost *</label>
            <select
              value={alasanId}
              onChange={(e) => setAlasanId(e.target.value)}
              className="w-full px-4 py-2.5 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all dark:text-white text-sm"
            >
              <option value="">Pilih alasan lost...</option>
              {alasanList.map(a => <option key={a.id} value={a.id}>{a.nama}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Catatan (Opsional)</label>
            <textarea
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
              rows={3}
              placeholder="Tulis catatan tambahan tentang alasan lost..."
              className="w-full px-4 py-2.5 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all dark:text-white text-sm resize-none"
            />
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

export default function LeadBaruPage() {
  const router = useRouter();
  const { showToast } = useUIStore();
  const searchRef = useRef(null);

  // Customer search
  const [namaCari, setNamaCari] = useState("");
  const [teleponCari, setTeleponCari] = useState("");
  const [customerResults, setCustomerResults] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [isSearching, setIsSearching] = useState(false);

  // Form fields
  const [namaCustomer, setNamaCustomer] = useState("");
  const [teleponCustomer, setTeleponCustomer] = useState("");
  const [alamatCustomer, setAlamatCustomer] = useState("");
  const [kebutuhan, setKebutuhan] = useState([]); // kategori_produk ids
  const [kategoriList, setKategoriList] = useState([]);
  const [hasilInteraksiList, setHasilInteraksiList] = useState([]);
  const [hasilInteraksiId, setHasilInteraksiId] = useState("");
  const [catatan, setCatatan] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  // Modal lost after create
  const [showModalLost, setShowModalLost] = useState(false);
  const [createdLeadId, setCreatedLeadId] = useState(null);

  useEffect(() => {
    // Load kategori produk & hasil interaksi
    Promise.all([
      fetch('/api/master/kategori-produk').then(r => r.json()),
      fetch('/api/master/hasil-interaksi').then(r => r.json()),
    ]).then(([kat, hi]) => {
      if (kat.success) setKategoriList(kat.data || []);
      if (hi.success) setHasilInteraksiList(hi.data || []);
    });
  }, []);

  // Search customer
  useEffect(() => {
    const q = namaCari || teleponCari;
    if (q.length < 2) { setCustomerResults([]); setShowDropdown(false); return; }
    setIsSearching(true);
    const t = setTimeout(async () => {
      const res = await fetch(`/api/customer/search?q=${encodeURIComponent(q)}`);
      const json = await res.json();
      if (json.success) {
        setCustomerResults(json.data || []);
        setShowDropdown(true);
      }
      setIsSearching(false);
    }, 400);
    return () => clearTimeout(t);
  }, [namaCari, teleponCari]);

  const selectCustomer = (c) => {
    setSelectedCustomer(c);
    setNamaCustomer(c.nama);
    setTeleponCustomer(c.telepon);
    setAlamatCustomer(c.alamat || "");
    setNamaCari(c.nama);
    setTeleponCari(c.telepon);
    setShowDropdown(false);
  };

  const clearCustomer = () => {
    setSelectedCustomer(null);
    setNamaCustomer("");
    setTeleponCustomer("");
    setAlamatCustomer("");
    setNamaCari("");
    setTeleponCari("");
  };

  const toggleKebutuhan = (id) => {
    setKebutuhan(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  // Pastikan hasil interaksi aktif yang memicu Lost ditandai
  const selectedHI = hasilInteraksiList.find(h => h.id === hasilInteraksiId);
  const isLostTrigger = selectedHI?.kode === 'TIDAK_MINAT' || selectedHI?.fase_lead === 'LOST';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!hasilInteraksiId) { showToast('Pilih hasil interaksi pertama.', 'error'); return; }
    const nama = namaCustomer || namaCari;
    const telepon = teleponCustomer || teleponCari;
    if (!nama) { showToast('Nama customer wajib diisi.', 'error'); return; }
    if (!telepon) { showToast('Nomor HP wajib diisi.', 'error'); return; }

    setIsSubmitting(true);
    try {
      const body = {
        customer_id: selectedCustomer ? String(selectedCustomer.id) : undefined,
        nama_customer: nama,
        telepon_customer: telepon,
        alamat_customer: alamatCustomer,
        kebutuhan: kebutuhan.map(String),
        hasil_interaksi_pertama_id: hasilInteraksiId,
        catatan_awal: catatan,
      };
      const res = await fetch('/api/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (json.success) {
        showToast('Lead berhasil dibuat!', 'success');
        const leadId = json.data.id;
        // Jika hasil interaksi memicu Lost langsung
        const hi = hasilInteraksiList.find(h => h.id === hasilInteraksiId);
        if (hi && (hi.kode === 'TIDAK_MINAT' || hi.kode === 'KOMPETITOR')) {
          setCreatedLeadId(leadId);
          setShowModalLost(true);
        } else {
          router.push(`/lead/${leadId}`);
        }
      } else {
        showToast(json.message || 'Terjadi kesalahan.', 'error');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const getFaseColor = (faseL) => {
    if (faseL === 'LEAD_BARU') return 'border-blue-400 bg-blue-50 dark:bg-blue-900/20';
    if (faseL === 'PENAWARAN') return 'border-purple-400 bg-purple-50 dark:bg-purple-900/20';
    return 'border-orange-400 bg-orange-50 dark:bg-orange-900/20';
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/lead" className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-neutral-600 hover:text-neutral-900 bg-white hover:bg-neutral-50 dark:bg-neutral-900 dark:text-neutral-400 dark:hover:text-white dark:hover:bg-neutral-800 rounded-xl transition-colors border border-neutral-200 dark:border-neutral-800 shadow-sm">
          <FiArrowLeft className="w-4 h-4" />
          Kembali
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Section 1: Informasi Customer */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/50 dark:border-neutral-800 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-neutral-100 dark:border-neutral-800 flex items-center gap-3">
            <div className="w-7 h-7 rounded-full bg-orange-600 text-white text-xs font-bold flex items-center justify-center">1</div>
            <h2 className="text-base font-bold text-neutral-900 dark:text-white">Informasi Customer</h2>
          </div>
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Nama Customer */}
              <div className="relative">
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Nama Customer / Perusahaan *</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiSearch className="text-neutral-400 w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    className="w-full pl-9 pr-3 py-2.5 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all dark:text-white text-sm"
                    placeholder="Ketik nama customer atau perusahaan..."
                    value={namaCari}
                    onChange={(e) => { setNamaCari(e.target.value); setNamaCustomer(e.target.value); if (selectedCustomer) clearCustomer(); }}
                  />
                </div>

                {/* Dropdown hasil pencarian */}
                {showDropdown && customerResults.length > 0 && (
                  <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl shadow-lg overflow-hidden">
                    {customerResults.map(c => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => selectCustomer(c)}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-left transition-colors"
                      >
                        <div className="w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-900/40 flex items-center justify-center flex-shrink-0">
                          <FiUser className="w-4 h-4 text-orange-600" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-neutral-900 dark:text-white truncate">{c.nama}</div>
                          <div className="text-xs text-neutral-500">{c.telepon}</div>
                        </div>
                        <div className="ml-auto text-xs text-green-600 bg-green-50 dark:bg-green-900/20 px-2 py-0.5 rounded-full">Existing</div>
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => { setShowDropdown(false); setSelectedCustomer(null); }}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-left transition-colors border-t border-neutral-100 dark:border-neutral-800"
                    >
                      <div className="w-8 h-8 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center flex-shrink-0">
                        <FiUser className="w-4 h-4 text-neutral-500" />
                      </div>
                      <div className="text-sm text-neutral-600 dark:text-neutral-400">
                        + Buat customer baru &ldquo;<strong>{namaCari}</strong>&rdquo;
                      </div>
                    </button>
                  </div>
                )}
              </div>

              {/* Telepon */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">No. HP *</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiPhone className="text-neutral-400 w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    className="w-full pl-9 pr-3 py-2.5 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all dark:text-white text-sm"
                    placeholder="Ketik atau pilih no. HP..."
                    value={teleponCari}
                    onChange={(e) => { setTeleponCari(e.target.value); setTeleponCustomer(e.target.value); if (selectedCustomer) clearCustomer(); }}
                  />
                </div>
              </div>
            </div>

            {/* Customer existing banner */}
            {selectedCustomer && (
              <div className="rounded-xl border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  <span className="text-sm font-semibold text-green-700 dark:text-green-400">Customer Existing</span>
                  <Link href={`/customer/${selectedCustomer.id}`} className="ml-auto text-xs text-green-600 dark:text-green-400 hover:underline flex items-center gap-1">
                    Lihat Detail <FiChevronRight className="w-3 h-3" />
                  </Link>
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs text-neutral-600 dark:text-neutral-400">
                  <div><span className="font-medium">Lead Sebelumnya:</span> {selectedCustomer.leads?.length || 0}</div>
                  <div><span className="font-medium">Total Deal:</span> {selectedCustomer.leads?.filter(l => l.status === 2).length || 0}</div>
                  <div><span className="font-medium">Lead Aktif:</span> {selectedCustomer.leads?.filter(l => l.status === 1).length || 0}</div>
                  <div><span className="font-medium">Total Lost:</span> {selectedCustomer.leads?.filter(l => l.status === 3).length || 0}</div>
                </div>
              </div>
            )}

            {/* PIC & Alamat */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Alamat (Opsional)</label>
              <div className="relative">
                <div className="absolute top-2.5 left-3 pointer-events-none">
                  <FiMapPin className="text-neutral-400 w-4 h-4" />
                </div>
                <textarea
                  rows={2}
                  className="w-full pl-9 pr-3 py-2.5 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all dark:text-white text-sm resize-none"
                  placeholder="Alamat lengkap customer"
                  value={alamatCustomer}
                  onChange={(e) => setAlamatCustomer(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Kebutuhan */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/50 dark:border-neutral-800 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-neutral-100 dark:border-neutral-800 flex items-center gap-3">
            <div className="w-7 h-7 rounded-full bg-orange-600 text-white text-xs font-bold flex items-center justify-center">2</div>
            <h2 className="text-base font-bold text-neutral-900 dark:text-white">Kebutuhan <span className="text-sm font-normal text-neutral-400">(pilih salah satu atau lebih)</span></h2>
          </div>
          <div className="p-6">
            <div className="flex flex-wrap gap-3">
              {kategoriList.map(kat => (
                <button
                  key={kat.id}
                  type="button"
                  onClick={() => toggleKebutuhan(String(kat.id))}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 text-sm font-medium transition-all ${
                    kebutuhan.includes(String(kat.id))
                      ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400'
                      : 'border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-950 text-neutral-700 dark:text-neutral-300 hover:border-neutral-300'
                  }`}
                >
                  <FiCheckSquare className={`w-4 h-4 ${kebutuhan.includes(String(kat.id)) ? 'text-orange-500' : 'text-neutral-400'}`} />
                  {kat.nama}
                </button>
              ))}
              {kategoriList.length === 0 && <p className="text-sm text-neutral-400 italic">Belum ada kategori produk.</p>}
            </div>
          </div>
        </div>

        {/* Section 3: Hasil Interaksi Pertama */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/50 dark:border-neutral-800 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-neutral-100 dark:border-neutral-800 flex items-center gap-3">
            <div className="w-7 h-7 rounded-full bg-orange-600 text-white text-xs font-bold flex items-center justify-center">3</div>
            <h2 className="text-base font-bold text-neutral-900 dark:text-white">Hasil Interaksi Pertama *</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {hasilInteraksiList.map(hi => (
                <label
                  key={hi.id}
                  className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    hasilInteraksiId === hi.id
                      ? `border-2 ${getFaseColor(hi.fase_lead)}`
                      : 'border-neutral-200 dark:border-neutral-700 hover:border-neutral-300 dark:hover:border-neutral-600'
                  }`}
                  onClick={() => setHasilInteraksiId(hi.id)}
                >
                  <input type="radio" name="hasil_interaksi" value={hi.id} checked={hasilInteraksiId === hi.id} onChange={() => setHasilInteraksiId(hi.id)} className="mt-0.5" />
                  <div>
                    <div className="text-sm font-semibold text-neutral-900 dark:text-white">{hi.nama}</div>
                    <div className="text-xs text-neutral-500 mt-0.5">→ Fase: {hi.fase_lead?.replace('_', ' ')}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Section 4: Catatan */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/50 dark:border-neutral-800 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-neutral-100 dark:border-neutral-800 flex items-center gap-3">
            <div className="w-7 h-7 rounded-full bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 text-xs font-bold flex items-center justify-center">4</div>
            <h2 className="text-base font-bold text-neutral-900 dark:text-white">Catatan <span className="text-sm font-normal text-neutral-400">(Opsional)</span></h2>
          </div>
          <div className="p-6">
            <textarea
              rows={4}
              className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all dark:text-white text-sm resize-none"
              placeholder="Tulis catatan tentang kebutuhan customer, produk yang ditanyakan, atau hal penting lainnya..."
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
              maxLength={500}
            />
            <div className="text-xs text-neutral-400 text-right mt-1">{catatan.length}/500</div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pb-6">
          <Link href="/lead" className="px-5 py-2.5 text-sm font-medium rounded-xl border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors text-neutral-700 dark:text-neutral-300">
            Batal
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2.5 text-sm font-medium rounded-xl bg-orange-600 hover:bg-orange-700 text-white transition-colors shadow-sm disabled:opacity-60 flex items-center gap-2"
          >
            {isSubmitting ? (
              <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> Menyimpan...</>
            ) : 'Simpan Lead'}
          </button>
        </div>
      </form>

      {/* Modal Lost */}
      {showModalLost && createdLeadId && (
        <ModalLost
          leadId={createdLeadId}
          onClose={() => { setShowModalLost(false); router.push('/lead'); }}
          onSaved={() => { setShowModalLost(false); router.push('/lead'); }}
        />
      )}
    </div>
  );
}
