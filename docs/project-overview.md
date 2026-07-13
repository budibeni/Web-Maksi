# MAKSI - Project Overview

## Tentang Proyek

MAKSI (Maksindo Sales Information System) adalah aplikasi CRM internal yang digunakan oleh perusahaan Maksindo untuk membantu proses pengelolaan aktivitas penjualan mulai dari Lead, Follow Up, Penawaran, hingga menghasilkan Deal atau Lost.

Aplikasi ini berfungsi sebagai pusat informasi aktivitas Sales di seluruh cabang sehingga Top Management dapat melakukan monitoring performa Sales maupun Cabang secara real-time.

---

# Tujuan Proyek

Tujuan utama pengembangan aplikasi ini adalah:

- Mengelola seluruh data Lead.
- Mencatat aktivitas Follow Up.
- Membuat dan mengelola Penawaran.
- Mencatat hasil penjualan (Deal/Lost).
- Mempermudah monitoring aktivitas Sales.
- Menyediakan Dashboard dan Laporan yang informatif.
- Menjadi sistem CRM internal yang mudah digunakan.

---

# Jenis Aplikasi

- Internal Business Application
- CRM (Customer Relationship Management)
- Web Application

---

# Pengguna Aplikasi

Aplikasi digunakan oleh beberapa jenis pengguna:

- Administrator
- Top Management
- Branch Manager
- Sales

Setiap pengguna memiliki hak akses sesuai perannya.

---

# Teknologi yang Digunakan

## Frontend

- Next.js (App Router)
- React
- JavaScript
- Tailwind CSS

## Data Fetching

- Axios
- React Query

## State Management

- Zustand

## Authentication

- JWT
- js-cookie

## Database

- MariaDB (Development)
- MySQL (Production)

---

# Gaya Desain

Aplikasi menggunakan desain modern dengan karakteristik:

- Bersih
- Profesional
- Minimalis
- Cepat digunakan
- Mudah dipahami oleh pengguna

Fokus utama aplikasi adalah produktivitas, bukan tampilan yang berlebihan.

---

# Modul Utama

Modul yang akan dikembangkan meliputi:

- Dashboard
- Lead
- Customer
- Follow Up
- Penawaran
- Deal
- Lost
- Pengingat
- Laporan
- Master Data
- User Management
- Pengaturan

---

# Prinsip Pengembangan

Selama proses pengembangan, selalu mengutamakan:

- Clean Code
- Reusable Component
- Modular Structure
- Konsistensi penamaan
- Performa aplikasi
- Kemudahan maintenance

Hindari:

- Duplikasi kode
- Duplikasi Component
- Hardcode data
- Inline Style yang berlebihan
- Logic yang berulang

---

# Aturan Untuk AI

Sebelum membuat kode, AI wajib:

1. Memahami struktur project terlebih dahulu.
2. Menggunakan Component yang sudah ada apabila memungkinkan.
3. Menggunakan Service yang sudah ada.
4. Mengikuti struktur folder project.
5. Tidak mengubah file yang tidak berkaitan.
6. Bertanya apabila kebutuhan belum jelas.

AI tidak boleh membuat implementasi yang bertentangan dengan Business Rules proyek.

---

# Target Deployment

## Development

Local Development

## Production

Hostinger

## Database Production

MySQL

---

# Status Proyek

Tahap saat ini:

Perencanaan Arsitektur dan Pengembangan Awal.

Seluruh implementasi berikutnya wajib mengikuti dokumen pada folder `docs` sebagai acuan utama.