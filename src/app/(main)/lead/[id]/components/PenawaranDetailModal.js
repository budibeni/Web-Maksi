"use client";

import { useEffect, useState, useRef } from "react";
import { FiX, FiPrinter } from "react-icons/fi";
import dayjs from "dayjs";
import 'dayjs/locale/id';

dayjs.locale('id');

export default function PenawaranDetailModal({ quotationId, onClose }) {
  const [quotation, setQuotation] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const printRef = useRef(null);

  useEffect(() => {
    const fetchQuotation = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/penawaran/${quotationId}`);
        const json = await res.json();
        if (json.success) {
          setQuotation(json.data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    if (quotationId) fetchQuotation();
  }, [quotationId]);

  const handlePrint = () => {
    // We can use a print stylesheet trick or window.print()
    const originalTitle = document.title;
    if (quotation) {
      document.title = `Penawaran_${quotation.nomor}_v${quotation.versi}`;
    }
    window.print();
    document.title = originalTitle;
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/60 backdrop-blur-sm print:hidden">
        <div className="bg-white dark:bg-neutral-900 rounded-2xl p-6 shadow-xl flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm font-medium text-neutral-600 dark:text-neutral-300">Memuat detail penawaran...</span>
        </div>
      </div>
    );
  }

  if (!quotation) return null;

  const lead = quotation.lead;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 sm:p-6 bg-neutral-900/60 backdrop-blur-sm print:bg-white print:p-0 print:absolute print:inset-0">
      {/* Modal Card */}
      <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-xl w-full max-w-4xl overflow-hidden my-4 print:my-0 print:shadow-none print:rounded-none dark:print:bg-white">
        
        {/* Actions Header (hidden on print) */}
        <div className="px-6 py-4 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between bg-neutral-50 dark:bg-neutral-900/50 print:hidden">
          <h3 className="text-sm font-bold text-neutral-800 dark:text-white">Detail Penawaran: {quotation.nomor} (v{quotation.versi})</h3>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-1.5 rounded-xl font-semibold flex items-center gap-2 transition-colors text-xs shadow-sm"
            >
              <FiPrinter className="w-4 h-4" />
              Cetak / PDF
            </button>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-neutral-200 dark:hover:bg-neutral-800 text-neutral-500 hover:text-neutral-800 dark:hover:text-white rounded-lg transition-colors"
            >
              <FiX className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Content wrapper */}
        <div ref={printRef} className="p-8 sm:p-10 space-y-6 text-neutral-800 dark:text-neutral-200 print:text-black print:bg-white dark:print:text-black">
          
          {/* Print Header styling block */}
          <style dangerouslySetInnerHTML={{__html: `
            @media print {
              body * {
                visibility: hidden;
              }
              .print-container, .print-container * {
                visibility: visible;
              }
              .print-container {
                position: absolute;
                left: 0;
                top: 0;
                width: 100%;
                background: white !important;
                color: black !important;
                padding: 20px !important;
              }
              .print-hidden {
                display: none !important;
              }
            }
          `}} />

          <div className="print-container space-y-6">
            
            {/* Header / Letterhead */}
            <div className="flex justify-between items-start border-b-2 border-neutral-800 pb-4">
              <div>
                <h1 className="text-xl font-extrabold text-orange-600 print:text-orange-600">MAKSINDO</h1>
                <p className="text-xs text-neutral-500 print:text-neutral-500 mt-1 leading-relaxed">
                  Pusat Mesin Usaha & Pertanian Indonesia<br />
                  Website: www.tokomesin.com<br />
                  Cabang: {quotation.cabang_nama}
                </p>
              </div>
              <div className="text-right">
                <h2 className="text-base font-black text-neutral-900 print:text-black uppercase tracking-wide">Surat Penawaran Harga</h2>
                <div className="text-xs text-neutral-600 print:text-neutral-600 mt-2 space-y-1">
                  <div><strong>No Penawaran:</strong> {quotation.nomor}</div>
                  <div><strong>Versi:</strong> {quotation.versi}</div>
                  <div><strong>Tanggal:</strong> {dayjs(quotation.dibuat_tanggal).format('DD MMMM YYYY')}</div>
                  <div><strong>Masa Berlaku:</strong> {quotation.masa_berlaku} Hari</div>
                </div>
              </div>
            </div>

            {/* Information Panels */}
            <div className="grid grid-cols-2 gap-6 text-xs">
              <div className="space-y-1.5 p-4 bg-neutral-50 dark:bg-neutral-900/50 print:bg-neutral-50 border rounded-xl">
                <h4 className="font-bold text-neutral-900 print:text-black uppercase tracking-wider text-[10px] border-b pb-1 mb-2">Kepada Customer:</h4>
                <div><strong>Nama:</strong> {quotation.customer_nama}</div>
                {quotation.customer_telepon && <div><strong>Telepon:</strong> {quotation.customer_telepon}</div>}
                {quotation.customer_alamat && <div><strong>Alamat:</strong> {quotation.customer_alamat}</div>}
              </div>
              <div className="space-y-1.5 p-4 bg-neutral-50 dark:bg-neutral-900/50 print:bg-neutral-50 border rounded-xl">
                <h4 className="font-bold text-neutral-900 print:text-black uppercase tracking-wider text-[10px] border-b pb-1 mb-2">Dikirim Oleh:</h4>
                <div><strong>Nama Sales:</strong> {quotation.sales_nama}</div>
                <div><strong>Cabang:</strong> {quotation.cabang_nama}</div>
                {lead?.nomor && <div><strong>Nomor Prospek:</strong> {lead.nomor}</div>}
              </div>
            </div>

            {/* Table Details */}
            <div className="border rounded-xl overflow-hidden">
              <table className="min-w-full divide-y divide-neutral-200">
                <thead className="bg-neutral-50 print:bg-neutral-100 text-[10px] uppercase font-bold text-neutral-600">
                  <tr>
                    <th className="px-4 py-3 text-left w-10">No</th>
                    <th className="px-4 py-3 text-left">Kode</th>
                    <th className="px-4 py-3 text-left">Nama Produk</th>
                    <th className="px-4 py-3 text-right">Qty</th>
                    <th className="px-4 py-3 text-right">Harga</th>
                    <th className="px-4 py-3 text-right">Diskon</th>
                    <th className="px-4 py-3 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200 text-xs">
                  {quotation.details?.map((d, index) => {
                    const price = Number(d.harga);
                    const qty = Number(d.qty);
                    const disc = Number(d.diskon_nominal);
                    const sub = Number(d.subtotal);
                    return (
                      <tr key={d.id} className="hover:bg-neutral-50/50">
                        <td className="px-4 py-3 text-neutral-500">{index + 1}</td>
                        <td className="px-4 py-3 font-mono text-[11px] font-medium">{d.kode_produk}</td>
                        <td className="px-4 py-3 font-medium text-neutral-900 print:text-black">{d.nama_produk}</td>
                        <td className="px-4 py-3 text-right font-medium">{qty.toLocaleString('id-ID')} {d.satuan}</td>
                        <td className="px-4 py-3 text-right">Rp {price.toLocaleString('id-ID')}</td>
                        <td className="px-4 py-3 text-right text-red-600 print:text-red-600">
                          {disc > 0 ? `-Rp ${disc.toLocaleString('id-ID')}` : '-'}
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-neutral-900 print:text-black">
                          Rp {sub.toLocaleString('id-ID')}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Calculations Summary */}
            <div className="flex justify-between items-start gap-4">
              {/* Catatan / Terms */}
              <div className="flex-1 text-xs">
                {quotation.catatan && (
                  <div className="p-4 border rounded-xl bg-neutral-50/50">
                    <h5 className="font-bold text-neutral-800 print:text-black mb-1">Catatan Termin & Kondisi:</h5>
                    <p className="text-neutral-600 print:text-neutral-700 whitespace-pre-line leading-relaxed">{quotation.catatan}</p>
                  </div>
                )}
              </div>

              {/* Totals Block */}
              <div className="w-80 space-y-2 border rounded-xl p-4 bg-neutral-50 print:bg-neutral-50 text-xs">
                <div className="flex justify-between text-neutral-600">
                  <span>Subtotal</span>
                  <span className="font-medium">Rp {Number(quotation.subtotal).toLocaleString('id-ID')}</span>
                </div>
                {Number(quotation.diskon_nominal) > 0 && (
                  <div className="flex justify-between text-red-600">
                    <span>Diskon Overall</span>
                    <span className="font-medium">-Rp {Number(quotation.diskon_nominal).toLocaleString('id-ID')}</span>
                  </div>
                )}
                <div className="flex justify-between text-neutral-600">
                  <span>PPN ({Number(quotation.ppn_persen)}%)</span>
                  <span className="font-medium">Rp {Number(quotation.ppn_nominal).toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between border-t pt-2 items-baseline">
                  <span className="font-bold text-neutral-900 print:text-black">Grand Total</span>
                  <span className="text-base font-extrabold text-orange-600 print:text-orange-600">
                    Rp {Number(quotation.grand_total).toLocaleString('id-ID')}
                  </span>
                </div>
                {Number(quotation.dp_nominal) > 0 && (
                  <div className="flex justify-between border-t border-dashed pt-2 text-emerald-600">
                    <span>Uang Muka (DP)</span>
                    <span className="font-bold">Rp {Number(quotation.dp_nominal).toLocaleString('id-ID')}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Signatures */}
            <div className="grid grid-cols-2 gap-8 pt-10 text-center text-xs">
              <div className="space-y-16">
                <div>
                  <p className="text-neutral-500">Penerima / Customer,</p>
                </div>
                <div>
                  <p className="font-bold text-neutral-900 print:text-black">___________________________</p>
                  <p className="text-[10px] text-neutral-400 mt-1">Tanda Tangan & Nama Terang</p>
                </div>
              </div>
              <div className="space-y-16">
                <div>
                  <p className="text-neutral-500">Hormat Kami / Sales PIC,</p>
                </div>
                <div>
                  <p className="font-bold text-neutral-900 print:text-black">{quotation.sales_nama}</p>
                  <p className="text-[10px] text-neutral-400 mt-1">Maksindo {quotation.cabang_nama}</p>
                </div>
              </div>
            </div>

          </div>

        </div>

        {/* Modal Footer (hidden on print) */}
        <div className="px-6 py-4 border-t border-neutral-100 dark:border-neutral-800 flex justify-end gap-3 bg-neutral-50 dark:bg-neutral-900/50 print:hidden">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold rounded-xl border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 transition-colors"
          >
            Tutup
          </button>
        </div>

      </div>
    </div>
  );
}

