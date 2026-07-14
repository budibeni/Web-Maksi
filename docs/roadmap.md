# Roadmap

Dokumen ini menjelaskan urutan pengembangan aplikasi MAKSI.

Roadmap disusun berdasarkan dependensi antar modul agar proses pengembangan lebih terstruktur dan mengurangi pekerjaan berulang.

Seluruh pengembangan wajib mengikuti roadmap ini.

---

# Tahap 1 - Persiapan Project

Status

✅ Selesai

Pekerjaan

- Membuat Repository GitHub
- Inisialisasi Next.js
- Konfigurasi Tailwind CSS
- Menyiapkan struktur folder project
- Menyiapkan dokumentasi
- Menyiapkan AGENTS.md
- Menyiapkan Environment
- Menyiapkan koneksi Database
- Menyiapkan Dependency Project
- Menyiapkan Git Workflow

Tahap ini hanya menyiapkan fondasi project.

Belum ada implementasi fitur aplikasi.

---

# Tahap 2 - Authentication

Status

✅ Selesai

Pekerjaan

- Login
- Logout
- Middleware Authentication
- JWT Authentication
- Session
- Protected Route
- Role & Permission

Seluruh halaman aplikasi harus menggunakan Authentication.

---

# Tahap 3 - Application Shell

Status

✅ Selesai

Pekerjaan

- Main Layout
- Sidebar
- Header
- Breadcrumb
- Navigation Menu
- User Profile
- Loading
- Error Page
- Forbidden Page
- Unauthorized Page

Tahap ini hanya membangun kerangka aplikasi.

Belum menampilkan data bisnis.

---

# Tahap 4 - Master Data

Status

⬜ Belum Dimulai

Pekerjaan

- Cabang
- User
- Mesin
- Sparepart
- Jasa
- Alasan Lost

Seluruh Master Data harus selesai sebelum modul transaksi dibuat.

---

# Tahap 5 - Customer

Status

⬜ Belum Dimulai

Pekerjaan

- Daftar Customer
- Detail Customer
- Riwayat Lead
- Customer Baru
- Customer Existing

Customer menjadi dasar pembuatan Lead.

---

# Tahap 6 - Lead

Status

⬜ Belum Dimulai

Pekerjaan

- Daftar Lead
- Tambah Lead
- Detail Lead
- Follow Up
- Timeline Aktivitas
- Pengingat
- Penawaran
- Revisi Penawaran
- Deal
- Lost

Lead merupakan inti proses bisnis aplikasi MAKSI.

Seluruh proses penjualan diselesaikan pada tahap ini.

---

# Tahap 7 - Dashboard

Status

⬜ Belum Dimulai

Pekerjaan

- Ringkasan Lead
- Ringkasan Deal
- Ringkasan Lost
- Conversion Rate
- Closing Rate
- Funnel Penjualan
- Grafik Lead
- Grafik Sales
- Grafik Cabang
- Aktivitas Terbaru
- Pengingat Hari Ini

Dashboard dikerjakan setelah seluruh data transaksi tersedia.

---

# Tahap 8 - Laporan

Status

⬜ Belum Dimulai

Pekerjaan

- Laporan Semua Lead
- Laporan Deal
- Laporan Lost
- Laporan Sales
- Laporan Cabang
- Export Excel

Laporan menggunakan data dari seluruh modul transaksi.

---

# Tahap 9 - Pengaturan

Status

⬜ Belum Dimulai

Pekerjaan

- Profil User
- Ubah Password
- Pengaturan Aplikasi

---

# Tahap 10 - Audit Log

Status

⬜ Belum Dimulai

Pekerjaan

- Riwayat Login
- Riwayat Aktivitas
- Riwayat Perubahan Data

Audit Log digunakan untuk kebutuhan monitoring dan pelacakan aktivitas pengguna.

---

# Tahap 11 - Optimasi

Status

⬜ Belum Dimulai

Pekerjaan

- Optimasi Query Database
- Optimasi Route Handler
- Optimasi React Query
- Optimasi Loading
- Optimasi UI
- Optimasi Build
- Optimasi Performa

---

# Tahap 12 - Testing

Status

⬜ Belum Dimulai

Pekerjaan

- Pengujian Authentication
- Pengujian Hak Akses
- Pengujian Master Data
- Pengujian Customer
- Pengujian Lead
- Pengujian Follow Up
- Pengujian Penawaran
- Pengujian Deal
- Pengujian Lost
- Pengujian Dashboard
- Pengujian Laporan

Seluruh modul harus lulus pengujian sebelum masuk ke Production.

---

# Tahap 13 - Deployment

Status

⬜ Belum Dimulai

Pekerjaan

- Build Production
- Konfigurasi Environment Production
- Deploy ke Hostinger
- Deploy Database
- Pengujian Production
- Backup Awal

Deployment dilakukan setelah seluruh pengujian selesai.

---

# Aturan Pengembangan

- Kerjakan roadmap secara berurutan.
- Jangan mengerjakan tahap berikutnya sebelum tahap sebelumnya selesai.
- Seluruh implementasi wajib mengikuti Business Rules.
- Seluruh tampilan wajib mengikuti mockup pada folder `docs/reference/`.
- Jangan membuat fitur di luar roadmap tanpa persetujuan.
- Setiap tahap wajib melalui proses review dan pengujian sebelum dinyatakan selesai.

---

# Catatan

Roadmap ini merupakan acuan utama pengembangan aplikasi MAKSI.

Apabila terdapat perubahan Business Rules atau kebutuhan baru, roadmap harus diperbarui terlebih dahulu sebelum implementasi dilakukan.