# Implementation Rules

Dokumen ini menjelaskan standar implementasi teknis pada aplikasi MAKSI.

Seluruh Developer maupun AI wajib mengikuti aturan yang terdapat pada dokumen ini.

---

# Tujuan

Dokumen ini bertujuan menjaga konsistensi implementasi sehingga seluruh kode yang dihasilkan memiliki arsitektur yang sama.

Seluruh implementasi harus:

- Konsisten
- Modular
- Mudah dipelihara
- Mudah dikembangkan
- Mengikuti Business Rules
- Mengikuti Database Design

---

# Tech Stack

Seluruh implementasi menggunakan teknologi berikut.

| Teknologi | Standar |
|-----------|----------|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| UI Library | React |
| Styling | Tailwind CSS |
| ORM | Prisma ORM |
| Database Development | MariaDB |
| Database Production | MySQL |
| Authentication | Auth.js |
| Validation | Zod |
| HTTP Client | Axios |
| Data Fetching | TanStack Query |
| Global State | Zustand |

---

# Framework

Seluruh implementasi menggunakan Next.js App Router.

Dilarang menggunakan Pages Router.

---

# Bahasa

Seluruh kode menggunakan Bahasa Inggris.

Seluruh tampilan kepada pengguna menggunakan Bahasa Indonesia.

---

# ORM

Seluruh akses database menggunakan Prisma ORM.

Ketentuan:

- Dilarang menggunakan ORM lain.
- Seluruh perubahan struktur database menggunakan Prisma Migration.
- Seluruh Seeder menggunakan Prisma Seed.
- Query CRUD menggunakan Prisma Client.
- Query Dashboard maupun Laporan yang kompleks diperbolehkan menggunakan `prisma.$queryRaw`.

---

# Database Access

Database hanya boleh diakses melalui Service.

Component, Hook maupun Page tidak boleh mengakses database secara langsung.

---

# Route Handler

Route Handler hanya bertugas:

- Menerima Request
- Melakukan Validasi
- Memanggil Service
- Mengembalikan Response

Business Logic tidak boleh ditulis pada Route Handler.

---

# Business Logic

Seluruh Business Logic berada pada Service.

Business Logic tidak boleh berada pada:

- Component
- Page
- Route Handler

---

# Validation

Seluruh validasi menggunakan Zod.

Frontend menggunakan Zod untuk membantu pengguna.

Backend tetap melakukan validasi sebelum menyimpan data.

Dilarang membuat validasi manual apabila dapat menggunakan Zod.

---

# HTTP Client

Seluruh request HTTP menggunakan satu Axios Instance.

Axios wajib memiliki konfigurasi:

- Base URL
- Authorization
- Timeout
- Response Interceptor
- Error Interceptor

Dilarang membuat Axios Instance baru.

---

# Data Fetching

Seluruh komunikasi HTTP menggunakan TanStack Query.

Gunakan:

- useQuery
- useMutation
- invalidateQueries

Jangan memanggil Axios langsung dari Component.

---

# State Management

Gunakan:

- Zustand untuk Global State
- useState untuk Local State
- TanStack Query untuk Server State

Server State tidak boleh disimpan pada Zustand.

---

# Authentication

Seluruh autentikasi menggunakan Auth.js.

User yang belum login tidak boleh mengakses halaman yang membutuhkan autentikasi.

---

# Authorization

Hak akses mengikuti Business Rules.

Seluruh pengecekan hak akses dilakukan pada Server.

Frontend hanya digunakan untuk menyesuaikan tampilan.

---

# TypeScript

Seluruh project menggunakan TypeScript.

Dilarang menggunakan `any` kecuali benar-benar diperlukan.

Seluruh Type dan Interface diletakkan pada folder `types`.

---

# Environment Variable

Seluruh konfigurasi menggunakan Environment Variable.

Contoh:

```
DATABASE_URL

AUTH_SECRET

NEXT_PUBLIC_APP_NAME
```

