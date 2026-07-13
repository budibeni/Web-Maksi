# Tabel Harga Produk

Dokumen ini menjelaskan struktur tabel **harga_produk**.

---

# Nama Tabel

harga_produk

---

# Fungsi

Menyimpan harga khusus Produk untuk Cabang tertentu.

Apabila suatu Produk tidak memiliki harga pada Cabang tertentu, maka sistem menggunakan **Harga Default** dari tabel Produk.

---

# Struktur Tabel

| Field | Tipe Data | Panjang | Null | Default | Keterangan |
|--------|-----------|----------|------|---------|------------|
| id | BIGINT UNSIGNED | - | Tidak | AUTO_INCREMENT | Primary Key |
| produk_id | BIGINT UNSIGNED | - | Tidak | - | Relasi ke Produk |
| cabang_id | BIGINT UNSIGNED | - | Tidak | - | Relasi ke Cabang |
| harga | DECIMAL | 18,2 | Tidak | 0 | Harga Cabang |
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
| produk_id | produk.id |
| cabang_id | cabang.id |

---

# Index

| Field | Nama Index |
|--------|------------|
| produk_id | idx_harga_produk_produk |
| cabang_id | idx_harga_produk_cabang |

---

# Unique Key

Satu Produk hanya boleh memiliki satu harga untuk setiap Cabang.

```
UNIQUE (produk_id, cabang_id)
```

---

# Data Awal (Seed)

Tidak ada.

Data dibuat apabila suatu Cabang memiliki harga yang berbeda dari Harga Default.

---

# Aturan

- Harga wajib lebih besar atau sama dengan nol.
- Kombinasi Produk dan Cabang tidak boleh sama.
- Harga pada tabel ini merupakan pengecualian terhadap Harga Default.
- Apabila data Harga Produk dihapus, sistem otomatis kembali menggunakan Harga Default.

---

# Digunakan Oleh

- Penawaran
- Detail Penawaran

---

# Catatan

Saat membuat Penawaran, sistem menentukan harga dengan urutan berikut:

1. Cari Harga Produk berdasarkan Cabang.
2. Apabila ditemukan, gunakan Harga Cabang.
3. Apabila tidak ditemukan, gunakan Harga Default dari tabel Produk.