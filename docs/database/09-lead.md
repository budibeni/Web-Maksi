# Tabel Lead

Dokumen ini menjelaskan struktur tabel **Lead**.

---

# Nama Tabel

tb_lead

---

# Fungsi

Menyimpan seluruh proses penjualan mulai dari Lead dibuat hingga selesai menjadi **DEAL** atau **LOST**.

Lead merupakan transaksi utama pada aplikasi MAKSI.

Seluruh Aktivitas Lead, Pengingat, dan Versi Penawaran selalu terhubung dengan satu Lead.

---

# Struktur Tabel

| Field | Tipe Data | Panjang | Null | Default | Keterangan |
|--------|-----------|----------|------|---------|------------|
| id | BIGINT UNSIGNED | - | Tidak | AUTO_INCREMENT | Primary Key |
| nomor | VARCHAR | 30 | Tidak | - | Nomor Lead, dibuat otomatis oleh sistem (UNIQUE) |
| customer_id | BIGINT UNSIGNED | - | Tidak | - | Relasi ke Customer |
| cabang_id | BIGINT UNSIGNED | - | Tidak | - | Relasi ke Cabang |
| user_id | BIGINT UNSIGNED | - | Tidak | - | Sales yang menangani Lead |
| status_customer | VARCHAR | 20 | Tidak | BARU | Snapshot status Customer saat Lead dibuat (BARU / EXISTING) |
| status | TINYINT | 1 | Tidak | 1 | Status Lead |
| fase | TINYINT | 1 | Tidak | 1 | Fase Lead |
| versi_penawaran_final_id | BIGINT UNSIGNED | - | Ya | NULL | Versi Penawaran yang menjadi acuan Lead |
| nilai_deal | DECIMAL | 18,2 | Ya | NULL | Snapshot Grand Total saat Deal |
| tanggal_deal | DATETIME | - | Ya | NULL | Tanggal Deal |
| alasan_lost_id | BIGINT UNSIGNED | - | Ya | NULL | Relasi ke Master Alasan Lost |
| nama_alasan_lost | VARCHAR | 200 | Ya | NULL | Snapshot Nama Alasan Lost |
| nilai_lost | DECIMAL | 18,2 | Ya | NULL | Snapshot Grand Total Versi Penawaran Final saat Lost |
| catatan_awal | TEXT | - | Ya | NULL | Catatan awal Lead |
| catatan_lost | TEXT | - | Ya | NULL | Catatan tambahan saat Lost |
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
| customer_id | tb_customer.id |
| cabang_id | tb_cabang.id |
| user_id | tb_user.id |
| versi_penawaran_final_id | tb_versi_penawaran.id |
| alasan_lost_id | tb_alasan_lost.id |

---

# Index

| Field | Nama Index |
|--------|------------|
| nomor | uk_lead_nomor | UNIQUE |
| customer_id | idx_lead_customer |
| cabang_id | idx_lead_cabang |
| user_id | idx_lead_user |
| status_customer | idx_lead_status_customer |
| status | idx_lead_status |
| fase | idx_lead_fase |
| versi_penawaran_final_id | idx_lead_versi_penawaran_final |
| tanggal_deal | idx_lead_tanggal_deal |
| tanggal_lost | idx_lead_tanggal_lost |

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
| 1 | LEAD_BARU |
| 2 | FOLLOW_UP |
| 3 | PENAWARAN |

Fase hanya berlaku apabila Status = OPEN.

Perubahan Fase dilakukan otomatis berdasarkan Hasil Interaksi.

---

# Snapshot Data

Saat Lead dibuat, sistem menyimpan Snapshot berikut:

- Status Customer (BARU / EXISTING)

Saat Lead berubah menjadi **DEAL**, sistem menyimpan Snapshot berikut:

- ID Versi Penawaran Final.
- Nilai Deal.
- Tanggal Deal.

Saat Lead berubah menjadi **LOST**, sistem menyimpan Snapshot berikut:

- ID Versi Penawaran Final apabila Lead telah memiliki Penawaran.
- Nama Alasan Lost.
- Nilai Lost berdasarkan Grand Total Versi Penawaran Final apabila tersedia.
- Tanggal Lost.

Perubahan Master Data maupun Versi Penawaran tidak mengubah histori Lead yang telah tersimpan.

---

# Data Awal (Seed)

Tidak ada.

Lead dibuat oleh Sales ketika menerima prospek baru.

---

# Aturan

- Lead wajib memiliki Customer.
- Lead wajib memiliki User (Sales).
- Lead wajib memiliki Cabang.
- Sistem menentukan **Status Customer** saat Lead dibuat.
- Status Customer tidak dapat diubah setelah Lead disimpan.
- Status awal Lead adalah **OPEN**.
- Fase awal Lead adalah **LEAD_BARU**.
- Fase berubah otomatis berdasarkan Hasil Interaksi.
- Lead dapat memiliki banyak Aktivitas Lead.
- Lead dapat memiliki banyak Versi Penawaran.
- Lead hanya dapat menjadi Deal satu kali.
- Lead hanya dapat menjadi Lost satu kali.

### Saat membuat Versi Penawaran

- Apabila Lead masih berstatus **OPEN**, field **versi_penawaran_final_id** diperbarui ke Versi Penawaran terbaru.

### Saat Deal

Sistem menyimpan:

- Versi Penawaran yang disetujui Customer pada field **versi_penawaran_final_id**.
- Snapshot Nilai Deal.
- Tanggal Deal.

### Saat Lost

Sistem menyimpan:

- Versi Penawaran terakhir pada field **versi_penawaran_final_id** apabila Lead telah memiliki Penawaran.
- Alasan Lost.
- Snapshot Nama Alasan Lost.
- Snapshot Nilai Lost berdasarkan Grand Total Versi Penawaran Final apabila tersedia.
- Tanggal Lost.

### Ketentuan Lain

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
- Status Customer merupakan Snapshot kondisi Customer saat Lead dibuat.
- Deal dan Lost bukan tabel terpisah, melainkan bagian dari siklus hidup Lead.
- Field **versi_penawaran_final_id** menunjuk ke Versi Penawaran yang menjadi acuan Lead.
- Untuk Lead **OPEN**, field ini menunjuk ke Versi Penawaran terbaru apabila sudah ada.
- Untuk Lead **DEAL**, field ini menunjuk ke Versi Penawaran yang disetujui Customer.
- Untuk Lead **LOST**, field ini menunjuk ke Versi Penawaran terakhir apabila tersedia.
- Apabila Lead belum memiliki Penawaran, nilai **versi_penawaran_final_id** adalah **NULL**.
- Nilai Deal dan Nilai Lost merupakan Snapshot yang digunakan untuk mempercepat Dashboard dan Laporan.
- Dashboard, Laporan, dan analisis tren produk selalu menggunakan **versi_penawaran_final_id** sebagai acuan utama.
- Riwayat seluruh Aktivitas Lead, Pengingat, dan Versi Penawaran tetap tersimpan meskipun Lead telah berstatus DEAL atau LOST.