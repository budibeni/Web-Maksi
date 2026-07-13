# Tabel User

Dokumen ini menjelaskan struktur tabel **user**.

---

# Nama Tabel

user

---

# Fungsi

Menyimpan data seluruh pengguna aplikasi MAKSI.

User digunakan untuk:

- Authentication
- Hak Akses
- Audit Data
- Sales
- Branch Manager
- Top Management
- Administrator

Setiap User wajib memiliki satu Role dan satu Cabang.

---

# Struktur Tabel

| Field | Tipe Data | Panjang | Null | Default | Keterangan |
|--------|-----------|----------|------|---------|------------|
| id | BIGINT UNSIGNED | - | Tidak | AUTO_INCREMENT | Primary Key |
| cabang_id | BIGINT UNSIGNED | - | Tidak | - | Relasi ke tabel Cabang |
| role_id | BIGINT UNSIGNED | - | Tidak | - | Relasi ke tabel Role |
| nama | VARCHAR | 150 | Tidak | - | Nama Lengkap |
| username | VARCHAR | 100 | Tidak | - | Username Login |
| telepon | VARCHAR | 20 | Tidak | - | Nomor HP |
| password | VARCHAR | 255 | Tidak | - | Password Hash |
| aktif | TINYINT | 1 | Tidak | 1 | Status Aktif |
| dibuat_oleh | BIGINT UNSIGNED | - | Ya | NULL | ID User yang membuat data |
| dibuat_tanggal | DATETIME | - | Tidak | CURRENT_TIMESTAMP | Tanggal dan waktu dibuat |
| diubah_oleh | BIGINT UNSIGNED | - | Ya | NULL | ID User terakhir yang mengubah data |
| diubah_tanggal | DATETIME | - | Ya | NULL | Tanggal dan waktu terakhir diubah |

---

# Primary Key

id

---

# Foreign Key

| Field | Referensi |
|--------|-----------|
| cabang_id | cabang.id |
| role_id | role.id |

---

# Index

| Field | Nama Index |
|--------|------------|
| username | idx_user_username |
| telepon | idx_user_telepon |
| nama | idx_user_nama |
| cabang_id | idx_user_cabang |
| role_id | idx_user_role |

---

# Data Awal (Seed)

Saat pertama kali aplikasi diinstal, sistem wajib memiliki minimal satu User Administrator.

Contoh:

| Nama | Username | Telepon | Role |
|------|----------|----------|------|
| Administrator | admin | 081234567890 | Administrator |

Password awal ditentukan saat proses instalasi dan wajib diganti setelah login pertama.

---

# Authentication

User dapat Login menggunakan:

- Username
- Nomor HP

Password diverifikasi menggunakan Password Hash.

Authentication menggunakan JWT.

---

# Aturan

- Username wajib unik.
- Nomor HP wajib unik.
- Password disimpan dalam bentuk Hash.
- Password tidak boleh disimpan dalam bentuk teks biasa.
- User wajib memiliki satu Role.
- User wajib memiliki satu Cabang.
- User yang tidak aktif tidak dapat Login.
- User yang sudah memiliki transaksi tidak boleh dihapus.
- Apabila User sudah tidak digunakan, ubah menjadi **Tidak Aktif**.
- Administrator dapat mengelola seluruh data User.
- User hanya dapat mengubah profil miliknya sendiri sesuai hak akses.

---

# Digunakan Oleh

Tabel User digunakan oleh:

- Authentication
- Audit Log
- Lead
- Aktivitas Lead
- Penawaran
- Pengingat

---

# Catatan

- Password tidak pernah ditampilkan kembali oleh sistem.
- Username digunakan sebagai identitas Login.
- Nomor HP dapat digunakan sebagai alternatif Login.
- Seluruh perubahan data User wajib tercatat pada Audit Log.