# Tabel Role

Dokumen ini menjelaskan struktur tabel **role**.

---

# Nama Tabel

role

---

# Fungsi

Menyimpan daftar Role yang digunakan untuk menentukan hak akses pengguna pada aplikasi MAKSI.

Role bersifat tetap dan digunakan oleh sistem Authentication.

---

# Struktur Tabel

| Field | Tipe Data | Panjang | Null | Default | Keterangan |
|--------|-----------|----------|------|---------|------------|
| id | BIGINT UNSIGNED | - | Tidak | AUTO_INCREMENT | Primary Key |
| nama | VARCHAR | 100 | Tidak | - | Nama Role |
| keterangan | VARCHAR | 255 | Ya | NULL | Keterangan Role |
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
| nama | idx_role_nama |

---

# Data Awal (Seed)

| Nama | Keterangan |
|------|------------|
| Administrator | Hak akses penuh |
| Top Management | Monitoring seluruh cabang |
| Branch Manager | Monitoring cabang |
| Sales | Pengguna operasional |

---

# Aturan

- Nama Role harus unik.
- Role tidak boleh dihapus apabila sudah digunakan oleh User.
- Role tidak memiliki field **aktif**.
- Role hanya dapat dikelola oleh Administrator.

---

# Digunakan Oleh

- User
- Authentication
- Hak Akses