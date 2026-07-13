# Business Rules

Dokumen ini berisi seluruh aturan bisnis yang berlaku pada aplikasi MAKSI (Maksindo Sales Information System).

Seluruh implementasi sistem wajib mengikuti aturan yang terdapat pada dokumen ini.

---

# 1. Hak Akses

Aplikasi memiliki 4 jenis pengguna.

## Administrator

Memiliki hak akses penuh terhadap seluruh sistem.

Hak akses:

- Mengelola User
- Mengelola Master Data
- Mengelola seluruh Lead
- Mengelola seluruh Customer
- Mengelola seluruh Penawaran
- Mengelola seluruh Pengingat
- Mengakses seluruh Dashboard
- Mengakses seluruh Laporan

---

## Top Management

Berfungsi sebagai monitoring.

Hak akses:

- Melihat seluruh Dashboard
- Melihat seluruh Lead
- Melihat seluruh Customer
- Melihat seluruh Penawaran
- Melihat seluruh Aktivitas
- Melihat seluruh Laporan

Top Management tidak melakukan input data operasional.

---

## Branch Manager

Mengelola seluruh data pada cabangnya.

Hak akses:

- Melihat seluruh Lead di cabangnya
- Melihat seluruh Customer di cabangnya
- Melihat seluruh Aktivitas Sales
- Melihat Dashboard cabang
- Melihat Laporan cabang

---

## Sales

Sales hanya dapat mengakses data miliknya sendiri.

Hak akses:

- Membuat Lead
- Follow Up Lead
- Membuat Penawaran
- Menandai Deal
- Menandai Lost
- Melihat Customer miliknya
- Melihat Dashboard pribadi

---

# 2. Aturan Customer

Customer merupakan data utama.

Ketentuan:

- Customer dapat memiliki lebih dari satu Lead.
- Customer tidak dapat dihapus apabila masih memiliki Lead.
- Customer dapat berupa Customer Baru maupun Customer Existing.
- Saat membuat Lead, sistem mencari Customer berdasarkan Nama Customer atau Nomor HP.
- Apabila Customer ditemukan, Lead menggunakan Customer tersebut.
- Apabila Customer tidak ditemukan, sistem otomatis membuat Customer baru.
- Lead selalu terhubung dengan satu Customer.

---

# 3. Aturan Lead

Lead merupakan awal proses penjualan.

## Status Lead

Status Lead hanya terdiri dari:

- OPEN
- DEAL
- LOST

Status digunakan untuk menunjukkan kondisi akhir Lead.

---

## Fase Lead

Fase digunakan untuk menunjukkan posisi proses penjualan.

Fase hanya berlaku apabila Status = OPEN.

Fase terdiri dari:

- Lead Baru
- Follow Up
- Penawaran

Fase berubah otomatis berdasarkan aktivitas Sales.

---

## Ketentuan Lead

- Lead wajib memiliki Customer.
- Lead wajib memiliki Sales.
- Lead dapat memiliki banyak aktivitas Follow Up.
- Lead tidak boleh dihapus apabila sudah memiliki aktivitas.
- Lead tidak boleh dihapus apabila sudah memiliki Penawaran.
- Lead yang sudah DEAL tidak dapat diubah kembali.
- Lead yang sudah LOST tidak dapat diubah kembali.
- Lead yang sudah DEAL maupun LOST tetap menjadi histori.

---

# 4. Aturan Follow Up

Follow Up merupakan riwayat komunikasi Sales dengan Customer.

Ketentuan:

- Satu Lead dapat memiliki banyak Follow Up.
- Follow Up tidak boleh dihapus.
- Follow Up tidak boleh diubah setelah disimpan.
- Setiap Follow Up wajib memiliki hasil Follow Up.
- Setiap Follow Up dapat membuat Reminder baru.
- Follow Up tidak mengubah Status Lead.
- Follow Up hanya memperbarui Fase Lead apabila diperlukan.
- Seluruh Follow Up menjadi histori aktivitas.

---

# 5. Aturan Penawaran

Penawaran dibuat berdasarkan Lead yang masih berstatus **OPEN**.

## Ketentuan Umum

- Penawaran hanya dapat dibuat apabila Status Lead masih **OPEN**.
- Satu Lead hanya memiliki **satu Penawaran**.
- Satu Penawaran dapat memiliki **banyak versi** (V1, V2, V3, dan seterusnya).
- Setiap versi merupakan revisi dari versi sebelumnya.
- Hanya **satu versi** yang berstatus **Aktif**.
- Versi sebelumnya tetap disimpan sebagai histori dan tidak dapat diubah.
- Nomor Penawaran dibuat otomatis oleh sistem.
- Nomor Penawaran tetap sama pada seluruh versi.
- Nomor versi bertambah otomatis setiap kali dibuat revisi.
- Tanggal Penawaran dibuat otomatis saat versi dibuat.
- Cabang Penawaran mengikuti Cabang Lead.
- Mata uang menggunakan Rupiah (IDR).

## Aturan Harga

- Harga item diambil otomatis dari Master Data.
- Sistem menggunakan Harga Cabang sesuai Cabang Lead.
- Apabila Harga Cabang tidak tersedia, sistem menggunakan Harga Default (Pusat).
- Harga item pada Penawaran tidak dapat diubah oleh pengguna.
- Perubahan harga hanya dapat dilakukan melalui Master Data oleh Administrator.
- Perubahan harga pada Master Data tidak memengaruhi versi Penawaran yang sudah pernah dibuat.

## Diskon

