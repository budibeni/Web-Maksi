# API Standard

Dokumen ini menjelaskan standar pembuatan Route Handler pada aplikasi MAKSI.

Seluruh komunikasi antara Frontend dan Database menggunakan Route Handler bawaan Next.js.

---

# Prinsip Utama

- Menggunakan Next.js App Router.
- Seluruh endpoint berada pada folder `src/app/api`.
- Seluruh request menggunakan format JSON.
- Semua endpoint harus mengikuti Business Rules.
- Jangan membuat endpoint di luar standar tanpa persetujuan.

---

# Struktur API

```
src/
└── app/
    └── api/
        ├── auth/
        ├── dashboard/
        ├── users/
        ├── customers/
        ├── leads/
        ├── quotations/
        ├── reminders/
        ├── products/
        └── reports/
```

---

# Penamaan Endpoint

Gunakan bentuk jamak.

Benar

```
/api/users

/api/customers

/api/leads

/api/products
```

Salah

```
/api/user

/api/customer

/api/lead
```

---

# Route Handler

Collection

```
GET    /api/leads

POST   /api/leads
```

Single Data

```
GET    /api/leads/[id]

PUT    /api/leads/[id]

DELETE /api/leads/[id]
```

---

# Business Action

Untuk proses bisnis gunakan endpoint khusus.

Contoh

```
POST /api/leads/deal

POST /api/leads/lost

POST /api/quotations/revision

POST /api/reminders/complete
```

Jangan memaksakan seluruh proses bisnis menggunakan CRUD.

---

# Format Response

Semua Route Handler wajib menggunakan format berikut.

Success

```json
{
    "success": true,
    "message": "Data berhasil diproses.",
    "data": {}
}
```

Success List

```json
{
    "success": true,
    "message": "Data berhasil diambil.",
    "data": [],
    "pagination": {
        "page": 1,
        "limit": 20,
        "total": 120,
        "totalPage": 6
    }
}
```

Error

```json
{
    "success": false,
    "message": "Data tidak ditemukan."
}
```

Validation Error

```json
{
    "success": false,
    "message": "Validasi gagal.",
    "errors": {
        "customerName": [
            "Nama customer wajib diisi."
        ]
    }
}
```

---

# Status Code

200

Request berhasil.

201

Data berhasil dibuat.

400

Request tidak valid.

401

Belum login.

403

Tidak memiliki hak akses.

404

Data tidak ditemukan.

422

Validasi gagal.

500

Terjadi kesalahan server.

---

# Authentication

Menggunakan JWT.

Authorization Header

```
Authorization: Bearer {token}
```

Seluruh endpoint selain Login wajib melakukan validasi token.

---

# Validasi

Seluruh validasi utama dilakukan di Route Handler.

Frontend hanya membantu validasi untuk meningkatkan pengalaman pengguna.

---

# Pagination

Standar Query

```
?page=1

&limit=20

&search=

&sort=id

&order=asc
```

Contoh

```
GET /api/leads?page=1&limit=20&search=mesin
```

---

# Logging

Aktivitas berikut wajib dicatat pada Audit Log.

- Login
- Logout
- Tambah Data
- Ubah Data
- Hapus Data
- Deal
- Lost

---

# Service Layer

Component dilarang memanggil Route Handler secara langsung.

Gunakan Service.

Contoh

```
Dashboard Page

↓

useDashboard()

↓

dashboard.service.js

↓

/api/dashboard
```

---

# React Query

Seluruh komunikasi data menggunakan React Query.

Component tidak diperbolehkan menggunakan fetch() secara langsung.

Gunakan Axios Instance.

---

# Axios

Seluruh request menggunakan Axios Instance yang berada pada:

```
src/config/axios.js
```

Dilarang membuat konfigurasi Axios lebih dari satu.

---

# Error Message

Gunakan Bahasa Indonesia.

Contoh

- Data berhasil disimpan.
- Data berhasil diubah.
- Data berhasil dihapus.
- Data tidak ditemukan.
- Anda tidak memiliki hak akses.

---

# Prinsip Pengembangan

- Gunakan Route Handler bawaan Next.js.
- Gunakan React Query.
- Gunakan Axios Instance.
- Jangan membuat endpoint duplikat.
- Jangan mengubah format response.
- Ikuti Business Rules.
- Selalu gunakan Service Layer.
- Jangan melakukan query database langsung dari Component.

---

Dokumen ini menjadi standar utama dalam pengembangan Route Handler pada aplikasi MAKSI.