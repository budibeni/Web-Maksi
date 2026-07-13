# Tabel Detail Penawaran

Dokumen ini menjelaskan struktur tabel **detail_penawaran**.

---

# Nama Tabel

detail_penawaran

---

# Fungsi

Menyimpan daftar Produk yang terdapat pada setiap Versi Penawaran.

Seluruh informasi Produk disimpan sebagai **Snapshot** agar histori Penawaran tidak berubah meskipun Master Produk mengalami perubahan.

---

# Struktur Tabel

| Field | Tipe Data | Panjang | Null | Default | Keterangan |
|--------|-----------|----------|------|---------|------------|
| id | BIGINT UNSIGNED | - | Tidak | AUTO_INCREMENT | Primary Key |
| versi_penawaran_id | BIGINT UNSIGNED | - | Tidak | - | Relasi ke Versi Penawaran |
| produk_id | BIGINT UNSIGNED | - | Tidak | - | Relasi ke Produk |
| kategori_produk_nama | VARCHAR | 100 | Tidak | - | Snapshot Nama Kategori Produk |
| kode_produk | VARCHAR | 50 | Tidak | - | Snapshot Kode Produk |
| nama_produk | VARCHAR | 200 | Tidak | - | Snapshot Nama Produk |
| satuan | VARCHAR | 30 | Tidak | - | Snapshot Satuan |
| qty | DECIMAL | 18,2 | Tidak | 1 | Jumlah |
| harga | DECIMAL | 18,2 | Tidak | 0 | Snapshot Harga Satuan |
| diskon_persen | DECIMAL | 5,2 | Tidak | 0 | Diskon Item (%) |
| diskon_nominal | DECIMAL | 18,2 | Tidak | 0 | Diskon Item (Rp) |
| subtotal | DECIMAL | 18,2 | Tidak | 0 | Total setelah Diskon Item |
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
| versi_penawaran_id | versi_penawaran.id |
| produk_id | produk.id |

---

# Unique Key

Tidak ada.

---

# Index

| Field | Nama Index |
|--------|------------|
| versi_penawaran_id | idx_detail_penawaran_versi |
| produk_id | idx_detail_penawaran_produk |

---

# Snapshot Data

Saat Detail Penawaran dibuat, sistem menyalin informasi berikut dari Master Produk:

## Snapshot Produk

- Nama Kategori Produk
- Kode Produk
- Nama Produk
- Satuan
- Harga

Perubahan Master Produk maupun Harga Produk tidak mengubah Detail Penawaran yang telah dibuat.

---

# Data Awal (Seed)

Tidak ada.

---

# Aturan Bisnis

- Satu Versi Penawaran dapat memiliki banyak Detail Penawaran.
- Produk yang sama boleh muncul lebih dari satu kali apabila memang diperlukan.
- Harga diambil otomatis dari Master Harga Produk sesuai Cabang Lead.
- Apabila Harga Cabang tidak tersedia, sistem menggunakan Harga Default.
- Harga tidak dapat diubah secara manual.
- Sales hanya dapat memberikan Diskon Item.
- Subtotal dihitung otomatis oleh sistem.
- Detail Penawaran tidak dapat diubah setelah Versi Penawaran disimpan.
- Revisi Penawaran dibuat dengan menyalin seluruh Detail Penawaran ke Versi Penawaran baru.
- Perubahan dilakukan pada Versi Penawaran baru, bukan mengubah versi sebelumnya.

---

# Perhitungan Item

Urutan perhitungan setiap item:

1. Qty × Harga
2. Dikurangi Diskon Item
3. Menghasilkan Subtotal Item

Subtotal seluruh item dijumlahkan menjadi **Subtotal Penawaran** pada tabel **versi_penawaran**.

---

# Digunakan Oleh

- Versi Penawaran
- Dashboard
- Laporan

---

# Catatan

- Seluruh informasi Produk disimpan sebagai Snapshot.
- Riwayat Detail Penawaran tidak berubah meskipun Master Produk diperbarui.
- Dokumen Penawaran selalu menggunakan data Snapshot dari tabel ini.
- Perubahan Detail Penawaran hanya dapat dilakukan melalui pembuatan Versi Penawaran baru.