- Sales dapat memberikan Diskon Item.
- Sales dapat memberikan Diskon Keseluruhan.
- Diskon dapat berupa persentase (%) atau nominal (Rp) sesuai ketentuan sistem.
- Perhitungan diskon dilakukan secara otomatis oleh sistem.

## Perhitungan Nilai Penawaran

Total Penawaran dihitung otomatis dengan urutan berikut:

1. Subtotal seluruh item.
2. Dikurangi Diskon Item.
3. Dikurangi Diskon Keseluruhan.
4. Ditambahkan PPN.
5. Menghasilkan Total Penawaran.

## Revisi Penawaran

- Revisi hanya dapat dibuat dari versi Penawaran yang aktif.
- Saat versi baru dibuat, versi sebelumnya otomatis berubah menjadi **Digantikan**.
- Riwayat seluruh versi tetap tersimpan dan dapat dilihat kembali.
- Revisi tidak mengubah histori versi sebelumnya.

---

# 6. Aturan Deal

Deal merupakan transaksi yang berhasil.

Ketentuan:

- Deal hanya dapat dilakukan apabila Lead sudah memiliki Penawaran.
- User wajib memilih versi Penawaran yang disepakati.
- Nilai Deal mengikuti versi Penawaran yang dipilih.
- Tanggal Deal otomatis menggunakan tanggal saat proses Deal.
- Setelah Deal:
  - Status Lead menjadi DEAL.
  - Reminder aktif otomatis selesai.
  - Lead menjadi histori penjualan.
- Lead yang sudah DEAL tidak dapat kembali menjadi OPEN.

---

# 7. Aturan Lost

Lost merupakan transaksi yang gagal.

Lost dapat terjadi pada dua kondisi:

- Lost dari Awal (belum memiliki Penawaran).
- Lost setelah Follow Up / Penawaran.

Ketentuan:

- Lost wajib memiliki Tahap Lost.
- Lost wajib memiliki Alasan Lost.
- Alasan Lost dipilih dari Master Alasan Lost.
- Jika memilih "Lainnya", Catatan wajib diisi.
- Setelah Lost:
  - Status Lead menjadi LOST.
  - Reminder aktif otomatis selesai.
  - Lead tetap tersimpan sebagai histori.
- Lead yang sudah LOST tidak dapat kembali menjadi OPEN.

---

# 8. Aturan Pengingat

Pengingat digunakan untuk mengingatkan aktivitas Follow Up.

Ketentuan:

- Pengingat dibuat dari halaman Follow Up.
- Setiap Lead hanya memiliki satu Reminder aktif.
- Saat Follow Up baru disimpan, Reminder sebelumnya otomatis selesai.
- Lead dengan status DEAL atau LOST tidak memiliki Reminder aktif.
- Pengingat yang selesai tetap disimpan sebagai histori.
- Pengingat yang terlambat tetap ditampilkan hingga Follow Up dilakukan.

---

# 9. Aturan Dashboard

Dashboard menampilkan data sesuai hak akses pengguna.

Dashboard menampilkan:

- Total Lead
- Open
- Deal
- Lost
- Nilai Deal
- Conversion Rate
- Closing Rate
- Trend Lead
- Distribusi Fase Lead
- Funnel Pipeline
- Top Sales
- Ringkasan Cabang

Seluruh data Dashboard mengikuti filter yang dipilih.

---

# 10. Aturan Laporan

Laporan digunakan sebagai bahan evaluasi.

Laporan terdiri dari:

- Laporan Semua Lead
- Laporan Deal
- Laporan Lost

Seluruh laporan dapat difilter berdasarkan:

- Periode
- Cabang
- Sales
- Status
- Fase
- Customer
- Alasan Lost (jika diperlukan)

Seluruh laporan dapat diekspor ke Excel.

Data laporan mengikuti hak akses pengguna.

---

# 11. Aturan Master Data

Master Data terdiri dari:

- Mesin
- Sparepart
- Jasa
- Alasan Lost
- Cabang
- User

Ketentuan:

- Data Master hanya dapat dikelola Administrator.
- Produk memiliki Harga Default.
- Produk dapat memiliki Harga Cabang.
- Harga Cabang menggunakan Harga Default apabila tidak diisi.
- Master Produk digunakan pada Penawaran.

---

# 12. Aturan User

Setiap User wajib memiliki:

- Nama
- Username
- Password
- Role
- Cabang
- Status

Ketentuan:

- Username harus unik.
- Password disimpan dalam bentuk hash.
- User Nonaktif tidak dapat login.
- Hak akses mengikuti Role.

---

# 13. Aturan Audit

Seluruh aktivitas penting wajib tercatat.

Minimal meliputi:

- Login
- Logout
- Tambah Data
- Ubah Data
- Hapus Data
- Deal
- Lost

Audit digunakan sebagai histori aktivitas pengguna.

---

# 14. Ketentuan Umum

- Zona waktu menggunakan Asia/Jakarta.
- Mata uang menggunakan Rupiah (IDR).
- Seluruh nominal disimpan tanpa format pada database.
- Nomor dokumen dibuat otomatis oleh sistem.
- Data yang memiliki relasi tidak boleh dihapus permanen.
- Seluruh proses mengikuti hak akses pengguna.
- Seluruh implementasi wajib mengikuti mockup dan dokumen Business Rules.

---

Dokumen ini merupakan acuan utama dalam pengembangan aplikasi MAKSI.

Apabila terdapat perubahan aturan bisnis, dokumen ini wajib diperbarui terlebih dahulu sebelum implementasi dilakukan pada kode aplikasi.