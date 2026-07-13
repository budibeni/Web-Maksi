# Tabel Produk

Dokumen ini menjelaskan struktur tabel **produk**.

---

# Nama Tabel

produk

---

# Fungsi

Menyimpan seluruh data Produk yang digunakan pada Penawaran.

Produk dapat berupa:

- Mesin
- Sparepart
- Jasa

Harga Produk tidak disimpan pada tabel ini, melainkan pada tabel **harga_produk**.

---

# Struktur Tabel

| Field | Tipe Data | Panjang | Null | Default | Keterangan |
|--------|-----------|----------|------|---------|------------|
| id | BIGINT UNSIGNED | - | Tidak | AUTO_INCREMENT | Primary Key |
| kategori_produk_id | BIGINT UNSIGNED | - | Tidak | - | Relasi ke Kategori Produk |
| kode | VARCHAR | 30 | Tidak | - | Kode Produk |
| nama | VARCHAR | 200 | Tidak | - | Nama Produk |
| satuan | VARCHAR | 30 | Tidak | - | Satuan Produk |
| harga_default | DECIMAL | 18,2 | Tidak | 0 | Harga Default (Pusat) |
| aktif | TINYINT | 1 | Tidak | 1 | Status Aktif |
| dibuat_oleh | BIGINT UNSIGNED | - | Ya | NULL | ID User yang membuat data |
| dibuat_tanggal | DATETIME | - | Tidak | CURRENT_TIMESTAMP | Tanggal dibuat |
| diubah_oleh | BIGINT UNSIGNED | - | Ya | NULL | ID User terakhir yang mengubah data |
| diubah_tanggal | DATETIME | - | Ya | NULL | Tanggal terakhir diubah |

---

# Primary Key

id

---

# Foreign Key

| Field | Referensi |
|--------|-----------|
| kategori_produk_id | kategori_produk.id |

---

# Index

| Field | Nama Index |
|--------|------------|
| kode | idx_produk_kode |
| nama | idx_produk_nama |
| kategori_produk_id | idx_produk_kategori |

---

# Data Awal (Seed)

Tidak ada.

Produk ditambahkan oleh Administrator.

---

# Aturan

- Kode Produk wajib unik.
- Nama Produk wajib diisi.
- Setiap Produk wajib memiliki satu Kategori Produk.
- Harga Default wajib lebih besar atau sama dengan nol.
- Produk yang sudah digunakan pada transaksi tidak boleh dihapus.
- Apabila sudah tidak digunakan, ubah menjadi **Tidak Aktif**.
- Produk yang tidak aktif tidak dapat dipilih pada Penawaran baru.
- Perubahan Harga Default tidak memengaruhi Penawaran yang sudah pernah dibuat.

---

# Digunakan Oleh

- Harga Produk
- Penawaran
- Detail Penawaran

---

# Catatan

- Harga Cabang tidak disimpan pada tabel Produk.
- Harga Cabang disimpan pada tabel **harga_produk**.
- Seluruh perubahan data Produk wajib tercatat pada Audit Log.