# Dokumentasi MAKSI

Folder ini berisi seluruh dokumentasi proyek MAKSI yang menjadi acuan selama proses pengembangan.

Seluruh implementasi wajib mengikuti dokumen yang terdapat pada folder ini.

---

# Struktur Dokumentasi

```
docs/
│
├── database/
│   ├── 01-role.md
│   ├── 02-cabang.md
│   ├── ...
│   └── 15-audit-log.md
│
├── reference/
│
├── project-overview.md
├── business-rules.md
├── folder-structure.md
├── database-design.md
├── api-standard.md
├── ui-guidelines.md
├── coding-standard.md
├── development-flow.md
├── deployment.md
└── roadmap.md
```

---

# Urutan Membaca

AI dan Developer wajib membaca dokumen berikut secara berurutan:

1. project-overview.md
2. business-rules.md
3. folder-structure.md
4. database-design.md
5. Seluruh dokumen pada folder `database/`
6. api-standard.md
7. ui-guidelines.md
8. coding-standard.md
9. development-flow.md
10. deployment.md
11. roadmap.md

Setelah seluruh dokumen dipahami, lanjutkan dengan membaca seluruh referensi UI pada folder:

```
docs/reference/
```

---

# Dokumentasi Database

Folder `database/` berisi dokumentasi setiap tabel pada database MAKSI.

Setiap file menjelaskan satu tabel secara lengkap, meliputi:

- Fungsi tabel
- Struktur tabel
- Primary Key
- Foreign Key
- Index
- Snapshot Data
- Aturan Bisnis
- Catatan

Seluruh implementasi yang berkaitan dengan database wajib mengikuti dokumen pada folder `database/`.

Perubahan struktur tabel harus dilakukan dengan memperbarui dokumentasi terlebih dahulu sebelum melakukan implementasi pada kode.

AI maupun Developer tidak diperbolehkan membuat tabel, field, relasi, atau index yang tidak terdapat pada dokumentasi.

---

# Catatan

Apabila terdapat perbedaan informasi antar dokumen, maka urutan prioritas adalah:

1. Business Rules
2. Mockup UI (`docs/reference/`)
3. Dokumentasi Database (`docs/database/`)
4. Database Design
5. Development Flow
6. API Standard
7. Folder Structure
8. Coding Standard
9. Roadmap

AI tidak boleh membuat asumsi apabila aturan belum tersedia pada dokumentasi.

Apabila diperlukan perubahan pada struktur database, Business Rules harus diperbarui terlebih dahulu, kemudian Dokumentasi Database, baru setelah itu implementasi pada kode dilakukan.