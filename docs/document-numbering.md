# Document Numbering

Dokumen ini menjelaskan standar penomoran seluruh dokumen transaksi pada aplikasi MAKSI.

Seluruh implementasi wajib mengikuti dokumen ini.

---

# Tujuan

Nomor dokumen digunakan sebagai identitas bisnis.

Nomor dokumen harus:

- Unik
- Mudah dibaca
- Mudah dicari
- Konsisten
- Tidak berubah setelah dibuat

Nomor dokumen berbeda dengan Primary Key (`id`).

Primary Key digunakan sebagai identitas database.

Nomor dokumen digunakan oleh pengguna.

---

# Format Nomor

Format umum:

```
[KODE_DOKUMEN]-[KODE_CABANG]-[YY][MM]-[NNNN]
```

Contoh:

```
LD-SRG-2607-0001

QT-SRG-2607-0001
```

---

# Komponen Nomor

| Bagian | Contoh | Keterangan |
|---------|--------|------------|
| Kode Dokumen | LD | Jenis dokumen |
| Kode Cabang | SRG | Diambil dari Master Cabang |
| Tahun | 26 | 2 digit tahun |
| Bulan | 07 | 2 digit bulan |
| Nomor Urut | 0001 | Nomor urut 4 digit |

---

# Kode Dokumen

| Dokumen | Kode |
|----------|------|
| Lead | LD |
| Versi Penawaran | QT |

Apabila di kemudian hari terdapat dokumen baru, wajib menggunakan kode dokumen yang berbeda.

---

# Kode Cabang

Kode Cabang diambil dari field **kode** pada tabel **tb_cabang**.

Contoh:

| Cabang | Kode |
|---------|------|
| Serang | SRG |
| Cilegon | CLG |
| Jakarta | JKT |

---

# Nomor Urut

Nomor urut terdiri dari 4 digit.

Contoh:

```
0001
0002
0003
```

Nomor urut di-reset berdasarkan kombinasi:

- Jenis Dokumen
- Cabang
- Tahun
- Bulan

Contoh:

Juli 2026

```
LD-SRG-2607-0001

LD-SRG-2607-0002
```

Agustus 2026

```
LD-SRG-2608-0001
```

---

# Aturan

- Nomor dibuat otomatis oleh sistem.
- Pengguna tidak dapat mengubah nomor dokumen.
- Nomor dokumen tidak boleh berubah setelah dibuat.
- Nomor dokumen tidak boleh digunakan kembali.
- Nomor dokumen wajib unik.

---

# Implementasi Database

Seluruh tabel transaksi yang merupakan dokumen wajib memiliki field:

| Field | Tipe |
|--------|------|
| nomor | VARCHAR(30) |

Field **nomor** wajib menggunakan **UNIQUE INDEX**.

Contoh:

| Tabel | Field |
|--------|--------|
| tb_lead | nomor |
| tb_versi_penawaran | nomor |

Tabel Detail tidak menggunakan field **nomor**.

---

# Versi Penawaran

Versi Penawaran menggunakan nomor yang sama untuk seluruh revisi.

Contoh:

Nomor:

```
QT-SRG-2607-0001
```

Versi:

```
Versi 1

Versi 2

Versi 3
```

Saat dicetak:

```
No. Penawaran : QT-SRG-2607-0001

Versi         : 3
```

Nomor dokumen tetap sama.

Yang berubah hanya nomor versi.

---

# Contoh

Lead

```
LD-SRG-2607-0001
```

Versi Penawaran

```
QT-SRG-2607-0001
Versi 1
```

Revisi

```
QT-SRG-2607-0001
Versi 2
```

Revisi

```
QT-SRG-2607-0001
Versi 3
```

---

# Catatan

Nomor dokumen merupakan identitas bisnis.

Primary Key (`id`) tetap digunakan sebagai identitas database dan relasi antar tabel.

Nomor dokumen digunakan pada:

- Tampilan aplikasi
- Pencarian
- Cetak PDF
- Export
- Audit Log
- Komunikasi dengan Customer

# Registry Kode Dokumen

| Kode | Nama Dokumen | Tabel |
|------|--------------|-------|
| LD | Lead | tb_lead |
| QT | Versi Penawaran | tb_versi_penawaran |