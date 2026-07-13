# Tabel Customer

Dokumen ini menjelaskan struktur tabel **customer**.

---

# Nama Tabel

customer

---

# Fungsi

Menyimpan data seluruh Customer.

Customer merupakan data utama pada proses penjualan.

Satu Customer dapat memiliki lebih dari satu Lead.

---

# Struktur Tabel

| Field | Tipe Data | Panjang | Null | Default | Keterangan |
|--------|-----------|----------|------|---------|------------|
| id | BIGINT UNSIGNED | - | Tidak | AUTO_INCREMENT | Primary Key |
| nama | VARCHAR | 150 | Tidak | - | Nama Customer |
| telepon | VARCHAR | 20 | Tidak | - | Nomor HP |
| alamat | TEXT | - | Ya | NULL | Alamat Customer |
| catatan | TEXT | - | Ya | NULL | Catatan |
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
| nama | idx_customer_nama |
| telepon | idx_customer_telepon |

---

# Data Awal (Seed)

Tidak ada.

Customer dibuat secara otomatis saat Lead baru disimpan apabila Customer belum ditemukan.

---

# Aturan

- Nama Customer wajib diisi.
- Nomor HP wajib diisi.
- Sistem mencari Customer berdasarkan Nama atau Nomor HP.
- Apabila Customer ditemukan, Lead menggunakan Customer tersebut.
- Apabila Customer tidak ditemukan, sistem membuat Customer baru.
- Satu Customer dapat memiliki banyak Lead.
- Customer yang sudah memiliki Lead tidak boleh dihapus.
- Perubahan data Customer tidak mengubah histori transaksi sebelumnya.

---

# Digunakan Oleh

Tabel Customer digunakan oleh:

- Lead
- Dashboard
- Laporan

---

# Catatan

- Customer Baru dan Customer Existing tidak disimpan pada database.
- Status Customer Baru atau Customer Existing ditentukan secara otomatis berdasarkan riwayat Lead.
- Customer tidak memiliki field **aktif**.
- Seluruh perubahan data Customer wajib tercatat pada Audit Log.