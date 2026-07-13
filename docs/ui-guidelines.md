# UI Guidelines

Dokumen ini menjelaskan standar tampilan antarmuka (UI) aplikasi MAKSI.

Seluruh halaman yang dibuat wajib mengikuti standar ini agar aplikasi memiliki tampilan yang konsisten, profesional, dan mudah digunakan.

---

# Prinsip Desain

Aplikasi menggunakan konsep:

- Modern
- Clean
- Professional
- Minimalist
- Responsive
- Business Application

Fokus utama adalah produktivitas pengguna, bukan tampilan yang berlebihan.

---

# Framework

Frontend menggunakan:

- Next.js
- Tailwind CSS


Hindari membuat Component baru apabila fungsi yang sama sudah tersedia.

---

# Layout Aplikasi

Layout utama terdiri dari:

```
+------------------------------------------------------+
| Header                                               |
+------------+-----------------------------------------+
|            |                                         |
| Sidebar    |              Content                    |
|            |                                         |
|            |                                         |
+------------+-----------------------------------------+
```

Seluruh halaman menggunakan layout yang sama.

---

# Struktur Halaman

Setiap halaman wajib memiliki urutan berikut.

1. Judul Halaman
2. Breadcrumb
3. Toolbar
4. Filter (jika diperlukan)
5. Content
6. Pagination (jika diperlukan)

---

# Header Halaman

Header minimal berisi:

- Judul
- Deskripsi singkat (opsional)
- Tombol aksi utama

Contoh

```
Lead

Kelola seluruh data Lead.

                    [+ Tambah Lead]
```

---

# Toolbar

Toolbar dapat berisi:

- Tambah
- Refresh
- Export Excel
- Export PDF
- Filter
- Search

---

# Card

Gunakan Card untuk:

- Dashboard
- Statistik
- Ringkasan
- Informasi

Jangan menggunakan Card sebagai pengganti tabel data.

---

# Table

Gunakan Table untuk data yang memiliki banyak baris.

Standar:

- Pagination
- Search
- Sorting
- Responsive
- Empty State

---

# Form

Aturan:

- Label berada di atas Input.
- Field wajib diberi tanda (*).
- Gunakan validasi.
- Berikan pesan kesalahan yang jelas.

---

# Button

Gunakan warna sesuai fungsi.

Primary

Digunakan untuk aksi utama.

Contoh:

- Simpan
- Tambah

Success

Digunakan untuk aksi berhasil.

Contoh:

- Deal

Warning

Digunakan untuk peringatan.

Contoh:

- Follow Up
- Pengingat

Danger

Digunakan untuk:

- Hapus
- Lost

Default

Digunakan untuk:

- Batal
- Tutup
- Kembali

---

# Modal

Gunakan Modal untuk:

- Tambah Data
- Edit Data
- Konfirmasi
- Detail Ringkas

Gunakan Drawer apabila form terlalu panjang.

---

# Drawer

Gunakan Drawer untuk:

- Form panjang
- Detail Customer
- Detail Lead

---


# Badge

Gunakan Badge untuk:

- Status
- Prioritas
- Jumlah Notifikasi

---

# Tag

Gunakan Tag untuk:

- Kategori
- Role
- Cabang

---

# Icon

Gunakan icon seperlunya.

Jangan menggunakan icon apabila tidak menambah kejelasan.

---

# Empty State

Apabila data kosong tampilkan:

- Icon
- Judul
- Deskripsi singkat
- Tombol Tambah (jika diperlukan)

Jangan menampilkan tabel kosong.

---

# Loading

Gunakan Skeleton

Jangan menggunakan teks:

Loading...

---

# Notification

Gunakan Notification 

Pesan menggunakan Bahasa Indonesia.

Contoh

- Data berhasil disimpan.
- Data berhasil diubah.
- Data berhasil dihapus.

---

# Konfirmasi

Aksi berikut wajib meminta konfirmasi.

- Hapus
- Deal
- Lost
- Reset Password

---

# Search

Search berada di kanan Toolbar.

Search menggunakan debounce.

Minimal pencarian:

- Nama
- Nomor Telepon
- Nomor Penawaran

---

# Filter

Filter diletakkan di atas tabel.

Gunakan apabila data lebih dari satu kategori.

---

# Dashboard

Dashboard lebih mengutamakan visual daripada tabel.

Komponen Dashboard:

- Summary Card
- Chart
- Statistik
- Aktivitas Terbaru
- Pengingat Hari Ini

---

# Laporan

Laporan terdiri dari:

- Filter
- Ringkasan
- Grafik
- Tabel
- Export

---



# Responsive

Aplikasi harus berjalan dengan baik pada:

- Desktop
- Laptop
- Tablet

Mobile bukan prioritas utama, tetapi tetap dapat digunakan.

---

# Konsistensi

Seluruh halaman harus memiliki:

- Jarak yang konsisten
- Ukuran font yang konsisten
- Warna yang konsisten
- Posisi tombol yang konsisten
- Struktur yang konsisten

---

# Larangan

Jangan membuat halaman dengan layout yang berbeda tanpa alasan.

Jangan menggunakan lebih dari satu jenis tabel.

Jangan menggunakan lebih dari satu gaya Button.

Jangan menggunakan lebih dari satu warna untuk status yang sama.

Jangan mengubah tampilan tanpa mengikuti referensi desain.

---

# Referensi UI

Seluruh implementasi UI wajib mengikuti mockup yang berada pada folder:

```
reference/ui/
```

Apabila terdapat perbedaan antara implementasi dan mockup, maka mockup menjadi acuan utama.

---

Dokumen ini menjadi standar utama dalam pengembangan tampilan aplikasi MAKSI.