"use client";

import { useState, useEffect, use } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  FiArrowLeft, FiPlus, FiTrash2, FiSearch, FiSave, FiInfo, FiPercent
} from "react-icons/fi";
import { useUIStore } from "@/store/ui.store";

export default function BaruPenawaranPage({ params }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast, setBreadcrumb } = useUIStore();
  const unwrappedParams = use(params);
  const leadId = unwrappedParams.id;
  const revisiId = searchParams.get("revisi"); // ID penawaran lama jika mode revisi

  const [lead, setLead] = useState(null);
  const [products, setProducts] = useState([]);
  const [branchPrices, setBranchPrices] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  // Form states
  const [items, setItems] = useState([]); // { produk_id, nama_produk, kode_produk, satuan, harga, qty, diskon_persen, diskon_nominal, subtotal }
  const [masaBerlaku, setMasaBerlaku] = useState(30);
  const [diskonPersen, setDiskonPersen] = useState(0);
  const [diskonNominal, setDiskonNominal] = useState(0);
  const [ppnPersen, setPpnPersen] = useState(11);
  const [dpPersen, setDpPersen] = useState(0);
  const [dpNominal, setDpNominal] = useState(0);
  const [catatan, setCatatan] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Product Selection States
  const [productSearch, setProductSearch] = useState("");
  const [showProductDropdown, setShowProductDropdown] = useState(false);

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // 1. Fetch Lead Details
        const resLead = await fetch(`/api/lead/${leadId}`);
        const jsonLead = await resLead.decode ? await resLead.decode() : await resLead.json();
        if (!jsonLead.success) {
          showToast("Lead tidak ditemukan.", "error");
          router.push("/lead");
          return;
        }
        const leadData = jsonLead.data;
        setLead(leadData);
        setBreadcrumb(String(leadId), leadData.nomor);

        // 2. Fetch Products
        const resProd = await fetch("/api/master/produk?limit=500&aktif=1");
        const jsonProd = await resProd.json();
        if (jsonProd.success) setProducts(jsonProd.data);

        // 3. Fetch Overridden Branch Prices
        const resPrices = await fetch(`/api/master/harga-produk?cabang_id=${leadData.cabang_id}&limit=500`);
        const jsonPrices = await resPrices.json();
        const priceMap = {};
        if (jsonPrices.success) {
          jsonPrices.data.forEach(hp => {
            priceMap[String(hp.produk_id)] = Number(hp.harga);
          });
        }
        setBranchPrices(priceMap);

        // 4. If Revision mode, fetch old quotation details
        if (revisiId) {
          const resQuot = await fetch(`/api/penawaran/${revisiId}`);
          const jsonQuot = await resQuot.json();
          if (jsonQuot.success) {
            const q = jsonQuot.data;
            setMasaBerlaku(q.masa_berlaku);
            setDiskonPersen(Number(q.diskon_persen));
            setDiskonNominal(Number(q.diskon_nominal));
            setPpnPersen(Number(q.ppn_persen));
            setDpPersen(Number(q.dp_persen));
            setDpNominal(Number(q.dp_nominal));
            setCatatan(q.catatan || "");
            
            // Map items
            const oldItems = q.details.map(d => ({
              produk_id: String(d.produk_id),
              nama_produk: d.nama_produk,
              kode_produk: d.kode_produk,
              satuan: d.satuan,
              harga: Number(d.harga),
              qty: Number(d.qty),
              diskon_persen: Number(d.diskon_persen),
              diskon_nominal: Number(d.diskon_nominal),
              subtotal: Number(d.subtotal),
            }));
            setItems(oldItems);
          }
        }
      } catch (err) {
        console.error(err);
        showToast("Gagal memuat data awal.", "error");
      } finally {
        setIsLoading(false);
      }
    };
    if (leadId) fetchData();
  }, [leadId, revisiId]);

  // Calculations
  const calculateItemSubtotal = (price, qty, discP, discN) => {
    const bruto = price * qty;
    let disc = discN;
    if (discP > 0) {
      disc = bruto * (discP / 100);
    }
    return bruto - disc;
  };

  const getTotals = () => {
    const subtotal = items.reduce((acc, item) => acc + item.subtotal, 0);
    let discHeader = diskonNominal;
    if (diskonPersen > 0) {
      discHeader = subtotal * (diskonPersen / 100);
    }
    const dpp = subtotal - discHeader;
    const ppn = dpp * (ppnPersen / 100);
    const grandTotal = dpp + ppn;
    
    let dp = dpNominal;
    if (dpPersen > 0) {
      dp = grandTotal * (dpPersen / 100);
    }

    return { subtotal, discHeader, ppn, grandTotal, dp };
  };

  const totals = getTotals();

  // Item management
  const handleAddProduct = (p) => {
    const pId = String(p.id);
    // Check if product already exists
    if (items.some(i => i.produk_id === pId)) {
      showToast("Produk sudah ada di daftar.", "warning");
      setShowProductDropdown(false);
      setProductSearch("");
      return;
    }

    // Resolve price
    const finalPrice = branchPrices[pId] !== undefined ? branchPrices[pId] : Number(p.harga_default);

    const newItem = {
      produk_id: pId,
      nama_produk: p.nama,
      kode_produk: p.kode,
      satuan: p.satuan,
      harga: finalPrice,
      qty: 1,
      diskon_persen: 0,
      diskon_nominal: 0,
      subtotal: finalPrice,
    };

    setItems([...items, newItem]);
    setProductSearch("");
    setShowProductDropdown(false);
  };

  const handleUpdateItem = (index, field, value) => {
    const updated = [...items];
    const item = updated[index];
    
    if (field === 'qty') item.qty = Math.max(1, Number(value));
    else if (field === 'diskon_persen') {
      item.diskon_persen = Math.min(100, Math.max(0, Number(value)));
      item.diskon_nominal = 0; // reset nominal if percent is updated
    } else if (field === 'diskon_nominal') {
      item.diskon_nominal = Math.max(0, Number(value));
      item.diskon_persen = 0; // reset percent if nominal is updated
    }

    item.subtotal = calculateItemSubtotal(item.harga, item.qty, item.diskon_persen, item.diskon_nominal);
    setItems(updated);
  };

  const handleRemoveItem = (index) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (items.length === 0) {
      showToast("Harap tambahkan minimal 1 produk.", "error");
      return;
    }
    setIsSubmitting(true);

    const payload = {
      masa_berlaku: Number(masaBerlaku),
      diskon_persen: Number(diskonPersen),
      diskon_nominal: Number(diskonNominal),
      ppn_persen: Number(ppnPersen),
      dp_persen: Number(dpPersen),
      dp_nominal: Number(dpNominal),
      catatan,
      items: items.map(i => ({
        produk_id: i.produk_id,
        qty: i.qty,
        diskon_persen: i.diskon_persen,
        diskon_nominal: i.diskon_nominal,
      })),
    };

    try {
      const endpoint = revisiId ? "/api/penawaran/revisi" : "/api/penawaran";
      const bodyPayload = revisiId ? { ...payload, versi_penawaran_id: revisiId } : { ...payload, lead_id: leadId };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyPayload),
      });

      const json = await res.json();
      if (json.success) {
        showToast(revisiId ? "Revisi penawaran berhasil dibuat!" : "Penawaran berhasil dibuat!", "success");
        router.push(`/lead/${leadId}`);
      } else {
        showToast(json.message || "Terjadi kesalahan.", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Terjadi kesalahan koneksi.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter products for dropdown
  const filteredProducts = products.filter(p => 
    p.nama.toLowerCase().includes(productSearch.toLowerCase()) || 
    p.kode.toLowerCase().includes(productSearch.toLowerCase())
  ).slice(0, 8);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link href={`/lead/${leadId}`} className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-neutral-600 hover:text-neutral-900 bg-white hover:bg-neutral-50 dark:bg-neutral-900 dark:text-neutral-400 dark:hover:text-white dark:hover:bg-neutral-800 rounded-xl transition-colors border border-neutral-200 dark:border-neutral-800 shadow-sm">
          <FiArrowLeft className="w-4 h-4" />
          Batal & Kembali
        </Link>
        <h2 className="text-lg font-bold text-neutral-900 dark:text-white">
          {revisiId ? "Buat Revisi Penawaran" : "Buat Penawaran Baru"}
        </h2>
      </div>

      {/* Lead info */}
      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/50 dark:border-neutral-800 shadow-sm p-5 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <span className="text-xs text-neutral-400 font-medium uppercase tracking-wide">Customer</span>
          <p className="text-sm font-semibold text-neutral-900 dark:text-white mt-0.5">{lead.customer?.nama}</p>
          <p className="text-xs text-neutral-500 mt-0.5">{lead.customer?.telepon}</p>
        </div>
        <div>
          <span className="text-xs text-neutral-400 font-medium uppercase tracking-wide">Cabang</span>
          <p className="text-sm font-semibold text-neutral-900 dark:text-white mt-0.5">{lead.cabang?.nama}</p>
          <p className="text-xs text-neutral-500 mt-0.5">Kode: {lead.cabang?.kode}</p>
        </div>
        <div>
          <span className="text-xs text-neutral-400 font-medium uppercase tracking-wide">Sales PIC</span>
          <p className="text-sm font-semibold text-neutral-900 dark:text-white mt-0.5">{lead.user?.nama}</p>
          <p className="text-xs text-neutral-500 mt-0.5">Nomor Lead: {lead.nomor}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left/Middle: Items & Product Select */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/50 dark:border-neutral-800 shadow-sm p-6 space-y-4">
            <h3 className="text-base font-bold text-neutral-900 dark:text-white mb-2">Item Penawaran</h3>
            
            {/* Product Autocomplete Dropdown */}
            <div className="relative">
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">Cari & Tambah Produk</label>
              <div className="relative">
                <FiSearch className="absolute left-3.5 top-3.5 text-neutral-400" />
                <input
                  type="text"
                  placeholder="Cari kode produk atau nama produk..."
                  value={productSearch}
                  onChange={(e) => {
                    setProductSearch(e.target.value);
                    setShowProductDropdown(true);
                  }}
                  onFocus={() => setShowProductDropdown(true)}
                  className="w-full pl-10 pr-4 py-2.5 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl outline-none text-sm dark:text-white focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                />
              </div>

              {showProductDropdown && productSearch && (
                <div className="absolute left-0 right-0 mt-2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-lg z-20 max-h-60 overflow-y-auto divide-y divide-neutral-100 dark:divide-neutral-800">
                  {filteredProducts.length === 0 ? (
                    <div className="p-3 text-sm text-neutral-500 text-center">Produk tidak ditemukan.</div>
                  ) : (
                    filteredProducts.map(p => {
                      const finalPrice = branchPrices[String(p.id)] !== undefined ? branchPrices[String(p.id)] : Number(p.harga_default);
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => handleAddProduct(p)}
                          className="w-full text-left p-3 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors flex items-center justify-between text-sm"
                        >
                          <div>
                            <span className="font-mono text-xs font-semibold bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.5 rounded text-neutral-600 dark:text-neutral-400 mr-2">{p.kode}</span>
                            <span className="font-medium text-neutral-800 dark:text-neutral-200">{p.nama}</span>
                          </div>
                          <div className="text-right">
                            <span className="font-bold text-orange-600 dark:text-orange-400">Rp {finalPrice.toLocaleString('id-ID')}</span>
                            <span className="text-xs text-neutral-400 ml-1">/{p.satuan}</span>
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              )}
            </div>

            {/* Selected Products Table/List */}
            <div className="space-y-3">
              {items.length === 0 ? (
                <div className="text-center py-10 border border-dashed border-neutral-200 dark:border-neutral-800 rounded-xl">
                  <FiInfo className="w-8 h-8 text-neutral-300 dark:text-neutral-700 mx-auto mb-2" />
                  <p className="text-sm text-neutral-500 font-medium">Belum ada item ditambahkan</p>
                  <p className="text-xs text-neutral-400 mt-0.5">Cari produk di atas untuk menambahkannya ke penawaran.</p>
                </div>
              ) : (
                items.map((item, index) => (
                  <div key={item.produk_id} className="p-4 border border-neutral-100 dark:border-neutral-800 rounded-xl bg-neutral-50/50 dark:bg-neutral-900/40 space-y-3 relative group">
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(index)}
                      className="absolute right-4 top-4 p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all opacity-0 group-hover:opacity-100"
                      title="Hapus Item"
                    >
                      <FiTrash2 className="w-4 h-4" />
                    </button>

                    <div className="pr-8">
                      <span className="font-mono text-[10px] font-bold bg-orange-100/50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400 px-1.5 py-0.5 rounded uppercase tracking-wide">{item.kode_produk}</span>
                      <h4 className="text-sm font-bold text-neutral-800 dark:text-neutral-200 mt-1">{item.nama_produk}</h4>
                      <p className="text-xs text-neutral-400 mt-0.5">Harga Satuan: Rp {item.harga.toLocaleString('id-ID')} / {item.satuan}</p>
                    </div>

                    <div className="grid grid-cols-3 gap-3 pt-2 items-center">
                      <div>
                        <label className="block text-[10px] font-semibold text-neutral-500 uppercase tracking-wider mb-1">Qty</label>
                        <input
                          type="number"
                          min="1"
                          value={item.qty}
                          onChange={(e) => handleUpdateItem(index, 'qty', e.target.value)}
                          className="w-full px-2 py-1 text-xs bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-md outline-none dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-neutral-500 uppercase tracking-wider mb-1">Disc (%)</label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={item.diskon_persen || ""}
                          placeholder="%"
                          onChange={(e) => handleUpdateItem(index, 'diskon_persen', e.target.value)}
                          className="w-full px-2 py-1 text-xs bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-md outline-none dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-neutral-500 uppercase tracking-wider mb-1">Disc (Rp)</label>
                        <input
                          type="number"
                          min="0"
                          value={item.diskon_nominal || ""}
                          placeholder="Rp"
                          onChange={(e) => handleUpdateItem(index, 'diskon_nominal', e.target.value)}
                          className="w-full px-2 py-1 text-xs bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-md outline-none dark:text-white"
                        />
                      </div>
                    </div>

                    <div className="flex justify-between items-center pt-2 border-t border-neutral-100 dark:border-neutral-800">
                      <span className="text-xs text-neutral-500">Subtotal Item</span>
                      <span className="text-sm font-bold text-neutral-950 dark:text-white">Rp {item.subtotal.toLocaleString('id-ID')}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right: Quotation Settings & Totals Summary */}
        <div className="space-y-6">
          {/* Settings */}
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/50 dark:border-neutral-800 shadow-sm p-6 space-y-4">
            <h3 className="text-base font-bold text-neutral-900 dark:text-white">Pengaturan Penawaran</h3>
            <div>
              <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">Masa Berlaku (Hari)</label>
              <input
                type="number"
                min="1"
                value={masaBerlaku}
                onChange={(e) => setMasaBerlaku(Number(e.target.value))}
                className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl outline-none dark:text-white text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">Catatan Tambahan</label>
              <textarea
                rows={3}
                value={catatan}
                onChange={(e) => setCatatan(e.target.value)}
                placeholder="Catatan penawaran, termin pembayaran, dll..."
                className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl outline-none dark:text-white text-sm resize-none"
              />
            </div>
          </div>

          {/* Discounts, PPN & DP */}
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/50 dark:border-neutral-800 shadow-sm p-6 space-y-4">
            <h3 className="text-base font-bold text-neutral-900 dark:text-white">Diskon, PPN & DP</h3>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">Disc Overall (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={diskonPersen || ""}
                  placeholder="%"
                  onChange={(e) => {
                    setDiskonPersen(Number(e.target.value));
                    setDiskonNominal(0);
                  }}
                  className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl outline-none dark:text-white text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">Disc Overall (Rp)</label>
                <input
                  type="number"
                  min="0"
                  value={diskonNominal || ""}
                  placeholder="Nominal"
                  onChange={(e) => {
                    setDiskonNominal(Number(e.target.value));
                    setDiskonPersen(0);
                  }}
                  className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl outline-none dark:text-white text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">PPN (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={ppnPersen}
                  onChange={(e) => setPpnPersen(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl outline-none dark:text-white text-sm"
                />
              </div>
              <div>
                {/* placeholder/blank for alignment */}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 border-t border-neutral-100 dark:border-neutral-800 pt-3">
              <div>
                <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">DP (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={dpPersen || ""}
                  placeholder="%"
                  onChange={(e) => {
                    setDpPersen(Number(e.target.value));
                    setDpNominal(0);
                  }}
                  className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl outline-none dark:text-white text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">DP (Rp)</label>
                <input
                  type="number"
                  min="0"
                  value={dpNominal || ""}
                  placeholder="Nominal"
                  onChange={(e) => {
                    setDpNominal(Number(e.target.value));
                    setDpPersen(0);
                  }}
                  className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl outline-none dark:text-white text-sm"
                />
              </div>
            </div>
          </div>

          {/* Summary Box */}
          <div className="bg-neutral-900 text-white rounded-2xl p-6 space-y-4 shadow-md">
            <h3 className="text-sm font-bold text-neutral-400 uppercase tracking-wide">Ringkasan Nilai</h3>
            
            <div className="space-y-2.5 text-sm">
              <div className="flex justify-between">
                <span className="text-neutral-400">Subtotal Item</span>
                <span className="font-medium">Rp {totals.subtotal.toLocaleString('id-ID')}</span>
              </div>
              
              {(diskonPersen > 0 || diskonNominal > 0) && (
                <div className="flex justify-between text-red-400">
                  <span>Diskon Overall</span>
                  <span>- Rp {totals.discHeader.toLocaleString('id-ID')}</span>
                </div>
              )}

              <div className="flex justify-between">
                <span className="text-neutral-400">PPN ({ppnPersen}%)</span>
                <span>Rp {totals.ppn.toLocaleString('id-ID')}</span>
              </div>
              
              <div className="border-t border-neutral-800 my-2 pt-3 flex justify-between items-baseline">
                <span className="text-sm text-neutral-400 font-bold">Grand Total</span>
                <span className="text-xl font-extrabold text-orange-500">Rp {totals.grandTotal.toLocaleString('id-ID')}</span>
              </div>

              {(dpPersen > 0 || dpNominal > 0) && (
                <div className="flex justify-between text-emerald-400 border-t border-dashed border-neutral-800 pt-2.5 mt-2">
                  <span>Info Pembayaran (DP)</span>
                  <span className="font-semibold">Rp {totals.dp.toLocaleString('id-ID')}</span>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-orange-600 hover:bg-orange-700 text-white py-3 rounded-xl font-bold transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-60 text-sm mt-4"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Menyimpan...</span>
                </>
              ) : (
                <>
                  <FiSave className="w-4 h-4" />
                  <span>Simpan Penawaran</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
