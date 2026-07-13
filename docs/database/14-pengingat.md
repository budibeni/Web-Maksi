# Tabel Pengingat

Dokumen ini menjelaskan struktur tabel **pengingat**.

---

# Nama Tabel

pengingat

---

# Fungsi

Menyimpan jadwal Pengingat yang dibuat dari Aktivitas Lead.

Pengingat digunakan untuk mengingatkan Sales agar melakukan tindak lanjut kepada Customer pada waktu yang telah ditentukan.

Setiap Pengingat menjadi bagian dari histori Lead.

---

# Struktur Tabel

| Field | Tipe Data | Panjang | Null | Default | Keterangan |
|--------|-----------|----------|------|---------|------------|
| id | BIGINT UNSIGNED | - | Tidak | AUTO_INCREMENT | Primary Key |
| lead_id | BIGINT UNSIGNED | - | Tidak | - | Relasi ke Lead |
| aktivitas_lead_id | BIGINT UNSIGNED | - | Tidak | - | Relasi ke Aktivitas Lead yang membuat Pengingat |
| tanggal_pengingat | DATETIME | - | Tidak | - | Tanggal dan waktu Pengingat |
| catatan | TEXT | - | Ya | NULL | Catatan Pengingat |
| status | ENUM('AKTIF','SELESAI') | - | Tidak | AKTIF | Status Pengingat |
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
| lead_id | lead.id |
| aktivitas_lead_id | aktivitas_lead.id |

---

# Unique Key

Tidak ada.

---

# Index

| Field | Nama Index |
|--------|------------|
| lead_id | idx_pengingat_lead |
| aktivitas_lead_id | idx_pengingat_aktivitas_lead |
| status | idx_pengingat_status |
| tanggal_pengingat | idx_pengingat_tanggal |

---

# Snapshot Data

Tidak ada.

Pengingat selalu mengambil informasi Lead melalui relasi.

---

# Data Awal (Seed)

Tidak ada.

---

# Aturan Bisnis

- Pengingat hanya dapat dibuat dari Aktivitas Lead.
- Satu Aktivitas Lead dapat membuat paling banyak satu Pengingat.
- Satu Lead dapat memiliki banyak Pengingat.
- Hanya boleh terdapat satu Pengingat dengan status **AKTIF** pada setiap Lead.
- Saat Aktivitas Lead baru disimpan dan membuat Pengingat baru, Pengingat AKTIF sebelumnya otomatis berubah menjadi **SELESAI**.
- Saat Lead menjadi **DEAL**, seluruh Pengingat AKTIF otomatis berubah menjadi **SELESAI**.
- Saat Lead menjadi **LOST**, seluruh Pengingat AKTIF otomatis berubah menjadi **SELESAI**.
- Pengingat yang telah berstatus **SELESAI** tidak dapat diaktifkan kembali.
- Pengingat tidak boleh dihapus.
- Pengingat menjadi bagian dari histori Lead.

---

# Status Pengingat

| Status | Keterangan |
|--------|------------|
| AKTIF | Pengingat masih berlaku. |
| SELESAI | Pengingat telah selesai. |

Kondisi **Terlambat** tidak disimpan pada database.

Sistem menentukan Pengingat Terlambat apabila:

- Status = **AKTIF**
- Tanggal Pengingat lebih kecil dari tanggal dan waktu saat ini.

---

# Digunakan Oleh

- Aktivitas Lead
- Dashboard
- Laporan

---

# Catatan

- Pengingat selalu berasal dari Aktivitas Lead.
- Riwayat seluruh Pengingat tetap tersimpan.
- Pengingat Terlambat merupakan hasil perhitungan sistem, bukan nilai yang disimpan pada database.
- Dashboard hanya menampilkan Pengingat dengan status **AKTIF**, termasuk yang sudah Terlambat.