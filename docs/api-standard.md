# API Standard

Dokumen ini menjelaskan standar pembuatan Route Handler pada aplikasi MAKSI.

Seluruh komunikasi antara Frontend dan Database menggunakan Route Handler bawaan Next.js.

---

# Prinsip Utama

- Menggunakan Next.js App Router.
- Seluruh endpoint berada pada folder `src/app/api`.
- Seluruh request dan response menggunakan format JSON.
- Seluruh endpoint wajib mengikuti Business Rules.
- Jangan membuat endpoint di luar standar tanpa persetujuan.

---

# Struktur API

```
src/
└── app/
    └── api/
        ├── auth/
        ├── dashboard/
        ├── pengguna/
        ├── customer/
        ├── lead/
        ├── penawaran/
        ├── pengingat/
        ├── produk/
        ├── cabang/
        ├── role/
        ├── alasan-lost/
        └── laporan/
```

---

# Penamaan Endpoint

Gunakan nama resource sesuai nama tabel.

Contoh

```
/api/pengguna

/api/customer

/api/lead

/api/penawaran

/api/pengingat

/api/produk
```

Gunakan nama yang konsisten.

---

# Route Handler

## Collection

```
GET    /api/lead

POST   /api/lead
```

## Single Data

```
GET    /api/lead/[id]

PUT    /api/lead/[id]

DELETE /api/lead/[id]
```

---

# Business Action

Gunakan endpoint khusus untuk proses bisnis.

Contoh

```
POST /api/lead/deal

POST /api/lead/lost

POST /api/penawaran/revisi

POST /api/pengingat/selesai
```

Jangan memaksakan seluruh proses bisnis menggunakan operasi CRUD.

---

# Format Response

Seluruh Route Handler wajib menggunakan format berikut.

## Berhasil

```json
{
    "success": true,
    "message": "Data berhasil diproses.",
    "data": {}
}
```

---

## Berhasil (List)

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

---

## Gagal

```json
{
    "success": false,
    "message": "Data tidak ditemukan."
}
```

---

## Validasi Gagal

```json
{
    "success": false,
    "message": "Validasi gagal.",
    "errors": {
        "customer": [
            "Customer wajib diisi."
        ]
    }
}
```

---

# Status Code

| Status | Keterangan |
|---------|------------|
| 200 | Request berhasil |
| 201 | Data berhasil dibuat |
| 400 | Request tidak valid |
| 401 | Belum login |
| 403 | Tidak memiliki hak akses |
| 404 | Data tidak ditemukan |
| 422 | Validasi gagal |
| 500 | Terjadi kesalahan pada server |

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

Seluruh validasi utama dilakukan pada Route Handler.

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
GET /api/lead?page=1&limit=20&search=mesin
```

---

# Audit Log

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

Komponen React tidak boleh memanggil Route Handler secara langsung.

Seluruh komunikasi API harus melalui Service Layer.

Contoh

```
Halaman Dashboard

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

Komponen tidak diperbolehkan menggunakan `fetch()` secara langsung.

Gunakan Axios Instance.

---

# Axios

Seluruh request menggunakan Axios Instance yang berada pada:

```
src/config/axios.js
```

Dilarang membuat lebih dari satu konfigurasi Axios.

---

# Pesan Response

Seluruh pesan menggunakan Bahasa Indonesia.

Contoh

- Data berhasil disimpan.
- Data berhasil diubah.
- Data berhasil dihapus.
- Data berhasil diproses.
- Data tidak ditemukan.
- Anda tidak memiliki hak akses.
- Validasi gagal.

---

# Prinsip Pengembangan

- Gunakan Route Handler bawaan Next.js.
- Gunakan React Query.
- Gunakan Axios Instance.
- Gunakan Service Layer.
- Jangan membuat endpoint yang memiliki fungsi sama.
- Jangan mengubah format response.
- Jangan melakukan query database langsung dari Komponen React.
- Seluruh implementasi wajib mengikuti Business Rules.

---

Dokumen ini menjadi standar utama dalam pengembangan Route Handler pada aplikasi MAKSI.