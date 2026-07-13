# Development Flow

Dokumen ini menjelaskan urutan pengerjaan setiap modul pada aplikasi MAKSI.

Seluruh modul wajib mengikuti alur pengembangan berikut.

---

# Urutan Pengembangan

Setiap modul dikerjakan dengan urutan:

1. Database
2. Backend
3. Middleware (jika diperlukan)
4. Frontend
5. Testing
6. Review
7. Commit

Tahap berikutnya tidak boleh dikerjakan sebelum tahap sebelumnya selesai.

---

# 1. Database

Tahap ini meliputi:

- Membuat tabel
- Membuat relasi tabel
- Membuat index
- Membuat foreign key
- Membuat data awal (seed) apabila diperlukan

Belum membuat API maupun halaman.

---

# 2. Backend

Tahap ini meliputi:

- Membuat Route Handler (`app/api`)
- Validasi request
- Query Database
- Response API
- Penanganan Error

Belum membuat halaman.

---

# 3. Middleware

Tahap ini hanya dibuat apabila diperlukan.

Contoh:

- Authentication
- Authorization
- Validasi Role
- Validasi Session

---

# 4. Frontend

Tahap ini meliputi:

- Membuat halaman
- Membuat form
- Integrasi API
- Validasi form
- Loading
- Error Handling

Seluruh tampilan wajib mengikuti mockup.

---

# 5. Testing

Melakukan pengujian terhadap:

- Validasi
- Hak akses
- Alur bisnis
- Integrasi API

---

# 6. Review

Memastikan:

- Business Rules sudah sesuai.
- UI sesuai mockup.
- API sesuai standar.
- Tidak ada kode duplikat.
- Tidak ada error.

---

# 7. Commit

Apabila seluruh tahapan telah selesai:

- Commit ke Git.
- Lanjut ke modul berikutnya.

---

# Aturan

- Jangan membuat Frontend sebelum Backend selesai.
- Jangan membuat Backend sebelum Database selesai.
- Jangan mengubah Business Rules tanpa persetujuan.
- Jangan mengubah struktur Database tanpa memperbarui `database-design.md`.
- Seluruh implementasi wajib mengikuti dokumentasi proyek.
