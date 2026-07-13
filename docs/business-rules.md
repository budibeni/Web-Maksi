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
- Mengelola seluruh Versi Penawaran
- Mengelola seluruh Pengingat
- Mengakses seluruh Dashboard
- Mengakses seluruh Laporan
- Melihat Audit Log

---

## Top Management

Berfungsi sebagai monitoring dan pengambilan keputusan.

Hak akses:

- Melihat seluruh Dashboard
- Melihat seluruh Lead
- Melihat seluruh Customer
- Melihat seluruh Versi Penawaran
- Melihat seluruh Aktivitas Lead
- Melihat seluruh Laporan

Top Management tidak melakukan input data operasional.

---

## Branch Manager

Mengelola seluruh aktivitas pada cabangnya.

Hak akses:

- Melihat seluruh Lead pada cabangnya
- Melihat seluruh Customer pada cabangnya
- Melihat seluruh Aktivitas Lead pada cabangnya
- Melihat seluruh Versi Penawaran pada cabangnya
- Melihat Dashboard cabang
- Melihat Laporan cabang

Branch Manager tidak dapat mengubah Master Data.

---

## Sales

Sales hanya dapat mengakses data miliknya sendiri.

Hak akses:

- Membuat Lead
- Menambahkan Aktivitas Lead
- Membuat Versi Penawaran
- Menandai Deal
- Menandai Lost
- Melihat Customer miliknya
- Melihat Dashboard pribadi

Sales tidak dapat mengubah Master Data.

---

# 2. Aturan Customer

Customer merupakan data utama pada proses penjualan.

## Ketentuan

- Customer dapat memiliki lebih dari satu Lead.
- Customer dapat berupa Customer Baru maupun Customer Existing.
- Saat membuat Lead, sistem mencari Customer berdasarkan Nama Customer atau Nomor Telepon.
- Apabila Customer ditemukan, Lead menggunakan Customer tersebut.
- Apabila Customer tidak ditemukan, sistem otomatis membuat Customer baru.
- Setiap Lead wajib terhubung dengan satu Customer.
- Customer yang telah digunakan pada transaksi tidak boleh dihapus.
- Customer yang sudah tidak digunakan dapat dinonaktifkan.

---

# 3. Aturan Lead

Lead merupakan awal seluruh proses penjualan.

Lead menjadi pusat seluruh aktivitas penjualan.

Seluruh Aktivitas Lead, Pengingat, dan Versi Penawaran selalu terhubung dengan satu Lead.

---

## Status Lead

Status Lead terdiri dari:

- OPEN
- DEAL
- LOST

Status menunjukkan kondisi akhir Lead.

Status tidak dapat diubah secara manual.

---

## Fase Lead

Fase menunjukkan posisi proses penjualan.

Fase hanya berlaku apabila Status Lead = OPEN.

Fase terdiri dari:

- LEAD_BARU
- FOLLOW_UP
- PENAWARAN

Sales tidak dapat mengubah Fase Lead secara manual.

Fase Lead diperbarui otomatis berdasarkan Hasil Interaksi yang dipilih.

---

## Ketentuan Lead

- Lead wajib memiliki Customer.
- Lead wajib memiliki Sales.
- Lead wajib memiliki Cabang.
- Lead dapat memiliki banyak Aktivitas Lead.
- Lead dapat memiliki banyak Versi Penawaran.
- Lead hanya dapat menjadi Deal satu kali.
- Lead hanya dapat menjadi Lost satu kali.
- Lead yang sudah berstatus DEAL tidak dapat diubah kembali.
- Lead yang sudah berstatus LOST tidak dapat diubah kembali.
- Lead yang sudah memiliki Aktivitas Lead tidak boleh dihapus.
- Lead yang sudah memiliki Versi Penawaran tidak boleh dihapus.
- Lead yang sudah berstatus DEAL maupun LOST tetap menjadi histori.
- Saat Deal, sistem menyimpan referensi Versi Penawaran yang dipilih.
- Saat Lost, sistem menyimpan Snapshot Nama Alasan Lost.

---

# 4. Aturan Aktivitas Lead

Aktivitas Lead merupakan riwayat seluruh komunikasi antara Sales dan Customer.

Aktivitas Lead merupakan histori permanen.

---

## Ketentuan

- Satu Lead dapat memiliki banyak Aktivitas Lead.
- Setiap Aktivitas Lead wajib memilih satu Hasil Interaksi.
- Hasil Interaksi dipilih dari Master Hasil Interaksi.
- Setiap Aktivitas Lead dapat memiliki Catatan.
- Setiap Aktivitas Lead dapat membuat satu Pengingat.
- Sistem memperbarui Fase Lead secara otomatis berdasarkan Hasil Interaksi yang dipilih.
- Sales tidak dapat mengubah Fase Lead secara manual.
- Aktivitas Lead tidak boleh diubah setelah disimpan.
- Aktivitas Lead tidak boleh dihapus.
- Aktivitas Lead menjadi histori permanen.
- Nama Hasil Interaksi disimpan sebagai Snapshot sehingga perubahan Master Hasil Interaksi tidak mengubah histori transaksi.

