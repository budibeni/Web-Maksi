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
- Mengubah Lead miliknya
- Membuat Follow Up
- Membuat Penawaran
- Mengubah Penawaran miliknya
- Melihat Customer miliknya
- Melihat Dashboard pribadi

---

# 2. Aturan Customer

Customer merupakan data utama.

Ketentuan:

- Customer dapat memiliki lebih dari satu Lead.
- Customer tidak dapat dihapus apabila masih memiliki Lead.
- Customer dapat berupa customer baru maupun customer lama.
- Saat membuat Lead baru, sistem akan mencari Customer berdasarkan nomor telepon.
- Apabila Customer sudah ada, maka Lead akan menggunakan Customer tersebut.
- Apabila Customer belum ada, sistem akan membuat Customer baru secara otomatis.

---

# 3. Aturan Lead

Lead merupakan awal proses penjualan.

Status Lead terdiri dari:

- Open
- Follow Up
- Penawaran
- Deal
- Lost

Ketentuan:

- Lead wajib memiliki Customer.
- Lead wajib memiliki Sales.
- Lead dapat memiliki banyak Follow Up.
- Lead hanya memiliki satu Penawaran aktif.
- Lead yang sudah Deal tidak dapat diubah menjadi Lost.
- Lead yang sudah Lost dapat dibuka kembali menjadi Open.
- Lead tidak boleh dihapus apabila sudah memiliki Follow Up.
- Lead tidak boleh dihapus apabila sudah memiliki Penawaran.
- Lead yang sudah Deal menjadi histori penjualan.

---

# 4. Aturan Follow Up

Follow Up merupakan riwayat komunikasi Sales dengan Customer.

Ketentuan:

- Satu Lead dapat memiliki banyak Follow Up.
- Follow Up tidak boleh dihapus.
- Follow Up tidak boleh diubah setelah disimpan.
- Setiap Follow Up wajib memiliki tanggal.
- Setiap Follow Up wajib memiliki hasil Follow Up.
- Seluruh Follow Up menjadi histori aktivitas.

---

# 5. Aturan Penawaran

Penawaran dibuat berdasarkan Lead.

Ketentuan:

- Penawaran hanya dapat dibuat apabila Lead masih aktif.
- Satu Lead hanya memiliki satu Penawaran aktif.
- Penawaran dapat direvisi.
- Nomor Penawaran dibuat otomatis.
- Tanggal Penawaran dibuat otomatis.
- Harga mengikuti Master Data namun masih dapat disesuaikan.
- Total Penawaran dihitung otomatis.

---

# 6. Aturan Deal

Deal merupakan transaksi yang berhasil.

Ketentuan:

- Deal harus berasal dari Penawaran.
- Nilai Deal mengikuti nilai Penawaran terakhir.
- Tanggal Deal dibuat otomatis.
- Setelah Deal, status Lead menjadi selesai.
- Lead yang sudah Deal tidak dapat kembali menjadi Open.

---

# 7. Aturan Lost

Lost merupakan transaksi yang gagal.

Ketentuan:

- Lost wajib memiliki alasan.
- Alasan Lost dipilih dari daftar yang tersedia.
- Lost tetap tercatat sebagai histori.
- Lost dapat dibuka kembali menjadi Open apabila Customer kembali berminat.

---

# 8. Aturan Pengingat

Pengingat digunakan untuk mengingatkan aktivitas Sales.

Ketentuan:

- Pengingat memiliki tanggal dan waktu.
- Pengingat dapat ditujukan kepada Sales tertentu.
- Pengingat dapat diubah.
- Pengingat dapat diselesaikan.
- Pengingat yang selesai tetap disimpan sebagai histori.

---

# 9. Aturan Dashboard

Dashboard menampilkan data secara real-time.

Dashboard menampilkan:

- Total Lead
- Lead Open
- Lead Follow Up
- Lead Penawaran
- Total Deal
- Total Lost
- Aktivitas hari ini
- Pengingat hari ini
- Grafik performa Sales
- Grafik performa Cabang

Data Dashboard mengikuti hak akses pengguna.

---

# 10. Aturan Laporan

Laporan digunakan sebagai bahan evaluasi.

Laporan dapat difilter berdasarkan:

- Tanggal
- Cabang
- Sales
- Status Lead

Laporan dapat diekspor ke Excel.

Data laporan mengikuti hak akses pengguna.

---

# 11. Aturan Master Data

Master Data terdiri dari:

- Mesin
- Sparepart
- Jasa

Ketentuan:

- Data Master hanya dapat diubah oleh Administrator.
- Setiap item memiliki harga.
- Harga dapat berbeda setiap cabang.
- Master Data digunakan pada Penawaran.

---

# 12. Aturan User

Setiap User wajib memiliki:

- Nama
- Username
- Password
- Role
- Cabang
- Status

Username tidak boleh sama.

Password disimpan dalam bentuk hash.

User yang dinonaktifkan tidak dapat login.

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

- Seluruh tanggal menggunakan zona waktu Asia/Jakarta.
- Mata uang menggunakan Rupiah.
- Semua nominal menggunakan format angka tanpa titik pada database.
- Nomor dokumen dibuat otomatis oleh sistem.
- Data tidak boleh dihapus secara permanen apabila masih memiliki relasi.
- Seluruh proses harus mengikuti hak akses pengguna.

---

Dokumen ini merupakan acuan utama dalam pengembangan aplikasi MAKSI.

Apabila terdapat perubahan aturan bisnis, dokumen ini wajib diperbarui terlebih dahulu sebelum implementasi dilakukan pada kode aplikasi.