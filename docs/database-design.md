# Database Design

Dokumen ini menjelaskan standar desain database aplikasi MAKSI.

Seluruh tabel, relasi, field, dan implementasi database wajib mengikuti dokumen ini.

---

# Database

Nama Database

maksi

Database Engine

MariaDB (Development)

MySQL (Production)

Character Set

utf8mb4

Collation

utf8mb4_unicode_ci

Timezone

Asia/Jakarta

---

# Daftar Tabel

## Master

- tb_role
- tb_cabang
- tb_user
- tb_customer
- tb_kategori_produk
- tb_produk
- tb_harga_produk
- tb_alasan_lost
- tb_hasil_interaksi

## Transaksi

- tb_lead
- tb_aktivitas_lead
- tb_versi_penawaran
- tb_detail_penawaran
- tb_pengingat

## Sistem

- tb_audit_log

---

# Relasi Antar Tabel

tb_cabang
│
└── tb_user

tb_role
│
└── tb_user

tb_customer
│
└── tb_lead

tb_user
│
└── tb_lead

tb_lead
│
├── tb_aktivitas_lead
├── tb_versi_penawaran
└── tb_pengingat

tb_versi_penawaran
│
└── tb_detail_penawaran

tb_kategori_produk
│
└── tb_produk

tb_produk
│
└── tb_harga_produk

---

# Standar Primary Key

Seluruh tabel menggunakan field:

id

Tipe Data

BIGINT UNSIGNED

Auto Increment

Ya

---

# Standar Audit Data

Seluruh tabel wajib memiliki field berikut:

| Field | Tipe Data | Keterangan |
|--------|-----------|------------|
| dibuat_oleh | BIGINT UNSIGNED | ID User yang membuat data |
| dibuat_tanggal | DATETIME | Tanggal dan waktu data dibuat |
| diubah_oleh | BIGINT UNSIGNED | ID User terakhir yang mengubah data |
| diubah_tanggal | DATETIME | Tanggal dan waktu terakhir data diubah |

Seluruh nilai tanggal menggunakan zona waktu Asia/Jakarta.

---

# Standar Penamaan Field

## Primary Key

id

## Foreign Key

cabang_id

role_id

user_id

customer_id

lead_id

versi_penawaran_id

produk_id

kategori_produk_id

aktivitas_lead_id

hasil_interaksi_id

## Penanda Data Aktif

aktif

Tipe Data

TINYINT(1)

Nilai

- 1 = Aktif
- 0 = Tidak Aktif

Field **aktif** hanya digunakan pada tabel Master.

Tabel transaksi tidak menggunakan field **aktif**.

---

# Standar Penamaan Tabel

Seluruh tabel wajib:

- Menggunakan huruf kecil.
- Menggunakan underscore (_).
- Menggunakan prefix **tb_**.
- Menggunakan nama yang jelas dan konsisten.

Contoh:

tb_user

tb_customer

tb_lead

tb_versi_penawaran

tb_detail_penawaran

tb_audit_log

Dokumen pada folder `docs/database/` menggunakan nama tanpa prefix agar lebih mudah dibaca.

Namun implementasi database, migration, query, model, foreign key, maupun SQL wajib menggunakan nama tabel yang diawali **tb_**.

---

# Aturan Relasi

- Seluruh relasi wajib menggunakan Foreign Key.
- Dilarang menyimpan ID tanpa relasi.
- Seluruh Foreign Key wajib memiliki Index.

---

# Aturan Penghapusan Data

## Data Master

Data Master yang belum pernah digunakan pada transaksi dapat dihapus.

Data Master yang sudah digunakan pada transaksi tidak boleh dihapus.

Apabila sudah tidak digunakan lagi, ubah nilai field **aktif** menjadi **0 (Tidak Aktif)**.

## Data Transaksi

Data transaksi tidak boleh dihapus karena merupakan histori proses bisnis.

---

# Audit Log

Seluruh aktivitas penting wajib tercatat pada Audit Log.

Minimal meliputi:

- Login
- Logout
- Tambah Data
- Ubah Data
- Hapus Data
- Deal
- Lost

---

# Standar Penamaan Index

Gunakan format:

idx_namatabel_field

Contoh:

idx_customer_nomor_hp

idx_lead_customer

idx_lead_user

idx_versi_penawaran_lead

---

# Prinsip Snapshot Data

Seluruh data yang ditampilkan pada dokumen transaksi wajib disimpan sebagai Snapshot pada saat transaksi dibuat.

Snapshot digunakan agar histori transaksi tidak berubah meskipun Master Data mengalami perubahan.

Perubahan Master Data tidak boleh mengubah transaksi yang telah disimpan.

---

## Snapshot Header Penawaran

Disimpan pada tabel **tb_versi_penawaran**.

Meliputi:

- Nama Customer
- Nomor Telepon Customer
- Alamat Customer
- Nama Sales
- Nama Cabang

---

## Snapshot Detail Penawaran

Disimpan pada tabel **tb_detail_penawaran**.

Meliputi:

- Kategori Produk
- Kode Produk
- Nama Produk
- Satuan
- Harga
- Diskon
- Qty
- Subtotal

---

## Snapshot Lead

Disimpan pada tabel **tb_lead**.

Meliputi:

- Nama Alasan Lost

---

## Snapshot Aktivitas Lead

Disimpan pada tabel **tb_aktivitas_lead**.

Meliputi:

- Nama Hasil Interaksi

---

# Prinsip Histori Transaksi

Seluruh transaksi merupakan histori permanen.

Data transaksi yang telah disimpan tidak boleh diubah.

Apabila terjadi perubahan proses bisnis, sistem membuat transaksi baru, bukan mengubah transaksi lama.

Contoh:

- Revisi Penawaran membuat Versi Penawaran baru.
- Aktivitas Lead tidak dapat diubah.
- Deal tidak dapat diubah.
- Lost tidak dapat diubah.

---

# Catatan

Dokumen ini menjelaskan standar desain database aplikasi MAKSI.

Detail struktur masing-masing tabel dijelaskan pada folder:

```
docs/database/
```

Seluruh implementasi database wajib mengikuti dokumentasi pada folder tersebut.