---

# 5. Aturan Hasil Interaksi

Hasil Interaksi merupakan Master Data yang digunakan saat Sales menyimpan Aktivitas Lead.

Selain sebagai hasil komunikasi, Hasil Interaksi juga menentukan perubahan Fase Lead.

---

## Ketentuan

- Administrator dapat menambah Hasil Interaksi.
- Administrator dapat mengubah Hasil Interaksi.
- Administrator dapat menonaktifkan Hasil Interaksi.
- Setiap Hasil Interaksi menentukan Fase Lead berikutnya.
- Hasil Interaksi yang sudah digunakan pada transaksi tidak boleh dihapus.
- Hasil Interaksi yang sudah tidak digunakan dapat dinonaktifkan.
- Perubahan Master Hasil Interaksi tidak mengubah histori Aktivitas Lead yang telah tersimpan.
- Nama Hasil Interaksi disimpan sebagai Snapshot pada tabel Aktivitas Lead.

Contoh Hasil Interaksi:

- Hanya tanya-tanya
- Menunggu keputusan
- Minta penawaran
- Siap membeli
- Tidak berminat
- Membeli di kompetitor
- Lainnya


# 6. Aturan Versi Penawaran

Versi Penawaran merupakan dokumen penawaran yang dibuat berdasarkan Lead.

Versi Penawaran hanya dapat dibuat apabila Lead masih berstatus **OPEN**.

---

## Ketentuan Umum

- Satu Lead dapat memiliki banyak Versi Penawaran.
- Versi pertama menggunakan nomor **1**.
- Nomor Versi bertambah otomatis setiap kali dilakukan revisi.
- Revisi dilakukan dengan membuat Versi Penawaran baru.
- Seluruh isi Versi Penawaran sebelumnya disalin ke Versi Penawaran baru.
- Setelah disimpan, Versi Penawaran tidak dapat diubah.
- Setelah disimpan, Versi Penawaran tidak dapat dihapus.
- Seluruh Versi Penawaran menjadi histori permanen.
- Deal menggunakan salah satu Versi Penawaran yang dipilih.
- Mata uang menggunakan Rupiah (IDR).

---

## Snapshot Header

Saat Versi Penawaran dibuat, sistem menyimpan Snapshot berikut:

- Nama Customer
- Nomor Telepon Customer
- Alamat Customer
- Nama Sales
- Nama Cabang

Perubahan Master Data tidak mengubah Versi Penawaran yang telah dibuat.

---

## Snapshot Detail

Seluruh Produk yang terdapat pada Detail Penawaran disimpan sebagai Snapshot.

Snapshot meliputi:

- Kategori Produk
- Kode Produk
- Nama Produk
- Satuan
- Harga
- Qty
- Diskon Item
- Subtotal

Perubahan Master Produk maupun Harga Produk tidak mengubah histori Versi Penawaran.

---

## Aturan Harga

- Harga Produk diambil otomatis dari Master Harga Produk.
- Sistem menggunakan Harga Cabang sesuai Cabang Lead.
- Apabila Harga Cabang tidak tersedia, sistem menggunakan Harga Default.
- Harga Produk tidak dapat diubah secara manual.
- Sales hanya dapat memberikan Diskon Item.
- Sales dapat memberikan Diskon Keseluruhan.

---

## Diskon

Diskon terdiri dari:

- Diskon Item
- Diskon Keseluruhan

Diskon dapat berupa:

- Persentase (%)
- Nominal (Rp)

Perhitungan dilakukan otomatis oleh sistem.

---

## Perhitungan Nilai Penawaran

Urutan perhitungan:

1. Menghitung Subtotal seluruh Item.
2. Mengurangi Diskon Item.
3. Mengurangi Diskon Keseluruhan.
4. Menghitung PPN.
5. Menghasilkan Grand Total.
6. Menghitung DP.

DP tidak mengurangi Grand Total.

DP hanya digunakan sebagai informasi pembayaran.

---

## Revisi Penawaran

- Revisi dibuat dari Versi Penawaran terbaru.
- Sistem menyalin seluruh isi Versi Penawaran sebelumnya.
- Pengguna melakukan perubahan pada Versi Penawaran baru.
- Versi sebelumnya tetap menjadi histori.
- Riwayat seluruh Versi Penawaran dapat dilihat kembali.

---

# 7. Aturan Deal

Deal merupakan kondisi akhir Lead yang berhasil.

---

