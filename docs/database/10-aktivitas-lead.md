# Tabel Aktivitas Lead

Dokumen ini menjelaskan struktur tabel **aktivitas_lead**.

---

# Nama Tabel

aktivitas_lead

---

# Fungsi

Menyimpan seluruh riwayat aktivitas Sales terhadap Lead.

Setiap aktivitas menjadi histori proses penjualan dan ditampilkan pada Timeline Detail Lead.

Aktivitas Lead tidak dapat diubah maupun dihapus setelah disimpan.

---

# Struktur Tabel

| Field | Tipe Data | Panjang | Null | Default | Keterangan |
|--------|-----------|----------|------|---------|------------|
| id | BIGINT UNSIGNED | - | Tidak | AUTO_INCREMENT | Primary Key |
| lead_id | BIGINT UNSIGNED | - | Tidak | - | Relasi ke Lead |
| user_id | BIGINT UNSIGNED | - | Tidak | - | Sales yang melakukan aktivitas |
| hasil_interaksi_id | BIGINT UNSIGNED | - | Tidak | - | Relasi ke Master Hasil Interaksi |
| hasil_interaksi | VARCHAR | 150 | Tidak | - | Snapshot Nama Hasil Interaksi |
| catatan | TEXT | - | Ya | NULL | Catatan aktivitas |
| dibuat_oleh | BIGINT UNSIGNED | - | Ya | NULL | ID User yang membuat data |
| dibuat_tanggal | DATETIME | - | Tidak | CURRENT_TIMESTAMP | Tanggal dan waktu aktivitas dibuat |
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
| user_id | user.id |
| hasil_interaksi_id | hasil_interaksi.id |

---

# Unique Key

Tidak ada.

---

# Index

| Field | Nama Index |
|--------|------------|
| lead_id | idx_aktivitas_lead_lead |
| user_id | idx_aktivitas_lead_user |
| hasil_interaksi_id | idx_aktivitas_lead_hasil_interaksi |
| dibuat_tanggal | idx_aktivitas_lead_tanggal |

---

# Snapshot Data

Saat Aktivitas Lead disimpan, sistem menyalin data berikut dari Master Hasil Interaksi:

- Nama Hasil Interaksi

Snapshot disimpan pada field:

- hasil_interaksi

Perubahan pada Master Hasil Interaksi tidak mengubah histori Aktivitas Lead.

---

# Data Awal (Seed)

Tidak ada.

---

# Aturan Bisnis

- Satu Lead dapat memiliki banyak Aktivitas Lead.
- Setiap Aktivitas wajib memilih satu Hasil Interaksi.
- Catatan bersifat opsional.
- Aktivitas tidak boleh diubah setelah disimpan.
- Aktivitas tidak boleh dihapus.
- Setiap Aktivitas otomatis tampil pada Timeline Lead.
- Setelah Aktivitas disimpan, sistem memperbarui Fase Lead sesuai konfigurasi pada Master Hasil Interaksi.
- Aktivitas dapat membuat Pengingat baru.
- Apabila terdapat Pengingat aktif, maka Pengingat tersebut otomatis diselesaikan saat Aktivitas baru disimpan.
- Seluruh Aktivitas Lead menjadi histori permanen.

---

# Digunakan Oleh

- Lead
- Pengingat
- Dashboard
- Laporan

---

# Catatan

- Aktivitas Lead merupakan histori permanen.
- Timeline Lead diurutkan berdasarkan tanggal aktivitas.
- Sales tidak dapat mengubah Fase Lead secara manual.
- Fase Lead ditentukan otomatis berdasarkan Master Hasil Interaksi.
- Nama Hasil Interaksi disimpan sebagai Snapshot agar histori tetap konsisten meskipun Master Hasil Interaksi mengalami perubahan.