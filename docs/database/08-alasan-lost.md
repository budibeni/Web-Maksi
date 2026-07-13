# Tabel Alasan Lost

Dokumen ini menjelaskan struktur tabel **alasan_lost**.

---

# Nama Tabel

alasan_lost

---

# Fungsi

Menyimpan daftar alasan Lost yang dapat dipilih saat Lead dinyatakan LOST.

Administrator dapat menambah, mengubah, atau menonaktifkan Alasan Lost sesuai kebutuhan perusahaan.

---

# Struktur Tabel

| Field | Tipe Data | Panjang | Null | Default | Keterangan |
|--------|-----------|----------|------|---------|------------|
| id | BIGINT UNSIGNED | - | Tidak | AUTO_INCREMENT | Primary Key |
| kode | VARCHAR | 20 | Tidak | - | Kode Alasan Lost |
| nama | VARCHAR | 150 | Tidak | - | Nama Alasan Lost |
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
| kode | idx_alasan_lost_kode |
| nama | idx_alasan_lost_nama |

---

# Data Awal (Seed)

| Kode | Nama |
|------|------|
| HRG | Harga Tidak Cocok |
| STK | Barang Tidak Tersedia |
| KPT | Membeli di Kompetitor |
| TDK | Tidak Berminat |
| HUB | Tidak Dapat Dihubungi |
| LYN | Layanan Tidak Sesuai |
| LNN | Lainnya |

Data awal dapat disesuaikan oleh Administrator.

---

# Aturan

- Kode wajib unik.
- Nama wajib unik.
- Alasan Lost yang sudah digunakan pada transaksi tidak boleh dihapus.
- Apabila sudah tidak digunakan, ubah menjadi **Tidak Aktif**.
- Alasan Lost yang tidak aktif tidak dapat dipilih pada transaksi baru.

---

# Digunakan Oleh

- Lead (Proses Lost)

---

# Catatan

- Alasan Lost hanya digunakan saat Status Lead berubah menjadi LOST.
- Seluruh perubahan data wajib tercatat pada Audit Log.