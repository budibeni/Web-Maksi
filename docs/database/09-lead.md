# Tabel Lead

Dokumen ini menjelaskan struktur tabel **lead**.

---

# Nama Tabel

lead

---

# Fungsi

Menyimpan seluruh proses penjualan mulai dari Lead dibuat hingga selesai menjadi **Deal** atau **Lost**.

Lead merupakan transaksi utama pada aplikasi MAKSI.

Seluruh Aktivitas Lead, Pengingat, dan Versi Penawaran selalu terhubung dengan satu Lead.

---

# Struktur Tabel

| Field | Tipe Data | Panjang | Null | Default | Keterangan |
|--------|-----------|----------|------|---------|------------|
| id | BIGINT UNSIGNED | - | Tidak | AUTO_INCREMENT | Primary Key |
| customer_id | BIGINT UNSIGNED | - | Tidak | - | Relasi ke Customer |
| cabang_id | BIGINT UNSIGNED | - | Tidak | - | Relasi ke Cabang |
| user_id | BIGINT UNSIGNED | - | Tidak | - | Sales yang menangani Lead |
| status | TINYINT | 1 | Tidak | 1 | Status Lead |
| fase | TINYINT | 1 | Tidak | 1 | Fase Lead |
| versi_penawaran_id | BIGINT UNSIGNED | - | Ya | NULL | Versi Penawaran yang menjadi Deal |
| alasan_lost_id | BIGINT UNSIGNED | - | Ya | NULL | Alasan Lost |
| catatan_awal | TEXT | - | Ya | NULL | Catatan awal Lead |
| catatan_lost | TEXT | - | Ya | NULL | Catatan tambahan saat Lost |
| tanggal_deal | DATETIME | - | Ya | NULL | Tanggal Deal |
| tanggal_lost | DATETIME | - | Ya | NULL | Tanggal Lost |
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
| customer_id | customer.id |
| cabang_id | cabang.id |
| user_id | user.id |
| versi_penawaran_id | versi_penawaran.id |
| alasan_lost_id | alasan_lost.id |

---

# Index

| Field | Nama Index |
|--------|------------|
| customer_id | idx_lead_customer |
| cabang_id | idx_lead_cabang |
| user_id | idx_lead_user |
| status | idx_lead_status |
| fase | idx_lead_fase |

---

# Status Lead

| Nilai | Keterangan |
|-------|------------|
| 1 | OPEN |
| 2 | DEAL |
| 3 | LOST |

---

# Fase Lead

| Nilai | Keterangan |
|-------|------------|
| 1 | Lead Baru |
| 2 | Follow Up |
| 3 | Penawaran |

Fase hanya berlaku apabila Status = OPEN.

---

# Data Awal (Seed)

Tidak ada.

Lead dibuat oleh Sales ketika menerima prospek baru.

---

# Aturan

- Lead wajib memiliki Customer.
- Lead wajib memiliki User (Sales).
- Lead wajib memiliki Cabang.
- Status awal Lead adalah **OPEN**.
- Fase awal Lead adalah **Lead Baru**.
- Fase berubah otomatis berdasarkan aktivitas Sales.
- Lead dapat memiliki banyak Aktivitas Lead.
- Lead dapat memiliki banyak Versi Penawaran.
- Lead hanya dapat menjadi Deal satu kali.
- Lead hanya dapat menjadi Lost satu kali.
- Saat Deal, sistem menyimpan Versi Penawaran yang dipilih pada field **versi_penawaran_id**.
- Saat Lost, sistem menyimpan Alasan Lost pada field **alasan_lost_id**.
- Lead yang sudah berstatus DEAL tidak dapat diubah kembali menjadi OPEN.
- Lead yang sudah berstatus LOST tidak dapat diubah kembali menjadi OPEN.
- Lead yang sudah memiliki Aktivitas Lead tidak boleh dihapus.
- Lead yang sudah memiliki Versi Penawaran tidak boleh dihapus.
- Seluruh perubahan penting wajib tercatat pada Audit Log.

---

# Digunakan Oleh

- Aktivitas Lead
- Pengingat
- Versi Penawaran
- Dashboard
- Laporan

---

# Catatan

- Lead merupakan pusat seluruh proses bisnis pada aplikasi MAKSI.
- Status menunjukkan kondisi akhir Lead.
- Fase menunjukkan posisi proses penjualan.
- Deal dan Lost bukan tabel terpisah, melainkan bagian dari siklus hidup Lead.
- Nilai Deal mengikuti Versi Penawaran yang dipilih saat proses Deal.
- Riwayat seluruh Aktivitas Lead, Pengingat, dan Versi Penawaran tetap tersimpan meskipun Lead telah berstatus Deal atau Lost.