"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createPortal } from "react-dom";
import {
  FiArrowLeft, FiSearch, FiUser, FiPhone, FiMapPin,
  FiCheckSquare, FiAlertCircle, FiChevronRight, FiCheck,
  FiMessageCircle, FiFileText, FiXCircle, FiInfo,
  FiCheckCircle, FiPlayCircle, FiRefreshCw, FiClock
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
  const submitBtnRef = useRef(null);
  const dropdownRefNama = useRef(null);
  const dropdownRefTelepon = useRef(null);

  const [mounted, setMounted] = useState(false);

  // Customer search
  const [namaCari, setNamaCari] = useState("");
  const [teleponCari, setTeleponCari] = useState("");
  const [customerResults, setCustomerResults] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [activeSearchField, setActiveSearchField] = useState(null); // "nama" | "telepon" | null
  const [showDropdown, setShowDropdown] = useState(false);

  // Form fields
  const [namaCustomer, setNamaCustomer] = useState("");
  const [teleponCustomer, setTeleponCustomer] = useState("");
  const [alamatCustomer, setAlamatCustomer] = useState("");
  const [kategori, setKategori] = useState([]);       // ID kategori produk yang dipilih
  const [kategoriList, setKategoriList] = useState([]);
  const [kebutuhan, setKebutuhan] = useState([]);     // ID kebutuhan dari master kebutuhan
  const [kebutuhanList, setKebutuhanList] = useState([]);
  const [hasilInteraksiList, setHasilInteraksiList] = useState([]);
  const [hasilInteraksiId, setHasilInteraksiId] = useState("");
  const [catatan, setCatatan] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modal lost after create
  const [showModalLost, setShowModalLost] = useState(false);
  const [createdLeadId, setCreatedLeadId] = useState(null);

  useEffect(() => {
    setMounted(true);
    // Load kategori produk, kebutuhan master & hasil interaksi dari DB
    Promise.all([
      fetch('/api/master/kategori-produk').then(r => r.json()),
      fetch('/api/master/kebutuhan?aktif=1').then(r => r.json()),
      fetch('/api/master/hasil-interaksi?aktif=1&fase=LEAD_BARU').then(r => r.json()),
    ]).then(([kat, keb, hi]) => {
      if (kat.success) setKategoriList(kat.data || []);
      if (keb.success) setKebutuhanList(keb.data || []);
      if (hi.success) setHasilInteraksiList(hi.data || []);
    });

    // Close dropdown on click outside
    const handleClickOutside = (e) => {
      if (
        dropdownRefNama.current && !dropdownRefNama.current.contains(e.target) &&
        dropdownRefTelepon.current && !dropdownRefTelepon.current.contains(e.target)
      ) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Autocomplete search
  useEffect(() => {
    const q = activeSearchField === "nama" ? namaCari : teleponCari;
    if (!activeSearchField || q.length < 2) {
      setCustomerResults([]);
      setShowDropdown(false);
      return;
    }
    setIsSearching(true);
    const t = setTimeout(async () => {
      const res = await fetch(`/api/customer/search?q=${encodeURIComponent(q)}`);
      const json = await res.json();
      if (json.success) {
        setCustomerResults(json.data || []);
        setShowDropdown(true);
      }
      setIsSearching(false);
    }, 300);
    return () => clearTimeout(t);
  }, [namaCari, teleponCari, activeSearchField]);

  const selectCustomer = (c) => {
    setSelectedCustomer(c);
    setNamaCustomer(c.nama);
    setNamaCari(c.nama);
    setTeleponCustomer(c.telepon);
    setTeleponCari(c.telepon);
    setAlamatCustomer(c.alamat || "");
    setShowDropdown(false);
    setActiveSearchField(null);
  };

  const clearCustomer = () => {
    setSelectedCustomer(null);
    setNamaCustomer("");
    setTeleponCustomer("");
    setAlamatCustomer("");
    setNamaCari("");
    setTeleponCari("");
    setShowDropdown(false);
    setActiveSearchField(null);
  };

  const toggleKategori = (id) => {
    setKategori(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const toggleKebutuhan = (id) => {
    setKebutuhan(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const nama = namaCustomer || namaCari;
    const telepon = teleponCustomer || teleponCari;
    if (!nama) { showToast('Nama customer wajib diisi.', 'error'); return; }
    if (!telepon) { showToast('Nomor HP wajib diisi.', 'error'); return; }
    if (kategori.length === 0) { showToast('Kategori produk wajib dipilih minimal 1.', 'error'); return; }
    if (kebutuhan.length === 0) { showToast('Kebutuhan wajib dipilih minimal 1.', 'error'); return; }
    if (!hasilInteraksiId) { showToast('Pilih hasil interaksi pertama.', 'error'); return; }

    setIsSubmitting(true);
    try {
      const body = {
        customer_id: selectedCustomer ? String(selectedCustomer.id) : undefined,
        nama_customer: nama,
        telepon_customer: telepon,
        alamat_customer: alamatCustomer,
        kategori: kategori.map(String),
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

        // Cek apakah hasil interaksi yang dipilih memicu LOST (TIDAK_TERTARIK atau STOCK_TIDAK_ADA)
        const selectedHI = hasilInteraksiList.find(h => String(h.id) === String(hasilInteraksiId));
        if (selectedHI && (selectedHI.kode === 'TIDAK_TERTARIK' || selectedHI.kode === 'STOCK_TIDAK_ADA')) {
          setCreatedLeadId(leadId);
          setShowModalLost(true);
        } else {
          router.push('/lead');
        }
      } else {
        showToast(json.message || 'Terjadi kesalahan.', 'error');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper untuk styling warna kartu hasil interaksi berdasarkan kode/fase dari database
  const getHIColor = (hi, isSelected) => {
    const warna = hi.warna || 'orange';
    if (isSelected) {
      if (warna === 'red') {
        return 'border-red-500 bg-red-50/50 dark:bg-red-950/20 text-red-900 dark:text-red-400';
      }
      if (warna === 'blue') {
        return 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/20 text-blue-900 dark:text-blue-400';
      }
      if (warna === 'purple') {
        return 'border-purple-500 bg-purple-50/50 dark:bg-purple-950/20 text-purple-900 dark:text-purple-400';
      }
      if (warna === 'green') {
        return 'border-green-500 bg-green-50/50 dark:bg-green-950/20 text-green-900 dark:text-green-400';
      }
      if (warna === 'yellow') {
        return 'border-yellow-500 bg-yellow-50/50 dark:bg-yellow-950/20 text-yellow-900 dark:text-yellow-400';
      }
      if (warna === 'gray') {
        return 'border-neutral-500 bg-neutral-50/50 dark:bg-neutral-950/20 text-neutral-900 dark:text-neutral-400';
      }
      return 'border-orange-500 bg-orange-50/50 dark:bg-orange-950/20 text-orange-900 dark:text-orange-400';
    }
    return 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 bg-white dark:bg-neutral-900/50';
  };

  const getHIIconColor = (hi, isSelected) => {
    const warna = hi.warna || 'orange';
    if (isSelected) {
      if (warna === 'red') return 'text-red-500 bg-red-100 dark:bg-red-900/30';
      if (warna === 'blue') return 'text-blue-500 bg-blue-100 dark:bg-blue-900/30';
      if (warna === 'purple') return 'text-purple-500 bg-purple-100 dark:bg-purple-900/30';
      if (warna === 'green') return 'text-green-500 bg-green-100 dark:bg-green-900/30';
      if (warna === 'yellow') return 'text-yellow-500 bg-yellow-100 dark:bg-yellow-900/30';
      if (warna === 'gray') return 'text-neutral-500 bg-neutral-100 dark:bg-neutral-800';
      return 'text-orange-500 bg-orange-100 dark:bg-orange-900/30';
    }
    return 'text-neutral-400 bg-neutral-100 dark:bg-neutral-800';
  };

  return (
    <div className="w-full">
      {/* Header Actions Portal */}
      {mounted && document.getElementById("header-actions-portal") && createPortal(
        <>
          <button
            onClick={() => submitBtnRef.current?.click()}
            disabled={isSubmitting}
            className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-1.5 rounded-full font-semibold flex items-center gap-2 transition-colors shadow-sm text-sm mr-2"
          >
            {isSubmitting ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Menyimpan...</span>
              </>
            ) : (
              <span>Simpan Lead</span>
            )}
          </button>
          <Link
            href="/lead"
            className="px-4 py-1.5 text-sm font-semibold rounded-full bg-white hover:bg-neutral-100 dark:bg-neutral-900 dark:hover:bg-neutral-800 border border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 transition-colors"
          >
            Batal
          </Link>
        </>,
        document.getElementById("header-actions-portal")
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Hidden Submit Button to support HTML5 validation */}
        <button type="submit" ref={submitBtnRef} className="hidden" />

        {/* Responsive 2-Column Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* LEFT COLUMN: Info Customer, Kebutuhan, Catatan */}
          <div className="space-y-6">
            {/* Card 1: Info Customer */}
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/50 dark:border-neutral-800 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-neutral-100 dark:border-neutral-800 flex items-center gap-3">
                <div className="w-7 h-7 rounded-full bg-orange-600 text-white text-xs font-bold flex items-center justify-center">1</div>
                <h2 className="text-base font-bold text-neutral-900 dark:text-white">Informasi Customer</h2>
              </div>
              <div className="p-6 space-y-4">
                {/* Row 1: Nama + No HP */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Nama Customer */}
                  <div className="relative" ref={dropdownRefNama}>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Nama Customer<span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      className="w-full px-4 py-2.5 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all dark:text-white text-sm"
                      placeholder="Ketik nama customer..."
                      value={namaCari}
                      onChange={(e) => {
                        setNamaCari(e.target.value);
                        setNamaCustomer(e.target.value);
                        setActiveSearchField("nama");
                        if (selectedCustomer) clearCustomer();
                      }}
                      onFocus={() => {
                        setActiveSearchField("nama");
                        if (namaCari.length >= 2) setShowDropdown(true);
                      }}
                    />
                    {/* Dropdown hasil pencarian berdasarkan Nama */}
                    {showDropdown && activeSearchField === "nama" && customerResults.length > 0 && (
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
                            <div className="min-w-0 flex-1">
                              <div className="text-sm font-medium text-neutral-900 dark:text-white truncate">{c.nama}</div>
                              <div className="text-xs text-neutral-500">{c.telepon} {c.alamat ? `· ${c.alamat}` : ''}</div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* No HP */}
                  <div className="relative" ref={dropdownRefTelepon}>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">No. HP <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      className="w-full px-4 py-2.5 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all dark:text-white text-sm"
                      placeholder="Ketik atau pilih no. HP..."
                      value={teleponCari}
                      onChange={(e) => {
                        setTeleponCari(e.target.value);
                        setTeleponCustomer(e.target.value);
                        setActiveSearchField("telepon");
                        if (selectedCustomer) clearCustomer();
                      }}
                      onFocus={() => {
                        setActiveSearchField("telepon");
                        if (teleponCari.length >= 2) setShowDropdown(true);
                      }}
                    />
                    {/* Dropdown hasil pencarian berdasarkan No HP */}
                    {showDropdown && activeSearchField === "telepon" && customerResults.length > 0 && (
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
                            <div className="min-w-0 flex-1">
                              <div className="text-sm font-medium text-neutral-900 dark:text-white truncate">{c.nama}</div>
                              <div className="text-xs text-neutral-500">{c.telepon} {c.alamat ? `· ${c.alamat}` : ''}</div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Row 2: Alamat */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Alamat (Opsional)</label>
                  <textarea
                    rows={3}
                    className="w-full px-4 py-2.5 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all dark:text-white text-sm resize-none"
                    placeholder="Alamat lengkap customer"
                    value={alamatCustomer}
                    onChange={(e) => setAlamatCustomer(e.target.value)}
                  />
                </div>

                {/* Customer existing banner */}
                {selectedCustomer && (
                  <div className="rounded-xl border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                        <FiCheck className="w-3 h-3 text-white" />
                      </div>
                      <span className="text-sm font-bold text-green-700 dark:text-green-400">Customer Existing</span>
                      <Link href={`/customer/${selectedCustomer.id}`} className="ml-auto text-xs text-orange-600 dark:text-orange-400 hover:underline flex items-center gap-1 font-medium">
                        Lihat Detail Customer <FiChevronRight className="w-3 h-3" />
                      </Link>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      <div className="text-center">
                        <div className="text-xs text-neutral-500 dark:text-neutral-400">Lead Sebelumnya</div>
                        <div className="text-lg font-bold text-neutral-900 dark:text-white">{selectedCustomer.leads?.length || 0}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs text-neutral-500 dark:text-neutral-400">Total Deal</div>
                        <div className="text-lg font-bold text-neutral-900 dark:text-white">{selectedCustomer.leads?.filter(l => l.status === 2).length || 0}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs text-neutral-500 dark:text-neutral-400">Lead Aktif</div>
                        <div className="text-lg font-bold text-neutral-900 dark:text-white">{selectedCustomer.leads?.filter(l => l.status === 1).length || 0}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs text-neutral-500 dark:text-neutral-400">Total Lost</div>
                        <div className="text-lg font-bold text-neutral-900 dark:text-white">{selectedCustomer.leads?.filter(l => l.status === 3).length || 0}</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Card 3: Kebutuhan */}
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/50 dark:border-neutral-800 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-neutral-100 dark:border-neutral-800 flex items-center gap-3">
                <div className="w-7 h-7 rounded-full bg-orange-600 text-white text-xs font-bold flex items-center justify-center">3</div>
                <h2 className="text-base font-bold text-neutral-900 dark:text-white">Kebutuhan <span className="text-sm font-normal text-neutral-400">(Pilih salah satu atau lebih)</span> <span className="text-red-500">*</span></h2>
              </div>
              <div className="p-6">
                <div className="flex flex-wrap gap-2">
                  {kebutuhanList.map(keb => {
                    const isSelected = kebutuhan.includes(String(keb.id));
                    return (
                      <label
                        key={keb.id}
                        className={`relative flex items-center gap-2.5 px-3.5 py-2 rounded-xl border-2 cursor-pointer transition-all select-none ${
                          isSelected
                            ? 'border-orange-500 bg-orange-50/50 dark:bg-orange-950/20'
                            : 'border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/50 hover:border-neutral-300 dark:hover:border-neutral-700'
                        }`}
                        onClick={() => toggleKebutuhan(String(keb.id))}
                      >
                        <div className={`w-4 h-4 rounded flex items-center justify-center flex-shrink-0 transition-all ${
                          isSelected ? 'bg-orange-500 border-orange-500' : 'border-2 border-neutral-300 dark:border-neutral-600'
                        }`}>
                          {isSelected && <FiCheck className="w-2.5 h-2.5 text-white" />}
                        </div>
                        <span className={`text-sm font-semibold ${isSelected ? 'text-orange-900 dark:text-orange-400' : 'text-neutral-700 dark:text-neutral-300'}`}>{keb.nama}</span>
                      </label>
                    );
                  })}
                  {kebutuhanList.length === 0 && <p className="text-sm text-neutral-400 italic">Belum ada data kebutuhan.</p>}
                </div>
              </div>
            </div>

            {/* Card 5: Catatan */}
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/50 dark:border-neutral-800 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-neutral-100 dark:border-neutral-800 flex items-center gap-3">
                <div className="w-7 h-7 rounded-full bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 text-xs font-bold flex items-center justify-center">5</div>
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
          </div>

          {/* RIGHT COLUMN: Hasil Interaksi, Kategori */}
          <div className="space-y-6">
            {/* Card 2: Hasil Interaksi */}
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/50 dark:border-neutral-800 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-neutral-100 dark:border-neutral-800 flex items-center gap-3">
                <div className="w-7 h-7 rounded-full bg-orange-600 text-white text-xs font-bold flex items-center justify-center">2</div>
                <h2 className="text-base font-bold text-neutral-900 dark:text-white">Hasil Interaksi Pertama <span className="text-red-500">*</span></h2>
              </div>
              <div className="p-6">
                {hasilInteraksiList.length === 0 ? (
                  <div className="flex items-center gap-2 text-sm text-neutral-400 italic p-4 bg-neutral-50 dark:bg-neutral-950 rounded-xl">
                    <FiInfo className="w-4 h-4" />
                    Belum ada data master hasil interaksi.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {hasilInteraksiList.map(hi => {
                      const isSelected = String(hasilInteraksiId) === String(hi.id);

                      // Tentukan icon yang sesuai
                      let IconComponent = FiMessageCircle;
                      if (hi.kode === 'MINTA_PENAWARAN' || hi.kode === 'MINTA_REVISI_PENAWARAN') IconComponent = FiFileText;
                      if (hi.kode === 'TIDAK_TERTARIK' || hi.kode === 'STOCK_TIDAK_ADA' || hi.kode === 'TIDAK_TERTARIK_LAGI' || hi.kode === 'SULIT_DIHUBUNGI') IconComponent = FiXCircle;
                      if (hi.kode === 'TERTARIK' || hi.kode === 'MASIH_TERTARIK') IconComponent = FiCheckCircle;
                      if (hi.kode === 'MINTA_DEMO') IconComponent = FiPlayCircle;
                      if (hi.kode === 'MINTA_FOLLOW_UP' || hi.kode === 'MINTA_FOLLOW_UP_LAGI') IconComponent = FiRefreshCw;
                      if (hi.kode === 'BELUM_MEMUTUSKAN' || hi.kode === 'MENUNGGU_KEPUTUSAN' || hi.kode === 'MENUNGGU_ANGGARAN' || hi.kode === 'MENUNGGU_STOK') IconComponent = FiClock;

                      return (
                        <label
                          key={hi.id}
                          className={`relative flex items-center gap-2.5 p-2.5 rounded-xl border-2 cursor-pointer transition-all ${getHIColor(hi, isSelected)}`}
                          onClick={() => setHasilInteraksiId(hi.id)}
                        >
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${getHIIconColor(hi, isSelected)}`}>
                            <IconComponent className="w-4 h-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className={`text-sm font-bold leading-snug ${isSelected ? 'text-neutral-900 dark:text-white' : 'text-neutral-800 dark:text-neutral-200'}`}>{hi.nama}</div>
                          </div>
                          <input
                            type="radio"
                            name="hasil_interaksi"
                            value={hi.id}
                            checked={isSelected}
                            onChange={() => setHasilInteraksiId(hi.id)}
                            className="w-4 h-4 text-orange-600 border-neutral-300 focus:ring-orange-500"
                          />
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Card 4: Kategori Produk */}
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/50 dark:border-neutral-800 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-neutral-100 dark:border-neutral-800 flex items-center gap-3">
                <div className="w-7 h-7 rounded-full bg-orange-600 text-white text-xs font-bold flex items-center justify-center">4</div>
                <h2 className="text-base font-bold text-neutral-900 dark:text-white">Kategori Produk <span className="text-sm font-normal text-neutral-400">(Pilih salah satu atau lebih)</span> <span className="text-red-500">*</span></h2>
              </div>
              <div className="p-6">
                <div className="flex flex-wrap gap-2">
                  {kategoriList.map(kat => {
                    const isSelected = kategori.includes(String(kat.id));
                    return (
                      <label
                        key={kat.id}
                        className={`relative flex items-center gap-2.5 px-3.5 py-2 rounded-xl border-2 cursor-pointer transition-all select-none ${
                          isSelected
                            ? 'border-orange-500 bg-orange-50/50 dark:bg-orange-950/20'
                            : 'border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/50 hover:border-neutral-300 dark:hover:border-neutral-700'
                        }`}
                        onClick={() => toggleKategori(String(kat.id))}
                      >
                        <div className={`w-4 h-4 rounded flex items-center justify-center flex-shrink-0 transition-all ${
                          isSelected ? 'bg-orange-500 border-orange-500' : 'border-2 border-neutral-300 dark:border-neutral-600'
                        }`}>
                          {isSelected && <FiCheck className="w-2.5 h-2.5 text-white" />}
                        </div>
                        <span className={`text-sm font-semibold ${isSelected ? 'text-orange-900 dark:text-orange-400' : 'text-neutral-700 dark:text-neutral-300'}`}>{kat.nama}</span>
                      </label>
                    );
                  })}
                  {kategoriList.length === 0 && <p className="text-sm text-neutral-400 italic">Belum ada kategori produk.</p>}
                </div>
              </div>
            </div>
          </div>

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
