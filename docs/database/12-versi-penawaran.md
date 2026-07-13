# Tabel Versi Penawaran

Dokumen ini menjelaskan struktur tabel **versi_penawaran**.

---

# Nama Tabel

versi_penawaran

---

# Fungsi

Menyimpan setiap versi Penawaran yang dibuat untuk sebuah Lead.

Setiap perubahan Penawaran menghasilkan Versi Penawaran baru.

Versi Penawaran yang telah disimpan tidak dapat diubah maupun dihapus sehingga seluruh histori revisi tetap tersimpan.

Tabel ini merupakan **Header Penawaran**.

---

# Struktur Tabel

| Field | Tipe Data | Panjang | Null | Default | Keterangan |
|--------|-----------|----------|------|---------|------------|
| id | BIGINT UNSIGNED | - | Tidak | AUTO_INCREMENT | Primary Key |
| nomor | VARCHAR | 30 | Tidak | - | Nomor Penawaran, dibuat otomatis oleh sistem (UNIQUE) |
| lead_id | BIGINT UNSIGNED | - | Tidak | - | Relasi ke Lead |
| versi | INT | - | Tidak | 1 | Nomor Versi |
| customer_nama | VARCHAR | 200 | Tidak | - | Snapshot Nama Customer |
| customer_telepon | VARCHAR | 30 | Ya | NULL | Snapshot Nomor Telepon Customer |
| customer_alamat | TEXT | - | Ya | NULL | Snapshot Alamat Customer |
| sales_nama | VARCHAR | 150 | Tidak | - | Snapshot Nama Sales |
| cabang_nama | VARCHAR | 150 | Tidak | - | Snapshot Nama Cabang |
| masa_berlaku | INT | - | Tidak | 30 | Masa Berlaku Penawaran (Hari) |
| subtotal | DECIMAL | 18,2 | Tidak | 0 | Total sebelum Diskon |
| diskon_persen | DECIMAL | 5,2 | Tidak | 0 | Diskon Keseluruhan (%) |
| diskon_nominal | DECIMAL | 18,2 | Tidak | 0 | Diskon Keseluruhan (Rp) |
| ppn_persen | DECIMAL | 5,2 | Tidak | 11 | Persentase PPN |
| ppn_nominal | DECIMAL | 18,2 | Tidak | 0 | Nilai PPN |
| grand_total | DECIMAL | 18,2 | Tidak | 0 | Total Penawaran |
| dp_persen | DECIMAL | 5,2 | Tidak | 0 | DP (%) |
| dp_nominal | DECIMAL | 18,2 | Tidak | 0 | Nilai DP |
| catatan | TEXT | - | Ya | NULL | Catatan Penawaran |
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

---

# Unique Key

| Field |
|--------|
| lead_id + versi |

---

# Index

| Field | Nama Index |
|--------|------------|
| nomor | uk_versi_penawaran_nomor | UNIQUE |
| lead_id | idx_versi_penawaran_lead |
| versi | idx_versi_penawaran_versi |
| dibuat_tanggal | idx_versi_penawaran_tanggal |

---

# Snapshot Data

Saat Versi Penawaran dibuat, sistem menyalin informasi berikut:

## Snapshot Customer

- Nama Customer
- Nomor Telepon Customer
- Alamat Customer

## Snapshot Sales

- Nama Sales

## Snapshot Cabang

- Nama Cabang

Perubahan pada data Customer, Sales maupun Cabang tidak mengubah isi Versi Penawaran yang telah dibuat.

Snapshot Produk disimpan pada tabel **detail_penawaran**.

---

# Data Awal (Seed)

Tidak ada.

---

# Aturan Bisnis

- Versi Penawaran hanya dapat dibuat apabila Lead masih berstatus **OPEN**.
- Satu Lead dapat memiliki banyak Versi Penawaran.
- Nomor Versi bertambah otomatis.
- Versi pertama menggunakan nomor **1**.
- Revisi Penawaran dibuat dengan menyalin seluruh isi Versi Penawaran sebelumnya.
- Setelah disimpan, Versi Penawaran tidak dapat diubah.
- Setelah disimpan, Versi Penawaran tidak dapat dihapus.
- Deal menggunakan salah satu Versi Penawaran yang dipilih.
- Nilai Deal mengikuti Grand Total pada Versi Penawaran yang dipilih.
- Perhitungan seluruh nilai dilakukan otomatis oleh sistem.

---

# Perhitungan Nilai

Urutan perhitungan:

1. Menghitung Subtotal dari seluruh Detail Penawaran.
2. Mengurangi Diskon Keseluruhan.
3. Menghitung PPN.
4. Menghasilkan Grand Total.
5. Menghitung Nilai DP.

DP tidak mengurangi Grand Total.

DP hanya digunakan sebagai informasi pembayaran.

---

# Digunakan Oleh

- Lead
- Detail Penawaran
- Dashboard
- Laporan

---

# Catatan

- Tabel ini merupakan Header Penawaran.
- Seluruh Detail Penawaran terhubung ke satu Versi Penawaran.
- Riwayat seluruh versi tetap tersimpan.
- Tidak ada proses Edit Versi Penawaran.
- Perubahan dilakukan dengan membuat Versi Penawaran baru.
- Versi Penawaran yang dipilih saat Deal disimpan pada tabel **lead**.
- Seluruh informasi yang tercetak pada dokumen Penawaran harus berasal dari Snapshot yang tersimpan pada tabel ini.