## Ketentuan

- Deal hanya dapat dilakukan apabila Lead memiliki minimal satu Versi Penawaran.
- User wajib memilih satu Versi Penawaran yang disetujui Customer.
- Nilai Deal mengikuti Grand Total pada Versi Penawaran yang dipilih.
- Tanggal Deal dibuat otomatis menggunakan tanggal dan waktu saat proses Deal.
- Setelah Deal:
  - Status Lead menjadi DEAL.
  - Seluruh Pengingat berstatus AKTIF otomatis menjadi SELESAI.
  - Lead menjadi histori penjualan.
- Lead yang sudah DEAL tidak dapat kembali menjadi OPEN.
- Deal tidak dapat diubah.
- Deal tidak dapat dibatalkan.

---

# 8. Aturan Lost

Lost merupakan kondisi akhir Lead yang tidak berhasil.

Lost hanya dapat dilakukan apabila Status Lead masih **OPEN**.

---

## Ketentuan

- Lost wajib memiliki Alasan Lost.
- Alasan Lost dipilih dari Master Alasan Lost.
- Nama Alasan Lost disimpan sebagai Snapshot pada tabel Lead.
- Perubahan Master Alasan Lost tidak mengubah histori Lead.
- Apabila memilih "Lainnya", Catatan Lost wajib diisi.
- Setelah Lost:
  - Status Lead menjadi LOST.
  - Seluruh Pengingat berstatus AKTIF otomatis menjadi SELESAI.
  - Lead tetap menjadi histori.
- Lead yang sudah LOST tidak dapat kembali menjadi OPEN.
- Lost tidak dapat diubah.
- Lost tidak dapat dibatalkan.

---

# 9. Aturan Pengingat

Pengingat digunakan untuk mengingatkan Sales melakukan tindak lanjut kepada Customer.

Pengingat selalu dibuat dari Aktivitas Lead.

---

## Ketentuan

- Satu Lead dapat memiliki banyak Pengingat.
- Satu Aktivitas Lead dapat membuat paling banyak satu Pengingat.
- Hanya boleh terdapat satu Pengingat dengan status **AKTIF** pada setiap Lead.
- Saat Aktivitas Lead baru disimpan dan membuat Pengingat baru, Pengingat AKTIF sebelumnya otomatis berubah menjadi **SELESAI**.
- Lead yang sudah berstatus DEAL atau LOST tidak memiliki Pengingat AKTIF.
- Pengingat yang berstatus SELESAI tetap menjadi histori.
- Pengingat tidak boleh diubah.
- Pengingat tidak boleh dihapus.

---

## Status Pengingat

Status Pengingat terdiri dari:

- AKTIF
- SELESAI

Status **TERLAMBAT** tidak disimpan pada database.

Sistem menentukan Pengingat Terlambat apabila:

- Status = AKTIF
- Tanggal Pengingat lebih kecil dari tanggal dan waktu saat ini.

Pengingat Terlambat tetap ditampilkan sampai Sales menyimpan Aktivitas Lead berikutnya atau Lead berstatus DEAL maupun LOST.


# 10. Aturan Dashboard

Dashboard digunakan sebagai media monitoring aktivitas penjualan.

Data Dashboard mengikuti hak akses User yang sedang login.

---

## Dashboard Administrator

Menampilkan seluruh data perusahaan.

---

## Dashboard Top Management

Menampilkan seluruh data perusahaan.

Top Management tidak melakukan input data.

---

## Dashboard Branch Manager

Menampilkan seluruh data pada cabangnya.

---

## Dashboard Sales

Menampilkan data milik Sales yang sedang login.

---

## Informasi Dashboard

Dashboard minimal menampilkan:

- Total Lead
- Total Open
- Total Deal
- Total Lost
- Nilai Deal
- Conversion Rate
- Closing Rate
- Trend Lead
- Distribusi Fase Lead
- Funnel Penjualan
- Top Sales
- Ringkasan Cabang
- Pengingat Aktif
- Aktivitas Lead Terbaru

Seluruh data Dashboard mengikuti filter yang dipilih.

---

# 11. Aturan Laporan

Laporan digunakan sebagai bahan evaluasi penjualan.

---

## Jenis Laporan

- Laporan Semua Lead
- Laporan Deal
- Laporan Lost

---

## Filter

Seluruh laporan dapat difilter berdasarkan:

- Periode
- Cabang
- Sales
- Status Lead
- Fase Lead
- Customer
- Alasan Lost

---

## Export

Seluruh laporan dapat diekspor ke Microsoft Excel.

Data laporan mengikuti hak akses User.

---

# 12. Aturan Master Data

Master Data terdiri dari:

- Role
- Cabang
- User
- Kategori Produk
- Produk
- Harga Produk
- Alasan Lost
- Hasil Interaksi

