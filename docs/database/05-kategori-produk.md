# Tabel Kategori Produk

Dokumen ini menjelaskan struktur tabel **kategori_produk**.

---

# Nama Tabel

kategori_produk

---

# Fungsi

Menyimpan kategori Produk yang digunakan pada Master Produk.

Kategori Produk digunakan untuk mengelompokkan Produk berdasarkan jenisnya.

---

# Struktur Tabel

| Field | Tipe Data | Panjang | Null | Default | Keterangan |
|--------|-----------|----------|------|---------|------------|
| id | BIGINT UNSIGNED | - | Tidak | AUTO_INCREMENT | Primary Key |
| kode | VARCHAR | 20 | Tidak | - | Kode Kategori |
| nama | VARCHAR | 100 | Tidak | - | Nama Kategori |
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

Tidak ada.

---

# Index

| Field | Nama Index |
|--------|------------|
| kode | idx_kategori_produk_kode |
| nama | idx_kategori_produk_nama |

---

# Data Awal (Seed)

| Kode | Nama |
|------|------|
| MSN | Mesin |
| SPR | Sparepart |
| JSA | Jasa |

---

# Aturan

- Kode wajib unik.
- Nama wajib unik.
- Kategori yang sudah digunakan Produk tidak boleh dihapus.
- Apabila sudah tidak digunakan, ubah menjadi **Tidak Aktif**.
- Kategori yang tidak aktif tidak dapat dipilih pada Master Produk.

---

# Digunakan Oleh

- Produk

---

# Catatan

- Administrator dapat menambah kategori baru apabila diperlukan.
- Seluruh perubahan data wajib tercatat pada Audit Log.