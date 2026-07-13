# Tabel Audit Log

Dokumen ini menjelaskan struktur tabel **audit_log**.

---

# Nama Tabel

audit_log

---

# Fungsi

Menyimpan seluruh aktivitas penting yang dilakukan oleh User pada aplikasi MAKSI.

Audit Log digunakan untuk:

- Melacak aktivitas User.
- Mengetahui perubahan data.
- Menampilkan histori perubahan.
- Membantu proses audit dan investigasi.

Audit Log merupakan histori permanen dan tidak dapat diubah maupun dihapus.

---

# Struktur Tabel

| Field | Tipe Data | Panjang | Null | Default | Keterangan |
|--------|-----------|----------|------|---------|------------|
| id | BIGINT UNSIGNED | - | Tidak | AUTO_INCREMENT | Primary Key |
| user_id | BIGINT UNSIGNED | - | Ya | NULL | Relasi ke User |
| nama_user | VARCHAR | 150 | Tidak | - | Snapshot Nama User |
| modul | VARCHAR | 50 | Tidak | - | Nama Modul |
| aksi | VARCHAR | 30 | Tidak | - | Jenis Aktivitas |
| referensi_id | BIGINT UNSIGNED | - | Ya | NULL | ID Data yang diproses |
| deskripsi | TEXT | - | Ya | NULL | Deskripsi Aktivitas |
| data_sebelum | JSON | - | Ya | NULL | Data sebelum perubahan |
| data_sesudah | JSON | - | Ya | NULL | Data setelah perubahan |
| ip_address | VARCHAR | 45 | Ya | NULL | Alamat IP User |
| user_agent | TEXT | - | Ya | NULL | Informasi Browser / Device |
| dibuat_tanggal | DATETIME | - | Tidak | CURRENT_TIMESTAMP | Tanggal dan waktu aktivitas |

---

# Primary Key

id

---

# Foreign Key

| Field | Referensi |
|--------|-----------|
| user_id | user.id |

---

# Unique Key

Tidak ada.

---

# Index

| Field | Nama Index |
|--------|------------|
| user_id | idx_audit_log_user |
| modul | idx_audit_log_modul |
| aksi | idx_audit_log_aksi |
| referensi_id | idx_audit_log_referensi |
| dibuat_tanggal | idx_audit_log_tanggal |

---

# Snapshot Data

Saat Audit Log dibuat, sistem menyimpan Snapshot berikut:

- Nama User

Perubahan Nama User tidak mengubah histori Audit Log.

---

# Data Awal (Seed)

Tidak ada.

---

# Aturan Bisnis

- Audit Log dibuat otomatis oleh sistem.
- Audit Log tidak dapat diubah.
- Audit Log tidak dapat dihapus.
- Audit Log hanya dapat dilihat oleh Administrator.
- Data sebelum perubahan hanya disimpan apabila terjadi perubahan data.
- Data sesudah perubahan disimpan untuk aktivitas Tambah dan Ubah.
- Aktivitas Login dan Logout tidak memiliki Data Sebelum maupun Data Sesudah.
- Audit Log menjadi histori permanen.

---

# Contoh Nilai Aksi

- LOGIN
- LOGIN_GAGAL
- LOGOUT
- TAMBAH
- UBAH
- HAPUS
- DEAL
- LOST
- EXPORT_EXCEL
- IMPORT_DATA
- RESET_PASSWORD

Daftar aksi dapat bertambah sesuai kebutuhan aplikasi.

---

# Contoh Nilai Modul

- AUTH
- USER
- CABANG
- CUSTOMER
- LEAD
- AKTIVITAS_LEAD
- PENAWARAN
- PENGINGAT
- PRODUK
- HARGA_PRODUK
- ALASAN_LOST
- HASIL_INTERAKSI
- DASHBOARD
- LAPORAN

Daftar modul dapat bertambah sesuai kebutuhan aplikasi.

---

# Digunakan Oleh

- Administrator

---

# Catatan

- Audit Log digunakan sebagai histori aktivitas aplikasi.
- Informasi perubahan data disimpan dalam format JSON.
- Audit Log tidak digunakan sebagai sumber data transaksi.
- Seluruh aktivitas penting wajib tercatat pada Audit Log.
- Audit Log tidak boleh dimodifikasi oleh pengguna maupun sistem.