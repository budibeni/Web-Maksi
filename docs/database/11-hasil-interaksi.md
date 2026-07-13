# Tabel Hasil Interaksi

Dokumen ini menjelaskan struktur tabel **hasil_interaksi**.

---

# Nama Tabel

hasil_interaksi

---

# Fungsi

Menyimpan daftar Hasil Interaksi yang dapat dipilih oleh Sales saat menambahkan Aktivitas Lead.

Hasil Interaksi digunakan sebagai acuan sistem untuk memperbarui Fase Lead secara otomatis.

Administrator dapat menambah, mengubah, maupun menonaktifkan Hasil Interaksi sesuai kebutuhan perusahaan.

---

# Struktur Tabel

| Field | Tipe Data | Panjang | Null | Default | Keterangan |
|--------|-----------|----------|------|---------|------------|
| id | BIGINT UNSIGNED | - | Tidak | AUTO_INCREMENT | Primary Key |
| kode | VARCHAR | 30 | Tidak | - | Kode Hasil Interaksi |
| nama | VARCHAR | 150 | Tidak | - | Nama Hasil Interaksi |
| fase_lead | ENUM('LEAD_BARU','FOLLOW_UP','PENAWARAN') | - | Tidak | - | Fase Lead setelah Aktivitas disimpan |
| urutan | INT | - | Tidak | 0 | Urutan tampilan |
| warna | VARCHAR | 20 | Ya | NULL | Warna Badge pada tampilan |
| ikon | VARCHAR | 50 | Ya | NULL | Ikon (Opsional) |
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

# Unique Key

| Field |
|--------|
| kode |
| nama |

---

# Index

| Field | Nama Index |
|--------|------------|
| kode | idx_hasil_interaksi_kode |
| nama | idx_hasil_interaksi_nama |
| fase_lead | idx_hasil_interaksi_fase |
| aktif | idx_hasil_interaksi_aktif |

---

# Snapshot Data

Tidak ada.

Tabel ini merupakan Master Data.

Saat Aktivitas Lead disimpan, sistem akan menyalin Nama Hasil Interaksi ke tabel **aktivitas_lead** sebagai histori transaksi.

---

# Data Awal (Seed)

| Urutan | Kode | Nama | Fase Lead |
|--------:|------|-------------------------|------------|
| 1 | TANYA | Hanya tanya-tanya | LEAD_BARU |
| 2 | TUNGGU | Menunggu keputusan | FOLLOW_UP |
| 3 | PENAWARAN | Minta penawaran | PENAWARAN |
| 4 | SIAP | Siap membeli | PENAWARAN |
| 5 | TIDAK_MINAT | Tidak berminat | FOLLOW_UP |
| 6 | KOMPETITOR | Membeli di kompetitor | FOLLOW_UP |

---

# Aturan Bisnis

- Kode wajib unik.
- Nama wajib unik.
- Setiap Hasil Interaksi wajib memiliki Fase Lead.
- Administrator dapat menambah Hasil Interaksi baru.
- Administrator dapat mengubah Nama Hasil Interaksi.
- Administrator dapat mengubah Fase Lead yang terkait.
- Administrator dapat mengubah Urutan tampilan.
- Hasil Interaksi yang sudah digunakan pada transaksi tidak boleh dihapus.
- Apabila sudah tidak digunakan, ubah menjadi **Tidak Aktif**.
- Hasil Interaksi yang tidak aktif tidak dapat dipilih pada Aktivitas Lead baru.

---

# Digunakan Oleh

- Aktivitas Lead
- Lead
- Dashboard
- Laporan

---

# Catatan

- Hasil Interaksi merupakan Master Data.
- Sales tidak dapat mengubah daftar Hasil Interaksi.
- Sales hanya memilih Hasil Interaksi yang tersedia.
- Setelah Aktivitas Lead disimpan, sistem otomatis memperbarui Fase Lead sesuai konfigurasi pada tabel ini.
- Perubahan pada Master Hasil Interaksi tidak memengaruhi histori Aktivitas Lead yang sudah tersimpan karena Nama Hasil Interaksi disimpan sebagai Snapshot pada tabel **aktivitas_lead**.