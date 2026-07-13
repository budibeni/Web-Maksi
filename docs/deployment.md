# Deployment

Dokumen ini menjelaskan standar deployment aplikasi MAKSI.

Dokumen ini menjadi acuan saat proses Development maupun Production.

---

# Environment

Aplikasi memiliki dua environment.

## Development

Digunakan selama proses pengembangan.

Environment:

- Local Computer
- Node.js
- MariaDB

---

## Production

Digunakan setelah aplikasi selesai.

Environment:

- Hostinger
- Node.js
- MySQL

---

# Development Stack

Frontend

- Next.js

Backend

- Next.js Route Handler

Database

- MariaDB

---

# Production Stack

Frontend

- Next.js

Backend

- Next.js Route Handler

Database

- MySQL

Hosting

- Hostinger

---

# Source Code

Repository menggunakan GitHub.

Branch utama

```
main
```

Branch Development

```
develop
```

Fitur baru

```
feature/nama-fitur
```

Contoh

```
feature/login

feature/dashboard

feature/lead
```

Bug Fix

```
fix/login

fix/dashboard
```

---

# Environment Variable

Seluruh konfigurasi menggunakan Environment Variable.

Contoh

```
APP_NAME=MAKSI

APP_ENV=development

APP_URL=http://localhost:3000

JWT_SECRET=

DB_HOST=

DB_PORT=

DB_DATABASE=

DB_USERNAME=

DB_PASSWORD=
```

File `.env.local` tidak boleh diupload ke GitHub.

---

# Build

Development

```
npm run dev
```

Production

```
npm run build

npm run start
```

Pastikan proses build berhasil tanpa Error maupun Warning yang penting sebelum deployment.

---

# Database

Development

MariaDB

Production

MySQL

Seluruh perubahan database harus mengikuti dokumentasi dan migration yang telah disepakati.

---

# Migration

Setiap perubahan struktur database harus melalui migration.

Dilarang mengubah struktur database secara langsung pada Production.

---

# Upload

File upload disimpan pada folder:

```
public/uploads
```

Apabila di masa depan menggunakan Cloud Storage, implementasi harus diperbarui tanpa mengubah Business Rules.

---

# Logging

Error Production harus dicatat.

Jangan menampilkan detail Error kepada pengguna.

---

# Security

Production wajib menggunakan HTTPS.

JWT Secret wajib berbeda dengan Development.

Password wajib disimpan menggunakan hash.

Jangan menyimpan password dalam bentuk plain text.

---

# Backup

Database Production harus dibackup secara berkala.

Backup minimal:

- Harian
- Mingguan
- Bulanan

---

# Git

Sebelum melakukan commit.

Pastikan:

- Tidak ada console.log()
- Tidak ada kode yang tidak digunakan.
- Tidak ada file sementara.
- Build berhasil.
- Tidak ada Error.

---

# Deployment Checklist

Sebelum deployment Production.

Pastikan:

- Build berhasil.
- Environment Variable sudah benar.
- Database sudah sesuai.
- Migration sudah dijalankan.
- Seluruh fitur telah diuji.
- Login berhasil.
- Dashboard berjalan.
- Lead berjalan.
- Penawaran berjalan.
- Laporan berjalan.

---

# Prinsip Deployment

Deployment tidak boleh dilakukan langsung pada Production tanpa pengujian.

Seluruh perubahan harus melalui proses Development terlebih dahulu.

---

Dokumen ini menjadi standar deployment aplikasi MAKSI.