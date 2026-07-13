# Database Design

Dokumen ini menjelaskan rancangan database aplikasi MAKSI.

Seluruh tabel, relasi, dan field harus mengikuti dokumen ini.

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

- branch
- role
- user
- customer
- product
- product_category

## Transaksi

- lead
- lead_activity
- quotation
- quotation_detail
- reminder

## Sistem

- audit_log

---

# Relasi Antar Tabel

branch
│
└── user

customer
│
└── lead

user
│
└── lead

lead
│
├── lead_activity
├── quotation
└── reminder

quotation
│
└── quotation_detail

product_category
│
└── product

---

# Standar Primary Key

Seluruh tabel menggunakan:

id

Tipe

BIGINT UNSIGNED

Auto Increment

Ya

---

# Standar Timestamp

Seluruh tabel memiliki:

created_at

updated_at

Apabila diperlukan:

deleted_at

Soft Delete digunakan untuk data tertentu.

---

# Penamaan Field

Primary Key

id

Foreign Key

branch_id

customer_id

user_id

lead_id

quotation_id

product_id

Boolean

is_active

is_deleted

Tanggal

created_at

updated_at

deleted_at

---

# Penamaan Tabel

Gunakan huruf kecil.

Gunakan underscore.

Contoh

customer

lead_activity

quotation_detail

audit_log

---

# Aturan Relasi

Semua relasi menggunakan Foreign Key.

Dilarang menyimpan ID tanpa relasi.

---

# Soft Delete

Gunakan Soft Delete untuk:

- Customer
- Product
- User

Jangan menggunakan Soft Delete untuk:

- Lead Activity
- Audit Log

---

# Audit

Seluruh transaksi penting harus dapat ditelusuri melalui Audit Log.

Minimal meliputi:

- Login
- Logout
- Tambah
- Ubah
- Hapus
- Deal
- Lost

---

# Standar Penamaan Index

Gunakan format:

idx_namatabel_field

Contoh

idx_customer_phone

idx_lead_status

---

# Catatan

Dokumen ini hanya menjelaskan desain database.

Detail masing-masing tabel akan dijelaskan pada dokumen tersendiri apabila diperlukan.