---

## Ketentuan

- Seluruh Master Data hanya dapat dikelola Administrator.
- Harga Cabang menggunakan Harga Default apabila belum tersedia.
- Data Master yang belum pernah digunakan pada transaksi dapat dihapus.
- Data Master yang sudah digunakan pada transaksi tidak boleh dihapus.
- Data Master yang sudah tidak digunakan harus dinonaktifkan.
- Perubahan Master Data tidak boleh mengubah histori transaksi yang telah tersimpan.

---

# 13. Aturan User

Setiap User wajib memiliki:

- Nama
- Username
- Nomor Telepon
- Password
- Role
- Cabang
- Aktif

---

## Ketentuan

- Username wajib unik.
- Nomor Telepon wajib unik.
- Login dapat menggunakan Username atau Nomor Telepon.
- Password disimpan dalam bentuk Hash.
- User yang Tidak Aktif tidak dapat Login.
- Hak akses mengikuti Role.

---

# 14. Aturan Audit

Seluruh aktivitas penting wajib tercatat pada Audit Log.

Audit Log digunakan sebagai histori permanen aktivitas User.

---

## Minimal Aktivitas

- Login
- Login Gagal
- Logout
- Tambah Data
- Ubah Data
- Hapus Data
- Deal
- Lost
- Export Excel
- Import Data
- Reset Password

---

## Ketentuan

- Audit Log dibuat otomatis oleh sistem.
- Audit Log tidak dapat diubah.
- Audit Log tidak dapat dihapus.
- Audit Log hanya dapat dilihat oleh Administrator.
- Audit Log menyimpan Snapshot Nama User.
- Audit Log menyimpan Data Sebelum dan Data Sesudah dalam format JSON apabila terjadi perubahan data.

---

# 15. Ketentuan Umum

- Zona waktu menggunakan Asia/Jakarta.
- Mata uang menggunakan Rupiah (IDR).
- Seluruh nominal disimpan tanpa format pada database.
- Seluruh tanggal menggunakan zona waktu Asia/Jakarta.
- Seluruh implementasi mengikuti Business Rules.
- Seluruh implementasi mengikuti Database Design.
- Seluruh implementasi mengikuti Mockup UI.
- Seluruh implementasi mengikuti Development Flow.
- Seluruh implementasi mengikuti Roadmap.

---

# 16. Prinsip Histori Transaksi

Seluruh transaksi merupakan histori permanen.

Transaksi yang telah disimpan tidak boleh diubah.

Apabila terjadi perubahan proses bisnis, sistem membuat transaksi baru, bukan mengubah transaksi yang sudah ada.

Contoh:

- Revisi Penawaran membuat Versi Penawaran baru.
- Aktivitas Lead tidak dapat diubah.
- Deal tidak dapat diubah.
- Lost tidak dapat diubah.

---

# 17. Prinsip Snapshot

Seluruh informasi yang ditampilkan pada dokumen transaksi wajib disimpan sebagai Snapshot pada saat transaksi dibuat.

Tujuannya agar dokumen yang dicetak ulang selalu sama dengan dokumen yang pertama kali diterbitkan.

Perubahan Master Data tidak boleh mengubah histori transaksi yang telah tersimpan.

---

## Snapshot Header Penawaran

Disimpan pada Versi Penawaran.

Meliputi:

- Nama Customer
- Nomor Telepon Customer
- Alamat Customer
- Nama Sales
- Nama Cabang

---

## Snapshot Detail Penawaran

Disimpan pada Detail Penawaran.

Meliputi:

- Kategori Produk
- Kode Produk
- Nama Produk
- Satuan
- Harga Produk
- Qty
- Diskon
- Subtotal

---

## Snapshot Histori

Disimpan pada transaksi yang memerlukan histori.

Contoh:

- Nama Hasil Interaksi
- Nama Alasan Lost

---

# Prinsip Pengembangan

Seluruh implementasi wajib mengikuti prinsip berikut:

- Business Rules merupakan sumber utama proses bisnis.
- Database Design merupakan sumber utama struktur database.
- Dokumen pada folder `docs/database/` merupakan sumber utama struktur masing-masing tabel.
- Mockup UI merupakan sumber utama tampilan aplikasi.
- Perubahan Business Rules harus dilakukan sebelum implementasi pada kode.
- Perubahan struktur database harus dilakukan dengan memperbarui dokumentasi terlebih dahulu.
- AI maupun Developer tidak diperbolehkan membuat asumsi di luar dokumentasi yang telah tersedia.

---

Dokumen ini merupakan acuan utama dalam pengembangan aplikasi MAKSI.

Apabila terdapat perubahan kebutuhan bisnis, Business Rules harus diperbarui terlebih dahulu sebelum implementasi dilakukan pada kode aplikasi.