Dilarang melakukan hardcode konfigurasi.

---

# Error Handling

Seluruh Error harus ditangani dengan baik.

Pesan Error kepada pengguna harus mudah dipahami.

Dilarang menampilkan Error bawaan Server kepada pengguna.

---

# Logging

Gunakan Logging untuk:

- Error
- Login
- Logout
- Exception
- Database Error

Jangan menggunakan console.log() pada Production.

---

# Database Transaction

Gunakan Prisma Transaction apabila satu proses mengubah lebih dari satu tabel.

Contoh:

- Deal Lead
- Lost Lead
- Membuat Versi Penawaran beserta Detail Penawaran

Seluruh proses harus berhasil atau seluruhnya dibatalkan.

---

# File Upload

Gunakan satu helper untuk seluruh proses Upload.

Nama file dibuat otomatis oleh sistem.

Jangan menggunakan nama file asli pengguna sebagai nama penyimpanan.

---

# Date & Time

Seluruh proses menggunakan zona waktu:

Asia/Jakarta

Seluruh penyimpanan tanggal menggunakan format database.

---

# Currency

Seluruh nominal disimpan sebagai angka.

Formatting Rupiah hanya dilakukan pada Frontend.

---

# Dashboard

Dashboard mengutamakan performa.

Gunakan Snapshot Data yang telah tersedia pada tabel transaksi.

Query Dashboard yang kompleks diperbolehkan menggunakan SQL melalui `prisma.$queryRaw`.

---

# Laporan

Laporan mengutamakan akurasi.

Gunakan Snapshot Data yang telah disimpan pada transaksi.

Jangan mengambil data histori dari Master Data.

---

# Struktur Project

Seluruh implementasi wajib mengikuti:

folder-structure.md

Dilarang membuat struktur folder baru tanpa persetujuan.

---

# Database

Seluruh implementasi wajib mengikuti:

database-design.md

Seluruh tabel wajib mengikuti dokumentasi pada folder:

```
docs/database/
```

---

# Nomor Dokumen

Seluruh penomoran dokumen wajib mengikuti:

document-numbering.md

Dilarang membuat format nomor dokumen baru.

---

# Business Rules

Seluruh implementasi wajib mengikuti:

business-rules.md

Tidak diperbolehkan membuat asumsi baru.

---

# Mockup UI

Seluruh implementasi UI wajib mengikuti Mockup.

AI tidak diperbolehkan membuat tampilan baru tanpa instruksi.

---

# Dokumentasi

Sebelum membuat fitur baru, AI maupun Developer wajib membaca:

1. project-overview.md
2. business-rules.md
3. folder-structure.md
4. database-design.md
5. document-numbering.md
6. implementation-rules.md
7. seluruh dokumen pada folder `docs/database`
8. ui-guidelines.md
9. dokumen lain yang berkaitan

---

# Larangan

Dilarang:

- Mengubah Business Rules.
- Mengubah Database Design.
- Mengubah Struktur Project.
- Mengubah Format Nomor Dokumen.
- Membuat tabel di luar dokumentasi.
- Membuat field di luar dokumentasi.
- Membuat relasi di luar dokumentasi.
- Mengakses database langsung dari Component.
- Menulis Business Logic pada Route Handler.
- Menambahkan library baru tanpa persetujuan.

---

# Prinsip AI

Sebelum menghasilkan kode, AI wajib:

- Memahami konteks project.
- Membaca seluruh dokumentasi pada folder `docs`.
- Mengikuti Business Rules.
- Mengikuti Database Design.
- Mengikuti Document Numbering.
- Mengikuti Dokumentasi Database.
- Mengikuti Mockup UI.
- Menggunakan struktur project yang telah ditentukan.
- Menjaga konsistensi implementasi.
- Tidak membuat asumsi apabila aturan belum tersedia.
- Bertanya apabila kebutuhan belum jelas.

---

Dokumen ini menjadi standar utama implementasi teknis pada aplikasi MAKSI.