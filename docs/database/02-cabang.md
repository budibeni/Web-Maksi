# Tabel Cabang

Dokumen ini menjelaskan struktur tabel **cabang**.

---

# Nama Tabel

cabang

---

# Fungsi

Menyimpan data seluruh cabang Maksindo.

Data Cabang digunakan untuk:

- User
- Lead
- Penawaran
- Dashboard
- Laporan

Seluruh transaksi selalu berasal dari satu Cabang.

---

# Struktur Tabel

| Field | Tipe Data | Panjang | Null | Default | Keterangan |
|--------|-----------|----------|------|---------|------------|
| id | BIGINT UNSIGNED | - | Tidak | AUTO_INCREMENT | Primary Key |
| kode | VARCHAR | 20 | Tidak | - | Kode Cabang |
| nama | VARCHAR | 150 | Tidak | - | Nama Cabang |
| alamat | TEXT | - | Ya | NULL | Alamat Cabang |
| telepon | VARCHAR | 30 | Ya | NULL | Nomor Telepon |
| aktif | TINYINT | 1 | Tidak | 1 | Status aktif Cabang |
| dibuat_oleh | BIGINT UNSIGNED | - | Ya | NULL | User yang membuat data |
| dibuat_tanggal | DATETIME | - | Tidak | CURRENT_TIMESTAMP | Tanggal dibuat |
| diubah_oleh | BIGINT UNSIGNED | - | Ya | NULL | User terakhir yang mengubah |
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
| kode | idx_cabang_kode |
| nama | idx_cabang_nama |

---

# Data Awal (Seed)

Tidak ada.

Cabang ditambahkan sesuai kebutuhan perusahaan.

---

# Aturan

- Kode Cabang harus unik.
- Nama Cabang harus unik.
- Cabang dapat diubah oleh Administrator.
- Cabang yang sudah digunakan oleh User atau transaksi tidak boleh dihapus.
- Cabang yang sudah tidak digunakan diubah menjadi **Tidak Aktif**.
- Cabang yang tidak aktif tidak dapat dipilih pada data baru.
- Data transaksi lama tetap menggunakan Cabang yang sama meskipun Cabang sudah tidak aktif.

---

# Digunakan Oleh

- User
- Lead
- Penawaran
- Dashboard
- Laporan